/**
 * 🤖 AI Models Configuration
 * هذا الملف يحتوي على جميع النماذج المتاحة وأسعارها
 * يتم استخدامه في صفحات توليد الصور والفيديو والتحريك والأدوات الذكية
 */

// ═══════════════════════════════════════════════════════════════════
// 🖼️ MODEL INTERFACES
// ═══════════════════════════════════════════════════════════════════

export interface AIModel {
  id: string;
  name: string;
  provider: 'google' | 'openai';
  description: string;
  desc?: string;
  quality: 'basic' | 'standard' | 'high' | 'ultra';
  speed: 'fast' | 'medium' | 'slow';
  baseCostCredits: number;
  creditsBySize?: Record<string, number>;
  icon?: string;
  badge?: string;
  isNew?: boolean;
  isPremium?: boolean;
  supportedResolutions?: string[];
  defaultResolution?: string;
}

export interface VideoModel extends AIModel {
  hasAudio: boolean;
  creditsByDuration: Record<number, number>;
  supportedDurations?: number[];
}

// ═══════════════════════════════════════════════════════════════════
// 🤖 GPT IMAGE MODELS (OpenAI Dedicated GPT Image Studio)
// ═══════════════════════════════════════════════════════════════════

export const GPT_IMAGE_MODELS: AIModel[] = [
  // OpenAI GPT Image 2 (ChatGPT Images 2.0)
  {
    id: 'gpt-image-2',
    name: 'GPT Image 2',
    provider: 'openai',
    description: 'الجيل الأحدث من OpenAI - استدلال بصري متقدم، دقة نصوص عالية، ودعم حتى 2K',
    quality: 'ultra',
    speed: 'fast',
    baseCostCredits: 16,
    creditsBySize: { '1024x1024': 16, '1792x1024': 18, '1024x1792': 18 },
    badge: '👑 GPT Image 2',
    isNew: true,
    isPremium: true,
  },
];

// ═══════════════════════════════════════════════════════════════════
// 🖼️ IMAGE MODELS (Cinematic Studio & General Image Generation)
// ═══════════════════════════════════════════════════════════════════

export const IMAGE_MODELS: AIModel[] = [
  // 1. Gemini 3 Pro Image (Arabic Specialist & Studio Quality)
  {
    id: 'gemini-3-pro-image',
    name: 'Gemini 3 Pro Image — Ultra Cinematic',
    provider: 'google',
    description: 'الخيار الاحترافي الأعلى للمهام المعقدة، الهوية البصرية، التخطيطات الدقيقة والنصوص العربية',
    quality: 'ultra',
    speed: 'medium',
    baseCostCredits: 30,
    creditsBySize: { '1024x1024': 30, '1792x1024': 32, '1024x1792': 32 },
    badge: '👑 Ultra Cinematic',
    isPremium: true,
    isNew: true,
    supportedResolutions: ['1K', '2K', '4K'],
    defaultResolution: '2K',
  },
  // 3. Gemini 3.1 Flash Image (Nano Banana Standard - 2026 Core Stack)
  {
    id: 'gemini-3.1-flash-image',
    name: 'Gemini 3.1 Flash Image',
    provider: 'google',
    description: 'Nano Banana 2: أفضل توازن عام بين الجودة والسرعة والتكلفة مع تحرير ومراجع متعددة',
    quality: 'high',
    speed: 'fast',
    baseCostCredits: 12,
    creditsBySize: { '1024x1024': 12, '1792x1024': 13, '1024x1792': 13 },
    badge: '⚡ 2026 Core',
    isNew: true,
    supportedResolutions: ['1K', '2K', '4K'],
    defaultResolution: '2K',
  },
  // 3. Gemini 3.1 Flash Lite Image
  {
    id: 'gemini-3.1-flash-lite-image',
    name: 'Gemini 3.1 Flash Lite Image',
    provider: 'google',
    description: 'أسرع وأوفر خيار إنتاجي للطلبات الكثيفة بدقة 1K',
    quality: 'standard',
    speed: 'fast',
    baseCostCredits: 7,
    creditsBySize: { '1024x1024': 7, '1792x1024': 7, '1024x1792': 7 },
    badge: '⚡ Lite',
    isNew: true,
    supportedResolutions: ['1K'],
    defaultResolution: '1K',
  },
];

