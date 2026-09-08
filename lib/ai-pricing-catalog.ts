import {
  GPT_IMAGE_MODELS,
  IMAGE_MODELS,
  LONG_VIDEO_MODELS,
  MOTION_MODELS,
  NANO_MODELS,
  VIDEO_MODELS,
  type AIModel,
  type VideoModel,
} from '@/lib/ai-models-config';

export interface PricingOperation {
  key: string;
  label: string;
  category: 'image' | 'video' | 'audio';
  defaultCredits: number;
}

const uniqueById = <T extends { id: string }>(items: T[]): T[] =>
  Array.from(new Map(items.map((item) => [item.id.replace(/^models\//, ''), { ...item, id: item.id.replace(/^models\//, '') }])).values());

/** Every image model that is selectable in the product. */
export const PRICING_IMAGE_MODELS: AIModel[] = uniqueById([
  ...IMAGE_MODELS,
  ...NANO_MODELS,
  ...GPT_IMAGE_MODELS,
]);

/** Every video model that is selectable in video, long-video, or motion. */
export const PRICING_VIDEO_MODELS: VideoModel[] = uniqueById([
  ...VIDEO_MODELS,
  ...LONG_VIDEO_MODELS,
  ...MOTION_MODELS,
]);

/** Fixed-price operations. Model-backed generation is priced in the model sections. */
export const PRICING_OPERATIONS: PricingOperation[] = [
  { key: 'operation:product-models', label: 'استوديو المنتجات', category: 'image', defaultCredits: 13 },
  { key: 'operation:sketch-to-image', label: 'الرسم إلى صورة', category: 'image', defaultCredits: 12 },
  { key: 'operation:image-edit', label: 'المحرر الذكي', category: 'image', defaultCredits: 22 },
  { key: 'operation:photo-restore', label: 'ترميم الصور', category: 'image', defaultCredits: 11 },
  { key: 'operation:photo-colorize', label: 'تلوين الصور', category: 'image', defaultCredits: 11 },
  { key: 'operation:background-remove', label: 'إزالة الخلفية', category: 'image', defaultCredits: 11 },
  { key: 'operation:clothes-extraction', label: 'استخراج الملابس', category: 'image', defaultCredits: 15 },
  { key: 'operation:id-photo', label: 'الصور الشخصية الرسمية', category: 'image', defaultCredits: 13 },
  { key: 'operation:relight', label: 'إعادة الإضاءة', category: 'image', defaultCredits: 10 },
  { key: 'operation:clothes-swap', label: 'تغيير الملابس', category: 'image', defaultCredits: 5 },
  { key: 'operation:hairstyle', label: 'تغيير قصة الشعر', category: 'image', defaultCredits: 10 },
  { key: 'operation:image-upscale', label: 'رفع جودة الصور', category: 'image', defaultCredits: 12 },
  { key: 'operation:image-to-prompt', label: 'فهم واستخراج الصور', category: 'image', defaultCredits: 2 },
  { key: 'operation:logo-creation', label: 'صانع الشعارات', category: 'image', defaultCredits: 13 },
  { key: 'operation:avatar-creation', label: 'صانع الأفاتار', category: 'image', defaultCredits: 12 },
  { key: 'operation:age-journey:image', label: 'رحلة العمر — صورة', category: 'image', defaultCredits: 15 },
  { key: 'operation:age-journey:video', label: 'رحلة العمر — فيديو', category: 'video', defaultCredits: 140 },
  { key: 'operation:fisheye-night:image', label: 'الرؤية الليلية — صورة', category: 'image', defaultCredits: 15 },
  { key: 'operation:fisheye-night:video', label: 'الرؤية الليلية — فيديو', category: 'video', defaultCredits: 130 },
  { key: 'operation:celebrity-mode:image', label: 'وضع المشاهير — صورة', category: 'image', defaultCredits: 20 },
  { key: 'operation:celebrity-mode:video', label: 'وضع المشاهير — فيديو', category: 'video', defaultCredits: 400 },
  { key: 'operation:vupscale', label: 'رفع جودة الفيديو', category: 'video', defaultCredits: 15 },
  { key: 'operation:ugc', label: 'محتوى UGC', category: 'video', defaultCredits: 13 },
  { key: 'operation:effects', label: 'تأثيرات الفيديو', category: 'video', defaultCredits: 12 },
  { key: 'operation:lipsync', label: 'مزامنة الشفاه', category: 'video', defaultCredits: 18 },
  { key: 'operation:resize', label: 'تحجيم الفيديو', category: 'video', defaultCredits: 12 },
  { key: 'operation:text-to-speech', label: 'التعليق الصوتي', category: 'audio', defaultCredits: 3 },
  { key: 'operation:dialogue-script', label: 'كتابة حوار صوتي', category: 'audio', defaultCredits: 3 },
  { key: 'operation:voice-clone', label: 'مطابقة النبرة', category: 'audio', defaultCredits: 8 },
  { key: 'model:lyria-3-clip-preview', label: 'Lyria 3 Clip', category: 'audio', defaultCredits: 10 },
  { key: 'model:lyria-3-pro-preview', label: 'Lyria 3 Pro', category: 'audio', defaultCredits: 15 },
];

export function modelPriceKey(modelId: string) {
  return `model:${modelId.replace(/^models\//, '')}`;
}

export function modelDurationPriceKey(modelId: string, duration: number) {
  return `${modelPriceKey(modelId)}:duration:${duration}`;
}

export const DEFAULT_AI_PRICING: Record<string, number> = {
  ...Object.fromEntries(PRICING_IMAGE_MODELS.map((model) => [modelPriceKey(model.id), model.baseCostCredits])),
  ...Object.fromEntries(PRICING_VIDEO_MODELS.flatMap((model) => [
    [modelPriceKey(model.id), model.baseCostCredits],
    ...Object.entries(model.creditsByDuration || {}).map(([duration, credits]) => [
      modelDurationPriceKey(model.id, Number(duration)),
      credits,
    ]),
  ])),
  ...Object.fromEntries(PRICING_OPERATIONS.map((operation) => [operation.key, operation.defaultCredits])),
};
