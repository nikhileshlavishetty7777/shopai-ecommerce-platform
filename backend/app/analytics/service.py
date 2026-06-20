from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from typing import Dict, List
from datetime import datetime, timedelta
from app.models.order import Order, OrderItem, OrderStatus, Payment, PaymentStatus
from app.models.user import User
from app.models.product import Product, Category
from app.models.review import Review


class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def get_dashboard_overview(self) -> Dict:
        now = datetime.utcnow()
        month_ago = now - timedelta(days=30)
        prev_month = now - timedelta(days=60)

        # Revenue
        curr_rev = self._sum_revenue(month_ago, now)
        prev_rev = self._sum_revenue(prev_month, month_ago)
        rev_growth = self._growth(curr_rev, prev_rev)

        # Orders
        curr_orders = self._count_orders(month_ago, now)
        prev_orders = self._count_orders(prev_month, month_ago)
        orders_growth = self._growth(curr_orders, prev_orders)

        # Users
        curr_users = self.db.query(func.count(User.id)).filter(User.created_at >= month_ago).scalar() or 0
        prev_users = self.db.query(func.count(User.id)).filter(
            User.created_at >= prev_month, User.created_at < month_ago
        ).scalar() or 0
        users_growth = self._growth(curr_users, prev_users)

        # Products
        total_products = self.db.query(func.count(Product.id)).filter(Product.is_active == True).scalar() or 0

        return {
            "revenue": {"current": curr_rev, "previous": prev_rev, "growth": rev_growth},
            "orders": {"current": curr_orders, "previous": prev_orders, "growth": orders_growth},
            "users": {"current": curr_users, "previous": prev_users, "growth": users_growth},
            "total_products": total_products,
            "total_revenue_all_time": self._sum_revenue(datetime(2020, 1, 1), now),
            "total_orders_all_time": self._count_orders(datetime(2020, 1, 1), now),
            "total_users": self.db.query(func.count(User.id)).filter(User.is_deleted == False).scalar() or 0,
        }

    def get_revenue_trend(self, days: int = 30) -> List[Dict]:
        since = datetime.utcnow() - timedelta(days=days)
        results = (
            self.db.query(
                func.date(Order.created_at).label("date"),
                func.sum(Order.total_amount).label("revenue"),
                func.count(Order.id).label("orders"),
            )
            .filter(Order.created_at >= since, Order.status != OrderStatus.CANCELLED)
            .group_by(func.date(Order.created_at))
            .order_by(func.date(Order.created_at))
            .all()
        )
        return [
            {"date": str(r.date), "revenue": round(float(r.revenue or 0), 2), "orders": r.orders}
            for r in results
        ]

    def get_user_growth(self, days: int = 30) -> List[Dict]:
        since = datetime.utcnow() - timedelta(days=days)
        results = (
            self.db.query(
                func.date(User.created_at).label("date"),
                func.count(User.id).label("new_users"),
            )
            .filter(User.created_at >= since, User.is_deleted == False)
            .group_by(func.date(User.created_at))
            .order_by(func.date(User.created_at))
            .all()
        )
        return [{"date": str(r.date), "new_users": r.new_users} for r in results]

    def get_category_performance(self) -> List[Dict]:
        results = (
            self.db.query(
                Category.name,
                func.sum(OrderItem.subtotal).label("revenue"),
                func.sum(OrderItem.quantity).label("units_sold"),
                func.count(OrderItem.id).label("orders"),
            )
            .join(Product, OrderItem.product_id == Product.id)
            .join(Category, Product.category_id == Category.id)
            .join(Order, OrderItem.order_id == Order.id)
            .filter(Order.status != OrderStatus.CANCELLED)
            .group_by(Category.id, Category.name)
            .order_by(desc("revenue"))
            .all()
        )
        return [
            {"category": r.name, "revenue": round(float(r.revenue or 0), 2),
             "units_sold": r.units_sold or 0, "orders": r.orders or 0}
            for r in results
        ]

    def get_top_products(self, limit: int = 10) -> List[Dict]:
        results = (
            self.db.query(
                Product.name,
                Product.thumbnail,
                func.sum(OrderItem.quantity).label("units_sold"),
                func.sum(OrderItem.subtotal).label("revenue"),
            )
            .join(OrderItem, Product.id == OrderItem.product_id)
            .join(Order, OrderItem.order_id == Order.id)
            .filter(Order.status != OrderStatus.CANCELLED)
            .group_by(Product.id)
            .order_by(desc("revenue"))
            .limit(limit)
            .all()
        )
        return [
            {"name": r.name, "thumbnail": r.thumbnail,
             "units_sold": r.units_sold or 0, "revenue": round(float(r.revenue or 0), 2)}
            for r in results
        ]

    def get_order_status_distribution(self) -> List[Dict]:
        results = (
            self.db.query(Order.status, func.count(Order.id).label("count"))
            .group_by(Order.status)
            .all()
        )
        return [{"status": r.status.value, "count": r.count} for r in results]

    def get_rating_distribution(self) -> List[Dict]:
        results = (
            self.db.query(Review.rating, func.count(Review.id).label("count"))
            .filter(Review.is_approved == True)
            .group_by(Review.rating)
            .order_by(Review.rating)
            .all()
        )
        return [{"rating": r.rating, "count": r.count} for r in results]

    def _sum_revenue(self, since: datetime, until: datetime) -> float:
        r = (
            self.db.query(func.sum(Order.total_amount))
            .filter(
                Order.created_at >= since,
                Order.created_at <= until,
                Order.status != OrderStatus.CANCELLED,
            )
            .scalar()
        )
        return round(float(r or 0), 2)

    def _count_orders(self, since: datetime, until: datetime) -> int:
        return (
            self.db.query(func.count(Order.id))
            .filter(Order.created_at >= since, Order.created_at <= until)
            .scalar()
        ) or 0

    def _growth(self, current: float, previous: float) -> float:
        if previous == 0:
            return 100.0 if current > 0 else 0.0
        return round(((current - previous) / previous) * 100, 2)
