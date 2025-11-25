import { FunctionComponent } from "react";
import { NewToolsDto } from "@/types/tools/new-tools-dto";
import { fullDateTimeFormat } from "@/utils/timeFormatting";
import { checkIfImageUrl } from "@/utils/imageValidator";
import Link from "next/link";

interface LaunchCardProps {
  onClick: Function;
  toolData: NewToolsDto;
  endedAt: string;
  activeApp: number;
  isLoaded: boolean;
  content?: string;
}

const LaunchCard: FunctionComponent<LaunchCardProps> = ({
  toolData,
  endedAt,
  onClick,
  activeApp,
  isLoaded,
  content,
}) => {
  // Check if this is a cloud tool
  const isCloudTool = toolData?.tool_mode === "cloud";


  // If it's a cloud tool, render as a link to the cloud tool page
  if (isCloudTool) {
    return (
      <Link
        href={`/cloud-tool?toolId=${toolData.tool_id}&toolName=${encodeURIComponent(toolData.tool_name)}&toolUrl=${encodeURIComponent(toolData.tool_url)}&toolDescription=${encodeURIComponent(content || '')}&toolImage=${encodeURIComponent(toolData.tool_image || '')}`}
        className="flex flex-col bg-[linear-gradient(180deg,_#00c48c,_#4f008c)] w-[330px] gradient-border-3 relative rounded-[21px] cursor-pointer bg-[#190237] shadow-xl duration-500 hover:scale-105 hover:shadow-xl"
      >
        <div className="h-[200px]  flex justify-center items-center ">
          <img
            src={
              checkIfImageUrl(toolData?.tool_image)
                ? toolData?.tool_image
                : "/images/default_image.png"
            }
            alt="Product"
            className="h-full w-full object-cover rounded-[24px]"
          />
        </div>

        <div className="px-4 -mt-6 h-[100px] rounded-b-3xl shadow-t-xl py-3 w-full bg-[linear-gradient(180deg,_#00c48c,_#4f008c,_#190237)]">
          <p className="text-lg font-bold text-white truncate block capitalize">
            {toolData?.tool_name}
          </p>
          <span className="text-white mr-3 text-sm break-words">
            {content ? content : <>Ended at : {fullDateTimeFormat(endedAt)}</>}
          </span>
       
        </div>
      </Link>
    );
  }

  // Regular tool (needs extension)
  return (
    <div
      onClick={() => {
        onClick();
      }}
      className="flex flex-col bg-[linear-gradient(180deg,_#00c48c,_#4f008c)] w-[330px] gradient-border-3 relative rounded-[21px] cursor-pointer bg-[#190237] shadow-xl duration-500 hover:scale-105 hover:shadow-xl"
    >
      <div className="h-[200px]  flex justify-center items-center ">
        <img
          src={
            checkIfImageUrl(toolData?.tool_image)
              ? toolData?.tool_image
              : "/images/default_image.png"
          }
          alt="Product"
          className="h-full w-full object-cover rounded-[24px]"
        />
      </div>

      <div className="px-4 -mt-6 h-[100px] rounded-b-3xl shadow-t-xl py-3 w-full bg-[linear-gradient(180deg,_#00c48c,_#4f008c,_#190237)]">
        <p className="text-lg font-bold text-white truncate block capitalize">
          {toolData?.tool_name}
        </p>
        <span className="text-white mr-3 text-sm break-words">
          {content ? content : <>Ended at : {fullDateTimeFormat(endedAt)}</>}
        </span>
      </div>
      {activeApp === toolData?.tool_id && isLoaded === null && (
        <div className="absolute bottom-[13px] right-[13px] inline-block h-[1.1rem] w-[1.1rem] animate-spin rounded-full border-[3px] border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
      )}

      {activeApp === toolData?.tool_id && isLoaded === true && (
        <img
          src="/images/green-check.png"
          className="max-w-[25px] absolute bottom-[10px] right-[10px]"
        />
      )}
      {activeApp === toolData?.tool_id && isLoaded === false && (
        <img
          src="/images/red-reload.png"
          className="max-w-[22px] absolute bottom-[10px] right-[10px]"
        />
      )}
    </div>
  );
};

export default LaunchCard;
