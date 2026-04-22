import React from 'react';
import styles from './UI.module.css';

// ── Card ──────────────────────────────────────────────────────
export function Card({ children, style }) {
  return <div className={styles.card} style={style}>{children}</div>;
}

export function CardTitle({ children }) {
  return <div className={styles.cardTitle}>{children}</div>;
}

// ── Field (입력 행) ───────────────────────────────────────────
export function Field({ label, unit, children, note }) {
  return (
    <div className={styles.field}>
      <div className={styles.fieldLabel}>{label}</div>
      <div className={styles.fieldRow}>
        {children}
        {unit && <span className={styles.fieldUnit}>{unit}</span>}
      </div>
      {note && <div className={styles.fieldNote}>{note}</div>}
    </div>
  );
}

// ── Metric 카드 ───────────────────────────────────────────────
export function Metric({ label, value, color, mono }) {
  return (
    <div className={styles.metric}>
      <div className={styles.metricLabel}>{label}</div>
      <div
        className={styles.metricValue}
        style={{ color: color || 'var(--tx1)', fontFamily: mono ? 'var(--font-mono)' : undefined }}
      >
        {value ?? '—'}
      </div>
    </div>
  );
}

// ── Detail Row ────────────────────────────────────────────────
export function DetailRow({ label, value, highlight }) {
  return (
    <div className={`${styles.detailRow} ${highlight ? styles.highlight : ''}`}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={styles.detailValue}>{value ?? '—'}</span>
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────
export function Badge({ status, children }) {
  const cls = {
    pos:  styles.badgePos,
    neg:  styles.badgeNeg,
    warn: styles.badgeWarn,
    neu:  styles.badgeNeu,
  }[status] || styles.badgeNeu;
  return <span className={`${styles.badge} ${cls}`}>{children}</span>;
}

// ── Button ────────────────────────────────────────────────────
export function Button({ children, onClick, variant = 'default', disabled, full, style }) {
  const variantCls = {
    default: styles.btnDefault,
    primary: styles.btnPrimary,
    danger:  styles.btnDanger,
  }[variant] || styles.btnDefault;
  return (
    <button
      className={`${styles.btn} ${variantCls} ${full ? styles.btnFull : ''}`}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  );
}

// ── Divider ───────────────────────────────────────────────────
export function Divider() {
  return <div className={styles.divider} />;
}

// ── Notice ────────────────────────────────────────────────────
export function Notice({ children }) {
  return <div className={styles.notice}>{children}</div>;
}

// ── Setting Row ───────────────────────────────────────────────
export function SettingRow({ label, desc, unit, inputProps }) {
  return (
    <div className={styles.settingRow}>
      <div>
        <div className={styles.settingLabel}>{label}</div>
        {desc && <div className={styles.settingDesc}>{desc}</div>}
      </div>
      <div className={styles.settingInputWrap}>
        <input className={styles.settingInput} {...inputProps} />
        {unit && <span className={styles.settingUnit}>{unit}</span>}
      </div>
    </div>
  );
}

// ── Two / Three column grid ───────────────────────────────────
export function TwoCol({ children, style }) {
  return <div className={styles.twoCol} style={style}>{children}</div>;
}

export function ThreeCol({ children }) {
  return <div className={styles.threeCol}>{children}</div>;
}

// ── Empty state ───────────────────────────────────────────────
export function Empty({ children }) {
  return <div className={styles.empty}>{children}</div>;
}
