import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { productsApi } from '../../utils/api';
import PageHeader from '../../components/PageHeader';
import { Card, CardTitle, Button, Divider, Notice } from '../../components/UI';
import styles from './ManualTool.module.css';

const EMPTY = {
  keyword: '', name: '', orgPrice: '', salePrice: '',
  image: '', detailUrl: '', shopeeKw: '',
  isOnePlusOne: false, bundleQty: 1, unitPrice: '', weight: '',
};

function Field({ label, required, children, hint }) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      {children}
      {hint && <div className={styles.hint}>{hint}</div>}
    </div>
  );
}

export default function ManualTool() {
  const token = useStore((s) => s.token);

  const [form,    setForm]    = useState({ ...EMPTY });
  const [saved,   setSaved]   = useState(false);
  const [errors,  setErrors]  = useState({});
  const [history, setHistory] = useState([]);

  function set(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: false }));
  }

  function validate() {
    const e = {};
    if (!form.name.trim())      e.name      = '상품명은 필수입니다';
    if (!form.salePrice.trim()) e.salePrice = '할인 후 가격은 필수입니다';
    if (!form.weight)           e.weight    = '추정중량은 필수입니다';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    const item = {
      ...form,
      bundleQty: Number(form.bundleQty) || 1,
      unitPrice: form.unitPrice !== '' ? Number(form.unitPrice) : '',
      weight:    Number(form.weight),
      savedDate: new Date().toLocaleDateString('ko-KR'),
    };
    try {
      await productsApi.create(item, token);
    } catch { /* 백엔드 미연결 시 무시 */ }
    setHistory(prev => [item, ...prev]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setForm({ ...EMPTY });
    setErrors({});
  }

  function handleReset() {
    setForm({ ...EMPTY });
    setErrors({});
  }

  function fillFromHistory(item) {
    const { savedDate, ...rest } = item;
    setForm({ ...EMPTY, ...rest });
    setErrors({});
  }

  return (
    <>
      <PageHeader title="수동 상품 등록" sub="직접 입력하여 저장된 상품에 추가" badge="도구" />
      <div className={styles.pageWrap}>
        <div className={styles.twoCol}>

          {/* 좌: 입력 폼 */}
          <div>
            {/* 기본 정보 */}
            <Card>
              <CardTitle>기본 정보</CardTitle>
              <Field label="상품명" required hint="쇼피에 등록할 상품 이름">
                <input
                  type="text"
                  placeholder="예) 라운드랩 자작나무 수분 선크림 50ml"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  className={errors.name ? styles.inputErr : ''}
                />
                {errors.name && <div className={styles.errMsg}>{errors.name}</div>}
              </Field>

              <Field label="검색어" hint="올리브영 검색 시 사용한 키워드">
                <input
                  type="text"
                  placeholder="예) 라운드랩 선크림"
                  value={form.keyword}
                  onChange={e => set('keyword', e.target.value)}
                />
              </Field>

              <Field label="쇼피 검색어(영문)" hint="쇼피 플랫폼에서 사용할 영문 키워드">
                <input
                  type="text"
                  placeholder="예) Roundlab Birch Sunscreen SPF50"
                  value={form.shopeeKw}
                  onChange={e => set('shopeeKw', e.target.value)}
                />
              </Field>
            </Card>

            {/* 가격 정보 */}
            <Card>
              <CardTitle>가격 정보</CardTitle>
              <div className={styles.row2}>
                <Field label="할인 전 가격" hint="정가 (원)">
                  <input
                    type="text"
                    placeholder="예) 22,000원"
                    value={form.orgPrice}
                    onChange={e => set('orgPrice', e.target.value)}
                  />
                </Field>
                <Field label="할인 후 가격" required hint="실제 구매 가격">
                  <input
                    type="text"
                    placeholder="예) 19,900원"
                    value={form.salePrice}
                    onChange={e => set('salePrice', e.target.value)}
                    className={errors.salePrice ? styles.inputErr : ''}
                  />
                  {errors.salePrice && <div className={styles.errMsg}>{errors.salePrice}</div>}
                </Field>
              </div>

              <Divider />

              <div className={styles.row3}>
                <Field label="1+1 여부">
                  <div className={styles.checkRow}>
                    <input
                      type="checkbox"
                      id="opo"
                      checked={form.isOnePlusOne}
                      onChange={e => set('isOnePlusOne', e.target.checked)}
                      className={styles.checkbox}
                    />
                    <label htmlFor="opo" className={styles.checkLabel}>1+1 행사 상품</label>
                  </div>
                </Field>
                <Field label="묶음 수량" hint="낱개면 1">
                  <input
                    type="number"
                    min="1"
                    placeholder="1"
                    value={form.bundleQty}
                    onChange={e => set('bundleQty', e.target.value)}
                  />
                </Field>
                <Field label="단품환산가(원)" hint="낱개 1개 가격">
                  <input
                    type="number"
                    placeholder="예) 9950"
                    value={form.unitPrice}
                    onChange={e => set('unitPrice', e.target.value)}
                  />
                </Field>
              </div>
            </Card>

            {/* 배송 / 링크 */}
            <Card>
              <CardTitle>배송 및 링크</CardTitle>
              <Field label="추정 중량 (g)" required hint="상품 + 포장재 포함 무게, 배송비 계산에 사용">
                <input
                  type="number"
                  placeholder="예) 150"
                  value={form.weight}
                  onChange={e => set('weight', e.target.value)}
                  className={errors.weight ? styles.inputErr : ''}
                />
                {errors.weight && <div className={styles.errMsg}>{errors.weight}</div>}
              </Field>

              <Field label="상세페이지 URL" hint="올리브영 상품 링크 (선택)">
                <input
                  type="text"
                  placeholder="https://www.oliveyoung.co.kr/..."
                  value={form.detailUrl}
                  onChange={e => set('detailUrl', e.target.value)}
                />
              </Field>

              <Field label="이미지 URL" hint="상품 이미지 링크 (선택)">
                <input
                  type="text"
                  placeholder="https://..."
                  value={form.image}
                  onChange={e => set('image', e.target.value)}
                />
                {form.image && (
                  <img src={form.image} alt="미리보기" className={styles.imgPreview}
                    onError={e => e.target.style.display = 'none'} />
                )}
              </Field>
            </Card>

            {/* 버튼 */}
            <div className={styles.btnRow}>
              <Button onClick={handleReset}>초기화</Button>
              {saved && <span className={styles.savedMsg}>저장되었습니다</span>}
              <Button variant="primary" onClick={handleSave}>저장된 상품에 추가</Button>
            </div>

            <Notice>
              ※ 필수 항목(<span style={{color:'var(--red)'}}>*</span>): 상품명 · 할인 후 가격 · 추정 중량<br />
              ※ 저장된 상품은 상품 저장 내역 → 저장된 상품 탭에서 확인
            </Notice>
          </div>

          {/* 우: 입력 미리보기 + 최근 등록 */}
          <div>
            {/* 입력 미리보기 */}
            <Card>
              <CardTitle>입력 미리보기</CardTitle>
              {!form.name && !form.salePrice ? (
                <div className={styles.previewEmpty}>왼쪽 폼을 입력하면 미리보기가 표시됩니다</div>
              ) : (
                <div className={styles.preview}>
                  <div className={styles.previewImgWrap}>
                    {form.image
                      ? <img src={form.image} alt="" className={styles.previewImg}
                          onError={e => e.target.style.display='none'} />
                      : <div className={styles.previewImgPh}>🧴</div>}
                  </div>
                  <div className={styles.previewInfo}>
                    {form.keyword && <span className={styles.previewKw}>{form.keyword}</span>}
                    <div className={styles.previewName}>{form.name || '—'}</div>
                    <div className={styles.previewPrices}>
                      {form.orgPrice && <span className={styles.previewOrg}>{form.orgPrice}</span>}
                      {form.salePrice && <span className={styles.previewSale}>{form.salePrice}</span>}
                    </div>
                    <div className={styles.previewMeta}>
                      {form.weight    && <span>⚖️ {form.weight}g</span>}
                      {form.unitPrice && <span>💰 단품 {Number(form.unitPrice).toLocaleString('ko-KR')}원</span>}
                      {form.isOnePlusOne && <span className={styles.opo}>1+1</span>}
                      {form.bundleQty > 1 && <span>묶음 {form.bundleQty}개</span>}
                    </div>
                    {form.shopeeKw && <div className={styles.previewShopeeKw}>{form.shopeeKw}</div>}
                  </div>
                </div>
              )}
            </Card>

            {/* 최근 등록 */}
            {history.length > 0 && (
              <Card>
                <CardTitle>이번 세션 등록 내역 <span style={{color:'var(--ac)'}}>{history.length}개</span></CardTitle>
                <div className={styles.historyList}>
                  {history.map((item, i) => (
                    <div key={i} className={styles.historyItem}>
                      <div className={styles.historyImgWrap}>
                        {item.image
                          ? <img src={item.image} alt="" className={styles.historyImg}
                              onError={e => e.target.style.display='none'} />
                          : <div className={styles.historyImgPh}>🧴</div>}
                      </div>
                      <div className={styles.historyInfo}>
                        <div className={styles.historyName}>{item.name}</div>
                        <div className={styles.historyMeta}>{item.salePrice} · {item.weight}g</div>
                      </div>
                      <button className={styles.refillBtn} onClick={() => fillFromHistory(item)} title="이 상품으로 폼 채우기">
                        재입력
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
