import { FunctionComponent, useState } from "react";
import LoadingButton from "./LoadingButton";
import { CircleCheckBig, CircleX, ShoppingCart, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PackCardProps {
  onClick: Function;
  title: string;
  packTitle: string;
  packPrice: number;
  packData: any;
  toolsData: any;
  period: 'month' | 'year';
  discountPercentage?: number;
}

const PackCard: FunctionComponent<PackCardProps> = ({
  title,
  packTitle,
  packPrice,
  packData,
  toolsData,
  period,
  onClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Get discount from packData
  const discountPercentage = packData.discount_percentage || 0;
  const originalPrice = packPrice;
  const discountedPrice = discountPercentage > 0 
    ? Math.round(originalPrice * (1 - discountPercentage / 100) * 100) / 100
    : originalPrice;

  function getToolNameById(toolId) {
    const tool = toolsData.find(t => t.tool_id === toolId);
    return tool ? tool.tool_name : false;
  }
  
  const {t} = useTranslation();
  return (
    <div className="relative">
      <div className="absolute w-25 h-25 z-0 top-25 left-1/2 -translate-x-1/2 rounded-full bg-[linear-gradient(130deg,_#ff7702,_#ffffff,_#00c48c)] opacity-100 blur-2xl "></div>
    <div className="w-[280px] overflow-visible relative z-10 mt-30 h-min font-extrabold text-black pb-1 px-3 bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)] border-[#ff7702] border-[2px] rounded-[40px] shadow-2xl">
     {/* <img className="absolute w-70 h-22 z-10 -top-40 left-1/2 -translate-x-1/2" src="/images/shadow-light.png" alt="" /> */}
      <div style={{clipPath: "polygon(25% 0%, 70% 0%, 90% 100%, 5% 100%"}} className={`absolute bg-[#ff7702] py-1 px-7 top-4 -left-8 -rotate-45 rounded-sm text-xs ${discountPercentage > 0 ? '' : 'hidden'}`}>Discount {discountPercentage}%</div>
      {packData.pack_name.trim().toUpperCase() === "AI PLAN" && <img className="absolute w-40 z-20 -top-36 left-1/2 -translate-x-1/2" src="/images/plus (2).png" alt="AI Plan" />}
    {packData.pack_name.trim().toUpperCase() === "DESIGNERS PLAN" && <img className="absolute w-40 z-20 -top-36 left-1/2 -translate-x-1/2" src="/images/pro.png" alt="Designers Plan" />}
    {packData.pack_name.trim().toUpperCase() === "ALL IN ONE PLAN" && <img className="absolute w-40 z-20 -top-36 left-1/2 -translate-x-1/2" src="/images/vip.png" alt="All in One Plan" />}
     
      {/* <img className="absolute w-40 z-20 -top-28 left-1/2 -translate-x-1/2" src="/images/crown.png" alt="" /> */}
      <p className="text-[21px] py-6 text-white text-center">{title}</p>
      <div className="flex pb-3 pt-4">
        <div className="text-[20px] text-white text-center">
         <span className="bg-gradient-to-r from-[#FF0000] via-[#FFFFFF] to-[#000000] bg-clip-text text-transparent font-bold">IQD </span>{Number(discountedPrice).toLocaleString('en-US')}
          {discountPercentage > 0 && (
            <span className="text-[15px] text-[#ACADB1] line-through ml-2">IQD{Number(originalPrice).toLocaleString('en-US')}</span>
          )}
        </div>
        <div className=" flex flex-col justify-between">
          <div></div>
          <p className="text-[18px] px-1 font-bold text-[#00c48c]">/ {period === 'month' ? t("packs.month") : t("packs.year")}</p>
        </div>
      </div>
      {/* <p className="text-[17px] pb-[4px] pt-[20px] font-semibold text-[#6E6F77]">
        {packTitle}
      </p> */}

<div className="relative overflow-visible z-10 bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)] p-4 pb-20 rounded-[28px] gradient-border-2">
        {/* Wrapper div for height control and transition */}
        <div className={`transition-all duration-300 ease-in-out ${!isExpanded ? 'h-60 overflow-hidden' : 'h-auto'}`}>
          {/* Credit Plan Section */}
          {(() => {
            const monthlyCreditPlan = packData.monthlyCreditPlan;
            const yearlyCreditPlan = packData.yearlyCreditPlan;
            const generalCreditPlan = packData.creditPlan;
            
            let selectedCreditPlan = null;
            let planLabel = "";
            
            if (period === 'month' && monthlyCreditPlan) {
              selectedCreditPlan = monthlyCreditPlan;
              planLabel = t("packs.creditPlan");
            } else if (period === 'year' && yearlyCreditPlan) {
              selectedCreditPlan = yearlyCreditPlan;
              planLabel =  t("packs.creditPlan");
            } else if (generalCreditPlan) {
              selectedCreditPlan = generalCreditPlan;
              planLabel = t("packs.creditPlan");
            }
            
            // NEW: Check for direct pack credits
            const packCredits = period === 'year' ? packData.yearly_credits : packData.monthly_credits;
            
            return (
              <>
              {packCredits > 0 && (
                <div className="pb-3 mb-3 border-b border-[#ff7702]/30">
                  <p className="text-[#00c48c] text-sm font-bold mb-2">{t('credits.credits') || "Credits"}:</p>
                  <div className="bg-[#190237]/60 rounded-lg p-2">
                    <div className="flex items-center justify-between">
                       <span className="text-[#ff7702] text-sm font-semibold">{t('chat.aiCredits') || "AI Credits"}</span>
                       <span className="text-white text-xs">
                        {packCredits} {t('credits.credits')} / {period === 'year' ? t("packs.year") : t("packs.month")}
                       </span>
                    </div>
                  </div>
                </div>
              )}
              
              {selectedCreditPlan ? (
              <div className="pb-3 mb-3 border-b border-[#ff7702]/30">
                <p className="text-[#00c48c] text-sm font-bold mb-2">{planLabel}:</p>
                <div className="bg-[#190237]/60 rounded-lg p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[#ff7702] text-sm font-semibold">{selectedCreditPlan.plan_name}</span>
                    <span className="text-white text-xs">
                      {selectedCreditPlan.credits_per_period} {t('credits.credits')} / {selectedCreditPlan.period}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
            </>
            );
          })()}

          <div className="pb-2">
            <p className="text-[#00c48c] text-sm font-bold mb-2"> {t("packs.included")}:</p>
            
            <div className="flex items-center mb-1">
                <CircleCheckBig strokeWidth={3} size={20} color={"#00c48c"} />
                <p className="px-2 text-[14px] font-semibold text-[#ACADB1]">
                  {period === 'month' ? packData.media_downloads_limit : (packData.media_downloads_limit_yearly || 100)} {period === 'month' ? "Monthly" : "Yearly"} Media Downloads
                </p>
            </div>

            <div className="flex items-center mb-1">
                <CircleCheckBig strokeWidth={3} size={20} color={"#00c48c"} />
                <p className="px-2 text-[14px] font-semibold text-[#ACADB1]">
                  {period === 'month' ? packData.font_downloads_limit : (packData.font_downloads_limit_yearly || 0)} {period === 'month' ? "Monthly" : "Yearly"} Font Downloads
                </p>
            </div>

            {(() => {
              const packToolIds = JSON.parse(packData.pack_tools || '[]');
              const toolsByName = new Map<string, any[]>();
              
              toolsData?.forEach((tool: any) => {
                const name = tool.tool_name.trim();
                if (!toolsByName.has(name)) toolsByName.set(name, []);
                toolsByName.get(name)!.push(tool);
              });

              return Array.from(toolsByName.entries()).map(([name, tools], idx) => {
                const isIncluded = tools.some(t => packToolIds.includes(t.tool_id));
                
                if (isIncluded) {
                  return (
                    <div className="flex items-center" key={`inc-${idx}`}>
                      <CircleCheckBig strokeWidth={3} size={20} color={"#00c48c"} />
                      <p className="px-2 text-[14px] font-semibold text-[#ACADB1]">
                        {name}
                      </p>
                    </div>
                  );
                }
                return null;
              });
            })()}
          </div>

          <div>
            {(() => {
              const packToolIds = JSON.parse(packData.pack_tools || '[]');
              const toolsByName = new Map<string, any[]>();
              
              toolsData?.forEach((tool: any) => {
                const name = tool.tool_name.trim();
                if (!toolsByName.has(name)) toolsByName.set(name, []);
                toolsByName.get(name)!.push(tool);
              });

              return Array.from(toolsByName.entries()).map(([name, tools], idx) => {
                const isIncluded = tools.some(t => packToolIds.includes(t.tool_id));
                
                if (!isIncluded) {
                  return (
                    <div className="flex items-center" key={`exc-${idx}`}>
                      <CircleX strokeWidth={3} size={20} color={"#ff7702"} />
                      <p className="px-2 text-[14px] font-semibold text-[#ACADB1]">
                        {name}
                      </p>
                    </div>
                  );
                }
                return null;
              });
            })()}
          </div>
        </div>

        {/* Read More/Read Less Button */}
        <div className="flex  justify-center mt-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center bg-[#35214f] gradient-border-Qs inner-shadow gap-2  text-[#00c48c] rounded-lg p-1 hover:text-[#00a070] transition-colors duration-200 text-sm font-semibold"
          >
            {isExpanded ? (
              <>
                <ChevronUp size={16} />
                Read Less
              </>
            ) : (
              <>
                <ChevronDown size={16} />
                Read More
              </>
            )}
          </button>
        </div>
      <LoadingButton
      
        onClick={() => {
          onClick();
        }}
         className="absolute flex items-center justify-center w-50 bottom-0 right-5 bg-[linear-gradient(135deg,_#4f008c,_#190237,_#190237)] skew-x-[-50deg] rounded-[15px] gradient-border-packet text-white">
       <p className="skew-x-[50deg] px-2 py-3"> <span className="text-[#00c48c] mx-2">{t("packs.buyNow")}</span><span className="bg-gradient-to-r from-[#FF0000] via-[#FFFFFF] to-[#000000] bg-clip-text text-transparent font-bold">IQD</span>{Number(discountedPrice).toLocaleString('en-US')}</p>
    
      </LoadingButton>
 </div>


      {/* <div className="pt-5">
      </div>
      <LoadingButton
        className={{ backgroundColor: "white", borderRadius: "12px", color: "#8E9094", fontSize: "15px", fontWeight: "bold" }}
        title="Choose Plan"
        onClick={() => {
          onClick();
        }}
      ></LoadingButton> */}
          <div dir="ltr" className=" flex items-center justify-end">
          <ShoppingCart  strokeWidth={3} className="-rotate-45" size={28} color={"#ffffff"}/>
          </div>
    </div>
   {/* <div className="absolute -bottom-13 w-30 h-5 left-1/2 -translate-x-1/2 rounded-full bg-black/50  blur-lg">

   </div> */}
    </div>
  );
};

export default PackCard;
