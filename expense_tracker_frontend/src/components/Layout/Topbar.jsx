import React from 'react';
import '../../styles/theme.css';

/**
 * Topbar skeleton with simple title and right-side actions
 */
// PUBLIC_INTERFACE
export default function Topbar() {
  /** Minimal top bar. */
  return (
    <header className="et-topbar" aria-label="Topbar">
      <h1 className="et-topbar__title">My Expenses</h1>
      <div className="et-topbar__actions">
        <button className="et-btn et-btn--primary" type="button">Add Expense</button>
      </div>
    </header>
  );
}
