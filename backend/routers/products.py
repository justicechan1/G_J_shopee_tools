from fastapi import APIRouter, Depends, HTTPException, Query, status
from supabase import Client
from dependencies import get_supabase, get_current_user
from schemas.product import (
    ProductItemCreate, ProductItemUpdate, ProductItemOut,
    ProductItemListOut, BulkCreateRequest, BulkCreateResponse,
)
from datetime import date

router = APIRouter(prefix="/api/products", tags=["저장된 상품"])


@router.get("", response_model=ProductItemListOut)
def list_products(
    q: str = Query(None),
    source: str = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    user: dict = Depends(get_current_user),
    sb: Client = Depends(get_supabase),
):
    query = sb.table("product_items").select("*", count="exact").eq("user_id", user["id"])
    if q:
        query = query.or_(f"name.ilike.%{q}%,keyword.ilike.%{q}%,shopee_kw.ilike.%{q}%")
    if source:
        query = query.eq("source", source)
    query = query.order("created_at", desc=True).range(offset, offset + limit - 1)
    res = query.execute()
    return ProductItemListOut(total=res.count or 0, items=res.data or [])


@router.post("", response_model=ProductItemOut, status_code=201)
def create_product(
    body: ProductItemCreate,
    user: dict = Depends(get_current_user),
    sb: Client = Depends(get_supabase),
):
    payload = {**body.model_dump(), "user_id": user["id"], "saved_at": date.today().isoformat()}
    res = sb.table("product_items").insert(payload).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="상품 저장에 실패했습니다")
    return ProductItemOut(**res.data[0])


@router.post("/bulk", response_model=BulkCreateResponse, status_code=201)
def bulk_create_products(
    body: BulkCreateRequest,
    user: dict = Depends(get_current_user),
    sb: Client = Depends(get_supabase),
):
    if not body.items:
        raise HTTPException(status_code=400, detail="items가 비어 있습니다")
    rows = [
        {**item.model_dump(), "user_id": user["id"], "saved_at": date.today().isoformat()}
        for item in body.items
    ]
    sb.table("product_items").insert(rows).execute()
    return BulkCreateResponse(created=len(rows))


@router.put("/{item_id}", response_model=ProductItemOut)
def update_product(
    item_id: str,
    body: ProductItemUpdate,
    user: dict = Depends(get_current_user),
    sb: Client = Depends(get_supabase),
):
    payload = {k: v for k, v in body.model_dump().items() if v is not None}
    res = (
        sb.table("product_items")
        .update(payload)
        .eq("id", item_id)
        .eq("user_id", user["id"])
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="상품을 찾을 수 없습니다")
    return ProductItemOut(**res.data[0])


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    item_id: str,
    user: dict = Depends(get_current_user),
    sb: Client = Depends(get_supabase),
):
    sb.table("product_items").delete().eq("id", item_id).eq("user_id", user["id"]).execute()


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def delete_all_products(
    user: dict = Depends(get_current_user),
    sb: Client = Depends(get_supabase),
):
    sb.table("product_items").delete().eq("user_id", user["id"]).execute()


@router.post("/deduplicate")
def deduplicate_products(
    user: dict = Depends(get_current_user),
    sb: Client = Depends(get_supabase),
):
    res = sb.table("product_items").select("id, name, detail_url") \
        .eq("user_id", user["id"]).order("id", desc=True).execute()
    items = res.data or []

    seen, to_delete = set(), []
    for item in items:
        key = (item.get("detail_url") or "").strip() or (item.get("name") or "").strip()
        if not key:
            continue
        if key in seen:
            to_delete.append(item["id"])
        else:
            seen.add(key)

    if to_delete:
        sb.table("product_items").delete().in_("id", to_delete).eq("user_id", user["id"]).execute()

    return {"deleted": len(to_delete)}
