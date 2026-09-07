/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useCurrency } from '../../context/CurrencyContext';
import { useAuth } from '../../context/AuthContext';
import type { Supplier } from '../../types';
import {
  Building,
  Plus,
  Search,
  Phone,
  MapPin,
  X,
  FileText,
} from 'lucide-react';

export const SuppliersScreen: React.FC = () => {
  const { formatMoney } = useCurrency();
  const { can } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [newSup, setNewSup] = useState({
    nameAr: '',
    companyName: '',
    phone: '',
    email: '',
    address: '',
    initialBalance: 0,
    notes: '',
  });

  const loadSuppliers = async () => {
    try {
      const data = await api.getSuppliers();
      setSuppliers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSupplier(newSup);
      setShowAddModal(false);
      loadSuppliers();
      alert('تم إضافة المورد بنجاح');
    } catch (err: any) {
      alert(err.message || 'فشل إضافة المورد');
    }
  };

  const filtered = suppliers.filter(s =>
    s.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.companyName && s.companyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    s.phone.includes(searchQuery)
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto select-none" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building className="w-5 h-5 text-emerald-400" />
            <span>دليل الموردين والشركات الموزعة (الدائنون)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            إدارة بيانات الموردين، حسابات الآجل المستحقة، وسندات الصرف
          </p>
        </div>

        {can('suppliers.create') && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مورد جديد</span>
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="بحث بالاسم أو اسم الشركة أو الهاتف..."
          className="w-full pr-10 pl-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(s => {
          const hasDebt = s.currentBalance > 0;
          return (
            <div
              key={s.id}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-3 shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">{s.nameAr}</h3>
                    {s.companyName && <p className="text-xs text-slate-400 font-medium">{s.companyName}</p>}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{s.phone}</span>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-bold font-mono px-2.5 py-1 rounded-xl border ${
                      hasDebt
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    }`}
                  >
                    {hasDebt ? `مستحق له: ${formatMoney(s.currentBalance)}` : 'خالص (0)'}
                  </span>
                </div>

                {s.address && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-2">
                    <MapPin className="w-3 h-3" />
                    <span>{s.address}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">إضافة مورد جديد</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">اسم المورد / المندوب *</label>
                <input
                  type="text"
                  required
                  value={newSup.nameAr}
                  onChange={(e) => setNewSup({ ...newSup, nameAr: e.target.value })}
                  placeholder="مثال: شركة هائل سعيد أنعم"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">اسم الشركة / المؤسسة</label>
                <input
                  type="text"
                  value={newSup.companyName}
                  onChange={(e) => setNewSup({ ...newSup, companyName: e.target.value })}
                  placeholder="مجموعة HSA التجارية"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">رقم الهاتف *</label>
                <input
                  type="tel"
                  required
                  value={newSup.phone}
                  onChange={(e) => setNewSup({ ...newSup, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">رصيد افتتاحي مستحق له</label>
                <input
                  type="number"
                  value={newSup.initialBalance}
                  onChange={(e) => setNewSup({ ...newSup, initialBalance: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold">
                  إلغاء
                </button>
                <button type="submit" className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20">
                  حفظ المورد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
