import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { recVN, recSG, vnShipFee, sgShipFee, fmt } from '../../utils/calc';
import PageHeader from '../../components/PageHeader';
import { Card, CardTitle, Field, DetailRow, Divider, Notice, TwoCol, Button } from '../../components/UI';
import styles from './Calculator.module.css';

const BADGE_STYLE = {
  min: { bg: 'var(--blue-soft)', color: 'var(--blue)', border: 'var(--blue-bd)' },
  nor: { bg: 'var(--green-soft)', color: 'var(--green)', border: 'var(--green-bd)' },
  tgt: { bg: 'var(--ac-soft)', color: 'var(--ac)', border: '#7c2d12' },
};

function RecBadge({ type, children }) {
  const s = BADGE_STYLE[type];
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: 4, fontSize: 10, padding: '1px 7px', fontWeight: 500,
    }}>
      {children}
    </span>
  );
}

export default function RecCalc() {
  const cfg = useStore((s) => ({
    vnRate: s.vnRate, sgRate: s.sgRate, domShip: s.domShip,
    vnComm: s.vnComm, vnPg: s.vnPg, vnShipOff: s.vnShipOff,
    sgComm: s.sgComm, sgPg: s.sgPg, sgSvc: s.sgSvc, sgShipOff: s.sgShipOff,
    marginMin: s.marginMin, marginNor: s.marginNor, marginTgt: s.marginTgt,
  }));
  const { recSeed, clearRecSeed, setCalcSeed } = useStore((s) => ({
    recSeed: s.recSeed, clearRecSeed: s.clearRecSeed, setCalcSeed: s.setCalcSeed,
  }));
  const navigate = useNavigate();

  const [name,   setName]   = useState('');
  const [cost,   setCost]   = useState('');
  const [weight, setWeight] = useState('');
  const [market, setMarket] = useState('sg');
  const [tier,   setTier]   = useState('nor');

  useEffect(() => {
    if (recSeed) {
      if (recSeed.name   != null) setName(recSeed.name);
      if (recSeed.cost   != null) setCost(String(recSeed.cost));
      if (recSeed.weight != null) setWeight(String(recSeed.weight));
      clearRecSeed();
    }
  }, []);

  const c = Number(cost)   || 0;
  const w = Number(weight) || 0;

  const rows = [
    { type: 'min', label: `최소 ${cfg.marginMin}%`, pct: cfg.marginMin },
    { type: 'nor', label: `적정 ${cfg.marginNor}%`, pct: cfg.marginNor },
    { type: 'tgt', label: `목표 ${cfg.marginTgt}%`, pct: cfg.marginTgt },
  ];

  const vnShip = w ? vnShipFee(w) : null;
  const sgShip = w ? sgShipFee(w) : null;

  const selectedRow = rows.find(r => r.type === tier);
  const recPrice = selectedRow
    ? market === 'sg'
      ? recSG({ cost: c, weight: w, marginPct: selectedRow.pct, cfg })
      : recVN({ cost: c, weight: w, marginPct: selectedRow.pct, cfg })
    : null;

  function handleGoCalc() {
    if (!c || !w || !recPrice) return;
    setCalcSeed({ name, cost: c, weight: w, price: recPrice });
    navigate(market === 'sg' ? '/calc/sg' : '/calc/vn');
  }

  return (
    <>
      <PageHeader
        title="판매가 추천"
        sub="마진율 역산 계산기"
        badge="환경설정 값 자동 적용"
      />
      <div className={styles.pageWrap}>
        <TwoCol>
          {/* 입력 */}
          <div>
            <Card>
              <CardTitle>입력값</CardTitle>
              <Field label="상품명">
                <input type="text" placeholder="예) 라운드랩 선크림 50ml" value={name} onChange={e => setName(e.target.value)} />
              </Field>
              <Field label="한국 구매 원가" unit="원">
                <input type="number" placeholder="9000" value={cost} onChange={e => setCost(e.target.value)} />
              </Field>
              <Field label="상품 중량" unit="g">
                <input type="number" placeholder="250" value={weight} onChange={e => setWeight(e.target.value)} />
              </Field>
              <Divider />
              <div className={styles.cfgNote} style={{ lineHeight: 1.8 }}>
                환율·수수료·택배비는<br />환경설정 값이 자동 적용됩니다
              </div>
            </Card>

            <Card>
              <CardTitle>배송비 정보</CardTitle>
              <DetailRow label="🇻🇳 VN 배송비 (감면 전)"  value={vnShip != null ? fmt.vnd(vnShip) : '—'} />
              <DetailRow label="VN 판매자 실부담"          value={vnShip != null ? fmt.vnd(vnShip - cfg.vnShipOff) : '—'} />
              <DetailRow label="🇸🇬 SG 배송비 (감면 전)"  value={sgShip != null ? fmt.sgd(sgShip) : '—'} />
              <DetailRow label="SG 판매자 실부담"          value={sgShip != null ? fmt.sgd(Math.round((sgShip - cfg.sgShipOff) * 100) / 100) : '—'} />
            </Card>
          </div>

          {/* 결과 */}
          <div>
            <Card>
              <CardTitle>
                마진율별 추천 판매가
                {name && <span style={{ marginLeft: 8, fontWeight: 400, color: 'var(--tx2)', textTransform: 'none', letterSpacing: 0 }}>— {name}</span>}
              </CardTitle>
              <table className={styles.recTable}>
                <thead>
                  <tr>
                    <th>마진율</th>
                    <th>🇻🇳 VN 추천가</th>
                    <th>🇸🇬 SG 추천가</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const vn = recVN({ cost: c, weight: w, marginPct: row.pct, cfg });
                    const sg = recSG({ cost: c, weight: w, marginPct: row.pct, cfg });
                    return (
                      <tr key={row.type}>
                        <td><RecBadge type={row.type}>{row.label}</RecBadge></td>
                        <td className={styles.mono}>{vn ? `${Math.round(vn).toLocaleString('ko-KR')} VND` : '—'}</td>
                        <td className={styles.mono}>{sg ? `SGD ${sg.toFixed(2)}` : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <Notice>
                ※ 수수료·배송비를 역산한 최소 등록가입니다<br />
                ※ 실제 등록 시 경쟁가 참고 후 조정하세요
              </Notice>
            </Card>

            {/* 수익 계산 이동 */}
            <Card>
              <CardTitle>수익 계산하기</CardTitle>
              <div className={styles.goCalcWrap}>
                {/* 시장 선택 */}
                <div className={styles.goCalcRow}>
                  <span className={styles.goCalcLabel}>시장</span>
                  <div className={styles.segmented}>
                    <button
                      className={`${styles.seg} ${market === 'sg' ? styles.segActive : ''}`}
                      onClick={() => setMarket('sg')}
                    >
                      🇸🇬 SG
                    </button>
                    <button
                      className={`${styles.seg} ${market === 'vn' ? styles.segActive : ''}`}
                      onClick={() => setMarket('vn')}
                    >
                      🇻🇳 VN
                    </button>
                  </div>
                </div>

                {/* 마진율 선택 */}
                <div className={styles.goCalcRow}>
                  <span className={styles.goCalcLabel}>마진율</span>
                  <div className={styles.segmented}>
                    {rows.map(r => (
                      <button
                        key={r.type}
                        className={`${styles.seg} ${tier === r.type ? styles.segActive : ''}`}
                        onClick={() => setTier(r.type)}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 선택된 추천가 미리보기 */}
                {recPrice && (
                  <div className={styles.goCalcPreview}>
                    <span className={styles.goCalcPreviewLabel}>적용 판매가</span>
                    <span className={styles.goCalcPreviewVal}>
                      {market === 'sg'
                        ? `SGD ${recPrice.toFixed(2)}`
                        : `${Math.round(recPrice).toLocaleString('ko-KR')} VND`}
                    </span>
                  </div>
                )}

                <Button
                  variant="primary"
                  full
                  onClick={handleGoCalc}
                  disabled={!c || !w}
                >
                  {market === 'sg' ? '🇸🇬 SG' : '🇻🇳 VN'} 수익 계산하기
                </Button>
              </div>
            </Card>
          </div>
        </TwoCol>
      </div>
    </>
  );
}
