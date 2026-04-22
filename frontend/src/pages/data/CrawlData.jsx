import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../../store/useStore';
import { crawlItemsApi, productsApi } from '../../utils/api';
import PageHeader from '../../components/PageHeader';
import { Card, Button, Empty } from '../../components/UI';
import styles from './DataPages.module.css';

const PAGE_SIZE = 20;

const FIELDS = [
  { key: 'keyword',      label: '검색어',        type: 'text' },
  { key: 'name',         label: '상품명',         type: 'text' },
  { key: 'orgPrice',     label: '할인 전 가격',   type: 'text' },
  { key: 'salePrice',    label: '할인 후 가격',   type: 'text' },
  { key: 'image',        label: '이미지 URL',     type: 'text' },
  { key: 'detailUrl',    label: '상세페이지 URL', type: 'text' },
  { key: 'shopeeKw',     label: '쇼피검색어',     type: 'text' },
  { key: 'isOnePlusOne', label: '1+1 여부',       type: 'check' },
  { key: 'bundleQty',    label: '묶음수량',        type: 'number' },
  { key: 'unitPrice',    label: '단품환산가(원)',  type: 'number' },
  { key: 'weight',       label: '추정중량(g)',     type: 'number' },
];

function ImgCell({ src, onZoom, s }) {
  if (!src) return <span className={s.imgPlaceholder}>🧴</span>;
  return (
    <img
      src={src} alt=""
      className={`${s.imgThumb} ${s.imgClickable}`}
      onClick={() => onZoom(src)}
      title="클릭하면 크게 보기"
    />
  );
}

function EditRow({ vals, onChange, onSave, onCancel, onZoom, s }) {
  return (
    <tr className={s.editingRow}>
      <td><ImgCell src={vals.image} onZoom={onZoom} s={s} /></td>
      {FIELDS.filter(f => f.key !== 'image').map(f => (
        <td key={f.key}>
          {f.type === 'check' ? (
            <input type="checkbox" checked={!!vals[f.key]}
              onChange={e => onChange(f.key, e.target.checked)} className={s.editCheck} />
          ) : (
            <input type={f.type === 'number' ? 'number' : 'text'} value={vals[f.key] ?? ''}
              onChange={e => onChange(f.key, e.target.value)} className={s.editInput} />
          )}
        </td>
      ))}
      <td className={s.muted}>{vals.date}</td>
      <td>
        <div className={s.actionBtns}>
          <Button variant="primary" onClick={onSave}>저장</Button>
          <Button onClick={onCancel}>취소</Button>
        </div>
      </td>
    </tr>
  );
}

function ViewRow({ item, onEdit, onDelete, onSaveProduct, onZoom, s }) {
  return (
    <tr>
      <td><ImgCell src={item.image} onZoom={onZoom} s={s} /></td>
      <td><span className={s.kwTag}>{item.keyword}</span></td>
      <td className={s.productName} title={item.name}>{item.name}</td>
      <td className={`${s.mono} ${s.muted}`}>{item.orgPrice}</td>
      <td className={s.mono}>{item.salePrice}</td>
      <td>
        {item.detailUrl
          ? <a href={item.detailUrl} target="_blank" rel="noreferrer" className={s.urlLink}>링크</a>
          : <span className={s.muted}>—</span>}
      </td>
      <td className={s.muted}>{item.shopeeKw}</td>
      <td className={s.center}>{item.isOnePlusOne ? <span className={s.badgeGreen}>1+1</span> : '—'}</td>
      <td className={`${s.mono} ${s.center}`}>{item.bundleQty ?? 1}</td>
      <td className={s.mono}>{item.unitPrice ? Number(item.unitPrice).toLocaleString('ko-KR') + '원' : '—'}</td>
      <td className={s.mono}>{item.weight ? `${item.weight}g` : '—'}</td>
      <td className={s.muted}>{item.date}</td>
      <td>
        <div className={s.actionBtns}>
          <Button onClick={onEdit}>편집</Button>
          <Button variant="primary" onClick={onSaveProduct}>상품저장</Button>
          <Button variant="danger" onClick={onDelete}>삭제</Button>
        </div>
      </td>
    </tr>
  );
}

