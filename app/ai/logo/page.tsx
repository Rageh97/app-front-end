"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import PaymentModal from "@/components/Modals/PaymentModal";
import UpgradeModal from "@/components/Modals/UpgradeModal";
import Link from "next/link";
import { toast, Toaster } from 'react-hot-toast';
import { 
  ArrowRight, Crown, Download, Wand2, Type, Palette, X, 
  RefreshCw, CreditCard, ChevronLeft, ArrowLeft, ShieldCheck, 
  Sparkles, ImageIcon, Trash2, Maximize2, Plus, Coins
} from 'lucide-react';
import { AIToolHeader, AIGenerateButton, AIGenerationCard, AIResultModal, AIResultsGallery, downloadMediaDirectly } from "@/components/ai";
import { handleAuthError } from "@/utils/auth";
import { useAiPricing } from '@/hooks/useAiPricing';

const downloadImage = async (url: string, filename: string) => {
  try {
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
    toast.success('تم تحميل الصورة بنجاح');
  } catch (error) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

type CreditsRecord = {
  users_credits_id: number;
  user_id: number;
  plan_id: number;
  plan_name: string;
  total_credits: number;
  remaining_credits: number;
  plan?: { image_profit: number; };
};

const LOGO_STYLES = [
  { id: 'modern', name: 'حديث' },
  { id: 'classic', name: 'كلاسيك' },
  { id: 'minimal', name: 'بسيط' },
  { id: 'luxury', name: 'فاخر' },
];

export default function LogoMakerPage() {
  const [balance, setBalance] = useState<CreditsRecord | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [logoDescription, setLogoDescription] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('modern');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
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
  }, [logoDescription]);

  const [userImages, setUserImages] = useState<any[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any | null>(null);

  const [plans, setPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL, []);
  const { operationPrice } = useAiPricing();
  const baseCredits = operationPrice('logo-creation', 13);
  const imageProfit = balance?.plan?.image_profit ?? 0;
  const creditsNeeded = baseCredits + imageProfit;

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
    setLoadingImages(true);
    try {
      const res = await fetch(`${apiBase}/api/ai/user-images?limit=24&tool=logo`, {
        headers: { 'Authorization': getToken() as any, "User-Client": (global as any)?.clientId1328 }
      });
      if (res.status === 200) {
        const data = await res.json();
        if (data.success) {
          setUserImages(data.images.map((img: any) => ({id: img.image_id, url: img.image_url || img.cloudinary_url, date: img.created_at, prompt: img.prompt, name: img.company_name, is_public: img.is_public })));
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
      const res = await fetch(`${apiBase}/api/ai/user-images?tool=logo`, {
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
        }
      } catch (e) {}
    };
    init();
    return () => { cancelled = true; };
  }, []);

  const loadPlans = async () => {
    if (!apiBase) return;
    try {
      const res = await fetch(`${apiBase}/api/credits/plans`);
      if (res.status === 200) setPlans(await res.json());
    } catch (e) {}
  };

  const onGenerate = async () => {
    if (!apiBase || !companyName) return toast.error('يرجى إدخال اسم الشركة');
    
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
      progressValue += Math.random() * 5 + 1;
      if (progressValue >= 95) { clearInterval(interval); progressValue = 95; }
      setGenerationProgress(progressValue);
    }, 700);
    
    try {
      const res = await fetch(`${apiBase}/api/ai/logo-create`, {
        method: "POST",
        headers: { 'Authorization': getToken() as any, 'Content-Type': 'application/json', "User-Client": (global as any)?.clientId1328 },
        body: JSON.stringify({ company_name: companyName, style: selectedStyle, description: logoDescription }),
      });
      
      clearInterval(interval);
      setGenerationProgress(100);
      
      if (res.status === 200) {
        toast.success('تم تصميم الشعار!');
        fetchBalance();
        fetchUserImages();
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

  return (
    <>
      <Toaster position="top-right" />
      <div className="h-screen flex flex-col bg-[#06070B] text-white selection:bg-emerald-500/30 overflow-hidden" dir="rtl">
        {/* Unified AI Tool Header */}
        <AIToolHeader
          title="صانع ومصمم الشعارات"
          description="ابتكار شعارات وهوية بصرية احترافية لعلامتك التجارية"
          badge="AI Logo Studio"
          icon={Crown}
          iconGradient="from-emerald-600 to-teal-600"
          userCredits={balance?.remaining_credits}
          onUpgradeClick={() => setShowBuyModal(true)}
          backHref="/ai"
        />

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            <aside className="w-full lg:w-[320px] h-auto max-h-[35vh] lg:max-h-full lg:h-full border-b lg:border-b-0 lg:border-l border-white/[0.08] bg-[#0B0D14] overflow-y-auto custom-scrollbar flex flex-col shrink-0">
                <div className="p-4 space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 flex items-center gap-2 uppercase tracking-wide"><Type size={12} className="text-emerald-400" /> اسم العلامة التجارية</label>
                        <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="مثال: نيكسوس للبرمجيات..." className="w-full px-3 py-2 rounded-xl bg-[#121520] border border-white/[0.08] focus:border-emerald-500/40 outline-none text-white text-xs transition-all" />
                    </div>

                    <div className="space-y-2">
                         <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">عن النشاط (اختياري)</label>
                         <textarea 
                            ref={promptRef}
                            value={logoDescription} 
                            onChange={(e) => setLogoDescription(e.target.value)} 
                            placeholder="صف ماذا تفعل شركتك..." 
                            className="w-full min-h-[60px] p-2.5 rounded-xl bg-[#121520] border border-white/[0.08] text-xs focus:border-emerald-500/40 outline-none resize-none transition-all overflow-hidden" 
                         />
                    </div>

                    <div className="space-y-2">
                         <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">نمط التصميم</label>
                         <div className="grid grid-cols-2 gap-1.5">
                             {LOGO_STYLES.map(s => (
                                 <button key={s.id} onClick={() => setSelectedStyle(s.id)} className={`p-2.5 rounded-xl border text-center transition-all text-xs font-bold ${selectedStyle === s.id ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-bold' : 'bg-[#121520] border-white/[0.08] text-gray-400 hover:bg-[#161a27]'}`}>
                                     {s.name}
                                 </button>
                             ))}
                         </div>
                    </div>
                </div>

                <div className="mt-auto p-4 border-t border-white/[0.08] bg-[#0B0D14]">
                    {error && <div className="mb-2 p-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[9px] font-bold text-center truncate">{error}</div>}
                    
                    <AIGenerateButton
                        onClick={onGenerate}
                        isGenerating={isGenerating}
                        disabled={!companyName}
                        cost={creditsNeeded}
                        label="إنشاء"
                        generatingLabel="جاري الإنشاء..."
                        icon={Crown}
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
          title="تصميم الشعار والعلامة التجارية"
          subtitle={selectedImage?.name || "شعار احترافي بالذكاء الاصطناعي"}
          prompt={selectedImage?.prompt}
          details={[
            { label: "اسم العلامة", value: selectedImage?.name || "شعار تجاري" },
            { label: "التاريخ", value: selectedImage?.date ? new Date(selectedImage.date).toLocaleDateString('ar-EG') : "" },
          ]}
        />

        {/* Buy Credits Modal */}
        {showBuyModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <div className="bg-[#111] rounded-3xl w-full max-w-lg border border-white/10 overflow-hidden relative" dir="rtl">
              <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-amber-500 to-yellow-500"></div>
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-400"><Crown size={20} /></div>
                  <h2 className="text-xl font-bold text-white">شراء رصيد إضافي</h2>
                </div>
                <button onClick={() => setShowBuyModal(false)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"><X size={20} className="text-gray-400" /></button>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {loadingPlans ? (
                  <div className="text-center py-12"><div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4"></div><div className="text-gray-400">جاري تحميل الخطط...</div></div>
                ) : plans.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">لا توجد خطط متاحة حالياً</div>
                ) : (
                  <div className="space-y-4">
                    {plans.map((p: any) => (
                      <button key={p.plan_id} onClick={() => { setSelectedPlan(p); setShowBuyModal(false); setOpenPaymentModal(true); }} className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-right transition-all duration-300 border border-white/5 hover:border-amber-500/50 group">
                        <div className="flex items-center justify-between">
                          <div><div className="font-bold text-white text-lg group-hover:text-amber-400 transition-colors">{p.plan_name}</div><div className="text-gray-400 text-sm mt-1">{p.credits_per_period} نقطة رصيد / {p.period}</div></div>
                          <div className="text-white font-bold text-xl bg-white/10 px-3 py-1 rounded-lg group-hover:bg-amber-500 group-hover:text-black transition-all">{p.amount} <span className="bg-gradient-to-r from-[#FF0000] via-[#FFFFFF] to-[#000000] bg-clip-text text-transparent font-bold">IQD</span></div>
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
