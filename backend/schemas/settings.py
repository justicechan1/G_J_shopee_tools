from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SettingsOut(BaseModel):
    id: str
    vn_rate: float
    sg_rate: float
    dom_ship: int
    vn_comm: float
    vn_pg: float
    vn_ship_off: int
    sg_comm: float
    sg_pg: float
    sg_svc: float
    sg_ship_off: float
    margin_min: float
    margin_nor: float
    margin_tgt: float
    updated_at: datetime


class SettingsUpdate(BaseModel):
    vn_rate: Optional[float] = None
    sg_rate: Optional[float] = None
    dom_ship: Optional[int] = None
    vn_comm: Optional[float] = None
    vn_pg: Optional[float] = None
    vn_ship_off: Optional[int] = None
    sg_comm: Optional[float] = None
    sg_pg: Optional[float] = None
    sg_svc: Optional[float] = None
    sg_ship_off: Optional[float] = None
    margin_min: Optional[float] = None
    margin_nor: Optional[float] = None
    margin_tgt: Optional[float] = None
