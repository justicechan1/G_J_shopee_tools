# API 명세서 — FastAPI

> 프로젝트: Shopee Tools  
> Backend: FastAPI + Supabase  
> 작성일: 2026-04-21

---

## 공통 규칙

| 항목 | 내용 |
|------|------|
| Base URL | `http://localhost:8000` (개발) / `https://api.shopeetools.com` (운영) |
| 인증 | `Authorization: Bearer <supabase_jwt>` — 모든 엔드포인트 필수 |
| Content-Type | `application/json` |
| 에러 형식 | `{ "detail": "에러 메시지" }` |
| 날짜 형식 | ISO 8601 (`2026-04-21T09:00:00Z`) |

### 공통 응답 코드

| 코드 | 의미 |
|------|------|
| 200 | 성공 |
| 201 | 생성 성공 |
| 204 | 삭제 성공 (본문 없음) |
| 400 | 잘못된 요청 (유효성 오류) |
| 401 | 인증 필요 |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |
| 422 | 유효성 검사 실패 (FastAPI 기본) |
| 500 | 서버 오류 |

---

## 1. 환경설정 (Settings)

### `GET /api/settings`
현재 사용자의 환경설정 조회. 없으면 기본값 반환.

**Response 200**
```json
{
  "id": "uuid",
  "vn_rate": 17.8,
  "sg_rate": 1100,
  "dom_ship": 3500,
  "vn_comm": 13.64,
  "vn_pg": 4.91,
  "vn_ship_off": 15000,
  "sg_comm": 15.35,
  "sg_pg": 3.00,
  "sg_svc": 0.80,
  "sg_ship_off": 1.83,
  "margin_min": 10,
  "margin_nor": 20,
  "margin_tgt": 30,
  "updated_at": "2026-04-21T09:00:00Z"
}
```

---

### `PUT /api/settings`
환경설정 저장 (없으면 생성, 있으면 수정 — upsert).

**Request Body** (모든 필드 선택, 일부만 전송 가능)
```json
{
  "vn_rate": 17.8,
  "sg_rate": 1100,
  "dom_ship": 3500,
  "vn_comm": 13.64,
  "vn_pg": 4.91,
  "vn_ship_off": 15000,
  "sg_comm": 15.35,
  "sg_pg": 3.00,
  "sg_svc": 0.80,
  "sg_ship_off": 1.83,
  "margin_min": 10,
  "margin_nor": 20,
  "margin_tgt": 30
}
```

**Response 200** — 업데이트된 settings 객체 반환

---

## 2. 크롤링 내역 (Crawl Items)

### `GET /api/crawl/items`
크롤링 내역 목록 조회.

**Query Parameters**

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| `q` | string | - | 검색어·상품명·쇼피검색어 필터 |
| `limit` | int | 100 | 최대 반환 수 |
| `offset` | int | 0 | 페이지 오프셋 |

**Response 200**
```json
{
  "total": 42,
  "items": [
    {
      "id": "uuid",
      "keyword": "라운드랩 선크림",
      "name": "라운드랩 자작나무 수분 톤업 선크림 50ml",
      "org_price": "22,000원",
      "sale_price": "19,900원",
      "image_url": "https://...",
      "detail_url": "https://www.oliveyoung.co.kr/...",
      "shopee_kw": "Roundlab Birch Sunscreen",
      "is_one_plus_one": false,
      "bundle_qty": 1,
      "unit_price": 19900,
      "weight": 70,
      "source": "crawl",
      "created_at": "2026-04-21T09:00:00Z"
    }
  ]
}
```

---

### `PUT /api/crawl/items/{item_id}`
크롤링 항목 수정.

**Path Parameters**
- `item_id` (uuid): 수정할 항목 ID

**Request Body** (수정할 필드만 전송)
```json
{
  "name": "라운드랩 자작나무 수분 선크림 50ml",
  "shopee_kw": "Roundlab Birch Moisture Sunscreen SPF50",
  "unit_price": 19900,
  "weight": 75
}
```

**Response 200** — 수정된 항목 반환

---

### `DELETE /api/crawl/items/{item_id}`
크롤링 항목 단건 삭제.

**Response 204** — 본문 없음

---

### `DELETE /api/crawl/items`
크롤링 내역 전체 삭제.

**Response 204** — 본문 없음

---

## 3. 크롤링 실행 (Crawl Jobs)

### `POST /api/crawl/start`
올리브영 크롤링 작업 시작.

**Request Body**
```json
{
  "keywords": ["라운드랩 선크림", "넘버즈인", "구달"]
}
```

