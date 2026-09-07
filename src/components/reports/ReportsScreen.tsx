/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useCurrency } from '../../context/CurrencyContext';
import {
  BarChart3,
  FileSpreadsheet,
  Printer,
  Calendar,
  Search,
  TrendingUp,
  Boxes,
  Users,
  Building,
  Coins,
} from 'lucide-react';

export const ReportsScreen: React.FC = () => {
  const { formatMoney } = useCurrency();
  const [reportType, setReportType] = useState<
    'sales_summary' | 'top_products' | 'low_stock' | 'customer_debts' | 'supplier_payables'
  >('sales_summary');

  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      api.getSales(),
      api.getProducts(),
      api.getCustomers(),
      api.getSuppliers(),
    ]).then(([s, p, c, sup]) => {
      setSales(s);
      setProducts(p);
      setCustomers(c);
      setSuppliers(sup);
    });
  }, []);

  const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
  const totalProfit = sales.reduce((sum, s) => sum + s.grossProfit, 0);
  const totalCustomerDebts = customers.reduce((sum, c) => sum + c.currentBalance, 0);
  const totalSupplierPayables = suppliers.reduce((sum, s) => sum + s.currentBalance, 0);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto select-none" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <span>مركز التقارير التحليلية والمالية الشاملة</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            تقارير تفصيلية جاهزة للطباعة والتصدير لكافة عمليات المتجر
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة التقرير الحالي</span>
        </button>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar bg-slate-900 border border-slate-800 p-1.5 rounded-2xl text-xs">
        <button
          type="button"
          onClick={() => setReportType('sales_summary')}
          className={`px-3 py-2 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
            reportType === 'sales_summary' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          تقرير حركة المبيعات والأرباح
        </button>
        <button
          type="button"
          onClick={() => setReportType('top_products')}
          className={`px-3 py-2 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
            reportType === 'top_products' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          الأصناف الأكثر مبيعاً
        </button>
        <button
          type="button"
          onClick={() => setReportType('low_stock')}
          className={`px-3 py-2 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
            reportType === 'low_stock' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          تقرير النواقص ومستويات المخزون
        </button>
        <button
          type="button"
          onClick={() => setReportType('customer_debts')}
          className={`px-3 py-2 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
            reportType === 'customer_debts' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          أعمار ديون العملاء (الآجل)
        </button>
        <button
          type="button"
          onClick={() => setReportType('supplier_payables')}
          className={`px-3 py-2 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
            reportType === 'supplier_payables' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          مستحقات الموردين
        </button>
      </div>

      {/* REPORT CONTENT VIEW */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
        {/* 1. Sales Summary */}
        {reportType === 'sales_summary' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">إجمالي المبيعات:</span>
                <span className="text-base font-bold text-emerald-400 font-mono">{formatMoney(totalSales)}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">مجمل الأرباح المحققة:</span>
                <span className="text-base font-bold text-blue-400 font-mono">{formatMoney(totalProfit)}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">عدد فواتير البيع:</span>
                <span className="text-base font-bold text-white font-mono">{sales.length} فاتورة</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">رقم الفاتورة</th>
                    <th className="p-3">التاريخ والوقت</th>
                    <th className="p-3">العميل</th>
                    <th className="p-3">الكاشير</th>
                    <th className="p-3">الإجمالي</th>
                    <th className="p-3">مجمل الربح</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {sales.map(s => (
                    <tr key={s.id} className="hover:bg-slate-850/50">
                      <td className="p-3 font-bold text-emerald-400">{s.invoiceNumber}</td>
                      <td className="p-3 text-slate-400">{new Date(s.createdAt).toLocaleDateString('ar-YE')}</td>
                      <td className="p-3 font-sans text-slate-200">{s.customerName || 'كاش'}</td>
                      <td className="p-3 font-sans text-slate-400">{s.userName}</td>
                      <td className="p-3 font-bold text-white">{formatMoney(s.total)}</td>
                      <td className="p-3 text-emerald-400">{formatMoney(s.grossProfit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. Top Products */}
        {reportType === 'top_products' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">اسم الصنف</th>
                  <th className="p-3">الباركود</th>
                  <th className="p-3">سعر البيع</th>
                  <th className="p-3">المخزون الحالي</th>
                  <th className="p-3">القسم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {products.slice(0, 10).map(p => (
                  <tr key={p.id} className="hover:bg-slate-850/50">
                    <td className="p-3 font-bold text-white">{p.nameAr}</td>
                    <td className="p-3 font-mono text-slate-400">{p.barcode}</td>
                    <td className="p-3 font-mono font-bold text-emerald-400">{formatMoney(p.retailPrice)}</td>
                    <td className="p-3 font-mono text-white">{p.currentStock} {p.baseUnit}</td>
                    <td className="p-3 text-slate-400">{p.category?.nameAr || 'عام'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. Low Stock */}
        {reportType === 'low_stock' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">اسم الصنف الناقص</th>
                  <th className="p-3">الباركود</th>
                  <th className="p-3">المتوفر حالياً</th>
                  <th className="p-3">حد الطلب الأدنى</th>
                  <th className="p-3">الحالة والكمية المقترحة للطلب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {products.filter(p => p.currentStock <= p.minStockLevel).map(p => (
                  <tr key={p.id} className="hover:bg-slate-850/50">
                    <td className="p-3 font-bold text-white">{p.nameAr}</td>
                    <td className="p-3 font-mono text-slate-400">{p.barcode}</td>
                    <td className="p-3 font-mono font-bold text-rose-400">{p.currentStock} {p.baseUnit}</td>
                    <td className="p-3 font-mono text-slate-400">{p.minStockLevel}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[11px] font-bold">
                        يوصى بطلب {p.maxStockLevel - p.currentStock} {p.baseUnit}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Customer Debts */}
        {reportType === 'customer_debts' && (
          <div className="space-y-3">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">إجمالي ديون العملاء المستحقة:</span>
              <span className="text-base font-bold text-amber-400 font-mono">{formatMoney(totalCustomerDebts)}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">اسم العميل</th>
                    <th className="p-3">الهاتف</th>
                    <th className="p-3">الرصيد المستحق (دين)</th>
                    <th className="p-3">سقف الائتمان</th>
                    <th className="p-3">أيام السداد المسموحة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {customers.filter(c => c.currentBalance > 0).map(c => (
                    <tr key={c.id} className="hover:bg-slate-850/50">
                      <td className="p-3 font-bold text-white">{c.nameAr}</td>
                      <td className="p-3 font-mono text-slate-400">{c.phone}</td>
                      <td className="p-3 font-mono font-bold text-amber-400">{formatMoney(c.currentBalance)}</td>
                      <td className="p-3 font-mono text-slate-400">{formatMoney(c.creditLimit)}</td>
                      <td className="p-3 font-mono text-slate-300">{c.creditDays} يوم</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. Supplier Payables */}
        {reportType === 'supplier_payables' && (
          <div className="space-y-3">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">إجمالي مستحقات الموردين:</span>
              <span className="text-base font-bold text-rose-400 font-mono">{formatMoney(totalSupplierPayables)}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">المورد</th>
                    <th className="p-3">الشركة</th>
                    <th className="p-3">الهاتف</th>
                    <th className="p-3">المبلغ المستحق له</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {suppliers.map(s => (
                    <tr key={s.id} className="hover:bg-slate-850/50">
                      <td className="p-3 font-bold text-white">{s.nameAr}</td>
                      <td className="p-3 text-slate-400">{s.companyName || '-'}</td>
                      <td className="p-3 font-mono text-slate-400">{s.phone}</td>
                      <td className="p-3 font-mono font-bold text-rose-400">{formatMoney(s.currentBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
