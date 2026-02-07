"use client";

import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import PaymentModal from "@/components/Modals/PaymentModal";
import UpgradeModal from "@/components/Modals/UpgradeModal";
import Link from "next/link";
import { toast, Toaster } from 'react-hot-toast';
import { ArrowRight, Users, Download, X, RefreshCw, CreditCard, Crown, ArrowLeft, Play, Layers, Heart, MessageCircle, Share2, Trash2, Film, Coins, Sparkles } from 'lucide-react';
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

const UGC_STYLES = [
    { id: 'authentic', name: 'أصيل', iconType: 'heart', desc: 'محتوى طبيعي وحقيقي' },
    { id: 'trendy', name: 'عصري', iconType: 'share2', desc: 'يواكب الترندات الحالية' },
    { id: 'casual', name: 'عادي', iconType: 'message', desc: 'بسيط ومريح يومي' },
];

const getUgcIcon = (iconType: string) => {
    switch(iconType) {
        case 'heart': return <Heart size={16} />;
        case 'share2': return <Share2 size={16} />;
        case 'message': return <MessageCircle size={16} />;
        default: return <Heart size={16} />;
    }
};

export default function UGCPage() {
  const [balance, setBalance] = useState<CreditsRecord | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('authentic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [userMedia, setUserMedia] = useState<Array<{ id: number; url: string; prompt: string }>>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  const [plans, setPlans] = useState<Array<{ plan_id: number; plan_name: string; credits_per_period: number; amount: string; period: string }>>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ plan_id: number; plan_name: string; credits_per_period: number; amount: string; period: string } | null>(null);

  const [clientReady, setClientReady] = useState(false);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize prompt textarea
  useEffect(() => {
    if (promptRef.current) {
      promptRef.current.style.height = '80px'; 
      const scrollHeight = promptRef.current.scrollHeight;
      if (scrollHeight > 80) {
        promptRef.current.style.height = `${scrollHeight}px`;
      }
    }
  }, [prompt]);

  const baseCredits = 20;
  const videoProfit = balance?.plan?.video_profit ?? 0;
  const creditsNeeded = baseCredits + videoProfit;

  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL, []);

  const getToken = useCallback(() => {
    if (typeof window !== 'undefined') return localStorage.getItem("a");
    return null;
  }, []);

  const fetchBalance = useCallback(async () => {
    if (!apiBase) return;
    const token = getToken();
    setLoadingBalance(true);
    try {
      const res = await fetch(`${apiBase}/api/credits/me/balance`, { 
        headers: { 
          'Authorization': token || '', 
          'Content-Type': 'application/json', 
          "User-Client": (window as any)?.clientId1328 || "" 
        } 
      });
      if (res.ok) {
        const data = (await res.json()) as CreditsRecord | null;
        setBalance(data);
      }
    } catch (e: any) {
      console.error("Balance fetch error:", e);
    } finally {
      setLoadingBalance(false);
    }
  }, [apiBase, getToken]);

  const loadPlans = useCallback(async () => {
    if (!apiBase) return;
    setLoadingPlans(true);
    try {
      const res = await fetch(`${apiBase}/api/credits/plans`);
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
      }
    } catch (e) {
      console.error("Plans load error:", e);
    } finally {
      setLoadingPlans(false);
    }
  }, [apiBase]);

  useEffect(() => {
    let cancelled = false;
    const ensureClientId = async () => {
      try {
        if (!(window as any)?.clientId1328) {
          const fp = await FingerprintJS.load();
          const result = await fp.get();
          (window as any).clientId1328 = result.visitorId;
        }
        if (!cancelled) {
          setClientReady(true);
          fetchBalance();
          loadPlans();
        }
      } catch (_) {
        if (!cancelled) setClientReady(true); // Still set ready to allow basic interactions
      }
    };
    ensureClientId();
    return () => { cancelled = true; };
  }, [fetchBalance, loadPlans]);

  const fetchUserMedia = useCallback(async () => {
    if (!apiBase) return;
    const token = getToken();
    setLoadingMedia(true);
    try {
      const res = await fetch(`${apiBase}/api/ai/user-media?limit=12&type=video`, {
        headers: { 
          'Authorization': token || '', 
          'Content-Type': 'application/json', 
          "User-Client": (window as any)?.clientId1328 || "" 
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
            setUserMedia(data.media.map((v: any) => ({
                id: v.media_id,
                url: v.video_url || v.media_url || v.cloudinary_url,
                prompt: v.prompt
            })));
        }
      }
    } catch (e) {
      console.error("Media fetch error:", e);
    } finally { 
      setLoadingMedia(false); 
    }
  }, [apiBase, getToken]);

  const onGenerate = async () => {
    if (!apiBase || !prompt.trim() || !clientReady) return;
    
    if (!balance || balance.remaining_credits < creditsNeeded) {
      setShowUpgradeModal(true);
      return;
    }
    
    setIsGenerating(true);
    setError('');
    setResult(null);
    setProcessingProgress(0);
    
    let progressValue = 0;
    const progressInterval = setInterval(() => {
      progressValue += Math.random() * 1.5 + 0.5;
      if (progressValue >= 98) {
        progressValue = 98;
        clearInterval(progressInterval);
      }
      setProcessingProgress(progressValue);
    }, 1000);
    
    try {
      const token = getToken();
      const res = await fetch(`${apiBase}/api/ai/ugc-video`, {
        method: "POST",
        headers: { 
          'Authorization': token || '', 
          'Content-Type': 'application/json', 
          "User-Client": (window as any)?.clientId1328 || "" 
        },
        body: JSON.stringify({ prompt: prompt.trim(), style: style }),
      });
      
      clearInterval(progressInterval);
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'حدث خطأ أثناء الإنشاء');
      }

      const data = await res.json();
      if (data.success) {
        setProcessingProgress(100);
        setResult({
          video_url: data.video_url || data.media_url || data.cloudinary_url
        });
        await fetchBalance();
        fetchUserMedia();
        toast.success('تم إنشاء فيديو UGC بنجاح!');
      } else {
        setError(data.message || 'فشل إنشاء الفيديو');
      }
    } catch (e: any) {
      clearInterval(progressInterval);
      setError(e.message || 'خطأ في الاتصال بالخادم');
      toast.error(e.message || 'حدث خطأ');
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteMedia = useCallback(async (mediaId: number) => {
      if (!apiBase) return;
      const token = getToken();
      const previousMedia = [...userMedia];
      setUserMedia(userMedia.filter(v => v.id !== mediaId));
      try {
          const res = await fetch(`${apiBase}/api/ai/user-media/${mediaId}`, {
              method: 'DELETE',
              headers: { 
                'Authorization': token || '', 
                "User-Client": (window as any)?.clientId1328 || "" 
              }
          });
          if (!res.ok) throw new Error();
          toast.success('تم الحذف');
      } catch (e) {
          setUserMedia(previousMedia);
          toast.error('فشل الحذف');
      }
  }, [apiBase, getToken, userMedia]);

  const deleteAllMedia = useCallback(async () => {
      if (!confirm('حذف السجل بالكامل؟')) return;
      if (!apiBase) return;
      const token = getToken();
      const previousMedia = [...userMedia];
      setUserMedia([]);
      try {
          const res = await fetch(`${apiBase}/api/ai/user-media?type=video`, {
              method: 'DELETE',
              headers: { 
                'Authorization': token || '', 
                "User-Client": (window as any)?.clientId1328 || "" 
              }
          });
          if (!res.ok) throw new Error();
          toast.success('تم مسح السجل');
      } catch (e) {
          setUserMedia(previousMedia);
          toast.error('فشل مسح السجل');
      }
  }, [apiBase, getToken, userMedia]);

  const downloadVideo = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `nexus_ugc_video_${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast.success('بدأ التحميل');
    } catch (err) {
      window.open(url, '_blank');
    }
  };

  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
     if (clientReady) {
         fetchUserMedia();
     }
  }, [clientReady, fetchUserMedia]);

  function convertToSlug(text: string) { return text.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-'); }

  return (
    <>
      <Toaster position="top-right" />

      <div className="min-h-screen bg-[#000000] text-white selection:bg-pink-500/30 font-sans no-scrollbar" dir="rtl">
        {/* Background Ambient */}
        <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
        <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-pink-900/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-rose-900/5 blur-[120px] rounded-full pointer-events-none"></div>

        {/* Header */}
        <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-[1600px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/ai" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/10">
                  <ArrowRight size={18} />
                  <span>عودة</span>
                </Link>
                <span className="text-xl font-bold">فيديوهات UGC التفاعلية</span>
              </div>

               <div className="flex items-center gap-4">
                 <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                  {loadingBalance ? (
                    <span className="text-xs text-gray-400">جاري التحميل...</span>
                  ) : balance ? (
                    <div className="flex items-center gap-2">
                       <CreditCard size={14} className="text-pink-400" />
                      <span className={`text-sm font-bold ${balance.remaining_credits === 0 ? 'text-red-400' : 'text-pink-400'}`}>
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
                  <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#ec4899_0%,#f43f5e_50%,#ec4899_100%)]"></span>
                  <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-lg bg-[#050505] px-4 text-xs font-black text-white backdrop-blur-3xl gap-2 transition-all hover:bg-black/40">
                    <Crown size={14} className="text-pink-500" />
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
               <div className="bg-[#0c0c0c] rounded-3xl p-5 border border-white/5 relative group shadow-2xl overflow-hidden mb-4">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-rose-600 to-red-600 opacity-50"></div>
                
                <div className="relative space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase text-gray-500 tracking-widest flex items-center gap-2">
                        <Sparkles size={12} className="text-pink-400" /> موضوع الفيديو
                    </span>
                    <textarea 
                        ref={promptRef}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="صف محتوى الفيديو التفاعلي..."
                        className="w-full px-3 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-pink-500/50 outline-none text-white text-xs font-bold transition-all placeholder:text-gray-700 min-h-[80px] resize-none overflow-hidden"
                    />
                  </div>

                  <div className="space-y-2">
                     <span className="text-[10px] font-bold uppercase text-gray-500 tracking-widest block mb-1">طابع المحتوى</span>
                     <div className="grid grid-cols-1 gap-1.5">
                         {UGC_STYLES.map((s) => (
                             <button
                                key={s.id}
                                onClick={() => setStyle(s.id)}
                                className={`flex items-center gap-3 p-2 rounded-xl transition-all duration-300 border ${
                                    style === s.id
                                    ? 'bg-pink-500/10 border-pink-500/50 text-pink-300'
                                    : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/10'
                                }`}
                             >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${style === s.id ? 'bg-pink-500/20' : 'bg-white/5'}`}>
                                    {getUgcIcon(s.iconType)}
                                </div>
                                <div className="text-right truncate">
                                    <div className="text-[10px] font-bold">{s.name}</div>
                                    <div className="text-[8px] text-gray-600 truncate">{s.desc}</div>
                                </div>
                             </button>
                         ))}
                     </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 space-y-3">
                     <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium bg-white/5 p-2 rounded-lg border border-white/10">
                        <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                <Coins size={10} className="text-yellow-500" />
                            </div>
                            <span>التكلفة المتوقعه:</span>
                        </div>
                        <span className="text-white font-bold text-xs">{creditsNeeded}</span>
                     </div>

                    <PremiumButton 
                        label={isGenerating ? "جاري الإنشاء..." : "إنشاء فيديو UGC"}
                        icon={isGenerating ? RefreshCw : Users}
                        onClick={onGenerate}
                        disabled={!prompt.trim() || isGenerating}
                        className="w-full py-3 text-xs rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-bold text-center flex items-center justify-center gap-2 truncate">
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
                    <div className="absolute top-6 left-6 z-20">
                      <button
                        onClick={() => setResult(null)}
                        className="p-3 bg-black/40 backdrop-blur-xl border border-white/10 text-white rounded-full hover:bg-white/10 transition-all shadow-lg group-hover/vid:scale-110"
                        title="إغلاق المعاينة"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <video src={result.video_url} controls className="max-h-[650px] w-full max-w-sm rounded-[2.5rem] shadow-2xl border border-white/10 animate-fade-in aspect-[9/16] bg-black" />
                    <div className="mt-8 flex items-center gap-3">
                        <button onClick={() => downloadVideo(result.video_url)} className="flex items-center gap-2 px-8 py-4 bg-white text-black rounded-2xl hover:bg-gray-200 transition-all font-black text-sm">
                            <Download size={18} />
                            <span>تحميل الفيديو</span>
                        </button>
                        <button onClick={() => setPrompt('')} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10" title="مسح الموضع">
                            <RefreshCw size={20} />
                        </button>
                    </div>
                  </div>
                ) : isGenerating ? (
                  <div className="text-center relative z-10 w-full max-w-sm px-8">
                    <div className="w-24 h-24 relative mx-auto mb-8">
                        <div className="absolute inset-0 rounded-[2.5rem] border-4 border-pink-500/10 scale-125"></div>
                        <div className="absolute inset-0 rounded-[2.5rem] border-4 border-t-pink-500 animate-spin"></div>
                        <Users className="absolute inset-0 m-auto text-pink-400 animate-pulse" size={40} />
                    </div>
                    <h3 className="text-2xl font-black mb-2">جاري محاكاة المحتوى...</h3>
                    <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden mt-6 relative">
                      <div 
                        className="bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 h-full transition-all duration-700 shadow-[0_0_15px_rgba(236,72,153,0.5)]" 
                        style={{ width: `${processingProgress}%` }}
                      ></div>
                    </div>
                    <div className="mt-2 text-pink-400 font-mono text-xs font-bold">{Math.floor(processingProgress)}%</div>
                  </div>
                ) : (
                  <div className="text-center relative z-10 p-12">
                     <div className="w-32 h-32 bg-white/[0.02] rounded-[3rem] flex items-center justify-center mx-auto mb-8 border border-white/5 group-hover:scale-105 transition-all duration-700 shadow-inner">
                      <Users size={64} className="text-white/5 group-hover:text-pink-500/10 transition-colors" />
                    </div>
                    <p className="text-gray-600 max-w-xs mx-auto font-bold text-lg leading-relaxed">اكتب القصة التي تريد أن يرويها المستخدم، وسيقوم النظام بتوليد الفيديو التفاعلي.</p>
                  </div>
                )}
              </div>

               {/* Previous Works Section - UGC */}
               <div className="mt-12 lg:col-span-12 border-t border-white/5 pt-8">
                     <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-pink-500/10 rounded-xl flex items-center justify-center text-pink-400 border border-pink-500/20">
                              <Users size={20} />
                           </div>
                           <div>
                              <h3 className="text-lg font-bold text-white">أعمالك السابقة</h3>
                              <p className="text-xs text-gray-500 font-medium">سجل بمقاطع الفيديو التفاعلية التي قمت بإنشائها</p>
                           </div>
                        </div>
                        
                        {userMedia.length > 0 && (
                            <button 
                              onClick={deleteAllMedia}
                              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-xs font-bold transition-all"
                            >
                               <Trash2 size={14} />
                               <span>مسح السجل</span>
                            </button>
                        )}
                     </div>

                     {loadingMedia ? (
                         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-pulse">
                             {[...Array(6)].map((_, i) => (
                                 <div key={i} className="aspect-video bg-white/5 rounded-2xl"></div>
                             ))}
                         </div>
                     ) : userMedia.length > 0 ? (
                         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {userMedia.map((v: any) => (
                                <div key={v.id} className="group relative aspect-video rounded-2xl overflow-hidden border border-white/5 bg-white/[0.02]">
                                   <video 
                                      src={v.url} 
                                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                   />
                                   <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                       <button 
                                          onClick={() => deleteMedia(v.id)}
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
                              <Layers size={24} />
                           </div>
                           <p className="text-gray-400 font-bold text-sm">لا توجد أعمال سابقة</p>
                        </div>
                     )}
                  </div>
            </div>
          </div>
        </div>
      </div>

      {showBuyModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-[#111] rounded-3xl w-full max-w-lg border border-white/10 overflow-hidden relative" dir="rtl">
            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-pink-500 to-rose-500"></div>
            
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown size={20} className="text-pink-400" />
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
                    <button key={p.plan_id} onClick={() => { setSelectedPlan(p as any); setShowBuyModal(false); setOpenPaymentModal(true); }} className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-right transition-all border border-white/5 hover:border-pink-500/50 group flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white group-hover:text-pink-400 transition-colors">{p.plan_name}</div>
                        <div className="text-gray-400 text-xs mt-1">{p.credits_per_period} نقطة / {p.period}</div>
                      </div>
                      <div className="text-white font-bold text-xl bg-white/10 px-3 py-1 rounded-lg group-hover:bg-pink-500">${p.amount}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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