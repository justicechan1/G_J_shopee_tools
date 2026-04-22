from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date


class ProductItemBase(BaseModel):
    keyword: Optional[str] = None
    name: str
    org_price: Optional[str] = None
    sale_price: Optional[str] = None
    image_url: Optional[str] = None
    detail_url: Optional[str] = None
    shopee_kw: Optional[str] = None
    is_one_plus_one: bool = False
    bundle_qty: int = 1
    unit_price: Optional[int] = None
    weight: Optional[int] = None
    source: str = "manual"


class ProductItemCreate(ProductItemBase):
    pass


class ProductItemUpdate(BaseModel):
    keyword: Optional[str] = None
    name: Optional[str] = None
    org_price: Optional[str] = None
    sale_price: Optional[str] = None
    image_url: Optional[str] = None
    detail_url: Optional[str] = None
    shopee_kw: Optional[str] = None
    is_one_plus_one: Optional[bool] = None
    bundle_qty: Optional[int] = None
    unit_price: Optional[int] = None
    weight: Optional[int] = None


class ProductItemOut(ProductItemBase):
    id: str
    saved_at: Optional[date] = None
    created_at: datetime


class ProductItemListOut(BaseModel):
    total: int
    items: List[ProductItemOut]


class BulkCreateRequest(BaseModel):
    items: List[ProductItemCreate]


class BulkCreateResponse(BaseModel):
    created: int
