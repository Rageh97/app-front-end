import { ArrowUpLeft, Wrench } from "lucide-react";
import type { NewToolsDto } from "@/types/tools/new-tools-dto";
import { checkIfImageUrl } from "@/utils/imageValidator";

interface WebToolCardProps {
  tool: NewToolsDto;
  onClick: () => void;
  compact?: boolean;
}

export function WebToolCard({ tool, onClick, compact = true }: WebToolCardProps) {
  const isStable = tool?.isStable !== false;
  const isFree = !!tool?.isFree;
  const monthlyPrice = tool?.tool_month_price ?? (tool as any)?.month_price;
  
  const rawImage = tool?.tool_image;
  const isExternal = checkIfImageUrl(rawImage);
  const imageUrl = rawImage
    ? (isExternal ? rawImage : `${process.env.NEXT_PUBLIC_API_URL}${rawImage}`)
    : "/images/nexus-logo-22.png";

  const priceText = isFree
    ? "مجاني"
    : monthlyPrice
      ? `$${monthlyPrice}/شهر`
      : "اشتراك شهري";

  return (
    <div
      onClick={() => {
        if (isStable) onClick();
      }}
      className={`group relative overflow-hidden rounded-2xl p-[1px] bg-white/[0.08] hover:bg-gradient-to-tr hover:from-amber-500/80 hover:via-emerald-400/80 hover:to-teal-400 transition-all duration-300 select-none ${
        compact ? "min-h-[160px] sm:min-h-[170px]" : "min-h-[210px]"
      } ${
        !isStable
          ? "opacity-75 cursor-not-allowed"
          : "cursor-pointer"
      }`}
    >
      <div className="relative flex h-full w-full min-h-[inherit] flex-col justify-between overflow-hidden rounded-[15px] bg-[#0a0d16]">
        {/* Background Image & Backdrop - Balanced, No Scale */}
        <img
          src={imageUrl}
          alt={tool.tool_name}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover opacity-72 transition duration-500 group-hover:opacity-85"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/images/nexus-logo-22.png";
          }}
        />
        {/* Balanced Dark Gradient */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070910] via-[#070910]/50 to-transparent" />

        {/* Top Border Glow Highlight on Hover */}
        <div className="pointer-events-none absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-amber-300/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Maintenance Overlay if not stable */}
        {!isStable && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 p-4 text-center backdrop-blur-sm">
            <div className="flex items-center gap-1.5 rounded-full bg-orange-500/20 border border-orange-500/40 px-3 py-1 text-xs font-bold text-orange-300">
              <Wrench size={13} />
              <span>صيانة مؤقتة</span>
            </div>
            <p className="mt-1.5 text-[10px] text-zinc-400">ستعود للعمل قريبًا بأعلى استقرار</p>
          </div>
        )}

        {/* Content Container */}
        <div className="relative flex h-full min-h-[inherit] flex-col justify-between p-4 sm:p-5 z-10">
          {/* Top Price Badge (Only Monthly Price) */}
          <div className="flex items-center justify-start">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black backdrop-blur-md shadow-sm ${
                isFree
                  ? "border-emerald-400/30 bg-emerald-500/20 text-emerald-300"
                  : "border-amber-400/30 bg-black/60 text-amber-300"
              }`}
            >
              {priceText}
            </span>
          </div>

          {/* Bottom Title & Action */}
          <div className="flex items-end justify-between gap-3 text-right">
            <h3 className="text-base sm:text-lg font-black text-white group-hover:text-amber-300 transition-colors">
              {tool.tool_name}
            </h3>

            {isStable && (
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/[0.1] bg-white/[0.06] text-white transition group-hover:border-amber-300/40 group-hover:bg-amber-300 group-hover:text-[#06100d]">
                <ArrowUpLeft size={15} />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
