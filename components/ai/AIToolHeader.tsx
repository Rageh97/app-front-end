"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, CreditCard, Crown, LucideIcon, Sparkles } from "lucide-react";

export interface AIToolHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  icon?: LucideIcon;
  iconGradient?: string;
  userCredits?: number | string | null;
  onUpgradeClick?: () => void;
  backHref?: string;
}

export const AIToolHeader: React.FC<AIToolHeaderProps> = ({
  title,
  userCredits,
  onUpgradeClick,
  backHref = "/ai",
}) => {
  return (
    <header className="h-14 border-b border-white/[0.08] bg-[#0B0D14] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Back Navigation & Tool Name Only */}
      <div className="flex items-center gap-3">
        <Link
          href={backHref}
          className="p-1.5 rounded-lg bg-[#121520] hover:bg-[#161a27] text-gray-300 hover:text-white transition-all active:scale-95 border border-white/[0.08] hover:border-white/20"
          title="العودة"
        >
          <ArrowRight size={18} />
        </Link>
        
        <h1 className="text-sm sm:text-base font-bold text-white tracking-wide">
          {title}
        </h1>
      </div>

      {/* Credits Balance & Upgrade Action */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#121520] border border-white/[0.08] text-xs font-mono">
          <CreditCard size={14} className="text-emerald-400" />
          <span className="text-gray-400 hidden xs:inline">الرصيد:</span>
          <span className="text-emerald-400 font-bold">
            {userCredits !== undefined && userCredits !== null ? userCredits : "..."}
          </span>
        </div>

        {onUpgradeClick && (
          <button
            onClick={onUpgradeClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all border border-emerald-500/40 active:scale-95 shadow-sm"
          >
            <Crown size={13} />
            <span>ترقية</span>
          </button>
        )}
      </div>
    </header>
  );
};
