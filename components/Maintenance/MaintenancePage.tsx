"use client";

import React, { useState, useEffect } from "react";
import { Wrench, Lock, X, AlertCircle } from "lucide-react";
import axios from "axios";

import FingerprintJS from "@fingerprintjs/fingerprintjs";

interface MaintenancePageProps {
  customMessage?: string | null;
  onRefreshCheck?: () => void;
  isChecking?: boolean;
}

export default function MaintenancePage({
  customMessage,
  onRefreshCheck,
  isChecking = false,
}: MaintenancePageProps) {
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");

  // Silent background check every 15s so user returns automatically when maintenance ends
  useEffect(() => {
    const interval = setInterval(() => {
      if (onRefreshCheck) onRefreshCheck();
    }, 15000);

    return () => clearInterval(interval);
  }, [onRefreshCheck]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoading(true);
    setAdminError("");

    try {
      // 1. Get visitorId from FingerprintJS
      let visitorId = (global as any)?.clientId1328 || (typeof window !== "undefined" ? localStorage.getItem("clientId1328") : "");
      if (!visitorId) {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        visitorId = result.visitorId;
        localStorage.setItem("clientId1328", visitorId);
        (global as any).clientId1328 = visitorId;
      }

      const deviceInfo = {
        os: navigator.platform,
        browser: navigator.userAgent || "Unknown",
        screen: `${window.screen.width}x${window.screen.height}`
      };

      // 2. Perform official login with User-Client header
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login/`,
        {
          email: adminEmail,
          password: adminPassword,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "User-Client": visitorId,
            "X-Device-Info": JSON.stringify(deviceInfo)
          }
        }
      );

      if (res.data?.token) {
        const token = res.data.token;
        localStorage.setItem("a", token);

        const usernameValue = res.data?.email || res.data?.user?.email || res.data?.userData?.email || adminEmail;
        if (usernameValue) {
          document.cookie = `username=${usernameValue}; path=/; max-age=604800; SameSite=Lax`;
        }

        // 3. Verify user role immediately
        try {
          const userRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/user/`, {
            headers: {
              Authorization: token,
              "User-Client": visitorId
            }
          });

          const role = userRes.data?.userRole || userRes.data?.role || userRes.data?.userData?.role || userRes.data?.userData?.userRole;
          const userData = userRes.data?.userData || userRes.data;

          if (role === "admin" || role === "manager") {
            localStorage.setItem("userRole", role);
            (global as any).userRole = role;
            global.userData = userData;
            window.location.href = "/admin/setting";
            return;
          } else {
            localStorage.removeItem("a");
            localStorage.removeItem("userRole");
            setAdminError("هذا الحساب لا يمتلك صلاحيات إدارة (Admin). لا يمكن الدخول أثناء فترة الصيانة.");
            setAdminLoading(false);
            return;
          }
        } catch {
          // If role fetch fails, fallback to redirect
          localStorage.setItem("userRole", "admin");
          window.location.href = "/admin/setting";
        }
      } else {
        setAdminError("بيانات الدخول غير صحيحة.");
        setAdminLoading(false);
      }
    } catch (err: any) {
      setAdminError(
        err.response?.data?.message || err.response?.data || "فشل تسجيل الدخول. تأكد من صحة بيانات الإدارة."
      );
      setAdminLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full bg-[#080b12] text-slate-200 flex flex-col justify-between"
      dir="rtl"
    >
      {/* Top Simple Header */}
      <header className="w-full max-w-4xl mx-auto px-6 py-5 flex items-center justify-between border-b border-white/[0.06]">
        <img
          src="/images/logoN.png"
          alt="NEXUS"
          className="h-8 w-auto object-contain"
        />

        <div className="inline-flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-emerald-400 text-xs font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>تحديث قيد التنفيذ</span>
        </div>
      </header>

      {/* Main Clean Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-xl border border-white/[0.08] bg-[#0c101a] p-7 text-center space-y-5">
          {/* Icon */}
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03]">
            <Wrench className="h-5 w-5 text-emerald-400" />
          </div>

          {/* Heading */}
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              الموقع في وضع الصيانة
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
              {customMessage || "نقوم حالياً برفع التحديث الجديد وتحسين الخوادم. سنعود للعمل بكامل طاقتنا خلال دقائق معدودة."}
            </p>
          </div>

          {/* Simple Interactive Progress */}
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3.5 space-y-2 text-right">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">اكتمال رفع التحديث</span>
              <span className="font-mono text-emerald-400 font-bold">88%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                style={{ width: "88%" }}
              />
            </div>
          </div>

        </div>
      </main>

      {/* Footer & Discreet Admin Login */}
      <footer className="w-full max-w-4xl mx-auto px-6 py-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-500">
        <div>NEXUS © {new Date().getFullYear()}</div>

        <button
          onClick={() => setShowAdminModal(true)}
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition"
        >
          <Lock className="h-3 w-3" />
          <span>دخول المسؤولين</span>
        </button>
      </footer>

      {/* Admin Login Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="relative w-full max-w-sm rounded-xl border border-white/[0.1] bg-[#0c101a] p-6 text-right">
            <button
              onClick={() => setShowAdminModal(false)}
              className="absolute top-4 left-4 text-slate-400 hover:text-white transition p-1"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] border border-white/[0.08] text-emerald-400">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">تسجيل دخول الإدارة</h3>
                <p className="text-[11px] text-slate-400">للمصرح لهم فقط أثناء فترة الصيانة</p>
              </div>
            </div>

            {adminError && (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 text-xs text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{adminError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  كلمة المرور
                </label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={adminLoading}
                  className="flex-1 rounded-lg bg-emerald-500 py-2 text-xs font-bold text-black hover:bg-emerald-400 transition disabled:opacity-50"
                >
                  {adminLoading ? "جاري الدخول..." : "دخول"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-3.5 py-2 text-xs text-slate-400 hover:text-white transition"
                >
                  إلغاء
                </button>
              </div>

              <div className="pt-2 text-center">
                <a href="/signin" className="text-[11px] text-emerald-400/80 hover:text-emerald-300 hover:underline">
                  أو الدخول عبر صفحة الدخول الرسمية ←
                </a>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
