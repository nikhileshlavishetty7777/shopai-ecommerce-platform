"""
AI Shopping Assistant Chatbot
Rule-based NLP with product search and order tracking
"""
import re
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from typing import Dict, List, Optional
from app.models.product import Product, Category
from app.models.order import Order, OrderStatus
from app.models.user import User


class ChatbotEngine:
    def __init__(self, db: Session):
        self.db = db

        self.intents = {
            "search_product": [
                r"find\s+(.+)", r"search\s+(.+)", r"looking for\s+(.+)",
                r"do you have\s+(.+)", r"show me\s+(.+)", r"i want\s+(.+)",
                r"buy\s+(.+)", r"product\s+(.+)",
            ],
            "track_order": [
                r"track\s+(?:order\s+)?([A-Z0-9-]+)",
                r"order\s+status\s+([A-Z0-9-]+)",
                r"where is my order\s+([A-Z0-9-]+)",
                r"(?:order|ord)\s*[#:]\s*([A-Z0-9-]+)",
            ],
            "order_history": [
                r"my orders", r"order history", r"past orders", r"previous orders",
                r"what did i buy", r"my purchases",
            ],
            "categories": [
                r"categories", r"what categories", r"types of products",
                r"product types", r"browse", r"departments",
            ],
            "deals": [
                r"deals", r"offers", r"discount", r"sale", r"promo",
                r"coupon", r"best price", r"cheap",
            ],
            "trending": [
                r"trending", r"popular", r"best seller", r"top products",
                r"most popular", r"what's hot", r"recommended",
            ],
            "shipping": [
                r"shipping", r"delivery", r"deliver", r"how long",
                r"when will", r"dispatch",
            ],
            "return": [
                r"return", r"refund", r"cancel order", r"exchange",
                r"not satisfied", r"wrong item",
            ],
            "payment": [
                r"payment", r"pay", r"cod", r"online payment",
                r"credit card", r"debit card", r"upi",
            ],
            "greeting": [
                r"^hi$", r"^hello$", r"^hey$", r"^good\s+(morning|evening|afternoon)",
                r"^namaste", r"^howdy",
            ],
            "help": [
                r"help", r"what can you do", r"assist", r"support",
                r"what are your features",
            ],
            "cart": [
                r"my cart", r"cart", r"add to cart", r"items in cart",
            ],
        }

    def process_message(self, message: str, user: Optional[User] = None) -> Dict:
        message_lower = message.lower().strip()
        intent, extracted = self._classify_intent(message_lower)
        return self._handle_intent(intent, extracted, user, message)

    def _classify_intent(self, message: str):
        for intent, patterns in self.intents.items():
            for pattern in patterns:
                match = re.search(pattern, message)
                if match:
                    extracted = match.group(1) if match.lastindex and match.lastindex >= 1 else None
                    return intent, extracted
        return "unknown", None

    def _handle_intent(self, intent: str, extracted: Optional[str], user: Optional[User], original: str) -> Dict:
        handlers = {
            "greeting": self._handle_greeting,
            "help": self._handle_help,
            "search_product": self._handle_search,
            "track_order": self._handle_track_order,
            "order_history": self._handle_order_history,
            "categories": self._handle_categories,
            "deals": self._handle_deals,
            "trending": self._handle_trending,
            "shipping": self._handle_shipping,
            "return": self._handle_returns,
            "payment": self._handle_payment,
            "cart": self._handle_cart,
        }

        handler = handlers.get(intent)
        if handler:
            return handler(extracted, user)
        return self._handle_unknown(original)

    def _handle_greeting(self, extracted, user):
        name = user.full_name.split()[0] if user else "there"
        return {
            "type": "text",
            "message": f"Hello {name}! 👋 Welcome to our AI Shopping Assistant! I can help you with:\n• Finding products\n• Tracking orders\n• Discovering deals\n• Answering shopping questions\n\nWhat can I help you with today?",
            "suggestions": ["Search products", "Track my order", "Show trending", "View categories"],
        }

    def _handle_help(self, extracted, user):
        return {
            "type": "text",
            "message": "🤖 **I can help you with:**\n\n🔍 **Product Search** - Say 'find laptop' or 'show me shoes'\n📦 **Order Tracking** - Say 'track order ORD-XXXXXXXX'\n📋 **Order History** - Say 'my orders'\n🏷️ **Deals** - Say 'show deals' or 'discounts'\n🔥 **Trending** - Say 'trending products'\n📂 **Categories** - Say 'show categories'\n🚚 **Shipping Info** - Say 'shipping policy'\n↩️ **Returns** - Say 'return policy'",
            "suggestions": ["Find products", "Track order", "Show deals", "Trending products"],
        }

    def _handle_search(self, query: str, user):
        if not query:
            return {"type": "text", "message": "What product are you looking for?", "suggestions": []}

        products = (
            self.db.query(Product)
            .filter(
                Product.is_active == True,
                Product.is_deleted == False,
                or_(
                    Product.name.ilike(f"%{query}%"),
                    Product.description.ilike(f"%{query}%"),
                    Product.brand.ilike(f"%{query}%"),
                    Product.tags.contains([query]),
                ),
            )
            .limit(5)
            .all()
        )

        if not products:
            return {
                "type": "text",
                "message": f"😔 No products found for '{query}'. Try different keywords!",
                "suggestions": ["Show all products", "View categories", "Show trending"],
            }

        return {
            "type": "products",
            "message": f"Found {len(products)} product(s) for '{query}':",
            "products": [
                {
                    "id": p.id,
                    "name": p.name,
                    "price": float(p.current_price),
                    "thumbnail": p.thumbnail,
                    "rating": p.avg_rating,
                    "slug": p.slug,
                }
                for p in products
            ],
            "suggestions": [f"More results for {query}", "Filter by price", "Sort by rating"],
        }

    def _handle_track_order(self, order_number: str, user):
        if not order_number:
            return {"type": "text", "message": "Please provide your order number. Example: track order ORD-XXXXXXXX"}

        q = self.db.query(Order).filter(Order.order_number.ilike(f"%{order_number.upper()}%"))
        if user:
            q = q.filter(Order.user_id == user.id)
        order = q.first()

        if not order:
            return {
                "type": "text",
                "message": f"❌ Order '{order_number}' not found. Please check the order number.",
                "suggestions": ["View my orders", "Contact support"],
            }

        status_emojis = {
            "pending": "⏳", "confirmed": "✅", "processing": "🔄",
            "shipped": "🚚", "delivered": "📦", "cancelled": "❌",
        }
        emoji = status_emojis.get(order.status.value, "📋")

        return {
            "type": "order",
            "message": f"{emoji} **Order #{order.order_number}**\n\nStatus: **{order.status.value.upper()}**\nTotal: ₹{order.total_amount}\nItems: {len(order.items)}\nPlaced: {order.created_at.strftime('%d %b %Y')}",
            "order": {
                "id": order.id,
                "number": order.order_number,
                "status": order.status.value,
                "total": float(order.total_amount),
                "tracking": order.tracking_number,
            },
            "suggestions": ["View order details", "Track shipment", "Need help?"],
        }

    def _handle_order_history(self, extracted, user):
        if not user:
            return {"type": "text", "message": "Please log in to view your order history. 🔐"}

        orders = (
            self.db.query(Order)
            .filter(Order.user_id == user.id)
            .order_by(desc(Order.created_at))
            .limit(5)
            .all()
        )

        if not orders:
            return {"type": "text", "message": "You haven't placed any orders yet. Start shopping! 🛍️",
                    "suggestions": ["Browse products", "View deals"]}

        order_list = "\n".join([f"• #{o.order_number} - ₹{o.total_amount} ({o.status.value})" for o in orders])
        return {
            "type": "text",
            "message": f"📋 **Your Recent Orders:**\n\n{order_list}\n\nSay 'track order ORD-XXXXXX' for details.",
            "suggestions": ["View all orders", "Track specific order"],
        }

    def _handle_categories(self, extracted, user):
        categories = self.db.query(Category).filter(Category.is_active == True, Category.is_deleted == False).limit(8).all()
        cat_list = "\n".join([f"• {c.name}" for c in categories])
        return {
            "type": "categories",
            "message": f"📂 **Available Categories:**\n\n{cat_list}",
            "categories": [{"id": c.id, "name": c.name, "slug": c.slug} for c in categories],
            "suggestions": [c.name for c in categories[:4]],
        }

    def _handle_deals(self, extracted, user):
        deals = (
            self.db.query(Product)
            .filter(Product.is_active == True, Product.sale_price.isnot(None), Product.is_deleted == False)
            .order_by(desc(Product.price - Product.sale_price))
            .limit(5)
            .all()
        )
        if not deals:
            return {"type": "text", "message": "No active deals right now. Check back soon! 🏷️"}

        return {
            "type": "products",
            "message": f"🏷️ **Hot Deals & Discounts:**",
            "products": [
                {"id": p.id, "name": p.name, "price": float(p.current_price),
                 "original_price": float(p.price), "discount": p.discount_percentage,
                 "thumbnail": p.thumbnail, "slug": p.slug}
                for p in deals
            ],
            "suggestions": ["View all deals", "Sort by discount", "Filter by category"],
        }

    def _handle_trending(self, extracted, user):
        trending = (
            self.db.query(Product)
            .filter(Product.is_active == True, Product.is_deleted == False)
            .order_by(desc(Product.view_count + Product.purchase_count))
            .limit(5)
            .all()
        )
        return {
            "type": "products",
            "message": "🔥 **Trending Products:**",
            "products": [
                {"id": p.id, "name": p.name, "price": float(p.current_price),
                 "thumbnail": p.thumbnail, "rating": p.avg_rating, "slug": p.slug}
                for p in trending
            ],
            "suggestions": ["Best sellers", "New arrivals", "Top rated"],
        }

    def _handle_shipping(self, extracted, user):
        return {
            "type": "text",
            "message": "🚚 **Shipping Information:**\n\n• **Free Shipping** on orders above ₹500\n• **Standard Shipping**: ₹49 (3-5 business days)\n• **Express Shipping**: ₹99 (1-2 business days)\n• **Same Day Delivery**: Available in select cities\n\nTracking info is sent via email/SMS once shipped.",
            "suggestions": ["Track my order", "Return policy", "Contact support"],
        }

    def _handle_returns(self, extracted, user):
        return {
            "type": "text",
            "message": "↩️ **Return & Refund Policy:**\n\n• **Return Window**: 7 days from delivery\n• **Refund**: 5-7 business days after return\n• **Condition**: Items must be unused and in original packaging\n• **Process**: Go to My Orders → Select Order → Request Return\n\nFor assistance, contact our support team.",
            "suggestions": ["View my orders", "Start a return", "Contact support"],
        }

    def _handle_payment(self, extracted, user):
        return {
            "type": "text",
            "message": "💳 **Payment Methods:**\n\n• **Cash on Delivery (COD)** - Pay when delivered\n• **UPI** - GPay, PhonePe, Paytm\n• **Credit/Debit Card** - Visa, Mastercard, RuPay\n• **Net Banking** - All major banks\n• **EMI** - Available on orders above ₹3,000\n\nAll payments are secured with 256-bit SSL encryption.",
            "suggestions": ["View cart", "Apply coupon", "Track order"],
        }

    def _handle_cart(self, extracted, user):
        if not user:
            return {"type": "text", "message": "Please log in to view your cart. 🔐"}
        return {
            "type": "text",
            "message": "🛒 **Your Cart**\n\nI can see your cart is ready. Click the cart icon to review and checkout.",
            "suggestions": ["View cart", "Continue shopping", "Apply coupon"],
        }

    def _handle_unknown(self, message: str):
        return {
            "type": "text",
            "message": f"🤔 I'm not sure how to help with that. Here's what I can do:",
            "suggestions": ["Search products", "Track order", "Show categories", "View deals"],
        }
