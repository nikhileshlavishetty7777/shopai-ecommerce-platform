from pydantic import BaseModel, validator, Field
from typing import Optional, List, Any, Dict
from datetime import datetime
from decimal import Decimal


class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    image_url: Optional[str] = None
    icon: Optional[str] = None
    parent_id: Optional[int] = None
    sort_order: int = 0


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    icon: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class CategoryResponse(CategoryBase):
    id: int
    slug: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class InventoryResponse(BaseModel):
    quantity: int
    reserved_quantity: int
    available_quantity: int
    low_stock_threshold: int
    is_in_stock: bool
    is_low_stock: bool
    warehouse_location: Optional[str] = None

    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    short_description: Optional[str] = None
    sku: str
    price: Decimal = Field(..., gt=0)
    sale_price: Optional[Decimal] = None
    cost_price: Optional[Decimal] = None
    category_id: int
    brand: Optional[str] = None
    images: List[str] = []
    thumbnail: Optional[str] = None
    tags: List[str] = []
    attributes: Dict[str, Any] = {}
    weight: Optional[float] = None
    dimensions: Optional[Dict[str, float]] = None
    is_featured: bool = False


class ProductCreate(ProductBase):
    initial_stock: int = 0
    low_stock_threshold: int = 10


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    price: Optional[Decimal] = None
    sale_price: Optional[Decimal] = None
    cost_price: Optional[Decimal] = None
    category_id: Optional[int] = None
    brand: Optional[str] = None
    images: Optional[List[str]] = None
    thumbnail: Optional[str] = None
    tags: Optional[List[str]] = None
    attributes: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None


class ProductResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    short_description: Optional[str] = None
    sku: str
    price: Decimal
    sale_price: Optional[Decimal] = None
    current_price: Decimal
    discount_percentage: float
    category_id: int
    category: Optional[CategoryResponse] = None
    brand: Optional[str] = None
    images: List[str] = []
    thumbnail: Optional[str] = None
    tags: List[str] = []
    attributes: Dict[str, Any] = {}
    avg_rating: float
    review_count: int
    view_count: int
    is_active: bool
    is_featured: bool
    inventory: Optional[InventoryResponse] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    id: int
    name: str
    slug: str
    price: Decimal
    sale_price: Optional[Decimal] = None
    current_price: Decimal
    discount_percentage: float
    thumbnail: Optional[str] = None
    avg_rating: float
    review_count: int
    brand: Optional[str] = None
    is_featured: bool
    category: Optional[CategoryResponse] = None
    inventory: Optional[InventoryResponse] = None

    class Config:
        from_attributes = True


class PaginatedProducts(BaseModel):
    items: List[ProductListResponse]
    total: int
    page: int
    per_page: int
    pages: int


class InventoryUpdate(BaseModel):
    quantity: Optional[int] = None
    low_stock_threshold: Optional[int] = None
    warehouse_location: Optional[str] = None
    restock_quantity: Optional[int] = None
