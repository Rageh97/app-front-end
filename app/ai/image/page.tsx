"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import PaymentModal from "@/components/Modals/PaymentModal";
import UpgradeModal from "@/components/Modals/UpgradeModal";
import Link from "next/link";
import { useTranslation } from 'react-i18next';
import { toast, Toaster } from 'react-hot-toast';
import { 
  Copy, Check, ArrowRight, Image as ImageIcon, RefreshCw, 
  Download, X, Sparkles, Wand2, Palette, Camera, 
  ChevronLeft, CreditCard, Crown, AlertCircle, ShieldCheck, 
  ArrowLeft, Trash2, Maximize2, MoreHorizontal, Upload, XCircle, Coins
, Cpu} from 'lucide-react';
import TextType from "@/components/TextType";
import { PremiumButton } from "@/components/PremiumButton";
import { IMAGE_MODELS, AIModel, calculateImageCost, syncModelsWithDynamicPricing } from '@/lib/ai-models-config';
import { ModelSelector } from '@/components/ModelSelector';
import { processImagePrompt } from '@/lib/prompt-utils';

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
    image_profit: number;
    video_profit: number;
    chat_profit: number;
    allowed_tools: string;
  };
};

const PROMPT_PRESETS: { label: string; value: string; icon: React.ReactNode }[] = [
  { label: "عادي", value: "", icon: <Wand2 size={16} /> },
  { label: "واقعي", value: "photorealistic style, ultra-detailed, 8k, professional photography", icon: <Camera size={16} /> },
  { label: "أنمي", value: "anime style, vibrant colors, dynamic lighting, manga art", icon: <Sparkles size={16} /> },
  { label: "رسم زيتي", value: "oil painting, canvas texture, baroque lighting, classical art", icon: <Palette size={16} /> },
  { label: "بكسل", value: "pixel art, low resolution, retro palette, 8-bit style", icon: <ImageIcon size={16} /> },
];

const IMAGE_SIZES: { label: string; value: string; creditsMultiplier: number; description: string; ratio: string }[] = [
  { label: "مربع", value: "1024x1024", creditsMultiplier: 10, description: "مثالي لوسائل التواصل", ratio: "aspect-square" },
  { label: "أفقي", value: "1792x1024", creditsMultiplier: 15, description: "رائع للخلفيات", ratio: "aspect-video" },
  { label: "طولي", value: "1024x1792", creditsMultiplier: 15, description: "مناسب للهواتف", ratio: "aspect-[9/16]" },
];

