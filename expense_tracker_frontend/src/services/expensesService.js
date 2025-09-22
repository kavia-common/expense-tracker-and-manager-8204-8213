//
//
// Domain CRUD service for expenses
//
// This module provides a JSON-safe, localStorage-backed expense service that
// uses the storage.js helpers. All public methods return plain JSON-compatible
// data and never Date or other non-serializable objects.
//
// Typical expense shape:
// {
//   id: string,
//   date: string (ISO YYYY-MM-DD),
//   amount: number,
//   category: string,
//   description?: string,
//   paymentMethod?: string,
//   tags?: string[]
// }
//
import { StorageKeys, getAll, setAll, addItem, updateItem, removeItem } from './storage';
import { getSession } from './auth';

/**
 * Normalize an expense into a JSON-safe object with canonical field types.
 * - Ensures amount is a finite number (2 decimals)
 * - Ensures date is a YYYY-MM-DD string (not Date object)
 * - Ensures tags is an array of strings
 * - Trims string fields
 */
function normalizeExpense(raw) {
  const exp = { ...raw };

  // Normalize date
  if (exp.date instanceof Date) {
    // Convert Date to yyyy-mm-dd
    const y = exp.date.getFullYear();
    const m = String(exp.date.getMonth() + 1).padStart(2, '0');
    const d = String(exp.date.getDate()).padStart(2, '0');
    exp.date = `${y}-${m}-${d}`;
  } else if (typeof exp.date === 'string') {
    // Accept as-is; further validation happens in validateExpense
    exp.date = exp.date.trim();
  }

  // Normalize amount
  if (typeof exp.amount === 'string') {
    const parsed = Number(exp.amount);
    exp.amount = Number.isFinite(parsed) ? parsed : exp.amount;
  }
  if (typeof exp.amount === 'number') {
    // Round to 2 decimals without introducing string type
    exp.amount = Math.round((exp.amount + Number.EPSILON) * 100) / 100;
  }

  // Normalize strings
  if (typeof exp.category === 'string') exp.category = exp.category.trim();
  if (typeof exp.description === 'string') exp.description = exp.description.trim();
  if (typeof exp.paymentMethod === 'string') exp.paymentMethod = exp.paymentMethod.trim();

  // Normalize tags to array of strings
  if (Array.isArray(exp.tags)) {
    exp.tags = exp.tags
      .filter((t) => t != null)
      .map((t) => String(t).trim())
      .filter((t) => t.length > 0);
  } else if (typeof exp.tags === 'string') {
    exp.tags = exp.tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  } else if (exp.tags == null) {
    exp.tags = [];
  } else {
    exp.tags = [String(exp.tags).trim()].filter(Boolean);
  }

  return exp;
}

/**
 * Validate an expense object for required fields and types.
 * Throws an Error with an explanatory message if invalid.
 */
function validateExpense(expense) {
  if (!expense) throw new Error('Expense is required');
  const e = expense;

  // Required string fields
  const mustBeString = ['date', 'category'];
  mustBeString.forEach((k) => {
    if (typeof e[k] !== 'string' || e[k].trim().length === 0) {
      throw new Error(`Field "${k}" must be a non-empty string`);
    }
  });

  // Amount
  if (typeof e.amount !== 'number' || !Number.isFinite(e.amount)) {
    throw new Error('Field "amount" must be a finite number');
  }

  // Date shape: YYYY-MM-DD (simple check)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date)) {
    throw new Error('Field "date" must be in format YYYY-MM-DD');
  }

  // Optional string fields
  ['description', 'paymentMethod'].forEach((k) => {
    if (e[k] != null && typeof e[k] !== 'string') {
      throw new Error(`Field "${k}" must be a string if provided`);
    }
  });

  // Tags
  if (!Array.isArray(e.tags)) {
    throw new Error('Field "tags" must be an array of strings');
  }
  const allStrings = e.tags.every((t) => typeof t === 'string');
  if (!allStrings) {
    throw new Error('All "tags" must be strings');
  }
}

