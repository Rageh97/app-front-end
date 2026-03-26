/**
 * 🤖 AI Models Configuration
 * هذا الملف يحتوي على جميع النماذج المتاحة وأسعارها
 * يتم استخدامه في صفحات توليد الصور والفيديو
 */

// ═══════════════════════════════════════════════════════════════════
// 🖼️ IMAGE GENERATION MODELS
// ═══════════════════════════════════════════════════════════════════

export interface AIModel {
  id: string;
  name: string;
  provider: 'google' | 'openai';
  description: string;
  quality: 'basic' | 'standard' | 'high' | 'ultra';
  speed: 'fast' | 'medium' | 'slow';
  baseCostCredits: number;
  creditsBySize?: Record<string, number>;
  icon?: string;
  badge?: string;
  isNew?: boolean;
  isPremium?: boolean;
}

export interface VideoModel extends AIModel {
  hasAudio: boolean;
  creditsByDuration: Record<number, number>;
  supportedDurations?: number[];
}

// ═══════════════════════════════════════════════════════════════════
// 🖼️ IMAGE MODELS
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// 🖼️ IMAGE MODELS
// ═══════════════════════════════════════════════════════════════════

export const IMAGE_MODELS: AIModel[] = [
  // Google Imagen 4 Ultra
  {
    id: 'imagen-4.0-ultra-generate-001',
    name: 'Imagen 4 Ultra',
    provider: 'google',
    description: 'أعلى جودة ممكنة',
    quality: 'ultra',
    speed: 'slow',
    baseCostCredits: 16,
    creditsBySize: { '1024x1024': 16, '1792x1024': 18, '1024x1792': 18 },
    badge: 'Ultra',
    isPremium: true,
  },
  // Google Imagen 4
  {
    id: 'imagen-4.0-generate-001',
    name: 'Imagen 4',
    provider: 'google',
    description: 'جودة عالية متوازنة',
    quality: 'high',
    speed: 'medium',
    baseCostCredits: 14,
    creditsBySize: { '1024x1024': 14, '1792x1024': 15, '1024x1792': 15 },
    isNew: true,
  },
  {
    id: 'imagen-4.0-fast-generate-001',
    name: 'Imagen 4 Fast',
    provider: 'google',
    description: 'سريع جداً',
    quality: 'standard',
    speed: 'fast',
    baseCostCredits: 12,
    creditsBySize: { '1024x1024': 12, '1792x1024': 13, '1024x1792': 13 },
    badge: '⚡',
  },
  // Google Imagen 3
  {
    id: 'imagen-3.0-generate-001',
    name: 'Imagen 3',
    provider: 'google',
    description: 'جودة ممتازة وموثوقة',
    quality: 'high',
    speed: 'medium',
    baseCostCredits: 13,
    creditsBySize: { '1024x1024': 13, '1792x1024': 14, '1024x1792': 14 },
  },
  {
    id: 'imagen-3.0-fast-generate-001',
    name: 'Imagen 3 Fast',
    provider: 'google',
    description: 'سريع واقتصادي',
    quality: 'standard',
    speed: 'fast',
    baseCostCredits: 12,
    creditsBySize: { '1024x1024': 12, '1792x1024': 13, '1024x1792': 13 },
  },
  // OpenAI DALL-E
  {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    provider: 'openai',
    description: 'OpenAI - إبداعي ومميز',
    quality: 'high',
    speed: 'medium',
    baseCostCredits: 14,
    creditsBySize: { '1024x1024': 14, '1792x1024': 15, '1024x1792': 15 },
    badge: 'OpenAI',
  },
];

// ═══════════════════════════════════════════════════════════════════
// 🎬 VIDEO MODELS
// ═══════════════════════════════════════════════════════════════════

