from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from supabase import Client, create_client
from dependencies import get_supabase, get_current_user
from schemas.crawl import CrawlStartRequest, CrawlJobOut, CrawlJobListOut
from services.crawl_service import crawl_keywords
from config import get_settings
from datetime import datetime, timezone
from pathlib import Path
import json

router = APIRouter(prefix="/api/crawl", tags=["크롤링 실행"])

# 실행 중인 작업의 stop_flag 보관 { job_id: {"stop": bool} }
_running_jobs: dict = {}

# 작업별 실시간 로그 { job_id: [{"msg": str, "type": str}] }
_job_logs: dict = {}


def _add_log(job_id: str, msg: str, type: str = "info"):
    if job_id not in _job_logs:
        _job_logs[job_id] = []
    _job_logs[job_id].append({"msg": msg, "type": type})


def _run_crawl(job_id: str, keywords: list, user_id: str):
    settings  = get_settings()
    sb        = create_client(settings.supabase_url, settings.supabase_service_key)
    stop_flag = _running_jobs.setdefault(job_id, {"stop": False})
    log_fn    = lambda msg, type="info": _add_log(job_id, msg, type)
    import sys
    base = Path("/tmp") if sys.platform == "linux" else Path(__file__).parent.parent
    dump_path = base / f"crawl_debug_{job_id[:8]}.json"
    debug: dict = {"job_id": job_id, "keywords": keywords, "products": [], "insert_result": None, "error": None}

    sb.table("crawl_jobs").update({
        "status": "running",
        "started_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", job_id).execute()

    log_fn(f"⚙️  작업 시작 (ID: {job_id[:8]}...)")
    gemini_keys = settings.gemini_keys_list
    log_fn(f"🔑 Gemini 키 {len(gemini_keys)}개 로드됨")

    try:
        products = crawl_keywords(keywords, stop_flag, gemini_keys=gemini_keys, log_fn=log_fn)
        debug["products"] = products
        dump_path.write_text(json.dumps(debug, ensure_ascii=False, indent=2), encoding="utf-8")

        if products:
            rows = [{**p, "user_id": user_id} for p in products]
            log_fn(f"💾 DB 저장 중... ({len(rows)}개)", "info")
            insert_res = sb.table("crawl_items").insert(rows).execute()
            debug["insert_result"] = insert_res.data
            dump_path.write_text(json.dumps(debug, ensure_ascii=False, indent=2), encoding="utf-8")
            log_fn(f"✅ DB 저장 완료", "done")

        final_status = "stopped" if stop_flag.get("stop") else "done"
        sb.table("crawl_jobs").update({
            "status":      final_status,
            "done_kw":     len(keywords),
            "found":       len(products),
            "finished_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", job_id).execute()

        log_fn("__DONE__", "done")

    except Exception as e:
        debug["error"] = str(e)
        dump_path.write_text(json.dumps(debug, ensure_ascii=False, indent=2), encoding="utf-8")
        log_fn(f"❌ 작업 오류: {str(e)}", "err")
        log_fn("__DONE__", "err")
        sb.table("crawl_jobs").update({
            "status":      "error",
            "error_msg":   str(e),
            "finished_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", job_id).execute()
    finally:
        _running_jobs.pop(job_id, None)


@router.post("/start", response_model=CrawlJobOut, status_code=201)
def start_crawl(
    body: CrawlStartRequest,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user),
    sb: Client = Depends(get_supabase),
):
    if not body.keywords:
        raise HTTPException(status_code=400, detail="검색어를 1개 이상 입력하세요")

    res = sb.table("crawl_jobs").insert({
        "user_id":  user["id"],
        "keywords": body.keywords,
        "status":   "pending",
        "total_kw": len(body.keywords),
        "done_kw":  0,
        "found":    0,
    }).execute()

    job    = res.data[0]
    job_id = job["id"]
    _job_logs[job_id] = []

    background_tasks.add_task(_run_crawl, job_id, body.keywords, user["id"])

    return CrawlJobOut(
        job_id=job_id, status="running",
        total_kw=len(body.keywords), done_kw=0,
    )


@router.get("/logs/{job_id}")
def get_logs(
    job_id:  str,
    offset:  int = Query(0, ge=0),
    user:    dict = Depends(get_current_user),
):
    logs = _job_logs.get(job_id, [])
    return {"logs": logs[offset:], "total": len(logs)}


@router.get("/jobs/{job_id}", response_model=CrawlJobOut)
def get_job_status(
    job_id: str,
    user: dict = Depends(get_current_user),
    sb: Client = Depends(get_supabase),
):
    res = (
        sb.table("crawl_jobs")
        .select("*")
        .eq("id", job_id)
        .eq("user_id", user["id"])
        .maybe_single()
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="작업을 찾을 수 없습니다")
    d = res.data
    return CrawlJobOut(
        job_id=d["id"], status=d["status"],
        total_kw=d["total_kw"], done_kw=d["done_kw"],
        found=d.get("found", 0), error_msg=d.get("error_msg"),
        started_at=d.get("started_at"), finished_at=d.get("finished_at"),
    )


@router.post("/stop/{job_id}", response_model=CrawlJobOut)
def stop_crawl(
    job_id: str,
    user: dict = Depends(get_current_user),
    sb: Client = Depends(get_supabase),
):
    if job_id in _running_jobs:
        _running_jobs[job_id]["stop"] = True

    res = (
        sb.table("crawl_jobs")
        .select("*")
        .eq("id", job_id)
        .eq("user_id", user["id"])
        .maybe_single()
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="작업을 찾을 수 없습니다")

    d = res.data
    return CrawlJobOut(job_id=d["id"], status=d["status"],
                       total_kw=d["total_kw"], done_kw=d["done_kw"])


@router.get("/jobs", response_model=CrawlJobListOut)
def list_jobs(
    user: dict = Depends(get_current_user),
    sb: Client = Depends(get_supabase),
):
    res = (
        sb.table("crawl_jobs")
        .select("*")
        .eq("user_id", user["id"])
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )
    items = [
        CrawlJobOut(
            job_id=d["id"], status=d["status"],
            total_kw=d["total_kw"], done_kw=d["done_kw"],
            found=d.get("found", 0), error_msg=d.get("error_msg"),
            started_at=d.get("started_at"), finished_at=d.get("finished_at"),
        )
        for d in (res.data or [])
    ]
    return CrawlJobListOut(items=items)
