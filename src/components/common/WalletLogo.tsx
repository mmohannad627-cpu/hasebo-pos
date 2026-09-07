/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export type WalletType = 'jeeb' | 'kuraimi' | 'jawali' | 'floosak' | 'onecash' | 'mobilemoney';

interface WalletLogoProps {
  type: WalletType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const WalletLogo: React.FC<WalletLogoProps> = ({
  type,
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-9 h-9 text-xs',
    lg: 'w-12 h-12 text-sm',
  };

  const getWalletInfo = () => {
    switch (type) {
      case 'jeeb':
        return {
          name: 'محفظة جيب',
          sub: 'Jeeb Wallet',
          bgColor: 'bg-gradient-to-br from-purple-700 via-indigo-700 to-amber-600',
          borderColor: 'border-purple-400/40',
          textColor: 'text-purple-300',
          renderLogo: () => (
            <svg viewBox="0 0 48 48" fill="none" className="w-full h-full p-1" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="12" fill="#581c87" />
              {/* Jeeb wallet stylized shape */}
              <path d="M10 16C10 13.7909 11.7909 12 14 12H34C36.2091 12 38 13.7909 38 16V32C38 34.2091 36.2091 36 34 36H14C11.7909 36 10 34.2091 10 32V16Z" fill="#7e22ce" stroke="#f59e0b" strokeWidth="2" />
              <path d="M10 21H38" stroke="#a855f7" strokeWidth="2" strokeDasharray="2 2" />
              {/* Pocket / Jeeb J-flair */}
              <circle cx="30" cy="26" r="4" fill="#f59e0b" />
              <path d="M18 20L22 28L26 20" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
        };
      case 'kuraimi':
        return {
          name: 'الكريمي إكسبرس',
          sub: 'Kuraimi Express',
          bgColor: 'bg-gradient-to-br from-teal-700 via-emerald-800 to-cyan-900',
          borderColor: 'border-teal-400/40',
          textColor: 'text-teal-300',
          renderLogo: () => (
            <svg viewBox="0 0 48 48" fill="none" className="w-full h-full p-1" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="12" fill="#064e3b" />
              {/* Kuraimi green shield star */}
              <path d="M24 8L36 14V24C36 31.5 24 38 24 38C24 38 12 31.5 12 24V14L24 8Z" fill="#047857" stroke="#10b981" strokeWidth="2" />
              <path d="M24 16V30M17 23H31" stroke="#fef08a" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="24" cy="23" r="3" fill="#34d399" />
            </svg>
          ),
        };
      case 'jawali':
        return {
          name: 'محفظة جوالي',
          sub: 'Jawali WeNet',
          bgColor: 'bg-gradient-to-br from-emerald-700 to-green-900',
          borderColor: 'border-emerald-400/40',
          textColor: 'text-emerald-300',
          renderLogo: () => (
            <svg viewBox="0 0 48 48" fill="none" className="w-full h-full p-1" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="12" fill="#065f46" />
              {/* Phone/Signal Jawali shape */}
              <rect x="14" y="10" width="20" height="28" rx="4" fill="#047857" stroke="#34d399" strokeWidth="2" />
              <path d="M22 34H26" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
              <path d="M20 18C22 16 26 16 28 18M18 22C21 19 27 19 30 22" stroke="#a7f3d0" strokeWidth="2" strokeLinecap="round" />
              <circle cx="24" cy="26" r="2" fill="#fbbf24" />
            </svg>
          ),
        };
      case 'floosak':
        return {
          name: 'محفظة فلوسك',
          sub: 'Floosak',
          bgColor: 'bg-gradient-to-br from-blue-800 via-indigo-900 to-cyan-900',
          borderColor: 'border-blue-400/40',
          textColor: 'text-blue-300',
          renderLogo: () => (
            <svg viewBox="0 0 48 48" fill="none" className="w-full h-full p-1" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="12" fill="#1e3a8a" />
              {/* Floosak coins wave */}
              <circle cx="20" cy="24" r="9" fill="#1d4ed8" stroke="#60a5fa" strokeWidth="2" />
              <circle cx="28" cy="24" r="9" fill="#2563eb" stroke="#fbbf24" strokeWidth="2" />
              <path d="M26 19V29M23 21H30" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ),
        };
      case 'onecash':
        return {
          name: 'محفظة ون كاش',
          sub: 'OneCash',
          bgColor: 'bg-gradient-to-br from-red-700 via-rose-800 to-orange-700',
          borderColor: 'border-rose-400/40',
          textColor: 'text-rose-300',
          renderLogo: () => (
            <svg viewBox="0 0 48 48" fill="none" className="w-full h-full p-1" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="12" fill="#991b1b" />
              {/* One Cash stylized 1 with circle */}
              <circle cx="24" cy="24" r="14" fill="#b91c1c" stroke="#fb923c" strokeWidth="2" />
              <path d="M21 18L24 15V32M21 32H27" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
        };
      case 'mobilemoney':
      default:
        return {
          name: 'موبايل موني / كاك',
          sub: 'CAC Mobile Money',
          bgColor: 'bg-gradient-to-br from-emerald-800 via-teal-900 to-yellow-900',
          borderColor: 'border-emerald-400/40',
          textColor: 'text-emerald-300',
          renderLogo: () => (
            <svg viewBox="0 0 48 48" fill="none" className="w-full h-full p-1" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="12" fill="#14532d" />
              <circle cx="24" cy="24" r="13" fill="#15803d" stroke="#eab308" strokeWidth="2" />
              <path d="M16 28L24 16L32 28M20 25H28" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
        };
    }
  };

  const wallet = getWalletInfo();

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div
        className={`${sizeClasses[size]} shrink-0 rounded-xl overflow-hidden shadow-md border ${wallet.borderColor} flex items-center justify-center`}
      >
        {wallet.renderLogo()}
      </div>
      {showLabel && (
        <div className="text-right">
          <div className="font-bold text-xs text-white leading-tight">{wallet.name}</div>
          <div className="text-[10px] text-slate-400">{wallet.sub}</div>
        </div>
      )}
    </div>
  );
};
