/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CashSession, SystemNotification, SubscriptionState, StoreSubscription } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

export type NavigationTab =
  | 'pos'
  | 'dashboard'
  | 'products'
  | 'purchases'
  | 'inventory'
  | 'customers'
  | 'suppliers'
  | 'expenses'
  | 'cash_register'
  | 'accounting'
  | 'reports'
  | 'ai_assistant'
  | 'subscription'
  | 'settings';

export type AndroidViewMode = 'responsive' | 'phone' | 'pos_terminal';

interface StoreContextType {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  activeCashSession: CashSession | null;
  setActiveCashSession: (session: CashSession | null) => void;
  notifications: SystemNotification[];
  unreadCount: number;
  markNotificationAsRead: (id: string) => void;
  isOnline: boolean;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  refreshCashSession: () => Promise<void>;
  barcodeSearchQuery: string;
  setBarcodeSearchQuery: (query: string) => void;
  androidViewMode: AndroidViewMode;
  setAndroidViewMode: (mode: AndroidViewMode) => void;
  isScannerOpen: boolean;
  setIsScannerOpen: (open: boolean) => void;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  isInstallModalOpen: boolean;
  setIsInstallModalOpen: (open: boolean) => void;
  isSubscriptionModalOpen: boolean;
  setIsSubscriptionModalOpen: (open: boolean) => void;
  subscriptionState: SubscriptionState | null;
  refreshSubscription: () => Promise<void>;
  triggerBarcodeScan: (barcode: string) => void;
  registerBarcodeHandler: (handler: (barcode: string) => void) => () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, role } = useAuth();
  const [activeTab, setActiveTab] = useState<NavigationTab>('pos');
  const [activeCashSession, setActiveCashSession] = useState<CashSession | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hasebo_theme_mode');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'dark';
  });
  const [barcodeSearchQuery, setBarcodeSearchQuery] = useState<string>('');
  const [androidViewMode, setAndroidViewMode] = useState<AndroidViewMode>('responsive');
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState<boolean>(false);
  const [subscriptionState, setSubscriptionState] = useState<SubscriptionState | null>(null);
  const [barcodeHandlers, setBarcodeHandlers] = useState<((barcode: string) => void)[]>([]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (theme === 'light') {
        root.classList.add('light-theme');
        root.classList.remove('dark');
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
      } else {
        root.classList.remove('light-theme');
        root.classList.add('dark');
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
      }
      localStorage.setItem('hasebo_theme_mode', theme);
    }
  }, [theme]);

  const refreshSubscription = async () => {
    if (!isAuthenticated) return;
    try {
      const state = await api.getSubscriptionState();
      setSubscriptionState(state);
    } catch (err) {
      console.warn('Failed to load subscription state:', err);
    }
  };

  const registerBarcodeHandler = (handler: (barcode: string) => void) => {
    setBarcodeHandlers(prev => [...prev, handler]);
    return () => {
      setBarcodeHandlers(prev => prev.filter(h => h !== handler));
    };
  };

  const triggerBarcodeScan = (barcode: string) => {
    setBarcodeSearchQuery(barcode);
    barcodeHandlers.forEach(h => {
      try {
        h(barcode);
      } catch (e) {
        console.error('Error in barcode handler:', e);
      }
    });
  };

  const [notifications, setNotifications] = useState<SystemNotification[]>([
    {
      id: 'notif_1',
      type: 'expiring_soon',
      titleAr: 'تنبيه انتهاء صلاحية وشيك',
      messageAr: 'يوجد 36 حبة من حليب يماني 1 لتر تنتهي صلاحيتها خلال 14 يوماً (الدفعة: LOT-YAM-2026-08)',
      severity: 'warning',
      isRead: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'notif_2',
      type: 'low_stock',
      titleAr: 'تنبيه مخزون منخفض',
      messageAr: 'مسحوق غسيل إريال 1 كجم وصل إلى 22 كيس، وهو قريب من حد الطلب الأدنى',
      severity: 'info',
      isRead: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'notif_3',
      type: 'ai_insight',
      titleAr: 'توصية الذكاء الاصطناعي للمبيعات',
      messageAr: 'زيادة الطلب على المشروبات والألبان بنسبة 28% في الفترة المسائية',
      severity: 'success',
      isRead: false,
      createdAt: new Date().toISOString(),
    },
  ]);

  // Online / offline listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshCashSession = async () => {
    if (!isAuthenticated) return;
    try {
      const session = await api.getActiveCashSession();
      setActiveCashSession(session);
    } catch (err) {
      console.warn('Failed to load active cash session:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshCashSession();
      refreshSubscription();
      // Set initial tab based on role
      if (role?.name === 'CASHIER') {
        setActiveTab('pos');
      } else if (role?.name === 'ACCOUNTANT') {
        setActiveTab('accounting');
      } else if (role?.name === 'INVENTORY_MANAGER') {
        setActiveTab('inventory');
      } else {
        setActiveTab('dashboard');
      }
    }
  }, [isAuthenticated, role]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <StoreContext.Provider
      value={{
        activeTab,
        setActiveTab,
        activeCashSession,
        setActiveCashSession,
        notifications,
        unreadCount,
        markNotificationAsRead,
        isOnline,
        theme,
        setTheme,
        toggleTheme,
        refreshCashSession,
        barcodeSearchQuery,
        setBarcodeSearchQuery,
        androidViewMode,
        setAndroidViewMode,
        isScannerOpen,
        setIsScannerOpen,
        isDrawerOpen,
        setIsDrawerOpen,
        isInstallModalOpen,
        setIsInstallModalOpen,
        isSubscriptionModalOpen,
        setIsSubscriptionModalOpen,
        subscriptionState,
        refreshSubscription,
        triggerBarcodeScan,
        registerBarcodeHandler,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
};
