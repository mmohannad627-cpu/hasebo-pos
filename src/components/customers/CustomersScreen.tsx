/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useCurrency } from '../../context/CurrencyContext';
import { useAuth } from '../../context/AuthContext';
import type { Customer } from '../../types';
import {
  Users,
  Plus,
  Search,
  Receipt,
  Phone,
  MapPin,
  X,
  CheckCircle2,
  DollarSign,
  FileText,
} from 'lucide-react';

export const CustomersScreen: React.FC = () => {
  const { formatMoney } = useCurrency();
  const { can } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [statementData, setStatementData] = useState<any>(null);

  // New Customer Form
  const [newCust, setNewCust] = useState({
    nameAr: '',
    phone: '',
    address: '',
    creditLimit: 50000,
    creditDays: 30,
    initialDebt: 0,
    notes: '',
  });

  // Payment Form
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payNotes, setPayNotes] = useState('');

  const loadCustomers = async () => {
    try {
      const data = await api.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCustomer(newCust);
      setShowAddModal(false);
      loadCustomers();
      alert('تم إضافة العميل بنجاح');
    } catch (err: any) {
      alert(err.message || 'فشل إنشاء العميل');
    }
  };

  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || payAmount <= 0) return;

    try {
      await api.collectCustomerPayment({
        customerId: selectedCustomer.id,
        amount: payAmount,
        notes: payNotes || 'سند قبض وتحصيل نقدي',
      });
      setShowPaymentModal(false);
      setPayAmount(0);
      setPayNotes('');
      loadCustomers();
      alert('تم تسجيل سند القبض وخصم المبلغ من رصيد العميل بنجاح');
    } catch (err: any) {
      alert(err.message || 'فشل تسجيل سند القبض');
    }
  };

  const handleViewStatement = async (cust: Customer) => {
    setSelectedCustomer(cust);
    try {
      const data = await api.getCustomerStatement(cust.id);
      setStatementData(data);
      setShowStatementModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = customers.filter(c =>
    c.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto select-none" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <span>دليل العملاء وحسابات الآجل (المدينون)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            إدارة حسابات الآجل، الحدود الائتمانية، كشوفات الحساب وسندات التحصيل
          </p>
        </div>

        {can('customers.create') && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة عميل جديد</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="بحث بالاسم أو رقم الهاتف..."
          className="w-full pr-10 pl-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Customers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(c => {
          const hasDebt = c.currentBalance > 0;
          return (
            <div
              key={c.id}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-3 shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">{c.nameAr}</h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{c.phone}</span>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-bold font-mono px-2.5 py-1 rounded-xl border ${
                      hasDebt
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    }`}
                  >
                    {hasDebt ? `مطلوب: ${formatMoney(c.currentBalance)}` : 'خالص (0)'}
                  </span>
                </div>

                {c.address && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-2">
                    <MapPin className="w-3 h-3" />
                    <span>{c.address}</span>
                  </div>
                )}
              </div>

              {/* Debt limit indicator */}
              <div className="pt-2 border-t border-slate-800 text-[11px] flex items-center justify-between text-slate-400">
                <span>سقف الائتمان: {formatMoney(c.creditLimit)}</span>
                <span>فترة السداد: {c.creditDays} يوم</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                {can('customers.collect_debt') && hasDebt && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(c);
                      setPayAmount(c.currentBalance);
                      setShowPaymentModal(true);
                    }}
                    className="flex-1 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>سند قبض</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleViewStatement(c)}
                  className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>كشف حساب</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD CUSTOMER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">إضافة عميل جديد</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">اسم العميل *</label>
                <input
                  type="text"
                  required
                  value={newCust.nameAr}
                  onChange={(e) => setNewCust({ ...newCust, nameAr: e.target.value })}
                  placeholder="مثال: يحيى صالح الأهدل"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">رقم الهاتف *</label>
                <input
                  type="tel"
                  required
                  value={newCust.phone}
                  onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
                  placeholder="770000000"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">العنوان / المنطقة</label>
                <input
                  type="text"
                  value={newCust.address}
                  onChange={(e) => setNewCust({ ...newCust, address: e.target.value })}
                  placeholder="صنعاء - شارع حدة"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">الحد الائتماني (ريال)</label>
                  <input
                    type="number"
                    value={newCust.creditLimit}
                    onChange={(e) => setNewCust({ ...newCust, creditLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">رصيد دين افتتاحي</label>
                  <input
                    type="number"
                    value={newCust.initialDebt}
                    onChange={(e) => setNewCust({ ...newCust, initialDebt: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20"
                >
                  حفظ العميل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COLLECT PAYMENT MODAL (سند قبض) */}
      {showPaymentModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span>سند قبض وتحصيل نقدي</span>
              </h3>
              <button type="button" onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <p className="text-slate-400">العميل: <span className="font-bold text-white">{selectedCustomer.nameAr}</span></p>
              <p className="text-slate-400 mt-1">الرصيد المستحق حالياً: <span className="font-bold text-amber-400 font-mono">{formatMoney(selectedCustomer.currentBalance)}</span></p>
            </div>

            <form onSubmit={handleCollectPayment} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">المبلغ المحصل نقداً *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedCustomer.currentBalance}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-emerald-400 font-mono font-bold text-base focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">ملاحظات / البيان</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="مثال: دفعة من الحساب نقداً"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold">
                  إلغاء
                </button>
                <button type="submit" className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20">
                  تأكيد سند القبض
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER STATEMENT MODAL */}
      {showStatementModal && statementData && selectedCustomer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">كشف حساب العميل: {selectedCustomer.nameAr}</h3>
                <p className="text-xs text-slate-400 font-mono">{selectedCustomer.phone}</p>
              </div>
              <button type="button" onClick={() => setShowStatementModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between text-xs font-mono">
              <span>الرصيد المتبقي المطلوب: <strong className="text-amber-400 text-sm">{formatMoney(selectedCustomer.currentBalance)}</strong></span>
              <span>سقف الائتمان: {formatMoney(selectedCustomer.creditLimit)}</span>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300">سجل المعاملات والمدفوعات:</span>
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3">التاريخ</th>
                      <th className="p-3">البيان</th>
                      <th className="p-3">مدين (+)</th>
                      <th className="p-3">دائن (-)</th>
                      <th className="p-3">الرصيد بعد</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono">
                    {statementData.transactions.map((tx: any) => (
                      <tr key={tx.id}>
                        <td className="p-3 text-slate-400">{new Date(tx.createdAt).toLocaleDateString('ar-YE')}</td>
                        <td className="p-3 text-slate-200 font-sans">{tx.notes || tx.type}</td>
                        <td className="p-3 text-rose-400">{tx.debit > 0 ? formatMoney(tx.debit) : '-'}</td>
                        <td className="p-3 text-emerald-400">{tx.credit > 0 ? formatMoney(tx.credit) : '-'}</td>
                        <td className="p-3 text-white font-bold">{formatMoney(tx.balanceAfter)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                طباعة كشف الحساب
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
