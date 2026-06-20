from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func, desc, asc
from typing import Optional, List, Tuple
from datetime import datetime
import re

from app.models.product import Product, Category, Inventory
from app.schemas.product import ProductCreate, ProductUpdate, CategoryCreate, CategoryUpdate, InventoryUpdate


def make_slug(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"\s+", "-", text.strip())
    return text


def unique_slug(db: Session, text: str, model, existing_id: int = None) -> str:
    base = make_slug(text)
    slug = base
    counter = 1
    while True:
        q = db.query(model).filter(model.slug == slug)
        if existing_id:
            q = q.filter(model.id != existing_id)
        if not q.first():
            return slug
        slug = f"{base}-{counter}"
        counter += 1


class ProductService:
    def __init__(self, db: Session):
        self.db = db

    # ─── Categories ───────────────────────────────────────────────────────

    def get_categories(self, active_only: bool = True) -> List[Category]:
        q = self.db.query(Category).filter(Category.is_deleted == False)
        if active_only:
            q = q.filter(Category.is_active == True)
        return q.order_by(Category.sort_order).all()

    def get_category(self, category_id: int) -> Optional[Category]:
        return self.db.query(Category).filter(Category.id == category_id, Category.is_deleted == False).first()

    def get_category_by_slug(self, slug: str) -> Optional[Category]:
        return self.db.query(Category).filter(Category.slug == slug, Category.is_deleted == False).first()

    def create_category(self, data: CategoryCreate) -> Category:
        slug = unique_slug(self.db, data.name, Category)
        category = Category(slug=slug, **data.model_dump())
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        return category

    def update_category(self, category: Category, data: CategoryUpdate) -> Category:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(category, field, value)
        self.db.commit()
        self.db.refresh(category)
        return category

    def delete_category(self, category: Category):
        category.is_deleted = True
        category.is_active = False
        self.db.commit()

    # ─── Products ─────────────────────────────────────────────────────────

    def get_products(
        self,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        category_id: Optional[int] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        brand: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        active_only: bool = True,
        featured_only: bool = False,
    ) -> Tuple[List[Product], int]:
        q = (
            self.db.query(Product)
            .options(joinedload(Product.category), joinedload(Product.inventory))
            .filter(Product.is_deleted == False)
        )

        if active_only:
            q = q.filter(Product.is_active == True)
        if featured_only:
            q = q.filter(Product.is_featured == True)
        if search:
            q = q.filter(
                or_(
                    Product.name.ilike(f"%{search}%"),
                    Product.description.ilike(f"%{search}%"),
                    Product.brand.ilike(f"%{search}%"),
                    Product.tags.contains([search]),
                )
            )
        if category_id:
            q = q.filter(Product.category_id == category_id)
        if min_price is not None:
            q = q.filter(Product.price >= min_price)
        if max_price is not None:
            q = q.filter(Product.price <= max_price)
        if brand:
            q = q.filter(Product.brand.ilike(f"%{brand}%"))

        total = q.count()

        sort_col = getattr(Product, sort_by, Product.created_at)
        if sort_order == "asc":
            q = q.order_by(asc(sort_col))
        else:
            q = q.order_by(desc(sort_col))

        products = q.offset(skip).limit(limit).all()
        return products, total

    def get_product(self, product_id: int) -> Optional[Product]:
        return (
            self.db.query(Product)
            .options(joinedload(Product.category), joinedload(Product.inventory), joinedload(Product.reviews))
            .filter(Product.id == product_id, Product.is_deleted == False)
            .first()
        )

    def get_product_by_slug(self, slug: str) -> Optional[Product]:
        return (
            self.db.query(Product)
            .options(joinedload(Product.category), joinedload(Product.inventory))
            .filter(Product.slug == slug, Product.is_deleted == False)
            .first()
        )

    def create_product(self, data: ProductCreate) -> Product:
        slug = unique_slug(self.db, data.name, Product)
        product_data = data.model_dump(exclude={"initial_stock", "low_stock_threshold"})
        product = Product(slug=slug, **product_data)
        self.db.add(product)
        self.db.flush()

        # Create inventory
        inventory = Inventory(
            product_id=product.id,
            quantity=data.initial_stock,
            low_stock_threshold=data.low_stock_threshold,
        )
        self.db.add(inventory)
        self.db.commit()
        self.db.refresh(product)
        return product

    def update_product(self, product: Product, data: ProductUpdate) -> Product:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(product, field, value)
        self.db.commit()
        self.db.refresh(product)
        return product

    def delete_product(self, product: Product):
        product.is_deleted = True
        product.is_active = False
        product.deleted_at = datetime.utcnow()
        self.db.commit()

    def update_inventory(self, product_id: int, data: InventoryUpdate) -> Optional[Inventory]:
        inventory = self.db.query(Inventory).filter(Inventory.product_id == product_id).first()
        if not inventory:
            return None
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(inventory, field, value)
        if data.quantity is not None:
            inventory.last_restocked_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(inventory)
        return inventory

    def increment_view_count(self, product: Product):
        product.view_count = (product.view_count or 0) + 1
        self.db.commit()

    def update_avg_rating(self, product_id: int):
        from app.models.review import Review
        result = (
            self.db.query(func.avg(Review.rating), func.count(Review.id))
            .filter(Review.product_id == product_id, Review.is_approved == True)
            .first()
        )
        product = self.db.query(Product).filter(Product.id == product_id).first()
        if product and result:
            product.avg_rating = float(result[0] or 0)
            product.review_count = result[1]
            self.db.commit()

    def get_low_stock_products(self) -> List[dict]:
        products = (
            self.db.query(Product, Inventory)
            .join(Inventory, Product.id == Inventory.product_id)
            .filter(
                Product.is_deleted == False,
                Product.is_active == True,
                Inventory.quantity <= Inventory.low_stock_threshold,
            )
            .all()
        )
        return [
            {
                "product_id": p.id,
                "product_name": p.name,
                "sku": p.sku,
                "current_stock": i.quantity,
                "threshold": i.low_stock_threshold,
            }
            for p, i in products
        ]
