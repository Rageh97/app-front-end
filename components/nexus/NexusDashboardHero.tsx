import Link from 'next/link';
import {
  ArrowLeft,
  AudioLines,
  CheckCircle2,
  Image as ImageIcon,
  Network,
  Play,
  Sparkles,
  Video,
  Workflow,
} from 'lucide-react';
import { BorderBeam } from '@/components/ui/border-beam';

interface NexusDashboardHeroProps {
  firstName?: string;
  credits?: number;
}

const capabilities = [
  { icon: ImageIcon, label: 'صور أصلية حتى 4K', color: 'text-violet-300' },
  { icon: Video, label: 'فيديو بصوت متزامن', color: 'text-sky-300' },
  { icon: AudioLines, label: 'أصوات عربية طبيعية', color: 'text-emerald-300' },
];

export function NexusDashboardHero({ firstName, credits = 0 }: NexusDashboardHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-white/[0.09] bg-[#070a12] shadow-[0_28px_90px_rgba(0,0,0,0.34)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_8%,rgba(16,185,129,0.13),transparent_29%),radial-gradient(circle_at_12%_90%,rgba(124,58,237,0.14),transparent_32%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="relative grid min-h-[430px] items-center gap-8 p-6 sm:p-8 lg:grid-cols-[0.92fr_1.08fr] lg:p-10 xl:p-12">
        <div className="order-2 space-y-7 text-right lg:order-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-3 py-1.5 text-[11px] font-bold text-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" />
              NEXUS SPACES
            </span>
            {credits > 0 && (
              <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold text-slate-300">
                {credits.toLocaleString('ar-EG')} نقطة متاحة
              </span>
            )}
          </div>

          <div className="space-y-4">
            <p className="text-sm font-bold text-slate-400">أهلاً {firstName || 'بك'}، جاهز نصنع شيئًا استثنائيًا؟</p>
            <h1 className="max-w-3xl text-4xl font-black leading-[1.35] sm:leading-[1.3] xl:leading-[1.28] text-white sm:text-5xl xl:text-6xl pb-1">
              <span className="inline-block animate-emerald-shimmer pb-1">فكرتك تبدأ هنا،</span>
              <span className="block bg-gradient-to-l from-emerald-300 via-cyan-300 to-violet-300 bg-clip-text text-transparent pb-2">
                وتخرج جاهزة للنشر.
              </span>
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
              أنشئ الصور والفيديو والصوت، أو اربط الأدوات معًا داخل Spaces لبناء خط إنتاج كامل من وصف واحد.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/ai/spaces"
              className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-md bg-white px-5 py-2 text-sm font-black text-[#06080e] transition hover:bg-emerald-300"
            >
              <Workflow size={18} />
              افتح NEXUS Spaces
              <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            </Link>
            <Link
              href="/ai"
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-md border border-white/[0.1] bg-white/[0.045] px-5 py-2 text-sm font-bold text-white transition hover:border-white/20 hover:bg-white/[0.08]"
            >
              {/* <Sparkles size={18} className="text-violet-300" /> */}
              استكشف كل الأدوات
            </Link>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {capabilities.map((item) => (
              <div key={item.label} className="flex items-center gap-2 rounded-xl border border-white/[0.065] bg-black/20 px-3 py-2.5 text-[11px] font-bold text-slate-300">
                <item.icon size={14} className={item.color} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <Link href="/ai/spaces" className="group relative block rounded-[24px] border border-white/[0.1] bg-[#0a0e19] p-2 shadow-2xl">
            <div className="relative aspect-[16/10] overflow-hidden rounded-[18px] border border-white/[0.08] bg-[#05070d]">
              <img
                src="/images/spaces.webp"
                alt="واجهة NEXUS Spaces لبناء مسارات العمل"
                className="h-full w-full  object-center opacity-90 transition duration-700 group-hover:scale-[1.025] group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#05070d] via-transparent to-transparent" />
              {/* <div className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-xl border border-white/[0.1] bg-[#070a12]/90 p-3 backdrop-blur-xl sm:inset-x-4 sm:bottom-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-400 text-[#06100d]">
                    <Network size={18} />
                  </span>
                  <div>
                    <p className="text-xs font-black text-white">مسار إنتاج متكامل</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">Prompt → Image → Motion → Output</p>
                  </div>
                </div>
                <span className="hidden items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300 sm:inline-flex">
                  <CheckCircle2 size={12} /> جاهز
                </span>
              </div> */}
            </div>
            <BorderBeam size={220} duration={8} colorFrom="#34d399" colorTo="#8b5cf6" borderWidth={1} />
          </Link>

          <div className="mx-auto mt-3 flex w-fit items-center gap-2 rounded-full border border-white/[0.07] bg-black/20 px-3 py-1.5 text-[10px] font-bold text-slate-500">
            <Play size={11} className="fill-emerald-400 text-emerald-400" />
            شغّل مسارًا كاملاً مع حفظ النتائج والتكلفة
          </div>
        </div>
      </div>
    </section>
  );
}

