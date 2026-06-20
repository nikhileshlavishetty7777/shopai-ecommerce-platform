from fastapi import APIRouter
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.products import router as products_router, cat_router
from app.api.v1.endpoints.users import router as users_router
from app.api.v1.endpoints.shop import (
    cart_router, wishlist_router, order_router,
    admin_order_router, review_router, coupon_router, notif_router,
)
from app.api.v1.endpoints.ai import (
    reco_router, trending_router, chatbot_router, forecast_router,
)
from app.api.v1.endpoints.admin import (
    analytics_router, admin_user_router, admin_inventory_router, admin_coupon_router,
)

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(products_router)
api_router.include_router(cat_router)
api_router.include_router(cart_router)
api_router.include_router(wishlist_router)
api_router.include_router(order_router)
api_router.include_router(admin_order_router)
api_router.include_router(review_router)
api_router.include_router(coupon_router)
api_router.include_router(notif_router)
api_router.include_router(reco_router)
api_router.include_router(trending_router)
api_router.include_router(chatbot_router)
api_router.include_router(forecast_router)
api_router.include_router(analytics_router)
api_router.include_router(admin_user_router)
api_router.include_router(admin_inventory_router)
api_router.include_router(admin_coupon_router)
