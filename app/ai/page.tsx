"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
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
  ArrowLeft
} from 'lucide-react';
import TextType from "@/components/TextType";
import Image from "next/image";
import { BorderBeam } from "@/components/ui/border-beam";

const AI_TOOLS = [
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
  // {
  //   id: 'upscale',
  //   title: 'رفع دقة الصور',
  //   description: 'حسن جودة الصور وزد من دقتها بذكاء',
  //   icon: Maximize,
  //   category: 'image',
  //   gradient: 'from-indigo-600/80 to-purple-600/80',
  //   image: '/images/رفع جودة الصور.png',
  //   href: '/ai/upscale'
  // },
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const featuredTools = AI_TOOLS.filter(tool => tool.featured);
  const filteredTools = selectedCategory === 'all' 
    ? AI_TOOLS 
    : AI_TOOLS.filter(tool => tool.category === selectedCategory);

  return (
    <div className="h-full bg-[#000000] text-white selection:bg-blue-500/30 font-sans" dir="rtl">
      {/* Dynamic Background */}
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      <div className="fixed top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-900/20 blur-[140px] rounded-full pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-900/20 blur-[140px] rounded-full pointer-events-none"></div>

      {/* Modern Header */}
      <header className={`sticky top-0 z-[100] transition-all duration-500 ${scrolled ? 'bg-black/80 backdrop-blur-2xl  py-3' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <Link 
              href="/dashboard" 
              className="px-6 py-2 rounded-full bg-white text-black text-sm font-black transition-all duration-300 hover:shadow-[0_15px_30px_-10px_rgba(255,255,255,0.4)] hover:scale-[1.03] active:scale-95 flex items-center gap-3 group relative overflow-hidden shadow-xl"
            >
              {/* Dynamic Sheen Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <span className="relative z-10">عودة للرئيسية</span>
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
                        {/* Interactive Sheen */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </Link>
                ))}
                
                {/* Persistent Glowing Center Line (The "Board" effect) */}
                <div className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-white/50 to-transparent shadow-[0_0_15px_rgba(255,255,255,0.4)]"></div>
            </nav>

            <Link href="/dashboard" className="flex items-center gap-3 group">
              {/* <div className="w-11 h-11 bg-white text-black rounded-2xl flex items-center justify-center shadow-xl group-hover:rotate-[10deg] transition-all duration-500">
                <Sparkles size={24} fill="currentColor" />
              </div> */}
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

      {/* Hero Content */}
      <section className="relative   overflow-hidden">
        <div className="max-w-7xl mx-auto px-6  text-center relative z-10">
          
          <h1 className="text-6xl mb-10 md:text-8xl font-black  leading-[1.1] tracking-tight">
            {/* <span className="text-white block"> NEXUS AI</span> */}
            <span className="bg-gradient-to-r py-5 from-blue-600 via-purple-400 to-emerald-700 bg-clip-text text-transparent bg-300% animate-gradient block">
                 NEXUS TOOLZ PRO
            </span>
          </h1>

          <div className="text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto  h-16">
            {/* @ts-ignore */}
            <TextType 
                text={["حول خيالك إلى حقيقة في ثوانٍ", "مستقبل الذكاء الاصطناعي الآن بين يديك"]}
                typingSpeed={50}
                loop={true}
            />
          </div>

          
        </div>
      </section>

      {/* Featured Tools - Full Image Boxes */}
      <section className="max-w-7xl mx-auto px-6 ">
         <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
                <div className="w-1.5 h-10 bg-blue-500 rounded-full"></div>
                <div>
                    <h2 className="text-3xl font-black">الأدوات المميزة</h2>
                    <p className="text-gray-500 text-sm mt-1">الأدوات الأكثر قوة وشهرة في الاستوديو</p>
                </div>
            </div>
            <Link href="#all" className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors">عرض كافة الأدوات</Link>
         </div>

         <div className="grid  md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredTools.map((tool) => (
                <Link
                    key={tool.id}
                    href={tool.href}
                    className="group relative h-[450px] rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl transition-all duration-700 hover:scale-[1.02] hover:border-white/30"
                >
                    {/* Background Image */}
                    <img 
                        src={tool.image} 
                        alt={tool.title} 
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 " 
                    />
                    
                    {/* Overlay Gradients */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 transition-opacity group-hover:opacity-80"></div>
                    {/* <div className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} mix-blend-multiply opacity-40 group-hover:opacity-60 transition-all duration-700`}></div> */}

                    {/* Content */}
                    <div className="absolute inset-0 p-8 flex flex-col justify-end">
                          {/* <div className="w-14 h-14 bg-white/10 backdrop-blur-2xl rounded-2xl flex items-center justify-center mb-6 border border-white/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                              <tool.icon size={28} className="text-white" />
                          </div> */}
                        <h3 className="text-3xl font-black mb-3 text-white group-hover:translate-x-1 transition-transform">{tool.title}</h3>
                        <p className="text-gray-300 text-sm leading-relaxed mb-6 line-clamp-2">{tool.description}</p>
                        
                        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-300 w-fit">
                            <span className="text-xs font-black uppercase tracking-widest text-white/90">جرب الأداة الآن</span>
                            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                                <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
                            </div>
                        </div>
                    </div>

                  
                </Link>
            ))}
         </div>
      </section>

      {/* Filtered Tools Library */}
      <section id="all" className="max-w-7xl mx-auto px-6 py-20 pb-40">
        <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-10"> تصفح كامل الأدوات</h2>
            <div className="relative inline-flex items-center gap-1 p-1.5 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-full shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]">
                {[
                    { id: 'all', name: 'عرض الكل', icon: Layers, color: 'text-purple-400' },
                    { id: 'image', name: 'أدوات الصور', icon: ImageIcon, color: 'text-blue-400' },
                    { id: 'video', name: 'أدوات الفيديو', icon: Video, color: 'text-pink-400' }
                ].map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`group relative px-4 md:px-8 py-2.5 rounded-full text-sm font-bold transition-all duration-500 flex items-center gap-2 overflow-hidden ${
                            selectedCategory === cat.id
                                ? 'bg-white/10 text-white shadow-inner'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <cat.icon size={16} className={`transition-all duration-300 ${cat.color} ${selectedCategory === cat.id ? 'opacity-100 scale-110' : 'opacity-70 group-hover:opacity-100 group-hover:scale-110'}`} />
                        <span className="relative z-10">{cat.name}</span>
                        
                        {/* Interactive Sheen */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </button>
                ))}

                {/* Persistent Glowing Center Line (The "Board" effect) */}
                <div className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-white/50 to-transparent shadow-[0_0_15px_rgba(255,255,255,0.4)]"></div>
            </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-6">
            {filteredTools.map((tool) => {
                const isComingSoon = tool.comingSoon;
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

      {/* Footer CTA */}
      {/* <div className="max-w-7xl mx-auto px-6 pb-24 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="relative overflow-hidden rounded-[3rem] bg-[#0a0a0a] border border-white/5 p-20 text-center shadow-2xl">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">ابدأ في بناء <br/> مستقبلك الإبداعي</h2>
            <p className="text-gray-500 mb-10 text-lg leading-relaxed">
              انضم إلى آلاف المبدعين الذين يستخدمون نيكسوس يومياً لتوفير الوقت والجهد وتحقيق نتائج مذهلة.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                    href="/ai/plans"
                    className="px-10 py-5 bg-white text-black rounded-2xl font-bold hover:scale-105 transition-all text-lg"
                >
                    ترقية حسابك للبرو
                </Link>
                <div className="flex items-center gap-3 px-6 py-4 bg-white/5 rounded-2xl border border-white/5">
                    <Crown size={20} className="text-yellow-500" fill="currentColor" />
                    <span className="text-sm font-bold text-gray-400">نيكسوس برو متاح الآن</span>
                </div>
            </div>
          </div>
        </div>
      </div> */}
    </div>
  );
}
