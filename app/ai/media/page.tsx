"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft,
  Image as ImageIcon, 
  Video, 
  Sparkles,
  Edit3,
  Users,
  Maximize,
  Zap,
  Crown,
  Brush,
  Scissors,
  Palette,
  RefreshCw,
  Camera,
  Film,
  Move3D,
  Layers,
  Mic,
  MessageSquare,
  Wand2,
  CreditCard,
  ChevronRight,
  Shirt
} from 'lucide-react';
import TextType from "@/components/TextType";
import Image from "next/image";
import { BorderBeam } from "@/components/ui/border-beam";

const IMAGE_TOOLS = [
  {
    id: 'image',
    title: 'انشاء صور احترافية',
    description: 'أنشئ صوراً مذهلة من النصوص باستخدام Imagen 4.0',
    icon: ImageIcon,
    category: 'image',
    gradient: 'from-violet-600/80 to-indigo-600/80',
    image: '/images/انشاء الصور.png',
    href: '/ai/image',
    featured: true
  },
  {
    id: 'image-to-text',
    title: 'استخراج النص من الصورة',
    description: 'احصل على وصف دقيق ومفصل لصورك',
    icon: Edit3,
    category: 'image',
    gradient: 'from-emerald-600/80 to-teal-600/80',
    image: '/images/الصورة لنص.png',
    href: '/ai/image-to-text',
    featured: true
  },
  // {
  //   id: 'upscale',
  //   title: 'رفع دقة الصور',
  //   description: 'حسن جودة الصور وزد من دقتها بذكاء',
  //   icon: Maximize,
  //   category: 'image',
  //   gradient: 'from-indigo-600/80 to-purple-600/80',
  //   image: '/images/رفع جودة الصور.png',
  //   href: '/ai/upscale',
  //   featured: true
  // },
  {
    id: 'clothes-extraction',
    title: 'استخراج الملابس الذكي',
    description: 'استخرج قطع الملابس من الصور بذكاء (قمصان، بناطيل، تنانير) بدقة عالية',
    icon: Shirt,
    category: 'image',
    gradient: 'from-blue-500/80 to-indigo-600/80',
    image: '/images/getclothes.png',
    href: '/ai/clothes-extraction',
    isNew: true
  },
  {
    id: 'id-photo',
    title: 'صانع الصور الشخصية',
    description: 'حول صورك العادية إلى صور بطاقة وهوية احترافية بأبعاد وخلفيات رسمية',
    icon: Camera,
    category: 'image',
    gradient: 'from-blue-600/80 to-sky-600/80',
    image: 'https://i.pinimg.com/736x/79/dd/11/79dd11a9452a92a1accceec38a45e16a.jpg',
    href: '/ai/id-photo',
    isNew: true
  },

  {
    id: 'bg-remove',
    title: 'حذف الخلفية',
    description: 'إزالة خلفية الصور بضغطة زر واحدة',
    icon: Scissors,
    category: 'image',
    gradient: 'from-cyan-600/80 to-sky-600/80',
    image: '/images/ازالة الخلفية.png',
    href: '/ai/bg-remove'
  },
  {
    id: 'restore',
    title: 'ترميم الصور',
    description: 'إصلاح الصور التالفة والقديمة',
    icon: RefreshCw,
    category: 'image',
    gradient: 'from-amber-600/80 to-orange-600/80',
    image: '/images/ترميم الصور .jpeg',
    href: '/ai/restore'
  },
  {
    id: 'avatar',
    title: 'صانع الأفاتار',
    description: 'صمم شخصيات أفاتار مخصصة وفريدة',
    icon: Users,
    category: 'image',
    gradient: 'from-rose-600/80 to-red-600/80',
    image: '/images/انشاء افاتار.png',
    href: '/ai/avatar'
  },
  {
    id: 'nano',
    title: 'نانو بانانا برو',
    description: 'توليد صور فائق السرعة وبجودة عالية',
    icon: Zap,
    category: 'image',
    gradient: 'from-yellow-500/80 to-amber-600/80',
    image: '/images/Whisk_d2a441bc8622fa5b2774cf54a715f70feg.png',
    href: '/ai/nano'
  },
  {
    id: 'product',
    title: 'نماذج لمنتجك',
    description: 'صور احترافية لمنتجاتك بخلفيات ذكية',
    icon: Camera,
    category: 'image',
    gradient: 'from-red-600/80 to-pink-600/80',
    image: '/images/نماذج لمنتجك.png',
    href: '/ai/product'
  },
  {
    id: 'colorize',
    title: 'تلوين الصور',
    description: 'أعد الحياة للصور القديمة بالألوان',
    icon: Palette,
    category: 'image',
    gradient: 'from-teal-600/80 to-emerald-600/80',
    image: 'https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=1000&auto=format&fit=crop',
    href: '/ai/colorize'
  },
  {
    id: 'edit',
    title: 'المحرر الذكي',
    description: 'تعديل الصور بالذكاء الاصطناعي',
    icon: Brush,
    category: 'image',
    gradient: 'from-indigo-600/80 to-purple-600/80',
    image: 'https://images.unsplash.com/photo-1598449356475-b9f71db7d847?q=80&w=1000&auto=format&fit=crop',
    href: '/ai/edit'
  },
  {
    id: 'sketch',
    title: 'رسم إلى صورة',
    description: 'حول مسوداتك إلى أعمال فنية احترافية',
    icon: Brush,
    category: 'image',
    gradient: 'from-orange-600/80 to-red-600/80',
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=1000&auto=format&fit=crop',
    href: '/ai/sketch'
  },
  {
    id: 'logo',
    title: 'صانع الشعارات',
    description: 'تصميم شعارات احترافية للعلامات التجارية',
    icon: Crown,
    category: 'image',
    gradient: 'from-blue-600/80 to-indigo-600/80',
    image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=1000',
    href: '/ai/logo'
  }
];

