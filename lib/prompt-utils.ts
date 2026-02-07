/**
 * 🌐 Prompt Utilities
 * أدوات لتحسين البرومبت ودعم اللغة العربية في توليد الصور والفيديو
 * 
 * ملاحظة: الترجمة الفعلية تتم على الباك إند باستخدام Gemini AI
 * هذه الدوال للتحسينات البسيطة فقط (مثل إضافة النمط)
 */

/**
 * يكتشف إذا كان النص يحتوي على أحرف عربية
 */
export function containsArabic(text: string): boolean {
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicPattern.test(text);
}

/**
 * يعالج البرومبت للصور
 * - يبقي البرومبت كما هو (الباك إند سيتعامل مع الترجمة)
 * - يضيف النمط إذا وجد
 */
export function processImagePrompt(prompt: string, style?: string): string {
  if (!prompt) return prompt;
  
  let finalPrompt = prompt.trim();
  
  // إضافة النمط إذا وجد (فقط للبرومبت الإنجليزي أو بعد الترجمة)
  if (style && style.trim() && !containsArabic(style)) {
    // إذا كان البرومبت إنجليزي، أضف النمط مباشرة
    if (!containsArabic(finalPrompt)) {
      finalPrompt = `${finalPrompt}, ${style}`;
    }
    // إذا كان عربي، النمط سيتم إضافته في الباك إند بعد الترجمة
  }
  
  return finalPrompt;
}

/**
 * يعالج البرومبت للفيديو
 * - يبقي البرومبت كما هو (الباك إند سيتعامل مع الترجمة)
 * - يضيف النمط إذا وجد
 */
export function processVideoPrompt(prompt: string, style?: string): string {
  if (!prompt) return prompt;
  
  let finalPrompt = prompt.trim();
  
  // إضافة النمط إذا وجد (فقط للبرومبت الإنجليزي)
  if (style && style.trim() && !containsArabic(style)) {
    if (!containsArabic(finalPrompt)) {
      finalPrompt = `${finalPrompt}, ${style}`;
    }
  }
  
  return finalPrompt;
}

/**
 * دالة مساعدة للتحقق من طول البرومبت
 */
export function validatePromptLength(prompt: string, maxLength: number = 20000): boolean {
  return prompt.length <= maxLength;
}
