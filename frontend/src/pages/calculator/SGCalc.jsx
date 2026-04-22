import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { calcResultsApi } from '../../utils/api';
import { calcSG, fmt, profitColor, profitStatus } from '../../utils/calc';
import PageHeader from '../../components/PageHeader';
import {
  Card, CardTitle, Field, Metric, DetailRow, Badge,
  Button, Divider, Notice, TwoCol, ThreeCol,
} from '../../components/UI';
import styles from './Calculator.module.css';

export default function SGCalc() {
  const cfg = useStore((s) => ({
    sgRate: s.sgRate, domShip: s.domShip,
    sgComm: s.sgComm, sgPg: s.sgPg, sgSvc: s.sgSvc, sgShipOff: s.sgShipOff,
  }));
  const token = useStore((s) => s.token);
  const { calcSeed, clearCalcSeed } = useStore((s) => ({ calcSeed: s.calcSeed, clearCalcSeed: s.clearCalcSeed }));

  const [name,   setName]   = useState('');
  const [cost,   setCost]   = useState('');
  const [price,  setPrice]  = useState('');
  const [weight, setWeight] = useState('');
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    if (calcSeed) {
      if (calcSeed.name   != null) setName(calcSeed.name);
      if (calcSeed.cost   != null) setCost(String(calcSeed.cost));
      if (calcSeed.weight != null) setWeight(String(calcSeed.weight));
      if (calcSeed.price  != null) setPrice(String(calcSeed.price.toFixed(2)));
      clearCalcSeed();
    }
  }, []);

  const result = calcSG({
    cost:   Number(cost)   || 0,
    price:  Number(price)  || 0,
    weight: Number(weight) || 0,
    cfg,
  });

  const { shipTotal, shipSeller, comm, pg, svc, settle, settleKRW, profit, margin } = result;
  const status = profitStatus(profit);

  async function handleSave() {
    if (!cost || !price || !weight) return;
    try {
      await calcResultsApi.create({
        market: '🇸🇬 SG',
        name,
        cost:   Number(cost),
        price:  `SGD ${Number(price).toFixed(2)}`,
        weight: Number(weight),
        profit,
        margin,
      }, token);
    } catch { /* 백엔드 미연결 시 무시 */ }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <>
      <PageHeader
        title="SG 수익 계산기"
        sub="싱가포르 수익 계산"
        badge={`판매수수료 ${cfg.sgComm}% + PG ${cfg.sgPg}% + 서비스 ${cfg.sgSvc}%`}
      />
      <div className={styles.pageWrap}>
        <TwoCol>
          <Card>
            <CardTitle>입력값</CardTitle>
            <Field label="상품명">
              <input type="text" placeholder="예) 넘버즈인 선크림 50ml" value={name} onChange={e => setName(e.target.value)} />
            </Field>
            <Field label="한국 구매 원가" unit="원">
              <input type="number" placeholder="9000" value={cost} onChange={e => setCost(e.target.value)} />
            </Field>
            <Field label="쇼피 판매가" unit="SGD">
              <input type="number" placeholder="12.90" step="0.01" value={price} onChange={e => setPrice(e.target.value)} />
            </Field>
            <Field label="상품 중량" unit="g">
              <input type="number" placeholder="250" value={weight} onChange={e => setWeight(e.target.value)} />
            </Field>
            <Divider />
            <div className={styles.cfgInfo}>
              <span className={styles.cfgItem}>
                <span className={styles.cfgKey}>환율</span>
                <span className={styles.cfgVal}>{cfg.sgRate.toLocaleString('ko-KR')} 원/SGD</span>
              </span>
              <span className={styles.cfgItem}>
                <span className={styles.cfgKey}>택배비</span>
                <span className={styles.cfgVal}>{cfg.domShip.toLocaleString('ko-KR')} 원</span>
              </span>
            </div>
            <div className={styles.cfgNote}>환율·택배비는 환경설정 → 환율 설정에서 변경</div>
          </Card>

          <div>
            <Card>
              <CardTitle>예상 결과</CardTitle>
              <ThreeCol>
                <Metric label="순이익" value={profit != null ? fmt.krw(profit) : '—'} color={profitColor(profit)} mono />
                <Metric label="마진율" value={margin != null ? fmt.pct(margin) : '—'} color={profitColor(profit)} mono />
                <div className={styles.metricStatus}>
                  <div className={styles.metricStatusLabel}>상태</div>
                  {status
                    ? <Badge status={status}>{status === 'pos' ? '흑자' : status === 'neg' ? '적자' : '손익분기'}</Badge>
                    : <Badge status="neu">대기</Badge>
                  }
                </div>
              </ThreeCol>

              <Divider />
              <CardTitle>배송비 내역</CardTitle>
              <DetailRow label="해외 배송비 (감면 전)"    value={fmt.sgd(shipTotal)} />
              <DetailRow label="고객 부담 (고정 감면)"     value={`SGD ${cfg.sgShipOff}`} />
              <DetailRow label="판매자 실부담 배송비"      value={fmt.sgd(shipSeller)} highlight />

              <Divider />
              <CardTitle>수수료 내역</CardTitle>
              <DetailRow label={`판매 수수료 (${cfg.sgComm}%)`} value={fmt.sgd(comm)} />
              <DetailRow label={`PG 수수료 (${cfg.sgPg}%)`}     value={fmt.sgd(pg)} />
              <DetailRow label={`서비스 수수료 (${cfg.sgSvc}%)`} value={fmt.sgd(svc)} />

              <Divider />
              <DetailRow label="정산 수령액"       value={fmt.sgd(settle)} />
              <DetailRow label="정산 수령액 (원화)" value={fmt.krw(settleKRW)} highlight />
            </Card>

            <div className={styles.saveRow}>
              {saved && <span className={styles.savedMsg}>저장되었습니다</span>}
              <Button variant="primary" onClick={handleSave} disabled={!cost || !price || !weight}>
                저장하기
              </Button>
            </div>
            <Notice>
              ※ 2025.11.01 기준<br />
              ※ 페이오니아 인출 수수료(1.2%) 미포함
            </Notice>
          </div>
        </TwoCol>
      </div>
    </>
  );
}
