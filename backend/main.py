import sys
import asyncio

# Windows에서 Playwright subprocess 지원을 위해 ProactorEventLoop 정책 적용
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import get_settings

from routers import auth, settings, crawl_items, crawl_jobs, products, calc_results, calc_engine

settings_cfg = get_settings()

app = FastAPI(
    title="Shopee Tools API",
    description="올리브영 → 쇼피 수익 계산 및 상품 관리 API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings_cfg.cors_origins_list,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(settings.router)
app.include_router(crawl_items.router)
app.include_router(crawl_jobs.router)
app.include_router(products.router)
app.include_router(calc_results.router)
app.include_router(calc_engine.router)


@app.get("/")
def health_check():
    return {"status": "ok", "service": "Shopee Tools API"}