**Response 201**
```json
{
  "job_id": "uuid",
  "status": "running",
  "total_kw": 3,
  "done_kw": 0,
  "created_at": "2026-04-21T09:00:00Z"
}
```

---

### `GET /api/crawl/jobs/{job_id}`
크롤링 작업 상태 조회 (폴링용).

**Response 200**
```json
{
  "job_id": "uuid",
  "status": "running",
  "total_kw": 3,
  "done_kw": 1,
  "found": 4,
  "error_msg": null,
  "started_at": "2026-04-21T09:00:00Z",
  "finished_at": null
}
```

---

### `POST /api/crawl/stop/{job_id}`
크롤링 작업 중단 요청.

**Response 200**
```json
{ "job_id": "uuid", "status": "stopped" }
```

---

### `GET /api/crawl/jobs`
크롤링 작업 이력 목록.

**Response 200**
```json
{
  "items": [
    {
      "job_id": "uuid",
      "keywords": ["라운드랩 선크림"],
      "status": "done",
      "total_kw": 1,
      "done_kw": 1,
      "found": 3,
      "started_at": "2026-04-21T09:00:00Z",
      "finished_at": "2026-04-21T09:01:30Z"
    }
  ]
}
```

---

## 4. 저장된 상품 (Product Items)

### `GET /api/products`
저장된 상품 목록 조회.

**Query Parameters**

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| `q` | string | - | 상품명·검색어·쇼피검색어 필터 |
| `source` | string | - | `crawl` \| `manual` 필터 |
| `limit` | int | 100 | 최대 반환 수 |
| `offset` | int | 0 | 페이지 오프셋 |

**Response 200**
```json
{
  "total": 15,
  "items": [
    {
      "id": "uuid",
      "keyword": "라운드랩 선크림",
      "name": "라운드랩 자작나무 수분 톤업 선크림 50ml",
      "org_price": "22,000원",
      "sale_price": "19,900원",
      "image_url": "https://...",
      "detail_url": "https://www.oliveyoung.co.kr/...",
      "shopee_kw": "Roundlab Birch Sunscreen",
      "is_one_plus_one": false,
      "bundle_qty": 1,
      "unit_price": 19900,
      "weight": 70,
      "source": "crawl",
      "saved_at": "2026-04-21",
      "created_at": "2026-04-21T09:00:00Z"
    }
  ]
}
```

---

### `POST /api/products`
저장된 상품 단건 추가 (수동 등록 또는 크롤링 내역에서 이동).

**Request Body**
```json
{
  "keyword": "라운드랩 선크림",
  "name": "라운드랩 자작나무 수분 톤업 선크림 50ml",
  "org_price": "22,000원",
  "sale_price": "19,900원",
  "image_url": "",
  "detail_url": "https://www.oliveyoung.co.kr/...",
  "shopee_kw": "Roundlab Birch Sunscreen",
  "is_one_plus_one": false,
  "bundle_qty": 1,
  "unit_price": 19900,
  "weight": 70,
  "source": "manual"
}
```

**Response 201** — 생성된 항목 반환

---

### `POST /api/products/bulk`
크롤링 내역에서 여러 상품을 한 번에 저장.

**Request Body**
```json
{
  "items": [
    { "keyword": "...", "name": "...", "sale_price": "...", "weight": 70 }
  ]
}
```

**Response 201**
```json
{ "created": 3 }
```

---

### `PUT /api/products/{item_id}`
저장된 상품 수정.

**Response 200** — 수정된 항목 반환

---

### `DELETE /api/products/{item_id}`
저장된 상품 단건 삭제.

**Response 204**

---

### `DELETE /api/products`
저장된 상품 전체 삭제.

**Response 204**

---

## 5. 계산 결과 (Calc Results)

### `GET /api/calc/results`
계산 결과 목록 조회.

**Query Parameters**

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| `market` | string | - | `VN` \| `SG` 필터 |
| `q` | string | - | 상품명 필터 |
| `limit` | int | 100 | 최대 반환 수 |
| `offset` | int | 0 | 페이지 오프셋 |

**Response 200**
```json
{
  "total": 8,
  "items": [
    {
      "id": "uuid",
      "market": "SG",
      "name": "라운드랩 선크림",
      "cost": 19900,
      "sale_price": "SGD 12.90",
      "weight": 70,
      "profit": 4230.50,
      "margin": 21.26,
      "saved_date": "2026-04-21",
      "created_at": "2026-04-21T09:00:00Z"
    }
  ]
}
```

---

