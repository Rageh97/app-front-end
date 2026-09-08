"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import PaymentModal from "@/components/Modals/PaymentModal";
import UpgradeModal from "@/components/Modals/UpgradeModal";
import Link from "next/link";
import { toast, Toaster } from 'react-hot-toast';
import { 
  ArrowRight, Upload, Download, X, RefreshCw, Wand2, 
  CreditCard, Crown, Sparkles, Play, Film, 
  Image as ImageIcon, Trash2, Coins, History, Maximize2, 
  Cpu, Clock, Monitor, Smartphone, Square, Tv
} from 'lucide-react';
import { AIToolHeader, AIGenerateButton, AIGenerationCard, AIResultModal, downloadMediaDirectly, AIDeleteModal } from "@/components/ai";
import { handleAuthError } from "@/utils/auth";

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
import { ModelSelector } from "@/components/ModelSelector";
import { MOTION_MODELS, VideoModel, calculateVideoCost, syncVideoWithDynamicPricing } from '@/lib/ai-models-config';

type CreditsRecord = {
  remaining_credits: number;
  plan?: { video_profit: number; };
};

const ASPECT_RATIOS = [
  { label: "الأصلية", value: "original", icon: <ImageIcon size={14} /> },
  { label: "16:9", value: "16:9", icon: <Monitor size={14} /> },
  { label: "9:16", value: "9:16", icon: <Smartphone size={14} /> },
  { label: "1:1", value: "1:1", icon: <Square size={14} /> },
];

