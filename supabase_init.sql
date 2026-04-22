-- ============================================================
--  Shopee Tools — Supabase 초기화 SQL
--  Supabase 대시보드 → SQL Editor에서 전체 실행
-- ============================================================

-- ── updated_at 자동 갱신 함수 ──────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── 1. settings ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  vn_rate      NUMERIC(10,4) NOT NULL DEFAULT 17.8,
  sg_rate      NUMERIC(10,2) NOT NULL DEFAULT 1100,
  dom_ship     INTEGER       NOT NULL DEFAULT 3500,
  vn_comm      NUMERIC(6,4)  NOT NULL DEFAULT 13.64,
  vn_pg        NUMERIC(6,4)  NOT NULL DEFAULT 4.91,
  vn_ship_off  INTEGER       NOT NULL DEFAULT 15000,
  sg_comm      NUMERIC(6,4)  NOT NULL DEFAULT 15.35,
  sg_pg        NUMERIC(6,4)  NOT NULL DEFAULT 3.00,
  sg_svc       NUMERIC(6,4)  NOT NULL DEFAULT 0.80,
  sg_ship_off  NUMERIC(8,4)  NOT NULL DEFAULT 1.83,
  margin_min   NUMERIC(5,2)  NOT NULL DEFAULT 10,
  margin_nor   NUMERIC(5,2)  NOT NULL DEFAULT 20,
  margin_tgt   NUMERIC(5,2)  NOT NULL DEFAULT 30,
  UNIQUE (user_id)
);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sel_settings" ON settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ins_settings" ON settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "upd_settings" ON settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "del_settings" ON settings FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_settings_updated_at
  BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 2. crawl_items ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crawl_items (
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
  source          TEXT DEFAULT 'crawl'
);
CREATE INDEX IF NOT EXISTS idx_crawl_items_user_id    ON crawl_items(user_id);
CREATE INDEX IF NOT EXISTS idx_crawl_items_created_at ON crawl_items(created_at DESC);
ALTER TABLE crawl_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sel_crawl_items" ON crawl_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ins_crawl_items" ON crawl_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "upd_crawl_items" ON crawl_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "del_crawl_items" ON crawl_items FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_crawl_items_updated_at
  BEFORE UPDATE ON crawl_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 3. product_items ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_items (
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
  source          TEXT DEFAULT 'crawl',
  saved_at        DATE DEFAULT CURRENT_DATE
);
CREATE INDEX IF NOT EXISTS idx_product_items_user_id    ON product_items(user_id);
CREATE INDEX IF NOT EXISTS idx_product_items_created_at ON product_items(created_at DESC);
ALTER TABLE product_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sel_product_items" ON product_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ins_product_items" ON product_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "upd_product_items" ON product_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "del_product_items" ON product_items FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_product_items_updated_at
  BEFORE UPDATE ON product_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 4. calc_results ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS calc_results (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  market      TEXT NOT NULL CHECK (market IN ('VN', 'SG')),
  name        TEXT,
  cost        INTEGER NOT NULL,
  sale_price  TEXT    NOT NULL,
  weight      INTEGER,
  profit      NUMERIC(12,2),
  margin      NUMERIC(6,2),
  saved_date  DATE DEFAULT CURRENT_DATE
);
CREATE INDEX IF NOT EXISTS idx_calc_results_user_id    ON calc_results(user_id);
CREATE INDEX IF NOT EXISTS idx_calc_results_market     ON calc_results(market);
CREATE INDEX IF NOT EXISTS idx_calc_results_created_at ON calc_results(created_at DESC);
ALTER TABLE calc_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sel_calc_results" ON calc_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ins_calc_results" ON calc_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "del_calc_results" ON calc_results FOR DELETE USING (auth.uid() = user_id);

-- ── 5. crawl_jobs ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crawl_jobs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  keywords   TEXT[] NOT NULL,
  status     TEXT   NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','running','done','stopped','error')),
  total_kw   INTEGER DEFAULT 0,
  done_kw    INTEGER DEFAULT 0,
  found      INTEGER DEFAULT 0,
  error_msg  TEXT,
  started_at  TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_crawl_jobs_user_id ON crawl_jobs(user_id);
ALTER TABLE crawl_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sel_crawl_jobs" ON crawl_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ins_crawl_jobs" ON crawl_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "upd_crawl_jobs" ON crawl_jobs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "del_crawl_jobs" ON crawl_jobs FOR DELETE USING (auth.uid() = user_id);
