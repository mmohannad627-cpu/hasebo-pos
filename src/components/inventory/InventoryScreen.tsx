/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useCurrency } from '../../context/CurrencyContext';
import { useAuth } from '../../context/AuthContext';
import type { InventoryMovement, Product } from '../../types';
import {
  Layers,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Barcode,
  ArrowDownUp,
  Sliders,
  Check,
  X,
} from 'lucide-react';

export const InventoryScreen: React.FC = () => {
  const { formatMoney } = useCurrency();
  const { can } = useAuth();
  const [activeTab, setActiveTab] = useState<'movements' | 'stocktake' | 'adjust'>('movements');
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Manual Adjustment State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [adjustmentQty, setAdjustmentQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('');

  // Stocktake Module State
  const [stocktakeItems, setStocktakeItems] = useState<{
    productId: string;
    productNameAr: string;
    systemStock: number;
    actualStock: number;
    unitCost: number;
  }[]>([]);

  const loadData = async () => {
    try {
      const [movData, prodData] = await Promise.all([
        api.getInventoryMovements(),
        api.getProducts(),
      ]);
      setMovements(movData);
      setProducts(prodData);
      if (prodData.length > 0 && !selectedProductId) {
        setSelectedProductId(prodData[0].id);
      }
      // Initialize stocktaking items
      setStocktakeItems(
        prodData.map(p => ({
          productId: p.id,
          productNameAr: p.nameAr,
          systemStock: p.currentStock,
          actualStock: p.currentStock,
          unitCost: p.averageCost,
        }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApplyAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || adjustmentQty === 0) {
      alert('يرجى تحديد الصنف وفارق الكمية');
      return;
    }

    try {
      await api.adjustInventory({
        productId: selectedProductId,
        adjustmentQty,
        reason: adjustReason || 'تسوية مخزنية يدوية',
      });
      alert('تم تطبيق التسوية المخزنية بنجاح');
      setAdjustmentQty(0);
      setAdjustReason('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'فشلت التسوية');
    }
  };

  const handleSaveStocktake = async () => {
    const discrepancies = stocktakeItems.filter(item => item.actualStock !== item.systemStock);
    if (discrepancies.length === 0) {
      alert('لا توجد فروقات بين الجرد الفعلي وسجلات النظام');
      return;
    }

    if (!confirm(`سيتم تطبيق تسويات مخزنية لعدد (${discrepancies.length}) أصناف لمطابقة الجرد الفعلي. هل تود المتابعة؟`)) {
      return;
    }

    try {
      for (const item of discrepancies) {
        const diff = item.actualStock - item.systemStock;
        await api.adjustInventory({
          productId: item.productId,
          adjustmentQty: diff,
          reason: `تسوية جرد دوري شامل (فارق ${diff})`,
        });
      }
      alert('تم اعتماد الجرد وتحديث المخزون بنجاح!');
      loadData();
    } catch (err: any) {
      alert(err.message || 'فشل حفظ الجرد');
    }
  };

  const filteredMovements = movements.filter(m =>
    !searchQuery ||
    m.productNameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.referenceNumber && m.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto select-none" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <span>إدارة المخزون، سجل الحركات، والجرد الدوري</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            سجل التدقيق المخزني لجميع عمليات البيع والشراء والتسويات والجرد الفعلي
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('movements')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'movements' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            سجل الحركات المخزنية
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('stocktake')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'stocktake' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            الجرد الدوري الشامل
          </button>
          {can('inventory.adjust') && (
            <button
              type="button"
              onClick={() => setActiveTab('adjust')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                activeTab === 'adjust' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              تسوية يدوية سريعة
            </button>
          )}
        </div>
      </div>

      {/* 1. MOVEMENTS AUDIT TRAIL */}
      {activeTab === 'movements' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث في الحركات باسم الصنف أو رقم الفاتورة..."
              className="w-full pr-10 pl-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3.5 font-bold">التاريخ والوقت</th>
                    <th className="p-3.5 font-bold">اسم الصنف</th>
                    <th className="p-3.5 font-bold">نوع الحركة</th>
                    <th className="p-3.5 font-bold">الكمية السابقة</th>
                    <th className="p-3.5 font-bold">حركة التغيير</th>
                    <th className="p-3.5 font-bold">الرصيد بعد الحركة</th>
                    <th className="p-3.5 font-bold">المرجع</th>
                    <th className="p-3.5 font-bold">المستخدم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredMovements.map(m => {
                    const isPositive = m.quantityChange > 0;
                    return (
                      <tr key={m.id} className="hover:bg-slate-850/50 transition">
                        <td className="p-3.5 font-mono text-slate-400">
                          {new Date(m.createdAt).toLocaleString('ar-YE', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="p-3.5 font-bold text-slate-100">{m.productNameAr}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300">
                            {m.typeLabelAr}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-400">{m.previousQuantity}</td>
                        <td className="p-3.5 font-mono font-bold">
                          <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                            {isPositive ? `+${m.quantityChange}` : m.quantityChange}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-white">{m.newQuantity}</td>
                        <td className="p-3.5 font-mono text-slate-400">{m.referenceNumber || '-'}</td>
                        <td className="p-3.5 text-slate-400">{m.userName || 'النظام'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. PHYSICAL STOCKTAKE MODULE */}
      {activeTab === 'stocktake' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">جلسة جرد فعلي للمتجر</h3>
              <p className="text-xs text-slate-400">أدخل الكمية الفعلية المحصورة على الرفوف لحساب الفروقات آلياً</p>
            </div>
            <button
              type="button"
              onClick={handleSaveStocktake}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              اعتماد الجرد وتسوية الفروقات
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3.5 font-bold">اسم الصنف</th>
                  <th className="p-3.5 font-bold">رصيد النظام (الدفتري)</th>
                  <th className="p-3.5 font-bold">الرصيد الفعلي على الرف *</th>
                  <th className="p-3.5 font-bold">الفارق (عجز / زيادة)</th>
                  <th className="p-3.5 font-bold">قيمة الفارق المالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {stocktakeItems.map((item, idx) => {
                  const diff = item.actualStock - item.systemStock;
                  const diffValue = diff * item.unitCost;

                  return (
                    <tr key={item.productId} className="hover:bg-slate-850/50">
                      <td className="p-3.5 font-bold text-slate-100">{item.productNameAr}</td>
                      <td className="p-3.5 font-mono text-slate-300 font-bold">{item.systemStock}</td>
                      <td className="p-3.5">
                        <input
                          type="number"
                          value={item.actualStock}
                          onChange={(e) => {
                            const copy = [...stocktakeItems];
                            copy[idx].actualStock = Number(e.target.value);
                            setStocktakeItems(copy);
                          }}
                          className="w-24 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-emerald-400 font-mono font-bold"
                        />
                      </td>
                      <td className="p-3.5 font-mono font-bold">
                        {diff === 0 ? (
                          <span className="text-slate-500">مطابق (0)</span>
                        ) : diff > 0 ? (
                          <span className="text-emerald-400">+{diff} (فائض)</span>
                        ) : (
                          <span className="text-rose-400">{diff} (عجز)</span>
                        )}
                      </td>
                      <td className="p-3.5 font-mono font-bold">
                        {diff === 0 ? (
                          <span className="text-slate-500">0</span>
                        ) : (
                          <span className={diffValue > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {formatMoney(Math.abs(diffValue))}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. MANUAL ADJUSTMENT FORM */}
      {activeTab === 'adjust' && (
        <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <span>تسوية مخزنية يدوية لصنف</span>
          </h3>

          <form onSubmit={handleApplyAdjustment} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">حدد الصنف *</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nameAr} (الرصيد الحالي: {p.currentStock})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                كمية التعديل (أدخل رقماً موجباً للزيادة، أو سالباً للنقص) *
              </label>
              <input
                type="number"
                required
                value={adjustmentQty}
                onChange={(e) => setAdjustmentQty(Number(e.target.value))}
                placeholder="مثال: -5 أو +10"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">سبب التسوية المخزنية *</label>
              <input
                type="text"
                required
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="مثال: تالف أثناء النقل، هدية ترويجية، كسر"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              تنفيذ التسوية وتحديث السجل
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
