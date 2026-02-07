"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import PaymentModal from "@/components/Modals/PaymentModal";
import UpgradeModal from "@/components/Modals/UpgradeModal";
import Link from "next/link";
import { toast, Toaster } from 'react-hot-toast';
import { 
  ArrowRight, Plus, Trash2, Download, X, RefreshCw, 
  CreditCard, Crown, ShieldCheck, 
  Sparkles, Play, Film, MonitorPlay, History, Clock, Maximize2, Video, 
  ChevronLeft, AlertCircle, History as HistoryIcon, Layers, Coins
, Cpu} from 'lucide-react';
import { PremiumButton } from "@/components/PremiumButton";
import { LONG_VIDEO_MODELS, VideoModel, calculateVideoCost, syncVideoWithDynamicPricing } from '@/lib/ai-models-config';
import { ModelSelector } from '@/components/ModelSelector';

type CreditsRecord = {
  remaining_credits: number;
  plan?: { video_profit: number; };
};

interface Scene {
  id: string;
  prompt: string;
  duration: number;
}

export default function LongVideoPage() {
  const [balance, setBalance] = useState<CreditsRecord | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([{ id: '1', prompt: '', duration: 5 }]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Model Selection State
  const [selectedModelId, setSelectedModelId] = useState(LONG_VIDEO_MODELS[0].id);
  const [dynamicPrices, setDynamicPrices] = useState<Record<string, number>>({});

  const dynamicModels = useMemo(() => {
    return syncVideoWithDynamicPricing(LONG_VIDEO_MODELS, dynamicPrices);
  }, [dynamicPrices]);

  const selectedModel = dynamicModels.find(m => m.id === selectedModelId) || dynamicModels[0];

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
      const res = await fetch(`${apiBase}/api/ai/user-videos?limit=24&tool=long_video`, {
        headers: { 'Authorization': getToken() as any, "User-Client": (global as any)?.clientId1328 }
      });
      if (res.status === 200) {
        const data = await res.json();
        if (data.success) {
          const videos = data.videos.map((vid: any) => ({
            id: vid.video_id, url: vid.video_url || vid.cloudinary_url, date: vid.created_at, prompt: vid.prompt, thumbnail: vid.thumbnail_url,
            is_public: vid.is_public,
            metadata: vid.metadata
          }));
          setUserVideos(videos);
        }
      }
    } catch (e) {}
  };

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

  const addScene = () => {
    if (scenes.length >= 10) {
      toast.error("الحد الأقصى هو 10 مشاهد فقط");
      return;
    }
    const defaultDuration = selectedModel.supportedDurations ? selectedModel.supportedDurations[0] : 5;
    setScenes([...scenes, { id: Date.now().toString(), prompt: '', duration: defaultDuration }]);
  };

  const removeScene = (id: string) => scenes.length > 1 && setScenes(scenes.filter(s => s.id !== id));
  const updateScene = (id: string, field: keyof Scene, value: any) => setScenes(scenes.map(s => s.id === id ? { ...s, [field]: value } : s));

  const onGenerate = async () => {
    const validScenes = scenes.filter(s => s.prompt.trim());
    if (!apiBase || validScenes.length === 0) return;
    
    // Calculate total duration of all scenes
    const totalDuration = validScenes.reduce((sum, scene) => sum + scene.duration, 0);
    const videoProfit = balance?.plan?.video_profit ?? 0;
    // Use the model's cost per second calculation
    const creditsNeeded = calculateVideoCost(selectedModel, totalDuration, videoProfit);

    if (!balance || balance.remaining_credits < creditsNeeded) {
      setShowUpgradeModal(true);
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setGenerationProgress(0);
    
    // Estimate progress
    const estimatedTime = validScenes.length * 40; 
    let progress = 0;
    const interval = setInterval(() => {
      progress += (95 / estimatedTime);
      if (progress >= 95) {
        progress = 95;
        clearInterval(interval);
      }
      setGenerationProgress(progress);
    }, 1000);
    
    try {
      const res = await fetch(`${apiBase}/api/ai/long-video`, {
        method: "POST",
        headers: { 'Authorization': getToken() as any, 'Content-Type': 'application/json', "User-Client": (global as any)?.clientId1328 },
        body: JSON.stringify({ 
          scenes: validScenes, 
          model: selectedModelId // إرسال النموذج المختار
        }),
      });
      
      clearInterval(interval);
      setGenerationProgress(100);
      
      const data = await res.json();
      if (data.success) {
        toast.success(`تم إنتاج الفيلم بنجاح! (${validScenes.length} مشاهد مدمجة)`);
        fetchBalance();
        fetchUserVideos();
        if (data.video_url) {
            const newVid = { 
              id: data.video_id, 
              url: data.video_url, 
              date: new Date(), 
              prompt: `Long Video (${validScenes.length} scenes)`, 
              thumbnail: data.thumbnail_url || data.metadata?.thumbnail_url,
              is_public: false
            };
            setSelectedVideoModal(newVid);
        }
      } else {
        setError(data.message || 'فشلت العملية');
        toast.error(data.message || 'فشلت العملية');
      }
    } catch (e: any) {
      clearInterval(interval);
      setError(e.message || 'خطأ في الاتصال');
      toast.error(e.message || 'خطأ في الاتصال');
    } finally { 
      setIsGenerating(false); 
      setGenerationProgress(0);
    }
  };

  const deleteVideo = async (id: number, e?: React.MouseEvent) => {
    if(e) e.stopPropagation();
    const prev = [...userVideos];
    setUserVideos(userVideos.filter(v => v.id !== id));
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
            headers: { 'Authorization': getToken() as any, 'Content-Type': 'application/json', "User-Client": (global as any)?.clientId1328 },
            body: JSON.stringify({ id, is_public: !currentStatus, type })
        });
        const data = await res.json();
        if (data.success) {
            toast.success(currentStatus ? 'تمت الإزالة من المعرض' : 'تم النشر في معرض المحترفين!');
            setUserVideos(prev => prev.map(vid => vid.id === id ? { ...vid, is_public: !currentStatus } : vid));
            if (selectedVideoModal?.id === id) setSelectedVideoModal({ ...selectedVideoModal, is_public: !currentStatus });
        }
    } catch (e) { toast.error('فشلت العملية'); }
  };

    // حساب التكلفة المتوقعة لكل المشاهد
    const totalDuration = scenes.filter(s => s.prompt.trim()).reduce((sum, scene) => sum + scene.duration, 0) || 5;
    const videoProfit = balance?.plan?.video_profit ?? 0;
    const creditsNeeded = calculateVideoCost(selectedModel, totalDuration, videoProfit);

  return (
    <>
      <Toaster position="top-right" />
      <div className="h-screen flex flex-col bg-[#000000] text-white selection:bg-indigo-500/30 font-sans overflow-hidden" dir="rtl">
        {/* Background Ambient */}
        <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none z-0"></div>
        
        {/* Header */}
        <header className="shrink-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
            <div className="px-6 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/ai" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300 border border-white/10">
                            <ArrowRight size={16} />
                            <span className="text-sm font-bold">عودة</span>
                        </Link>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-8 bg-indigo-600 rounded-full"></span>
                            <h1 className="text-lg font-bold">مخرج الأفلام الذكي</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                            <CreditCard size={12} className="text-indigo-400" />
                            <span className="text-xs text-gray-300">الرصيد المتبقي:</span>
                            <span className="text-sm font-bold text-indigo-400">{balance?.remaining_credits || 0}</span>
                        </div>
                        <button onClick={() => setShowBuyModal(true)} className="relative inline-flex h-8 active:scale-95 transition overflow-hidden rounded-lg p-[1px] focus:outline-none">
                            <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#4f46e5_0%,#818cf8_50%,#4f46e5_100%)]"></span>
                            <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-lg bg-[#050505] px-3 text-[10px] font-black text-white backdrop-blur-3xl gap-1.5 transition-all hover:bg-black/40">
                                <Crown size={12} className="text-indigo-400" />
                                شراء رصيد
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
            
            {/* Sidebar (Settings) */}
            <aside className="w-[280px] md:w-[300px] flex flex-col border-l border-white/10 bg-[#050505] overflow-y-auto no-scrollbar shrink-0">
                <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                             إدارة المشاهد
                        </label>
                        <button 
                            onClick={addScene} 
                            disabled={scenes.length >= 10}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all font-black text-[9px] border ${scenes.length >= 10 ? 'opacity-20 cursor-not-allowed bg-white/5 border-white/10 text-gray-400' : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border-indigo-500/20'}`}
                        >
                            <Plus size={12} /> مشهد جديد
                        </button>
                    </div>

                    <div className="space-y-3">
                        {scenes.map((s, idx) => (
                            <div key={s.id} className="group/scene p-4 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/20 transition-all duration-300 relative">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-[9px] font-black border border-indigo-500/10">{idx + 1}</span>
                                        <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em]">Sequence</span>
                                    </div>
                                    {scenes.length > 1 && (
                                        <button onClick={() => removeScene(s.id)} className="p-1 text-red-500/30 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </div>
                                <textarea 
                                    value={s.prompt}
                                    onChange={(e) => updateScene(s.id, 'prompt', e.target.value)}
                                    placeholder="صف تفاصيل هذا المشهد..."
                                    className="w-full bg-transparent border-none focus:ring-0 text-xs font-medium text-white resize-none h-16 outline-none placeholder:text-gray-800 leading-relaxed scrollbar-hide"
                                />
                                <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                                    <Clock size={10} className="text-gray-700" />
                                    <select 
                                        value={s.duration} 
                                        onChange={(e) => updateScene(s.id, 'duration', Number(e.target.value))} 
                                        className="bg-transparent text-[9px] font-black text-gray-500 outline-none cursor-pointer hover:text-indigo-400 transition-colors"
                                    >
                                        {(selectedModel.supportedDurations || [5, 10]).map(dur => (
                                            <option key={dur} value={dur} className="bg-[#0c0c0c]">{dur} ثوانٍ</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Model Selection Section */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <Cpu size={12} className="text-indigo-400" />
                            اختر النموذج
                        </label>
                        <ModelSelector
                            models={dynamicModels}
                            selectedModelId={selectedModelId}
                            onSelectModel={setSelectedModelId}
                            duration={totalDuration}
                            profit={videoProfit}
                            compact={true}
                        />
                    </div>
                </div>

                {/* Generate Button at Bottom */}
                <div className="p-4 mt-auto border-t border-white/10 bg-[#080808]">
                     {error && (
                        <div className="mb-2 p-1.5 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-[9px] font-bold truncate">
                            <AlertCircle size={14} />
                            <span>{error}</span>
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
                        label={isGenerating ? "جاري الإخراج والدمج..." : "توليد العمل المتكامل"}
                        icon={isGenerating ? RefreshCw : Film}
                        onClick={onGenerate}
                        disabled={isGenerating || scenes.every(s => !s.prompt.trim())}
                        className="w-full py-3 text-xs rounded-xl"
                      />
                </div>
            </aside>

            {/* Left Main Area (Gallery) */}
            <main className="flex-1 overflow-y-auto bg-[#020202] p-8 no-scrollbar relative">
                
                {/* Section Header */}
                <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-gray-400">
                            <HistoryIcon size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white">أرشيف إنتاجاتك</h2>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">AI Cinema History Cabinet</p>
                        </div>
                    </div>
                </div>

                {/* Empty State */}
                {!isGenerating && userVideos.length === 0 && (
                     <div className="h-[60vh] flex flex-col items-center justify-center text-center opacity-40">
                        <div className="w-24 h-24 bg-white/[0.02] rounded-[3rem] flex items-center justify-center mb-6 border border-white/5 rotate-12">
                            <MonitorPlay size={48} className="text-white/20" />
                        </div>
                        <h3 className="text-lg font-black text-white uppercase tracking-widest">الأرشيف فارغ</h3>
                        <p className="text-gray-500 max-w-xs text-xs font-bold mt-2">ابدأ بإضافة مشاهدك في القائمة الجانبية لتوليد فيلمك الأول المدمج بذكاء.</p>
                     </div>
                )}
                
                {/* Gallery Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                    
                    {/* Active Generating Card */}
                    {isGenerating && (
                         <div className="relative rounded-[2rem] overflow-hidden bg-[#0a0a0a] aspect-video border border-indigo-500/20 ring-4 ring-indigo-500/5 animate-pulse shadow-2xl">
                             <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-8 text-center bg-black/40 backdrop-blur-sm">
                                 <div className="relative w-12 h-12 mb-6">
                                     <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                                     <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin"></div>
                                 </div>
                                 <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4">جاري الإخراج...</span>
                                 <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                     <div 
                                        className="h-full bg-indigo-500 transition-all duration-300"
                                        style={{ width: `${generationProgress}%` }}
                                     ></div>
                                 </div>
                                 <span className="text-[10px] font-black text-gray-600 mt-2 uppercase tracking-widest">{Math.floor(generationProgress)}% COMPLETE</span>
                             </div>
                         </div>
                    )}

                    {/* Published Cards */}
                    {userVideos.map((vid) => (
                        <div 
                            key={vid.id} 
                            onClick={() => setSelectedVideoModal(vid)}
                            className="group relative rounded-[2rem] overflow-hidden bg-[#080808] border border-white/5 hover:border-indigo-500/30 cursor-pointer transition-all hover:scale-[1.03] shadow-lg hover:shadow-indigo-900/10 aspect-video flex items-center justify-center"
                        >
                            {vid.thumbnail ? (
                                <img src={vid.thumbnail} alt={vid.prompt} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700" />
                            ) : (
                                <video 
                                    src={vid.url} 
                                    className="w-full h-full object-cover opacity-40 group-hover:opacity-80 transition-all duration-700"
                                    muted
                                    playsInline
                                    onMouseEnter={(e) => e.currentTarget.play()}
                                    onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                                />
                            )}
                            
                            {/* Play Overlay (Always visible on empty thumbnails, hover on videos) */}
                            {!vid.thumbnail && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <Play size={32} className="text-white/20 group-hover:text-indigo-500 group-hover:scale-125 transition-all duration-500" />
                                </div>
                            )}
                            
                            {/* Overlay Details */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6">
                                <p className="text-[10px] text-white/90 line-clamp-1 mb-3 font-bold">
                                    {vid.prompt}
                                </p>
                                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                    <span className="text-[9px] text-gray-500 font-black">{new Date(vid.date).toLocaleDateString()}</span>
                                    <div className="flex gap-2">
                                        <button className="p-2 bg-white/10 hover:bg-white text-white hover:text-black rounded-xl transition-all">
                                            <Maximize2 size={12} />
                                        </button>
                                        <button onClick={(e) => deleteVideo(vid.id, e)} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>


        {/* Video Full Modal Viewer */}
        {selectedVideoModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 bg-black/98 backdrop-blur-3xl animate-in fade-in duration-500" dir="rtl">
                <button 
                    onClick={() => setSelectedVideoModal(null)}
                    className="absolute top-8 right-8 p-6 bg-white/5 rounded-[2rem] hover:bg-white/10 transition-all z-20 group border border-white/5"
                >
                    <X size={28} className="group-hover:rotate-90 transition-transform text-white/50 group-hover:text-white" />
                </button>

                <div className="relative w-full h-full max-w-7xl flex gap-12 items-center justify-center">
                    
                    {/* Player Container */}
                    <div className="relative flex-1 h-full flex items-center justify-center overflow-hidden rounded-[4rem] bg-[#030303] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)]">
                         <video 
                            src={selectedVideoModal.url} 
                            controls 
                            autoPlay 
                            className="max-h-full max-w-full" 
                         />
                    </div>

                    {/* Metadata Sidebar */}
                    <div className="w-[400px] shrink-0 h-fit max-h-[700px] bg-[#0a0a0a] border border-white/10 rounded-[4rem] p-12 hidden lg:flex flex-col shadow-2xl relative">
                        <div className="absolute top-0 right-12 w-24 h-1 bg-indigo-500"></div>
                        <h3 className="text-[11px] font-black text-indigo-500 mb-10 uppercase tracking-[0.4em] flex items-center gap-2">
                            <Layers size={14} /> Cinema Asset Details
                        </h3>
                        
                        <div className="space-y-10 overflow-y-auto custom-scrollbar-thin pr-2">
                            <div className="space-y-4">
                                <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest">تسمية العمل</label>
                                <div className="bg-white/[0.03] p-8 rounded-[2.5rem] text-sm text-gray-300 leading-relaxed font-bold border border-white/5">
                                    {selectedVideoModal.prompt}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 bg-white/[0.02] rounded-3xl border border-white/5">
                                    <span className="text-[9px] text-gray-600 block mb-2 uppercase font-black">صدور الإنتاج</span>
                                    <span className="text-xs font-black">{new Date(selectedVideoModal.date).toLocaleDateString()}</span>
                                </div>
                                <div className="p-6 bg-white/[0.02] rounded-3xl border border-white/5">
                                    <span className="text-[9px] text-gray-600 block mb-2 uppercase font-black">جودة الماستر</span>
                                    <span className="text-xs font-black text-green-500">Merged HD</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-12 mt-12 border-t border-white/5 space-y-4">
                             <button 
                                onClick={() => togglePublicStatus(selectedVideoModal.id, selectedVideoModal.is_public, 'video')}
                                className={`w-full py-5 rounded-[1.8rem] font-black transition-all flex items-center justify-center gap-3 border ${
                                    selectedVideoModal.is_public 
                                    ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-400 hover:bg-indigo-600/20' 
                                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                                }`}
                             >
                                <Sparkles size={22} className={selectedVideoModal.is_public ? 'animate-pulse' : ''} />
                                {selectedVideoModal.is_public ? 'منشور في المعرض' : ' نشر في المعرض '}
                             </button>
                             <button
                                onClick={() => { const link = document.createElement('a'); link.href = selectedVideoModal.url; link.download = `nexus_movie_${selectedVideoModal.id}.mp4`; document.body.appendChild(link); link.click(); document.body.removeChild(link); }}
                                className="w-full py-5 bg-white text-black font-black rounded-[1.8rem] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl"
                             >
                                <Download size={22} /> تحميل النسخة النهائية
                             </button>
                             <button 
                                onClick={(e) => deleteVideo(selectedVideoModal.id, e)}
                                className="w-full py-3 bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 text-red-500 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all text-[11px] uppercase tracking-wider"
                             >
                                <Trash2 size={16} />  حذف 
                             </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Upgrade Modal */}
        <UpgradeModal 
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
        />

        {/* Buy Credits Modal */}
        {showBuyModal && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-[110] p-4 animate-in fade-in duration-300">
            <div className="bg-[#111] rounded-[3rem] w-full max-w-lg border border-white/10 overflow-hidden relative shadow-2xl" dir="rtl">
              <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-indigo-600 to-blue-600"></div>
              
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                      <Crown size={24} />
                  </div>
                  <h2 className="text-2xl font-black text-white">شحن باقة الأفلام</h2>
                </div>
                <button onClick={() => setShowBuyModal(false)} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-all text-gray-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar-thin">
                {loadingPlans ? (
                  <div className="text-center py-12 animate-pulse text-gray-500 font-bold">جاري تحميل الخطط...</div>
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
                        className="w-full p-6 bg-white/[0.03] hover:bg-white/[0.08] rounded-[2rem] text-right transition-all border border-white/5 hover:border-indigo-500/50 group flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-white text-lg group-hover:text-indigo-400 transition-colors">{p.plan_name}</div>
                          <div className="text-gray-500 text-xs mt-1 font-bold">{p.credits_per_period} نقطة رصيد • {p.period}</div>
                        </div>
                        <div className="text-white font-black text-xl bg-white/10 px-5 py-2 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xl">
                            ${p.amount}
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
          <div className="fixed inset-0 bg-black/98 flex items-center justify-center z-[120]">
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
      </div>
    </>
  );
}