from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from typing import Optional, List
from datetime import datetime
import uuid
import random
import string

from app.models.order import Order, OrderItem, Payment, OrderStatus, PaymentStatus, PaymentMethod
from app.models.cart import Cart, CartItem
from app.models.product import Product, Inventory
from app.models.review import Coupon, CouponType, Notification, NotificationType
from app.models.user import Address
from app.schemas.order import OrderCreate, OrderStatusUpdate


def generate_order_number() -> str:
    chars = string.ascii_uppercase + string.digits
    suffix = "".join(random.choices(chars, k=8))
    return f"ORD-{suffix}"


def generate_transaction_id() -> str:
    return f"TXN-{uuid.uuid4().hex[:16].upper()}"


class OrderService:
    def __init__(self, db: Session):
        self.db = db

    def create_order(self, user_id: int, data: OrderCreate) -> Order:
        # Get cart
        cart = (
            self.db.query(Cart)
            .options(joinedload(Cart.items).joinedload(CartItem.product).joinedload(Product.inventory))
            .filter(Cart.user_id == user_id)
            .first()
        )
        if not cart or not cart.items:
            raise ValueError("Cart is empty")

        # Validate address
        address = (
            self.db.query(Address)
            .filter(Address.id == data.address_id, Address.user_id == user_id, Address.is_deleted == False)
            .first()
        )
        if not address:
            raise ValueError("Invalid delivery address")

        # Calculate totals
        subtotal = 0
        order_items = []
        for item in cart.items:
            if not item.product.is_active:
                raise ValueError(f"Product '{item.product.name}' is no longer available")
            inv = item.product.inventory
            if not inv or inv.available_quantity < item.quantity:
                raise ValueError(f"Insufficient stock for '{item.product.name}'")

            price = float(item.product.current_price)
            item_subtotal = price * item.quantity
            subtotal += item_subtotal
            order_items.append({
                "product": item.product,
                "quantity": item.quantity,
                "unit_price": price,
                "subtotal": item_subtotal,
            })

        # Apply coupon
        discount_amount = 0
        coupon = None
        if data.coupon_code:
            coupon = self._validate_coupon(data.coupon_code, subtotal, user_id)
            if coupon:
                discount_amount = self._calculate_discount(coupon, subtotal)

        tax_amount = round((subtotal - discount_amount) * 0.18, 2)  # 18% GST
        shipping_amount = 0 if subtotal > 500 else 49
        total_amount = subtotal - discount_amount + tax_amount + shipping_amount

        # Create order
        order = Order(
            order_number=generate_order_number(),
            user_id=user_id,
            address_id=data.address_id,
            payment_method=data.payment_method,
            subtotal=subtotal,
            discount_amount=discount_amount,
            tax_amount=tax_amount,
            shipping_amount=shipping_amount,
            total_amount=total_amount,
            coupon_id=coupon.id if coupon else None,
            coupon_code=data.coupon_code if coupon else None,
            customer_notes=data.customer_notes,
        )
        self.db.add(order)
        self.db.flush()

        # Create order items and update inventory
        for item_data in order_items:
            product = item_data["product"]
            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                product_name=product.name,
                product_sku=product.sku,
                product_image=product.thumbnail,
                quantity=item_data["quantity"],
                unit_price=item_data["unit_price"],
                subtotal=item_data["subtotal"],
            )
            self.db.add(order_item)
            # Reserve inventory
            product.inventory.reserved_quantity += item_data["quantity"]
            product.purchase_count += item_data["quantity"]

        # Create payment record
        payment_status = (
            PaymentStatus.COMPLETED if data.payment_method == PaymentMethod.ONLINE
            else PaymentStatus.PENDING
        )
        payment = Payment(
            order_id=order.id,
            transaction_id=generate_transaction_id(),
            method=data.payment_method,
            status=payment_status,
            amount=total_amount,
        )
        self.db.add(payment)

        if data.payment_method == PaymentMethod.ONLINE:
            order.payment_status = PaymentStatus.COMPLETED
            order.status = OrderStatus.CONFIRMED

        # Update coupon usage
        if coupon:
            coupon.usage_count += 1

        # Clear cart
        for item in cart.items:
            self.db.delete(item)

        # Create notification
        notification = Notification(
            user_id=user_id,
            title="Order Placed Successfully",
            message=f"Your order #{order.order_number} has been placed. Total: ₹{total_amount:.2f}",
            notification_type=NotificationType.ORDER,
            action_url=f"/orders/{order.id}",
        )
        self.db.add(notification)

        self.db.commit()
        self.db.refresh(order)
        return order

    def get_order(self, order_id: int, user_id: int = None) -> Optional[Order]:
        q = (
            self.db.query(Order)
            .options(
                joinedload(Order.items).joinedload(OrderItem.product),
                joinedload(Order.payment),
                joinedload(Order.shipping_address),
            )
            .filter(Order.id == order_id)
        )
        if user_id:
            q = q.filter(Order.user_id == user_id)
        return q.first()

    def get_user_orders(self, user_id: int, skip: int = 0, limit: int = 20) -> List[Order]:
        return (
            self.db.query(Order)
            .options(joinedload(Order.items), joinedload(Order.payment))
            .filter(Order.user_id == user_id)
            .order_by(desc(Order.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_all_orders(
        self, skip: int = 0, limit: int = 20, status: Optional[OrderStatus] = None
    ) -> tuple:
        q = self.db.query(Order).options(joinedload(Order.user), joinedload(Order.items))
        if status:
            q = q.filter(Order.status == status)
        total = q.count()
        orders = q.order_by(desc(Order.created_at)).offset(skip).limit(limit).all()
        return orders, total

    def update_order_status(self, order: Order, data: OrderStatusUpdate) -> Order:
        order.status = data.status
        if data.tracking_number:
            order.tracking_number = data.tracking_number
        if data.admin_notes:
            order.admin_notes = data.admin_notes

        if data.status == OrderStatus.SHIPPED:
            order.shipped_at = datetime.utcnow()
        elif data.status == OrderStatus.DELIVERED:
            order.delivered_at = datetime.utcnow()
            order.payment_status = PaymentStatus.COMPLETED
            # Release inventory reservation
            for item in order.items:
                inv = self.db.query(Inventory).filter(Inventory.product_id == item.product_id).first()
                if inv:
                    inv.quantity -= item.quantity
                    inv.reserved_quantity = max(0, inv.reserved_quantity - item.quantity)
        elif data.status == OrderStatus.CANCELLED:
            order.cancelled_at = datetime.utcnow()
            # Release reservations
            for item in order.items:
                inv = self.db.query(Inventory).filter(Inventory.product_id == item.product_id).first()
                if inv:
                    inv.reserved_quantity = max(0, inv.reserved_quantity - item.quantity)

        # Notify user
        notification = Notification(
            user_id=order.user_id,
            title=f"Order {data.status.value.title()}",
            message=f"Your order #{order.order_number} has been {data.status.value}.",
            notification_type=NotificationType.ORDER,
            action_url=f"/orders/{order.id}",
        )
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(order)
        return order

    def cancel_order(self, order: Order, reason: str = None) -> Order:
        if order.status not in [OrderStatus.PENDING, OrderStatus.CONFIRMED]:
            raise ValueError("Cannot cancel order in current status")
        order.status = OrderStatus.CANCELLED
        order.cancelled_at = datetime.utcnow()
        if reason:
            order.customer_notes = reason
        # Release inventory
        for item in order.items:
            inv = self.db.query(Inventory).filter(Inventory.product_id == item.product_id).first()
            if inv:
                inv.reserved_quantity = max(0, inv.reserved_quantity - item.quantity)
        self.db.commit()
        self.db.refresh(order)
        return order

    def _validate_coupon(self, code: str, cart_total: float, user_id: int) -> Optional[Coupon]:
        now = datetime.utcnow()
        coupon = (
            self.db.query(Coupon)
            .filter(
                Coupon.code == code.upper(),
                Coupon.is_active == True,
                Coupon.valid_from <= now,
                Coupon.valid_until >= now,
            )
            .first()
        )
        if not coupon:
            return None
        if coupon.usage_limit and coupon.usage_count >= coupon.usage_limit:
            return None
        if float(coupon.min_purchase_amount) > cart_total:
            return None
        return coupon

    def _calculate_discount(self, coupon: Coupon, subtotal: float) -> float:
        if coupon.coupon_type == CouponType.PERCENTAGE:
            discount = subtotal * float(coupon.discount_value) / 100
            if coupon.max_discount_amount:
                discount = min(discount, float(coupon.max_discount_amount))
        elif coupon.coupon_type == CouponType.FIXED:
            discount = float(coupon.discount_value)
        else:  # FREE_SHIPPING
            discount = 49  # shipping cost
        return round(min(discount, subtotal), 2)
