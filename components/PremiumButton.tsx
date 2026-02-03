"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon?: LucideIcon;
  secondaryIcon?: LucideIcon;
  variant?: "primary" | "secondary";
  className?: string;
}

export const PremiumButton = ({
  label,
  icon: Icon,
  secondaryIcon: SecondaryIcon,
  className,
  ...props
}: PremiumButtonProps) => {
  return (
    <button
      className={cn(
        "group relative flex flex-row items-center bg-[#111] justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium shadow-[inset_0_-8px_10px_#8fdfff1f] transition-all duration-500 ease-out hover:shadow-[inset_0_-5px_10px_#8fdfff3f] hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    >
      {/* Animated Gradient Border */}
      <div
        className="absolute inset-0 block h-full w-full animate-gradient bg-gradient-to-r from-[#ffaa40]/50 via-[#9c40ff]/50 to-[#ffaa40]/50 bg-[length:var(--bg-size)_100%] [border-radius:inherit] [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] p-[1px] ![mask-composite:subtract] [--bg-size:300%]"
      ></div>

      {/* Leading Icon */}
      {Icon && <Icon size={18} className="text-[#ffaa40] relative z-10" />}

      {/* Separator */}
      {/* {Icon && (
        <div className="shrink-0 bg-white/10 w-[1px] h-4 relative z-10"></div>
      )} */}

      {/* Label with Gradient Text */}
      <span className="inline animate-gradient whitespace-pre bg-gradient-to-r from-[#ffaa40] via-[#9c40ff] to-[#ffaa40] bg-[length:var(--bg-size)_100%] bg-clip-text text-transparent [--bg-size:300%] text-center font-black relative z-10">
        {label}
      </span>

      {/* Trailing Icon (Secondary) */}
      {SecondaryIcon && (
        <SecondaryIcon
          size={16}
          className="text-[#9c40ff] relative z-10 transition group-hover:translate-x-[-3px]"
        />
      )}
    </button>
  );
};
