"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import PaymentModal from "@/components/Modals/PaymentModal";
import UpgradeModal from "@/components/Modals/UpgradeModal";
import Link from "next/link";
import { toast, Toaster } from 'react-hot-toast';
import { 
  ArrowRight, Camera, Sparkles, Upload, Download, X, 
  RefreshCw, Image as ImageIcon, CreditCard, Crown, 
  Trash2, Maximize2, Plus, Info, Coins, Check
} from 'lucide-react';
import { AIToolHeader, AIGenerateButton, AIGenerationCard, AIResultModal, AIResultsGallery, downloadMediaDirectly } from "@/components/ai";
import { handleAuthError } from "@/utils/auth";
import { useAiPricing } from '@/hooks/useAiPricing';

type CreditsRecord = {
  users_credits_id: number;
  user_id: number;
  plan_id: number;
  plan_name: string;
  total_credits: number;
  remaining_credits: number;
  plan?: { image_profit: number; };
};

const BACKGROUND_COLORS = [
  { id: 'white', name: 'أبيض (رسمي)', color: '#FFFFFF', border: 'border-gray-200' },
  { id: 'blue', name: 'أزرق', color: '#0066CC', border: 'border-blue-700' },
  { id: 'red', name: 'أحمر', color: '#CC0000', border: 'border-red-700' },
  { id: 'grey', name: 'رمادي', color: '#F0F0F0', border: 'border-gray-300' },
];

