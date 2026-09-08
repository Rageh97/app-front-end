import { FunctionComponent } from "react";
import { NewToolsDto } from "@/types/tools/new-tools-dto";
import { fullDateTimeFormat } from "@/utils/timeFormatting";
import { checkIfImageUrl } from "@/utils/imageValidator";
import Link from "next/link";
import { ExternalLink, Cloud, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CloudLaunchCardProps {
  toolData: NewToolsDto;
  endedAt: string;
  content?: string;
}

const CloudLaunchCard: FunctionComponent<CloudLaunchCardProps> = ({
  toolData,
  endedAt,
  content,
}) => {
  const { t } = useTranslation();
  const isFree = !!toolData?.isFree;
  const href = `/cloud-tool?toolId=${toolData.tool_id}&toolName=${encodeURIComponent(toolData.tool_name)}&toolUrl=${encodeURIComponent(toolData.tool_url)}&toolDescription=${encodeURIComponent(toolData.tool_description || '')}&cloudAccessMode=${toolData.metadata?.cloud_access_mode || 'direct'}&cloudPathPrefix=${toolData.metadata?.cloud_path_prefix || ''}`;

  return (
    <Link
      href={href}
      className="w-full h-full relative block cursor-pointer"
    >
      {/* ==================== DARK MODE CARD ==================== */}
      <div className="hidden dark:flex flex-col w-full h-full bg-gradient-to-b from-[#131622] via-[#0E1018] to-[#0A0C13] border border-zinc-800/80 hover:border-emerald-500/50 rounded-2xl overflow-hidden transition-all duration-300 shadow-lg group relative">
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-20" />

        {/* Image Container */}
        <div className="relative w-full aspect-[16/10] overflow-hidden bg-[#141622] flex items-center justify-center p-2 border-b border-white/[0.04]">
          <img
            src={checkIfImageUrl(toolData?.tool_image) ? toolData?.tool_image : "/images/default_image.png"}
            alt={toolData?.tool_name}
            className="w-full h-full object-contain rounded-xl group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-2.5 start-2.5 z-10">
            {isFree ? (
              <span className="bg-emerald-500/25 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md flex items-center gap-1 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {t("dashboard.free")}
              </span>
            ) : (
              <span className="bg-amber-500/25 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md flex items-center gap-1 shadow-sm">
                {t("dashboard.pro")}
              </span>
            )}
          </div>
          <div className="absolute top-2.5 end-2.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm bg-blue-500/20 text-blue-300 border border-blue-500/30 backdrop-blur-md">
            <Cloud size={11} />
            <span>سحابي</span>
          </div>
        </div>

        {/* Card Info */}
        <div className="flex flex-col justify-between flex-1 p-3.5">
          <div>
            <h3 className="text-white font-bold text-sm group-hover:text-emerald-400 transition-colors truncate mb-1">
              {toolData?.tool_name}
            </h3>
            <div className="flex items-center gap-1.5 text-zinc-400 text-xs mt-1">
              <Clock size={12} className="text-zinc-500 shrink-0" />
              <span className="text-[11px] truncate">
                {content ? content : <>ينتهي: {fullDateTimeFormat(endedAt)}</>}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-zinc-800/80">
            <div className="w-full py-2 px-3 rounded-xl bg-[#00c48c] hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all duration-200 group-hover:shadow-[0_4px_12px_rgba(0,196,140,0.3)]">
              <span>فتح الأداة السحابية</span>
              <ExternalLink size={13} />
            </div>
          </div>
        </div>
      </div>

      {/* ==================== LIGHT MODE CARD ==================== */}
      <div className="dark:hidden flex flex-col h-full bg-[linear-gradient(180deg,_#00c48c,_#4f008c)] w-full mx-auto gradient-border-3 relative rounded-[21px] cursor-pointer bg-[#190237] shadow-xl duration-500 hover:scale-[1.03] hover:shadow-xl">
        <div className="h-[200px] flex justify-center items-center relative">
          <img
            src={
              checkIfImageUrl(toolData?.tool_image)
                ? toolData?.tool_image
                : "/images/default_image.png"
            }
            alt="Product"
            className="h-full w-full object-cover rounded-[24px]"
          />
          <div
            className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold shadow ${
              isFree ? "bg-[#00c48c]/90 text-black" : "bg-[#ff7702]/90 text-white"
            }`}
          >
            {isFree ? t("dashboard.free") : t("dashboard.pro")}
          </div>
          {/* Cloud Tool Badge */}
          <div className="absolute top-2 right-2 bg-[#00c48c] text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
            <ExternalLink className="w-3 h-3 mr-1" />
            Cloud
          </div>
        </div>

        <div className="px-4 -mt-6 h-[100px] rounded-b-3xl shadow-t-xl py-3 w-full bg-[linear-gradient(180deg,_#00c48c,_#4f008c,_#190237)] mt-auto flex flex-col justify-between">
          <p className="text-lg font-bold text-white truncate block capitalize">
            {toolData?.tool_name}
          </p>
          <span className="text-white mr-3 text-sm break-words">
            {content ? content : <>Ended at : {fullDateTimeFormat(endedAt)}</>}
          </span>
          <div className="mt-2 text-[#00c48c] text-xs font-semibold">
            🌐 No Extension Required
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CloudLaunchCard;