export const VIDEO_MODELS: VideoModel[] = [
  // Google Veo 3.1 Ultra (Preview)
  // Vertex AI Veo supports: 4, 6, 8 seconds for text-to-video
  {
    id: 'veo-3.1-generate-preview',
    name: 'Veo Ultra',
    provider: 'google',
    description: 'أعلى جودة سينمائية - 4K (توليد وتمديد)',
    quality: 'ultra',
    speed: 'slow',
    hasAudio: true,
    baseCostCredits: 125,
    creditsByDuration: { 4: 115, 6: 125, 8: 140 },
    supportedDurations: [4, 6, 8],
    isPremium: true,
    badge: 'Ultra',
  },
  {
    id: 'veo-3.1-generate-001',
    name: 'Veo Pro',
    provider: 'google',
    description: 'جودة احترافية متزنة',
    quality: 'ultra',
    speed: 'slow',
    hasAudio: true,
    baseCostCredits: 120,
    creditsByDuration: { 4: 110, 6: 120, 8: 130 },
    supportedDurations: [4, 6, 8],
    isPremium: true,
  },
  {
    id: 'veo-3.1-fast-generate-001',
    name: 'Veo Fast',
    provider: 'google',
    description: 'سرعة عالية للإنتاج اليومي',
    quality: 'high',
    speed: 'fast',
    hasAudio: true,
    baseCostCredits: 110,
    creditsByDuration: { 4: 100, 6: 110, 8: 115 },
    supportedDurations: [4, 6, 8],
    badge: '⚡',
  },
  // OpenAI Sora 2.0
  // Sora 2 API supports: 4, 8, 12 seconds
  {
    id: 'sora',
    name: 'Sora 2.0',
    provider: 'openai',
    description: 'OpenAI - توليد فيديو احترافي',
    quality: 'ultra',
    speed: 'slow',
    hasAudio: false,
    baseCostCredits: 150,
    creditsByDuration: { 4: 150, 8: 190, 12: 230 },
    supportedDurations: [4, 8, 12],
    badge: 'OpenAI',
    isPremium: true,
  },
  // OpenAI Sora 2 Pro - Extended durations
  // Sora 2 Pro API supports: 5, 10, 15, 20 seconds
  {
    id: 'sora-2-pro',
    name: 'Sora 2 Pro',
    provider: 'openai',
    description: 'OpenAI - فيديوهات أطول حتى 20 ثانية',
    quality: 'ultra',
    speed: 'slow',
    hasAudio: false,
    baseCostCredits: 180,
    creditsByDuration: { 5: 180, 10: 220, 15: 280, 20: 350 },
    supportedDurations: [5, 10, 15, 20],
    badge: 'Pro',
    isPremium: true,
  },
];

// ═══════════════════════════════════════════════════════════════════
// 🍌 NANO MODELS (Fast image generation)
// ═══════════════════════════════════════════════════════════════════

export const NANO_MODELS: AIModel[] = [
  // 🍌👑 Nano Banana Pro (Gemini 3 Pro Image)
  {
    id: 'gemini-3-pro-image-preview',
    name: 'Nano Banana Pro',
    provider: 'google',
    description: 'جودة استوديو احترافية - الأفضل للنصوص العربية المعقدة',
    quality: 'ultra',
    speed: 'medium',
    baseCostCredits: 30,
    creditsBySize: { '1024x1024': 30, '1792x1024': 30, '1024x1792': 30 },
    badge: 'Pro',
    isPremium: true,
  },
  // 🍌 Nano Banana Standard (Gemini 3.1 Flash Image)
  {
    id: 'gemini-3.1-flash-image-preview',
    name: 'Nano Banana Standard',
    provider: 'google',
    description: 'سرعة البرق مع دعم متطور للنصوص العربية (2026)',
    quality: 'high',
    speed: 'fast',
    baseCostCredits: 12,
    creditsBySize: { '1024x1024': 12, '1792x1024': 12, '1024x1792': 12 },
    badge: '⚡',
    isNew: true,
  },
];

// ═══════════════════════════════════════════════════════════════════
// 🎬 LONG VIDEO MODELS
// ═══════════════════════════════════════════════════════════════════

