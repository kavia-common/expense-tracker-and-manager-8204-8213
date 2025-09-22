import React from 'react';
import '../../styles/theme.css';
import { useAuth } from '../../context/AuthContext';

/**
 * Topbar skeleton with simple title and right-side actions
 */
// PUBLIC_INTERFACE
export default function Topbar() {
  /** Minimal top bar with Ocean gradient surface. */
  const { user, logout, loading } = useAuth();

  const openAddExpense = () => {
    // Dispatch a custom event so ExpenseList (or any listener) can open the modal
    const evt = new CustomEvent('open-expense-modal', { detail: { mode: 'create' } });
    window.dispatchEvent(evt);
  };

  return (
    <header className="et-topbar" aria-label="Topbar">
      <h1 className="et-topbar__title">My Expenses</h1>
      <div className="et-topbar__actions">
        <span style={{ alignSelf: 'center', marginRight: 6, color: 'var(--text-inverse)' }}>
          {user ? `Hi, ${user.name}` : ''}
        </span>
        <button className="et-btn et-btn--ghost" type="button" aria-label="Search">Search</button>
        <button className="et-btn et-btn--secondary" type="button" onClick={openAddExpense}>Add Expense</button>
        <button className="et-btn" type="button" onClick={logout} disabled={loading} aria-label="Sign out">
          Sign out
        </button>
      </div>
    </header>
  );
}
