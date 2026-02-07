"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import PaymentModal from "@/components/Modals/PaymentModal";
import UpgradeModal from "@/components/Modals/UpgradeModal";
import Link from "next/link";
import { toast, Toaster } from 'react-hot-toast';
import { 
  ArrowRight, Video, Download, X, Sparkles, Play, Film, Camera, 
  Palette, Zap, CreditCard, Crown, RefreshCw, Trash2, Maximize2, 
  Plus, Settings2, Clock, History, MonitorPlay, Upload, XCircle, Image as ImageIcon, Coins, Cpu,
  Monitor, Smartphone, Square, Tv
} from 'lucide-react';
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
import { VIDEO_MODELS, VideoModel, calculateVideoCost, syncVideoWithDynamicPricing } from '@/lib/ai-models-config';
import { ModelSelector } from '@/components/ModelSelector';
import { processVideoPrompt } from '@/lib/prompt-utils';

type CreditsRecord = {
  remaining_credits: number;
  plan?: { video_profit: number; };
};

const VIDEO_STYLES = [
  { label: "سينمائي", value: "cinematic style", icon: <Film size={14} /> },
  { label: "واقعي", value: "photorealistic", icon: <Camera size={14} /> },
  { label: "أنمي", value: "animated style", icon: <Palette size={14} /> },
  { label: "إبداعي", value: "artistic style", icon: <Sparkles size={14} /> },
];

const ASPECT_RATIOS = [
  { label: "16:9", value: "16:9", icon: <Monitor size={14} /> },
  { label: "9:16", value: "9:16", icon: <Smartphone size={14} /> },
  { label: "1:1", value: "1:1", icon: <Square size={14} /> },
  { label: "4:3", value: "4:3", icon: <Tv size={14} /> },
];