### `POST /api/calc/results`
계산 결과 저장.

**Request Body**
```json
{
  "market": "SG",
  "name": "라운드랩 선크림",
  "cost": 19900,
  "sale_price": "SGD 12.90",
  "weight": 70,
  "profit": 4230.50,
  "margin": 21.26
}
```

**Response 201** — 생성된 항목 반환

---

### `DELETE /api/calc/results/{result_id}`
계산 결과 단건 삭제.

**Response 204**

---

### `DELETE /api/calc/results`
계산 결과 전체 삭제. `market` 쿼리파라미터로 시장별 삭제 가능.

**Query Parameters**

| 파라미터 | 설명 |
|---------|------|
| `market` | `VN` 또는 `SG` — 없으면 전체 삭제 |

**Response 204**

---

## 6. 계산 엔진 (Stateless 계산 API)

DB 저장 없이 입력값만으로 수익·추천가를 계산. 프론트 설정값 없이 서버 설정값 사용 가능.

### `POST /api/calc/vn`
VN 수익 계산.

**Request Body**
```json
{
  "cost": 19900,
  "price": 355680,
  "weight": 70
}
```

**Response 200**
```json
{
  "ship_total": 102800,
  "ship_seller": 87800,
  "pg": 18004,
  "comm": 48474,
  "settle": 201402,
  "settle_krw": 11315,
  "profit": 3915,
  "margin": 19.67
}
```

---

### `POST /api/calc/sg`
SG 수익 계산.

**Request Body**
```json
{
  "cost": 19900,
  "price": 12.90,
  "weight": 70
}
```

**Response 200**
```json
{
  "ship_total": 2.79,
  "ship_seller": 0.96,
  "comm": 1.98,
  "pg": 0.39,
  "svc": 0.10,
  "settle": 9.47,
  "settle_krw": 10417,
  "profit": 3017,
  "margin": 15.16
}
```

---

### `POST /api/calc/recommend`
마진율별 추천 판매가 계산.

**Request Body**
```json
{
  "cost": 19900,
  "weight": 70
}
```

**Response 200**
```json
{
  "vn": {
    "min": 285400,
    "nor": 327200,
    "tgt": 369100
  },
  "sg": {
    "min": 10.42,
    "nor": 11.98,
    "tgt": 13.53
  },
  "ship_info": {
    "vn_ship_total": 102800,
    "vn_ship_seller": 87800,
    "sg_ship_total": 2.79,
    "sg_ship_seller": 0.96
  }
}
```

---

## 7. 인증 (Auth)

Supabase Auth를 그대로 사용. FastAPI는 JWT 검증만 담당.

### `POST /api/auth/login`
이메일·비밀번호 로그인 (Supabase Auth 위임).

**Request Body**
```json
{ "email": "user@example.com", "password": "password" }
```

**Response 200**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "expires_in": 3600,
  "user": { "id": "uuid", "email": "user@example.com" }
}
```

---

### `POST /api/auth/refresh`
토큰 갱신.

**Request Body**
```json
{ "refresh_token": "eyJ..." }
```

**Response 200** — 새 `access_token` 반환

---

### `POST /api/auth/logout`
로그아웃 (Supabase 세션 무효화).

**Response 204**

---

## FastAPI 프로젝트 구조 (권장)

```
backend/
├── main.py                  # FastAPI 앱 초기화, CORS, 라우터 등록
├── config.py                # 환경변수 (Supabase URL, KEY 등)
├── dependencies.py          # 공통 의존성 (JWT 검증, DB 세션)
├── routers/
│   ├── settings.py          # /api/settings
│   ├── crawl_items.py       # /api/crawl/items
│   ├── crawl_jobs.py        # /api/crawl/start|stop|jobs
│   ├── products.py          # /api/products
│   ├── calc_results.py      # /api/calc/results
│   ├── calc_engine.py       # /api/calc/vn|sg|recommend
│   └── auth.py              # /api/auth
├── schemas/
│   ├── settings.py          # Pydantic 모델
│   ├── crawl.py
│   ├── product.py
│   └── calc.py
├── services/
│   ├── calc_service.py      # 수익 계산 비즈니스 로직
│   └── crawl_service.py     # 올리브영 크롤링 로직
└── requirements.txt
```

---

## 환경변수 (.env)

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_KEY=eyJ...          # service_role key (서버 전용)
SUPABASE_JWT_SECRET=...      # JWT 검증용
CORS_ORIGINS=http://localhost:5173,https://shopeetools.com
```

---

## CORS 설정

```python
# main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
