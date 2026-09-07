/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useCurrency } from '../../context/CurrencyContext';
import {
  Calculator,
  Calendar,
  TrendingUp,
  TrendingDown,
  Printer,
  FileSpreadsheet,
  Building,
  CheckCircle2,
} from 'lucide-react';

export const AccountingScreen: React.FC = () => {
  const { formatMoney } = useCurrency();
  const [report, setReport] = useState<any>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfitLoss = async () => {
    setIsLoading(true);
    try {
      const data = await api.getProfitAndLoss({ startDate, endDate });
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfitLoss();
  }, []);

  if (isLoading || !report) {
    return (
      <div className="p-8 text-center text-slate-400">
        جاري احتساب القوائم المالية والأرباح والخسائر...
      </div>
    );
  }

  const isNetProfit = report.netProfit >= 0;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto overflow-y-auto select-none" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-400" />
            <span>قائمة الأرباح والخسائر الآلية (Income Statement)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            حساب مجمل وصافي الأرباح، تكلفة البضاعة المباعة (COGS)، والمصروفات التشغيلية
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة القائمة المالية</span>
        </button>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-slate-300 font-semibold">من تاريخ:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-300 font-semibold">إلى تاريخ:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={fetchProfitLoss}
          className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl cursor-pointer"
        >
          تطبيق الفلترة
        </button>
      </div>

      {/* Income Statement Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
        {/* Section 1: Revenue & COGS */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-200 pb-2 border-b border-slate-800">
            1. الإيرادات وتكلفة المبيعات
          </h3>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-medium">إجمالي إيرادات المبيعات المحققة (+)</span>
            <span className="font-mono font-bold text-white text-sm">{formatMoney(report.totalSalesRevenue)}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium">تكلفة البضاعة المباعة (COGS) (-)</span>
            <span className="font-mono text-rose-400">{formatMoney(report.totalCostOfGoodsSold)}</span>
          </div>

          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 flex justify-between items-center text-xs">
            <span className="font-bold text-blue-300">
              مجمل الربح التجاري (Gross Profit) - هامش {report.grossProfitMarginPercent}%
            </span>
            <span className="font-mono font-bold text-blue-400 text-base">{formatMoney(report.grossProfit)}</span>
          </div>
        </div>

        {/* Section 2: Operating Expenses */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-bold text-slate-200 pb-2 border-b border-slate-800">
            2. المصروفات التشغيلية (Operating Expenses)
          </h3>

          {Object.entries(report.expensesByCategory || {}).map(([key, val]: any) => (
            <div key={key} className="flex justify-between items-center text-xs">
              <span className="text-slate-400">{val.labelAr} (-)</span>
              <span className="font-mono text-amber-400">{formatMoney(val.amount)}</span>
            </div>
          ))}

          <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800">
            <span className="text-slate-300 font-bold">إجمالي المصروفات التشغيلية (-)</span>
            <span className="font-mono font-bold text-amber-400">{formatMoney(report.totalExpenses)}</span>
          </div>
        </div>

        {/* Section 3: Net Profit Final Result */}
        <div
          className={`p-5 rounded-2xl border flex items-center justify-between ${
            isNetProfit
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
          }`}
        >
          <div>
            <span className="text-xs font-bold block mb-1">
              {isNetProfit ? 'صافي الأرباح المحققة (Net Profit)' : 'صافي الخسائر (Net Loss)'}
            </span>
            <span className="text-xs text-slate-400">
              هامش صافي الربح: <strong className="text-white font-mono">{report.netProfitMarginPercent}%</strong>
            </span>
          </div>

          <div className="text-2xl sm:text-3xl font-black font-mono text-white">
            {formatMoney(report.netProfit)}
          </div>
        </div>
      </div>
    </div>
  );
};
