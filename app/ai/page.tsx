"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useMyInfo } from "@/utils/user-info/getUserInfo";
import { useTranslation } from 'react-i18next';
import { 
  MessageSquare, 
  Image as ImageIcon, 
  Video, 
  Sparkles,
  Wand2,
  Palette,
  Upload,
  Zap,
  Crown,
  Edit3,
  Scissors,
  RefreshCw,
  Camera,
  Film,
  Brush,
  Layers,
  Move3D,
  Users,
  Mic,
  Maximize,
  CreditCard,
  ChevronRight,
  Star,
  ArrowLeft,
  Shirt
} from 'lucide-react';
import TextType from "@/components/TextType";
import Image from "next/image";
import { BorderBeam } from "@/components/ui/border-beam";

const AI_TOOLS = [
  
  {
    id: 'nano',
    title: 'نانو بنانا',
    description: 'توليد صور فائق السرعة وبجودة عالية',
    icon: Zap,
    category: 'image',
    gradient: 'from-yellow-500/80 to-amber-600/80',
    image: '/images/Whisk_d2a441bc8622fa5b2774cf54a715f70feg.png',
    href: '/ai/nano',
    featured: true
  },
  {
    id: 'video',
    title: 'انشاء فيديوهات احترافية',
    description: 'اصنع فيديوهات رائعة من النصوص باستخدام Veo 2.0',
    icon: Video,
    category: 'video',
    gradient: 'from-blue-600/80 to-cyan-600/80',
    image: '/images/تاثيرات الفيديو.png',
    href: '/ai/video',
    featured: true,
    maintenance: true
  },
  {
    id: 'chat',
    title: 'نيكسوس GPT ',
    description: 'أقوى مساعد ذكي للإجابة على تساؤلاتك وتوليد الأكواد',
    icon: MessageSquare,
    category: 'image',
    gradient: 'from-purple-600/80 to-pink-600/80',
    image: '/images/chat.jpg',
    href: '/ai/chat',
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
    href: '/ai/image-to-text'
  },
  {
    id: 'image',
    title: 'انشاء صور سينمائية',
    description: 'أنشئ صوراً مذهلة من النصوص باستخدام Imagen 4.0',
    icon: ImageIcon,
    category: 'image',
    gradient: 'from-violet-600/80 to-indigo-600/80',
    image: '/images/انشاء الصور.png',
    href: '/ai/image'
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
    id: 'restore',
    title: 'ترميم الصور',
    description: 'إصلاح الصور التالفة والقديمة',
    icon: RefreshCw,
    category: 'image',
    gradient: 'from-amber-600/80 to-orange-600/80',
    image: '/images/ترميم الصور.png',
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
    image: '/images/تلوين الصورة.png',
    href: '/ai/colorize'
  },
  {
    id: 'edit',
    title: 'المحرر الذكي',
    description: 'تعديل الصور بالذكاء اصطناعي',
    icon: Brush,
    category: 'image',
    gradient: 'from-indigo-600/80 to-purple-600/80',
    image: '/images/تعديل الصور.png',
    href: '/ai/edit'
  },
  {
    id: 'sketch',
    title: 'رسم إلى صورة',
    description: 'حول مسوداتك إلى أعمال فنية احترافية',
    icon: Brush,
    category: 'image',
    gradient: 'from-orange-600/80 to-red-600/80',
    image: '/images/رسم الصور.png',
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
    maintenance: true
  },
  {
    id: 'long-video',
    title: ' انشاء فيديو طويل',
    description: 'إنشاء فيديوهات طويلة ومتسلسلة',
    icon: Film,
    category: 'video',
    gradient: 'from-blue-600/80 to-indigo-600/80',
    image: 'https://i.pinimg.com/736x/cb/6f/c9/cb6fc9278dcb1d456a88e1f21325b05c.jpg',
    href: '/ai/long-video',
    comingSoon: true
  },
  {
    id: 'effects',
    title: 'تأثيرات الفيديو',
    description: 'أضف تأثيرات سينمائية لفيديوهاتك',
    icon: Layers,
    category: 'video',
    gradient: 'from-fuchsia-600/80 to-purple-600/80',
    image: '/images/تاثيرات الفيديو.png',
    href: '/ai/effects',
    comingSoon: true
  },
  {
    id: 'ugc',
    title: 'فيديوهات UGC',
    description: 'توليد فيديوهات بأسلوب UGC',
    icon: Users,
    category: 'video',
    gradient: 'from-teal-600/80 to-cyan-600/80',
    image: '/images/فيديوهات UGC.png',
    href: '/ai/ugc',
    comingSoon: true
  },
  {
    id: 'vupscale',
    title: 'تحسين جودة الفيديو',
    description: 'رفع دقة ووضوح مقاطع الفيديو',
    icon: Maximize,
    category: 'video',
    gradient: 'from-indigo-600/80 to-blue-600/80',
    image: '/images/رفع جودة الفيديو .png',
    href: '/ai/vupscale',
    comingSoon: true
  },
  {
    id: 'resize',
    title: 'تغيير أبعاد الفيديو',
    description: 'تغيير أبعاد الفيديو بذكاء',
    icon: Maximize,
    category: 'video',
    gradient: 'from-cyan-600/80 to-blue-600/80',
    image: '/images/تغيير الابعاد.png',
    href: '/ai/resize',
    comingSoon: true
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
    comingSoon: true
  }
];

