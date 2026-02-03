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
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#16213e] text-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-xl">Redirecting to AI Image Generator...</div>
      </div>
    </div>
  );
}