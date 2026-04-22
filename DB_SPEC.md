# DB 명세서 — Supabase (PostgreSQL)

> 프로젝트: Shopee Tools  
> DB: Supabase (PostgreSQL)  
> 작성일: 2026-04-21

---

## 공통 규칙

| 항목 | 규칙 |
|------|------|
| PK | `uuid` (gen_random_uuid()) |
| 생성 시각 | `created_at TIMESTAMPTZ DEFAULT now()` |
| 수정 시각 | `updated_at TIMESTAMPTZ DEFAULT now()` — 트리거로 자동 갱신 |
| 사용자 식별 | `user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE` |
| RLS | 모든 테이블에 Row Level Security 활성화 — 본인 데이터만 접근 |

---

## 1. settings (환경설정)

사용자 1명당 1행. 없으면 GET 시 기본값 반환 / PUT 시 upsert.

```sql
CREATE TABLE settings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- 환율
  vn_rate    NUMERIC(10,4) NOT NULL DEFAULT 17.8,   -- 원/VND
  sg_rate    NUMERIC(10,2) NOT NULL DEFAULT 1100,   -- 원/SGD
  dom_ship   INTEGER       NOT NULL DEFAULT 3500,   -- 국내 택배비 (원)

  -- VN 수수료
  vn_comm      NUMERIC(6,4) NOT NULL DEFAULT 13.64, -- 판매 수수료 %
  vn_pg        NUMERIC(6,4) NOT NULL DEFAULT 4.91,  -- PG 수수료 %
  vn_ship_off  INTEGER      NOT NULL DEFAULT 15000, -- 고객 배송비 감면 VND

  -- SG 수수료
  sg_comm      NUMERIC(6,4) NOT NULL DEFAULT 15.35, -- 판매 수수료 %
  sg_pg        NUMERIC(6,4) NOT NULL DEFAULT 3.00,  -- PG 수수료 %
  sg_svc       NUMERIC(6,4) NOT NULL DEFAULT 0.80,  -- 서비스 수수료 %
  sg_ship_off  NUMERIC(8,4) NOT NULL DEFAULT 1.83,  -- 고객 배송비 감면 SGD

  -- 마진 기준
  margin_min   NUMERIC(5,2) NOT NULL DEFAULT 10,    -- 최소 마진 %
  margin_nor   NUMERIC(5,2) NOT NULL DEFAULT 20,    -- 적정 마진 %
  margin_tgt   NUMERIC(5,2) NOT NULL DEFAULT 30,    -- 목표 마진 %

  UNIQUE (user_id)
);
```

---

## 2. crawl_items (크롤링 내역)

올리브영 크롤링 또는 수동 입력을 통해 수집된 원본 상품 데이터.

```sql
CREATE TABLE crawl_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  keyword       TEXT,                    -- 크롤링 검색어
  name          TEXT NOT NULL,           -- 상품명
  org_price     TEXT,                    -- 할인 전 가격 (문자열, 예: "22,000원")
  sale_price    TEXT,                    -- 할인 후 가격 (문자열, 예: "19,900원")
  image_url     TEXT,                    -- 상품 이미지 URL
  detail_url    TEXT,                    -- 상세페이지 URL
  shopee_kw     TEXT,                    -- 쇼피 검색어 (영문)
  is_one_plus_one BOOLEAN DEFAULT false, -- 1+1 여부
  bundle_qty    INTEGER  DEFAULT 1,      -- 묶음 수량
  unit_price    INTEGER,                 -- 단품환산가 (원)
  weight        INTEGER,                 -- 추정 중량 (g)

  source        TEXT DEFAULT 'crawl'     -- 'crawl' | 'manual'
);

CREATE INDEX idx_crawl_items_user_id ON crawl_items(user_id);
CREATE INDEX idx_crawl_items_created_at ON crawl_items(created_at DESC);
```

---

## 3. product_items (저장된 상품)

크롤링 내역에서 저장하거나 수동 등록으로 직접 추가한 상품.  
crawl_items와 동일한 필드 구조 + `saved_at`.

