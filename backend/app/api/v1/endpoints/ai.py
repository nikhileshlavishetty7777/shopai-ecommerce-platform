from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database.session import get_db
from app.auth.dependencies import get_current_user, require_admin, get_optional_user
from app.models.user import User
from pydantic import BaseModel

# ─── Recommendations ──────────────────────────────────────────────────────────

reco_router = APIRouter(prefix="/recommendations", tags=["AI - Recommendations"])


@reco_router.get("/personalized")
def get_personalized(
    limit: int = Query(12, le=24),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.ai.recommendation.engine import RecommendationEngine
    engine = RecommendationEngine(db)
    products = engine.get_personalized_recommendations(current_user.id, limit)
    return {
        "products": [
            {
                "id": p.id, "name": p.name, "slug": p.slug,
                "price": float(p.price),
                "current_price": float(p.current_price),
                "sale_price": float(p.sale_price) if p.sale_price else None,
                "thumbnail": p.thumbnail, "avg_rating": p.avg_rating,
                "review_count": p.review_count,
                "discount_percentage": p.discount_percentage,
            }
            for p in products
        ],
        "count": len(products),
    }


@reco_router.get("/similar/{product_id}")
def get_similar(
    product_id: int,
    limit: int = Query(8, le=16),
    db: Session = Depends(get_db),
):
    from app.ai.recommendation.engine import RecommendationEngine
    engine = RecommendationEngine(db)
    products = engine.get_similar_products(product_id, limit)
    return {
        "products": [
            {
                "id": p.id, "name": p.name, "slug": p.slug,
                "price": float(p.price),
                "current_price": float(p.current_price),
                "sale_price": float(p.sale_price) if p.sale_price else None,
                "thumbnail": p.thumbnail, "avg_rating": p.avg_rating,
                "review_count": p.review_count,
            }
            for p in products
        ]
    }


# ─── Trending ────────────────────────────────────────────────────────────────

trending_router = APIRouter(prefix="/trending", tags=["AI - Trending"])


@trending_router.get("")
def get_trending(
    limit: int = Query(10, le=20),
    days: int = Query(7, le=30),
    db: Session = Depends(get_db),
):
    from app.ai.trending.engine import TrendingEngine
    engine = TrendingEngine(db)
    results = engine.get_trending_products(limit, days)
    return {
        "products": [
            {
                "id": r["product"].id,
                "name": r["product"].name,
                "slug": r["product"].slug,
                "thumbnail": r["product"].thumbnail,
                "price": float(r["product"].price),
                "current_price": float(r["product"].current_price),
                "avg_rating": r["product"].avg_rating,
                "trending_score": r["trending_score"],
                "units_sold": r["units_sold"],
                "view_count": r["view_count"],
            }
            for r in results
        ]
    }


@trending_router.get("/best-sellers")
def get_best_sellers(limit: int = Query(10, le=20), db: Session = Depends(get_db)):
    from app.ai.trending.engine import TrendingEngine
    results = TrendingEngine(db).get_best_sellers(limit)
    return {
        "products": [
            {
                "id": r["product"].id,
                "name": r["product"].name,
                "slug": r["product"].slug,
                "thumbnail": r["product"].thumbnail,
                "price": float(r["product"].price),
                "current_price": float(r["product"].current_price),
                "avg_rating": r["product"].avg_rating,
                "total_sold": r["total_sold"],
            }
            for r in results
        ]
    }


@trending_router.get("/top-rated")
def get_top_rated(limit: int = Query(10, le=20), db: Session = Depends(get_db)):
    from app.ai.trending.engine import TrendingEngine
    products = TrendingEngine(db).get_top_rated(limit)
    return {
        "products": [
            {
                "id": p.id, "name": p.name, "slug": p.slug,
                "thumbnail": p.thumbnail,
                "price": float(p.price),
                "current_price": float(p.current_price),
                "avg_rating": p.avg_rating,
                "review_count": p.review_count,
            }
            for p in products
        ]
    }


@trending_router.get("/new-arrivals")
def get_new_arrivals(limit: int = Query(10, le=20), db: Session = Depends(get_db)):
    from app.ai.trending.engine import TrendingEngine
    products = TrendingEngine(db).get_new_arrivals(limit)
    return {
        "products": [
            {
                "id": p.id, "name": p.name, "slug": p.slug,
                "thumbnail": p.thumbnail,
                "price": float(p.price),
                "current_price": float(p.current_price),
                "avg_rating": p.avg_rating,
                "created_at": p.created_at.isoformat(),
            }
            for p in products
        ]
    }


# ─── Chatbot ─────────────────────────────────────────────────────────────────

chatbot_router = APIRouter(prefix="/chatbot", tags=["AI - Chatbot"])


class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None


@chatbot_router.post("/message")
def chat(
    data: ChatMessage,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    from app.ai.chatbot.engine import ChatbotEngine
    if not data.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    engine = ChatbotEngine(db)
    response = engine.process_message(data.message, current_user)
    return response


# ─── Forecasting ──────────────────────────────────────────────────────────────

forecast_router = APIRouter(prefix="/forecast", tags=["AI - Forecasting"])


@forecast_router.get("/revenue")
def forecast_revenue(
    days: int = Query(30, ge=7, le=90),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    from app.ai.forecasting.engine import ForecastingEngine
    return ForecastingEngine(db).forecast_revenue(days)


@forecast_router.get("/product/{product_id}/demand")
def forecast_demand(
    product_id: int,
    days: int = Query(30, ge=7, le=90),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    from app.ai.forecasting.engine import ForecastingEngine
    return ForecastingEngine(db).forecast_product_demand(product_id, days)


@forecast_router.get("/summary")
def revenue_summary(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    from app.ai.forecasting.engine import ForecastingEngine
    return ForecastingEngine(db).get_revenue_summary()
