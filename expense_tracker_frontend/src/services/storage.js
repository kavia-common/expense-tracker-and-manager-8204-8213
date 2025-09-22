//
//
// Storage service abstraction for localStorage with JSON seed bootstrap
//
// This module provides a minimal persistence layer for the app. It:
// - Initializes expenses from a bundled JSON seed on first run.
// - Offers get/set helpers and collection helpers (add/update/remove).
// - Includes basic schema version scaffolding for future migrations.
// - Handles JSON parse/stringify failures gracefully.
//
// PUBLIC INTERFACES in this file are annotated with PUBLIC_INTERFACE comments.
//

// PUBLIC_INTERFACE
export const StorageKeys = {
  EXPENSES: 'expenses_data_v1', // bump suffix when schema changes
};

// Version metadata key (placeholder for future migrations)
const META_KEY = 'expenses_meta_v1';

/**
 * Basic meta object shape. Update version when schema evolves.
 */
function defaultMeta() {
  return {
    version: 1, // Schema version placeholder
    initializedAt: new Date().toISOString(),
  };
}

/**
 * Safely parse JSON with fallback.
 */
function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Safely set localStorage with error handling.
 */
function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    // Storage might be full or blocked. Log and ignore to avoid crashes.
    // eslint-disable-next-line no-console
    console.error('localStorage.setItem failed for key:', key, err);
    return false;
  }
}

/**
 * Safely get localStorage item with error handling.
 */
function safeGetItem(key) {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('localStorage.getItem failed for key:', key, err);
    return null;
  }
}

/**
 * Load bundled seed JSON via fetch. This is only used on first run.
 * Note: for CRA, PUBLIC_URL points to the base path for static assets.
 */
async function loadSeed() {
  const base = process.env.PUBLIC_URL || '';
  const url = `${base}/assets/seed-expenses.json`;
  let res;
  try {
    res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    throw new Error(`Failed to fetch seed JSON (${url}): ${err?.message || err}`);
  }
  if (!res.ok) throw new Error(`Failed to load seed JSON: ${res.status}`);
  return res.json();
}

/**
 * Read meta info; create default if missing.
 */
function readOrCreateMeta() {
  const raw = safeGetItem(META_KEY);
  if (!raw) {
    const meta = defaultMeta();
    safeSetItem(META_KEY, JSON.stringify(meta));
    return meta;
  }
  const parsed = safeParse(raw, null);
  if (!parsed || typeof parsed !== 'object') {
    const meta = defaultMeta();
    safeSetItem(META_KEY, JSON.stringify(meta));
    return meta;
  }
  return parsed;
}

/**
 * Initialize a storage key if not present using the provided bootstrap loader.
 * Returns the initialized value.
 */
async function ensureInitialized(key, bootstrapLoader) {
  // Ensure meta exists (placeholder for future version checks/migrations)
  const meta = readOrCreateMeta();
  if (!meta?.version) {
    // If meta malformed, reset to defaults.
    const fixed = defaultMeta();
    safeSetItem(META_KEY, JSON.stringify(fixed));
  }

  const existing = safeGetItem(key);
  if (existing) {
    return safeParse(existing, null);
  }
  // Not present -> bootstrap from seed
  const initialValue = await bootstrapLoader();
  safeSetItem(key, JSON.stringify(initialValue));
  return initialValue;
}

/**
 * Get all items stored under a key.
 * If key is not present, attempts to bootstrap from seed (for EXPENSES).
 */
// PUBLIC_INTERFACE
export async function getAll(key) {
  if (key === StorageKeys.EXPENSES) {
    try {
      return await ensureInitialized(key, loadSeed);
    } catch (err) {
      // In case seed loading fails, fall back to empty array
      // eslint-disable-next-line no-console
      console.error('Failed to initialize from seed, falling back to empty list:', err);
      safeSetItem(key, JSON.stringify([]));
      return [];
    }
  }
  const data = safeGetItem(key);
  return data ? safeParse(data, []) : [];
}

/**
 * Replace the entire dataset for a key.
 */
// PUBLIC_INTERFACE
export function setAll(key, value) {
  safeSetItem(key, JSON.stringify(value));
  return value;
}

/**
 * Add an item to a collection (assumes array collection).
 * Returns the new collection.
 */
// PUBLIC_INTERFACE
export function addItem(key, item) {
  const list = safeParse(safeGetItem(key), []);
  const updated = [...list, item];
  safeSetItem(key, JSON.stringify(updated));
  return updated;
}

/**
 * Update an item in a collection by predicate. Returns updated list.
 */
// PUBLIC_INTERFACE
export function updateItem(key, predicate, updater) {
  const list = safeParse(safeGetItem(key), []);
  const updated = list.map((it) => (predicate(it) ? { ...it, ...updater(it) } : it));
  safeSetItem(key, JSON.stringify(updated));
  return updated;
}

/**
 * Remove an item in a collection by predicate. Returns updated list.
 */
// PUBLIC_INTERFACE
export function removeItem(key, predicate) {
  const list = safeParse(safeGetItem(key), []);
  const updated = list.filter((it) => !predicate(it));
  safeSetItem(key, JSON.stringify(updated));
  return updated;
}

/**
 * Clear a key from storage.
 */
// PUBLIC_INTERFACE
export function clear(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('localStorage.removeItem failed for key:', key, err);
    return false;
  }
}
