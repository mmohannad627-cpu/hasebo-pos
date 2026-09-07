/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Star, Sparkles, Tag, ArrowRight, ShieldCheck } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const EarlyCustomerOfferBanner: React.FC = () => {
  const { subscriptionState, setIsSubscriptionModalOpen } = useStore();

  const campaign = subscriptionState?.campaigns?.find(c => c.id === 'EARLY_CUSTOMER_50');
  if (!campaign || !campaign.isActive) {
    return null;
  }

  const maxClaims = campaign.maxClaims || 50;
  const currentClaims = campaign.currentClaims || 0;
  const remaining = Math.max(0, maxClaims - currentClaims);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950/80 via-indigo-950/70 to-slate-900 border-2 border-purple-500/40 p-4 sm:p-5 shadow-lg shadow-purple-500/10 mb-6 text-right select-none">
      <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md shadow-purple-500/20">
              <Star className="w-3.5 h-3.5 fill-white" />
              <span>عرض العملاء الأوائل (Early Customers)</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              خصم 50% على الباقة السنوية
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-white">
            باقة حاسبو برو (HĀSEBO PRO) السنوية بقيمة $25 فقط بدلاً من $50 لأول 50 متجر!
          </h3>

          <p className="text-xs text-slate-300">
            احصل على عام كامل من الميزات اللامحدودة ومستشار الذكاء الاصطناعي بنصف السعر. متبقي {remaining} مقعد من أصل {maxClaims}.
          </p>
        </div>

        <div className="w-full md:w-auto shrink-0 flex items-center gap-3 justify-end">
          <button
            type="button"
            onClick={() => setIsSubscriptionModalOpen(true)}
            className="w-full md:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs transition cursor-pointer shadow-md shadow-purple-500/20 flex items-center justify-center gap-2"
          >
            <Tag className="w-4 h-4" />
            <span>الاشتراك بخصم 50% ($25/سنة)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
