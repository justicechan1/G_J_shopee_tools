import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { authApi } from '../utils/api';
import styles from './Layout.module.css';

const IS_DEV = import.meta.env.DEV;

const NAV = [
  {
    group: '계산기',
    items: [
      { to: '/calc/vn',  icon: '🇻🇳', label: 'VN 수익 계산기' },
      { to: '/calc/sg',  icon: '🇸🇬', label: 'SG 수익 계산기' },
      { to: '/calc/rec', icon: '💡',  label: '판매가 추천' },
    ],
  },
  {
    group: '데이터',
    items: [
      { to: '/data/saved', icon: '📦', label: '상품 저장 내역' },
      { to: '/data/crawl', icon: '📋', label: '크롤링 내역' },
    ],
  },
  {
    group: '도구',
    items: [
      ...(IS_DEV ? [{ to: '/tools/crawl', icon: '🔍', label: '크롤링' }] : []),
      { to: '/tools/manual', icon: '✏️',  label: '수동 상품 등록' },
    ],
  },
  {
    group: '환경설정',
    items: [
      { to: '/settings/margin', icon: '⚙️',  label: '마진 설정' },
      { to: '/settings/rate',   icon: '💱',  label: '환율 설정' },
      { to: '/settings/fee',    icon: '💸',  label: '수수료 설정' },
    ],
  },
  {
    group: '도움말',
    items: [
      { to: '/guide', icon: '📖', label: '사용 설명서' },
    ],
  },
];

export default function Layout({ children }) {
  const { user, token, logout } = useStore((s) => ({ user: s.user, token: s.token, logout: s.logout }));
  const navigate = useNavigate();

  async function handleLogout() {
    try { await authApi.logout(token); } catch (_) {}
    logout();
    navigate('/login', { replace: true });
  }

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'GJ';

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoMark}>S</div>
          <div>
            <div className={styles.logoText}>Shopee Tools</div>
            <div className={styles.logoSub}>마진 계산기</div>
          </div>
        </div>

        {/* Nav */}
        <nav className={styles.nav}>
          {NAV.map((section) => (
            <div key={section.group} className={styles.navGroup}>
              <div className={styles.groupLabel}>{section.group}</div>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `${styles.navItem} ${isActive ? styles.active : ''}`
                  }
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Bottom user */}
        <div className={styles.sidebarBottom}>
          <div className={styles.avatar}>{initials}</div>
          <span className={styles.userName} title={user?.email}>
            {user?.email || '관리자'}
          </span>
          <button className={styles.logoutBtn} onClick={handleLogout} title="로그아웃">
            ⏻
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className={styles.main}>
        {children}
      </div>
    </div>
  );
}