export default function CrawlData() {
  const token = useStore((s) => s.token);

  const [items,      setItems]      = useState([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [editId,     setEditId]     = useState(null);
  const [editVals,   setEditVals]   = useState({});
  const [search,     setSearch]     = useState('');
  const [page,       setPage]       = useState(0);
  const [selectedKw, setSelectedKw] = useState(null);
  const [keywords,   setKeywords]   = useState([]);
  const [zoomSrc,    setZoomSrc]    = useState(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback(async (pg = page, q = search, kw = selectedKw) => {
    setLoading(true);
    try {
      const params = { limit: PAGE_SIZE, offset: pg * PAGE_SIZE };
      if (q.trim()) params.q  = q.trim();
      if (kw)       params.kw = kw;
      const r = await crawlItemsApi.list(token, params);
      setItems(r.items);
      setTotal(r.total);
    } catch { /* 무시 */ } finally {
      setLoading(false);
    }
  }, [token, page, search, selectedKw]);

  const loadKeywords = useCallback(async () => {
    try {
      const r = await crawlItemsApi.keywords(token);
      setKeywords(r.keywords || []);
    } catch { /* 무시 */ }
  }, [token]);

  useEffect(() => { load(); }, [page, search, selectedKw]);
  useEffect(() => { loadKeywords(); }, []);

  function goPage(p) {
    const clamped = Math.max(0, Math.min(p, totalPages - 1));
    setPage(clamped);
    load(clamped, search, selectedKw);
  }

  function handleSearch(v) {
    setSearch(v);
    setPage(0);
    setSelectedKw(null);
    load(0, v, null);
  }

  function selectKw(kw) {
    const next = selectedKw === kw ? null : kw;
    setSelectedKw(next);
    setSearch('');
    setPage(0);
    load(0, '', next);
  }

  function startEdit(item) { setEditId(item.id); setEditVals({ ...item }); }
  function cancelEdit()    { setEditId(null); }

  async function saveEdit() {
    try {
      const updated = await crawlItemsApi.update(editId, editVals, token);
      setItems(prev => prev.map(i => i.id === editId ? updated : i));
    } catch (e) { alert(e.message); }
    setEditId(null);
  }

  async function deleteItem(id) {
    await crawlItemsApi.delete(id, token).catch(() => {});
    setItems(prev => prev.filter(i => i.id !== id));
    setTotal(prev => prev - 1);
    if (items.length === 1 && page > 0) goPage(page - 1);
  }

  async function deleteAll() {
    if (!window.confirm('크롤링 내역 전체를 삭제하시겠습니까?')) return;
    await crawlItemsApi.deleteAll(token).catch(() => {});
    setItems([]); setTotal(0); setPage(0);
    setKeywords([]); setSelectedKw(null);
  }

  async function deduplicate() {
    if (!window.confirm('중복 상품을 제거합니다.\n같은 URL/상품명 중 최신 항목만 남깁니다.')) return;
    try {
      const r = await crawlItemsApi.deduplicate(token);
      alert(`중복 ${r.deleted}개 제거 완료`);
      load(0, '', null);
      setPage(0); setSelectedKw(null); setSearch('');
      loadKeywords();
    } catch (e) { alert(e.message); }
  }

  async function saveToProducts(item) {
    try {
      await productsApi.createFromCrawl(item, token);
      alert(`"${item.name}" 저장 완료`);
    } catch (e) { alert(e.message); }
  }

  return (
    <>
      {/* 이미지 라이트박스 */}
      {zoomSrc && (
        <div className={styles.lightboxOverlay} onClick={() => setZoomSrc(null)}>
          <img src={zoomSrc} alt="" className={styles.lightboxImg} onClick={e => e.stopPropagation()} />
          <button className={styles.lightboxClose} onClick={() => setZoomSrc(null)}>✕</button>
        </div>
      )}

      <PageHeader
        title="크롤링 내역"
        sub="올리브영 수집 데이터"
        badge={`총 ${total}개`}
      />
      <div className={styles.pageWrap}>
        <Card>
          {/* 검색어 필터 패널 */}
          {keywords.length > 0 && (
            <div className={styles.kwFilterPanel}>
              <span className={styles.kwFilterLabel}>검색어</span>
              <div className={styles.kwFilterList}>
                <button
                  className={`${styles.kwFilterChip} ${!selectedKw ? styles.kwFilterChipActive : ''}`}
                  onClick={() => selectKw(null)}
                >
                  전체 <span className={styles.kwFilterCount}>{total}</span>
                </button>
                {keywords.map(({ keyword, count }) => (
                  <button
                    key={keyword}
                    className={`${styles.kwFilterChip} ${selectedKw === keyword ? styles.kwFilterChipActive : ''}`}
                    onClick={() => selectKw(keyword)}
                  >
                    {keyword} <span className={styles.kwFilterCount}>{count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={styles.tableHeader}>
            <div className={styles.cardTitle}>
              크롤링된 상품 목록
              {selectedKw && <span style={{ color: 'var(--ac)', marginLeft: '.4rem' }}>— {selectedKw}</span>}
            </div>
            <div className={styles.headerRight}>
              <input type="text" className={styles.searchInput}
                placeholder="상품명·쇼피검색어 검색"
                value={search} onChange={e => handleSearch(e.target.value)} />
              {total > 0 && <Button onClick={deduplicate}>중복 제거</Button>}
              {total > 0 && <Button variant="danger" onClick={deleteAll}>전체 삭제</Button>}
            </div>
          </div>

          {loading ? (
            <Empty>불러오는 중...</Empty>
          ) : items.length === 0 ? (
            <Empty>
              {search || selectedKw
                ? `"${search || selectedKw}"에 대한 결과가 없습니다`
                : <>크롤링 내역이 없습니다<br /><span style={{ fontSize: 11 }}>도구 → 크롤링에서 수집하세요</span></>
              }
            </Empty>
          ) : (
            <>
              <div className={styles.scrollX}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>이미지</th><th>검색어</th><th>상품명</th><th>할인 전</th><th>할인 후</th>
                      <th>상세페이지</th><th>쇼피검색어</th><th>1+1</th><th>묶음수량</th>
                      <th>단품환산가(원)</th><th>추정중량(g)</th><th>수집일</th><th>작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item =>
                      editId === item.id ? (
                        <EditRow key={item.id} vals={editVals}
                          onChange={(f, v) => setEditVals(prev => ({ ...prev, [f]: v }))}
                          onSave={saveEdit} onCancel={cancelEdit}
                          onZoom={setZoomSrc} s={styles} />
                      ) : (
                        <ViewRow key={item.id} item={item}
                          onEdit={() => startEdit(item)}
                          onDelete={() => deleteItem(item.id)}
                          onSaveProduct={() => saveToProducts(item)}
                          onZoom={setZoomSrc} s={styles} />
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* 페이지네이션 */}
              <div className={styles.pagination}>
                <button className={styles.pageBtn} onClick={() => goPage(0)}         disabled={page === 0}>«</button>
                <button className={styles.pageBtn} onClick={() => goPage(page - 1)}  disabled={page === 0}>‹</button>
                <span className={styles.pageInfo}>{page + 1} / {totalPages}</span>
                <button className={styles.pageBtn} onClick={() => goPage(page + 1)}  disabled={page >= totalPages - 1}>›</button>
                <button className={styles.pageBtn} onClick={() => goPage(totalPages - 1)} disabled={page >= totalPages - 1}>»</button>
              </div>
            </>
          )}
        </Card>
      </div>
    </>
  );
}
