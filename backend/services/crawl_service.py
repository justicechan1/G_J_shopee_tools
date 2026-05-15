"""
올리브영 크롤링 서비스 (Playwright + Gemini)
Olive2.py 기반 — 구글 시트 없이 API용으로 변환
"""
import re
import sys
import time
import json
import random
import asyncio
import traceback
from typing import List, Optional, Callable

MAX_RETRY   = 3
RETRY_DELAY = 10

LogFn = Optional[Callable[[str, str], None]]


def _interruptible_sleep(seconds: float, stop_flag: dict):
    """0.3초 간격으로 stop_flag를 확인하며 sleep."""
    end = time.time() + seconds
    while time.time() < end:
        if stop_flag and stop_flag.get("stop"):
            return
        time.sleep(min(0.3, end - time.time()))


def _log(log_fn: LogFn, msg: str, type: str = "info"):
    print(f"[crawl] {msg}")
    if log_fn:
        log_fn(msg, type)


# ───────────────────────────────���────────────────────────────
#  Gemini API 로테이션
# ─────────────────────────────────────────��──────────────────
class GeminiRotator:
    def __init__(self, api_keys: List[str]):
        self.api_keys  = api_keys
        self.current   = 0
        self.exhausted: set = set()
        self._model    = None
        if api_keys:
            self._init_model()

    def _init_model(self):
        try:
            import google.generativeai as genai
            key = self.api_keys[self.current]
            genai.configure(api_key=key)
            self._model = genai.GenerativeModel("gemini-3.1-flash-lite")
        except Exception:
            self._model = None

    def _next_key(self) -> bool:
        self.exhausted.add(self.current)
        for i in range(len(self.api_keys)):
            if i not in self.exhausted:
                self.current = i
                self._init_model()
                return True
        return False

    def generate(self, prompt: str, retries: int = 3) -> Optional[str]:
        if not self._model:
            return None
        for attempt in range(retries):
            try:
                response = self._model.generate_content(prompt)
                return response.text
            except Exception as e:
                err = str(e).lower()
                if any(x in err for x in ("quota", "rate", "429", "limit")):
                    if not self._next_key():
                        time.sleep(60)
                        self.exhausted.clear()
                        self._init_model()
                else:
                    time.sleep(3)
        return None


# ────────────────────────────────────────���───────────────────
#  Gemini 상품 분석
# ─────────────────────────────────────────────���──────────────
def analyze_product(gemini: GeminiRotator, product_name: str, sale_price: str) -> dict:
    fallback = {
        "shopee_keyword":     product_name[:30],
        "is_bundle":          False,
        "bundle_count":       1,
        "estimated_weight_g": 100,
        "product_type":       "other",
    }
    if not gemini or not gemini._model:
        return fallback

    prompt = f"""당신은 한국 화장품 전문가입니다.
아래 올리브영 상품명을 분석해서 JSON만 반환하세요. 설명 없이 JSON만.

상품명: {product_name}
판매가: {sale_price}

반환할 JSON 형식:
{{
  "shopee_keyword": "쇼피에서 검색할 영문 키워드 (브랜드명 영문 + 핵심 제품명, 간결하게)",
  "is_bundle": true 또는 false,
  "bundle_count": 묶음 수량 (1+1이면 2, 단품이면 1),
  "estimated_weight_g": 단품 1개의 추정 무게(g) 정수값,
  "product_type": "sunscreen" 또는 "moisturizer" 또는 "toner" 또는 "mask" 또는 "cleanser" 또는 "serum" 또는 "other"
}}

규칙:
- shopee_keyword는 반드시 영어로, 3~6단어로 간결하게
- estimated_weight_g: 예) 50ml 선크림=약 70g, 100ml 토너=약 110g, 마스크팩 1매=약 25g
- is_bundle: 상품명에 1+1, 2개, 세트, 기획, SET 등이 있으면 true"""

    result = gemini.generate(prompt)
    if not result:
        return fallback
    try:
        clean = re.sub(r"```json|```", "", result).strip()
        return json.loads(clean)
    except Exception:
        return fallback


# ────────────────────────���───────────────────────────────────
#  이름 정제
# ───────────────────────────────────────────────────────���────
def _clean_name(name: str) -> str:
    name = re.sub(r"\[.*?\]", "", name)
    name = re.sub(r"\(.*?\)", "", name)
    name = re.sub(r"\s+", " ", name)
    return name.strip()


