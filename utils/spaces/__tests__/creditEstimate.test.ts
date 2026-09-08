import { describe, expect, it } from 'vitest';
import type { SpacesNode } from '@/stores/spacesStore';
import { estimateNodeCredits } from '../creditEstimate';

const node = (type: string, data: Partial<SpacesNode['data']> = {}): SpacesNode => ({
  id: `node-${type}`,
  type,
  position: { x: 0, y: 0 },
  data: { title: type, category: 'image', status: 'idle', ...data },
});

describe('Spaces credit estimates', () => {
  it('tracks image model and resolution changes', () => {
    expect(estimateNodeCredits(node('imageGen', {
      modelId: 'gemini-3-pro-image', resolution: '4K',
    }))).toBe(54);
    expect(estimateNodeCredits(node('imageGen', {
      modelId: 'gemini-3.1-flash-image', resolution: '2K',
    }))).toBe(18);
  });

  it('tracks video family, duration, and resolution changes', () => {
    expect(estimateNodeCredits(node('videoGen', {
      category: 'video', modelId: 'gemini-omni-1.1-flash', duration: 4, resolution: '1080p',
    }))).toBe(40);
    expect(estimateNodeCredits(node('videoGen', {
      category: 'video', modelId: 'veo-3.1-fast-generate-preview', duration: 8, resolution: '1080p',
    }))).toBe(90);
  });

  it('uses the backend default base cost for image editing tools', () => {
    expect(estimateNodeCredits(node('bgRemove'))).toBe(11);
    expect(estimateNodeCredits(node('upscale'))).toBe(12);
    expect(estimateNodeCredits(node('avatar'))).toBe(12);
  });
});

