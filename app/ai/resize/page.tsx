"use client";

import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import PaymentModal from "@/components/Modals/PaymentModal";
import UpgradeModal from "@/components/Modals/UpgradeModal";
import Link from "next/link";
import { toast, Toaster } from 'react-hot-toast';
import { ArrowRight, Maximize, Upload, Download, X, RefreshCw, Wand2, CreditCard, Crown, ChevronLeft, ArrowLeft, ShieldCheck, Sparkles, Play, Video, Smartphone, Monitor, Square, Trash2, Coins } from 'lucide-react';
import TextType from "@/components/TextType";
import { PremiumButton } from "@/components/PremiumButton";

const downloadVideo = async (url: string, filename: string) => {
  try {
    const toastId = toast.loading('جاري التحميل...');
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
    toast.dismiss(toastId);
    toast.success('تم التحميل بنجاح');
  } catch (error) {
    toast.dismiss();
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

type CreditsRecord = {
  users_credits_id: number;
  user_id: number;
  plan_id: number;
  plan_name: string;
  period: "day" | "month" | "year" | string;
  total_credits: number;
  remaining_credits: number;
  endedAt: string;
  createdAt: string;
  plan?: { 
    plan_id: number; 
    plan_name: string; 
    period: string; 
    video_profit: number;
  };
};

const RESIZE_OPTIONS = [
    { id: '1920x1080', name: 'أفقي (YouTube)', iconType: 'monitor', desc: '16:9 - لليوتيوب' },
    { id: '1080x1920', name: 'طولي (Reels)', iconType: 'smartphone', desc: '9:16 - تيك توك' },
    { id: '1080x1080', name: 'مربع (Feed)', iconType: 'square', desc: '1:1 - فيسبوك' },
];

const getResizeIcon = (iconType: string) => {
    switch(iconType) {
        case 'monitor': return <Monitor size={16} />;
        case 'smartphone': return <Smartphone size={16} />;
        case 'square': return <Square size={16} />;
        default: return <Monitor size={16} />;
    }
};

export default function VideoResizePage() {
  const [balance, setBalance] = useState<CreditsRecord | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [dimensions, setDimensions] = useState('1920x1080');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);

  const [plans, setPlans] = useState<Array<{ plan_id: number; plan_name: string; credits_per_period: number; amount: string; period: string }>>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ plan_id: number; plan_name: string; credits_per_period: number; amount: string; period: string } | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL, []);
  const baseCredits = 5;
  const videoProfit = balance?.plan?.video_profit ?? 0;
  const creditsNeeded = baseCredits + videoProfit;

  const getToken = () => {
    if (typeof window !== 'undefined') return localStorage.getItem("a");
    return null;
  };

  const fetchBalance = async () => {
    if (!apiBase) return;
    const token = getToken();
    setLoadingBalance(true);
    try {
      const res = await fetch(`${apiBase}/api/credits/me/balance`, { 
        headers: { 'Authorization': token as any, 'Content-Type': 'application/json', "User-Client": (global as any)?.clientId1328 } 
      });
      if (res.status === 200) {
        const data = (await res.json()) as CreditsRecord | null;
        setBalance(data);
      }
    } catch (e: any) {} finally {
      setLoadingBalance(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const ensureClientId = async () => {
      try {
        if (!(global as any)?.clientId1328) {
          const fp = await FingerprintJS.load();
          const result = await fp.get();
          (global as any).clientId1328 = result.visitorId;
        }
        if (!cancelled) {
          fetchBalance();
          void loadPlans();
        }
      } catch (_) {}
    };
    ensureClientId();
    return () => { cancelled = true; };
  }, []);

  const loadPlans = async () => {
    if (!apiBase) return;
    setLoadingPlans(true);
    try {
      const res = await fetch(`${apiBase}/api/credits/plans`);
      if (res.status === 200) {
        const data = await res.json();
        setPlans(data);
      }
    } finally {
      setLoadingPlans(false);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const onProcess = async () => {
    if (!apiBase || !videoFile) return;
    
    // فحص الرصيد قبل البدء
    if (!balance || balance.remaining_credits < creditsNeeded) {
      setShowUpgradeModal(true);
      return;
    }
    
    setIsProcessing(true);
    setError('');
    setResult(null);
    setProcessingProgress(0);
    
    let progressValue = 0;
    const progressInterval = setInterval(() => {
      progressValue += Math.random() * 4 + 1;
      if (progressValue >= 98) {
        progressValue = 98;
        clearInterval(progressInterval);
      }
      setProcessingProgress(progressValue);
    }, 800);
    
    try {
      const videoBase64 = await convertToBase64(videoFile);
      const token = getToken();
      
      const res = await fetch(`${apiBase}/api/ai/video-resize`, {
        method: "POST",
        headers: { 'Authorization': token as any, 'Content-Type': 'application/json', "User-Client": (global as any)?.clientId1328 },
        body: JSON.stringify({ video: videoBase64, dimensions: dimensions }),
      });
      
      clearInterval(progressInterval);
      setProcessingProgress(100);
      
      const data = await res.json();
      if (data.success) {
        setResult(data);
        await fetchBalance();
        toast.success('تم تغيير حجم الفيديو بنجاح!');
      } else {
        setError(data.message || 'فشلت معالجة الفيديو');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Previous Works Logic
  const [userVideos, setUserVideos] = useState<any[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);

  const fetchUserVideos = async () => {
    if (!apiBase) return;
    const token = getToken();
    setLoadingVideos(true);
    try {
      const res = await fetch(`${apiBase}/api/ai/user-videos?limit=12&tool=video_resize`, {
        headers: { 'Authorization': token as any, 'Content-Type': 'application/json', "User-Client": (global as any)?.clientId1328 }
      });
      if (res.status === 200) {
        const data = await res.json();
        if (data.success) {
            setUserVideos(data.videos.map((v: any) => ({
                id: v.video_id,
                url: v.video_url || v.cloudinary_url,
                prompt: v.prompt
            })));
        }
      }
    } catch (e) {} finally { setLoadingVideos(false); }
  };

  const deleteVideo = async (videoId: number) => {
      if (!apiBase) return;
      const token = getToken();
      setUserVideos(userVideos.filter(v => v.id !== videoId));
      try {
          await fetch(`${apiBase}/api/ai/user-videos/${videoId}`, {
              method: 'DELETE',
              headers: { 'Authorization': token as any, "User-Client": (global as any)?.clientId1328 }
          });
          toast.success('تم الحذف');
      } catch (e) {}
  };

  const deleteAllVideos = async () => {
      if (!confirm('حذف السجل بالكامل؟')) return;
      if (!apiBase) return;
      const token = getToken();
      setUserVideos([]);
      try {
          await fetch(`${apiBase}/api/ai/user-videos`, {
              method: 'DELETE',
              headers: { 'Authorization': token as any, "User-Client": (global as any)?.clientId1328 }
          });
          toast.success('تم مسح السجل');
      } catch (e) {}
  };

  useEffect(() => {
     if (typeof window !== 'undefined') {
         fetchUserVideos();
     }
  }, []);

  return (
    <>
      <Toaster position="top-right" />

      <div className="min-h-screen bg-[#000000] text-white selection:bg-emerald-500/30 font-sans" dir="rtl">
        {/* Background Ambient */}
        <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
        <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-900/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="fixed bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-900/5 blur-[120px] rounded-full pointer-events-none"></div>

        {/* Header */}
        <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-[1600px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/ai" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/10">
                  <ArrowRight size={18} />
                  <span>عودة</span>
                </Link>
                <span className="text-xl font-bold">تغيير أبعاد الفيديو Video Resize</span>
              </div>

               <div className="flex items-center gap-4">
                 <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                  {loadingBalance ? (
                    <span className="text-xs text-gray-400">جاري التحميل...</span>
                  ) : balance ? (
                    <div className="flex items-center gap-2">
                       <CreditCard size={14} className="text-emerald-400" />
                      <span className={`text-sm font-bold ${balance.remaining_credits === 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {balance.remaining_credits}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-red-400">لا يوجد رصيد</span>
                  )}
                </div>
                
                <button
                   onClick={() => setOpenPaymentModal(true)}
                  className="relative inline-flex h-10 active:scale-95 transition overflow-hidden rounded-lg p-[1px] focus:outline-none"
                >
                  <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#10b981_0%,#059669_50%,#10b981_100%)]"></span>
                  <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-lg bg-[#050505] px-4 text-xs font-black text-white backdrop-blur-3xl gap-2 transition-all hover:bg-black/40">
                    <Crown size={14} className="text-emerald-500" />
                    شراء رصيد
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Sidebar */}
          <aside className="w-full lg:w-[300px] h-auto max-h-[35vh] lg:max-h-full lg:h-full flex flex-col border-b lg:border-b-0 lg:border-l border-white/10 bg-[#050505] overflow-y-auto custom-scrollbar shrink-0 order-1">
            <div className="p-4 space-y-4">
               <div>
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-[1px] bg-emerald-500"></div>
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-400">Layout Studio</span>
                </div>
                <div className="text-[10px] text-gray-500 font-bold leading-relaxed">
                   حوّل الفيديو الخاص بك ليتناسب مع أي منصة تواصل اجتماعي بذكاء واحترافية.
                </div>
              </div>

               <div className="space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest block">ملف الفيديو</span>
                    <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} className="hidden" id="v-res-up" />
                    <label htmlFor="v-res-up" className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:border-emerald-500/30 transition-all">
                        <span className="text-[10px] text-gray-400 max-w-[150px] truncate">{videoFile ? videoFile.name : "ارفع الفيديو هنا..."}</span>
                        <Video size={14} className="text-emerald-500" />
                    </label>
                  </div>

                  <div className="space-y-2">
                     <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest block">الأبعاد المطلوبة</span>
                     <div className="grid grid-cols-1 gap-1.5">
                         {RESIZE_OPTIONS.map((opt) => (
                             <button
                                key={opt.id}
                                onClick={() => setDimensions(opt.id)}
                                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border ${
                                    dimensions === opt.id
                                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300 backdrop-blur-xl'
                                    : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/10'
                                }`}
                             >
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${dimensions === opt.id ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
                                    {getResizeIcon(opt.iconType)}
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-black">{opt.name}</div>
                                    <div className="text-[8px] text-gray-600 font-bold">{opt.desc}</div>
                                </div>
                             </button>
                         ))}
                     </div>
                  </div>
                </div>
            </div>

            <div className="mt-auto p-4 border-t border-white/5 bg-[#080808]">
                {error && (
                    <div className="mb-2 p-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[9px] font-bold text-center truncate">
                        {error}
                    </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-gray-400 mb-2 font-medium bg-white/5 p-2 rounded-lg border border-white/10">
                    <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-yellow-500/10 flex items-center justify-center">
                            <Coins size={10} className="text-yellow-500" />
                        </div>
                        <span>التكلفة المتوقعه:</span>
                    </div>
                    <span className="text-white font-bold text-xs">{creditsNeeded}</span>
                </div>

                <PremiumButton 
                    label={isProcessing ? "جاري إعادة التشكيل..." : "تطبيق الأبعاد الجديدة"}
                    icon={isProcessing ? RefreshCw : Maximize}
                    onClick={onProcess}
                    disabled={!videoFile || isProcessing}
                    className="w-full py-3 text-xs rounded-xl"
                />
            </div>
          </aside>

          {/* Main Area */}
          <main className="flex-1 overflow-y-auto bg-[#020202] custom-scrollbar p-6 order-2">
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="bg-[#080808] rounded-[2rem] border border-white/5 min-h-[500px] flex items-center justify-center relative overflow-hidden group shadow-inner">
                {result ? (
                  <div className="relative w-full h-full p-8 flex flex-col items-center justify-center group/vid">
                    <video src={result.video_url} controls className="max-h-[600px] w-full max-w-2xl rounded-[2rem] shadow-2xl border border-white/10 animate-fade-in" />
                    <div className="mt-8 flex items-center gap-3">
                        <button onClick={() => downloadVideo(result.video_url, `resized_video.mp4`)} className="flex items-center gap-2 px-8 py-4 bg-white text-black rounded-2xl hover:bg-gray-200 transition-all font-black text-sm">
                            <Download size={18} />
                            <span>تحميل الفيديو المعدل</span>
                        </button>
                        <button onClick={() => setResult(null)} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10">
                            <RefreshCw size={20} />
                        </button>
                    </div>
                  </div>
                ) : isProcessing ? (
                  <div className="text-center relative z-10 w-full max-w-sm px-8">
                    <div className="w-24 h-24 relative mx-auto mb-8">
                        <div className="absolute inset-0 rounded-[2rem] border-4 border-emerald-500/10 scale-125"></div>
                        <div className="absolute inset-0 rounded-[2rem] border-4 border-t-emerald-500 animate-spin"></div>
                        <Maximize className="absolute inset-0 m-auto text-emerald-400 animate-pulse" size={40} />
                    </div>
                    <h3 className="text-xl font-black mb-2">جاري إعادة هيكلة الفيديو...</h3>
                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden mt-6">
                      <div className="bg-emerald-500 h-full transition-all duration-700 shadow-[0_0_15px_rgba(16,185,129,0.5)]" style={{ width: `${processingProgress}%` }}></div>
                    </div>
                    <div className="text-emerald-400 font-mono text-xs mt-2 font-bold">{Math.floor(processingProgress)}%</div>
                  </div>
                ) : (
                  <div className="text-center relative z-10 p-12">
                     <div className="w-24 h-24 bg-white/[0.02] rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-white/5 group-hover:scale-105 transition-all duration-700 shadow-inner">
                      <Maximize size={48} className="text-white/5 group-hover:text-emerald-500/10 transition-colors" />
                    </div>
                    <p className="text-gray-600 max-w-xs mx-auto font-bold text-base leading-relaxed">ارفع الفيديو الخاص بك، اختر المنصة التي ستنشر عليها، وسيقوم النظام بتعديل الأبعاد فوراً.</p>
                  </div>
                )}
              </div>

               {/* Previous Works Section - Video Resize */}
               <div className="mt-12 border-t border-white/5 pt-8">
                     <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                              <Video size={20} />
                           </div>
                           <div>
                              <h3 className="text-lg font-bold text-white">تعديلاتك السابقة</h3>
                              <p className="text-xs text-gray-500 font-medium">سجل بآخر الفيديوهات التي قمت بتغيير أبعادها</p>
                           </div>
                        </div>
                        
                        {userVideos.length > 0 && (
                            <button 
                              onClick={deleteAllVideos}
                              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-xs font-bold transition-all"
                            >
                               <Trash2 size={14} />
                               <span>حذف السجل</span>
                            </button>
                        )}
                     </div>

                     {loadingVideos ? (
                         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-pulse">
                             {[...Array(6)].map((_, i) => (
                                 <div key={i} className="aspect-square bg-white/5 rounded-2xl"></div>
                             ))}
                         </div>
                     ) : userVideos.length > 0 ? (
                         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {userVideos.map((v: any) => (
                                <div key={v.id} className="group relative aspect-square rounded-2xl overflow-hidden border border-white/5 bg-[#0c0c0c]">
                                   <video 
                                      src={v.url} 
                                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                   />
                                   <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                       <button 
                                          onClick={() => deleteVideo(v.id)}
                                          className="p-2 bg-red-500/20 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all"
                                          title="حذف"
                                       >
                                           <Trash2 size={16} />
                                       </button>
                                       <button 
                                          onClick={() => {
                                              setResult({ video_url: v.url, success: true });
                                              window.scrollTo({ top: 0, behavior: 'smooth' });
                                          }}
                                          className="p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all"
                                          title="فتح"
                                       >
                                           <ArrowRight size={16} className="rotate-180" />
                                       </button>
                                   </div>
                                </div>
                            ))}
                         </div>
                     ) : (
                        <div className="py-16 text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
                           <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-500">
                              <Video size={24} />
                           </div>
                           <p className="text-gray-500 font-bold text-sm">لا يوجد سجلات سابقة</p>
                        </div>
                     )}
                  </div>
            </div>
          </main>
        </div>

        <UpgradeModal 
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
        />
      </div>
    </>
  );
}
