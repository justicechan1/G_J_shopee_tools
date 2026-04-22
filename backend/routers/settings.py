from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from dependencies import get_supabase, get_current_user
from schemas.settings import SettingsOut, SettingsUpdate
from datetime import datetime, timezone

router = APIRouter(prefix="/api/settings", tags=["환경설정"])

DEFAULTS = {
    "vn_rate": 17.8, "sg_rate": 1100, "dom_ship": 3500,
    "vn_comm": 13.64, "vn_pg": 4.91, "vn_ship_off": 15000,
    "sg_comm": 15.35, "sg_pg": 3.00, "sg_svc": 0.80, "sg_ship_off": 1.83,
    "margin_min": 10, "margin_nor": 20, "margin_tgt": 30,
}


@router.get("", response_model=SettingsOut)
def get_settings(
    user: dict = Depends(get_current_user),
    sb: Client = Depends(get_supabase),
):
    res = sb.table("settings").select("*").eq("user_id", user["id"]).maybe_single().execute()
    if not res.data:
        # 기본값 반환 (DB 저장 안 함)
        return SettingsOut(
            id="default",
            **DEFAULTS,
            updated_at=datetime.now(timezone.utc),
        )
    return SettingsOut(**res.data)


@router.put("", response_model=SettingsOut)
def upsert_settings(
    body: SettingsUpdate,
    user: dict = Depends(get_current_user),
    sb: Client = Depends(get_supabase),
):
    payload = {k: v for k, v in body.model_dump().items() if v is not None}
    payload["user_id"] = user["id"]

    res = (
        sb.table("settings")
        .upsert(payload, on_conflict="user_id")
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=500, detail="설정 저장에 실패했습니다")
    return SettingsOut(**res.data[0])
