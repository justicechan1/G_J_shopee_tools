import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { settingsApi, settingsToFE } from '../../utils/api';
import PageHeader from '../../components/PageHeader';
import { Card, CardTitle, SettingRow, Metric, DetailRow, Divider, Notice, TwoCol, ThreeCol, Button } from '../../components/UI';
import styles from './Settings.module.css';

// ── 마진 설정 ─────────────────────────────────────────────────
export function MarginSettings() {
  const { marginMin, marginNor, marginTgt, setMargins, token } = useStore();
  const [min, setMin] = useState(marginMin);
  const [nor, setNor] = useState(marginNor);
  const [tgt, setTgt] = useState(marginTgt);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!token) return;
    settingsApi.get(token).then(d => {
      const fe = settingsToFE(d);
      setMin(fe.marginMin); setNor(fe.marginNor); setTgt(fe.marginTgt);
      setMargins({ marginMin: fe.marginMin, marginNor: fe.marginNor, marginTgt: fe.marginTgt });
    }).catch(() => {});
  }, []);

  async function handleSave() {
    const vals = { marginMin: Number(min), marginNor: Number(nor), marginTgt: Number(tgt) };
    setMargins(vals);
    if (token) {
      const store = useStore.getState();
      await settingsApi.save({ ...store, ...vals }, token).catch(() => {});
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <>
      <PageHeader title="마진 설정" sub="마진율 기준 설정" badge="최소·적정·목표" />
      <div className={styles.pageWrap}>
        <TwoCol>
          <Card>
            <CardTitle>마진율 기준</CardTitle>
            <SettingRow
              label="최소 마진율"
              desc="이 이하면 판매 비추천"
              unit="%"
              inputProps={{ type: 'number', value: min, onChange: e => { setMin(e.target.value); setSaved(false); } }}
            />
            <SettingRow
              label="적정 마진율"
              desc="일반적인 목표 마진"
              unit="%"
              inputProps={{ type: 'number', value: nor, onChange: e => { setNor(e.target.value); setSaved(false); } }}
            />
            <SettingRow
              label="목표 마진율"
              desc="최고 목표 마진"
              unit="%"
              inputProps={{ type: 'number', value: tgt, onChange: e => { setTgt(e.target.value); setSaved(false); } }}
            />
            <div className={styles.saveRow}>
              <Button variant="primary" onClick={handleSave}>
                {saved ? '✓ 저장됨' : '저장'}
              </Button>
            </div>
          </Card>

          <Card>
            <CardTitle>현재 설정 미리보기</CardTitle>
            <ThreeCol>
              <Metric label="최소" value={`${min}%`} color="var(--blue)" mono />
              <Metric label="적정" value={`${nor}%`} color="var(--green)" mono />
              <Metric label="목표" value={`${tgt}%`} color="var(--ac)" mono />
            </ThreeCol>
            <Notice>판매가 추천 계산기의 마진율 기준으로 사용됩니다</Notice>
          </Card>
        </TwoCol>
      </div>
    </>
  );
}

// ── 환율 설정 ─────────────────────────────────────────────────
export function RateSettings() {
  const { vnRate, sgRate, domShip, setRates, token } = useStore();
  const [vn,  setVn]  = useState(vnRate);
  const [sg,  setSg]  = useState(sgRate);
  const [dom, setDom] = useState(domShip);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!token) return;
    settingsApi.get(token).then(d => {
      const fe = settingsToFE(d);
      setVn(fe.vnRate); setSg(fe.sgRate); setDom(fe.domShip);
      setRates({ vnRate: fe.vnRate, sgRate: fe.sgRate, domShip: fe.domShip });
    }).catch(() => {});
  }, []);

  async function handleSave() {
    const vals = { vnRate: Number(vn), sgRate: Number(sg), domShip: Number(dom) };
    setRates(vals);
    if (token) {
      const store = useStore.getState();
      await settingsApi.save({ ...store, ...vals }, token).catch(() => {});
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <>
      <PageHeader title="환율 설정" sub="환율 및 기본값" badge="계산기 전체 적용" />
      <div className={styles.pageWrap}>
        <TwoCol>
          <Card>
            <CardTitle>환율 및 기본값</CardTitle>
            <SettingRow
              label="VND 환율"
              desc="1 VND = ? 원"
              unit="원"
              inputProps={{ type: 'number', step: '0.1', value: vn, onChange: e => { setVn(e.target.value); setSaved(false); } }}
            />
            <SettingRow
              label="SGD 환율"
              desc="1 SGD = ? 원"
              unit="원"
              inputProps={{ type: 'number', value: sg, onChange: e => { setSg(e.target.value); setSaved(false); } }}
            />
            <SettingRow
              label="국내 택배비"
              desc="김포 집하지까지 택배비"
              unit="원"
              inputProps={{ type: 'number', value: dom, onChange: e => { setDom(e.target.value); setSaved(false); } }}
            />
            <div className={styles.saveRow}>
              <Button variant="primary" onClick={handleSave}>
                {saved ? '✓ 저장 및 적용됨' : '저장 및 적용'}
              </Button>
            </div>
          </Card>

          <Card>
            <CardTitle>현재 적용값</CardTitle>
            <DetailRow label="VND 환율"   value={`${Number(vn).toLocaleString('ko-KR')} 원/VND`} />
            <DetailRow label="SGD 환율"   value={`${Number(sg).toLocaleString('ko-KR')} 원/SGD`} />
            <DetailRow label="국내 택배비" value={`${Number(dom).toLocaleString('ko-KR')} 원`} />
            <Notice>저장 시 VN·SG 계산기, 판매가 추천에 즉시 반영됩니다</Notice>
          </Card>
        </TwoCol>
      </div>
    </>
  );
}

