"use client";

import React, { useState, useCallback } from "react";
import axios from "@/utils/api";
import toast from "react-hot-toast";
import {
  Tag,
  Plus,
  Trash2,
  Edit3,
  ToggleLeft,
  ToggleRight,
  Copy,
  CheckCircle2,
  XCircle,
  Calendar,
  Users,
  Percent,
  Clock,
  Gift,
  Search,
  RefreshCw,
  ChevronDown,
  X,
  Save,
  Loader2,
  BarChart2,
  Award,
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
const typeColor = (t: CouponType) =>
  t === "discount"
    ? "bg-orange-500/20 text-orange-300 border-orange-500/30"
    : t === "extra_days"
    ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
    : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
const typeIcon = (t: CouponType) =>
  t === "discount" ? <Percent size={12} /> : t === "extra_days" ? <Clock size={12} /> : <Gift size={12} />;

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

  // ── Queries / Mutations ────────────────────────────────────
  const { data: coupons = [], isLoading, refetch } = useQuery<Coupon[]>({
    queryKey: ["admin-coupons"],
    queryFn: fetchCoupons,
  });

  // Fetch regular packs
  const { data: regularPacks = [] } = useQuery<any[]>({
    queryKey: ["admin-packs"],
    queryFn: async () => {
      const { data } = await axios.get("api/admin/get-packs/", {
        headers: { Authorization: getToken(), "User-Client": getClientId() },
      });
      return data;
    },
  });

  // Fetch AI plans
  const { data: aiPlans = [] } = useQuery<any[]>({
    queryKey: ["admin-ai-plans"],
    queryFn: async () => {
      const { data } = await axios.get("api/credits/plans", {
        headers: { Authorization: getToken(), "User-Client": getClientId() },
      });
      return data;
    },
  });

  const createMut = useMutation(createCoupon, { onSuccess: () => { qc.invalidateQueries("admin-coupons"); toast.success("تم إنشاء الكوبون ✅"); closeModal(); } });
  const updateMut = useMutation(updateCoupon, { onSuccess: () => { qc.invalidateQueries("admin-coupons"); toast.success("تم التحديث ✅"); closeModal(); } });
  const deleteMut = useMutation(deleteCoupon, { onSuccess: () => { qc.invalidateQueries("admin-coupons"); toast.success("تم الحذف"); } });
  const toggleMut = useMutation(toggleCoupon, { onSuccess: () => qc.invalidateQueries("admin-coupons") });

  // ── Helpers ────────────────────────────────────────────────
  const openCreate = () => { setEditingCoupon(null); setForm(defaultForm); setShowModal(true); };
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
  const closeModal = () => { setShowModal(false); setEditingCoupon(null); setForm(defaultForm); };

  const handleSubmit = () => {
    const payload: any = {
      coupon_code: form.coupon_code.trim().toUpperCase(),
      coupon_type: form.coupon_type,
      applies_to: form.applies_to,
      applies_to_period: form.applies_to_period,
      isActive: form.isActive,
      description: form.description || null,
      per_user_limit: parseInt(form.per_user_limit) || 1,
      usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
      valid_from: form.valid_from || new Date().toISOString(),
      valid_until: form.valid_until || null,
      specific_pack_id: form.specific_pack_id ? parseInt(form.specific_pack_id) : null,
    };
    if (form.coupon_type === "discount") payload.discount_percentage = parseFloat(form.discount_percentage);
    if (form.coupon_type === "extra_days" || form.coupon_type === "free_days") payload.extra_days = parseInt(form.extra_days);

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

  const isLoading2 = createMut.isLoading || updateMut.isLoading;

  // ── Stats ──────────────────────────────────────────────────
  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter((c) => c.isActive).length;
  const totalUsages = coupons.reduce((s, c) => s + (c.usage_count || 0), 0);
  const discountCoupons = coupons.filter((c) => c.coupon_type === "discount").length;

  // ── Filtered list ──────────────────────────────────────────
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

  // ── Quick code generate ────────────────────────────────────
  const generateCode = useCallback(() => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setForm((f) => ({ ...f, coupon_code: code }));
  }, []);

  // ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0118] p-4 md:p-8" dir="rtl">
      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#4f008c] to-[#190237] border border-white/10">
            <Tag size={22} className="text-[#00c48c]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">إدارة الكوبونات</h1>
            <p className="text-white/40 text-sm">أنشئ وأدر كوبونات الخصم لباقاتك</p>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "إجمالي الكوبونات", value: totalCoupons, icon: <Tag size={18} />, color: "from-purple-600/20 to-purple-900/20 border-purple-500/20" },
          { label: "الكوبونات النشطة", value: activeCoupons, icon: <CheckCircle2 size={18} />, color: "from-emerald-600/20 to-emerald-900/20 border-emerald-500/20" },
          { label: "إجمالي الاستخدامات", value: totalUsages, icon: <BarChart2 size={18} />, color: "from-blue-600/20 to-blue-900/20 border-blue-500/20" },
          { label: "كوبونات الخصم", value: discountCoupons, icon: <Percent size={18} />, color: "from-orange-600/20 to-orange-900/20 border-orange-500/20" },
        ].map((s, i) => (
          <div key={i} className={`rounded-2xl p-5 gradient-border-analysis`}>
            <div className="text-orange mb-3">{s.icon}</div>
            <div className="text-3xl font-black text-white mb-1">{s.value}</div>
            <div className="text-white/50 text-xs font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالكود أو الوصف..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pr-10 pl-4 py-2.5 text-white text-sm placeholder:text-white/30 outline-none focus:border-[#00c48c]/50 transition-all"
          />
        </div>
        {/* Type filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#00c48c]/50 transition-all [&>option]:bg-[#1a1129]"
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
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#00c48c]/50 transition-all [&>option]:bg-[#1a1129]"
        >
          <option value="all">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="inactive">غير نشط</option>
        </select>
        {/* Refresh */}
        <button onClick={() => refetch()} className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all">
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
        </button>
        {/* Create */}
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00c48c] to-[#00a87a] text-white font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-[#00c48c]/20"
        >
          <Plus size={16} />
          إنشاء كوبون جديد
        </button>
      </div>

      {/* ── Table ── */}
      <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/[0.02] backdrop-blur-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-white/40">
            <Loader2 size={28} className="animate-spin ml-3" />
            جاري التحميل...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/30">
            <Tag size={48} className="mb-4 opacity-30" />
            <p className="text-lg font-medium">لا توجد كوبونات</p>
            <p className="text-sm mt-1">ابدأ بإنشاء كوبون جديد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {["الكود", "النوع", "القيمة", "يطبق على", "الفترة", "الاستخدام", "الصلاحية", "الحالة", "إجراءات"].map((h) => (
                    <th key={h} className="text-right px-4 py-3 text-[11px] font-bold text-white/40 uppercase tracking-widest whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, idx) => {
                  const isExpired = c.valid_until && new Date(c.valid_until) < new Date();
                  return (
                    <tr
                      key={c.coupon_id}
                      className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors ${idx % 2 === 0 ? "" : "bg-white/[0.01]"}`}
                    >
                      {/* Code */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-sm tracking-widest">{c.coupon_code}</span>
                          <button
                            onClick={() => handleCopy(c.coupon_code)}
                            className="text-white/30 hover:text-[#00c48c] transition-colors"
                          >
                            {copiedCode === c.coupon_code ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                          </button>
                        </div>
                        {c.description && <p className="text-[10px] text-white/30 mt-0.5 truncate max-w-[140px]">{c.description}</p>}
                      </td>
                      {/* Type */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${typeColor(c.coupon_type)}`}>
                          {typeIcon(c.coupon_type)}
                          {typeLabel(c.coupon_type)}
                        </span>
                      </td>
                      {/* Value */}
                      <td className="px-4 py-3 font-mono font-black text-white text-sm">
                        {c.coupon_type === "discount"
                          ? `${c.discount_percentage}%`
                          : `${c.extra_days} يوم`}
                      </td>
                      {/* Applies to */}
                      <td className="px-4 py-3 text-white/60 text-xs">{appliesToLabel(c.applies_to)}</td>
                      {/* Period */}
                      <td className="px-4 py-3 text-white/60 text-xs">{periodLabel(c.applies_to_period)}</td>
                      {/* Usage */}
                      <td className="px-4 py-3">
                        <div className="text-sm font-bold text-white">
                          {c.usage_count}
                          {c.usage_limit && <span className="text-white/30 font-normal"> / {c.usage_limit}</span>}
                        </div>
                        <div className="text-[10px] text-white/30">{c.per_user_limit} لكل مستخدم</div>
                      </td>
                      {/* Validity */}
                      <td className="px-4 py-3">
                        <div className="text-[11px] text-white/50">
                          {c.valid_until ? (
                            <span className={isExpired ? "text-red-400" : "text-white/50"}>
                              {isExpired ? "⚠ " : ""}حتى {new Date(c.valid_until).toLocaleDateString("ar-EG")}
                            </span>
                          ) : (
                            <span className="text-[#00c48c]/60">بلا تاريخ انتهاء</span>
                          )}
                        </div>
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleMut.mutate(c.coupon_id)}
                          className="flex items-center gap-1.5"
                        >
                          {c.isActive ? (
                            <>
                              <ToggleRight size={20} className="text-[#00c48c]" />
                              <span className="text-[10px] font-bold text-[#00c48c]">نشط</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft size={20} className="text-white/30" />
                              <span className="text-[10px] font-bold text-white/30">متوقف</span>
                            </>
                          )}
                        </button>
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(c)}
                            className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-all"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("هل أنت متأكد من حذف هذا الكوبون؟")) deleteMut.mutate(c.coupon_id);
                            }}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                          >
                            <Trash2 size={14} />
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

      {/* ── Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={closeModal} />
          <div className="relative z-10 w-full max-w-2xl bg-[#1a1129] border border-white/10 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto scrollbar-hide">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-[#1a1129] border-b border-white/10 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#00c48c]/10 border border-[#00c48c]/20">
                  {editingCoupon ? <Edit3 size={18} className="text-[#00c48c]" /> : <Plus size={18} className="text-[#00c48c]" />}
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">
                    {editingCoupon ? "تعديل الكوبون" : "إنشاء كوبون جديد"}
                  </h2>
                  <p className="text-white/40 text-xs">أدخل تفاصيل الكوبون</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Code + Generate */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-bold text-white/60 mb-1.5 block">كود الكوبون *</label>
                  <input
                    value={form.coupon_code}
                    onChange={(e) => setForm((f) => ({ ...f, coupon_code: e.target.value.toUpperCase() }))}
                    placeholder="مثال: SAVE20"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono font-bold text-sm placeholder:text-white/20 outline-none focus:border-[#00c48c]/50 transition-all tracking-widest"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={generateCode}
                    className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/20 text-xs font-bold transition-all whitespace-nowrap"
                  >
                    توليد تلقائي
                  </button>
                </div>
              </div>

              {/* Type */}
              <div>
                <label className="text-xs font-bold text-white/60 mb-2 block">نوع الكوبون *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["discount", "extra_days", "free_days"] as CouponType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, coupon_type: t }))}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-xs font-bold transition-all ${
                        form.coupon_type === t
                          ? "border-[#00c48c] bg-[#00c48c]/10 text-[#00c48c]"
                          : "border-white/10 bg-white/5 text-white/50 hover:border-white/20"
                      }`}
                    >
                      <span className="text-lg">
                        {t === "discount" ? "%" : t === "extra_days" ? "⏰" : "🎁"}
                      </span>
                      {typeLabel(t)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type-specific value */}
              {form.coupon_type === "discount" && (
                <div>
                  <label className="text-xs font-bold text-white/60 mb-1.5 block">نسبة الخصم % *</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={form.discount_percentage}
                    onChange={(e) => setForm((f) => ({ ...f, discount_percentage: e.target.value }))}
                    placeholder="مثال: 20"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 outline-none focus:border-[#00c48c]/50 transition-all"
                  />
                </div>
              )}
              {(form.coupon_type === "extra_days" || form.coupon_type === "free_days") && (
                <div>
                  <label className="text-xs font-bold text-white/60 mb-1.5 block">
                    عدد الأيام * {form.coupon_type === "free_days" ? "(مجاناً)" : "(إضافية)"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.extra_days}
                    onChange={(e) => setForm((f) => ({ ...f, extra_days: e.target.value }))}
                    placeholder="مثال: 7"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 outline-none focus:border-[#00c48c]/50 transition-all"
                  />
                </div>
              )}

              {/* Applies to + Period */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-white/60 mb-1.5 block">يُطبَّق على</label>
                  <select
                    value={form.applies_to}
                    onChange={(e) => setForm((f) => ({ ...f, applies_to: e.target.value as AppliesTo, specific_pack_id: "" }))}
                    className="w-full bg-[#0a0118] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#00c48c]/50 transition-all [&>option]:bg-[#1a1129]"
                  >
                    <option value="both">الكل (باقات + AI)</option>
                    <option value="packs">الباقات العادية فقط</option>
                    <option value="ai_packs">باقات الـ AI فقط</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-white/60 mb-1.5 block">نوع الاشتراك</label>
                  <select
                    value={form.applies_to_period}
                    onChange={(e) => setForm((f) => ({ ...f, applies_to_period: e.target.value as AppliesToPeriod }))}
                    className="w-full bg-[#0a0118] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#00c48c]/50 transition-all [&>option]:bg-[#1a1129]"
                  >
                    <option value="both">الكل (شهري + سنوي)</option>
                    <option value="monthly">شهري فقط</option>
                    <option value="yearly">سنوي فقط</option>
                  </select>
                </div>
              </div>

              {/* Specific Product Selection */}
              {form.applies_to !== "both" && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-xs font-bold text-white/60 mb-1.5 block">
                    منتج معين (اختياري)
                  </label>
                  <select
                    value={form.specific_pack_id}
                    onChange={(e) => setForm((f) => ({ ...f, specific_pack_id: e.target.value }))}
                    className="w-full bg-[#0a0118] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#00c48c]/50 transition-all [&>option]:bg-[#1a1129]"
                  >
                    <option value="">كل {form.applies_to === "packs" ? "الباقات العادية" : "باقات الـ AI"}</option>
                    {form.applies_to === "packs" 
                      ? regularPacks.map(p => (
                          <option key={p.pack_id} value={p.pack_id}>{p.pack_name} (IQD {p.monthly_price})</option>
                        ))
                      : aiPlans.map(p => (
                          <option key={p.plan_id} value={p.plan_id}>{p.plan_name} (IQD {p.amount})</option>
                        ))
                    }
                  </select>
                  <p className="text-[10px] text-[#00c48c]/60 mt-1 mr-1">اتركه كما هو إذا كنت تريد تطبيق الكوبون على جميع الباقات من هذا النوع.</p>
                </div>
              )}

              {/* Limits */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-white/60 mb-1.5 block">الحد الأقصى للاستخدام</label>
                  <input
                    type="number"
                    min="1"
                    value={form.usage_limit}
                    onChange={(e) => setForm((f) => ({ ...f, usage_limit: e.target.value }))}
                    placeholder="فارغ = غير محدود"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 outline-none focus:border-[#00c48c]/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-white/60 mb-1.5 block">حد الاستخدام لكل مستخدم</label>
                  <input
                    type="number"
                    min="1"
                    value={form.per_user_limit}
                    onChange={(e) => setForm((f) => ({ ...f, per_user_limit: e.target.value }))}
                    placeholder="1"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 outline-none focus:border-[#00c48c]/50 transition-all"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-white/60 mb-1.5 block">تاريخ البدء *</label>
                  <input
                    type="datetime-local"
                    value={form.valid_from}
                    onChange={(e) => setForm((f) => ({ ...f, valid_from: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#00c48c]/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-white/60 mb-1.5 block">تاريخ الانتهاء</label>
                  <input
                    type="datetime-local"
                    value={form.valid_until}
                    onChange={(e) => setForm((f) => ({ ...f, valid_until: e.target.value }))}
                    placeholder="فارغ = بلا انتهاء"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#00c48c]/50 transition-all"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-white/60 mb-1.5 block">وصف (اختياري)</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="مثال: كوبون رمضان 2026"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 outline-none focus:border-[#00c48c]/50 transition-all"
                />
              </div>

              {/* Status toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <p className="text-sm font-bold text-white">حالة الكوبون</p>
                  <p className="text-xs text-white/40">هل الكوبون نشط ومتاح للاستخدام؟</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                >
                  {form.isActive ? (
                    <ToggleRight size={32} className="text-[#00c48c]" />
                  ) : (
                    <ToggleLeft size={32} className="text-white/30" />
                  )}
                </button>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 font-bold text-sm transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading2 || !form.coupon_code}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-white text-sm transition-all ${
                    isLoading2 || !form.coupon_code
                      ? "bg-[#00c48c]/40 cursor-not-allowed"
                      : "bg-gradient-to-r from-[#00c48c] to-[#00a87a] hover:brightness-110 shadow-lg shadow-[#00c48c]/20"
                  }`}
                >
                  {isLoading2 ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {editingCoupon ? "حفظ التعديلات" : "إنشاء الكوبون"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