export default function IDPhotoPage() {
  const [balance, setBalance] = useState<CreditsRecord | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [selectedBg, setSelectedBg] = useState('white');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gallery
  const [userImages, setUserImages] = useState<any[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any | null>(null);

  const [plans, setPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL, []);
  const { operationPrice } = useAiPricing();
  const baseCredits = operationPrice('id-photo', 13);
  const imageProfit = balance?.plan?.image_profit ?? 0;
  const creditsNeeded = baseCredits + imageProfit;

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem("a") : null;

  const fetchBalance = async () => {
    if (!apiBase) return;
    const token = getToken();
    try {
      const res = await fetch(`${apiBase}/api/credits/me/balance`, { headers: { 'Authorization': token as any, "User-Client": (global as any)?.clientId1328 } });
      if (res.status === 200) setBalance(await res.json());
    } catch (e) {}
  };

  const fetchUserImages = async () => {
    if (!apiBase) return;
    const token = getToken();
    setLoadingImages(true);
    try {
      const res = await fetch(`${apiBase}/api/ai/user-images?limit=24&tool=id-photo`, {
        headers: { 'Authorization': token as any, "User-Client": (global as any)?.clientId1328 }
      });
      if (res.status === 200) {
        const data = await res.json();
        if (data.success) {
          setUserImages(data.images.map((img: any) => ({id: img.image_id, url: img.image_url || img.cloudinary_url, date: img.created_at, metadata: img.metadata, is_public: img.is_public })));
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
      const res = await fetch(`${apiBase}/api/ai/user-images?tool=id_photo`, {
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
    setLoadingPlans(true);
    try {
      const res = await fetch(`${apiBase}/api/credits/plans`);
      if (res.status === 200) setPlans(await res.json());
    } finally { setLoadingPlans(false); }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) return toast.error('حجم الصورة كبير جداً');
      const reader = new FileReader();
      reader.onload = (e) => {
        setOriginalImage(e.target?.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const onProcess = async () => {
    if (!apiBase || !originalImage) return;
    
    // فحص الرصيد قبل البدء
    if (!balance || balance.remaining_credits < creditsNeeded) {
      setShowUpgradeModal(true);
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setProcessingProgress(0);
    
    let progressValue = 0;
    const interval = setInterval(() => {
      progressValue += Math.random() * 5 + 3;
      if (progressValue >= 95) { clearInterval(interval); progressValue = 95; }
      setProcessingProgress(progressValue);
    }, 600);
    
    try {
      const token = getToken();
      const res = await fetch(`${apiBase}/api/ai/id-photo`, {
        method: "POST",
        headers: { 'Authorization': token as any, 'Content-Type': 'application/json', "User-Client": (global as any)?.clientId1328 },
        body: JSON.stringify({ image: originalImage, background: selectedBg }),
      });
      
      clearInterval(interval);
      setProcessingProgress(100);
      
      if (res.status === 200) {
        toast.success('تم إنتاج الصورة الشخصية!');
        fetchBalance();
        fetchUserImages();
      } else {
        const text = await res.text();
        setError(text || 'فشلت المعالجة');
      }
    } catch (e) {
      clearInterval(interval);
      setError('خطأ في الاتصال');
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteImage = async (id: number, e?: React.MouseEvent) => {
    if(e) e.stopPropagation();
    if (!apiBase) return;
    const token = getToken();
    const prev = [...userImages];
    setUserImages(userImages.filter(img => img.id !== id));
    if (selectedImage?.id === id) setSelectedImage(null);
    try {
      await fetch(`${apiBase}/api/ai/user-images/${id}`, { method: 'DELETE', headers: { 'Authorization': token as any, "User-Client": (global as any)?.clientId1328 } });
      toast.success('تم الحذف');
    } catch (error) { setUserImages(prev); }
  };

  const downloadUtils = async (url: string) => {
    try {
      const toastId = toast.loading('جاري التحميل...');
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `id_photo_${selectedBg}_${Date.now()}.jpg`;
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
      <div className="h-screen flex flex-col bg-[#06070B] text-white selection:bg-emerald-500/30 overflow-hidden" dir="rtl">
        {/* Unified AI Tool Header */}
        <AIToolHeader
          title="صانع الصور الشخصية"
          description="عزل الخلفية وتطبيق خلفيات الاستوديو الرسمية لمعاملات الهوية والجوازات"
          badge="ID Photo Studio"
          icon={Camera}
          iconGradient="from-emerald-600 to-teal-600"
          userCredits={balance?.remaining_credits}
          onUpgradeClick={() => setShowUpgradeModal(true)}
          backHref="/ai"
        />

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            <aside className="w-full lg:w-[380px] h-[calc(100vh-3.5rem)] bg-[#0B0D14] border-b lg:border-b-0 lg:border-l border-white/[0.08] p-5 flex flex-col justify-between shrink-0 overflow-hidden z-30 shadow-2xl relative">
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-0.5 pb-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-black text-white">صانع الصور الشخصية</h2>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                            <Upload size={14} className="text-emerald-400" /> ارفع صورتك الشخصية
                        </label>
                        <div onClick={() => fileInputRef.current?.click()} className="border border-dashed border-white/[0.08] rounded-xl p-4 text-center hover:bg-[#161a27] hover:border-emerald-500/40 cursor-pointer transition-all bg-[#121520]">
                            {originalImage ? (
                                <div className="space-y-1">
                                    <img src={originalImage} className="h-28 mx-auto rounded-lg object-cover shadow-2xl" />
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
                        <label className="text-xs font-bold text-gray-400">
                             لون الخلفية الرسمية
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                           {BACKGROUND_COLORS.map(color => (
                               <button 
                                key={color.id} 
                                onClick={() => setSelectedBg(color.id)}
                                className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${selectedBg === color.id ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 font-bold' : 'border-white/[0.08] bg-[#121520] hover:bg-[#161a27] text-gray-400'}`}
                               >
                                   <div className={`w-4 h-4 rounded-full border border-white/20 shadow-inner`} style={{ backgroundColor: color.color }}></div>
                                   <span className="text-xs">{color.name}</span>
                                   {selectedBg === color.id && <Check size={14} className="text-emerald-400 ml-auto" />}
                               </button>
                           ))}
                        </div>
                    </div>

                    <div className="p-3 bg-[#121520] rounded-xl border border-white/[0.08] flex gap-2.5 items-start">
                        <Info size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-gray-400 leading-relaxed">سيتم عزل الشخص وتطبيق الخلفية الرسمية بأبعاد استوديو 3:4 فورياً.</p>
                    </div>
                </div>

                <div className="pt-3 border-t border-white/[0.08] shrink-0 bg-[#0B0D14] z-20">
                    {error && <div className="mb-2 p-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[10px] font-bold text-center truncate">{error}</div>}
                    
                    <AIGenerateButton
                        onClick={onProcess}
                        isGenerating={isProcessing}
                        disabled={!originalImage}
                        cost={creditsNeeded}
                        label="إنشاء"
                        generatingLabel="جاري الإنشاء..."
                        icon={Camera}
                        variant="emerald"
                    />
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto bg-[#06070B] p-6 custom-scrollbar">
                <AIResultsGallery
                    items={userImages}
                    isGenerating={isProcessing}
                    progress={processingProgress}
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
          title="صورة المعاملات والهوية الرسمية"
          subtitle="صورة شخصية رسمية بالمعايير القياسية وخلفية ملونة"
          details={[
            { label: "نوع الخلفية", value: BACKGROUND_COLORS.find(c => c.id === selectedImage?.metadata?.background)?.name || "رسمية" },
            { label: "الأبعاد", value: "800x1000 بكسل" },
            { label: "التاريخ", value: selectedImage?.date ? new Date(selectedImage.date).toLocaleDateString('ar-EG') : "" },
          ]}
        />

        {/* Buy Credits Modal */}
        {showBuyModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <div className="bg-[#111] rounded-3xl w-full max-w-lg border border-white/10 overflow-hidden relative" dir="rtl">
              <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
              
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400">
                      <Crown size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-white">شراء شحن رصيد</h2>
                </div>
                <button onClick={() => setShowBuyModal(false)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              
              <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {loadingPlans ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <div className="text-gray-400 group-hover:text-blue-500">جاري تحميل الخطط...</div>
                  </div>
                ) : plans.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">لا توجد خطط متاحة حالياً</div>
                ) : (
                  <div className="space-y-4">
                    {plans.map((p) => (
                      <button
                        key={p.plan_id}
                        onClick={() => {
                          setSelectedPlan(p);
                          setShowBuyModal(false);
                          setOpenPaymentModal(true);
                        }}
                        className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-right transition-all duration-300 border border-white/5 hover:border-blue-500/50 group"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-white text-lg group-hover:text-blue-400 transition-colors uppercase">{p.plan_name}</div>
                            <div className="text-gray-400 text-sm mt-1">{p.credits_per_period} نقطة رصيد / {p.period}</div>
                          </div>
                          <div className="text-white font-bold text-xl bg-white/10 px-3 py-1 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-all">
                              {p.amount} <span className="text-[10px] text-gray-400 group-hover:text-white">IQD</span>
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
          <div className="fixed inset-0 bg-black/99 flex items-center justify-center z-[100] animate-fade-in backdrop-blur-3xl">
            <div className="w-full max-w-[1200px] h-full flex items-center justify-center p-4">
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
      </div>
    </>
  );
}
