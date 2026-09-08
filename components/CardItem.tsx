import { FunctionComponent, useEffect, useState } from "react";
import { NewToolsDto } from "@/types/tools/new-tools-dto";
import { checkIfImageUrl } from "@/utils/imageValidator";
import { Crown, ShoppingCart } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CardItemProps {
  onClick: Function;
  toolData: NewToolsDto;
}

const CardItem: FunctionComponent<CardItemProps> = ({ toolData, onClick }) => {
  const [subLogoUrl, setSubLogoUrl] = useState<string | null>(null);
  const staticLogoPath = "/images/nexus-logo-22.png"; // Define static path
  const { t } = useTranslation();
  const isFree = !!toolData?.isFree;
  const isStable = toolData?.isStable !== false;

  useEffect(() => {
    const fetchSubLogo = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings/site_sub_logo`);
        if (response.ok) {
          const result = await response.json();
          if (result.value) {
            setSubLogoUrl(`${process.env.NEXT_PUBLIC_API_URL}${result.value}`);
          }
        }
      } catch (error) {
        console.error("Failed to fetch sub-logo:", error);
      }
    };

    fetchSubLogo();
  }, []);

  return (
    <div
      onClick={() => {
        if (isStable) onClick();
      }}
      className={`w-full mb-5 cursor-pointer relative ${
        !isStable ? "cursor-not-allowed" : ""
      }`}
    >
      {/* Maintenance Overlay */}
      {!isStable && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-md rounded-2xl transition-all duration-500">
           <div className="flex flex-col items-center gap-2 transform -rotate-6">
             <div className="text-white font-bold text-xl">
               {toolData?.tool_name}
             </div>
             <div className="bg-[#ff7702] text-white px-5 py-1.5 rounded-full font-black text-sm shadow-md animate-pulse">
               {t("dashboard.maintenance")}
             </div>
             <p className="text-white/80 text-xs font-bold uppercase tracking-widest">{t("dashboard.stableSoon")}</p>
           </div>
        </div>
      )}

      {/* ==================== DARK MODE CARD LAYOUT ==================== */}
      <div className={`hidden dark:flex flex-col w-full h-full bg-gradient-to-b from-[#131622] via-[#0E1018] to-[#0A0C13] border border-zinc-800/80 hover:border-emerald-500/40 rounded-2xl overflow-hidden transition-all duration-300 shadow-lg  group relative ${!isStable ? "filter blur-[2px] grayscale-[0.5]" : ""}`}>
        
        {/* Ambient Top Glow Line on Hover */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-20" />

        {/* Proportional Image Container - Matching Image Dimensions */}
        <div className="relative w-full aspect-[16/10] overflow-hidden bg-[#141622] flex items-center justify-center p-1.5 border-b border-white/[0.04]">
          <img
            src={
              checkIfImageUrl(toolData?.tool_image)
                ? toolData?.tool_image
                : "/images/default_image.png"
            }
            alt={toolData?.tool_name}
            className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform duration-500"
          />
          
          {/* Status Badge */}
          <div className="absolute top-2.5 start-2.5 z-10">
            {isFree ? (
              <span className="bg-emerald-500/25 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md flex items-center gap-1 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {t("dashboard.free")}
              </span>
            ) : (
              <span className="bg-amber-500/25 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md flex items-center gap-1 shadow-sm">
                <Crown size={11} className="text-amber-400" />
                {t("dashboard.pro")}
              </span>
            )}
          </div>

        </div>

        {/* Content Info (Padded & Compact) */}
        <div className="flex flex-col justify-between flex-1 p-3.5">
          <div>
            <h3 className="text-white font-bold text-sm group-hover:text-emerald-400 transition-colors truncate mb-1">
              {toolData?.tool_name}
            </h3>
            <p className="text-zinc-400 text-xs line-clamp-2 leading-relaxed h-[34px]">
              {toolData?.tool_content}
            </p>
          </div>

          {/* Action & Pricing Footer Bar */}
          <div className="pt-2.5 mt-2.5 border-t border-zinc-800/80 flex items-center justify-between gap-2">
            {/* Price section */}
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                {isFree ? t("dashboard.free") : "الاشتراك"}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-white font-extrabold text-xs">
                  {isFree ? t("dashboard.free") : `IQD ${toolData?.tool_month_price ?? "--"}`}
                </span>
                {!isFree && toolData?.tool_none_price_month && (
                  <del className="text-zinc-400 text-[10px]">
                    IQD {toolData?.tool_none_price_month}
                  </del>
                )}
              </div>
            </div>

            {/* CTA Button */}
            <div className="bg-[#00c48c] hover:bg-emerald-400 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm transition-all duration-200 group-hover:shadow-[0_4px_12px_rgba(0,196,140,0.3)]">
              <span>{isFree ? t("dashboard.useNow") : t("dashboard.buyNow")}</span>
              <ShoppingCart size={12} className="text-slate-950" />
            </div>
          </div>
        </div>
      </div>

      {/* ==================== LIGHT MODE ORIGINAL CARD LAYOUT ==================== */}
      <div className={`dark:hidden flex flex-col h-[340px] w-full bg-[linear-gradient(180deg,_#00c48c,_#4f008c)] border-2 border-[#ff7702] shadow-xl rounded-[20px] duration-500 hover:scale-[1.03] hover:shadow-2xl relative overflow-hidden ${!isStable ? "filter blur-[2px] grayscale-[0.5]" : ""}`}>
        <div className="w-full aspect-[16/10] flex justify-center items-center relative overflow-hidden rounded-t-[18px]">
          <img
            src={
              checkIfImageUrl(toolData?.tool_image)
                ? toolData?.tool_image
                : "/images/default_image.png"
            }
            alt="Product"
            className="h-full w-full object-cover"
          />
          {/* Diagonal Corner Ribbon */}
          <div className="absolute top-0 left-0 w-32 h-32 overflow-hidden rounded-tl-[18px] z-20 pointer-events-none">
            <div
              className={`absolute -top-1 -left-9 pr-7 w-[150px] py-1.5 rotate-[-45deg] shadow-[0_5px_15px_rgba(0,0,0,0.3)] border-y border-white/20 backdrop-blur-md transition-all duration-500 group-hover:scale-110 ${
                isFree 
                  ? "bg-gradient-to-r from-[#00c48c] to-[#008c64] text-white " 
                  : "bg-gradient-to-r from-[#ff7702] to-[#00c48c] text-white "
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                {isFree ? (
                  <>
                    <div className="w-1 h-1 rounded-full bg-black animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-widest">{t("dashboard.free")}</span>
                  </>
                ) : (
                  <>
                    <Crown size={12} className="text-white drop-shadow-md" />
                    <span className="text-xs font-black uppercase tracking-widest">{t("dashboard.pro")}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full relative flex justify-center h-[125px] mt-auto">
          <div className="absolute flex items-center justify-center gradient-border-3 text-3xl font-bold bottom-15 z-1 w-15 h-15 bg-[linear-gradient(180deg,_#00c48c,_#4f008c,_#190237)] rounded-full text-black">
            <img src={subLogoUrl ? subLogoUrl : "/images/icon.png.png"} alt="Sub Logo" className="w-full h-full object-contain p-1" />
          </div>
          <div className="pb-3 pt-6 flex flex-col justify-between h-[150px] bg-[linear-gradient(180deg,_#00c48c,_#4f008c,_#190237)] absolute w-[97%] top-[-25px] rounded-[14px] shadow-[0_-7px_15px_rgba(0,0,0,0.4)]">
            <p className="px-4 text-xl font-bold text-white text-center truncate block capitalize">
              {toolData?.tool_name}
            </p>
            <div className="px-4 text-xs text-white break-words line-clamp-2">
              {toolData?.tool_content}
            </div>
            <div className="px-2 flex items-center gap-5 justify-center w-full ">
              <div className="w-full flex gap-1 items-center justify-center gradient-border-3 bg-inherit text-[#00c48c] rounded-md px-2 py-2 font-bold text-xs">
                {isFree ? t("dashboard.useNow") : t("dashboard.buyNow")}
                <p className="text-white">
                  {isFree
                    ? t("dashboard.free")
                    : `IQD ${toolData?.tool_month_price ?? "--"}`}
                </p>
                {!isFree && (
                  <del>
                    <p className="text-[#ff7702]">
                      IQD ${toolData?.tool_none_price_month}
                    </p>
                  </del>
                )}
                <ShoppingCart size={18} color="#ffffff" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardItem;
