from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database.session import get_db
from app.auth.dependencies import get_current_user, require_admin
from app.models.user import User
from app.analytics.service import AnalyticsService

analytics_router = APIRouter(prefix="/analytics", tags=["Analytics"])


@analytics_router.get("/overview")
def get_overview(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    return AnalyticsService(db).get_dashboard_overview()


@analytics_router.get("/revenue-trend")
def get_revenue_trend(
    days: int = Query(30, ge=7, le=365),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return AnalyticsService(db).get_revenue_trend(days)


@analytics_router.get("/user-growth")
def get_user_growth(
    days: int = Query(30, ge=7, le=365),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return AnalyticsService(db).get_user_growth(days)


@analytics_router.get("/category-performance")
def get_category_performance(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    return AnalyticsService(db).get_category_performance()


@analytics_router.get("/top-products")
def get_top_products(
    limit: int = Query(10, le=50),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return AnalyticsService(db).get_top_products(limit)


@analytics_router.get("/order-distribution")
def get_order_distribution(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    return AnalyticsService(db).get_order_status_distribution()


@analytics_router.get("/rating-distribution")
def get_rating_distribution(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    return AnalyticsService(db).get_rating_distribution()


# ─── Admin - Users ───────────────────────────────────────────────────────────

admin_user_router = APIRouter(prefix="/admin/users", tags=["Admin - Users"])


@admin_user_router.get("")
def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, le=100),
    search: Optional[str] = Query(None),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    import math
    from app.services.user_service import UserService
    svc = UserService(db)
    skip = (page - 1) * per_page
    users = svc.list_users(skip, per_page, search)
    total = svc.count_users(search)
    return {
        "users": [
            {
                "id": u.id, "email": u.email, "username": u.username,
                "full_name": u.full_name, "role": u.role.value,
                "is_active": u.is_active, "is_verified": u.is_verified,
                "created_at": u.created_at, "last_login": u.last_login,
            }
            for u in users
        ],
        "total": total,
        "pages": math.ceil(total / per_page),
    }


@admin_user_router.put("/{user_id}/toggle-active")
def toggle_user_active(
    user_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    from app.services.user_service import UserService
    svc = UserService(db)
    user = svc.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_active:
        svc.deactivate(user)
    else:
        svc.activate(user)
    return {"message": f"User {'deactivated' if not user.is_active else 'activated'}", "is_active": user.is_active}


@admin_user_router.delete("/{user_id}")
def delete_user(
    user_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    from app.services.user_service import UserService
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    svc = UserService(db)
    user = svc.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    svc.soft_delete(user)
    return {"message": "User deleted"}


# ─── Admin - Inventory ────────────────────────────────────────────────────────

admin_inventory_router = APIRouter(prefix="/admin/inventory", tags=["Admin - Inventory"])


@admin_inventory_router.get("/low-stock")
def low_stock_alert(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    from app.services.product_service import ProductService
    return {"products": ProductService(db).get_low_stock_products()}


@admin_inventory_router.get("")
def all_inventory(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, le=100),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    import math
    from app.models.product import Product, Inventory
    skip = (page - 1) * per_page
    q = (
        db.query(Product, Inventory)
        .join(Inventory, Product.id == Inventory.product_id)
        .filter(Product.is_deleted == False)
    )
    total = q.count()
    items = q.offset(skip).limit(per_page).all()
    return {
        "inventory": [
            {
                "product_id": p.id,
                "product_name": p.name,
                "sku": p.sku,
                "quantity": i.quantity,
                "reserved": i.reserved_quantity,
                "available": i.available_quantity,
                "threshold": i.low_stock_threshold,
                "is_low_stock": i.is_low_stock,
                "is_in_stock": i.is_in_stock,
            }
            for p, i in items
        ],
        "total": total,
        "pages": math.ceil(total / per_page),
    }


# ─── Admin - Coupons ──────────────────────────────────────────────────────────

admin_coupon_router = APIRouter(prefix="/admin/coupons", tags=["Admin - Coupons"])


@admin_coupon_router.get("")
def list_coupons(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    from app.models.review import Coupon
    coupons = db.query(Coupon).all()
    return {
        "coupons": [
            {
                "id": c.id, "code": c.code, "description": c.description,
                "type": c.coupon_type.value, "discount_value": float(c.discount_value),
                "usage_count": c.usage_count, "usage_limit": c.usage_limit,
                "is_active": c.is_active,
                "valid_from": c.valid_from, "valid_until": c.valid_until,
            }
            for c in coupons
        ]
    }


from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal
from typing import Optional


class CouponCreate(BaseModel):
    code: str
    description: Optional[str] = None
    coupon_type: str
    discount_value: Decimal
    min_purchase_amount: Decimal = Decimal("0")
    max_discount_amount: Optional[Decimal] = None
    usage_limit: Optional[int] = None
    per_user_limit: int = 1
    valid_from: datetime
    valid_until: datetime


@admin_coupon_router.post("", status_code=201)
def create_coupon(data: CouponCreate, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    from app.models.review import Coupon, CouponType
    existing = db.query(Coupon).filter(Coupon.code == data.code.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    coupon = Coupon(
        code=data.code.upper(),
        description=data.description,
        coupon_type=CouponType(data.coupon_type),
        discount_value=data.discount_value,
        min_purchase_amount=data.min_purchase_amount,
        max_discount_amount=data.max_discount_amount,
        usage_limit=data.usage_limit,
        per_user_limit=data.per_user_limit,
        valid_from=data.valid_from,
        valid_until=data.valid_until,
    )
    db.add(coupon)
    db.commit()
    return {"message": "Coupon created", "code": coupon.code}


@admin_coupon_router.delete("/{coupon_id}")
def delete_coupon(coupon_id: int, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    from app.models.review import Coupon
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    coupon.is_active = False
    db.commit()
    return {"message": "Coupon deactivated"}
