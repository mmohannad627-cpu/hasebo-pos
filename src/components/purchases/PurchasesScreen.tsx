/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useCurrency } from '../../context/CurrencyContext';
import { useAuth } from '../../context/AuthContext';
import type { Purchase, Supplier, Product } from '../../types';
import {
  Truck,
  Plus,
  Search,
  Sparkles,
  Calendar,
  Building,
  UploadCloud,
  CheckCircle2,
  X,
  FileText,
  Trash2,
} from 'lucide-react';

export const PurchasesScreen: React.FC = () => {
  const { formatMoney } = useCurrency();
  const { can } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isScanningAI, setIsScanningAI] = useState(false);

  // Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer'>('cash');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<
    {
      productId: string;
      productNameAr: string;
      unitNameAr: string;
      quantity: number;
      unitPurchasePrice: number;
      unitConversionFactor: number;
      batchNumber?: string;
      expiryDate?: string;
    }[]
  >([]);

  const loadData = async () => {
    try {
      const [purchData, supData, prodData] = await Promise.all([
        api.getPurchases(),
        api.getSuppliers(),
        api.getProducts(),
      ]);
      setPurchases(purchData);
      setSuppliers(supData);
      setProducts(prodData);
      if (supData.length > 0) setSelectedSupplierId(supData[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenNew = () => {
    setSupplierInvoiceNumber(`SUP-${Math.floor(1000 + Math.random() * 9000)}`);
    setItems([]);
    setDiscountAmount(0);
    setPaidAmount(0);
    setNotes('');
    setShowModal(true);
  };

  const handleAddItem = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setItems(prev => [
      ...prev,
      {
        productId: product.id,
        productNameAr: product.nameAr,
        unitNameAr: product.baseUnit || 'حبة',
        quantity: 10,
        unitPurchasePrice: product.averageCost || product.retailPrice * 0.8,
        unitConversionFactor: 1,
        batchNumber: `LOT-${Date.now().toString().slice(-6)}`,
        expiryDate: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().split('T')[0],
      },
    ]);
  };

  // AI Invoice Scanner
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningAI(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const extracted = await api.scanInvoiceAI(base64, file.type);

        if (extracted) {
          if (extracted.invoiceNumber) setSupplierInvoiceNumber(extracted.invoiceNumber);
          if (extracted.discountAmount) setDiscountAmount(extracted.discountAmount);
          if (extracted.paidAmount) setPaidAmount(extracted.paidAmount);

          // Find or match supplier
          const matchedSup = suppliers.find(s =>
            s.nameAr.includes(extracted.supplierName) || extracted.supplierName.includes(s.nameAr)
          );
          if (matchedSup) setSelectedSupplierId(matchedSup.id);

          // Match items with catalog or create draft entries
          const parsedItems = extracted.items.map((it: any) => {
            const matchedProd = products.find(p =>
              p.nameAr.includes(it.productName) || it.productName.includes(p.nameAr)
            );
            return {
              productId: matchedProd ? matchedProd.id : products[0]?.id || 'prod_1',
              productNameAr: it.productName || matchedProd?.nameAr || 'صنف جديد',
              unitNameAr: it.unit || 'حبة',
              quantity: it.quantity || 1,
              unitPurchasePrice: it.unitPrice || 1000,
              unitConversionFactor: 1,
              batchNumber: `LOT-AI-${Date.now().toString().slice(-4)}`,
              expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
            };
          });

          setItems(parsedItems);
          alert('تم قراءة وتعبئة بنود الفاتورة بالذكاء الاصطناعي بنجاح!');
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      alert(err.message || 'فشل مسح الفاتورة بالذكاء الاصطناعي');
    } finally {
      setIsScanningAI(false);
    }
  };

  const subtotal = items.reduce((sum, it) => sum + (it.quantity * it.unitPurchasePrice), 0);
  const total = Math.max(0, subtotal - discountAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('يرجى إضافة أصناف لفاتورة الشراء');
      return;
    }

    try {
      await api.createPurchase({
        supplierId: selectedSupplierId,
        supplierInvoiceNumber,
        items,
        discountAmount,
        paidAmount,
        paymentMethod,
        notes,
      });
      setShowModal(false);
      loadData();
      alert('تم حفظ فاتورة الشراء وتحديث أرصدة المخزون والمورد بنجاح');
    } catch (err: any) {
      alert(err.message || 'فشل تسجيل فاتورة الشراء');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto select-none" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-400" />
            <span>فواتير المشتريات والتوريد المخزني</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            إدخال فواتير الموردين، احتساب متوسط التكلفة المرجح، وتتبع تواريخ الصلاحية
          </p>
        </div>

        {can('purchases.create') && (
          <button
            type="button"
            onClick={handleOpenNew}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل فاتورة شراء جديدة</span>
          </button>
        )}
      </div>

      {/* Purchases List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3.5 font-bold">رقم الفاتورة</th>
                <th className="p-3.5 font-bold">المورد</th>
                <th className="p-3.5 font-bold">رقم فاتورة المورد</th>
                <th className="p-3.5 font-bold">التاريخ</th>
                <th className="p-3.5 font-bold">الإجمالي</th>
                <th className="p-3.5 font-bold">المدفوع</th>
                <th className="p-3.5 font-bold">المتبقي (آجل)</th>
                <th className="p-3.5 font-bold">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {purchases.map(p => (
                <tr key={p.id} className="hover:bg-slate-850/50 transition">
                  <td className="p-3.5 font-mono font-bold text-emerald-400">{p.invoiceNumber}</td>
                  <td className="p-3.5 font-semibold text-slate-100">{p.supplierName}</td>
                  <td className="p-3.5 font-mono text-slate-400">{p.supplierInvoiceNumber || '-'}</td>
                  <td className="p-3.5 font-mono text-slate-400">
                    {new Date(p.createdAt).toLocaleDateString('ar-YE')}
                  </td>
                  <td className="p-3.5 font-mono font-bold text-white">{formatMoney(p.total)}</td>
                  <td className="p-3.5 font-mono text-emerald-400">{formatMoney(p.paidAmount)}</td>
                  <td className="p-3.5 font-mono text-rose-400 font-bold">
                    {p.remainingAmount > 0 ? formatMoney(p.remainingAmount) : 'خالص'}
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                      تم الاستلام والتوريد
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW PURCHASE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-400" />
                <span>فاتورة شراء وتوريد بضاعة</span>
              </h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AI OCR Scanner Banner */}
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-purple-200">الماسح الضوئي الذكي للفواتير (Gemini OCR)</h4>
                  <p className="text-[11px] text-purple-300/80">ارفع صورة فاتورة المورد الورقية ليتم استخراج الأصناف والأسعار تلقائياً</p>
                </div>
              </div>

              <label className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow">
                <UploadCloud className="w-4 h-4" />
                <span>{isScanningAI ? 'جاري التحليل...' : 'رفع صورة الفاتورة'}</span>
                <input type="file" accept="image/*,application/pdf" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">المورد *</label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">رقم فاتورة المورد</label>
                  <input
                    type="text"
                    value={supplierInvoiceNumber}
                    onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">إضافة صنف من الكتالوج</label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddItem(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="w-full px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs focus:outline-none"
                  >
                    <option value="">+ اختر صنف لإضافته للفاتورة</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nameAr} ({p.barcode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items Table in Modal */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-300">أصناف الفاتورة والتوريد:</span>
                {items.length === 0 ? (
                  <p className="text-xs text-slate-500 p-4 text-center bg-slate-950 rounded-xl border border-slate-800">
                    لم تقم بإضافة أصناف بعد
                  </p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {items.map((it, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs items-center">
                        <div className="sm:col-span-2">
                          <span className="font-bold text-white block">{it.productNameAr}</span>
                          <span className="text-[10px] text-slate-500">الوحدة: {it.unitNameAr}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">الكمية:</span>
                          <input
                            type="number"
                            min="1"
                            value={it.quantity}
                            onChange={(e) => {
                              const copy = [...items];
                              copy[idx].quantity = Number(e.target.value);
                              setItems(copy);
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">سعر الشراء:</span>
                          <input
                            type="number"
                            value={it.unitPurchasePrice}
                            onChange={(e) => {
                              const copy = [...items];
                              copy[idx].unitPurchasePrice = Number(e.target.value);
                              setItems(copy);
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-emerald-400 font-mono"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-white">{formatMoney(it.quantity * it.unitPurchasePrice)}</span>
                          <button
                            type="button"
                            onClick={() => setItems(items.filter((_, i) => i !== idx))}
                            className="text-rose-400 hover:text-rose-300 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">المبلغ الإجمالي:</label>
                  <div className="text-lg font-bold text-emerald-400 font-mono">{formatMoney(total)}</div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">المبلغ المدفوع نقداً للمورد:</label>
                  <input
                    type="number"
                    value={paidAmount || ''}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">المتبقي آجل على الحساب:</label>
                  <div className="text-sm font-bold text-rose-400 font-mono mt-1">
                    {formatMoney(Math.max(0, total - paidAmount))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-750 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  حفظ الفاتورة وتوريد المخزون
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
