/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Delete, Check, X } from 'lucide-react';

interface AndroidNumpadProps {
  value: string;
  onChange: (val: string) => void;
  onConfirm?: () => void;
  onClose?: () => void;
  title?: string;
  unit?: string;
}

export const AndroidNumpad: React.FC<AndroidNumpadProps> = ({
  value,
  onChange,
  onConfirm,
  onClose,
  title = 'لوحة الأرقام السريعة',
  unit,
}) => {
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(40);
      } catch (e) {}
    }
  };

  const handleDigit = (digit: string) => {
    triggerHaptic();
    if (value === '0' && digit !== '.') {
      onChange(digit);
    } else {
      onChange(value + digit);
    }
  };

  const handleBackspace = () => {
    triggerHaptic();
    if (value.length <= 1) {
      onChange('');
    } else {
      onChange(value.slice(0, -1));
    }
  };

  const handleClear = () => {
    triggerHaptic();
    onChange('');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl flex flex-col gap-3 select-none" dir="rtl">
      {/* Numpad Header & Display */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <span className="text-xs font-bold text-slate-300">{title}</span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Screen Value */}
      <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between text-left">
        <span className="text-xs text-slate-500 font-medium">{unit}</span>
        <span className="text-2xl font-black font-mono text-emerald-400 tracking-wider">
          {value || '0'}
        </span>
      </div>

      {/* Grid of keys */}
      <div className="grid grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
          <button
            key={d}
            type="button"
            onClick={() => handleDigit(d)}
            className="h-13 bg-slate-800/80 hover:bg-slate-750 active:bg-emerald-600/30 active:scale-95 border border-slate-700/60 rounded-2xl text-xl font-bold font-mono text-slate-100 transition cursor-pointer flex items-center justify-center shadow-sm"
          >
            {d}
          </button>
        ))}

        {/* Bottom row: ., 0, 00, Clear, Backspace */}
        <button
          type="button"
          onClick={() => handleDigit('.')}
          className="h-13 bg-slate-800/80 hover:bg-slate-750 active:scale-95 border border-slate-700/60 rounded-2xl text-xl font-bold font-mono text-slate-200 transition cursor-pointer flex items-center justify-center"
        >
          .
        </button>

        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="h-13 bg-slate-800/80 hover:bg-slate-750 active:scale-95 border border-slate-700/60 rounded-2xl text-xl font-bold font-mono text-slate-100 transition cursor-pointer flex items-center justify-center"
        >
          0
        </button>

        <button
          type="button"
          onClick={handleBackspace}
          className="h-13 bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 border border-rose-500/30 rounded-2xl text-rose-400 transition cursor-pointer flex items-center justify-center"
        >
          <Delete className="w-5 h-5" />
        </button>
      </div>

      {/* Action Row */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={handleClear}
          className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 active:scale-95 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 transition cursor-pointer"
        >
          مسح (C)
        </button>

        {onConfirm && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic();
              onConfirm();
            }}
            className="flex-2 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
          >
            <Check className="w-4 h-4" />
            <span>تأكيد القيمة</span>
          </button>
        )}
      </div>
    </div>
  );
};