# ───────────────────────────────────���────────────────────────
#  Playwright 크롤링 (1회 시도) — Olive2.py _do_crawl 그대로
# ───────────────────────────────────────────��────────────────
def _playwright_crawl(keyword: str, log_fn: LogFn = None, mode: str = "first", stop_flag: dict = None) -> List[dict]:
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

    from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

    _log(log_fn, f"🌐 올리브영 접속 중: '{keyword}'")

    # 로컬(Windows)은 headless=False, 서버(Linux)는 headless=True + 메모리 절약 옵션
    is_linux = sys.platform == "linux"
    launch_args = ["--disable-blink-features=AutomationControlled"]
    if is_linux:
        launch_args += [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",   # /dev/shm 대신 /tmp 사용 (컨테이너 필수)
            "--disable-gpu",
            "--single-process",          # 렌더러를 별도 프로세스 대신 단일 프로세스로 → 메모리 절약
            "--no-zygote",
        ]

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=is_linux,
            args=launch_args,
        )
        context = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1280, "height": 800},
        )
        page = context.new_page()
        page.add_init_script(
            "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
        )

        import urllib.parse
        search_url = (
            "https://www.oliveyoung.co.kr/store/search/getSearchMain.do"
            f"?query={urllib.parse.quote(keyword)}&giftYn=N"
        )
        EXTRACT_JS = """
            () => {
                const items = document.querySelectorAll('li.flag.li_result');
                const results = [];
                items.forEach(item => {
                    const nameEl    = item.querySelector('.prd_name');
                    const name      = nameEl ? nameEl.innerText.trim() : '';
                    const imgEl     = item.querySelector('a.prd_thumb img');
                    let   imgUrl    = '';
                    if (imgEl) {
                        imgUrl = imgEl.getAttribute('src') || imgEl.getAttribute('data-original') || '';
                        if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;
                    }
                    const linkEl    = item.querySelector('a.prd_thumb');
                    const detailUrl = linkEl ? linkEl.href : '';
                    const orgEl     = item.querySelector('.tx_org .tx_num');
                    const orgPrice  = orgEl ? orgEl.innerText.trim() + '원' : '-';
                    const curEl     = item.querySelector('.tx_cur .tx_num');
                    const curPrice  = curEl ? curEl.innerText.trim() + '원' : '-';
                    if (name) {
                        results.push({
                            name, img_url: imgUrl, detail_url: detailUrl,
                            original_price: orgPrice, sale_price: curPrice,
                        });
                    }
                });
                return results;
            }
        """

        _log(log_fn, f"🔍 검색 결과 직접 접속: '{keyword}'")
        if stop_flag and stop_flag.get("stop"):
            browser.close()
            return []

        page.goto(search_url, wait_until="domcontentloaded", timeout=60000)
        _interruptible_sleep(random.uniform(2, 3), stop_flag or {})
        _log(log_fn, "📄 페이지 로드 완료")

        if stop_flag and stop_flag.get("stop"):
            browser.close()
            return []

        _log(log_fn, "⏳ 검색 결과 대기 중...")
        try:
            page.wait_for_selector("li.flag.li_result", timeout=8000)
        except PlaywrightTimeout:
            browser.close()
            raise ValueError(f"검색 결과 없음: '{keyword}'")

        _interruptible_sleep(1, stop_flag or {})

        products = page.evaluate(EXTRACT_JS)
        _log(log_fn, f"📄 1페이지: {len(products)}개 수집", "info")

        if mode == "full":
            # 페이지네이션 링크에서 offset 목록 수집
            page_offsets = page.evaluate("""
                () => {
                    const links = document.querySelectorAll('div.pageing.new a[onclick]');
                    const offsets = [];
                    links.forEach(a => {
                        const m = (a.getAttribute('onclick') || '').match(/doPaging\\('(\\d+)'\\)/);
                        if (m) offsets.push(m[1]);
                    });
                    return offsets;
                }
            """)
            _log(log_fn, f"📑 총 {1 + len(page_offsets)}페이지 발견", "info")

            for idx, offset in enumerate(page_offsets, 2):
                if stop_flag and stop_flag.get("stop"):
                    break
                _log(log_fn, f"📄 {idx}페이지 크롤링 중 (offset={offset})...", "info")
                # doPaging() 호출 후 AJAX 로드 완료까지 대기
                page.evaluate(f"doPaging('{offset}')")
                try:
                    page.wait_for_load_state("networkidle", timeout=10000)
                except PlaywrightTimeout:
                    pass
                _interruptible_sleep(random.uniform(0.8, 1.2), stop_flag or {})
                page_products = page.evaluate(EXTRACT_JS)
                if not page_products:
                    _log(log_fn, f"  ⚠️ {idx}페이지 상품 없음 → 중단", "warn")
                    break
                _log(log_fn, f"  ✅ {idx}페이지: {len(page_products)}개 수집", "sub")
                products.extend(page_products)

        _log(log_fn, f"✅ 총 {len(products)}개 상품 수집됨", "done")
        browser.close()

    for prod in products:
        prod["name"] = _clean_name(prod["name"])

    if not products:
        raise ValueError(f"상품 파싱 실패: '{keyword}'")

    return products