export const LONG_VIDEO_MODELS: VideoModel[] = [
  // Vertex AI Veo supports: 4, 6, 8 seconds for text-to-video
  {
    id: 'veo-3.1-generate-preview',
    name: 'Veo Ultra',
    provider: 'google',
    description: 'أعلى جودة سينمائية - 4K (توليد وتمديد)',
    quality: 'ultra',
    speed: 'slow',
    hasAudio: true,
    baseCostCredits: 125,
    creditsByDuration: { 4: 115, 6: 125, 8: 140 },
    supportedDurations: [4, 6, 8],
    isPremium: true,
    badge: 'Ultra',
  },
  {
    id: 'veo-3.1-generate-001',
    name: 'Veo Pro',
    provider: 'google',
    description: 'جودة احترافية متزنة',
    quality: 'ultra',
    speed: 'slow',
    hasAudio: true,
    baseCostCredits: 120,
    creditsByDuration: { 4: 110, 6: 120, 8: 130 },
    supportedDurations: [4, 6, 8],
    isPremium: true,
  },
  {
    id: 'veo-3.1-fast-generate-001',
    name: 'Veo Fast',
    provider: 'google',
    description: 'سرعة عالية للإنتاج اليومي',
    quality: 'high',
    speed: 'fast',
    hasAudio: true,
    baseCostCredits: 110,
    creditsByDuration: { 4: 100, 6: 110, 8: 115 },
    supportedDurations: [4, 6, 8],
    badge: '⚡',
  },
  // Sora API supports: 4, 8, 12 seconds
  {
    id: 'sora',
    name: 'Sora 2.0',
    provider: 'openai',
    description: 'OpenAI - توليد فيديو احترافي',
    quality: 'ultra',
    speed: 'slow',
    hasAudio: false,
    baseCostCredits: 150,
    creditsByDuration: { 4: 150, 8: 190, 12: 230 },
    supportedDurations: [4, 8, 12],
    badge: 'OpenAI',
    isPremium: true,
  },
  // Sora 2 Pro API supports: 5, 10, 15, 20 seconds
  {
    id: 'sora-2-pro',
    name: 'Sora 2 Pro',
    provider: 'openai',
    description: 'OpenAI - فيديوهات أطول حتى 20 ثانية',
    quality: 'ultra',
    speed: 'slow',
    hasAudio: false,
    baseCostCredits: 180,
    creditsByDuration: { 5: 180, 10: 220, 15: 280, 20: 350 },
    supportedDurations: [5, 10, 15, 20],
    badge: 'Pro',
    isPremium: true,
  },
];

// ═══════════════════════════════════════════════════════════════════
// 🎭 MOTION MODELS
// ═══════════════════════════════════════════════════════════════════

