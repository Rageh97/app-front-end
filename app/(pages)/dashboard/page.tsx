"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Sparkles, Film, Type, Globe, ArrowUpLeft, Star } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { useMyInfo } from '@/utils/user-info/getUserInfo';
import PremiumLoader from '@/components/PremiumLoader';
import { NexusDashboardHero } from '@/components/nexus/NexusDashboardHero';
import { AIToolCard } from '@/components/nexus/AIToolCard';
import { WebToolCard } from '@/components/nexus/WebToolCard';
import { CORE_AI_TOOLS, READY_AI_TOOLS, TREND_AI_TOOLS } from '@/lib/nexus-ai-catalog';
import { NewToolsDto } from '@/types/tools/new-tools-dto';
import ToolModalDetails from '@/components/Modals/ToolModalDetails';
import ModalPayment from '@/components/Modals/PaymentModal';
import CihBankOrderDetailsInfoModal from '@/components/Modals/CihBankOrderDetailsInfoModal';
import TijariBankOrderDetailsInfoModal from '@/components/Modals/TijariBankOrderDetailsInfoModal';
import ToolErrorExtention from '@/components/Modals/ToolErrorExtention';
import ReviewModal from '@/components/Modals/ReviewModal';

type Period = "month" | "year" | "day";

const PLATFORM_AREAS = [
  {
    title: 'استوديو الذكاء الاصطناعي',
    description: 'توليد وتعديل الصور، الفيديو السينمائي، والتعليق الصوتي والموسيقى بأحدث النماذج.',
    href: '/ai',
    cardBg: 'bg-gradient-to-br from-emerald-500/[0.09] via-[#0a0d18] to-[#070912] border-emerald-500/25 hover:border-emerald-500/45',
    topGlow: 'via-emerald-400/40',
    ambientGlow: 'bg-emerald-500/12',
  },
  {
    title: 'مكتبة الميديا',
    description: 'آلاف المؤثرات البصرية، القوالب الجاهزة، ومقاطع الفيديو بدقة 4K للمصممين.',
    href: '/media-hub',
    cardBg: 'bg-gradient-to-br from-violet-500/[0.09] via-[#0a0d18] to-[#070912] border-violet-500/25 hover:border-violet-500/45',
    topGlow: 'via-violet-400/40',
    ambientGlow: 'bg-violet-500/12',
  },
  {
    title: 'مكتبة الخطوط',
    description: 'أفخم الخطوط العربية والطباعية لتصميم الهويات الإعلانية ومحتوى السوشيال ميديا.',
    href: '/fonts',
    cardBg: 'bg-gradient-to-br from-sky-500/[0.09] via-[#0a0d18] to-[#070912] border-sky-500/25 hover:border-sky-500/45',
    topGlow: 'via-sky-400/40',
    ambientGlow: 'bg-sky-500/12',
  },
  {
    title: 'أدوات المواقع',
    description: 'اشتراكات فورية وحسابات سحابية مباشرة لأشهر المواقع العالمية والتصميم.',
    href: '/dashboard/web-tools',
    cardBg: 'bg-gradient-to-br from-amber-500/[0.09] via-[#0a0d18] to-[#070912] border-amber-500/25 hover:border-amber-500/45',
    topGlow: 'via-amber-400/40',
    ambientGlow: 'bg-amber-500/12',
  },
];

const ACCOUNT_LINKS = [
  { title: 'اشتراكاتي', href: '/subscriptions' },
  { title: 'سجل الطلبات', href: '/orders' },
  { title: 'الباقات والخطط', href: '/plans' },
];