```sql
CREATE TABLE product_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  keyword         TEXT,
  name            TEXT NOT NULL,
  org_price       TEXT,
  sale_price      TEXT,
  image_url       TEXT,
  detail_url      TEXT,
  shopee_kw       TEXT,
  is_one_plus_one BOOLEAN DEFAULT false,
  bundle_qty      INTEGER DEFAULT 1,
  unit_price      INTEGER,
  weight          INTEGER,

  source          TEXT DEFAULT 'crawl',  -- 'crawl' | 'manual'
  saved_at        DATE DEFAULT CURRENT_DATE
);

CREATE INDEX idx_product_items_user_id ON product_items(user_id);
CREATE INDEX idx_product_items_created_at ON product_items(created_at DESC);
```

---

## 4. calc_results (계산 결과)

VN / SG 수익 계산기에서 저장한 결과.

```sql
CREATE TABLE calc_results (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),

  market      TEXT NOT NULL CHECK (market IN ('VN', 'SG')),
  name        TEXT,                    -- 상품명 (선택)
  cost        INTEGER NOT NULL,        -- 한국 구매 원가 (원)
  sale_price  TEXT    NOT NULL,        -- 판매가 (표시용 문자열)
  weight      INTEGER,                 -- 상품 중량 (g)
  profit      NUMERIC(12,2),           -- 순이익 (원)
  margin      NUMERIC(6,2),            -- 마진율 (%)
  saved_date  DATE DEFAULT CURRENT_DATE
);

CREATE INDEX idx_calc_results_user_id ON calc_results(user_id);
CREATE INDEX idx_calc_results_market  ON calc_results(market);
CREATE INDEX idx_calc_results_created_at ON calc_results(created_at DESC);
```

---

## 5. crawl_jobs (크롤링 작업 로그)

크롤링 실행 이력 추적용.

```sql
CREATE TABLE crawl_jobs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),

  keywords   TEXT[] NOT NULL,          -- 검색어 목록
  status     TEXT   NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','running','done','stopped','error')),
  total_kw   INTEGER DEFAULT 0,        -- 전체 검색어 수
  done_kw    INTEGER DEFAULT 0,        -- 완료 검색어 수
  found      INTEGER DEFAULT 0,        -- 수집된 상품 수
  error_msg  TEXT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);

CREATE INDEX idx_crawl_jobs_user_id ON crawl_jobs(user_id);
```

---

## RLS 정책 (Row Level Security)

모든 테이블에 동일하게 적용.

```sql
-- settings 예시 (나머지 테이블도 동일 패턴)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "본인 데이터만 조회" ON settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "본인 데이터만 삽입" ON settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "본인 데이터만 수정" ON settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "본인 데이터만 삭제" ON settings
  FOR DELETE USING (auth.uid() = user_id);
```

---

## updated_at 자동 갱신 트리거

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 각 테이블에 적용
CREATE TRIGGER trg_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_crawl_items_updated_at
  BEFORE UPDATE ON crawl_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_product_items_updated_at
  BEFORE UPDATE ON product_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## ER 다이어그램 (텍스트)

```
auth.users
    │
    ├── settings          (1:1)
    ├── crawl_items       (1:N)
    ├── product_items     (1:N)
    ├── calc_results      (1:N)
    └── crawl_jobs        (1:N)
```

---

## 프론트엔드 ↔ DB 필드 매핑

| 프론트엔드 key | DB column | 비고 |
|---------------|-----------|------|
| `keyword` | `keyword` | |
| `name` | `name` | |
| `orgPrice` | `org_price` | 문자열 그대로 저장 |
| `salePrice` | `sale_price` | 문자열 그대로 저장 |
| `image` | `image_url` | |
| `detailUrl` | `detail_url` | |
| `shopeeKw` | `shopee_kw` | |
| `isOnePlusOne` | `is_one_plus_one` | |
| `bundleQty` | `bundle_qty` | |
| `unitPrice` | `unit_price` | 정수 (원) |
| `weight` | `weight` | 정수 (g) |
| `vnRate` | `vn_rate` | |
| `sgRate` | `sg_rate` | |
| `domShip` | `dom_ship` | |
