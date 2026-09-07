# دليل تجهيز ونشر تطبيق «حاسبوا» على متجر Google Play (سوق بلاي)

## معلومات التطبيق الأساسية:
- **اسم التطبيق في المتجر:** حاسبوا - كاشير ونقاط بيع ومخازن (HASEBO POS)
- **اسم الحزمة (Package Name):** `com.hasebo.pos`
- **رابط التطبيق المباشر (Production URL):** `https://ais-pre-iffvykj66arr7wmo4ymllt-19012510543.europe-west2.run.app`
- **المطور المسؤول:** م. مهند أحمد الزبير
- **رقم التواصل والدعم:** 774123322

---

## ⚡ الخطوات المباشرة لتوليد حزمة أندرويد (AAB / APK) لنشرها في Google Play:

### الخطوة 1: عبر منصة PWABuilder الرسمية (الموصى بها من Google):
1. ادخل على الموقع: **[https://www.pwabuilder.com](https://www.pwabuilder.com)**
2. انسخ هذا الرابط وضعه في الموقع:
   ```
   https://ais-pre-iffvykj66arr7wmo4ymllt-19012510543.europe-west2.run.app
   ```
3. اضغط على **Start** -> سيعطيك الموقع تقييم كامل (جاهز بنسبة 100% لتطابق معايير الـ Manifest و Service Worker).
4. اضغط على **Package for Stores** ثم اختر **Android (Google Play)**.
5. في الخيارات:
   - **Package ID:** `com.hasebo.pos`
   - **App Name:** `حاسبوا للكاشير والمبيعات`
   - **Launcher Name:** `حاسبوا`
   - **Version:** `1.0.0`
6. اضغط **Download Package** -> سيتم تنزيل ملف **`.aab` (Android App Bundle)** جاهز مباشرة لرفعه على حساب Google Play Console.

---

## 📱 الخطوة 2: رفع التطبيق على Google Play Console:
1. افتح **[Google Play Console](https://play.google.com/console)**.
2. اضغط **Create App** واكتب اسم التطبيق (حاسبوا - كاشير ونقاط بيع).
3. في قسم **Production** (أو **Internal Testing**):
   - قم برفع ملف الـ **`.aab`** الذي قمت بتنزيله.
4. املأ بيانات المتجر (الوصف، لقطات الشاشة، الأيقونة).
5. اضغط **Review and Rollout Release** لإرسال التطبيق وسيقوم فريق Google باعتماده ونشره على سوق بلاي.