export default function MotionSimulatorPage() {
  const [balance, setBalance] = useState<CreditsRecord | null>(null);
  const [imageFile, setImageFile] = useState<string | null>(null);
  
  // Model Selection State
  const [selectedModelId, setSelectedModelId] = useState(MOTION_MODELS[0].id);
  const [dynamicPrices, setDynamicPrices] = useState<Record<string, number>>({});

  // Aspect Ratio State
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0].value);

  const dynamicModels = useMemo(() => {
    return syncVideoWithDynamicPricing(MOTION_MODELS, dynamicPrices);
  }, [dynamicPrices]);

  const selectedModel = dynamicModels.find(m => m.id === selectedModelId) || dynamicModels[0];

  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
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
        const prev = [...userVideos];
        setUserVideos(prev.filter(v => v.id !== videoId));
        if (selectedVideoModal?.id === videoId) setSelectedVideoModal(null);
        if (apiBase) {
          await fetch(`${apiBase}/api/ai/user-videos/${videoId}`, {
            method: 'DELETE',
            headers: { 'Authorization': getToken() as any, "User-Client": (global as any)?.clientId1328 }
          });
          toast.success('تم الحذف');
        }
      } else if (deleteModal.type === 'all') {
        if (apiBase) {
          const res = await fetch(`${apiBase}/api/ai/user-videos?tool=motion`, {
            method: 'DELETE',
            headers: { 'Authorization': getToken() as any, 'User-Client': (global as any)?.clientId1328 }
          });
          setUserVideos([]);
          setSelectedVideoModal(null);
          toast.success('تم حذف جميع النتائج السابقة');
        }
      }
      setDeleteModal({ isOpen: false, type: 'single', id: null });
    } catch (e) {
      toast.error('فشل حذف النتائج');
    } finally {
      setIsDeletingModal(false);
    }
  };
  const promptRef = useRef<HTMLTextAreaElement>(null);

  const [plans, setPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  const [userVideos, setUserVideos] = useState<any[]>([]);
  const [selectedVideoModal, setSelectedVideoModal] = useState<any | null>(null);

  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL, []);
  
  // Dynamic Durations based on model
  const availableDurations = useMemo(() => {
    return selectedModel.supportedDurations || [5];
  }, [selectedModel]);

  const [duration, setDuration] = useState(availableDurations[0]);

  // Reset duration if current is not supported by new model
  useEffect(() => {
    if (!availableDurations.includes(duration)) {
      setDuration(availableDurations[0]);
    }
  }, [selectedModelId, availableDurations]);

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

  const videoProfit = Number(balance?.plan?.video_profit ?? 0);
  const creditsNeeded = calculateVideoCost(selectedModel as VideoModel, duration, videoProfit);

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem("a") : null;

  const fetchBalance = async () => {
    if (!apiBase) return;
    try {
      const res = await fetch(`${apiBase}/api/credits/me/balance`, { 
        headers: { 'Authorization': getToken() as any, "User-Client": (global as any)?.clientId1328 } 
      });
      if (res.status === 200) setBalance(await res.json());
    } catch (e) {}
  };

  const loadPlans = async () => {
    if (!apiBase) return;
    setLoadingPlans(true);
    try {
      const res = await fetch(`${apiBase}/api/credits/plans`);
      if (res.status === 200) setPlans(await res.json());
    } finally { setLoadingPlans(false); }
  };

  const fetchUserVideos = async () => {
    if (!apiBase) return;
    try {
        const res = await fetch(`${apiBase}/api/ai/user-videos?limit=24&tool=motion`, { 
            headers: { 'Authorization': getToken() as any, "User-Client": (global as any)?.clientId1328 }
        });
        if (res.status === 200) {
            const data = await res.json();
            if (data.success) {
                setUserVideos(data.videos.map((vid: any) => ({
                    id: vid.video_id,
                    url: vid.video_url || vid.cloudinary_url,
                    thumbnail: vid.thumbnail_url,
                    prompt: vid.prompt,
                    date: vid.created_at,
                    is_public: vid.is_public
                })));
            }
        }
    } catch (e) {}
  };

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        if (!(global as any)?.clientId1328) {
          const fp = await FingerprintJS.load();
          const result = await fp.get();
          (global as any).clientId1328 = result.visitorId;
        }
        if (!cancelled) {
          fetchBalance();
          loadPlans();
          fetchUserVideos();
          loadDynamicPricing();
        }
      } catch (_) {}
    };
    init();
    return () => { cancelled = true; };
  }, []);

  const loadDynamicPricing = async () => {
    if (!apiBase) return;
    try {
      const res = await fetch(`${apiBase}/api/admin/settings/public/ai-pricing`);
      if (res.status === 200) {
        const data = await res.json();
        setDynamicPrices(data);
      }
    } catch (e) {
      console.error("Failed to load dynamic pricing", e);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error('حجم الصورة كبير جداً (الحد الأقصى 10MB)');
          return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            setImageFile(e.target?.result as string);
            setError(null);
        };
        reader.readAsDataURL(file);
    }
  };

  const onProcess = async () => {
    if (!apiBase || !imageFile) return;
    
    if (!balance || balance.remaining_credits < creditsNeeded) {
      setShowUpgradeModal(true);
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setProcessingProgress(0);
    
    let progressValue = 0;
    const interval = setInterval(() => {
      progressValue += Math.random() * 1.5 + 0.2;
      if (progressValue >= 95) { clearInterval(interval); progressValue = 95; }
      setProcessingProgress(progressValue);
    }, 1000);
    
    try {
      console.log('[MOTION] Sending generation request with:', {
        model: selectedModelId,
        duration: duration,
        expectedCost: creditsNeeded
      });

      const res = await fetch(`${apiBase}/api/ai/motion-effects`, {
        method: "POST",
        headers: { 
          'Authorization': getToken() as any, 
          'Content-Type': 'application/json', 
          "User-Client": (global as any)?.clientId1328 
        },
        body: JSON.stringify({ 
            image: imageFile, 
            motion_type: selectedModelId, 
            prompt: prompt,
            duration: duration,
            aspect_ratio: aspectRatio
        }),
      });
      
      clearInterval(interval);
      setProcessingProgress(100);
      
      if (res.status === 200) {
        const data = await res.json();
        console.log('[MOTION] Generation successful, credits used:', data.credits_used);
        toast.success('تم إنشاء الحركة بنجاح!');
        fetchBalance();
        fetchUserVideos();
      } else {
        setError(await res.text() || 'فشلت العملية');
      }
    } catch (e: any) {
      clearInterval(interval);
      setError('خطأ في الاتصال بالسيرفر');
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteVideo = async (videoId: number, e?: React.MouseEvent) => {
      if(e) e.stopPropagation();
      if (!apiBase) return;
      const prev = [...userVideos];
      setUserVideos(prev.filter(v => v.id !== videoId));
      if (selectedVideoModal?.id === videoId) setSelectedVideoModal(null);
      try {
          await fetch(`${apiBase}/api/ai/user-videos/${videoId}`, {
              method: 'DELETE',
              headers: { 'Authorization': getToken() as any, "User-Client": (global as any)?.clientId1328 }
          });
          toast.success('تم الحذف');
      } catch (e) { setUserVideos(prev); }
  };

  

  const handleDeleteAllVideos = async () => {
    if (!apiBase) return;
    try {
      const res = await fetch(`${apiBase}/api/ai/user-videos?tool=motion`, {
        method: 'DELETE',
        headers: { 'Authorization': getToken() as any, 'User-Client': (global as any)?.clientId1328 }
      });
      setUserVideos([]);
      setSelectedVideoModal(null);
      toast.success('تم حذف جميع النتائج السابقة');
    } catch (e) {
      toast.error('فشل حذف النتائج');
    }
  };
const togglePublicStatus = async (id: number, currentStatus: boolean) => {
    if (!apiBase) return;
    try {
        const res = await fetch(`${apiBase}/api/ai/toggle-public`, {
            method: 'POST',
            headers: { 
                'Authorization': getToken() as any, 
                'Content-Type': 'application/json',
                "User-Client": (global as any)?.clientId1328 
            },
            body: JSON.stringify({ id, is_public: !currentStatus, type: 'video' })
        });
        const data = await res.json();
        if (data.success) {
            toast.success(currentStatus ? 'تمت الإزالة من المعرض' : 'تم النشر في معرض المحترفين!');
            setUserVideos(prev => prev.map(vid => vid.id === id ? { ...vid, is_public: !currentStatus } : vid));
            if (selectedVideoModal?.id === id) setSelectedVideoModal({ ...selectedVideoModal, is_public: !currentStatus });
        }
    } catch (e) {
        toast.error('فشلت العملية');
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="h-screen flex flex-col bg-[#06070B] text-white selection:bg-emerald-500/30 overflow-hidden no-scrollbar" dir="rtl">
        {/* Unified AI Tool Header */}
        <AIToolHeader
          title="استوديو تحريك الصور"
          description="إضافة حركات سينمائية ديناميكية وكاميرا متحركة على الصور الثابتة"
          badge="AI Motion Studio"
          icon={Film}
          iconGradient="from-emerald-600 to-teal-600"
          userCredits={balance?.remaining_credits}
          onUpgradeClick={() => setShowBuyModal(true)}
          backHref="/ai"
        />

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Control Sidebar */}
            <aside className="w-full lg:w-[380px] h-[calc(100vh-3.5rem)] border-b lg:border-b-0 lg:border-l border-white/[0.08] bg-[#0B0D14] p-5 overflow-hidden flex flex-col justify-between shrink-0 z-30 shadow-2xl relative">
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-0.5 pb-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-black text-white">تحريك الصور</h2>
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                             <ImageIcon size={14} className="text-emerald-400" />
                             الصورة المراد تحريكها
                        </label>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="motion-up" />
                        {imageFile ? (
                            <div className="relative group rounded-xl overflow-hidden border border-white/[0.08] aspect-video">
                                <img src={imageFile} alt="Source" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                                    <label htmlFor="motion-up" className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs cursor-pointer text-white border border-white/10 backdrop-blur-md transition-all font-bold">
                                        تغيير
                                    </label>
                                    <button onClick={() => setImageFile(null)} className="p-1.5 bg-red-500/20 hover:bg-red-500 text-white rounded-lg transition-all">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <label htmlFor="motion-up" className="flex flex-col items-center justify-center border-2 border-dashed border-white/[0.08] hover:border-emerald-500/50 rounded-2xl p-6 cursor-pointer bg-[#121520] hover:bg-[#161a27] transition-all group aspect-video">
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-2 text-emerald-400 group-hover:scale-110 transition-transform">
                                    <Upload size={20} />
                                </div>
                                <span className="text-xs font-bold text-gray-300">رفع صورة من جهازك</span>
                                <span className="text-[10px] text-gray-500 mt-1">PNG, JPG حتى 10MB</span>
                            </label>
                        )}
                    </div>

                    {/* Prompt Box */}
                    <div className="relative rounded-xl border border-white/[0.08] bg-[#121520] p-3 focus-within:border-emerald-500/50 transition-all shadow-inner">
                        <label className="text-[10px] font-bold text-gray-400 block mb-1">وصف الحركة (اختياري)</label>
                        <textarea
                            ref={promptRef}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="مثال: حرك الكاميرا ببطء للأمام مع هبوب رياح لطيفة..."
                            rows={3}
                            className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-gray-500 outline-none resize-none leading-relaxed custom-scrollbar pb-6"
                        />
                        <div className="absolute bottom-2 left-2">
                            <button
                                type="button"
                                onClick={async () => {
                                    if (!prompt.trim()) return;
                                    toast.success("تم تحسين الوصف تلقائياً");
                                }}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-white text-[10px] font-bold transition-all disabled:opacity-40"
                            >
                                <Sparkles size={11} className="text-yellow-400" />
                                <span>تحسين</span>
                            </button>
                        </div>
                    </div>

                    {/* Model Selector Component */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 block">نموذج التحريك</label>
                        <ModelSelector
                            models={MOTION_MODELS}
                            selectedModelId={selectedModelId}
                            onSelectModel={setSelectedModelId}
                            duration={duration}
                            profit={balance?.plan?.video_profit || 0}
                            compact={true}
                        />
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
                        disabled={!imageFile}
                        cost={creditsNeeded}
                        label="إنشاء"
                        generatingLabel="جاري الإنشاء..."
                        icon={Film}
                        variant="emerald"
                    />
                </div>
            </aside>

            {/* Main Content - Gallery */}
            <main className="flex-1 flex flex-col bg-[#06070B] overflow-hidden">
                <div className="flex-1 min-h-0 flex flex-col p-6 overflow-hidden">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                <History size={16} className="text-gray-400" />
                            </div>
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">معرض الحركة</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-600 uppercase">{userVideos.length} MOTION(S) FOUND</span>
                            {userVideos.length > 0 && (
                                <button
                                    onClick={() => setDeleteModal({ isOpen: true, type: 'all', id: null })}
                                    className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-all flex items-center gap-1.5"
                                >
                                    <Trash2 size={12} />
                                    <span>حذف جميع النتائج</span>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            
                            {/* Loading Card */}
                            {isProcessing && (
                                <AIGenerationCard progress={processingProgress} aspectRatio="aspect-video" icon={Film} />
                            )}

                            {userVideos.map((vid) => (
                                <div 
                                    key={vid.id} 
                                    onClick={() => setSelectedVideoModal(vid)} 
                                    className="group relative rounded-2xl overflow-hidden bg-black border cursor-pointer transition-all duration-300 hover:scale-[1.02] aspect-video border-white/5 hover:border-white/10 flex items-center justify-center"
                                >
                                    {vid.thumbnail ? (
                                        <img src={vid.thumbnail} className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
                                    ) : (
                                        <video 
                                            src={vid.url + "#t=1"} 
                                            className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" 
                                            muted 
                                            preload="metadata"
                                            onMouseOver={e => (e.target as HTMLVideoElement).play()}
                                            onMouseOut={e => { (e.target as HTMLVideoElement).pause(); (e.target as HTMLVideoElement).currentTime = 0; }}
                                        />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-[9px] text-white line-clamp-1 mb-1 font-medium">{vid.prompt || 'حركة تلقائية'}</p>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[8px] text-gray-500">{new Date(vid.date).toLocaleDateString('ar-EG')}</span>
                                            <div className="flex gap-1.5">
                                                <button onClick={(e) => { e.stopPropagation(); setSelectedVideoModal(vid); }} className="p-1 rounded-md bg-white/10 hover:bg-white hover:text-black transition-colors">
                                                    <Maximize2 size={10} />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); setDeleteModal({ isOpen: true, type: 'single', id: vid.id }); }} className="p-1 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors">
                                                    <Trash2 size={10} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>

        {/* Unified AI Result Modal */}
        <AIResultModal
          isOpen={!!selectedVideoModal}
          onClose={() => setSelectedVideoModal(null)}
          mediaUrl={selectedVideoModal?.url || null}
          mediaType="video"
          mediaId={selectedVideoModal?.id}
          isPublic={selectedVideoModal?.is_public}
          onDelete={() => selectedVideoModal && setDeleteModal({ isOpen: true, type: 'single', id: selectedVideoModal.id })}
          title="تحريك الصور بالذكاء الاصطناعي (Image to Motion)"
          subtitle="فيديو سينمائي متحرك تم توليده من صورة ثابتة"
          prompt={selectedVideoModal?.prompt}
          details={[
            { label: "الوصف", value: selectedVideoModal?.prompt || "تحريك الصورة" },
            { label: "الدقة", value: "1080p HD" },
            { label: "التاريخ", value: selectedVideoModal?.date ? new Date(selectedVideoModal.date).toLocaleDateString('ar-EG') : "" },
          ]}
        />


        {/* Buy Credits Modal */}
        {showBuyModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <div className="bg-[#111] rounded-3xl w-full max-w-lg border border-white/10 overflow-hidden relative" dir="rtl">
              <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
              
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400">
                      <Crown size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-white">شراء رصيد إضافي</h2>
                </div>
                <button onClick={() => setShowBuyModal(false)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              
              <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {loadingPlans ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <div className="text-gray-400">جاري تحميل الخطط...</div>
                  </div>
                ) : plans.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">لا توجد خطط متاحة حالياً</div>
                ) : (
                  <div className="space-y-4">
                    {plans.map((p: any) => (
                      <button
                        key={p.plan_id}
                        onClick={() => {
                          setSelectedPlan(p);
                          setShowBuyModal(false);
                          setOpenPaymentModal(true);
                        }}
                        className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-right transition-all duration-300 border border-white/5 hover:border-blue-500/50 group"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-white text-lg group-hover:text-blue-400 transition-colors">{p.plan_name}</div>
                            <div className="text-gray-400 text-sm mt-1">{p.credits_per_period} نقطة رصيد / {p.period}</div>
                          </div>
                          <div className="text-white font-bold text-xl bg-white/10 px-3 py-1 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-all">
                              {p.amount} <span className="bg-gradient-to-r from-[#FF0000] via-[#FFFFFF] to-[#000000] bg-clip-text text-transparent font-bold">IQD</span>
                          </div>
                        </div>
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
                        modalOpen={openPaymentModal}
                        setModalOpen={setOpenPaymentModal}
                        productType="credits"
                        period={selectedPlan.period as any}
                        productId={selectedPlan.plan_id}
                        productData={{
                            tool_name: selectedPlan.plan_name,
                            pack_name: selectedPlan.plan_name,
                            monthly_price: selectedPlan.amount,
                            yearly_price: selectedPlan.amount,
                            tool_day_price: selectedPlan.amount,
                            amount: selectedPlan.amount,
                        }}
                        onBuySuccess={() => {
                            setOpenPaymentModal(false);
                            fetchBalance();
                        }}
                    />
                </div>
            </div>
        )}

        {/* Upgrade Modal */}
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