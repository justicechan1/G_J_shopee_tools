import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import styles from './Guide.module.css';

const SECTIONS = [
  {
    id: 'overview',
    icon: '🗺️',
    title: '전체 흐름 한눈에 보기',
    content: (
      <div>
        <p className={styles.lead}>
          이 도구는 <strong>올리브영 상품을 쇼피(Shopee)에서 판매할 때의 수익을 계산</strong>하기 위한 올인원 툴입니다.<br />
          아래 순서대로 사용하면 처음이어도 쉽게 따라할 수 있어요.
        </p>
        <div className={styles.flowWrap}>
          <div className={styles.flowStep}>
            <div className={styles.flowNum}>1</div>
            <div className={styles.flowText}>
              <div className={styles.flowTitle}>환경설정</div>
              <div className={styles.flowDesc}>환율·수수료·마진 기준 설정</div>
            </div>
          </div>
          <div className={styles.flowArrow}>→</div>
          <div className={styles.flowStep}>
            <div className={styles.flowNum}>2</div>
            <div className={styles.flowText}>
              <div className={styles.flowTitle}>크롤링</div>
              <div className={styles.flowDesc}>올리브영 상품 자동 수집</div>
            </div>
          </div>
          <div className={styles.flowArrow}>→</div>
          <div className={styles.flowStep}>
            <div className={styles.flowNum}>3</div>
            <div className={styles.flowText}>
              <div className={styles.flowTitle}>판매가 추천</div>
              <div className={styles.flowDesc}>마진율별 쇼피 등록가 계산</div>
            </div>
          </div>
          <div className={styles.flowArrow}>→</div>
          <div className={styles.flowStep}>
            <div className={styles.flowNum}>4</div>
            <div className={styles.flowText}>
              <div className={styles.flowTitle}>수익 계산</div>
              <div className={styles.flowDesc}>VN·SG 최종 수익 확인 및 저장</div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'settings',
    icon: '⚙️',
    title: '환경설정 — 가장 먼저 해야 할 일',
    content: (
      <div>
        <p className={styles.lead}>사용 전 <strong>환율·수수료·마진율</strong>을 본인 상황에 맞게 설정하세요. 모든 계산에 자동으로 반영됩니다.</p>
        <div className={styles.settingGrid}>
          <div className={styles.settingCard}>
            <div className={styles.settingCardTitle}>💱 환율 설정</div>
            <ul className={styles.ul}>
              <li><span className={styles.tag}>VND 환율</span> — 1 VND = ? 원 (예: 17.8)</li>
              <li><span className={styles.tag}>SGD 환율</span> — 1 SGD = ? 원 (예: 1,100)</li>
              <li><span className={styles.tag}>국내 택배비</span> — 올리브영→내 창고 배송비 (예: 3,500원)</li>
            </ul>
          </div>
          <div className={styles.settingCard}>
            <div className={styles.settingCardTitle}>💸 수수료 설정</div>
            <ul className={styles.ul}>
              <li>쇼피가 판매금액에서 자동으로 떼어가는 비율</li>
              <li>VN: 판매 수수료 + PG 수수료 + 고객 배송비 감면액</li>
              <li>SG: 판매 수수료 + PG + 서비스 수수료 + 고객 배송비 감면액</li>
              <li className={styles.tip}>💡 쇼피 셀러센터의 최신 수수료로 업데이트하세요</li>
            </ul>
          </div>
          <div className={styles.settingCard}>
            <div className={styles.settingCardTitle}>📊 마진 설정</div>
            <ul className={styles.ul}>
              <li><span className={styles.tagBlue}>최소 마진율</span> — 이 이하면 판매 비추천</li>
              <li><span className={styles.tagGreen}>적정 마진율</span> — 일반적인 목표 수익률</li>
              <li><span className={styles.tagOrange}>목표 마진율</span> — 이상적인 최고 목표치</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'crawl',
    icon: '🔍',
    title: '크롤링 — 올리브영 상품 자동 수집',
    content: (
      <div>
        <p className={styles.lead}>올리브영에서 팔고 싶은 상품을 <strong>키워드로 검색해 자동 수집</strong>합니다.</p>
        <div className={styles.stepList}>
          <div className={styles.step}>
            <span className={styles.stepBadge}>1</span>
            <div>
              <div className={styles.stepTitle}>도구 → 크롤링 메뉴 진입</div>
              <div className={styles.stepDesc}>왼쪽 사이드바에서 <em>도구 → 크롤링</em>을 클릭합니다.</div>
            </div>
          </div>
          <div className={styles.step}>
            <span className={styles.stepBadge}>2</span>
            <div>
              <div className={styles.stepTitle}>검색어 입력</div>
              <div className={styles.stepDesc}>예) <code>라운드랩 선크림</code>, <code>넘버즈인</code> 입력 후 <strong>추가</strong> 버튼 (또는 Enter). 여러 개 한 번에 등록 가능합니다.</div>
            </div>
          </div>
          <div className={styles.step}>
            <span className={styles.stepBadge}>3</span>
            <div>
              <div className={styles.stepTitle}>크롤링 시작</div>
              <div className={styles.stepDesc}><strong>크롤링 시작</strong> 버튼을 누르면 검색어별로 순서대로 상품을 수집합니다. 우측 패널에서 실시간 진행 상황을 확인할 수 있어요.</div>
            </div>
          </div>
          <div className={styles.step}>
            <span className={styles.stepBadge}>4</span>
            <div>
              <div className={styles.stepTitle}>결과 확인</div>
              <div className={styles.stepDesc}>완료되면 수집된 상품이 <em>데이터 → 크롤링 내역</em>에 자동 저장됩니다.</div>
            </div>
          </div>
        </div>
        <div className={styles.infoBox}>
          <span className={styles.infoIcon}>ℹ️</span>
          <span>수집 중 <strong>정지</strong> 버튼을 누르면 언제든 멈출 수 있습니다. 정지 전까지 수집된 데이터는 유지됩니다.</span>
        </div>
      </div>
    ),
  },
  {
    id: 'crawldata',
    icon: '📋',
    title: '크롤링 내역 — 수집 데이터 관리 및 편집',
    content: (
      <div>
        <p className={styles.lead}>수집된 상품 목록을 확인하고 <strong>직접 수정</strong>하거나 <strong>상품 저장 내역으로 이동</strong>할 수 있습니다.</p>
        <div className={styles.colTable}>
          <div className={styles.colHeader}>
            <span>컬럼</span><span>설명</span>
          </div>
          {[
            ['검색어', '크롤링 시 입력한 검색 키워드'],
            ['상품명', '올리브영 상품 이름'],
            ['할인 전 가격', '정가 (취소선 가격)'],
            ['할인 후 가격', '실제 판매가 (구매 원가 기준)'],
            ['상세페이지', '올리브영 상품 상세 링크'],
            ['쇼피검색어', '쇼피에 등록할 때 쓸 영문 키워드'],
            ['1+1 여부', '1+1 행사 상품 여부'],
            ['묶음수량', '몇 개 묶음 상품인지 (기본 1)'],
            ['단품환산가(원)', '묶음을 1개로 쪼갰을 때의 단가'],
            ['추정중량(g)', '배송비 계산에 쓰이는 상품 무게'],
          ].map(([col, desc]) => (
            <div key={col} className={styles.colRow}>
              <span className={styles.colName}>{col}</span>
              <span className={styles.colDesc}>{desc}</span>
            </div>
          ))}
        </div>
        <div className={styles.actionList}>
          <div className={styles.actionItem}><span className={styles.btnMock}>편집</span> 해당 행의 모든 값을 직접 수정할 수 있습니다.</div>
          <div className={styles.actionItem}><span className={styles.btnMockPrimary}>상품저장</span> 이 상품을 <em>상품 저장 내역</em>으로 복사합니다.</div>
          <div className={styles.actionItem}><span className={styles.btnMockDanger}>삭제</span> 해당 항목만 목록에서 제거합니다.</div>
        </div>
      </div>
    ),
  },
  {
    id: 'rec',
    icon: '💡',
    title: '판매가 추천 — 마진 역산 계산기',
    content: (
      <div>
        <p className={styles.lead}><strong>"얼마에 팔아야 내가 원하는 마진이 나올까?"</strong>를 자동으로 계산해줍니다.</p>
        <div className={styles.stepList}>
          <div className={styles.step}>
            <span className={styles.stepBadge}>1</span>
            <div>
              <div className={styles.stepTitle}>상품명 · 원가 · 중량 입력</div>
              <div className={styles.stepDesc}>
                한국에서 구매하는 가격(원가)과 상품 무게를 입력하세요.<br />
                <em>저장된 상품</em> 탭에서 <strong>판매가 추천</strong> 버튼을 누르면 자동으로 값이 채워집니다.
              </div>
            </div>
          </div>
          <div className={styles.step}>
            <span className={styles.stepBadge}>2</span>
            <div>
              <div className={styles.stepTitle}>추천 판매가 확인</div>
              <div className={styles.stepDesc}>
                최소·적정·목표 마진율에 맞는 <strong>VN(VND)</strong>과 <strong>SG(SGD)</strong> 추천가를 한 번에 확인합니다.
              </div>
            </div>
          </div>
          <div className={styles.step}>
            <span className={styles.stepBadge}>3</span>
            <div>
              <div className={styles.stepTitle}>수익 계산으로 바로 이동</div>
              <div className={styles.stepDesc}>
                <strong>수익 계산하기</strong> 패널에서 시장(SG/VN)과 마진율을 선택하고 버튼을 누르면,<br />
                해당 계산기로 이동하면서 원가·중량·판매가가 자동 입력됩니다.
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'calc',
    icon: '🧮',
    title: 'VN / SG 수익 계산기 — 상세 수익 분석',
    content: (
      <div>
        <p className={styles.lead}>판매가를 넣으면 <strong>수수료·배송비·순이익·마진율</strong>을 상세하게 계산합니다.</p>
        <div className={styles.twoBlock}>
          <div className={styles.block}>
            <div className={styles.blockTitle}>🇻🇳 VN 계산기 입력값</div>
            <ul className={styles.ul}>
              <li><span className={styles.tag}>상품명</span> 저장 시 목록에 표시됩니다 (선택)</li>
              <li><span className={styles.tag}>한국 구매 원가</span> 내가 올리브영에서 산 가격 (원)</li>
              <li><span className={styles.tag}>쇼피 판매가</span> 쇼피 VN에 등록할 가격 (VND)</li>
              <li><span className={styles.tag}>상품 중량</span> 배송비 계산 기준 무게 (g)</li>
            </ul>
          </div>
          <div className={styles.block}>
            <div className={styles.blockTitle}>🇸🇬 SG 계산기 입력값</div>
            <ul className={styles.ul}>
              <li><span className={styles.tag}>상품명</span> 저장 시 목록에 표시됩니다 (선택)</li>
              <li><span className={styles.tag}>한국 구매 원가</span> 내가 올리브영에서 산 가격 (원)</li>
              <li><span className={styles.tag}>쇼피 판매가</span> 쇼피 SG에 등록할 가격 (SGD)</li>
              <li><span className={styles.tag}>상품 중량</span> 배송비 계산 기준 무게 (g)</li>
            </ul>
          </div>
        </div>
        <div className={styles.resultInfo}>
          <div className={styles.resultTitle}>결과로 확인할 수 있는 것</div>
          <div className={styles.resultGrid}>
            <div className={styles.resultItem}><span className={styles.dot} style={{background:'var(--green)'}} />순이익 (원)</div>
            <div className={styles.resultItem}><span className={styles.dot} style={{background:'var(--green)'}} />마진율 (%)</div>
            <div className={styles.resultItem}><span className={styles.dot} style={{background:'var(--blue)'}} />배송비 내역</div>
            <div className={styles.resultItem}><span className={styles.dot} style={{background:'var(--blue)'}} />수수료 내역</div>
            <div className={styles.resultItem}><span className={styles.dot} style={{background:'var(--ac)'}} />정산 수령액</div>
            <div className={styles.resultItem}><span className={styles.dot} style={{background:'var(--ac)'}} />흑자 / 적자 상태</div>
          </div>
        </div>
        <div className={styles.infoBox}>
          <span className={styles.infoIcon}>💾</span>
          <span>계산 결과가 마음에 들면 <strong>저장하기</strong> 버튼으로 <em>상품 저장 내역</em>에 기록할 수 있습니다.</span>
        </div>
      </div>
    ),
  },
  {
    id: 'saved',
    icon: '📦',
    title: '상품 저장 내역 — 내 데이터 모아보기',
    content: (
      <div>
        <p className={styles.lead}>저장한 모든 데이터를 한 곳에서 관리합니다.</p>
        <div className={styles.twoBlock}>
          <div className={styles.block}>
            <div className={styles.blockTitle}>계산 결과 탭</div>
            <ul className={styles.ul}>
              <li>VN·SG 계산기에서 저장한 수익 계산 결과</li>
              <li><span className={styles.tagGreen}>SG</span> / <span className={styles.tag}>VN</span> 버튼으로 시장별로 나눠 확인</li>
              <li>상품명, 원가, 판매가, 중량, 순이익, 마진율 표시</li>
            </ul>
          </div>
          <div className={styles.block}>
            <div className={styles.blockTitle}>저장된 상품 탭</div>
            <ul className={styles.ul}>
              <li>크롤링 내역에서 <strong>상품저장</strong>한 상품 목록</li>
              <li>크롤링 데이터 전체 필드 확인 가능</li>
              <li><span className={styles.btnMockPrimary}>판매가 추천</span> 버튼으로 바로 분석 가능</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'tips',
    icon: '🚀',
    title: '추천 워크플로우 (빠른 시작)',
    content: (
      <div>
        <p className={styles.lead}>처음 사용한다면 이 순서대로 따라해 보세요.</p>
        <div className={styles.workflowList}>
          {[
            { num: '①', title: '환경설정 먼저', desc: '환율·수수료·마진율을 내 상황에 맞게 입력합니다.', path: '환경설정 → 환율/수수료/마진 설정' },
            { num: '②', title: '상품 크롤링', desc: '팔고 싶은 올리브영 상품명을 검색어로 등록하고 크롤링합니다.', path: '도구 → 크롤링' },
            { num: '③', title: '크롤링 내역 정리', desc: '수집된 상품의 단품환산가·쇼피검색어·중량을 확인·수정합니다.', path: '데이터 → 크롤링 내역' },
            { num: '④', title: '상품 저장', desc: '팔 만한 상품의 상품저장 버튼을 눌러 저장 목록으로 옮깁니다.', path: '데이터 → 크롤링 내역 → 상품저장' },
            { num: '⑤', title: '판매가 추천 확인', desc: '저장된 상품에서 판매가 추천 버튼을 눌러 마진별 등록가를 확인합니다.', path: '상품 저장 내역 → 저장된 상품 → 판매가 추천' },
            { num: '⑥', title: '수익 최종 확인', desc: '시장·마진율 선택 후 수익 계산하기를 눌러 최종 수익을 검토합니다.', path: '판매가 추천 → 수익 계산하기 → VN/SG 계산기' },
            { num: '⑦', title: '결과 저장', desc: '최종 수익이 확인되면 저장하기를 눌러 내역에 기록합니다.', path: 'VN/SG 계산기 → 저장하기' },
          ].map(item => (
            <div key={item.num} className={styles.workflowItem}>
              <div className={styles.workflowNum}>{item.num}</div>
              <div className={styles.workflowBody}>
                <div className={styles.workflowTitle}>{item.title}</div>
                <div className={styles.workflowDesc}>{item.desc}</div>
                <div className={styles.workflowPath}>{item.path}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

export default function Guide() {
  const [active, setActive] = useState('overview');
  const current = SECTIONS.find(s => s.id === active);

  return (
    <>
      <PageHeader title="사용 설명서" sub="Shopee Tools 가이드" badge="처음 사용자 안내" />
      <div className={styles.pageWrap}>
        <div className={styles.layout}>
          {/* 목차 사이드 */}
          <nav className={styles.toc}>
            <div className={styles.tocTitle}>목차</div>
            {SECTIONS.map(s => (
              <button
                key={s.id}
                className={`${styles.tocItem} ${active === s.id ? styles.tocActive : ''}`}
                onClick={() => setActive(s.id)}
              >
                <span className={styles.tocIcon}>{s.icon}</span>
                <span className={styles.tocLabel}>{s.title}</span>
              </button>
            ))}
          </nav>

          {/* 본문 */}
          <div className={styles.content}>
            <div className={styles.contentHeader}>
              <span className={styles.contentIcon}>{current.icon}</span>
              <h2 className={styles.contentTitle}>{current.title}</h2>
            </div>
            <div className={styles.contentBody}>
              {current.content}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
