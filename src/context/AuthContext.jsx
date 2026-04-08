import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';

const AuthContext = createContext(null);

/** Decode a JWT payload without a library */
function decodeJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

/** Returns true if the stored token exists and has not expired */
function isTokenValid(token) {
  if (!token) return false;
  const payload = decodeJwt(token);
  if (!payload || !payload.exp) return false;
  // exp is in seconds; Date.now() is ms
  return payload.exp * 1000 > Date.now();
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const stored = localStorage.getItem('token');
    return isTokenValid(stored) ? stored : null;
  });

  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('token');
    if (!isTokenValid(stored)) return null;
    const payload = decodeJwt(stored);
    return payload?.sub ? { email: payload.sub } : null;
  });

  // Auto-logout helper
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  // Login helper
  const login = useCallback((accessToken) => {
    localStorage.setItem('token', accessToken);
    setToken(accessToken);
    const payload = decodeJwt(accessToken);
    setUser(payload?.sub ? { email: payload.sub } : null);
  }, []);

  // Register axios 401 interceptor — auto-logout when any request returns 401
  useEffect(() => {
    const interceptorId = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );
    return () => api.interceptors.response.eject(interceptorId);
  }, [logout]);

  // Periodically check token expiry (every 60s)
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      if (!isTokenValid(token)) logout();
    }, 60_000);
    return () => clearInterval(interval);
  }, [token, logout]);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
