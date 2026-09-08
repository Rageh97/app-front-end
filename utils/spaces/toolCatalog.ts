import type { WorkflowNodeData } from '@/stores/spacesStore';

export type SpaceToolCategory = 'input' | 'image' | 'video' | 'audio' | 'edit' | 'output';

export interface SpaceToolItem {
  type: string;
  title: string;
  description: string;
  category: SpaceToolCategory;
  keywords: string[];
  defaultData: WorkflowNodeData;
}

export const SPACE_TOOL_CATEGORIES: Array<{ id: 'all' | SpaceToolCategory; label: string }> = [
  { id: 'all', label: 'الكل' },
  { id: 'input', label: 'مدخلات' },
  { id: 'image', label: 'صور' },
  { id: 'video', label: 'فيديو' },
  { id: 'audio', label: 'صوت' },
  { id: 'edit', label: 'معالجة' },
  { id: 'output', label: 'مخرجات' },
];

export const SPACE_TOOLS: SpaceToolItem[] = [
  {
    type: 'textPrompt',
    title: 'أمر نصي',
    description: 'اكتب الفكرة أو السكريبت الذي سيغذي خطوات المسار.',
    category: 'input',
    keywords: ['نص', 'prompt', 'script', 'وصف'],
    defaultData: {
      title: 'الأمر النصي', category: 'input', status: 'idle',
      prompt: 'اكتب هنا ما تريد توليده بالتفصيل...', creditsCost: 0,
    },
  },
  {
    type: 'imageUpload',
    title: 'رفع صورة',
    description: 'أضف صورة مرجعية أو صورة تريد معالجتها.',
    category: 'input',
    keywords: ['صورة', 'رفع', 'upload', 'reference'],
    defaultData: { title: 'رفع صورة', category: 'input', status: 'idle', creditsCost: 0 },
  },
  {
    type: 'imageGen',
    title: 'الصور السينمائية',
    description: 'إنتاج بصري احترافي عالي الدقة عبر Gemini 3 Pro Image.',
    category: 'image',
    keywords: ['سينمائي', 'صورة', 'image', 'gemini', '4k'],
    defaultData: {
      title: 'الصور السينمائية', category: 'image', toolId: 'image', status: 'idle',
      modelId: 'gemini-3-pro-image', resolution: '2K', aspectRatio: '16:9',
      style: 'cinematic', creditsCost: 30,
    },
  },
  {
    type: 'imageGen',
    title: 'توليد الصور نانو',
    description: 'أنشئ صورة احترافية من وصف أو صورة مرجعية.',
    category: 'image',
    keywords: ['نانو', 'صورة', 'image', 'generate', 'سينمائي'],
    defaultData: {
      title: 'توليد الصور نانو', category: 'image', toolId: 'nano', status: 'idle',
      modelId: 'gemini-3.1-flash-image', resolution: '2K', aspectRatio: '1:1',
      style: 'photorealistic', creditsCost: 18,
    },
  },
  {
    type: 'imageGen',
    title: 'GPT Image',
    description: 'توليد وتحرير الصور مع فهم دقيق للنص والتكوين.',
    category: 'image',
    keywords: ['gpt', 'openai', 'صورة', 'image', 'نصوص'],
    defaultData: {
      title: 'GPT Image', category: 'image', toolId: 'gpt-image', status: 'idle',
      modelId: 'gpt-image-2', aspectRatio: '1:1', style: 'photorealistic', creditsCost: 16,
    },
  },
  {
    type: 'imageGen',
    title: 'تحويل النص إلى صورة',
    description: 'حوّل الوصف النصي مباشرة إلى صورة جاهزة.',
    category: 'image',
    keywords: ['نص', 'صورة', 'text to image', 'generate'],
    defaultData: {
      title: 'تحويل النص إلى صورة', category: 'image', toolId: 'text-to-image', status: 'idle',
      modelId: 'gemini-3.1-flash-image', resolution: '1K', aspectRatio: '1:1',
      style: 'photorealistic', creditsCost: 12,
    },
  },
  {
    type: 'product',
    title: 'نماذج المنتجات',
    description: 'حوّل صورة المنتج إلى مشهد إعلاني جاهز.',
    category: 'image',
    keywords: ['منتج', 'product', 'اعلان', 'mockup'],
    defaultData: {
      title: 'نماذج المنتجات', category: 'image', toolId: 'product', status: 'idle',
      style: 'studio', creditsCost: 13,
    },
  },
  {
    type: 'avatar',
    title: 'صانع الشخصيات',
    description: 'أنشئ أفاتار أو شخصية متناسقة من صورة مرجعية.',
    category: 'image',
    keywords: ['افاتار', 'شخصية', 'avatar', 'character'],
    defaultData: {
      title: 'صانع الأفاتار والشخصيات', category: 'image', toolId: 'avatar', status: 'idle',
      style: 'cartoon', creditsCost: 12,
    },
  },
  {
    type: 'imageTool', title: 'صانع الشعارات',
    description: 'ابتكر شعارًا وهوية بصرية من اسم العلامة ووصفها.', category: 'image',
    keywords: ['شعار', 'logo', 'brand', 'هوية'],
    defaultData: { title: 'صانع الشعارات', category: 'image', toolId: 'logo', status: 'idle', prompt: '', style: 'modern', requiresImage: false, creditsCost: 13 },
  },
  {
    type: 'imageTool', title: 'الرسم إلى صورة',
    description: 'حوّل رسمة أو مسودة إلى صورة فنية مكتملة.', category: 'image',
    keywords: ['رسم', 'sketch', 'مسودة', 'صورة'],
    defaultData: { title: 'الرسم إلى صورة', category: 'image', toolId: 'sketch', status: 'idle', prompt: '', style: 'realistic', colorScheme: 'natural', requiresImage: true, creditsCost: 12 },
  },
  {
    type: 'videoGen',
    title: 'توليد فيديو سينمائي',
    description: 'أنشئ فيديو من النص أو حرّك صورة مع صوت متزامن.',
    category: 'video',
    keywords: ['فيديو', 'video', 'سينمائي', 'veo', 'omni'],
    defaultData: {
      title: 'توليد الفيديو السينمائي', category: 'video', toolId: 'video', status: 'idle',
      modelId: 'gemini-omni-1.1-flash', resolution: '1080p', duration: 4,
      aspectRatio: '16:9', creditsCost: 40,
    },
  },
  {
    type: 'motion',
    title: 'تحريك صورة',
    description: 'أضف حركة كاميرا وعمقًا طبيعيًا لصورة ثابتة.',
    category: 'video',
    keywords: ['تحريك', 'motion', 'صورة', 'animation'],
    defaultData: {
      title: 'محاكاة حركة الصور', category: 'video', toolId: 'motion', status: 'idle',
      modelId: 'gemini-omni-1.1-flash', intensity: 'moderate', duration: 8, creditsCost: 65,
    },
  },
  {
    type: 'tts',
    title: 'تحويل النص إلى صوت',
    description: 'أنشئ تعليقًا صوتيًا طبيعيًا من النص.',
    category: 'audio',
    keywords: ['صوت', 'تعليق', 'tts', 'voice', 'audio'],
    defaultData: {
      title: 'تحويل النص إلى صوت', category: 'audio', toolId: 'text-to-speech', status: 'idle',
      voiceId: 'zaid', modelId: 'gemini-3.1', creditsCost: 3,
    },
  },
  {
    type: 'upscale',
    title: 'مضاعفة الجودة',
    description: 'ارفع دقة الصورة النهائية حتى 4K أو 8K.',
    category: 'edit',
    keywords: ['جودة', 'دقة', 'upscale', '4k', '8k'],
    defaultData: {
      title: 'مضاعفة الجودة 4K', category: 'edit', toolId: 'upscale', status: 'idle',
      scale: 4, creditsCost: 12,
    },
  },
  {
    type: 'bgRemove',
    title: 'إزالة الخلفية',
    description: 'اعزل العنصر الرئيسي بخلفية شفافة.',
    category: 'edit',
    keywords: ['خلفية', 'remove', 'background', 'عزل'],
    defaultData: {
      title: 'إزالة الخلفية', category: 'edit', toolId: 'bg-remove', status: 'idle', creditsCost: 11,
    },
  },
  {
    type: 'restore',
    title: 'ترميم الصور',
    description: 'أصلح الصور القديمة والخدوش والعيوب.',
    category: 'edit',
    keywords: ['ترميم', 'restore', 'قديم', 'خدوش'],
    defaultData: {
      title: 'ترميم الصور', category: 'edit', toolId: 'restore', status: 'idle', creditsCost: 11,
    },
  },
  {
    type: 'colorize',
    title: 'تلوين الصور القديمة',
    description: 'أضف ألوانًا طبيعية للصور الأبيض والأسود.',
    category: 'edit',
    keywords: ['تلوين', 'colorize', 'قديم', 'ابيض واسود'],
    defaultData: {
      title: 'تلوين الصور القديمة', category: 'edit', toolId: 'colorize', status: 'idle', creditsCost: 11,
    },
  },
  {
    type: 'imageTool', title: 'استخراج الملابس',
    description: 'استخرج قطع الملابس في عرض كتالوج نظيف.', category: 'edit',
    keywords: ['ملابس', 'استخراج', 'clothes', 'fashion'],
    defaultData: { title: 'استخراج الملابس', category: 'edit', toolId: 'clothes-extraction', status: 'idle', requiresImage: true, creditsCost: 15 },
  },
  {
    type: 'imageTool', title: 'الصور الشخصية الرسمية',
    description: 'أنشئ صورة هوية أو سيرة ذاتية بخلفية رسمية.', category: 'edit',
    keywords: ['هوية', 'رسمية', 'id photo', 'cv'],
    defaultData: { title: 'الصور الشخصية الرسمية', category: 'edit', toolId: 'id-photo', status: 'idle', background: 'white', requiresImage: true, creditsCost: 13 },
  },
  {
    type: 'imageTool', title: 'المحرر الذكي',
    description: 'أضف أو احذف أو عدّل عناصر الصورة بتعليمات نصية.', category: 'edit',
    keywords: ['تعديل', 'edit', 'حذف', 'اضافة'],
    defaultData: { title: 'المحرر الذكي', category: 'edit', toolId: 'edit', status: 'idle', prompt: '', editType: 'remove_object', requiresImage: true, creditsCost: 22 },
  },
  {
    type: 'imageTool', title: 'إعادة الإضاءة',
    description: 'غيّر اتجاه الإضاءة مع الحفاظ على تفاصيل الصورة.', category: 'edit',
    keywords: ['اضاءة', 'relight', 'studio', 'light'],
    defaultData: { title: 'إعادة الإضاءة', category: 'edit', toolId: 'relight', status: 'idle', direction: 'right', requiresImage: true, creditsCost: 10 },
  },
  {
    type: 'imageTool', title: 'تغيير قصة الشعر',
    description: 'جرّب قصة ولون شعر مع الحفاظ على ملامح الوجه.', category: 'edit',
    keywords: ['شعر', 'تسريحة', 'hair', 'style'],
    defaultData: { title: 'تغيير قصة الشعر', category: 'edit', toolId: 'hair-style', status: 'idle', hairstyle: 'french_bob', hairColor: 'natural_black', gender: 'female', requiresImage: true, creditsCost: 10 },
  },
  {
    type: 'imageTool', title: 'تغيير الملابس',
    description: 'بدّل الزي من وصف أو صورة قطعة ملابس مرجعية.', category: 'edit',
    keywords: ['ملابس', 'تبديل', 'try on', 'clothes'],
    defaultData: { title: 'تغيير الملابس', category: 'edit', toolId: 'clothes-swap', status: 'idle', prompt: 'Elegant modern outfit', requiresImage: true, acceptsSecondImage: true, creditsCost: 5 },
  },
  {
    type: 'imageTool', title: 'رحلة العمر',
    description: 'محاكاة عمرية واقعية كصورة أو فيديو.', category: 'edit',
    keywords: ['عمر', 'age', 'رحلة', 'قديم'],
    defaultData: { title: 'رحلة العمر', category: 'edit', toolId: 'age-journey', status: 'idle', targetAge: 65, mode: 'image', requiresImage: true, creditsCost: 15 },
  },
  {
    type: 'imageTool', title: 'الرؤية الليلية',
    description: 'تأثير عين السمكة والرؤية الليلية كصورة أو فيديو.', category: 'edit',
    keywords: ['ليلي', 'fisheye', 'night', 'cctv'],
    defaultData: { title: 'الرؤية الليلية', category: 'edit', toolId: 'fisheye-night', status: 'idle', atmosphere: 'cctv_security', mode: 'image', requiresImage: true, creditsCost: 15 },
  },
  {
    type: 'imageTool', title: 'وضع المشاهير',
    description: 'حوّل الصورة إلى مشهد VIP أو سجادة حمراء.', category: 'edit',
    keywords: ['مشاهير', 'vip', 'celebrity', 'red carpet'],
    defaultData: { title: 'وضع المشاهير', category: 'edit', toolId: 'celebrity-mode', status: 'idle', setting: 'red_carpet', mode: 'image', requiresImage: true, creditsCost: 20 },
  },
  {
    type: 'imageTool', title: 'فهم واستخراج الصور',
    description: 'استخرج وصفًا نصيًا ذكيًا وتفاصيل الصورة.', category: 'edit',
    keywords: ['وصف', 'نص', 'image to text', 'vision'],
    defaultData: { title: 'فهم واستخراج الصور', category: 'assistant', toolId: 'image-to-text', status: 'idle', requiresImage: true, outputType: 'text', creditsCost: 2 },
  },
  {
    type: 'output',
    title: 'المخرج النهائي',
    description: 'اجمع النتيجة النهائية للمعاينة والتنزيل.',
    category: 'output',
    keywords: ['نتيجة', 'مخرج', 'output', 'download'],
    defaultData: { title: 'المخرجات النهائية', category: 'output', status: 'idle', creditsCost: 0 },
  },
];

export function searchSpaceTools(query: string, category: string = 'all') {
  const normalized = query.trim().toLocaleLowerCase('ar');
  return SPACE_TOOLS.filter((tool) => {
    const matchesCategory = category === 'all' || tool.category === category;
    if (!matchesCategory) return false;
    if (!normalized) return true;
    return [tool.title, tool.description, ...tool.keywords]
      .join(' ')
      .toLocaleLowerCase('ar')
      .includes(normalized);
  });
}
