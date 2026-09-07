/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  X,
  Star,
  Flame,
  Gift,
  ShieldCheck,
  TrendingUp,
  MessageCircle,
  Smartphone,
  Cloud,
  Layers,
  Zap,
  CreditCard,
  History,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Settings2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { LaunchOfferBanner } from './LaunchOfferBanner';
import { EarlyCustomerOfferBanner } from './EarlyCustomerOfferBanner';
import { SubscriptionModal } from './SubscriptionModal';
import { AdminCampaignsModal } from './AdminCampaignsModal';

export const PricingScreen: React.FC = () => {
  const { subscriptionState, refreshSubscription, setIsSubscriptionModalOpen } = useStore();
  const { role } = useAuth();
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const currentSub = subscriptionState?.currentSubscription;
  const invoices = subscriptionState?.invoices || [];
  const plans = subscriptionState?.plans || [];

  const isPro = currentSub && (currentSub.planId === 'PRO_MONTHLY' || currentSub.planId === 'PRO_YEARLY') && (currentSub.status === 'ACTIVE' || currentSub.status === 'TRIAL');
  const isTrial = currentSub?.status === 'TRIAL';
  const remainingDays = currentSub?.remainingDays ?? 0;

  const handleCancelAutoRenew = async () => {
    if (!window.confirm('هل أنت متأكد من رغبتك في إلغاء التجديد التلقائي؟ ستستمر ميزات PRO حتى نهاية الفترة الحالية ولن يتم حذف بياناتك.')) {
      return;
    }

    setIsCancelling(true);
    try {
      const res = await api.cancelSubscription('إلغاء التجديد بناء على رغبة المتجر');
      await refreshSubscription();
      setActionMessage(res.message || 'تم إلغاء التجديد التلقائي بنجاح');
    } catch (err: any) {
      alert(err.message || 'تعذر إلغاء التجديد');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRenewNow = async () => {
    setIsRenewing(true);
    try {
      const res = await api.renewSubscription();
      await refreshSubscription();
      setActionMessage(res.message || 'تم تجديد الاشتراك بنجاح!');
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}
    } catch (err: any) {
      alert(err.message || 'تعذر تجديد الاشتراك');
    } finally {
      setIsRenewing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto text-right select-none">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              باقات الاشتراك والأسعار (HASEBO PRO)
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              تسعير مباشر وعادل
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            صمم نظام حاسبو (HĀSEBO) لتمكين أصحاب المتاجر والمشاريع من الإدارة المالية والمخزنية الذكية بأعلى كفاءة وأقل تكلفة.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {(role?.name === 'SUPER_ADMIN' || role?.name === 'BRANCH_MANAGER') && (
            <button
              type="button"
              onClick={() => setIsAdminModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-bold transition cursor-pointer flex items-center gap-2"
            >
              <Settings2 className="w-4 h-4" />
              <span>إدارة العروض والأسعار (Admin)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsSubscriptionModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs font-extrabold shadow-lg shadow-emerald-500/20 transition cursor-pointer flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>ترقية / تجديد الاشتراك</span>
          </button>
        </div>
      </div>

      {/* Dynamic Promotional Banners */}
      <LaunchOfferBanner />
      <EarlyCustomerOfferBanner />

      {/* Current Store Subscription Status Card */}
      {currentSub && (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-7 shadow-xl space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 ${
                isPro
                  ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-800 border border-slate-700'
              }`}>
                {isPro ? <Sparkles className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6 text-slate-400" />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-400">باقة متجرك الحالية:</span>
                  <span className="text-base font-bold text-white">
                    {currentSub.planId === 'PRO_YEARLY'
                      ? 'حاسبو برو السنوي (PRO Yearly)'
                      : currentSub.planId === 'PRO_MONTHLY'
                      ? 'حاسبو برو الشهري (PRO Monthly)'
                      : 'الباقة المجانية الدائمة (FREE)'}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono ${
                    currentSub.status === 'ACTIVE'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : currentSub.status === 'TRIAL'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : currentSub.status === 'EXPIRED'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {currentSub.status === 'TRIAL'
                      ? `فترة تجريبية (متبقي ${remainingDays} يوم)`
                      : currentSub.status === 'ACTIVE'
                      ? 'نشط (Active)'
                      : currentSub.status === 'EXPIRED'
                      ? 'منتهي الصلاحية'
                      : 'مجاني'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  المتجر: <span className="text-slate-200 font-semibold">{currentSub.storeNameAr || 'سوبرماركت الوفاء المركزي'}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {currentSub.status !== 'FREE' && (
                <button
                  type="button"
                  onClick={handleRenewNow}
                  disabled={isRenewing}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRenewing ? 'animate-spin' : ''}`} />
                  <span>تجديد الآن</span>
                </button>
              )}

              {currentSub.autoRenew && currentSub.status !== 'FREE' && (
                <button
                  type="button"
                  onClick={handleCancelAutoRenew}
                  disabled={isCancelling}
                  className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold transition cursor-pointer"
                >
                  إلغاء التجديد التلقائي
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsSubscriptionModalOpen(true)}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition cursor-pointer shadow-md shadow-emerald-500/20"
              >
                تغيير الخطة
              </button>
            </div>
          </div>

          {/* Subscription Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-850 border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[11px]">تاريخ البداية:</span>
              <div className="font-bold text-white font-mono">
                {currentSub.startDate ? new Date(currentSub.startDate).toLocaleDateString('ar-YE') : '—'}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-850 border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[11px]">تاريخ الانتهاء / التجديد:</span>
              <div className="font-bold text-emerald-400 font-mono">
                {currentSub.expiresAt ? new Date(currentSub.expiresAt).toLocaleDateString('ar-YE') : 'مدى الحياة'}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-850 border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[11px]">الأيام المتبقية:</span>
              <div className="font-extrabold text-amber-400 font-mono text-sm">
                {currentSub.planId === 'FREE' ? '∞ غير محدود' : `${remainingDays} يوم`}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-850 border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[11px]">المبلغ المدفوع:</span>
              <div className="font-bold text-white font-mono">
                ${currentSub.pricePaidUSD ?? 0} {currentSub.pricePaidUSD === 0 ? '(مجاناً / تجربة)' : 'USD'}
              </div>
            </div>
          </div>

          {actionMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{actionMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* 3 Main Plans Visual Comparison */}
      <div className="space-y-4">
        <div className="text-center space-y-1 max-w-xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-black text-white">اختر الباقة المناسبة لنمو تجارتك</h2>
          <p className="text-xs text-slate-400">باقات مصممة لتناسب كافة أحجام المحلات والسوبرماركت ونقاط البيع</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {/* 1. FREE PLAN */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  الباقة المجانية الدائمة
                </span>
                <span className="text-xs text-slate-500 font-mono">FREE</span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">مجاني للأبد</h3>
                <p className="text-xs text-slate-400 mt-1">
                  مثالية لتجربة النظام أو نقاط البيع الفردية الصغيرة جداً.
                </p>
              </div>

              <div className="pt-2 pb-1 border-y border-slate-800">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">$0</span>
                  <span className="text-xs text-slate-400">/ مدى الحياة</span>
                </div>
              </div>

              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>إصدار فواتير نقدية وآجلة</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>حد أقصى 100 صنف فقط</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>حد أقصى 150 فاتورة شهرياً</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>مستخدم واحد (كاشير أساسي)</span>
                </li>
                <li className="flex items-center gap-2.5 text-slate-500 line-through">
                  <X className="w-4 h-4 text-slate-600 shrink-0" />
                  <span>المستشار الذكي (Gemini AI Advisor)</span>
                </li>
                <li className="flex items-center gap-2.5 text-slate-500 line-through">
                  <X className="w-4 h-4 text-slate-600 shrink-0" />
                  <span>إرسال الفواتير عبر واتساب WhatsApp</span>
                </li>
                <li className="flex items-center gap-2.5 text-slate-500 line-through">
                  <X className="w-4 h-4 text-slate-600 shrink-0" />
                  <span>المزامنة السحابية الفورية وتعدد الأجهزة</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => setIsSubscriptionModalOpen(true)}
              className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold transition cursor-pointer border border-slate-700"
            >
              اختيار الباقة المجانية ($0)
            </button>
          </div>

          {/* 2. PRO MONTHLY */}
          <div className="p-6 rounded-3xl bg-slate-900 border-2 border-emerald-500/50 shadow-xl shadow-emerald-500/5 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  حاسبو برو الشهري
                </span>
                <span className="text-xs text-emerald-400 font-mono font-bold">PRO MONTHLY</span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">اشتراك شهري مرن</h3>
                <p className="text-xs text-slate-400 mt-1">
                  وصول كامل لكافة الميزات المتقدمة والذكاء الاصطناعي بدون التزام طويل.
                </p>
              </div>

              <div className="pt-2 pb-1 border-y border-slate-800">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-emerald-400">$5</span>
                  <span className="text-xs text-slate-400">/ شهرياً</span>
                </div>
              </div>

              <ul className="space-y-3 text-xs text-slate-200">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-bold text-emerald-300">أصناف وفواتير مبيعات غير محدودة</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-bold text-purple-300">مستشار الذكاء الاصطناعي (Gemini AI)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-bold text-emerald-300">مشاركة الفواتير وكشوفات الحساب بالواتساب</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>تعدد المستخدمين والصلاحيات والورديات</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>قارئ الباركود الذكي وطباعة البلوتوث</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>مزامنة سحابية مشفرة ونسخ احتياطي فوري</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => setIsSubscriptionModalOpen(true)}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-black transition cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              الاشتراك في برو الشهري ($5/شهر)
            </button>
          </div>

          {/* 3. PRO YEARLY (BEST VALUE) */}
          <div className="relative p-6 rounded-3xl bg-gradient-to-b from-amber-950/30 via-slate-900 to-slate-900 border-2 border-amber-400 shadow-2xl shadow-amber-500/10 flex flex-col justify-between space-y-6">
            {/* Best Value Badge Header */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 font-black text-xs tracking-wider shadow-lg shadow-amber-500/30 uppercase">
              الأفضل قيمة والأكثر توفيراً (BEST VALUE)
            </div>

            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  حاسبو برو السنوي
                </span>
                <span className="text-xs text-amber-400 font-mono font-bold">PRO YEARLY</span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">عام كامل بأوفر سعر</h3>
                <p className="text-xs text-slate-400 mt-1">
                  الخيار الذكي لأصحاب المشاريع: وفر 10 دولار فورياً مع عام كامل من التحديثات.
                </p>
              </div>

              <div className="pt-2 pb-1 border-y border-slate-800 space-y-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-amber-300">$50</span>
                  <span className="text-xs text-slate-400">/ سنوياً (سنة كاملة)</span>
                </div>

                {/* Clear Yearly Saving Formula */}
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1.5 text-amber-200">
                  <div className="flex justify-between text-slate-300">
                    <span>12 شهراً × $5:</span>
                    <span className="line-through text-slate-400 font-mono">$60 / سنة</span>
                  </div>
                  <div className="flex justify-between text-amber-300 font-bold">
                    <span>سعر الباقة السنوية:</span>
                    <span className="font-mono">$50 / سنة</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-extrabold border-t border-amber-500/20 pt-1">
                    <span>التوفير السنوي الفوري:</span>
                    <span className="font-mono">$10 (خصم 17%)</span>
                  </div>
                </div>
              </div>

              <ul className="space-y-3 text-xs text-slate-200">
                <li className="flex items-center gap-2.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                  <span className="font-bold text-amber-300">كافة مزايا برو الشاملة لمدة 365 يوماً</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>توفير سنوي فوري 10 دولار</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>مستشار الذكاء الاصطناعي والتحليلات المتقدمة</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>فواتير وكشوفات واتساب غير محدودة</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>أولوية الدعم الفني واستقرار النظام</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => setIsSubscriptionModalOpen(true)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 text-xs font-black transition cursor-pointer shadow-xl shadow-amber-500/25"
            >
              الاشتراك في السنوي الأوفر ($50/سنة)
            </button>
          </div>
        </div>
      </div>

      {/* Subscription Invoices History */}
      {invoices.length > 0 && (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 font-bold text-sm text-white">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>سجل فواتير الاشتراكات والمدفوعات</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">{invoices.length} فاتورة</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="py-2.5 px-3">رقم الفاتورة</th>
                  <th className="py-2.5 px-3">الباقة / البيان</th>
                  <th className="py-2.5 px-3">المبلغ المدفوع</th>
                  <th className="py-2.5 px-3">طريقة الدفع</th>
                  <th className="py-2.5 px-3">التاريخ</th>
                  <th className="py-2.5 px-3">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {invoices.map(inv => (
                  <tr key={inv.id} className="text-slate-300 hover:bg-slate-850/50">
                    <td className="py-3 px-3 font-mono font-semibold text-emerald-400">{inv.invoiceNumber}</td>
                    <td className="py-3 px-3">{inv.planNameAr}</td>
                    <td className="py-3 px-3 font-mono font-bold text-white">${inv.totalPaidUSD}</td>
                    <td className="py-3 px-3">{inv.paymentMethod}</td>
                    <td className="py-3 px-3 font-mono text-slate-400">{new Date(inv.createdAt).toLocaleDateString('ar-YE')}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {inv.status === 'PAID' ? 'مدفوعة ومفعلة' : inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Frequently Asked Questions */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-2 font-bold text-base text-white">
          <HelpCircle className="w-5 h-5 text-emerald-400" />
          <span>الأسئلة الشائعة حول الاشتراكات والحماية</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 space-y-2">
            <h4 className="font-bold text-white text-sm">ماذا يحدث لبياناتي إذا انتهى الاشتراك ولم أجدد؟</h4>
            <p className="text-slate-300 leading-relaxed">
              بياناتك وسجلاتك المالية ومخزونك وفواتيرك محفوظة بالكامل بنسبة 100%. لن يتم مسح أي بيانات، وتتحول حسابك تلقائياً إلى الباقة المجانية مع إمكانية عرض جميع تقاريرك السابقة في أي وقت.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 space-y-2">
            <h4 className="font-bold text-white text-sm">ما هي طرق الدفع المتاحة لتفعيل باقة PRO؟</h4>
            <p className="text-slate-300 leading-relaxed">
              ندعم البطاقات المصرفية (فيزا، ماستركارد، مدى)، وحسابات الكريمي إكسبرس، والمحافظ الإلكترونية (محفظة جيب Jeeb، جوالي، فلوسك، ون كاش، موبايل موني / كاك بنك)، إضافة للحوالات المباشرة.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 space-y-2">
            <h4 className="font-bold text-white text-sm">هل يمكنني الترقية من الخطة الشهرية إلى السنوية لاحقاً؟</h4>
            <p className="text-slate-300 leading-relaxed">
              نعم، يمكنك الترقية إلى الخطة السنوية الأكثر توفيراً في أي وقت والاستفادة من خصم الـ 10 دولار السنوي مباشرة.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 space-y-2">
            <h4 className="font-bold text-white text-sm">كيف يعمل عرض الإطلاق للأول 10 متاجر؟</h4>
            <p className="text-slate-300 leading-relaxed">
              يحصل أول 10 متاجر تقوم بالمطالبة بالعرض على تجربة PRO مجانية بالكامل لمدة 30 يوماً متواصلة بدون أي التزام مالي أو إدخال بطاقة دفع.
            </p>
          </div>
        </div>
      </div>

      {/* Developer Attribution & Support Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/30 p-6 flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-4 text-right">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-black text-base shrink-0">
            MZ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#E0B43C] font-bold">تصميم وتطوير نظام حاسبو (HĀSEBO):</span>
              <span className="text-sm font-black text-white">م. مهند أحمد الزبير</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              لأي استفسارات، تفعيل مباشر، طلب تعديلات خاصة، أو عند وجود أي مشكلة تقنية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <a
            href="tel:774123322"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2"
          >
            <span>اتصال: 774123322</span>
          </a>
          <a
            href="https://wa.me/967774123322"
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-black shadow-lg shadow-emerald-500/20 transition flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>واتساب المطور: 774123322</span>
          </a>
        </div>
      </div>

      {/* Admin Campaigns Modal */}
      {isAdminModalOpen && (
        <AdminCampaignsModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
        />
      )}

      {/* Subscription Checkout Modal */}
      <SubscriptionModal
        isOpen={false}
        onClose={() => {}}
      />
    </div>
  );
};
