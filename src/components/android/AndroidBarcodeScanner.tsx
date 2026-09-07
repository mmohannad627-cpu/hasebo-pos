/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Flashlight, RefreshCw, Volume2, VolumeX, CheckCircle, AlertCircle, Scan } from 'lucide-react';

interface AndroidBarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export const AndroidBarcodeScanner: React.FC<AndroidBarcodeScannerProps> = ({
  isOpen,
  onClose,
  onScan,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasCameraError, setHasCameraError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const animationFrameId = useRef<number | null>(null);

  // Play beep sound using Web Audio API
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      // Audio context may be restricted
    }
  };

  // Trigger Android haptic vibration
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([80]);
      } catch (e) {}
    }
  };

  // Start Camera
  const startCamera = async () => {
    setHasCameraError(null);
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsScanning(true);
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setHasCameraError('تعذر الوصول إلى كاميرا الهاتف. يرجى منح الإذن للكاميرا أو إدخال الباركود يدوياً.');
    }
  };

  // Toggle Torch/Flashlight on Android
  const toggleTorch = async () => {
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack && 'applyConstraints' in videoTrack) {
      try {
        const newTorchState = !torchOn;
        await (videoTrack as any).applyConstraints({
          advanced: [{ torch: newTorchState }],
        });
        setTorchOn(newTorchState);
      } catch (err) {
        console.warn('Torch not supported on this device/browser:', err);
      }
    }
  };

  // Barcode Detection Loop (BarcodeDetector API if available in Android Chrome)
  useEffect(() => {
    if (!isOpen) return;

    startCamera();

    let isDestroyed = false;

    const detectBarcode = async () => {
      if (isDestroyed || !videoRef.current || videoRef.current.readyState < 2) {
        if (!isDestroyed) {
          animationFrameId.current = requestAnimationFrame(detectBarcode);
        }
        return;
      }

      if ('BarcodeDetector' in window) {
        try {
          const barcodeDetector = new (window as any).BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code', 'upc_a', 'upc_e'],
          });
          const barcodes = await barcodeDetector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const rawValue = barcodes[0].rawValue;
            if (rawValue && rawValue !== lastScannedCode) {
              setLastScannedCode(rawValue);
              playBeep();
              triggerHaptic();
              onScan(rawValue);
              // Cooldown before scanning the same code
              setTimeout(() => {
                setLastScannedCode(null);
              }, 1200);
            }
          }
        } catch (e) {
          // fallback ignore
        }
      }

      if (!isDestroyed) {
        animationFrameId.current = requestAnimationFrame(detectBarcode);
      }
    };

    animationFrameId.current = requestAnimationFrame(detectBarcode);

    return () => {
      isDestroyed = true;
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      playBeep();
      triggerHaptic();
      onScan(manualCode.trim());
      setManualCode('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between" dir="rtl">
      {/* Top Header */}
      <div className="p-4 flex items-center justify-between bg-slate-950/80 border-b border-slate-800 text-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold">قارئ الباركود بكاميرا أندرويد</h2>
            <p className="text-[11px] text-slate-400">وجه الكاميرا نحو باركود الصنف للمسح المباشر</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTorch}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              torchOn
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
            title="تشغيل الفلاش / الكشاف"
          >
            <Flashlight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title="كتم / تفعيل صوت المسح"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          <button
            type="button"
            onClick={() => {
              if (stream) {
                stream.getTracks().forEach(track => track.stop());
              }
              onClose();
            }}
            className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:bg-rose-500/30 transition cursor-pointer"
            title="إغلاق الماسح"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Viewfinder Area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black">
        {hasCameraError ? (
          <div className="p-6 max-w-sm text-center bg-slate-900/90 rounded-2xl border border-slate-800 text-slate-200">
            <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <p className="text-sm font-semibold mb-3">{hasCameraError}</p>
            <button
              type="button"
              onClick={startCamera}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition"
            >
              إعادة محاولة فتح الكاميرا
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              muted
              playsInline
            />

            {/* Target Laser Box */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 border-2 border-emerald-500/80 rounded-3xl overflow-hidden shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] flex flex-col items-center justify-center">
              {/* Corner Accents */}
              <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
              <div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
              <div className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
              <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />

              {/* Red Laser Scan Line */}
              <div className="w-full h-0.5 bg-gradient-to-r from-emerald-500 via-rose-500 to-emerald-500 shadow-[0_0_12px_#ef4444] animate-pulse" />

              <span className="mt-4 px-3 py-1 rounded-full bg-black/60 text-emerald-300 text-[11px] font-semibold backdrop-blur">
                جاري المسح المستمر...
              </span>
            </div>
          </>
        )}
      </div>

      {/* Bottom Controls & Manual Entry */}
      <div className="p-4 bg-slate-950/95 border-t border-slate-800 flex flex-col gap-3">
        {lastScannedCode && (
          <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-mono text-center flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>تم مسح الباركود: {lastScannedCode}</span>
          </div>
        )}

        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="أو أدخل رقم الباركود / الكود يدوياً..."
            className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-bold text-xs hover:bg-emerald-600 transition shrink-0 cursor-pointer"
          >
            إضافة الصنف
          </button>
        </form>
      </div>
    </div>
  );
};
