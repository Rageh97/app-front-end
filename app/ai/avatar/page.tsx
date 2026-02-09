"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import PaymentModal from "@/components/Modals/PaymentModal";
import UpgradeModal from "@/components/Modals/UpgradeModal";
import Link from "next/link";
import { toast, Toaster } from 'react-hot-toast';
import { 
  ArrowRight, Users, Upload, Download, X, RefreshCw, 
  CreditCard, Crown, ChevronLeft, ArrowLeft, 
  Image as ImageIcon, Trash2, Zap, Move3D, Sparkles,
  Maximize2, Plus, Coins
} from 'lucide-react';
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
  plan?: { 
    plan_id: number; 
    plan_name: string; 
    period: string; 
    image_profit: number;
  };
};

const AVATAR_STYLES = [
    { id: 'cartoon', name: 'كرتون', icon: <Sparkles size={14} />, description: 'طابع كرتوني ممتع' },
    { id: 'anime', name: 'أنمي', icon: <ImageIcon size={14} />, description: 'ستايل ياباني عصري' },
    { id: 'cyberpunk', name: 'سايبر بانك', icon: <Zap size={14} />, description: 'عالم المستقبل' },
    { id: 'pixar', name: 'بيكسار', icon: <Move3D size={14} />, description: 'نمط أفلام بيكسار' },
];

