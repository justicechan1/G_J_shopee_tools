const BASE_URL       = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const CRAWL_BASE_URL = import.meta.env.VITE_CRAWL_API_URL || 'http://localhost:8000';

// 동시에 여러 401이 와도 갱신은 1번만 — 나머지는 같은 Promise를 기다림
let _refreshPromise = null;

async function _doRefresh() {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    try {
      const { useStore } = await import('../store/useStore');
      const { refreshToken, user, login, logout } = useStore.getState();
      if (!refreshToken) throw new Error('refresh_token 없음');

      const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) {
        logout();
        window.location.href = '/login';
        throw new Error('토큰 갱신 실패');
      }

      const data = await res.json();
      login({ access_token: data.access_token, refresh_token: data.refresh_token, user });
      return data.access_token;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

// ────────────────────────────────────────────────────────────
//  기본 요청 헬퍼 (401 시 토큰 자동 갱신 후 1회 재시도)
// ────────────────────────────────────────────────────────────
async function request(path, options = {}, _retry = false) {
  const { token, ...rest } = options;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(rest.headers || {}),
  };
  const res = await fetch(`${BASE_URL}${path}`, { ...rest, headers });

  if (res.status === 401 && !_retry) {
    try {
      const newToken = await _doRefresh();
      return request(path, { ...options, token: newToken }, true);
    } catch { /* 갱신 실패 → 아래에서 에러 throw */ }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: '서버 오류가 발생했습니다' }));
    throw new Error(err.detail || '요청에 실패했습니다');
  }
  if (res.status === 204) return null;
  return res.json();
}

function qs(params) {
  const p = Object.entries(params).filter(([, v]) => v != null && v !== '');
  return p.length ? '?' + new URLSearchParams(p).toString() : '';
}

// ────────────────────────────────────────────────────────────
//  필드명 변환 (snake_case ↔ camelCase)
// ────────────────────────────────────────────────────────────
export function crawlItemToFE(d) {
  return {
    id:            d.id,
    keyword:       d.keyword      ?? '',
    name:          d.name         ?? '',
    orgPrice:      d.org_price    ?? '',
    salePrice:     d.sale_price   ?? '',
    image:         d.image_url    ?? '',
    detailUrl:     d.detail_url   ?? '',
    shopeeKw:      d.shopee_kw    ?? '',
    isOnePlusOne:  d.is_one_plus_one ?? false,
    bundleQty:     d.bundle_qty   ?? 1,
    unitPrice:     d.unit_price   ?? '',
    weight:        d.weight       ?? '',
    source:        d.source       ?? 'crawl',
    date:          d.created_at ? new Date(d.created_at).toLocaleDateString('ko-KR') : '',
  };
}

export function productItemToFE(d) {
  return {
    id:            d.id,
    keyword:       d.keyword      ?? '',
    name:          d.name         ?? '',
    orgPrice:      d.org_price    ?? '',
    salePrice:     d.sale_price   ?? '',
    image:         d.image_url    ?? '',
    detailUrl:     d.detail_url   ?? '',
    shopeeKw:      d.shopee_kw    ?? '',
    isOnePlusOne:  d.is_one_plus_one ?? false,
    bundleQty:     d.bundle_qty   ?? 1,
    unitPrice:     d.unit_price   ?? '',
    weight:        d.weight       ?? '',
    source:        d.source       ?? 'manual',
    savedDate:     d.saved_at || (d.created_at ? new Date(d.created_at).toLocaleDateString('ko-KR') : ''),
  };
}

export function productItemToBE(item) {
  return {
    keyword:         item.keyword    || null,
    name:            item.name,
    org_price:       item.orgPrice   || null,
    sale_price:      item.salePrice  || null,
    image_url:       item.image      || null,
    detail_url:      item.detailUrl  || null,
    shopee_kw:       item.shopeeKw   || null,
    is_one_plus_one: item.isOnePlusOne ?? false,
    bundle_qty:      Number(item.bundleQty) || 1,
    unit_price:      item.unitPrice !== '' && item.unitPrice != null ? Number(item.unitPrice) : null,
    weight:          item.weight    !== '' && item.weight    != null ? Number(item.weight)    : null,
    source:          item.source    || 'manual',
  };
}

const MKT_EMOJI = { SG: '🇸🇬 SG', VN: '🇻🇳 VN' };
const MKT_CODE  = { '🇸🇬 SG': 'SG', '🇻🇳 VN': 'VN' };

