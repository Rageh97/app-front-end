import { describe, expect, it } from 'vitest';
import {
  GPT_IMAGE_MODELS,
  IMAGE_MODELS,
  LONG_VIDEO_MODELS,
  MOTION_MODELS,
  NANO_MODELS,
  VIDEO_MODELS,
  syncModelsWithDynamicPricing,
  syncVideoWithDynamicPricing,
} from '../ai-models-config';
import { DEFAULT_AI_PRICING, modelDurationPriceKey, modelPriceKey } from '../ai-pricing-catalog';

describe('central AI pricing catalog', () => {
  it('contains a direct key for every selectable image and video model', () => {
    const models = [
      ...IMAGE_MODELS, ...NANO_MODELS, ...GPT_IMAGE_MODELS,
      ...VIDEO_MODELS, ...LONG_VIDEO_MODELS, ...MOTION_MODELS,
    ];
    for (const model of models) expect(DEFAULT_AI_PRICING[modelPriceKey(model.id)]).toBeTypeOf('number');
  });

  it('prefers exact model and duration IDs over legacy aliases', () => {
    const image = syncModelsWithDynamicPricing(GPT_IMAGE_MODELS, {
      [modelPriceKey('gpt-image-2')]: 27,
    });
    expect(image[0].baseCostCredits).toBe(27);

    const source = VIDEO_MODELS.filter((model) => model.id === 'veo-3.1-fast-generate-preview');
    const video = syncVideoWithDynamicPricing(source, {
      'veo-fast-8': 70,
      [modelPriceKey(source[0].id)]: 55,
      [modelDurationPriceKey(source[0].id, 8)]: 91,
    });
    expect(video[0].baseCostCredits).toBe(55);
    expect(video[0].creditsByDuration[8]).toBe(91);
  });
});
