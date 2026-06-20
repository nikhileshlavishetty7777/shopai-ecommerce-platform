from sqlalchemy.orm import Session, joinedload
from typing import Optional
from app.models.cart import Cart, CartItem, Wishlist, WishlistItem
from app.models.product import Product


class CartService:
    def __init__(self, db: Session):
        self.db = db

    def get_or_create_cart(self, user_id: int) -> Cart:
        cart = (
            self.db.query(Cart)
            .options(joinedload(Cart.items).joinedload(CartItem.product).joinedload(Product.inventory))
            .filter(Cart.user_id == user_id)
            .first()
        )
        if not cart:
            cart = Cart(user_id=user_id)
            self.db.add(cart)
            self.db.commit()
            self.db.refresh(cart)
        return cart

    def add_item(self, user_id: int, product_id: int, quantity: int) -> Cart:
        cart = self.get_or_create_cart(user_id)
        product = self.db.query(Product).filter(Product.id == product_id, Product.is_active == True).first()
        if not product:
            raise ValueError("Product not found")
        if not product.inventory or product.inventory.available_quantity < quantity:
            raise ValueError("Insufficient stock")

        existing = self.db.query(CartItem).filter(
            CartItem.cart_id == cart.id,
            CartItem.product_id == product_id,
        ).first()

        if existing:
            new_qty = existing.quantity + quantity
            if product.inventory.available_quantity < new_qty:
                raise ValueError("Insufficient stock for requested quantity")
            existing.quantity = new_qty
        else:
            item = CartItem(
                cart_id=cart.id,
                product_id=product_id,
                quantity=quantity,
                price_at_addition=product.current_price,
            )
            self.db.add(item)

        self.db.commit()
        return self.get_or_create_cart(user_id)

    def update_item(self, user_id: int, item_id: int, quantity: int) -> Cart:
        cart = self.get_or_create_cart(user_id)
        item = self.db.query(CartItem).filter(
            CartItem.id == item_id, CartItem.cart_id == cart.id
        ).first()
        if not item:
            raise ValueError("Cart item not found")

        if quantity == 0:
            self.db.delete(item)
        else:
            if item.product.inventory.available_quantity < quantity:
                raise ValueError("Insufficient stock")
            item.quantity = quantity

        self.db.commit()
        return self.get_or_create_cart(user_id)

    def remove_item(self, user_id: int, item_id: int) -> Cart:
        cart = self.get_or_create_cart(user_id)
        item = self.db.query(CartItem).filter(
            CartItem.id == item_id, CartItem.cart_id == cart.id
        ).first()
        if item:
            self.db.delete(item)
            self.db.commit()
        return self.get_or_create_cart(user_id)

    def clear_cart(self, user_id: int):
        cart = self.db.query(Cart).filter(Cart.user_id == user_id).first()
        if cart:
            self.db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
            self.db.commit()

    # ─── Wishlist ─────────────────────────────────────────────────────────

    def get_or_create_wishlist(self, user_id: int) -> Wishlist:
        wishlist = (
            self.db.query(Wishlist)
            .options(joinedload(Wishlist.items).joinedload(WishlistItem.product).joinedload(Product.inventory))
            .filter(Wishlist.user_id == user_id)
            .first()
        )
        if not wishlist:
            wishlist = Wishlist(user_id=user_id)
            self.db.add(wishlist)
            self.db.commit()
            self.db.refresh(wishlist)
        return wishlist

    def toggle_wishlist(self, user_id: int, product_id: int) -> dict:
        wishlist = self.get_or_create_wishlist(user_id)
        existing = self.db.query(WishlistItem).filter(
            WishlistItem.wishlist_id == wishlist.id,
            WishlistItem.product_id == product_id,
        ).first()

        if existing:
            self.db.delete(existing)
            self.db.commit()
            return {"action": "removed", "product_id": product_id}
        else:
            product = self.db.query(Product).filter(Product.id == product_id).first()
            if not product:
                raise ValueError("Product not found")
            item = WishlistItem(wishlist_id=wishlist.id, product_id=product_id)
            self.db.add(item)
            self.db.commit()
            return {"action": "added", "product_id": product_id}

    def move_to_cart(self, user_id: int, product_id: int) -> Cart:
        wishlist = self.get_or_create_wishlist(user_id)
        item = self.db.query(WishlistItem).filter(
            WishlistItem.wishlist_id == wishlist.id,
            WishlistItem.product_id == product_id,
        ).first()
        if item:
            self.db.delete(item)
        return self.add_item(user_id, product_id, 1)
