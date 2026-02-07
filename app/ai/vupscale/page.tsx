"use client";

import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import PaymentModal from "@/components/Modals/PaymentModal";
import UpgradeModal from "@/components/Modals/UpgradeModal";
import Link from "next/link";
import { toast, Toaster } from 'react-hot-toast';
import { ArrowRight, Maximize, Upload, Download, X, RefreshCw, Wand2, CreditCard, Crown, ChevronLeft, ArrowLeft, ShieldCheck, Sparkles, Play, Video, Trash2, Image as ImageIcon, Film, Coins } from 'lucide-react';
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
  
  const videoProfit = balance?.plan?.video_profit ?? 0;
  const currentScaleOption = SCALE_OPTIONS.find(o => o.id === scale);
  const creditsNeeded = (currentScaleOption?.cost || 0) + videoProfit;

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

      <div className="h-screen flex flex-col bg-black text-white overflow-hidden" dir="rtl">
        {/* Header */}
        <header className="shrink-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 flex justify-between items-center px-6 py-3">
            <div className="flex items-center gap-4">
              <Link href="/ai" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 font-bold text-xs"><ArrowRight size={14} /> عودة</Link>
              <div className="flex items-center gap-2 text-indigo-400">
                <Maximize size={20} fill="currentColor" fillOpacity={0.2} />
                <h1 className="text-lg font-bold">تحسين دقة الفيديو</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2">
                <CreditCard size={12} className="text-indigo-400" />
                <span className="text-sm font-bold text-indigo-400">{balance?.remaining_credits || 0}</span>
              </div>
              <button onClick={() => setShowBuyModal(true)} className="bg-indigo-600 px-4 py-1.5 rounded-lg text-[10px] font-black hover:bg-indigo-700 transition-all flex items-center gap-2 text-white"><Crown size={12} /> شراء</button>
            </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
            <aside className="w-[280px] md:w-[300px] border-l border-white/10 bg-[#050505] overflow-y-auto custom-scrollbar flex flex-col shrink-0">
                <div className="p-4 space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">ملف الفيديو</label>
                        <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} className="hidden" id="v-ups-up" />
                        <label htmlFor="v-ups-up" className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:border-indigo-500/30 transition-all">
                            <span className="text-[10px] text-gray-400 max-w-[150px] truncate">{videoFile ? videoFile.name : "ارفع الفيديو هنا..."}</span>
                            <Video size={14} className="text-indigo-500" />
                        </label>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">مقياس التحسين</label>
                        <div className="grid grid-cols-1 gap-1.5">
                            {SCALE_OPTIONS.map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => setScale(opt.id)}
                                    className={`flex items-center justify-between p-3 rounded-lg transition-all duration-300 border ${
                                        scale === opt.id
                                        ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300'
                                        : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'
                                    }`}
                                >
                                    <span className="text-[10px] font-black">{opt.name}</span>
                                    <span className="text-[9px] text-gray-600 font-bold">{opt.cost + videoProfit} نقطة</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-auto p-4 border-t border-white/5 bg-[#080808]">
                    {error && <div className="mb-2 p-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[9px] font-bold text-center truncate">{error}</div>}
                    <div className="flex items-center justify-between text-[10px] text-gray-400 mb-2 font-medium bg-white/5 p-2 rounded-lg border border-white/10">
                        <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                <Coins size={10} className="text-yellow-500" />
                            </div>
                            <span>التكلفة المتوقعه:</span>
                        </div>
                        <span className="text-white font-bold text-xs">{creditsNeeded}</span>
                    </div>
                    <PremiumButton label={isProcessing ? "جاري التحسين..." : "بدء التحسين"} icon={isProcessing ? RefreshCw : Maximize} onClick={onProcess} disabled={!videoFile || isProcessing} className="w-full py-3 text-xs rounded-xl" />
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto bg-[#020202] custom-scrollbar p-6">
                <div className="max-w-5xl mx-auto space-y-8">
                    <div className="bg-[#080808] rounded-[2rem] border border-white/5 min-h-[400px] flex items-center justify-center relative overflow-hidden group shadow-inner">
                        {result ? (
                            <div className="relative w-full h-full p-8 flex flex-col items-center justify-center group/vid">
                                <video src={result.video_url} controls className="max-h-[500px] w-full max-w-2xl rounded-[2rem] shadow-2xl border border-white/10 animate-fade-in" />
                                <div className="mt-8 flex items-center gap-3">
                                    <button onClick={() => window.open(result.video_url)} className="flex items-center gap-2 px-8 py-4 bg-white text-black rounded-2xl hover:bg-gray-200 transition-all font-black text-sm"><Download size={18} /> تحميل</button>
                                    <button onClick={() => setResult(null)} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10"><RefreshCw size={20} /></button>
                                </div>
                            </div>
                        ) : isProcessing ? (
                            <div className="text-center relative z-10 w-full max-w-sm px-8">
                                <div className="w-20 h-20 relative mx-auto mb-6">
                                    <div className="absolute inset-0 rounded-[1.5rem] border-4 border-indigo-500/10 scale-125"></div>
                                    <div className="absolute inset-0 rounded-[1.5rem] border-4 border-t-indigo-500 animate-spin"></div>
                                    <Maximize className="absolute inset-0 m-auto text-indigo-400 animate-pulse" size={32} />
                                </div>
                                <h3 className="text-lg font-black mb-2">جاري مضاعفة البيكسلات...</h3>
                                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden mt-6">
                                    <div className="bg-indigo-500 h-full transition-all duration-700 shadow-[0_0_15px_rgba(30,58,138,0.5)]" style={{ width: `${processingProgress}%` }}></div>
                                </div>
                                <div className="text-indigo-400 font-mono text-[10px] mt-2 font-bold">{Math.floor(processingProgress)}%</div>
                            </div>
                        ) : (
                            <div className="text-center relative z-10 p-12">
                                <div className="w-20 h-20 bg-white/[0.02] rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 border border-white/5 group-hover:scale-105 transition-all duration-700 shadow-inner">
                                    <Maximize size={40} className="text-white/5 group-hover:text-indigo-500/10 transition-colors" />
                                </div>
                                <p className="text-gray-600 max-w-xs mx-auto font-bold text-sm leading-relaxed">ارفع الفيديو بجودته العالية أو المنخفضة، واترك الذكاء الاصطناعي يعيد صياغة كل فريم بدقة HDR.</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-12 border-t border-white/5 pt-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20"><Maximize size={20} /></div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">سجل التحسينات</h3>
                                    <p className="text-xs text-gray-500 font-medium">الفيديوهات التي قمت برفع جودتها</p>
                                </div>
                            </div>
                            {userVideos.length > 0 && (
                                <button onClick={deleteAllVideos} className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-xs font-bold transition-all"><Trash2 size={14} /> مسح الكل</button>
                            )}
                        </div>

                        {loadingVideos ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-pulse">
                                {[...Array(5)].map((_, i) => <div key={i} className="aspect-video bg-white/5 rounded-2xl"></div>)}
                            </div>
                        ) : userVideos.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {userVideos.map((v: any) => (
                                    <div key={v.id} className="group relative aspect-video rounded-2xl overflow-hidden border border-white/5 bg-white/[0.02]">
                                        <video src={v.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <button onClick={() => deleteVideo(v.id)} className="p-2 bg-red-500/20 text-red-500 rounded-full hover:bg-red-500 transition-all"><Trash2 size={16} /></button>
                                            <button onClick={() => { setResult({ video_url: v.url }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all"><Play size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                                <Film size={24} className="mx-auto mb-4 text-gray-500" />
                                <p className="text-gray-400 font-bold text-sm">لا توجد أعمال سابقة</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
      </div>

      {showBuyModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-[#111] rounded-3xl w-full max-w-lg border border-white/10 overflow-hidden relative" dir="rtl">
            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-500"></div>
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3"><Crown size={20} className="text-indigo-400" /><h2 className="text-xl font-bold text-white">إضافة رصيد</h2></div>
              <button onClick={() => setShowBuyModal(false)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {loadingPlans ? <div className="text-center py-12 animate-pulse text-gray-500">جاري التحميل...</div> : (
                <div className="space-y-4">
                  {plans.map((p) => (
                    <button key={p.plan_id} onClick={() => { setSelectedPlan(p as any); setShowBuyModal(false); setOpenPaymentModal(true); }} className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-right transition-all border border-white/5 hover:border-indigo-500/50 group flex items-center justify-between">
                      <div><div className="font-bold text-white group-hover:text-indigo-400 transition-colors">{p.plan_name}</div><div className="text-gray-400 text-xs mt-1">{p.credits_per_period} نقطة / {p.period}</div></div>
                      <div className="text-white font-bold text-xl bg-white/10 px-3 py-1 rounded-lg group-hover:bg-indigo-500">${p.amount}</div>
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
            <PaymentModal modalOpen={openPaymentModal} setModalOpen={setOpenPaymentModal} productType="credits" period={selectedPlan.period as any} productId={selectedPlan.plan_id} productData={{ tool_name: selectedPlan.plan_name, pack_name: selectedPlan.plan_name, monthly_price: selectedPlan.amount, yearly_price: selectedPlan.amount, tool_day_price: selectedPlan.amount, amount: selectedPlan.amount }} onBuySuccess={() => { setOpenPaymentModal(false); fetchBalance(); }} />
          </div>
        </div>
      )}

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </>
  );
}
