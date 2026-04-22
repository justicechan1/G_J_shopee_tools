import React from 'react';
import styles from './PageHeader.module.css';

export default function PageHeader({ title, sub, badge }) {
  return (
    <div className={styles.header}>
      <span className={styles.title}>{title}</span>
      {sub && <><span className={styles.sep}>/</span><span className={styles.sub}>{sub}</span></>}
      {badge && <span className={styles.badge}>{badge}</span>}
    </div>
  );
}
