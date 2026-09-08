'use client';

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Wrench,
  Eye,
  Save,
  RefreshCw,
  X,
  AlertTriangle,
  CheckCircle2,
  Info
} from "lucide-react";
import SettingSubNav from "@/components/Admin/SettingSubNav";
import MaintenancePage from "@/components/Maintenance/MaintenancePage";

const Setting = () => {
  const { t } = useTranslation();
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [savingToggle, setSavingToggle] = useState<boolean>(false);
  const [savingMessage, setSavingMessage] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);

  // Fetch current maintenance setting
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings/public/maintenance`
        );
        if (res.data) {
          setMaintenanceMode(Boolean(res.data.maintenance_mode));
          if (res.data.message) {
            setMaintenanceMessage(res.data.message);
          }
        }
      } catch (error) {
        console.error("Failed to load maintenance mode setting:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Toggle Maintenance Mode
  const handleToggleMaintenance = async () => {
    setSavingToggle(true);
    const nextValue = !maintenanceMode;

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("a") : null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = token;
      const userClient = (global as any)?.clientId1328 || (typeof window !== "undefined" ? localStorage.getItem("clientId1328") : "");
      if (userClient) headers["User-Client"] = userClient;

      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings/maintenance_mode`,
        { value: String(nextValue) },
        { headers }
      );

      setMaintenanceMode(nextValue);

      if (nextValue) {
        toast.success("تم تفعيل وضع الصيانة! المنصة الآن محجوبة عن الزوار.");
      } else {
        toast.success("تم إيقاف وضع الصيانة! المنصة متاحة الآن لجميع المستخدمين.");
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("settingsChanged", {
            detail: { key: "maintenance_mode", value: nextValue },
          })
        );
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "فشل تحديث وضع الصيانة. يرجى مراجعة الصلاحيات."
      );
    } finally {
      setSavingToggle(false);
    }
  };

  // Save Custom Maintenance Message
  const handleSaveMessage = async () => {
    setSavingMessage(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("a") : null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = token;
      const userClient = (global as any)?.clientId1328 || (typeof window !== "undefined" ? localStorage.getItem("clientId1328") : "");
      if (userClient) headers["User-Client"] = userClient;

      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings/maintenance_message`,
        { value: maintenanceMessage },
        { headers }
      );

      toast.success("تم حفظ رسالة الصيانة بنجاح.");

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("settingsChanged", {
            detail: { key: "maintenance_message", value: maintenanceMessage },
          })
        );
      }
    } catch (error: any) {
      toast.error("فشل حفظ رسالة الصيانة.");
    } finally {
      setSavingMessage(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5" dir="rtl">
      {/* Sub Navigation Bar */}
      <SettingSubNav />

      {/* Info Header Banner */}
      <div className="rounded-lg border border-zinc-800 bg-[#0f121d] p-4 flex items-start sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 mt-0.5 sm:mt-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">إعدادات وضع الصيانة (Maintenance Mode)</h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              التحكم في إتاحة المنصة للمستخدمين أو حجبها مؤقتاً أثناء التحديثات وأعمال الصيانة البرمجية.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-[#121620] hover:bg-[#181e2c] px-3 py-1.5 text-xs font-semibold text-zinc-200 transition"
        >
          <Eye className="w-3.5 h-3.5 text-zinc-400" />
          <span>معاينة صفحة الصيانة</span>
        </button>
      </div>

      {/* Control Card */}
      <div className="rounded-lg border border-zinc-800 bg-[#0f121d] p-5 sm:p-6 space-y-6">
        {/* Toggle Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800/80 pb-5">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border transition-colors ${
                maintenanceMode
                  ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              }`}
            >
              {maintenanceMode ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white">
                  حالة الموقع الحالية
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold border ${
                    maintenanceMode
                      ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      maintenanceMode ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
                    }`}
                  />
                  {maintenanceMode ? "وضع الصيانة مفعّل (محجوب)" : "الموقع متاح للجميع"}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                {maintenanceMode
                  ? "الموقع محجوب حالياً عن جميع الزوار والمستخدمين، ومتاح فقط للمشرفين للإدارة والتطوير."
                  : "الموقع متاح ويعمل بصورة طبيعية لجميع الزوار والمستخدمين المسجلين."}
              </p>
            </div>
          </div>

          {/* Toggle Switch Button */}
          <div className="flex items-center gap-3 self-end sm:self-center">
            <button
              type="button"
              onClick={handleToggleMaintenance}
              disabled={loading || savingToggle}
              className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                maintenanceMode ? "bg-rose-600" : "bg-zinc-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white transition duration-200 ease-in-out ${
                  maintenanceMode ? "-translate-x-6" : "translate-x-0"
                }`}
              />
            </button>

            <span className="text-xs font-semibold text-zinc-300 min-w-[55px]">
              {savingToggle ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-400" />
              ) : maintenanceMode ? (
                "مُعطّل للعامة"
              ) : (
                "نشط ويعمل"
              )}
            </span>
          </div>
        </div>

        {/* Message Settings Field */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-200">
              رسالة الصيانة المخصصة للمستخدمين
            </label>
            <span className="text-[11px] text-zinc-500">
              تظهر للمستخدمين عند محاولة فتح أي صفحة داخل المنصة
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={maintenanceMessage}
              onChange={(e) => setMaintenanceMessage(e.target.value)}
              placeholder="نقوم حالياً برفع التحديث الجديد للمنصة. سنعود للعمل خلال دقائق معدودة..."
              className="flex-1 rounded-md border border-zinc-800 bg-[#121620] px-3.5 py-2 text-xs text-white placeholder-zinc-500 outline-none transition focus:border-zinc-600"
            />
            <button
              type="button"
              onClick={handleSaveMessage}
              disabled={savingMessage}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-[#00c48c] hover:bg-[#00b07d] px-4 py-2 text-xs font-bold text-zinc-950 transition disabled:opacity-50 shrink-0"
            >
              {savingMessage ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              <span>{savingMessage ? "جاري الحفظ..." : "حفظ الرسالة"}</span>
            </button>
          </div>
        </div>

        {/* Notice Info Box */}
        <div className="rounded-md border border-zinc-800 bg-[#121620]/60 p-3.5 text-xs text-zinc-400 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            ملاحظة: تفعيل وضع الصيانة يرسل إشارة فورية لجميع المتصفحات المفتوحة عبر WebSocket لإعادة التوجيه إلى شاشة الصيانة تلقائياً دون الحاجة لإعادة تحميل الصفحة.
          </p>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-[999999] bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="sticky top-0 z-[100] flex items-center justify-between bg-[#080b12] px-6 py-2.5 border-b border-zinc-800">
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>معاينة حية لصفحة الصيانة كما يراها المستخدم</span>
            </span>

            <button
              onClick={() => setShowPreview(false)}
              className="inline-flex items-center gap-1 rounded-md bg-zinc-800 hover:bg-zinc-700 px-3 py-1 text-xs font-semibold text-white transition"
            >
              <X className="h-3.5 w-3.5" />
              <span>إغلاق المعاينة</span>
            </button>
          </div>

          <MaintenancePage
            customMessage={maintenanceMessage}
            onRefreshCheck={() => toast.success("فحص تجريبي: فحص الاتصال يعمل بنجاح!")}
          />
        </div>
      )}
    </div>
  );
};

export default Setting;