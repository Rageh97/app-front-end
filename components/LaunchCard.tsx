import { FunctionComponent } from "react";
import { NewToolsDto } from "@/types/tools/new-tools-dto";
import { fullDateTimeFormat } from "@/utils/timeFormatting";
import { checkIfImageUrl } from "@/utils/imageValidator";
import Link from "next/link";
import { useTranslation } from "react-i18next";

interface LaunchCardProps {
  onClick: Function;
  toolData: NewToolsDto;
  endedAt: string;
  activeApp: number;
  isLoaded: boolean;
  content?: string;
  buttonId?: string;
}

const LaunchCard: FunctionComponent<LaunchCardProps> = ({
  toolData,
  endedAt,
  onClick,
  activeApp,
  isLoaded,
  content,
  buttonId,
}) => {
  // Check if this is a cloud tool
  const isCloudTool = toolData?.tool_mode === "cloud";
  const { t } = useTranslation();
  const isFree = !!toolData?.isFree;
  const isStable = toolData?.isStable !== false;

  const maintenanceOverlay = !isStable && (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-md transition-all duration-500 rounded-[21px] pointer-events-none">
      <div className="flex flex-col items-center gap-2 transform -rotate-12">
        <div className="text-white px-6 py-2 text-xl">{toolData?.tool_name}</div>
        <div className="bg-[#ff7702] text-white px-6 py-2 rounded-full font-black text-xl shadow-[0_0_20px_rgba(255,119,2,0.6)] animate-pulse">
          {t("dashboard.maintenance")}
        </div>
        <p className="text-white/80 text-sm font-bold uppercase tracking-widest">
          {t("dashboard.stableSoon")}
        </p>
      </div>
    </div>
  );

  // If it's a cloud tool, render as a link to the cloud tool page
  if (isCloudTool) {
    return (
      <Link
        href={isStable ? `/cloud-tool?toolId=${toolData.tool_id}&toolName=${encodeURIComponent(toolData.tool_name)}&toolUrl=${encodeURIComponent(toolData.tool_url)}&toolDescription=${encodeURIComponent(content || "")}&toolImage=${encodeURIComponent(toolData.tool_image || "")}` : "#"}
        onClick={(e) => !isStable && e.preventDefault()}
        className={`flex flex-col h-full bg-[linear-gradient(180deg,_#00c48c,_#4f008c)] w-full mx-auto gradient-border-3 rounded-[21px] bg-[#190237] shadow-xl duration-500 relative overflow-hidden ${
          isStable ? "cursor-pointer hover:scale-[1.03] hover:shadow-xl" : "cursor-not-allowed"
        }`}
      >
        {maintenanceOverlay}
        <div className={`h-full flex flex-col ${!isStable ? "filter blur-[2px] grayscale-[0.5]" : ""}`}>
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
                isFree
                  ? "bg-[#00c48c]/90 text-black"
                  : "bg-[#ff7702]/90 text-white"
              }`}
            >
              {isFree ? t("dashboard.free") : t("dashboard.pro")}
            </div>
          </div>

          <div className="px-4 -mt-6 h-full rounded-b-3xl shadow-t-xl py-3 w-full bg-[linear-gradient(180deg,_#00c48c,_#4f008c,_#190237)]">
            <p className="text-lg mt-3 font-bold text-white truncate block capitalize">
              {toolData?.tool_name}
            </p>
            <span className="text-white mr-3 text-sm break-words">
              {content ? content : <>Ended at : {fullDateTimeFormat(endedAt)}</>}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  // Regular tool (needs extension)
  return (
    <button
      type="button"
      id={buttonId}
      onClick={() => {
        if (isStable) onClick();
      }}
      className={`flex mt-5 h-full flex-col bg-[linear-gradient(180deg,_#00c48c,_#4f008c)] w-full mx-auto gradient-border-3 rounded-[21px] bg-[#190237] shadow-xl duration-500 relative overflow-hidden text-start ${
        isStable ? "cursor-pointer hover:scale-[1.03] hover:shadow-xl" : "cursor-not-allowed"
      }`}
    >
      {maintenanceOverlay}
      <div className={`h-full flex flex-col w-full pointer-events-none ${!isStable ? "filter blur-[2px] grayscale-[0.5]" : ""}`}>
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
              isFree
                ? "bg-[#00c48c]/90 text-black"
                : "bg-[#ff7702]/90 text-white"
            }`}
          >
            {isFree ? t("dashboard.free") : t("dashboard.pro")}
          </div>
        </div>

        <div className="px-4 -mt-3 h-full rounded-b-3xl shadow-t-xl py-3 w-full bg-[linear-gradient(180deg,_#00c48c,_#4f008c,_#190237)] mt-auto flex flex-col justify-between">
          <p className="text-lg font-bold text-white truncate block capitalize">
            {toolData?.tool_name}
          </p>
          <span className="text-white mr-3 text-sm break-words">
            {content ? content : <>Ended at : {fullDateTimeFormat(endedAt)}</>}
          </span>
        </div>
      </div>
      {activeApp === toolData?.tool_id && isLoaded === null && (
        <div className="absolute bottom-[13px] right-[13px] inline-block h-[1.1rem] w-[1.1rem] animate-spin rounded-full border-[3px] border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] pointer-events-none"></div>
      )}

      {activeApp === toolData?.tool_id && isLoaded === true && (
        <img
          src="/images/green-check.png"
          className="max-w-[25px] absolute bottom-[10px] right-[10px] pointer-events-none"
        />
      )}
      {activeApp === toolData?.tool_id && isLoaded === false && (
        <img
          src="/images/red-reload.png"
          className="max-w-[22px] absolute bottom-[10px] right-[10px] pointer-events-none"
        />
      )}
    </button>
  );
};

export default LaunchCard;
