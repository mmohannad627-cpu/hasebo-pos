/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { api } from '../../services/api';
import { useCurrency } from '../../context/CurrencyContext';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import {
  Coins,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Receipt,
  Plus,
} from 'lucide-react';

export const CashManagementScreen: React.FC = () => {
  const { formatMoney } = useCurrency();
  const { activeCashSession, refreshCashSession } = useStore();
  const { can } = useAuth();

  const [openingCash, setOpeningCash] = useState<number>(10000);
  const [openingNotes, setOpeningNotes] = useState('');
  const [actualClosingCash, setActualClosingCash] = useState<number>(0);
  const [closingNotes, setClosingNotes] = useState('');
  const [showCloseModal, setShowCloseModal] = useState(false);

  const handleOpenSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.openCashSession({ openingCash, openingNotes });
      await refreshCashSession();
      alert('تم فتح وردية الصندوق بنجاح');
    } catch (err: any) {
      alert(err.message || 'فشل فتح الوردية');
    }
  };

  const handleCloseSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCashSession) return;

    try {
      await api.closeCashSession({
        sessionId: activeCashSession.id,
        closingCashActual: actualClosingCash,
        closingNotes,
      });
      setShowCloseModal(false);
      await refreshCashSession();
      alert('تم إغلاق وردية الصندوق بنجاح وتسجيل مطابقة الرصيد');
    } catch (err: any) {
      alert(err.message || 'فشل إغلاق الوردية');
    }
  };

  const expectedBalance = activeCashSession
    ? activeCashSession.openingCash +
      activeCashSession.cashSalesTotal +
      activeCashSession.customerCashPaymentsTotal +
      activeCashSession.cashDepositsTotal -
      activeCashSession.cashRefundsTotal -
      activeCashSession.supplierCashPaymentsTotal -
      activeCashSession.cashExpensesTotal -
      activeCashSession.cashWithdrawalsTotal
    : 0;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto overflow-y-auto select-none" dir="rtl">
      <div className="pb-2 border-b border-slate-800">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Coins className="w-5 h-5 text-emerald-400" />
          <span>إدارة الصندوق النقدي والورديات اليومية</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          فتح وإغلاق وردية الكاشير، تدقيق المبيعات النقدية والمصروفات ومطابقة العجز والزيادة
        </p>
      </div>

      {activeCashSession ? (
        /* ACTIVE SESSION CARD */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-base font-bold text-white">
                  الوردية الحالية: {activeCashSession.sessionNumber}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                الكاشير المسؤول: <strong className="text-slate-200">{activeCashSession.userName}</strong> • تم الفتح:{' '}
                {new Date(activeCashSession.openedAt).toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {can('cash_register.manage') && (
              <button
                type="button"
                onClick={() => {
                  setActualClosingCash(expectedBalance);
                  setShowCloseModal(true);
                }}
                className="px-5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>إغلاق الوردية وتسليم الصندوق</span>
              </button>
            )}
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">الرصيد الافتتاحي (عهدة):</span>
              <span className="text-sm font-bold text-white font-mono">{formatMoney(activeCashSession.openingCash)}</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">مبيعات كاش نقدية (+):</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">{formatMoney(activeCashSession.cashSalesTotal)}</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">مصروفات نقدية (-):</span>
              <span className="text-sm font-bold text-amber-400 font-mono">{formatMoney(activeCashSession.cashExpensesTotal)}</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">مرتجعات مبيعات (-):</span>
              <span className="text-sm font-bold text-rose-400 font-mono">{formatMoney(activeCashSession.cashRefundsTotal)}</span>
            </div>
          </div>

          {/* Big Expected Balance Banner */}
          <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-400 block">الرصيد الدفتري المتوقع بالدرج الآن:</span>
              <span className="text-2xl font-black text-white font-mono mt-1 block">{formatMoney(expectedBalance)}</span>
            </div>
            <Coins className="w-8 h-8 text-emerald-400/50" />
          </div>
        </div>
      ) : (
        /* NO ACTIVE SESSION: OPEN SESSION FORM */
        <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="text-center pb-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <Unlock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">فتح وردية كاشير جديدة</h3>
            <p className="text-xs text-slate-400 mt-1">أدخل رصيد العهدة النقدية الافتتاحية لبدء عمليات البيع</p>
          </div>

          <form onSubmit={handleOpenSession} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">الرصيد الافتتاحي بالدرج (ريال) *</label>
              <input
                type="number"
                required
                value={openingCash}
                onChange={(e) => setOpeningCash(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold text-base focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">ملاحظات افتتاح الوردية</label>
              <input
                type="text"
                value={openingNotes}
                onChange={(e) => setOpeningNotes(e.target.value)}
                placeholder="مثال: فكة صباحية 10,000 ريال"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              فتح الوردية وبدء العمل
            </button>
          </form>
        </div>
      )}

      {/* CLOSE SESSION MODAL */}
      {showCloseModal && activeCashSession && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white">إغلاق وردية الكاشير وتدقيق الصندوق</h3>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 font-mono">
              <div className="flex justify-between text-slate-400">
                <span>المبلغ المتوقع بالصندوق:</span>
                <span className="font-bold text-white">{formatMoney(expectedBalance)}</span>
              </div>
            </div>

            <form onSubmit={handleCloseSession} className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">المبلغ الفعلي المحصي نقداً بالدرج *</label>
                <input
                  type="number"
                  required
                  value={actualClosingCash}
                  onChange={(e) => setActualClosingCash(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold text-base focus:outline-none focus:border-emerald-500"
                />
              </div>

              {actualClosingCash !== expectedBalance && (
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between font-mono font-bold">
                  <span className="text-slate-400">الفارق:</span>
                  <span className={actualClosingCash > expectedBalance ? 'text-emerald-400' : 'text-rose-400'}>
                    {actualClosingCash > expectedBalance
                      ? `+${formatMoney(actualClosingCash - expectedBalance)} (زيادة)`
                      : `-${formatMoney(expectedBalance - actualClosingCash)} (عجز)`}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">ملاحظات الإغلاق والتسليم</label>
                <input
                  type="text"
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="مثال: تم تسليم الصندوق للمدير سليم"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold"
                >
                  تأكيد الإغلاق والترحيل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
