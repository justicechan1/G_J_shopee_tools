from fastapi import APIRouter, Depends, HTTPException, Query, status
from supabase import Client
from dependencies import get_supabase, get_current_user
from schemas.calc import CalcResultCreate, CalcResultUpdate, CalcResultOut, CalcResultListOut
from datetime import date
from typing import Optional

router = APIRouter(prefix="/api/calc/results", tags=["계산 결과"])


@router.get("", response_model=CalcResultListOut)
def list_results(
    market: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    user: dict = Depends(get_current_user),
    sb: Client = Depends(get_supabase),
):
    query = sb.table("calc_results").select("*", count="exact").eq("user_id", user["id"])
    if market:
        query = query.eq("market", market.upper())
    if q:
        query = query.ilike("name", f"%{q}%")
    query = query.order("created_at", desc=True).range(offset, offset + limit - 1)
    res = query.execute()
    return CalcResultListOut(total=res.count or 0, items=res.data or [])


@router.post("", response_model=CalcResultOut, status_code=201)
def create_result(
    body: CalcResultCreate,
    user: dict = Depends(get_current_user),
    sb: Client = Depends(get_supabase),
):
    payload = {**body.model_dump(), "user_id": user["id"], "saved_date": date.today().isoformat()}
    res = sb.table("calc_results").insert(payload).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="저장에 실패했습니다")
    return CalcResultOut(**res.data[0])


@router.put("/{result_id}", response_model=CalcResultOut)
def update_result(
    result_id: str,
    body: CalcResultUpdate,
    user: dict = Depends(get_current_user),
    sb: Client = Depends(get_supabase),
):
    payload = {k: v for k, v in body.model_dump(exclude_unset=True).items()}
    res = (
        sb.table("calc_results")
        .update(payload)
        .eq("id", result_id)
        .eq("user_id", user["id"])
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="결과를 찾을 수 없습니다")
    return CalcResultOut(**res.data[0])


@router.delete("/{result_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_result(
    result_id: str,
    user: dict = Depends(get_current_user),
    sb: Client = Depends(get_supabase),
):
    sb.table("calc_results").delete().eq("id", result_id).eq("user_id", user["id"]).execute()


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def delete_results(
    market: Optional[str] = Query(None),
    user: dict = Depends(get_current_user),
    sb: Client = Depends(get_supabase),
):
    query = sb.table("calc_results").delete().eq("user_id", user["id"])
    if market:
        query = query.eq("market", market.upper())
    query.execute()


@router.post("/deduplicate")
def deduplicate_results(
    user: dict = Depends(get_current_user),
    sb: Client = Depends(get_supabase),
):
    res = sb.table("calc_results").select("id, name, market, sale_price") \
        .eq("user_id", user["id"]).order("id", desc=True).execute()
    items = res.data or []

    seen, to_delete = set(), []
    for item in items:
        key = f"{item.get('name', '')}|{item.get('market', '')}|{item.get('sale_price', '')}"
        if key in seen:
            to_delete.append(item["id"])
        else:
            seen.add(key)

    if to_delete:
        sb.table("calc_results").delete().in_("id", to_delete).eq("user_id", user["id"]).execute()

    return {"deleted": len(to_delete)}
