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
  derivedFrom?: {
    modelId: string;
    duration?: number;
    resolution?: string;
  };
}

const uniqueById = <T extends { id: string }>(items: T[]): T[] =>
  Array.from(new Map(items.map((item) => [item.id.replace(/^models\//, ''), { ...item, id: item.id.replace(/^models\//, '') }])).values());

/**
 * A video model can be selectable in the regular video, long-video and motion
 * tools. Merge those capabilities instead of letting the last duplicate erase
 * the full duration schedule (motion models commonly expose only 8 seconds).
 */
const mergeVideoModels = (items: VideoModel[]): VideoModel[] => {
  const models = new Map<string, VideoModel>();

  items.forEach((item) => {
    const id = item.id.replace(/^models\//, '');
    const existing = models.get(id);
    if (!existing) {
      models.set(id, {
        ...item,
        id,
        creditsByDuration: { ...item.creditsByDuration },
        supportedDurations: [...(item.supportedDurations || Object.keys(item.creditsByDuration).map(Number))],
        supportedResolutions: [...(item.supportedResolutions || [])],
      });
      return;
    }

    existing.creditsByDuration = {
      ...item.creditsByDuration,
      ...existing.creditsByDuration,
    };
    existing.supportedDurations = Array.from(new Set([
      ...(existing.supportedDurations || []),
      ...(item.supportedDurations || Object.keys(item.creditsByDuration).map(Number)),
    ])).sort((a, b) => a - b);
    existing.supportedResolutions = Array.from(new Set([
      ...(existing.supportedResolutions || []),
      ...(item.supportedResolutions || []),
    ]));
  });

  return Array.from(models.values());
};

/** Every image model that is selectable in the product. */
export const PRICING_IMAGE_MODELS: AIModel[] = uniqueById([
  ...IMAGE_MODELS,
  ...NANO_MODELS,
  ...GPT_IMAGE_MODELS,
]);

/** Every video model that is selectable in video, long-video, or motion. */
export const PRICING_VIDEO_MODELS: VideoModel[] = uniqueById([
  ...mergeVideoModels([
    ...VIDEO_MODELS,
    ...LONG_VIDEO_MODELS,
    ...MOTION_MODELS,
  ]),
]);

/** Fixed-price operations. Model-backed generation is priced in the model sections. */
const PRO_IMAGE = { modelId: 'gemini-3-pro-image' };
const OMNI_VIDEO_6S = { modelId: 'gemini-omni-1.1-flash', duration: 6, resolution: '720p' };

export const PRICING_OPERATIONS: PricingOperation[] = [
  { key: 'operation:product-models', label: 'استوديو المنتجات', category: 'image', defaultCredits: 30, derivedFrom: PRO_IMAGE },
  { key: 'operation:sketch-to-image', label: 'الرسم إلى صورة', category: 'image', defaultCredits: 30, derivedFrom: PRO_IMAGE },
  { key: 'operation:image-edit', label: 'المحرر الذكي', category: 'image', defaultCredits: 30, derivedFrom: PRO_IMAGE },
  { key: 'operation:photo-restore', label: 'ترميم الصور', category: 'image', defaultCredits: 30, derivedFrom: PRO_IMAGE },
  { key: 'operation:photo-colorize', label: 'تلوين الصور', category: 'image', defaultCredits: 30, derivedFrom: PRO_IMAGE },
  { key: 'operation:background-remove', label: 'إزالة الخلفية', category: 'image', defaultCredits: 30, derivedFrom: PRO_IMAGE },
  { key: 'operation:clothes-extraction', label: 'استخراج الملابس', category: 'image', defaultCredits: 30, derivedFrom: PRO_IMAGE },
  { key: 'operation:id-photo', label: 'الصور الشخصية الرسمية', category: 'image', defaultCredits: 30, derivedFrom: PRO_IMAGE },
  { key: 'operation:relight', label: 'إعادة الإضاءة', category: 'image', defaultCredits: 30, derivedFrom: PRO_IMAGE },
  { key: 'operation:clothes-swap', label: 'تغيير الملابس', category: 'image', defaultCredits: 30, derivedFrom: PRO_IMAGE },
  { key: 'operation:hairstyle', label: 'تغيير قصة الشعر', category: 'image', defaultCredits: 30, derivedFrom: PRO_IMAGE },
  { key: 'operation:image-upscale', label: 'رفع جودة الصور', category: 'image', defaultCredits: 30, derivedFrom: PRO_IMAGE },
  { key: 'operation:image-to-prompt', label: 'فهم واستخراج الصور', category: 'image', defaultCredits: 2 },
  { key: 'operation:logo-creation', label: 'صانع الشعارات', category: 'image', defaultCredits: 30, derivedFrom: PRO_IMAGE },
  { key: 'operation:avatar-creation', label: 'صانع الأفاتار', category: 'image', defaultCredits: 30, derivedFrom: PRO_IMAGE },
  { key: 'operation:age-journey:image', label: 'رحلة العمر — صورة', category: 'image', defaultCredits: 30, derivedFrom: PRO_IMAGE },
  { key: 'operation:age-journey:video', label: 'رحلة العمر — فيديو', category: 'video', defaultCredits: 50, derivedFrom: OMNI_VIDEO_6S },
  { key: 'operation:fisheye-night:image', label: 'الرؤية الليلية — صورة', category: 'image', defaultCredits: 30, derivedFrom: PRO_IMAGE },
  { key: 'operation:fisheye-night:video', label: 'الرؤية الليلية — فيديو', category: 'video', defaultCredits: 50, derivedFrom: OMNI_VIDEO_6S },
  { key: 'operation:celebrity-mode:image', label: 'وضع المشاهير — صورة', category: 'image', defaultCredits: 30, derivedFrom: PRO_IMAGE },
  { key: 'operation:celebrity-mode:video', label: 'وضع المشاهير — فيديو', category: 'video', defaultCredits: 50, derivedFrom: OMNI_VIDEO_6S },
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

export function linkedOperationPrice(
  operation: PricingOperation,
  prices: Record<string, number>,
): number {
  if (!operation.derivedFrom) return Number(prices[operation.key] ?? operation.defaultCredits);

  const { modelId, duration, resolution = '720p' } = operation.derivedFrom;
  const model = PRICING_VIDEO_MODELS.find((item) => item.id === modelId);
  let price = duration === undefined
    ? Number(prices[modelPriceKey(modelId)] ?? operation.defaultCredits)
    : Number(
      prices[modelDurationPriceKey(modelId, duration)]
      ?? model?.creditsByDuration?.[duration]
      ?? prices[modelPriceKey(modelId)]
      ?? model?.baseCostCredits
      ?? operation.defaultCredits,
    );

  if (modelId.includes('veo-3.1-generate') && resolution === '4k') price *= 1.5;
  if (modelId.includes('fast') && resolution === '1080p') price *= 1.2;
  if (modelId.includes('fast') && resolution === '4k') price *= 3;
  if (modelId.includes('lite') && resolution === '1080p') price *= 1.6;
  return Math.ceil(price);
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
  ...Object.fromEntries(PRICING_OPERATIONS
    .filter((operation) => !operation.derivedFrom)
    .map((operation) => [operation.key, operation.defaultCredits])),
};
