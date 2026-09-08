"use client";

import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import Link from "next/link";
import { toast, Toaster } from "react-hot-toast";
import { useQueryClient } from "react-query";
import {
  CalendarDays,
  Crown,
  Layers,
  Mail,
  ShieldCheck,
  Zap,
  Lock,
  Eye,
  EyeOff,
  User,
  ShoppingBag,
  RefreshCw,
  Save,
  KeyRound,
  ArrowUpLeft,
  Globe
} from "lucide-react";
import { useMyInfo } from "@/utils/user-info/getUserInfo";
import { useTranslation } from "react-i18next";
import api from "@/utils/api";

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
  const queryClient = useQueryClient();
  const isArabic = i18n.language?.toLowerCase().startsWith("ar");

  // Tab State: 3 focused tabs
  const [activeTab, setActiveTab] = useState<"overview" | "personal" | "security">("overview");

  // Personal Info Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Synchronize state from user data
  useEffect(() => {
    if (data?.userData) {
      setFirstName(data.userData.firstName || "");
      setLastName(data.userData.lastName || "");
    }
  }, [data?.userData]);

  const fullName = [firstName, lastName].filter(Boolean).join(" ") || (isArabic ? "عضو نكسس" : "Nexus Member");

  useEffect(() => {
    document.title = `${fullName} | Nexus Toolz`;
  }, [fullName]);

  // Determine active subscription
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
        name: planRecord?.plan_name ?? (isArabic ? "عضوية بريميوم" : "Premium Membership"),
        endsAt: planRecord?.endedAt,
        startsAt: planRecord?.createdAt,
      };
    }

    const packRecord = selectSoonestByExpiry(data?.userPacksData);
    if (packRecord) {
      const packName =
        data?.packsData?.find((pack: any) => pack.pack_id === packRecord.pack_id)
          ?.pack_name ?? (isArabic ? "باقة أدوات" : "Tool Pack");
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
          ?.tool_name ?? (isArabic ? "أداة مفعلة" : "Active Tool");
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
  }, [data?.packsData, data?.toolsData, data?.userPacksData, data?.userPlansData, data?.userToolsData, data?.userCreditsData, isArabic]);

  const planEndsAt = activeSubscription?.endsAt ?? null;
  const planCreatedAt = activeSubscription?.startsAt ?? null;
  const remainingDays = planEndsAt
    ? Math.max(dayjs(planEndsAt).diff(dayjs(), "day"), 0)
    : null;

  // Calculate total credits
  const totalCredits = useMemo(() => {
    return data?.userCreditsData?.reduce(
      (total: number, credit: any) => total + Number(credit?.remaining_credits || 0),
      0
    ) || 0;
  }, [data?.userCreditsData]);

  // Handle Profile Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      toast.error(isArabic ? "يرجى كتابة الاسم الأول" : "First name is required");
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await api.put("/api/user/profile", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      if (res.data?.success) {
        toast.success(res.data.message || (isArabic ? "تم حفظ التعديلات بنجاح" : "Profile updated successfully"));
        await queryClient.invalidateQueries(["userData"]);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (isArabic ? "فشل تحديث البيانات" : "Failed to update profile"));
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Password Update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error(isArabic ? "يرجى كتابة كلمة المرور الحالية" : "Current password required");
      return;
    }
    if (newPassword.length < 6) {
      toast.error(isArabic ? "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل" : "New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(isArabic ? "كلمتا المرور غير متطابقتين" : "Passwords do not match");
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await api.put("/api/user/password", {
        currentPassword,
        newPassword,
      });

      if (res.data?.success) {
        toast.success(res.data.message || (isArabic ? "تم تحديث كلمة المرور بنجاح" : "Password updated successfully"));
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (isArabic ? "كلمة المرور الحالية غير صحيحة" : "Failed to update password"));
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06070B] text-white -mx-2 sm:-mx-4 md:-mx-6 lg:-mx-8 py-8" dir={isArabic ? "rtl" : "ltr"}>
      <Toaster position="top-center" reverseOrder={false} />

      <div className="mx-auto max-w-[1460px] px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* ─── Hero Profile Header Card ─── */}
        <section className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0B0D14] p-6 sm:p-8 shadow-2xl">
          {/* Subtle Top Accent Sheen Line */}
          <div className="pointer-events-none absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
          
          {/* Permanent Subtle Ambient Sheen */}
          <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-emerald-500/[0.06] blur-3xl" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            
            {/* User Identification Block (Clean name and email without avatar or badges) */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white">{fullName}</h1>
              <div className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
                <Mail size={14} className="text-emerald-400" />
                <span>{data?.userData?.email || "user@nexustoolz.com"}</span>
              </div>
            </div>

            {/* Quick Actions (Without devices button) */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0">
              <Link
                href="/plans"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-xs font-bold text-[#06080e] transition hover:bg-emerald-400 shadow-md shadow-emerald-500/20"
              >
                <Crown size={15} />
                <span>{isArabic ? "ترقية / تجديد الاشتراك" : "Upgrade / Renew"}</span>
              </Link>
              <Link
                href="/orders"
                className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#121520] px-4 py-2.5 text-xs font-bold text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
              >
                <ShoppingBag size={15} />
                <span>{isArabic ? "سجل الطلبات" : "Order History"}</span>
              </Link>
            </div>

          </div>
        </section>

        {/* ─── 4 Sleek Key Metric Cards ─── */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          
          {/* Stat 1: Current Plan */}
          <div className="relative overflow-hidden rounded-xl bg-[#0B0D14] border border-white/[0.08] p-5 shadow-lg flex flex-col justify-between group hover:border-emerald-500/30 transition-all">
            <div className="pointer-events-none absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent" />
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-zinc-400">{isArabic ? "الخطة والاشتراك" : "Current Plan"}</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Crown size={16} />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-lg font-black text-white truncate">
                {activeSubscription?.name || (isArabic ? "لا يوجد اشتراك نشط" : "No Active Plan")}
              </p>
              <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                {activeSubscription 
                  ? (isArabic ? "خطة عضوية فعالة" : "Active Entitlement") 
                  : (isArabic ? "اختر باقة للبدء" : "Select plan to activate")}
              </p>
            </div>
          </div>

          {/* Stat 2: Expiry & Renewal */}
          <div className="relative overflow-hidden rounded-xl bg-[#0B0D14] border border-white/[0.08] p-5 shadow-lg flex flex-col justify-between group hover:border-sky-500/30 transition-all">
            <div className="pointer-events-none absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-sky-400/20 to-transparent" />
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-zinc-400">{isArabic ? "صلاحية الحساب" : "Expiration Date"}</span>
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <CalendarDays size={16} />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-lg font-black text-white truncate">
                {planEndsAt ? dayjs(planEndsAt).format("YYYY/MM/DD") : (isArabic ? "غير محدد" : "Not Set")}
              </p>
              <p className="text-[11px] text-zinc-400 mt-1">
                {remainingDays !== null 
                  ? `${remainingDays} ${isArabic ? "يوم متبقٍ في الاشتراك" : "days remaining"}` 
                  : (isArabic ? "التجديد متاح في أي وقت" : "Renewal available anytime")}
              </p>
            </div>
          </div>

          {/* Stat 3: AI Credits */}
          <div className="relative overflow-hidden rounded-xl bg-[#0B0D14] border border-white/[0.08] p-5 shadow-lg flex flex-col justify-between group hover:border-amber-500/30 transition-all">
            <div className="pointer-events-none absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" />
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-zinc-400">{isArabic ? "رصيد نقاط AI" : "AI Balance"}</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Zap size={16} />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-white">{totalCredits.toLocaleString()}</span>
                <span className="text-xs text-zinc-400">{isArabic ? "نقطة" : "pts"}</span>
              </div>
              <p className="text-[11px] text-amber-400/90 mt-1">
                {totalCredits > 0 ? (isArabic ? "جاهز لجميع أدوات AI" : "Ready for AI Studio") : (isArabic ? "اشحن نقاط للبدء" : "Top up to generate")}
              </p>
            </div>
          </div>

          {/* Stat 4: Active Tools & Packs */}
          <div className="relative overflow-hidden rounded-xl bg-[#0B0D14] border border-white/[0.08] p-5 shadow-lg flex flex-col justify-between group hover:border-violet-500/30 transition-all">
            <div className="pointer-events-none absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-violet-400/20 to-transparent" />
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-zinc-400">{isArabic ? "الأدوات والباقات" : "Active Tools & Packs"}</span>
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <ShieldCheck size={16} />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-white">
                  {(data?.userToolsData?.length || 0) + (data?.userPacksData?.length || 0)}
                </span>
                <span className="text-xs text-zinc-400">{isArabic ? "خدمة مفعلة" : "active"}</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                {isArabic ? "وصول سحابي مباشر ومحمي" : "Direct cloud protected access"}
              </p>
            </div>
          </div>

        </section>

        {/* ─── Modern Tabs Navigation (3 Tabs) ─── */}
        <div className="flex border-b border-white/[0.08] gap-2 overflow-x-auto no-scrollbar pb-px">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all shrink-0 ${
              activeTab === "overview"
                ? "border-emerald-400 text-emerald-400 bg-emerald-500/[0.04]"
                : "border-transparent text-zinc-400 hover:text-white hover:border-zinc-700"
            }`}
          >
            <Crown size={15} />
            <span>{isArabic ? "نظرة عامة والاشتراك" : "Overview & Subscription"}</span>
          </button>

          <button
            onClick={() => setActiveTab("personal")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all shrink-0 ${
              activeTab === "personal"
                ? "border-emerald-400 text-emerald-400 bg-emerald-500/[0.04]"
                : "border-transparent text-zinc-400 hover:text-white hover:border-zinc-700"
            }`}
          >
            <User size={15} />
            <span>{isArabic ? "البيانات الشخصية" : "Personal Information"}</span>
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all shrink-0 ${
              activeTab === "security"
                ? "border-emerald-400 text-emerald-400 bg-emerald-500/[0.04]"
                : "border-transparent text-zinc-400 hover:text-white hover:border-zinc-700"
            }`}
          >
            <Lock size={15} />
            <span>{isArabic ? "الأمان وكلمة المرور" : "Security & Password"}</span>
          </button>
        </div>

        {/* ─── Tab 1: Overview & Subscription Details ─── */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Active Subscription Details (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="rounded-xl border border-white/[0.08] bg-[#0B0D14] p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                  <div className="flex items-center gap-2.5">
                    <Crown size={18} className="text-emerald-400" />
                    <h3 className="text-base font-bold text-white">
                      {isArabic ? "تفاصيل الخطة والعضوية" : "Membership Plan Details"}
                    </h3>
                  </div>
                  {activeSubscription ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                      {isArabic ? "نشط ومفعل" : "Active"}
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-bold">
                      {isArabic ? "غير نشط" : "Inactive"}
                    </span>
                  )}
                </div>

                {activeSubscription ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-lg bg-[#121520] border border-white/[0.06] space-y-1">
                      <span className="text-[10px] text-zinc-400 block font-medium">{isArabic ? "اسم الخطة" : "Plan Name"}</span>
                      <p className="text-sm font-bold text-white">{activeSubscription.name}</p>
                    </div>
                    <div className="p-3.5 rounded-lg bg-[#121520] border border-white/[0.06] space-y-1">
                      <span className="text-[10px] text-zinc-400 block font-medium">{isArabic ? "نوع الاشتراك" : "Type"}</span>
                      <p className="text-sm font-bold text-emerald-400 uppercase">{activeSubscription.type}</p>
                    </div>
                    <div className="p-3.5 rounded-lg bg-[#121520] border border-white/[0.06] space-y-1">
                      <span className="text-[10px] text-zinc-400 block font-medium">{isArabic ? "تاريخ التفعيل" : "Activated On"}</span>
                      <p className="text-sm font-bold text-white">
                        {planCreatedAt ? dayjs(planCreatedAt).format("YYYY/MM/DD") : "—"}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-lg bg-[#121520] border border-white/[0.06] space-y-1">
                      <span className="text-[10px] text-zinc-400 block font-medium">{isArabic ? "تاريخ الانتهاء" : "Expires On"}</span>
                      <p className="text-sm font-bold text-white">
                        {planEndsAt ? dayjs(planEndsAt).format("YYYY/MM/DD") : "—"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 space-y-3">
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      {isArabic 
                        ? "لم يتم العثور على أي اشتراك نشط حالياً. اشترك الآن في باقات NEXUS للوصول لأقوى الأدوات العالمية واستوديو الذكاء الاصطناعي."
                        : "No active subscription found. Upgrade now to get access to top-tier global tools and NEXUS AI Studio."}
                    </p>
                    <Link
                      href="/plans"
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-[#06080e] transition hover:bg-emerald-400 shadow-md"
                    >
                      <Crown size={14} />
                      <span>{isArabic ? "اكتشف الباقات والخطط" : "Explore Plans"}</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Active Entitlements & Tools (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-xl border border-white/[0.08] bg-[#0B0D14] p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck size={18} className="text-emerald-400" />
                    <h3 className="text-base font-bold text-white">
                      {isArabic ? "الخدمات المتاحة لحسابك" : "Your Activated Services"}
                    </h3>
                  </div>
                  <Link href="/subscriptions" className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors">
                    {isArabic ? "عرض الكل" : "View All"}
                  </Link>
                </div>

                <div className="space-y-2.5">
                  {/* Web Tools Count */}
                  <div className="p-3 rounded-lg bg-[#121520] border border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <Globe size={15} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">{isArabic ? "أدوات المواقع الفردية" : "Individual Tools"}</span>
                        <span className="text-[10px] text-zinc-400">{data?.userToolsData?.length || 0} {isArabic ? "أداة مفعلة" : "tools active"}</span>
                      </div>
                    </div>
                    <Link href="/dashboard/web-tools" className="text-xs text-zinc-400 hover:text-white p-1">
                      <ArrowUpLeft size={14} />
                    </Link>
                  </div>

                  {/* Packs Count */}
                  <div className="p-3 rounded-lg bg-[#121520] border border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400">
                        <Layers size={15} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">{isArabic ? "باقات الأدوات الشاملة" : "Tool Bundles"}</span>
                        <span className="text-[10px] text-zinc-400">{data?.userPacksData?.length || 0} {isArabic ? "باقة مفعلة" : "packs active"}</span>
                      </div>
                    </div>
                    <Link href="/subscriptions" className="text-xs text-zinc-400 hover:text-white p-1">
                      <ArrowUpLeft size={14} />
                    </Link>
                  </div>

                  {/* AI Studio Credits */}
                  <div className="p-3 rounded-lg bg-[#121520] border border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                        <Zap size={15} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">{isArabic ? "استوديو الذكاء الاصطناعي" : "AI Studio Access"}</span>
                        <span className="text-[10px] text-zinc-400">{totalCredits} {isArabic ? "نقطة رصيد متاحة" : "credits ready"}</span>
                      </div>
                    </div>
                    <Link href="/ai" className="text-xs text-zinc-400 hover:text-white p-1">
                      <ArrowUpLeft size={14} />
                    </Link>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* ─── Tab 2: Personal Information Form (Without Avatar) ─── */}
        {activeTab === "personal" && (
          <div className="max-w-2xl space-y-6">
            <form onSubmit={handleUpdateProfile} className="rounded-xl border border-white/[0.08] bg-[#0B0D14] p-6 sm:p-8 space-y-6">
              <div className="border-b border-white/[0.06] pb-4">
                <h3 className="text-base font-bold text-white">
                  {isArabic ? "تعديل البيانات الشخصية" : "Edit Personal Details"}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  {isArabic ? "حدّث اسمك الشخصي المسجل في حسابك بمنصة NEXUS." : "Update your personal name registered in NEXUS."}
                </p>
              </div>

              {/* Name Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300 block">
                    {isArabic ? "الاسم الأول" : "First Name"}
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder={isArabic ? "أدخل الاسم الأول..." : "First name"}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#121520] border border-white/[0.08] text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-zinc-600"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300 block">
                    {isArabic ? "الاسم الأخير" : "Last Name"}
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder={isArabic ? "أدخل الاسم الأخير..." : "Last name"}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#121520] border border-white/[0.08] text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-zinc-600"
                  />
                </div>
              </div>

              {/* Email (Readonly) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 block">
                  {isArabic ? "البريد الإلكتروني" : "Email Address"}
                </label>
                <input
                  type="email"
                  value={data?.userData?.email || ""}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#0E1017] border border-white/[0.04] text-zinc-400 text-xs sm:text-sm cursor-not-allowed"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-xs font-bold text-[#06080e] transition hover:bg-emerald-400 disabled:opacity-50 shadow-md shadow-emerald-500/20"
                >
                  {isSavingProfile ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>{isArabic ? "جاري الحفظ..." : "Saving..."}</span>
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      <span>{isArabic ? "حفظ التغييرات" : "Save Changes"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ─── Tab 3: Security & Password ─── */}
        {activeTab === "security" && (
          <div className="max-w-2xl space-y-6">
            <form onSubmit={handleUpdatePassword} className="rounded-xl border border-white/[0.08] bg-[#0B0D14] p-6 sm:p-8 space-y-6">
              <div className="border-b border-white/[0.06] pb-4">
                <h3 className="text-base font-bold text-white">
                  {isArabic ? "تغيير كلمة المرور" : "Change Password"}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  {isArabic ? "اختر كلمة مرور قوية لحماية حسابك واشتراكاتك في المنصة." : "Choose a strong password to safeguard your account."}
                </p>
              </div>

              {/* Current Password */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 block">
                  {isArabic ? "كلمة المرور الحالية" : "Current Password"}
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#121520] border border-white/[0.08] text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-zinc-600"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    {showCurrentPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 block">
                  {isArabic ? "كلمة المرور الجديدة" : "New Password"}
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#121520] border border-white/[0.08] text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-zinc-600"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <span className="text-[10px] text-zinc-500 block">
                  {isArabic ? "يجب ألا تقل عن 6 أحرف" : "Must be at least 6 characters"}
                </span>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 block">
                  {isArabic ? "تأكيد كلمة المرور الجديدة" : "Confirm New Password"}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#121520] border border-white/[0.08] text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-zinc-600"
                  required
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-xs font-bold text-[#06080e] transition hover:bg-emerald-400 disabled:opacity-50 shadow-md shadow-emerald-500/20"
                >
                  {isSavingPassword ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>{isArabic ? "جاري التحديث..." : "Updating..."}</span>
                    </>
                  ) : (
                    <>
                      <KeyRound size={14} />
                      <span>{isArabic ? "تحديث كلمة المرور" : "Update Password"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default Profile;
