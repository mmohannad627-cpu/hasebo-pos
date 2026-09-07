/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAuthToken, clearAuthToken, getAuthToken } from '../services/api';
import type { User, Role, Branch, PermissionKey, StoreSettings, CurrencyConfig, SubscriptionPlan } from '../types';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  currentBranch: Branch | null;
  settings: StoreSettings | null;
  currencies: CurrencyConfig[];
  subscription: SubscriptionPlan | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { username: string; password: string; branchId?: string }) => Promise<void>;
  logout: () => void;
  switchBranch: (branchId: string) => Promise<void>;
  can: (permission: PermissionKey) => boolean;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [currencies, setCurrencies] = useState<CurrencyConfig[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionPlan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUserData = async () => {
    try {
      const data = await api.getMe();
      setUser(data.user);
      setRole(data.role);
      setCurrentBranch(data.branch);
      setSettings(data.settings);
      setCurrencies(data.currencies || []);
      setSubscription(data.subscription);
    } catch (err) {
      console.warn('Session expired or not logged in:', err);
      clearAuthToken();
      setUser(null);
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      refreshUserData();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (credentials: { username: string; password: string; branchId?: string }) => {
    setIsLoading(true);
    try {
      const res = await api.login(credentials);
      setAuthToken(res.token);
      setUser(res.user);
      setRole(res.role);
      setCurrentBranch(res.branch);
      setSettings(res.settings);
      setCurrencies(res.currencies || []);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
    setRole(null);
    setCurrentBranch(null);
  };

  const switchBranch = async (branchId: string) => {
    const res = await api.switchBranch(branchId);
    if (res.success) {
      setCurrentBranch(res.branch);
      if (user) {
        setUser({ ...user, currentBranchId: branchId });
      }
    }
  };

  const can = (permission: PermissionKey): boolean => {
    if (!role) return false;
    if (role.name === 'SUPER_ADMIN') return true;
    return role.permissions.includes(permission);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        currentBranch,
        settings,
        currencies,
        subscription,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        switchBranch,
        can,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
