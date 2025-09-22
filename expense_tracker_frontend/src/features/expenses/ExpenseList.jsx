import React, { useEffect, useState } from 'react';
import { listExpenses } from '../../services/expensesService';

/**
 * Displays the list/table of expenses
 */
// PUBLIC_INTERFACE
export default function ExpenseList() {
  /**
   * Fetch expenses from the domain service on mount and render a simple table.
   * Includes basic loading, error, and empty states. Edit/Delete are stubs.
   */
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await listExpenses();
        if (isMounted) setExpenses(Array.isArray(data) ? data : []);
      } catch (err) {
        if (isMounted) setError(err?.message || 'Failed to load expenses.');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleEdit = (id) => {
    // Placeholder: integrate with edit modal/form in future task
    // eslint-disable-next-line no-alert
    alert(`Edit action clicked for ${id}`);
  };

  const handleDelete = (id) => {
    // Placeholder: integrate with remove flow in future task
    // eslint-disable-next-line no-alert
    alert(`Delete action clicked for ${id}`);
  };

  return (
    <div>
      <h2>Expense List</h2>

      {loading && <p>Loading expenses…</p>}
      {!loading && error && (
        <p role="alert" style={{ color: '#EF4444' }}>
          {error}
        </p>
      )}

      {!loading && !error && expenses.length === 0 && (
        <p>No expenses yet. Add your first one to get started.</p>
      )}

      {!loading && !error && expenses.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              background: 'var(--surface)',
              boxShadow: 'var(--shadow)',
              borderRadius: 'var(--radius)',
              overflow: 'hidden',
            }}
          >
            <thead>
              <tr style={{ background: 'rgba(37, 99, 235, 0.06)' }}>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Description</th>
                <th style={thStyle} align="right">Amount</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} style={{ borderTop: 'var(--border)' }}>
                  <td style={tdStyle}>{e.date}</td>
                  <td style={tdStyle}>{e.category}</td>
                  <td style={tdStyle}>{e.description || '-'}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    ${Number(e.amount).toFixed(2)}
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        className="et-btn"
                        onClick={() => handleEdit(e.id)}
                        aria-label={`Edit expense ${e.id}`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="et-btn"
                        onClick={() => handleDelete(e.id)}
                        aria-label={`Delete expense ${e.id}`}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const thStyle = {
  padding: '12px 14px',
  textAlign: 'left',
  borderBottom: 'var(--border)',
  color: 'var(--text)',
  fontWeight: 600,
};

const tdStyle = {
  padding: '12px 14px',
  color: 'var(--text)',
};