export default function DashboardPage() {
  const { data } = useMyInfo();
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [customAssets, setCustomAssets] = useState<Record<string, string>>({});
  const [mediaCategories, setMediaCategories] = useState<any[]>([]);

  // Modals state for Web Tools
  const [selectedTool, setSelectedTool] = useState<NewToolsDto | null>(null);
  const [openDetailModal, setOpenDetailModal] = useState<boolean>(false);
  const [openPaymentModal, setOpenPaymentModal] = useState<boolean>(false);
  const [openCihDetailsModal, setOpenCihDetailsModal] = useState<boolean>(false);
  const [openTijariDetailsModal, setOpenTijariDetailsModal] = useState<boolean>(false);
  const [openReviewModal, setOpenReviewModal] = useState<boolean>(false);
  const [showExtensionModal, setShowExtensionModal] = useState<boolean>(false);
  const [period, setPeriod] = useState<Period>("month");
  const [extensionDetected, setExtensionDetected] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return !!global.freeToolsExtensionDetected;
  });

  useEffect(() => {
    document.title = 'NEXUS PRO | مركز العمل الإبداعي';
    const fetchAssets = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings/public/ai-assets`);
        if (response.ok) setCustomAssets(await response.json());
      } catch {}
    };
    fetchAssets();

    const fetchMediaCats = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/media/categories`);
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            const withCovers = list.filter((c: any) => Boolean(c.cover_image || c.cover_image_url));
            setMediaCategories(withCovers.slice(0, 15));
          }
        }
      } catch {}
    };
    fetchMediaCats();

    const handleExtensionPing = (event: MessageEvent) => {
      if (
        event.data?.type === "FREE_TOOLS_EXTENSION_PONG" ||
        event.data?.type === "FROM_CONTENT_SCRIPT"
      ) {
        global.freeToolsExtensionDetected = true;
        setExtensionDetected(true);
      }
    };
    window.addEventListener("message", handleExtensionPing);

    const timer = window.setTimeout(() => setIsLoadingPage(false), 180);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("message", handleExtensionPing);
    };
  }, []);

  const credits = useMemo(() => data?.userCreditsData?.reduce(
    (total: number, credit: any) => total + Number(credit?.remaining_credits || 0), 0
  ) || 0, [data]);

  const webTools = useMemo(() => {
    const list: NewToolsDto[] = data?.toolsData || [];
    const seen = new Set<string>();
    return list.filter((tool: any) => {
      if (!tool?.tool_name) return false;
      const cleanName = tool.tool_name.trim();
      if (seen.has(cleanName)) return false;
      seen.add(cleanName);
      return true;
    });
  }, [data]);

  const getToolImage = (id: string, fallback: string) => customAssets[id]
    ? `${process.env.NEXT_PUBLIC_API_URL}${customAssets[id]}`
    : fallback;

  const handleToolClick = (tool: NewToolsDto) => {
    if (tool?.isFree) {
      if (!extensionDetected && tool?.tool_mode !== "cloud") {
        setShowExtensionModal(true);
        return;
      }
      if (tool?.tool_url && typeof window !== "undefined") {
        window.open(tool.tool_url, "_blank", "noopener,noreferrer");
      }
      return;
    }
    setPeriod("month");
    setSelectedTool(tool);
    setOpenDetailModal(true);
  };

  if (isLoadingPage) return <PremiumLoader />;

  return (
    <div className="nexus-page -mx-2 min-h-screen pb-6 sm:-mx-4 md:-mx-6 lg:-mx-8" dir="rtl">
      <div className="mx-auto max-w-[1460px] space-y-14 px-4 pb-8 pt-5 sm:px-6 lg:px-8 lg:pt-8">
        <NexusDashboardHero firstName={data?.userData?.firstName} credits={credits} />

        <section aria-labelledby="core-production-tools">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 id="core-production-tools" className="inline-block text-2xl font-black sm:text-3xl animate-emerald-shimmer">أدوات الإنتاج الأساسية</h2>
            </div>
            <Link href="/ai" className="hidden items-center gap-2 text-xs font-bold text-slate-400 transition hover:text-white sm:flex">كل أدوات AI <ChevronLeft size={14} /></Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {CORE_AI_TOOLS.map((tool) => <AIToolCard key={tool.id} tool={tool} image={getToolImage(tool.id, tool.image)} />)}
          </div>
        </section>

        {/* Web Tools Section Slider - Right after Core Production Tools */}
        {webTools.length > 0 && (
          <section aria-labelledby="web-tools-section" className="border-t border-white/[0.07] pt-12">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="web-tools-section" className="inline-block text-2xl font-black sm:text-3xl animate-gold-shimmer">
                  أدوات المواقع وحسابات التصميم
                </h2>
                <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-500">
                  حسابات مباشرة واشتراكات مدفوعة لأشهر المواقع العالمية (Envato, Freepik, Canva, والمزيد) مع وصول سحابي فوري.
                </p>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <Link 
                  href="/dashboard/web-tools" 
                  className="hidden items-center gap-1.5 text-xs font-bold text-slate-400 transition hover:text-amber-300 md:flex"
                >
                  <span>كل الأدوات ({webTools.length})</span>
                  <ChevronLeft size={14} />
                </Link>

                {/* Swiper Custom Navigation Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    id="web-tools-prev-btn"
                    aria-label="السابق"
                    className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.08] bg-white/5 dark:bg-[#090d18] text-slate-300 dark:text-slate-400 transition hover:border-amber-400/40 hover:bg-white/10 dark:hover:bg-[#101626] hover:text-white active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button
                    id="web-tools-next-btn"
                    aria-label="التالي"
                    className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.08] bg-white/5 dark:bg-[#090d18] text-slate-300 dark:text-slate-400 transition hover:border-amber-400/40 hover:bg-white/10 dark:hover:bg-[#101626] hover:text-white active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronLeft size={16} />
                  </button>
                </div>
              </div>
            </div>

            <Swiper
              key={`web-tools-slider-${webTools.length}`}
              modules={[Navigation, Autoplay]}
              navigation={{
                prevEl: '#web-tools-prev-btn',
                nextEl: '#web-tools-next-btn',
              }}
              onBeforeInit={(swiper) => {
                if (typeof swiper.params.navigation !== 'boolean' && swiper.params.navigation) {
                  swiper.params.navigation.prevEl = '#web-tools-prev-btn';
                  swiper.params.navigation.nextEl = '#web-tools-next-btn';
                }
              }}
              spaceBetween={14}
              slidesPerView={1.25}
              loop={webTools.length >= 6}
              speed={550}
              autoplay={{
                delay: 3500,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              dir="rtl"
              breakpoints={{
                480: {
                  slidesPerView: 2,
                  spaceBetween: 14,
                },
                640: {
                  slidesPerView: 2.5,
                  spaceBetween: 16,
                },
                768: {
                  slidesPerView: 3,
                  spaceBetween: 16,
                },
                1024: {
                  slidesPerView: 4,
                  spaceBetween: 16,
                },
                1280: {
                  slidesPerView: 5,
                  spaceBetween: 18,
                },
              }}
              className="w-full !py-2"
            >
              {webTools.map((tool) => (
                <SwiperSlide key={tool.tool_id} className="h-auto">
                  <WebToolCard 
                    tool={tool} 
                    onClick={() => handleToolClick(tool)} 
                    compact 
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </section>
        )}

        <section aria-labelledby="trend-tools" className="border-y border-white/[0.07] py-10">
          <div className="mb-6">
            <h2 id="trend-tools" className="inline-block text-2xl font-black animate-fuchsia-shimmer">أدوات الترند </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {TREND_AI_TOOLS.map((tool) => <AIToolCard key={tool.id} tool={tool} image={getToolImage(tool.id, tool.image)} compact />)}
          </div>
        </section>

        {/* Media Categories Slider Section - Only Existing Categories from DB */}
        {mediaCategories.length > 0 && (
          <section aria-labelledby="media-categories-section" className="space-y-4 pt-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="media-categories-section" className="inline-block text-2xl font-black sm:text-3xl animate-emerald-shimmer">
                  تصنيفات مكتبة الميديا
                </h2>
                <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-500">
                  أحدث المؤثرات البصرية، القوالب الجاهزة، ومقاطع الفيديو بدقة 4K للمصممين.
                </p>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Link
                  href="/media-hub"
                  className="ml-2 inline-flex items-center gap-1 text-xs font-bold text-slate-400 transition hover:text-white"
                >
                  <span>مكتبة الميديا</span>
                  <ChevronLeft size={14} />
                </Link>
                <button
                  id="media-cats-prev-btn"
                  aria-label="السابق"
                  className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-400 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white active:scale-95"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  id="media-cats-next-btn"
                  aria-label="التالي"
                  className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-400 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white active:scale-95"
                >
                  <ChevronLeft size={16} />
                </button>
              </div>
            </div>

            <Swiper
              modules={[Autoplay, Navigation]}
              navigation={{
                prevEl: '#media-cats-prev-btn',
                nextEl: '#media-cats-next-btn',
              }}
              onBeforeInit={(swiper) => {
                if (typeof swiper.params.navigation !== 'boolean' && swiper.params.navigation) {
                  swiper.params.navigation.prevEl = '#media-cats-prev-btn';
                  swiper.params.navigation.nextEl = '#media-cats-next-btn';
                }
              }}
              spaceBetween={14}
              slidesPerView={1.5}
              loop={mediaCategories.length >= 6}
              speed={550}
              autoplay={{
                delay: 3200,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              dir="rtl"
              breakpoints={{
                480: {
                  slidesPerView: 2.2,
                  spaceBetween: 14,
                },
                640: {
                  slidesPerView: 3,
                  spaceBetween: 16,
                },
                768: {
                  slidesPerView: 3.5,
                  spaceBetween: 16,
                },
                1024: {
                  slidesPerView: 4.5,
                  spaceBetween: 16,
                },
                1280: {
                  slidesPerView: 5.5,
                  spaceBetween: 18,
                },
              }}
              className="w-full !py-2"
            >
              {mediaCategories.map((cat) => {
                const cover = cat.cover_image || cat.cover_image_url;
                if (!cover) return null;
                return (
                  <SwiperSlide key={cat.category_id} className="h-auto">
                    <Link
                      href={`/media-hub/category/${cat.category_id}`}
                      className="group relative block aspect-[16/10] rounded-xl p-[1px] bg-white/[0.08] hover:bg-gradient-to-tr hover:from-emerald-500/80 hover:via-teal-400 hover:to-emerald-400 transition-all duration-300"
                    >
                      <div className="relative h-full w-full overflow-hidden rounded-[11px] bg-[#0A0D18]">
                        <img
                          src={cover}
                          alt={cat.name || 'تصنيف ميديا'}
                          className="h-full w-full object-cover opacity-72 transition duration-500 group-hover:opacity-85"
                          loading="lazy"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070910] via-[#070910]/50 to-transparent" />
                      </div>
                    </Link>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </section>
        )}

        {/* NEXUS Spaces Section */}
        <section className="grid gap-5 overflow-hidden rounded-[26px] border border-white/10 dark:border-white/[0.08] bg-white/[0.03] dark:bg-[#080b13] backdrop-blur-md p-6 sm:p-8 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-[10px] font-black tracking-[0.18em] text-emerald-300">NEXUS SPACES</p>
            <h2 className="mt-2 inline-block text-2xl font-black animate-emerald-shimmer">حوّل أدواتك إلى خط إنتاج واحد</h2>
            <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-500">استخدم Spaces عندما تحتاج ربط أكثر من أداة وحفظ المسار لإعادة تشغيله، وليس كبديل عن الوصول السريع للأدوات الأساسية.</p>
          </div>
          <Link href="/ai/spaces" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-xs font-black text-[#06080e] transition hover:bg-emerald-300">افتح Spaces <ChevronLeft size={14} /></Link>
        </section>

        {/* Platform Sections - 4 Cards with Rich Ambient Gradient Glow */}
        <section aria-labelledby="platform-sections" className="space-y-4">
          <div>
            <h2 id="platform-sections" className="inline-block text-xl font-black sm:text-2xl animate-sky-shimmer">
              المكتبات والموارد الإضافية
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {PLATFORM_AREAS.map((area) => (
              <Link
                key={area.title}
                href={area.href}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-[22px] border p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 ${area.cardBg}`}
              >
                {/* Permanent Ambient Corner Glow */}
                <div
                  className={`pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full ${area.ambientGlow} blur-2xl`}
                />

                {/* Permanent Top Shimmer Accent Line */}
                <div
                  className={`pointer-events-none absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent ${area.topGlow} to-transparent`}
                />

                <div className="relative z-10">
                  <div className="flex items-center justify-between gap-3 text-right">
                    <h3 className="text-base font-black text-white transition-colors group-hover:text-white">
                      {area.title}
                    </h3>
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-slate-300 transition-all duration-300 group-hover:bg-white/10 group-hover:text-white">
                      <ArrowUpLeft size={15} />
                    </span>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-slate-400">
                    {area.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-white/10 dark:border-white/[0.06] bg-white/[0.03] dark:bg-white/[0.02] backdrop-blur-md p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="inline-block text-sm font-black animate-emerald-shimmer">الحساب والدعم</h2>
            <p className="mt-1 text-[11px] text-slate-500">إدارة الاشتراك والطلبات أو التواصل الفوري مع الدعم الفني.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {ACCOUNT_LINKS.map((item) => (
              <Link key={item.title} href={item.href} className="rounded-lg border border-white/[0.07] px-3 py-2 text-[11px] font-bold text-slate-400 transition hover:bg-white/[0.05] hover:text-white">
                {item.title}
              </Link>
            ))}
            <a
              href="https://wa.me/9647702930873"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-[11px] font-bold text-emerald-400 transition hover:bg-emerald-500/20 hover:text-emerald-300 shadow-sm"
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.057 22l4.98-1.308A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm4.992 13.923c-.207.583-1.025 1.092-1.636 1.22-.418.087-.965.157-2.798-.605-2.347-.974-3.86-3.344-3.978-3.5-.115-.157-.946-1.26-.946-2.403 0-1.144.598-1.708.81-1.942.213-.234.464-.292.619-.292.155 0 .31.002.445.008.143.007.334-.055.522.398.193.465.658 1.605.716 1.722.058.117.097.253.02.408-.077.155-.116.252-.232.388-.116.136-.245.304-.35.408-.117.117-.238.243-.102.476.136.233.603.996 1.295 1.613.89.794 1.64 1.04 1.873 1.156.233.117.369.097.505-.058.136-.156.582-.68.737-.913.155-.233.31-.194.524-.116.213.077 1.357.64 1.59.757.233.116.388.174.446.271.058.098.058.563-.149 1.146z"
                  fill="#25D366"
                />
              </svg>
              <span>تواصل عبر واتساب</span>
            </a>
            <button
              onClick={() => setOpenReviewModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] font-bold text-amber-400 transition hover:bg-amber-500/20 hover:text-amber-300 shadow-sm"
            >
              <Star size={13} className="fill-amber-400 text-amber-400" />
              <span>قيمنا</span>
            </button>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-support-chat'))}
              className="rounded-lg border border-white/[0.07] px-3 py-2 text-[11px] font-bold text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
            >
              الدعم المباشر
            </button>
          </div>
        </section>
      </div>

      {/* Review Modal */}
      <ReviewModal
        modalOpen={openReviewModal}
        setModalOpen={setOpenReviewModal}
      />

      {/* Modals for Web Tools */}
      {selectedTool && (
        <>
          <ToolModalDetails
            modalOpen={openDetailModal}
            setModalOpen={setOpenDetailModal}
            toolData={selectedTool}
            onBuy={() => {
              setOpenDetailModal(false);
              setOpenPaymentModal(true);
            }}
            period={period}
            setPeriod={setPeriod}
          />
          <ModalPayment
            modalOpen={openPaymentModal}
            setModalOpen={setOpenPaymentModal}
            productId={selectedTool?.tool_id}
            productData={selectedTool}
            productType="tool"
            period={period}
            onBuySuccess={(bankName: "cih" | "tijari") => {
              setOpenPaymentModal(false);
              if (bankName === "cih") {
                setOpenCihDetailsModal(true);
              } else {
                setOpenTijariDetailsModal(true);
              }
            }}
          />
          <CihBankOrderDetailsInfoModal
            modalOpen={openCihDetailsModal}
            setModalOpen={setOpenCihDetailsModal}
            toolData={selectedTool}
            period={period}
          />
          <TijariBankOrderDetailsInfoModal
            modalOpen={openTijariDetailsModal}
            setModalOpen={setOpenTijariDetailsModal}
            toolData={selectedTool}
            period={period}
          />
        </>
      )}
      <ToolErrorExtention
        modalOpen={showExtensionModal}
        setModalOpen={setShowExtensionModal}
        message="يرجى تثبيت إضافة المتصفح لتشغيل الأدوات المجانية"
        title="الإضافة مطلوبة"
      />
    </div>
  );
}
