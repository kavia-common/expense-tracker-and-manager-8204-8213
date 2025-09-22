import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getCurrentUser, logIn, logOut, signUp } from '../services/auth';

/**
 * AuthContext holds currentUser and auth actions for the app, backed by localStorage session.
 */
const AuthContext = createContext(null);

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  /** Provides auth state and actions (login, signup, logout) to the application. */
  const [user, setUser] = useState(() => getCurrentUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // On mount, read current user from session.
  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const handleLogin = useCallback(async (credentials) => {
    setError('');
    setLoading(true);
    try {
      const u = await Promise.resolve(logIn(credentials));
      setUser(u);
      return u;
    } catch (err) {
      setError(err?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSignup = useCallback(async (payload) => {
    setError('');
    setLoading(true);
    try {
      const u = await Promise.resolve(signUp(payload));
      setUser(u);
      return u;
    } catch (err) {
      setError(err?.message || 'Signup failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      await Promise.resolve(logOut());
      setUser(null);
    } catch (err) {
      setError(err?.message || 'Logout failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    error,
    login: handleLogin,
    signup: handleSignup,
    logout: handleLogout,
    clearError: () => setError(''),
  }), [user, loading, error, handleLogin, handleSignup, handleLogout]);

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

// PUBLIC_INTERFACE
export function useAuth() {
  /** Hook to access the auth context. */
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