// ═══════════════════════════════════════════════════════════════════
// 🎬 VIDEO MODELS (Text-to-Video & Video Studio)
// ═══════════════════════════════════════════════════════════════════

export const VIDEO_MODELS: VideoModel[] = [
  // 1. Gemini Omni 1.1 (Google's recommended default video model)
  {
    id: 'gemini-omni-1.1-flash',
    name: 'Gemini Omni 1.1 Flash',
    provider: 'google',
    description: 'الخيار الافتراضي الأذكى للفيديو: اتساق أعلى، مراجع متعددة وتحرير بالمحادثة مع صوت أصلي',
    quality: 'ultra',
    speed: 'fast',
    hasAudio: true,
    baseCostCredits: 45,
    creditsByDuration: { 4: 40, 6: 50, 8: 65, 10: 80, 20: 160, 30: 240, 40: 320 },
    supportedDurations: [4, 6, 8, 10, 20, 30, 40],
    supportedResolutions: ['720p', '1080p', '4k'],
    defaultResolution: '1080p',
    badge: 'موصى به',
    isNew: true,
  },
  // 2. Veo 3.1 Standard
  {
    id: 'veo-3.1-generate-preview',
    name: 'Veo 3.1 Standard',
    provider: 'google',
    description: 'أعلى خط Veo للواقعية السينمائية والتمديد الأصلي المتصل حتى 60 ثانية',
    quality: 'ultra',
    speed: 'medium',
    hasAudio: true,
    baseCostCredits: 85,
    creditsByDuration: { 4: 75, 6: 95, 8: 120, 20: 360, 30: 600, 40: 720, 60: 1080 },
    supportedDurations: [4, 6, 8, 20, 30, 40, 60],
    supportedResolutions: ['720p', '1080p', '4k'],
    defaultResolution: '1080p',
  },
  // 3. Veo 3.1 Fast Preview
  {
    id: 'veo-3.1-fast-generate-preview',
    name: 'Veo 3.1 Fast',
    provider: 'google',
    description: 'أفضل توازن بين الجودة والسرعة مع تمديد أصلي متصل حتى 60 ثانية',
    quality: 'high',
    speed: 'fast',
    hasAudio: true,
    baseCostCredits: 50,
    creditsByDuration: { 4: 50, 6: 60, 8: 75, 20: 225, 30: 375, 40: 450, 60: 675 },
    supportedDurations: [4, 6, 8, 20, 30, 40, 60],
    supportedResolutions: ['720p', '1080p', '4k'],
    defaultResolution: '1080p',
  },
  // 4. Veo 3.1 Lite
  {
    id: 'veo-3.1-lite-generate-preview',
    name: 'Veo 3.1 Lite',
    provider: 'google',
    description: 'الخيار الاقتصادي السريع للمعاينات والأحجام الكبيرة حتى 1080p',
    quality: 'standard',
    speed: 'fast',
    hasAudio: true,
    baseCostCredits: 40,
    creditsByDuration: { 4: 40, 6: 50, 8: 65 },
    supportedDurations: [4, 6, 8],
    supportedResolutions: ['720p', '1080p'],
    defaultResolution: '1080p',
  },
];

// ═══════════════════════════════════════════════════════════════════
// 🍌 NANO MODELS (Ultra-Fast Image Generation - Banana Stack)
// ═══════════════════════════════════════════════════════════════════

