/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Flame, Sparkles, Gift, Clock, CheckCircle2, ShieldCheck, ArrowRight, Star } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStore } from '../../context/StoreContext';
import { api } from '../../services/api';

export const LaunchOfferBanner: React.FC = () => {
  const { subscriptionState, refreshSubscription, setIsSubscriptionModalOpen } = useStore();
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);

  const launchCampaign = subscriptionState?.campaigns?.find(c => c.id === 'LAUNCH_10_STORES');
  const currentSub = subscriptionState?.currentSubscription;

  const maxClaims = launchCampaign?.maxClaims || 10;
  const currentClaims = launchCampaign?.currentClaims || 0;
  const remainingSpots = Math.max(0, maxClaims - currentClaims);
  const isFullyClaimed = currentClaims >= maxClaims;

  const isAlreadyClaimedByMe = currentSub?.claimedLaunchOffer || currentSub?.appliedCampaignId === 'LAUNCH_10_STORES';
  const isTrialActive = currentSub?.status === 'TRIAL' && (currentSub?.remainingDays ?? 0) > 0;

  const handleClaim = async () => {
    setClaimError(null);
    setClaimSuccess(null);
    setIsClaiming(true);

    try {
      const res = await api.claimLaunchOffer();
      setClaimSuccess(res.message || 'تم تفعيل باقة حاسبو برو مجاناً لمدة 30 يوماً بنجاح!');
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch (e) {}
      await refreshSubscription();
    } catch (err: any) {
      setClaimError(err.message || 'تعذر الاستفادة من العرض حالياً');
    } finally {
      setIsClaiming(false);
    }
  };

  if (!launchCampaign || !launchCampaign.isActive) {
    return null;
  }

  // If user is already enjoying the free 30-day trial
  if (isAlreadyClaimedByMe && isTrialActive) {
    const remainingDays = currentSub?.remainingDays ?? 30;
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900/80 via-teal-900/80 to-slate-900 border border-emerald-500/40 p-4 sm:p-5 shadow-lg shadow-emerald-500/10 mb-6 text-right select-none">
        <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/30 shrink-0">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  عرض التدشين نشط 🎉
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  أنت من أول {maxClaims} متاجر استفادت من التجربة المجانية!
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                باقة حاسبو برو (HĀSEBO PRO) مفعلة بكامل المزايا (متبقي {remainingDays} يوم)
              </h3>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                تاريخ انتهاء التجربة: {currentSub?.trialEndDate ? new Date(currentSub.trialEndDate).toLocaleDateString('ar-YE') : 'بعد 30 يوماً'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              type="button"
              onClick={() => setIsSubscriptionModalOpen(true)}
              className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>تفاصيل الباقة والترقية</span>
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/80 via-orange-950/70 to-slate-900 border-2 border-amber-500/50 p-4 sm:p-6 shadow-xl shadow-amber-500/10 mb-6 text-right select-none">
      {/* Decorative Glow */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
        {/* Left Side: Headline & Counters */}
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20">
              <Flame className="w-3.5 h-3.5 fill-slate-950" />
              <span>عرض إطلاق حصري ومحدود</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              مجاناً 100% لمدة 30 يوماً
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
            أول 10 متاجر تحصل على باقة حاسبو برو (HĀSEBO PRO) مجاناً لمدة شهر!
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            استمتع بكافة ميزات الذكاء الاصطناعي، وفواتير المبيعات اللامحدودة، ومشاركة فواتير الواتساب، والمزامنة السحابية بدون دفع أي رسوم وبدون بطاقة ائتمانية.
          </p>

          {/* Progress / Spots Counter */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="text-slate-300">المقاعد المحجوزة:</span>
              <span className="text-amber-400 font-mono font-bold text-sm bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-700">
                {currentClaims} / {maxClaims}
              </span>
              <span className="text-emerald-400 font-bold">
                (متبقي {remainingSpots} {remainingSpots === 1 ? 'مقعد فقط' : 'مقاعد فقط'})
              </span>
            </div>

            {/* Visual spots progress bar */}
            <div className="w-48 h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                style={{ width: `${Math.min(100, (currentClaims / maxClaims) * 100)}%` }}
              />
            </div>
          </div>

          {claimError && (
            <p className="text-xs text-rose-400 font-semibold mt-2">{claimError}</p>
          )}
          {claimSuccess && (
            <p className="text-xs text-emerald-400 font-semibold mt-2">{claimSuccess}</p>
          )}
        </div>

        {/* Right Side: CTA Button */}
        <div className="w-full lg:w-auto shrink-0 flex flex-col sm:flex-row items-center gap-3">
          {isFullyClaimed ? (
            <div className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 text-xs font-bold text-center">
              اكتمل عدد المستفيدين من عرض الإطلاق (10/10)
            </div>
          ) : (
            <button
              type="button"
              onClick={handleClaim}
              disabled={isClaiming}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-sm transition-all duration-200 shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 border border-amber-300"
            >
              <Gift className="w-4 h-4 fill-slate-950" />
              <span>{isClaiming ? 'جاري تفعيل العرض...' : 'المطالبة بالعرض المجاني الآن (30 يوماً)'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsSubscriptionModalOpen(true)}
            className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer text-center"
          >
            عرض الباقات والمقارنة
          </button>
        </div>
      </div>
    </div>
  );
};