const VIDEO_TOOLS = [
  {
    id: 'video',
    title: 'انشاء فيديوهات احترافية',
    description: 'اصنع فيديوهات رائعة من النصوص باستخدام Veo 2.0',
    icon: Video,
    category: 'video',
    gradient: 'from-blue-600/80 to-cyan-600/80',
    image: '/images/تاثيرات الفيديو.png',
    href: '/ai/video',
    featured: true
  },
  {
    id: 'motion',
    title: 'تحريك الصور',
    description: 'أضف حركة حية لصورك الثابتة',
    icon: Move3D,
    category: 'video',
    gradient: 'from-sky-600/80 to-blue-600/80',
    image: '/images/محاكاة الحركة.png',
    href: '/ai/motion',
    featured: true
  },
  {
    id: 'lipsync',
    title: 'تحريك الشفاه',
    description: 'طابق حركة الشفاه مع الصوت بدقة مذهلة',
    icon: Mic,
    category: 'video',
    gradient: 'from-pink-600/80 to-purple-600/80',
    image: '/images/تحريك الشفاه.png',
    href: '/ai/lipsync',
    featured: true,
    comingSoon: true
  },
  {
    id: 'effects',
    title: 'تأثيرات الفيديو',
    description: 'أضف تأثيرات سينمائية لفيديوهاتك',
    icon: Layers,
    category: 'video',
    gradient: 'from-fuchsia-600/80 to-purple-600/80',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000&auto=format&fit=crop',
    href: '/ai/effects',
    featured: true,
    comingSoon: true
  },
  {
    id: 'long-video',
    title: 'الفيديو الطويل',
    description: 'إنشاء فيديوهات طويلة ومتسلسلة',
    icon: Film,
    category: 'video',
    gradient: 'from-blue-600/80 to-indigo-600/80',
    image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=1000&auto=format&fit=crop',
    href: '/ai/long-video',
    comingSoon: true
  },
  
  {
    id: 'ugc',
    title: 'محتوى المستخدم',
    description: 'توليد فيديوهات بأسلوب UGC',
    icon: Users,
    category: 'video',
    gradient: 'from-teal-600/80 to-cyan-600/80',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1000&auto=format&fit=crop',
    href: '/ai/ugc',
    comingSoon: true
  },
  {
    id: 'vupscale',
    title: 'تحسين الفيديو',
    description: 'رفع دقة ووضوح مقاطع الفيديو',
    icon: Maximize,
    category: 'video',
    gradient: 'from-indigo-600/80 to-blue-600/80',
    image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1000&auto=format&fit=crop',
    href: '/ai/vupscale',
    comingSoon: true
  },
  {
    id: 'resize',
    title: 'تحجيم الفيديو',
    description: 'تغيير أبعاد الفيديو بذكاء',
    icon: Maximize,
    category: 'video',
    gradient: 'from-cyan-600/80 to-blue-600/80',
    image: '/images/تغيير الابعاد.png',
    href: '/ai/resize',
    comingSoon: true
  }
];

