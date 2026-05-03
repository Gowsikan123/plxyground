import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// expo-secure-store is native-only — it crashes on web.
// Use a unified storage helper that picks the right backend per platform.
const storage = {
  async getItem(key) {
    if (Platform.OS === 'web') {
      return AsyncStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  async setItem(key, value) {
    if (Platform.OS === 'web') {
      return AsyncStorage.setItem(key, value);
    }
    return SecureStore.setItemAsync(key, value);
  },
  async removeItem(key) {
    if (Platform.OS === 'web') {
      return AsyncStorage.removeItem(key);
    }
    return SecureStore.deleteItemAsync(key);
  },
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const t = await storage.getItem('token');
        const u = await storage.getItem('user');
        if (t) setToken(t);
        if (u) setUser(JSON.parse(u));
      } catch (e) {
        console.error('[AuthContext] Failed to load session:', e);
      }
      setLoading(false);
    }
    load();
  }, []);

  const login = async (token, user) => {
    setToken(token);
    setUser(user);
    await storage.setItem('token', token);
    await storage.setItem('user', JSON.stringify(user));
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    await storage.removeItem('token');
    await storage.removeItem('user');
  };

  const isBusiness = user?.role === 'BUSINESS';
  const isCreator = user?.role === 'CREATOR';

  return (
    <AuthContext.Provider value={{ token, user, login, logout, loading, isBusiness, isCreator }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