export const NANO_MODELS: AIModel[] = [
  // 🍌👑 Nano Banana Pro (Gemini 3 Pro Image)
  {
    id: 'gemini-3-pro-image',
    name: 'Nano Banana Pro',
    provider: 'google',
    description: 'جودة استوديو احترافية - الأفضل للنصوص العربية والتشكيل المعقد',
    quality: 'ultra',
    speed: 'medium',
    baseCostCredits: 30,
    creditsBySize: { '1024x1024': 30, '1792x1024': 30, '1024x1792': 30 },
    badge: '👑 Pro Studio',
    isPremium: true,
    isNew: true,
    supportedResolutions: ['1K', '2K', '4K'],
    defaultResolution: '2K',
  },
  // 🍌 Nano Banana Standard (Gemini 3.1 Flash Image)
  {
    id: 'gemini-3.1-flash-image',
    name: 'Nano Banana 2',
    provider: 'google',
    description: 'سرعة البرق مع دعم متطور للنصوص العربية وواقعية عالية (2026)',
    quality: 'high',
    speed: 'fast',
    baseCostCredits: 12,
    creditsBySize: { '1024x1024': 12, '1792x1024': 12, '1024x1792': 12 },
    badge: '⚡ Standard',
    isNew: true,
    supportedResolutions: ['1K', '2K', '4K'],
    defaultResolution: '2K',
  },
  // 🍌 Nano Banana 2 Lite
  {
    id: 'gemini-3.1-flash-lite-image',
    name: 'Nano Banana 2 Lite',
    provider: 'google',
    description: 'أسرع وأوفر خيار للمعاينات والإنتاج الكثيف بدقة 1K',
    quality: 'standard',
    speed: 'fast',
    baseCostCredits: 7,
    creditsBySize: { '1024x1024': 7, '1792x1024': 7, '1024x1792': 7 },
    badge: '⚡ Lite',
    isNew: true,
    supportedResolutions: ['1K'],
    defaultResolution: '1K',
  },
];

// ═══════════════════════════════════════════════════════════════════
// 🎬 LONG VIDEO MODELS
// ═══════════════════════════════════════════════════════════════════

export const LONG_VIDEO_MODELS: VideoModel[] = [
  {
    id: 'gemini-omni-1.1-flash',
    name: 'Gemini Omni 1.1 Flash',
    provider: 'google',
    description: 'توليد وتعديل الفيديو المتعدد الوسائط بالمحادثة مع صوت سينمائي متزامن 2026',
    quality: 'ultra',
    speed: 'fast',
    hasAudio: true,
    baseCostCredits: 60,
    creditsByDuration: { 4: 60, 6: 70, 8: 85, 10: 100 },
    supportedDurations: [4, 6, 8, 10],
    isPremium: true,
    badge: '👑 Omni 2026',
    isNew: true,
  },
  {
    id: 'models/veo-3.1-generate-preview',
    name: 'Veo 3.1 Ultra Omni',
    provider: 'google',
    description: 'أعلى جودة سينمائية بدقة فائقة مع صوت متزامن',
    quality: 'ultra',
    speed: 'slow',
    hasAudio: true,
    baseCostCredits: 125,
    creditsByDuration: { 4: 115, 6: 125, 8: 140 },
    supportedDurations: [4, 6, 8],
    isPremium: true,
    badge: '👑 Ultra Omni',
  },
  {
    id: 'models/veo-3.1-fast-generate-preview',
    name: 'Veo 3 Fast Preview',
    provider: 'google',
    description: 'سرعة عالية للإنتاج اليومي (Preview)',
    quality: 'high',
    speed: 'fast',
    hasAudio: true,
    baseCostCredits: 100,
    creditsByDuration: { 4: 100, 6: 110, 8: 115 },
    supportedDurations: [4, 6, 8],
    badge: '⚡',
  },
  {
    id: 'models/veo-3.1-lite-generate-preview',
    name: 'Veo 3 Lite',
    provider: 'google',
    description: 'الأساسي والأسرع للتوليد والمشاريع اليومية',
    quality: 'standard',
    speed: 'fast',
    hasAudio: true,
    baseCostCredits: 80,
    creditsByDuration: { 4: 80, 6: 90, 8: 100 },
    supportedDurations: [4, 6, 8],
    badge: 'Lite',
  },
];

// ═══════════════════════════════════════════════════════════════════
// 🎭 MOTION MODELS (Image-to-Video & Still Image Animation)
// ═══════════════════════════════════════════════════════════════════

