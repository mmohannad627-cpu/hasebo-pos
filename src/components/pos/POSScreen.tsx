/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useStore } from '../../context/StoreContext';
import { AndroidNumpad } from '../android/AndroidNumpad';
import { WalletLogo } from '../common/WalletLogo';
import type { Product, ProductCategory, Customer, Sale, UnitOption } from '../../types';
import {
  Search,
  Barcode,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  Printer,
  CreditCard,
  Banknote,
  UserCheck,
  Percent,
  X,
  Sparkles,
  ArrowRight,
  Receipt,
  Store,
  Layers,
  Scan,
  Share2,
  MessageCircle,
  Hash,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CartItem {
  product: Product;
  selectedUnit: UnitOption;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
}

export const POSScreen: React.FC = () => {
  const { user, currentBranch, settings } = useAuth();
  const { formatMoney, currentCurrency } = useCurrency();
  const { activeCashSession, refreshCashSession, setIsScannerOpen, registerBarcodeHandler } = useStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Mobile POS Tab: 'catalog' or 'cart'
  const [mobilePosTab, setMobilePosTab] = useState<'catalog' | 'cart'>('catalog');

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  // Payment Modal
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer' | 'credit'>('cash');
  const [selectedWallet, setSelectedWallet] = useState<'jeeb' | 'kuraimi' | 'jawali' | 'floosak' | 'onecash'>('jeeb');
  const [walletRefNumber, setWalletRefNumber] = useState<string>('');
  const [paidCashAmount, setPaidCashAmount] = useState<string>('');
  const [showNumpadForCash, setShowNumpadForCash] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Load products, categories, customers
  const loadData = async () => {
    try {
      const [catsData, prodsData, custsData] = await Promise.all([
        api.getCategories(),
        api.getProducts({ activeOnly: true }),
        api.getCustomers(),
      ]);
      setCategories(catsData);
      setProducts(prodsData);
      setCustomers(custsData);
      if (custsData.length > 0 && !selectedCustomer) {
        setSelectedCustomer(custsData[0]); // default to Walk-in customer
      }
    } catch (err) {
      console.error('Error loading POS data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Listen for Global Android Barcode Scanner scans
  useEffect(() => {
    const unregister = registerBarcodeHandler((barcode: string) => {
      const query = barcode.trim().toLowerCase();
      const matched = products.find(p =>
        p.barcode.toLowerCase() === query ||
        p.sku.toLowerCase() === query ||
        (p.internalBarcode && p.internalBarcode.toLowerCase() === query) ||
        p.units.some(u => u.barcode && u.barcode.toLowerCase() === query)
      );

      if (matched) {
        addToCart(matched);
      }
    });

    return () => {
      unregister();
    };
  }, [products]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2' && cart.length > 0) {
        e.preventDefault();
        setShowCheckoutModal(true);
      } else if (e.key === 'F4') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        setShowCheckoutModal(false);
        setShowReceiptModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart]);

  // Haptic trigger
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(50);
      } catch (e) {}
    }
  };

  // Handle direct barcode scanning & enter
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.trim().toLowerCase();
    // Search exact barcode first
    const matched = products.find(p =>
      p.barcode.toLowerCase() === query ||
      p.sku.toLowerCase() === query ||
      (p.internalBarcode && p.internalBarcode.toLowerCase() === query) ||
      p.units.some(u => u.barcode && u.barcode.toLowerCase() === query)
    );

    if (matched) {
      addToCart(matched);
      setSearchQuery('');
    }
  };

  const addToCart = (product: Product, unit?: UnitOption) => {
    triggerHaptic();
    const activeUnit = unit || product.units.find(u => u.isBaseUnit) || product.units[0];
    const unitPrice = activeUnit.retailPrice;

    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.product.id === product.id && item.selectedUnit.id === activeUnit.id);
      if (existingIdx !== -1) {
        const copy = [...prev];
        copy[existingIdx].quantity += 1;
        return copy;
      }
      return [
        ...prev,
        {
          product,
          selectedUnit: activeUnit,
          quantity: 1,
          unitPrice,
          discountAmount: 0,
        },
      ];
    });
  };

  const updateQuantity = (index: number, newQty: number) => {
    triggerHaptic();
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }
    setCart(prev => {
      const copy = [...prev];
      copy[index].quantity = newQty;
      return copy;
    });
  };

  const changeItemUnit = (index: number, unitId: string) => {
    setCart(prev => {
      const copy = [...prev];
      const targetUnit = copy[index].product.units.find(u => u.id === unitId);
      if (targetUnit) {
        copy[index].selectedUnit = targetUnit;
        copy[index].unitPrice = targetUnit.retailPrice;
      }
      return copy;
    });
  };

  const removeFromCart = (index: number) => {
    triggerHaptic();
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    triggerHaptic();
    setCart([]);
    setDiscountPercent(0);
    setTaxPercent(0);
    setNotes('');
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity - item.discountAmount), 0);
  const invoiceDiscountAmount = Math.round((subtotal * discountPercent) / 100);
  const taxAmount = Math.round(((subtotal - invoiceDiscountAmount) * taxPercent) / 100);
  const totalAmount = subtotal - invoiceDiscountAmount + taxAmount;
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Checkout submission
  const handleCompleteCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    try {
      const salePayload = {
        customerId: selectedCustomer?.id,
        items: cart.map(item => ({
          productId: item.product.id,
          productNameAr: item.product.nameAr,
          barcode: item.selectedUnit.barcode || item.product.barcode,
          unitId: item.selectedUnit.id,
          unitNameAr: item.selectedUnit.unitNameAr,
          unitConversionFactor: item.selectedUnit.conversionFactor,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: item.discountAmount,
        })),
        discountAmount: invoiceDiscountAmount,
        discountPercent,
        taxAmount,
        taxPercent,
        payments: [
          {
            method: paymentMethod,
            amount: paymentMethod === 'credit' ? 0 : totalAmount,
            currency: currentCurrency,
          },
        ],
        notes,
      };

      const result = await api.checkoutSale(salePayload);
      setCompletedSale(result);
      setShowCheckoutModal(false);
      setShowReceiptModal(true);

      // Trigger celebratory visual effect
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });

      // Reset cart and reload stock
      clearCart();
      loadData();
      refreshCashSession();
    } catch (err: any) {
      alert(err.message || 'فشلت عملية البيع');
    } finally {
      setIsProcessing(false);
    }
  };

  // WhatsApp Share receipt
  const handleShareWhatsApp = () => {
    if (!completedSale) return;
    const itemsText = completedSale.items.map(i => `• ${i.productNameAr} (${i.quantity} × ${i.unitPrice} = ${i.total} ر.ي)`).join('\n');
    const msg = `*فاتورة مبيعات - ${settings?.storeNameAr || 'سوبرماركت الوفاء'}*\n` +
      `رقم الفاتورة: ${completedSale.invoiceNumber}\n` +
      `التاريخ: ${new Date(completedSale.createdAt).toLocaleDateString('ar-YE')}\n` +
      `العميل: ${completedSale.customerName || 'عميل نقدي'}\n` +
      `------------------------\n` +
      `${itemsText}\n` +
      `------------------------\n` +
      `*الإجمالي: ${completedSale.total} ر.ي*\n` +
      `المدفوع: ${completedSale.paidAmount} ر.ي\n` +
      `${completedSale.remainingAmount > 0 ? `المتبقي آجل: ${completedSale.remainingAmount} ر.ي\n` : ''}` +
      `شكراً لتعاملكم معنا!`;

    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Android Web Share API
  const handleNativeShare = async () => {
    if (!completedSale) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `فاتورة ${completedSale.invoiceNumber}`,
          text: `فاتورة مبيعات من ${settings?.storeNameAr} بمبلغ ${completedSale.total} ر.ي`,
        });
      } catch (e) {}
    } else {
      handleShareWhatsApp();
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      p.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row overflow-hidden select-none bg-slate-950 text-slate-100 pb-16 md:pb-0" dir="rtl">
      {/* Mobile Top Tabs for Android / Small Screens */}
      <div className="lg:hidden flex items-center bg-slate-900 border-b border-slate-800 p-1.5 gap-1 shrink-0">
        <button
          type="button"
          onClick={() => setMobilePosTab('catalog')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            mobilePosTab === 'catalog'
              ? 'bg-emerald-500 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>الأصناف والمنتجات</span>
        </button>

        <button
          type="button"
          onClick={() => setMobilePosTab('cart')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer relative ${
            mobilePosTab === 'cart'
              ? 'bg-emerald-500 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>سلة الفاتورة</span>
          {cart.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold animate-pulse">
              {totalItemsCount}
            </span>
          )}
        </button>
      </div>

      {/* ======================================================== */}
      {/* RIGHT/CENTER: Catalog, Barcode Search & Fast Items Grid */}
      {/* ======================================================== */}
      <div className={`flex-1 flex flex-col border-l border-slate-800 h-full overflow-hidden ${
        mobilePosTab === 'cart' ? 'hidden lg:flex' : 'flex'
      }`}>
        {/* Top Controls: Search Bar & Fast Barcode */}
        <div className="p-2.5 sm:p-3 bg-slate-900 border-b border-slate-800 flex items-center gap-2">
          <form onSubmit={handleBarcodeSubmit} className="flex-1 relative">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-emerald-400">
              <Barcode className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <input
              ref={barcodeInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="امسح الباركود بالكاميرا أو اكتب اسم الصنف..."
              className="w-full pr-9 sm:pr-11 pl-4 py-2 sm:py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Instant Android Camera Scanner Trigger */}
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="p-2 sm:px-3 sm:py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs transition cursor-pointer flex items-center gap-1 shrink-0"
            title="فتح كاميرا قارئ الباركود"
          >
            <Scan className="w-4 h-4 sm:w-4 sm:h-4 text-emerald-400" />
            <span className="hidden sm:inline">مسح بالكاميرا</span>
          </button>

          {/* Quick Categories Bar Toggle */}
          <div className="text-xs font-semibold text-slate-400 hidden xl:block shrink-0">
            {filteredProducts.length} صنف
          </div>
        </div>

        {/* Category Horizontal Pills */}
        <div className="px-3 py-2 bg-slate-900/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
          >
            جميع الأصناف
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-emerald-500 text-white shadow-sm font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
              }`}
            >
              <span>{cat.nameAr}</span>
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="flex-1 p-2 sm:p-3 overflow-y-auto grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-2.5 content-start">
          {filteredProducts.map(product => {
            const isLowStock = product.currentStock <= product.minStockLevel;
            const isOutOfStock = product.currentStock <= 0;

            return (
              <div
                key={product.id}
                onClick={() => !isOutOfStock && addToCart(product)}
                className={`p-2.5 sm:p-3 rounded-xl border transition flex flex-col justify-between group cursor-pointer relative active:scale-[0.98] ${
                  isOutOfStock
                    ? 'bg-slate-900/40 border-slate-800 opacity-60 cursor-not-allowed'
                    : 'bg-slate-900 border-slate-800 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5'
                }`}
              >
                {/* Stock Tag */}
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span
                    className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                      isOutOfStock
                        ? 'bg-rose-500/20 text-rose-300'
                        : isLowStock
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    المتوفر: {product.currentStock}
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono">{product.sku}</span>
                </div>

                {/* Product Title */}
                <div className="mb-2">
                  <h3 className="text-xs sm:text-xs font-bold text-slate-100 group-hover:text-emerald-400 transition line-clamp-2 leading-tight">
                    {product.nameAr}
                  </h3>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 truncate mt-0.5">{product.barcode}</p>
                </div>

                {/* Price & Add Action */}
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80">
                  <div className="text-xs sm:text-xs font-extrabold text-emerald-400 font-mono">
                    {formatMoney(product.retailPrice)}
                  </div>
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition flex items-center justify-center cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Floating Bottom Bar for Instant Checkout */}
        {cart.length > 0 && mobilePosTab === 'catalog' && (
          <div className="lg:hidden p-2 bg-slate-900/95 backdrop-blur border-t border-slate-800 flex items-center justify-between gap-2 shadow-2xl">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono font-bold flex items-center justify-center text-xs">
                {totalItemsCount}
              </span>
              <div>
                <span className="text-[10px] text-slate-400 block">الإجمالي الحالي:</span>
                <span className="text-xs font-black text-emerald-400 font-mono leading-none">
                  {formatMoney(totalAmount)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setMobilePosTab('cart')}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
              >
                تعديل السلة
              </button>
              <button
                type="button"
                onClick={() => setShowCheckoutModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition flex items-center gap-1 cursor-pointer"
              >
                <span>دفع سريع</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* LEFT (RTL End): Cart Summary, Multi-Unit & Instant Checkout */}
      {/* ======================================================== */}
      <div className={`w-full lg:w-96 bg-slate-900 flex flex-col h-full shrink-0 border-t lg:border-t-0 ${
        mobilePosTab === 'catalog' ? 'hidden lg:flex' : 'flex'
      }`}>
        {/* Cart Header: Customer Selection & Reset */}
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <select
              value={selectedCustomer?.id || ''}
              onChange={(e) => {
                const found = customers.find(c => c.id === e.target.value);
                setSelectedCustomer(found || null);
              }}
              className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-2 py-1.5 w-full focus:outline-none focus:border-emerald-500"
            >
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nameAr} {c.currentBalance > 0 ? `(عليه دين: ${c.currentBalance} ر.ي)` : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={clearCart}
            disabled={cart.length === 0}
            className="p-1.5 text-slate-400 hover:text-rose-400 transition disabled:opacity-30 mr-2 cursor-pointer"
            title="تفريغ السلة"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 p-2.5 overflow-y-auto space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-6">
              <ShoppingCart className="w-12 h-12 stroke-[1.5] mb-2 opacity-40 text-slate-400" />
              <p className="text-sm font-semibold text-slate-400">سلة المبيعات فارغة</p>
              <p className="text-xs text-slate-500 mt-1">
                امسح باركود الصنف أو انقر على المنتجات لإضافتها للفاتورة
              </p>
            </div>
          ) : (
            cart.map((item, index) => {
              const lineTotal = item.unitPrice * item.quantity - item.discountAmount;

              return (
                <div
                  key={`${item.product.id}_${item.selectedUnit.id}`}
                  className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-100 truncate">{item.product.nameAr}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {/* Multi-Unit Switcher dropdown */}
                        {item.product.units.length > 1 ? (
                          <select
                            value={item.selectedUnit.id}
                            onChange={(e) => changeItemUnit(index, e.target.value)}
                            className="text-[11px] bg-slate-900 border border-slate-700 text-emerald-400 rounded px-1.5 py-0.5 focus:outline-none"
                          >
                            {item.product.units.map(u => (
                              <option key={u.id} value={u.id}>
                                {u.unitNameAr} ({u.retailPrice} ر.ي)
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400">
                            {item.selectedUnit.unitNameAr}
                          </span>
                        )}
                        <span className="text-[11px] font-mono text-slate-400">
                          {formatMoney(item.unitPrice)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(index)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Quantity Controls & Line Total */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-850">
                    <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => updateQuantity(index, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-300 hover:bg-slate-800 rounded cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                        className="w-10 text-center bg-transparent text-xs font-bold font-mono focus:outline-none text-white"
                      />
                      <button
                        type="button"
                        onClick={() => updateQuantity(index, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-300 hover:bg-slate-800 rounded cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-xs font-bold text-white font-mono">
                      {formatMoney(lineTotal)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Cart Bottom Summary & Checkout Button */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2">
          {/* Subtotal & Discount row */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>إجمالي الأصناف:</span>
            <span className="font-mono font-semibold text-slate-200">{formatMoney(subtotal)}</span>
          </div>

          {/* Discount & Tax input controls */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
              <Percent className="w-3 h-3 text-slate-400" />
              <input
                type="number"
                min="0"
                max="100"
                value={discountPercent || ''}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                placeholder="خصم %"
                className="w-full bg-transparent text-xs focus:outline-none text-slate-200"
              />
            </div>
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
              <span className="text-[10px] text-slate-400">ضريبة %</span>
              <input
                type="number"
                min="0"
                max="100"
                value={taxPercent || ''}
                onChange={(e) => setTaxPercent(Number(e.target.value))}
                placeholder="0"
                className="w-full bg-transparent text-xs focus:outline-none text-slate-200"
              />
            </div>
          </div>

          {/* Grand Total */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">المطلوب للدفع:</span>
              <span className="text-lg font-black text-emerald-400 font-mono leading-none">
                {formatMoney(totalAmount)}
              </span>
            </div>

            <button
              type="button"
              disabled={cart.length === 0}
              onClick={() => setShowCheckoutModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition active:scale-[0.98] disabled:opacity-40 flex items-center gap-2 cursor-pointer"
            >
              <span>دفع (F2)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* PAYMENT MODAL */}
      {/* ======================================================== */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <span>إتمام الدفع والفاتورة</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total Display */}
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
              <p className="text-xs text-emerald-400 font-semibold mb-0.5">إجمالي الفاتورة الصافي</p>
              <p className="text-2xl sm:text-3xl font-black text-white font-mono">{formatMoney(totalAmount)}</p>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">طريقة السداد:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition cursor-pointer ${
                    paymentMethod === 'cash'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-850'
                  }`}
                >
                  <Banknote className="w-4 h-4 text-emerald-400" />
                  <span>نقداً (كاش)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'bg-blue-500/20 border-blue-500 text-blue-300 shadow'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-850'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-blue-400" />
                  <span>شبكة / بطاقة</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition cursor-pointer ${
                    paymentMethod === 'bank_transfer'
                      ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-850'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>محفظة / كريمي</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit')}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition cursor-pointer ${
                    paymentMethod === 'credit'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-850'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-amber-400" />
                  <span>آجل على الحساب</span>
                </button>
              </div>
            </div>

            {/* E-Wallet & Bank options if bank_transfer is selected */}
            {paymentMethod === 'bank_transfer' && (
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>اختر المحفظة الإلكترونية أو البنك:</span>
                  </label>
                  <span className="text-[10px] text-slate-400">تحويل مباشر فوري</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedWallet('jeeb')}
                    className={`p-2 rounded-xl border flex items-center gap-2.5 transition cursor-pointer text-right ${
                      selectedWallet === 'jeeb'
                        ? 'bg-purple-950/60 border-purple-400 ring-2 ring-purple-500/40 text-white shadow-lg'
                        : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <WalletLogo type="jeeb" size="sm" />
                    <div className="truncate">
                      <div className="font-extrabold text-xs text-white">محفظة جيب</div>
                      <div className="text-[10px] text-purple-300">Jeeb Wallet</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedWallet('kuraimi')}
                    className={`p-2 rounded-xl border flex items-center gap-2.5 transition cursor-pointer text-right ${
                      selectedWallet === 'kuraimi'
                        ? 'bg-emerald-950/60 border-emerald-400 ring-2 ring-emerald-500/40 text-white shadow-lg'
                        : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <WalletLogo type="kuraimi" size="sm" />
                    <div className="truncate">
                      <div className="font-extrabold text-xs text-white">الكريمي</div>
                      <div className="text-[10px] text-emerald-300">Kuraimi Pay</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedWallet('jawali')}
                    className={`p-2 rounded-xl border flex items-center gap-2.5 transition cursor-pointer text-right ${
                      selectedWallet === 'jawali'
                        ? 'bg-emerald-950/60 border-emerald-400 ring-2 ring-emerald-500/40 text-white shadow-lg'
                        : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <WalletLogo type="jawali" size="sm" />
                    <div className="truncate">
                      <div className="font-extrabold text-xs text-white">محفظة جوالي</div>
                      <div className="text-[10px] text-emerald-300">Jawali WeNet</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedWallet('floosak')}
                    className={`p-2 rounded-xl border flex items-center gap-2.5 transition cursor-pointer text-right ${
                      selectedWallet === 'floosak'
                        ? 'bg-blue-950/60 border-blue-400 ring-2 ring-blue-500/40 text-white shadow-lg'
                        : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <WalletLogo type="floosak" size="sm" />
                    <div className="truncate">
                      <div className="font-extrabold text-xs text-white">محفظة فلوسك</div>
                      <div className="text-[10px] text-blue-300">Floosak</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedWallet('onecash')}
                    className={`p-2 rounded-xl border flex items-center gap-2.5 transition cursor-pointer text-right ${
                      selectedWallet === 'onecash'
                        ? 'bg-rose-950/60 border-rose-400 ring-2 ring-rose-500/40 text-white shadow-lg'
                        : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <WalletLogo type="onecash" size="sm" />
                    <div className="truncate">
                      <div className="font-extrabold text-xs text-white">ون كاش</div>
                      <div className="text-[10px] text-rose-300">OneCash</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedWallet('jeeb')}
                    className={`p-2 rounded-xl border flex items-center gap-2.5 transition cursor-pointer text-right ${
                      selectedWallet === 'jeeb' ? '' : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <WalletLogo type="mobilemoney" size="sm" />
                    <div className="truncate">
                      <div className="font-extrabold text-xs text-white">موبايل موني</div>
                      <div className="text-[10px] text-slate-400">CAC Bank</div>
                    </div>
                  </button>
                </div>

                <div className="pt-1">
                  <input
                    type="text"
                    value={walletRefNumber}
                    onChange={(e) => setWalletRefNumber(e.target.value)}
                    placeholder="رقم مرجع الحوالة / العملية (اختياري)..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-purple-400 shadow-inner"
                  />
                </div>
              </div>
            )}

            {/* Quick Cash calculator helper if cash */}
            {paymentMethod === 'cash' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    المبلغ المستلم من العميل:
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNumpadForCash(!showNumpadForCash)}
                    className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <Hash className="w-3 h-3" />
                    <span>{showNumpadForCash ? 'إخفاء لوحة الأرقام' : 'لوحة أرقام لمسية'}</span>
                  </button>
                </div>

                <input
                  type="number"
                  value={paidCashAmount}
                  onChange={(e) => setPaidCashAmount(e.target.value)}
                  placeholder={totalAmount.toString()}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />

                {showNumpadForCash && (
                  <div className="pt-2">
                    <AndroidNumpad
                      value={paidCashAmount}
                      onChange={(val) => setPaidCashAmount(val)}
                      onConfirm={() => setShowNumpadForCash(false)}
                      onClose={() => setShowNumpadForCash(false)}
                      title="المبلغ المدفوع نقداً"
                      unit="ر.ي"
                    />
                  </div>
                )}

                {Number(paidCashAmount) > totalAmount && (
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">الباقي للعميل:</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {formatMoney(Number(paidCashAmount) - totalAmount)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Complete Button */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleCompleteCheckout}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-xl shadow-xl shadow-emerald-500/25 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {isProcessing ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>تأكيد الفاتورة وطباعة الإيصال</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* THERMAL RECEIPT PREVIEW MODAL WITH WHATSAPP & ANDROID SHARE */}
      {/* ======================================================== */}
      {showReceiptModal && completedSale && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-4 sm:p-6 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-200">إيصال مبيعات حراري</h3>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Thermal Slip Area */}
            <div className="bg-white text-black p-4 rounded-xl font-mono text-xs shadow-inner space-y-2 text-right select-text">
              <div className="text-center pb-2 border-b border-dashed border-gray-400">
                <h2 className="font-bold text-sm">{settings?.storeNameAr || 'سوبرماركت الوفاء المركزي'}</h2>
                <p className="text-[10px] text-gray-600">{currentBranch?.nameAr} • {settings?.phone}</p>
                <p className="text-[10px] font-bold mt-1">فاتورة مبيعات مبسطة</p>
                <p className="text-[10px] text-gray-700">{completedSale.invoiceNumber}</p>
                <p className="text-[9px] text-gray-500">{new Date(completedSale.createdAt).toLocaleString('ar-YE')}</p>
              </div>

              <div className="text-[10px] space-y-0.5 py-1 border-b border-dashed border-gray-300">
                <p>العميل: {completedSale.customerName || 'عميل نقدي عام'}</p>
                <p>الكاشير: {user?.fullName}</p>
              </div>

              {/* Items */}
              <div className="py-1 border-b border-dashed border-gray-400 space-y-1">
                {completedSale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-[10px]">
                    <div className="flex-1">
                      <p className="font-semibold">{item.productNameAr}</p>
                      <p className="text-gray-600">{item.quantity} × {item.unitPrice} ر.ي ({item.unitNameAr})</p>
                    </div>
                    <span className="font-bold">{item.total} ر.ي</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-0.5 text-[10px] pt-1">
                <div className="flex justify-between">
                  <span>المجموع:</span>
                  <span>{completedSale.subtotal} ر.ي</span>
                </div>
                {completedSale.discountAmount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>الخصم:</span>
                    <span>-{completedSale.discountAmount} ر.ي</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xs pt-1 border-t border-black">
                  <span>الإجمالي النهائي:</span>
                  <span>{completedSale.total} ر.ي</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>المدفوع:</span>
                  <span>{completedSale.paidAmount} ر.ي</span>
                </div>
                {completedSale.remainingAmount > 0 && (
                  <div className="flex justify-between font-bold text-red-600">
                    <span>المتبقي آجل:</span>
                    <span>{completedSale.remainingAmount} ر.ي</span>
                  </div>
                )}
              </div>

              <div className="text-center pt-3 border-t border-dashed border-gray-400 text-[9px] text-gray-600">
                <p>{settings?.receiptFooterAr || 'شكراً لزيارتكم • البضاعة المباعة ترد وتستبدل خلال 24 ساعة'}</p>
                <p className="font-mono mt-1">*** نهاية الإيصال ***</p>
              </div>
            </div>

            {/* Quick Android Share & Print Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 text-xs cursor-pointer shadow"
              >
                <MessageCircle className="w-4 h-4" />
                <span>واتساب WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleNativeShare}
                className="py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 text-xs cursor-pointer shadow"
              >
                <Share2 className="w-4 h-4" />
                <span>مشاركة الفاتورة</span>
              </button>
            </div>

            {/* Print & Close */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs border border-slate-700 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>طباعة حرارية</span>
              </button>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition text-xs cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
