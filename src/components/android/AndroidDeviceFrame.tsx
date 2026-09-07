/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Smartphone, Tablet, Monitor, RotateCw, Scan, Download } from 'lucide-react';

export type AndroidViewMode = 'responsive' | 'phone' | 'pos_terminal';

interface AndroidDeviceFrameProps {
  children: React.ReactNode;
  viewMode: AndroidViewMode;
  onViewModeChange: (mode: AndroidViewMode) => void;
  onOpenScanner?: () => void;
  onOpenInstallModal?: () => void;
}

export const AndroidDeviceFrame: React.FC<AndroidDeviceFrameProps> = ({
  children,
  viewMode,
  onViewModeChange,
  onOpenScanner,
  onOpenInstallModal,
}) => {
  if (viewMode === 'responsive') {
    return <div className="w-full h-full min-h-screen flex flex-col">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 select-none overflow-x-hidden">
      {/* Device Mode Switcher Floating Bar (For Desktop Testing) */}
      <div className="mb-4 bg-slate-900 border border-slate-800 rounded-2xl p-1.5 flex items-center gap-1 shadow-xl text-xs z-30">
        <button
          type="button"
          onClick={() => onViewModeChange('phone')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
            viewMode === 'phone'
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>هاتف أندرويد</span>
        </button>

        <button
          type="button"
          onClick={() => onViewModeChange('pos_terminal')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
            viewMode === 'pos_terminal'
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Tablet className="w-3.5 h-3.5" />
          <span>كاشير أندرويد محمول (POS)</span>
        </button>

        <button
          type="button"
          onClick={() => onViewModeChange('responsive')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-slate-400 hover:text-slate-200 transition cursor-pointer"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>شاشة كاملة</span>
        </button>

        {onOpenScanner && (
          <button
            type="button"
            onClick={onOpenScanner}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold hover:bg-emerald-500/30 transition cursor-pointer mr-1"
            title="كاميرا مسح الباركود"
          >
            <Scan className="w-3.5 h-3.5" />
            <span>مسح الباركود</span>
          </button>
        )}

        {onOpenInstallModal && (
          <button
            type="button"
            onClick={onOpenInstallModal}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="تثبيت التطبيق"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Android Physical Frame */}
      {viewMode === 'phone' ? (
        <div className="relative w-[390px] h-[844px] max-w-full max-h-[92vh] bg-slate-900 border-[10px] border-slate-800 rounded-[50px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.1)] flex flex-col overflow-hidden">
          {/* Top Notch / Camera Punch Hole */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-950 rounded-full z-40 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700" />
          </div>

          {/* Screen Container */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 relative">
            {children}
          </div>

          {/* Android Home Navigation Bar Pill */}
          <div className="h-4 bg-slate-950 flex items-center justify-center shrink-0">
            <div className="w-28 h-1 rounded-full bg-slate-600/70" />
          </div>
        </div>
      ) : (
        /* Handheld Android POS Terminal (Sunmi / iMin style) */
        <div className="relative w-[480px] h-[880px] max-w-full max-h-[94vh] bg-slate-900 border-[12px] border-slate-800 rounded-[40px] shadow-2xl flex flex-col overflow-hidden">
          {/* Handheld POS Thermal Printer Head Mockup */}
          <div className="h-10 bg-slate-850 border-b border-slate-700/80 flex items-center justify-between px-4 text-[10px] text-slate-400 shrink-0">
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              طابعة فواتير أندرويد مدمجة (58mm)
            </span>
            <span className="font-mono text-slate-400">Sunmi / Android POS</span>
          </div>

          {/* Screen Container */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 relative">
            {children}
          </div>

          {/* Bottom Gripper / Android Navigation */}
          <div className="h-5 bg-slate-900 border-t border-slate-800 flex items-center justify-center shrink-0">
            <div className="w-32 h-1 rounded-full bg-slate-600" />
          </div>
        </div>
      )}
    </div>
  );
};
