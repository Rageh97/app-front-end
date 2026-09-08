import { WorkflowNodeData } from '@/stores/spacesStore';

export interface ExecutionContext {
  apiBase: string;
  token?: string;
  inputs: {
    prompt?: string;
    imageUrl?: string;
    videoUrl?: string;
    audioUrl?: string;
    [key: string]: any;
  };
  signal?: AbortSignal;
}

export interface ExecutionResult {
  success: boolean;
  output?: {
    type: 'image' | 'video' | 'audio' | 'text';
    url?: string;
    text?: string;
  };
  mediaId?: number;
  cancelled?: boolean;
  error?: string;
}

async function toBase64Image(imageUrl: string): Promise<string> {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('data:image/')) {
    return imageUrl;
  }
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error('تعذر تنزيل الوسائط المدخلة');
    const blob = await res.blob();
    if (!blob.type.startsWith('image/')) throw new Error('الملف المدخل ليس صورة صالحة');
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error: any) {
    throw new Error(error?.message || 'تعذر تجهيز الصورة للمعالجة');
  }
}

async function postJson(
  url: string,
  headers: Record<string, string>,
  body: Record<string, any>,
  signal?: AbortSignal
): Promise<any> {
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  });
  const raw = await response.text();
  let data: any = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { message: raw };
  }
  if (!response.ok || data.success === false) {
    throw new Error(data.message || data.error || `فشل الطلب (${response.status})`);
  }
  return data;
}

function absoluteMediaUrl(apiBase: string, value?: string | null): string {
  if (!value) throw new Error('اكتملت المعالجة لكن الخادم لم يُرجع رابط النتيجة');
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  return `${apiBase.replace(/\/$/, '')}/${value.replace(/^\//, '')}`;
}

function imageSizeFromAspectRatio(aspectRatio?: string): string {
  if (aspectRatio === '16:9' || aspectRatio === '4:3') return '1792x1024';
  if (aspectRatio === '9:16' || aspectRatio === '3:4') return '1024x1792';
  return '1024x1024';
}

