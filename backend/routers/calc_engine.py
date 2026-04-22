from fastapi import APIRouter, Depends
from supabase import Client
from dependencies import get_supabase, get_current_user
from schemas.calc import (
    VNCalcRequest, VNCalcResponse,
    SGCalcRequest, SGCalcResponse,
    RecommendRequest, RecommendResponse, RecommendPrices, ShipInfo,
)
from services.calc_service import (
    calc_vn, calc_sg, rec_vn, rec_sg,
    vn_ship_fee, sg_ship_fee, DEFAULT_CFG,
)

router = APIRouter(prefix="/api/calc", tags=["계산 엔진"])


def _get_cfg(user_id: str, sb: Client) -> dict:
    """사용자 설정 로드. 없으면 기본값 사용."""
    res = sb.table("settings").select("*").eq("user_id", user_id).maybe_single().execute()
    if res.data:
        d = res.data
        return {
            "vn_rate": d["vn_rate"], "sg_rate": d["sg_rate"], "dom_ship": d["dom_ship"],
            "vn_comm": d["vn_comm"], "vn_pg": d["vn_pg"], "vn_ship_off": d["vn_ship_off"],
            "sg_comm": d["sg_comm"], "sg_pg": d["sg_pg"], "sg_svc": d["sg_svc"],
            "sg_ship_off": d["sg_ship_off"],
            "margin_min": d["margin_min"], "margin_nor": d["margin_nor"], "margin_tgt": d["margin_tgt"],
        }
    return DEFAULT_CFG.copy()


@router.post("/vn", response_model=VNCalcResponse)
def calculate_vn(
    body: VNCalcRequest,
    user: dict = Depends(get_current_user),
    sb: Client = Depends(get_supabase),
):
    cfg = _get_cfg(user["id"], sb)
    result = calc_vn(body.cost, body.price, body.weight, cfg)
    return VNCalcResponse(**result)


@router.post("/sg", response_model=SGCalcResponse)
def calculate_sg(
    body: SGCalcRequest,
    user: dict = Depends(get_current_user),
    sb: Client = Depends(get_supabase),
):
    cfg = _get_cfg(user["id"], sb)
    result = calc_sg(body.cost, body.price, body.weight, cfg)
    return SGCalcResponse(**result)


@router.post("/recommend", response_model=RecommendResponse)
def recommend(
    body: RecommendRequest,
    user: dict = Depends(get_current_user),
    sb: Client = Depends(get_supabase),
):
    cfg = _get_cfg(user["id"], sb)

    vn = RecommendPrices(
        min=rec_vn(body.cost, body.weight, cfg["margin_min"], cfg),
        nor=rec_vn(body.cost, body.weight, cfg["margin_nor"], cfg),
        tgt=rec_vn(body.cost, body.weight, cfg["margin_tgt"], cfg),
    )
    sg = RecommendPrices(
        min=rec_sg(body.cost, body.weight, cfg["margin_min"], cfg),
        nor=rec_sg(body.cost, body.weight, cfg["margin_nor"], cfg),
        tgt=rec_sg(body.cost, body.weight, cfg["margin_tgt"], cfg),
    )

    vn_total  = vn_ship_fee(body.weight)
    sg_total  = sg_ship_fee(body.weight)

    ship = ShipInfo(
        vn_ship_total=vn_total,
        vn_ship_seller=vn_total - cfg["vn_ship_off"],
        sg_ship_total=sg_total,
        sg_ship_seller=round(sg_total - cfg["sg_ship_off"], 2),
    )

    return RecommendResponse(vn=vn, sg=sg, ship_info=ship)
