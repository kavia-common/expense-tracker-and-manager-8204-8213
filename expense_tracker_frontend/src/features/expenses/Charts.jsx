import React, { useEffect, useMemo, useState } from 'react';
import '../../styles/theme.css';
import { StorageKeys } from '../../services/storage';
import { listExpenses } from '../../services/expensesService';

/**
 * Visualization charts for expenses over time/by category using lightweight SVG.
 * - Category Breakdown: donut chart with legend
 * - Monthly Totals: bar chart Jan..Dec (for the year of data or current year)
 *
 * Reactivity:
 * - Re-renders whenever expenses change (list/create/update/remove) because those update localStorage.
 * - Also listens to custom events:
 *   - "expenses-updated" (detail: optional { source })
 *   - "expenses-filter" (detail: { predicate?: (expense) => boolean })
 *
 * Filters:
 * - External code can dispatch "expenses-filter" to provide a predicate that will be applied
 *   to the full expenses list before aggregations.
 */
// PUBLIC_INTERFACE
export default function Charts() {
  /** Load and observe expenses; compute aggregates and render charts. */
  const [allExpenses, setAllExpenses] = useState([]);
  const [filterPredicate, setFilterPredicate] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load initial data
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

    // Listen to localStorage changes (other tabs or same tab writes)
    function onStorage(e) {
      if (e.key === StorageKeys.EXPENSES) {
        // Re-pull via service to apply normalization & user scoping
        listExpenses().then((data) => setAllExpenses(Array.isArray(data) ? data : []));
      }
    }
    window.addEventListener('storage', onStorage);

    // Listen to explicit domain update notifications (intra-tab)
    function onExplicitUpdate() {
      listExpenses().then((data) => setAllExpenses(Array.isArray(data) ? data : []));
    }
    window.addEventListener('expenses-updated', onExplicitUpdate);

    // Optional filter hook
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

  // Apply filter predicate if present
  const expenses = useMemo(() => {
    if (!filterPredicate) return allExpenses;
    try {
      return allExpenses.filter(filterPredicate);
    } catch {
      return allExpenses;
    }
  }, [allExpenses, filterPredicate]);

  // Aggregations
  const { byCategory, totalAll, byMonth, monthsOrder } = useMemo(() => {
    const cat = new Map();
    let total = 0;
    const monthTotals = new Map();

    for (const e of expenses) {
      const amt = Number(e.amount) || 0;
      // category
      const cKey = (e.category || 'Uncategorized').trim();
      cat.set(cKey, (cat.get(cKey) || 0) + amt);
      total += amt;
      // month key YYYY-MM
      const mKey = (e.date || '').slice(0, 7);
      if (mKey) monthTotals.set(mKey, (monthTotals.get(mKey) || 0) + amt);
    }

    // Sort months chronologically
    const sortedMonthKeys = Array.from(monthTotals.keys()).sort();

    return {
      byCategory: Array.from(cat.entries()).map(([label, value]) => ({ label, value })),
      totalAll: total,
      byMonth: Array.from(sortedMonthKeys, (k) => ({ key: k, value: monthTotals.get(k) })),
      monthsOrder: sortedMonthKeys,
    };
  }, [expenses]);

  // Colors generator (consistent but simple)
  const palette = [
    '#2563EB', // blue
    '#F59E0B', // amber
    '#10B981', // emerald
    '#EC4899', // pink
    '#8B5CF6', // violet
    '#06B6D4', // cyan
    '#F43F5E', // rose
    '#84CC16', // lime
  ];
  const colorForIndex = (i) => palette[i % palette.length];

  // Donut chart geometry
  const donutSize = 180;
  const donutRadius = 70;
  const donutStroke = 24;
  const donutCenter = donutSize / 2;

  function arcLength(value) {
    if (totalAll <= 0) return 0;
    const p = Math.max(0, value) / totalAll; // clamp
    const circumference = 2 * Math.PI * donutRadius;
    return p * circumference;
  }

  // Bar chart geometry
  const barW = 28;
  const barGap = 12;
  const chartPad = 20;
  const barChartH = 160;

  const maxMonth = byMonth.reduce((m, x) => Math.max(m, x.value), 0);
  const scaleY = (v) => {
    if (maxMonth <= 0) return 0;
    const h = (v / maxMonth) * (barChartH - chartPad * 2);
    return Math.max(0, Math.min(h, barChartH - chartPad * 2));
  };

  if (loading) {
    return (
      <div style={wrap}>
        <h3 style={title}>Charts</h3>
        <p>Loading charts…</p>
      </div>
    );
  }

  if (!expenses.length) {
    return (
      <div style={wrap}>
        <h3 style={title}>Charts</h3>
        <p>No expenses yet. Add some to see visualizations.</p>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <h3 style={title}>Charts</h3>

      <div style={grid}>
        {/* Category Donut */}
        <div style={card}>
          <h4 style={cardTitle}>By Category</h4>
          {totalAll <= 0 || byCategory.length === 0 ? (
            <p style={{ marginTop: 6, color: 'rgba(17,24,39,0.6)' }}>No data</p>
          ) : (
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'center' }}>
              <svg
                width={donutSize}
                height={donutSize}
                viewBox={`0 0 ${donutSize} ${donutSize}`}
                role="img"
                aria-label="Expenses by category"
              >
                <title>Expenses by category</title>
                <g transform={`rotate(-90 ${donutCenter} ${donutCenter})`}>
                  {(() => {
                    const circumference = 2 * Math.PI * donutRadius;
                    let offset = 0;
                    return byCategory.map((slice, i) => {
                      const len = arcLength(slice.value);
                      const dasharray = `${len} ${circumference - len}`;
                      const strokeDashoffset = offset;
                      offset = (offset + len) % circumference;

                      return (
                        <circle
                          key={slice.label}
                          cx={donutCenter}
                          cy={donutCenter}
                          r={donutRadius}
                          fill="transparent"
                          stroke={colorForIndex(i)}
                          strokeWidth={donutStroke}
                          strokeDasharray={dasharray}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="butt"
                        />
                      );
                    });
                  })()}
                </g>
                {/* Center label */}
                <g>
                  <circle cx={donutCenter} cy={donutCenter} r={donutRadius - donutStroke / 2} fill="#fff" opacity="0" />
                  <text
                    x={donutCenter}
                    y={donutCenter - 4}
                    textAnchor="middle"
                    style={{ fontSize: 14, fontWeight: 600, fill: 'rgba(17,24,39,0.8)' }}
                  >
                    ${totalAll.toFixed(2)}
                  </text>
                  <text
                    x={donutCenter}
                    y={donutCenter + 14}
                    textAnchor="middle"
                    style={{ fontSize: 11, fill: 'rgba(17,24,39,0.6)' }}
                  >
                    total
                  </text>
                </g>
              </svg>

              {/* Legend */}
              <div style={{ display: 'grid', gap: 8 }}>
                {byCategory
                  .sort((a, b) => b.value - a.value)
                  .map((c, i) => (
                    <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        aria-hidden
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 999,
                          background: colorForIndex(i),
                          boxShadow: '0 0 0 2px rgba(17,24,39,0.06)',
                        }}
                      />
                      <span style={{ fontSize: 13 }}>{c.label}</span>
                      <span style={{ marginLeft: 'auto', fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
                        ${c.value.toFixed(2)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Monthly Bars */}
        <div style={card}>
          <h4 style={cardTitle}>Monthly Totals</h4>
          {byMonth.length === 0 ? (
            <p style={{ marginTop: 6, color: 'rgba(17,24,39,0.6)' }}>No data</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <svg
                width={Math.max((barW + barGap) * byMonth.length + chartPad * 2, 320)}
                height={barChartH}
                role="img"
                aria-label="Monthly expense totals"
              >
                <title>Monthly expense totals</title>
                {/* Axes baseline */}
                <line
                  x1={chartPad}
                  y1={barChartH - chartPad}
                  x2={Math.max((barW + barGap) * byMonth.length + chartPad, 320 - chartPad)}
                  y2={barChartH - chartPad}
                  stroke="rgba(17,24,39,0.15)"
                  strokeWidth="1"
                />
                {/* Bars */}
                {byMonth.map((m, i) => {
                  const h = scaleY(m.value);
                  const x = chartPad + i * (barW + barGap);
                  const y = barChartH - chartPad - h;
                  return (
                    <g key={m.key}>
                      <rect
                        x={x}
                        y={y}
                        width={barW}
                        height={h}
                        rx="6"
                        fill="url(#barGrad)"
                        stroke="rgba(17,24,39,0.06)"
                      />
                      <text
                        x={x + barW / 2}
                        y={barChartH - chartPad + 12}
                        textAnchor="middle"
                        style={{ fontSize: 11, fill: 'rgba(17,24,39,0.7)' }}
                      >
                        {prettyMonth(m.key)}
                      </text>
                      <text
                        x={x + barW / 2}
                        y={y - 6}
                        textAnchor="middle"
                        style={{ fontSize: 11, fill: 'rgba(17,24,39,0.7)' }}
                      >
                        {m.value > 0 ? `$${m.value.toFixed(0)}` : ''}
                      </text>
                    </g>
                  );
                })}
                {/* Gradient def */}
                <defs>
                  <linearGradient id="barGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.9" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helpers
function prettyMonth(key) {
  // key like "2025-09"
  if (!/^\d{4}-\d{2}$/.test(key)) return key;
  const [y, m] = key.split('-').map((x) => Number(x));
  const date = new Date(y, m - 1, 1);
  return date.toLocaleString(undefined, { month: 'short' });
}

const wrap = {
  marginTop: 16,
};

const title = {
  marginTop: 0,
  marginBottom: 12,
};

const grid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 16,
};

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
