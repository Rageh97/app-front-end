"use client";

import React from "react";
import { LucideIcon, Sparkles } from "lucide-react";

export interface AILoadingOverlayProps {
  isGenerating: boolean;
  progress?: number;
  timerSeconds?: number;
  title?: string;
  subMessage?: string;
  icon?: LucideIcon;
  variant?: 'emerald' | 'blue' | 'purple';
}

/**
 * Standard Minimalist Nano-Banana Style AI Loading Overlay
 * Clean, fast, aesthetic with no verbose paragraphs or text clutter.
 */
export const AILoadingOverlay: React.FC<AILoadingOverlayProps> = ({
  isGenerating,
  progress,
  timerSeconds,
  title,
  subMessage,
  icon: Icon = Sparkles,
}) => {
  if (!isGenerating) return null;

  return (
    <div className="absolute inset-0 bg-[#06070B]/85 backdrop-blur-md z-30 flex flex-col items-center justify-center gap-3 p-4 select-none animate-in fade-in duration-200">
      {/* Sleek Centered Spinner */}
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulsing ring */}
        <div className="w-14 h-14 rounded-full border-2 border-emerald-500/20 animate-ping absolute inset-0 m-auto" />
        {/* Rotating spinner */}
        <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-emerald-500 animate-spin" />
        {/* Inner subtle icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon size={18} className="text-emerald-400 animate-pulse" />
        </div>
      </div>

      {(title || subMessage) && (
        <div className="text-center max-w-sm" dir="rtl">
          {title && <p className="text-sm font-bold text-white">{title}</p>}
          {subMessage && <p className="mt-1 text-[11px] leading-5 text-gray-400">{subMessage}</p>}
        </div>
      )}

      {/* Minimalist Progress Indicator (if provided) */}
      {progress !== undefined && progress > 0 && (
        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
          {Math.floor(progress)}%
        </span>
      )}

      {/* Minimalist Timer (if provided and no progress) */}
      {progress === undefined && timerSeconds !== undefined && timerSeconds > 0 && (
        <span className="text-[11px] font-mono text-gray-400">
          {timerSeconds}s
        </span>
      )}
    </div>
  );
};