export async function executeNode(
  nodeType: string,
  nodeData: WorkflowNodeData,
  context: ExecutionContext
): Promise<ExecutionResult> {
  const { apiBase, inputs, signal } = context;
  const token = typeof window !== 'undefined' ? localStorage.getItem('a') || localStorage.getItem('token') || context.token : context.token;
  const userClient = typeof window !== 'undefined' ? (global as any)?.clientId1328 || localStorage.getItem('clientId1328') : undefined;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = token;
  }
  if (userClient) {
    headers['User-Client'] = userClient;
  }

  try {
    switch (nodeType) {
      // ─── 1. المدخلات ───
      case 'textPrompt':
        return {
          success: true,
          output: {
            type: 'text',
            text: nodeData.prompt || inputs.prompt || '',
          },
        };

      case 'imageUpload':
        if (!nodeData.imageUrl && !inputs.imageUrl) {
          throw new Error('يرجى رفع صورة أولاً في عقدة رفع الصور');
        }
        return {
          success: true,
          output: {
            type: 'image',
            url: nodeData.imageUrl || inputs.imageUrl,
          },
        };

      // ─── 2. توليد وتعديل الصور ───
      case 'imageGen':
      case 'nano': {
        const prompt = inputs.prompt || nodeData.prompt;
        if (!prompt) throw new Error('يرجى تحديد أمر نصي (Prompt) للتوليد');

        const refImage = inputs.imageUrl || nodeData.imageUrl;
        const preparedRefImage = refImage ? await toBase64Image(refImage) : undefined;
        const model = nodeData.modelId || 'gemini-3.1-flash-image';

        const endpoint =
          model.includes('nano') || nodeType === 'nano' || nodeData.toolId === 'nano'
            ? `${apiBase}/api/ai/nano-generate`
            : `${apiBase}/api/ai/text-to-image`;

        const data = await postJson(endpoint, headers, {
          prompt,
          model,
          size: imageSizeFromAspectRatio(nodeData.aspectRatio),
          resolution: nodeData.resolution || (model === 'gemini-3-pro-image' ? '4K' : '2K'),
          style: nodeData.style || 'photorealistic',
          reference_image: preparedRefImage,
        }, signal);

        const imgUrl = data.image_url || data.output_url || (Array.isArray(data.images) ? data.images[0] : null);
        return {
          success: true,
          mediaId: data.image_id,
          output: {
            type: 'image',
            url: absoluteMediaUrl(apiBase, imgUrl),
          },
        };
      }

      case 'upscale': {
        const rawImageUrl = inputs.imageUrl || nodeData.imageUrl;
        if (!rawImageUrl) throw new Error('لا توجد صورة مدخلة لرفع جودتها');

        const base64Image = await toBase64Image(rawImageUrl);
        const scaleStr = typeof nodeData.scale === 'string' && (nodeData.scale as string).endsWith('x')
          ? nodeData.scale
          : `${nodeData.scale || 4}x`;

        const data = await postJson(`${apiBase}/api/ai/image-upscale`, headers, {
          image: base64Image,
          scale: scaleStr,
          enhance_quality: true,
        }, signal);

        const imgUrl = data.image_url || data.output_url || data.cloudinary_url || (data.image_b64 ? `data:image/png;base64,${data.image_b64}` : null);
        return {
          success: true,
          mediaId: data.image_id,
          output: {
            type: 'image',
            url: absoluteMediaUrl(apiBase, imgUrl),
          },
        };
      }

      case 'bgRemove': {
        const rawImageUrl = inputs.imageUrl || nodeData.imageUrl;
        if (!rawImageUrl) throw new Error('لا توجد صورة مدخلة لإزالة خلفيتها');

        const base64Image = await toBase64Image(rawImageUrl);

        const data = await postJson(`${apiBase}/api/ai/background-remove`, headers, {
          image: base64Image,
          output_format: 'png',
        }, signal);

        const imgUrl = data.image_url || data.output_url || (data.image_b64 ? `data:image/png;base64,${data.image_b64}` : null);
        return {
          success: true,
          mediaId: data.image_id,
          output: {
            type: 'image',
            url: absoluteMediaUrl(apiBase, imgUrl),
          },
        };
      }

      case 'restore': {
        const rawImageUrl = inputs.imageUrl || nodeData.imageUrl;
        if (!rawImageUrl) throw new Error('لا توجد صورة مدخلة للترميم');

        const base64Image = await toBase64Image(rawImageUrl);

        const data = await postJson(`${apiBase}/api/ai/photo-restore`, headers, { image: base64Image }, signal);

        const imgUrl = data.image_url || data.output_url;
        return {
          success: true,
          mediaId: data.image_id,
          output: {
            type: 'image',
            url: absoluteMediaUrl(apiBase, imgUrl),
          },
        };
      }

      case 'colorize': {
        const rawImageUrl = inputs.imageUrl || nodeData.imageUrl;
        if (!rawImageUrl) throw new Error('لا توجد صورة مدخلة للتلوين');

        const base64Image = await toBase64Image(rawImageUrl);

        const data = await postJson(`${apiBase}/api/ai/photo-colorize`, headers, {
          image: base64Image,
          customPrompt: nodeData.prompt || '',
        }, signal);

        const imgUrl = data.image_url || data.output_url;
        return {
          success: true,
          mediaId: data.image_id,
          output: {
            type: 'image',
            url: absoluteMediaUrl(apiBase, imgUrl),
          },
        };
      }

      case 'product': {
        const rawImageUrl = inputs.imageUrl || nodeData.imageUrl;
        if (!rawImageUrl) throw new Error('لا توجد صورة منتج مدخلة');

        const base64Image = await toBase64Image(rawImageUrl);

        const data = await postJson(`${apiBase}/api/ai/product-models`, headers, {
          product_image: base64Image,
          background: nodeData.style || 'studio',
          customPrompt: nodeData.prompt || '',
        }, signal);

        const imgUrl = data.image_url || data.output_url;
        return {
          success: true,
          mediaId: data.image_id,
          output: {
            type: 'image',
            url: absoluteMediaUrl(apiBase, imgUrl),
          },
        };
      }

      case 'avatar': {
        const rawImageUrl = inputs.imageUrl || nodeData.imageUrl;
        if (!rawImageUrl) throw new Error('لا توجد صورة وجه مدخلة لإنشاء الأفاتار');

        const base64Image = await toBase64Image(rawImageUrl);

        const data = await postJson(`${apiBase}/api/ai/avatar-create`, headers, {
          image: base64Image,
          style: nodeData.style || 'cartoon',
          customPrompt: nodeData.prompt || '',
        }, signal);

        const imgUrl = data.image_url || data.output_url;
        return {
          success: true,
          mediaId: data.image_id,
          output: {
            type: 'image',
            url: absoluteMediaUrl(apiBase, imgUrl),
          },
        };
      }

      case 'imageTool': {
        const toolId = nodeData.toolId || '';
        const rawImageUrl = inputs.imageUrl || nodeData.imageUrl;
        if (nodeData.requiresImage && !rawImageUrl) throw new Error('لا توجد صورة مدخلة لهذه الأداة');
        const image = rawImageUrl ? await toBase64Image(rawImageUrl) : undefined;

        let endpoint = '';
        let body: Record<string, any> = {};
        switch (toolId) {
          case 'logo':
            if (!(inputs.prompt || nodeData.prompt)?.trim()) throw new Error('اكتب اسم العلامة أو وصف الشعار');
            endpoint = 'logo-create';
            body = { company_name: (inputs.prompt || nodeData.prompt).trim().slice(0, 100), style: nodeData.style || 'modern' };
            break;
          case 'sketch':
            endpoint = 'sketch-to-image';
            body = { sketch: image, prompt: inputs.prompt || nodeData.prompt || '', style: nodeData.style || 'realistic', color_scheme: nodeData.colorScheme || 'natural' };
            break;
          case 'clothes-extraction':
            endpoint = 'clothes-extraction';
            body = { image };
            break;
          case 'id-photo':
            endpoint = 'id-photo';
            body = { image, background: nodeData.background || 'white' };
            break;
          case 'edit':
            endpoint = 'image-edit';
            body = { image, edit_type: nodeData.editType || 'remove_object', prompt: inputs.prompt || nodeData.prompt || '' };
            break;
          case 'relight':
            endpoint = 'relight';
            body = { image, direction: nodeData.direction || 'right' };
            break;
          case 'hair-style':
            endpoint = 'hairstyle';
            body = { image, gender: nodeData.gender || 'female', hairstyle: nodeData.hairstyle || 'french_bob', hair_color: nodeData.hairColor || 'natural_black' };
            break;
          case 'clothes-swap':
            endpoint = 'clothes-swap';
            body = { image, garment_image: nodeData.garmentImageUrl || undefined, style_prompt: inputs.prompt || nodeData.prompt || 'Elegant modern outfit' };
            break;
          case 'age-journey':
            endpoint = 'age-journey';
            body = { image, target_age: Number(nodeData.targetAge || 65), mode: nodeData.mode || 'image' };
            break;
          case 'fisheye-night':
            endpoint = 'fisheye-night';
            body = { image, atmosphere: nodeData.atmosphere || 'cctv_security', mode: nodeData.mode || 'image' };
            break;
          case 'celebrity-mode':
            endpoint = 'celebrity-mode';
            body = { image, setting: nodeData.setting || 'red_carpet', mode: nodeData.mode || 'image' };
            break;
          case 'image-to-text':
            endpoint = 'image-to-prompt';
            body = { image };
            break;
          default:
            throw new Error('هذه الأداة غير مرتبطة بمحرك تنفيذ صالح');
        }

        const data = await postJson(`${apiBase}/api/ai/${endpoint}`, headers, body, signal);
        if (toolId === 'image-to-text') {
          const text = data.prompt || data.text || data.description;
          if (!text) throw new Error('اكتملت المعالجة لكن الخادم لم يُرجع نصًا');
          return { success: true, output: { type: 'text', text } };
        }

        const isVideo = nodeData.mode === 'video';
        const mediaUrl = isVideo
          ? data.video_url || data.output_url
          : data.image_url || data.output_url || data.cloudinary_url || (data.image_b64 ? `data:image/png;base64,${data.image_b64}` : null);
        return {
          success: true,
          mediaId: isVideo ? data.video_id : data.image_id,
          output: { type: isVideo ? 'video' : 'image', url: absoluteMediaUrl(apiBase, mediaUrl) },
        };
      }

      // ─── 3. الفيديو ───
      case 'videoGen':
      case 'video': {
        const prompt = inputs.prompt || nodeData.prompt;
        const imageUrl = inputs.imageUrl || nodeData.imageUrl;
        if (!prompt && !imageUrl) throw new Error('يرجى تحديد أمر نصي أو صورة مدخلة لتوليد الفيديو');

        const model = nodeData.modelId || 'gemini-omni-1.1-flash';
        const quality = nodeData.resolution || '1080p';
        const referenceMedia = imageUrl ? await toBase64Image(imageUrl) : undefined;
        const requiresEightSeconds = !model.includes('omni') && (!!referenceMedia || quality.toLowerCase() !== '720p');

        const data = await postJson(`${apiBase}/api/ai/text-to-video`, headers, {
          prompt: prompt || 'Cinematic video scene, ultra high definition',
          model,
          duration: requiresEightSeconds ? 8 : (nodeData.duration || 4),
          quality,
          aspect_ratio: nodeData.aspectRatio || '16:9',
          reference_media: referenceMedia,
          reference_type: referenceMedia ? 'image' : undefined,
          hasAudio: true,
        }, signal);

        const vidUrl = data.video_url || data.output_url;
        return {
          success: true,
          mediaId: data.video_id,
          output: {
            type: 'video',
            url: absoluteMediaUrl(apiBase, vidUrl),
          },
        };
      }

      case 'motion': {
        const imageUrl = inputs.imageUrl || nodeData.imageUrl;
        if (!imageUrl) throw new Error('لا توجد صورة مدخلة لتحريكها');
        const preparedImage = await toBase64Image(imageUrl);

        const data = await postJson(`${apiBase}/api/ai/motion-effects`, headers, {
          image: preparedImage,
          motion_type: nodeData.modelId || 'gemini-omni-1.1-flash',
          prompt: nodeData.prompt || `Cinematic ${nodeData.intensity || 'moderate'} camera movement`,
          duration: nodeData.duration || 8,
          aspect_ratio: nodeData.aspectRatio || '16:9',
        }, signal);

        const vidUrl = data.video_url || data.output_url;
        return {
          success: true,
          mediaId: data.video_id,
          output: {
            type: 'video',
            url: absoluteMediaUrl(apiBase, vidUrl),
          },
        };
      }

      case 'lipsync': {
        return {
          success: false,
          error: 'عقدة مزامنة الشفاه أوقفت مؤقتاً لأنها لم تكن مرتبطة بمحرك إنتاج حقيقي',
        };
        /* Legacy contract retained below for reference until a production provider is connected.
        const videoUrl = inputs.videoUrl || inputs.imageUrl || nodeData.videoUrl;
        const audioUrl = inputs.audioUrl || nodeData.audioUrl;
        if (!videoUrl) throw new Error('يرجى تزويد عقدة Lip Sync بصورة أو فيديو للوجه');
        if (!audioUrl) throw new Error('يرجى تزويد عقدة Lip Sync بمقطع صوتي');

        const data = await postJson(`${apiBase}/api/ai/lip-sync`, headers, {
          video: videoUrl,
          audio: audioUrl,
        }, signal);

        const vidUrl = data.video_url || data.output_url;
        return {
          success: true,
          mediaId: data.video_id,
          output: {
            type: 'video',
            url: absoluteMediaUrl(apiBase, vidUrl),
          },
        };
        */
      }

      case 'videoEffects': {
        return {
          success: false,
          error: 'عقدة مؤثرات الفيديو أوقفت مؤقتاً لأنها لم تكن مرتبطة بمعالجة فيديو حقيقية',
        };
        /* Legacy contract retained below for reference until a production processor is connected.
        const videoUrl = inputs.videoUrl || nodeData.videoUrl;
        if (!videoUrl) throw new Error('لا يوجد فيديو مدخل لتطبيق التأثيرات');

        const data = await postJson(`${apiBase}/api/ai/video-effects`, headers, {
          video: videoUrl,
          effects: [nodeData.style || 'cinematic-glow'],
        }, signal);

        const vidUrl = data.video_url || data.output_url;
        return {
          success: true,
          mediaId: data.video_id,
          output: {
            type: 'video',
            url: absoluteMediaUrl(apiBase, vidUrl),
          },
        };
        */
      }

      // ─── 4. الصوت ───
      case 'tts': {
        const prompt = inputs.prompt || nodeData.prompt;
        if (!prompt) throw new Error('لا يوجد نص مدخل للتحويل إلى صوت');

        const data = await postJson(`${apiBase}/api/ai/text-to-speech`, headers, {
          text: prompt,
          voice: nodeData.voiceId || 'zaid',
          model: nodeData.modelId || 'gemini-3.1',
          speed: nodeData.speed || 1.0,
          language: 'ar',
          dialect: nodeData.dialect || 'فصحى',
        }, signal);

        const audUrl = data.audio_url || data.output_url;
        return {
          success: true,
          output: {
            type: 'audio',
            url: absoluteMediaUrl(apiBase, audUrl),
          },
        };
      }

      // ─── 5. المخرجات ───
      case 'output': {
        const finalType = inputs.videoUrl ? 'video' : inputs.audioUrl ? 'audio' : inputs.imageUrl ? 'image' : 'text';
        const finalUrl = finalType === 'video'
          ? inputs.videoUrl
          : finalType === 'audio'
          ? inputs.audioUrl
          : finalType === 'image'
          ? inputs.imageUrl
          : undefined;
        const finalText = inputs.prompt || inputs.text;
        return {
          success: true,
          mediaId: inputs.mediaId,
          output: {
            type: finalType,
            url: finalUrl,
            text: finalText,
          },
        };
      }

      default:
        throw new Error(`نوع العقدة غير معروف: ${nodeType}`);
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return { success: false, cancelled: true, error: 'تم إلغاء التنفيذ' };
    }
    return {
      success: false,
      error: err.message || 'حدث خطأ غير متوقع أثناء المعالجة',
    };
  }
}
