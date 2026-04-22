import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { calcResultsApi, productsApi } from '../../utils/api';
import PageHeader from '../../components/PageHeader';
import { Card, Button, Empty } from '../../components/UI';
import styles from './DataPages.module.css';

export default function SavedData() {
  const token    = useStore((s) => s.token);
  const setRecSeed = useStore((s) => s.setRecSeed);
  const navigate = useNavigate();

  const [tab,       setTab]       = useState('calc');
  const [marketTab, setMarketTab] = useState('sg');

  const [calcItems,  setCalcItems]  = useState([]);
  const [prodItems,  setProdItems]  = useState([]);
  const [loadingC,   setLoadingC]   = useState(true);
  const [loadingP,   setLoadingP]   = useState(true);

  const [calcSearch, setCalcSearch] = useState('');
  const [prodSearch, setProdSearch] = useState('');

  // ── 데이터 로드 ────────────────────────────────────────────
  const loadCalc = useCallback(async () => {
    setLoadingC(true);
    try {
      const r = await calcResultsApi.list(token, { limit: 500 });
      setCalcItems(r.items);
    } catch { } finally { setLoadingC(false); }
  }, [token]);

  const loadProd = useCallback(async () => {
    setLoadingP(true);
    try {
      const r = await productsApi.list(token, { limit: 500 });
      setProdItems(r.items);
    } catch { } finally { setLoadingP(false); }
  }, [token]);

  useEffect(() => { loadCalc(); loadProd(); }, [loadCalc, loadProd]);

  // ── 계산 결과 필터링 ───────────────────────────────────────
  const sgItems = calcItems.filter(i => i.market?.includes('SG'));
  const vnItems = calcItems.filter(i => i.market?.includes('VN'));
  const marketItems = marketTab === 'sg' ? sgItems : vnItems;

  const cq = calcSearch.trim().toLowerCase();
  const calcFiltered = cq
    ? marketItems.filter(i =>
        i.name?.toLowerCase().includes(cq) || i.price?.toLowerCase().includes(cq))
    : marketItems;

  // ── 저장 상품 필터링 ───────────────────────────────────────
  const pq = prodSearch.trim().toLowerCase();
  const prodFiltered = pq
    ? prodItems.filter(i =>
        i.name?.toLowerCase().includes(pq) ||
        i.keyword?.toLowerCase().includes(pq) ||
        i.shopeeKw?.toLowerCase().includes(pq))
    : prodItems;

  // ── 계산 결과 삭제 ────────────────────────────────────────
  async function deleteCalcItem(id) {
    await calcResultsApi.delete(id, token).catch(() => {});
    setCalcItems(prev => prev.filter(i => i.id !== id));
  }

  async function deleteMarketItems() {
    const mkt = marketTab === 'sg' ? 'SG' : 'VN';
    if (!window.confirm(`${mkt} 계산 결과 전체를 삭제하시겠습니까?`)) return;
    await calcResultsApi.deleteAll(token, mkt).catch(() => {});
    setCalcItems(prev => prev.filter(i => !i.market?.includes(mkt)));
  }

  async function deduplicateCalc() {
    if (!window.confirm('계산 결과 중복을 제거합니다.\n같은 상품명+시장+판매가 중 최신 항목만 남깁니다.')) return;
    try {
      const r = await calcResultsApi.deduplicate(token);
      alert(`중복 ${r.deleted}개 제거 완료`);
      loadCalc();
    } catch (e) { alert(e.message); }
  }

  // ── 저장 상품 삭제 ────────────────────────────────────────
  async function deleteProdItem(id) {
    await productsApi.delete(id, token).catch(() => {});
    setProdItems(prev => prev.filter(i => i.id !== id));
  }

  async function deleteAllProds() {
    if (!window.confirm('저장된 상품 전체를 삭제하시겠습니까?')) return;
    await productsApi.deleteAll(token).catch(() => {});
    setProdItems([]);
  }

  async function deduplicateProds() {
    if (!window.confirm('저장된 상품 중복을 제거합니다.\n같은 URL/상품명 중 최신 항목만 남깁니다.')) return;
    try {
      const r = await productsApi.deduplicate(token);
      alert(`중복 ${r.deleted}개 제거 완료`);
      loadProd();
    } catch (e) { alert(e.message); }
  }

  // ── 판매가 추천으로 이동 ──────────────────────────────────
  function goToRec(item) {
    setRecSeed({
      name:   item.name   || '',
      cost:   item.unitPrice ? Number(item.unitPrice) : '',
      weight: item.weight  ? Number(item.weight)  : '',
    });
    navigate('/calc/rec');
  }

  const totalBadge = tab === 'calc'
    ? `계산 결과 ${calcItems.length}개`
    : `저장 상품 ${prodItems.length}개`;

  return (
    <>
      <PageHeader title="상품 저장 내역" sub="계산 결과 및 저장된 상품" badge={totalBadge} />
      <div className={styles.pageWrap}>

        {/* 메인 탭 */}
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'calc' ? styles.tabActive : ''}`}
            onClick={() => setTab('calc')}>
            계산 결과 <span className={styles.tabCount}>{calcItems.length}</span>
          </button>
          <button className={`${styles.tab} ${tab === 'product' ? styles.tabActive : ''}`}
            onClick={() => setTab('product')}>
            저장된 상품 <span className={styles.tabCount}>{prodItems.length}</span>
          </button>
        </div>

        {/* 계산 결과 탭 */}
        {tab === 'calc' && (
          <Card>
            <div className={styles.tableHeader}>
              <div className={styles.cardTitle}>저장된 계산 결과</div>
              <div className={styles.headerRight}>
                <div className={styles.marketTabs}>
                  <button className={`${styles.marketTab} ${marketTab === 'sg' ? styles.marketTabActive : ''}`}
                    onClick={() => setMarketTab('sg')}>
                    🇸🇬 SG <span className={styles.marketCount}>{sgItems.length}</span>
                  </button>
                  <button className={`${styles.marketTab} ${marketTab === 'vn' ? styles.marketTabActive : ''}`}
                    onClick={() => setMarketTab('vn')}>
                    🇻🇳 VN <span className={styles.marketCount}>{vnItems.length}</span>
                  </button>
                </div>
                {marketItems.length > 0 && (
                  <input type="text" className={styles.searchInput} placeholder="상품명 검색"
                    value={calcSearch} onChange={e => setCalcSearch(e.target.value)} />
                )}
                {calcItems.length > 0 && (
                  <Button onClick={deduplicateCalc}>중복 제거</Button>
                )}
                {marketItems.length > 0 && (
                  <Button variant="danger" onClick={deleteMarketItems}>
                    {marketTab === 'sg' ? 'SG' : 'VN'} 전체 삭제
                  </Button>
                )}
              </div>
            </div>

            {loadingC ? (
              <Empty>불러오는 중...</Empty>
            ) : marketItems.length === 0 ? (
              <Empty>
                {marketTab === 'sg' ? 'SG' : 'VN'} 저장 내역이 없습니다<br />
                <span style={{ fontSize: 11 }}>계산기에서 계산 후 저장하기를 눌러주세요</span>
              </Empty>
            ) : calcFiltered.length === 0 ? (
              <Empty><span style={{ fontSize: 11 }}>"{calcSearch}"에 대한 검색 결과가 없습니다</span></Empty>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>시장</th><th>상품명</th><th>원가</th><th>판매가</th>
                    <th>중량(g)</th><th>순이익</th><th>마진율</th><th>저장일</th><th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {calcFiltered.map(item => (
                    <tr key={item.id}>
                      <td>{item.market}</td>
                      <td className={styles.productName} title={item.name}>
                        {item.name || <span className={styles.muted}>—</span>}
                      </td>
                      <td className={styles.mono}>{Math.round(item.cost).toLocaleString('ko-KR')}원</td>
                      <td className={styles.mono}>{item.price}</td>
                      <td className={styles.mono}>
                        {item.weight ? `${item.weight}g` : <span className={styles.muted}>—</span>}
                      </td>
                      <td className={styles.mono}
                        style={{ color: item.profit > 0 ? 'var(--green)' : item.profit < 0 ? 'var(--red)' : 'var(--yellow)' }}>
                        {item.profit != null ? `${Math.round(item.profit).toLocaleString('ko-KR')}원` : '—'}
                      </td>
                      <td style={{ color: item.margin > 0 ? 'var(--green)' : item.margin < 0 ? 'var(--red)' : 'var(--yellow)' }}>
                        {item.margin != null ? `${item.margin.toFixed(1)}%` : '—'}
                      </td>
                      <td className={styles.muted}>{item.date}</td>
                      <td>
                        <Button variant="danger" onClick={() => deleteCalcItem(item.id)}>삭제</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        )}

        {/* 저장된 상품 탭 */}
        {tab === 'product' && (
          <Card>
            <div className={styles.tableHeader}>
              <div className={styles.cardTitle}>저장된 상품</div>
              <div className={styles.headerRight}>
                {prodItems.length > 0 && (
                  <input type="text" className={styles.searchInput}
                    placeholder="상품명·검색어·쇼피검색어"
                    value={prodSearch} onChange={e => setProdSearch(e.target.value)} />
                )}
                {prodItems.length > 0 && (
                  <Button onClick={deduplicateProds}>중복 제거</Button>
                )}
                {prodItems.length > 0 && (
                  <Button variant="danger" onClick={deleteAllProds}>전체 삭제</Button>
                )}
              </div>
            </div>

            {loadingP ? (
              <Empty>불러오는 중...</Empty>
            ) : prodItems.length === 0 ? (
              <Empty>
                저장된 상품이 없습니다<br />
                <span style={{ fontSize: 11 }}>크롤링 내역이나 수동 등록으로 추가하세요</span>
              </Empty>
            ) : prodFiltered.length === 0 ? (
              <Empty><span style={{ fontSize: 11 }}>"{prodSearch}"에 대한 검색 결과가 없습니다</span></Empty>
            ) : (
              <div className={styles.scrollX}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>이미지</th><th>검색어</th><th>상품명</th><th>할인 전</th><th>할인 후</th>
                      <th>상세페이지</th><th>쇼피검색어</th><th>1+1</th><th>묶음수량</th>
                      <th>단품환산가(원)</th><th>추정중량(g)</th><th>저장일</th><th>작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prodFiltered.map(item => (
                      <tr key={item.id}>
                        <td>
                          {item.image
                            ? <img src={item.image} alt="" className={styles.imgThumb} />
                            : <span className={styles.imgPlaceholder}>🧴</span>}
                        </td>
                        <td><span className={styles.kwTag}>{item.keyword}</span></td>
                        <td className={styles.productName} title={item.name}>{item.name}</td>
                        <td className={`${styles.mono} ${styles.muted}`}>{item.orgPrice}</td>
                        <td className={styles.mono}>{item.salePrice}</td>
                        <td>
                          {item.detailUrl
                            ? <a href={item.detailUrl} target="_blank" rel="noreferrer" className={styles.urlLink}>링크</a>
                            : <span className={styles.muted}>—</span>}
                        </td>
                        <td className={styles.muted}>{item.shopeeKw}</td>
                        <td className={styles.center}>
                          {item.isOnePlusOne ? <span className={styles.badgeGreen}>1+1</span> : '—'}
                        </td>
                        <td className={`${styles.mono} ${styles.center}`}>{item.bundleQty ?? 1}</td>
                        <td className={styles.mono}>
                          {item.unitPrice ? Number(item.unitPrice).toLocaleString('ko-KR') + '원' : '—'}
                        </td>
                        <td className={styles.mono}>{item.weight ? `${item.weight}g` : '—'}</td>
                        <td className={styles.muted}>{item.savedDate}</td>
                        <td>
                          <div className={styles.actionBtns}>
                            <Button variant="primary" onClick={() => goToRec(item)}>판매가 추천</Button>
                            <Button variant="danger" onClick={() => deleteProdItem(item.id)}>삭제</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>
    </>
  );
}