export const MOTION_MODELS: VideoModel[] = [
  // 1. Google Gemini Omni Flash (Multimodal Motion + Audio)
  {
    id: 'gemini-omni-1.1-flash',
    name: 'Gemini Omni 1.1 Flash',
    provider: 'google',
    description: 'تحريك الصور الذكي وتوليد الصوت والمؤثرات المتزامنة طبيعياً مع المشهد',
    quality: 'ultra',
    speed: 'fast',
    hasAudio: true,
    baseCostCredits: 60,
    creditsByDuration: { 8: 60 },
    supportedDurations: [8],
    isPremium: true,
    badge: '👑 Omni 2026',
    isNew: true,
  },
  // 2. Google Veo 3.1 Ultra Omni Motion
  {
    id: 'models/veo-3.1-generate-preview',
    name: 'Veo 3.1 Ultra Omni',
    provider: 'google',
    description: 'تحريك سينمائي واقعي مذهل مع توليد أصوات وتأثيرات متناسقة مع الحركة',
    quality: 'ultra',
    speed: 'slow',
    hasAudio: true,
    baseCostCredits: 140,
    creditsByDuration: { 8: 140 },
    supportedDurations: [8],
    isPremium: true,
    badge: '👑 Ultra Omni (مع صوت)',
    isNew: true,
  },
  // 2. Google Veo 3.1 Fast Preview
  {
    id: 'models/veo-3.1-fast-generate-preview',
    name: 'Veo 3.1 Fast Preview',
    provider: 'google',
    description: 'سرعة عالية للإنتاج اليومي وحركات الكاميرا التفاعلية',
    quality: 'high',
    speed: 'fast',
    hasAudio: true,
    baseCostCredits: 115,
    creditsByDuration: { 8: 115 },
    supportedDurations: [8],
    badge: '⚡ Fast Preview',
  },
  // 3. Google Veo 3.1 Lite
  {
    id: 'models/veo-3.1-lite-generate-preview',
    name: 'Veo 3 Lite',
    provider: 'google',
    description: 'أساسي والتوليد السريع - جودة قياسية واقتصادية',
    quality: 'standard',
    speed: 'fast',
    hasAudio: true,
    baseCostCredits: 100,
    creditsByDuration: { 8: 100 },
    supportedDurations: [8],
    badge: 'Lite',
  },
];

// ═══════════════════════════════════════════════════════════════════
// 🛠️ HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

export function getModelById(models: AIModel[], id: string): AIModel | undefined {
  return models.find(m => m.id === id);
}

export function calculateImageCost(model: AIModel, size: string, profit: number = 0, resolution: string = '1K'): number {
  const baseCost = model?.creditsBySize?.[size] ?? model?.baseCostCredits ?? 10;
  let multiplier = 1;
  if (model.id.includes('gemini-3-pro-image') && resolution === '4K') multiplier = 1.8;
  if (model.id.includes('gemini-3.1-flash-image') && resolution === '2K') multiplier = 1.5;
  if (model.id.includes('gemini-3.1-flash-image') && resolution === '4K') multiplier = 2.25;
  return Math.ceil(Number(baseCost) * multiplier) + (Number(profit) || 0);
}

export function calculateVideoCost(model: VideoModel, duration: number, profit: number = 0, resolution: string = '720p'): number {
  let baseCost = model?.creditsByDuration?.[duration];
  if (baseCost === undefined && duration > 10 && model.id.includes('omni')) {
    baseCost = (model.creditsByDuration?.[10] ?? 80) * Math.ceil(duration / 10);
  }
  if (baseCost === undefined && duration > 8 && model.id.includes('veo-3.1') && !model.id.includes('lite')) {
    baseCost = (model.creditsByDuration?.[8] ?? model.baseCostCredits ?? 60) * (1 + Math.ceil((duration - 8) / 7));
  }
  baseCost = baseCost ?? model?.baseCostCredits ?? 60;
  let multiplier = 1;
  if (model.id.includes('veo-3.1-generate') && resolution === '4k') multiplier = 1.5;
  if (model.id.includes('fast') && resolution === '1080p') multiplier = 1.2;
  if (model.id.includes('fast') && resolution === '4k') multiplier = 3;
  if (model.id.includes('lite') && resolution === '1080p') multiplier = 1.6;
  return Math.ceil(Number(baseCost) * multiplier) + (Number(profit) || 0);
}

// ═══════════════════════════════════════════════════════════════════
// 🔄 DYNAMIC SYNC
// ═══════════════════════════════════════════════════════════════════

