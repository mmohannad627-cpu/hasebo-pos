/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useStore, type NavigationTab } from '../../context/StoreContext';
import { ShoppingCart, LayoutDashboard, Boxes, Calculator, Menu, Scan } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, setIsDrawerOpen, setIsScannerOpen } = useStore();

  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(30);
      } catch (e) {}
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-slate-900/95 backdrop-blur border-t border-slate-800 z-40 flex items-center justify-around px-2 shadow-2xl select-none" dir="rtl">
      {/* 1: POS Screen */}
      <button
        type="button"
        onClick={() => {
          triggerHaptic();
          setActiveTab('pos');
        }}
        className={`flex flex-col items-center justify-center flex-1 h-full transition cursor-pointer ${
          activeTab === 'pos' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className={`p-1 rounded-xl transition ${activeTab === 'pos' ? 'bg-emerald-500/20 text-emerald-400' : ''}`}>
          <ShoppingCart className="w-5 h-5" />
        </div>
        <span className="text-[10px] mt-0.5">الكاشير</span>
      </button>

      {/* 2: Dashboard / Invoices */}
      <button
        type="button"
        onClick={() => {
          triggerHaptic();
          setActiveTab('dashboard');
        }}
        className={`flex flex-col items-center justify-center flex-1 h-full transition cursor-pointer ${
          activeTab === 'dashboard' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className={`p-1 rounded-xl transition ${activeTab === 'dashboard' ? 'bg-emerald-500/20 text-emerald-400' : ''}`}>
          <LayoutDashboard className="w-5 h-5" />
        </div>
        <span className="text-[10px] mt-0.5">الرئيسية</span>
      </button>

      {/* 3: CENTER FLOATING CAMERA SCAN FAB (Signature Emerald Action) */}
      <div className="relative -top-3 flex items-center justify-center px-1">
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            setIsScannerOpen(true);
          }}
          className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-500 via-emerald-500 to-teal-400 text-white flex flex-col items-center justify-center shadow-lg shadow-emerald-500/35 border-2 border-slate-900 active:scale-95 transition cursor-pointer group font-bold"
          title="كاميرا مسح الباركود السريعة"
        >
          <Scan className="w-6 h-6 group-hover:scale-110 transition stroke-[2.5]" />
          <span className="text-[8px] font-black mt-0.5">مسح</span>
        </button>
      </div>

      {/* 4: Products / Inventory */}
      <button
        type="button"
        onClick={() => {
          triggerHaptic();
          setActiveTab('products');
        }}
        className={`flex flex-col items-center justify-center flex-1 h-full transition cursor-pointer ${
          activeTab === 'products' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className={`p-1 rounded-xl transition ${activeTab === 'products' ? 'bg-emerald-500/20 text-emerald-400' : ''}`}>
          <Boxes className="w-5 h-5" />
        </div>
        <span className="text-[10px] mt-0.5">الأصناف</span>
      </button>

      {/* 5: Android Drawer Menu */}
      <button
        type="button"
        onClick={() => {
          triggerHaptic();
          setIsDrawerOpen(true);
        }}
        className="flex flex-col items-center justify-center flex-1 h-full text-slate-400 hover:text-emerald-400 transition cursor-pointer"
      >
        <div className="p-1 rounded-xl">
          <Menu className="w-5 h-5" />
        </div>
        <span className="text-[10px] mt-0.5">القائمة</span>
      </button>
    </nav>
  );
};

