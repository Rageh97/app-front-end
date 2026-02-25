"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import PaymentModal from "@/components/Modals/PaymentModal";
import UpgradeModal from "@/components/Modals/UpgradeModal";
import Link from "next/link";
import { toast, Toaster } from 'react-hot-toast';
import { 
  ArrowRight, Zap, Sparkles, RefreshCw, Download, X, Wand2, 
  CreditCard, Crown, Image as ImageIcon, Trash2, Settings2, 
  Maximize2, Palette, Star, Check, Plus, Copy, Upload, XCircle, Coins
, Cpu} from 'lucide-react';
import { PremiumButton } from "@/components/PremiumButton";

const downloadImage = async (url: string, filename: string) => {
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
import { NANO_MODELS, AIModel, calculateImageCost, syncModelsWithDynamicPricing } from '@/lib/ai-models-config';
import { ModelSelector } from '@/components/ModelSelector';
import { processImagePrompt } from '@/lib/prompt-utils';

type CreditsRecord = {
  users_credits_id: number;
  user_id: number;
  plan_id: number;
  plan_name: string;
  total_credits: number;
  remaining_credits: number;
  plan?: { 
    image_profit: number;
  };
};

const IMAGE_STYLES = [
  { id: 'auto', label: 'تلقائي', icon: Wand2, description: 'تحسين ذكي' },
  { id: 'photorealistic', label: 'واقعي', icon: ImageIcon, description: 'فوتوغرافي' },
  { id: 'artistic', label: 'فني', icon: Palette, description: 'إبداع فني' },
  { id: 'cinematic', label: 'سينمائي', icon: Star, description: 'إضاءة دراما' },
];

const IMAGE_SIZES = [
  { id: '1024x1024', label: 'مربع', ratio: '1:1', icon: '◻️', multiplier: 1 },
  { id: '1792x1024', label: 'أفقي', ratio: '16:9', icon: '▬', multiplier: 1.5 },
  { id: '1024x1792', label: 'طولي', ratio: '9:16', icon: '▮', multiplier: 1.5 },
];

export default function NanoBananaPage() {
  const [balance, setBalance] = useState<CreditsRecord | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  
  const [selectedStyle, setSelectedStyle] = useState('auto');
  const [selectedSize, setSelectedSize] = useState('1024x1024');
  
  // Model Selection State
  const [selectedModelId, setSelectedModelId] = useState(NANO_MODELS[0].id);
  const [dynamicPrices, setDynamicPrices] = useState<Record<string, number>>({});

  const dynamicModels = useMemo(() => {
    return syncModelsWithDynamicPricing(NANO_MODELS, dynamicPrices);
  }, [dynamicPrices]);

  const selectedModel = dynamicModels.find(m => m.id === selectedModelId) || dynamicModels[0];

  // Reference Image State
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userImages, setUserImages] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<any | null>(null);

  const [plans, setPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  const promptRef = useRef<HTMLTextAreaElement>(null);
  
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL, []);
  
  const imageProfit = balance?.plan?.image_profit ?? 0;
  // Calculate cost based on selected model + size + profit margin
  const creditsNeeded = calculateImageCost(selectedModel, selectedSize, imageProfit);

  useEffect(() => {
    if (promptRef.current) {
        promptRef.current.style.height = 'auto';
        // تحديد الحد الأقصى بـ 250 بكسل
        const newHeight = Math.min(promptRef.current.scrollHeight, 250);
        promptRef.current.style.height = newHeight + 'px';
    }
  }, [prompt]);
  
  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem("a") : null;

  const fetchBalance = async () => {
    if (!apiBase) return;
    try {
      const res = await fetch(`${apiBase}/api/credits/me/balance`, { headers: { 'Authorization': getToken() as any, "User-Client": (global as any)?.clientId1328 } });
      if (res.status === 200) setBalance(await res.json());
    } catch (e) {}
  };

  const fetchUserImages = async () => {
    if (!apiBase) return;
    try {
      const res = await fetch(`${apiBase}/api/ai/user-images?limit=24&tool=nano_fast`, {
        headers: { 'Authorization': getToken() as any, "User-Client": (global as any)?.clientId1328 }
      });
      if (res.status === 200) {
        const data = await res.json();
        if (data.success) {
          setUserImages(data.images.map((img: any) => ({
            id: img.image_id, url: img.image_url || img.cloudinary_url, date: img.created_at, prompt: img.prompt, is_public: img.is_public
          })));
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
          fetchUserImages();
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
    
    // فحص الرصيد قبل البدء
    if (!balance || balance.remaining_credits < creditsNeeded) {
      setShowUpgradeModal(true);
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setGenerationProgress(0);
    
    let progressValue = 0;
    const interval = setInterval(() => {
      progressValue += Math.random() * 12 + 3;
      if (progressValue >= 95) { clearInterval(interval); progressValue = 95; }
      setGenerationProgress(progressValue);
    }, 400);
    
    try {
      // معالجة البرومبت العربي وتحسينه
      const styleValue = IMAGE_STYLES.find(s => s.id === selectedStyle)?.label || '';
      const processedPrompt = processImagePrompt(prompt, styleValue);
      
      console.log('[NANO] Sending generation request with:', {
        model: selectedModelId,
        size: selectedSize,
        expectedCost: creditsNeeded,
        originalPrompt: prompt,
        processedPrompt: processedPrompt
      });
      
      const res = await fetch(`${apiBase}/api/ai/nano-generate`, {
        method: "POST",
        headers: { 'Authorization': getToken() as any, 'Content-Type': 'application/json', "User-Client": (global as any)?.clientId1328 },
        body: JSON.stringify({ 
          prompt: processedPrompt, // استخدام البرومبت المحسّن
          style: selectedStyle, 
          size: selectedSize,
          model: selectedModelId, // إرسال النموذج المختار
          reference_image: referenceImage // إرسال الصورة المرجعية
        }),
      });
      
      clearInterval(interval);
      setGenerationProgress(100);
      
      if (res.status === 200) {
        const data = await res.json();
        console.log('[NANO] Generation successful, credits used:', data.credits_used);
        toast.success('تم التوليد بنجاح!');
        
        // Add newest image directly to UI
        const newImg = {
          id: data.image_id,
          url: data.image_url || data.cloudinary_url,
          date: new Date().toISOString(),
          prompt: prompt.trim(),
          is_public: false
        };
        setUserImages(prev => [newImg, ...prev]);
        setSelectedImage(newImg); // Open the preview automatically
        
        fetchBalance();
      } else {
        setError(await res.text() || 'فشلت العملية');
      }
    } catch (e) {
      clearInterval(interval);
      setError('خطأ في الاتصال');
    } finally { setIsGenerating(false); }
  };

  const deleteImage = async (id: number, e?: React.MouseEvent) => {
    if(e) e.stopPropagation();
    const prev = [...userImages];
    setUserImages(userImages.filter(img => img.id !== id));
    if (selectedImage?.id === id) setSelectedImage(null);
    try {
      await fetch(`${apiBase}/api/ai/user-images/${id}`, { method: 'DELETE', headers: { 'Authorization': getToken() as any, "User-Client": (global as any)?.clientId1328 } });
      toast.success('تم الحذف');
    } catch (e) { setUserImages(prev); }
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
            body: JSON.stringify({ id, is_public: !currentStatus, type: 'image' })
        });
        const data = await res.json();
        if (data.success) {
            toast.success(currentStatus ? 'تمت الإزالة من المعرض' : 'تم النشر في معرض المحترفين!');
            setUserImages(prev => prev.map(img => img.id === id ? { ...img, is_public: !currentStatus } : img));
            if (selectedImage?.id === id) setSelectedImage({ ...selectedImage, is_public: !currentStatus });
        }
    } catch (e) {
        toast.error('فشلت العملية');
    }
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
      <Toaster position="top-right" />
      <div className="h-screen flex flex-col bg-[#010101] text-white selection:bg-yellow-500/30 overflow-hidden no-scrollbar" dir="rtl">
        <header className="shrink-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 px-6 py-3 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/ai" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 font-bold text-xs"><ArrowRight size={14} /> عودة</Link>
              <div className="flex items-center gap-2 text-yellow-500">
                <Zap size={20} fill="currentColor" />
                <h1 className="text-lg font-bold">نانو بنانا AI</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2">
                <CreditCard size={12} className="text-yellow-400" />
                <span className="text-sm font-bold text-yellow-400">{balance?.remaining_credits || 0}</span>
              </div>
              <button onClick={() => setShowBuyModal(true)} className="bg-yellow-600 px-4 py-1.5 rounded-lg text-[10px] font-black hover:bg-yellow-700 transition-all flex items-center gap-2 text-black"><Crown size={12} /> شراء</button>
            </div>
        </header>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            <aside className="w-full lg:w-[300px] h-auto max-h-[35vh] lg:max-h-full lg:h-full border-b lg:border-b-0 lg:border-l border-white/10 bg-[#050505] overflow-y-auto custom-scrollbar flex flex-col shrink-0 order-1">
                <div className="p-4 space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">وصف الصورة السريع</label>
                        <div className="relative">
                            <textarea 
                                ref={promptRef}
                                value={prompt} 
                                onChange={(e) => setPrompt(e.target.value)} 
                                placeholder="اكتب ما تتخيله هنا..." 
                                maxLength={20000} 
                                className="w-full min-h-[100px] max-h-[250px] p-3 rounded-xl bg-white/5 border border-white/5 focus:border-yellow-500/40 outline-none resize-none transition-all text-xs leading-relaxed custom-scrollbar overflow-y-auto" 
                            />
                            <div className="absolute bottom-2 right-2 text-[8px] bg-black/50 px-1.5 py-0.5 rounded text-gray-400 border border-white/5">
                                {prompt.length}/20000
                            </div>
                        </div>
                    </div>

                    {/* Reference Image Upload */}
                    {/* <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <Upload size={10} className="text-yellow-400" />
                            صورة مرجعية (اختياري)
                        </label>
                        {!referenceImage ? (
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="relative group cursor-pointer"
                            >
                                <div className="w-full h-20 rounded-xl bg-white/5 border border-dashed border-white/10 hover:border-yellow-500/40 transition-all flex flex-col items-center justify-center gap-1.5 hover:bg-white/[0.07]">
                                    <Upload size={16} className="text-gray-600 group-hover:text-yellow-400 transition-colors" />
                                    <span className="text-[9px] text-gray-600 group-hover:text-yellow-300 transition-colors">انقر لرفع صورة</span>
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
                                    className="w-full h-20 object-cover rounded-xl border border-white/10"
                                />
                                <button
                                    onClick={removeReferenceImage}
                                    className="absolute top-1 left-1 p-1 bg-red-500/80 hover:bg-red-500 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <XCircle size={12} />
                                </button>
                                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 rounded text-[8px] text-yellow-400 font-bold">
                                    ✓ مرجع
                                </div>
                            </div>
                        )}
                    </div> */}

                    <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">النمط</label>
                         <div className="grid grid-cols-2 gap-1.5">
                             {IMAGE_STYLES.map(s => (
                                 <button key={s.id} onClick={() => setSelectedStyle(s.id)} className={`flex items-center gap-2 p-2.5 rounded-lg border text-right transition-all ${selectedStyle === s.id ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-300' : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'}`}>
                                     <s.icon size={12} /> <span className="text-[10px] font-bold">{s.label}</span>
                                 </button>
                             ))}
                         </div>
                    </div>

                    <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">الأبعاد</label>
                         <div className="grid grid-cols-3 gap-1.5">
                             {IMAGE_SIZES.map(s => (
                                 <button key={s.id} onClick={() => setSelectedSize(s.id)} className={`p-2.5 rounded-lg border text-center transition-all ${selectedSize === s.id ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-300' : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'}`}>
                                     <div className="text-sm mb-0.5">{s.icon}</div>
                                     <span className="text-[9px] font-black block">{s.label}</span>
                                 </button>
                             ))}
                         </div>
                    </div>

                    {/* Model Selection Section */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <Cpu size={10} className="text-yellow-400" />
                            اختر النموذج
                        </label>
                        <ModelSelector
                            models={dynamicModels}
                            selectedModelId={selectedModelId}
                            onSelectModel={setSelectedModelId}
                            size={selectedSize}
                            profit={imageProfit}
                            compact={true}
                        />
                    </div>
                </div>

                <div className="mt-auto p-4 border-t border-white/5 bg-[#080808]">
                    {error && <div className="mb-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-[9px] font-bold text-center truncate">{error}</div>}
                    <div className="flex items-center justify-between text-[10px] text-gray-400 mb-2 font-medium bg-white/5 p-2 rounded-lg border border-white/10">
                        <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                <Coins size={10} className="text-yellow-500" />
                            </div>
                            <span>التكلفة المتوقعه:</span>
                        </div>
                        <span className="text-white font-bold text-xs">{creditsNeeded}</span>
                    </div>
                    <PremiumButton label={isGenerating ? "جاري التوليد..." : "توليد الآن"} icon={isGenerating ? RefreshCw : Zap} onClick={onGenerate} disabled={!prompt || isGenerating} className="w-full py-3 text-xs rounded-xl" />
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto bg-[#020202] p-6 no-scrollbar order-2">
                <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
                    {isGenerating && (
                         <div className="break-inside-avoid relative rounded-2xl overflow-hidden bg-white/5 aspect-square border border-white/10 ring-1 ring-yellow-500/30 flex flex-col items-center justify-center p-4">
                             <div className="w-10 h-10 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                             <span className="text-[10px] font-bold text-yellow-500">{Math.floor(generationProgress)}%</span>
                         </div>
                    )}
                    {userImages.map((img) => (
                        <div key={img.id} onClick={() => setSelectedImage(img)} className="break-inside-avoid group relative rounded-2xl overflow-hidden bg-[#111] border border-white/5 cursor-pointer transition-all hover:translate-y-[-4px] mb-4">
                            <img src={img.url} className="w-full h-auto object-cover" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                <p className="text-[9px] text-white line-clamp-2 mb-1 opacity-80">{img.prompt}</p>
                                <span className="text-[9px] text-gray-500">{new Date(img.date).toLocaleDateString('ar-EG')}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>

        {selectedImage && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/95 backdrop-blur-3xl animate-fade-in" dir="rtl">
                <button onClick={() => setSelectedImage(null)} className="absolute top-6 right-6 p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all z-20"><X size={24} /></button>
                <div className="relative w-full h-full max-w-6xl flex items-center justify-center gap-8">
                    <div className="flex-1 h-full rounded-2xl bg-black/50 border border-white/10 overflow-hidden flex items-center justify-center">
                        <img src={selectedImage.url} className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="w-[300px] shrink-0 h-full max-h-[600px] bg-[#0c0c0c] border border-white/10 rounded-2xl p-6 hidden lg:flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">البروميت</h3>
                            <button onClick={() => { navigator.clipboard.writeText(selectedImage.prompt); toast.success('تم نسخ البروميت!'); }} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all" title="نسخ البروميت"><Copy size={14} className="text-gray-400" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-4">
                             <div className="bg-white/5 p-4 rounded-xl text-xs text-gray-400 leading-relaxed font-medium break-words whitespace-pre-wrap">{selectedImage.prompt}</div>
                        </div>
                        <div className="space-y-3 pt-6 border-t border-white/10 shrink-0">
                             <button 
                                onClick={() => togglePublicStatus(selectedImage.id, selectedImage.is_public)}
                                className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border text-sm ${
                                    selectedImage.is_public 
                                    ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/20' 
                                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                                }`}
                             >
                                <Sparkles size={18} className={selectedImage.is_public ? 'animate-pulse' : ''} />
                                {selectedImage.is_public ? 'منشور في المعرض' : 'نشر في معرض المحترفين'}
                             </button>
                             <button onClick={() => downloadImage(selectedImage.url, `nano_${selectedImage.id}.png`)} className="w-full py-3 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 text-sm"><Download size={18} /> تحميل</button>
                             <button onClick={(e) => deleteImage(selectedImage.id, e)} className="w-full py-3 bg-red-500/10 border border-red-500/20 text-red-500 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all text-sm"><Trash2 size={18} /> حذف</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Buy Credits Modal */}
        {showBuyModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <div className="bg-[#111] rounded-3xl w-full max-w-lg border border-white/10 overflow-hidden relative" dir="rtl">
              <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-yellow-500 to-orange-500"></div>
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-500/10 rounded-full flex items-center justify-center text-yellow-400"><Crown size={20} /></div>
                  <h2 className="text-xl font-bold text-white">شراء رصيد إضافي</h2>
                </div>
                <button onClick={() => setShowBuyModal(false)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"><X size={20} className="text-gray-400" /></button>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {loadingPlans ? (
                  <div className="text-center py-12"><div className="w-8 h-8 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin mx-auto mb-4"></div><div className="text-gray-400">جاري تحميل الخطط...</div></div>
                ) : plans.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">لا توجد خطط متاحة حالياً</div>
                ) : (
                  <div className="space-y-4">
                    {plans.map((p: any) => (
                      <button key={p.plan_id} onClick={() => { setSelectedPlan(p); setShowBuyModal(false); setOpenPaymentModal(true); }} className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-right transition-all duration-300 border border-white/5 hover:border-yellow-500/50 group">
                        <div className="flex items-center justify-between">
                          <div><div className="font-bold text-white text-lg group-hover:text-yellow-400 transition-colors">{p.plan_name}</div><div className="text-gray-400 text-sm mt-1">{p.credits_per_period} نقطة رصيد / {p.period}</div></div>
                          <div className="text-white font-bold text-xl bg-white/10 px-3 py-1 rounded-lg group-hover:bg-yellow-500 group-hover:text-black transition-all">{p.amount} <span className="bg-gradient-to-r from-[#FF0000] via-[#FFFFFF] to-[#000000] bg-clip-text text-transparent font-bold">IQD</span></div>
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
              <PaymentModal modalOpen={openPaymentModal} setModalOpen={setOpenPaymentModal} productType="credits" period={selectedPlan.period as any} productId={selectedPlan.plan_id} productData={{ tool_name: selectedPlan.plan_name, pack_name: selectedPlan.plan_name, monthly_price: selectedPlan.amount, yearly_price: selectedPlan.amount, tool_day_price: selectedPlan.amount, amount: selectedPlan.amount }} onBuySuccess={() => { setOpenPaymentModal(false); fetchBalance(); }} />
            </div>
          </div>
        )}

        <UpgradeModal 
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
        />
      </div>
    </>
  );
}