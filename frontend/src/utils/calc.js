// ── 배송비 계산 ────────────────────────────────────────────────

/**
 * 베트남 해외 배송비 (VND, 감면 전)
 * Zone A1(하노이·다낭) 기준
 */
export function vnShipFee(weightG) {
  if (!weightG || weightG <= 0) return 0;
  if (weightG <= 50)  return 20500;
  if (weightG <= 800) return 20500 + Math.floor((weightG - 50) / 10) * 1100;
  return 20500 + Math.floor((800 - 50) / 10) * 1100 + Math.floor((weightG - 800) / 10) * 600;
}

/**
 * 싱가포르 해외 배송비 (SGD, 감면 전)
 * 2025.11.01 기준
 */
export function sgShipFee(weightG) {
  if (!weightG || weightG <= 0) return 0;
  if (weightG <= 50)   return 2.23;
  if (weightG <= 1000) return round2(2.23 + Math.floor((weightG - 50) / 10) * 0.08);
  return round2(2.23 + 7.6 + Math.floor((weightG - 1000) / 100) * 0.70);
}

// ── VN 수익 계산 ───────────────────────────────────────────────

/**
 * @param {object} p - { cost, price, weight, cfg }
 * cfg: { vnRate, domShip, vnComm, vnPg, vnShipOff }
 * @returns {object} 계산 결과
 */
export function calcVN({ cost, price, weight, cfg }) {
  const { vnRate, domShip, vnComm, vnPg, vnShipOff } = cfg;
  const shipTotal  = weight ? vnShipFee(weight) : null;
  const shipSeller = shipTotal != null ? shipTotal - vnShipOff : null;

  if (!price) return { shipTotal, shipSeller, pg: null, comm: null, settle: null, settleKRW: null, profit: null, margin: null };

  const pg      = Math.round((price + vnShipOff) * (vnPg / 100));
  const comm    = Math.round(price * (vnComm / 100));
  const settle  = shipSeller != null ? price - shipSeller - pg - comm : null;
  const settleKRW = settle != null ? Math.round(settle / vnRate) : null;
  const profit  = settleKRW != null && cost ? settleKRW - cost - domShip : null;
  const margin  = profit != null && cost ? profit / cost * 100 : null;

  return { shipTotal, shipSeller, pg, comm, settle, settleKRW, profit, margin };
}

// ── SG 수익 계산 ───────────────────────────────────────────────

/**
 * @param {object} p - { cost, price, weight, cfg }
 * cfg: { sgRate, domShip, sgComm, sgPg, sgSvc, sgShipOff }
 */
export function calcSG({ cost, price, weight, cfg }) {
  const { sgRate, domShip, sgComm, sgPg, sgSvc, sgShipOff } = cfg;
  const shipTotal  = weight ? sgShipFee(weight) : null;
  const shipSeller = shipTotal != null ? round2(shipTotal - sgShipOff) : null;

  if (!price) return { shipTotal, shipSeller, comm: null, pg: null, svc: null, settle: null, settleKRW: null, profit: null, margin: null };

  const comm    = round2(price * (sgComm / 100));
  const pg      = round2(price * (sgPg / 100));
  const svc     = round2(price * (sgSvc / 100));
  const settle  = shipSeller != null ? round2(price - shipSeller - comm - pg - svc) : null;
  const settleKRW = settle != null ? Math.round(settle * sgRate) : null;
  const profit  = settleKRW != null && cost ? settleKRW - cost - domShip : null;
  const margin  = profit != null && cost ? profit / cost * 100 : null;

  return { shipTotal, shipSeller, comm, pg, svc, settle, settleKRW, profit, margin };
}

// ── 판매가 역산 (추천 계산기) ──────────────────────────────────

/**
 * 목표 마진율 달성을 위한 VN 최소 판매가 (VND)
 */
export function recVN({ cost, weight, marginPct, cfg }) {
  const { vnRate, domShip, vnComm, vnPg, vnShipOff } = cfg;
  if (!cost || !weight) return null;
  const shipKRW = (vnShipFee(weight) - vnShipOff) / vnRate;
  const total   = cost * (1 + marginPct / 100) + domShip + shipKRW;
  return Math.round(total * vnRate / (1 - vnComm / 100 - vnPg / 100));
}

/**
 * 목표 마진율 달성을 위한 SG 최소 판매가 (SGD)
 */
export function recSG({ cost, weight, marginPct, cfg }) {
  const { sgRate, domShip, sgComm, sgPg, sgSvc, sgShipOff } = cfg;
  if (!cost || !weight) return null;
  const shipKRW = round2(sgShipFee(weight) - sgShipOff) * sgRate;
  const total   = cost * (1 + marginPct / 100) + domShip + shipKRW;
  return round2(total / sgRate / (1 - sgComm / 100 - sgPg / 100 - sgSvc / 100));
}

// ── 포맷 헬퍼 ─────────────────────────────────────────────────

export const fmt = {
  krw: (n) => n == null || isNaN(n) ? '—' : Math.round(n).toLocaleString('ko-KR') + '원',
  vnd: (n) => n == null || isNaN(n) ? '—' : Math.round(n).toLocaleString('ko-KR') + ' VND',
  sgd: (n) => n == null || isNaN(n) ? '—' : 'SGD ' + Number(n).toFixed(2),
  pct: (n) => n == null || isNaN(n) ? '—' : n.toFixed(1) + '%',
  num: (n) => n == null || isNaN(n) ? '—' : Number(n).toLocaleString('ko-KR'),
};

export function profitColor(profit) {
  if (profit == null) return 'var(--tx2)';
  if (profit > 0)     return 'var(--green)';
  if (profit < 0)     return 'var(--red)';
  return 'var(--yellow)';
}

export function profitStatus(profit) {
  if (profit == null) return null;
  if (profit > 0)     return 'pos';
  if (profit < 0)     return 'neg';
  return 'warn';
}

// ── 내부 유틸 ─────────────────────────────────────────────────
function round2(n) { return Math.round(n * 100) / 100; }
