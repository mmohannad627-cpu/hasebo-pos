/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useCurrency } from '../../context/CurrencyContext';
import { useAuth } from '../../context/AuthContext';
import type { Expense } from '../../types';
import {
  Receipt,
  Plus,
  Search,
  Calendar,
  DollarSign,
  X,
  Tag,
} from 'lucide-react';

export const ExpensesScreen: React.FC = () => {
  const { formatMoney } = useCurrency();
  const { can } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    category: 'electricity',
    amount: 0,
    description: '',
    recipient: '',
    paymentMethod: 'cash',
  });

  const categoriesList = [
    { key: 'rent', labelAr: 'إيجار المحل أو المستودع' },
    { key: 'salaries', labelAr: 'رواتب وأجور العمال' },
    { key: 'electricity', labelAr: 'كهرباء وماطور وطاقة' },
    { key: 'water', labelAr: 'مياه وصرف صحي' },
    { key: 'supplies', labelAr: 'أكياس ومطبوعات ومستلزمات' },
    { key: 'maintenance', labelAr: 'صيانة وتصليحات' },
    { key: 'transportation', labelAr: 'نقل وشحن ومواصلات' },
    { key: 'taxes_fees', labelAr: 'رسوم حكومية ورخص وضرائب' },
    { key: 'other', labelAr: 'نثريات ومصروفات أخرى' },
  ];

  const loadExpenses = async () => {
    try {
      const data = await api.getExpenses();
      setExpenses(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0 || !formData.description) return;

    try {
      await api.createExpense(formData);
      setShowAddModal(false);
      setFormData({ category: 'electricity', amount: 0, description: '', recipient: '', paymentMethod: 'cash' });
      loadExpenses();
      alert('تم تسجيل سند الصرف وخصمه من الصندوق بنجاح');
    } catch (err: any) {
      alert(err.message || 'فشل تسجيل المصروف');
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto select-none" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-400" />
            <span>المصروفات التشغيلية وسندات الصرف</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            إجمالي المصروفات المسجلة: <span className="font-bold text-amber-400 font-mono">{formatMoney(totalExpenses)}</span>
          </p>
        </div>

        {can('expenses.create') && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل سند صرف جديد</span>
          </button>
        )}
      </div>

      {/* Expenses Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3.5 font-bold">التاريخ</th>
                <th className="p-3.5 font-bold">بند المصروف</th>
                <th className="p-3.5 font-bold">البيان / الوصف</th>
                <th className="p-3.5 font-bold">المستلم</th>
                <th className="p-3.5 font-bold">المبلغ</th>
                <th className="p-3.5 font-bold">المستخدم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {expenses.map(e => (
                <tr key={e.id} className="hover:bg-slate-850/50 transition">
                  <td className="p-3.5 font-mono text-slate-400">
                    {new Date(e.createdAt).toLocaleDateString('ar-YE')}
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                      {e.categoryLabelAr}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-200 font-medium">{e.description}</td>
                  <td className="p-3.5 text-slate-400">{e.recipient || '-'}</td>
                  <td className="p-3.5 font-mono font-bold text-amber-400">{formatMoney(e.amount)}</td>
                  <td className="p-3.5 text-slate-400">{e.userName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD EXPENSE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">تسجيل سند صرف</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">بند المصروف *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                >
                  {categoriesList.map(c => (
                    <option key={c.key} value={c.key}>
                      {c.labelAr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">المبلغ *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-amber-400 font-mono font-bold text-base focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">البيان / التفاصيل *</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="مثال: فاتورة كهرباء شهر أغسطس"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">المستلم / الجهة</label>
                <input
                  type="text"
                  value={formData.recipient}
                  onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                  placeholder="مثال: شركة الكهرباء التجارية"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold">
                  إلغاء
                </button>
                <button type="submit" className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold shadow-lg shadow-amber-500/20">
                  تأكيد سند الصرف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
