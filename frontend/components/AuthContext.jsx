/**
 * AuthContext — thin compatibility shim over authStore.
 *
 * ALL screens should ideally import useAuthStore directly, but this shim
 * means legacy code using useAuth() still works and — crucially — never
 * returns null, which was causing the crash:
 *   "Cannot destructure property 'token' of useAuth() as it is null"
 *
 * useAuth() now always returns a valid object with the same shape that
 * screens expect: { token, user, role, login, logout, isBusiness, isCreator }
 */
import React, { createContext, useContext } from 'react';
import { useAuthStore } from '../store/authStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  return (
    <AuthContext.Provider value={null /* unused — hook reads store directly */}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Drop-in replacement for the old context hook.
 * Reads live state from authStore so it always returns a valid object
 * regardless of whether AuthProvider is mounted.
 */
export function useAuth() {
  const token  = useAuthStore((s) => s.token);
  const user   = useAuthStore((s) => s.user);
  const role   = useAuthStore((s) => s.role);
  const signIn = useAuthStore((s) => s.signIn);
  const signOut = useAuthStore((s) => s.signOut);

  const login  = (token, user, role) => signIn(token, user, role ?? user?.role ?? null);
  const logout = () => signOut();

  const isBusiness = role === 'business' || user?.role === 'business' || role === 'BUSINESS' || user?.role === 'BUSINESS';
  const isCreator  = role === 'creator'  || user?.role === 'creator'  || role === 'CREATOR'  || user?.role === 'CREATOR';

  return { token, user, role, login, logout, isBusiness, isCreator };
}
