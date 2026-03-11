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
      className={`w-full h-full mb-5 cursor-pointer bg-[linear-gradient(180deg,_#00c48c,_#4f008c)] border-2 border-[#ff7702] shadow-xl rounded-[20px] duration-500 hover:scale-[1.03] hover:shadow-xl relative overflow-hidden ${
        !isStable ? "cursor-not-allowed" : ""
      }`}
    >
      {/* Maintenance Overlay */}
      {!isStable && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-md transition-all duration-500">
           <div className="flex flex-col items-center gap-2 transform -rotate-12">
             <div className=" text-white px-6 py-2  text-xl ">
               {toolData?.tool_name}
             </div>
             <div className="bg-[#ff7702] text-white px-6 py-2 rounded-full font-black text-xl shadow-[0_0_20px_rgba(255,119,2,0.6)] animate-pulse">
               {t("dashboard.maintenance")}
             </div>
             <p className="text-white/80 text-sm font-bold uppercase tracking-widest">{t("dashboard.stableSoon")}</p>
           </div>
        </div>
      )}

      <div className={`flex flex-col h-full w-full ${!isStable ? "filter blur-[2px] grayscale-[0.5]" : ""}`}>
        <div className="h-[230px]  flex justify-center items-center relative">
          <img
            src={
              checkIfImageUrl(toolData?.tool_image)
                ? toolData?.tool_image
                : "/images/default_image.png"
            }
            alt="Product"
            className="h-full w-full  rounded-[18px]"
          />
          {/* Diagonal Corner Ribbon */}
          <div className="absolute top-0 left-0 w-32 h-32 overflow-hidden rounded-tl-[18px] z-20 pointer-events-none">
            <div
              className={`absolute -top-1 -left-9 pr-7 w-[150px] py-1.5 rotate-[-45deg]  shadow-[0_5px_15px_rgba(0,0,0,0.3)] border-y border-white/20 backdrop-blur-md transition-all duration-500 group-hover:scale-110 ${
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
          <img src="/images/icon.png.png" alt="Sub Logo" className="w-full h-full object-contain" />
          </div>
          <div className="pb-3 pt-6 flex flex-col justify-between  h-[150px]  bg-[linear-gradient(180deg,_#00c48c,_#4f008c,_#190237)] absolute w-[97%] top-[-25px] rounded-[14px]  shadow-[0_-7px_15px_rgba(0,0,0,0.4)]">
            <p className="px-4 text-xl  font-bold text-white text-center truncate block capitalize">
              {toolData?.tool_name}
            </p>
            <div className="px-4 text-gray-400 mr-3 text-xs  text-white break-words">
              {toolData?.tool_content}
            </div>
            <div className="px-2 flex items-center gap-5 justify-center w-full ">
              {/* <div className="w-full flex bg-[#ff7702] items-center justify-center gap-2 border border-[#00c48c] bg-inherit text-white rounded-md px-2 py-2 font-bold text-md">
                {t("dashboard.information")}
              </div> */}
              <div className="w-full   flex gap-1 items-center justify-center gradient-border-3 bg-inherit text-[#00c48c] rounded-md px-2 py-2 font-bold text-xs">
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
