from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database.session import get_db
from app.services.product_service import ProductService
from app.schemas.product import (
    ProductCreate, ProductUpdate, ProductResponse, ProductListResponse,
    PaginatedProducts, CategoryCreate, CategoryUpdate, CategoryResponse, InventoryUpdate,
)
from app.auth.dependencies import get_current_user, require_admin, get_optional_user
from app.models.user import User
import math

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=PaginatedProducts)
def list_products(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    brand: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    featured: bool = Query(False),
    db: Session = Depends(get_db),
):
    svc = ProductService(db)
    skip = (page - 1) * per_page
    products, total = svc.get_products(
        skip=skip, limit=per_page, search=search, category_id=category_id,
        min_price=min_price, max_price=max_price, brand=brand,
        sort_by=sort_by, sort_order=sort_order, featured_only=featured,
    )
    return PaginatedProducts(
        items=products, total=total, page=page, per_page=per_page,
        pages=math.ceil(total / per_page) if total > 0 else 0,
    )


@router.get("/featured", response_model=List[ProductListResponse])
def featured_products(limit: int = Query(8, le=20), db: Session = Depends(get_db)):
    svc = ProductService(db)
    products, _ = svc.get_products(limit=limit, featured_only=True)
    return products


@router.get("/search", response_model=List[ProductListResponse])
def search_products(q: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    svc = ProductService(db)
    products, _ = svc.get_products(search=q, limit=20)
    return products


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    svc = ProductService(db)
    product = svc.get_product(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    svc.increment_view_count(product)
    return product


@router.get("/slug/{slug}", response_model=ProductResponse)
def get_product_by_slug(slug: str, db: Session = Depends(get_db)):
    svc = ProductService(db)
    product = svc.get_product_by_slug(slug)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    svc.increment_view_count(product)
    return product


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    svc = ProductService(db)
    # Check SKU uniqueness
    from app.models.product import Product
    if db.query(Product).filter(Product.sku == data.sku).first():
        raise HTTPException(status_code=400, detail="SKU already exists")
    return svc.create_product(data)


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    svc = ProductService(db)
    product = svc.get_product(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return svc.update_product(product, data)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    svc = ProductService(db)
    product = svc.get_product(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    svc.delete_product(product)


@router.put("/{product_id}/inventory")
def update_inventory(
    product_id: int,
    data: InventoryUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    svc = ProductService(db)
    inventory = svc.update_inventory(product_id, data)
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory not found")
    return inventory


# ─── Categories ───────────────────────────────────────────────────────────────

cat_router = APIRouter(prefix="/categories", tags=["Categories"])


@cat_router.get("", response_model=List[CategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    return ProductService(db).get_categories()


@cat_router.post("", response_model=CategoryResponse, status_code=201)
def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    svc = ProductService(db)
    from app.models.product import Category
    if db.query(Category).filter(Category.name == data.name).first():
        raise HTTPException(status_code=400, detail="Category name already exists")
    return svc.create_category(data)


@cat_router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    data: CategoryUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    svc = ProductService(db)
    cat = svc.get_category(category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return svc.update_category(cat, data)


@cat_router.delete("/{category_id}", status_code=204)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    svc = ProductService(db)
    cat = svc.get_category(category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    svc.delete_category(cat)
