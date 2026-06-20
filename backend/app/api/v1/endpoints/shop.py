from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database.session import get_db
from app.auth.dependencies import get_current_user, require_admin
from app.models.user import User
from app.models.order import OrderStatus
from app.schemas.order import (
    OrderCreate, OrderResponse, OrderStatusUpdate,
    CartItemAdd, CartItemUpdate, CartResponse, WishlistItemResponse,
    ReviewCreate, ReviewResponse,
    CouponValidate, CouponResponse, NotificationResponse,
)

# ─── Cart ────────────────────────────────────────────────────────────────────

cart_router = APIRouter(prefix="/cart", tags=["Cart"])


@cart_router.get("", response_model=CartResponse)
def get_cart(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.services.cart_service import CartService
    cart = CartService(db).get_or_create_cart(current_user.id)
    items = []
    for item in cart.items:
        items.append({
            "id": item.id,
            "product_id": item.product_id,
            "product_name": item.product.name,
            "product_thumbnail": item.product.thumbnail,
            "quantity": item.quantity,
            "price_at_addition": item.price_at_addition,
            "subtotal": item.subtotal,
        })
    return {"id": cart.id, "items": items, "total_items": cart.total_items, "subtotal": cart.subtotal}


@cart_router.post("/items")
def add_to_cart(
    data: CartItemAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.services.cart_service import CartService
    try:
        CartService(db).add_item(current_user.id, data.product_id, data.quantity)
        return {"message": "Item added to cart"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@cart_router.put("/items/{item_id}")
def update_cart_item(
    item_id: int,
    data: CartItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.services.cart_service import CartService
    try:
        CartService(db).update_item(current_user.id, item_id, data.quantity)
        return {"message": "Cart updated"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@cart_router.delete("/items/{item_id}")
def remove_cart_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.services.cart_service import CartService
    CartService(db).remove_item(current_user.id, item_id)
    return {"message": "Item removed"}


@cart_router.delete("")
def clear_cart(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.services.cart_service import CartService
    CartService(db).clear_cart(current_user.id)
    return {"message": "Cart cleared"}


# ─── Wishlist ─────────────────────────────────────────────────────────────────

wishlist_router = APIRouter(prefix="/wishlist", tags=["Wishlist"])


@wishlist_router.get("")
def get_wishlist(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.services.cart_service import CartService
    wishlist = CartService(db).get_or_create_wishlist(current_user.id)
    items = []
    for item in wishlist.items:
        p = item.product
        items.append({
            "id": item.id,
            "product_id": p.id,
            "product_name": p.name,
            "product_thumbnail": p.thumbnail,
            "product_price": float(p.price),
            "product_sale_price": float(p.sale_price) if p.sale_price else None,
            "is_in_stock": p.inventory.is_in_stock if p.inventory else False,
        })
    return {"items": items, "total": len(items)}


@wishlist_router.post("/toggle/{product_id}")
def toggle_wishlist(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.services.cart_service import CartService
    try:
        result = CartService(db).toggle_wishlist(current_user.id, product_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@wishlist_router.post("/move-to-cart/{product_id}")
def move_to_cart(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.services.cart_service import CartService
    try:
        CartService(db).move_to_cart(current_user.id, product_id)
        return {"message": "Moved to cart"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ─── Orders ──────────────────────────────────────────────────────────────────

order_router = APIRouter(prefix="/orders", tags=["Orders"])


@order_router.post("", response_model=OrderResponse, status_code=201)
def create_order(
    data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.services.order_service import OrderService
    try:
        order = OrderService(db).create_order(current_user.id, data)
        return order
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@order_router.get("")
def get_my_orders(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.services.order_service import OrderService
    skip = (page - 1) * per_page
    orders = OrderService(db).get_user_orders(current_user.id, skip, per_page)
    return {
        "orders": [
            {
                "id": o.id,
                "order_number": o.order_number,
                "status": o.status.value,
                "payment_status": o.payment_status.value,
                "payment_method": o.payment_method.value,
                "total_amount": float(o.total_amount),
                "items": [
                    {
                        "id": i.id, "product_id": i.product_id, "product_name": i.product_name,
                        "product_image": i.product_image, "quantity": i.quantity,
                        "unit_price": float(i.unit_price), "subtotal": float(i.subtotal),
                    }
                    for i in o.items
                ],
                "tracking_number": o.tracking_number,
                "created_at": o.created_at.isoformat() if o.created_at else None,
            }
            for o in orders
        ],
        "page": page,
    }


@order_router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.services.order_service import OrderService
    order = OrderService(db).get_order(order_id, current_user.id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@order_router.post("/{order_id}/cancel")
def cancel_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.services.order_service import OrderService
    order = OrderService(db).get_order(order_id, current_user.id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    try:
        order = OrderService(db).cancel_order(order)
        return {"message": "Order cancelled"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ─── Admin Order Management ────────────────────────────────────────────────

admin_order_router = APIRouter(prefix="/admin/orders", tags=["Admin - Orders"])


@admin_order_router.get("")
def admin_list_orders(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, le=100),
    status: Optional[str] = Query(None),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    from app.services.order_service import OrderService
    import math
    order_status = OrderStatus(status) if status else None
    skip = (page - 1) * per_page
    orders, total = OrderService(db).get_all_orders(skip, per_page, order_status)
    return {
        "orders": [
            {
                "id": o.id,
                "order_number": o.order_number,
                "status": o.status.value,
                "payment_status": o.payment_status.value,
                "payment_method": o.payment_method.value,
                "total_amount": float(o.total_amount),
                "items": [{"id": i.id, "product_name": i.product_name, "quantity": i.quantity} for i in o.items],
                "user": {
                    "id": o.user.id, "full_name": o.user.full_name, "email": o.user.email,
                } if o.user else None,
                "tracking_number": o.tracking_number,
                "created_at": o.created_at.isoformat() if o.created_at else None,
            }
            for o in orders
        ],
        "total": total,
        "pages": math.ceil(total / per_page),
    }


@admin_order_router.put("/{order_id}/status")
def update_order_status(
    order_id: int,
    data: OrderStatusUpdate,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    from app.services.order_service import OrderService
    order = OrderService(db).get_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return OrderService(db).update_order_status(order, data)


# ─── Reviews ─────────────────────────────────────────────────────────────────

review_router = APIRouter(prefix="/reviews", tags=["Reviews"])


@review_router.get("/product/{product_id}")
def get_product_reviews(
    product_id: int,
    page: int = Query(1, ge=1),
    per_page: int = Query(10, le=50),
    db: Session = Depends(get_db),
):
    from app.models.review import Review
    from sqlalchemy import desc
    skip = (page - 1) * per_page
    q = db.query(Review).filter(Review.product_id == product_id, Review.is_approved == True)
    total = q.count()
    reviews = q.order_by(desc(Review.created_at)).offset(skip).limit(per_page).all()
    result = []
    for r in reviews:
        result.append({
            "id": r.id, "user_id": r.user_id, "username": r.user.username,
            "rating": r.rating, "title": r.title, "body": r.body,
            "is_verified_purchase": r.is_verified_purchase,
            "helpful_count": r.helpful_count, "created_at": r.created_at,
        })
    return {"reviews": result, "total": total}


@review_router.post("", status_code=201)
def create_review(
    data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.models.review import Review
    from app.services.product_service import ProductService
    existing = db.query(Review).filter(
        Review.user_id == current_user.id, Review.product_id == data.product_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this product")
    review = Review(user_id=current_user.id, **data.model_dump())
    db.add(review)
    db.commit()
    ProductService(db).update_avg_rating(data.product_id)
    return {"message": "Review submitted", "review_id": review.id}


# ─── Coupon ───────────────────────────────────────────────────────────────────

coupon_router = APIRouter(prefix="/coupons", tags=["Coupons"])


@coupon_router.post("/validate")
def validate_coupon(
    data: CouponValidate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.services.order_service import OrderService
    svc = OrderService(db)
    coupon = svc._validate_coupon(data.code, float(data.cart_total), current_user.id)
    if not coupon:
        raise HTTPException(status_code=400, detail="Invalid or expired coupon")
    discount = svc._calculate_discount(coupon, float(data.cart_total))
    return {
        "id": coupon.id, "code": coupon.code, "description": coupon.description,
        "coupon_type": coupon.coupon_type.value, "discount_value": float(coupon.discount_value),
        "min_purchase_amount": float(coupon.min_purchase_amount), "is_valid": True,
        "discount_amount": discount,
    }


# ─── Notifications ────────────────────────────────────────────────────────────

notif_router = APIRouter(prefix="/notifications", tags=["Notifications"])


@notif_router.get("")
def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.models.review import Notification
    from sqlalchemy import desc
    notifs = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(desc(Notification.created_at))
        .limit(20)
        .all()
    )
    return {
        "notifications": [
            {"id": n.id, "title": n.title, "message": n.message,
             "type": n.notification_type.value, "is_read": n.is_read,
             "action_url": n.action_url, "created_at": n.created_at}
            for n in notifs
        ],
        "unread_count": sum(1 for n in notifs if not n.is_read),
    }


@notif_router.put("/{notif_id}/read")
def mark_read(
    notif_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.models.review import Notification
    from datetime import datetime
    n = db.query(Notification).filter(
        Notification.id == notif_id, Notification.user_id == current_user.id
    ).first()
    if n:
        n.is_read = True
        n.read_at = datetime.utcnow()
        db.commit()
    return {"message": "Marked as read"}


@notif_router.put("/read-all")
def mark_all_read(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.models.review import Notification
    from datetime import datetime
    db.query(Notification).filter(
        Notification.user_id == current_user.id, Notification.is_read == False
    ).update({"is_read": True, "read_at": datetime.utcnow()})
    db.commit()
    return {"message": "All notifications marked as read"}
