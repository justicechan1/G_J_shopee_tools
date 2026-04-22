import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { crawlJobsApi } from '../../utils/api';
import PageHeader from '../../components/PageHeader';
import { Card, CardTitle, Button, Notice } from '../../components/UI';
import styles from './CrawlTool.module.css';

export default function CrawlTool() {
  const token          = useStore((s) => s.token);
  const crawlLogs      = useStore((s) => s.crawlLogs);
  const appendCrawlLogs = useStore((s) => s.appendCrawlLogs);
  const clearCrawlLogs  = useStore((s) => s.clearCrawlLogs);

  const [kwInput,  setKwInput]  = useState('');
  const [kwList,   setKwList]   = useState([]);
  const [running,  setRunning]  = useState(false);
  const [progress, setProgress] = useState({ cur: 0, total: 0 });
  const [jobId,    setJobId]    = useState(null);

  const statusPollRef = useRef(null);
  const logPollRef    = useRef(null);
  const logOffsetRef  = useRef(0);
  const logRef        = useRef(null);
  const jobDoneRef    = useRef(false);

  const scrollLogs = useCallback(() => {
    setTimeout(() => logRef.current?.scrollTo(0, logRef.current.scrollHeight), 30);
  }, []);

  function stopPolling() {
    if (statusPollRef.current) { clearInterval(statusPollRef.current); statusPollRef.current = null; }
    if (logPollRef.current)    { clearInterval(logPollRef.current);    logPollRef.current    = null; }
  }

  function addKw() {
    const v = kwInput.trim();
    if (!v || kwList.includes(v)) return;
    setKwList(prev => [...prev, v]);
    setKwInput('');
  }

  function removeKw(i) {
    if (running) return;
    setKwList(prev => prev.filter((_, idx) => idx !== i));
  }

  async function startCrawl() {
    if (!kwList.length) return;
    setRunning(true);
    setProgress({ cur: 0, total: kwList.length });
    logOffsetRef.current = 0;
    jobDoneRef.current   = false;

    let job;
    try {
      job = await crawlJobsApi.start(kwList, token);
    } catch (e) {
      setRunning(false);
      appendCrawlLogs([{ msg: `크롤링 시작 실패: ${e.message}`, type: 'err' }]);
      return;
    }

    const jid = job.job_id;
    setJobId(jid);

    // 로그 폴링 (1초마다)
    logPollRef.current = setInterval(async () => {
      try {
        const res = await crawlJobsApi.logs(jid, logOffsetRef.current, token);
        if (res.logs.length) {
          const visible = res.logs.filter(l => l.msg !== '__DONE__');
          if (visible.length) {
            appendCrawlLogs(visible);
            scrollLogs();
          }
          logOffsetRef.current = res.total;
          if (res.logs.some(l => l.msg === '__DONE__')) {
            jobDoneRef.current = true;
          }
        }
      } catch { /* 무시 */ }
    }, 1000);

    // 상태 폴링 (2초마다)
    statusPollRef.current = setInterval(async () => {
      try {
        const status = await crawlJobsApi.status(jid, token);
        setProgress({ cur: status.done_kw, total: status.total_kw });
        if (['done', 'stopped', 'error'].includes(status.status) || jobDoneRef.current) {
          stopPolling();
          setRunning(false);
        }
      } catch {
        stopPolling();
        setRunning(false);
      }
    }, 2000);
  }

  async function stopCrawl() {
    if (!jobId) return;
    try { await crawlJobsApi.stop(jobId, token); } catch { /* 무시 */ }
  }

  useEffect(() => () => stopPolling(), []);
  useEffect(() => { if (crawlLogs.length) scrollLogs(); }, []);

  const pct = progress.total ? Math.round((progress.cur / progress.total) * 100) : 0;

  return (
    <>
      <PageHeader title="크롤링" sub="올리브영 상품 수집" badge="검색어별 순차 크롤링" />
      <div className={styles.pageWrap}>
        <div className={styles.twoCol}>

          {/* 좌: 검색어 입력 */}
          <div>
            <Card>
              <CardTitle>검색어 입력</CardTitle>
              <div className={styles.inputRow}>
                <input
                  type="text"
                  placeholder="예) 라운드랩 선크림"
                  value={kwInput}
                  onChange={e => setKwInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addKw()}
                  disabled={running}
                />
                <Button onClick={addKw} disabled={running}>추가</Button>
              </div>

              <div className={styles.kwLabel}>
                등록된 검색어 <span className={styles.kwCount}>{kwList.length}개</span>
              </div>
              <div className={styles.kwArea}>
                {kwList.length === 0
                  ? <span className={styles.kwPh}>검색어를 추가하세요</span>
                  : kwList.map((k, i) => (
                    <span key={i} className={styles.kwTag}>
                      {k}
                      <button onClick={() => removeKw(i)} disabled={running} className={styles.kwDel}>×</button>
                    </span>
                  ))
                }
              </div>

              <div className={styles.btnRow}>
                <Button variant="primary" full onClick={startCrawl} disabled={running || kwList.length === 0}>
                  {running ? '크롤링 중...' : '크롤링 시작'}
                </Button>
                {running && <Button variant="danger" onClick={stopCrawl}>정지</Button>}
              </div>
            </Card>

            <Notice>
              ※ 검색어 1개당 올리브영에서 여러 상품이 수집됩니다<br />
              ※ Gemini AI가 쇼피 검색어·중량·1+1 여부를 자동 분석합니다<br />
              ※ 완료 후 데이터 → 크롤링 내역에서 결과를 확인하세요
            </Notice>
          </div>

          {/* 우: 진행 상황 + 로그 */}
          <Card>
            <div className={styles.statusHeader}>
              <CardTitle>크롤링 진행 상황</CardTitle>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                {running && <span className={styles.overallStatus}>실행 중...</span>}
                {crawlLogs.length > 0 && !running && (
                  <button className={styles.clearBtn} onClick={clearCrawlLogs}>로그 초기화</button>
                )}
              </div>
            </div>

            {(running || progress.cur > 0) && (
              <div className={styles.progWrap}>
                <div className={styles.progMeta}>
                  <span>검색어 {progress.cur} / {progress.total}</span>
                  <span>{pct}%</span>
                </div>
                <div className={styles.progTrack}>
                  <div className={styles.progBar} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}

            <div className={styles.logLabel}>
              실행 로그
              {running && <span className={styles.logLive}> ● LIVE</span>}
            </div>
            <div className={styles.logWrap} ref={logRef}>
              {crawlLogs.length === 0
                ? <span style={{ color: 'var(--tx3)' }}>크롤링을 시작하면 로그가 표시됩니다</span>
                : crawlLogs.map((l, i) => (
                  <div key={i} className={`${styles.logLine} ${styles['log_' + l.type] ?? ''}`}>
                    {l.msg}
                  </div>
                ))
              }
              {running && <div className={styles.logCursor}>▌</div>}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
