# خطوات تحديث جميع أدوات الذكاء الاصطناعي لاستخدام UpgradeModal

## الخطوات المطلوبة لكل ملف:

### 1. إضافة الاستيراد
أضف هذا السطر مع باقي الاستيرادات:
```tsx
import UpgradeModal from '@/components/Modals/UpgradeModal';
```

### 2. إضافة State (إذا لم يكن موجوداً)
```tsx
const [showUpgradeModal, setShowUpgradeModal] = useState(false);
```

### 3. استبدال toast.error بفتح النافذة
ابحث عن أي من هذه الأنماط واستبدلها:

**قبل:**
```tsx
if (balance.remaining_credits < creditsNeeded) {
  toast.error('رصيدك غير كافٍ');
  return;
}
```

**بعد:**
```tsx
if (balance.remaining_credits < creditsNeeded) {
  setShowUpgradeModal(true);
  return;
}
```

### 4. إضافة المكون في نهاية JSX
أضف قبل إغلاق الـ return:
```tsx
<UpgradeModal 
  isOpen={showUpgradeModal}
  onClose={() => setShowUpgradeModal(false)}
/>
```

## قائمة الملفات والحالة:

- [x] `/app/ai/chat/page.tsx` ✅ تم التحديث
- [x] `/app/ai/image/page.tsx` ✅ تم التحديث
- [x] `/app/ai/video/page.tsx` ✅ تم التحديث
- [x] `/app/ai/upscale/page.tsx` ✅ تم التحديث
- [x] `/app/ai/edit/page.tsx` ✅ تم التحديث
- [x] `/app/ai/product/page.tsx` ✅ تم التحديث
- [x] `/app/ai/logo/page.tsx` ✅ تم التحديث
- [x] `/app/ai/sketch/page.tsx` ✅ تم التحديث
- [x] `/app/ai/restore/page.tsx` ✅ تم التحديث
- [x] `/app/ai/motion/page.tsx` ✅ تم التحديث
- [x] `/app/ai/resize/page.tsx` ✅ تم التحديث
- [x] `/app/ai/ugc/page.tsx` ✅ تم التحديث
- [x] `/app/ai/vupscale/page.tsx` ✅ تم التحديث
- [x] `/app/ai/nano/page.tsx` ✅ تم التحديث
- [x] `/app/ai/long-video/page.tsx` ✅ تم التحديث
- [x] `/app/ai/lipsync/page.tsx` ✅ تم التحديث
- [x] `/app/ai/avatar/page.tsx` ✅ تم التحديث
- [x] `/app/ai/colorize/page.tsx` ✅ تم التحديث
- [x] `/app/ai/effects/page.tsx` ✅ تم التحديث
- [x] `/app/ai/bg-remove/page.tsx` ✅ تم التحديث
- [x] `/app/ai/image-to-text/page.tsx` ✅ تم التحديث

**✅ اكتمل التحديث! جميع الأدوات تستخدم الآن UpgradeModal**

## أمثلة للبحث والاستبدال:

### نمط 1: toast.error مع رصيد غير كافٍ
```bash
# ابحث عن:
toast.error\(['"]رصيدك غير كافٍ['"]

# استبدل بـ:
setShowUpgradeModal(true); return
```

### نمط 2: فحص الرصيد قبل العملية
```tsx
// قبل
if (!balance || balance.remaining_credits <= 0) {
  toast.error('نفذ رصيدك');
  return;
}

// بعد
if (!balance || balance.remaining_credits <= 0) {
  setShowUpgradeModal(true);
  return;
}
```

### نمط 3: فحص الرصيد مع عدد نقاط محدد
```tsx
// قبل
if (balance.remaining_credits < creditsNeeded) {
  toast.error(`رصيد غير كافي. تحتاج ${creditsNeeded} ولديك ${balance.remaining_credits}`);
  return;
}

// بعد
if (balance.remaining_credits < creditsNeeded) {
  setShowUpgradeModal(true);
  return;
}
```

## ملاحظات مهمة:

1. **احتفظ بـ toast.error للأخطاء الأخرى** (مثل أخطاء الشبكة، أخطاء التحميل، إلخ)
2. **استخدم UpgradeModal فقط لمشاكل الرصيد/الاشتراك**
3. **تأكد من إضافة State إذا لم يكن موجوداً**
4. **لا تنسَ إضافة الاستيراد في أعلى الملف**

## اختبار بعد التحديث:

1. افتح الأداة في المتصفح
2. حاول استخدامها بدون رصيد كافٍ
3. تأكد من ظهور نافذة الترقية الجديدة
4. تأكد من إمكانية إغلاق النافذة
5. تأكد من عمل زر "استعراض باقات الاشتراك"
