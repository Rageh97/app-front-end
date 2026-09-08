import type { LucideIcon } from 'lucide-react';
import {
  AudioLines, Bot, Brush, Camera, Clapperboard, Crown, FileText,
  Image as ImageIcon, Images, Maximize2, Mic2, Music2,
  Palette, ScanFace, Scissors, Shirt, Sparkles, SunMedium, UserRound,
  Video, WandSparkles, Workflow, Zap,
} from 'lucide-react';

export type AIToolCategory = 'audio' | 'image' | 'edit' | 'video' | 'trend' | 'assistant' | 'workflow';
export type AIToolStatus = 'ready' | 'new';

export interface NexusAITool {
  id: string;
  title: string;
  description: string;
  category: AIToolCategory;
  href: string;
  image: string;
  icon: LucideIcon;
  status: AIToolStatus;
  badge?: string;
  featured?: boolean;
}

export const AI_CATEGORY_META: Record<AIToolCategory, { label: string; shortLabel: string; description: string; shimmerClass: string }> = {
  audio: { label: 'أدوات الصوت والموسيقى', shortLabel: 'الصوت والموسيقى', description: 'تعليق صوتي فوري، تأليف موسيقى أصلية، ومطابقة النبرات', shimmerClass: 'animate-emerald-shimmer' },
  image: { label: 'توليد وتصميم الصور', shortLabel: 'توليد الصور', description: 'إنتاج بصري احترافي فائق الدقة حتى 4K وتصاميم تجارية', shimmerClass: 'animate-gold-shimmer' },
  edit: { label: 'تعديل وتحسين الصور', shortLabel: 'تعديل الصور', description: 'إزالة خلفيات، رفع الدقة، ترميم وتلوين وتعديل الصور بالذكاء الاصطناعي', shimmerClass: 'animate-sky-shimmer' },
  video: { label: 'الفيديو والتحريك', shortLabel: 'الفيديو والحركة', description: 'إنتاج فيديو سينمائي متزامن وتحريك الصور بحركة كاميرا طبيعية', shimmerClass: 'animate-gold-shimmer' },
  trend: { label: 'أدوات الترند والمظهر', shortLabel: 'أدوات الترند', description: 'قصات الشعر، تبديل الأزياء، رحلة العمر ومؤثرات المشاهير', shimmerClass: 'animate-fuchsia-shimmer' },
  assistant: { label: 'المساعدات الذكية والرؤية', shortLabel: 'المساعدات', description: 'محادثة وتوليد نصوص ذكي وفهم واستخراج بيانات الصور', shimmerClass: 'animate-sky-shimmer' },
  workflow: { label: 'مساحات العمل وسير الإنتاج', shortLabel: 'Spaces', description: 'اربط عدة أدوات في مسار إنتاج واحد متكامل وآلي', shimmerClass: 'animate-emerald-shimmer' },
};

