/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useStore, type NavigationTab } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ShoppingCart,
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
  ShieldAlert,
  CreditCard,
  Star,
  Sun,
  Moon,
} from 'lucide-react';

interface NavItem {
  id: NavigationTab;
  labelAr: string;
  icon: React.FC<{ className?: string }>;
  permission?: string;
  badge?: string | number;
  badgeColor?: string;
}

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, subscriptionState, setIsSubscriptionModalOpen, theme, toggleTheme } = useStore();
  const { can } = useAuth();

  const currentSub = subscriptionState?.currentSubscription;
  const isTrial = currentSub?.status === 'TRIAL';

  const navItems: NavItem[] = [
    { id: 'pos', labelAr: 'نقطة البيع (POS)', icon: ShoppingCart, permission: 'pos.access' },
    { id: 'dashboard', labelAr: 'لوحة التحكم والمؤشرات', icon: LayoutDashboard, permission: 'dashboard.view' },
    {
      id: 'subscription',
      labelAr: 'الباقات والاشتراك (PRO)',
      icon: Star,
      badge: isTrial ? `تجربة ${currentSub?.remainingDays} يوم` : 'PRO $5',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse font-bold',
    },
    { id: 'products', labelAr: 'الأصناف والأسعار', icon: Boxes, permission: 'products.view' },
    { id: 'purchases', labelAr: 'المشتريات والموردين', icon: Truck, permission: 'purchases.view' },
    { id: 'inventory', labelAr: 'المخزون والحركات والجرد', icon: Layers, permission: 'inventory.view' },
    { id: 'customers', labelAr: 'العملاء وحسابات الآجل', icon: Users, permission: 'customers.view' },
    { id: 'suppliers', labelAr: 'الموردين والمدفوعات', icon: Building, permission: 'suppliers.view' },
    { id: 'expenses', labelAr: 'المصروفات وسندات الصرف', icon: Receipt, permission: 'expenses.view' },
    { id: 'cash_register', labelAr: 'الصندوق والورديات', icon: Coins, permission: 'cash_register.view' },
    { id: 'accounting', labelAr: 'الأرباح والخسائر والمحاسبة', icon: Calculator, permission: 'accounting.view' },
    { id: 'reports', labelAr: 'التقارير التحليلية الشاملة', icon: BarChart3, permission: 'reports.view' },
    { id: 'ai_assistant', labelAr: 'المستشار الذكي (AI)', icon: Sparkles, permission: 'ai.assistant', badge: 'جديد', badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    { id: 'settings', labelAr: 'إعدادات النظام والنسخ', icon: Settings, permission: 'settings.manage' },
  ];

  const allowedItems = navItems.filter(item => !item.permission || can(item.permission as any));

  return (
    <aside className="w-64 bg-[#0B1424] border-l border-slate-800 hidden md:flex flex-col shrink-0 select-none">
      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold text-slate-500 tracking-wider">
          القائمة الرئيسية
        </div>

        {allowedItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer group text-right ${
                isActive
                  ? 'bg-[#D4A72C] text-slate-950 shadow-lg shadow-[#D4A72C]/20'
                  : 'text-slate-300 hover:text-white hover:bg-[#07111F]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition ${
                    isActive ? 'text-slate-950 font-bold' : 'text-slate-400 group-hover:text-[#D4A72C]'
                  }`}
                />
                <span>{item.labelAr}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${
                    isActive ? 'bg-slate-950/20 text-slate-950 border-slate-950/30' : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* POS Quick Shortcut, Theme Switcher & Developer Credit Footer */}
      <div className="p-3 border-t border-slate-800 bg-[#07111F] space-y-2">
        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className={`w-full flex items-center justify-between p-2 rounded-xl border text-xs font-bold transition cursor-pointer active:scale-98 ${
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
            تفعيل
          </span>
        </button>

        <div className="p-2.5 rounded-xl bg-[#0B1424] border border-slate-800 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span>اختصار الكاشير:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-[#07111F] border border-slate-700 text-[10px] font-mono text-[#D4A72C]">
              F1 أو F2
            </kbd>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            منظومة حاسبو • متوافقة 100% مع الباركود وطباعة الفواتير
          </p>
        </div>

        {/* Developer Credit & Support */}
        <div className="p-2.5 rounded-xl bg-gradient-to-r from-[#0B1424] to-[#07111F] border border-[#D4A72C]/20 text-[11px] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px]">تصميم وتطوير:</span>
            <span className="text-[#E0B43C] font-bold text-[11px]">م. مهند أحمد الزبير</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px]">
            <span className="text-slate-400">الدعم الفني:</span>
            <a
              href="https://wa.me/967774123322"
              target="_blank"
              rel="noreferrer"
              className="text-[#D4A72C] hover:text-[#F5C84C] font-mono font-bold transition flex items-center gap-1"
            >
              <span>774123322</span>
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
};
