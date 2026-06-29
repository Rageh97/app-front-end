"use client";
import { FunctionComponent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from 'react-i18next';
import { 
  ExternalLink, 
  ArrowLeft, 
  FastForward, 
  ChevronsLeft, 
  ChevronsRight, 
  Loader2,
  CalendarDays,
  Cloud,
  AlertCircle,
  Clock,
  Download,
  RefreshCw,
  ChevronRight,
  Lock
} from "lucide-react";
import Link from "next/link";
import ReviewModal from "@/components/Modals/ReviewModal";
import api from "@/utils/api";
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

interface CloudToolData {
  id: string;
  url: string;
  toolName: string;
  toolDescription: string;
  imageUrl?: string;
  cloudAccessMode?: string;
  cloudPathPrefix?: string;
  endedAt?: string;
}

const CloudToolPage: FunctionComponent = () => {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [toolData, setToolData] = useState<CloudToolData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openReviewModal, setOpenReviewModal] = useState<boolean>(false);
  const [launching, setLaunching] = useState(false);

  const { data: myInfoData } = useMyInfo();
  const currentTool = myInfoData?.toolsData?.find((t: any) => t.tool_id === Number(toolData?.id));
  const limit = Number(currentTool?.metadata?.cloud_daily_download_limit || 0);
  const countToday = myInfoData?.downloadCounts?.[Number(toolData?.id)] || 0;
  const remaining = Math.max(0, limit - countToday);

  useEffect(() => {
    const toolId = searchParams.get('toolId');
    const toolName = searchParams.get('toolName');
    const toolUrl = searchParams.get('toolUrl');
    const toolDescription = searchParams.get('toolDescription');
    const toolImageUrl = searchParams.get('toolImage');
    const cloudAccessMode = searchParams.get('cloudAccessMode') || 'direct';
    const cloudPathPrefix = searchParams.get('cloudPathPrefix') || '';
    const endedAtParam = searchParams.get('endedAt');
    const endedAt = endedAtParam && endedAtParam !== "undefined" && endedAtParam !== "null" ? endedAtParam : '';

    if (toolId && toolName && toolUrl) {
      setToolData({
        id: toolId,
        url: toolUrl,
        toolName: toolName,
        toolDescription: toolDescription || '',
        imageUrl: toolImageUrl || undefined,
        cloudAccessMode: cloudAccessMode,
        cloudPathPrefix: cloudPathPrefix,
        endedAt: endedAt
      });
      setLoading(false);
    } else {
      setError('Missing tool information');
      setLoading(false);
    }
  }, [searchParams]);

  const openCloudTool = async () => {
    if (!toolData) return;
    
    if (toolData.cloudAccessMode === "direct") {
      window.open(toolData.url, '_blank');
      return;
    }

    setLaunching(true);
    try {
      const response = await api.post("/api/proxy/token", {
        tool_id: Number(toolData.id)
      });
      
      if (response.data?.success && response.data?.data?.token) {
        const token = response.data.data.token;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.nexustoolz.com';
        // Extract base domain from API URL (e.g. from https://api.nexustoolz.com to https://tools.nexustoolz.com)
        let proxyBaseUrl = 'https://tools.nexustoolz.com';
        try {
          const urlObj = new URL(apiUrl);
          if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
            proxyBaseUrl = `http://${urlObj.host}`;
          } else {
            // Replace api. with tools. or staging-api. with staging-tools.
            proxyBaseUrl = `${urlObj.protocol}//${urlObj.host.replace('api.', 'tools.')}`;
          }
        } catch (e) {
          console.error('Invalid API URL', e);
        }
        const proxyUrl = `${proxyBaseUrl}/api/proxy/${toolData.cloudPathPrefix}/?token=${token}`;
        window.open(proxyUrl, '_blank');
      } else {
        alert(response.data?.message || "Failed to generate access token.");
      }
    } catch (err: any) {
      console.error("Failed to launch cloud tool:", err);
      alert(err.response?.data?.message || err.message || "فشل الاتصال بالخادم السحابي");
    } finally {
      setLaunching(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#190237] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (error || !toolData) {
    return (
      <div className="min-h-screen bg-[#190237] flex items-center justify-center mt-10 rounded-[30px]">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">{error || 'Tool not found'}</div>
          <Link href="/subscriptions" className="text-[#00c48c] hover:underline">
            Return to Subscriptions
          </Link>
        </div>
      </div>
    );
  }

  const isExpired = toolData.endedAt ? new Date(toolData.endedAt).getTime() < Date.now() : false;

  return (
    <>
    <div className="min-h-screen items-center text-white mt-10 rounded-[30px] px-3">
      {/* Header */}
      <div className="max-w-4xl mx-auto bg-[#190237] border-b border-[#ff7702] p-4 rounded-[30px] mb-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/subscriptions" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
            <span>العودة للاشتراكات</span>
          </Link>
          <h1 className="text-xl md:text-4xl font-bold text-white text-center mb-0">
            {toolData.toolName}
          </h1>
          <div className="w-20 sm:w-28" /> {/* Spacer to center title */}
        </div>
      </div>

      {/* Main Content */}
      <div dir="ltr" className="max-w-6xl mx-auto p-6">
        {toolData.cloudAccessMode === "proxy" ? (
          <div className="w-full max-w-2xl mx-auto mb-8">
            <div 
              className="group relative bg-[#1b143c] border border-[#2e2361] hover:border-[#6938ff]/40 rounded-2xl p-6 transition-all duration-500 shadow-2xl overflow-hidden backdrop-blur-md text-right block w-full"
              style={{ direction: 'rtl' }}
            >
              {!isExpired && (
                <BorderBeam size={200} duration={6} borderWidth={1.5} colorFrom="#10b981" colorTo="#14b8a6" />
              )}

              {/* Badge Top Left */}
              <div className="absolute top-6 left-6 z-20">
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${
                  isExpired 
                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                    : 'bg-[#00e57b]/10 text-[#00e57b] border-[#00e57b]/20'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isExpired ? 'bg-rose-500' : 'bg-[#00e57b]'} ${!isExpired && 'animate-pulse'}`} />
                  {isExpired ? 'منتهي' : 'نشط'}
                </div>
              </div>

              <div className="relative z-10 flex flex-col h-full">
                {/* Top Section */}
                <div className="flex flex-col sm:flex-row items-center justify-between mb-6 pt-4 relative gap-6">
                  {/* Text (Right) */}
                  <div className="w-full sm:w-[60%] flex flex-col items-center sm:items-start pr-0 sm:pr-6 text-center sm:text-right">
                    <h3 className="text-2xl md:text-3xl font-black text-white leading-tight w-full">
                      {toolData.toolName}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold mt-4">
                      <CalendarDays size={16} className="text-[#6938ff]" />
                      <span>ينتهي في: <span className="text-slate-300">{toolData.endedAt ? new Date(toolData.endedAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : '---'}</span></span>
                    </div>
                  </div>

                  {/* Image (Left) */}
                  <div className="w-full sm:w-[40%] flex justify-center relative">
                    <div className="relative w-28 h-28 md:w-32 md:h-32">
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#6938ff]/30 to-transparent blur-xl rounded-full" />
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-20 h-4 bg-[#6938ff]/50 blur-[8px] rounded-full" />
                      <div className="relative z-10 w-full h-full bg-[#110c26] border border-[#241a4a] rounded-2xl p-2 shadow-xl flex items-center justify-center transform hover:-translate-y-1 transition-transform overflow-hidden">
                        {toolData.imageUrl ? (
                          <img src={toolData.imageUrl} alt={toolData.toolName} className="w-full h-full object-contain drop-shadow-lg" />
                        ) : (
                          <Cloud size={40} className="text-[#a89fdf]" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Download Limits Section */}
                {limit > 0 && (
                  <>
                    <div className="bg-[#120c2b] border border-[#2d225c] rounded-2xl p-4 mb-4 text-right">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-white font-mono font-black text-base md:text-lg" dir="ltr">
                          {countToday} <span className="text-slate-500">/</span> {limit}
                        </span>
                        <span className="flex items-center gap-2 text-[#a89fdf] font-black text-sm">
                          <Download size={16} /> التحميلات اليومية
                        </span>
                      </div>
                      
                      <div className="relative h-3.5 bg-[#120c2b] border border-[#2d225c] rounded-full flex items-center mb-1" dir="ltr">
                        <div 
                          className="absolute left-0 top-0 bottom-0 rounded-full bg-gradient-to-r from-[#6938ff] via-[#00b4d8] to-[#00e57b] transition-all duration-1000"
                          style={{ width: `${limit > 0 ? (remaining / limit) * 100 : 0}%` }}
                        />
                        <div className="absolute right-0 w-7 h-7 bg-[#0c2b21] border-2 border-[#00e57b] rounded-full flex items-center justify-center text-xs font-black text-white translate-x-1/2 shadow-[0_0_10px_rgba(0,229,123,0.5)] z-10">
                          {limit}
                        </div>
                      </div>
                    </div>

                    {/* Stats Boxes */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                      {/* Reset Timer Box */}
                      <div className="flex-1 bg-[#120c2b] border border-[#2d225c] rounded-2xl p-4 text-right">
                        <div className="text-[#a89fdf] text-xs font-black mb-3 text-right">تصفير العداد خلال</div>
                        <div className="flex items-center justify-between">
                          <div className="text-right">
                            <div className="text-lg md:text-xl font-black text-[#a89fdf]" dir="ltr">
                              <ResetTimer />
                            </div>
                            <div className="text-slate-500 text-[10px] mt-0.5">تلقائياً عند منتصف الليل</div>
                          </div>
                          <div className="w-11 h-11 rounded-full bg-[#6938ff]/10 border border-[#6938ff]/20 flex items-center justify-center shrink-0">
                            <Clock size={20} className="text-[#6938ff]" />
                          </div>
                        </div>
                      </div>

                      {/* Remaining Downloads Box */}
                      <div className="flex-1 bg-[#120c2b] border border-[#2d225c] rounded-2xl p-4 text-right">
                        <div className="text-[#a89fdf] text-xs font-black mb-3 text-right">المتبقي اليوم</div>
                        <div className="flex items-center justify-between">
                          <div className="text-right">
                            <div className="text-2xl font-black text-[#00e57b]">{remaining}</div>
                            <div className="text-slate-500 text-[10px] mt-0.5">تنزيل متاح</div>
                          </div>
                          <div className="w-11 h-11 rounded-full bg-[#00e57b]/10 border border-[#00e57b]/20 flex items-center justify-center shrink-0">
                            <Download size={20} className="text-[#00e57b]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Middle Section: Countdown Timer */}
                {toolData.endedAt && (
                  <div className="bg-[#120c2b] border border-[#2d225c] rounded-2xl p-5 mb-5 text-right">
                    <div className="flex items-center justify-center gap-2 text-[#a89fdf] text-xs font-black mb-5">
                      <RefreshCw size={14} /> الوقت المتبقي لانتهاء الاشتراك
                    </div>
                    <CountdownTimer endDate={toolData.endedAt} />
                  </div>
                )}

                {/* Action Buttons Row */}
                <div className="mt-auto pt-2 flex flex-col sm:flex-row gap-4">
                  {/* Launch Button */}
                  <div className="flex-1">
                    {isExpired ? (
                      <div className="w-full py-4 rounded-xl font-black text-lg bg-slate-800 text-slate-500 border border-white/5 flex items-center justify-center gap-2">
                        <AlertCircle size={20} />
                        <span>الاشتراك منتهي</span>
                      </div>
                    ) : (
                      <div className="p-[1.5px] rounded-xl bg-gradient-to-r from-[#7b2cbf] via-[#1b143c] to-[#00e57b] transition-all duration-300">
                        <button 
                          onClick={openCloudTool}
                          disabled={launching}
                          className="w-full py-4 rounded-[10px] font-black text-lg flex items-center justify-center relative overflow-hidden bg-gradient-to-r from-[#350f6c] via-[#0d0722] to-[#083f34] hover:from-[#3f1380] hover:to-[#0b4d40] text-white disabled:opacity-50"
                        >
                          <div className="absolute left-0 top-0 bottom-0 w-[30%] bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:8px_8px] pointer-events-none" />
                          <div className="absolute right-0 top-0 bottom-0 w-[30%] bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:8px_8px] pointer-events-none" />
                          
                          <div className="relative z-10 flex items-center justify-center gap-2">
                            {launching ? (
                              <>
                                <Loader2 size={20} className="animate-spin text-white" />
                                <span>جاري الفتح...</span>
                              </>
                            ) : (
                              <>
                                <ExternalLink size={20} className="text-white" />
                                <span className="text-xl">فتح الأداة</span>
                              </>
                            )}
                          </div>
                          
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#531eb4]/20 backdrop-blur-sm flex items-center justify-center text-white border border-[#7b2cbf]/40 shadow-inner">
                            <ChevronRight size={22} strokeWidth={3.5} className="mr-0.5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.95)] rotate-180" />
                          </div>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Rate Button */}
                  <button 
                    onClick={() => setOpenReviewModal(true)}
                    className="py-4 px-6 rounded-xl font-black text-lg bg-[#35214f] hover:bg-[#432964] border border-[#ff7702]/30 text-white flex items-center justify-center gap-2 transition-all duration-300 sm:w-fit w-full"
                  >
                    <span>{t('common.rateTool')}</span>
                    <FastForward size={18} className="text-orange-500" />
                  </button>
                </div>

                <div className="flex items-center justify-center gap-1.5 mt-5 text-[#00e57b]/60 text-[11px] font-bold">
                  <Lock size={12} />
                  <span>اتصال آمن ومشفر</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-inherit rounded-lg p-8 text-center flex flex-col lg:flex-row items-center">
            {/* Tool Icon/Image */}
            {toolData.imageUrl ? (
              <div className="lg:w-96 mx-auto mb-6 rounded-2xl overflow-hidden shadow-lg">
                <img 
                  src={toolData.imageUrl} 
                  alt={toolData.toolName}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-[#00c48c] to-[#4f008c] rounded-full flex items-center justify-center">
                <ExternalLink className="w-16 h-16 text-white" />
              </div>
            )}
            <div className="bg-[linear-gradient(135deg,_#190237,_#190237,_#4f008c)] border-t-[#00c48c80] border-b-[#00c48c80] border-r-[#00c48c80] border-l-[#19023780] border h-30 w-full flex flex-col lg:flex-row items-center justify-center gap-5 rounded-tr-lg">
              <button
                onClick={openCloudTool}
                disabled={launching}
                className="flex items-center gap-3 bg-[#35214f] inner-shadow text-white font-bold py-2 md:py-3 px-6 md:px-8 rounded-full text-md md:text-lg transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {launching ? (
                  <>
                    {t('common.loading') || 'Loading...'} <Loader2 className="animate-spin text-orange" />
                  </>
                ) : (
                  <>
                    {t('common.useTool')} <FastForward className="text-orange" />
                  </>
                )}
              </button>
              <div onClick={() => setOpenReviewModal(true)} className="flex items-center gap-3 bg-[#35214f] inner-shadow text-white font-bold py-2 md:py-3 px-6 md:px-8 rounded-full text-md md:text-lg transition-all duration-300 transform hover:scale-105 shadow-lg cursor-pointer">
                <h1>{t('common.rateTool')}</h1>
                <FastForward className="text-orange" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ............................. */}
      {toolData.cloudAccessMode !== "proxy" && (
        <div className="flex flex-col max-w-4xl mx-auto gap-5">
          <div className="flex items-center justify-center gap-3 p-4 bg-[linear-gradient(135deg,_#190237,_#190237,_#4f008c)] gradient-border-2 rounded-xl border border-[#00c48c]/30">
            <ChevronsLeft />
            <p className="text-white text-sm">
              {t('common.note')}
            </p>
            <ChevronsRight />
          </div>
           
          <div className="flex flex-col items-center border-1 border-orange rounded-[40px] p-4 gap-4 min-h-[200px] bg-[linear-gradient(135deg,_#4f008c50,_#19023750,_#00c48c50)]">
            <h1 className="bg-[#190237] border-b border-orange rounded-[30px] px-8 py-2">{t('common.descTool')}</h1>
            <p>{toolData?.toolDescription}</p>
          </div>
        </div>
      )}
    </div>
    <ReviewModal
      modalOpen={openReviewModal}
      setModalOpen={setOpenReviewModal}
    />
    </>
  );
};

export default CloudToolPage;
