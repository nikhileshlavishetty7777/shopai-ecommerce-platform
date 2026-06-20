"""
AI-Powered Product Recommendation Engine
Uses Content-Based Filtering + Collaborative Filtering
"""
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MinMaxScaler
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Dict
from app.models.product import Product, Category
from app.models.order import Order, OrderItem
from app.models.cart import WishlistItem, Wishlist
from app.models.review import Recommendation


class RecommendationEngine:
    def __init__(self, db: Session):
        self.db = db

    # ─── Content-Based Filtering ──────────────────────────────────────────

    def get_similar_products(self, product_id: int, limit: int = 8) -> List[Product]:
        """Find products similar to given product using content-based filtering."""
        products = (
            self.db.query(Product)
            .filter(Product.is_active == True, Product.is_deleted == False)
            .all()
        )
        if len(products) < 2:
            return []

        # Build feature matrix
        product_ids = [p.id for p in products]
        target_idx = product_ids.index(product_id) if product_id in product_ids else -1
        if target_idx == -1:
            return []

        features = self._build_content_features(products)
        similarities = cosine_similarity(features)[target_idx]

        # Get top similar (exclude self)
        sim_indices = np.argsort(similarities)[::-1]
        sim_indices = [i for i in sim_indices if i != target_idx][:limit]

        return [products[i] for i in sim_indices]

    def _build_content_features(self, products: List[Product]) -> np.ndarray:
        """Create feature vectors for products."""
        all_categories = list({p.category_id for p in products})
        all_brands = list({p.brand or "unknown" for p in products})
        scaler = MinMaxScaler()

        features = []
        for p in products:
            # Category one-hot
            cat_vec = [1 if c == p.category_id else 0 for c in all_categories]
            # Brand one-hot
            brand_vec = [1 if b == (p.brand or "unknown") else 0 for b in all_brands]
            # Numerical features
            num_features = [
                float(p.price or 0),
                float(p.avg_rating or 0),
                float(p.review_count or 0),
                float(p.view_count or 0),
            ]
            features.append(cat_vec + brand_vec + num_features)

        feature_matrix = np.array(features, dtype=float)
        if feature_matrix.shape[0] > 0:
            # Normalize numerical part
            n_cat = len(all_categories)
            n_brand = len(all_brands)
            num_part = feature_matrix[:, n_cat + n_brand:]
            if num_part.shape[1] > 0:
                try:
                    num_part = scaler.fit_transform(num_part)
                    feature_matrix[:, n_cat + n_brand:] = num_part
                except Exception:
                    pass
        return feature_matrix

    # ─── Collaborative Filtering ──────────────────────────────────────────

    def get_collaborative_recommendations(self, user_id: int, limit: int = 10) -> List[Product]:
        """Find products liked by similar users."""
        # Build user-product interaction matrix
        order_items = (
            self.db.query(OrderItem.product_id, Order.user_id, func.sum(OrderItem.quantity).label("qty"))
            .join(Order, OrderItem.order_id == Order.id)
            .group_by(Order.user_id, OrderItem.product_id)
            .all()
        )

        if not order_items:
            return self._get_trending_products(limit)

        # Build matrix
        df = pd.DataFrame(order_items, columns=["product_id", "user_id", "qty"])
        if user_id not in df["user_id"].values:
            return self._get_trending_products(limit)

        pivot = df.pivot_table(index="user_id", columns="product_id", values="qty", fill_value=0)
        user_sim = cosine_similarity(pivot)
        user_ids = list(pivot.index)

        if user_id not in user_ids:
            return self._get_trending_products(limit)

        user_idx = user_ids.index(user_id)
        sim_scores = user_sim[user_idx]
        sim_users = np.argsort(sim_scores)[::-1][1:6]  # Top 5 similar users

        # Find products bought by similar users but not by target user
        user_products = set(df[df["user_id"] == user_id]["product_id"].tolist())
        reco_product_ids = set()
        for sim_idx in sim_users:
            sim_uid = user_ids[sim_idx]
            sim_products = set(df[df["user_id"] == sim_uid]["product_id"].tolist())
            reco_product_ids.update(sim_products - user_products)
            if len(reco_product_ids) >= limit:
                break

        if not reco_product_ids:
            return self._get_trending_products(limit)

        products = (
            self.db.query(Product)
            .filter(
                Product.id.in_(list(reco_product_ids)[:limit]),
                Product.is_active == True,
                Product.is_deleted == False,
            )
            .all()
        )
        return products

    # ─── Personalized Recommendations ────────────────────────────────────

    def get_personalized_recommendations(self, user_id: int, limit: int = 12) -> List[Dict]:
        """Combined content + collaborative recommendations for a user."""
        collaborative = self.get_collaborative_recommendations(user_id, limit // 2)
        collab_ids = {p.id for p in collaborative}

        # Get user's last viewed/purchased categories
        purchased_items = (
            self.db.query(OrderItem.product_id)
            .join(Order)
            .filter(Order.user_id == user_id)
            .limit(5)
            .all()
        )

        content_based = []
        for (product_id,) in purchased_items:
            similar = self.get_similar_products(product_id, 3)
            for p in similar:
                if p.id not in collab_ids:
                    content_based.append(p)

        # Merge and deduplicate
        seen = set()
        recommendations = []
        for p in collaborative + content_based:
            if p.id not in seen:
                seen.add(p.id)
                recommendations.append(p)

        if len(recommendations) < limit:
            trending = self._get_trending_products(limit - len(recommendations))
            for p in trending:
                if p.id not in seen:
                    seen.add(p.id)
                    recommendations.append(p)

        return recommendations[:limit]

    def _get_trending_products(self, limit: int = 10) -> List[Product]:
        return (
            self.db.query(Product)
            .filter(Product.is_active == True, Product.is_deleted == False)
            .order_by(desc(Product.view_count + Product.purchase_count))
            .limit(limit)
            .all()
        )

    def save_recommendations(self, user_id: int, products: List[Product], reason: str = "personalized"):
        """Cache recommendations in DB."""
        # Clear old
        self.db.query(Recommendation).filter(Recommendation.user_id == user_id).delete()
        for i, product in enumerate(products):
            rec = Recommendation(
                user_id=user_id,
                product_id=product.id,
                score=1.0 - (i * 0.05),
                reason=reason,
            )
            self.db.add(rec)
        self.db.commit()
