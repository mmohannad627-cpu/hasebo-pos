/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Download, Smartphone, CheckCircle, Share2, Sparkles, X, WifiOff, HardDrive, Printer } from 'lucide-react';
import { HaseboLogo } from '../brand/HaseboLogo';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert('لتثبيت التطبيق على هاتف أو جهاز أندرويد:\n1. اضغط على قائمة الخيارات (⋮) في متصفح Chrome.\n2. اختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية (Add to Home screen)".');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
      <div className="bg-[#0B1424] border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-right">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 rounded-xl bg-[#07111F] text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Icon & Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#07111F] border border-[#D4A72C]/40 flex items-center justify-center shadow-lg shadow-[#D4A72C]/10 shrink-0">
            <HaseboLogo variant="icon" size="sm" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">تثبيت تطبيق «حاسبو» لأندرويد</h2>
            <p className="text-xs text-[#E0B43C] font-semibold">تطبيق PWA أصلي يعمل بدون إنترنت (HĀSEBO)</p>
          </div>
        </div>

        {/* Features List */}
        <div className="space-y-2.5 my-5">
          <div className="p-3 rounded-2xl bg-[#07111F] border border-slate-800 flex items-start gap-3 text-xs">
            <CheckCircle className="w-4 h-4 text-[#D4A72C] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-200 block">شاشة كاملة وتجربة أندرويد نقية</span>
              <span className="text-slate-400 text-[11px]">بدون أشرطة المتصفح مع لمس سريع وسلس كأي تطبيق Native APK</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#07111F] border border-slate-800 flex items-start gap-3 text-xs">
            <WifiOff className="w-4 h-4 text-[#D4A72C] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-200 block">يعمل بالكامل دون اتصال بالإنترنت (Offline)</span>
              <span className="text-slate-400 text-[11px]">تخزين فواتيرك محلياً والمزامنة التلقائية عند عودة الشبكة</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#07111F] border border-slate-800 flex items-start gap-3 text-xs">
            <Printer className="w-4 h-4 text-[#D4A72C] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-200 block">توافق مع أجهزة الكاشير المحمولة وطابعات البلوتوث</span>
              <span className="text-slate-400 text-[11px]">يدعم أجهزة كاشير أندرويد مثل Sunmi و iMin و PAX والطابعات الحرارية</span>
            </div>
          </div>
        </div>

        {/* Android Installation Instructions */}
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 mb-5">
          <p className="font-bold mb-1">خطوات التثبيت المباشر على أندرويد:</p>
          <ol className="list-decimal list-inside space-y-1 text-[11px] text-emerald-200/80">
            <li>اضغط زر التثبيت أدناه أو افتح قائمة المتصفح (⋮).</li>
            <li>اختر <strong>«تثبيت التطبيق»</strong> أو <strong>«إضافة إلى الشاشة الرئيسية»</strong>.</li>
            <li>ستظهر أيقونة التطبيق على شاشة هاتفك مثل أي تطبيق مثبت.</li>
          </ol>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-2xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
          >
            <Download className="w-4 h-4" />
            <span>تثبيت التطبيق على أندرويد (PWA)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-2xl font-semibold text-xs transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
