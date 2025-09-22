import React, { useEffect, useState } from 'react';
import Modal from '../../components/Modal/Modal';
import ExpenseForm from './ExpenseForm';
import { listExpenses, getById, create, update, remove } from '../../services/expensesService';

/**
 * Displays the list/table of expenses
 */
// PUBLIC_INTERFACE
export default function ExpenseList() {
  /**
   * Fetch expenses from the domain service on mount and render a simple table.
   * Includes basic loading, error, and empty states. Edit/Delete wired to modal & service.
   */
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit' | 'confirm-delete'
  const [currentId, setCurrentId] = useState(null);
  const [currentData, setCurrentData] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function refresh() {
    setLoading(true);
    setError('');
    try {
      const data = await listExpenses();
      setExpenses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || 'Failed to load expenses.');
    } finally {
      setLoading(false);
    }
  }

  // Load on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (isMounted) await refresh();
    })();

    // Listen for "Add Expense" button from Topbar via custom event
    function openCreate(evt) {
      const mode = evt?.detail?.mode || 'create';
      if (mode === 'create') {
        setModalMode('create');
        setCurrentData(null);
        setCurrentId(null);
        setModalOpen(true);
      }
    }
    window.addEventListener('open-expense-modal', openCreate);

    return () => {
      isMounted = false;
      window.removeEventListener('open-expense-modal', openCreate);
    };
  }, []);

  const openEdit = async (id) => {
    setError('');
    setCurrentId(id);
    try {
      const item = await getById(id);
      setCurrentData(item);
      setModalMode('edit');
      setModalOpen(true);
    } catch (err) {
      setError(err?.message || 'Failed to open edit form.');
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setCurrentData(null);
    setCurrentId(null);
    setModalOpen(true);
  };

  const openDeleteConfirm = (id) => {
    setModalMode('confirm-delete');
    setCurrentId(id);
    setCurrentData(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentId(null);
    setCurrentData(null);
    setSubmitting(false);
  };

  const submitForm = async (payload) => {
    setSubmitting(true);
    try {
      if (modalMode === 'edit' && currentId) {
        await update(currentId, payload);
      } else {
        await create(payload);
      }
      await refresh();
      closeModal();
    } catch (err) {
      setError(err?.message || 'Failed to save expense.');
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    setSubmitting(true);
    try {
      if (currentId) {
        await remove(currentId);
        await refresh();
      }
      closeModal();
    } catch (err) {
      setError(err?.message || 'Failed to delete expense.');
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h2 style={{ margin: 0 }}>Expense List</h2>
        <button className="et-btn et-btn--primary" type="button" onClick={openCreateModal}>
          + Add Expense
        </button>
      </div>

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
              <tr style={{ background: 'var(--brand-secondary-50)' }}>
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
                        onClick={() => openEdit(e.id)}
                        aria-label={`Edit expense ${e.id}`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="et-btn"
                        onClick={() => openDeleteConfirm(e.id)}
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

      {/* Add/Edit Form Modal */}
      <Modal
        isOpen={isModalOpen && (modalMode === 'create' || modalMode === 'edit')}
        title={modalMode === 'edit' ? 'Edit Expense' : 'Add Expense'}
        onClose={closeModal}
        size="md"
      >
        <ExpenseForm
          initialData={modalMode === 'edit' ? currentData : undefined}
          onSubmit={submitForm}
          onCancel={closeModal}
          submitting={submitting}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isModalOpen && modalMode === 'confirm-delete'}
        title="Delete Expense"
        onClose={closeModal}
        size="sm"
        footer={
          <>
            <button type="button" className="et-btn et-btn--ghost" onClick={closeModal} disabled={submitting}>
              Cancel
            </button>
            <button type="button" className="et-btn et-btn--primary" onClick={confirmDelete} disabled={submitting}>
              Delete
            </button>
          </>
        }
      >
        <p>Are you sure you want to delete this expense?</p>
      </Modal>
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