// ── 수수료 설정 ───────────────────────────────────────────────
export function FeeSettings() {
  const store = useStore();
  const token = store.token;
  const [vnComm,    setVnComm]    = useState(store.vnComm);
  const [vnPg,      setVnPg]      = useState(store.vnPg);
  const [vnShipOff, setVnShipOff] = useState(store.vnShipOff);
  const [sgComm,    setSgComm]    = useState(store.sgComm);
  const [sgPg,      setSgPg]      = useState(store.sgPg);
  const [sgSvc,     setSgSvc]     = useState(store.sgSvc);
  const [sgShipOff, setSgShipOff] = useState(store.sgShipOff);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!token) return;
    settingsApi.get(token).then(d => {
      const fe = settingsToFE(d);
      setVnComm(fe.vnComm); setVnPg(fe.vnPg); setVnShipOff(fe.vnShipOff);
      setSgComm(fe.sgComm); setSgPg(fe.sgPg); setSgSvc(fe.sgSvc); setSgShipOff(fe.sgShipOff);
      store.setFees({ vnComm: fe.vnComm, vnPg: fe.vnPg, vnShipOff: fe.vnShipOff,
        sgComm: fe.sgComm, sgPg: fe.sgPg, sgSvc: fe.sgSvc, sgShipOff: fe.sgShipOff });
    }).catch(() => {});
  }, []);

  async function handleSave() {
    const vals = {
      vnComm: Number(vnComm), vnPg: Number(vnPg), vnShipOff: Number(vnShipOff),
      sgComm: Number(sgComm), sgPg: Number(sgPg), sgSvc: Number(sgSvc), sgShipOff: Number(sgShipOff),
    };
    store.setFees(vals);
    if (token) {
      const s = useStore.getState();
      await settingsApi.save({ ...s, ...vals }, token).catch(() => {});
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const vnTotal = (Number(vnComm) + Number(vnPg)).toFixed(2);
  const sgTotal = (Number(sgComm) + Number(sgPg) + Number(sgSvc)).toFixed(2);

  return (
    <>
      <PageHeader title="수수료 설정" sub="VN·SG 수수료 설정" badge="쇼피 정책 반영" />
      <div className={styles.pageWrap}>
        <TwoCol>
          <div>
            <Card>
              <CardTitle>🇻🇳 베트남 수수료</CardTitle>
              <SettingRow label="판매 수수료" desc="Commission fee (VN)" unit="%"
                inputProps={{ type:'number', step:'0.01', value: vnComm, onChange: e => { setVnComm(e.target.value); setSaved(false); } }} />
              <SettingRow label="PG 수수료" desc="Payment Gateway (VN)" unit="%"
                inputProps={{ type:'number', step:'0.01', value: vnPg, onChange: e => { setVnPg(e.target.value); setSaved(false); } }} />
              <SettingRow label="고객 배송비 감면" desc="Zone A1 고정 감면액" unit="VND"
                inputProps={{ type:'number', value: vnShipOff, onChange: e => { setVnShipOff(e.target.value); setSaved(false); } }} />
            </Card>

            <Card>
              <CardTitle>🇸🇬 싱가포르 수수료</CardTitle>
              <SettingRow label="판매 수수료" desc="Commission fee - SLS" unit="%"
                inputProps={{ type:'number', step:'0.01', value: sgComm, onChange: e => { setSgComm(e.target.value); setSaved(false); } }} />
              <SettingRow label="PG 수수료" desc="Payment Gateway (SG)" unit="%"
                inputProps={{ type:'number', step:'0.01', value: sgPg, onChange: e => { setSgPg(e.target.value); setSaved(false); } }} />
              <SettingRow label="서비스 수수료" desc="Service fee" unit="%"
                inputProps={{ type:'number', step:'0.01', value: sgSvc, onChange: e => { setSgSvc(e.target.value); setSaved(false); } }} />
              <SettingRow label="고객 배송비 감면" desc="SG 고정 감면액" unit="SGD"
                inputProps={{ type:'number', step:'0.01', value: sgShipOff, onChange: e => { setSgShipOff(e.target.value); setSaved(false); } }} />
            </Card>

            <div className={styles.saveRow}>
              <Button variant="primary" onClick={handleSave}>
                {saved ? '✓ 저장 및 적용됨' : '저장 및 적용'}
              </Button>
            </div>
          </div>

          <div>
            <Card>
              <CardTitle>🇻🇳 VN 합산 수수료율</CardTitle>
              <Metric label="총 수수료율" value={`${vnTotal}%`} color="var(--ac)" mono />
              <div style={{ marginTop: '.75rem' }}>
                <DetailRow label="판매 수수료" value={`${Number(vnComm).toFixed(2)}%`} />
                <DetailRow label="PG 수수료"   value={`${Number(vnPg).toFixed(2)}%`} />
              </div>
            </Card>

            <Card>
              <CardTitle>🇸🇬 SG 합산 수수료율</CardTitle>
              <Metric label="총 수수료율" value={`${sgTotal}%`} color="var(--ac)" mono />
              <div style={{ marginTop: '.75rem' }}>
                <DetailRow label="판매 수수료"   value={`${Number(sgComm).toFixed(2)}%`} />
                <DetailRow label="PG 수수료"     value={`${Number(sgPg).toFixed(2)}%`} />
                <DetailRow label="서비스 수수료" value={`${Number(sgSvc).toFixed(2)}%`} />
              </div>
            </Card>

            <Notice>
              ※ 쇼피 정책 변경 시 여기서 직접 수정하세요<br />
              ※ 저장 시 모든 계산기에 즉시 반영됩니다
            </Notice>
          </div>
        </TwoCol>
      </div>
    </>
  );
}
