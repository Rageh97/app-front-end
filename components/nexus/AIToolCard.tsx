import Link from 'next/link';
import { ArrowUpLeft } from 'lucide-react';
import type { NexusAITool } from '@/lib/nexus-ai-catalog';

interface AIToolCardProps {
  tool: NexusAITool;
  image?: string;
  compact?: boolean;
}

export function AIToolCard({ tool, image, compact = false }: AIToolCardProps) {
  return (
    <Link href={tool.href} className="block group h-full">
      <div
        className={`relative flex flex-col justify-between overflow-hidden rounded-[22px] p-[1px] bg-white/[0.08] hover:bg-gradient-to-tr hover:from-emerald-500/80 hover:via-teal-400 hover:to-emerald-400 transition-all duration-300 cursor-pointer h-full ${
          compact ? 'min-h-[200px] sm:min-h-[220px]' : 'min-h-[240px] sm:min-h-[265px]'
        }`}
      >
        <div className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-[21px] bg-[#0a0d16]">
          {/* Background Image with Balanced Contrast & No Scale */}
          <img
            src={image || tool.image}
            alt={tool.title}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-center opacity-72 transition duration-500 group-hover:opacity-85"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/انشاء الصور.png';
            }}
          />
          {/* Balanced Dark Gradient Overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070910] via-[#070910]/50 to-transparent" />

          {/* Top Glow Highlight on Hover */}
          <div className="pointer-events-none absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-300/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Content Container */}
          <div className="relative flex h-full flex-col justify-between p-5 sm:p-6 z-10">
            {/* Top Badge */}
            <div className="flex min-h-7 justify-start">
              {tool.badge && (
                <span className="rounded-full border border-emerald-400/30 bg-black/55 px-3 py-1 text-[11px] font-black text-emerald-300 backdrop-blur-md shadow-sm">
                  {tool.badge}
                </span>
              )}
            </div>

            {/* Bottom Title, Description & Action Icon */}
            <div className="flex items-end justify-between gap-3 text-right pt-4">
              <div className="flex-1 min-w-0">
                <h3 className={`${compact ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'} font-black text-white group-hover:text-emerald-300 transition-colors`}>
                  {tool.title}
                </h3>
                <p className={`mt-1.5 text-xs sm:text-[13px] leading-5 sm:leading-6 text-slate-300 ${compact ? 'line-clamp-2' : 'line-clamp-2 sm:line-clamp-3'}`}>
                  {tool.description}
                </p>
              </div>

              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/[0.1] bg-white/[0.06] text-white transition group-hover:border-emerald-300/40 group-hover:bg-emerald-300 group-hover:text-[#06100d]">
                <ArrowUpLeft size={16} />
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
