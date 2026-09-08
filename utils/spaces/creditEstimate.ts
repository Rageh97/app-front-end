import type { SpacesNode } from '@/stores/spacesStore';

const VIDEO_SCHEDULES: Record<string, Record<number, number>> = {
  omni: { 4: 40, 6: 50, 8: 65, 10: 80 },
  lite: { 4: 40, 6: 50, 8: 65 },
  fast: { 4: 50, 6: 60, 8: 75 },
  pro: { 4: 75, 6: 95, 8: 120 },
};

function estimateImage(data: SpacesNode['data']): number {
  const model = String(data.modelId || 'gemini-3.1-flash-image').toLowerCase();
  const resolution = String(data.resolution || '1K').toUpperCase();

  if (model.includes('flash-lite-image')) return 7;
  if (model.includes('gemini-3-pro-image') || model.includes('pro-image')) {
    return resolution === '4K' ? 54 : 30;
  }
  if (model.includes('gemini-3.1-flash-image')) {
    if (resolution === '4K') return 27;
    if (resolution === '2K') return 18;
    return 12;
  }
  return data.creditsCost || 13;
}

function estimateVideo(data: SpacesNode['data']): number {
  const model = String(data.modelId || 'gemini-omni-1.1-flash').toLowerCase();
  const duration = Number(data.duration || 8);
  const resolution = String(data.resolution || '720p').toLowerCase();
  const family = model.includes('omni')
    ? 'omni'
    : model.includes('lite')
      ? 'lite'
      : model.includes('fast')
        ? 'fast'
        : 'pro';

  const schedule = VIDEO_SCHEDULES[family];
  let cost = schedule[duration] || schedule[8];
  if (family === 'pro' && resolution === '4k') cost = Math.ceil(cost * 1.5);
  if (family === 'fast' && resolution === '1080p') cost = Math.ceil(cost * 1.2);
  if (family === 'fast' && resolution === '4k') cost = Math.ceil(cost * 3);
  if (family === 'lite' && resolution === '1080p') cost = Math.ceil(cost * 1.6);
  return cost;
}

/** Mirrors the backend's default base pricing. Admin profit/dynamic pricing may change the final debit. */
export function estimateNodeCredits(node: SpacesNode): number {
  switch (node.type) {
    case 'imageGen': return estimateImage(node.data);
    case 'product': return 13;
    case 'avatar': return 12;
    case 'upscale': return 12;
    case 'bgRemove': return 11;
    case 'restore': return 11;
    case 'colorize': return 11;
    case 'imageTool': return node.data.creditsCost || 12;
    case 'videoGen':
    case 'motion': return estimateVideo(node.data);
    case 'tts': return 3;
    case 'textPrompt':
    case 'imageUpload':
    case 'output': return 0;
    default: return node.data.creditsCost || 0;
  }
}
