"use client";

import React, { useEffect } from "react";
import { RefreshCw, Home, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log exception for debugging without crashing the entire React tree
    console.error("[NEXUS] Global Error Boundary caught exception:", error);
  }, [error]);

  return (
    <div
      className="min-h-screen bg-[#05060A] text-white flex flex-col items-center justify-center p-6 text-center select-none"
      dir="rtl"
    >
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shadow-2xl">
          <RefreshCw size={36} className="animate-spin" style={{ animationDuration: '8s' }} />
        </div>
        <div className="absolute inset-0 rounded-3xl bg-rose-500/20 blur-xl -z-10" />
      </div>

      <h1 className="text-xl sm:text-2xl font-black text-white mb-2 tracking-wide">
        حدث انقطاع غير متوقع أثناء التنقل
      </h1>
      <p className="text-xs sm:text-sm text-gray-400 max-w-md mb-8 leading-relaxed">
        تم إيقاف المعالجة السابقة بأمان دون التأثير على حسابك. يمكنك تحديث الصفحة الآن أو العودة للوحة التحكم.
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold transition-all shadow-lg flex items-center gap-2"
        >
          <RefreshCw size={15} />
          <span>إعادة المحاولة</span>
        </button>

        <Link
          href="/dashboard"
          className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-2 border border-white/10"
        >
          <Home size={15} />
          <span>لوحة التحكم</span>
        </Link>

        <Link
          href="/ai"
          className="px-5 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-bold transition-all flex items-center gap-2 border border-emerald-500/30"
        >
          <ArrowRight size={15} />
          <span>استوديو AI</span>
        </Link>
      </div>
    </div>
  );
}
