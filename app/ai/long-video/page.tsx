"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import PaymentModal from "@/components/Modals/PaymentModal";
import UpgradeModal from "@/components/Modals/UpgradeModal";
import Link from "next/link";
import { toast, Toaster } from 'react-hot-toast';
import { 
  ArrowRight, Plus, Trash2, Download, X, RefreshCw, 
  CreditCard, Crown, Sparkles, Play, Film, MonitorPlay, 
  History as HistoryIcon, Clock, Maximize2, Layers, Coins, Cpu,
  Wand2, Clapperboard, AlignLeft, CheckCircle2, ListVideo, Settings
} from 'lucide-react';
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
  const [mode, setMode] = useState<'full' | 'scenes'>('full');
  const [fullPrompt, setFullPrompt] = useState("");
  const [fullVideoDuration, setFullVideoDuration] = useState(15);
  const [scenes, setScenes] = useState<Scene[]>([{ id: '1', prompt: '', duration: 5 }]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [activeStep, setActiveStep] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const [selectedModelId, setSelectedModelId] = useState(LONG_VIDEO_MODELS[0].id);
  const [dynamicPrices, setDynamicPrices] = useState<Record<string, number>>({});

  const dynamicModels = useMemo(() => {
    return syncVideoWithDynamicPricing(LONG_VIDEO_MODELS, dynamicPrices);
  }, [dynamicPrices]);

  const selectedModel = dynamicModels.find(m => m.id === selectedModelId) || dynamicModels[0];

  const [userVideos, setUserVideos] = useState<any[]>([]);
  const [selectedVideoModal, setSelectedVideoModal] = useState<any | null>(null);

  const [plans, setPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL, []);
  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem("a") : null;

  const fetchData = async () => {
    if (!apiBase) return;
    try {
      const headers = { 'Authorization': getToken() as any, "User-Client": (global as any)?.clientId1328 };
      
      const balanceRes = await fetch(`${apiBase}/api/credits/me/balance`, { headers });
      if (balanceRes.ok) setBalance(await balanceRes.json());
      
      const videosRes = await fetch(`${apiBase}/api/ai/user-videos?limit=24&tool=long_video`, { headers });
      if (videosRes.ok) {
        const data = await videosRes.json();
        if (data.success) {
          setUserVideos(data.videos.map((vid: any) => ({
            id: vid.video_id, url: vid.video_url || vid.cloudinary_url, date: vid.created_at, prompt: vid.prompt, 
            thumbnail: vid.thumbnail_url, is_public: vid.is_public, metadata: vid.metadata
          })));
        }
      }

      const pricingRes = await fetch(`${apiBase}/api/admin/settings/public/ai-pricing`);
      if (pricingRes.ok) setDynamicPrices(await pricingRes.json());

      const plansRes = await fetch(`${apiBase}/api/credits/plans`);
      if (plansRes.ok) setPlans(await plansRes.json());
      
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
        if (!cancelled) await fetchData();
      } catch (e) {}
    };
    init();
    return () => { cancelled = true; };
  }, []);

  const totalDuration = mode === 'scenes' 
    ? (scenes.filter(s => s.prompt.trim()).reduce((sum, scene) => sum + scene.duration, 0) || 5)
    : fullVideoDuration;

  const videoProfit = balance?.plan?.video_profit ?? 0;
  const creditsNeeded = calculateVideoCost(selectedModel, totalDuration, videoProfit);

  const addScene = () => {
    if (scenes.length >= 10) return toast.error("الحد الأقصى هو 10 مشاهد فقط");
    const defaultDuration = selectedModel.supportedDurations ? selectedModel.supportedDurations[0] : 5;
    setScenes([...scenes, { id: Date.now().toString(), prompt: '', duration: defaultDuration }]);
  };

  const removeScene = (id: string) => scenes.length > 1 && setScenes(scenes.filter(s => s.id !== id));
  const updateScene = (id: string, field: keyof Scene, value: any) => setScenes(scenes.map(s => s.id === id ? { ...s, [field]: value } : s));

  const onGenerate = async () => {
    let finalScenes: Scene[] = [];
    
    if (mode === 'scenes') {
      finalScenes = scenes.filter(s => s.prompt.trim());
      if (finalScenes.length === 0) return toast.error("يرجى إدخال مشهد واحد على الأقل");
    } else {
      if (!fullPrompt.trim()) return toast.error("يرجى كتابة قصة أو وصف للفيلم");
      // For full mode, send one scene of full duration, backend will chunk it if needed
      finalScenes = [{ id: 'full', prompt: fullPrompt.trim(), duration: fullVideoDuration }];
    }

    if (!balance || balance.remaining_credits < creditsNeeded) return setShowUpgradeModal(true);
    
    setIsGenerating(true);
    setError(null);
    setGenerationProgress(0);
    setActiveStep("تحليل القصة وبناء المشاهد...");
    
    const estimatedTime = (finalScenes.reduce((a, b) => a + b.duration, 0)) * 6; // roughly 6s per sec of video
    let progress = 0;
    
    const steps = [
      { p: 10, msg: "تجهيز السيرفرات السحابية..." },
      { p: 30, msg: "إنتاج المشاهد عالية الدقة..." },
      { p: 60, msg: "تصيير الفيديو الأساسي..." },
      { p: 85, msg: "دمج المشاهد وإضافة المؤثرات..." },
      { p: 95, msg: "اللمسات الأخيرة للفيلم..." }
    ];

    const interval = setInterval(() => {
      progress += (95 / estimatedTime);
      if (progress >= 95) progress = 95;
      setGenerationProgress(progress);
      
      const currentStep = steps.findLast(s => progress >= s.p);
      if (currentStep) setActiveStep(currentStep.msg);
    }, 1000);
    
    try {
      const res = await fetch(`${apiBase}/api/ai/long-video`, {
        method: "POST",
        headers: { 'Authorization': getToken() as any, 'Content-Type': 'application/json', "User-Client": (global as any)?.clientId1328 },
        body: JSON.stringify({ scenes: finalScenes, model: selectedModelId, mode })
      });
      
      clearInterval(interval);
      setGenerationProgress(100);
      setActiveStep("مكتمل!");
      
      const data = await res.json();
      if (data.success) {
        toast.success(`تم إنتاج الفيلم بنجاح!`);
        fetchData();
        if (data.video_url) {
            setSelectedVideoModal({ 
              id: data.video_id, url: data.video_url, date: new Date(), 
              prompt: mode === 'full' ? fullPrompt : `Long Video (${finalScenes.length} scenes)`, 
              thumbnail: data.thumbnail_url || data.metadata?.thumbnail_url, is_public: false
            });
        }
      } else {
        setError(data.message || 'فشلت العملية');
        toast.error(data.message || 'فشلت العملية');
      }
    } catch (e: any) {
      clearInterval(interval);
      setError(e.message || 'خطأ في الاتصال');
      toast.error('خطأ في الاتصال');
    } finally { 
      setIsGenerating(false); 
      setGenerationProgress(0);
    }
  };

  const deleteVideo = async (id: number, e?: React.MouseEvent) => {
    if(e) e.stopPropagation();
    setUserVideos(prev => prev.filter(v => v.id !== id));
    if (selectedVideoModal?.id === id) setSelectedVideoModal(null);
    try {
      await fetch(`${apiBase}/api/ai/user-videos/${id}`, { method: 'DELETE', headers: { 'Authorization': getToken() as any, "User-Client": (global as any)?.clientId1328 } });
      toast.success('تم الحذف');
    } catch (e) { fetchData(); }
  };

  const togglePublicStatus = async (id: number, currentStatus: boolean) => {
    if (!apiBase) return;
    try {
        const res = await fetch(`${apiBase}/api/ai/toggle-public`, {
            method: 'POST',
            headers: { 'Authorization': getToken() as any, 'Content-Type': 'application/json', "User-Client": (global as any)?.clientId1328 },
            body: JSON.stringify({ id, is_public: !currentStatus, type: 'video' })
        });
        const data = await res.json();
        if (data.success) {
            toast.success(currentStatus ? 'تمت الإزالة من المعرض' : 'تم النشر في معرض المحترفين!');
            setUserVideos(prev => prev.map(vid => vid.id === id ? { ...vid, is_public: !currentStatus } : vid));
            if (selectedVideoModal?.id === id) setSelectedVideoModal({ ...selectedVideoModal, is_public: !currentStatus });
        }
    } catch (e) { toast.error('فشلت العملية'); }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="h-screen flex flex-col bg-[#020202] text-white selection:bg-indigo-500/30 font-sans overflow-hidden" dir="rtl">
        {/* Abstract Background Elements */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay"></div>
        </div>
        
        {/* Header */}
        <header className="shrink-0 z-50 bg-[#050505]/80 backdrop-blur-2xl border-b border-white/5 relative">
            <div className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href="/ai" className="group flex items-center justify-center w-10 h-10 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/10 transition-all duration-300">
                        <ArrowRight size={18} className="text-gray-400 group-hover:text-white transition-colors" />
                    </Link>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-black bg-gradient-to-l from-white to-gray-400 bg-clip-text text-transparent">Nexus Studios</h1>
                            <span className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-400 text-[9px] font-black tracking-widest border border-indigo-500/30 uppercase">Cinematic</span>
                        </div>
                        <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">AI Masterpiece Generator</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white/[0.03] rounded-2xl border border-white/5">
                        <CreditCard size={14} className="text-indigo-400" />
                        <div className="flex flex-col text-right">
                           <span className="text-[9px] text-gray-500 uppercase tracking-widest leading-none mb-1">الرصيد المتبقي</span>
                           <span className="text-sm font-black text-white leading-none">{balance?.remaining_credits || 0}</span>
                        </div>
                    </div>
                    <button onClick={() => setShowBuyModal(true)} className="relative inline-flex h-10 active:scale-95 transition overflow-hidden rounded-2xl p-[1px] focus:outline-none">
                        <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#4f46e5_0%,#818cf8_50%,#4f46e5_100%)]"></span>
                        <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-2xl bg-[#050505] px-4 font-black text-white backdrop-blur-3xl gap-2 transition-all hover:bg-[#111]">
                            <Crown size={14} className="text-indigo-400" />
                            <span className="text-xs">شحن رصيد</span>
                        </span>
                    </button>
                </div>
            </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden relative z-10">
            
            {/* Left Sidebar (Settings Workspace) */}
            <aside className="w-[340px] flex flex-col border-l border-white/5 bg-[#080808]/50 backdrop-blur-xl shrink-0 shadow-2xl relative z-20">
                
                {/* Mode Switcher */}
                <div className="p-5 border-b border-white/5 shrink-0">
                    <div className="flex bg-[#000] p-1 rounded-2xl border border-white/5 relative">
                        {/* Animated slider background */}
                        <div 
                          className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#1a1a1a] rounded-xl transition-all duration-500 ease-out z-0 border border-white/5 shadow-lg"
                          style={{ right: mode === 'full' ? '4px' : 'calc(50%)' }}
                        />
                        <button 
                            onClick={() => setMode('full')}
                            className={`flex-1 py-2.5 flex items-center justify-center gap-2 text-[11px] font-black rounded-xl z-10 transition-colors duration-300 ${mode === 'full' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <Wand2 size={14} className={mode === 'full' ? 'text-indigo-400' : ''} />
                            القطعة الواحدة
                        </button>
                        <button 
                            onClick={() => setMode('scenes')}
                            className={`flex-1 py-2.5 flex items-center justify-center gap-2 text-[11px] font-black rounded-xl z-10 transition-colors duration-300 ${mode === 'scenes' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <ListVideo size={14} className={mode === 'scenes' ? 'text-purple-400' : ''} />
                            المشاهد المتعددة
                        </button>
                    </div>
                </div>

                {/* Scrollable Workflow Area */}
                <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-6">
                    
                    {/* Prompting Area */}
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <AlignLeft size={12} className="text-indigo-500" />
                                {mode === 'full' ? 'القصة الكاملة' : 'المشاهد'}
                            </label>
                            {mode === 'scenes' && (
                                <button onClick={addScene} disabled={scenes.length >= 10} className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors">
                                    + إضافة مشهد
                                </button>
                            )}
                        </div>

                        {mode === 'full' ? (
                            <div className="relative group">
                                <textarea 
                                    value={fullPrompt}
                                    onChange={(e) => setFullPrompt(e.target.value)}
                                    placeholder="اكتب قصة فيلمك أو وصفاً شاملاً للأحداث هنا. سيقوم المخرج الذكي بتقسيم المشاهد وإخراجها لك في فيلم واحد متصل ومدمج باحترافية شديدة..."
                                    className="w-full h-48 bg-[#0a0a0a] border border-white/10 rounded-[1.5rem] p-5 text-sm font-medium leading-relaxed focus:border-indigo-500/50 outline-none resize-none placeholder:text-gray-600 transition-all scrollbar-hide shadow-inner focus:ring-1 focus:ring-indigo-500/20"
                                />
                                <div className="absolute bottom-4 left-4 p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 pointer-events-none md:flex hidden animate-pulse">
                                    <Sparkles size={14} className="text-indigo-400" />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {scenes.map((s, idx) => (
                                    <div key={s.id} className="relative bg-[#0a0a0a] rounded-[1.5rem] border border-white/5 focus-within:border-purple-500/40 p-4 transition-all group overflow-hidden shadow-inner">
                                        <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-purple-500/50 to-indigo-500/50 opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                                        
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center text-[9px] font-black text-gray-400 border border-white/10">{idx + 1}</div>
                                                <span className="text-[9px] uppercase tracking-widest font-black text-gray-500">Scene Sequence</span>
                                            </div>
                                            {scenes.length > 1 && (
                                                <button onClick={() => removeScene(s.id)} className="text-gray-500 hover:text-red-400 transition-colors">
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                        
                                        <textarea 
                                            value={s.prompt} onChange={(e) => updateScene(s.id, 'prompt', e.target.value)}
                                            placeholder="ماذا يحدث في هذا المشهد؟"
                                            className="w-full bg-transparent border-none focus:ring-0 text-xs font-medium text-white resize-none h-16 outline-none placeholder:text-gray-700 leading-relaxed scrollbar-hide"
                                        />
                                        
                                        <div className="flex items-center gap-2 pt-3 mt-1 border-t border-white/5">
                                            <Clock size={10} className="text-gray-500" />
                                            <select 
                                                value={s.duration} onChange={(e) => updateScene(s.id, 'duration', Number(e.target.value))} 
                                                className="bg-transparent text-[10px] font-bold text-gray-400 outline-none cursor-pointer hover:text-white"
                                            >
                                                {(selectedModel.supportedDurations || [5, 10]).map(dur => (
                                                    <option key={dur} value={dur} className="bg-[#111]">{dur} ثوانٍ</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Technical Settings */}
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500 delay-100 border-t border-white/5 pt-6">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Settings size={12} className="text-blue-500" />
                            المحرك الذكي
                        </label>
                        
                        {mode === 'full' && (
                            <div className="bg-[#0a0a0a] rounded-2xl border border-white/5 p-4 flex items-center justify-between shadow-inner">
                                <div className="flex items-center gap-3">
                                    <Clock size={16} className="text-gray-500" />
                                    <div>
                                        <div className="text-xs font-bold text-white">المدة الإجمالية للفيلم</div>
                                        <div className="text-[9px] text-gray-500">تحدد طول الفيديو النهائي المعالج</div>
                                    </div>
                                </div>
                                <select 
                                    value={fullVideoDuration} onChange={(e) => setFullVideoDuration(Number(e.target.value))} 
                                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-white outline-none focus:border-indigo-500/50 transition-colors"
                                >
                                    <option value={10} className="bg-[#111]">10 ثوانٍ (سريع)</option>
                                    <option value={15} className="bg-[#111]">15 ثانية (قياسي)</option>
                                    <option value={20} className="bg-[#111]">20 ثانية (طويل)</option>
                                    <option value={30} className="bg-[#111]">30 ثانية (ملحمي)</option>
                                </select>
                            </div>
                        )}

                        <div className="bg-[#0a0a0a] rounded-[1.5rem] p-2 border border-white/5 shadow-inner">
                            <ModelSelector
                                models={dynamicModels}
                                selectedModelId={selectedModelId}
                                onSelectModel={setSelectedModelId}
                                duration={mode === 'full' ? fullVideoDuration : 5}
                                profit={videoProfit}
                                compact={true}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Action Area */}
                <div className="p-5 bg-gradient-to-t from-[#000] to-[#080808]/90 border-t border-white/5 shrink-0 relative z-30">
                    {error && (
                        <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 text-red-400 text-xs font-medium animate-in slide-in-from-bottom-2">
                            <AlertCircle size={14} className="shrink-0 mt-0.5" />
                            <span className="leading-snug">{error}</span>
                        </div>
                    )}
                    
                    <div className="flex items-center justify-between bg-white/[0.03] p-3 rounded-xl border border-white/10 mb-4 shadow-inner">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                <Coins size={14} className="text-yellow-500" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] text-gray-500 uppercase font-black">تكلفة الإنتاج</span>
                                <span className="text-sm font-black text-white">{creditsNeeded} <span className="text-[9px] text-gray-500">نقطة</span></span>
                            </div>
                        </div>
                        <div className="text-right">
                           <span className="text-[9px] text-gray-500 uppercase font-black block">المدة المقدرة</span>
                           <span className="text-xs font-bold text-indigo-400">{totalDuration} ثوان</span>
                        </div>
                    </div>

                    <div className="relative">
                        {isGenerating && (
                            <div className="absolute -top-12 left-0 right-0 flex flex-col items-center justify-center text-center animate-in fade-in">
                                <span className="text-[10px] font-black text-indigo-400 tracking-widest uppercase mb-1">{activeStep}</span>
                                <div className="w-48 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
                                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 ease-out relative" style={{ width: `${generationProgress}%` }}>
                                        <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <PremiumButton 
                            label={isGenerating ? "جاري عملية المونتاج والدمج..." : "بدء إخراج الفيلم"}
                            icon={isGenerating ? RefreshCw : Clapperboard}
                            onClick={onGenerate}
                            disabled={isGenerating || (mode === 'scenes' ? scenes.every(s => !s.prompt.trim()) : !fullPrompt.trim())}
                            className={`w-full py-4 text-sm rounded-2xl shadow-xl transition-all duration-500 ${isGenerating ? 'opacity-80' : 'hover:shadow-indigo-500/20'}`}
                        />
                    </div>
                </div>
            </aside>

            {/* Main Stage (Gallery) */}
            <main className="flex-1 overflow-y-auto no-scrollbar relative z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/10 via-[#020202] to-[#020202]">
                
                <div className="max-w-7xl mx-auto p-8 lg:p-12">
                    {/* Gallery Header */}
                    <div className="flex items-end justify-between mb-10">
                        <div>
                            <h2 className="text-3xl font-black text-white tracking-tight mb-2 flex items-center gap-3">
                                <Clapperboard className="text-indigo-500" size={28} />
                                صالة العرض
                            </h2>
                            <p className="text-sm font-medium text-gray-400">شاهد وتسلم أحدث إبداعاتك السينمائية بالذكاء الاصطناعي مدمجة في مقاطع احترافية القطعة الواحدة.</p>
                        </div>
                    </div>

                    {/* Empty State */}
                    {!isGenerating && userVideos.length === 0 && (
                        <div className="w-full h-[60vh] flex flex-col items-center justify-center text-center opacity-70 animate-in fade-in duration-700">
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full"></div>
                                <div className="w-32 h-32 bg-white/[0.03] rounded-[3rem] border border-white/10 flex items-center justify-center rotate-3 hover:rotate-0 transition-transform duration-500 shadow-2xl backdrop-blur-xl relative z-10">
                                    <Clapperboard size={48} className="text-indigo-400/50" />
                                </div>
                            </div>
                            <h3 className="text-xl font-black text-white mb-3">ابدأ إخراج فيلمك الأول</h3>
                            <p className="text-sm font-medium text-gray-500 max-w-sm">ضع رؤيتك في صندوق الإخراج الجانبي، وسيقوم المخرج الذكي بتوليف مشاهدك كفيلم احترافي كامل.</p>
                        </div>
                    )}
                    
                    {/* Video Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8 pb-24">
                        
                        {/* Generating Ghost Card */}
                        {isGenerating && (
                            <div className="relative rounded-[2.5rem] overflow-hidden bg-black/40 border border-indigo-500/30 aspect-video shadow-[0_0_50px_rgba(99,102,241,0.1)] group">
                                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-transparent to-purple-500/10 opacity-50"></div>
                                
                                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-8 text-center backdrop-blur-md">
                                    <div className="relative mb-6">
                                        <div className="w-20 h-20 border-[3px] border-indigo-500/20 rounded-full"></div>
                                        <div className="absolute inset-0 border-[3px] border-t-indigo-500 rounded-full animate-spin"></div>
                                        <Clapperboard size={24} className="absolute inset-0 m-auto text-indigo-400 animate-pulse" />
                                    </div>
                                    <h4 className="text-sm font-black text-white mb-2">{activeStep}</h4>
                                    <div className="text-[10px] text-indigo-300 font-bold tracking-widest uppercase mb-4">{Math.floor(generationProgress)}% مكتمل</div>
                                    <div className="w-[80%] h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 relative" style={{ width: `${generationProgress}%` }}>
                                             <div className="absolute inset-0 bg-white/30 animate-[shimmer_1.5s_infinite]"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Video Items */}
                        {userVideos.map((vid) => (
                            <div 
                                key={vid.id} 
                                onClick={() => setSelectedVideoModal(vid)}
                                className="group relative rounded-[2.5rem] overflow-hidden bg-[#080808] border border-white/10 hover:border-indigo-500/50 cursor-pointer transition-all duration-500 hover:-translate-y-2 shadow-xl hover:shadow-[0_20px_50px_rgba(99,102,241,0.15)] aspect-video"
                            >
                                {vid.thumbnail ? (
                                    <img src={vid.thumbnail} alt="thumbnail" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out" />
                                ) : (
                                    <video 
                                        src={vid.url} 
                                        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out"
                                        muted loop playsInline
                                        onMouseEnter={(e) => e.currentTarget.play()}
                                        onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                                    />
                                )}
                                
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-all duration-500"></div>

                                {/* Floating Play Button */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 hidden md:flex">
                                    <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-500 ease-out">
                                        <Play size={24} className="text-white ml-2" fill="currentColor" />
                                    </div>
                                </div>
                                
                                {/* Top Badges */}
                                <div className="absolute top-4 right-4 z-20 flex gap-2">
                                    <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-[9px] font-black tracking-widest text-white/90">
                                        Merged Video
                                    </span>
                                </div>
                                {vid.is_public && (
                                    <div className="absolute top-4 left-4 z-20">
                                        <div className="w-8 h-8 bg-green-500/20 backdrop-blur-md rounded-full border border-green-500/30 flex items-center justify-center">
                                            <CheckCircle2 size={14} className="text-green-500" />
                                        </div>
                                    </div>
                                )}

                                {/* Bottom Info */}
                                <div className="absolute bottom-0 left-0 right-0 p-6 z-20 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                                    <p className="text-sm font-bold text-white mb-2 line-clamp-1 drop-shadow-md">
                                        {vid.prompt}
                                    </p>
                                    <div className="flex items-center justify-between text-white/60">
                                        <span className="text-[10px] font-bold">{new Date(vid.date).toLocaleDateString()}</span>
                                        <div className="flex gap-2">
                                            <button onClick={(e) => { e.stopPropagation(); deleteVideo(vid.id, e); }} className="w-8 h-8 rounded-full bg-red-500/0 hover:bg-red-500/80 text-white/60 hover:text-white flex items-center justify-center transition-all backdrop-blur-md">
                                                <Trash2 size={12} />
                                            </button>
                                            <div className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/30 text-white flex items-center justify-center transition-all backdrop-blur-md">
                                                <Maximize2 size={12} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>


        {/* Cinematic Video Modal Viewer */}
        {selectedVideoModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-300" dir="rtl">
                
                {/* Close Button Top */}
                <button 
                    onClick={() => setSelectedVideoModal(null)}
                    className="absolute top-8 left-8 p-4 bg-white/5 rounded-full hover:bg-white/10 transition-all z-20 group border border-white/10 hover:scale-105"
                >
                    <X size={24} className="text-gray-400 group-hover:text-white transition-colors" />
                </button>

                <div className="relative w-full max-w-[1400px] h-full max-h-[85vh] flex flex-col lg:flex-row gap-6 items-center justify-center">
                    
                    {/* Theater Player Container */}
                    <div className="relative flex-1 w-full lg:w-auto h-full flex items-center justify-center overflow-hidden rounded-[2rem] lg:rounded-[3rem] bg-[#000] border border-white/10 shadow-2xl group">
                         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                         <video 
                            src={selectedVideoModal.url} 
                            controls autoPlay 
                            className="max-h-full max-w-full rounded-[2rem] lg:rounded-[3rem] z-0" 
                         />
                    </div>

                    {/* Meta Details Panel */}
                    <div className="w-full lg:w-[420px] shrink-0 h-fit max-h-full bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 rounded-[2rem] lg:rounded-[3rem] p-8 lg:p-10 flex flex-col shadow-2xl relative overflow-y-auto no-scrollbar">
                        <h3 className="text-xs font-black text-indigo-400 mb-8 uppercase tracking-[0.3em] flex items-center gap-3">
                            <Clapperboard size={16} /> Asset Meta
                        </h3>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block mb-3">السيناريو | Prompt</label>
                                <div className="bg-white/[0.03] p-6 rounded-[2rem] text-sm text-gray-300 leading-relaxed font-bold border border-white/5 shadow-inner">
                                    {selectedVideoModal.prompt}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 bg-white/[0.02] rounded-[2rem] border border-white/5">
                                    <span className="text-[9px] text-gray-600 block mb-2 uppercase font-black">تاريخ الإخراج</span>
                                    <span className="text-xs font-black text-white">{new Date(selectedVideoModal.date).toLocaleDateString('ar-EG')}</span>
                                </div>
                                <div className="p-5 bg-white/[0.02] rounded-[2rem] border border-white/5">
                                    <span className="text-[9px] text-gray-600 block mb-2 uppercase font-black">النوع</span>
                                    <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5"><CheckCircle2 size={12}/> فيلم مدمج الماستر</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 pt-8 border-t border-white/5 space-y-4">
                             <button 
                                onClick={() => togglePublicStatus(selectedVideoModal.id, selectedVideoModal.is_public)}
                                className={`w-full py-4 rounded-2xl font-black transition-all duration-300 flex items-center justify-center gap-3 border ${
                                    selectedVideoModal.is_public 
                                    ? 'bg-purple-500/10 border-purple-500/40 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.15)]' 
                                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                                }`}
                             >
                                <Sparkles size={18} className={selectedVideoModal.is_public ? 'animate-pulse' : ''} />
                                {selectedVideoModal.is_public ? 'متوفر في المعرض العام' : 'انشر في المعرض العام'}
                             </button>
                             <button
                                onClick={() => { const link = document.createElement('a'); link.href = selectedVideoModal.url; link.download = `nexus_movie_${selectedVideoModal.id}.mp4`; document.body.appendChild(link); link.click(); document.body.removeChild(link); }}
                                className="w-full py-4 bg-white text-black font-black rounded-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-[0_10px_40px_rgba(255,255,255,0.15)]"
                             >
                                <Download size={18} /> حفظ الفيلم إلى جهازك
                             </button>
                             <button 
                                onClick={(e) => deleteVideo(selectedVideoModal.id, e)}
                                className="w-full py-3 mt-4 text-red-500 font-bold rounded-2xl hover:bg-red-500/10 flex items-center justify-center gap-2 transition-all text-xs"
                             >
                                <Trash2 size={16} /> التخلص من السجل
                             </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Upgrade & Payment Modals - Kept same logic but structured */}
        <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

        {showBuyModal && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl flex items-center justify-center z-[110] p-4 animate-in fade-in duration-300">
            <div className="bg-[#050505] rounded-[2.5rem] w-full max-w-lg border border-white/10 overflow-hidden relative shadow-[0_0_80px_rgba(79,70,229,0.15)]" dir="rtl">
              
              <div className="p-8 border-b border-white/5 flex items-center justify-between relative z-10 bg-[#0a0a0a]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                      <Crown size={24} className="text-indigo-400" />
                  </div>
                  <div>
                      <h2 className="text-xl font-black text-white">ترقية باقة الإنتاج</h2>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Unlock AI Power</p>
                  </div>
                </div>
                <button onClick={() => setShowBuyModal(false)} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-all text-gray-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-8 max-h-[60vh] overflow-y-auto no-scrollbar relative z-10 bg-[#050505]">
                {loadingPlans ? (
                  <div className="flex flex-col items-center justify-center py-12">
                      <RefreshCw size={24} className="text-indigo-400 animate-spin mb-4" />
                      <div className="text-gray-500 font-bold text-sm">جاري التجهيز...</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {plans.map((p: any) => (
                      <button
                        key={p.plan_id}
                        onClick={() => { setSelectedPlan(p); setShowBuyModal(false); setOpenPaymentModal(true); }}
                        className="w-full p-6 bg-white/[0.02] hover:bg-white/[0.05] rounded-[2rem] text-right transition-all duration-300 border border-white/5 hover:border-indigo-500/40 group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div>
                          <div className="font-black text-lg text-white mb-1 group-hover:text-indigo-400 transition-colors">{p.plan_name}</div>
                          <div className="text-gray-400 text-xs font-medium flex items-center gap-2">
                              <Coins size={12} className="text-yellow-500"/> {p.credits_per_period} نقطة رصيد <span className="text-gray-600">•</span> {p.period}
                          </div>
                        </div>
                        <div className="text-white font-black text-xl bg-white/5 border border-white/10 px-6 py-3 rounded-2xl group-hover:bg-indigo-600 group-hover:border-indigo-500 transition-all shadow-lg self-start sm:self-auto">
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

        {openPaymentModal && selectedPlan && (
          <div className="fixed inset-0 bg-black/98 flex items-center justify-center z-[120]">
            <div className="w-full max-w-[1200px]">
              <PaymentModal
                modalOpen={openPaymentModal} setModalOpen={setOpenPaymentModal}
                productType="credits" period={selectedPlan.period as any} productId={selectedPlan.plan_id}
                productData={{ tool_name: selectedPlan.plan_name, pack_name: selectedPlan.plan_name, monthly_price: selectedPlan.amount, yearly_price: selectedPlan.amount, tool_day_price: selectedPlan.amount, amount: selectedPlan.amount }}
                onBuySuccess={() => { setOpenPaymentModal(false); fetchData(); }}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}