/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, User as UserIcon, ShieldCheck, ArrowLeft, Fingerprint, ScanFace } from 'lucide-react';
import { BiometricAuthModal } from './BiometricAuthModal';
import { HaseboLogo } from '../brand/HaseboLogo';

export const LoginScreen: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Biometric state
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState<boolean>(false);
  const [biometricType, setBiometricType] = useState<'fingerprint' | 'face'>('fingerprint');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login({ username, password });
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول');
    }
  };

  const setDemoUser = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError(null);
  };

  const handleOpenBiometrics = (type: 'fingerprint' | 'face') => {
    setBiometricType(type);
    setIsBiometricModalOpen(true);
  };

  const handleBiometricSuccess = async (type: 'fingerprint' | 'face', authUser: string) => {
    setIsBiometricModalOpen(false);
    setError(null);
    try {
      // Auto authenticate using matching account password
      const pass = authUser === 'admin' ? 'admin123' : authUser === 'manager' ? 'manager123' : 'cashier123';
      await login({ username: authUser, password: pass });
    } catch (err: any) {
      setError(err.message || 'فشل المصادقة البيومترية');
    }
  };

  return (
    <div className="min-h-screen bg-[#07111F] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden" dir="rtl">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#D4A72C]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#0B1424] rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Official Brand Header */}
        <div className="text-center mb-6">
          <HaseboLogo variant="primary" size="lg" withContainer showTagline showEnglishTagline />
        </div>

        {/* Login Card */}
        <div className="bg-[#0B1424]/90 backdrop-blur-xl border border-[#D4A72C]/25 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/60">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-slate-100">تسجيل الدخول للمنظومة</h2>
            <span className="text-xs px-2.5 py-1 rounded-full bg-[#D4A72C]/10 text-[#E0B43C] border border-[#D4A72C]/30 font-bold">
              نظام محمي ومشفر
            </span>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                اسم المستخدم / الحساب
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="مثال: admin"
                  className="w-full pr-10 pl-4 py-2.5 bg-[#07111F] border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D4A72C]/50 focus:border-[#D4A72C] text-sm transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                كلمة المرور السرية
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pr-10 pl-4 py-2.5 bg-[#07111F] border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D4A72C]/50 focus:border-[#D4A72C] text-sm transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-[#D4A72C] to-[#E0B43C] hover:from-[#E0B43C] hover:to-[#F5C84C] text-slate-950 font-extrabold rounded-xl shadow-lg shadow-[#D4A72C]/20 hover:shadow-[#D4A72C]/35 transition active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <span className="inline-block w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              ) : (
                <>
                  <span>دخول للنظام</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Biometrics Authentication Bar */}
          <div className="mt-5 pt-4 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">تسجيل الدخول السريع بالبصمة:</span>
              <span className="text-[10px] text-[#E0B43C] font-bold bg-[#D4A72C]/10 px-2 py-0.5 rounded-full border border-[#D4A72C]/20">
                مدعوم
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleOpenBiometrics('fingerprint')}
                className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-2 shadow-sm hover:border-slate-500 cursor-pointer active:scale-95"
              >
                <Fingerprint className="w-4 h-4 text-emerald-400" />
                <span>بصمة الإصبع</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenBiometrics('face')}
                className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-2 shadow-sm hover:border-slate-500 cursor-pointer active:scale-95"
              >
                <ScanFace className="w-4 h-4 text-emerald-400" />
                <span>بصمة الوجه</span>
              </button>
            </div>
          </div>

          {/* Quick Demo Role Switcher for seamless review */}
          <div className="mt-5 pt-4 border-t border-slate-800">
            <p className="text-xs text-slate-400 mb-2.5 font-medium text-center">
              أدوار تجريبية جاهزة للاختبار الفوري:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDemoUser('admin', 'admin123')}
                className={`px-2.5 py-2 rounded-lg text-xs font-medium border transition text-center ${
                  username === 'admin'
                    ? 'bg-[#D4A72C]/20 border-[#D4A72C] text-[#E0B43C] font-bold'
                    : 'bg-[#07111F] border-slate-800 hover:bg-slate-800/60 text-slate-300'
                }`}
              >
                المدير العام
              </button>
              <button
                type="button"
                onClick={() => setDemoUser('manager', 'manager123')}
                className={`px-2.5 py-2 rounded-lg text-xs font-medium border transition text-center ${
                  username === 'manager'
                    ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                    : 'bg-[#07111F] border-slate-800 hover:bg-slate-800/60 text-slate-300'
                }`}
              >
                مدير الفرع
              </button>
              <button
                type="button"
                onClick={() => setDemoUser('cashier', 'cashier123')}
                className={`px-2.5 py-2 rounded-lg text-xs font-medium border transition text-center ${
                  username === 'cashier'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-[#07111F] border-slate-800 hover:bg-slate-800/60 text-slate-300'
                }`}
              >
                الكاشير
              </button>
            </div>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-[#D4A72C]" />
          <span>منظومة حاسبو • تشفير عالي الأمان وبصمة بيومترية</span>
        </div>
      </div>

      {/* Biometric Scan Modal */}
      <BiometricAuthModal
        isOpen={isBiometricModalOpen}
        onClose={() => setIsBiometricModalOpen(false)}
        onSuccess={handleBiometricSuccess}
        initialType={biometricType}
        targetUsername={username}
      />
    </div>
  );
};

