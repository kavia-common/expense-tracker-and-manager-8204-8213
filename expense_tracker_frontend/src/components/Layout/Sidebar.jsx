import React from 'react';
import '../../styles/theme.css';

/**
 * Sidebar skeleton for navigation with Ocean Professional styling
 */
// PUBLIC_INTERFACE
export default function Sidebar() {
  /** Sidebar with brand, sections and interactive links. */
  return (
    <aside className="et-sidebar" aria-label="Sidebar">
      <div className="et-sidebar__brand">
        <span className="et-logo">💧</span>
        <div className="et-brand-text">
          <strong>Expense</strong>
          <span>Tracker</span>
        </div>
      </div>

      <nav className="et-sidebar__nav" aria-label="Primary">
        <div className="et-sidebar__section-label">Overview</div>
        <button className="et-sidebar__link is-active" type="button" aria-current="page">
          <span className="et-dot" /> Dashboard
        </button>
        <button className="et-sidebar__link" type="button">
          <span className="et-dot" /> Expenses
        </button>
        <button className="et-sidebar__link" type="button">
          <span className="et-dot" /> Reports
        </button>
      </nav>

      <div className="et-sidebar__footer">
        <button className="et-btn et-btn--ghost" type="button">Settings</button>
      </div>
    </aside>
  );
}
