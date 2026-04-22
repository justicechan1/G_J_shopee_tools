import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { calcResultsApi } from '../../utils/api';
import { calcVN, fmt, profitColor, profitStatus, vnShipFee } from '../../utils/calc';
import PageHeader from '../../components/PageHeader';
import {
  Card, CardTitle, Field, Metric, DetailRow, Badge,
  Button, Divider, Notice, TwoCol, ThreeCol,
} from '../../components/UI';
import styles from './Calculator.module.css';

export default function VNCalc() {
  const cfg = useStore((s) => ({
    vnRate: s.vnRate, domShip: s.domShip,
    vnComm: s.vnComm, vnPg: s.vnPg, vnShipOff: s.vnShipOff,
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
      if (calcSeed.price  != null) setPrice(String(Math.round(calcSeed.price)));
      clearCalcSeed();
    }
  }, []);

  const result = calcVN({
    cost:   Number(cost)   || 0,
    price:  Number(price)  || 0,
    weight: Number(weight) || 0,
    cfg,
  });

  const { shipTotal, shipSeller, pg, comm, settle, settleKRW, profit, margin } = result;
  const status = profitStatus(profit);

  async function handleSave() {
    if (!cost || !price || !weight) return;
    try {
      await calcResultsApi.create({
        market: '🇻🇳 VN',
        name,
        cost:   Number(cost),
        price:  `${Math.round(Number(price)).toLocaleString('ko-KR')} VND`,
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
        title="VN 수익 계산기"
        sub="베트남 수익 계산"
        badge={`판매수수료 ${cfg.vnComm}% + PG ${cfg.vnPg}%`}
      />
      <div className={styles.pageWrap}>
        <TwoCol>
          {/* 입력 카드 */}
          <Card>
            <CardTitle>입력값</CardTitle>
            <Field label="상품명">
              <input type="text" placeholder="예) 라운드랩 선크림 50ml" value={name} onChange={e => setName(e.target.value)} />
            </Field>
            <Field label="한국 구매 원가" unit="원">
              <input type="number" placeholder="9000" value={cost} onChange={e => setCost(e.target.value)} />
            </Field>
            <Field label="쇼피 판매가" unit="VND">
              <input type="number" placeholder="355680" value={price} onChange={e => setPrice(e.target.value)} />
            </Field>
            <Field label="상품 중량" unit="g">
              <input type="number" placeholder="250" value={weight} onChange={e => setWeight(e.target.value)} />
            </Field>
            <Divider />
            <div className={styles.cfgInfo}>
              <span className={styles.cfgItem}>
                <span className={styles.cfgKey}>환율</span>
                <span className={styles.cfgVal}>{cfg.vnRate} 원/VND</span>
              </span>
              <span className={styles.cfgItem}>
                <span className={styles.cfgKey}>택배비</span>
                <span className={styles.cfgVal}>{cfg.domShip.toLocaleString('ko-KR')} 원</span>
              </span>
            </div>
            <div className={styles.cfgNote}>환율·택배비는 환경설정 → 환율 설정에서 변경</div>
          </Card>

          {/* 결과 카드 */}
          <div>
            <Card>
              <CardTitle>예상 결과</CardTitle>
              <ThreeCol>
                <Metric
                  label="순이익"
                  value={profit != null ? fmt.krw(profit) : '—'}
                  color={profitColor(profit)}
                  mono
                />
                <Metric
                  label="마진율"
                  value={margin != null ? fmt.pct(margin) : '—'}
                  color={profitColor(profit)}
                  mono
                />
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
              <DetailRow label="해외 배송비 (감면 전)"       value={fmt.vnd(shipTotal)} />
              <DetailRow label="고객 부담 (고정 감면)"        value={`${cfg.vnShipOff.toLocaleString('ko-KR')} VND`} />
              <DetailRow label="판매자 실부담 배송비"         value={fmt.vnd(shipSeller)} highlight />

              <Divider />
              <CardTitle>수수료 내역</CardTitle>
              <DetailRow label={`PG 수수료 (${cfg.vnPg}%)`}   value={fmt.vnd(pg)} />
              <DetailRow label={`판매 수수료 (${cfg.vnComm}%)`} value={fmt.vnd(comm)} />

              <Divider />
              <DetailRow label="정산 수령액"       value={fmt.vnd(settle)} />
              <DetailRow label="정산 수령액 (원화)" value={fmt.krw(settleKRW)} highlight />
            </Card>

            <div className={styles.saveRow}>
              {saved && <span className={styles.savedMsg}>저장되었습니다</span>}
              <Button variant="primary" onClick={handleSave} disabled={!cost || !price || !weight}>
                저장하기
              </Button>
            </div>
            <Notice>
              ※ Zone A1(하노이·다낭) 배송 기준<br />
              ※ 페이오니아 인출 수수료(1.2%) 미포함
            </Notice>
          </div>
        </TwoCol>
      </div>
    </>
  );
}