export const MOTION_MODELS: VideoModel[] = [
  // IMPORTANT: Vertex AI Veo STRICTLY requires 8 seconds for image-to-video (motion/reference images)
  // This is a hard API requirement - 5s or 6s will FAIL
  {
    id: 'veo-3.1-generate-preview',
    name: 'Veo Ultra',
    provider: 'google',
    description: 'أعلى جودة سينمائية - 4K (تحريك الصور)',
    quality: 'ultra',
    speed: 'slow',
    hasAudio: true,
    baseCostCredits: 140,
    creditsByDuration: { 8: 140 },
    supportedDurations: [8],
    isPremium: true,
    badge: 'Ultra',
  },
  {
    id: 'veo-3.1-generate-001',
    name: 'Veo Pro',
    provider: 'google',
    description: 'جودة احترافية متزنة وتحويل رائع للحركة',
    quality: 'ultra',
    speed: 'slow',
    hasAudio: true,
    baseCostCredits: 130,
    creditsByDuration: { 8: 130 },
    supportedDurations: [8],
    isPremium: true,
  },
  {
    id: 'veo-3.1-fast-generate-001',
    name: 'Veo Fast',
    provider: 'google',
    description: 'سرعة عالية للإنتاج اليومي والحركات السريعة',
    quality: 'high',
    speed: 'fast',
    hasAudio: true,
    baseCostCredits: 115,
    creditsByDuration: { 8: 115 },
    supportedDurations: [8],
    badge: '⚡',
  },
  // Sora API supports: 4, 8, 12 seconds for motion/image input
  // {
  //   id: 'sora',
  //   name: 'Sora 2.0',
  //   provider: 'openai',
  //   description: 'تحريك الصور بذكاء Sora',
  //   quality: 'ultra',
  //   speed: 'slow',
  //   hasAudio: false,
  //   baseCostCredits: 150,
  //   creditsByDuration: { 4: 150, 8: 190, 12: 230 },
  //   supportedDurations: [4, 8, 12],
  //   badge: 'OpenAI',
  //   isPremium: true,
  // },
  // // Sora 2 Pro API supports: 5, 10, 15, 20 seconds
  // {
  //   id: 'sora-2-pro',
  //   name: 'Sora 2 Pro',
  //   provider: 'openai',
  //   description: 'تحريك الصور - فيديوهات أطول',
  //   quality: 'ultra',
  //   speed: 'slow',
  //   hasAudio: false,
  //   baseCostCredits: 180,
  //   creditsByDuration: { 5: 180, 10: 220, 15: 280, 20: 350 },
  //   supportedDurations: [5, 10, 15, 20],
  //   badge: 'Pro',
  //   isPremium: true,
  // },
];

// ═══════════════════════════════════════════════════════════════════
// 🛠️ HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

export function getModelById(models: AIModel[], id: string): AIModel | undefined {
  return models.find(m => m.id === id);
}

export function calculateImageCost(model: AIModel, size: string, profit: number): number {
  const baseCost = model.creditsBySize?.[size] ?? model.baseCostCredits;
  return baseCost + profit;
}

export function calculateVideoCost(model: VideoModel, duration: number, profit: number): number {
  const baseCost = model.creditsByDuration?.[duration] ?? model.baseCostCredits;
  return baseCost + profit;
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
    
    // Define a simplified key mapping for images
    let priceKey = '';
    
    // Check for nano specifically first if it's a nano model
    // Map each Nano model to its specific pricing key
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
    } else if (updated.id.includes('dall-e-3')) {
      priceKey = 'dall-e-3';
    }
    
    const dynamicBase = dynamicPrices[priceKey];
    if (dynamicBase !== undefined && dynamicBase !== null) {
      const originalBase = m.baseCostCredits;
      updated.baseCostCredits = dynamicBase;
      
      if (updated.creditsBySize) {
        // Adjust size prices proportionally
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
    let modelKey = updated.id.includes('preview') || updated.id.includes('ultra') ? 'veo-ultra' :
                   updated.id.includes('fast') ? 'veo-fast' :
                   updated.id === 'sora-2-pro' ? 'sora-pro' :
                   updated.id.includes('sora') ? 'sora' : 'veo-pro';
    
    // Check for generic price override (Base Cost)
    const genericPrice = dynamicPrices[modelKey];
    if (genericPrice !== undefined && genericPrice !== null) {
      const originalBase = m.baseCostCredits;
      const diff = genericPrice - originalBase;
      updated.baseCostCredits = genericPrice;
      
      // Apply difference to all durations conceptually, unless specific override exists
      if (updated.creditsByDuration) {
        Object.keys(updated.creditsByDuration).forEach(dur => {
           const dKey = parseInt(dur);
           updated.creditsByDuration[dKey] = m.creditsByDuration[dKey] + diff;
        });
      }
    }

    // Update credits by specific durations if found in dynamic config (Overrides generic)
    if (updated.creditsByDuration) {
      Object.keys(updated.creditsByDuration).forEach(dur => {
        const dPrice = dynamicPrices[`${modelKey}-${dur}`];
        if (dPrice !== undefined && dPrice !== null) {
          updated.creditsByDuration[parseInt(dur)] = dPrice;
          // Use shortest duration as base cost (4 for Veo/Sora now)
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
