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
import { AIToolHeader, AIGenerateButton, AILoadingOverlay, AIDeleteModal } from "@/components/ai";
import { useAiPricing } from '@/hooks/useAiPricing';

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
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'single' | 'all';
    id?: number | string | null;
  }>({ isOpen: false, type: 'single', id: null });
  const [isDeletingModal, setIsDeletingModal] = useState(false);

  const handleConfirmDelete = async () => {
    setIsDeletingModal(true);
    try {
      if (deleteModal.type === 'single' && deleteModal.id !== undefined && deleteModal.id !== null) {
        const videoId = Number(deleteModal.id);
        if (apiBase) {
          const token = getToken();
          setUserVideos(prev => prev.filter(v => v.id !== videoId));
          await fetch(`${apiBase}/api/ai/user-videos/${videoId}`, {
            method: 'DELETE',
            headers: { 'Authorization': token as any, "User-Client": (global as any)?.clientId1328 }
          });
          toast.success('تم الحذف');
        }
      } else if (deleteModal.type === 'all') {
        if (apiBase) {
          const token = getToken();
          setUserVideos([]);
          await fetch(`${apiBase}/api/ai/user-videos?tool=video_resize`, {
            method: 'DELETE',
            headers: { 'Authorization': token as any, "User-Client": (global as any)?.clientId1328 }
          });
          toast.success('تم مسح السجل');
        }
      }
      setDeleteModal({ isOpen: false, type: 'single', id: null });
    } catch (e) {
      toast.error('حدث خطأ أثناء الحذف');
    } finally {
      setIsDeletingModal(false);
    }
  };

  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL, []);
  const { operationPrice } = useAiPricing();
  const baseCredits = operationPrice('resize', 12);
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



  useEffect(() => {
     if (typeof window !== 'undefined') {
         fetchUserVideos();
     }
  }, []);

  return (
    <>
      <Toaster position="top-right" />

      <div className="min-h-screen bg-[#06070B] text-white selection:bg-emerald-500/30 font-sans" dir="rtl">
        {/* Background Ambient */}
        <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>

        {/* Unified AI Tool Header */}
        <AIToolHeader
          title="تغيير أبعاد الفيديو"
          description="تكييف وقص أبعاد الفيديوهات لتناسب منصات تيك توك، ريلز، ويوتيوب"
          badge="Video Resizer"
          icon={Maximize}
          iconGradient="from-emerald-600 to-teal-600"
          userCredits={balance?.remaining_credits}
          onUpgradeClick={() => setOpenPaymentModal(true)}
          backHref="/ai"
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Sidebar - Controls */}
          <aside className="w-full lg:w-[380px] xl:w-[420px] bg-[#0B0D14] border-b lg:border-b-0 lg:border-l border-white/[0.08] p-5 flex flex-col justify-between shrink-0 h-[calc(100vh-3.5rem)] z-30 shadow-2xl relative">
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-0.5 pb-2">
               <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-white">تغيير أبعاد الفيديو</h2>
              </div>

               <div className="space-y-3">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-gray-400 block">ملف الفيديو</span>
                    <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} className="hidden" id="v-res-up" />
                    <label htmlFor="v-res-up" className="flex items-center justify-between p-3.5 rounded-xl bg-[#121520] border border-white/[0.08] cursor-pointer hover:border-emerald-500/40 transition-all">
                        <span className="text-xs text-gray-300 max-w-[220px] truncate">{videoFile ? videoFile.name : "اختر ملف فيديو..."}</span>
                        <Video size={16} className="text-emerald-400" />
                    </label>
                  </div>

                  <div className="space-y-2">
                     <span className="text-xs font-bold text-gray-400 block">الأبعاد المطلوبة</span>
                     <div className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto custom-scrollbar">
                         {RESIZE_OPTIONS.map((opt) => (
                             <button
                                key={opt.id}
                                onClick={() => setDimensions(opt.id)}
                                className={`flex items-center gap-3 p-2.5 rounded-xl transition-all border ${
                                    dimensions === opt.id
                                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-bold'
                                    : 'bg-[#121520] border-white/[0.08] text-gray-400 hover:bg-[#161a27]'
                                }`}
                             >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${dimensions === opt.id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-400'}`}>
                                    {getResizeIcon(opt.iconType)}
                                </div>
                                <div className="text-right flex-1 min-w-0">
                                    <div className="text-xs font-bold truncate">{opt.name}</div>
                                    <div className="text-[10px] text-gray-500 truncate">{opt.desc}</div>
                                </div>
                             </button>
                         ))}
                     </div>
                  </div>
                </div>
            </div>

            <div className="pt-3 border-t border-white/[0.08] shrink-0 bg-[#0B0D14] z-20">
                {error && (
                    <div className="mb-2 p-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[10px] font-bold text-center truncate">
                        {error}
                    </div>
                )}

                <AIGenerateButton
                    onClick={onProcess}
                    isGenerating={isProcessing}
                    disabled={!videoFile}
                    cost={creditsNeeded}
                    label="إنشاء"
                    generatingLabel="جاري الإنشاء..."
                    icon={Maximize}
                    variant="emerald"
                />
            </div>
          </aside>

          {/* Main Area */}
          <main className="flex-1 overflow-y-auto bg-[#06070B] custom-scrollbar p-6">
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="bg-[#0B0D14] rounded-[2rem] border border-white/[0.08] min-h-[500px] flex items-center justify-center relative overflow-hidden group shadow-inner">
                <AILoadingOverlay
                  isGenerating={isProcessing}
                  progress={processingProgress}
                  icon={Maximize}
                />

                {result ? (
                  <div className="relative w-full h-full p-8 flex flex-col items-center justify-center group/vid">
                    <video src={result.video_url} controls autoPlay loop playsInline className="max-h-[75vh] max-w-full w-auto h-auto object-contain rounded-2xl shadow-2xl border border-white/10 animate-fade-in" />
                    <div className="mt-8 flex items-center gap-3">
                        <button onClick={() => downloadVideo(result.video_url, `resized_video.mp4`)} className="flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl transition-all font-black text-sm">
                            <Download size={18} />
                            <span>تحميل الفيديو المعدل</span>
                        </button>
                        <button onClick={() => setResult(null)} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10">
                            <RefreshCw size={20} />
                        </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center relative z-10 p-12">
                     <div className="w-24 h-24 bg-white/[0.02] rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-white/5 group-hover:scale-105 transition-all duration-700 shadow-inner">
                      <Maximize size={48} className="text-white/5 group-hover:text-emerald-500/10 transition-colors" />
                    </div>
                    <p className="text-gray-400 max-w-xs mx-auto font-bold text-base leading-relaxed">ارفع الفيديو الخاص بك، اختر المنصة التي ستنشر عليها، وسيقوم النظام بتعديل الأبعاد فوراً.</p>
                  </div>
                )}
              </div>

               {/* Previous Works Section - Video Resize */}
               <div className="mt-12 border-t border-white/[0.08] pt-8">
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
                              onClick={() => setDeleteModal({ isOpen: true, type: 'all', id: null })}
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
                                <div key={v.id} className="group relative aspect-square rounded-2xl overflow-hidden border border-white/5 bg-black flex items-center justify-center">
                                   <video 
                                      src={v.url} 
                                      className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
                                   />
                                   <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                       <button 
                                          onClick={() => setDeleteModal({ isOpen: true, type: 'single', id: v.id })}
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

        <AIDeleteModal
          isOpen={deleteModal.isOpen}
          type={deleteModal.type}
          isDeleting={isDeletingModal}
          onClose={() => setDeleteModal({ isOpen: false, type: 'single', id: null })}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </>
  );
}