export function calcResultToFE(d) {
  return {
    id:             d.id,
    market:         MKT_EMOJI[d.market] || d.market,
    name:           d.name            ?? '',
    cost:           d.cost            ?? 0,
    price:          d.sale_price      ?? '',
    weight:         d.weight          ?? null,
    profit:         d.profit          ?? null,
    margin:         d.margin          ?? null,
    image:          d.image_url       ?? '',
    marketPrice:    d.market_price    ?? null,
    wholesalePrice: d.wholesale_price ?? null,
    date:           d.saved_date || (d.created_at ? new Date(d.created_at).toLocaleDateString('ko-KR') : ''),
  };
}

export function settingsToFE(d) {
  return {
    vnRate:    d.vn_rate,    sgRate:    d.sg_rate,
    domShip:   d.dom_ship,
    vnComm:    d.vn_comm,    vnPg:      d.vn_pg,   vnShipOff: d.vn_ship_off,
    sgComm:    d.sg_comm,    sgPg:      d.sg_pg,   sgSvc:     d.sg_svc,   sgShipOff: d.sg_ship_off,
    marginMin: d.margin_min, marginNor: d.margin_nor, marginTgt: d.margin_tgt,
  };
}

export function settingsToBE(s) {
  return {
    vn_rate: s.vnRate,   sg_rate: s.sgRate,  dom_ship: s.domShip,
    vn_comm: s.vnComm,   vn_pg:   s.vnPg,    vn_ship_off: s.vnShipOff,
    sg_comm: s.sgComm,   sg_pg:   s.sgPg,    sg_svc: s.sgSvc,  sg_ship_off: s.sgShipOff,
    margin_min: s.marginMin, margin_nor: s.marginNor, margin_tgt: s.marginTgt,
  };
}

// ────────────────────────────────────────────────────────────
//  Auth
// ────────────────────────────────────────────────────────────
export const authApi = {
  login:   (email, password) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  refresh: (refreshToken) =>
    request('/api/auth/refresh', { method: 'POST', body: JSON.stringify({ refresh_token: refreshToken }) }),
  logout:  (token) =>
    request('/api/auth/logout', { method: 'POST', token }),
};

// ────────────────────────────────────────────────────────────
//  Settings
// ────────────────────────────────────────────────────────────
export const settingsApi = {
  get:  (token) =>
    request('/api/settings', { token }),
  save: (data, token) =>
    request('/api/settings', { method: 'PUT', body: JSON.stringify(settingsToBE(data)), token }),
};

// ────────────────────────────────────────────────────────────
//  Crawl Items
// ────────────────────────────────────────────────────────────
export const crawlItemsApi = {
  list: (token, params = {}) =>
    request('/api/crawl/items' + qs(params), { token })
      .then(r => ({ total: r.total, items: r.items.map(crawlItemToFE) })),

  keywords: (token) =>
    request('/api/crawl/items/keywords', { token }),

  update: (id, data, token) => {
    const payload = {
      keyword:         data.keyword    || null,
      name:            data.name,
      org_price:       data.orgPrice   || null,
      sale_price:      data.salePrice  || null,
      image_url:       data.image      || null,
      detail_url:      data.detailUrl  || null,
      shopee_kw:       data.shopeeKw   || null,
      is_one_plus_one: data.isOnePlusOne ?? false,
      bundle_qty:      Number(data.bundleQty) || 1,
      unit_price:      data.unitPrice !== '' && data.unitPrice != null ? Number(data.unitPrice) : null,
      weight:          data.weight    !== '' && data.weight    != null ? Number(data.weight)    : null,
    };
    return request(`/api/crawl/items/${id}`, { method: 'PUT', body: JSON.stringify(payload), token })
      .then(crawlItemToFE);
  },

  delete:      (id, token) => request(`/api/crawl/items/${id}`, { method: 'DELETE', token }),
  deleteAll:   (token)     => request('/api/crawl/items',       { method: 'DELETE', token }),
  deduplicate: (token)     => request('/api/crawl/items/deduplicate', { method: 'POST', token }),
};

// ────────────────────────────────────────────────────────────
//  Crawl Jobs
// ────────────────────────────────────────────────────────────
async function crawlRequest(path, options = {}, _retry = false) {
  const { token, ...rest } = options;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(rest.headers || {}),
  };
  const res = await fetch(`${CRAWL_BASE_URL}${path}`, { ...rest, headers });

  if (res.status === 401 && !_retry) {
    try {
      const newToken = await _doRefresh();
      return crawlRequest(path, { ...options, token: newToken }, true);
    } catch { /* 갱신 실패 */ }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: '서버 오류가 발생했습니다' }));
    throw new Error(err.detail || '요청에 실패했습니다');
  }
  if (res.status === 204) return null;
  return res.json();
}

