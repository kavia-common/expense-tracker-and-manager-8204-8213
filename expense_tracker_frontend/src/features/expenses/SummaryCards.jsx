import React, { useEffect, useMemo, useState } from 'react';
import '../../styles/theme.css';
import { listExpenses } from '../../services/expensesService';
import { StorageKeys } from '../../services/storage';

/**
 * Summary statistic cards for the dashboard.
 * Shows:
 * - Total expenses this month (currency)
 * - Count of expenses this month
 * - Highest spending category this month
 * - Average per day this month
 *
 * Reactivity:
 * - Loads from localStorage-backed service and updates when:
 *   - storage 'expenses' key changes (cross-tab)
 *   - custom 'expenses-updated' event is dispatched (intra-tab)
 *   - optional 'expenses-filter' event to narrow data (same predicate used by list and charts)
 */
// PUBLIC_INTERFACE
export default function SummaryCards() {
  /** Pull expenses and compute monthly metrics; render attractive, responsive cards. */
  const [allExpenses, setAllExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPredicate, setFilterPredicate] = useState(null);

  // Load data on mount and wire listeners
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await listExpenses();
        if (mounted) setAllExpenses(Array.isArray(data) ? data : []);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    // React to storage changes (other tabs or same-tab writes)
    function onStorage(e) {
      if (e.key === StorageKeys.EXPENSES) {
        listExpenses().then((data) => setAllExpenses(Array.isArray(data) ? data : []));
      }
    }
    window.addEventListener('storage', onStorage);

    // React to domain-level updates
    function onExplicitUpdate() {
      listExpenses().then((data) => setAllExpenses(Array.isArray(data) ? data : []));
    }
    window.addEventListener('expenses-updated', onExplicitUpdate);

    // Optional external filter support
    function onFilter(evt) {
      const pred = evt?.detail?.predicate;
      if (typeof pred === 'function') {
        setFilterPredicate(() => pred);
      } else if (pred == null) {
        setFilterPredicate(null);
      }
    }
    window.addEventListener('expenses-filter', onFilter);

    return () => {
      mounted = false;
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('expenses-updated', onExplicitUpdate);
      window.removeEventListener('expenses-filter', onFilter);
    };
  }, []);

  // Apply external predicate if any
  const filtered = useMemo(() => {
    if (!filterPredicate) return allExpenses;
    try {
      return allExpenses.filter(filterPredicate);
    } catch {
      return allExpenses;
    }
  }, [allExpenses, filterPredicate]);

  // Current month boundaries
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);

  const firstKey = ymd(firstDay);
  const lastKey = ymd(lastDay);

  // Filter to current month
  const thisMonth = useMemo(() => {
    return filtered.filter((e) => {
      const d = String(e.date || '');
      // include if between firstKey and lastKey inclusive
      return d >= firstKey && d <= lastKey;
    });
  }, [filtered, firstKey, lastKey]);

  // Compute metrics
  const { total, count, topCategory, avgPerDay } = useMemo(() => {
    let sum = 0;
    let cnt = 0;
    const byCat = new Map();
    for (const e of thisMonth) {
      const amt = Number(e.amount) || 0;
      sum += amt;
      cnt += 1;
      const cat = (e.category || 'Uncategorized').trim();
      byCat.set(cat, (byCat.get(cat) || 0) + amt);
    }
    // Top category by spend
    let top = { label: '-', value: 0 };
    for (const [label, value] of byCat.entries()) {
      if (value > top.value) top = { label, value };
    }
    // Average per day in current month (use actual days in month)
    const daysInMonth = lastDay.getDate();
    const avg = daysInMonth > 0 ? sum / daysInMonth : 0;
    return { total: sum, count: cnt, topCategory: top, avgPerDay: avg };
  }, [thisMonth, lastDay]);

  return (
    <div>
      <h3 style={{ marginTop: 0, marginBottom: 12, color: 'var(--text-primary)' }}>Summary</h3>

      {loading ? (
        <div style={cardsGrid}>
          <Card title="This Month" value="Loading…" hint="Total spend" />
          <Card title="Transactions" value="…" hint="Count this month" />
          <Card title="Top Category" value="…" hint="Highest spend" />
          <Card title="Avg/Day" value="…" hint="Average per calendar day" />
        </div>
      ) : (
        <div style={cardsGrid}>
          <Card
            title="This Month"
            value={`$${total.toFixed(2)}`}
            hint={`${prettyMonthName(currentYear, currentMonth)} total`}
            accent="blue"
          />
          <Card
            title="Transactions"
            value={String(count)}
            hint="Count this month"
            accent="amber"
          />
          <Card
            title="Top Category"
            value={topCategory.label}
            hint={topCategory.value > 0 ? `$${topCategory.value.toFixed(2)}` : '—'}
            accent="green"
          />
          <Card
            title="Avg/Day"
            value={`$${avgPerDay.toFixed(2)}`}
            hint="Average per calendar day"
            accent="violet"
          />
        </div>
      )}
    </div>
  );
}

/**
 * Small presentational card component
 */
function Card({ title, value, hint, accent = 'blue' }) {
  const accentStyles = {
    blue: { bg: 'rgba(37,99,235,0.10)', dot: '#2563EB' },
    amber: { bg: 'rgba(245,158,11,0.12)', dot: '#F59E0B' },
    green: { bg: 'rgba(16,185,129,0.12)', dot: '#10B981' },
    violet: { bg: 'rgba(139,92,246,0.12)', dot: '#8B5CF6' },
  }[accent] || { bg: 'rgba(37,99,235,0.10)', dot: '#2563EB' };

  return (
    <div style={{ ...cardWrap, background: 'var(--surface)', border: 'var(--border)', boxShadow: 'var(--shadow)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span
          aria-hidden
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: accentStyles.dot,
            boxShadow: '0 0 0 2px rgba(17,24,39,0.06)',
          }}
        />
        <span style={{ fontSize: 12, color: 'rgba(17,24,39,0.6)', fontWeight: 600 }}>{title}</span>
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

// Helpers
function ymd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function prettyMonthName(year, monthIndex) {
  const d = new Date(year, monthIndex, 1);
  return d.toLocaleString(undefined, { month: 'long' });
}

const cardsGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 16,
};

const cardWrap = {
  padding: 14,
  borderRadius: 14,
};
