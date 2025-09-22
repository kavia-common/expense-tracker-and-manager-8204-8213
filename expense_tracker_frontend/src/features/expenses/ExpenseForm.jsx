import React, { useEffect, useMemo, useState } from 'react';
import { helpers } from '../../services/expensesService';

/**
 * Form for adding/editing an expense.
 * Props:
 * - initialData: expense-like object for edit, or undefined for create
 * - onSubmit: function(expenseData) => Promise|void called with form data
 * - onCancel: function() to dismiss form
 */
// PUBLIC_INTERFACE
export default function ExpenseForm({ initialData, onSubmit, onCancel, submitting }) {
  /** Manage local form state with sensible defaults */
  const [form, setForm] = useState(() => ({
    date: '',
    amount: '',
    category: '',
    description: '',
    paymentMethod: '',
    tags: '',
  }));
  const [error, setError] = useState('');

  const mode = useMemo(() => (initialData?.id ? 'edit' : 'create'), [initialData?.id]);

  useEffect(() => {
    if (initialData) {
      setForm({
        date: initialData.date || '',
        amount: initialData.amount != null ? String(initialData.amount) : '',
        category: initialData.category || '',
        description: initialData.description || '',
        paymentMethod: initialData.paymentMethod || '',
        tags: Array.isArray(initialData.tags) ? initialData.tags.join(', ') : (initialData.tags || ''),
      });
    }
  }, [initialData]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  // Basic client validation mirroring service shape
  function validateLocal(payload) {
    try {
      const normalized = helpers.normalizeExpense(payload);
      helpers.validateExpense(normalized);
      return { ok: true, normalized };
    } catch (err) {
      return { ok: false, message: err?.message || 'Invalid input' };
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const payload = {
      ...(initialData?.id ? { id: initialData.id } : {}),
      date: form.date,
      amount: Number(form.amount),
      category: form.category,
      description: form.description?.trim() || '',
      paymentMethod: form.paymentMethod?.trim() || '',
      tags: form.tags,
    };
    const check = validateLocal(payload);
    if (!check.ok) {
      setError(check.message);
      return;
    }
    await onSubmit?.(payload);
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div role="alert" style={{ color: 'var(--error)', marginBottom: 10 }}>
          {error}
        </div>
      )}
      <div style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'grid', gap: 6 }}>
          <label htmlFor="date">Date</label>
          <input
            id="date"
            name="date"
            type="date"
            className="et-input"
            value={form.date}
            onChange={handleChange}
            required
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'grid', gap: 6 }}>
          <label htmlFor="amount">Amount</label>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            className="et-input"
            value={form.amount}
            onChange={handleChange}
            required
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'grid', gap: 6 }}>
          <label htmlFor="category">Category</label>
          <input
            id="category"
            name="category"
            type="text"
            className="et-input"
            value={form.category}
            onChange={handleChange}
            placeholder="e.g., Food, Transport"
            required
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'grid', gap: 6 }}>
          <label htmlFor="description">Description</label>
          <input
            id="description"
            name="description"
            type="text"
            className="et-input"
            value={form.description}
            onChange={handleChange}
            placeholder="Optional"
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'grid', gap: 6 }}>
          <label htmlFor="paymentMethod">Payment Method</label>
          <input
            id="paymentMethod"
            name="paymentMethod"
            type="text"
            className="et-input"
            value={form.paymentMethod}
            onChange={handleChange}
            placeholder="Card, Cash, Transfer"
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'grid', gap: 6 }}>
          <label htmlFor="tags">Tags (comma separated)</label>
          <input
            id="tags"
            name="tags"
            type="text"
            className="et-input"
            value={form.tags}
            onChange={handleChange}
            placeholder="e.g., work, team"
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
          <button type="button" className="et-btn et-btn--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="submit"
            className="et-btn et-btn--primary"
            disabled={!!submitting}
            aria-busy={!!submitting}
          >
            {mode === 'edit' ? 'Save Changes' : 'Add Expense'}
          </button>
        </div>
      </div>
    </form>
  );
}

const inputStyle = {
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid rgba(17,24,39,0.12)',
  outline: 'none',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)',
};
