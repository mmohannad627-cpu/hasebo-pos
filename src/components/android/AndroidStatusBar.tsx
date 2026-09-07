/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Sparkles, Smartphone, Scan, QrCode, Signal } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';

interface AndroidStatusBarProps {
  onOpenScanner?: () => void;
}

export const AndroidStatusBar: React.FC<AndroidStatusBarProps> = ({ onOpenScanner }) => {
  const [time, setTime] = useState<string>('');
  const [batteryLevel, setBatteryLevel] = useState<number>(92);
  const { isOnline } = useStore();
  const { currentBranch } = useAuth();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('ar-SA', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);

    // Try to get real device battery if available on Android Chrome
    if ('getBattery' in navigator) {
      (navigator as any).getBattery?.().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      }).catch(() => {});
    }

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-slate-950/90 backdrop-blur border-b border-slate-800/80 px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-300 select-none z-20">
      {/* Left: Time & Signal */}
      <div className="flex items-center gap-2">
        <span className="font-mono font-bold text-slate-100">{time || '12:00 م'}</span>
        <div className="flex items-center gap-0.5 text-emerald-400">
          <Signal className="w-3.5 h-3.5" />
          <span className="text-[9px] font-mono font-semibold">5G</span>
        </div>
      </div>

      {/* Center: Android Badge */}
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
        <Smartphone className="w-3 h-3" />
        <span>تطبيق أندرويد الذكي</span>
      </div>

      {/* Right: WiFi, Battery & Quick Scanner */}
      <div className="flex items-center gap-2.5">
        {onOpenScanner && (
          <button
            type="button"
            onClick={onOpenScanner}
            className="p-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition flex items-center gap-1 text-[10px] font-bold cursor-pointer"
            title="فتح كاميرا مسح الباركود"
          >
            <Scan className="w-3 h-3" />
            <span className="hidden sm:inline">مسح</span>
          </button>
        )}

        <div className="flex items-center gap-1">
          {isOnline ? (
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <span className="text-[9px] text-rose-400 font-bold">أوفلاين</span>
          )}
          <div className="flex items-center gap-0.5 text-slate-200">
            <span className="font-mono text-[10px]">{batteryLevel}%</span>
            <BatteryMedium className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>
      </div>
    </div>
  );
};