export default function VideoGenerationPage() {
  const [balance, setBalance] = useState<CreditsRecord | null>(null);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState(VIDEO_STYLES[0].value);
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0].value);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  
  // Model Selection State
  const [selectedModelId, setSelectedModelId] = useState(VIDEO_MODELS[0].id);
  const [dynamicPrices, setDynamicPrices] = useState<Record<string, number>>({});

  const dynamicModels = useMemo(() => {
    return syncVideoWithDynamicPricing(VIDEO_MODELS, dynamicPrices);
  }, [dynamicPrices]);

  const selectedModel = dynamicModels.find(m => m.id === selectedModelId) || dynamicModels[0];

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
  // Calculate cost based on selected model + duration + profit margin
  const creditsNeeded = calculateVideoCost(selectedModel, duration, videoProfit);

  // Reference Image/Video State
  const [referenceMedia, setReferenceMedia] = useState<string | null>(null);
  const [referenceType, setReferenceType] = useState<'image' | 'video' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userVideos, setUserVideos] = useState<any[]>([]);
  const [activeVideo, setActiveVideo] = useState<any | null>(null);
  const [selectedVideoModal, setSelectedVideoModal] = useState<any | null>(null);

  const [plans, setPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL, []);
  
  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem("a") : null;

  const fetchBalance = async () => {
    if (!apiBase) return;
    try {
      const res = await fetch(`${apiBase}/api/credits/me/balance`, { headers: { 'Authorization': getToken() as any, "User-Client": (global as any)?.clientId1328 } });
      if (res.status === 200) setBalance(await res.json());
    } catch (e) {}
  };

  const fetchUserVideos = async () => {
    if (!apiBase) return;
    try {
      const res = await fetch(`${apiBase}/api/ai/user-videos?limit=24&tool=text-to-video`, {
        headers: { 'Authorization': getToken() as any, "User-Client": (global as any)?.clientId1328 }
      });
      if (res.status === 200) {
        const data = await res.json();
        if (data.success) {
           const videos = data.videos.map((vid: any) => ({
            id: vid.video_id, url: vid.video_url || vid.cloudinary_url, date: vid.created_at, prompt: vid.prompt, thumbnail: vid.thumbnail_url,
            is_public: vid.is_public
          }));
          setUserVideos(videos);
        }
      }
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
          fetchUserVideos();
          loadPlans();
          loadDynamicPricing();
        }
      } catch (e) {}
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

  const onGenerate = async () => {
    if (!apiBase || !prompt) return;
    
    // فحص الرصيد
    if (!balance || balance.remaining_credits < creditsNeeded) {
      setShowUpgradeModal(true);
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setGenerationProgress(0);
    
    let progressValue = 0;
    const interval = setInterval(() => {
      progressValue += Math.random() * 1.5 + 0.2;
      if (progressValue >= 95) { clearInterval(interval); progressValue = 95; }
      setGenerationProgress(progressValue);
    }, 1000);
    
    try {
      // معالجة البرومبت العربي وتحسينه للفيديو
      const processedPrompt = processVideoPrompt(prompt, style);
      
      console.log('[VIDEO] Sending generation request with:', {
        model: selectedModelId,
        duration: duration,
        expectedCost: creditsNeeded,
        originalPrompt: prompt,
        processedPrompt: processedPrompt
      });
      
      const res = await fetch(`${apiBase}/api/ai/text-to-video`, {
        method: "POST",
        headers: { 'Authorization': getToken() as any, 'Content-Type': 'application/json', "User-Client": (global as any)?.clientId1328 },
        body: JSON.stringify({ 
          prompt: processedPrompt, // استخدام البرومبت المحسّن
          style, 
          duration,
          model: selectedModelId, // إرسال النموذج المختار
          reference_media: referenceMedia, // إرسال الصورة/الفيديو المرجعي
          reference_type: referenceType,
          aspect_ratio: aspectRatio
        }),
      });
      
      clearInterval(interval);
      setGenerationProgress(100);
      
      if (res.status === 200) {
        const data = await res.json();
        console.log('[VIDEO] Generation successful, credits used:', data.credits_used);
        toast.success('تم إنشاء الفيديو بنجاح!');
        fetchBalance();
        if (data.video_url) {
            const newVid = { id: data.video_id, url: data.video_url, date: new Date(), prompt: prompt, thumbnail: null };
            setActiveVideo(newVid);
        }
        fetchUserVideos();
      } else {
        setError(await res.text() || 'فشلت العملية');
      }
    } catch (e) {
      clearInterval(interval);
      setError('خطأ في الاتصال');
    } finally { setIsGenerating(false); }
  };

  const deleteVideo = async (id: number, e?: React.MouseEvent) => {
    if(e) e.stopPropagation();
    const prev = [...userVideos];
    setUserVideos(userVideos.filter(v => v.id !== id));
    if (activeVideo?.id === id) setActiveVideo(userVideos.find(v => v.id !== id) || null);
    if (selectedVideoModal?.id === id) setSelectedVideoModal(null);
    try {
      await fetch(`${apiBase}/api/ai/user-videos/${id}`, { method: 'DELETE', headers: { 'Authorization': getToken() as any, "User-Client": (global as any)?.clientId1328 } });
      toast.success('تم الحذف');
    } catch (e) { setUserVideos(prev); }
  };

  const togglePublicStatus = async (id: number, currentStatus: boolean, type: 'image' | 'video') => {
    if (!apiBase) return;
    try {
        const res = await fetch(`${apiBase}/api/ai/toggle-public`, {
            method: 'POST',
            headers: { 
                'Authorization': getToken() as any, 
                'Content-Type': 'application/json',
                "User-Client": (global as any)?.clientId1328 
            },
            body: JSON.stringify({ id, is_public: !currentStatus, type })
        });
        const data = await res.json();
        if (data.success) {
            toast.success(currentStatus ? 'تمت الإزالة من المعرض' : 'تم النشر في معرض المحترفين!');
            if (type === 'video') {
                setUserVideos(prev => prev.map(vid => vid.id === id ? { ...vid, is_public: !currentStatus } : vid));
                if (activeVideo?.id === id) setActiveVideo({ ...activeVideo, is_public: !currentStatus });
                if (selectedVideoModal?.id === id) setSelectedVideoModal({ ...selectedVideoModal, is_public: !currentStatus });
            }
        }
    } catch (e) {
        toast.error('فشلت العملية');
    }
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      toast.error('يرجى اختيار صورة أو فيديو');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('حجم الملف كبير جداً (الحد الأقصى 50MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setReferenceMedia(event.target?.result as string);
      setReferenceType(isImage ? 'image' : 'video');
      toast.success(`تم رفع ${isImage ? 'الصورة' : 'الفيديو'} المرجعي`);
    };
    reader.readAsDataURL(file);
  };

  const removeReferenceMedia = () => {
    setReferenceMedia(null);
    setReferenceType(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.success('تم إزالة الملف المرجعي');
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="h-screen flex flex-col bg-[#010101] text-white selection:bg-blue-500/30 overflow-hidden no-scrollbar" dir="rtl">
        <header className="shrink-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 px-6 py-3 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/ai" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 font-bold text-xs transition-all"><ArrowRight size={14} /> عودة</Link>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-6 bg-blue-600 rounded-full animate-pulse"></div>
                <h1 className="text-sm font-black tracking-tight uppercase">AI Digital Cinema</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2">
                <CreditCard size={12} className="text-blue-400" />
                <span className="text-sm font-bold text-blue-400">{balance?.remaining_credits || 0}</span>
              </div>
              <button onClick={() => setShowBuyModal(true)} className="bg-blue-600 px-4 py-1.5 rounded-lg text-[10px] font-black hover:bg-blue-700 transition-all flex items-center gap-2"><Crown size={12} /> شراء</button>
            </div>
        </header>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Control Sidebar */}
            <aside className="w-full lg:w-[300px] h-auto max-h-[35vh] lg:max-h-full lg:h-full border-b lg:border-b-0 lg:border-l border-white/10 bg-[#050505] overflow-y-auto no-scrollbar flex flex-col shrink-0 order-1">
                <div className="p-4 space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                             <Sparkles size={12} className="text-blue-400" />
                             المشهد المتخيّل
                        </label>
                        <div className="relative">
                            <textarea 
                                ref={promptRef}
                                value={prompt} 
                                onChange={(e) => setPrompt(e.target.value)} 
                                placeholder="صف المشهد السينمائي الذي تريده..." 
                                maxLength={20000}
                                className="w-full min-h-[80px] p-3 rounded-lg bg-white/[0.03] border border-white/5 focus:border-blue-500/40 outline-none resize-none transition-all text-xs leading-relaxed placeholder:text-gray-600 shadow-inner overflow-hidden" 
                            />
                        </div>
                        <div className="flex justify-between items-center px-1">
                            <div className="text-[9px] text-gray-600">
                                {/* تم إخفاء الربح */}
                            </div>
                            <div className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-gray-500 border border-white/5">
                                {prompt.length}/20000 حرف
                            </div>
                        </div>
                    </div>

                    {/* Reference Media Upload Section */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <Upload size={12} className="text-blue-400" />
                            مرجع (اختياري)
                        </label>
                        {!referenceMedia ? (
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="relative group cursor-pointer"
                            >
                                <div className="w-full h-20 rounded-lg bg-white/[0.03] border-2 border-dashed border-white/5 hover:border-blue-500/40 transition-all flex flex-col items-center justify-center gap-1 hover:bg-white/[0.05]">
                                    <Upload size={18} className="text-gray-600 group-hover:text-blue-400 transition-colors" />
                                    <span className="text-[10px] text-gray-600 group-hover:text-blue-300 transition-colors font-bold">ارفع ملف</span>
                                </div>
                                <input 
                                    ref={fileInputRef}
                                    type="file" 
                                    accept="image/*,video/*" 
                                    onChange={handleMediaUpload}
                                    className="hidden"
                                />
                            </div>
                        ) : (
                            <div className="relative group">
                                {referenceType === 'image' ? (
                                    <img 
                                        src={referenceMedia} 
                                        alt="Reference" 
                                        className="w-full h-20 object-cover rounded-lg border border-white/10"
                                    />
                                ) : (
                                    <video 
                                        src={referenceMedia} 
                                        className="w-full h-20 object-cover rounded-lg border border-white/10"
                                        muted
                                        loop
                                        autoPlay
                                    />
                                )}
                                <button
                                    onClick={removeReferenceMedia}
                                    className="absolute top-1 left-1 p-1 bg-red-500/80 hover:bg-red-500 rounded transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <XCircle size={12} />
                                </button>
                                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 rounded-lg text-[8px] text-blue-400 font-black flex items-center gap-1 border border-blue-500/30">
                                    {referenceType === 'image' ? <ImageIcon size={8} /> : <Video size={8} />}
                                    ✓ مرجع
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                         <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <Palette size={12} className="text-blue-400" />
                            نمط الإخراج
                         </label>
                         <div className="grid grid-cols-2 gap-2">
                             {VIDEO_STYLES.map(s => (
                                 <button key={s.value} onClick={() => setStyle(s.value)} className={`flex items-center gap-2 p-2 rounded-xl border text-right transition-all group ${style === s.value ? 'bg-blue-500/10 border-blue-500/40 text-blue-300' : 'bg-white/[0.02] border-white/5 text-gray-500 hover:bg-white/10'}`}>
                                     <span className={`shrink-0 ${style === s.value ? 'text-blue-500' : 'text-gray-600'}`}>
                                        {React.cloneElement(s.icon as React.ReactElement, { size: 12 })}
                                     </span>
                                     <span className="text-[10px] font-bold truncate">{s.label}</span>
                                 </button>
                             ))}
                         </div>
                    </div>

                    <div className="space-y-2">
                         <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <Monitor size={12} className="text-blue-400" />
                             أبعاد الفيديو
                         </label>
                         <div className="grid grid-cols-4 gap-2">
                             {ASPECT_RATIOS.map(r => (
                                 <button 
                                    key={r.value} 
                                    onClick={() => setAspectRatio(r.value)} 
                                    className={`p-2 rounded-xl border text-center transition-all group flex flex-col items-center gap-1 ${aspectRatio === r.value ? 'bg-blue-500/10 border-blue-500/40 text-blue-400' : 'bg-white/[0.02] border-white/5 text-gray-500 hover:bg-white/10'}`}
                                 >
                                     <span className={`${aspectRatio === r.value ? 'text-blue-500' : 'text-gray-600'}`}>
                                        {React.cloneElement(r.icon, { size: 16 })}
                                     </span>
                                     <span className="text-[10px] font-bold">{r.label}</span>
                                 </button>
                             ))}
                         </div>
                    </div>

                    <div className="space-y-2">
                         <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <Clock size={12} className="text-blue-400" />
                            المدة
                         </label>
                         <div className="grid grid-cols-3 gap-2">
                             {availableDurations.map(d => {
                                 const cost = calculateVideoCost(selectedModel, d, videoProfit);
                                 return (
                                     <button key={d} onClick={() => setDuration(d)} className={`p-2 rounded-xl border text-center transition-all group ${duration === d ? 'bg-blue-500/10 border-blue-500/40 text-blue-400' : 'bg-white/[0.02] border-white/5 text-gray-500 hover:bg-white/10'}`}>
                                         <span className="text-[10px] font-bold block">{d} ثوانٍ</span>
                                         <div className="flex items-center justify-center gap-1 mt-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[8px] font-black">{cost}</span>
                                            <Coins size={8} className="text-yellow-500" />
                                         </div>
                                     </button>
                                 );
                             })}
                         </div>
                    </div>

                    {/* Model Selection Section */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <Cpu size={12} className="text-blue-400" />
                            اختر النموذج
                        </label>
                        <ModelSelector
                            models={dynamicModels}
                            selectedModelId={selectedModelId}
                            onSelectModel={setSelectedModelId}
                            duration={duration}
                            profit={videoProfit}
                            compact={true}
                        />
                    </div>

                </div>

                <div className="mt-auto p-4 border-t border-white/5 bg-[#080808]">
                    {error && <div className="mb-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-[10px] font-bold text-center truncate">{error}</div>}
                    
                    <div className="flex items-center justify-between text-[10px] text-gray-400 mb-2 font-medium bg-white/5 p-2 rounded-lg border border-white/10">
                        <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                <Coins size={10} className="text-yellow-500" />
                            </div>
                            <span>التكلفة المتوقعه:</span>
                        </div>
                        <span className="text-white font-bold text-xs">{creditsNeeded}</span>
                    </div>

                    <PremiumButton label={isGenerating ? "جاري الإنتاج..." : "بدء الإنتاج"} icon={isGenerating ? RefreshCw : Video} onClick={onGenerate} disabled={!prompt || isGenerating} className="w-full py-3 text-xs rounded-xl" />
                </div>
            </aside>

            {/* Main Stage & Gallery */}
            <main className="flex-1 flex flex-col bg-[#020202] overflow-hidden order-2">
                {/* Gallery Section */}
                <div className="flex-1 min-h-0 flex flex-col p-6 overflow-hidden">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                <History size={16} className="text-gray-400" />
                            </div>
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">الأعمال السابقة</h2>
                        </div>
                        <span className="text-[10px] font-bold text-gray-600 uppercase">{userVideos.length} CLIP(S) FOUND</span>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            
                            {/* Loading Card */}
                            {isGenerating && (
                                <div className="relative rounded-2xl overflow-hidden bg-white/5 aspect-video animate-pulse border border-white/10 ring-1 ring-blue-500/30 flex items-center justify-center">
                                    <div className="flex flex-col items-center gap-3">
                                         <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                         <span className="text-xs font-bold text-blue-300">جاري المعالجة...</span>
                                         <span className="text-[10px] text-blue-500/60 font-mono">{Math.floor(generationProgress)}%</span>
                                    </div>
                                </div>
                            )}

                            {userVideos.map((vid) => (
                                <div 
                                    key={vid.id} 
                                    onClick={() => setSelectedVideoModal(vid)} 
                                    className={`group relative rounded-2xl overflow-hidden bg-[#0a0a0a] border cursor-pointer transition-all duration-300 hover:scale-[1.02] aspect-video ${activeVideo?.id === vid.id ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-white/5 hover:border-white/10'}`}
                                >
                                    {vid.thumbnail ? (
                                        <img src={vid.thumbnail} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
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
                                        <p className="text-[9px] text-white line-clamp-1 mb-1 font-medium">{vid.prompt}</p>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[8px] text-gray-500">{new Date(vid.date).toLocaleDateString('ar-EG')}</span>
                                            <div className="flex gap-1.5">
                                                <button onClick={(e) => { e.stopPropagation(); setSelectedVideoModal(vid); }} className="p-1 rounded-md bg-white/10 hover:bg-white hover:text-black transition-colors"><Maximize2 size={10} /></button>
                                                <button onClick={(e) => deleteVideo(vid.id, e)} className="p-1 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={10} /></button>
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

        {/* Detailed Modal (Only for Fullscreen View) */}
        {selectedVideoModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-300" dir="rtl">
                <button onClick={() => setSelectedVideoModal(null)} className="absolute top-6 right-6 p-4 bg-white/10 rounded-full hover:bg-white/20 transition-all z-20 group">
                    <X size={24} className="group-hover:rotate-90 transition-transform" />
                </button>
                <div className="relative w-full h-full max-w-6xl flex items-center justify-center gap-8">
                    <div className="flex-1 h-full rounded-[3rem] bg-black/50 border border-white/10 overflow-hidden flex flex-col shadow-2xl">
                        <div className="flex-1 flex items-center justify-center overflow-hidden">
                            <video src={selectedVideoModal.url} controls autoPlay className="max-h-full max-w-full" />
                        </div>
                        {/* Mobile Buttons */}
                        <div className="lg:hidden p-6 bg-[#0c0c0c] border-t border-white/10 space-y-3">
                            <button 
                                onClick={() => togglePublicStatus(selectedVideoModal.id, selectedVideoModal.is_public, 'video')}
                                className={`w-full py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 border ${
                                    selectedVideoModal.is_public 
                                    ? 'bg-blue-600/10 border-blue-500/40 text-blue-400' 
                                    : 'bg-white/5 border-white/10 text-white'
                                }`}
                             >
                                <Sparkles size={20} className={selectedVideoModal.is_public ? 'animate-pulse' : ''} />
                                {selectedVideoModal.is_public ? 'منشور في المعرض' : 'نشر في معرض المحترفين'}
                             </button>
                             <div className="flex gap-2">
                                <button onClick={() => downloadVideo(selectedVideoModal.url, `video_${selectedVideoModal.id}.mp4`)} className="flex-1 py-4 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-2 text-sm transition-all"><Download size={20} /> تحميل</button>
                                <button onClick={(e) => deleteVideo(selectedVideoModal.id, e)} className="px-6 py-4 bg-red-500/10 border border-red-500/20 text-red-500 font-bold rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"><Trash2 size={20} /></button>
                             </div>
                        </div>
                    </div>
                    <div className="w-[400px] shrink-0 h-fit max-h-[85vh] overflow-y-auto custom-scrollbar bg-[#0c0c0c] border border-white/10 rounded-[2.5rem] p-8 hidden lg:flex flex-col shadow-2xl relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                        <h3 className="text-xs font-black text-gray-500 mb-6 uppercase tracking-widest">تحليل البيانات</h3>
                        <div className="flex-1 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-blue-500 uppercase tracking-tighter">وصف الفيديو</label>
                                <div className="bg-white/5 p-5 rounded-2xl text-xs text-gray-300 leading-relaxed font-bold border border-white/5">{selectedVideoModal.prompt}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-[10px] font-bold">
                                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                    <span className="text-gray-500 block mb-1">تاريخ الإنشاء</span>
                                    <span>{new Date(selectedVideoModal.date).toLocaleDateString('ar-EG')}</span>
                                </div>
                                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                    <span className="text-gray-500 block mb-1">التنسيق</span>
                                    <span>MP4 / 1080p</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3 pt-6 border-t border-white/10 mt-6">
                             <button 
                                onClick={() => togglePublicStatus(selectedVideoModal.id, selectedVideoModal.is_public, 'video')}
                                className={`w-full py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 border mb-3 ${
                                    selectedVideoModal.is_public 
                                    ? 'bg-blue-600/10 border-blue-500/40 text-blue-400 hover:bg-blue-600/20' 
                                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                                }`}
                             >
                                <Sparkles size={20} className={selectedVideoModal.is_public ? 'animate-pulse' : ''} />
                                {selectedVideoModal.is_public ? 'منشور في المعرض' : 'نشر في معرض المحترفين'}
                             </button>
                             <button onClick={() => downloadVideo(selectedVideoModal.url, `video_${selectedVideoModal.id}.mp4`)} className="w-full py-4 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-2 text-sm hover:scale-[1.02] transition-all shadow-xl"><Download size={20} />  تحميل</button>
                             <button onClick={(e) => deleteVideo(selectedVideoModal.id, e)} className="w-full py-3 bg-red-500/10 border border-red-500/20 text-red-500 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all text-sm"><Trash2 size={18} /> حذف</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Global Modals */}
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
                              ${p.amount}
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
      </div>
    </>
  );
}