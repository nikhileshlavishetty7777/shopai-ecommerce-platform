"""
Trending Products Engine
Calculates trending score based on views, purchases, ratings with time decay
"""
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Dict
from datetime import datetime, timedelta
from app.models.product import Product, Inventory
from app.models.order import Order, OrderItem


class TrendingEngine:
    def __init__(self, db: Session):
        self.db = db

    def get_trending_products(self, limit: int = 10, days: int = 7) -> List[Dict]:
        """
        Compute trending score:
        trending_score = (views * 0.3 + purchases * 0.5 + rating * 0.2) with time decay
        """
        since = datetime.utcnow() - timedelta(days=days)

        # Purchase data in the period
        purchase_data = (
            self.db.query(
                OrderItem.product_id,
                func.sum(OrderItem.quantity).label("units_sold"),
                func.count(OrderItem.id).label("order_count"),
            )
            .join(Order)
            .filter(Order.created_at >= since)
            .group_by(OrderItem.product_id)
            .all()
        )

        purchase_map = {row.product_id: {"units": row.units_sold, "orders": row.order_count}
                       for row in purchase_data}

        products = (
            self.db.query(Product)
            .filter(Product.is_active == True, Product.is_deleted == False)
            .all()
        )

        scored = []
        for p in products:
            purchase_info = purchase_map.get(p.id, {"units": 0, "orders": 0})
            view_score = np.log1p(p.view_count or 0)
            purchase_score = np.log1p(purchase_info["units"])
            rating_score = (p.avg_rating or 0) * np.log1p(p.review_count or 0)

            trending_score = (
                view_score * 0.3 +
                purchase_score * 0.5 +
                rating_score * 0.2
            )

            scored.append({
                "product": p,
                "trending_score": round(trending_score, 4),
                "units_sold": purchase_info["units"],
                "view_count": p.view_count or 0,
            })

        scored.sort(key=lambda x: x["trending_score"], reverse=True)
        return scored[:limit]

    def get_most_viewed(self, limit: int = 10) -> List[Product]:
        return (
            self.db.query(Product)
            .filter(Product.is_active == True, Product.is_deleted == False)
            .order_by(desc(Product.view_count))
            .limit(limit)
            .all()
        )

    def get_best_sellers(self, limit: int = 10, days: int = 30) -> List[Dict]:
        since = datetime.utcnow() - timedelta(days=days)
        results = (
            self.db.query(
                Product,
                func.sum(OrderItem.quantity).label("total_sold"),
            )
            .join(OrderItem, Product.id == OrderItem.product_id)
            .join(Order, OrderItem.order_id == Order.id)
            .filter(Order.created_at >= since, Product.is_active == True)
            .group_by(Product.id)
            .order_by(desc("total_sold"))
            .limit(limit)
            .all()
        )
        return [{"product": p, "total_sold": int(ts or 0)} for p, ts in results]

    def get_top_rated(self, limit: int = 10, min_reviews: int = 3) -> List[Product]:
        return (
            self.db.query(Product)
            .filter(
                Product.is_active == True,
                Product.is_deleted == False,
                Product.review_count >= min_reviews,
            )
            .order_by(desc(Product.avg_rating), desc(Product.review_count))
            .limit(limit)
            .all()
        )

    def get_new_arrivals(self, limit: int = 10, days: int = 30) -> List[Product]:
        since = datetime.utcnow() - timedelta(days=days)
        return (
            self.db.query(Product)
            .filter(
                Product.is_active == True,
                Product.is_deleted == False,
                Product.created_at >= since,
            )
            .order_by(desc(Product.created_at))
            .limit(limit)
            .all()
        )
