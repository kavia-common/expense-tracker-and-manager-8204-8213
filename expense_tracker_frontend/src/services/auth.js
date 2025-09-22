//
// Local, frontend-only authentication service using localStorage.
// Provides functions to sign up, log in, log out, and get the current session.
// Users are stored as a list in localStorage. Passwords are stored in plain text
// for demo purposes only (do NOT use in production).
//

export const AuthStorageKeys = {
  USERS: 'auth_users_v1',
  SESSION: 'auth_session_v1',
};

// PUBLIC_INTERFACE
export function getUsers() {
  /** Returns array of user objects from localStorage. */
  try {
    const raw = localStorage.getItem(AuthStorageKeys.USERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// PUBLIC_INTERFACE
export function setUsers(users) {
  /** Persists user list to localStorage. */
  try {
    localStorage.setItem(AuthStorageKeys.USERS, JSON.stringify(users || []));
    return true;
  } catch {
    return false;
  }
}

// PUBLIC_INTERFACE
export function getSession() {
  /** Returns current session object { userId } or null. */
  try {
    const raw = localStorage.getItem(AuthStorageKeys.SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// PUBLIC_INTERFACE
export function setSession(session) {
  /** Sets current session object { userId }. */
  try {
    if (session) {
      localStorage.setItem(AuthStorageKeys.SESSION, JSON.stringify(session));
    } else {
      localStorage.removeItem(AuthStorageKeys.SESSION);
    }
    return true;
  } catch {
    return false;
  }
}

// PUBLIC_INTERFACE
export function signUp({ name, email, password }) {
  /** Registers a new user if email is unique. Returns created user (without password). */
  if (!email || !password || !name) {
    throw new Error('Name, email and password are required');
  }
  const users = getUsers();
  const emailLower = String(email).trim().toLowerCase();
  const exists = users.some((u) => u.email.toLowerCase() === emailLower);
  if (exists) {
    throw new Error('An account with this email already exists');
  }
  const user = {
    id: `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    name: String(name).trim(),
    email: emailLower,
    password: String(password), // demo only
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  setUsers(users);
  setSession({ userId: user.id });
  const { password: _pw, ...safe } = user;
  return safe;
}

// PUBLIC_INTERFACE
export function logIn({ email, password }) {
  /** Logs in an existing user with matching email/password. Returns user (without password). */
  if (!email || !password) {
    throw new Error('Email and password are required');
  }
  const users = getUsers();
  const emailLower = String(email).trim().toLowerCase();
  const user = users.find((u) => u.email.toLowerCase() === emailLower && u.password === String(password));
  if (!user) {
    throw new Error('Invalid email or password');
  }
  setSession({ userId: user.id });
  const { password: _pw, ...safe } = user;
  return safe;
}

// PUBLIC_INTERFACE
export function logOut() {
  /** Clears the current session. */
  setSession(null);
  return true;
}

// PUBLIC_INTERFACE
export function getCurrentUser() {
  /** Returns the current logged-in user (without password), or null. */
  const session = getSession();
  if (!session?.userId) return null;
  const users = getUsers();
  const user = users.find((u) => u.id === session.userId);
  if (!user) return null;
  const { password: _pw, ...safe } = user;
  return safe;
}
