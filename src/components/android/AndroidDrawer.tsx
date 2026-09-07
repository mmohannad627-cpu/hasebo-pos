/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useStore, type NavigationTab } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  ShoppingCart,
  LayoutDashboard,
  Boxes,
  Truck,
  Layers,
  Users,
  Building,
  Receipt,
  Coins,
  Calculator,
  BarChart3,
  Sparkles,
  Settings,
  LogOut,
  Building2,
  Download,
  Smartphone,
  Star,
  Sun,
  Moon,
} from 'lucide-react';
import { HaseboLogo } from '../brand/HaseboLogo';

interface AndroidDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenInstallModal?: () => void;
  onOpenSubscriptionModal?: () => void;
}

export const AndroidDrawer: React.FC<AndroidDrawerProps> = ({
  isOpen,
  onClose,
  onOpenInstallModal,
  onOpenSubscriptionModal,
}) => {
  const { activeTab, setActiveTab, subscriptionState, setIsSubscriptionModalOpen, theme, toggleTheme } = useStore();
  const { user, role, currentBranch, logout, can, settings } = useAuth();

  if (!isOpen) return null;

  const currentSub = subscriptionState?.currentSubscription;
  const isTrial = currentSub?.status === 'TRIAL';

  const navItems: { id: NavigationTab; labelAr: string; icon: React.FC<{ className?: string }>; permission?: string; badge?: string }[] = [
    { id: 'pos', labelAr: 'نقطة البيع والكاشير', icon: ShoppingCart, permission: 'pos.access' },
    { id: 'dashboard', labelAr: 'لوحة التحكم والملخص', icon: LayoutDashboard, permission: 'dashboard.view' },
    {
      id: 'subscription',
      labelAr: 'باقات واشتراكات حاسبو PRO',
      icon: Star,
      badge: isTrial ? `تجربة ${currentSub?.remainingDays} يوم` : 'PRO $5',
    },
    { id: 'products', labelAr: 'الأصناف والأسعار', icon: Boxes, permission: 'products.view' },
    { id: 'purchases', labelAr: 'فواتير المشتريات', icon: Truck, permission: 'purchases.view' },
    { id: 'inventory', labelAr: 'المخزون والجرد', icon: Layers, permission: 'inventory.view' },
    { id: 'customers', labelAr: 'العملاء وحسابات الآجل', icon: Users, permission: 'customers.view' },
    { id: 'suppliers', labelAr: 'الموردين والمدفوعات', icon: Building, permission: 'suppliers.view' },
    { id: 'expenses', labelAr: 'المصروفات وسندات الصرف', icon: Receipt, permission: 'expenses.view' },
    { id: 'cash_register', labelAr: 'الصندوق والورديات', icon: Coins, permission: 'cash_register.view' },
    { id: 'accounting', labelAr: 'الأرباح والمحاسبة', icon: Calculator, permission: 'accounting.view' },
    { id: 'reports', labelAr: 'التقارير التحليلية', icon: BarChart3, permission: 'reports.view' },
    { id: 'ai_assistant', labelAr: 'مساعد حاسبو الذكي (AI)', icon: Sparkles, permission: 'ai.assistant', badge: 'AI' },
    { id: 'settings', labelAr: 'إعدادات النظام والنسخ', icon: Settings, permission: 'settings.manage' },
  ];

  const allowedItems = navItems.filter(item => !item.permission || can(item.permission as any));

  return (
    <div className="fixed inset-0 z-50 flex" dir="rtl">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer Content */}
      <div className="relative w-80 max-w-[85vw] bg-[#0B1424] border-l border-slate-800 h-full flex flex-col z-10 shadow-2xl overflow-hidden">
        {/* Drawer Header Profile */}
        <div className="p-4 bg-gradient-to-b from-[#0F1B2E] to-[#0B1424] border-b border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HaseboLogo variant="horizontal" size="sm" withContainer showTagline={true} />
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User & Branch info badge */}
          <div className="p-2.5 rounded-xl bg-[#07111F] border border-slate-800 flex items-center justify-between text-xs">
            <div className="min-w-0">
              <p className="font-bold text-slate-200 truncate">{user?.fullName}</p>
              <span className="text-[10px] text-[#E0B43C] font-semibold">{role?.labelAr}</span>
            </div>

            {currentBranch && (
              <div className="text-left shrink-0">
                <span className="text-[10px] text-slate-400 block">{currentBranch.nameAr}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#D4A72C]/20 text-[#E0B43C] font-mono">
                  {currentBranch.code}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Modules List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            أقسام منظومة حاسبو
          </div>

          {allowedItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer text-right ${
                  isActive
                    ? 'bg-[#D4A72C] text-slate-950 shadow-md shadow-[#D4A72C]/20'
                    : 'text-slate-300 hover:text-white hover:bg-[#07111F]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span>{item.labelAr}</span>
                </div>

                {item.badge && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#D4A72C]/20 text-[#E0B43C] border border-[#D4A72C]/30 font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Drawer Footer: Subscription, Theme Toggle, Install App & Logout */}
        <div className="p-3 border-t border-slate-800 bg-[#07111F] space-y-2">
          {/* Theme Mode Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer active:scale-98 ${
              theme === 'dark'
                ? 'bg-[#0B1424] hover:bg-slate-800 border-slate-700/80 text-amber-300'
                : 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-950'
            }`}
          >
            <div className="flex items-center gap-2">
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
              <span>{theme === 'dark' ? 'الوضع النهاري (Light Mode)' : 'الوضع الليلي (Dark Mode)'}</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#07111F] border border-slate-700 text-slate-300">
              {theme === 'dark' ? 'تفعيل النهاري' : 'تفعيل الليلي'}
            </span>
          </button>

          {onOpenSubscriptionModal && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSubscriptionModal();
              }}
              className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-[#D4A72C]/15 border border-[#D4A72C]/30 text-[#E0B43C] hover:bg-[#D4A72C]/25 transition text-xs font-bold cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Star className="w-3.5 h-3.5 fill-current text-[#D4A72C]" />
                <span>باقة حاسبو برو (HĀSEBO PRO)</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#D4A72C]/30 text-[#F5C84C] font-bold">
                5$ / شهرياً
              </span>
            </button>
          )}

          {onOpenInstallModal && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenInstallModal();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#0B1424] border border-slate-700 text-slate-300 hover:bg-slate-800 transition text-xs font-semibold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#D4A72C]" />
              <span>تثبيت تطبيق حاسبو للأندرويد (PWA)</span>
            </button>
          )}

          {/* Developer Attribution & Support */}
          <div className="p-2.5 rounded-xl bg-gradient-to-r from-[#0B1424] to-[#07111F] border border-[#D4A72C]/20 text-[11px] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[10px]">تصميم وتطوير:</span>
              <span className="text-[#E0B43C] font-bold text-[11px]">م. مهند أحمد الزبير</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px]">
              <span className="text-slate-400">الدعم الفني والمشاكل:</span>
              <a
                href="https://wa.me/967774123322"
                target="_blank"
                rel="noreferrer"
                className="text-[#D4A72C] font-mono font-bold hover:underline"
              >
                774123322
              </a>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              logout();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition text-xs font-bold cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>تسجيل الخروج من الحساب</span>
          </button>
        </div>
      </div>
    </div>
  );
};