export const NEXUS_AI_TOOLS: NexusAITool[] = [
  // Workflow
  { id: 'spaces', title: 'NEXUS Spaces', description: 'كانفاس احترافي لربط الصور والفيديو والصوت في مسارات إنتاج قابلة لإعادة الاستخدام.', category: 'workflow', href: '/ai/spaces', image: '/images/spaces.png', icon: Workflow, status: 'new', badge: 'منتج حصري', featured: true },

  // Audio & Music (Grouped Together)
  { id: 'text-to-speech', title: 'التعليق الصوتي', description: 'حوّل النص إلى أداء صوتي طبيعي بأصوات ولهجات عربية واقعية.', category: 'audio', href: '/ai/text-to-speech', image: '/images/انشاء تعليق صوتي.png', icon: AudioLines, status: 'ready', badge: 'Gemini TTS', featured: true },
  { id: 'music', title: 'تأليف الموسيقى', description: 'أنشئ موسيقى وتراك صوتي أصلي بجودة الاستوديو عبر Google Lyria 3.', category: 'audio', href: '/ai/music', image: '/images/headphones.gif', icon: Music2, status: 'new', badge: 'Lyria 3', featured: true },
  { id: 'voice-clone', title: 'مطابقة النبرة', description: 'حلّل العينة الصوتية وطابقها مع أقرب صوت احترافي متاح.', category: 'audio', href: '/ai/voice-clone', image: '/images/انشاء تعليق صوتي.png', icon: Mic2, status: 'new' },

  // Image Generation (Grouped Together)
  { id: 'image', title: 'الصور السينمائية', description: 'إنتاج بصري احترافي فائق الدقة حتى 4K عبر Gemini 3 Pro Image.', category: 'image', href: '/ai/image', image: '/images/انشاء الصور.png', icon: Images, status: 'ready', badge: 'Ultra 4K', featured: true },
  { id: 'nano', title: 'Nano Banana', description: 'إنشاء وتحرير الصور بسرعة فائقة وتكلفة اقتصادية عبر Gemini 3.1 Flash.', category: 'image', href: '/ai/nano', image: '/images/Whisk_d2a441bc8622fa5b2774cf54a715f70feg.png', icon: Zap, status: 'ready', badge: 'الأسرع', featured: true },
  { id: 'gpt-image', title: 'GPT Image', description: 'توليد صور مع فهم عميق للنصوص المعقدة والتكوينات الإبداعية.', category: 'image', href: '/ai/gpt-image', image: '/images/انشاء الصور.png', icon: Sparkles, status: 'new', badge: 'GPT Image' },
  { id: 'text-to-image', title: 'تحويل النص إلى صورة', description: 'حوّل وصفك النصي إلى تصميم بصري جاهز للاستخدام والتنزيل.', category: 'image', href: '/ai/text-to-image', image: '/images/انشاء الصور.png', icon: ImageIcon, status: 'ready' },
  { id: 'product', title: 'استوديو المنتجات', description: 'صور إعلانية لمنتجك بخلفيات واستوديوهات تسويقية جاهزة.', category: 'image', href: '/ai/product', image: '/images/نماذج لمنتجك.png', icon: Camera, status: 'ready', badge: 'للتجارة' },
  { id: 'logo', title: 'صانع الشعارات', description: 'ابتكر اتجاهات وأفكار شعارات وهوية بصرية للعلامات التجارية.', category: 'image', href: '/ai/logo', image: '/images/انشاء الصور.png', icon: Crown, status: 'ready' },
  { id: 'sketch', title: 'الرسم إلى صورة', description: 'حوّل المسودات والرسومات اليدوية الأولية إلى مشاهد فنية مكتملة.', category: 'image', href: '/ai/sketch', image: '/images/رسم الصور.png', icon: Brush, status: 'ready' },
  { id: 'avatar', title: 'صانع الأفاتار', description: 'حوّل الوجوه إلى شخصيات فنية وثلاثية الأبعاد متناسقة ومميزة.', category: 'image', href: '/ai/avatar', image: '/images/انشاء افاتار.png', icon: ScanFace, status: 'ready' },

  // Image Edit & Enhancement (Grouped Together)
  { id: 'bg-remove', title: 'إزالة الخلفية', description: 'اعزل الأشخاص والمنتجات بخلفية شفافة فائقة الدقة بضغطة زر.', category: 'edit', href: '/ai/bg-remove', image: '/images/ازالة الخلفية.png', icon: Scissors, status: 'ready' },
  { id: 'clothes-extraction', title: 'استخراج الملابس', description: 'استخرج قطع الأزياء من الصور في عرض كتالوج نظيف ومرتب.', category: 'edit', href: '/ai/clothes-extraction', image: '/images/getclothes.png', icon: Shirt, status: 'new' },
  { id: 'id-photo', title: 'الصور الشخصية الرسمية', description: 'حوّل صورتك إلى صورة هوية أو سيرة ذاتية بخلفية وأبعاد رسمية.', category: 'edit', href: '/ai/id-photo', image: '/images/انشاء افاتار.png', icon: Camera, status: 'new' },
  { id: 'restore', title: 'ترميم الصور', description: 'إصلاح التلف والخدوش واستعادة تفاصيل الصور القديمة والتالفة.', category: 'edit', href: '/ai/restore', image: '/images/ترميم الصور.png', icon: WandSparkles, status: 'ready' },
  { id: 'colorize', title: 'تلوين الصور', description: 'أعد الحياة للصور القديمة باللونين الأبيض والأسود بألوان واقعية.', category: 'edit', href: '/ai/colorize', image: '/images/تلوين الصورة.png', icon: Palette, status: 'ready' },
  { id: 'edit', title: 'المحرر الذكي', description: 'أضف أو احذف أو عدّل أي عنصر في الصورة باستخدام التعليمات النصية.', category: 'edit', href: '/ai/edit', image: '/images/تعديل الصور.png', icon: Brush, status: 'ready' },
  { id: 'upscale', title: 'رفع جودة الصور', description: 'كبّر الصور وحسّن وضوح التفاصيل بدون أي تشويش.', category: 'edit', href: '/ai/upscale', image: '/images/رفع جودة الصور.png', icon: Maximize2, status: 'ready' },
  { id: 'relight', title: 'إعادة الإضاءة', description: 'أعد بناء وتوزيع إضاءة الصورة بأسلوب استوديو ومن اتجاهات متعددة.', category: 'edit', href: '/ai/relight', image: '/images/relight.png', icon: SunMedium, status: 'new' },

  // Video & Motion (Grouped Together)
  { id: 'video', title: 'استوديو الفيديو', description: 'فيديو سينمائي من النص أو الصورة مع صوت أصلي متزامن عالي الدقة.', category: 'video', href: '/ai/video', image: '/images/تاثيرات الفيديو.png', icon: Video, status: 'ready', badge: 'Omni + Veo', featured: true },
  { id: 'motion', title: 'تحريك الصور', description: 'حوّل الصور الثابتة إلى لقطات حية بحركة كاميرا وانسيابية واقعية.', category: 'video', href: '/ai/motion', image: '/images/محاكاة الحركة.png', icon: Clapperboard, status: 'ready' },

  // Trend Tools (Grouped Together)
  { id: 'hair-style', title: 'تغيير قصة الشعر', description: 'جرّب قصات وألوان شعر مختلفة مع الحفاظ على ملامح الوجه.', category: 'trend', href: '/ai/hair-style', image: '/images/hair-style.png', icon: Scissors, status: 'new', badge: 'تريند' },
  { id: 'clothes-swap', title: 'تغيير الملابس', description: 'تبديل الأزياء والألوان مع تفاصيل قماش وإضاءة واقعية.', category: 'trend', href: '/ai/clothes-swap', image: '/images/clothes-swap.png', icon: Shirt, status: 'new', badge: 'تريند' },
  { id: 'age-journey', title: 'رحلة العمر', description: 'تحويل عمري واقعي مع الحفاظ على هوية وملامح الشخص.', category: 'trend', href: '/ai/age-journey', image: '/images/age-journey.png', icon: UserRound, status: 'new', badge: 'تريند' },
  { id: 'fisheye-night', title: 'الرؤية الليلية', description: 'مشاهد فيديو ليلية بعدسة عين السمكة وأجواء سينمائية غامضة.', category: 'trend', href: '/ai/fisheye-night', image: '/images/fisheye-night.png', icon: Camera, status: 'new', badge: 'تريند' },
  { id: 'celebrity-mode', title: 'وضع المشاهير', description: 'حوّل صورتك إلى لقطة وصول VIP سينمائية وسط عدسات المصورين.', category: 'trend', href: '/ai/celebrity-mode', image: '/images/celebrity-mode.png', icon: Crown, status: 'new', badge: 'تريند' },

  // Assistants & Vision (Grouped Together)
  { id: 'chat', title: 'NEXUS GPT', description: 'مساعد ذكي للمحادثة والكتابة الإبداعية والتحليل والبرمجة.', category: 'assistant', href: '/ai/chat', image: '/images/chat.jpg', icon: Bot, status: 'ready' },
  { id: 'image-to-text', title: 'فهم واستخراج الصور', description: 'استخرج النصوص والأوصاف والتفاصيل الذكية من أي صورة.', category: 'assistant', href: '/ai/image-to-text', image: '/images/الصورة لنص.png', icon: FileText, status: 'ready' },
];

export const READY_AI_TOOLS = NEXUS_AI_TOOLS;
export const FEATURED_AI_TOOLS = NEXUS_AI_TOOLS.filter((tool) => tool.featured);

const CORE_TOOL_ORDER = ['image', 'video', 'nano', 'gpt-image', 'text-to-speech', 'music'];
const TREND_TOOL_ORDER = ['hair-style', 'clothes-swap', 'age-journey', 'fisheye-night', 'celebrity-mode'];

const orderTools = (ids: string[]) => ids
  .map((id) => NEXUS_AI_TOOLS.find((tool) => tool.id === id))
  .filter((tool): tool is NexusAITool => Boolean(tool));

export const CORE_AI_TOOLS = orderTools(CORE_TOOL_ORDER);
export const TREND_AI_TOOLS = orderTools(TREND_TOOL_ORDER);
export const CORE_AI_TOOL_IDS = new Set(CORE_TOOL_ORDER);
export const TREND_AI_TOOL_IDS = new Set(TREND_TOOL_ORDER);
