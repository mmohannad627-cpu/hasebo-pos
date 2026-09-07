# حاسبو — Android / Capacitor

تمت إضافة طبقة Capacitor إلى مشروع HĀSEBO POS.

## ما تم تعديله

- إضافة `@capacitor/core` و`@capacitor/android` و`@capacitor/cli`.
- إضافة `capacitor.config.ts` بمعرّف التطبيق `com.hasebo.pos`.
- إضافة هيكل Android Studio داخل `android/`.
- إضافة `MainActivity` مبني على `BridgeActivity`.
- إضافة صلاحيات الإنترنت والكاميرا لمسح الباركود.
- إضافة سكربتات `cap:sync`, `cap:copy`, `android` و`build:web`.
- جعل عنوان الـ API قابلًا للضبط عبر `VITE_API_BASE_URL` بدل تثبيته داخل الكود.

## قبل أول Build

1. ثبّت Node.js.
2. من مجلد المشروع شغّل `npm install`.
3. انسخ `.env.android.example` إلى `.env`.
4. غيّر `VITE_API_BASE_URL` إلى عنوان خادم الـ API الحقيقي، ويفضل HTTPS.
5. شغّل `npm run cap:sync`.
6. افتح مجلد `android` في Android Studio.
7. انتظر Gradle Sync ثم اختر Build > Build APK(s).

## تنبيه معماري مهم

هذا التحويل يجعل واجهة React تطبيق Android، لكنه لا يحوّل Node/Express وقاعدة البيانات إلى خدمة تعمل داخل APK. الخادم الحالي (`server.ts`) يجب أن يبقى مستضافًا ويمكن الوصول إليه من الهاتف.

لا تضع `GEMINI_API_KEY` أو أي مفتاح سري داخل `.env` الذي سيتم تضمينه في عملية Vite/Android. المفاتيح السرية تبقى على الخادم.
