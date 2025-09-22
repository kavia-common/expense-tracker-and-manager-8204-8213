import React from 'react';
import '../../styles/theme.css';

/**
 * Sidebar skeleton for navigation
 */
// PUBLIC_INTERFACE
export default function Sidebar() {
  /** Minimal sidebar with app title placeholder. */
  return (
    <aside className="et-sidebar" aria-label="Sidebar">
      <div className="et-sidebar__brand">Expense Tracker</div>
      <nav className="et-sidebar__nav">
        <button className="et-sidebar__link" type="button">Dashboard</button>
        <button className="et-sidebar__link" type="button">Expenses</button>
        <button className="et-sidebar__link" type="button">Reports</button>
      </nav>
    </aside>
  );
}
