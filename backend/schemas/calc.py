from pydantic import BaseModel
from typing import Optional, List, Literal
from datetime import datetime, date


# ── 계산 결과 저장 ──────────────────────────────────────────────
class CalcResultCreate(BaseModel):
    market: Literal["VN", "SG"]
    name: Optional[str] = None
    cost: int
    sale_price: str
    weight: Optional[int] = None
    profit: Optional[float] = None
    margin: Optional[float] = None


class CalcResultOut(CalcResultCreate):
    id: str
    saved_date: Optional[date] = None
    created_at: datetime


class CalcResultListOut(BaseModel):
    total: int
    items: List[CalcResultOut]


# ── 계산 엔진 (stateless) ──────────────────────────────────────
class VNCalcRequest(BaseModel):
    cost: float
    price: float
    weight: int


class VNCalcResponse(BaseModel):
    ship_total: Optional[float] = None
    ship_seller: Optional[float] = None
    pg: Optional[float] = None
    comm: Optional[float] = None
    settle: Optional[float] = None
    settle_krw: Optional[float] = None
    profit: Optional[float] = None
    margin: Optional[float] = None


class SGCalcRequest(BaseModel):
    cost: float
    price: float
    weight: int


class SGCalcResponse(BaseModel):
    ship_total: Optional[float] = None
    ship_seller: Optional[float] = None
    comm: Optional[float] = None
    pg: Optional[float] = None
    svc: Optional[float] = None
    settle: Optional[float] = None
    settle_krw: Optional[float] = None
    profit: Optional[float] = None
    margin: Optional[float] = None


class RecommendRequest(BaseModel):
    cost: float
    weight: int


class RecommendPrices(BaseModel):
    min: float
    nor: float
    tgt: float


class ShipInfo(BaseModel):
    vn_ship_total: float
    vn_ship_seller: float
    sg_ship_total: float
    sg_ship_seller: float


class RecommendResponse(BaseModel):
    vn: RecommendPrices
    sg: RecommendPrices
    ship_info: ShipInfo
