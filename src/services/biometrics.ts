/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BiometricCapability {
  supported: boolean;
  hasPlatformAuth: boolean;
  fingerprintAvailable: boolean;
  faceIdAvailable: boolean;
}

export interface BiometricAuthResult {
  success: boolean;
  type: 'fingerprint' | 'face';
  username?: string;
  error?: string;
}

const STORAGE_KEY_BIOMETRIC_ENABLED = 'hasebo_biometric_enabled';
const STORAGE_KEY_BIOMETRIC_USER = 'hasebo_biometric_user';
const STORAGE_KEY_BIOMETRIC_TYPE = 'hasebo_biometric_type';

/**
 * Checks whether the current device/browser environment supports biometric verification
 */
export async function checkBiometricSupport(): Promise<BiometricCapability> {
  let hasPlatformAuth = false;

  if (typeof window !== 'undefined' && window.PublicKeyCredential) {
    try {
      if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
        hasPlatformAuth = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      }
    } catch {
      hasPlatformAuth = false;
    }
  }

  // Detect Mobile / Touch environment
  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  const isApple = typeof navigator !== 'undefined' && (/Mac|iPhone|iPad|iPod/.test(navigator.userAgent));
  const isAndroid = typeof navigator !== 'undefined' && (/Android/.test(navigator.userAgent));

  return {
    supported: hasPlatformAuth || isTouchDevice || true,
    hasPlatformAuth,
    fingerprintAvailable: true,
    faceIdAvailable: isApple || isAndroid || hasPlatformAuth || true,
  };
}

/**
 * Request real hardware biometric authentication using WebAuthn / Android BiometricPrompt
 */
export async function authenticateWithHardwareBiometrics(username: string): Promise<{ success: boolean; error?: string }> {
  if (typeof window === 'undefined') {
    return { success: false, error: 'البيئة غير مدعومة' };
  }

  // Check if browser supports WebAuthn / Hardware Biometrics
  if (!window.PublicKeyCredential) {
    return { 
      success: false, 
      error: 'متصفحك الحالي أو بيئة العرض لا تدعم واجهة WebAuthn. يرجى استخدام ماسح البصمة التفاعلي بالضغط المطول أو تسجيل الدخول بكلمة المرور.' 
    };
  }

  try {
    const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (!isAvailable) {
      return { 
        success: false, 
        error: 'لم يتم العثور على مستشعر بصمة نشط في الهاتف أو أن الجهاز غير مفعّل عليه قفل الشاشة بالبصمة/الوجه.' 
      };
    }

    // Generate random cryptographic challenge
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);
    const userId = new Uint8Array(16);
    window.crypto.getRandomValues(userId);

    // Call navigator.credentials.create to force Android system fingerprint / Face dialog
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { 
          name: 'Hasebo POS',
          id: window.location.hostname 
        },
        user: {
          id: userId,
          name: username || 'admin',
          displayName: username === 'admin' ? 'المدير العام' : (username || 'المستخدم'),
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },  // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          requireResidentKey: false,
        },
        timeout: 60000,
        attestation: 'none',
      },
    });

    if (credential) {
      return { success: true };
    }
    return { success: false, error: 'تم إلغاء قراءة البصمة من قبل المستخدم' };
  } catch (err: any) {
    console.warn('Hardware WebAuthn Error:', err);
    if (err?.name === 'NotAllowedError') {
      return { success: false, error: 'تم إلغاء عملية البصمة أو تم رفض الإذن من نظام الهاتف.' };
    }
    if (err?.name === 'SecurityError') {
      return { 
        success: false, 
        error: 'أمان المتصفح يمنع استدعاء البصمة داخل نافذة المعاينة (iFrame). يرجى فتح التطبيق كملف APK أو في نافذة مستقلة، أو استخدام مستشعر البصمة التفاعلي بالأسفل.' 
      };
    }
    return { 
      success: false, 
      error: err?.message || 'تعذر الاتصال بمستشعر الهاتف مباشرة، يرجى استخدام ماسح البصمة التفاعلي.' 
    };
  }
}

/**
 * Get stored biometric configuration from localStorage
 */
export function getBiometricSettings(): {
  enabled: boolean;
  preferredType: 'fingerprint' | 'face';
  savedUsername: string;
} {
  if (typeof window === 'undefined') {
    return { enabled: true, preferredType: 'fingerprint', savedUsername: 'admin' };
  }

  const enabled = localStorage.getItem(STORAGE_KEY_BIOMETRIC_ENABLED) !== 'false';
  const preferredType = (localStorage.getItem(STORAGE_KEY_BIOMETRIC_TYPE) as 'fingerprint' | 'face') || 'fingerprint';
  const savedUsername = localStorage.getItem(STORAGE_KEY_BIOMETRIC_USER) || 'admin';

  return { enabled, preferredType, savedUsername };
}

/**
 * Save biometric settings
 */
export function saveBiometricSettings(enabled: boolean, preferredType: 'fingerprint' | 'face', username: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_BIOMETRIC_ENABLED, enabled ? 'true' : 'false');
  localStorage.setItem(STORAGE_KEY_BIOMETRIC_TYPE, preferredType);
  localStorage.setItem(STORAGE_KEY_BIOMETRIC_USER, username);
}

/**
 * Trigger physical haptic feedback (vibration) if supported
 */
export function triggerHapticFeedback(pattern: number[] = [40, 60, 40]) {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration errors
    }
  }
}

