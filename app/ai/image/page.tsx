"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import UpgradeModal from "@/components/Modals/UpgradeModal";
import Link from "next/link";
import { useTranslation } from 'react-i18next';
import { toast, Toaster } from 'react-hot-toast';
import { 
  Copy, Check, ArrowRight, Image as ImageIcon, RefreshCw, 
  Download, X, Sparkles, Wand2, Palette, Camera, 
  ChevronLeft, ChevronDown, ChevronRight, CreditCard, Crown, 
  ArrowLeft, Trash2, Maximize2, Upload, XCircle, Search,
  SlidersHorizontal, CheckCircle2, Layers, Cpu
} from 'lucide-react';
import { AIToolHeader, AIGenerateButton, AIGenerationCard, AIResultModal, downloadMediaDirectly } from '@/components/ai';
import { handleAuthError } from "@/utils/auth";
import { useAiPricing } from '@/hooks/useAiPricing';

// ═══════════════════════════════════════════════════════════════
// MODELS DIRECTORY (Matching Araby.ai Showcase with Google & ChatGPT)
// ═══════════════════════════════════════════════════════════════

interface StudioModel {
  id: string;
  name: string;
  sub: string;
  desc: string;
  provider: 'google' | 'openai';
  cost: number;
  badge?: string;
  resolutions: Array<'1K' | '2K' | '4K'>;
  defaultResolution: '1K' | '2K' | '4K';
}

const STUDIO_MODELS: StudioModel[] = [
  {
    id: 'gemini-3-pro-image',
    name: 'Gemini 3 Pro Image — Ultra Cinematic',
    sub: 'Google AI Studio',
    desc: 'الخيار السينمائي الاحترافي الأعلى حالياً: استدلال بصري متقدم، تكوينات معقدة، نصوص عربية، وإخراج أصلي حتى 4K.',
    provider: 'google',
    cost: 30,
    badge: '👑 Ultra Cinematic',
    resolutions: ['1K', '2K', '4K'],
    defaultResolution: '2K'
  },
  {
    id: 'gemini-3.1-flash-image',
    name: 'Gemini 3.1 Flash Image',
    sub: 'Google AI Studio',
    desc: 'سرعة البرق مع فهم استثنائي للنصوص العربية المعقدة والتفاصيل الدقيقة.',
    provider: 'google',
    cost: 12,
    badge: '⚡ Nano Banana 2',
    resolutions: ['1K', '2K', '4K'],
    defaultResolution: '2K'
  },
  {
    id: 'gemini-3.1-flash-lite-image',
    name: 'Gemini 3.1 Flash Lite Image',
    sub: 'Google AI Studio',
    desc: 'أسرع وأوفر خيار للمعاينات والإنتاج الكثيف بدقة 1K.',
    provider: 'google',
    cost: 7,
    badge: '⚡ Lite',
    resolutions: ['1K'],
    defaultResolution: '1K'
  }
];

const ASPECT_RATIOS = [
  { id: '1:1', label: 'مربع 1:1', value: '1024x1024' },
  { id: '16:9', label: 'أفقي 16:9', value: '1792x1024' },
  { id: '9:16', label: 'طولي 9:16', value: '1024x1792' },
];

const RESOLUTIONS = [
  { id: '1K', label: '1K', desc: 'قياسي' },
  { id: '2K', label: '2K', desc: 'عالي الدقة' },
  { id: '4K', label: '4K', desc: 'سينمائي' },
];

