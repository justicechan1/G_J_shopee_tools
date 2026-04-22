from fastapi import APIRouter, Depends, HTTPException, Query, status
from supabase import Client
from dependencies import get_supabase, get_current_user
from schemas.crawl import CrawlItemOut, CrawlItemUpdate, CrawlItemListOut

router = APIRouter(prefix="/api/crawl/items", tags=["크롤링 내역"])


@router.get("", response_model=CrawlItemListOut)
def list_crawl_items(
    q:      str = Query(None),
    kw:     str = Query(None),
    limit:  int = Query(20, ge=1, le=500),
    offset: int = Query(0, ge=0),
    user: dict = Depends(get_current_user),
    sb: Client = Depends(get_supabase),
):
    query = sb.table("crawl_items").select("*", count="exact").eq("user_id", user["id"])
    if kw:
        query = query.eq("keyword", kw)
    if q:
        query = query.or_(f"keyword.ilike.%{q}%,name.ilike.%{q}%,shopee_kw.ilike.%{q}%")
    query = query.order("id", desc=True).range(offset, offset + limit - 1)
    res = query.execute()
    return CrawlItemListOut(total=res.count or 0, items=res.data or [])


@router.get("/keywords")
def list_keywords(
    user: dict = Depends(get_current_user),
    sb: Client = Depends(get_supabase),
):
    from collections import Counter
    res = sb.table("crawl_items").select("keyword").eq("user_id", user["id"]).execute()
    counts = Counter(r["keyword"] for r in (res.data or []) if r.get("keyword"))
    return {"keywords": [{"keyword": k, "count": v} for k, v in counts.most_common()]}


@router.put("/{item_id}", response_model=CrawlItemOut)
def update_crawl_item(
    item_id: str,
    body: CrawlItemUpdate,
    user: dict = Depends(get_current_user),
    sb: Client = Depends(get_supabase),
):
    payload = {k: v for k, v in body.model_dump().items() if v is not None}
    res = (
        sb.table("crawl_items")
        .update(payload)
        .eq("id", item_id)
        .eq("user_id", user["id"])
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="항목을 찾을 수 없습니다")
    return CrawlItemOut(**res.data[0])


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_crawl_item(
    item_id: str,
    user: dict = Depends(get_current_user),
    sb: Client = Depends(get_supabase),
):
    sb.table("crawl_items").delete().eq("id", item_id).eq("user_id", user["id"]).execute()


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def delete_all_crawl_items(
    user: dict = Depends(get_current_user),
    sb: Client = Depends(get_supabase),
):
    sb.table("crawl_items").delete().eq("user_id", user["id"]).execute()


@router.post("/deduplicate")
def deduplicate_crawl_items(
    user: dict = Depends(get_current_user),
    sb: Client = Depends(get_supabase),
):
    res = sb.table("crawl_items").select("id, name, detail_url") \
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
        sb.table("crawl_items").delete().in_("id", to_delete).eq("user_id", user["id"]).execute()

    return {"deleted": len(to_delete)}
