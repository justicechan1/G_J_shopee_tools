"""
수익 계산 비즈니스 로직 — frontend/src/utils/calc.js 포팅
"""
import math
from typing import Optional


# ── 배송비 계산 ────────────────────────────────────────────────

def vn_ship_fee(weight_g: int) -> float:
    """베트남 해외 배송비 (VND, 감면 전) — Zone A1 기준"""
    if not weight_g or weight_g <= 0:
        return 0
    if weight_g <= 50:
        return 20500
    if weight_g <= 800:
        return 20500 + math.floor((weight_g - 50) / 10) * 1100
    return 20500 + math.floor((800 - 50) / 10) * 1100 + math.floor((weight_g - 800) / 10) * 600


def sg_ship_fee(weight_g: int) -> float:
    """싱가포르 해외 배송비 (SGD, 감면 전)"""
    if not weight_g or weight_g <= 0:
        return 0
    if weight_g <= 50:
        return 2.23
    if weight_g <= 1000:
        return round(2.23 + math.floor((weight_g - 50) / 10) * 0.08, 2)
    return round(2.23 + 7.6 + math.floor((weight_g - 1000) / 100) * 0.70, 2)


# ── VN 수익 계산 ───────────────────────────────────────────────

def calc_vn(cost: float, price: float, weight: int, cfg: dict) -> dict:
    vn_rate    = cfg["vn_rate"]
    dom_ship   = cfg["dom_ship"]
    vn_comm    = cfg["vn_comm"]
    vn_pg      = cfg["vn_pg"]
    vn_ship_off = cfg["vn_ship_off"]

    ship_total  = vn_ship_fee(weight) if weight else None
    ship_seller = ship_total - vn_ship_off if ship_total is not None else None

    if not price:
        return dict(ship_total=ship_total, ship_seller=ship_seller,
                    pg=None, comm=None, settle=None, settle_krw=None,
                    profit=None, margin=None)

    pg      = round((price + vn_ship_off) * (vn_pg / 100))
    comm    = round(price * (vn_comm / 100))
    settle  = price - ship_seller - pg - comm if ship_seller is not None else None
    settle_krw = round(settle / vn_rate) if settle is not None else None
    profit  = settle_krw - cost - dom_ship if settle_krw is not None and cost else None
    margin  = profit / cost * 100 if profit is not None and cost else None

    return dict(ship_total=ship_total, ship_seller=ship_seller,
                pg=pg, comm=comm, settle=settle, settle_krw=settle_krw,
                profit=profit, margin=margin)


# ── SG 수익 계산 ───────────────────────────────────────────────

def calc_sg(cost: float, price: float, weight: int, cfg: dict) -> dict:
    sg_rate    = cfg["sg_rate"]
    dom_ship   = cfg["dom_ship"]
    sg_comm    = cfg["sg_comm"]
    sg_pg      = cfg["sg_pg"]
    sg_svc     = cfg["sg_svc"]
    sg_ship_off = cfg["sg_ship_off"]

    ship_total  = sg_ship_fee(weight) if weight else None
    ship_seller = round(ship_total - sg_ship_off, 2) if ship_total is not None else None

    if not price:
        return dict(ship_total=ship_total, ship_seller=ship_seller,
                    comm=None, pg=None, svc=None, settle=None,
                    settle_krw=None, profit=None, margin=None)

    comm    = round(price * (sg_comm / 100), 2)
    pg      = round(price * (sg_pg / 100), 2)
    svc     = round(price * (sg_svc / 100), 2)
    settle  = round(price - ship_seller - comm - pg - svc, 2) if ship_seller is not None else None
    settle_krw = round(settle * sg_rate) if settle is not None else None
    profit  = settle_krw - cost - dom_ship if settle_krw is not None and cost else None
    margin  = profit / cost * 100 if profit is not None and cost else None

    return dict(ship_total=ship_total, ship_seller=ship_seller,
                comm=comm, pg=pg, svc=svc, settle=settle,
                settle_krw=settle_krw, profit=profit, margin=margin)


# ── 판매가 역산 ────────────────────────────────────────────────

def rec_vn(cost: float, weight: int, margin_pct: float, cfg: dict) -> Optional[float]:
    if not cost or not weight:
        return None
    vn_rate     = cfg["vn_rate"]
    dom_ship    = cfg["dom_ship"]
    vn_comm     = cfg["vn_comm"]
    vn_pg       = cfg["vn_pg"]
    vn_ship_off = cfg["vn_ship_off"]
    ship_krw = (vn_ship_fee(weight) - vn_ship_off) / vn_rate
    total    = cost * (1 + margin_pct / 100) + dom_ship + ship_krw
    return round(total * vn_rate / (1 - vn_comm / 100 - vn_pg / 100))


def rec_sg(cost: float, weight: int, margin_pct: float, cfg: dict) -> Optional[float]:
    if not cost or not weight:
        return None
    sg_rate     = cfg["sg_rate"]
    dom_ship    = cfg["dom_ship"]
    sg_comm     = cfg["sg_comm"]
    sg_pg       = cfg["sg_pg"]
    sg_svc      = cfg["sg_svc"]
    sg_ship_off = cfg["sg_ship_off"]
    ship_krw = round(sg_ship_fee(weight) - sg_ship_off, 2) * sg_rate
    total    = cost * (1 + margin_pct / 100) + dom_ship + ship_krw
    return round(total / sg_rate / (1 - sg_comm / 100 - sg_pg / 100 - sg_svc / 100), 2)


# ── 기본 설정값 ────────────────────────────────────────────────

DEFAULT_CFG = {
    "vn_rate": 17.8, "sg_rate": 1100, "dom_ship": 3500,
    "vn_comm": 13.64, "vn_pg": 4.91, "vn_ship_off": 15000,
    "sg_comm": 15.35, "sg_pg": 3.00, "sg_svc": 0.80, "sg_ship_off": 1.83,
    "margin_min": 10, "margin_nor": 20, "margin_tgt": 30,
}
