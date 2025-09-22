import React, { useEffect, useMemo, useState } from 'react';
import '../../styles/theme.css';
import { listExpenses } from '../../services/expensesService';

/**
 * Reports View
 * - Filter by month (YYYY-MM) and category
 * - Shows totals and category breakdowns for current filtered set
 * - Export filtered dataset to JSON or CSV
 */
// PUBLIC_INTERFACE
export default function Reports() {
  /** Fetch expenses for current user and provide reporting utilities. */
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [month, setMonth] = useState(''); // YYYY-MM or ''
  const [category, setCategory] = useState(''); // category or ''

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await listExpenses();
        if (mounted) setAll(Array.isArray(data) ? data : []);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Derive unique categories from all data
  const categories = useMemo(() => {
    const s = new Set();
    for (const e of all) {
      const c = (e.category || 'Uncategorized').trim();
      if (c) s.add(c);
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [all]);

  // Apply filters
  const filtered = useMemo(() => {
    return all.filter((e) => {
      const passMonth = month ? String(e.date || '').startsWith(month) : true;
      const passCat = category ? (String(e.category || '').trim() === category) : true;
      return passMonth && passCat;
    });
  }, [all, month, category]);

  // Aggregations
  const { total, count, byCategory, byDay } = useMemo(() => {
    let sum = 0;
    let cnt = 0;
    const cat = new Map();
    const day = new Map();
    for (const e of filtered) {
      const amt = Number(e.amount) || 0;
      sum += amt;
      cnt += 1;
      const cKey = (e.category || 'Uncategorized').trim();
      cat.set(cKey, (cat.get(cKey) || 0) + amt);
      const dKey = String(e.date || '');
      day.set(dKey, (day.get(dKey) || 0) + amt);
    }
    const catArr = Array.from(cat.entries()).map(([label, value]) => ({ label, value }));
    const dayArr = Array.from(day.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => ({ key, value }));
    return { total: sum, count: cnt, byCategory: catArr, byDay: dayArr };
  }, [filtered]);

  function exportJSON() {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json;charset=utf-8' });
    triggerDownload(blob, `expenses_report${suffix()}.json`);
  }

  function exportCSV() {
    const cols = ['id', 'date', 'amount', 'category', 'description', 'paymentMethod', 'tags'];
    const header = cols.join(',');
    const rows = filtered.map((e) => {
      const values = cols.map((k) => {
        let v = e[k];
        if (Array.isArray(v)) v = v.join('|');
        if (v == null) v = '';
        const text = String(v).replace(/"/g, '""');
        return `"${text}"`;
      });
      return values.join(',');
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    triggerDownload(blob, `expenses_report${suffix()}.csv`);
  }

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function suffix() {
    const parts = [];
    if (month) parts.push(month);
    if (category) parts.push(category.replace(/\s+/g, '_'));
    return parts.length ? `_${parts.join('_')}` : '';
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h2 style={{ margin: 0 }}>Reports</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="et-btn" type="button" onClick={exportJSON} disabled={loading || filtered.length === 0}>
            Export JSON
          </button>
          <button className="et-btn et-btn--primary" type="button" onClick={exportCSV} disabled={loading || filtered.length === 0}>
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(3, minmax(140px, 1fr))', marginTop: 14 }}>
        <div style={{ display: 'grid', gap: 6 }}>
          <label htmlFor="rep-month">Month</label>
          <input
            id="rep-month"
            className="et-input"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gap: 6 }}>
          <label htmlFor="rep-category">Category</label>
          <select
            id="rep-category"
            className="et-input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gap: 6 }}>
          <label style={{ visibility: 'hidden' }}>Reset</label>
          <div>
            <button type="button" className="et-btn et-btn--ghost" onClick={() => { setMonth(''); setCategory(''); }}>
              Clear filters
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 16 }}>
        <StatCard label="Total" value={`$${total.toFixed(2)}`} hint="Sum of amounts" accent="blue" />
        <StatCard label="Transactions" value={String(count)} hint="Count" accent="amber" />
        <StatCard label="Avg/Txn" value={count > 0 ? `$${(total / count).toFixed(2)}` : '—'} hint="Average amount" accent="green" />
      </div>

      {/* Breakdown */}
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr', marginTop: 16 }}>
        <div style={card}>
          <h4 style={cardTitle}>By Category</h4>
          {byCategory.length === 0 ? (
            <p style={{ marginTop: 6, color: 'rgba(17,24,39,0.6)' }}>No data</p>
          ) : (
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle} align="right">Amount</th>
                  <th style={thStyle} align="right">Share</th>
                </tr>
              </thead>
              <tbody>
                {byCategory
                  .sort((a, b) => b.value - a.value)
                  .map((row) => (
                    <tr key={row.label} style={{ borderTop: 'var(--border)' }}>
                      <td style={tdStyle}>{row.label}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        ${row.value.toFixed(2)}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        {total > 0 ? `${((row.value / total) * 100).toFixed(1)}%` : '—'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={card}>
          <h4 style={cardTitle}>By Day {month ? `(${prettyMonth(month)})` : ''}</h4>
          {byDay.length === 0 ? (
            <p style={{ marginTop: 6, color: 'rgba(17,24,39,0.6)' }}>No data</p>
          ) : (
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle} align="right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {byDay.map((row) => (
                  <tr key={row.key} style={{ borderTop: 'var(--border)' }}>
                    <td style={tdStyle}>{row.key}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      ${row.value.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function prettyMonth(ym) {
  if (!/^\d{4}-\d{2}$/.test(ym)) return ym;
  const [y, m] = ym.split('-').map(Number);
  const date = new Date(y, m - 1, 1);
  return date.toLocaleString(undefined, { month: 'long', year: 'numeric' });
}

function StatCard({ label, value, hint, accent = 'blue' }) {
  const accentStyles = {
    blue: { bg: 'rgba(37,99,235,0.10)', dot: '#2563EB' },
    amber: { bg: 'rgba(245,158,11,0.12)', dot: '#F59E0B' },
    green: { bg: 'rgba(16,185,129,0.12)', dot: '#10B981' },
  }[accent] || { bg: 'rgba(37,99,235,0.10)', dot: '#2563EB' };
  return (
    <div style={{ ...card, display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          aria-hidden
          style={{ width: 10, height: 10, borderRadius: 999, background: accentStyles.dot, boxShadow: '0 0 0 2px rgba(17,24,39,0.06)' }}
        />
        <span style={{ fontSize: 12, color: 'rgba(17,24,39,0.6)', fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 0.2 }}>{value}</div>
        <span
          style={{
            fontSize: 12,
            color: 'rgba(17,24,39,0.7)',
            background: accentStyles.bg,
            padding: '4px 8px',
            borderRadius: 999,
            border: '1px solid rgba(17,24,39,0.06)',
          }}
        >
          {hint}
        </span>
      </div>
    </div>
  );
}

const card = {
  background: 'var(--surface)',
  border: 'var(--border)',
  borderRadius: 'var(--radius)',
  boxShadow: 'var(--shadow)',
  padding: 14,
};

const cardTitle = {
  margin: '6px 0 14px 0',
  fontSize: 16,
  fontWeight: 600,
};

const thStyle = {
  padding: '12px 14px',
  textAlign: 'left',
  borderBottom: 'var(--border)',
  color: 'var(--text-primary)',
  fontWeight: 600,
};

const tdStyle = {
  padding: '12px 14px',
  color: 'var(--text)',
};
