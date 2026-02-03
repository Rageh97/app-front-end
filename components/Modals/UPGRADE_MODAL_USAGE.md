# دليل استخدام مكون UpgradeModal

## نظرة عامة
مكون `UpgradeModal` هو مكون قابل لإعادة الاستخدام يعرض نافذة منبثقة أنيقة تطلب من المستخدم الترقية عندما لا يكون لديه رصيد كافٍ أو اشتراك نشط.

## الاستيراد

```tsx
import UpgradeModal from '@/components/Modals/UpgradeModal';
```

## الخصائص (Props)

| الخاصية | النوع | مطلوب | القيمة الافتراضية | الوصف |
|---------|------|-------|-------------------|-------|
| `isOpen` | `boolean` | نعم | - | حالة ظهور النافذة |
| `onClose` | `() => void` | نعم | - | دالة لإغلاق النافذة |
| `title` | `string` | لا | `'رصيدك غير كافٍ'` | عنوان النافذة |
| `description` | `string` | لا | نص افتراضي | وصف المشكلة |

## مثال الاستخدام الأساسي

```tsx
'use client';

import { useState } from 'react';
import UpgradeModal from '@/components/Modals/UpgradeModal';

export default function MyAITool() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const handleAction = () => {
    // فحص الرصيد
    if (!balance || balance.remaining_credits <= 0) {
      setShowUpgradeModal(true);
      return;
    }
    
    // تنفيذ العملية
    // ...
  };
  
  return (
    <>
      {/* محتوى الأداة */}
      <button onClick={handleAction}>تنفيذ</button>
      
      {/* نافذة الترقية */}
      <UpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </>
  );
}
```

## مثال مع عنوان ووصف مخصص

```tsx
<UpgradeModal 
  isOpen={showUpgradeModal}
  onClose={() => setShowUpgradeModal(false)}
  title="اشتراك مطلوب"
  description="هذه الميزة متاحة فقط للمشتركين في الباقات المدفوعة. قم بالترقية الآن للوصول إلى جميع الميزات المتقدمة."
/>
```

## أمثلة التكامل في الأدوات المختلفة

### 1. أداة توليد الصور (Image Generation)

```tsx
const handleGenerate = async () => {
  if (!balance || balance.remaining_credits < 5) {
    setShowUpgradeModal(true);
    return;
  }
  // توليد الصورة
};
```

### 2. أداة توليد الفيديو (Video Generation)

```tsx
const handleVideoGeneration = async () => {
  if (!balance || balance.remaining_credits < 10) {
    setShowUpgradeModal(true);
    return;
  }
  // توليد الفيديو
};
```

### 3. أداة تحسين الصور (Image Upscale)

```tsx
const handleUpscale = async () => {
  const creditsNeeded = selectedOption.credits;
  
  if (!balance || balance.remaining_credits < creditsNeeded) {
    setShowUpgradeModal(true);
    return;
  }
  // تحسين الصورة
};
```

## الميزات

- ✅ تصميم أنيق مع تأثيرات حركية
- ✅ خلفية ضبابية (backdrop blur)
- ✅ أيقونة تاج متحركة
- ✅ تأثير BorderBeam على الحواف
- ✅ زر مميز للانتقال إلى صفحة الباقات
- ✅ إغلاق عند النقر خارج النافذة
- ✅ نصوص قابلة للتخصيص

## ملاحظات

1. المكون يستخدم `z-[1000]` لضمان ظهوره فوق جميع العناصر
2. يتم توجيه المستخدم تلقائياً إلى `/ai/plans` عند النقر على زر الترقية
3. المكون responsive ويعمل على جميع أحجام الشاشات
4. يستخدم تأثيرات حركية من Tailwind CSS

## الاستبدال في الملفات القديمة

إذا كان لديك كود قديم يستخدم نافذة ترقية مخصصة، استبدله بـ:

### قبل:
```tsx
{showUpgradeModal && (
  <div className="fixed inset-0 z-[1000]...">
    {/* كود طويل للنافذة */}
  </div>
)}
```

### بعد:
```tsx
<UpgradeModal 
  isOpen={showUpgradeModal}
  onClose={() => setShowUpgradeModal(false)}
/>
```

## الملفات التي تم تحديثها ✅

قم بتحديث الملفات التالية لاستخدام المكون الجديد:

- ✅ `/app/ai/chat/page.tsx` (تم التحديث)
- ✅ `/app/ai/image/page.tsx` (تم التحديث)
- ✅ `/app/ai/video/page.tsx` (تم التحديث)
- ✅ `/app/ai/upscale/page.tsx` (تم التحديث)
- ✅ `/app/ai/edit/page.tsx` (تم التحديث)
- ✅ `/app/ai/product/page.tsx` (تم التحديث)
- ✅ `/app/ai/logo/page.tsx` (تم التحديث)
- ✅ `/app/ai/sketch/page.tsx` (تم التحديث)
- ✅ `/app/ai/restore/page.tsx` (تم التحديث)
- ✅ `/app/ai/motion/page.tsx` (تم التحديث)
- ✅ `/app/ai/resize/page.tsx` (تم التحديث)
- ✅ `/app/ai/ugc/page.tsx` (تم التحديث)
- ✅ `/app/ai/vupscale/page.tsx` (تم التحديث)
- ✅ `/app/ai/nano/page.tsx` (تم التحديث)
- ✅ `/app/ai/long-video/page.tsx` (تم التحديث)
- ✅ `/app/ai/lipsync/page.tsx` (تم التحديث)
- ✅ `/app/ai/avatar/page.tsx` (تم التحديث)
- ✅ `/app/ai/colorize/page.tsx` (تم التحديث)
- ✅ `/app/ai/effects/page.tsx` (تم التحديث)
- ✅ `/app/ai/bg-remove/page.tsx` (تم التحديث)
- ✅ `/app/ai/image-to-text/page.tsx` (تم التحديث)

**جميع الأدوات تم تحديثها بنجاح! 🎉**
