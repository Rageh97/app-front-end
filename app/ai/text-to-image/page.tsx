"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TextToImageRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new image generation page
    router.replace('/ai/image');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#06070B] text-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-sm font-bold text-gray-400">جاري التحويل إلى استوديو الصور...</div>
      </div>
    </div>
  );
}