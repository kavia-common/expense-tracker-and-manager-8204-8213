//
// Domain CRUD for expenses
//
import { StorageKeys, getAll, setAll, addItem, updateItem, removeItem } from './storage';

/**
 * Generate a simple unique id.
 */
function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// PUBLIC_INTERFACE
export async function listExpenses() {
  /** Returns all expenses (initializing from seed on first run). */
  return getAll(StorageKeys.EXPENSES);
}

// PUBLIC_INTERFACE
export async function addExpense(expense) {
  /** Adds a new expense. Ensures an id is present. Returns updated list. */
  const withId = { id: expense.id || uid(), ...expense };
  return addItem(StorageKeys.EXPENSES, withId);
}

// PUBLIC_INTERFACE
export async function updateExpense(id, partial) {
  /** Updates fields for the expense with given id. Returns updated list. */
  return updateItem(
    StorageKeys.EXPENSES,
    (e) => e.id === id,
    () => partial
  );
}

// PUBLIC_INTERFACE
export async function deleteExpense(id) {
  /** Deletes the expense with the given id. Returns updated list. */
  return removeItem(StorageKeys.EXPENSES, (e) => e.id === id);
}

// PUBLIC_INTERFACE
export async function replaceAllExpenses(expenses) {
  /** Replaces the entire expenses dataset. Returns saved list. */
  return setAll(StorageKeys.EXPENSES, expenses);
}
