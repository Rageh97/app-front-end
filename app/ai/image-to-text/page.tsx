"use client";

import React, { useEffect, useMemo, useState } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import PaymentModal from "@/components/Modals/PaymentModal";
import UpgradeModal from "@/components/Modals/UpgradeModal";
import Link from "next/link";
import { useTranslation } from 'react-i18next';
import { toast, Toaster } from 'react-hot-toast';
import { Copy, Check, ArrowRight, Image as ImageIcon, Upload, X, Sparkles, FileText, Wand2, CreditCard, Crown, ChevronLeft, Zap, RefreshCw, ArrowLeft, ShieldCheck, Coins } from 'lucide-react';
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
  plan?: { plan_id: number; plan_name: string; period: string; credits_per_image: number; tokens_per_credit: number; image_profit?: number };
};

export default function ImageToTextPage() {
  const { t } = useTranslation();
  const [balance, setBalance] = useState<CreditsRecord | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Image-to-prompt states
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const [plans, setPlans] = useState<Array<{ plan_id: number; plan_name: string; credits_per_period: number; amount: string; period: string }>>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ plan_id: number; plan_name: string; credits_per_period: number; amount: string; period: string } | null>(null);

  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL, []);
  const baseCredits = 2;
  const imageProfit = balance?.plan?.image_profit ?? 0;
  const creditsNeeded = baseCredits + imageProfit;

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

  const checkCreditsAndShowToast = () => {
    if (!balance || balance.remaining_credits < creditsNeeded) {
      setShowUpgradeModal(true);
      return false;
    }
    return true;
  };

  const copyPromptToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPrompt(true);
      toast.success('تم النسخ للحافظة');
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch (err) {
      toast.error('فشل النسخ');
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('نوع الملف غير مدعوم');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('حجم الصورة كبير جداً (الأقصى 10 ميجا)');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        setError(null);
        setGeneratedPrompt("");
      };
      reader.readAsDataURL(file);
    }
  };

  const generatePromptFromImage = async () => {
    if (!uploadedImage || !clientReady) return;
    
    if (!checkCreditsAndShowToast()) {
      return;
    }
    
    setIsGeneratingPrompt(true);
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
      const getHeaders = () => {
        const token = getToken();
        return {
          'Authorization': token as any,
          'Content-Type': 'application/json',
          'User-Client': (global as any)?.clientId1328
        };
      };

      const res = await fetch(`${apiBase}/api/ai/image-to-prompt`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ image: uploadedImage })
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (res.status === 200) {
        const data = await res.json();
        setGeneratedPrompt(data.prompt);
        await fetchBalance();
        toast.success('تم استخراج الوصف بنجاح!');
      } else if (res.status === 402) {
        setError('نفذ الرصيد');
        await fetchBalance();
      } else if (res.status === 401) {
        setError('يرجى تسجيل الدخول');
      } else {
        const text = await res.text();
        setError(text || 'حدث خطأ في استخراج الوصف');
      }
    } catch (e: any) {
      clearInterval(progressInterval);
      setError('خطأ في الاتصال بالإنترنت');
    } finally {
      setIsGeneratingPrompt(false);
      setGenerationProgress(0);
    }
  };

  const clearUploadedImage = () => {
    setUploadedImage(null);
    setImageFile(null);
    setGeneratedPrompt("");
    setError(null);
  };

  // Previous Works Logic
  const [userImages, setUserImages] = useState<any[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);

  const fetchUserImages = async () => {
    if (!apiBase) return;
    const token = getToken();
    setLoadingImages(true);
    try {
      const res = await fetch(`${apiBase}/api/ai/user-images?limit=10&tool=image-to-prompt`, {
        headers: { 'Authorization': token as any, 'Content-Type': 'application/json', "User-Client": (global as any)?.clientId1328 }
      });
      if (res.status === 200) {
        const data = await res.json();
        if (data.success) {
            setUserImages(data.images.map((img: any) => ({
                id: img.image_id,
                prompt: img.prompt,
                date: img.created_at
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

  useEffect(() => {
     if (clientReady) {
         fetchUserImages();
     }
  }, [clientReady]);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid #333',
          }
        }}
      />

      <div className="h-screen flex flex-col bg-[#000000] text-white selection:bg-green-500/30 font-sans overflow-hidden" dir="rtl">
        {/* Background Ambience */}
        <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none z-0"></div>
        <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-green-900/5 blur-[120px] rounded-full pointer-events-none"></div>

        {/* Header */}
        <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
          <div className="px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link 
                  href="/ai" 
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/10"
                >
                  <ArrowRight size={16} />
                  <span className="text-sm font-bold">عودة</span>
                </Link>
                
                <div className="flex items-center gap-2">
                  <span className="w-2 h-8 bg-emerald-600 rounded-full"></span>
                  <h1 className="text-lg font-bold">صورة إلى نص</h1>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                  {loadingBalance ? (
                    <span className="text-[10px] text-gray-400">جاري التحميل...</span>
                  ) : balance ? (
                    <div className="flex items-center gap-2">
                       <CreditCard size={12} className="text-emerald-400" />
                      <span className="text-xs text-gray-300">الرصيد:</span>
                      <span className={`text-sm font-bold ${
                        balance.remaining_credits === 0 ? 'text-red-400' : 
                        balance.remaining_credits <= 5 ? 'text-yellow-400' : 'text-emerald-400'
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
                  <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#10b981_0%,#34d399_50%,#059669_100%)]"></span>
                  <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-lg bg-[#050505] px-3 text-[10px] font-black text-white backdrop-blur-3xl gap-1.5 transition-all hover:bg-black/40">
                    <Crown size={12} className="text-emerald-500" />
                    شراء كريديت
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden relative z-10">
          
          {/* Right Sidebar (Settings) - Fixed Width */}
          <aside className="w-[280px] md:w-[300px] flex flex-col border-l border-white/10 bg-[#050505] overflow-y-auto custom-scrollbar shrink-0">
            <div className="p-4 space-y-4">
              
              {/* Upload Area */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 flex items-center gap-2 uppercase tracking-wide">
                  <Upload size={12} className="text-emerald-400" />
                  رفع الصورة
                </label>
                
                {!uploadedImage ? (
                  <div 
                    onClick={() => document.getElementById('image-upload')?.click()}
                    className="relative group cursor-pointer"
                  >
                    <div className="w-full h-40 rounded-xl bg-white/5 border border-dashed border-white/10 hover:border-emerald-500/40 transition-all flex flex-col items-center justify-center gap-2 hover:bg-white/[0.07]">
                      <Upload size={24} className="text-gray-500 group-hover:text-emerald-400 transition-colors" />
                      <div className="text-center">
                        <span className="text-[11px] text-gray-400 group-hover:text-emerald-300 transition-colors block mb-0.5 font-bold">انقر لرفع صورة</span>
                        <span className="text-[9px] text-gray-600">JPG, PNG, WEBP</span>
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                  </div>
                ) : (
                  <div className="relative group">
                    <img 
                      src={uploadedImage} 
                      alt="Uploaded" 
                      className="w-full h-40 object-cover rounded-xl border border-white/10 shadow-lg"
                    />
                    <button
                      onClick={clearUploadedImage}
                      className="absolute top-2 left-2 p-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <X size={14} />
                    </button>
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-[8px] text-emerald-400 font-bold border border-emerald-500/20 backdrop-blur-md">
                      ✓ جاهز للتحليل
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Generate Button - Fixed at bottom */}
            <div className="mt-auto p-4 border-t border-white/5 bg-[#080808]">
              {error && (
                <div className="mb-2 p-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[9px] font-bold text-center truncate">
                  {error}
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
                label={isGeneratingPrompt ? "جاري التحليل..." : "استخراج الوصف الآن"}
                icon={isGeneratingPrompt ? RefreshCw : Wand2}
                onClick={generatePromptFromImage}
                disabled={!clientReady || !uploadedImage || isGeneratingPrompt}
                className="w-full py-3 text-xs rounded-xl"
              />
            </div>
          </aside>

          {/* Left Main Area (Results) - Scrollable */}
          <main className="flex-1 overflow-y-auto bg-[#020202] custom-scrollbar relative">
            
            {/* Results Display Area */}
            <div className="h-[60vh] flex items-center justify-center border-b border-white/5 bg-[#080808] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none"></div>
              
              {generatedPrompt ? (
                <div className="w-full h-full p-6 relative z-10 flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                      <h3 className="text-lg font-bold">الوصف المستخرج</h3>
                    </div>
                    <button
                      onClick={() => copyPromptToClipboard(generatedPrompt)}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all flex items-center gap-1.5 text-xs text-gray-300 font-bold"
                    >
                      {copiedPrompt ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      <span>{copiedPrompt ? 'تم النسخ' : 'نسخ النص'}</span>
                    </button>
                  </div>
                  
                  <div className="flex-1 p-6 bg-white/[0.02] rounded-2xl border border-white/5 relative overflow-y-auto custom-scrollbar">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                      <FileText size={100} />
                    </div>
                    <p className="text-gray-300 leading-relaxed text-base font-medium relative z-10">{generatedPrompt}</p>
                  </div>
                </div>
              ) : isGeneratingPrompt ? (
                <div className="text-center relative z-10 w-full max-w-xs px-6">
                  <div className="w-20 h-20 relative mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full border-2 border-emerald-500/10"></div>
                    <div className="absolute inset-0 rounded-full border-2 border-t-emerald-500 animate-spin"></div>
                    <Sparkles className="absolute inset-0 m-auto text-emerald-400 animate-pulse" size={24} />
                  </div>
                  <div className="text-lg font-bold mb-2">جاري التحليل...</div>
                  <p className="text-gray-500 text-xs mb-6 font-medium">يقوم الذكاء الاصطناعي الآن بقراءة تفاصيل الصورة بعناية</p>
                  
                  <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden mb-2">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-green-400 h-full rounded-full transition-all duration-700 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                      style={{ width: `${generationProgress}%` }}
                    ></div>
                  </div>
                  <div className="text-emerald-400 font-mono text-xs font-bold">{Math.floor(generationProgress)}%</div>
                </div>
              ) : (
                <div className="text-center relative z-10 p-8 opacity-60">
                  <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <Sparkles size={40} className="text-white/20" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">انتظار الصورة</h3>
                  <p className="text-gray-500 max-w-xs mx-auto text-sm">قم برفع الصورة من القائمة الجانبية وسنقوم بتحويلها إلى وصف نصي دقيق فوراً</p>
                </div>
              )}
            </div>

            {/* Previous Works Section */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-emerald-400" />
                  <span className="text-sm font-bold text-white">سجل الأوصاف المستخرجة</span>
                </div>
              </div>

              {loadingImages ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 animate-pulse">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-32 bg-white/5 rounded-xl"></div>
                  ))}
                </div>
              ) : userImages.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {userImages.map((item: any) => (
                    <div key={item.id} className="p-4 bg-[#0c0c0c] border border-white/5 rounded-xl group hover:border-emerald-500/30 transition-all flex flex-col justify-between min-h-[140px]">
                      <p className="text-gray-400 text-xs line-clamp-3 mb-3 leading-relaxed font-medium">{item.prompt}</p>
                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                        <span className="text-[9px] text-gray-600 font-mono">
                          {new Date(item.date).toLocaleDateString('ar-EG')}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => deleteImage(item.id)}
                            className="p-1.5 text-gray-600 hover:text-red-500 transition-colors"
                            title="حذف"
                          >
                            <X size={14} />
                          </button>
                          <button 
                            onClick={() => copyPromptToClipboard(item.prompt)}
                            className="px-3 py-1 bg-white/5 hover:bg-emerald-500/10 text-white hover:text-emerald-400 rounded-md text-[9px] font-bold transition-all border border-white/10 hover:border-emerald-500/20"
                          >
                            نسخ النص
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                  <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-2 text-gray-600">
                    <FileText size={16} />
                  </div>
                  <p className="text-gray-500 font-bold text-xs">لا توجد سجلات سابقة</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Buy Credits Modal */}
      {showBuyModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-[#111] rounded-3xl w-full max-w-lg border border-white/10 overflow-hidden relative" dir="rtl">
            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>
            
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center text-green-400">
                    <Crown size={20} />
                </div>
                <h2 className="text-xl font-bold text-white">إضافة نقاط رصيد</h2>
              </div>
              <button onClick={closeBuyModal} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {loadingPlans ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <div className="text-gray-400">جاري تحميل الباقات...</div>
                </div>
              ) : plans.length === 0 ? (
                <div className="text-center py-12 text-gray-500">لا توجد خطط متاحة</div>
              ) : (
                <div className="space-y-4">
                  {plans.map((p) => (
                    <button
                      key={p.plan_id}
                      onClick={() => onSelectPlan(p.plan_id)}
                      className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-right transition-all border border-white/5 hover:border-green-500/50 group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white text-lg group-hover:text-green-400 transition-colors">{p.plan_name}</div>
                          <div className="text-gray-400 text-sm mt-1">{p.credits_per_period} نقطة رصيد / {p.period}</div>
                        </div>
                        <div className="text-white font-bold text-xl bg-white/10 px-3 py-1 rounded-lg group-hover:bg-green-500">
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