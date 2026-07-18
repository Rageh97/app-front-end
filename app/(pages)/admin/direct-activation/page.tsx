"use client";

import React, { useState, useEffect } from "react";
import Panel from "@/components/Panel";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import api from "@/utils/api";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { User, Shield, Calendar, Layers, Activity, UserCheck, Loader2 } from "lucide-react";

type ProductType = "credits" | "tool" | "pack";
type Period = "day" | "month" | "year";

interface UserOption {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  isActive: boolean;
  role: string;
}

interface ToolOption {
  tool_id: number;
  tool_name: string;
}

interface PackOption {
  pack_id: number;
  pack_name: string;
}

interface PlanOption {
  plan_id: number;
  plan_name: string;
}

export default function DirectActivationPage() {
  const { t } = useTranslation();
  
  // State
  const [emailQuery, setEmailQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  
  const [productType, setProductType] = useState<ProductType>("credits");
  const [productId, setProductId] = useState<string>("");
  const [period, setPeriod] = useState<Period>("month");
  
  const [tools, setTools] = useState<ToolOption[]>([]);
  const [packs, setPacks] = useState<PackOption[]>([]);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  
  const [loadingItems, setLoadingItems] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search users when emailQuery changes (with simple debounce/timeout)
  useEffect(() => {
    if (emailQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    
    // If selectedUser's email is exactly emailQuery, don't search again
    if (selectedUser && selectedUser.email === emailQuery) {
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await api.post("api/admin/search-user-by-email", {
          email: emailQuery,
        });
        setSearchResults(response.data || []);
      } catch (error) {
        console.error("Failed to search users", error);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [emailQuery, selectedUser]);

  // Load items based on productType
  useEffect(() => {
    const fetchItems = async () => {
      setLoadingItems(true);
      setProductId("");
      try {
        if (productType === "tool") {
          const response = await api.get("api/admin/get-tools");
          setTools(response.data || []);
        } else if (productType === "pack") {
          const response = await api.get("api/admin/get-packs");
          setPacks(response.data || []);
        } else if (productType === "credits") {
          const response = await api.get("api/credits/plans");
          setPlans(response.data || []);
        }
      } catch (error) {
        console.error(`Failed to fetch ${productType} items`, error);
        toast.error("فشل تحميل البيانات، تأكد من الاتصال بالخادم.");
      } finally {
        setLoadingItems(false);
      }
    };

    fetchItems();
  }, [productType]);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      toast.error("يرجى اختيار مستخدم أولاً.");
      return;
    }
    if (!productId) {
      toast.error("يرجى اختيار البند المراد تفعيله.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("api/admin/direct-activate-subscription", {
        email: selectedUser.email,
        productType,
        productId: parseInt(productId),
        period,
      });

      toast.success("تم تفعيل الاشتراك بنجاح للمستخدم! 🎉", {
        duration: 4000,
        position: "top-center",
      });

      // Reset Form partially
      setSelectedUser(null);
      setEmailQuery("");
      setProductId("");
    } catch (error: any) {
      console.error("Failed to activate subscription", error);
      const errorMsg = error?.response?.data || "فشل تفعيل الاشتراك، حاول مرة أخرى.";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Breadcrumb pageName="تفعيل الاشتراك المباشر" />
      
      <div className="max-w-3xl mx-auto">
        <Panel
          title="تفعيل اشتراك يدوي لمستخدم"
          containerClassName="p-8 shadow-2xl rounded-xl border border-white/10 bg-[#1a1129]/80 backdrop-blur-xl relative overflow-hidden"
          className="text-white"
        >
          {/* Decorative Glows */}
          <div className="absolute -top-32 -left-32 w-72 h-72 bg-purple-600 rounded-full blur-[120px] opacity-20 pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-72 h-72 bg-emerald-600 rounded-full blur-[120px] opacity-10 pointer-events-none" />

          <form onSubmit={handleActivate} className="space-y-6 relative z-10">
            {/* User Search Input */}
            <div className="relative">
              <label className="block mb-2 text-sm font-bold text-slate-300">
                بريد المستخدم الإلكتروني (مسجل بالمنصة)*
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={emailQuery}
                  onChange={(e) => {
                    setEmailQuery(e.target.value);
                    if (selectedUser) setSelectedUser(null);
                  }}
                  placeholder="أدخل البريد الإلكتروني للمستخدم للبحث..."
                  className="w-full pl-4 pr-10 py-3 rounded-lg border border-white/10 bg-white/5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  required
                />
                <User className="absolute right-3.5 top-3.5 text-slate-500 w-5 h-5" />
                {isSearching && (
                  <div className="absolute left-3 top-3.5">
                    <Loader2 className="animate-spin text-purple-500 w-5 h-5" />
                  </div>
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {searchResults.length > 0 && !selectedUser && (
                <div className="absolute w-full mt-2 rounded-lg border border-white/10 bg-[#140b20] shadow-2xl overflow-hidden z-50 divide-y divide-white/5">
                  {searchResults.map((user) => (
                    <div
                      key={user.user_id}
                      onClick={() => {
                        setSelectedUser(user);
                        setEmailQuery(user.email);
                        setSearchResults([]);
                      }}
                      className="p-4 hover:bg-white/5 cursor-pointer transition-colors flex items-center justify-between text-sm"
                    >
                      <div>
                        <p className="font-bold text-white">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                          user.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                        }`}>
                          {user.isActive ? "نشط" : "غير نشط"}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-purple-500/20 text-purple-400">
                          {user.role}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected User Badge */}
            {selectedUser && (
              <div className="p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 flex items-center gap-4 animate-fade-in">
                <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-white">
                    تم اختيار: {selectedUser.first_name} {selectedUser.last_name}
                  </h4>
                  <p className="text-xs text-emerald-400/80">{selectedUser.email}</p>
                </div>
              </div>
            )}

            {/* Product Type Selector */}
            <div>
              <label className="block mb-2 text-sm font-bold text-slate-300">
                نوع الاشتراك المطلوب تفعيله
              </label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: "credits", label: "خطة (رصيد)", icon: Activity },
                  { value: "tool", label: "أداة منفردة", icon: Shield },
                  { value: "pack", label: "باقة كاملة", icon: Layers },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = productType === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setProductType(item.value as ProductType)}
                      className={`flex flex-col items-center justify-center py-4 px-2 rounded-lg border-2 transition-all gap-2 ${
                        isSelected
                          ? "border-purple-500 bg-purple-500/10 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                          : "border-white/5 bg-white/5 text-slate-400 hover:border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <Icon className={`w-6 h-6 ${isSelected ? "text-purple-400" : "text-slate-400"}`} />
                      <span className="text-xs font-bold">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Item Selection Dropdown */}
            <div>
              <label className="block mb-2 text-sm font-bold text-slate-300">
                {productType === "credits" ? "اختر الخطة (الرصيد)" : productType === "tool" ? "اختر الأداة" : "اختر الباقة"}
              </label>
              
              <div className="relative">
                {loadingItems ? (
                  <div className="flex items-center gap-3 py-3 px-4 rounded-lg border border-white/10 bg-white/5">
                    <Loader2 className="animate-spin text-purple-400 w-5 h-5" />
                    <span className="text-sm text-slate-400">جاري تحميل العناصر...</span>
                  </div>
                ) : (
                  <select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-white/10 bg-[#160b20] text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all cursor-pointer"
                    required
                  >
                    <option value="">-- اختر من القائمة --</option>
                    {productType === "tool" &&
                      tools.map((t) => (
                        <option key={t.tool_id} value={t.tool_id}>
                          {t.tool_name}
                        </option>
                      ))}
                    {productType === "pack" &&
                      packs.map((p) => (
                        <option key={p.pack_id} value={p.pack_id}>
                          {p.pack_name}
                        </option>
                      ))}
                    {productType === "credits" &&
                      plans.map((pl) => (
                        <option key={pl.plan_id} value={pl.plan_id}>
                          {pl.plan_name}
                        </option>
                      ))}
                  </select>
                )}
              </div>
            </div>

            {/* Period Selector */}
            <div>
              <label className="block mb-2 text-sm font-bold text-slate-300">
                فترة صلاحية التفعيل
              </label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: "day", label: "يوم واحد" },
                  { value: "month", label: "شهر واحد" },
                  { value: "year", label: "سنة كاملة" },
                ].map((item) => {
                  const isSelected = period === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setPeriod(item.value as Period)}
                      className={`flex items-center justify-center py-3 rounded-lg border transition-all ${
                        isSelected
                          ? "border-purple-500 bg-purple-500/10 text-white shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                          : "border-white/5 bg-white/5 text-slate-400 hover:border-white/10"
                      }`}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      <span className="text-xs font-bold">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-white/5 flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setSelectedUser(null);
                  setEmailQuery("");
                  setProductId("");
                }}
                className="w-1/3 py-3 rounded-lg font-bold bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all text-center"
              >
                إعادة ضبط
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting || !selectedUser || !productId}
                className={`w-2/3 py-3.5 rounded-lg font-black text-white shadow-xl transition-all flex items-center justify-center gap-2 ${
                  isSubmitting || !selectedUser || !productId
                    ? "bg-purple-600/40 cursor-not-allowed text-white/50"
                    : "bg-purple-600 hover:bg-purple-700 hover:scale-[1.01]"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" />
                    <span>جاري التفعيل...</span>
                  </>
                ) : (
                  <>
                    <span>تفعيل الاشتراك الآن</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Panel>
      </div>
    </>
  );
}
