from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from app.models.order import OrderStatus, PaymentStatus, PaymentMethod


# ─── Cart Schemas ────────────────────────────────────────────────────────────

class CartItemAdd(BaseModel):
    product_id: int
    quantity: int = Field(..., ge=1, le=100)


class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=0, le=100)


class CartItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_thumbnail: Optional[str] = None
    quantity: int
    price_at_addition: Decimal
    subtotal: float

    class Config:
        from_attributes = True


class CartResponse(BaseModel):
    id: int
    items: List[CartItemResponse]
    total_items: int
    subtotal: float

    class Config:
        from_attributes = True


class WishlistItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_thumbnail: Optional[str] = None
    product_price: Decimal
    product_sale_price: Optional[Decimal] = None
    is_in_stock: bool

    class Config:
        from_attributes = True


# ─── Order Schemas ────────────────────────────────────────────────────────────

class OrderCreate(BaseModel):
    address_id: int
    payment_method: PaymentMethod = PaymentMethod.COD
    coupon_code: Optional[str] = None
    customer_notes: Optional[str] = None


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_sku: str
    product_image: Optional[str] = None
    quantity: int
    unit_price: Decimal
    subtotal: Decimal

    class Config:
        from_attributes = True


class PaymentResponse(BaseModel):
    id: int
    transaction_id: str
    method: PaymentMethod
    status: PaymentStatus
    amount: Decimal
    currency: str
    created_at: datetime

    class Config:
        from_attributes = True


class AddressInOrder(BaseModel):
    id: int
    full_name: str
    phone: str
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    postal_code: str
    country: str

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: int
    order_number: str
    status: OrderStatus
    payment_status: PaymentStatus
    payment_method: PaymentMethod
    subtotal: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    shipping_amount: Decimal
    total_amount: Decimal
    coupon_code: Optional[str] = None
    customer_notes: Optional[str] = None
    tracking_number: Optional[str] = None
    items: List[OrderItemResponse]
    payment: Optional[PaymentResponse] = None
    shipping_address: Optional[AddressInOrder] = None
    created_at: datetime
    shipped_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    tracking_number: Optional[str] = None
    admin_notes: Optional[str] = None


# ─── Review Schemas ───────────────────────────────────────────────────────────

class ReviewCreate(BaseModel):
    product_id: int
    rating: int = Field(..., ge=1, le=5)
    title: Optional[str] = None
    body: Optional[str] = None
    order_item_id: Optional[int] = None


class ReviewResponse(BaseModel):
    id: int
    user_id: int
    username: str
    product_id: int
    rating: int
    title: Optional[str] = None
    body: Optional[str] = None
    is_verified_purchase: bool
    helpful_count: int
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Coupon Schemas ───────────────────────────────────────────────────────────

class CouponValidate(BaseModel):
    code: str
    cart_total: Decimal


class CouponResponse(BaseModel):
    id: int
    code: str
    description: Optional[str] = None
    coupon_type: str
    discount_value: Decimal
    min_purchase_amount: Decimal
    is_valid: bool
    discount_amount: float

    class Config:
        from_attributes = True


# ─── Notification Schemas ─────────────────────────────────────────────────────

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    notification_type: str
    is_read: bool
    action_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
