/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useCurrency } from '../../context/CurrencyContext';
import { useStore } from '../../context/StoreContext';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Truck,
  Boxes,
  AlertTriangle,
  Users,
  Building,
  Coins,
  ArrowUpRight,
  Clock,
  Sparkles,
  RefreshCw,
  Plus,
} from 'lucide-react';

export const DashboardScreen: React.FC = () => {
  const { formatMoney } = useCurrency();
  const { setActiveTab } = useStore();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh] text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-400 ml-2" />
        <span>جاري تحميل لوحة المؤشرات المالية والمخزنية...</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto" dir="rtl">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <span>لوحة التحكم والمؤشرات اليومية</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-normal">
              تحديث فوري
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            ملخص حركة المبيعات، الأرباح، السيولة النقدية، والتنبيهات المخزنية لليوم
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchStats}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 transition text-xs flex items-center gap-1.5 cursor-pointer border border-slate-700"
            title="تحديث البيانات"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">تحديث</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pos')}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>نقطة بيع سريعة (POS)</span>
          </button>
        </div>
      </div>

      {/* KPI METRICS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Today Revenue */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/30 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">مبيعات اليوم</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-white font-mono">
            {formatMoney(stats.todayRevenue)}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{stats.todayInvoicesCount} فاتورة مبيعات</span>
          </div>
        </div>

        {/* 2. Today Gross Profit */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-blue-500/30 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">مجمل أرباح اليوم</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-blue-400 font-mono">
            {formatMoney(stats.todayGrossProfit)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            صافي الربح: <span className="text-emerald-400 font-bold font-mono">{formatMoney(stats.todayNetProfit)}</span>
          </div>
        </div>

        {/* 3. Operating Expenses */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-amber-500/30 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">مصروفات اليوم</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-amber-400 font-mono">
            {formatMoney(stats.todayExpensesTotal)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            سندات صرف تشغيلية
          </div>
        </div>

        {/* 4. Total Cash & Bank Liquidity */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-purple-500/30 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">السيولة النقدية (الصناديق)</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-purple-300 font-mono">
            {formatMoney(stats.totalCashBalance)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            أرصدة الصناديق والمحافظ
          </div>
        </div>
      </div>

      {/* SECONDARY METRICS: Receivables & Payables & Inventory Value */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Customer Debts (Receivables) */}
        <div
          onClick={() => setActiveTab('customers')}
          className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition cursor-pointer flex items-center justify-between"
        >
          <div>
            <span className="text-xs text-slate-400 font-semibold block">ديون العملاء (لنا بالآجل)</span>
            <span className="text-lg font-bold text-amber-400 font-mono mt-1 block">
              {formatMoney(stats.totalCustomerDebts)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Supplier Payables */}
        <div
          onClick={() => setActiveTab('suppliers')}
          className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition cursor-pointer flex items-center justify-between"
        >
          <div>
            <span className="text-xs text-slate-400 font-semibold block">مستحقات الموردين (علينا)</span>
            <span className="text-lg font-bold text-rose-400 font-mono mt-1 block">
              {formatMoney(stats.totalSupplierPayables)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <Building className="w-5 h-5" />
          </div>
        </div>

        {/* Inventory Total Value */}
        <div
          onClick={() => setActiveTab('inventory')}
          className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition cursor-pointer flex items-center justify-between"
        >
          <div>
            <span className="text-xs text-slate-400 font-semibold block">قيمة المخزون الإجمالية (سعر التكلفة)</span>
            <span className="text-lg font-bold text-emerald-400 font-mono mt-1 block">
              {formatMoney(stats.inventoryTotalValue)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* WARNINGS & RECENT TRANSACTIONS SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock & Expiry Alerts */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-100">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>تنبيهات الأصناف منخفضة المخزون</span>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {stats.lowStockCount} أصناف
            </span>
          </div>

          <div className="space-y-2">
            {stats.lowStockProducts && stats.lowStockProducts.length > 0 ? (
              stats.lowStockProducts.map((p: any) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-200">{p.nameAr}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{p.barcode}</p>
                  </div>
                  <div className="text-left">
                    <span className="font-mono font-bold text-rose-400">
                      المتبقي: {p.currentStock} {p.baseUnit}
                    </span>
                    <p className="text-[10px] text-slate-400">حد الطلب: {p.minStockLevel}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">جميع مستويات المخزون ممتازة</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs transition cursor-pointer text-center"
          >
            عرض تقرير النواقص والمخزون الكامل
          </button>
        </div>

        {/* Recent Sales Activity */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-100">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>آخر فواتير المبيعات</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('accounting')}
              className="text-xs text-emerald-400 hover:underline cursor-pointer"
            >
              عرض السجل الكامل
            </button>
          </div>

          <div className="space-y-2">
            {stats.recentSales && stats.recentSales.length > 0 ? (
              stats.recentSales.map((s: any) => (
                <div
                  key={s.id}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200 font-mono">{s.invoiceNumber}</span>
                      <span className="text-[10px] text-slate-400">({s.customerName || 'عميل كاش'})</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {new Date(s.createdAt).toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-left font-mono">
                    <span className="font-black text-emerald-400">{formatMoney(s.total)}</span>
                    <p className="text-[10px] text-slate-500">ربح: {formatMoney(s.grossProfit)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">لا توجد مبيعات مسجلة اليوم حتى الآن</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