export default function AvatarCreatorPage() {
  const [balance, setBalance] = useState<CreditsRecord | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('cartoon');
  const [customPrompt, setCustomPrompt] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize prompt textarea
  useEffect(() => {
    if (promptRef.current) {
      promptRef.current.style.height = '60px'; 
      const scrollHeight = promptRef.current.scrollHeight;
      if (scrollHeight > 60) {
        promptRef.current.style.height = `${scrollHeight}px`;
      }
    }
  }, [customPrompt]);

  // Gallery & Interaction
  const [userImages, setUserImages] = useState<any[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any | null>(null);

  const [plans, setPlans] = useState<Array<{ plan_id: number; plan_name: string; credits_per_period: number; amount: string; period: string }>>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ plan_id: number; plan_name: string; credits_per_period: number; amount: string; period: string } | null>(null);

  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL, []);

  const getToken = () => {
    if (typeof window !== 'undefined') return localStorage.getItem("a");
    return null;
  };

  const fetchBalance = async () => {
    if (!apiBase) return;
    const token = getToken();
    setLoadingBalance(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/credits/me/balance`, { 
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
      } catch (_) {}
    };
    ensureClientId().then(() => {
      fetchBalance();
      fetchUserImages();
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

  const fetchUserImages = async () => {
    if (!apiBase) return;
    const token = getToken();
    setLoadingImages(true);
    try {
      const res = await fetch(`${apiBase}/api/ai/user-images?limit=24&tool=avatar`, {
        headers: { 'Authorization': token as any, 'Content-Type': 'application/json', "User-Client": (global as any)?.clientId1328 }
      });
      if (res.status === 200) {
        const data = await res.json();
        if (data.success) {
            setUserImages(data.images.map((img: any) => ({
                id: img.image_id,
                url: img.image_url || img.cloudinary_url,
                prompt: img.prompt,
                date: img.created_at
            })));
        }
      }
    } catch (e) {} finally { setLoadingImages(false); }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('حجم الصورة كبير جداً');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSelectPlan = async (plan_id: number) => {
    const plan = plans.find(p => p.plan_id === plan_id) || null;
    if (!plan) return;
    setSelectedPlan(plan);
    setShowBuyModal(false);
    setOpenPaymentModal(true);
  };

  const baseCredits = 5;
  const imageProfit = balance?.plan?.image_profit ?? 0;
  const creditsNeeded = baseCredits + imageProfit;
  const canGenerate = clientReady && !!uploadedImage && !isGenerating;

  const onGenerate = async () => {
    if (!apiBase || !uploadedImage) return;
    
    // فحص الرصيد قبل البدء
    if (!balance || balance.remaining_credits < creditsNeeded) {
      setShowUpgradeModal(true);
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setGenerationProgress(0);
    
    let progressValue = 0;
    const progressInterval = setInterval(() => {
      progressValue += Math.random() * 5 + 2;
      if (progressValue >= 95) {
        progressValue = 95;
        clearInterval(progressInterval);
      }
      setGenerationProgress(progressValue);
    }, 600);
    
    try {
      const token = getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/avatar-create`, {
        method: "POST",
        headers: { 'Authorization': token as any, 'Content-Type': 'application/json', "User-Client": (global as any)?.clientId1328 },
        body: JSON.stringify({ image: uploadedImage, style: selectedStyle, customPrompt }),
      });
      
      clearInterval(progressInterval);
      setGenerationProgress(100);
      
      if (res.status === 200) {
        const data = await res.json();
        await fetchBalance();
        await fetchUserImages();
        toast.success('تم إنشاء الأفاتار بنجاح!');
      } else {
        const text = await res.text();
        setError(text || 'فشلت العملية');
      }
    } catch (e: any) {
      clearInterval(progressInterval);
      setError('خطأ في الاتصال');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  const deleteImage = async (imageId: number, e?: React.MouseEvent) => {
      if(e) e.stopPropagation();
      if (!apiBase) return;
      const token = getToken();
      const prev = [...userImages];
      setUserImages(userImages.filter(img => img.id !== imageId));
      if (selectedImage?.id === imageId) setSelectedImage(null);
      try {
          await fetch(`${apiBase}/api/ai/user-images/${imageId}`, {
              method: 'DELETE',
              headers: { 'Authorization': token as any, "User-Client": (global as any)?.clientId1328 }
          });
          toast.success('تم الحذف');
      } catch (e) { setUserImages(prev); }
  };

  const downloadUtils = async (url: string) => {
    try {
      const toastId = toast.loading('وجاري التحميل...');
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `nexus_avatar_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.dismiss(toastId);
      toast.success('تم التحميل');
    } catch (e) {
      toast.dismiss();
      window.open(url, '_blank');
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="h-screen flex flex-col bg-[#010101] text-white selection:bg-orange-500/30 font-sans overflow-hidden" dir="rtl">
        <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none z-0"></div>
        
        <header className="shrink-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
          <div className="px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/ai" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/10">
                <ArrowRight size={16} />
                <span className="text-sm font-bold">عودة</span>
              </Link>
              <div className="flex items-center gap-2">
                  <span className="w-2 h-8 bg-orange-600 rounded-full"></span>
                  <h1 className="text-lg font-bold">أفاتار AI</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                <CreditCard size={12} className="text-orange-400" />
                <span className={`text-sm font-bold ${balance?.remaining_credits === 0 ? 'text-red-400' : 'text-orange-400'}`}>
                  {balance?.remaining_credits || 0}
                </span>
              </div>
              <button onClick={() => setShowBuyModal(true)} className="relative inline-flex h-8 items-center justify-center rounded-lg bg-orange-600 px-4 text-[10px] font-black group overflow-hidden transition-all">
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
                <Crown size={12} className="mr-1.5" /> شراء
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative z-10">
            <aside className="w-full lg:w-[300px] h-auto max-h-[35vh] lg:max-h-full lg:h-full flex flex-col border-b lg:border-b-0 lg:border-l border-white/10 bg-[#050505] overflow-y-auto custom-scrollbar shrink-0 order-1">
                <div className="p-4 space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 flex items-center gap-2 uppercase tracking-wide">
                            <Upload size={12} className="text-orange-400" /> ارفع صورتك
                        </label>
                        <div onClick={() => fileInputRef.current?.click()} className="relative group cursor-pointer border-2 border-dashed border-white/10 rounded-xl p-4 text-center hover:border-orange-500/40 hover:bg-orange-500/5 transition-all">
                            {uploadedImage ? (
                                <div className="space-y-1">
                                    <img src={uploadedImage} alt="Up" className="h-24 mx-auto rounded-lg object-cover" />
                                    <span className="text-[9px] text-orange-400 font-bold">تغيير الصورة</span>
                                </div>
                            ) : (
                                <div className="py-2">
                                    <Plus size={20} className="mx-auto text-gray-600 mb-1" />
                                    <p className="text-[9px] text-gray-500">ارفع صورة شخصية</p>
                                </div>
                            )}
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 flex items-center gap-2 uppercase tracking-wide">
                            <Sparkles size={12} className="text-yellow-400" /> النمط الفني
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                             {AVATAR_STYLES.map((s) => (
                                <button key={s.id} onClick={() => setSelectedStyle(s.id)} className={`flex items-center gap-1.5 p-2 rounded-lg border transition-all truncate ${
                                    selectedStyle === s.id ? 'bg-orange-500/10 border-orange-500/40 text-orange-300' : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'}`}>
                                    <span className={`shrink-0 ${selectedStyle === s.id ? 'text-orange-400' : 'text-gray-600'}`}>
                                        {React.cloneElement(s.icon as React.ReactElement, { size: 12 })}
                                    </span>
                                    <span className="text-[10px] font-bold truncate">{s.name}</span>
                                </button>
                             ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                         <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">وصف إضافي</label>
                         <textarea 
                            ref={promptRef}
                            value={customPrompt} 
                            onChange={(e) => setCustomPrompt(e.target.value)} 
                            placeholder="مثال: خلفية فضاء، ملابس ملكية..." 
                            className="w-full min-h-[60px] p-2 rounded-lg bg-white/5 border border-white/10 focus:border-orange-500/40 text-[10px] outline-none transition-all resize-none overflow-hidden" 
                         />
                    </div>
                </div>

                <div className="p-4 mt-auto border-t border-white/10 bg-[#080808]">
                     {error && <div className="mb-2 px-2 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[9px] font-bold truncate">{error}</div>}
                     
                     <div className="flex items-center justify-between text-[10px] text-gray-400 mb-2 font-medium bg-white/5 p-2 rounded-lg border border-white/10">
                        <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                <Coins size={10} className="text-yellow-500" />
                            </div>
                            <span>التكلفة المتوقعه:</span>
                        </div>
                        <span className="text-white font-bold text-xs">{creditsNeeded}</span>
                     </div>

                     <PremiumButton label={isGenerating ? "جاري الإنشاء..." : "إنشاء الأفاتار"} icon={isGenerating ? RefreshCw : Users} onClick={onGenerate} disabled={!canGenerate} className="w-full py-3 text-xs rounded-xl" />
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto bg-[#020202] p-6 custom-scrollbar order-2">
                <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
                    {isGenerating && (
                         <div className="break-inside-avoid relative rounded-2xl overflow-hidden bg-white/5 aspect-square border border-white/10 ring-1 ring-orange-500/30 animate-pulse flex flex-col items-center justify-center p-4">
                             <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                             <span className="text-[10px] font-bold text-orange-400">{Math.floor(generationProgress)}%</span>
                         </div>
                    )}
                    {userImages.map((img) => (
                        <div key={img.id} onClick={() => setSelectedImage(img)} className="break-inside-avoid group relative rounded-2xl overflow-hidden bg-[#111] border border-white/5 cursor-pointer transition-all hover:translate-y-[-4px] hover:shadow-xl hover:shadow-orange-900/10 mb-4">
                            <img src={img.url} alt="" className="w-full h-auto object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] text-gray-400">{new Date(img.date).toLocaleDateString('ar-EG')}</span>
                                    <Maximize2 size={12} className="text-white" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>

        {selectedImage && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/95 backdrop-blur-2xl animate-fade-in" dir="rtl">
                <button onClick={() => setSelectedImage(null)} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full z-20 transition-all"><X size={24} /></button>
                <div className="relative w-full h-full max-w-6xl flex gap-8 items-center justify-center">
                    <div className="flex-1 h-full flex items-center justify-center rounded-3xl bg-black/50 border border-white/10 overflow-hidden">
                         <img src={selectedImage.url} alt="" className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="w-[320px] shrink-0 bg-[#0c0c0c] border border-white/10 rounded-3xl p-6 hidden lg:flex flex-col">
                        <div className="flex-1 space-y-6">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">التفاصيل</h3>
                            <div className="bg-white/5 p-4 rounded-2xl text-xs text-gray-400 leading-relaxed max-h-[150px] overflow-y-auto">{selectedImage.prompt || "أفاتار تم توليده بالذكاء الاصطناعي"}</div>
                        </div>
                        <div className="pt-6 border-t border-white/10 space-y-3">
                             <button onClick={() => downloadUtils(selectedImage.url)} className="w-full py-3 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2"><Download size={18} /> تحميل</button>
                             <button onClick={(e) => deleteImage(selectedImage.id, e)} className="w-full py-3 bg-red-500/10 border border-red-500/20 text-red-500 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18} /> حذف</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {showBuyModal && (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
                <div className="bg-[#111] rounded-[2rem] w-full max-w-md border border-white/10 overflow-hidden relative">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <h2 className="text-lg font-bold">باقات الرصيد</h2>
                        <button onClick={() => setShowBuyModal(false)}><X size={20} /></button>
                    </div>
                    <div className="p-6 space-y-3">
                        {plans.map(p => (
                            <button key={p.plan_id} onClick={() => onSelectPlan(p.plan_id)} className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-between border border-white/5 transition-all group">
                                <div className="text-right">
                                    <div className="font-bold text-gray-200 group-hover:text-orange-400">{p.plan_name}</div>
                                    <div className="text-[10px] text-gray-500">{p.credits_per_period} نقطة</div>
                                </div>
                                <div className="bg-white/10 px-3 py-1 rounded-lg font-bold">{p.amount} <span className="bg-gradient-to-r from-[#FF0000] via-[#FFFFFF] to-[#000000] bg-clip-text text-transparent font-bold">IQD</span></div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {openPaymentModal && selectedPlan && (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100]">
                <PaymentModal modalOpen={openPaymentModal} setModalOpen={setOpenPaymentModal} productType="credits" period={selectedPlan.period as any} productId={selectedPlan.plan_id} productData={{ tool_name: selectedPlan.plan_name, pack_name: selectedPlan.plan_name, monthly_price: selectedPlan.amount, yearly_price: selectedPlan.amount, tool_day_price: selectedPlan.amount, amount: selectedPlan.amount }} onBuySuccess={() => { setOpenPaymentModal(false); fetchBalance(); }} />
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