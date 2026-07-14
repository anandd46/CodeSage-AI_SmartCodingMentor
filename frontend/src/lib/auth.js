'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('codesage_token');
    const storedUser  = localStorage.getItem('codesage_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const res = await authAPI.login({ username, password });
    const data = res.data;
    localStorage.setItem('codesage_token', data.access_token);
    localStorage.setItem('codesage_user', JSON.stringify(data));
    setToken(data.access_token);
    setUser(data);
    return data;
  };

  const register = async (username, email, password, skillLevel = 'Beginner') => {
    const res = await authAPI.register({ username, email, password, skill_level: skillLevel });
    const data = res.data;
    localStorage.setItem('codesage_token', data.access_token);
    localStorage.setItem('codesage_user', JSON.stringify(data));
    setToken(data.access_token);
    setUser(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('codesage_token');
    localStorage.removeItem('codesage_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const refreshUser = async () => {
    try {
      const res = await authAPI.me();
      const updated = { ...user, ...res.data };
      setUser(updated);
      localStorage.setItem('codesage_user', JSON.stringify(updated));
    } catch (e) {
      logout();
    }
  };

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      isAuthenticated: !!token,
      login, register, logout, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
