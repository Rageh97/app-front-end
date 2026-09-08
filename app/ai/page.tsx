"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronLeft, Workflow, Sparkles } from 'lucide-react';
import { useMyInfo } from '@/utils/user-info/getUserInfo';
import { AIToolCard } from '@/components/nexus/AIToolCard';
import {
  AI_CATEGORY_META,
  AIToolCategory,
  NEXUS_AI_TOOLS,
} from '@/lib/nexus-ai-catalog';

const DISPLAY_CATEGORIES: AIToolCategory[] = [
  'audio',
  'image',
  'edit',
  'video',
  'trend',
  'assistant',
];

export default function AIHomePage() {
  const { data } = useMyInfo();
  const [selectedCategory, setSelectedCategory] = useState<'all' | AIToolCategory>('all');
  const [customAssets, setCustomAssets] = useState<Record<string, string>>({});

  useEffect(() => {
    document.title = 'NEXUS AI | استوديو الإنتاج الذكي';
    const requestedCategory = new URLSearchParams(window.location.search).get('category') as AIToolCategory | null;
    if (requestedCategory && (DISPLAY_CATEGORIES.includes(requestedCategory) || requestedCategory === 'workflow')) {
      setSelectedCategory(requestedCategory);
    }

    const fetchAssets = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings/public/ai-assets`);
        if (response.ok) setCustomAssets(await response.json());
      } catch {}
    };
    fetchAssets();
  }, []);

  const hasAIPlan = data?.userCreditsData?.some((credit: any) => Number(credit?.remaining_credits || 0) > 0);

  const categorizedGroups = useMemo(() => DISPLAY_CATEGORIES.map((category) => ({
    category,
    meta: AI_CATEGORY_META[category],
    tools: NEXUS_AI_TOOLS.filter((tool) => tool.category === category),
  })).filter((group) => group.tools.length > 0), []);

  const filteredTools = useMemo(() => {
    if (selectedCategory === 'all') return [];
    return NEXUS_AI_TOOLS.filter((tool) => tool.category === selectedCategory);
  }, [selectedCategory]);

  const getToolImage = (id: string, fallback: string) => customAssets[id]
    ? `${process.env.NEXT_PUBLIC_API_URL}${customAssets[id]}`
    : fallback;

  return (
    <div className="nexus-page min-h-screen overflow-x-hidden text-white bg-[#05070d]" dir="rtl">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/[0.075] bg-[#06080e]/90 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-[1460px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center transition-transform hover:scale-105 duration-300">
            <img 
              className="object-contain h-9 md:h-10 w-auto" 
              src="/images/logoN.png" 
              alt="NEXUS" 
            />
          </Link>

          <nav className="hidden items-center gap-1 rounded-xl border border-white/[0.07] bg-white/[0.035] p-1 lg:flex" aria-label="التنقل في استوديو الذكاء الاصطناعي">
            <Link href="/ai" className="rounded-lg bg-white px-4 py-2 text-[11px] font-black text-[#06080e]">الأدوات</Link>
            <Link href="/ai/spaces" className="rounded-lg px-4 py-2 text-[11px] font-bold text-slate-400 transition hover:bg-white/[0.05] hover:text-white">Spaces</Link>
            <Link href="/ai/gallery" className="rounded-lg px-4 py-2 text-[11px] font-bold text-slate-400 transition hover:bg-white/[0.05] hover:text-white">المعرض</Link>
            <Link href="/ai/plans" className="rounded-lg px-4 py-2 text-[11px] font-bold text-slate-400 transition hover:bg-white/[0.05] hover:text-white">الخطط</Link>
          </nav>

          <Link href="/dashboard" className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/[0.08] hover:text-white">
            لوحة التحكم <ArrowLeft size={13} />
          </Link>
        </div>
      </header>

      <main>
        {/* Hero Header */}
        <section className="relative ">
          <div className="nexus-dot-grid pointer-events-none absolute inset-0 opacity-20" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_0%,rgba(52,211,153,.12),transparent_30rem)]" />
          <div className="relative mx-auto max-w-[1460px] px-4 py-12 sm:px-6 md:py-16 lg:px-8">
            <div className="max-w-4xl">
              <h1 className="text-3xl font-black text-white sm:text-4xl">
                أدوات الذكاء الاصطناعي
              </h1>
              <p className="mt-2.5 max-w-2xl text-xs sm:text-sm leading-6 text-slate-400">
                تصفح واستخدم كافة أدوات توليد الصور، تحريك الفيديو، الصوت، وتعديل المحتوى في مكان واحد.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {NEXUS_AI_TOOLS.length} أداة ذكاء اصطناعي متاحة
                </span>
                {/* {hasAIPlan && (
                  <span className="text-xs text-slate-400">
                    • رصيدك متاح للاستخدام الفوري
                  </span>
                )} */}
              </div>
            </div>
          </div>
        </section>

        {/* Category Sticky Filters */}
        <section id="tools-library" className="mx-auto max-w-[1460px] px-4 pb-24 sm:px-6 lg:px-8">
          <div className="sticky top-16 z-40 -mx-2 mb-10 border-y border-white/[0.06] bg-[#05070d]/92 px-2 py-4 backdrop-blur-2xl">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`h-10 shrink-0 rounded-xl px-4 text-xs font-black transition ${
                  selectedCategory === 'all'
                    ? 'bg-white text-[#06080e] shadow-sm'
                    : 'border border-white/[0.07] bg-white/[0.025] text-slate-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                جميع الأدوات ({NEXUS_AI_TOOLS.length})
              </button>

              {DISPLAY_CATEGORIES.map((category) => {
                const meta = AI_CATEGORY_META[category];
                const count = NEXUS_AI_TOOLS.filter(t => t.category === category).length;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`h-10 shrink-0 rounded-xl px-4 text-xs font-black transition flex items-center gap-2 ${
                      selectedCategory === category
                        ? 'bg-white text-[#06080e] shadow-sm'
                        : 'border border-white/[0.07] bg-white/[0.025] text-slate-400 hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    <span>{meta.shortLabel}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${selectedCategory === category ? 'bg-black/15 text-black' : 'bg-white/10 text-slate-400'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}

              <Link
                href="/ai/spaces"
                className="h-10 shrink-0 rounded-xl px-4 text-xs font-black border border-emerald-400/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition flex items-center gap-1.5 mr-auto"
              >
                <Workflow size={14} />
                <span>NEXUS Spaces</span>
              </Link>
            </div>
          </div>

          {/* Single Filtered Category View */}
          {selectedCategory !== 'all' ? (
            <div>
              <div className="mb-8 flex items-end justify-between">
                <div>
                  <p className="mb-1 text-[10px] font-black tracking-[0.18em] uppercase text-slate-400">
                    تصنيف محدد
                  </p>
                  <h2 className={`inline-block text-2xl font-black ${AI_CATEGORY_META[selectedCategory as AIToolCategory]?.shimmerClass}`}>
                    {AI_CATEGORY_META[selectedCategory as AIToolCategory]?.label}
                  </h2>
                  <p className="mt-1.5 text-xs text-slate-500">
                    {AI_CATEGORY_META[selectedCategory as AIToolCategory]?.description}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/[0.08] transition"
                >
                  عرض جميع الأقسام
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredTools.map((tool) => (
                  <AIToolCard key={tool.id} tool={tool} image={getToolImage(tool.id, tool.image)} />
                ))}
              </div>
            </div>
          ) : (
            /* All Categorized Groups View */
            <div className="space-y-16">
              {categorizedGroups.map(({ category, meta, tools }) => (
                <section key={category} aria-labelledby={`group-${category}`} className="border-t border-white/[0.06] pt-10 first:border-t-0 first:pt-0">
                  <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                    <div>
                      <p className="mb-1 text-[10px] font-black tracking-[0.18em] uppercase text-slate-400">
                        {category === 'audio' && ''}
                        {category === 'image' && ''}
                        {category === 'edit' && ''}
                        {category === 'video' && ''}
                        {category === 'trend' && ''}
                        {category === 'assistant' && ''}
                      </p>
                      <h2 id={`group-${category}`} className={`inline-block text-2xl font-black ${meta.shimmerClass}`}>
                        {meta.label}
                      </h2>
                      <p className="mt-1.5 text-xs text-slate-500">{meta.description}</p>
                    </div>

                    <span className="text-xs font-bold text-slate-500">
                      {tools.length} أدوات
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {tools.map((tool) => (
                      <AIToolCard key={tool.id} tool={tool} image={getToolImage(tool.id, tool.image)} />
                    ))}
                  </div>
                </section>
              ))}

              {/* NEXUS Spaces Highlight Section */}
              <section className="rounded-[26px] border border-white/[0.08] bg-[#080b13] p-6 sm:p-8 md:grid-cols-[1fr_auto] md:items-center grid gap-5">
                <div>
                  <p className="text-[10px] font-black tracking-[0.18em] text-emerald-300">NEXUS SPACES</p>
                  <h2 className="mt-2 text-2xl font-black text-white animate-emerald-shimmer">
                    اربط الأدوات في مسار إنتاج واحد
                  </h2>
                  <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-400">
                    استخدم Spaces لربط أدوات الصور والفيديو والصوت معًا في خط إنتاج آلي ومتكامل من وصف نصي واحد.
                  </p>
                </div>
                <Link
                  href="/ai/spaces"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-xs font-black text-[#06080e] transition hover:bg-emerald-300"
                >
                  افتح NEXUS Spaces <ChevronLeft size={14} />
                </Link>
              </section>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
