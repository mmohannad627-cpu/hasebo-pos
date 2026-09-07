/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useCurrency } from '../../context/CurrencyContext';
import { useAuth } from '../../context/AuthContext';
import type { Product, ProductCategory, UnitOption } from '../../types';
import {
  Boxes,
  Plus,
  Search,
  Edit2,
  Trash2,
  Barcode,
  Layers,
  AlertTriangle,
  History,
  Check,
  X,
  Sparkles,
} from 'lucide-react';

export const ProductsScreen: React.FC = () => {
  const { formatMoney } = useCurrency();
  const { can } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState<{
    nameAr: string;
    nameEn: string;
    barcode: string;
    sku: string;
    categoryId: string;
    baseUnitNameAr: string;
    retailPrice: number;
    wholesalePrice: number;
    averageCost: number;
    currentStock: number;
    minStockLevel: number;
    maxStockLevel: number;
    hasBatches: boolean;
    units: UnitOption[];
  }>({
    nameAr: '',
    nameEn: '',
    barcode: '',
    sku: '',
    categoryId: '',
    baseUnitNameAr: 'حبة',
    retailPrice: 0,
    wholesalePrice: 0,
    averageCost: 0,
    currentStock: 0,
    minStockLevel: 10,
    maxStockLevel: 200,
    hasBatches: true,
    units: [],
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cats, prods] = await Promise.all([api.getCategories(), api.getProducts()]);
      setCategories(cats);
      setProducts(prods);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditingId(null);
    const autoBarcode = `629${Math.floor(100000000 + Math.random() * 900000000)}`;
    setFormData({
      nameAr: '',
      nameEn: '',
      barcode: autoBarcode,
      sku: `SKU-${Date.now().toString().slice(-6)}`,
      categoryId: categories[0]?.id || '',
      baseUnitNameAr: 'حبة',
      retailPrice: 0,
      wholesalePrice: 0,
      averageCost: 0,
      currentStock: 0,
      minStockLevel: 10,
      maxStockLevel: 200,
      hasBatches: true,
      units: [
        {
          id: `u_${Date.now()}_1`,
          unitNameAr: 'حبة',
          unitNameEn: 'Piece',
          unitType: 'piece',
          conversionFactor: 1,
          purchasePrice: 0,
          costPrice: 0,
          retailPrice: 0,
          wholesalePrice: 0,
          isBaseUnit: true,
          barcode: autoBarcode,
        },
      ],
    });
    setShowModal(true);
  };

  const handleOpenEdit = (product: Product) => {
    setIsEditing(true);
    setEditingId(product.id);
    setFormData({
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      barcode: product.barcode,
      sku: product.sku,
      categoryId: product.categoryId,
      baseUnitNameAr: product.units.find(u => u.isBaseUnit)?.unitNameAr || 'حبة',
      retailPrice: product.retailPrice,
      wholesalePrice: product.wholesalePrice || product.retailPrice,
      averageCost: product.averageCost,
      currentStock: product.currentStock,
      minStockLevel: product.minStockLevel,
      maxStockLevel: product.maxStockLevel,
      hasBatches: product.hasBatches,
      units: [...product.units],
    });
    setShowModal(true);
  };

  const handleAddSecondaryUnit = () => {
    const newUnit: UnitOption = {
      id: `u_${Date.now()}`,
      unitNameAr: 'كرتون',
      unitNameEn: 'Carton',
      unitType: 'carton',
      conversionFactor: 24,
      purchasePrice: formData.averageCost * 24,
      costPrice: formData.averageCost * 24,
      retailPrice: formData.retailPrice * 24,
      wholesalePrice: (formData.wholesalePrice || formData.retailPrice) * 24,
      isBaseUnit: false,
      barcode: `${formData.barcode}-CRT`,
    };
    setFormData(prev => ({ ...prev, units: [...prev.units, newUnit] }));
  };

  const handleRemoveSecondaryUnit = (idx: number) => {
    setFormData(prev => ({ ...prev, units: prev.units.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && editingId) {
        await api.updateProduct(editingId, formData);
      } else {
        await api.createProduct(formData);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء حفظ الصنف');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من رغبتك في أرشفة الصنف (${name})؟`)) return;
    try {
      await api.deleteProduct(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'فشلت أرشفة الصنف');
    }
  };

  const filtered = products.filter(p => {
    const matchesCat = selectedCat === 'all' || p.categoryId === selectedCat;
    const matchesLow = !filterLowStock || p.currentStock <= p.minStockLevel;
    const matchesSearch =
      !searchQuery ||
      p.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesLow && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto select-none" dir="rtl">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Boxes className="w-5 h-5 text-emerald-400" />
            <span>كتالوج الأصناف والأسعار والوحدات</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            إدارة بطاقات الأصناف، الباركودات، الوحدات المتعددة (حبة/كرتون)، وتواريخ الصلاحية
          </p>
        </div>

        {can('products.create') && (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تعريف صنف جديد</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم، الباركود، أو رمز الصنف..."
            className="w-full pr-10 pl-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Category Filter */}
        <select
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
          className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
        >
          <option value="all">جميع الأقسام والتصنيفات</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>
              {c.nameAr}
            </option>
          ))}
        </select>

        {/* Low Stock Toggle */}
        <button
          type="button"
          onClick={() => setFilterLowStock(!filterLowStock)}
          className={`px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
            filterLowStock
              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
              : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>النواقص فقط</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3.5 font-bold">اسم الصنف والبيانات</th>
                <th className="p-3.5 font-bold">القسم</th>
                <th className="p-3.5 font-bold">الباركود</th>
                <th className="p-3.5 font-bold">سعر التكلفة</th>
                <th className="p-3.5 font-bold">سعر البيع (مفرق)</th>
                <th className="p-3.5 font-bold">سعر الجملة</th>
                <th className="p-3.5 font-bold">الرصيد المتوفر</th>
                <th className="p-3.5 font-bold">الوحدات</th>
                <th className="p-3.5 font-bold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    لا توجد أصناف تطابق شروط البحث
                  </td>
                </tr>
              ) : (
                filtered.map(product => {
                  const isLow = product.currentStock <= product.minStockLevel;
                  return (
                    <tr key={product.id} className="hover:bg-slate-850/50 transition">
                      <td className="p-3.5">
                        <p className="font-bold text-slate-100">{product.nameAr}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{product.sku}</p>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                          {product.category?.nameAr || 'عام'}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-300">{product.barcode}</td>
                      <td className="p-3.5 font-mono text-slate-400">{formatMoney(product.averageCost)}</td>
                      <td className="p-3.5 font-mono font-bold text-emerald-400">{formatMoney(product.retailPrice)}</td>
                      <td className="p-3.5 font-mono text-blue-400">{formatMoney(product.wholesalePrice || product.retailPrice)}</td>
                      <td className="p-3.5">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                            isLow ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-200'
                          }`}
                        >
                          {product.currentStock} {product.baseUnit}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="text-[11px] text-slate-400">
                          {product.units.map(u => u.unitNameAr).join(' / ')}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {can('products.edit') && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(product)}
                              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-emerald-400 transition"
                              title="تعديل الصنف"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {can('products.delete') && (
                            <button
                              type="button"
                              onClick={() => handleDelete(product.id, product.nameAr)}
                              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-rose-400 transition"
                              title="أرشفة الصنف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Boxes className="w-5 h-5 text-emerald-400" />
                <span>{isEditing ? 'تعديل بيانات الصنف' : 'تعريف صنف جديد'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">اسم الصنف بالعربي *</label>
                  <input
                    type="text"
                    required
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    placeholder="مثال: حليب يماني 1 لتر"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">الباركود الدولي *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, barcode: `629${Math.floor(100000000 + Math.random() * 900000000)}` })}
                      className="px-2 py-1 bg-slate-800 text-[10px] text-slate-300 rounded-lg whitespace-nowrap"
                    >
                      توليد
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">القسم / التصنيف *</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">الوحدة الأساسية الصغرى *</label>
                  <input
                    type="text"
                    value={formData.baseUnitNameAr}
                    onChange={(e) => setFormData({ ...formData, baseUnitNameAr: e.target.value })}
                    placeholder="مثال: حبة، كيس، كجم"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">سعر التكلفة (شراء)</label>
                  <input
                    type="number"
                    value={formData.averageCost || ''}
                    onChange={(e) => setFormData({ ...formData, averageCost: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">سعر البيع (مفرق) *</label>
                  <input
                    type="number"
                    required
                    value={formData.retailPrice || ''}
                    onChange={(e) => setFormData({ ...formData, retailPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-emerald-400 font-bold font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">سعر البيع (جملة)</label>
                  <input
                    type="number"
                    value={formData.wholesalePrice || ''}
                    onChange={(e) => setFormData({ ...formData, wholesalePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">الرصيد الافتتاحي الأولي</label>
                  <input
                    type="number"
                    disabled={isEditing}
                    value={formData.currentStock || ''}
                    onChange={(e) => setFormData({ ...formData, currentStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">حد الطلب الأدنى (تنبيه النواقص)</label>
                  <input
                    type="number"
                    value={formData.minStockLevel || ''}
                    onChange={(e) => setFormData({ ...formData, minStockLevel: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="hasBatches"
                    checked={formData.hasBatches}
                    onChange={(e) => setFormData({ ...formData, hasBatches: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-500"
                  />
                  <label htmlFor="hasBatches" className="text-xs text-slate-300 cursor-pointer">
                    تتبع الدفعات وتاريخ انتهاء الصلاحية (FEFO)
                  </label>
                </div>
              </div>

              {/* Secondary Units Section */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">الوحدات المتعددة (كرتون / باكت / كيس)</span>
                  <button
                    type="button"
                    onClick={handleAddSecondaryUnit}
                    className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة وحدة أكبر</span>
                  </button>
                </div>

                {formData.units.filter(u => !u.isBaseUnit).map((unit, idx) => (
                  <div key={unit.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-4 gap-2 text-xs items-center">
                    <div>
                      <span className="text-[10px] text-slate-500 block">اسم الوحدة:</span>
                      <input
                        type="text"
                        value={unit.unitNameAr}
                        onChange={(e) => {
                          const copy = [...formData.units];
                          const realIdx = copy.findIndex(u => u.id === unit.id);
                          if (realIdx !== -1) copy[realIdx].unitNameAr = e.target.value;
                          setFormData({ ...formData, units: copy });
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">المعامل (كم حبة؟):</span>
                      <input
                        type="number"
                        value={unit.conversionFactor}
                        onChange={(e) => {
                          const copy = [...formData.units];
                          const realIdx = copy.findIndex(u => u.id === unit.id);
                          if (realIdx !== -1) copy[realIdx].conversionFactor = Number(e.target.value);
                          setFormData({ ...formData, units: copy });
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">سعر بيع الوحدة:</span>
                      <input
                        type="number"
                        value={unit.retailPrice}
                        onChange={(e) => {
                          const copy = [...formData.units];
                          const realIdx = copy.findIndex(u => u.id === unit.id);
                          if (realIdx !== -1) copy[realIdx].retailPrice = Number(e.target.value);
                          setFormData({ ...formData, units: copy });
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-emerald-400 font-mono"
                      />
                    </div>
                    <div className="text-left pt-3">
                      <button
                        type="button"
                        onClick={() => handleRemoveSecondaryUnit(formData.units.findIndex(u => u.id === unit.id))}
                        className="text-rose-400 hover:text-rose-300 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit Buttons */}
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
                  حفظ الصنف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
