"use client";

import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import PaymentModal from "@/components/Modals/PaymentModal";
import UpgradeModal from "@/components/Modals/UpgradeModal";
import Link from "next/link";
import { toast, Toaster } from 'react-hot-toast';
import { ArrowRight, Maximize, Upload, Download, X, RefreshCw, Wand2, CreditCard, Crown, ChevronLeft, ArrowLeft, ShieldCheck, Sparkles, Play, Video, Trash2, Image as ImageIcon, Film, Coins } from 'lucide-react';
import { AIToolHeader, AIGenerateButton, AILoadingOverlay, downloadMediaDirectly, AIDeleteModal } from "@/components/ai";
import { useAiPricing } from "@/hooks/useAiPricing";

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
    { id: '2x', name: 'جودة مضاعفة 2x' },
    { id: '4x', name: 'جودة فائقة 4x' },
];

export default function VideoUpscalePage() {
  const { operationPrice } = useAiPricing();
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
  
  const creditsNeeded = operationPrice('vupscale', 15);

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



  const [showBuyModal, setShowBuyModal] = useState(false);
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
          await fetch(`${apiBase}/api/ai/user-videos?tool=upscale`, {
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

  useEffect(() => {
     if (typeof window !== 'undefined') {
         fetchUserVideos();
     }
  }, []);

  return (
    <>
      <Toaster position="top-right" />

      <div className="h-screen flex flex-col bg-[#06070B] text-white overflow-hidden" dir="rtl">
        {/* Unified AI Tool Header */}
        <AIToolHeader
          title="تحسين دقة وجودة الفيديو"
          description="مضاعفة دقة الفيديو إلى 2K و 4K وإزالة التشويش بالذكاء الاصطناعي"
          badge="Video Upscaler"
          icon={Maximize}
          iconGradient="from-emerald-600 to-teal-600"
          userCredits={balance?.remaining_credits}
          onUpgradeClick={() => setShowBuyModal(true)}
          backHref="/ai"
        />

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            <aside className="w-full lg:w-[380px] h-[calc(100vh-3.5rem)] border-b lg:border-b-0 lg:border-l border-white/[0.08] bg-[#0B0D14] p-5 overflow-hidden flex flex-col justify-between shrink-0 z-30 space-y-4 shadow-2xl relative">
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-0.5 pb-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-black text-white">تحسين جودة الفيديو</h2>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                            <Upload size={14} className="text-emerald-400" /> ملف الفيديو
                        </label>
                        <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} className="hidden" id="v-ups-up" />
                        <label htmlFor="v-ups-up" className="flex items-center justify-between p-3.5 rounded-xl bg-[#121520] border border-white/[0.08] cursor-pointer hover:border-emerald-500/40 transition-all">
                            <span className="text-xs text-gray-300 max-w-[220px] truncate">{videoFile ? videoFile.name : "اختر ملف فيديو..."}</span>
                            <Video size={16} className="text-emerald-400" />
                        </label>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400">مقياس ومضاعف الدقة</label>
                        <div className="grid grid-cols-1 gap-2">
                            {SCALE_OPTIONS.map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => setScale(opt.id)}
                                    className={`flex items-center justify-between p-3 rounded-xl transition-all border ${
                                        scale === opt.id
                                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-bold'
                                        : 'bg-[#121520] border-white/[0.08] text-gray-400 hover:bg-[#161a27]'
                                    }`}
                                >
                                    <span className="text-xs font-bold">{opt.name}</span>
                                    <span className="text-xs text-emerald-400 font-bold">{creditsNeeded} 🪙</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="pt-3 border-t border-white/[0.08] shrink-0 bg-[#0B0D14] z-20">
                    {error && <div className="mb-2 p-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[10px] font-bold text-center truncate">{error}</div>}
                    
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

            <main className="flex-1 overflow-y-auto bg-[#06070B] custom-scrollbar p-6">
                <div className="max-w-5xl mx-auto space-y-8">
                    <div className="bg-[#0B0D14] rounded-[2rem] border border-white/[0.08] min-h-[400px] flex items-center justify-center relative overflow-hidden group shadow-inner">
                        <AILoadingOverlay
                          isGenerating={isProcessing}
                          progress={processingProgress}
                          icon={Maximize}
                        />

                        {result ? (
                            <div className="relative w-full h-full p-8 flex flex-col items-center justify-center group/vid">
                                <video src={result.video_url} controls autoPlay loop playsInline className="max-h-[75vh] max-w-full w-auto h-auto object-contain rounded-2xl shadow-2xl border border-white/10 animate-fade-in" />
                                <div className="mt-8 flex items-center gap-3">
                                    <button onClick={() => downloadMediaDirectly(result.video_url, `upscaled-video-${Date.now()}.mp4`)} className="flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl transition-all font-black text-sm"><Download size={18} /> تحميل مباشر</button>
                                    <button onClick={() => setResult(null)} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10"><RefreshCw size={20} /></button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center relative z-10 p-12">
                                <div className="w-20 h-20 bg-white/[0.02] rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 border border-white/5 group-hover:scale-105 transition-all duration-700 shadow-inner">
                                    <Maximize size={40} className="text-white/5 group-hover:text-emerald-500/10 transition-colors" />
                                </div>
                                <p className="text-gray-400 max-w-xs mx-auto font-bold text-sm leading-relaxed">ارفع الفيديو بجودته العالية أو المنخفضة، واترك الذكاء الاصطناعي يعيد صياغة كل فريم بدقة HDR.</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-12 border-t border-white/[0.08] pt-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/20"><Maximize size={20} /></div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">سجل التحسينات</h3>
                                    <p className="text-xs text-gray-500 font-medium">الفيديوهات التي قمت برفع جودتها</p>
                                </div>
                            </div>
                            {userVideos.length > 0 && (
                                <button onClick={() => setDeleteModal({ isOpen: true, type: 'all', id: null })} className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-xs font-bold transition-all"><Trash2 size={14} /> مسح الكل</button>
                            )}
                        </div>

                        {loadingVideos ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-pulse">
                                {[...Array(5)].map((_, i) => <div key={i} className="aspect-video bg-white/5 rounded-2xl"></div>)}
                            </div>
                        ) : userVideos.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {userVideos.map((v: any) => (
                                    <div key={v.id} className="group relative aspect-video rounded-2xl overflow-hidden border border-white/5 bg-black flex items-center justify-center">
                                        <video src={v.url} className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105" />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <button onClick={() => setDeleteModal({ isOpen: true, type: 'single', id: v.id })} className="p-2 bg-red-500/20 text-red-500 rounded-full hover:bg-red-500 transition-all"><Trash2 size={16} /></button>
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
          <div className="bg-[#0B0D14] rounded-3xl w-full max-w-lg border border-white/[0.08] overflow-hidden relative" dir="rtl">
            <div className="absolute top-0 right-0 w-full h-1 bg-emerald-500"></div>
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3"><Crown size={20} className="text-emerald-400" /><h2 className="text-xl font-bold text-white">إضافة رصيد</h2></div>
              <button onClick={() => setShowBuyModal(false)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {loadingPlans ? <div className="text-center py-12 animate-pulse text-gray-500">جاري التحميل...</div> : (
                <div className="space-y-4">
                  {plans.map((p) => (
                    <button key={p.plan_id} onClick={() => { setSelectedPlan(p as any); setShowBuyModal(false); setOpenPaymentModal(true); }} className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-right transition-all border border-white/5 hover:border-emerald-500/50 group flex items-center justify-between">
                      <div><div className="font-bold text-white group-hover:text-emerald-400 transition-colors">{p.plan_name}</div><div className="text-gray-400 text-xs mt-1">{p.credits_per_period} نقطة / {p.period}</div></div>
                      <div className="text-white font-bold text-xl bg-white/10 px-3 py-1 rounded-lg group-hover:bg-emerald-600">${p.amount}</div>
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

      <AIDeleteModal
        isOpen={deleteModal.isOpen}
        type={deleteModal.type}
        isDeleting={isDeletingModal}
        onClose={() => setDeleteModal({ isOpen: false, type: 'single', id: null })}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
