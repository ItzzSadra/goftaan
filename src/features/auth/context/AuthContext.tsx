import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { AuthUser } from '../models/user';
import {
  changePassword,
  deleteAccount,
  loginWithPassword,
  signUpWithPassword,
  updateProfile,
} from '../services/authService';

type AuthState = {
  isReady: boolean;
  isLoggedIn: boolean;
  user: AuthUser | null;
  signup: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  updateUserProfile: (name: string, email: string) => Promise<void>;
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteUserAccount: () => Promise<void>;
  logout: () => Promise<void>;
};

const AUTH_USER_STORAGE_KEY = 'goftaan.auth.user';

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const rawUser = await AsyncStorage.getItem(AUTH_USER_STORAGE_KEY);

        if (rawUser) {
          const parsed = JSON.parse(rawUser) as AuthUser;
          setUser(parsed);
        }
      } finally {
        setIsReady(true);
      }
    };

    void restoreSession();
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const authUser = await signUpWithPassword(name, email, password);
    setUser(authUser);
    await AsyncStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(authUser));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const authUser = await loginWithPassword(email, password);

    setUser(authUser);
    await AsyncStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(authUser));
  }, []);

  const updateUserProfile = useCallback(
    async (name: string, email: string) => {
      if (!user) {
        throw new Error('کاربر وارد نشده است.');
      }

      const updated = await updateProfile(user.id, name, email);
      setUser(updated);
      await AsyncStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(updated));
    },
    [user],
  );

  const updateUserPassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (!user) {
        throw new Error('کاربر وارد نشده است.');
      }

      await changePassword(user.id, currentPassword, newPassword);
    },
    [user],
  );

  const deleteUserAccount = useCallback(async () => {
    if (!user) {
      throw new Error('کاربر وارد نشده است.');
    }

    await deleteAccount(user.id);
    setUser(null);
    await AsyncStorage.removeItem(AUTH_USER_STORAGE_KEY);
  }, [user]);

  const logout = useCallback(async () => {
    setUser(null);
    await AsyncStorage.removeItem(AUTH_USER_STORAGE_KEY);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      isReady,
      isLoggedIn: Boolean(user),
      user,
      signup,
      login,
      updateUserProfile,
      updateUserPassword,
      deleteUserAccount,
      logout,
    }),
    [isReady, user, signup, login, updateUserProfile, updateUserPassword, deleteUserAccount, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};