export default function ImageGenerationPage() {
  const { t } = useTranslation();
  const [balance, setBalance] = useState<any>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Model Selector
  const [selectedModel, setSelectedModel] = useState<StudioModel>(STUDIO_MODELS[0]);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [modelSearch, setModelSearch] = useState("");

  // Size & Resolution Selectors
  const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS[0]);
  const [selectedResolution, setSelectedResolution] = useState(RESOLUTIONS[1]); // 2K default
  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);
  const [isResDropdownOpen, setIsResDropdownOpen] = useState(false);
  const { modelPrice } = useAiPricing();
  const selectedCost = useMemo(() => {
    const centralBase = modelPrice(selectedModel.id, selectedModel.cost);
    let cost = centralBase;
    if (selectedModel.id.includes('gemini-3-pro-image') && selectedResolution.id === '4K') {
      cost = Math.ceil(centralBase * 1.8);
    }
    if (selectedModel.id.includes('gemini-3.1-flash-image') && selectedResolution.id === '2K') {
      cost = Math.ceil(centralBase * 1.5);
    }
    if (selectedModel.id.includes('gemini-3.1-flash-image') && selectedResolution.id === '4K') {
      cost = Math.ceil(centralBase * 2.25);
    }
    if (selectedRatio.id !== '1:1') cost += 1;
    return cost;
  }, [modelPrice, selectedModel, selectedResolution, selectedRatio]);

  // Reference Image
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceMode, setReferenceMode] = useState<string>('style');
  const [referenceStrength, setReferenceStrength] = useState<number>(75);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // User Gallery State
  const [userImages, setUserImages] = useState<any[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any | null>(null);

  // Modals
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL, []);
  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem("a") : null;

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
        setIsSizeDropdownOpen(false);
        setIsResDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchBalance = async () => {
    if (!apiBase) return;
    try {
      const res = await fetch(`${apiBase}/api/credits/me/balance`, {
        headers: { 'Authorization': getToken() as any, "User-Client": (global as any)?.clientId1328 }
      });
      if (res.status === 401 || res.status === 403) {
        handleAuthError(res.status);
        return;
      }
      if (res.ok) setBalance(await res.json());
    } catch (e) {}
  };

  const fetchUserImages = async () => {
    if (!apiBase) return;
    setLoadingImages(true);
    try {
      const res = await fetch(`${apiBase}/api/ai/user-images?limit=24&tool=text-to-image`, {
        headers: { 'Authorization': getToken() as any, "User-Client": (global as any)?.clientId1328 }
      });
      if (res.ok) {
        const data = await res.json();
        setUserImages(data.images || []);
      }
    } catch (e) {}
    setLoadingImages(false);
  };

  const handleDeleteSingle = async (id: number | string) => {
    if (!apiBase) return;
    try {
      const res = await fetch(`${apiBase}/api/ai/user-images/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': getToken() as any, 'User-Client': (global as any)?.clientId1328 }
      });
      setUserImages(prev => prev.filter(img => (img.image_id || img.id) !== id));
      toast.success('تم حذف النتيجة بنجاح');
      if (selectedImage && (selectedImage.image_id === id || selectedImage.id === id)) {
        setSelectedImage(null);
      }
    } catch (e) {
      toast.error('فشل حذف النتيجة');
    }
  };

  const handleDeleteAll = async () => {
    if (!apiBase) return;
    try {
      const res = await fetch(`${apiBase}/api/ai/user-images?tool=text-to-image`, {
        method: 'DELETE',
        headers: { 'Authorization': getToken() as any, 'User-Client': (global as any)?.clientId1328 }
      });
      setUserImages([]);
      toast.success('تم حذف جميع النتائج السابقة');
      setSelectedImage(null);
    } catch (e) {
      toast.error('فشل حذف النتائج');
    }
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
          fetchUserImages();

          if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const initialPrompt = urlParams.get('prompt');
            if (initialPrompt) {
              setPrompt(initialPrompt);
            }
          }
        }
      } catch (e) {}
    };
    init();
    return () => { cancelled = true; };
  }, []);

  // Magic Prompt Enhancement
  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) {
      toast.error('اكتب وصفاً بسيطاً أولاً ليتم تحسينه');
      return;
    }
    setIsEnhancing(true);
    try {
      const res = await fetch(`${apiBase}/api/ai/enhance-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getToken() as any,
          "User-Client": (global as any)?.clientId1328
        },
        body: JSON.stringify({ prompt, type: 'image' })
      });
      const data = await res.json();
      if (data.success && data.enhanced_prompt) {
        setPrompt(data.enhanced_prompt);
        toast.success('✨ تم تحسين الأمر بنجاح!');
      }
    } catch (e) {
      toast.error('فشل تحسين الأمر');
    }
    setIsEnhancing(false);
  };

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('الحد الأقصى لحجم الصورة 10 ميجابايت');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setReferenceImage(ev.target?.result as string);
      toast.success('تم رفع الصورة المرجعية');
    };
    reader.readAsDataURL(file);
  };

  // Generate Image Action
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('يرجى كتابة وصف الصورة');
      return;
    }
    if (!balance || balance.remaining_credits < selectedCost) {
      setShowUpgradeModal(true);
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(3);
    const progressTimer = window.setInterval(() => {
      setGenerationProgress(value => Math.min(94, value + Math.random() * 7 + 2));
    }, 650);
    try {
      const payload: any = {
        prompt: prompt.trim(),
        model: selectedModel.id,
        size: selectedRatio.value,
        resolution: selectedResolution.id,
      };

      if (referenceImage) {
        payload.reference_image = referenceImage;
        payload.reference_mode = referenceMode;
        payload.reference_strength = referenceStrength;
      }

      const res = await fetch(`${apiBase}/api/ai/text-to-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getToken() as any,
          "User-Client": (global as any)?.clientId1328
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success && data.image_url) {
        setGenerationProgress(100);
        toast.success('🎉 تم توليد الصورة بنجاح!');
        fetchBalance();
        fetchUserImages();
      } else {
        toast.error(data.message || 'فشل التوليد');
      }
    } catch (e: any) {
      toast.error('حدث خطأ أثناء التوليد');
    } finally {
      window.clearInterval(progressTimer);
      setIsGenerating(false);
    }
  };

  // Filter Models in search
  const filteredModels = useMemo(() => {
    const q = modelSearch.trim().toLowerCase();
    if (!q) return STUDIO_MODELS;
    return STUDIO_MODELS.filter(m => 
      m.name.toLowerCase().includes(q) || 
      m.desc.toLowerCase().includes(q) || 
      m.sub.toLowerCase().includes(q)
    );
  }, [modelSearch]);

  const inspirationPrompt = "امرأة ترتدي عباية خليجية أنيقة وفاخرة بنقوش ذهبية مع نظارة شمسية كلاسيكية وحقيبة يد ماركة، تصوير فوتوغرافي في شوارع دبي الحديثة بإضاءة سينمائية دافئة 8k";

  return (
    <div className="h-screen bg-[#05060a] text-white flex flex-col font-sans selection:bg-blue-500/30 overflow-hidden" dir="rtl">
      <Toaster position="top-right" />

      {/* Top Header */}
      <header className="h-14 border-b border-white/10 bg-[#08090f]/90 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-40">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold">
            <ArrowRight size={14} />
            <span>الرئيسية</span>
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-xs font-black text-white flex items-center gap-1.5">
            <ImageIcon size={14} className="text-blue-400" />
            أدوات الصور
          </span>
        </div>

        {/* User Balance */}
        {balance && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs">
            <span className="text-gray-400">الرصيد:</span>
            <span className="font-bold text-emerald-400">{balance.remaining_credits?.toLocaleString()}</span>
            <span className="text-yellow-400">🪙</span>
          </div>
        )}
      </header>

      {/* Studio Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative" ref={dropdownRef}>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* RIGHT: FIXED COMPACT ARABY.AI SIDEBAR WITH PINNED GENERATE BUTTON */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <aside className="w-full lg:w-[380px] h-[calc(100vh-3.5rem)] bg-[#0B0D14] border-l border-white/[0.08] p-5 flex flex-col justify-between shrink-0 z-30 shadow-2xl relative overflow-visible">
          
          <div className="flex-1 space-y-4 pr-0.5 pb-2">
            
            {/* 1. Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white tracking-wide">إعدادات الصورة</h2>
            </div>

            {/* 2. Prompt Box with Magic Enhance inside */}
            <div className="relative rounded-xl border border-white/[0.08] bg-[#121520] p-3.5 focus-within:border-emerald-500/50 transition-all">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="صف المشهد الذي تريده..."
                rows={4}
                className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-gray-500 outline-none resize-none leading-relaxed custom-scrollbar"
              />
            </div>

            {/* 3. Reference Image Upload Area with "تجريبي" Badge */}
            <div className="relative">
              {!referenceImage ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative group cursor-pointer h-20 rounded-xl border border-dashed border-white/[0.08] hover:border-emerald-500/40 bg-[#121520] flex flex-col items-center justify-center gap-1.5 transition-all hover:bg-[#161a27]"
                >
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/5 text-[9px] font-bold">
                    تجريبي
                  </div>
                  <ImageIcon size={20} className="text-gray-400 group-hover:text-emerald-400 transition-colors" />
                  <span className="text-xs font-semibold text-gray-300">رفع الصور المرجعية</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="relative h-20 rounded-xl overflow-hidden border border-white/[0.08] bg-[#121520] flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <img src={referenceImage} alt="Reference" className="w-14 h-14 object-cover rounded-lg border border-white/10" />
                    <div>
                      <span className="text-xs font-bold text-emerald-400 block">تم رفع الصورة المرجعية</span>
                      <span className="text-[10px] text-gray-400">ستستخدم كدليل لتوليد النمط</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setReferenceImage(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* 4. Model Selector Row (Triggers Side Floating Popover) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsModelDropdownOpen(!isModelDropdownOpen);
                  setIsSizeDropdownOpen(false);
                  setIsResDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all group text-right border ${
                  isModelDropdownOpen
                    ? 'bg-[#161a27] border-emerald-500/40 shadow-lg'
                    : 'bg-[#121520] hover:bg-[#161a27] border-white/[0.08] hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                  <ChevronLeft size={15} className={`transition-transform duration-200 ${isModelDropdownOpen ? '-rotate-90 text-emerald-400' : ''}`} />
                  <span className="text-white font-bold">{selectedModel.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-400">النموذج</span>
                </div>
              </button>

              {/* Side Floating Models Menu (Popover to the Side) */}
              {isModelDropdownOpen && (
                <div className="absolute max-lg:right-0 max-lg:top-full max-lg:mt-2 max-lg:w-full lg:right-full lg:top-0 lg:mr-3 lg:w-[520px] xl:w-[560px] lg:max-w-[calc(100vw-420px)] bg-[#0C0F17]/95 border border-white/15 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] p-4 z-50 backdrop-blur-2xl animate-in fade-in slide-in-from-right-3 duration-200">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-emerald-400" />
                      <span className="text-sm font-bold text-white tracking-wide">اختر نموذج التوليد</span>
                    </div>
                    <span className="text-[11px] text-zinc-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10 font-medium">
                      {STUDIO_MODELS.length} نماذج متاحة
                    </span>
                  </div>

                  {/* Models list with comfortable breathing space */}
                  <div className="space-y-3 max-h-[460px] overflow-y-auto no-scrollbar pr-0.5">
                    {STUDIO_MODELS.map((m) => {
                      const isSelected = selectedModel.id === m.id;
                      return (
                        <div
                          key={m.id}
                          onClick={() => {
                            setSelectedModel(m);
                            if (!m.resolutions.includes(selectedResolution.id as '1K' | '2K' | '4K')) {
                              setSelectedResolution(RESOLUTIONS.find(res => res.id === m.defaultResolution) || RESOLUTIONS[0]);
                            }
                            setIsModelDropdownOpen(false);
                          }}
                          className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 border relative group ${
                            isSelected 
                              ? 'bg-gradient-to-r from-emerald-500/[0.12] via-emerald-500/[0.05] to-transparent border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.1)] text-white' 
                              : 'bg-[#121522]/80 hover:bg-[#161a29] border-white/[0.08] hover:border-white/20 text-gray-300'
                          }`}
                        >
                          {/* Top Row: Name on start (RTL right), Badges & Cost on end (RTL left) */}
                          <div className="flex items-center justify-between gap-3 mb-2.5">
                            <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                              <div className={`w-2.5 h-2.5 rounded-full shrink-0 transition-transform duration-200 ${
                                isSelected 
                                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] scale-110' 
                                  : 'bg-white/20 group-hover:bg-white/40'
                              }`} />
                              <span className="text-sm font-bold text-white tracking-wide">
                                {m.name}
                              </span>
                              {m.badge && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                                  {m.badge}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-bold">
                              <span>{m.cost}</span>
                              <span className="text-[11px]">🪙</span>
                              <span className="text-[10px] font-medium text-amber-300/70">نقطة</span>
                            </div>
                          </div>

                          {/* Description: Comfortable readable typography with relaxed line height */}
                          <p className="text-xs sm:text-[13px] text-zinc-300/90 leading-[1.8] pr-5 pb-1">
                            {m.desc}
                          </p>

                          {/* Meta footer: resolutions & status */}
                          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-white/[0.05] text-[11px] text-zinc-400 pr-5">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-zinc-400 font-medium">الدقة المدعومة:</span>
                              <div className="flex items-center gap-1">
                                {m.resolutions.map((r) => (
                                  <span 
                                    key={r} 
                                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                      r === '4K'
                                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                        : 'bg-white/5 text-zinc-300 border border-white/10'
                                    }`}
                                  >
                                    {r}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {isSelected ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                                <Check size={13} className="stroke-[2.5]" />
                                النموذج النشط
                              </span>
                            ) : (
                              <span className="text-[11px] text-zinc-400 group-hover:text-emerald-400 transition-colors">
                                اضغط للتحديد
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 5. Size & Resolution Selectors Side-by-Side */}
            <div className="grid grid-cols-2 gap-3">
              
              {/* Aspect Ratio Box */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsSizeDropdownOpen(!isSizeDropdownOpen);
                    setIsResDropdownOpen(false);
                    setIsModelDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-right border ${
                    isSizeDropdownOpen
                      ? 'bg-[#161a27] border-emerald-500/40'
                      : 'bg-[#121520] hover:bg-[#161a27] border-white/[0.08]'
                  }`}
                >
                  <ChevronLeft size={14} className={`transition-transform duration-200 ${isSizeDropdownOpen ? '-rotate-90 text-emerald-400' : 'text-gray-400'}`} />
                  <div className="text-right">
                    <span className="text-[10px] text-gray-500 block">الأبعاد</span>
                    <span className="text-xs font-bold text-white">{selectedRatio.id}</span>
                  </div>
                </button>

                {isSizeDropdownOpen && (
                  <div className="absolute top-full mt-1.5 right-0 w-full bg-[#0E111A] border border-white/10 rounded-xl shadow-2xl p-1.5 z-40 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                    {ASPECT_RATIOS.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          setSelectedRatio(r);
                          setIsSizeDropdownOpen(false);
                        }}
                        className={`w-full text-right px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                          selectedRatio.id === r.id ? 'bg-emerald-600 text-white font-bold' : 'text-gray-300 hover:bg-white/5'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Resolution Box */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsResDropdownOpen(!isResDropdownOpen);
                    setIsSizeDropdownOpen(false);
                    setIsModelDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-right border ${
                    isResDropdownOpen
                      ? 'bg-[#161a27] border-emerald-500/40'
                      : 'bg-[#121520] hover:bg-[#161a27] border-white/[0.08]'
                  }`}
                >
                  <ChevronLeft size={14} className={`transition-transform duration-200 ${isResDropdownOpen ? '-rotate-90 text-emerald-400' : 'text-gray-400'}`} />
                  <div className="text-right">
                    <span className="text-[10px] text-gray-500 block">الدقة</span>
                    <span className="text-xs font-bold text-white">{selectedResolution.id}</span>
                  </div>
                </button>

                {isResDropdownOpen && (
                  <div className="absolute top-full mt-1.5 left-0 w-full bg-[#0E111A] border border-white/10 rounded-xl shadow-2xl p-1.5 z-40 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                    {RESOLUTIONS.filter(res => selectedModel.resolutions.includes(res.id as '1K' | '2K' | '4K')).map((res) => (
                      <button
                        key={res.id}
                        onClick={() => {
                          setSelectedResolution(res);
                          setIsResDropdownOpen(false);
                        }}
                        className={`w-full text-right px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                          selectedResolution.id === res.id ? 'bg-emerald-600 text-white font-bold' : 'text-gray-300 hover:bg-white/5'
                        }`}
                      >
                        {res.label} ({res.desc})
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* 6. Full-Width Solid Generate Button (Pinned at Bottom) */}
          <div className="pt-3 border-t border-white/[0.08] shrink-0 bg-[#0B0D14] z-20">
            <AIGenerateButton
              onClick={handleGenerate}
              isGenerating={isGenerating}
              disabled={!prompt.trim()}
              cost={selectedCost}
              label="إنشاء"
              generatingLabel="جاري الإنشاء..."
              icon={ImageIcon}
              variant="emerald"
            />
          </div>

        </aside>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* LEFT / CENTER: VISUAL CANVAS & INSPIRATION PREVIEW */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <main className="flex-1 bg-[#020307] p-6 overflow-y-auto flex flex-col justify-between space-y-6 relative">
          
          {/* Recent Creations or Inspiration Grid */}
          {userImages.length > 0 || isGenerating ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-400">إبداعاتك الأخيرة ({userImages.length})</h3>
                {userImages.length > 0 && (
                  <button
                    onClick={handleDeleteAll}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-all"
                  >
                    <Trash2 size={12} />
                    <span>حذف جميع النتائج</span>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {isGenerating && (
                  <AIGenerationCard progress={generationProgress} icon={ImageIcon} />
                )}
                {userImages.map((img) => (
                  <div
                    key={img.image_id || img.id}
                    onClick={() => setSelectedImage(img)}
                    className="group relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-[#0a0b12] cursor-pointer"
                  >
                    <img
                      src={img.image_url || img.cloudinary_url}
                      alt={img.prompt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSingle(img.image_id || img.id);
                        }}
                        className="p-1 rounded-md bg-black/70 hover:bg-rose-600 text-slate-300 hover:text-white border border-white/10 backdrop-blur-md transition-colors"
                        title="حذف هذه النتيجة"
                      >
                        <Trash2 size={11} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadMediaDirectly(img.image_url || img.cloudinary_url, `nexus-image-${Date.now()}.png`);
                        }}
                        className="p-1 rounded-md bg-black/70 hover:bg-emerald-600 text-slate-300 hover:text-white border border-white/10 backdrop-blur-md transition-colors"
                        title="تحميل"
                      >
                        <Download size={11} />
                      </button>
                    </div>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                      <p className="text-[10px] text-white line-clamp-2">{img.prompt}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              {/* Full Inspiration Hero Card like the screenshot */}
              <div className="relative w-full max-w-2xl h-[420px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col justify-end p-8 group">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1200"
                  alt="Style Showcase"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                <div className="relative z-10 space-y-3 max-w-md">
                  <span className="px-2.5 py-1 rounded-md bg-white/20 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider">
                    إلهام إبداعي
                  </span>
                  <h2 className="text-2xl font-black text-white drop-shadow-md">
                    ستايل الشارع الفاخر
                  </h2>
                  <p className="text-xs text-gray-300 leading-relaxed line-clamp-2">
                    {inspirationPrompt}
                  </p>
                  <button
                    onClick={() => {
                      setPrompt(inspirationPrompt);
                      toast.success('تم تطبيق البرومبت في الصندوق!');
                    }}
                    className="px-5 py-2 rounded-lg bg-white hover:bg-gray-100 text-black text-xs font-black transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2"
                  >
                    <span>استخدم هذا البرومت</span>
                    <ChevronLeft size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Info bar */}
          <div className="flex items-center justify-between text-[11px] text-gray-500 pt-4 border-t border-white/5">
            <span>مدعوم بنماذج Google Gemini و Vertex AI و OpenAI</span>
            <span>Nexus Toolz Studio 2026</span>
          </div>
        </main>

      </div>

      {/* Upgrade & Buy Modal */}
      {showUpgradeModal && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          featureName="توليد الصور السينمائية"
          requiredCredits={selectedCost}
          currentCredits={balance?.remaining_credits || 0}
        />
      )}

      {/* Unified AI Result Modal */}
      <AIResultModal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        mediaUrl={selectedImage?.image_url || selectedImage?.cloudinary_url || null}
        mediaId={selectedImage?.image_id || selectedImage?.id}
        isPublic={selectedImage?.is_public}
        onDelete={() => selectedImage && handleDeleteSingle(selectedImage.image_id || selectedImage.id)}
        mediaType="image"
        title="صورة مولدة بالذكاء الاصطناعي"
        subtitle={selectedModel?.name || "استوديو الصور"}
        prompt={selectedImage?.prompt}
        details={[
          { label: "الوصف", value: selectedImage?.prompt || "توليد صورة" },
          { label: "النموذج", value: selectedImage?.model || selectedModel?.name || "Gemini 3 Pro Image" },
        ]}
      />

    </div>
  );
}