export default function AIHomePage() {
  const { data } = useMyInfo();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [scrolled, setScrolled] = useState(false);
  const [customAssets, setCustomAssets] = useState<Record<string, string>>({});

  // Check if user has an AI plan
  const hasAIPlan = data?.userCreditsData?.some((c: any) => c.remaining_credits > 0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    // Fetch Custom Assets
    const fetchAssets = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings/public/ai-assets`);
        if (res.ok) {
          const data = await res.json();
          setCustomAssets(data);
        }
      } catch (e) { console.error("Failed to fetch ai assets", e); }
    };
    fetchAssets();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const featuredTools = AI_TOOLS.filter(tool => tool.featured);
  const filteredTools = selectedCategory === 'all' 
    ? AI_TOOLS 
    : AI_TOOLS.filter(tool => tool.category === selectedCategory);

  return (
    <div className="h-full bg-[#000000] text-white selection:bg-blue-500/30 font-sans overflow-x-hidden" dir="rtl">
      {/* Dynamic Background */}
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      <div className="fixed top-[-10%] left-[-10%] w-[80%] md:w-[60%] h-[60%] bg-blue-900/20 blur-[100px] md:blur-[140px] rounded-full pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[80%] md:w-[60%] h-[60%] bg-purple-900/20 blur-[100px] md:blur-[140px] rounded-full pointer-events-none"></div>

      {/* Modern Header */}
      <header className={`sticky top-0 z-[100] transition-all duration-500 ${scrolled ? 'bg-black/80 backdrop-blur-2xl py-3 shadow-lg' : 'bg-transparent py-4 md:py-6'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between gap-4">
            <Link 
              href="/dashboard" 
              className="px-4 md:px-6 py-2 rounded-full bg-white text-black text-sm font-black transition-all duration-300 hover:shadow-[0_15px_30px_-10px_rgba(255,255,255,0.4)] hover:scale-[1.03] active:scale-95 flex items-center gap-2 md:gap-3 group relative overflow-hidden shadow-xl shrink-0"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <span className="relative z-10 hidden sm:inline">عودة للرئيسية</span>
              <div className="relative z-10 flex items-center justify-center w-7 h-7 bg-black/[0.04] rounded-full group-hover:bg-black group-hover:text-white transition-all duration-300">
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform duration-300" />
              </div>
            </Link>

            <nav className="relative hidden lg:flex items-center gap-1 p-1.5 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-full shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]">
                {[
                    { name: 'الرئيسية', path: '/ai', icon: Sparkles, color: 'text-purple-400' },
                    { name: 'المحادثة', path: '/ai/chat', icon: MessageSquare, color: 'text-blue-400' },
                    { name: 'الميديا', path: '/ai/media', icon: Wand2, color: 'text-pink-400' },
                    { name: 'المعرض', path: '/ai/gallery', icon: Star, color: 'text-yellow-400' },
                    { name: 'الخطط', path: '/ai/plans', icon: CreditCard, color: 'text-emerald-400' }
                ].map((item, idx) => (
                    <Link 
                        key={idx}
                        href={item.path}
                        className="group relative px-6 py-2.5 rounded-full text-sm font-bold text-gray-300 hover:text-white transition-all duration-300 hover:bg-white/5 flex items-center gap-2 overflow-hidden"
                    >
                        <item.icon size={16} className={`transition-all duration-300 ${item.color} opacity-80 group-hover:opacity-100 group-hover:scale-110`} />
                        <span className="relative z-10">{item.name}</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </Link>
                ))}
                <div className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-white/50 to-transparent shadow-[0_0_15px_rgba(255,255,255,0.4)]"></div>
            </nav>

            <Link href="/dashboard" className="flex items-center gap-2 md:gap-3 group shrink-0">
              <span className="text-lg md:text-2xl font-black tracking-tighter truncate max-w-[120px] md:max-w-none">NEXUS TOOLZ</span>
              <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden shrink-0">
                <Image
                  src="/images/icon.png.png"
                  alt="Logo"
                  fill
                  className="rounded-full object-cover"
                />
                <BorderBeam size={40} duration={1} className="rounded-full" />
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Content */}
      <section className="relative overflow-hidden py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <h1 className="text-4xl md:text-8xl font-black leading-[1.2] md:leading-[1.1] tracking-tight mb-8">
            <span className="bg-gradient-to-r py-3 md:py-5 from-blue-600 via-purple-400 to-emerald-700 bg-clip-text text-transparent bg-300% animate-gradient block">
                 NEXUS TOOLZ PRO
            </span>
          </h1>
          <div className="text-lg md:text-2xl text-gray-500 max-w-2xl mx-auto h-20 md:h-16 px-4">
            <TextType 
                text={["حول خيالك إلى حقيقة في ثوانٍ", "مستقبل الذكاء الاصطناعي الآن بين يديك"]}
                typingSpeed={50}
                loop={true}
                
            />
          </div>
        </div>
      </section>

      {/* Featured Tools */}
      <section className="max-w-7xl mx-auto px-4 md:px-6">
         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-4">
            <div className="flex items-center gap-3 md:gap-4">
                <div className="w-1 h-6 md:h-8 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                <div>
                    <h2 className="text-xl md:text-2xl font-black">الأدوات المميزة</h2>
                    <p className="text-gray-500 text-[10px] md:text-xs mt-0.5">الأدوات الأكثر قوة وشهرة</p>
                </div>
            </div>
            <Link href="#all" className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/5 px-3 py-1.5 rounded-full border border-blue-500/10 hover:border-blue-500/30">عرض كافة الأدوات</Link>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {featuredTools.map((tool) => {
              const bgImage = customAssets[tool.id] ? `${process.env.NEXT_PUBLIC_API_URL}${customAssets[tool.id]}` : tool.image;
              const isMaintenance = (tool as any).maintenance;
              const isVideo = tool.category === 'video';
              const isLockedVideo = isVideo && !hasAIPlan;
              
              if (isMaintenance || isLockedVideo) {
                  return (
                    <div
                        key={tool.id}
                        className="group relative h-[300px] md:h-[400px] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl transition-all duration-700 grayscale-[0.5] cursor-not-allowed"
                    >
                        <img 
                            src={bgImage} 
                            alt={tool.title} 
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/30 opacity-90 transition-opacity"></div>
                        <div className="absolute inset-0 z-20 flex flex-col justify-center items-center bg-black/40 backdrop-blur-sm pointer-events-none text-center p-4">
                           {isMaintenance ? (
                             <>
                               <span className="text-white text-lg font-black bg-red-600/80 px-4 py-2 rounded-lg mb-2">صيانة النظام</span>
                               <span className="text-white/90 text-sm md:text-base font-bold max-w-[80%]">ستتوفر غدا نعمل على استرجاع الخدمة</span>
                             </>
                           ) : (
                             <>
                               <span className="text-white text-lg font-black bg-amber-600/80 px-4 py-2 rounded-lg mb-2">باقة AI فقط</span>
                               <span className="text-white/90 text-sm md:text-base font-bold max-w-[80%]">هذه الأداة متاحة فقط في باقات الـ AI الاحترافية</span>
                             </>
                           )}
                        </div>
                        <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end opacity-50">
                            <h3 className="text-xl md:text-2xl font-black mb-1 md:mb-2 text-white">{tool.title}</h3>
                            <p className="text-gray-300 text-[9px] md:text-xs leading-relaxed mb-4 md:mb-5 line-clamp-2 max-w-[90%]">{tool.description}</p>
                        </div>
                    </div>
                  );
              }

              return (
                <Link
                    key={tool.id}
                    href={tool.href}
                    className="group relative h-[300px] md:h-[400px] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl transition-all duration-700 hover:scale-[1.02] hover:border-white/20 active:scale-[0.98]"
                >
                    <img 
                        src={bgImage} 
                        alt={tool.title} 
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-90 transition-opacity group-hover:opacity-80"></div>
                    <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
                        <h3 className="text-xl md:text-2xl font-black mb-1 md:mb-2 text-white group-hover:translate-x-1 transition-transform">{tool.title}</h3>
                        <p className="text-gray-300 text-[9px] md:text-xs leading-relaxed mb-4 md:mb-5 line-clamp-2 max-w-[90%]">{tool.description}</p>
                        <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md group-hover:bg-white group-hover:text-black transition-all duration-300 w-fit">
                            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">عرض الموديل</span>
                            <ArrowLeft size={10} className="group-hover:-translate-x-0.5 transition-transform" />
                        </div>
                    </div>
                </Link>
              );
            })}
         </div>
      </section>

      {/* All Tools Library */}
      <section id="all" className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16 pb-24">
        <div className="text-center mb-10 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-black mb-6 md:mb-8"> تصفح المكتبة الذكية</h2>
            <div className="relative inline-flex flex-wrap justify-center items-center gap-2 p-1 bg-black/40 md:bg-black/60 backdrop-blur-3xl border border-white/10 rounded-full shadow-2xl">
                {[
                    { id: 'all', name: 'عرض الكل', icon: Layers, color: 'text-purple-400' },
                    { id: 'image', name: 'أدوات الصور', icon: ImageIcon, color: 'text-blue-400' },
                    { id: 'video', name: 'أدوات الفيديو', icon: Video, color: 'text-pink-400' }
                ].map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`group relative px-4 md:px-6 py-2 rounded-full text-[10px] md:text-xs font-bold transition-all duration-500 flex items-center gap-2 overflow-hidden ${
                            selectedCategory === cat.id
                                ? 'bg-white/10 text-white'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <cat.icon size={12} className={`transition-all duration-300 ${cat.color} ${selectedCategory === cat.id ? 'opacity-100 scale-110' : 'opacity-70 group-hover:opacity-100 group-hover:scale-110'}`} />
                        <span className="relative z-10">{cat.name}</span>
                    </button>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
            {filteredTools.map((tool) => {
                const isComingSoon = tool.comingSoon;
                const isNew = tool.isNew;
                const isMaintenance = (tool as any).maintenance;
                const isVideo = tool.category === 'video';
                const isLockedVideo = isVideo && !hasAIPlan;
                const bgImage = customAssets[tool.id] ? `${process.env.NEXT_PUBLIC_API_URL}${customAssets[tool.id]}` : tool.image;

                return (
                    <div
                        key={tool.id}
                        className={`group relative h-[180px] md:h-[220px] rounded-2xl md:rounded-3xl overflow-hidden border border-white/5 transition-all duration-500 shadow-lg ${
                            (isComingSoon || isMaintenance || isLockedVideo) ? 'cursor-not-allowed grayscale-[0.5]' : 'cursor-pointer hover:border-white/20 hover:scale-[1.02]'
                        }`}
                    >
                        {(!isComingSoon && !isMaintenance && !isLockedVideo) ? (
                            <Link href={tool.href} className="absolute inset-0 z-10" />
                        ) : isComingSoon ? (
                            <div className="absolute top-0 left-0 z-20 w-20 h-20 md:w-24 md:h-24 overflow-hidden pointer-events-none">
                                <div className="absolute top-3 md:top-4 -left-6 md:-left-8 w-24 md:w-32 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[7px] md:text-[8px] font-black py-1 shadow-2xl transform -rotate-45 flex justify-center items-center tracking-widest uppercase">
                                    قريباً
                                </div>
                            </div>
                        ) : isMaintenance ? (
                            <div className="absolute inset-0 z-20 flex flex-col justify-center items-center bg-black/60 backdrop-blur-sm pointer-events-none text-center p-2">
                                <span className="text-white text-xs md:text-sm font-bold bg-red-600/80 px-2 py-1 rounded mb-1">صيانة</span>
                                <span className="text-white/90 text-[9px] md:text-[10px] font-bold">ستتوفر غدا نعمل على استرجاع الخدمة</span>
                            </div>
                        ) : isLockedVideo ? (
                            <div className="absolute inset-0 z-20 flex flex-col justify-center items-center bg-black/60 backdrop-blur-sm pointer-events-none text-center p-2">
                                <span className="text-white text-[10px] md:text-xs font-bold bg-amber-600/80 px-2 py-1 rounded mb-1">باقة AI فقط</span>
                                <span className="text-white/90 text-[8px] md:text-[9px] font-bold">متاحة في باقات الـ AI</span>
                            </div>
                        ) : null}
                        {!isComingSoon && !isMaintenance && isNew && (
                            <div className="absolute top-0 left-0 z-20 w-24 h-24 md:w-32 md:h-32 overflow-hidden pointer-events-none">
                                <div className="absolute top-3 md:top-4 -left-10 md:-left-12 w-32 md:w-40 bg-red-600 text-white text-[7px] md:text-[9px] font-black py-1 shadow-2xl transform -rotate-45 flex justify-center items-center tracking-widest">
                                    NEW
                                </div>
                            </div>
                        )}
                        <img 
                            src={bgImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400'} 
                            alt={tool.title} 
                            className="absolute w-full h-full object-cover transition-all duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-60" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                        <div className="absolute inset-0 p-3 md:p-5 flex flex-col justify-end">
                            <h3 className="text-sm md:text-base font-black mb-0.5 text-white">{tool.title}</h3>
                            <p className="text-[8px] md:text-[9px] text-gray-500 line-clamp-1 leading-relaxed">{tool.description}</p>
                        </div>
                    </div>
                );
            })}
        </div>
      </section>
    </div>
  );
}
