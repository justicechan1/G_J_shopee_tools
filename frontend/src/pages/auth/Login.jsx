import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { authApi } from '../../utils/api';
import styles from './Login.module.css';

export default function Login() {
  const login    = useStore((s) => s.login);
  const navigate = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setError('');
    setLoading(true);
    try {
      const data = await authApi.login(email.trim(), password);
      login(data);
      navigate('/calc/sg', { replace: true });
    } catch (err) {
      setError(err.message || '로그인에 실패했습니다. 이메일과 비밀번호를 확인하세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* 로고 */}
        <div className={styles.logo}>
          <div className={styles.logoMark}>S</div>
          <div>
            <div className={styles.logoText}>Shopee Tools</div>
            <div className={styles.logoSub}>마진 계산기</div>
          </div>
        </div>

        <h1 className={styles.title}>로그인</h1>
        <p className={styles.desc}>계속하려면 계정에 로그인하세요</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>이메일</label>
            <input
              type="email"
              className={styles.input}
              placeholder="이메일 주소 입력"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              disabled={loading}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>비밀번호</label>
            <input
              type="password"
              className={styles.input}
              placeholder="비밀번호 입력"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={loading}
              required
            />
          </div>

          {error && (
            <div className={styles.errorBox}>
              <span className={styles.errorIcon}>⚠</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading || !email || !password}
          >
            {loading ? (
              <span className={styles.spinner} />
            ) : '로그인'}
          </button>
        </form>

        <div className={styles.footer}>
          계정이 없으신가요? 관리자에게 문의하세요
        </div>
      </div>
    </div>
  );
}
