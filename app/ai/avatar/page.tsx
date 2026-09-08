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
import { AIToolHeader, AIGenerateButton, AIGenerationCard, AIResultModal, AIResultsGallery, downloadMediaDirectly } from "@/components/ai";
import { handleAuthError } from "@/utils/auth";
import { useAiPricing } from '@/hooks/useAiPricing';

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
            setUserImages(data.images.map((img: any) => ({id: img.image_id,
                url: img.image_url || img.cloudinary_url,
                prompt: img.prompt,
                date: img.created_at, is_public: img.is_public })));
        }
      }
    } catch (e) {} finally { setLoadingImages(false); }
  };

  
  const handleDeleteSingle = async (id: number | string) => {
    if (!apiBase) return;
    try {
      const res = await fetch(`${apiBase}/api/ai/user-images/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': getToken() as any, "User-Client": (global as any)?.clientId1328 }
      });
      setUserImages(prev => prev.filter(img => img.id !== id && img.image_id !== id));
      toast.success('تم حذف النتيجة بنجاح');
      if (selectedImage && (selectedImage.id === id || selectedImage.image_id === id)) {
        setSelectedImage(null);
      }
    } catch (e) {
      toast.error('فشل حذف النتيجة');
    }
  };

  const handleDeleteAll = async () => {
    if (!apiBase) return;
    try {
      const res = await fetch(`${apiBase}/api/ai/user-images?tool=avatar`, {
        method: 'DELETE',
        headers: { 'Authorization': getToken() as any, "User-Client": (global as any)?.clientId1328 }
      });
      setUserImages([]);
      toast.success('تم حذف جميع النتائج السابقة');
      setSelectedImage(null);
    } catch (e) {
      toast.error('فشل حذف النتائج');
    }
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

  const { operationPrice } = useAiPricing();
  const baseCredits = operationPrice('avatar-creation', 12);
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
      <div className="h-screen flex flex-col bg-[#06070B] text-white selection:bg-emerald-500/30 font-sans overflow-hidden" dir="rtl">
        <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none z-0"></div>
        
        {/* Unified AI Tool Header */}
        <AIToolHeader
          title="صانع الأفاتار الكرتوني"
          description="تحويل صورتك الشخصية إلى شخصيات ثلاثية الأبعاد وكرتونية بأساليب سينمائية"
          badge="Avatar Studio"
          icon={Users}
          iconGradient="from-emerald-600 to-teal-600"
          userCredits={balance?.remaining_credits}
          onUpgradeClick={() => setShowUpgradeModal(true)}
          backHref="/ai"
        />

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative z-10">
            <aside className="w-full lg:w-[380px] h-[calc(100vh-3.5rem)] bg-[#0B0D14] border-b lg:border-b-0 lg:border-l border-white/[0.08] p-5 flex flex-col justify-between shrink-0 overflow-hidden z-30 shadow-2xl relative">
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-0.5 pb-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-black text-white">صانع الأفاتار</h2>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                            <Upload size={14} className="text-emerald-400" /> ارفع صورتك الشخصية
                        </label>
                        <div onClick={() => fileInputRef.current?.click()} className="border border-dashed border-white/[0.08] rounded-xl p-4 text-center hover:bg-[#161a27] hover:border-emerald-500/40 cursor-pointer transition-all bg-[#121520]">
                            {uploadedImage ? (
                                <div className="space-y-1">
                                    <img src={uploadedImage} alt="Up" className="h-28 mx-auto rounded-lg object-cover shadow-xl" />
                                    <span className="text-[10px] text-emerald-400 font-bold block">تغيير الصورة</span>
                                </div>
                            ) : (
                                <div className="py-4">
                                    <Plus size={22} className="mx-auto text-gray-400 mb-1" />
                                    <p className="text-xs text-gray-300 font-bold">انقر لرفع صورة شخصية</p>
                                </div>
                            )}
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                            <Sparkles size={13} className="text-emerald-400" /> النمط الفني
                        </label>
                        <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto custom-scrollbar">
                             {AVATAR_STYLES.map((s) => (
                                <button key={s.id} onClick={() => setSelectedStyle(s.id)} className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all truncate ${
                                    selectedStyle === s.id ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-bold' : 'bg-[#121520] border-white/[0.08] text-gray-400 hover:bg-[#161a27]'}`}>
                                    <span className={`shrink-0 ${selectedStyle === s.id ? 'text-emerald-400' : 'text-gray-500'}`}>
                                        {React.cloneElement(s.icon as React.ReactElement, { size: 13 })}
                                    </span>
                                    <span className="text-xs font-bold truncate">{s.name}</span>
                                </button>
                             ))}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                         <label className="text-xs font-bold text-gray-400">تخصيص المشهد (اختياري)</label>
                         <div className="rounded-xl border border-white/[0.08] bg-[#121520] p-2.5">
                             <textarea 
                                ref={promptRef}
                                value={customPrompt} 
                                onChange={(e) => setCustomPrompt(e.target.value)} 
                                placeholder="مثال: خلفية فضاء سديمي، ملابس ملكية مستقبلية..." 
                                rows={2}
                                className="w-full bg-transparent text-xs text-white placeholder:text-gray-500 outline-none resize-none leading-relaxed" 
                             />
                         </div>
                    </div>
                </div>

                <div className="pt-3 border-t border-white/[0.08] shrink-0 bg-[#0B0D14] z-20">
                     {error && <div className="mb-2 px-2 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[10px] font-bold truncate">{error}</div>}
                     
                     <AIGenerateButton
                         onClick={onGenerate}
                         isGenerating={isGenerating}
                         disabled={!canGenerate}
                         cost={creditsNeeded}
                         label="إنشاء"
                         generatingLabel="جاري الإنشاء..."
                         icon={Users}
                         variant="emerald"
                     />
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto bg-[#06070B] p-6 custom-scrollbar">
                <AIResultsGallery
                    items={userImages}
                    isGenerating={isGenerating}
                    progress={generationProgress}
                    generationIcon={Sparkles}
                    onItemClick={(img) => setSelectedImage(img)}
                    onDeleteItem={handleDeleteSingle}
                    onDeleteAll={handleDeleteAll}
                />
            </main>
        </div>

        {/* Unified AI Result Modal */}
        <AIResultModal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          mediaUrl={selectedImage?.url || null}
          mediaId={selectedImage?.id || selectedImage?.image_id}
          isPublic={selectedImage?.is_public}
          onDelete={() => selectedImage && handleDeleteSingle(selectedImage.id || selectedImage.image_id)}
          mediaType="image"
          title="الأفاتار والشخصيات الرقمية"
          subtitle="أفاتار رقمي فني تم إنشاؤه بالذكاء الاصطناعي"
          prompt={selectedImage?.prompt}
          details={[
            { label: "الوصف", value: selectedImage?.prompt || "أفاتار فني" },
            { label: "التاريخ", value: selectedImage?.date ? new Date(selectedImage.date).toLocaleDateString('ar-EG') : "" },
          ]}
        />

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
