/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { LoginScreen } from './components/auth/LoginScreen';
import { POSScreen } from './components/pos/POSScreen';
import { DashboardScreen } from './components/dashboard/DashboardScreen';
import { ProductsScreen } from './components/products/ProductsScreen';
import { PurchasesScreen } from './components/purchases/PurchasesScreen';
import { InventoryScreen } from './components/inventory/InventoryScreen';
import { CustomersScreen } from './components/customers/CustomersScreen';
import { SuppliersScreen } from './components/suppliers/SuppliersScreen';
import { ExpensesScreen } from './components/expenses/ExpensesScreen';
import { CashManagementScreen } from './components/cashier/CashManagementScreen';
import { AccountingScreen } from './components/accounting/AccountingScreen';
import { ReportsScreen } from './components/reports/ReportsScreen';
import { AIAssistantScreen } from './components/ai/AIAssistantScreen';
import { SettingsScreen } from './components/settings/SettingsScreen';
import { PricingScreen } from './components/subscription/PricingScreen';
import { AndroidDeviceFrame } from './components/android/AndroidDeviceFrame';
import { AndroidBarcodeScanner } from './components/android/AndroidBarcodeScanner';
import { AndroidDrawer } from './components/android/AndroidDrawer';
import { AndroidInstallModal } from './components/android/AndroidInstallModal';
import { SubscriptionModal } from './components/subscription/SubscriptionModal';
import { HaseboLogo } from './components/brand/HaseboLogo';

const MainLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const {
    activeTab,
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
    triggerBarcodeScan,
  } = useStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07111F] flex flex-col items-center justify-center text-slate-100 font-sans p-6 relative overflow-hidden" dir="rtl">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#D4A72C]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col items-center gap-6 z-10 animate-fade-in">
          <HaseboLogo variant="splash" size="xl" withContainer showTagline showEnglishTagline />
          <div className="flex items-center gap-3 mt-4 text-xs font-semibold text-slate-400">
            <div className="w-5 h-5 border-2 border-[#D4A72C]/30 border-t-[#D4A72C] rounded-full animate-spin" />
            <span>جاري تهيئة منظومة حاسبو الذكية...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  const appContent = (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100 font-sans w-full h-full relative" dir="rtl">
      {/* Top Application Header */}
      <Header />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar (Desktop view) */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Dynamic View Area */}
        <main className="flex-1 bg-slate-950 overflow-y-auto pb-16 lg:pb-0">
          {activeTab === 'pos' && <POSScreen />}
          {activeTab === 'dashboard' && <DashboardScreen />}
          {activeTab === 'subscription' && <PricingScreen />}
          {activeTab === 'products' && <ProductsScreen />}
          {activeTab === 'purchases' && <PurchasesScreen />}
          {activeTab === 'inventory' && <InventoryScreen />}
          {activeTab === 'customers' && <CustomersScreen />}
          {activeTab === 'suppliers' && <SuppliersScreen />}
          {activeTab === 'expenses' && <ExpensesScreen />}
          {activeTab === 'cash_register' && <CashManagementScreen />}
          {activeTab === 'accounting' && <AccountingScreen />}
          {activeTab === 'reports' && <ReportsScreen />}
          {activeTab === 'ai_assistant' && <AIAssistantScreen />}
          {activeTab === 'settings' && <SettingsScreen />}
        </main>
      </div>

      {/* Navigation Bar (Mobile / Android) */}
      <div className="block lg:hidden">
        <BottomNav />
      </div>

      {/* Android Native Navigation Drawer */}
      <AndroidDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
      />

      {/* Android Barcode Camera Scanner */}
      <AndroidBarcodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(code) => {
          triggerBarcodeScan(code);
          setIsScannerOpen(false);
        }}
      />

      {/* Android PWA Install Guide Modal */}
      <AndroidInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* Subscription Plan Modal (5 USD / Month) */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
      />
    </div>
  );

  return (
    <AndroidDeviceFrame
      viewMode={androidViewMode}
      onViewModeChange={setAndroidViewMode}
      onOpenScanner={() => setIsScannerOpen(true)}
      onOpenInstallModal={() => setIsInstallModalOpen(true)}
    >
      {appContent}
    </AndroidDeviceFrame>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <StoreProvider>
          <MainLayout />
        </StoreProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}
