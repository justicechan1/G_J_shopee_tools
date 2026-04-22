from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class CrawlItemOut(BaseModel):
    id: str
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
    source: str = "crawl"
    created_at: datetime


class CrawlItemUpdate(BaseModel):
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


class CrawlItemListOut(BaseModel):
    total: int
    items: List[CrawlItemOut]


class CrawlStartRequest(BaseModel):
    keywords: List[str]


class CrawlJobOut(BaseModel):
    job_id: str
    status: str
    total_kw: int
    done_kw: int
    found: int = 0
    error_msg: Optional[str] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None


class CrawlJobListOut(BaseModel):
    items: List[CrawlJobOut]
