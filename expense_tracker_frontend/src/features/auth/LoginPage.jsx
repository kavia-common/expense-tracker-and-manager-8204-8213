import React, { useState } from 'react';
import '../../styles/theme.css';
import { useAuth } from '../../context/AuthContext';

// PUBLIC_INTERFACE
export default function LoginPage({ onSwitchToSignup }) {
  /** Attractive login form styled with Ocean Professional theme. */
  const { login, loading, error, clearError } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });

  function handleChange(e) {
    clearError();
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await login({ email: form.email, password: form.password });
  }

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={brand}>
          <span className="et-logo">💧</span>
          <div className="et-brand-text">
            <strong>Expense</strong>
            <span>Tracker</span>
          </div>
        </div>
        <h2 style={{ margin: '8px 0 2px 0' }}>Welcome back</h2>
        <p style={{ marginTop: 0, color: 'rgba(17,24,39,0.7)' }}>Sign in to continue</p>

        {error ? (
          <div role="alert" style={alertErr}>{error}</div>
        ) : null}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, marginTop: 10 }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="et-input"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              className="et-input"
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="et-btn et-btn--primary" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={{ marginTop: 16, fontSize: 14, color: 'rgba(17,24,39,0.7)' }}>
          New here?{' '}
          <button type="button" className="et-btn et-btn--ghost" onClick={onSwitchToSignup}>
            Create an account
          </button>
        </p>
      </div>
    </div>
  );
}

const wrap = {
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  background:
    'radial-gradient(1200px 400px at 10% -10%, rgba(37, 99, 235, 0.08), transparent 60%), radial-gradient(1000px 400px at 90% -20%, rgba(245, 158, 11, 0.08), transparent 60%), var(--background)',
};

const card = {
  width: '100%',
  maxWidth: 420,
  background: 'var(--surface)',
  border: 'var(--border)',
  borderRadius: 'var(--radius)',
  boxShadow: 'var(--shadow)',
  padding: 20,
};

const brand = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  padding: '8px 10px',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--gradient-accent)',
  color: 'var(--primary)',
  fontWeight: 700,
  boxShadow: 'var(--shadow-sm)',
};

const alertErr = {
  background: 'rgba(239, 68, 68, 0.08)',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  color: 'var(--error)',
  padding: '10px 12px',
  borderRadius: 12,
  marginTop: 8,
};
