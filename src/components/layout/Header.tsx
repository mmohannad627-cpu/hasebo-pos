/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useStore } from '../../context/StoreContext';
import type { CurrencyCode } from '../../types';
import {
  Store,
  Building2,
  Bell,
  Sun,
  Moon,
  LogOut,
  Wifi,
  WifiOff,
  Coins,
  ShieldCheck,
  Search,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  DollarSign,
  Menu,
  Maximize2,
  Minimize2,
  Scan,
  Smartphone,
  Download,
  Tablet,
  Monitor,
  CreditCard,
  Star,
} from 'lucide-react';
import { HaseboLogo } from '../brand/HaseboLogo';

export const Header: React.FC = () => {
  const { user, role, currentBranch, logout, switchBranch, settings } = useAuth();
  const { currentCurrency, currencies, setCurrency } = useCurrency();
  const {
    notifications,
    unreadCount,
    markNotificationAsRead,
    isOnline,
    theme,
    toggleTheme,
    activeCashSession,
    setActiveTab,
    setIsDrawerOpen,
    setIsScannerOpen,
    setIsInstallModalOpen,
    setIsSubscriptionModalOpen,
    subscriptionState,
    androidViewMode,
    setAndroidViewMode,
  } = useStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDeviceMenu, setShowDeviceMenu] = useState(false);

  const currentSub = subscriptionState?.currentSubscription;
  const isTrial = currentSub?.status === 'TRIAL';
  const isActivePro = currentSub?.status === 'ACTIVE';
  const remainingDays = currentSub?.remainingDays ?? 0;

  return (
    <header className="h-16 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-2 sm:px-4 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Right Side (RTL Start): Drawer Toggle & Branch Quick Switcher */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Mobile / Android Hamburger Drawer Button */}
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer shrink-0"
          title="فتح القائمة الرئيسية"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Store / Branch Button (Green) */}
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className="p-2 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold shrink-0"
          title={`الفرع الحالي: ${currentBranch?.nameAr || 'الفرع الرئيسي'}`}
        >
          <Store className="w-4 h-4 text-teal-400" />
          <span className="hidden lg:inline font-bold">{currentBranch?.nameAr || 'الفرع الرئيسي'}</span>
        </button>

        {/* Official Hasebo Logo on Desktop */}
        <div 
          onClick={() => setActiveTab('pos')}
          className="hidden xl:flex cursor-pointer items-center gap-2"
          title="حاسبو | HĀSEBO"
        >
          <HaseboLogo variant="horizontal" size="sm" withContainer showTagline={true} />
        </div>
      </div>

      {/* Center / Left: PROMINENT PRO GREEN BADGE */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => setIsSubscriptionModalOpen(true)}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-md cursor-pointer group shrink-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white shadow-emerald-500/25 border border-emerald-400/40"
          title="إدارة اشتراك حاسبوا برو (HĀSEBO PRO)"
        >
          <Sparkles className="w-4 h-4 text-white shrink-0 animate-pulse" />
          <div className="flex flex-col items-start leading-tight">
            <span className="font-extrabold text-[11px] sm:text-xs">حاسبوا PRO (نشط)</span>
            <span className="text-[9px] text-emerald-100 font-medium">كامل الميزات</span>
          </div>
        </button>

        {/* Fullscreen Toggle Button */}
        <button
          type="button"
          onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen().catch(() => {});
            } else {
              document.exitFullscreen().catch(() => {});
            }
          }}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer shrink-0"
          title="ملء الشاشة"
        >
          <Maximize2 className="w-4 h-4 text-teal-400" />
        </button>

        {/* Dark Mode / Light Mode Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-amber-400 hover:text-amber-300 transition cursor-pointer shrink-0"
          title={theme === 'dark' ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 animate-spin-slow" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-400" />
          )}
        </button>

        {/* AI Assistant Quick Trigger */}
        <button
          type="button"
          onClick={() => setActiveTab('ai_assistant')}
          className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 transition cursor-pointer shrink-0"
          title="المستشار الذكي"
        >
          <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition relative cursor-pointer"
            title="الإشعارات والتنبيهات"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold border-2 border-slate-900">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 text-right">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <div className="flex items-center gap-1.5 font-bold text-sm text-slate-100">
                  <Bell className="w-4 h-4 text-emerald-400" />
                  <span>تنبيهات النظام والمخزون</span>
                </div>
                <span className="text-xs text-slate-400">{notifications.length} تنبيهات</span>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">لا توجد تنبيهات حالياً</p>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => markNotificationAsRead(notif.id)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-start gap-2.5 ${
                        notif.isRead
                          ? 'bg-slate-800/40 border-slate-800 text-slate-400'
                          : 'bg-slate-800/90 border-slate-700 text-slate-200 shadow-sm'
                      }`}
                    >
                      {notif.severity === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                      {notif.severity === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
                      {notif.severity === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                      {notif.severity === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />}

                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-100 mb-0.5">{notif.titleAr}</div>
                        <p className="text-slate-400 text-[11px] leading-relaxed">{notif.messageAr}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Chip */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl px-2.5 py-1.5 transition text-right cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/30">
              {user?.fullName.slice(0, 1) || 'م'}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-semibold text-slate-200 max-w-[110px] truncate leading-tight">
                {user?.fullName}
              </div>
              <div className="text-[10px] text-emerald-400 font-medium">
                {role?.labelAr || 'مسؤول'}
              </div>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute left-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50">
              <div className="px-3 py-2 border-b border-slate-800 mb-1">
                <p className="text-xs font-bold text-white">{user?.fullName}</p>
                <p className="text-[11px] text-slate-400 font-mono">@{user?.username}</p>
                <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {role?.labelAr}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(false);
                  setActiveTab('settings');
                }}
                className="w-full text-right px-3 py-2 text-xs text-[#E0B43C] bg-[#D4A72C]/10 hover:bg-[#D4A72C]/20 border border-[#D4A72C]/30 rounded-xl transition flex items-center justify-between mb-1 font-semibold"
              >
                <div className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-current text-[#D4A72C]" />
                  <span>باقة حاسبو برو ($5/شهر)</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#D4A72C]/30 text-[#F5C84C]">نشط</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(false);
                  setActiveTab('settings');
                }}
                className="w-full text-right px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-xl transition flex items-center justify-between"
              >
                <span>إعدادات النظام والنسخ</span>
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Developer & Support Contact Link */}
              <div className="my-1.5 p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-[10px]">
                  <span>تصميم وتطوير:</span>
                  <span className="text-white font-bold">م. مهند أحمد الزبير</span>
                </div>
                <a
                  href="https://wa.me/967774123322"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between text-emerald-400 hover:text-emerald-300 font-bold text-[10px] pt-1 border-t border-slate-800"
                >
                  <span>الدعم الفني / مشاكل:</span>
                  <span className="font-mono">774123322</span>
                </a>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                }}
                className="w-full text-right px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl transition flex items-center justify-between mt-1"
              >
                <span>تسجيل الخروج</span>
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
