//
// Storage service abstraction for localStorage with JSON seed bootstrap
//

// PUBLIC_INTERFACE
export const StorageKeys = {
  EXPENSES: 'expenses_data_v1',
};

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
 * Load bundled seed JSON via fetch. This is only used on first run.
 */
async function loadSeed() {
  // Note: CRA serves files under src at build time; for dev we can import via fetch with public path.
  // We'll place the asset in src/assets and fetch it relatively.
  const res = await fetch(`${process.env.PUBLIC_URL || ''}/assets/seed-expenses.json`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Failed to load seed JSON: ${res.status}`);
  return res.json();
}

/**
 * Initialize a storage key if not present using the provided bootstrap loader.
 * Returns the initialized value.
 */
async function ensureInitialized(key, bootstrapLoader) {
  const existing = localStorage.getItem(key);
  if (existing) {
    return safeParse(existing, null);
  }
  const initialValue = await bootstrapLoader();
  localStorage.setItem(key, JSON.stringify(initialValue));
  return initialValue;
}

/**
 * Get all items stored under a key.
 * If key is not present, attempts to bootstrap from seed.
 */
// PUBLIC_INTERFACE
export async function getAll(key) {
  if (key === StorageKeys.EXPENSES) {
    return ensureInitialized(key, loadSeed);
  }
  const data = localStorage.getItem(key);
  return data ? safeParse(data, []) : [];
}

/**
 * Replace the entire dataset for a key.
 */
// PUBLIC_INTERFACE
export function setAll(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}

/**
 * Add an item to a collection (assumes array collection).
 * Returns the new collection.
 */
// PUBLIC_INTERFACE
export function addItem(key, item) {
  const list = safeParse(localStorage.getItem(key), []);
  const updated = [...list, item];
  localStorage.setItem(key, JSON.stringify(updated));
  return updated;
}

/**
 * Update an item in a collection by predicate. Returns updated list.
 */
// PUBLIC_INTERFACE
export function updateItem(key, predicate, updater) {
  const list = safeParse(localStorage.getItem(key), []);
  const updated = list.map((it) => (predicate(it) ? { ...it, ...updater(it) } : it));
  localStorage.setItem(key, JSON.stringify(updated));
  return updated;
}

/**
 * Remove an item in a collection by predicate. Returns updated list.
 */
// PUBLIC_INTERFACE
export function removeItem(key, predicate) {
  const list = safeParse(localStorage.getItem(key), []);
  const updated = list.filter((it) => !predicate(it));
  localStorage.setItem(key, JSON.stringify(updated));
  return updated;
}
