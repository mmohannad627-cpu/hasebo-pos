/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Check,
  Sparkles,
  Zap,
  ShieldCheck,
  Smartphone,
  Cloud,
  MessageCircle,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  X,
  Star,
  RefreshCw,
  QrCode,
  Lock,
  Gift,
  Flame,
  AlertTriangle,
  HelpCircle,
  Building2,
  ChevronLeft,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStore } from '../../context/StoreContext';
import { api } from '../../services/api';
import { WalletLogo } from '../common/WalletLogo';
import type { PlanConfig } from '../../types';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose }) => {
  const { subscriptionState, refreshSubscription } = useStore();
  const [selectedPlanId, setSelectedPlanId] = useState<'FREE' | 'PRO_MONTHLY' | 'PRO_YEARLY'>('PRO_YEARLY');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'kuraimi' | 'wallet' | 'cash'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'select_plan' | 'checkout' | 'success'>('select_plan');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const plans = subscriptionState?.plans || [];
  const currentSub = subscriptionState?.currentSubscription;
  const launchCampaign = subscriptionState?.campaigns?.find(c => c.id === 'LAUNCH_10_STORES');
  const earlyCustomerCampaign = subscriptionState?.campaigns?.find(c => c.id === 'EARLY_CUSTOMER_50');

  const isTrial = currentSub?.status === 'TRIAL';
  const remainingDays = currentSub?.remainingDays ?? 0;

  // Check if 50% early discount applies
  const isEarlyDiscountActive = earlyCustomerCampaign?.isActive && (earlyCustomerCampaign?.currentClaims || 0) < (earlyCustomerCampaign?.maxClaims || 50);

  const handleSubscribe = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const billingPeriod = selectedPlanId === 'PRO_YEARLY' ? 'yearly' : 'monthly';
      const appliedCampaignId = (selectedPlanId === 'PRO_YEARLY' && isEarlyDiscountActive) ? 'EARLY_CUSTOMER_50' : undefined;

      const res = await api.subscribePlan({
        planId: selectedPlanId,
        billingPeriod,
        paymentMethod,
        appliedCampaignId,
      });

      await refreshSubscription();
      setFeedbackMessage(res.message || 'تم تفعيل الاشتراك بنجاح!');
      setStep('success');

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
        });
      } catch (e) {}
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء معالجة الاشتراك');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClaimLaunch = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const res = await api.claimLaunchOffer();
      await refreshSubscription();
      setFeedbackMessage(res.message || 'تم تفعيل عرض الإطلاق (30 يوماً مجاناً) بنجاح!');
      setStep('success');
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
        });
      } catch (e) {}
    } catch (err: any) {
      setErrorMessage(err.message || 'تعذر تفعيل عرض الإطلاق');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto select-none">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-auto text-right">
        {/* Header Ribbon / Close */}
        <div className="relative bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  باقات واشتراكات حاسبو (HĀSEBO PRO)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  أسعار شفافة وبسيطة
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                اختر الخطة المناسبة لنشاطك التجاري واستمتع بأقوى أدوات المحاسبة والذكاء الاصطناعي
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Status Pill if any */}
        {currentSub && (
          <div className="bg-slate-850 px-6 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">حالة اشتراك متجرك الحالية:</span>
              <span className={`px-2 py-0.5 rounded-full font-bold font-mono ${
                currentSub.status === 'ACTIVE'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : currentSub.status === 'TRIAL'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-slate-700 text-slate-300'
              }`}>
                {currentSub.status === 'TRIAL'
                  ? `تجربة مجانية نشطة (متبقي ${remainingDays} يوم)`
                  : currentSub.status === 'ACTIVE'
                  ? 'باقة PRO نشطة'
                  : currentSub.status === 'EXPIRED'
                  ? 'منتهي الصلاحية'
                  : 'الباقة المجانية'}
              </span>
            </div>

            {isTrial && (
              <span className="text-[11px] text-amber-400 font-medium hidden sm:inline">
                تنتهي التجربة في: {new Date(currentSub.trialEndDate || currentSub.expiresAt).toLocaleDateString('ar-YE')}
              </span>
            )}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {step === 'select_plan' && (
            <>
              {/* Launch 10 Stores Offer Notification (if not yet claimed) */}
              {launchCampaign && launchCampaign.isActive && !currentSub?.claimedLaunchOffer && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/70 via-orange-950/60 to-slate-900 border border-amber-500/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Flame className="w-6 h-6 text-amber-400 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        عرض التدشين الخاص: أول 10 متاجر تحصل على PRO مجاناً 30 يوماً!
                      </h4>
                      <p className="text-xs text-amber-200/80">
                        متبقي {Math.max(0, launchCampaign.maxClaims - launchCampaign.currentClaims)} مقاعد فقط من أصل {launchCampaign.maxClaims}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClaimLaunch}
                    disabled={isProcessing || launchCampaign.currentClaims >= launchCampaign.maxClaims}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs transition cursor-pointer shrink-0 shadow-md shadow-amber-500/20"
                  >
                    {isProcessing ? 'جاري التفعيل...' : 'المطالبة بالتجربة المجانية'}
                  </button>
                </div>
              )}

              {/* 3 Main Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. FREE PLAN */}
                <div
                  onClick={() => setSelectedPlanId('FREE')}
                  className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    selectedPlanId === 'FREE'
                      ? 'bg-slate-800/90 border-slate-400 shadow-lg ring-2 ring-slate-400/30'
                      : 'bg-slate-850/60 border-slate-700/60 hover:border-slate-600'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-700 text-slate-300">
                        الخطة المجانية
                      </span>
                      {selectedPlanId === 'FREE' && (
                        <CheckCircle2 className="w-5 h-5 text-slate-300" />
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white">FREE</h3>
                      <p className="text-xs text-slate-400 mt-0.5">للمحلات الصغيرة ونقاط البيع الفردية</p>
                    </div>

                    <div className="pt-2 pb-1 border-y border-slate-700/60">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-white">$0</span>
                        <span className="text-xs text-slate-400">/ مدى الحياة</span>
                      </div>
                    </div>

                    <ul className="space-y-2.5 text-xs text-slate-300">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>نقطة بيع سريعة وإصدار الفواتير</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>حتى 100 صنف فقط</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>حتى 150 فاتورة شهرياً</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>قارئ باركود الكاميرا والكمبيوتر</span>
                      </li>
                      <li className="flex items-center gap-2 text-slate-500 line-through">
                        <X className="w-4 h-4 text-slate-600 shrink-0" />
                        <span>مستشار الذكاء الاصطناعي (AI)</span>
                      </li>
                      <li className="flex items-center gap-2 text-slate-500 line-through">
                        <X className="w-4 h-4 text-slate-600 shrink-0" />
                        <span>فواتير ورسائل الواتساب</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-5 mt-4 border-t border-slate-700/50">
                    <button
                      type="button"
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition ${
                        selectedPlanId === 'FREE'
                          ? 'bg-slate-700 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      {currentSub?.planId === 'FREE' ? 'خطتك الحالية' : 'اختيار الباقة المجانية'}
                    </button>
                  </div>
                </div>

                {/* 2. PRO MONTHLY */}
                <div
                  onClick={() => setSelectedPlanId('PRO_MONTHLY')}
                  className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    selectedPlanId === 'PRO_MONTHLY'
                      ? 'bg-slate-800/90 border-emerald-500 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500/30'
                      : 'bg-slate-850/60 border-slate-700/60 hover:border-slate-600'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        حاسبو برو الشهري
                      </span>
                      {selectedPlanId === 'PRO_MONTHLY' && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white">PRO MONTHLY</h3>
                      <p className="text-xs text-slate-400 mt-0.5">مرونة تامة لجميع الأنشطة والمحلات</p>
                    </div>

                    <div className="pt-2 pb-1 border-y border-slate-700/60">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-white">$5</span>
                        <span className="text-xs text-slate-400">/ شهرياً (تدفع شهرياً)</span>
                      </div>
                    </div>

                    <ul className="space-y-2.5 text-xs text-slate-200">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="font-semibold text-emerald-300">أصناف وفواتير غير محدودة</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="font-semibold text-purple-300">مستشار الذكاء الاصطناعي (AI)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="font-semibold text-emerald-300">مشاركة فواتير الواتساب الفورية</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>مزامنة سحابية وتعدد الفروع</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>طباعة البلوتوث والإيصالات الحرارية</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>العمل بدون إنترنت (Offline First)</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-5 mt-4 border-t border-slate-700/50">
                    <button
                      type="button"
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition ${
                        selectedPlanId === 'PRO_MONTHLY'
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      اختيار باقة برو الشهري ($5)
                    </button>
                  </div>
                </div>

                {/* 3. PRO YEARLY (BEST VALUE) */}
                <div
                  onClick={() => setSelectedPlanId('PRO_YEARLY')}
                  className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    selectedPlanId === 'PRO_YEARLY'
                      ? 'bg-gradient-to-b from-amber-950/40 via-slate-800 to-slate-850 border-amber-400 shadow-2xl shadow-amber-500/20 ring-2 ring-amber-400/40'
                      : 'bg-slate-850/60 border-amber-500/40 hover:border-amber-400/80'
                  }`}
                >
                  {/* Best Value Badge Header */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 font-black text-[10px] tracking-wider shadow-md shadow-amber-500/30 uppercase">
                    الأفضل قيمة والأكثر توفيراً (BEST VALUE)
                  </div>

                  <div className="space-y-4 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        حاسبو برو السنوي
                      </span>
                      {selectedPlanId === 'PRO_YEARLY' && (
                        <CheckCircle2 className="w-5 h-5 text-amber-400" />
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white">PRO YEARLY</h3>
                      <p className="text-xs text-slate-400 mt-0.5">عام كامل بكافة المزايا وبأفضل سعر</p>
                    </div>

                    <div className="pt-2 pb-1 border-y border-slate-700/60 space-y-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-black text-amber-300">
                          {isEarlyDiscountActive ? '$25' : '$50'}
                        </span>
                        <span className="text-xs text-slate-400">/ سنوياً</span>
                        {isEarlyDiscountActive && (
                          <span className="text-xs text-slate-500 line-through mr-1">$50</span>
                        )}
                      </div>

                      {/* Yearly Savings Comparison Breakdown */}
                      <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] space-y-1 text-amber-200">
                        <div className="flex justify-between text-slate-300">
                          <span>التكلفة بالاشتراك الشهري (12×5$):</span>
                          <span className="line-through text-slate-400 font-mono">$60 / سنة</span>
                        </div>
                        <div className="flex justify-between text-amber-300 font-bold">
                          <span>سعر الخطة السنوية:</span>
                          <span className="font-mono">{isEarlyDiscountActive ? '$25 / سنة' : '$50 / سنة'}</span>
                        </div>
                        <div className="flex justify-between text-emerald-400 font-extrabold border-t border-amber-500/20 pt-1">
                          <span>وفر فورياً:</span>
                          <span className="font-mono">{isEarlyDiscountActive ? '$35 سنوياً' : '$10 سنوياً'}</span>
                        </div>
                      </div>
                    </div>

                    <ul className="space-y-2.5 text-xs text-slate-200">
                      <li className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                        <span className="font-bold text-amber-300">جميع مزايا PRO غير المحدودة لعام كامل</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="font-semibold text-purple-300">مستشار الذكاء الاصطناعي للتحليل والتسعير</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>فواتير واتساب غير محدودة بدون قيود</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>نسخ احتياطي سحابي تلقائي مشفر</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>أولوية الدعم الفني والتحديثات السريعة</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-5 mt-4 border-t border-slate-700/50">
                    <button
                      type="button"
                      className={`w-full py-2.5 rounded-xl text-xs font-black transition ${
                        selectedPlanId === 'PRO_YEARLY'
                          ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 shadow-lg shadow-amber-500/30'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      اختيار الأفضل قيمة ({isEarlyDiscountActive ? '$25/سنة' : '$50/سنة'})
                    </button>
                  </div>
                </div>
              </div>

              {/* Data Retention Guarantee Box & Developer Support Note */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-2.5 text-xs text-slate-300">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-white block">ضمان حماية بيانات متجرك 100%:</span>
                    <span>
                      جميع فواتيرك، أصنافك، وسجلات ديون الزبائن والموردين محفوظة بأمان كامل ولا يتم حذفها أبداً حتى في حال انتهاء الاشتراك أو التبديل إلى الباقة المجانية.
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                  <span className="text-slate-400">
                    تصميم وتطوير: <strong className="text-white">م. مهند أحمد الزبير</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">لأي استفسار أو مشكلة تقنية:</span>
                    <a
                      href="https://wa.me/967774123322"
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 font-bold font-mono hover:underline"
                    >
                      واتساب: 774123322
                    </a>
                  </div>
                </div>
              </div>

              {/* Bottom Action */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  إغلاق
                </button>

                <button
                  type="button"
                  onClick={() => setStep('checkout')}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-sm shadow-xl shadow-emerald-500/25 transition cursor-pointer flex items-center gap-2"
                >
                  <span>متابعة تأكيد الاشتراك</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {step === 'checkout' && (
            <div className="space-y-6">
              {/* Selected Plan Summary */}
              <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-400">الباقة المختارة:</span>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    {selectedPlanId === 'FREE'
                      ? 'الباقة المجانية (FREE) - $0'
                      : selectedPlanId === 'PRO_MONTHLY'
                      ? 'حاسبو برو الشهري (PRO Monthly) - $5/شهرياً'
                      : `حاسبو برو السنوي (PRO Yearly) - ${isEarlyDiscountActive ? '$25' : '$50'}/سنوياً`}
                  </h3>
                  <p className="text-xs text-emerald-400 mt-1">
                    {selectedPlanId === 'PRO_YEARLY'
                      ? 'تشمل توفير سنوي $10 وتغطية كاملة لمدة 365 يوماً'
                      : selectedPlanId === 'PRO_MONTHLY'
                      ? 'تجديد شهري مرن مع إمكانية الإلغاء في أي وقت'
                      : 'خطة أساسية دائمة'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setStep('select_plan')}
                  className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-650 text-slate-200 text-xs font-semibold self-start sm:self-auto cursor-pointer"
                >
                  تغيير الباقة
                </button>
              </div>

              {/* Payment Method Selection */}
              {selectedPlanId !== 'FREE' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300">طريقة الدفع والتفعيل:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-4 rounded-xl border text-right transition cursor-pointer ${
                        paymentMethod === 'card'
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500'
                          : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <CreditCard className="w-5 h-5 mb-2 text-emerald-400" />
                      <div className="font-bold text-xs">بطاقة ائتمان / مدى (Card)</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Visa / MasterCard / Mada</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('kuraimi')}
                      className={`p-4 rounded-xl border text-right transition cursor-pointer flex flex-col justify-between ${
                        paymentMethod === 'kuraimi'
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500 shadow-lg'
                          : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <WalletLogo type="kuraimi" size="sm" />
                        <QrCode className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <div className="font-bold text-xs">الكريمي إكسبرس (Kuraimi)</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">حساب الكريمي أو الحوالات المصرفية</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('wallet')}
                      className={`p-4 rounded-xl border text-right transition cursor-pointer flex flex-col justify-between ${
                        paymentMethod === 'wallet'
                          ? 'bg-purple-500/10 border-purple-500 text-purple-200 ring-1 ring-purple-500 shadow-lg'
                          : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-2 overflow-x-auto">
                        <WalletLogo type="jeeb" size="sm" />
                        <WalletLogo type="jawali" size="sm" />
                        <WalletLogo type="floosak" size="sm" />
                        <WalletLogo type="onecash" size="sm" />
                      </div>
                      <div>
                        <div className="font-bold text-xs">المحافظ الإلكترونية (جيب / جوالي / فلوسك)</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">محفظة جيب (Jeeb)، جوالي، فلوسك، ون كاش، كاك بنك</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                  {errorMessage}
                </div>
              )}

              {/* Checkout Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep('select_plan')}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  الرجوع
                </button>

                <button
                  type="button"
                  onClick={handleSubscribe}
                  disabled={isProcessing}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-sm shadow-xl shadow-emerald-500/25 transition cursor-pointer flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>
                    {isProcessing
                      ? 'جاري إتمام الاشتراك والتفعيل...'
                      : selectedPlanId === 'FREE'
                      ? 'تأكيد اختيار الخطة المجانية'
                      : `تأكيد الدفع والتفعيل (${selectedPlanId === 'PRO_YEARLY' ? (isEarlyDiscountActive ? '$25' : '$50') : '$5'})`}
                  </span>
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-500/40 shadow-xl shadow-emerald-500/20 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <h3 className="text-2xl font-black text-white">
                تهانينا! تم تفعيل باقة حاسبو برو بنجاح 🎉
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                {feedbackMessage || 'أصبح لديك الآن وصول فوري لكافة الميزات المتقدمة ومستشار الذكاء الاصطناعي وفواتير الواتساب بدون أي حدود.'}
              </p>

              <div className="pt-4 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs transition cursor-pointer shadow-lg shadow-emerald-500/25"
                >
                  بدء استخدام التطبيق الآن
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
