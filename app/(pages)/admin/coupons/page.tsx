"use client";

import React, { useState, useCallback } from "react";
import axios from "@/utils/api";
import toast from "react-hot-toast";
import {
  Trash2,
  Edit3,
  ToggleLeft,
  ToggleRight,
  Copy,
  CheckCircle2,
  Search,
  RefreshCw,
  X,
  Loader2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "react-query";

// ─── Types ────────────────────────────────────────────────────
type CouponType = "discount" | "extra_days" | "free_days";
type AppliesTo = "packs" | "ai_packs" | "both";
type AppliesToPeriod = "monthly" | "yearly" | "both";

interface Coupon {
  coupon_id: number;
  coupon_code: string;
  coupon_type: CouponType;
  discount_percentage: number | null;
  extra_days: number | null;
  applies_to: AppliesTo;
  applies_to_period: AppliesToPeriod;
  specific_pack_id: number | null;
  usage_limit: number | null;
  usage_count: number;
  per_user_limit: number;
  valid_from: string;
  valid_until: string | null;
  isActive: boolean;
  description: string | null;
  usages?: { id: number; user_id: number; used_at: string; order_id: number | null }[];
  createdAt: string;
}

type FormState = {
  coupon_code: string;
  coupon_type: CouponType;
  discount_percentage: string;
  extra_days: string;
  applies_to: AppliesTo;
  applies_to_period: AppliesToPeriod;
  specific_pack_id: string;
  usage_limit: string;
  per_user_limit: string;
  valid_from: string;
  valid_until: string;
  isActive: boolean;
  description: string;
};

const defaultForm: FormState = {
  coupon_code: "",
  coupon_type: "discount",
  discount_percentage: "",
  extra_days: "",
  applies_to: "both",
  applies_to_period: "both",
  specific_pack_id: "",
  usage_limit: "",
  per_user_limit: "1",
  valid_from: new Date().toISOString().slice(0, 16),
  valid_until: "",
  isActive: true,
  description: "",
};

// ─── Helpers ─────────────────────────────────────────────────
const getToken = () => localStorage.getItem("a") || "";
const getClientId = () => (global as any).clientId1328 || "";

const typeLabel = (t: CouponType) =>
  t === "discount" ? "خصم %" : t === "extra_days" ? "أيام إضافية" : "أيام مجانية";

const typeBadgeColor = (t: CouponType) =>
  t === "discount"
    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
    : t === "extra_days"
    ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";

const appliesToLabel = (a: AppliesTo) =>
  a === "packs" ? "الباقات العادية" : a === "ai_packs" ? "باقات الـ AI" : "الكل";

const periodLabel = (p: AppliesToPeriod) =>
  p === "monthly" ? "شهري" : p === "yearly" ? "سنوي" : "الكل";

// ─── API ──────────────────────────────────────────────────────
const fetchCoupons = async (): Promise<Coupon[]> => {
  const { data } = await axios.get("api/admin/coupons/", {
    headers: { Authorization: getToken(), "User-Client": getClientId() },
  });
  return data;
};

const createCoupon = async (payload: Partial<FormState>) => {
  const { data } = await axios.post("api/admin/coupons/create", payload, {
    headers: { Authorization: getToken(), "User-Client": getClientId() },
  });
  return data;
};

const updateCoupon = async ({ id, payload }: { id: number; payload: Partial<FormState> }) => {
  const { data } = await axios.put(`api/admin/coupons/update/${id}`, payload, {
    headers: { Authorization: getToken(), "User-Client": getClientId() },
  });
  return data;
};

const deleteCoupon = async (id: number) => {
  const { data } = await axios.delete(`api/admin/coupons/delete/${id}`, {
    headers: { Authorization: getToken(), "User-Client": getClientId() },
  });
  return data;
};

const toggleCoupon = async (id: number) => {
  const { data } = await axios.patch(`api/admin/coupons/toggle/${id}`, {}, {
    headers: { Authorization: getToken(), "User-Client": getClientId() },
  });
  return data;
};

// ─── Main page ────────────────────────────────────────────────
export default function CouponsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"all" | CouponType>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");

  const { data: coupons = [], isLoading, refetch } = useQuery<Coupon[]>({
    queryKey: ["admin-coupons"],
    queryFn: fetchCoupons,
  });

  const createMut = useMutation(createCoupon, {
    onSuccess: () => {
      qc.invalidateQueries(["admin-coupons"]);
      toast.success("تم إنشاء الكوبون بنجاح");
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "فشل إنشاء الكوبون");
    },
  });

  const updateMut = useMutation(updateCoupon, {
    onSuccess: () => {
      qc.invalidateQueries(["admin-coupons"]);
      toast.success("تم تحديث الكوبون بنجاح");
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "فشل تحديث الكوبون");
    },
  });

  const deleteMut = useMutation(deleteCoupon, {
    onSuccess: () => {
      qc.invalidateQueries(["admin-coupons"]);
      toast.success("تم حذف الكوبون بنجاح");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "فشل حذف الكوبون");
    },
  });

  const toggleMut = useMutation(toggleCoupon, {
    onSuccess: () => {
      qc.invalidateQueries(["admin-coupons"]);
      toast.success("تم تغيير حالة الكوبون");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "فشل تغيير الحالة");
    },
  });

  const openCreate = () => {
    setEditingCoupon(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEdit = (c: Coupon) => {
    setEditingCoupon(c);
    setForm({
      coupon_code: c.coupon_code,
      coupon_type: c.coupon_type,
      discount_percentage: c.discount_percentage?.toString() || "",
      extra_days: c.extra_days?.toString() || "",
      applies_to: c.applies_to,
      applies_to_period: c.applies_to_period,
      specific_pack_id: c.specific_pack_id?.toString() || "",
      usage_limit: c.usage_limit?.toString() || "",
      per_user_limit: c.per_user_limit?.toString() || "1",
      valid_from: c.valid_from ? new Date(c.valid_from).toISOString().slice(0, 16) : "",
      valid_until: c.valid_until ? new Date(c.valid_until).toISOString().slice(0, 16) : "",
      isActive: c.isActive,
      description: c.description || "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCoupon(null);
    setForm(defaultForm);
  };

  const handleSubmit = () => {
    const payload: any = {
      coupon_code: form.coupon_code.trim().toUpperCase(),
      coupon_type: form.coupon_type,
      applies_to: form.applies_to,
      applies_to_period: form.applies_to_period,
      isActive: form.isActive,
      description: form.description || null,
      per_user_limit: parseInt(form.per_user_limit, 10) || 1,
      usage_limit: form.usage_limit ? parseInt(form.usage_limit, 10) : null,
      valid_from: form.valid_from || new Date().toISOString(),
      valid_until: form.valid_until || null,
      specific_pack_id: form.specific_pack_id ? parseInt(form.specific_pack_id, 10) : null,
    };
    if (form.coupon_type === "discount") payload.discount_percentage = parseFloat(form.discount_percentage);
    if (form.coupon_type === "extra_days" || form.coupon_type === "free_days") payload.extra_days = parseInt(form.extra_days, 10);

    if (editingCoupon) {
      updateMut.mutate({ id: editingCoupon.coupon_id, payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const isSaving = createMut.isLoading || updateMut.isLoading;

  // Stats
  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter((c) => c.isActive).length;
  const totalUsages = coupons.reduce((s, c) => s + (c.usage_count || 0), 0);
  const discountCoupons = coupons.filter((c) => c.coupon_type === "discount").length;

  // Filtered list
  const filtered = coupons.filter((c) => {
    const matchSearch =
      c.coupon_code.toLowerCase().includes(search.toLowerCase()) ||
      (c.description || "").toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || c.coupon_type === filterType;
    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "active" ? c.isActive : !c.isActive);
    return matchSearch && matchType && matchStatus;
  });

  const generateCode = useCallback(() => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setForm((f) => ({ ...f, coupon_code: code }));
  }, []);

  return (
    <div className="min-h-screen bg-[#080B12] p-4 md:p-6 text-slate-200 font-sans" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="pb-4 border-b border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-emerald-400">
              إدارة الكوبونات والخصومات
            </h1>
            <p className="text-slate-400 text-xs mt-1">إنشاء وإدارة كوبونات التخفيض والأيام الإضافية للباقات</p>
          </div>

          <button
            onClick={openCreate}
            className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors self-start md:self-auto"
          >
            إنشاء كوبون جديد
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "إجمالي الكوبونات", value: totalCoupons },
            { label: "الكوبونات النشطة", value: activeCoupons },
            { label: "إجمالي الاستخدامات", value: totalUsages },
            { label: "كوبونات الخصم", value: discountCoupons },
          ].map((s, i) => (
            <div key={i} className="rounded-md p-4 bg-[#0B0E17] border border-white/[0.08]">
              <div className="text-2xl font-black text-white mb-0.5">{s.value}</div>
              <div className="text-slate-400 text-xs font-semibold">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-2.5 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالكود أو الوصف..."
              className="w-full bg-[#07090F] border border-white/10 rounded-md pr-9 pl-4 py-2 text-white text-xs placeholder:text-slate-500 outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="bg-[#07090F] border border-white/10 rounded-md px-3 py-2 text-white text-xs outline-none focus:border-emerald-500 transition-colors"
          >
            <option value="all">كل الأنواع</option>
            <option value="discount">خصم %</option>
            <option value="extra_days">أيام إضافية</option>
            <option value="free_days">أيام مجانية</option>
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-[#07090F] border border-white/10 rounded-md px-3 py-2 text-white text-xs outline-none focus:border-emerald-500 transition-colors"
          >
            <option value="all">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
          </select>

          {/* Refresh */}
          <button
            onClick={() => refetch()}
            className="p-2 rounded-md bg-[#07090F] border border-white/10 text-slate-400 hover:text-white transition-colors"
            title="تحديث"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin text-emerald-400" : ""} />
          </button>
        </div>

        {/* Table Card */}
        <div className="rounded-lg border border-white/[0.08] bg-[#0B0E17] overflow-hidden p-5">
          <h2 className="text-base font-bold text-emerald-400 mb-4 pb-2 border-b border-white/[0.06]">
            قائمة الكوبونات المسجلة ({filtered.length})
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 text-xs font-semibold gap-2">
              <Loader2 size={18} className="animate-spin text-emerald-400" />
              <span>جاري تحميل الكوبونات...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs font-semibold">
              لا توجد كوبونات مسجلة تطابق معايير البحث
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] text-slate-400 text-[11px] font-bold">
                    <th className="pb-3 pr-2">الكود</th>
                    <th className="pb-3">النوع</th>
                    <th className="pb-3">القيمة</th>
                    <th className="pb-3">يطبق على</th>
                    <th className="pb-3">الفترة</th>
                    <th className="pb-3">الاستخدام</th>
                    <th className="pb-3">الصلاحية</th>
                    <th className="pb-3 text-center">الحالة</th>
                    <th className="pb-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {filtered.map((c) => {
                    const isExpired = c.valid_until && new Date(c.valid_until) < new Date();
                    return (
                      <tr key={c.coupon_id} className="hover:bg-white/[0.02] transition-colors">
                        {/* Code */}
                        <td className="py-3 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-white text-xs tracking-wider">
                              {c.coupon_code}
                            </span>
                            <button
                              onClick={() => handleCopy(c.coupon_code)}
                              className="text-slate-400 hover:text-emerald-400 transition-colors"
                              title="نسخ الكود"
                            >
                              {copiedCode === c.coupon_code ? (
                                <CheckCircle2 size={12} className="text-emerald-400" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                          {c.description && (
                            <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[130px]">
                              {c.description}
                            </p>
                          )}
                        </td>

                        {/* Type */}
                        <td className="py-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${typeBadgeColor(
                              c.coupon_type
                            )}`}
                          >
                            {typeLabel(c.coupon_type)}
                          </span>
                        </td>

                        {/* Value */}
                        <td className="py-3 font-mono font-bold text-white text-xs">
                          {c.coupon_type === "discount"
                            ? `${c.discount_percentage}%`
                            : `${c.extra_days} يوم`}
                        </td>

                        {/* Applies to */}
                        <td className="py-3 text-slate-300">{appliesToLabel(c.applies_to)}</td>

                        {/* Period */}
                        <td className="py-3 text-slate-300">{periodLabel(c.applies_to_period)}</td>

                        {/* Usage */}
                        <td className="py-3">
                          <span className="font-bold text-white">{c.usage_count}</span>
                          {c.usage_limit && (
                            <span className="text-slate-500 font-normal"> / {c.usage_limit}</span>
                          )}
                          <div className="text-[10px] text-slate-500">{c.per_user_limit} لكل مستخدم</div>
                        </td>

                        {/* Validity */}
                        <td className="py-3 text-[11px]">
                          {c.valid_until ? (
                            <span className={isExpired ? "text-rose-400 font-semibold" : "text-slate-400"}>
                              {isExpired ? "منتهي (" : "حتى "}
                              {new Date(c.valid_until).toLocaleDateString("ar-EG")}
                              {isExpired ? ")" : ""}
                            </span>
                          ) : (
                            <span className="text-slate-500">مفتوح</span>
                          )}
                        </td>

                        {/* Status Toggle */}
                        <td className="py-3 text-center">
                          <button
                            onClick={() => toggleMut.mutate(c.coupon_id)}
                            className="inline-flex items-center gap-1 text-xs"
                          >
                            {c.isActive ? (
                              <>
                                <ToggleRight size={18} className="text-emerald-400" />
                                <span className="text-[10px] font-bold text-emerald-400">نشط</span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft size={18} className="text-slate-500" />
                                <span className="text-[10px] font-bold text-slate-500">معطل</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openEdit(c)}
                              className="p-1.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 transition-colors"
                              title="تعديل"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("هل أنت متأكد من حذف هذا الكوبون؟"))
                                  deleteMut.mutate(c.coupon_id);
                              }}
                              className="p-1.5 rounded bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white transition-colors"
                              title="حذف"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
            <div className="relative w-full max-w-xl bg-[#0F121C] border border-white/10 rounded-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h2 className="text-base font-bold text-emerald-400">
                  {editingCoupon ? "تعديل الكوبون" : "إنشاء كوبون جديد"}
                </h2>
                <button onClick={closeModal} className="text-slate-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              {/* Code + Generate */}
              <div className="flex gap-2.5 items-end">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-semibold text-slate-300">كود الكوبون *</label>
                  <input
                    value={form.coupon_code}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, coupon_code: e.target.value.toUpperCase() }))
                    }
                    placeholder="SAVE20"
                    className="w-full bg-[#07090F] border border-white/10 rounded-md px-3 py-2 text-white font-mono font-bold text-xs outline-none focus:border-emerald-500 tracking-wider"
                  />
                </div>
                <button
                  type="button"
                  onClick={generateCode}
                  className="px-3 py-2 rounded-md bg-white/[0.04] border border-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
                >
                  توليد كود
                </button>
              </div>

              {/* Type */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">نوع الكوبون *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["discount", "extra_days", "free_days"] as CouponType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, coupon_type: t }))}
                      className={`p-2.5 rounded-md border text-xs font-bold transition-colors ${
                        form.coupon_type === t
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                          : "border-white/10 bg-[#07090F] text-slate-400 hover:border-white/20"
                      }`}
                    >
                      {typeLabel(t)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Value Input */}
              {form.coupon_type === "discount" ? (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">نسبة الخصم % *</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={form.discount_percentage}
                    onChange={(e) => setForm((f) => ({ ...f, discount_percentage: e.target.value }))}
                    placeholder="20"
                    className="w-full bg-[#07090F] border border-white/10 rounded-md px-3 py-2 text-white text-xs outline-none focus:border-emerald-500"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">عدد الأيام *</label>
                  <input
                    type="number"
                    min="1"
                    value={form.extra_days}
                    onChange={(e) => setForm((f) => ({ ...f, extra_days: e.target.value }))}
                    placeholder="7"
                    className="w-full bg-[#07090F] border border-white/10 rounded-md px-3 py-2 text-white text-xs outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Applies to & Period */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">يُطبَّق على</label>
                  <select
                    value={form.applies_to}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, applies_to: e.target.value as AppliesTo }))
                    }
                    className="w-full bg-[#07090F] border border-white/10 rounded-md px-3 py-2 text-white text-xs outline-none focus:border-emerald-500"
                  >
                    <option value="both">الكل (باقات + AI)</option>
                    <option value="packs">الباقات العادية فقط</option>
                    <option value="ai_packs">باقات الـ AI فقط</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">الفترة</label>
                  <select
                    value={form.applies_to_period}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        applies_to_period: e.target.value as AppliesToPeriod,
                      }))
                    }
                    className="w-full bg-[#07090F] border border-white/10 rounded-md px-3 py-2 text-white text-xs outline-none focus:border-emerald-500"
                  >
                    <option value="both">الكل (شهري + سنوي)</option>
                    <option value="monthly">شهري فقط</option>
                    <option value="yearly">سنوي فقط</option>
                  </select>
                </div>
              </div>

              {/* Usage limits */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">الحد الأقصى الإجمالي</label>
                  <input
                    type="number"
                    min="1"
                    value={form.usage_limit}
                    onChange={(e) => setForm((f) => ({ ...f, usage_limit: e.target.value }))}
                    placeholder="غير محدود"
                    className="w-full bg-[#07090F] border border-white/10 rounded-md px-3 py-2 text-white text-xs outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">لكل مستخدم</label>
                  <input
                    type="number"
                    min="1"
                    value={form.per_user_limit}
                    onChange={(e) => setForm((f) => ({ ...f, per_user_limit: e.target.value }))}
                    className="w-full bg-[#07090F] border border-white/10 rounded-md px-3 py-2 text-white text-xs outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Validity */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">تاريخ البدء</label>
                  <input
                    type="datetime-local"
                    value={form.valid_from}
                    onChange={(e) => setForm((f) => ({ ...f, valid_from: e.target.value }))}
                    className="w-full bg-[#07090F] border border-white/10 rounded-md px-3 py-2 text-white text-xs outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">تاريخ الانتهاء</label>
                  <input
                    type="datetime-local"
                    value={form.valid_until}
                    onChange={(e) => setForm((f) => ({ ...f, valid_until: e.target.value }))}
                    className="w-full bg-[#07090F] border border-white/10 rounded-md px-3 py-2 text-white text-xs outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">الوصف (اختياري)</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="وصف مختصر لمناسبة الكوبون"
                  className="w-full bg-[#07090F] border border-white/10 rounded-md px-3 py-2 text-white text-xs outline-none focus:border-emerald-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {isSaving ? "جاري الحفظ..." : editingCoupon ? "حفظ التعديلات" : "إنشاء الكوبون"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="py-2.5 px-4 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 rounded-md text-xs font-bold transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
