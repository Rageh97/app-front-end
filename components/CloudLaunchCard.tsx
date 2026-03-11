import { FunctionComponent } from "react";
import { NewToolsDto } from "@/types/tools/new-tools-dto";
import { fullDateTimeFormat } from "@/utils/timeFormatting";
import { checkIfImageUrl } from "@/utils/imageValidator";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
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
  return (
    <Link
      href={`/cloud-tool?toolId=${toolData.tool_id}&toolName=${encodeURIComponent(toolData.tool_name)}&toolUrl=${encodeURIComponent(toolData.tool_url)}&toolDescription=${encodeURIComponent(toolData.tool_description || '')}`}
      className="flex flex-col h-full bg-[linear-gradient(180deg,_#00c48c,_#4f008c)] w-full mx-auto gradient-border-3 relative rounded-[21px] cursor-pointer bg-[#190237] shadow-xl duration-500 hover:scale-[1.03] hover:shadow-xl"
    >
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
    </Link>
  );
};

export default CloudLaunchCard;