export default function MediaPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<'image' | 'video'>('image');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const category = searchParams.get('category');
    if (category === 'video') {
      setActiveCategory('video');
    } else {
      setActiveCategory('image');
    }
  }, [searchParams]);

  const currentTools = activeCategory === 'image' ? IMAGE_TOOLS : VIDEO_TOOLS;
  const featuredTools = currentTools.filter(tool => tool.featured);

  return (
    <div className="h-full bg-[#000000] text-white selection:bg-blue-500/30 font-sans" dir="rtl">
      {/* Dynamic Background */}
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      <div className="fixed top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-900/20 blur-[140px] rounded-full pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-900/20 blur-[140px] rounded-full pointer-events-none"></div>

      {/* Modern Header */}
      <header className={`sticky top-0 z-[100] transition-all duration-500 ${scrolled ? 'bg-black/80 backdrop-blur-2xl py-3' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            
            <Link 
              href="/dashboard" 
              className="px-6 py-2 rounded-full bg-white text-black text-sm font-black transition-all duration-300 hover:shadow-[0_15px_30px_-10px_rgba(255,255,255,0.4)] hover:scale-[1.03] active:scale-95 flex items-center gap-3 group relative overflow-hidden shadow-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <span className="relative z-10">عودة للرئيسية</span>
              <div className="relative z-10 flex items-center justify-center w-7 h-7 bg-black/[0.04] rounded-full group-hover:bg-black group-hover:text-white transition-all duration-300">
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform duration-300" />
              </div>
            </Link>

            <nav className="relative hidden lg:flex items-center gap-1 p-1.5 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-full shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]">
                {[
                    { name: 'الرئيسية', path: '/dashboard', icon: Sparkles, color: 'text-purple-400' },
                    { name: 'المحادثة', path: '/ai/chat', icon: MessageSquare, color: 'text-blue-400' },
                    { name: 'الميديا', path: '/ai/media', icon: Wand2, color: 'text-pink-400' },
                    { name: 'الخطط', path: '/ai/plans', icon: CreditCard, color: 'text-emerald-400' }
                ].map((item, idx) => (
                    <Link 
                        key={idx}
                        href={item.path}
                        className={`group relative px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 overflow-hidden ${
                            (item.path === '/ai/media') ? 'bg-white/10 text-white shadow-inner' : 'text-gray-300 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <item.icon size={16} className={`transition-all duration-300 ${item.color} ${item.path === '/ai/media' ? 'opacity-100 scale-110' : 'opacity-80 group-hover:opacity-100 group-hover:scale-110'}`} />
                        <span className="relative z-10">{item.name}</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </Link>
                ))}
                
                <div className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-white/50 to-transparent shadow-[0_0_15px_rgba(255,255,255,0.4)]"></div>
            </nav>
            <Link href="/dashboard" className="flex items-center gap-3 group">
                            <span className="text-2xl font-black tracking-tighter">NEXUS TOOLZ AI</span>

             <div className="relative w-fit rounded-full overflow-hidden">
               <Image
                src="/images/icon.png.png"
                alt="Logo"
                width={50}
                height={50}
                className="rounded-full"
              />
              <BorderBeam size={50} duration={1} className="rounded-full" />
             </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative   overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          

          <h1 className="text-5xl  font-black mb-8 leading-[1.1] tracking-tight">
           
            <span className="bg-gradient-to-r py-10 from-blue-600 via-purple-400 to-emerald-700 bg-clip-text text-transparent bg-300% animate-gradient block">
                {activeCategory === 'image' ? ' أنشئ الصور بواسطة أحدث موديلات الذكاء الاصطناعي' : ' صناعة الفيديو بواسطة أحدث موديلات الذكاء الاصطناعي'}
            </span>
          </h1>

          <div className="text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto mb-12 h-16">
            {/* @ts-ignore */}
            <TextType 
                text={[
                    activeCategory === 'image' ? "أدوات احترافية لتوليد وتعديل الصور" : "حوّل نصوصك إلى فيديوهات سينمائية",
                    "مستقبل الإبداع الرقمي بين يديك الآن"
                ]}
                typingSpeed={50}
                loop={true}
            />
          </div>

          {/* Category Switcher */}
          <div className="relative inline-flex items-center gap-1 p-1.5 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-full shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]">
                {[
                    { id: 'image', name: 'أدوات الصور', icon: ImageIcon, color: 'text-blue-400' },
                    { id: 'video', name: 'أدوات الفيديو', icon: Video, color: 'text-pink-400' }
                ].map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id as any)}
                        className={`group relative px-8 py-3 rounded-full text-sm font-bold transition-all duration-500 flex items-center gap-2 overflow-hidden ${
                            activeCategory === cat.id
                                ? 'bg-white/10 text-white shadow-inner'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <cat.icon size={18} className={`transition-all duration-300 ${cat.color} ${activeCategory === cat.id ? 'opacity-100 scale-110' : 'opacity-70 group-hover:opacity-100 group-hover:scale-110'}`} />
                        <span className="relative z-10">{cat.name}</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </button>
                ))}
                
                <div className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-white/50 to-transparent shadow-[0_0_15px_rgba(255,255,255,0.4)]"></div>
          </div>
        </div>
      </section>

     
      {/* All Tools Grid */}
      <section className="max-w-7xl mx-auto px-6 py-20 pb-40">
        <div className="flex items-center gap-4 mb-10">
            <div className="w-1.5 h-8 bg-blue-500 rounded-full"></div>
            <h2 className="text-3xl font-black">كافة الأدوات المتاحة</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {currentTools.map((tool) => {
                const isComingSoon = tool?.comingSoon;
                return (
                    <div
                        key={tool.id}
                        className={`group relative h-[300px] rounded-3xl overflow-hidden border border-white/5 transition-all duration-500 shadow-lg ${
                            isComingSoon ? 'cursor-not-allowed grayscale-[0.5]' : 'cursor-pointer hover:border-white/20'
                        }`}
                    >
                        {!isComingSoon ? (
                            <Link href={tool.href} className="absolute inset-0 z-10" />
                        ) : (
                            <div className="absolute top-0 left-0 z-20 w-32 h-32 overflow-hidden pointer-events-none">
                                <div className="absolute top-5 -left-10 w-40 bg-gradient-to-r from-emerald-600 via-teal-600 to-pink-600 backdrop-blur-xl text-white text-[10px] font-bold py-1.5 shadow-2xl transform -rotate-45 border-y border-white/10 flex justify-center items-center tracking-widest uppercase">
                                    قريباً
                                </div>
                            </div>
                        )}
                        
                        <img 
                            src={tool.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400'} 
                            alt={tool.title} 
                            className="absolute w-full h-full object-cover transition-all duration-700 " 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 transition-opacity group-hover:opacity-80"></div>

                        <div className="absolute inset-0 p-6 flex flex-col justify-end">
                            <h3 className="text-lg font-bold mb-1 text-white">{tool.title}</h3>
                            <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">{tool.description}</p>
                        </div>
                    </div>
                );
            })}
        </div>
      </section>


    </div>
  );
}