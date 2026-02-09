"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import PaymentModal from "@/components/Modals/PaymentModal";
import UpgradeModal from "@/components/Modals/UpgradeModal";
import Link from "next/link";
import { useTranslation } from 'react-i18next';
import { toast, Toaster } from 'react-hot-toast';
import { ArrowRight, Maximize, Sparkles, Upload, Zap, Image as ImageIcon, Download, X, RefreshCw, CreditCard, Crown, ChevronLeft, ArrowLeft, ShieldCheck, Trash2, Coins } from 'lucide-react';
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
  plan?: { plan_id: number; plan_name: string; period: string; credits_per_image: number; tokens_per_credit: number };
};

const UPSCALE_OPTIONS = [
  { id: '2x', name: 'تكبير 2x', description: 'مضاعفة الدقة والوضوح', multiplier: 2, credits: 2 },
  { id: '4x', name: 'تكبير 4x', description: 'أربعة أضعاف الدقة الأصلية', multiplier: 4, credits: 3 },
  { id: '8x', name: 'تكبير 8x', description: 'دقة فائقة الوضوح Ultra HD', multiplier: 8, credits: 5 },
];

export default function ImageUpscalePage() {
  const { t } = useTranslation();
  const [balance, setBalance] = useState<CreditsRecord | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [selectedScale, setSelectedScale] = useState('2x');
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [upscaledImage, setUpscaledImage] = useState<string | null>(null);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upscaleProgress, setUpscaleProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [plans, setPlans] = useState<Array<{ plan_id: number; plan_name: string; credits_per_period: number; amount: string; period: string }>>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ plan_id: number; plan_name: string; credits_per_period: number; amount: string; period: string } | null>(null);

  const imageProfit = balance?.plan?.image_profit ?? 0;

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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/credits/me/balance`, { 
        headers: { 'Authorization': token as any, 'Content-Type': 'application/json', "User-Client": (global as any)?.clientId1328 } 
      });
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
      void loadPlans();
    });
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

  const selectedOption = UPSCALE_OPTIONS.find(option => option.id === selectedScale);
  const baseCredits = selectedOption ? selectedOption.credits : 2;
  const creditsNeeded = baseCredits + imageProfit;
  const canUpscale = clientReady && !!originalImage && !isUpscaling;

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة صالح');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن يكون أقل من 10 ميجا');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
      setUpscaledImage(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

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

  const onUpscale = async () => {
    if (!apiBase || !originalImage) return;
    
    if (!checkCreditsAndShowToast()) {
      return;
    }
    
    setIsUpscaling(true);
    setError(null);
    setUpscaledImage(null);
    setUpscaleProgress(0);
    
    let progressValue = 0;
    const progressInterval = setInterval(() => {
      progressValue += Math.random() * 3 + 1;
      if (progressValue >= 95) {
        progressValue = 95;
        clearInterval(progressInterval);
      }
      setUpscaleProgress(progressValue);
    }, 1000);
    
    try {
      const token = getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/image-upscale`, {
        method: "POST",
        headers: { 'Authorization': token as any, 'Content-Type': 'application/json', "User-Client": (global as any)?.clientId1328 },
        body: JSON.stringify({ 
          image: originalImage, 
          scale: selectedScale,
          enhance_quality: true 
        }),
      });
      
      clearInterval(progressInterval);
      setUpscaleProgress(100);
      
      if (res.status === 200) {
        const data = await res.json();
        const imgSrc = data.image_url || data.cloudinary_url || (data.image_b64 ? `data:image/png;base64,${data.image_b64}` : null);
        setUpscaledImage(imgSrc);
        await fetchBalance();
        fetchUserImages(); // Refresh list
        toast.success('تم تحسين الصورة بنجاح!');
      } else if (res.status === 402) {
        setError('نفذ الرصيد');
        await fetchBalance();
      } else if (res.status === 401) {
        setError('يرجى تسجيل الدخول');
      } else {
        const text = await res.text();
        setError(text || 'فشلت عملية التحسين');
      }
    } catch (e: any) {
      clearInterval(progressInterval);
      setError('خطأ في الاتصال بالشبكة');
    } finally {
      setIsUpscaling(false);
      setUpscaleProgress(0);
    }
  };

  // Previous Works Logic
  const [userImages, setUserImages] = useState<any[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);

  const fetchUserImages = async () => {
    if (!apiBase) return;
    const token = getToken();
    setLoadingImages(true);
    try {
      const res = await fetch(`${apiBase}/api/ai/user-images?limit=12&tool=upscale`, {
        headers: { 'Authorization': token as any, 'Content-Type': 'application/json', "User-Client": (global as any)?.clientId1328 }
      });
      if (res.status === 200) {
        const data = await res.json();
        if (data.success) {
            setUserImages(data.images.map((img: any) => ({
                id: img.image_id,
                url: img.image_url || img.cloudinary_url,
                prompt: img.prompt
            })));
        }
      }
    } catch (e) {} finally { setLoadingImages(false); }
  };

  const deleteImage = async (imageId: number) => {
      if (!apiBase) return;
      const token = getToken();
      setUserImages(userImages.filter(img => img.id !== imageId));
      try {
          await fetch(`${apiBase}/api/ai/user-images/${imageId}`, {
              method: 'DELETE',
              headers: { 'Authorization': token as any, "User-Client": (global as any)?.clientId1328 }
          });
          toast.success('تم الحذف');
      } catch (e) {}
  };

  const deleteAllImages = async () => {
      if (!confirm('حذف جميع الصور؟')) return;
      if (!apiBase) return;
      const token = getToken();
      setUserImages([]);
      try {
          await fetch(`${apiBase}/api/ai/user-images`, {
              method: 'DELETE',
              headers: { 'Authorization': token as any, "User-Client": (global as any)?.clientId1328 }
          });
          toast.success('تم حذف السجل');
      } catch (e) {}
  };

  useEffect(() => {
     if (clientReady) {
         fetchUserImages();
     }
  }, [clientReady]);

  const downloadImage = async () => {
    if (!upscaledImage) return;
    
    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `nexus_ai_upscaled_${selectedScale}_${timestamp}.png`;
      
      if (upscaledImage.startsWith('http')) {
        const response = await fetch(upscaledImage);
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
        link.href = upscaledImage;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      toast.success('تم تحميل الصورة بنجاح!');
    } catch (error) {
      window.open(upscaledImage, '_blank');
    }
  };

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid #333'
          }
        }}
      />

      <div className="h-full bg-[#000000] text-white selection:bg-indigo-500/30 font-sans" dir="rtl">
        {/* Background Ambience */}
        <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
        <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="fixed bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/5 blur-[120px] rounded-full pointer-events-none"></div>

        {/* Header */}
        <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-[1600px] mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link 
                  href="/ai" 
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/10"
                >
                  <ArrowRight size={16} />
                  <span className="text-sm font-bold">عودة</span>
                </Link>
                
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold">تحسين الجودة</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                  {loadingBalance ? (
                    <span className="text-[10px] text-gray-400">جاري التحميل...</span>
                  ) : balance ? (
                    <div className="flex items-center gap-2">
                       <CreditCard size={12} className="text-indigo-400" />
                      <span className="text-xs text-gray-300">الرصيد:</span>
                      <span className={`text-sm font-bold ${
                        balance.remaining_credits === 0 ? 'text-red-400' : 'text-indigo-400'
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
                  <span
                    className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#4f46e5_0%,#818cf8_50%,#6366f1_100%)]"
                  >
                  </span>
                  <span
                    className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-lg bg-[#050505] px-3 text-[10px] font-black text-white backdrop-blur-3xl gap-1.5 transition-all hover:bg-black/40"
                  >
                    <Crown size={12} className="text-indigo-500" />
                    شراء كريديت
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-[1600px] mx-auto p-4 lg:p-6">
          <div className="grid lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column - Actions */}
            <aside className="order-1 lg:col-span-4 space-y-4 lg:sticky lg:top-24">
                <div className="bg-[#0c0c0c] rounded-2xl p-4 border border-white/5">
                    <label className="block text-[10px] font-bold text-gray-500 mb-2 px-1 uppercase tracking-wider flex items-center gap-1.5">
                        <Upload size={12} className="text-indigo-400" />
                        <span>ارفع الصورة</span>
                    </label>
                    <div 
                    className="border border-dashed border-white/10 rounded-xl p-4 text-center hover:border-indigo-500/30 transition-all cursor-pointer group bg-white/[0.02]"
                    onClick={() => fileInputRef.current?.click()}
                    >
                    {originalImage ? (
                        <div className="space-y-2">
                            <img 
                                src={originalImage} 
                                alt="Original" 
                                className="max-w-full max-h-40 mx-auto rounded-lg shadow-lg"
                            />
                            <div className="text-indigo-400 text-[10px] font-bold flex items-center justify-center gap-1.5">
                                <RefreshCw size={12} />
                                تغيير الصورة
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2 py-4">
                            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                                <Upload size={16} className="text-gray-500 group-hover:text-indigo-400 transition-colors" />
                            </div>
                            <div>
                                <p className="text-white text-[10px] font-bold">اضغط لرفع الملف</p>
                                <p className="text-gray-500 text-[8px] mt-0.5 font-medium">PNG, JPG بحد أقصى 10 ميجا</p>
                            </div>
                        </div>
                    )}
                    </div>
                    <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    />
                </div>

              {/* Options */}
              <div className="bg-[#0c0c0c] rounded-2xl p-4 border border-white/5 group">
                <div className="flex items-center gap-1.5 mb-2 px-1">
                       <Maximize size={12} className="text-indigo-400" />
                       <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">معامل التكبير</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {UPSCALE_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSelectedScale(option.id)}
                      className={`flex flex-col items-center gap-0.5 p-2 rounded-lg transition-all duration-300 border relative overflow-hidden group/opt ${
                        selectedScale === option.id
                          ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300 backdrop-blur-xl'
                          : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/10 hover:bg-white/[0.08] hover:text-white'
                      }`}
                    >
                      <span className="text-xs font-black relative z-10">{option.multiplier}x</span>
                      <span className="text-[8px] font-bold relative z-10 opacity-70 uppercase tracking-tighter">{option.credits} نقطة</span>
                    </button>
                  ))}
                </div>

                {/* Action Button */}
                <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
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
                        label={isUpscaling ? "جاري التحسين..." : "تحسين الصورة الآن"}
                        icon={isUpscaling ? RefreshCw : Zap}
                        onClick={onUpscale}
                        disabled={!canUpscale}
                        className="w-full py-3 text-xs rounded-xl"
                    />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-bold text-center flex items-center justify-center gap-2 truncate">
                  <X size={12} />
                  {error}
                </div>
              )}
            </aside>

            {/* Left Column - Results */}
            <div className="lg:col-span-8 order-2 lg:order-1 space-y-4">
              <div className="bg-[#080808] rounded-3xl border border-white/5 min-h-[400px] lg:min-h-[600px] flex items-center justify-center relative overflow-hidden group shadow-inner">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none"></div>
                
                {upscaledImage ? (
                  <div className="relative w-full h-full p-6 flex flex-col items-center justify-center group/result">
                    <img
                      src={upscaledImage}
                      alt="Upscaled"
                      className="max-h-[550px] w-auto max-w-full rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.6)] z-10 animate-scale-up border border-white/10"
                    />
                    <div className="absolute top-6 right-6 flex gap-2 z-20">
                      <button
                        onClick={downloadImage}
                        className="p-2 bg-black/70 hover:bg-black rounded-lg border border-white/10 backdrop-blur-xl transition-all shadow-xl group/dl text-white"
                        title="تحميل بجودة عالية"
                      >
                        <Download size={16} className="group-hover/dl:scale-110 transition-transform" />
                      </button>
                      <button
                        onClick={() => setUpscaledImage(null)}
                        className="p-2 bg-black/70 hover:bg-black rounded-lg border border-white/10 backdrop-blur-xl transition-all shadow-xl group/cls text-white"
                        title="إغلاق"
                      >
                        <X size={16} className="group-hover/cls:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                ) : isUpscaling ? (
                  <div className="text-center relative z-10 w-full max-w-xs px-6">
                    <div className="w-20 h-20 relative mx-auto mb-6">
                        <div className="absolute inset-0 rounded-full border-2 border-indigo-500/10"></div>
                        <div className="absolute inset-0 rounded-full border-2 border-t-indigo-500 animate-spin"></div>
                        <Sparkles className="absolute inset-0 m-auto text-indigo-400 animate-pulse" size={24} />
                    </div>
                    <div className="text-lg font-bold mb-2">جاري المعالجة...</div>
                    <p className="text-gray-500 text-xs mb-6 font-medium">نقوم حالياً بإعادة بناء تفاصيل الصورة بدقة عالية</p>
                    
                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden mb-2">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-purple-400 h-full rounded-full transition-all duration-700 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                        style={{ width: `${upscaleProgress}%` }}
                      ></div>
                    </div>
                    <div className="text-indigo-400 font-mono text-xs font-bold">{Math.floor(upscaleProgress)}%</div>
                  </div>
                ) : (
                  <div className="text-center relative z-10 p-8">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10 group-hover:scale-105 transition-all duration-500 shadow-xl overflow-hidden">
                       <ImageIcon size={24} className="text-white/20 group-hover:text-indigo-500/40 transition-all duration-500" />
                    </div>
                    <h2 className="text-lg font-bold mb-2 text-gray-300">قبل وبعد</h2>
                    <p className="text-gray-600 max-w-[250px] mx-auto text-xs font-medium leading-relaxed">بمجرد الانتهاء، ستتمكن من رؤية الفرق المذهل في الوضوح وتفاصيل الصورة هنا</p>
                  </div>
                )}
              </div>
              
              {/* Previous Works Section - Upscale */}
              <div className="mt-8 lg:col-span-12 border-t border-white/5 pt-6 order-3">
                   <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                         <ImageIcon size={14} className="text-indigo-400" />
                         <span className="text-sm font-bold text-white">تحسيناتك السابقة</span>
                      </div>
                      
                      {userImages.length > 0 && (
                          <button 
                            onClick={deleteAllImages}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-md text-[10px] font-bold transition-all"
                          >
                             <Trash2 size={12} />
                             <span>حذف الكل</span>
                          </button>
                      )}
                   </div>

                   {loadingImages ? (
                       <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 animate-pulse">
                           {[...Array(8)].map((_, i) => (
                               <div key={i} className="aspect-square bg-white/5 rounded-xl"></div>
                           ))}
                       </div>
                   ) : userImages.length > 0 ? (
                       <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                          {userImages.map((img: any) => (
                              <div key={img.id} className="group relative aspect-square rounded-xl overflow-hidden border border-white/5 bg-white/[0.02]">
                                 <img 
                                    src={img.url} 
                                    alt={img.prompt} 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                 />
                                 <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                                     <button 
                                        onClick={() => deleteImage(img.id)}
                                        className="p-1.5 bg-red-500/20 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all"
                                        title="حذف"
                                     >
                                         <Trash2 size={12} />
                                     </button>
                                     <button 
                                        onClick={() => {
                                            setUpscaledImage(img.url);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        className="p-1.5 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all"
                                        title="فتح"
                                     >
                                         <ArrowRight size={12} className="rotate-180" />
                                     </button>
                                 </div>
                              </div>
                          ))}
                       </div>
                   ) : (
                      <div className="py-8 text-center border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                         <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-2 text-gray-500">
                            <ImageIcon size={16} />
                         </div>
                         <p className="text-gray-400 font-medium text-xs">لا توجد صور سابقة</p>
                      </div>
                   )}
                </div>
              
           
            </div>
          </div>
        </div>
      </div>

      {/* Buy Credits Modal */}
      {showBuyModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-[#111] rounded-3xl w-full max-w-lg border border-white/10 overflow-hidden relative" dir="rtl">
            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400">
                    <Crown size={20} />
                </div>
                <h2 className="text-xl font-bold text-white">شراء باقة نقاط</h2>
              </div>
              <button onClick={closeBuyModal} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {loadingPlans ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <div className="text-gray-400">جاري جلب الباقات...</div>
                </div>
              ) : plans.length === 0 ? (
                <div className="text-center py-12 text-gray-500">لا توجد عروض حالياً</div>
              ) : (
                <div className="space-y-4">
                  {plans.map((p) => (
                    <button
                      key={p.plan_id}
                      onClick={() => onSelectPlan(p.plan_id)}
                      className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-right transition-all border border-white/5 hover:border-indigo-500/50 group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white text-lg group-hover:text-indigo-400 transition-colors">{p.plan_name}</div>
                          <div className="text-gray-400 text-sm mt-1">{p.credits_per_period} نقطة رصيد / {p.period}</div>
                        </div>
                        <div className="text-white font-bold text-xl bg-white/10 px-3 py-1 rounded-lg group-hover:bg-indigo-600">
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

      <UpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </>
  );
}