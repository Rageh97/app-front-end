import { FunctionComponent, useEffect, useState } from "react";
import { NewToolsDto } from "@/types/tools/new-tools-dto";
import { checkIfImageUrl } from "@/utils/imageValidator";
import { ShoppingCart } from "lucide-react";

interface CardItemProps {
  onClick: Function;
  toolData: NewToolsDto;
}

const CardItem: FunctionComponent<CardItemProps> = ({ toolData, onClick }) => {
  const [subLogoUrl, setSubLogoUrl] = useState<string | null>(null);
  const staticLogoPath = "/images/nexus-logo-22.png"; // Define static path

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
        onClick();
      }}
      className="w-96 mb-5 cursor-pointer bg-[linear-gradient(180deg,_#00c48c,_#4f008c)] border-2 border-[#ff7702] shadow-xl rounded-[20px] duration-500 hover:scale-95 hover:shadow-xl"
    >
      <div className="h-[230px]  flex justify-center items-center">
        <img
          src={
            checkIfImageUrl(toolData?.tool_image)
              ? toolData?.tool_image
              : "/images/default_image.png"
          }
          alt="Product"
          className="h-full w-full  rounded-[18px]"
        />
      </div>

      <div className="w-full relative flex justify-center h-[125px]">
        <div className="absolute flex items-center justify-center gradient-border-3 text-3xl font-bold bottom-15 z-1 w-15 h-15 bg-[linear-gradient(180deg,_#00c48c,_#4f008c,_#190237)] rounded-full text-black">
          {subLogoUrl ? (
            <img 
              src={subLogoUrl} 
              alt="Sub Logo" 
              className="w-full h-full object-contain"
            />
          ) : (
            9
          )}
        </div>
        <div className="pb-3 pt-6 flex flex-col justify-between  h-[150px]  bg-[linear-gradient(180deg,_#00c48c,_#4f008c,_#190237)] absolute w-[97%] top-[-25px] rounded-[14px]  shadow-[0_-7px_15px_rgba(0,0,0,0.4)]">
          <p className="px-4 text-xl  font-bold text-white text-center truncate block capitalize">
            {toolData?.tool_name}
          </p>
          <div className="px-4 text-gray-400 mr-3 text-xs  text-white break-words">
            {toolData?.tool_content}
          </div>
          <div className="px-2 flex items-center gap-5 justify-center w-full ">
            <div className="w-50 flex bg-[#ff7702] items-center justify-center gap-2 border border-[#00c48c] bg-inherit text-white rounded-md px-2 py-2 font-bold text-md">
              INFORMATION
            </div>
            <div className="w-50   flex gap-1.5 items-center justify-center gradient-border-3 bg-inherit text-[#00c48c] rounded-md px-2 py-2 font-bold text-md">
              Buy
              <p className="text-white">${toolData?.tool_month_price}</p>
              <del>
                <p className="text-[#ff7702]">
                  ${toolData?.tool_none_price_month}
                </p>
              </del>
              <ShoppingCart size={18} color="#ffffff" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardItem;
