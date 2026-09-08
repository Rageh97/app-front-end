"use client";

import React from "react";
import { LucideIcon, Sparkles } from "lucide-react";

export interface AIGenerationCardProps {
  progress?: number;
  aspectRatio?: string;
  icon?: LucideIcon;
  className?: string;
}

/**
 * Standard Nano-Banana Style Ghost Generation Card for Grids & Galleries
 */
export const AIGenerationCard: React.FC<AIGenerationCardProps> = ({
  progress,
  aspectRatio = "aspect-square",
  icon: Icon = Sparkles,
  className = "",
}) => {
  return (
    <div
      className={`break-inside-avoid relative rounded-2xl overflow-hidden bg-[#0B0D14] border border-emerald-500/30 ${aspectRatio} flex flex-col items-center justify-center p-4 shadow-lg animate-pulse ${className}`}
    >
      <div className="relative flex items-center justify-center mb-2">
        <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-emerald-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon size={16} className="text-emerald-400 animate-pulse" />
        </div>
      </div>
      {progress !== undefined && progress > 0 && (
        <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          {Math.floor(progress)}%
        </span>
      )}
    </div>
  );
};