export const crawlJobsApi = {
  start:  (keywords, token) =>
    crawlRequest('/api/crawl/start', { method: 'POST', body: JSON.stringify({ keywords }), token }),
  status: (jobId, token) =>
    crawlRequest(`/api/crawl/jobs/${jobId}`, { token }),
  stop:   (jobId, token) =>
    crawlRequest(`/api/crawl/stop/${jobId}`, { method: 'POST', token }),
  list:   (token) =>
    crawlRequest('/api/crawl/jobs', { token }),
  logs:   (jobId, offset, token) =>
    crawlRequest(`/api/crawl/logs/${jobId}?offset=${offset}`, { token }),
};

// ────────────────────────────────────────────────────────────
//  Products
// ────────────────────────────────────────────────────────────
export const productsApi = {
  list: (token, params = {}) =>
    request('/api/products' + qs(params), { token })
      .then(r => ({ total: r.total, items: r.items.map(productItemToFE) })),

  create: (item, token) =>
    request('/api/products', { method: 'POST', body: JSON.stringify(productItemToBE(item)), token })
      .then(productItemToFE),

  createFromCrawl: (crawlItem, token) => {
    const be = {
      keyword:         crawlItem.keyword    || null,
      name:            crawlItem.name,
      org_price:       crawlItem.orgPrice   || null,
      sale_price:      crawlItem.salePrice  || null,
      image_url:       crawlItem.image      || null,
      detail_url:      crawlItem.detailUrl  || null,
      shopee_kw:       crawlItem.shopeeKw   || null,
      is_one_plus_one: crawlItem.isOnePlusOne ?? false,
      bundle_qty:      Number(crawlItem.bundleQty) || 1,
      unit_price:      crawlItem.unitPrice !== '' && crawlItem.unitPrice != null ? Number(crawlItem.unitPrice) : null,
      weight:          crawlItem.weight    !== '' && crawlItem.weight    != null ? Number(crawlItem.weight)    : null,
      source:          'crawl',
    };
    return request('/api/products', { method: 'POST', body: JSON.stringify(be), token })
      .then(productItemToFE);
  },

  update: (id, data, token) =>
    request(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(productItemToBE(data)), token })
      .then(productItemToFE),

  delete:      (id, token) => request(`/api/products/${id}`, { method: 'DELETE', token }),
  deleteAll:   (token)     => request('/api/products',       { method: 'DELETE', token }),
  deduplicate: (token)     => request('/api/products/deduplicate', { method: 'POST', token }),
};

// ────────────────────────────────────────────────────────────
//  Calc Results
// ────────────────────────────────────────────────────────────
export const calcResultsApi = {
  list: (token, params = {}) =>
    request('/api/calc/results' + qs(params), { token })
      .then(r => ({ total: r.total, items: r.items.map(calcResultToFE) })),

  create: (item, token) => {
    const payload = {
      market:     MKT_CODE[item.market] || item.market,
      name:       item.name    || null,
      cost:       Math.round(Number(item.cost)),
      sale_price: item.price,
      weight:     item.weight ? Number(item.weight) : null,
      profit:     item.profit ?? null,
      margin:     item.margin ?? null,
    };
    return request('/api/calc/results', { method: 'POST', body: JSON.stringify(payload), token })
      .then(calcResultToFE);
  },

  update: (id, data, token) => {
    const payload = {
      name:            data.name            || null,
      cost:            data.cost    != null ? Number(data.cost)    : null,
      sale_price:      data.price           || null,
      weight:          data.weight  != null ? Number(data.weight)  : null,
      image_url:       data.image           || null,
      market_price:    data.marketPrice    != null ? Number(data.marketPrice)    : null,
      wholesale_price: data.wholesalePrice != null ? Number(data.wholesalePrice) : null,
    };
    return request(`/api/calc/results/${id}`, { method: 'PUT', body: JSON.stringify(payload), token })
      .then(calcResultToFE);
  },
  delete:      (id, token)     => request(`/api/calc/results/${id}`, { method: 'DELETE', token }),
  deleteAll:   (token, market) => request('/api/calc/results' + qs({ market }), { method: 'DELETE', token }),
  deduplicate: (token)         => request('/api/calc/results/deduplicate', { method: 'POST', token }),
};
