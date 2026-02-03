"use client";

import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import PaymentModal from "@/components/Modals/PaymentModal";
import UpgradeModal from "@/components/Modals/UpgradeModal";
import Link from "next/link";
import { toast, Toaster } from 'react-hot-toast';
import { ArrowRight, Wand2, Upload, Download, X, RefreshCw, CreditCard, Crown, ChevronLeft, ArrowLeft, ShieldCheck, Sparkles, Play, Layers, Trash2 } from 'lucide-react';
import TextType from "@/components/TextType";
import { PremiumButton } from "@/components/PremiumButton";

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

const VIDEO_EFFECTS = [
    { id: 'blur', name: 'ضبابية', icon: '🌫️', category: 'فلاتر' },
    { id: 'vintage', name: 'كلاسيكي', icon: '📼', category: 'فلاتر' },
    { id: 'neon', name: 'نيون', icon: '💡', category: 'إضاءة' },
    { id: 'glitch', name: 'ليتش', icon: '⚡', category: 'رقمي' },
    { id: 'cinematic', name: 'سينمائي', icon: '🎬', category: 'احترافي' },
    { id: 'slow_mo', name: 'بطيء', icon: '🐌', category: 'حركة' },
];

export default function VideoEffectsPage() {
  const [balance, setBalance] = useState<CreditsRecord | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [selectedEffects, setSelectedEffects] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);

  const [plans, setPlans] = useState<Array<{ plan_id: number; plan_name: string; credits_per_period: number; amount: string; period: string }>>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ plan_id: number; plan_name: string; credits_per_period: number; amount: string; period: string } | null>(null);

  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL, []);

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

  const toggleEffect = (effectId: string) => {
      setSelectedEffects(prev => prev.includes(effectId) ? prev.filter(e => e !== effectId) : [...prev, effectId]);
  };

  const onProcess = async () => {
    if (!apiBase || !videoFile || selectedEffects.length === 0) return;
    
    // فحص الرصيد قبل البدء
    if (!balance || balance.remaining_credits <= 0) {
      setShowUpgradeModal(true);
      return;
    }
    
    setIsProcessing(true);
    setError('');
    setResult(null);
    setProcessingProgress(0);
    
    let progressValue = 0;
    const progressInterval = setInterval(() => {
      progressValue += Math.random() * 3 + 1;
      if (progressValue >= 98) {
        progressValue = 98;
        clearInterval(progressInterval);
      }
      setProcessingProgress(progressValue);
    }, 800);
    
    try {
      const videoBase64 = await convertToBase64(videoFile);
      const token = getToken();
      
      const res = await fetch(`${apiBase}/api/ai/video-effects`, {
        method: "POST",
        headers: { 'Authorization': token as any, 'Content-Type': 'application/json', "User-Client": (global as any)?.clientId1328 },
        body: JSON.stringify({ video: videoBase64, effects: selectedEffects }),
      });
      
      clearInterval(progressInterval);
      setProcessingProgress(100);
      
      const data = await res.json();
      if (data.success) {
        setResult(data);
        await fetchBalance();
        toast.success('تم تطبيق التأثيرات بنجاح!');
      } else {
        setError(data.message || 'فشلت الإضافة');
      }
    } catch (e: any) {
      clearInterval(progressInterval);
      setError('خطأ في الاتصال');
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
      const res = await fetch(`${apiBase}/api/ai/user-videos?limit=12&tool=video_effects`, {
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

      <div className="min-h-screen bg-[#000000] text-white selection:bg-purple-500/30 font-sans" dir="rtl">
        {/* Background Ambient */}
        <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
        <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-900/5 blur-[120px] rounded-full pointer-events-none"></div>

        {/* Header */}
        <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-[1600px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/ai" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/10">
                  <ArrowRight size={18} />
                  <span>عودة</span>
                </Link>
                <span className="text-xl font-bold">تأثيرات الفيديو FX</span>
              </div>

               <div className="flex items-center gap-4">
                 <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                  {loadingBalance ? (
                    <span className="text-xs text-gray-400">جاري التحميل...</span>
                  ) : balance ? (
                    <div className="flex items-center gap-2">
                       <CreditCard size={14} className="text-purple-400" />
                      <span className={`text-sm font-bold ${balance.remaining_credits === 0 ? 'text-red-400' : 'text-purple-400'}`}>
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
                  <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#a855f7_0%,#d946ef_50%,#a855f7_100%)]"></span>
                  <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-lg bg-[#050505] px-4 text-xs font-black text-white backdrop-blur-3xl gap-2 transition-all hover:bg-black/40">
                    <Crown size={14} className="text-purple-500" />
                    شراء رصيد
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-[1600px] mx-auto p-6 pt-8">
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Panel */}
            <div className="order-1 lg:col-span-4 space-y-4 lg:sticky lg:top-28">
               <div className="mb-2">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-[2px] bg-purple-500"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">FX Studio</span>
                </div>
                <div className="text-sm text-gray-500 font-bold leading-relaxed">
                   أضف طبقات من الجمال والاحترافية على فيديوهاتك بلمسات بصرية ذكية.
                </div>
              </div>

               <div className="bg-[#0c0c0c] rounded-[2rem] p-6 border border-white/5 relative group shadow-2xl overflow-hidden mb-4">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-fuchsia-600 to-pink-600 opacity-50"></div>
                
                <div className="relative space-y-6">
                  <div>
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-3">ملف الفيديو</span>
                    <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} className="hidden" id="v-fx-up" />
                    <label htmlFor="v-fx-up" className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 cursor-pointer hover:border-purple-500/30 transition-all">
                        <span className="text-xs text-gray-400 max-w-[200px] truncate">{videoFile ? videoFile.name : "ارفع الفيديو هنا..."}</span>
                        <Layers size={18} className="text-purple-500" />
                    </label>
                  </div>

                  <div>
                     <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-4">اختر التأثيرات</span>
                     <div className="grid grid-cols-3 gap-2">
                         {VIDEO_EFFECTS.map((fx) => (
                             <button
                                key={fx.id}
                                onClick={() => toggleEffect(fx.id)}
                                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-300 border ${
                                    selectedEffects.includes(fx.id)
                                    ? 'bg-purple-500/10 border-purple-500/50 text-purple-300'
                                    : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/10'
                                }`}
                             >
                                <span className="text-lg">{fx.icon}</span>
                                <span className="text-[9px] font-black">{fx.name}</span>
                             </button>
                         ))}
                     </div>
                  </div>

                  <div className="mt-8 border-t border-white/5 pt-6">
                    <PremiumButton 
                        label={isProcessing ? "جاري المعالجة..." : "تطبيق التأثيرات"}
                        icon={isProcessing ? RefreshCw : Wand2}
                        secondaryIcon={ArrowLeft}
                        onClick={onProcess}
                        disabled={!videoFile || selectedEffects.length === 0 || isProcessing}
                        className="w-full py-4 text-base"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-black text-center flex items-center justify-center gap-2">
                  <X size={14} />
                  {error}
                </div>
              )}
            </div>

            {/* Right Panel */}
            <div className="lg:col-span-8 order-2 space-y-6">
              <div className="bg-[#080808] rounded-[3rem] border border-white/5 min-h-[500px] lg:min-h-[850px] flex items-center justify-center relative overflow-hidden group shadow-inner">
                {result ? (
                  <div className="relative w-full h-full p-8 flex flex-col items-center justify-center group/vid">
                    <video src={result.video_url} controls className="max-h-[650px] w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-white/10 animate-fade-in" />
                    <div className="mt-8 flex items-center gap-3">
                        <button onClick={() => window.open(result.video_url)} className="flex items-center gap-2 px-8 py-4 bg-white text-black rounded-2xl hover:bg-gray-200 transition-all font-black text-sm">
                            <Download size={18} />
                            <span>تحميل الفيديو</span>
                        </button>
                        <button onClick={() => setResult(null)} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10">
                            <RefreshCw size={20} />
                        </button>
                    </div>
                  </div>
                ) : isProcessing ? (
                  <div className="text-center relative z-10 w-full max-w-sm px-8">
                    <div className="w-24 h-24 relative mx-auto mb-8">
                        <div className="absolute inset-0 rounded-[2.5rem] border-4 border-purple-500/10 scale-125"></div>
                        <div className="absolute inset-0 rounded-[2.5rem] border-4 border-t-purple-500 animate-spin"></div>
                        <Wand2 className="absolute inset-0 m-auto text-purple-400 animate-pulse" size={40} />
                    </div>
                    <h3 className="text-2xl font-black mb-2">جاري المعالجة البصرية...</h3>
                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden mt-6">
                      <div className="bg-purple-500 h-full transition-all duration-700" style={{ width: `${processingProgress}%` }}></div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center relative z-10 p-12">
                     <div className="w-32 h-32 bg-white/[0.02] rounded-[3rem] flex items-center justify-center mx-auto mb-8 border border-white/5 group-hover:scale-105 transition-all duration-700 shadow-inner">
                      <Wand2 size={64} className="text-white/5 group-hover:text-purple-500/10 transition-colors" />
                    </div>
                    <p className="text-gray-600 max-w-xs mx-auto font-bold text-lg leading-relaxed">ارفع الفيديو واختر التأثيرات المطلوبة لترى السحر السينمائي.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Previous Works Section - FX */}
          <div className="mt-12 lg:col-span-12 border-t border-white/5 pt-8">
                     <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 border border-purple-500/20">
                              <Sparkles size={20} />
                           </div>
                           <div>
                              <h3 className="text-lg font-bold text-white">تأثيراتك السابقة</h3>
                              <p className="text-xs text-gray-500 font-medium">سجل بالفيديوهات التي قمت بتطبيق الفلاتر عليها</p>
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
                              <Layers size={24} />
                           </div>
                           <p className="text-gray-500 font-bold text-sm">لا توجد سجلات سابقة</p>
                        </div>
                     )}
                  </div>

        <UpgradeModal 
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
        />
        </div>
      </div>
    </>
  );
}