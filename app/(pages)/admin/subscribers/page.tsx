"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  CheckCircle2,
  Clock,
  Layers,
  Search,
  FileSpreadsheet,
  ExternalLink,
  RotateCcw,
  AlertCircle,
  X
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import * as XLSX from "xlsx";
import {
  useGetSubscribersList,
  fetchAllSubscribersForExport,
} from "@/utils/subscribers/getSubscribers";
import { fullDateTimeFormat } from "@/utils/timeFormatting";

export default function SubscribersPage() {
  const router = useRouter();

  // State
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Fetch subscribers query
  const { data, isLoading, isFetching } = useGetSubscribersList({
    page,
    limit,
    search,
    status: statusFilter,
    type: typeFilter,
  });

  const stats = data?.stats;
  const subscribers = data?.subscribers || [];
  const totalPages = data?.totalPages || 1;
  const dataCount = data?.dataCount || 0;

  // Handle Export to Excel (Professional & Clean)
  const handleExportToExcel = async () => {
    try {
      setIsExporting(true);
      toast.loading("جاري تجهيز وتصدير ملف الإكسيل...", { id: "export-toast" });

      // Fetch all matching subscribers (unpaginated)
      const allSubscribers = await fetchAllSubscribersForExport({
        search: search.trim(),
        status: statusFilter,
        type: typeFilter,
      });

      if (!allSubscribers || allSubscribers.length === 0) {
        toast.error("لا توجد بيانات لتصديرها وفق الفلاتر المحددة", { id: "export-toast" });
        return;
      }

      // Map rows with clear, professional Arabic headers
      const rows = allSubscribers.map((item, index) => {
        const typeLabel =
          item.type === "tool"
            ? "أداة فردية"
            : item.type === "pack"
            ? "باقة أدوات"
            : item.type === "plan"
            ? "خطة اشتراك"
            : item.type === "credits"
            ? "رصيد AI"
            : item.type;

        const roleLabel =
          item.user_role === "admin"
            ? "أدمن"
            : item.user_role === "manager"
            ? "مدير"
            : item.user_role === "supervisor"
            ? "مشرف"
            : item.user_role === "employee"
            ? "موظف"
            : "عميل";

        const statusLabel =
          !item.is_active
            ? "موقوف يدوياً"
            : item.is_expired
            ? "منتهي"
            : "نشط";

        const daysLeftText =
          !item.is_active
            ? "موقوف"
            : item.is_expired
            ? "منتهي"
            : item.days_left !== null
            ? `${item.days_left} يوم`
            : "-";

        return {
          "#": index + 1,
          "معرف المشترك": item.user_id,
          "اسم المشترك": item.user_name || "بدون اسم",
          "البريد الإلكتروني": item.user_email || "-",
          "حالة الحساب": item.user_is_active ? "مفعل" : "معطل",
          "الدور": roleLabel,
          "نوع الاشتراك": typeLabel,
          "اسم المنتج / الاشتراك": item.item_name || "-",
          "تاريخ البدء": item.created_at ? fullDateTimeFormat(item.created_at) : "-",
          "تاريخ الانتهاء": item.ended_at ? fullDateTimeFormat(item.ended_at) : "-",
          "حالة الاشتراك": statusLabel,
          "المدة المتبقية": daysLeftText,
          "الرصيد المتبقي": item.remaining_credits !== null ? item.remaining_credits : "-",
          "إجمالي الرصيد": item.total_credits !== null ? item.total_credits : "-",
        };
      });

      // Generate worksheet & workbook
      const worksheet = XLSX.utils.json_to_sheet(rows);

      // Auto-fit column widths
      worksheet["!cols"] = [
        { wch: 6 },  // #
        { wch: 14 }, // معرف المشترك
        { wch: 24 }, // اسم المشترك
        { wch: 30 }, // البريد الإلكتروني
        { wch: 12 }, // حالة الحساب
        { wch: 12 }, // الدور
        { wch: 16 }, // نوع الاشتراك
        { wch: 28 }, // اسم المنتج
        { wch: 22 }, // تاريخ البدء
        { wch: 22 }, // تاريخ الانتهاء
        { wch: 16 }, // حالة الاشتراك
        { wch: 16 }, // المدة المتبقية
        { wch: 16 }, // الرصيد المتبقي
        { wch: 16 }, // إجمالي الرصيد
      ];

      // Enable RTL on sheet
      if (!worksheet["!views"]) worksheet["!views"] = [];
      worksheet["!views"].push({ RTL: true });

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "سجل المشتركين");

      // Generate filename with timestamp
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const fileName = `Nexus_Subscribers_${dateStr}.xlsx`;

      // Trigger download
      XLSX.writeFile(workbook, fileName);
      toast.success(`تم تصدير ${allSubscribers.length} مشترك بنجاح!`, { id: "export-toast" });
    } catch (error) {
      console.error("Error exporting to excel:", error);
      toast.error("حدث خطأ أثناء تصدير ملف الإكسيل", { id: "export-toast" });
    } finally {
      setIsExporting(false);
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
    setPage(1);
  };

  return (
    <div className="w-full min-h-screen text-white p-3 md:p-6 space-y-5" dir="rtl">
      <Toaster position="top-center" reverseOrder={false} />

      {/* Header section - Professional & Clean */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#12141F] border border-zinc-800 rounded-xl p-4 md:p-5 shadow-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700/60 text-zinc-300 flex items-center justify-center flex-shrink-0 shadow-none">
            <Users className="w-5 h-5 text-zinc-300" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-white">
              لوحة المشتركين والاشتراكات
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              متابعة وإدارة كافة المشتركين وتفاصيل أدواتهم وباقاتهم وخططهم، مع إمكانية التصدير للإكسيل
            </p>
          </div>
        </div>

        {/* Action button: Excel Export (No glow, professional Microsoft Excel green, rounded-lg) */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={handleExportToExcel}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#107c41] hover:bg-[#0e6d39] text-white font-medium text-xs md:text-sm border border-[#107c41] transition-colors shadow-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="تصدير شيت إكسيل بكافة المشتركين وتفاصيل اشتراكاتهم"
          >
            {isExporting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 text-white" />
            )}
            <span>{isExporting ? "جاري التصدير..." : "تصدير شيت إكسيل (Excel)"}</span>
          </button>
        </div>
      </div>

      {/* Stat Cards - Clean Flat Aesthetic */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Total Subscriptions */}
        <div className="bg-[#12141F] border border-zinc-800 rounded-xl p-4 flex items-center justify-between shadow-none">
          <div className="space-y-1">
            <span className="text-xs text-zinc-400 font-medium">إجمالي الاشتراكات</span>
            <div className="text-2xl font-bold text-white">
              {stats ? stats.totalSubscriptions.toLocaleString() : "..."}
            </div>
            <span className="text-[11px] text-zinc-500 block">كافة السجلات في المنصة</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-[#12141F] border border-zinc-800 rounded-xl p-4 flex items-center justify-between shadow-none">
          <div className="space-y-1">
            <span className="text-xs text-zinc-400 font-medium">الاشتراكات النشطة</span>
            <div className="text-2xl font-bold text-emerald-400">
              {stats ? stats.activeSubscriptions.toLocaleString() : "..."}
            </div>
            <span className="text-[11px] text-emerald-500/80 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              اشتراكات سارية المفعول
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-950/40 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Expired Subscriptions */}
        <div className="bg-[#12141F] border border-zinc-800 rounded-xl p-4 flex items-center justify-between shadow-none">
          <div className="space-y-1">
            <span className="text-xs text-zinc-400 font-medium">الاشتراكات المنتهية</span>
            <div className="text-2xl font-bold text-rose-400">
              {stats ? stats.expiredSubscriptions.toLocaleString() : "..."}
            </div>
            <span className="text-[11px] text-zinc-500 block">انتهت صلاحيتها الزمنية</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-950/40 border border-rose-800/50 flex items-center justify-center text-rose-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Unique Clients */}
        <div className="bg-[#12141F] border border-zinc-800 rounded-xl p-4 flex items-center justify-between shadow-none">
          <div className="space-y-1">
            <span className="text-xs text-zinc-400 font-medium">إجمالي العملاء المشتركين</span>
            <div className="text-2xl font-bold text-blue-400">
              {stats ? stats.uniqueSubscribers.toLocaleString() : "..."}
            </div>
            <span className="text-[11px] text-zinc-400 block">
              أشخاص فريدون (منهم {stats ? stats.activeSubscribers.toLocaleString() : 0} نشط)
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-950/40 border border-blue-800/50 flex items-center justify-center text-blue-400">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#12141F] border border-zinc-800 rounded-xl p-3.5 shadow-none flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute right-3 top-2.5 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="بحث باسم المشترك، البريد، اسم الأداة أو الباقة، المعرف..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-[#171A26] border border-zinc-700/60 rounded-lg pr-9 pl-9 py-2 text-xs md:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors shadow-none"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute left-3 top-2.5 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Subscription Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#171A26] border border-zinc-700/60 rounded-lg px-3 py-2 text-xs md:text-sm text-white focus:outline-none focus:border-zinc-500 cursor-pointer shadow-none"
          >
            <option value="all">جميع الاشتراكات (الكل)</option>
            <option value="tool">أدوات فردية (Tools)</option>
            <option value="pack">باقات أدوات (Packs)</option>
            <option value="plan">خطط اشتراك (Plans)</option>
            <option value="credits">رصيد AI (Credits)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#171A26] border border-zinc-700/60 rounded-lg px-3 py-2 text-xs md:text-sm text-white focus:outline-none focus:border-zinc-500 cursor-pointer shadow-none"
          >
            <option value="all">كافة الحالات</option>
            <option value="active">نشط فقط (Active)</option>
            <option value="expired">منتهي (Expired)</option>
            <option value="disabled">موقوف يدوياً (Disabled)</option>
          </select>

          {/* Reset Filters */}
          {(search || statusFilter !== "all" || typeFilter !== "all") && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 hover:text-white border border-zinc-700/60 transition-colors cursor-pointer shadow-none"
              title="إعادة تعيين الفلاتر"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Count Summary */}
      <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
        <div>
          عرض <span className="font-semibold text-white">{subscribers.length}</span> من أصل{" "}
          <span className="font-semibold text-white">{dataCount}</span> اشتراك مطابق
        </div>
        {isFetching && (
          <div className="flex items-center gap-1.5 text-zinc-400">
            <div className="w-3 h-3 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
            <span>جاري التحديث...</span>
          </div>
        )}
      </div>

      {/* Table Section - Clean Enterprise Look */}
      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-[#0E1017] shadow-none">
        <table className="w-full text-right border-collapse text-sm">
          <thead>
            <tr className="bg-[#151824] border-b border-zinc-800 text-zinc-400 text-xs font-semibold">
              <th className="py-3 px-4">المشترك</th>
              <th className="py-3 px-4">نوع الاشتراك</th>
              <th className="py-3 px-4">اسم المنتج / الاشتراك</th>
              <th className="py-3 px-4">تاريخ البدء</th>
              <th className="py-3 px-4">تاريخ الانتهاء</th>
              <th className="py-3 px-4">المدة المتبقية</th>
              <th className="py-3 px-4 text-center">حالة الاشتراك</th>
              <th className="py-3 px-4 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-zinc-400">
                  <div className="inline-block w-6 h-6 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin mb-2"></div>
                  <p className="text-xs">جاري تحميل بيانات المشتركين...</p>
                </td>
              </tr>
            ) : subscribers.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-zinc-400">
                  <AlertCircle className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
                  <p className="text-sm font-medium text-zinc-300">لا يوجد مشتركين مطابقين للبحث</p>
                  <p className="text-xs text-zinc-500 mt-1">جرّب تغيير كلمات البحث أو إعادة ضبط الفلاتر</p>
                </td>
              </tr>
            ) : (
              subscribers.map((item) => {
                // Type badge styling
                const typeInfo = {
                  tool: { label: "أداة فردية", bg: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
                  pack: { label: "باقة أدوات", bg: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
                  plan: { label: "خطة اشتراك", bg: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
                  credits: { label: "رصيد AI", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
                }[item.type] || { label: item.type, bg: "bg-zinc-800 text-zinc-300 border-zinc-700" };

                const isStatusActive = item.is_currently_active;
                const isExpired = item.is_expired;

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-zinc-800/30 transition-colors"
                  >
                    {/* Subscriber info */}
                    <td className="py-3 px-4">
                      <div className="min-w-0">
                        <span className="font-medium text-white truncate text-xs md:text-sm block">
                          {item.user_name}
                        </span>
                        <p className="text-xs text-zinc-400 truncate max-w-[220px]" title={item.user_email}>
                          {item.user_email}
                        </p>
                        <span className="text-[10px] text-zinc-500 font-mono">ID: #{item.user_id}</span>
                      </div>
                    </td>

                    {/* Subscription Type */}
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium border ${typeInfo.bg}`}>
                        {typeInfo.label}
                      </span>
                    </td>

                    {/* Item Name */}
                    <td className="py-3 px-4">
                      <span className="font-medium text-white block text-xs md:text-sm">
                        {item.item_name}
                      </span>
                      {item.type === "credits" && item.remaining_credits !== null && (
                        <span className="text-xs text-emerald-400 font-mono">
                          المتبقي: {item.remaining_credits} / {item.total_credits}
                        </span>
                      )}
                    </td>

                    {/* Start Date */}
                    <td className="py-3 px-4 text-xs text-zinc-400 font-mono">
                      {item.created_at ? fullDateTimeFormat(item.created_at) : "-"}
                    </td>

                    {/* End Date */}
                    <td className="py-3 px-4 text-xs text-zinc-400 font-mono">
                      {item.ended_at ? fullDateTimeFormat(item.ended_at) : "-"}
                    </td>

                    {/* Remaining Days */}
                    <td className="py-3 px-4">
                      {!item.is_active ? (
                        <span className="text-xs text-zinc-500">موقوف</span>
                      ) : isExpired ? (
                        <span className="text-xs text-rose-400 font-medium">منتهي</span>
                      ) : item.days_left !== null ? (
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-md border ${
                            item.days_left <= 3
                              ? "bg-rose-950/40 text-rose-300 border-rose-800/60"
                              : item.days_left <= 7
                              ? "bg-amber-950/40 text-amber-300 border-amber-800/60"
                              : "bg-emerald-950/40 text-emerald-300 border-emerald-800/60"
                          }`}
                        >
                          {item.days_left} يوم متبقي
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-400">-</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 text-center">
                      {!item.is_active ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                          موقوف
                        </span>
                      ) : isStatusActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-950/40 text-emerald-400 border border-emerald-800/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          نشط
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-medium bg-rose-950/40 text-rose-400 border border-rose-800/60">
                          منتهي
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/manage/users/${item.user_id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-colors border border-zinc-700/80 shadow-none"
                      >
                        <span>إدارة</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar - Clean Flat Look */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#12141F] border border-zinc-800 rounded-xl p-3.5 shadow-none">
        <div className="text-xs text-zinc-400">
          صفحة <span className="font-semibold text-white">{page}</span> من{" "}
          <span className="font-semibold text-white">{totalPages}</span> (إجمالي{" "}
          <span className="font-semibold text-white">{dataCount}</span> اشتراك)
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPage(1)}
            disabled={page === 1 || isFetching}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs text-zinc-300 hover:text-white border border-zinc-700/60 transition-colors shadow-none"
          >
            الأولى
          </button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isFetching}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs text-zinc-300 hover:text-white border border-zinc-700/60 transition-colors shadow-none"
          >
            السابق
          </button>
          <span className="px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 font-semibold text-xs shadow-none">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || isFetching}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs text-zinc-300 hover:text-white border border-zinc-700/60 transition-colors shadow-none"
          >
            التالي
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages || isFetching}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs text-zinc-300 hover:text-white border border-zinc-700/60 transition-colors shadow-none"
          >
            الأخيرة
          </button>
        </div>
      </div>
    </div>
  );
}