export default function ImageGenerationPage() {
  const { t } = useTranslation();
  const [balance, setBalance] = useState<CreditsRecord | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [preset, setPreset] = useState(PROMPT_PRESETS[0].value);
  const [imageSize, setImageSize] = useState(IMAGE_SIZES[0].value);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  
  // Model Selection State
  const [selectedModelId, setSelectedModelId] = useState(IMAGE_MODELS[0].id);
  const [dynamicPrices, setDynamicPrices] = useState<Record<string, number>>({});

  const dynamicModels = useMemo(() => {
    return syncModelsWithDynamicPricing(IMAGE_MODELS, dynamicPrices);
  }, [dynamicPrices]);

  const selectedModel = dynamicModels.find(m => m.id === selectedModelId) || dynamicModels[0];

  // Reference Image State
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize prompt textarea
  useEffect(() => {
    if (promptRef.current) {
      promptRef.current.style.height = '128px'; // Reset to min-height
      const scrollHeight = promptRef.current.scrollHeight;
      if (scrollHeight > 128) {
        promptRef.current.style.height = `${scrollHeight}px`;
      }
    }
  }, [prompt]);

  // User Images State
  const [userImages, setUserImages] = useState<any[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  
  // Modal State
  const [selectedImage, setSelectedImage] = useState<any | null>(null);

  const [plans, setPlans] = useState<Array<{ plan_id: number; plan_name: string; credits_per_period: number; amount: string; period: string }>>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ plan_id: number; plan_name: string; credits_per_period: number; amount: string; period: string } | null>(null);

  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL, []);

  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("a");
    }
    return null;
  };

  const fetchBalance = async () => {
    if (!apiBase) return;
    const token = getToken();
    setLoadingBalance(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/credits/me/balance`, { headers: { 'Authorization': token as any, 'Content-Type': 'application/json', "User-Client": (global as any)?.clientId1328 } });
      if (res.status === 200) {
        const data = (await res.json()) as CreditsRecord | null;
        setBalance(data);
      } else if (res.status === 401) {
        setError('يرجى تسجيل الدخول');
      } else {
        setError('تعذر تحميل الرصيد');
      }
    } catch (e: any) {
      setError("");
    } finally {
      setLoadingBalance(false);
    }
  };

  const fetchUserImages = async () => {
    if (!apiBase) return;
    const token = getToken();
    setLoadingImages(true);
    try {
      const res = await fetch(`${apiBase}/api/ai/user-images?limit=24&tool=text-to-image`, {
        headers: { 'Authorization': token as any, 'Content-Type': 'application/json', "User-Client": (global as any)?.clientId1328 }
      });
      if (res.status === 200) {
        const data = await res.json();
        if (data.success) {
            const images = data.images.map((img: any) => ({
                id: img.image_id,
                url: img.image_url || img.cloudinary_url,
                prompt: img.prompt,
                date: img.created_at,
                is_public: img.is_public
            }));
            setUserImages(images);
        }
      }
    } catch (e) {
      console.error("Failed to fetch user images", e);
    } finally {
      setLoadingImages(false);
    }
  };

  const deleteImage = async (imageId: number, e?: React.MouseEvent) => {
      if(e) e.stopPropagation();
      
      if (!apiBase) return;
      const token = getToken();
      
      const previousImages = [...userImages];
      setUserImages(userImages.filter(img => img.id !== imageId));
      if (selectedImage?.id === imageId) setSelectedImage(null);
      
      try {
          const res = await fetch(`${apiBase}/api/ai/user-images/${imageId}`, {
              method: 'DELETE',
              headers: { 'Authorization': token as any, "User-Client": (global as any)?.clientId1328 }
          });
          
          if (res.status !== 200) {
              setUserImages(previousImages);
              toast.error('فشل حذف الصورة');
          } else {
              toast.success('تم حذف الصورة');
          }
      } catch (e) {
          setUserImages(previousImages);
          toast.error('خطأ في الحذف');
      }
  };

  const deleteAllImages = async () => {
      if (!confirm('هل أنت متأكد من حذف جميع الصور؟')) return;
      
      if (!apiBase) return;
      const token = getToken();
      
      const previousImages = [...userImages];
      setUserImages([]);
      
      try {
          const res = await fetch(`${apiBase}/api/ai/user-images`, {
              method: 'DELETE',
              headers: { 'Authorization': token as any, "User-Client": (global as any)?.clientId1328 }
          });
          
          if (res.status !== 200) {
              setUserImages(previousImages);
              toast.error('فشل الحذف');
          } else {
              toast.success('تم حذف السجل بالكامل');
          }
      } catch (e) {
          setUserImages(previousImages);
          toast.error('خطأ في الحذف');
      }
  };

  const [clientReady, setClientReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const ensureClientId = async () => {
      try {
        if (!(global as any)?.clientId1328) {
          const fp = await FingerprintJS.load();
          const result = await fp.get();
          (global as any).clientId1328 = result.visitorId;
        }
        if (!cancelled) setClientReady(true);
      } catch (_) {
        if (!cancelled) setClientReady(false);
      }
    };
    ensureClientId().then(() => {
      fetchBalance();
      fetchUserImages(); 
      loadPlans();
      loadDynamicPricing();
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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


  const openBuyModal = () => {
    setShowBuyModal(true);
  };

  const closeBuyModal = () => setShowBuyModal(false);

  const onSelectPlan = async (plan_id: number) => {
    const plan = plans.find(p => p.plan_id === plan_id) || null;
    if (!plan) return;
    setSelectedPlan(plan);
    setShowBuyModal(false);
    setOpenPaymentModal(true);
  };

  const selectedSize = IMAGE_SIZES.find(size => size.value === imageSize);
  const imageProfit = balance?.plan?.image_profit ?? 0;
  // Calculate cost based on selected model + size + profit margin
  const creditsNeeded = calculateImageCost(selectedModel, imageSize, imageProfit);
  const canGenerate = clientReady && !!prompt && !isGenerating;

  const checkCreditsAndShowToast = () => {
    if (!balance) {
      setShowUpgradeModal(true);
      return false;
    }

    if (balance.remaining_credits === 0) {
      setShowUpgradeModal(true);
      return false;
    }

    if (balance.remaining_credits < creditsNeeded) {
      setShowUpgradeModal(true);
      return false;
    }

    return true;
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
            if (type === 'image') {
                setUserImages(prev => prev.map(img => img.id === id ? { ...img, is_public: !currentStatus } : img));
                if (selectedImage?.id === id) setSelectedImage({ ...selectedImage, is_public: !currentStatus });
            }
        }
    } catch (e) {
        toast.error('فشلت العملية');
    }
  };

  const onGenerate = async () => {
    if (!apiBase) return;
    
    if (!checkCreditsAndShowToast()) {
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setGenerationProgress(0);
    
    let progressValue = 0;
    const progressInterval = setInterval(() => {
      progressValue += Math.random() * 2 + 0.8;
      if (progressValue >= 95) {
        progressValue = 95;
        clearInterval(progressInterval);
      }
      setGenerationProgress(progressValue);
    }, 800);
    
    try {
      const token = getToken();
      
      // معالجة البرومبت العربي وتحسينه
      const processedPrompt = processImagePrompt(prompt, preset);
      
      console.log('[IMAGE] Sending generation request with:', {
        model: selectedModelId,
        size: imageSize,
        expectedCost: creditsNeeded,
        originalPrompt: prompt,
        processedPrompt: processedPrompt
      });
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/text-to-image`, {
        method: "POST",
        headers: { 'Authorization': token as any, 'Content-Type': 'application/json', "User-Client": (global as any)?.clientId1328 },
        body: JSON.stringify({ 
          prompt: processedPrompt, // استخدام البرومبت المحسّن
          style: preset, 
          size: imageSize,
          model: selectedModelId, // إرسال النموذج المختار
          reference_image: referenceImage // إرسال الصورة المرجعية إن وجدت
        }),
      });
      
      clearInterval(progressInterval);
      setGenerationProgress(100);
      
      if (res.status === 200) {
        const data = await res.json();
        console.log('[IMAGE] Generation successful, credits used:', data.credits_used);
        await fetchBalance();
        await fetchUserImages(); 
        toast.success('تم إنشاء الصورة بنجاح!');
      } else if (res.status === 402) {
        setError('نفذ الرصيد');
        await fetchBalance();
      } else if (res.status === 401) {
        setError('يرجى تسجيل الدخول');
      } else {
        const text = await res.text();
        setError(text || 'فشلت عملية التوليد');
      }
    } catch (e: any) {
      clearInterval(progressInterval);
      setError('خطأ في الاتصال');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  const downloadImageUtils = async (imageUrl: string, promptText: string) => {
    try {
      const sanitizedPrompt = promptText.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 50);
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `nexus_ai_${sanitizedPrompt}_${timestamp}.png`;
      
      if (imageUrl.startsWith('http')) {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      } else {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      toast.success('تم تحميل الصورة بنجاح!');
    } catch (error) {
      window.open(imageUrl, '_blank');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('تم نسخ النص');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار صورة صالحة');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('حجم الصورة كبير جداً (الحد الأقصى 10MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setReferenceImage(event.target?.result as string);
      toast.success('تم رفع الصورة المرجعية');
    };
    reader.readAsDataURL(file);
  };

  const removeReferenceImage = () => {
    setReferenceImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.success('تم إزالة الصورة المرجعية');
  };

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid #374151',
          },
          success: { style: { background: '#059669', }, },
          error: { style: { background: '#dc2626', }, },
        }}
      />

      <div className="h-screen flex flex-col bg-[#000000] text-white selection:bg-purple-500/30 font-sans overflow-hidden no-scrollbar" dir="rtl">
        {/* Background Ambience */}
        <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none z-0"></div>
        
        {/* Header */}
        <header className="shrink-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
          <div className="px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link 
                  href="/ai" 
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300 border border-white/10"
                >
                  <ArrowRight size={16} />
                  <span className="text-sm font-bold">عودة</span>
                </Link>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-8 bg-purple-600 rounded-full"></span>
                    <h1 className="text-lg font-bold">انشاء صور احترافية</h1>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                  {loadingBalance ? (
                    <span className="text-[10px] text-gray-400">جاري التحميل...</span>
                  ) : balance ? (
                    <div className="flex items-center gap-2">
                       <CreditCard size={12} className="text-purple-400" />
                      <span className="text-xs text-gray-300">الرصيد:</span>
                      <span className={`text-sm font-bold ${
                        balance.remaining_credits === 0 
                          ? 'text-red-400' 
                          : balance.remaining_credits <= 5 
                          ? 'text-yellow-400' 
                          : 'text-green-400'
                      }`}>
                        {balance.remaining_credits}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-red-400">لا يوجد رصيد</span>
                  )}
                </div>
                
                <button
                  onClick={openBuyModal}
                  className="relative inline-flex h-8 active:scale-95 transition overflow-hidden rounded-lg p-[1px] focus:outline-none"
                >
                  <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#e7029a_0%,#f472b6_50%,#bd5fff_100%)]"></span>
                  <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-lg bg-[#050505] px-3 text-[10px] font-black text-white backdrop-blur-3xl gap-1.5 transition-all hover:bg-black/40">
                    <Crown size={12} className="text-pink-500" />
                    شراء كريديت 
                  </span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative z-10">
            
            {/* Right Sidebar (Settings) - Fixed Width */}
            <aside className="w-full lg:w-[300px] h-auto max-h-[35vh] lg:max-h-full lg:h-full flex flex-col border-b lg:border-b-0 lg:border-l border-white/10 bg-[#050505] overflow-y-auto no-scrollbar shrink-0 order-1">
                <div className="p-4 space-y-4">
                    
                    {/* Prompt Section */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 flex items-center gap-2 uppercase tracking-wide">
                            <Sparkles size={12} className="text-purple-400" />
                            وصف الصورة
                        </label>
                        <div className="relative group">
                            <textarea
                                ref={promptRef}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="صف ما في خيالك..."
                                maxLength={20000}
                                className="w-full min-h-[80px] px-3 py-2 rounded-lg bg-white/5 text-white border border-white/10 focus:border-purple-500/50 focus:bg-white/[0.07] focus:ring-4 focus:ring-purple-500/10 resize-none transition-all placeholder:text-gray-600 text-xs leading-relaxed custom-scrollbar outline-none overflow-hidden"
                            />
                        </div>
                        <div className="flex justify-between items-center mt-1 px-1">
                            <div className="text-[9px] text-gray-500">
                                {/* تم إخفاء تفاصيل الربح للحفاظ على تجربة المستخدم */}
                            </div>
                            <div className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-gray-400 border border-white/5">
                                {prompt.length}/20000 حرف
                            </div>
                        </div>
                    </div>

                    {/* Reference Image Upload Section */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 flex items-center gap-2 uppercase tracking-wide">
                            <Upload size={12} className="text-emerald-400" />
                            صورة مرجعية
                        </label>
                        {!referenceImage ? (
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="relative group cursor-pointer"
                            >
                                <div className="w-full h-20 rounded-lg bg-white/5 border-2 border-dashed border-white/10 hover:border-purple-500/40 transition-all flex flex-col items-center justify-center gap-1 hover:bg-white/[0.07]">
                                    <Upload size={18} className="text-gray-500 group-hover:text-purple-400 transition-colors" />
                                    <span className="text-[10px] text-gray-500 group-hover:text-purple-300 transition-colors">ارفع صورة</span>
                                </div>
                                <input 
                                    ref={fileInputRef}
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                            </div>
                        ) : (
                            <div className="relative group">
                                <img 
                                    src={referenceImage} 
                                    alt="Reference" 
                                    className="w-full h-20 object-cover rounded-lg border border-white/10"
                                />
                                <button
                                    onClick={removeReferenceImage}
                                    className="absolute top-1 left-1 p-1 bg-red-500/80 hover:bg-red-500 rounded transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <XCircle size={12} />
                                </button>
                                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 rounded text-[8px] text-emerald-400 font-bold">
                                    ✓ مرجع
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Presets Section */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 flex items-center gap-2 uppercase tracking-wide">
                            <Palette size={12} className="text-blue-400" />
                            النمط الفني
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                             {PROMPT_PRESETS.map((p) => (
                                <button
                                    key={p.label}
                                    onClick={() => setPreset(p.value)}
                                    className={`flex items-center gap-1.5 px-2 py-2 rounded-lg border text-right transition-all duration-200 ${
                                        preset === p.value
                                        ? 'bg-purple-500/10 border-purple-500/40 text-purple-300'
                                        : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:border-white/10'
                                    }`}
                                >
                                    <span className={`shrink-0 ${preset === p.value ? 'text-purple-400' : 'text-gray-500'}`}>
                                        {React.cloneElement(p.icon as React.ReactElement, { size: 12 })}
                                    </span>
                                    <span className="text-[10px] font-bold truncate">{p.label}</span>
                                </button>
                             ))}
                        </div>
                    </div>

                    {/* Aspect Ratio Section */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 flex items-center gap-2 uppercase tracking-wide">
                            <Maximize2 size={12} className="text-emerald-400" />
                            الأبعاد
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                            {IMAGE_SIZES.map((size) => (
                                <button
                                    key={size.value}
                                    onClick={() => setImageSize(size.value)}
                                    className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all duration-200 ${
                                        imageSize === size.value
                                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                                        : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:border-white/10'
                                    }`}
                                >
                                    <div className={`shrink-0 bg-current rounded-sm opacity-50 ${
                                        size.value === '1024x1024' ? 'w-4 h-4' : 
                                        size.value === '1792x1024' ? 'w-5 h-3' : 'w-3 h-5'
                                    }`} />
                                    <span className="text-[9px] font-bold">{size.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Model Selection Section */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 flex items-center gap-2 uppercase tracking-wide">
                            <Cpu size={12} className="text-purple-400" />
                            اختر النموذج
                        </label>
                            <ModelSelector
                                models={dynamicModels}
                                selectedModelId={selectedModelId}
                                onSelectModel={setSelectedModelId}
                                size={imageSize}
                                profit={imageProfit}
                                compact={true}
                            />
                    </div>
                </div>
                
                 {/* Fixed Generate Button at Bottom of Sidebar */}
                <div className="p-4 mt-auto border-t border-white/10 bg-[#080808]">
                     {error && (
                        <div className="mb-2 px-2 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-[10px]">
                            <AlertCircle size={12} />
                            <span className="truncate">{error}</span>
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
                        label={isGenerating ? "جاري الإبداع..." : "توليد الصورة الآن"}
                        icon={isGenerating ? RefreshCw : Sparkles}
                        onClick={onGenerate}
                        disabled={!canGenerate}
                        className="w-full py-3 text-xs rounded-xl"
                      />
                </div>
            </aside>

            {/* Left Main Area (Gallery) - Scrollable list */}
            <main className="flex-1 overflow-y-auto bg-[#020202] p-6 no-scrollbar relative order-2">
                {/* Empty State */}
                {!isGenerating && userImages.length === 0 && (
                     <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                        <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center mb-6 animate-pulse">
                            <ImageIcon size={40} className="text-white/20" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">معرضك فارغ</h3>
                        <p className="text-gray-500 max-w-xs text-sm">ابدأ بإنشاء صورك الأولى باستخدام الأدوات في القائمة الجانبية.</p>
                     </div>
                )}
                
                {/* Gallery Grid */}
                <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 space-y-4 gap-4 pb-20">
                    
                    {/* Loading Card (First Item) */}
                    {isGenerating && (
                         <div className="break-inside-avoid relative rounded-xl overflow-hidden bg-white/5 aspect-[4/5] animate-pulse border border-white/10 ring-1 ring-purple-500/30">
                             <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4 text-center">
                                 <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                 <span className="text-xs font-bold text-purple-300">جاري المعالجة...</span>
                                 <div className="w-full h-1 bg-white/10 rounded-full mt-3 overflow-hidden">
                                     <div 
                                        className="h-full bg-purple-500 transition-all duration-300"
                                        style={{ width: `${generationProgress}%` }}
                                     ></div>
                                 </div>
                             </div>
                             {/* Abstract placeholder shapes */}
                             <div className="absolute inset-0 opacity-20">
                                 <div className="absolute top-[-20%] left-[-20%] w-[150%] h-[150%] bg-gradient-to-br from-purple-500 via-transparent to-blue-500 rotate-12"></div>
                             </div>
                         </div>
                    )}

                    {/* Image Cards */}
                    {userImages.map((img) => (
                        <div 
                            key={img.id} 
                            onClick={() => setSelectedImage(img)}
                            className="break-inside-avoid group relative rounded-xl overflow-hidden bg-[#111] border border-white/5 hover:border-white/20 cursor-pointer transition-all hover:translate-y-[-4px] hover:shadow-xl hover:shadow-purple-900/10 mb-4"
                        >
                            <img 
                                src={img.url} 
                                alt={img.prompt} 
                                className="w-full h-auto object-cover"
                                loading="lazy"
                            />
                            
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-3">
                                <p className="text-[10px] text-white/90 line-clamp-2 mb-2 leading-relaxed font-medium">
                                    {img.prompt}
                                </p>
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] text-gray-400">{new Date(img.date).toLocaleDateString('ar-EG')}</span>
                                    <button className="p-1.5 bg-white/20 hover:bg-white text-white hover:text-black rounded-lg transition-colors">
                                        <Maximize2 size={12} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>


        {/* Image Viewer Modal */}
        {selectedImage && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/95 backdrop-blur-2xl animate-fade-in" dir="rtl">
                <button 
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-20"
                >
                    <X size={24} />
                </button>

                <div className="relative w-full h-full max-w-7xl flex gap-8 items-center justify-center">
                    
                    {/* Image Container */}
                    <div className="relative flex-1 h-full flex items-center justify-center overflow-hidden rounded-2xl bg-black/50 border border-white/5 shadow-2xl">
                         <img 
                            src={selectedImage.url} 
                            alt={selectedImage.prompt}
                            className="max-h-full max-w-full object-contain" 
                         />
                    </div>

                    {/* Info Sidebar */}
                    <div className="w-[350px] shrink-0 h-full max-h-[600px] bg-[#0c0c0c] border border-white/10 rounded-2xl p-6 flex flex-col hidden lg:flex">
                        <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                            <Sparkles size={14} className="text-purple-400" />
                            تفاصيل العمل
                        </h3>
                        
                        <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                            <div className="space-y-2">
                                <label className="text-xs text-gray-500 font-bold">النص المستخدم (Prompt)</label>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-sm text-gray-300 leading-relaxed max-h-[200px] overflow-y-auto">
                                    {selectedImage.prompt}
                                </div>
                                <button 
                                    onClick={() => copyToClipboard(selectedImage.prompt)}
                                    className="flex items-center gap-2 text-xs text-purple-400 hover:text-purple-300 transition-colors font-bold mt-2"
                                >
                                    <Copy size={12} />
                                    نسخ النص
                                </button>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-gray-500 font-bold">تاريخ الإنشاء</label>
                                <div className="text-sm text-white font-medium">
                                    {new Date(selectedImage.date).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/10 space-y-3">
                             <button 
                                onClick={() => togglePublicStatus(selectedImage.id, selectedImage.is_public, 'image')}
                                className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border ${
                                    selectedImage.is_public 
                                    ? 'bg-indigo-600/10 border-indigo-500/50 text-indigo-400 hover:bg-indigo-600/20' 
                                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                                }`}
                             >
                                <Sparkles size={18} className={selectedImage.is_public ? 'animate-pulse' : ''} />
                                {selectedImage.is_public ? 'منشور في المعرض' : 'نشر في معرض المحترفين'}
                             </button>
                             <button
                                onClick={() => downloadImageUtils(selectedImage.url, selectedImage.prompt)}
                                className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                             >
                                <Download size={18} />
                                تحميل الصورة
                             </button>
                             <div className="flex gap-2">
                                <button 
                                    onClick={() => {
                                        setPrompt(selectedImage.prompt);
                                        setSelectedImage(null);
                                    }}
                                    className="flex-1 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    <RefreshCw size={16} />
                                    استخدام
                                </button>
                                <button 
                                    onClick={(e) => deleteImage(selectedImage.id, e)}
                                    className="px-4 py-3 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-500 rounded-xl transition-all"
                                    title="حذف"
                                >
                                    <Trash2 size={18} />
                                </button>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Small Screen Modal (Mobile) */}
         {selectedImage && (
            <div className="fixed bottom-0 left-0 right-0 bg-[#111] border-t border-white/10 p-4 z-[110] lg:hidden rounded-t-3xl">
                <div className="flex items-center gap-4 mb-4">
                    <img src={selectedImage.url} alt="thumbnail" className="w-16 h-16 rounded-lg object-cover bg-white/5" />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 line-clamp-2">{selectedImage.prompt}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-2">
                    <button
                        onClick={() => togglePublicStatus(selectedImage.id, selectedImage.is_public, 'image')}
                        className={`py-3 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 border ${
                            selectedImage.is_public 
                            ? 'bg-indigo-600/10 border-indigo-500/50 text-indigo-400' 
                            : 'bg-white/5 border-white/10 text-white'
                        }`}
                    >
                        <Sparkles size={14} className={selectedImage.is_public ? 'animate-pulse' : ''} />
                        {selectedImage.is_public ? 'في المعرض' : 'نشر بالمعرض'}
                    </button>
                    <button
                        onClick={() => downloadImageUtils(selectedImage.url, selectedImage.prompt)}
                        className="py-3 bg-white text-black font-bold rounded-xl text-sm"
                    >
                        تحميل
                    </button>
                </div>
                <button
                    onClick={() => setSelectedImage(null)}
                    className="w-full py-3 bg-white/10 text-white font-bold rounded-xl text-sm"
                >
                    إغلاق
                </button>
            </div>
         )}
      </div>

      {/* Buy Credits Modal */}
      {showBuyModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-[#111] rounded-3xl w-full max-w-lg border border-white/10 overflow-hidden relative" dir="rtl">
            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500"></div>
            
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center text-purple-400">
                    <Crown size={20} />
                </div>
                <h2 className="text-xl font-bold text-white">شراء رصيد إضافي</h2>
              </div>
              <button onClick={closeBuyModal} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {loadingPlans ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <div className="text-gray-400">جاري تحميل الخطط...</div>
                </div>
              ) : plans.length === 0 ? (
                <div className="text-center py-12 text-gray-500">لا توجد خطط متاحة حالياً</div>
              ) : (
                <div className="space-y-4">
                  {plans.map((p) => (
                    <button
                      key={p.plan_id}
                      onClick={() => onSelectPlan(p.plan_id)}
                      className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-right transition-all duration-300 border border-white/5 hover:border-purple-500/50 group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white text-lg group-hover:text-purple-400 transition-colors">{p.plan_name}</div>
                          <div className="text-gray-400 text-sm mt-1">{p.credits_per_period} نقطة رصيد / {p.period}</div>
                        </div>
                        <div className="text-white font-bold text-xl bg-white/10 px-3 py-1 rounded-lg group-hover:bg-purple-500 group-hover:text-white transition-all">
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
    </>
  );
}
