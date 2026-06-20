"""
Sample data seeder - populates DB with realistic e-commerce data
"""
from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.models.user import User, UserRole
from app.models.product import Product, Category, Inventory
from app.models.review import Coupon, CouponType
from app.core.security import get_password_hash
from datetime import datetime, timedelta
import random
import re


def make_slug(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"\s+", "-", text.strip())
    return text


CATEGORIES = [
    {"name": "Electronics", "icon": "💻", "description": "Laptops, phones, gadgets"},
    {"name": "Fashion", "icon": "👗", "description": "Clothing and accessories"},
    {"name": "Home & Garden", "icon": "🏠", "description": "Furniture and home decor"},
    {"name": "Sports & Fitness", "icon": "🏋️", "description": "Sports equipment and gear"},
    {"name": "Books", "icon": "📚", "description": "Books and educational material"},
    {"name": "Beauty & Health", "icon": "💄", "description": "Skincare, makeup, wellness"},
    {"name": "Toys & Games", "icon": "🎮", "description": "Toys for all ages"},
    {"name": "Automotive", "icon": "🚗", "description": "Car accessories and tools"},
]

PRODUCTS = [
    # Electronics
    {"name": "MacBook Pro 14-inch M3", "sku": "ELEC-001", "price": 199900, "sale_price": 189900, "category": "Electronics", "brand": "Apple", "stock": 45, "rating": 4.8, "reviews": 234, "views": 8900, "purchases": 156, "featured": True, "thumbnail": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400"},
    {"name": "Sony WH-1000XM5 Headphones", "sku": "ELEC-002", "price": 29990, "sale_price": 24990, "category": "Electronics", "brand": "Sony", "stock": 78, "rating": 4.7, "reviews": 567, "views": 12000, "purchases": 445, "featured": True, "thumbnail": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"},
    {"name": "Samsung Galaxy S24 Ultra", "sku": "ELEC-003", "price": 134999, "sale_price": 119999, "category": "Electronics", "brand": "Samsung", "stock": 32, "rating": 4.6, "reviews": 389, "views": 9500, "purchases": 267, "featured": True, "thumbnail": "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400"},
    {"name": "iPad Air 5th Gen", "sku": "ELEC-004", "price": 59900, "sale_price": None, "category": "Electronics", "brand": "Apple", "stock": 55, "rating": 4.5, "reviews": 198, "views": 6700, "purchases": 123, "featured": False, "thumbnail": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400"},
    {"name": "Dell XPS 15 Laptop", "sku": "ELEC-005", "price": 169900, "sale_price": 154900, "category": "Electronics", "brand": "Dell", "stock": 28, "rating": 4.4, "reviews": 145, "views": 5600, "purchases": 89, "featured": False, "thumbnail": "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400"},
    {"name": "Apple Watch Series 9", "sku": "ELEC-006", "price": 41900, "sale_price": 37900, "category": "Electronics", "brand": "Apple", "stock": 67, "rating": 4.7, "reviews": 312, "views": 7800, "purchases": 234, "featured": True, "thumbnail": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"},
    {"name": "Bose QuietComfort 45", "sku": "ELEC-007", "price": 24990, "sale_price": 21990, "category": "Electronics", "brand": "Bose", "stock": 41, "rating": 4.5, "reviews": 223, "views": 5400, "purchases": 178, "featured": False, "thumbnail": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400"},
    {"name": "GoPro Hero 12 Black", "sku": "ELEC-008", "price": 39990, "sale_price": 34990, "category": "Electronics", "brand": "GoPro", "stock": 23, "rating": 4.6, "reviews": 167, "views": 4300, "purchases": 112, "featured": False, "thumbnail": "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400"},

    # Fashion
    {"name": "Nike Air Max 270", "sku": "FASH-001", "price": 12995, "sale_price": 9995, "category": "Fashion", "brand": "Nike", "stock": 120, "rating": 4.5, "reviews": 678, "views": 15000, "purchases": 890, "featured": True, "thumbnail": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400"},
    {"name": "Levi's 501 Original Jeans", "sku": "FASH-002", "price": 4999, "sale_price": 3999, "category": "Fashion", "brand": "Levi's", "stock": 200, "rating": 4.3, "reviews": 445, "views": 8900, "purchases": 567, "featured": False, "thumbnail": "https://images.unsplash.com/photo-1542219550-37153d387c27?w=400"},
    {"name": "Adidas Ultraboost 23", "sku": "FASH-003", "price": 14999, "sale_price": 11999, "category": "Fashion", "brand": "Adidas", "stock": 89, "rating": 4.6, "reviews": 334, "views": 11000, "purchases": 456, "featured": True, "thumbnail": "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400"},
    {"name": "Zara Floral Summer Dress", "sku": "FASH-004", "price": 3499, "sale_price": 2799, "category": "Fashion", "brand": "Zara", "stock": 150, "rating": 4.2, "reviews": 223, "views": 6700, "purchases": 345, "featured": False, "thumbnail": "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400"},

    # Home & Garden
    {"name": "Dyson V15 Detect Vacuum", "sku": "HOME-001", "price": 59900, "sale_price": 52900, "category": "Home & Garden", "brand": "Dyson", "stock": 34, "rating": 4.7, "reviews": 289, "views": 7800, "purchases": 234, "featured": True, "thumbnail": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"},
    {"name": "Instant Pot Duo 7-in-1", "sku": "HOME-002", "price": 8999, "sale_price": 6999, "category": "Home & Garden", "brand": "Instant Pot", "stock": 78, "rating": 4.6, "reviews": 567, "views": 9800, "purchases": 445, "featured": False, "thumbnail": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400"},
    {"name": "Philips Hue Smart Bulbs Set", "sku": "HOME-003", "price": 4999, "sale_price": 3999, "category": "Home & Garden", "brand": "Philips", "stock": 145, "rating": 4.4, "reviews": 334, "views": 5600, "purchases": 278, "featured": False, "thumbnail": "https://images.unsplash.com/photo-1586449480562-2e87e15c9cfc?w=400"},

    # Sports
    {"name": "Yoga Mat Premium 6mm", "sku": "SPRT-001", "price": 1999, "sale_price": 1499, "category": "Sports & Fitness", "brand": "Boldfit", "stock": 234, "rating": 4.4, "reviews": 445, "views": 8900, "purchases": 678, "featured": False, "thumbnail": "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400"},
    {"name": "Resistance Bands Set (5 levels)", "sku": "SPRT-002", "price": 999, "sale_price": 799, "category": "Sports & Fitness", "brand": "Strauss", "stock": 312, "rating": 4.3, "reviews": 567, "views": 12000, "purchases": 890, "featured": False, "thumbnail": "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400"},
    {"name": "Garmin Forerunner 955", "sku": "SPRT-003", "price": 54990, "sale_price": 47990, "category": "Sports & Fitness", "brand": "Garmin", "stock": 23, "rating": 4.8, "reviews": 156, "views": 4500, "purchases": 89, "featured": True, "thumbnail": "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400"},

    # Books
    {"name": "Atomic Habits - James Clear", "sku": "BOOK-001", "price": 799, "sale_price": 599, "category": "Books", "brand": "Penguin", "stock": 456, "rating": 4.9, "reviews": 1234, "views": 25000, "purchases": 1890, "featured": True, "thumbnail": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400"},
    {"name": "The Psychology of Money", "sku": "BOOK-002", "price": 699, "sale_price": 499, "category": "Books", "brand": "Jaico", "stock": 234, "rating": 4.8, "reviews": 890, "views": 18000, "purchases": 1234, "featured": False, "thumbnail": "https://images.unsplash.com/photo-1592496001020-d31bd830651f?w=400"},

    # Beauty
    {"name": "The Ordinary Skincare Set", "sku": "BEAU-001", "price": 2999, "sale_price": 2399, "category": "Beauty & Health", "brand": "The Ordinary", "stock": 167, "rating": 4.5, "reviews": 445, "views": 9800, "purchases": 567, "featured": False, "thumbnail": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400"},
    {"name": "Dyson Airwrap Complete", "sku": "BEAU-002", "price": 45900, "sale_price": 39900, "category": "Beauty & Health", "brand": "Dyson", "stock": 34, "rating": 4.6, "reviews": 234, "views": 7800, "purchases": 178, "featured": True, "thumbnail": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400"},
]

COUPONS = [
    {"code": "WELCOME10", "description": "10% off for new customers", "type": "percentage", "value": 10, "min": 500, "max": 200, "limit": 1000},
    {"code": "FLAT200", "description": "Flat ₹200 off on orders above ₹1000", "type": "fixed", "value": 200, "min": 1000, "max": None, "limit": 500},
    {"code": "FREESHIP", "description": "Free shipping on any order", "type": "free_shipping", "value": 49, "min": 0, "max": None, "limit": None},
    {"code": "SAVE15", "description": "Save 15% on all electronics", "type": "percentage", "value": 15, "min": 2000, "max": 500, "limit": 200},
]


def seed_database():
    db: Session = SessionLocal()
    try:
        # Skip if already seeded
        if db.query(User).filter(User.email == "admin@ecommerce.com").first():
            return

        print("🌱 Seeding database...")

        # Admin user
        admin = User(
            email="admin@ecommerce.com",
            username="admin",
            full_name="Admin User",
            hashed_password=get_password_hash("Admin@123"),
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True,
        )
        db.add(admin)

        # Customer user
        customer = User(
            email="john@example.com",
            username="johndoe",
            full_name="John Doe",
            hashed_password=get_password_hash("Customer@123"),
            role=UserRole.CUSTOMER,
            is_active=True,
            is_verified=True,
        )
        db.add(customer)
        db.flush()

        # Categories
        cat_map = {}
        for cat_data in CATEGORIES:
            slug = make_slug(cat_data["name"])
            cat = Category(
                name=cat_data["name"],
                slug=slug,
                description=cat_data["description"],
                icon=cat_data["icon"],
                is_active=True,
            )
            db.add(cat)
            db.flush()
            cat_map[cat_data["name"]] = cat

        # Products
        for p_data in PRODUCTS:
            slug = make_slug(p_data["name"]) + f"-{random.randint(100, 999)}"
            cat = cat_map.get(p_data["category"])
            if not cat:
                continue

            product = Product(
                name=p_data["name"],
                slug=slug,
                sku=p_data["sku"],
                price=p_data["price"],
                sale_price=p_data.get("sale_price"),
                category_id=cat.id,
                brand=p_data["brand"],
                thumbnail=p_data.get("thumbnail"),
                images=[p_data.get("thumbnail", "")],
                tags=[p_data["brand"].lower(), p_data["category"].lower()],
                avg_rating=p_data.get("rating", 4.0),
                review_count=p_data.get("reviews", 0),
                view_count=p_data.get("views", 0),
                purchase_count=p_data.get("purchases", 0),
                is_active=True,
                is_featured=p_data.get("featured", False),
                short_description=f"Premium {p_data['name']} by {p_data['brand']}",
                description=f"Experience the best with {p_data['name']} from {p_data['brand']}. High quality product with excellent customer reviews.",
            )
            db.add(product)
            db.flush()

            inventory = Inventory(
                product_id=product.id,
                quantity=p_data["stock"],
                low_stock_threshold=10,
            )
            db.add(inventory)

        # Coupons
        now = datetime.utcnow()
        for c in COUPONS:
            coupon = Coupon(
                code=c["code"],
                description=c["description"],
                coupon_type=CouponType(c["type"]),
                discount_value=c["value"],
                min_purchase_amount=c["min"],
                max_discount_amount=c.get("max"),
                usage_limit=c.get("limit"),
                is_active=True,
                valid_from=now - timedelta(days=1),
                valid_until=now + timedelta(days=365),
            )
            db.add(coupon)

        db.commit()
        print("✅ Database seeded successfully!")
        print(f"   Admin: admin@ecommerce.com / Admin@123")
        print(f"   Customer: john@example.com / Customer@123")

    except Exception as e:
        db.rollback()
        print(f"❌ Seeding error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
