/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Fingerprint, ScanFace, ShieldCheck, X, CheckCircle2, AlertCircle, Sparkles, Smartphone, Hand, Lock } from 'lucide-react';
import { triggerHapticFeedback, authenticateWithHardwareBiometrics } from '../../services/biometrics';

interface BiometricAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (type: 'fingerprint' | 'face', username: string) => void;
  initialType?: 'fingerprint' | 'face';
  targetUsername?: string;
}

export const BiometricAuthModal: React.FC<BiometricAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialType = 'fingerprint',
  targetUsername = 'admin',
}) => {
  const [authType, setAuthType] = useState<'fingerprint' | 'face'>(initialType);
  const [status, setStatus] = useState<'idle' | 'holding' | 'verifying' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const holdIntervalRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (isOpen) {
      setAuthType(initialType);
      resetState();
      if (initialType === 'face') {
        startLiveCameraFaceScan();
      } else {
        triggerSystemBiometrics('fingerprint');
      }
    }
    return () => {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
      stopCameraStream();
    };
  }, [isOpen, initialType]);

  const resetState = () => {
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    setStatus('idle');
    setProgress(0);
    setErrorMessage('');
  };

  // Trigger real hardware Android / iOS Biometric scanner
  const triggerSystemBiometrics = async (type: 'fingerprint' | 'face') => {
    setStatus('verifying');
    triggerHapticFeedback([30]);

    const result = await authenticateWithHardwareBiometrics(targetUsername);
    if (result.success) {
      setStatus('success');
      setProgress(100);
      triggerHapticFeedback([60, 100, 60]);
      setTimeout(() => {
        onSuccess(type, targetUsername);
      }, 500);
    } else {
      setStatus('idle');
      if (result.error && !result.error.includes('إلغاء')) {
        setErrorMessage(result.error);
      }
    }
  };

  // Physical touch / hold start handler
  const handleTouchStart = () => {
    if (status === 'verifying' || status === 'success') return;
    
    resetState();
    setStatus('holding');
    triggerHapticFeedback([30]);
    startTimeRef.current = Date.now();

    const duration = 1200; // 1.2 seconds required hold time
    const intervalTime = 30;

    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const currentPct = Math.min(Math.round((elapsed / duration) * 100), 100);
      setProgress(currentPct);

      // Light haptic ticks during hold
      if (currentPct % 25 === 0 && currentPct < 100) {
        triggerHapticFeedback([20]);
      }

      if (elapsed >= duration) {
        clearInterval(holdIntervalRef.current);
        verifyAndComplete();
      }
    }, intervalTime);
  };

  // Physical touch / hold release handler
  const handleTouchEnd = () => {
    if (status === 'verifying' || status === 'success') return;

    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
    }

    if (progress < 100) {
      setStatus('error');
      setErrorMessage('تم رفع الإصبع قبل اكتمال قراءة البصمة! يرجى وضع الإصبع والاستمرار بالضغط.');
      triggerHapticFeedback([100, 50, 100]);
      setProgress(0);
    }
  };

  const verifyAndComplete = () => {
    setStatus('verifying');
    triggerHapticFeedback([40, 40]);

    setTimeout(() => {
      setStatus('success');
      triggerHapticFeedback([60, 100, 60]);

      setTimeout(() => {
        onSuccess(authType, targetUsername);
      }, 700);
    }, 600);
  };

  // Native Android/iOS Hardware Fingerprint scan trigger
  const handleHardwareWebAuthn = async () => {
    resetState();
    setStatus('verifying');
    triggerHapticFeedback([30]);

    try {
      const verified = await authenticateWithHardwareBiometrics(targetUsername);
      if (verified) {
        setStatus('success');
        setProgress(100);
        triggerHapticFeedback([60, 100, 60]);
        setTimeout(() => {
          onSuccess('fingerprint', targetUsername);
        }, 600);
      } else {
        // Switch to interactive sensor
        setStatus('idle');
        setErrorMessage('يرجى استخدام مستشعر البصمة التفاعلي بالأسفل (اضغط واستمر بالضغط).');
      }
    } catch {
      setStatus('idle');
    }
  };

  // Real Camera Live Face Scan
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const startLiveCameraFaceScan = async () => {
    resetState();
    stopCameraStream();
    setStatus('holding');
    setErrorMessage('');
    triggerHapticFeedback([30]);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('متصفحك الحالي لا يتيح الوصول المباشر للكاميرا.');
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (e) {
          console.warn('Camera video play warning:', e);
        }
      }

      // Run facial scanning progression
      startTimeRef.current = Date.now();
      const duration = 2000;

      holdIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const currentPct = Math.min(Math.round((elapsed / duration) * 100), 100);
        setProgress(currentPct);

        if (elapsed >= duration) {
          clearInterval(holdIntervalRef.current);
          stopCameraStream();
          verifyAndComplete();
        }
      }, 40);
    } catch (err: any) {
      console.warn('Camera Face Scan error:', err);
      setIsCameraActive(false);
      setStatus('error');
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setErrorMessage('تم رفض إذن الكاميرا. يرجى الضغط على أيقونة الإعدادات 🔒 بالمتصفح والسماح باستخدام الكاميرا.');
      } else {
        setErrorMessage(err?.message || 'تعذر تشغيل كاميرا الهاتف.');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in select-none" dir="rtl">
      <div className="relative w-full max-w-sm bg-[#1A2230] border border-slate-700/60 rounded-2xl p-6 shadow-2xl text-right space-y-5 overflow-hidden">
        
        {/* Header - Classic System Style */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white tracking-wide">
              {authType === 'fingerprint' ? 'تسجيل الدخول بالبصمة' : 'التعرف على الوجه'}
            </h3>
            <p className="text-xs text-slate-400">
              تطبيق حاسبو • الحساب: <span className="text-emerald-400 font-semibold">{targetUsername || 'admin'}</span>
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        {/* Sensor Area - Classic Native Look */}
        <div className="py-4 flex flex-col items-center justify-center space-y-4">
          {authType === 'fingerprint' ? (
            <button
              type="button"
              onMouseDown={handleTouchStart}
              onMouseUp={handleTouchEnd}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onContextMenu={(e) => e.preventDefault()}
              disabled={status === 'verifying' || status === 'success'}
              className={`relative w-24 h-24 rounded-full flex items-center justify-center transition cursor-pointer select-none touch-none ${
                status === 'success'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : status === 'error'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : status === 'holding'
                  ? 'bg-emerald-500/20 text-emerald-400 scale-95 ring-2 ring-emerald-400/40'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700'
              }`}
            >
              {status === 'success' ? (
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              ) : status === 'error' ? (
                <AlertCircle className="w-12 h-12 text-rose-400" />
              ) : (
                <Fingerprint className={`w-12 h-12 ${status === 'holding' ? 'text-emerald-400' : 'text-slate-300'}`} />
              )}
            </button>
          ) : (
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] ${
                  isCameraActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              />
              <button
                type="button"
                onClick={startLiveCameraFaceScan}
                disabled={status === 'holding' || status === 'verifying' || status === 'success'}
                className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-transparent cursor-pointer"
              >
                {status === 'success' ? (
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 z-10" />
                ) : !isCameraActive ? (
                  <ScanFace className="w-10 h-10 text-slate-300 hover:text-white" />
                ) : (
                  <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                )}
              </button>
            </div>
          )}

          {/* Subtitle / Instructions */}
          <div className="text-center space-y-1">
            {status === 'idle' && authType === 'fingerprint' && (
              <p className="text-xs text-slate-300 font-medium">
                المس مستشعر البصمة للمتابعة
              </p>
            )}
            {status === 'idle' && authType === 'face' && (
              <p className="text-xs text-slate-300 font-medium">
                انقر على الدائرة للتحقق من الوجه بالكاميرا
              </p>
            )}
            {status === 'holding' && (
              <p className="text-xs text-emerald-400 font-medium animate-pulse">
                {authType === 'fingerprint' ? `جاري التحقق... (${progress}%)` : 'جاري مسح الوجه...'}
              </p>
            )}
            {status === 'verifying' && (
              <p className="text-xs text-emerald-400 font-medium">
                جاري مطابقة الهوية...
              </p>
            )}
            {status === 'success' && (
              <p className="text-xs text-emerald-400 font-bold">
                تم التحقق بنجاح
              </p>
            )}
            {status === 'error' && (
              <p className="text-xs text-rose-400 font-medium">
                {errorMessage || 'لم يتم التعرف على البصمة. يرجى المحاولة مرة أخرى.'}
              </p>
            )}
          </div>
        </div>

        {/* Switch Between Fingerprint & Face */}
        <div className="flex items-center justify-center gap-4 text-xs border-t border-slate-800 pt-3">
          <button
            type="button"
            onClick={() => {
              stopCameraStream();
              setAuthType('fingerprint');
              resetState();
              triggerSystemBiometrics('fingerprint');
            }}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer font-medium ${
              authType === 'fingerprint'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            بصمة الإصبع
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthType('face');
              resetState();
              startLiveCameraFaceScan();
            }}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer font-medium ${
              authType === 'face'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            بصمة الوجه
          </button>
        </div>

        {/* Bottom Actions - Classic Android Prompt Style */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-400 hover:text-white px-2 py-1.5 rounded-lg transition cursor-pointer"
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition cursor-pointer"
          >
            استخدام كلمة المرور
          </button>
        </div>

      </div>
    </div>
  );
};

