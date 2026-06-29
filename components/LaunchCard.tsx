import { FunctionComponent, useState, useEffect } from "react";
import { NewToolsDto } from "@/types/tools/new-tools-dto";
import { fullDateTimeFormat } from "@/utils/timeFormatting";
import { checkIfImageUrl } from "@/utils/imageValidator";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { 
  Users, 
  CalendarDays, 
  Cloud, 
  AlertCircle, 
  Clock, 
  Download, 
  RefreshCw, 
  ChevronRight, 
  Lock, 
  ExternalLink 
} from "lucide-react";
import { BorderBeam } from "@/components/ui/border-beam";
import { useMyInfo } from "@/utils/user-info/getUserInfo";

function CountdownTimer({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const targetDate = new Date(endDate).getTime();
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(interval);
        setIsExpired(true);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [endDate]);

  if (isExpired) {
    return (
      <div className="bg-rose-500/10 text-rose-500 border border-rose-500/20 px-4 py-3 rounded-xl text-center font-bold text-sm">
        الاشتراك منتهي
      </div>
    );
  }

  const TimeBox = ({ value, label }: { value: number, label: string }) => (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-11 h-14 md:w-14 md:h-16 bg-[#161033] border border-[#2a2054] rounded-lg flex items-center justify-center overflow-hidden shadow-lg">
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[#0a0616] z-10 w-full" />
        <div className="absolute top-1/2 left-0 w-1 h-1 md:w-1.5 md:h-2 rounded-r-full bg-[#0a0616] -translate-y-1/2 z-10" />
        <div className="absolute top-1/2 right-0 w-1 h-1 md:w-1.5 md:h-2 rounded-l-full bg-[#0a0616] -translate-y-1/2 z-10" />
        
        <div className="absolute top-0 left-0 right-0 bottom-1/2 bg-gradient-to-b from-white/[0.04] to-transparent" />
        
        <span className="font-mono font-black text-2xl md:text-3xl text-white relative z-0">{value.toString().padStart(2, '0')}</span>
      </div>
      <span className="text-[#a89fdf] text-[9px] md:text-xs font-bold">{label}</span>
    </div>
  );

  return (
    <div className="flex gap-2 md:gap-3 justify-center items-start" dir="ltr">
      <TimeBox value={timeLeft.days} label="يوم" />
      <div className="text-[#a89fdf] font-black text-xl md:text-2xl pt-4 md:pt-6">:</div>
      <TimeBox value={timeLeft.hours} label="ساعة" />
      <div className="text-[#a89fdf] font-black text-xl md:text-2xl pt-4 md:pt-6">:</div>
      <TimeBox value={timeLeft.minutes} label="دقيقة" />
      <div className="text-[#a89fdf] font-black text-xl md:text-2xl pt-4 md:pt-6">:</div>
      <TimeBox value={timeLeft.seconds} label="ثانية" />
    </div>
  );
}

function ResetTimer() {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0); // Next midnight
      const diffMs = midnight.getTime() - now.getTime();

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft({ hours, minutes });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <span dir="ltr">{timeLeft.hours.toString().padStart(2, '0')}h {timeLeft.minutes.toString().padStart(2, '0')}m</span>
  );
}

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
  const { data: myInfoData } = useMyInfo();
  const countToday = myInfoData?.downloadCounts?.[toolData.tool_id] || 0;

  // Check if this is a cloud tool
  const isCloudTool = toolData?.tool_mode === "cloud";
  const { t } = useTranslation();
  const isFree = !!toolData?.isFree;
  const isStable = toolData?.isStable !== false;
  const isMultiAccount = !!(toolData as any)?._multiAccount;
  const accountCount = (toolData as any)?._accountCount || 1;

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
        href={isStable ? `/cloud-tool?toolId=${toolData.tool_id}&toolName=${encodeURIComponent(toolData.tool_name)}&toolUrl=${encodeURIComponent(toolData.tool_url)}&toolDescription=${encodeURIComponent(content || "")}&toolImage=${encodeURIComponent(toolData.tool_image || "")}&cloudAccessMode=${toolData.metadata?.cloud_access_mode || 'direct'}&cloudPathPrefix=${toolData.metadata?.cloud_path_prefix || ''}&endedAt=${encodeURIComponent(endedAt)}` : "#"}
        onClick={(e) => !isStable && e.preventDefault()}
        className={`flex flex-col h-fit self-start bg-[linear-gradient(180deg,_#00c48c,_#4f008c)] w-full mx-auto gradient-border-3 rounded-[21px] bg-[#190237] shadow-xl duration-500 relative overflow-hidden ${
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
      className={`flex mt-5 h-fit self-start flex-col bg-[linear-gradient(180deg,_#00c48c,_#4f008c)] w-full mx-auto gradient-border-3 rounded-[21px] bg-[#190237] shadow-xl duration-500 relative overflow-hidden text-start ${
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
          {isMultiAccount && (
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold shadow bg-purple-600/90 text-white border border-purple-400/30 pointer-events-none">
              <Users size={12} />
              <span>{accountCount}</span>
            </div>
          )}
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
