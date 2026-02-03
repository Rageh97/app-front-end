"use client";

import { useEffect, useMemo } from "react";
import dayjs from "dayjs";
import Link from "next/link";
import {
  CalendarDays,
  Crown,
  Layers,
  Mail,
  ShieldCheck,
  UserRound,
  Zap,
} from "lucide-react";
import { useMyInfo } from "@/utils/user-info/getUserInfo";
import { fullDateTimeFormat } from "@/utils/timeFormatting";
import { useTranslation } from "react-i18next";

type ActiveSubscription = {
  type: "plan" | "pack" | "tool" | "credit";
  name: string;
  endsAt?: string;
  startsAt?: string;
  remaining?: number;
};

const Profile = () => {
  const { data } = useMyInfo();
  const { i18n } = useTranslation();

  const firstName = data?.userData?.firstName ?? "";
  const lastName = data?.userData?.lastName ?? "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Nexus Member";
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .map((segment) => segment.trim().charAt(0)?.toUpperCase())
    .slice(0, 2)
    .join("") || "NM";

  const activeSubscription = useMemo<ActiveSubscription | null>(() => {
    const selectSoonestByExpiry = (items?: any[]) => {
      if (!items?.length) return null;
      return [...items].sort((a, b) => {
        const aDate = dayjs(a?.endedAt ?? a?.createdAt ?? 0).valueOf();
        const bDate = dayjs(b?.endedAt ?? b?.createdAt ?? 0).valueOf();
        return aDate - bDate;
      })[0];
    };

    const planRecord = selectSoonestByExpiry(data?.userPlansData);
    if (planRecord) {
      return {
        type: "plan" as const,
        name: planRecord?.plan_name ?? "",
        endsAt: planRecord?.endedAt,
        startsAt: planRecord?.createdAt,
      };
    }

    const packRecord = selectSoonestByExpiry(data?.userPacksData);
    if (packRecord) {
      const packName =
        data?.packsData?.find((pack: any) => pack.pack_id === packRecord.pack_id)
          ?.pack_name ?? "Pack Access";
      return {
        type: "pack" as const,
        name: packName,
        endsAt: packRecord?.endedAt,
        startsAt: packRecord?.createdAt,
      };
    }

    const toolRecord = selectSoonestByExpiry(data?.userToolsData);
    if (toolRecord) {
      const toolName =
        data?.toolsData?.find((tool: any) => tool.tool_id === toolRecord.tool_id)
          ?.tool_name ?? "Active Tool";
      return {
        type: "tool" as const,
        name: toolName,
        endsAt: toolRecord?.endedAt,
        startsAt: toolRecord?.createdAt,
      };
    }

    const creditRecord = selectSoonestByExpiry(data?.userCreditsData?.filter((c: any) => c.remaining_credits > 0));
    if (creditRecord) {
        return {
            type: "credit" as const,
            name: creditRecord.plan_id === 1 ? "Starter AI" : creditRecord.plan_id === 2 ? "Pro AI" : "Business AI",
            endsAt: creditRecord.endedAt,
            startsAt: creditRecord.createdAt,
            remaining: creditRecord.remaining_credits
        };
    }

    return null;
  }, [data?.packsData, data?.toolsData, data?.userPacksData, data?.userPlansData, data?.userToolsData, data?.userCreditsData]);

  const planEndsAt = activeSubscription?.endsAt ?? null;
  const planCreatedAt = activeSubscription?.startsAt ?? null;
  const remainingDays = planEndsAt
    ? Math.max(dayjs(planEndsAt).diff(dayjs(), "day"), 0)
    : null;

  const isArabic = i18n.language?.toLowerCase().startsWith("ar");

  useEffect(() => {
    document.title = `${fullName} | Nexus Toolz`;
  }, [fullName]);

  const copy = useMemo(
    () => ({
      heroHeading: isArabic ? "ملفك الشخصي" : "Your Personal Hub",
      heroSubheading: isArabic
        ? "راجع تفاصيل الحساب، راقب الاشتراك، وتحكّم بمستواك الاحترافي في مكان واحد."
        : "Review account details, monitor your plan, and stay in control from one professional view.",
      ctaLabel: isArabic ? "تحديث أو ترقية الاشتراك" : "Upgrade or manage subscription",
      accountSectionTitle: isArabic ? "بيانات الحساب" : "Account Information",
      subscriptionSectionTitle: isArabic ? "تفاصيل الاشتراك" : "Subscription Overview",
      stats: {
        plan: isArabic ? "الخطة الحالية" : "Current Plan",
        expiry: isArabic ? "تاريخ الانتهاء" : "Renewal / Expiry",
        tools: isArabic ? "أدوات مفعلة" : "Active Tools",
        packs: isArabic ? "باقات نشطة" : "Active Packs",
      },
      placeholders: {
        noPlan: isArabic ? "لا يوجد اشتراك فعال" : "No active subscription",
        noDate: isArabic ? "غير متاح" : "Not available",
      },
      accountFields: [
        { label: isArabic ? "الاسم الأول" : "First Name", value: firstName || "—" },
        { label: isArabic ? "الاسم الأخير" : "Last Name", value: lastName || "—" },
        { label: isArabic ? "البريد الإلكتروني" : "Email Address", value: data?.userData?.email ?? "—" },
        // { label: isArabic ? "معرّف المستخدم" : "User ID", value: data?.userData?.userId ? `NT-${data.userData.userId}` : "—" },
        // { label: isArabic ? "دور الحساب" : "Role", value: mapRoleLabel(data?.userData?.role, isArabic) },
      ],
      subscriptionBadges: {
        standard: isArabic ? "الوصول القياسي" : "Standard Access",
        premium: isArabic ? "باقة بريميوم" : "Premium Experience",
        vip: isArabic ? "باقة VIP" : "VIP Elite Access",
      },
      subscriptionHighlights: {
        // coverageTitle: isArabic ? "التغطية" : "Coverage",
        expiresTitle: isArabic ? "ينتهي في" : "Expires on",
        remainingTitle: isArabic ? "المدة المتبقية" : "Time remaining",
        activatedTitle: isArabic ? "تم التفعيل" : "Activated on",
        upgradeTitle: isArabic ? "احصل على خطة احترافية خلال ثوانٍ" : "Unlock a professional-grade plan in seconds",
        upgradeSubtitle: isArabic
          ? "ارفع حدودك مع خطط موثوقة وشراكات عالمية."
          : "Push beyond limits with curated plans and enterprise-grade reliability.",
        upgradeAction: isArabic ? "اكتشف الخطط" : "Explore plans",
      },
      emptySubscriptionHint: isArabic
        ? "لم يتم ربط أي اشتراك بعد. لا تفوّت الأدوات الحصرية والدعم المميز."
        : "No subscription linked yet. Don’t miss out on exclusive tools and priority support.",
    }),
    [data?.userData?.email, data?.userData?.role, data?.userData?.userId, firstName, isArabic, lastName]
  );

  const subscriptionDisplayName = getSubscriptionDisplayName(
    activeSubscription,
    copy,
    isArabic
  );

  const statCards = [
    {
      label: copy.stats.plan,
      value: subscriptionDisplayName,
      caption: activeSubscription
        ? getSubscriptionCaption(activeSubscription, isArabic)
        : copy.placeholders.noPlan,
      icon: <Crown size={26} className="text-[#E1FE26]" />,
      accent: "from-[#7b2ff7] to-[#f107a3]",
    },
    {
      label: copy.stats.expiry,
      value: planEndsAt ? fullDateTimeFormat(planEndsAt) : copy.placeholders.noDate,
      caption:
        remainingDays !== null
          ? `${remainingDays} ${isArabic ? "يوم متبقٍ" : "days left"}`
          : isArabic
          ? "تحديث الاشتراك يبقي خدماتك فعّالة"
          : "Stay active by keeping your plan current",
      icon: <CalendarDays size={26} className="text-[#FBD38D]" />,
      accent: "from-[#ff7702] to-[#ff9865]",
    },
    {
      label: copy.stats.tools,
      value: data?.userToolsData?.length ?? 0,
      caption: isArabic ? "أدوات قابلة للإطلاق الآن" : "Launch-ready tools today",
      icon: <Layers size={26} className="text-[#6EE7B7]" />,
      accent: "from-[#00c48c] to-[#038a87]",
    },
    {
      label: copy.stats.packs,
      value: data?.userPacksData?.length ?? 0,
      caption: isArabic ? "باقات فعالة" : "Packs currently active",
      icon: <ShieldCheck size={26} className="text-[#93C5FD]" />,
      accent: "from-[#4f46e5] to-[#7c3aed]",
    },
  ];

  return (
    <div className="space-y-8 py-8">
      <section className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#4f008c,#190237,#0c061c)] p-6 md:p-10 text-white shadow-[0_25px_80px_rgba(15,3,41,0.55)] inner-shadow">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent_55%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/30 bg-white/10 text-2xl font-semibold tracking-widest">
              {initials}
            </div>
            <div>
              <p className="text-lg uppercase tracking-[0.3em] text-white">{copy.heroHeading}</p>
              <h1 className="text-3xl font-bold md:text-4xl">{fullName}</h1>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-1 text-sm text-white/80">
                <Mail size={16} /> {data?.userData?.email ?? "user@nexustoolz.com"}
              </div>
            </div>
          </div>
          {/* <div className="space-y-3 text-sm text-white/80 lg:max-w-xl">
            <p>{copy.heroSubheading}</p>
            <Link
              href="/plans"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#00c48c] px-5 py-3 text-sm font-semibold uppercase tracking-wide text-black shadow-lg transition duration-300 hover:bg-[#19f9b5]"
            >
              <Zap size={18} />
              {copy.ctaLabel}
            </Link>
          </div> */}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card, index) => (
          <div
            key={card.label}
            className={`relative overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#1a1030,#0d061f)] p-5 border border-white/10 shadow-lg`}
          >
            <div
              className={`absolute inset-0 opacity-40 bg-gradient-to-br ${card.accent}`}
            />
            <div className="relative flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-lg uppercase tracking-[0.2em] text-white">{card.label}</p>
                <div className="rounded-full bg-black/20 p-2">{card.icon}</div>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{card.value}</p>
                {card.caption && <p className="text-sm text-white/70 mt-1">{card.caption}</p>}
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-3xl border border-white/10 bg-[#19023780] p-6 shadow-[0_20px_60px_rgba(4,0,20,0.35)]">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <UserRound className="text-[#00c48c]" />
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[#00c48c]">{copy.accountSectionTitle}</p>
                <h2 className="text-xl font-semibold text-white">{fullName}</h2>
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {copy.accountFields.map((field) => (
                <div key={field.label} className="rounded-2xl bg-white/5 p-4 border border-white/10">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#00c48c]">{field.label}</p>
                  <p className="mt-1 text-lg font-semibold text-white">{field.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-3xl  bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent_55%)] p-6 shadow-[0_25px_80px_rgba(10,0,20,0.8)]">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <Crown className="text-[#ffcc00]" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#00c48c]">{copy.subscriptionSectionTitle}</p>
              <h3 className="text-xl font-semibold text-white">
                {subscriptionDisplayName}
              </h3>
            </div>
          </div>
          {activeSubscription ? (
            <div className="mt-6 space-y-5">
              <InfoLine
                title={copy.subscriptionHighlights.coverageTitle}
                value={getSubscriptionCoverage(activeSubscription, isArabic)}
              />
              <InfoLine
                title={copy.subscriptionHighlights.expiresTitle}
                value={planEndsAt ? fullDateTimeFormat(planEndsAt) : copy.placeholders.noDate}
              />
              <InfoLine
                title={copy.subscriptionHighlights.remainingTitle}
                value={
                  remainingDays !== null
                    ? `${remainingDays} ${isArabic ? "يوم" : "days"}`
                    : copy.placeholders.noDate
                }
              />
              <InfoLine
                title={copy.subscriptionHighlights.activatedTitle}
                value={planCreatedAt ? fullDateTimeFormat(planCreatedAt) : copy.placeholders.noDate}
              />
              {/* <Link
                href="/plans"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/30 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-white/10"
              >
                <ShieldCheck size={18} />
                {copy.ctaLabel}
              </Link> */}
            </div>
          ) : (
            <div className="mt-6 space-y-4 text-white/80">
              <p className="text-lg font-semibold">{copy.subscriptionHighlights.upgradeTitle}</p>
              <p className="text-sm">{copy.subscriptionHighlights.upgradeSubtitle}</p>
              <p className="rounded-2xl border border-dashed border-white/30 bg-white/5 p-4 text-sm">
                {copy.emptySubscriptionHint}
              </p>
              <Link
                href="/plans"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#ff7702] px-4 py-3 text-sm font-semibold uppercase tracking-wide text-black shadow-lg transition hover:bg-[#ff9d4d]"
              >
                <Zap size={18} />
                {copy.subscriptionHighlights.upgradeAction}
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

const mapRoleLabel = (role?: string, isArabic?: boolean) => {
  if (!role) {
    return isArabic ? "عضو" : "Member";
  }
  const labels: Record<string, { ar: string; en: string }> = {
    admin: { en: "Administrator", ar: "مسؤول" },
    manager: { en: "Manager", ar: "مدير" },
    supervisor: { en: "Supervisor", ar: "مشرف" },
    employee: { en: "Team Member", ar: "موظف" },
    user: { en: "Member", ar: "عضو" },
  };
  const normalized = role.toLowerCase();
  return isArabic ? labels[normalized]?.ar ?? "عضو" : labels[normalized]?.en ?? "Member";
};

const getSubscriptionDisplayName = (
  subscription: ActiveSubscription | null,
  copy: any,
  isArabic: boolean
) => {
  if (!subscription) {
    return copy.placeholders.noPlan;
  }

  if (subscription.type === "plan") {
    const key = subscription.name?.toLowerCase();
    return (
      copy.subscriptionBadges[key as keyof typeof copy.subscriptionBadges] ??
      subscription.name?.toUpperCase()
    );
  }

  if (subscription.type === "pack") {
    return `${isArabic ? "باقة" : "Pack"} • ${subscription.name}`;
  }
  
  if (subscription.type === "credit") {
     return `${isArabic ? "خطة ذكاء" : "AI Plan"} • ${subscription.name}`;
  }

  return `${isArabic ? "أداة" : "Tool"} • ${subscription.name}`;
};

const getSubscriptionCaption = (
  subscription: ActiveSubscription | null,
  isArabic: boolean
) => {
  if (!subscription) {
    return "";
  }

  switch (subscription.type) {
    case "plan":
      return isArabic ? "خطة عضوية فعّالة" : "Active membership plan";
    case "pack":
      return isArabic ? "باقات قيد التفعيل" : "Active pack entitlement";
    case "credit":
       return isArabic ? `رصيد نشط: ${subscription.remaining} نقطة` : `Active Balance: ${subscription.remaining} Credits`;
    case "tool":
    default:
      return isArabic ? "أداة مفعّلة" : "Active tool access";
  }
};

const getPlanCoverage = (planName: string, isArabic: boolean) => {
  const coverage: Record<string, { ar: string; en: string }> = {
    standard: {
      en: "Essential toolkit with daily access to core services.",
      ar: "أدوات أساسية مع وصول يومي إلى الخدمات الرئيسية.",
    },
    premium: {
      en: "Extended catalog + faster support response windows.",
      ar: "كتالوج موسّع مع سرعة أعلى في استجابة الدعم.",
    },
    vip: {
      en: "Full suite, priority queue, and concierge onboarding.",
      ar: "الوصول الكامل، دعم فوري، وخدمة مرافقة متخصصة.",
    },
  };
  const normalized = planName?.toLowerCase();
  return isArabic ? coverage[normalized]?.ar ?? coverage.standard.ar : coverage[normalized]?.en ?? coverage.standard.en;
};

const getSubscriptionCoverage = (
  subscription: ActiveSubscription | null,
  isArabic: boolean
) => {
  if (!subscription) {
    return isArabic ? "لا يوجد اشتراك فعّال" : "No active subscription";
  }

  if (subscription.type === "plan") {
    return getPlanCoverage(subscription.name, isArabic);
  }

  if (subscription.type === "credit") {
      return isArabic ? "وصول شامل لأدوات الذكاء الاصطناعي مع رصيد نقاط." : "Full access to AI tools with credit balance.";
  }

  // if (subscription.type === "pack") {
  //   return isArabic
  //     ? "باقة أدوات مختارة بوقت صلاحية محدد."
  //     : "Curated tool pack with a defined validity window.";
  // }

  // return isArabic
  //   ? "وصول مخصص لأداة واحدة بمدة صلاحية محدودة."
  //   : "Single tool entitlement with a limited validity period.";
};

const InfoLine = ({ title, value }: { title: string; value: string }) => (
  <div className="rounded-2xl  bg-black/10 px-4 py-3 text-sm text-white/80">
    <p className="text-xs uppercase tracking-[0.2em] text-[#00c48c]">{title}</p>
    <p className="mt-1 text-base font-semibold text-white">{value}</p>
  </div>
);

export default Profile;