# ───────────────────────────────────────────────────────────���
#  단일 시도 래퍼
# ────────────────────────────────────────────────────────────
def _do_crawl(keyword: str, log_fn: LogFn = None, mode: str = "first", stop_flag: dict = None) -> List[dict]:
    return _playwright_crawl(keyword, log_fn, mode=mode, stop_flag=stop_flag)


# ───────────────────────────────���────────────────────────────
#  단일 키워드 크롤링 (재시도 포함)
# ────────────────────────────────────────��───────────────────
def _crawl_keyword(keyword: str, log_fn: LogFn = None, mode: str = "first", stop_flag: dict = None) -> List[dict]:
    for attempt in range(1, MAX_RETRY + 1):
        _log(log_fn, f"🌐 크롤링 시도 {attempt}/{MAX_RETRY}: '{keyword}'", "running")
        try:
            return _do_crawl(keyword, log_fn, mode=mode, stop_flag=stop_flag)
        except ValueError as e:
            _log(log_fn, f"⚠️ {e} → 스킵", "warn")
            return []
        except Exception as e:
            _log(log_fn, f"❌ 오류 (시도 {attempt}/{MAX_RETRY}): {str(e)[:80]}", "err")
            print(traceback.format_exc())
            if attempt < MAX_RETRY:
                _log(log_fn, f"⏳ {RETRY_DELAY}초 후 재시도...", "info")
                _interruptible_sleep(RETRY_DELAY, stop_flag or {})
    return []


# ──────────────────────────────────────��─────────────────────
#  공개 진입점
# ────────────────────────────────────────────────────────────
def crawl_keywords(
    keywords: List[str],
    stop_flag: dict,
    gemini_keys: Optional[List[str]] = None,
    delay: float = 3.0,
    log_fn: LogFn = None,
    mode: str = "first",
) -> List[dict]:
    gemini = GeminiRotator(gemini_keys or [])
    use_gemini = bool(gemini_keys)
    all_products: List[dict] = []
    total = len(keywords)

    for i, kw in enumerate(keywords, 1):
        if stop_flag.get("stop"):
            _log(log_fn, "🛑 정지 요청으로 중단됨", "warn")
            break

        _log(log_fn, f"{'─'*38}", "info")
        _log(log_fn, f"[{i}/{total}] 🔍 '{kw}'", "running")

        raw = _crawl_keyword(kw, log_fn, mode=mode, stop_flag=stop_flag)

        if not raw:
            _log(log_fn, f"⏭️  '{kw}' 결과 없음 → 다음 검색어로", "warn")
        else:
            _log(log_fn, f"📦 {len(raw)}개 상품 Gemini 분석 시작", "info")

        for j, prod in enumerate(raw, 1):
            if stop_flag.get("stop"):
                break

            if use_gemini:
                _log(log_fn, f"  🤖 [{j}/{len(raw)}] Gemini 분석: {prod['name'][:35]}...", "info")
            info       = analyze_product(gemini, prod["name"], prod["sale_price"])
            bundle_cnt = info.get("bundle_count", 1) or 1
            price_int  = int(re.sub(r"[^0-9]", "", prod["sale_price"]) or 0)
            unit_price = round(price_int / bundle_cnt) if bundle_cnt > 1 else price_int

            if use_gemini:
                _log(log_fn, f"  ✅ shopee_kw: {info.get('shopee_keyword','')}", "sub")

            all_products.append({
                "keyword":         kw,
                "name":            prod["name"],
                "org_price":       prod["original_price"],
                "sale_price":      prod["sale_price"],
                "image_url":       prod["img_url"],
                "detail_url":      prod["detail_url"],
                "shopee_kw":       info.get("shopee_keyword", ""),
                "is_one_plus_one": info.get("is_bundle", False),
                "bundle_qty":      bundle_cnt,
                "unit_price":      unit_price or None,
                "weight":          info.get("estimated_weight_g") or None,
                "source":          "crawl",
            })

            _interruptible_sleep(random.uniform(0.5, 1.0), stop_flag)

        if stop_flag.get("stop"):
            break
        _interruptible_sleep(delay, stop_flag)

    _log(log_fn, f"{'─'*38}", "info")
    _log(log_fn, f"🎉 전체 완료! 총 {len(all_products)}개 상품 수집됨", "done")
    return all_products