export function syncModelsWithDynamicPricing(
  sourceModels: AIModel[], 
  dynamicPrices: Record<string, number>
): AIModel[] {
  if (!dynamicPrices || Object.keys(dynamicPrices).length === 0) return sourceModels;

  return sourceModels.map(m => {
    const updated = JSON.parse(JSON.stringify(m)); // Deep clone
    
    let priceKey = '';
    
    if (updated.name.toLowerCase().includes('nano')) {
      if (updated.id.includes('flash') || updated.name.toLowerCase().includes('standard')) {
        priceKey = 'nano-standard';
      } else if (updated.id.includes('gemini-3') || updated.id.includes('pro-image-preview') || updated.name.toLowerCase().includes('pro')) {
        priceKey = 'nano-pro';
      } else {
        priceKey = 'nano-standard';
      }
    } else if (updated.id.includes('imagen-4.0-ultra')) {
      priceKey = 'imagen-4-ultra';
    } else if (updated.id.includes('imagen-4')) {
      priceKey = 'imagen-4';
    } else if (updated.id.includes('imagen-3')) {
      priceKey = 'imagen-3';
    }
    
    const canonicalId = updated.id.replace(/^models\//, '');
    const dynamicBase = dynamicPrices[`model:${canonicalId}`] ?? dynamicPrices[canonicalId] ?? dynamicPrices[priceKey];
    if (dynamicBase !== undefined && dynamicBase !== null) {
      const originalBase = m.baseCostCredits;
      updated.baseCostCredits = dynamicBase;
      
      if (updated.creditsBySize) {
        Object.keys(updated.creditsBySize).forEach(size => {
          const sizePrice = m.creditsBySize![size] || originalBase;
          const diff = sizePrice - originalBase;
          updated.creditsBySize![size] = dynamicBase + diff;
        });
      }
    }
    return updated;
  });
}

export function syncVideoWithDynamicPricing(
  sourceModels: VideoModel[],
  dynamicPrices: Record<string, number>
): VideoModel[] {
  if (!dynamicPrices || Object.keys(dynamicPrices).length === 0) return sourceModels;

  return sourceModels.map(m => {
    const updated = JSON.parse(JSON.stringify(m)); // Deep clone
    let modelKey = updated.id.includes('omni') ? 'gemini-omni-1.1' :
                   updated.id.includes('lite') ? 'veo-lite' :
                   updated.id.includes('fast') ? 'veo-fast' :
                   updated.id.includes('generate-preview') ? 'veo-ultra' : 'veo-pro';
    
    const canonicalId = updated.id.replace(/^models\//, '');
    const genericPrice = dynamicPrices[`model:${canonicalId}`] ?? dynamicPrices[canonicalId] ?? dynamicPrices[modelKey];
    if (genericPrice !== undefined && genericPrice !== null) {
      const originalBase = m.baseCostCredits;
      const diff = genericPrice - originalBase;
      updated.baseCostCredits = genericPrice;
      
      if (updated.creditsByDuration) {
        Object.keys(updated.creditsByDuration).forEach(dur => {
           const dKey = parseInt(dur);
           updated.creditsByDuration[dKey] = m.creditsByDuration[dKey] + diff;
        });
      }
    }

    if (updated.creditsByDuration) {
      Object.keys(updated.creditsByDuration).forEach(dur => {
        const dPrice = dynamicPrices[`model:${canonicalId}:duration:${dur}`] ?? dynamicPrices[`${modelKey}-${dur}`];
        if (dPrice !== undefined && dPrice !== null) {
          updated.creditsByDuration[parseInt(dur)] = dPrice;
          if (parseInt(dur) === 4) updated.baseCostCredits = dPrice;
        }
      });
    }
    
    return updated;
  });
}

export function getQualityColor(quality: string): string {
  switch (quality) {
    case 'ultra': return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
    case 'high': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    case 'standard': return 'text-green-400 bg-green-500/10 border-green-500/30';
    default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
  }
}

export function getSpeedColor(speed: string): string {
  switch (speed) {
    case 'fast': return 'text-yellow-400';
    case 'medium': return 'text-blue-400';
    case 'slow': return 'text-gray-400';
    default: return 'text-gray-400';
  }
}

export function getProviderIcon(provider: string): string {
  return provider === 'openai' ? '🤖' : '🔷';
}
