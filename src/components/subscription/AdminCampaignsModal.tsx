/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Settings2,
  X,
  Save,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Star,
  DollarSign,
  Calendar,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { api } from '../../services/api';
import type { LaunchCampaign, PlanConfig } from '../../types';

interface AdminCampaignsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminCampaignsModal: React.FC<AdminCampaignsModalProps> = ({ isOpen, onClose }) => {
  const { subscriptionState, refreshSubscription } = useStore();
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Editable local state for campaigns
  const launchCampaign = subscriptionState?.campaigns?.find(c => c.id === 'LAUNCH_10_STORES');
  const earlyCustomerCampaign = subscriptionState?.campaigns?.find(c => c.id === 'EARLY_CUSTOMER_50');

  const [launchIsActive, setLaunchIsActive] = useState(launchCampaign?.isActive ?? true);
  const [launchMaxClaims, setLaunchMaxClaims] = useState(launchCampaign?.maxClaims ?? 10);
  const [launchTrialDays, setLaunchTrialDays] = useState(launchCampaign?.trialDays ?? 30);

  const [earlyIsActive, setEarlyIsActive] = useState(earlyCustomerCampaign?.isActive ?? false);
  const [earlyMaxClaims, setEarlyMaxClaims] = useState(earlyCustomerCampaign?.maxClaims ?? 50);
  const [earlyDiscount, setEarlyDiscount] = useState(earlyCustomerCampaign?.discountPercentage ?? 50);

  // Editable local state for plan prices
  const [proMonthlyPrice, setProMonthlyPrice] = useState(
    subscriptionState?.plans?.find(p => p.id === 'PRO_MONTHLY')?.priceUSD ?? 5
  );
  const [proYearlyPrice, setProYearlyPrice] = useState(
    subscriptionState?.plans?.find(p => p.id === 'PRO_YEARLY')?.priceUSD ?? 50
  );

  if (!isOpen) return null;

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      // 1. Update Launch Campaign
      if (launchCampaign) {
        await api.updateCampaignAdmin('LAUNCH_10_STORES', {
          isActive: launchIsActive,
          maxClaims: Number(launchMaxClaims),
          trialDays: Number(launchTrialDays),
        });
      }

      // 2. Update Early Customer Campaign
      if (earlyCustomerCampaign) {
        await api.updateCampaignAdmin('EARLY_CUSTOMER_50', {
          isActive: earlyIsActive,
          maxClaims: Number(earlyMaxClaims),
          discountPercentage: Number(earlyDiscount),
        });
      }

      // 3. Update Plan Prices
      await api.updatePlanPriceAdmin('PRO_MONTHLY', Number(proMonthlyPrice));
      await api.updatePlanPriceAdmin('PRO_YEARLY', Number(proYearlyPrice));

      await refreshSubscription();
      setMessage({ type: 'success', text: 'تم حفظ وتحديث إعدادات الباقات والحملات الترويجية بنجاح!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'تعذر حفظ الإعدادات' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto select-none">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-auto text-right">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">لوحة تحكم إدارة الاشتراكات والحملات</h3>
              <p className="text-xs text-slate-400">تعديل أسعار الباقات، عروض التدشين، والحملات التسويقية</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {message && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{message.text}</span>
            </div>
          )}

          {/* Section 1: Plan Base Pricing */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>الأسعار الأساسية للباقات (بالدولار الأمريكي USD)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2">
                <label className="text-xs text-slate-300 font-semibold block">سعر باقة حاسبو برو الشهري ($):</label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={proMonthlyPrice}
                    onChange={e => setProMonthlyPrice(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-sm focus:border-emerald-500 outline-none"
                  />
                  <span className="text-xs text-slate-400 shrink-0">/ شهرياً</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2">
                <label className="text-xs text-slate-300 font-semibold block">سعر باقة حاسبو برو السنوي ($):</label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={proYearlyPrice}
                    onChange={e => setProYearlyPrice(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-sm focus:border-emerald-500 outline-none"
                  />
                  <span className="text-xs text-slate-400 shrink-0">/ سنوياً</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Launch Offer (10 Stores 30-Day Free Trial) */}
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>عرض التدشين (أول 10 متاجر - 30 يوماً مجاناً)</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-slate-300">تفعيل العرض</span>
                <input
                  type="checkbox"
                  checked={launchIsActive}
                  onChange={e => setLaunchIsActive(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">الحد الأقصى للمتاجر المستفيدة:</label>
                <input
                  type="number"
                  min="1"
                  value={launchMaxClaims}
                  onChange={e => setLaunchMaxClaims(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">مدة التجربة المجانية (أيام):</label>
                <input
                  type="number"
                  min="1"
                  value={launchTrialDays}
                  onChange={e => setLaunchTrialDays(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs outline-none"
                />
              </div>
            </div>

            <div className="text-[11px] text-amber-200/80 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              المتاجر التي استفادت حتى الآن: <span className="font-mono font-bold text-white">{launchCampaign?.currentClaims ?? 0}</span> متجر من أصل {launchMaxClaims}.
            </div>
          </div>

          {/* Section 3: Early Customer Offer (50% Off Yearly for First 50 Stores) */}
          <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                <Star className="w-4 h-4 text-purple-400" />
                <span>عرض العملاء الأوائل (خصم 50% على الباقة السنوية)</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-slate-300">تفعيل العرض</span>
                <input
                  type="checkbox"
                  checked={earlyIsActive}
                  onChange={e => setEarlyIsActive(e.target.checked)}
                  className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">الحد الأقصى للمتاجر (أول X متجر):</label>
                <input
                  type="number"
                  min="1"
                  value={earlyMaxClaims}
                  onChange={e => setEarlyMaxClaims(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">نسبة الخصم (%):</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={earlyDiscount}
                  onChange={e => setEarlyDiscount(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs outline-none"
                />
              </div>
            </div>

            <div className="text-[11px] text-purple-200/80 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              السعر المخفض الناتج: <span className="font-mono font-bold text-white">${Math.round(proYearlyPrice * (1 - earlyDiscount / 100))}/سنوياً</span> بدلاً من ${proYearlyPrice}.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-850 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
