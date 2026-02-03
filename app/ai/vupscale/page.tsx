"use client";

import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import PaymentModal from "@/components/Modals/PaymentModal";
import UpgradeModal from "@/components/Modals/UpgradeModal";
import Link from "next/link";
import { toast, Toaster } from 'react-hot-toast';
import { ArrowRight, Maximize, Upload, Download, X, RefreshCw, Wand2, CreditCard, Crown, ChevronLeft, ArrowLeft, ShieldCheck, Sparkles, Play, Video, Trash2, Image as ImageIcon, Film } from 'lucide-react';
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

const SCALE_OPTIONS = [
    { id: '2x', name: 'جودة مضاعفة 2x', cost: 5 },
    { id: '4x', name: 'جودة فائقة 4x', cost: 8 },
];

export default function VideoUpscalePage() {
  const [balance, setBalance] = useState<CreditsRecord | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [scale, setScale] = useState('2x');
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

  const onProcess = async () => {
    if (!apiBase || !videoFile) return;
    
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
      progressValue += Math.random() * 1.5 + 0.2;
      if (progressValue >= 98) {
        progressValue = 98;
        clearInterval(progressInterval);
      }
      setProcessingProgress(progressValue);
    }, 1500);
    
    try {
      const videoBase64 = await convertToBase64(videoFile);
      const token = getToken();
      
      const res = await fetch(`${apiBase}/api/ai/video-upscale`, {
        method: "POST",
        headers: { 'Authorization': token as any, 'Content-Type': 'application/json', "User-Client": (global as any)?.clientId1328 },
        body: JSON.stringify({ video: videoBase64, scale: scale }),
      });
      
      clearInterval(progressInterval);
      setProcessingProgress(100);
      
      const data = await res.json();
      if (data.success) {
        setResult(data);
        await fetchBalance();
        fetchUserVideos(); // Refresh list
        toast.success('تم تحسين الفيديو بنجاح!');
      } else {
        setError(data.message || 'فشلت معالجة الفيديو');
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
      const res = await fetch(`${apiBase}/api/ai/user-videos?limit=12&tool=upscale`, {
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

  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
     if (typeof window !== 'undefined') {
         fetchUserVideos();
     }
  }, []);

  return (
    <>
      <Toaster position="top-right" />

      <div className="min-h-screen bg-[#000000] text-white selection:bg-indigo-500/30 font-sans" dir="rtl">
        {/* Background Ambient */}
        <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
        <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/5 blur-[120px] rounded-full pointer-events-none"></div>

        {/* Header */}
        <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-[1600px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/ai" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/10">
                  <ArrowRight size={18} />
                  <span>عودة</span>
                </Link>
                <span className="text-xl font-bold">تحسين دقة الفيديو Video Upscale</span>
              </div>

               <div className="flex items-center gap-4">
                 <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                  {loadingBalance ? (
                    <span className="text-xs text-gray-400">جاري التحميل...</span>
                  ) : balance ? (
                    <div className="flex items-center gap-2">
                       <CreditCard size={14} className="text-blue-400" />
                      <span className={`text-sm font-bold ${balance.remaining_credits === 0 ? 'text-red-400' : 'text-blue-400'}`}>
                        {balance.remaining_credits}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-red-400">لا يوجد رصيد</span>
                  )}
                </div>
                
                <button
                   onClick={() => setShowBuyModal(true)}
                  className="relative inline-flex h-10 active:scale-95 transition overflow-hidden rounded-lg p-[1px] focus:outline-none"
                >
                  <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#6366f1_0%,#3b82f6_50%,#6366f1_100%)]"></span>
                  <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-lg bg-[#050505] px-4 text-xs font-black text-white backdrop-blur-3xl gap-2 transition-all hover:bg-black/40">
                    <Crown size={14} className="text-indigo-500" />
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
                    <div className="w-8 h-[2px] bg-indigo-500"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Upscale Studio</span>
                </div>
                <div className="text-sm text-gray-500 font-bold leading-relaxed">
                   حوّل مقاطع الفيديو منخفضة الدقة إلى جودة احترافية 4K مع تقنيات الترميم الذكي.
                </div>
              </div>

               <div className="bg-[#0c0c0c] rounded-[2rem] p-6 border border-white/5 relative group shadow-2xl overflow-hidden mb-4">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-blue-600 to-cyan-600 opacity-50"></div>
                
                <div className="relative space-y-6">
                  <div>
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-3">ملف الفيديو</span>
                    <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} className="hidden" id="v-ups-up" />
                    <label htmlFor="v-ups-up" className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 cursor-pointer hover:border-indigo-500/30 transition-all">
                        <span className="text-xs text-gray-400 max-w-[200px] truncate">{videoFile ? videoFile.name : "ارفع الفيديو هنا..."}</span>
                        <Video size={18} className="text-indigo-500" />
                    </label>
                  </div>

                  <div>
                     <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-4">مقياس التحسين</span>
                     <div className="grid grid-cols-2 gap-2">
                         {SCALE_OPTIONS.map((opt) => (
                             <button
                                key={opt.id}
                                onClick={() => setScale(opt.id)}
                                className={`flex flex-col items-center gap-1.5 p-4 rounded-xl transition-all duration-300 border ${
                                    scale === opt.id
                                    ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300'
                                    : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/10'
                                }`}
                             >
                                <span className="text-xs font-black">{opt.name}</span>
                                <span className="text-[9px] text-gray-600">التكلفة: {opt.cost} كريديت</span>
                             </button>
                         ))}
                     </div>
                  </div>

                  <div className="mt-8 border-t border-white/5 pt-6">
                    <PremiumButton 
                        label={isProcessing ? "جاري تعزيز الدقة..." : "بدء التحسين الذكي"}
                        icon={isProcessing ? RefreshCw : Maximize}
                        secondaryIcon={ArrowLeft}
                        onClick={onProcess}
                        disabled={!videoFile || isProcessing}
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
                    <div className="absolute top-8 left-8 z-20">
                      <button
                        onClick={() => setResult(null)}
                        className="p-3 bg-black/40 backdrop-blur-xl border border-white/10 text-white rounded-full hover:bg-white/10 transition-all shadow-lg group-hover/vid:scale-110"
                        title="إغلاق المعاينة"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <video src={result.video_url} controls className="max-h-[650px] w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-white/10 animate-fade-in" />
                    <div className="mt-8 flex items-center gap-3">
                        <button onClick={() => window.open(result.video_url)} className="flex items-center gap-2 px-8 py-4 bg-white text-black rounded-2xl hover:bg-gray-200 transition-all font-black text-sm">
                            <Download size={18} />
                            <span>تحميل النسخة المحسنة</span>
                        </button>
                        <button onClick={() => setResult(null)} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10">
                            <RefreshCw size={20} />
                        </button>
                    </div>
                  </div>
                ) : isProcessing ? (
                  <div className="text-center relative z-10 w-full max-w-sm px-8">
                    <div className="w-24 h-24 relative mx-auto mb-8">
                        <div className="absolute inset-0 rounded-[2.5rem] border-4 border-indigo-500/10 scale-125"></div>
                        <div className="absolute inset-0 rounded-[2.5rem] border-4 border-t-indigo-500 animate-spin"></div>
                        <Maximize className="absolute inset-0 m-auto text-indigo-400 animate-pulse" size={40} />
                    </div>
                    <h3 className="text-2xl font-black mb-2">جاري مضاعفة البيكسلات...</h3>
                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden mt-6">
                      <div className="bg-indigo-500 h-full transition-all duration-700" style={{ width: `${processingProgress}%` }}></div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center relative z-10 p-12">
                     <div className="w-32 h-32 bg-white/[0.02] rounded-[3rem] flex items-center justify-center mx-auto mb-8 border border-white/5 group-hover:scale-105 transition-all duration-700 shadow-inner">
                      <Maximize size={64} className="text-white/5 group-hover:text-indigo-500/10 transition-colors" />
                    </div>
                    <p className="text-gray-600 max-w-xs mx-auto font-bold text-lg leading-relaxed">ارفع الفيديو بجودته العالية أو المنخفضة، واترك الذكاء الاصطناعي يعيد صياغة كل فريم بدقة HDR.</p>
                  </div>
                )}
              </div>

               {/* Previous Works Section - Video Upscale */}
               <div className="mt-12 lg:col-span-12 border-t border-white/5 pt-8">
                     <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                              <Maximize size={20} />
                           </div>
                           <div>
                              <h3 className="text-lg font-bold text-white">سجل التحسينات</h3>
                              <p className="text-xs text-gray-500 font-medium">الفيديوهات التي قمت برفع جودتها</p>
                           </div>
                        </div>
                        
                        {userVideos.length > 0 && (
                            <button 
                              onClick={deleteAllVideos}
                              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-xs font-bold transition-all"
                            >
                               <Trash2 size={14} />
                               <span>مسح السجل</span>
                            </button>
                        )}
                     </div>

                     {loadingVideos ? (
                         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-pulse">
                             {[...Array(6)].map((_, i) => (
                                 <div key={i} className="aspect-video bg-white/5 rounded-2xl"></div>
                             ))}
                         </div>
                     ) : userVideos.length > 0 ? (
                         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {userVideos.map((v: any) => (
                                <div key={v.id} className="group relative aspect-video rounded-2xl overflow-hidden border border-white/5 bg-white/[0.02]">
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
                                              setResult({ video_url: v.url });
                                              window.scrollTo({ top: 0, behavior: 'smooth' });
                                          }}
                                          className="p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all"
                                          title="فتح"
                                       >
                                           <Play size={16} />
                                       </button>
                                   </div>
                                </div>
                            ))}
                         </div>
                     ) : (
                        <div className="py-12 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                           <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-500">
                              <Film size={24} />
                           </div>
                           <p className="text-gray-400 font-bold text-sm">لا توجد أعمال سابقة</p>
                        </div>
                     )}
                  </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buy Credits Modal */}
      {showBuyModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-[#111] rounded-3xl w-full max-w-lg border border-white/10 overflow-hidden relative" dir="rtl">
            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-500"></div>
            
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown size={20} className="text-indigo-400" />
                <h2 className="text-xl font-bold text-white">إضافة رصيد</h2>
              </div>
              <button onClick={() => setShowBuyModal(false)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {loadingPlans ? <div className="text-center py-12 animate-pulse text-gray-500">جاري التحميل...</div> : (
                <div className="space-y-4">
                  {plans.map((p) => (
                    <button key={p.plan_id} onClick={() => { setSelectedPlan(p as any); setShowBuyModal(false); setOpenPaymentModal(true); }} className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-right transition-all border border-white/5 hover:border-indigo-500/50 group flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white group-hover:text-indigo-400 transition-colors">{p.plan_name}</div>
                        <div className="text-gray-400 text-xs mt-1">{p.credits_per_period} نقطة / {p.period}</div>
                      </div>
                      <div className="text-white font-bold text-xl bg-white/10 px-3 py-1 rounded-lg group-hover:bg-indigo-500">${p.amount}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {openPaymentModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100]">
          <div className="w-full max-w-[1200px]">
            <PaymentModal
              modalOpen={openPaymentModal} setModalOpen={setOpenPaymentModal}
              productType="credits" period={selectedPlan.period as any} productId={selectedPlan.plan_id}
              productData={{ tool_name: selectedPlan.plan_name, pack_name: selectedPlan.plan_name, monthly_price: selectedPlan.amount, yearly_price: selectedPlan.amount, tool_day_price: selectedPlan.amount, amount: selectedPlan.amount }}
              onBuySuccess={() => { setOpenPaymentModal(false); fetchBalance(); }}
            />
          </div>
        </div>
      )}

      <UpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </>
  );
}