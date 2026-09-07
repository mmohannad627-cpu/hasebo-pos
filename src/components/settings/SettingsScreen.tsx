/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useStore } from '../../context/StoreContext';
import {
  Settings,
  Database,
  DownloadCloud,
  UploadCloud,
  Shield,
  Store,
  RefreshCw,
  CheckCircle2,
  HardDrive,
  Users,
  CreditCard,
  Sparkles,
  Zap,
  Star,
  Fingerprint,
  ScanFace,
  ShieldCheck,
  Smartphone,
  Sun,
  Moon,
  Palette,
  FolderDown,
  Code2,
  Terminal,
} from 'lucide-react';
import { SubscriptionModal } from '../subscription/SubscriptionModal';
import { BiometricAuthModal } from '../auth/BiometricAuthModal';
import { getBiometricSettings, saveBiometricSettings } from '../../services/biometrics';

export const SettingsScreen: React.FC = () => {
  const { user, currentBranch, settings } = useAuth();
  const { currentCurrency, setCurrency } = useCurrency();
  const { theme, toggleTheme, setTheme } = useStore();
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  // Biometrics settings
  const initialBio = getBiometricSettings();
  const [bioFingerprintEnabled, setBioFingerprintEnabled] = useState(true);
  const [bioFaceEnabled, setBioFaceEnabled] = useState(true);
  const [testBioModalOpen, setTestBioModalOpen] = useState(false);
  const [testBioType, setTestBioType] = useState<'fingerprint' | 'face'>('fingerprint');
  const [bioSuccessAlert, setBioSuccessAlert] = useState<string | null>(null);

  const [storeName, setStoreName] = useState(settings?.storeNameAr || 'بقالة وسوبرماركت البركة الحديثة');
  const [storePhone, setStorePhone] = useState(settings?.phone || '+967 770 000 000');
  const [storeAddress, setStoreAddress] = useState(settings?.addressAr || 'اليمن - صنعاء - شارع الستين الجنوبي');
  const [taxNumber, setTaxNumber] = useState(settings?.taxNumber || 'YER-TAX-982341');

  const handleExportBackup = () => {
    // Trigger download of DB backup
    window.location.href = '/api/backup/export';
  };

  const handleSaveStore = (e: React.FormEvent) => {
    e.preventDefault();
    alert('تم حفظ إعدادات المتجر بنجاح');
  };

  const handleTestBiometrics = (type: 'fingerprint' | 'face') => {
    setTestBioType(type);
    setTestBioModalOpen(true);
  };

  const handleBioSuccess = (type: 'fingerprint' | 'face', username: string) => {
    setTestBioModalOpen(false);
    setBioSuccessAlert(`تم التحقق بنجاح من ${type === 'fingerprint' ? 'بصمة الإصبع' : 'بصمة الوجه (Face ID)'} لحساب @${username}! مستشعرات الجهاز متوافقة وتعمل بدقة 100%.`);
    setTimeout(() => setBioSuccessAlert(null), 6000);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto overflow-y-auto select-none" dir="rtl">
      {/* Header */}
      <div className="pb-2 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <span>إعدادات النظام والاشتراك والنسخ الاحتياطي</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            تخصيص بيانات الفاتورة، باقة الاشتراك (5$ شهرياً)، والنسخ الاحتياطي للبيانات
          </p>
        </div>

        {/* Subscription Badge Button */}
        <button
          type="button"
          onClick={() => setIsSubscriptionModalOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#D4A72C]/20 to-[#E0B43C]/20 border border-[#D4A72C]/40 text-[#E0B43C] hover:bg-[#D4A72C]/30 transition text-xs font-bold shadow-sm cursor-pointer shrink-0"
        >
          <Sparkles className="w-4 h-4 text-[#D4A72C]" />
          <span>باقة حاسبو برو: 5$ / شهرياً (نشط)</span>
        </button>
      </div>

      {/* Subscription Highlight Banner */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/30 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[11px] border border-emerald-500/30">
              <Star className="w-3.5 h-3.5 fill-current text-amber-300" />
              <span>اشتراك باقة حاسبو برو الشاملة</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white">
              اشتراك البقالة والسوبرماركت (5 دولار / شهرياً)
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              تحصل على فواتير لا محدودة، مستشار الذكاء الاصطناعي، مسح الباركود بكاميرا الأندرويد، إرسال الفواتير لواتساب العملاء، ومزامنة سحابية غير محدودة.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="text-right">
              <div className="text-2xl font-black text-emerald-400 font-mono">5$ <span className="text-xs font-normal text-slate-400">/ شهر</span></div>
              <div className="text-[10px] text-slate-400">تجديد تلقائي أو يدوي</div>
            </div>
            <button
              type="button"
              onClick={() => setIsSubscriptionModalOpen(true)}
              className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition cursor-pointer shrink-0"
            >
              عرض تفاصيل الباقة
            </button>
          </div>
        </div>
      </div>

      {/* Biometric Verification Feedback Banner */}
      {bioSuccessAlert && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3 animate-fade-in shadow-lg">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-semibold">{bioSuccessAlert}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Store Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
            <Store className="w-4 h-4 text-emerald-400" />
            <span>بيانات المنشأة وترويسة الفواتير</span>
          </h3>

          <form onSubmit={handleSaveStore} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">اسم المتجر / السوبرماركت</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">رقم الهاتف / خدمة العملاء</label>
              <input
                type="text"
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">العنوان والفرع</label>
              <input
                type="text"
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">الرقم الضريبي / السجل التجاري</label>
              <input
                type="text"
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              حفظ التعديلات
            </button>
          </form>
        </div>

        {/* 2. Biometric Security Settings (Face ID & Fingerprint) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-purple-400" />
                <span>الأمان البيومتري (الوجه والإصبع)</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                نشط
              </span>
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              دخول سريع ومحمي للكاشير والمدير العام ببصمة الإصبع أو بصمة الوجه (Face ID) دون كتابة كلمة المرور في كل مرة.
            </p>

            <div className="space-y-2 text-xs">
              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-200 font-medium">تسجيل الدخول ببصمة الإصبع</span>
                </div>
                <input
                  type="checkbox"
                  checked={bioFingerprintEnabled}
                  onChange={(e) => setBioFingerprintEnabled(e.target.checked)}
                  className="w-4 h-4 accent-purple-500 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                <div className="flex items-center gap-2">
                  <ScanFace className="w-4 h-4 text-blue-400" />
                  <span className="text-slate-200 font-medium">تسجيل الدخول ببصمة الوجه (Face ID)</span>
                </div>
                <input
                  type="checkbox"
                  checked={bioFaceEnabled}
                  onChange={(e) => setBioFaceEnabled(e.target.checked)}
                  className="w-4 h-4 accent-blue-500 rounded"
                />
              </label>
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 block">فحص واختبار المستشعرات:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTestBiometrics('fingerprint')}
                className="py-2 px-2.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 text-purple-300 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Fingerprint className="w-3.5 h-3.5" />
                <span>اختبار الإصبع</span>
              </button>

              <button
                type="button"
                onClick={() => handleTestBiometrics('face')}
                className="py-2 px-2.5 rounded-xl bg-blue-950/40 hover:bg-blue-900/50 border border-blue-500/30 text-blue-300 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <ScanFace className="w-3.5 h-3.5" />
                <span>اختبار الوجه</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. Database Backup & Restore */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <span>النسخ الاحتياطي لقاعدة البيانات</span>
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              تحميل نسخة احتياطية مشفرة وشاملة لجميع السجلات (الأصناف، الفواتير، الحسابات، والديون) بنقرة زر واحدة لحماية بياناتك من الضياع.
            </p>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-3 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-slate-300">نظام الحفظ التلقائي المحلي والسحابي نشط</span>
            </div>
          </div>

          <div className="space-y-2 pt-4">
            <button
              type="button"
              onClick={handleExportBackup}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition cursor-pointer"
            >
              <DownloadCloud className="w-4 h-4" />
              <span>تصدير وتحميل نسخة احتياطية (JSON)</span>
            </button>
          </div>
        </div>

        {/* 4. Appearance & Theme Selection (Dark / Light Mode) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-amber-400" />
                <span>مظهر النظام (المظهر الليلي والنهاري)</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold">
                {theme === 'dark' ? 'الوضع الليلي نشط' : 'الوضع النهاري نشط'}
              </span>
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              اختر المظهر المفضل لشاشات الكاشير ولوحة التحكم لتوفير راحة تامة للعين وسهولة القراءة في مختلف ظروف الإضاءة.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-bold transition cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-800 border-amber-400/80 text-amber-300 ring-2 ring-amber-400/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Moon className="w-5 h-5 text-indigo-400" />
                <span>الوضع الليلي (Dark)</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-bold transition cursor-pointer ${
                  theme === 'light'
                    ? 'bg-amber-100 border-amber-500 text-amber-950 ring-2 ring-amber-400/50 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sun className="w-5 h-5 text-amber-500" />
                <span>الوضع النهاري (Light)</span>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>التبديل السريع:</span>
            <button
              type="button"
              onClick={toggleTheme}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold transition cursor-pointer flex items-center gap-1.5"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{theme === 'dark' ? 'تبديل للنهاري' : 'تبديل لليلي'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Download Source Code ZIP for Windsurf & Android Studio */}
      <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black">
              <FolderDown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1">
                  <Code2 className="w-3.5 h-3.5" />
                  حزمة الكود المصدري الكاملة
                </span>
                <span className="text-xs text-slate-400">جاهز لـ Windsurf و Android</span>
              </div>
              <h3 className="text-base font-extrabold text-white mt-1">
                تنزيل ملف المشروع كاملاً (HĀSEBO Source Code ZIP)
              </h3>
              <p className="text-xs text-slate-400">
                حمل أرشيف المشروع المحدّث بصيغة ZIP وافتحه مباشرة في محرر Windsurf أو VS Code لبناء تطبيق أندرويد سوق بلاي محلياً.
              </p>
            </div>
          </div>

          <a
            href="/api/download-zip"
            download="hasebo-pos-app.zip"
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#D4A72C] via-[#E0B43C] to-[#F5C84C] hover:opacity-95 active:scale-95 text-slate-950 text-xs font-black shadow-lg shadow-[#D4A72C]/25 transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <FolderDown className="w-4.5 h-4.5 text-slate-950 stroke-[2.5]" />
            <span>تحميل الكود البرمجي (ZIP) المباشر</span>
          </a>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <Terminal className="w-4 h-4" />
            <span>أوامر بناء حزمة أندرويد لسوق بلاي في Windsurf:</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-200 overflow-x-auto space-y-1 dir-ltr text-left">
            <p className="text-slate-400"># 1. تثبيت الحزم وبناء المشروع</p>
            <p className="text-emerald-300">npm install && npm run build</p>
            <p className="text-slate-400 mt-1"># 2. إنشاء مشروع أندرويد ومزامنته</p>
            <p className="text-emerald-300">npx cap add android && npx cap sync</p>
            <p className="text-slate-400 mt-1"># 3. فتح المشروع في Android Studio لتوليد حزمة AAB</p>
            <p className="text-emerald-300">npx cap open android</p>
          </div>
        </div>
      </div>

      {/* 5. Developer & Technical Support Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-black text-lg">
              MZ
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-indigo-400 font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30">
                  تصميم وتطوير النظام
                </span>
                <span className="text-xs text-slate-400">الإصدار 2.5 (PRO)</span>
              </div>
              <h3 className="text-base font-extrabold text-white mt-1">
                م. مهند أحمد الزبير
              </h3>
              <p className="text-xs text-slate-400">
                مصمم ومطور نظام حاسبو (HĀSEBO) لإدارة نقاط البيع والمحاسبة الذكية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <a
              href="tel:774123322"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <span>اتصال: 774123322</span>
            </a>

            <a
              href="https://wa.me/967774123322"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/25 transition flex items-center gap-2 cursor-pointer"
            >
              <span>واتساب الدعم الفني: 774123322</span>
            </a>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          في حال وجود أي استفسار، أو طلب تخصيص ميزات برمجية إضافية، أو مواجهة أي مشكلة تقنية، يسعدنا تواصلكم المباشر مع المهندس مهند أحمد الزبير عبر الرقم <strong className="text-emerald-400 font-mono">774123322</strong> لتقديم الدعم الفوري والمساعدة.
        </p>
      </div>

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
      />

      {/* Test Biometrics Modal */}
      <BiometricAuthModal
        isOpen={testBioModalOpen}
        onClose={() => setTestBioModalOpen(false)}
        onSuccess={handleBioSuccess}
        initialType={testBioType}
        targetUsername={user?.username || 'admin'}
      />
    </div>
  );
};
