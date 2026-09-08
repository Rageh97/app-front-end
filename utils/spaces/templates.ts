import { SpacesNode } from '@/stores/spacesStore';
import { Edge } from '@xyflow/react';

export interface WorkflowTemplate {
  id: string;
  title: string;
  category: 'ecommerce' | 'creators' | 'designers' | 'video' | 'audio';
  categoryLabel: string;
  description: string;
  steps: string[];
  nodes: SpacesNode[];
  edges: Edge[];
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  // 1. تصوير المنتجات
  {
    id: 'product-studio',
    title: 'استوديو تصوير المنتجات الإعلانية',
    category: 'ecommerce',
    categoryLabel: 'تجارة إلكترونية',
    description: 'عزل خلفية المنتج تلقائياً ودمجه في بيئات استوديو تسويقية فاخرة مع رفع الدقة إلى 4K.',
    steps: ['رفع صورة المنتج', 'إزالة الخلفية', 'نماذج الاستوديو', 'مضاعفة الجودة 4K', 'المخرجات'],
    nodes: [
      {
        id: 'p-1',
        type: 'imageUpload',
        position: { x: 50, y: 150 },
        data: {
          title: 'رفع صورة المنتج',
          category: 'input',
          status: 'idle',
          creditsCost: 0,
        },
      },
      {
        id: 'p-2',
        type: 'bgRemove',
        position: { x: 400, y: 150 },
        data: {
          title: 'إزالة خلفية المنتج',
          category: 'edit',
          toolId: 'bg-remove',
          status: 'idle',
          creditsCost: 11,
        },
      },
      {
        id: 'p-3',
        type: 'product',
        position: { x: 750, y: 150 },
        data: {
          title: 'نماذج المنتج الإعلانية',
          category: 'image',
          toolId: 'product',
          status: 'idle',
          style: 'luxury',
          creditsCost: 13,
        },
      },
      {
        id: 'p-4',
        type: 'upscale',
        position: { x: 1100, y: 150 },
        data: {
          title: 'مضاعفة الجودة 4K',
          category: 'edit',
          toolId: 'upscale',
          status: 'idle',
          scale: 4,
          creditsCost: 12,
        },
      },
      {
        id: 'p-5',
        type: 'output',
        position: { x: 1450, y: 180 },
        data: {
          title: 'المخرجات النهائية للتحميل',
          category: 'output',
          status: 'idle',
          creditsCost: 0,
        },
      },
    ],
    edges: [
      { id: 'e-p1-p2', source: 'p-1', sourceHandle: 'image-out', target: 'p-2', targetHandle: 'image-in', animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } },
      { id: 'e-p2-p3', source: 'p-2', sourceHandle: 'image-out', target: 'p-3', targetHandle: 'image-in', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } },
      { id: 'e-p3-p4', source: 'p-3', sourceHandle: 'image-out', target: 'p-4', targetHandle: 'image-in', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-p4-p5', source: 'p-4', sourceHandle: 'image-out', target: 'p-5', targetHandle: 'media-in', animated: true, style: { stroke: '#ec4899', strokeWidth: 2 } },
    ],
  },

  // 2. صناعة الريلز والشورتس
  {
    id: 'reels-maker',
    title: 'صناعة مقاطع الريلز والشورتس',
    category: 'creators',
    categoryLabel: 'صناع المحتوى',
    description: 'توليد مشهد فيديو عمودي سينمائي كامل بصوت أصلي متزامن انطلاقاً من السكريبت.',
    steps: ['السكريبت النصي', 'توليد فيديو بصوت متزامن', 'المخرجات'],
    nodes: [
      {
        id: 'r-1',
        type: 'textPrompt',
        position: { x: 50, y: 120 },
        data: {
          title: 'السكريبت والوصف الإبداعي',
          category: 'input',
          status: 'idle',
          prompt: 'مستقبل الذكاء الاصطناعي وكيف يغير نمط حياة البشر بطريقة مذهلة وسلسة',
          creditsCost: 0,
        },
      },
      {
        id: 'r-3',
        type: 'videoGen',
        position: { x: 420, y: 320 },
        data: {
          title: 'توليد فيديو سينمائي',
          category: 'video',
          toolId: 'video',
          status: 'idle',
          modelId: 'gemini-omni-1.1-flash',
          resolution: '1080p',
          aspectRatio: '9:16',
          duration: 4,
          creditsCost: 40,
        },
      },
      {
        id: 'r-5',
        type: 'output',
        position: { x: 800, y: 220 },
        data: {
          title: 'الفيديو النهائي الجاهز للنشر',
          category: 'output',
          status: 'idle',
          creditsCost: 0,
        },
      },
    ],
    edges: [
      { id: 'e-r1-r3', source: 'r-1', sourceHandle: 'prompt-out', target: 'r-3', targetHandle: 'prompt-in', animated: true, style: { stroke: '#a855f7', strokeWidth: 2 } },
      { id: 'e-r3-r5', source: 'r-3', sourceHandle: 'video-out', target: 'r-5', targetHandle: 'media-in', animated: true, style: { stroke: '#ec4899', strokeWidth: 2 } },
    ],
  },

  // 3. إعلانات UGC بمزامنة حركة الشفاه
  {
    id: 'ugc-avatar',
    title: 'إعلانات المؤثرين الرقميين UGC',
    category: 'creators',
    categoryLabel: 'تسويق وإعلانات',
    description: 'توليد شخصية إعلانية ثم تحريكها عبر Gemini Omni بفيديو وصوت أصلي متزامن من السكريبت.',
    steps: ['رفع صورة الوجه', 'صانع الأفاتار', 'سكريبت الإعلان', 'فيديو Omni بصوت أصلي', 'المخرجات'],
    nodes: [
      {
        id: 'u-0',
        type: 'imageUpload',
        position: { x: 20, y: 40 },
        data: {
          title: 'رفع صورة الوجه الأصلية',
          category: 'input',
          status: 'idle',
          creditsCost: 0,
        },
      },
      {
        id: 'u-1',
        type: 'avatar',
        position: { x: 360, y: 40 },
        data: {
          title: 'صانع الأفاتار والشخصيات',
          category: 'image',
          toolId: 'avatar',
          status: 'idle',
          style: 'cartoon',
          creditsCost: 12,
        },
      },
      {
        id: 'u-2',
        type: 'textPrompt',
        position: { x: 50, y: 340 },
        data: {
          title: 'سكريبت الإعلان والحوار',
          category: 'input',
          status: 'idle',
          prompt: 'مرحباً بكم، جربت هذه الخدمة وكانت خيالية وأنصح الجميع بتجربتها الآن!',
          creditsCost: 0,
        },
      },
      {
        id: 'u-3',
        type: 'videoGen',
        position: { x: 450, y: 200 },
        data: {
          title: 'فيديو UGC بصوت أصلي متزامن',
          category: 'video',
          toolId: 'video',
          status: 'idle',
          modelId: 'gemini-omni-1.1-flash',
          resolution: '1080p',
          aspectRatio: '9:16',
          duration: 8,
          creditsCost: 65,
        },
      },
      {
        id: 'u-4',
        type: 'output',
        position: { x: 820, y: 200 },
        data: {
          title: 'فيديو UGC الجاهز',
          category: 'output',
          status: 'idle',
          creditsCost: 0,
        },
      },
    ],
    edges: [
      { id: 'e-u0-u1', source: 'u-0', sourceHandle: 'image-out', target: 'u-1', targetHandle: 'image-in', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } },
      { id: 'e-u1-u3', source: 'u-1', sourceHandle: 'image-out', target: 'u-3', targetHandle: 'image-in', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } },
      { id: 'e-u2-u3', source: 'u-2', sourceHandle: 'prompt-out', target: 'u-3', targetHandle: 'prompt-in', animated: true, style: { stroke: '#f59e0b', strokeWidth: 2 } },
      { id: 'e-u3-u4', source: 'u-3', sourceHandle: 'video-out', target: 'u-4', targetHandle: 'media-in', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } },
    ],
  },

  // 4. ترميم وتلوين الصور القديمة
  {
    id: 'photo-restore-colorize',
    title: 'ترميم وتلوين الصور التاريخية',
    category: 'designers',
    categoryLabel: 'تصميم ومعالجة',
    description: 'إصلاح الخدوش والتمزقات في الصور التاريخية ثم تلوينها بالألوان الطبيعية ورفع جودتها إلى 8K.',
    steps: ['رفع الصورة القديمة', 'ترميم العيوب', 'تلوين طبيعي', 'مضاعفة الجودة 8K', 'المخرجات'],
    nodes: [
      {
        id: 'c-1',
        type: 'imageUpload',
        position: { x: 50, y: 150 },
        data: {
          title: 'رفع الصورة القديمة',
          category: 'input',
          status: 'idle',
          creditsCost: 0,
        },
      },
      {
        id: 'c-2',
        type: 'restore',
        position: { x: 400, y: 150 },
        data: {
          title: 'ترميم وإصلاح العيوب',
          category: 'edit',
          toolId: 'restore',
          status: 'idle',
          creditsCost: 11,
        },
      },
      {
        id: 'c-3',
        type: 'colorize',
        position: { x: 750, y: 150 },
        data: {
          title: 'تلوين الصورة القديمة',
          category: 'edit',
          toolId: 'colorize',
          status: 'idle',
          creditsCost: 11,
        },
      },
      {
        id: 'c-4',
        type: 'upscale',
        position: { x: 1100, y: 150 },
        data: {
          title: 'مضاعفة الجودة 8K',
          category: 'edit',
          toolId: 'upscale',
          status: 'idle',
          scale: 8,
          creditsCost: 12,
        },
      },
      {
        id: 'c-5',
        type: 'output',
        position: { x: 1450, y: 180 },
        data: {
          title: 'الصورة المرممة النهائية',
          category: 'output',
          status: 'idle',
          creditsCost: 0,
        },
      },
    ],
    edges: [
      { id: 'e-c1-c2', source: 'c-1', sourceHandle: 'image-out', target: 'c-2', targetHandle: 'image-in', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } },
      { id: 'e-c2-c3', source: 'c-2', sourceHandle: 'image-out', target: 'c-3', targetHandle: 'image-in', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } },
      { id: 'e-c3-c4', source: 'c-3', sourceHandle: 'image-out', target: 'c-4', targetHandle: 'image-in', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-c4-c5', source: 'c-4', sourceHandle: 'image-out', target: 'c-5', targetHandle: 'media-in', animated: true, style: { stroke: '#ec4899', strokeWidth: 2 } },
    ],
  },

  // 5. تحريك الصور الثابتة إلى فيديو سينمائي
  {
    id: 'image-to-motion',
    title: 'تحويل الصور الثابتة إلى فيديو ديناميكي',
    category: 'video',
    categoryLabel: 'إنتاج الفيديو',
    description: 'بث الحياة في الصور الثابتة ومحاكاة حركة الكاميرا والعمق عبر Gemini Omni مع صوت أصلي.',
    steps: ['رفع الصورة الثابتة', 'محاكاة حركة الكاميرا والصوت', 'المخرجات'],
    nodes: [
      {
        id: 'm-1',
        type: 'imageUpload',
        position: { x: 50, y: 150 },
        data: {
          title: 'رفع الصورة الثابتة',
          category: 'input',
          status: 'idle',
          creditsCost: 0,
        },
      },
      {
        id: 'm-2',
        type: 'motion',
        position: { x: 400, y: 150 },
        data: {
          title: 'محاكاة حركة الصور',
          category: 'video',
          toolId: 'motion',
          status: 'idle',
          modelId: 'gemini-omni-1.1-flash',
          intensity: 'moderate',
          duration: 8,
          creditsCost: 65,
        },
      },
      {
        id: 'm-4',
        type: 'output',
        position: { x: 750, y: 180 },
        data: {
          title: 'المخرجات النهائية',
          category: 'output',
          status: 'idle',
          creditsCost: 0,
        },
      },
    ],
    edges: [
      { id: 'e-m1-m2', source: 'm-1', sourceHandle: 'image-out', target: 'm-2', targetHandle: 'image-in', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } },
      { id: 'e-m2-m4', source: 'm-2', sourceHandle: 'video-out', target: 'm-4', targetHandle: 'media-in', animated: true, style: { stroke: '#ec4899', strokeWidth: 2 } },
    ],
  },

  // 6. استوديو توليد وتطوير الصور الفنية 4K
  {
    id: 'concept-art-studio',
    title: 'استوديو توليد الصور الفنية 4K',
    category: 'designers',
    categoryLabel: 'تصميم ورسم',
    description: 'توليد صور فنية فائقة الدقة والواقعية من الوصف النصي مع مضاعفة الجودة مباشرة إلى 4K.',
    steps: ['الوصف الإبداعي', 'توليد الصور نانو', 'مضاعفة الجودة 4K', 'المخرجات'],
    nodes: [
      {
        id: 'art-1',
        type: 'textPrompt',
        position: { x: 50, y: 150 },
        data: {
          title: 'الوصف الإبداعي',
          category: 'input',
          status: 'idle',
          prompt: 'لوحة فنية سينمائية لمدينة مستقبلية بأسلوب السايبربانك مع أضواء نيون وانعكاسات على مياه المطر',
          creditsCost: 0,
        },
      },
      {
        id: 'art-2',
        type: 'imageGen',
        position: { x: 420, y: 150 },
        data: {
          title: 'توليد الصور نانو',
          category: 'image',
          toolId: 'nano',
          status: 'idle',
          modelId: 'gemini-3-pro-image',
          resolution: '4K',
          aspectRatio: '16:9',
          style: 'cinematic',
          creditsCost: 54,
        },
      },
      {
        id: 'art-3',
        type: 'upscale',
        position: { x: 790, y: 150 },
        data: {
          title: 'مضاعفة الجودة 4K',
          category: 'edit',
          toolId: 'upscale',
          status: 'idle',
          scale: 4,
          creditsCost: 12,
        },
      },
      {
        id: 'art-4',
        type: 'output',
        position: { x: 1140, y: 180 },
        data: {
          title: 'المخرجات النهائية للتحميل',
          category: 'output',
          status: 'idle',
          creditsCost: 0,
        },
      },
    ],
    edges: [
      { id: 'e-art1-art2', source: 'art-1', sourceHandle: 'prompt-out', target: 'art-2', targetHandle: 'prompt-in', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } },
      { id: 'e-art2-art3', source: 'art-2', sourceHandle: 'image-out', target: 'art-3', targetHandle: 'image-in', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-art3-art4', source: 'art-3', sourceHandle: 'image-out', target: 'art-4', targetHandle: 'media-in', animated: true, style: { stroke: '#ec4899', strokeWidth: 2 } },
    ],
  },

  // 7. تحويل الصور لشخصيات ثلاثية الأبعاد
  {
    id: '3d-character-avatar',
    title: 'صناعة الشخصيات ثلاثية الأبعاد 3D',
    category: 'designers',
    categoryLabel: 'تصميم ثلاثي الأبعاد',
    description: 'تحويل صور الوجوه الحقيقية إلى شخصيات ثلاثية الأبعاد بأسلوب سينمائي مع رفع الدقة.',
    steps: ['صورة الوجه', 'تحويل لنمط ثلاثي الأبعاد', 'مضاعفة الجودة 4K', 'المخرجات'],
    nodes: [
      {
        id: 'av-1',
        type: 'imageUpload',
        position: { x: 50, y: 150 },
        data: {
          title: 'رفع صورة الوجه',
          category: 'input',
          status: 'idle',
          creditsCost: 0,
        },
      },
      {
        id: 'av-2',
        type: 'avatar',
        position: { x: 400, y: 150 },
        data: {
          title: 'صانع الأفاتار والشخصيات',
          category: 'image',
          toolId: 'avatar',
          status: 'idle',
          style: 'pixar',
          creditsCost: 12,
        },
      },
      {
        id: 'av-3',
        type: 'upscale',
        position: { x: 750, y: 150 },
        data: {
          title: 'مضاعفة الجودة 4K',
          category: 'edit',
          toolId: 'upscale',
          status: 'idle',
          scale: 4,
          creditsCost: 12,
        },
      },
      {
        id: 'av-4',
        type: 'output',
        position: { x: 1100, y: 180 },
        data: {
          title: 'الشخصية النهائية للتحميل',
          category: 'output',
          status: 'idle',
          creditsCost: 0,
        },
      },
    ],
    edges: [
      { id: 'e-av1-av2', source: 'av-1', sourceHandle: 'image-out', target: 'av-2', targetHandle: 'image-in', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } },
      { id: 'e-av2-av3', source: 'av-2', sourceHandle: 'image-out', target: 'av-3', targetHandle: 'image-in', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e-av3-av4', source: 'av-3', sourceHandle: 'image-out', target: 'av-4', targetHandle: 'media-in', animated: true, style: { stroke: '#ec4899', strokeWidth: 2 } },
    ],
  },

  // 8. إنتاج التعليق الصوتي والبودكاست
  {
    id: 'voiceover-studio',
    title: 'استوديو التعليق الصوتي والبودكاست',
    category: 'audio',
    categoryLabel: 'هندسة صوتية',
    description: 'تحويل النصوص والسكريبتات الطويلة إلى تسجيلات صوتية بشرية متقنة وطبيعية جاهزة للبث.',
    steps: ['سكريبت البودكاست', 'تحويل لنبرة صوتية بشرية', 'المخرجات الصوتية'],
    nodes: [
      {
        id: 'vo-1',
        type: 'textPrompt',
        position: { x: 50, y: 150 },
        data: {
          title: 'نص وسكريبت البودكاست',
          category: 'input',
          status: 'idle',
          prompt: 'أهلاً بكم في حلقة اليوم من مساحات العمل الذكية، حيث نناقش كيف يساهم الذكاء الاصطناعي في تمكين المبدعين ورواد الأعمال.',
          creditsCost: 0,
        },
      },
      {
        id: 'vo-2',
        type: 'tts',
        position: { x: 420, y: 150 },
        data: {
          title: 'تحويل النص إلى صوت',
          category: 'audio',
          toolId: 'text-to-speech',
          status: 'idle',
          voiceId: 'adnan',
          modelId: 'gemini-3.1',
          speed: 1.0,
          creditsCost: 3,
        },
      },
      {
        id: 'vo-3',
        type: 'output',
        position: { x: 790, y: 180 },
        data: {
          title: 'الملف الصوتي النهائي',
          category: 'output',
          status: 'idle',
          creditsCost: 0,
        },
      },
    ],
    edges: [
      { id: 'e-vo1-vo2', source: 'vo-1', sourceHandle: 'prompt-out', target: 'vo-2', targetHandle: 'text-in', animated: true, style: { stroke: '#f59e0b', strokeWidth: 2 } },
      { id: 'e-vo2-vo3', source: 'vo-2', sourceHandle: 'audio-out', target: 'vo-3', targetHandle: 'media-in', animated: true, style: { stroke: '#ec4899', strokeWidth: 2 } },
    ],
  },
];
