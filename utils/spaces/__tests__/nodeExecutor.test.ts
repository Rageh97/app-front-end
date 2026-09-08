import { beforeEach, describe, expect, it, vi } from 'vitest';
import { executeNode } from '../nodeExecutor';

const jsonResponse = (payload: any, status = 200) => new Response(JSON.stringify(payload), {
  status,
  headers: { 'Content-Type': 'application/json' },
});

describe('Spaces node API contracts', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('sends the current premium image model, requested 4K resolution and real size field', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({
      success: true, image_id: 41, image_url: 'https://cdn.test/image.png',
    }));
    const result = await executeNode('imageGen', {
      title: 'image', category: 'image', status: 'idle', prompt: 'cinematic city',
      modelId: 'gemini-3-pro-image', resolution: '4K', aspectRatio: '16:9',
    }, { apiBase: 'https://api.test', inputs: {} });

    const request = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(request).toMatchObject({ model: 'gemini-3-pro-image', resolution: '4K', size: '1792x1024' });
    expect(result).toMatchObject({ success: true, mediaId: 41, output: { type: 'image' } });
  });

  it('uses the backend product-models contract', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({
      success: true, image_id: 8, image_url: '/media/product.png',
    }));
    await executeNode('product', {
      title: 'product', category: 'image', status: 'idle', style: 'luxury',
    }, { apiBase: 'https://api.test', inputs: { imageUrl: 'data:image/png;base64,AAAA' } });

    const request = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(request.product_image).toBe('data:image/png;base64,AAAA');
    expect(request.background).toBe('luxury');
    expect(request.image).toBeUndefined();
  });

  it('uses the exact motion payload and current Omni model', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ success: true, video_id: 1, video_url: '/motion.mp4' }));

    await executeNode('motion', {
      title: 'motion', category: 'video', status: 'idle', modelId: 'gemini-omni-1.1-flash',
    }, { apiBase: 'https://api.test', inputs: { imageUrl: 'data:image/png;base64,AAAA' } });
    const motion = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(motion).toMatchObject({ image: 'data:image/png;base64,AAAA', motion_type: 'gemini-omni-1.1-flash' });
  });

  it('uses valid contracts for advanced image tools', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ success: true, image_id: 2, image_url: '/hair.png' }))
      .mockResolvedValueOnce(jsonResponse({ success: true, prompt: 'A detailed portrait' }));

    const hair = await executeNode('imageTool', {
      title: 'hair', category: 'edit', status: 'idle', toolId: 'hair-style', requiresImage: true,
      hairstyle: 'french_bob', hairColor: 'natural_black', gender: 'female',
    }, { apiBase: 'https://api.test', inputs: { imageUrl: 'data:image/png;base64,AAAA' } });
    const hairBody = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.test/api/ai/hairstyle');
    expect(hairBody).toEqual(expect.objectContaining({ hairstyle: 'french_bob', hair_color: 'natural_black' }));
    expect(hairBody.style).toBeUndefined();
    expect(hair.output?.type).toBe('image');

    const vision = await executeNode('imageTool', {
      title: 'vision', category: 'assistant', status: 'idle', toolId: 'image-to-text', requiresImage: true,
    }, { apiBase: 'https://api.test', inputs: { imageUrl: 'data:image/png;base64,AAAA' } });
    expect(vision).toMatchObject({ success: true, output: { type: 'text', text: 'A detailed portrait' } });
  });

  it('never charges or uploads placeholder output for disabled simulated nodes', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    const lip = await executeNode('lipsync', {
      title: 'lip', category: 'video', status: 'idle',
    }, { apiBase: 'https://api.test', inputs: { videoUrl: 'v.mp4', audioUrl: 'a.mp3' } });
    const effects = await executeNode('videoEffects', {
      title: 'fx', category: 'video', status: 'idle', style: 'hdr-color',
    }, { apiBase: 'https://api.test', inputs: { videoUrl: 'v.mp4' } });
    expect(lip.success).toBe(false);
    expect(effects.success).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fails safely when a successful response has no media URL', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ success: true, image_id: 9 }));
    const result = await executeNode('imageGen', {
      title: 'image', category: 'image', status: 'idle', prompt: 'test',
    }, { apiBase: 'https://api.test', inputs: {} });
    expect(result.success).toBe(false);
    expect(result.error).toContain('رابط النتيجة');
  });
});
