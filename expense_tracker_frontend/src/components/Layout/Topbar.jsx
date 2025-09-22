import React from 'react';
import '../../styles/theme.css';

/**
 * Topbar skeleton with simple title and right-side actions
 */
// PUBLIC_INTERFACE
export default function Topbar() {
  /** Minimal top bar with Ocean gradient surface. */
  const openAddExpense = () => {
    // Dispatch a custom event so ExpenseList (or any listener) can open the modal
    const evt = new CustomEvent('open-expense-modal', { detail: { mode: 'create' } });
    window.dispatchEvent(evt);
  };

  return (
    <header className="et-topbar" aria-label="Topbar">
      <h1 className="et-topbar__title">My Expenses</h1>
      <div className="et-topbar__actions">
        <button className="et-btn et-btn--ghost" type="button" aria-label="Search">Search</button>
        <button className="et-btn et-btn--primary" type="button" onClick={openAddExpense}>Add Expense</button>
      </div>
    </header>
  );
}
