"use client";

import React from "react";
import { Sparkles, Loader2, LucideIcon } from "lucide-react";

export interface AIGenerateButtonProps {
  onClick: () => void;
  isGenerating: boolean;
  disabled?: boolean;
  cost?: number | string;
  label?: string;
  generatingLabel?: string;
  timerSeconds?: number;
  icon?: LucideIcon;
  variant?: 'emerald' | 'green' | 'blue' | 'purple' | 'indigo' | 'rose' | 'amber' | 'cyan' | 'orange' | 'teal' | 'violet';
  className?: string;
}

export const AIGenerateButton: React.FC<AIGenerateButtonProps> = ({
  onClick,
  isGenerating,
  disabled = false,
  cost,
  label = "إنشاء",
  generatingLabel = "جاري الإنشاء...",
  timerSeconds,
  icon: Icon = Sparkles,
  variant = 'emerald',
  className = "",
}) => {
  const isDisabled = disabled || isGenerating;

  return (
    <div className="w-full px-1.5 py-0.5 flex justify-center">
      <button
        type="button"
        onClick={onClick}
        disabled={isDisabled}
        className={`
          relative group w-full py-3 px-5 transition-all duration-300 font-bold text-sm select-none
          skew-x-[-22deg] rounded-[15px] overflow-hidden
          ${isDisabled 
            ? "bg-[#141724] text-zinc-500 border border-zinc-800/80 cursor-not-allowed opacity-50 shadow-none" 
            : "bg-[linear-gradient(135deg,_#4f008c_0%,_#3d006e_50%,_#190237_100%)] hover:bg-[linear-gradient(135deg,_#6100ad_0%,_#4c008a_50%,_#21034a_100%)] text-white border border-[#ff7702]/60 hover:border-[#ff7702] gradient-border-packet shadow-[0_4px_20px_rgba(79,0,140,0.4)] hover:shadow-[0_6px_25px_rgba(255,119,2,0.35),0_0_20px_rgba(79,0,140,0.5)] active:scale-[0.98]"
          }
          ${className}
        `}
      >
        {/* Subtle Light Shimmer Sweep Animation on Hover */}
        {!isDisabled && (
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.14] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none rounded-[15px]" />
        )}

        {/* Inner Content with Inverse Skew to Keep Typography & Icons Perfectly Upright */}
        <div className="skew-x-[22deg] flex items-center justify-between w-full gap-3">
          {/* Action Title & Icon */}
          <div className="flex items-center gap-2.5 min-w-0">
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#ff7702] shrink-0" />
            ) : (
              <Icon className="w-4 h-4 text-[#ff9933] group-hover:scale-110 transition-transform duration-200 shrink-0" />
            )}
            <span className="truncate font-extrabold tracking-wide text-sm text-white drop-shadow-sm">
              {isGenerating 
                ? (timerSeconds !== undefined ? `${generatingLabel || "جاري الإنشاء..."} (${timerSeconds}s)` : (generatingLabel || "جاري الإنشاء..."))
                : (label || "إنشاء")
              }
            </span>
          </div>

          {/* Cost Badge */}
          {cost !== undefined && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/45 text-xs font-mono shrink-0 border border-white/10 shadow-inner">
              <span className="font-bold text-[#ff9933]">{cost}</span>
              <span className="text-[11px] text-zinc-300">نقطة</span>
            </div>
          )}
        </div>
      </button>
    </div>
  );
};

export default AIGenerateButton;