/**
 * Generate a simple unique id for expenses.
 */
function generateId() {
  return `exp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// PUBLIC_INTERFACE
export async function listExpenses() {
  /** Returns all expenses for the current user (initializing from seed on first run). */
  const session = getSession();
  const userId = session?.userId || null;
  const list = await getAll(StorageKeys.EXPENSES);
  const mine = userId ? list.filter((e) => e.userId === userId) : [];
  // Ensure output is normalized JSON-safe
  return mine.map((e) => normalizeExpense(e));
}

// PUBLIC_INTERFACE
export async function getById(id) {
  /** Returns a single expense by id for current user, or null if not found. */
  if (!id) return null;
  const session = getSession();
  const userId = session?.userId || null;
  if (!userId) return null;
  const list = await getAll(StorageKeys.EXPENSES);
  const found = list.find((e) => e.id === id && e.userId === userId);
  return found ? normalizeExpense(found) : null;
}

// PUBLIC_INTERFACE
export async function create(expense) {
  /**
   * Creates a new expense for current user.
   * - Generates id if missing.
   * - Normalizes and validates input.
   * - Persists to storage and returns the created expense.
   */
  const session = getSession();
  const userId = session?.userId || null;
  if (!userId) throw new Error('Not authenticated');

  const normalized = normalizeExpense({
    id: expense?.id || generateId(),
    ...expense,
    userId,
  });
  validateExpense(normalized);

  await addItem(StorageKeys.EXPENSES, normalized);
  // Return the created item as saved (normalized)
  return normalized;
}

// PUBLIC_INTERFACE
export async function update(id, partial) {
  /**
   * Updates an existing expense by id with provided partial fields for the current user.
   * - Loads existing expense, merges, normalizes, validates.
   * - Persists change and returns updated expense.
   */
  if (!id) throw new Error('Id is required for update');
  const session = getSession();
  const userId = session?.userId || null;
  if (!userId) throw new Error('Not authenticated');

  const list = await getAll(StorageKeys.EXPENSES);
  const existing = list.find((e) => e.id === id && e.userId === userId);
  if (!existing) throw new Error('Expense not found');

  const merged = { ...existing, ...partial, id, userId }; // keep ownership
  const normalized = normalizeExpense(merged);
  validateExpense(normalized);

  await updateItem(
    StorageKeys.EXPENSES,
    (e) => e.id === id && e.userId === userId,
    () => normalized
  );

  return normalized;
}

// PUBLIC_INTERFACE
export async function remove(id) {
  /**
   * Removes an expense by id for the current user.
   * Returns true if an item was removed, false if not found.
   */
  if (!id) return false;
  const session = getSession();
  const userId = session?.userId || null;
  if (!userId) throw new Error('Not authenticated');
  const before = await getAll(StorageKeys.EXPENSES);
  const had = before.some((e) => e.id === id && e.userId === userId);
  await removeItem(StorageKeys.EXPENSES, (e) => e.id === id && e.userId === userId);
  return had;
}

// PUBLIC_INTERFACE
export async function replaceAll(expenses) {
  /**
   * Replaces entire expenses dataset for the current user only.
   * Validates and normalizes all entries before saving.
   * Returns saved list.
   */
  const session = getSession();
  const userId = session?.userId || null;
  if (!userId) throw new Error('Not authenticated');
  if (!Array.isArray(expenses)) throw new Error('Input must be an array');

  const all = await getAll(StorageKeys.EXPENSES);
  const others = all.filter((e) => e.userId !== userId);

  const normalizedMine = expenses.map((e) => {
    const withMeta = { id: e?.id || generateId(), ...e, userId };
    const n = normalizeExpense(withMeta);
    validateExpense(n);
    return n;
  });

  const finalList = [...others, ...normalizedMine];
  await setAll(StorageKeys.EXPENSES, finalList);
  return normalizedMine;
}

// PUBLIC_INTERFACE
export const helpers = {
  /** Utility helpers intended for reuse in UI or other layers. */
  generateId,
  validateExpense,
  normalizeExpense,
};
