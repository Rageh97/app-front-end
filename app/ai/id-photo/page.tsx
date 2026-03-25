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
import { PremiumButton } from "@/components/PremiumButton";

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
  const [dynamicPricing, setDynamicPricing] = useState<any>({});

  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL, []);
  const baseCredits = dynamicPricing['id-photo'] || 13;
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
          setUserImages(data.images.map((img: any) => ({
            id: img.image_id, url: img.image_url || img.cloudinary_url, date: img.created_at, metadata: img.metadata
          })));
        }
      }
    } catch (e) {} finally { setLoadingImages(false); }
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
          fetchDynamicPricing();
        }
      } catch (e) {}
    };
    init();
    return () => { cancelled = true; };
  }, []);

  const fetchDynamicPricing = async () => {
    if (!apiBase) return;
    try {
      const res = await fetch(`${apiBase}/api/settings/public/ai-pricing`);
      if (res.ok) setDynamicPricing(await res.json());
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
      <div className="h-screen flex flex-col bg-[#010101] text-white selection:bg-blue-500/30 overflow-hidden" dir="rtl">
        <header className="shrink-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 px-6 py-3 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/ai" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all font-bold text-xs">
                <ArrowRight size={14} /> عودة
              </Link>
              <div className="flex items-center gap-2">
                <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
                <h1 className="text-lg font-bold">صانع الصور الشخصية AI</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2">
                <CreditCard size={12} className="text-blue-400" />
                <span className="text-sm font-bold text-blue-400">{balance?.remaining_credits || 0}</span>
              </div>
              <button onClick={() => setShowBuyModal(true)} className="bg-blue-600 px-4 py-1.5 rounded-lg text-[10px] font-black hover:bg-blue-700 transition-all flex items-center gap-2">
                <Crown size={12} /> شراء
              </button>
            </div>
        </header>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            <aside className="w-full lg:w-[350px] h-auto max-h-[45vh] lg:h-full lg:max-h-full border-b lg:border-b-0 lg:border-l border-white/10 bg-[#050505] overflow-y-auto custom-scrollbar flex flex-col shrink-0 order-1">
                <div className="p-4 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 flex items-center gap-2 uppercase tracking-wide">
                            <Upload size={12} className="text-blue-400" /> رفع الصورة
                        </label>
                        <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-white/5 rounded-2xl p-6 text-center hover:bg-blue-500/5 hover:border-blue-500/40 cursor-pointer transition-all bg-white/[0.02]">
                            {originalImage ? (
                                <div className="space-y-2">
                                    <img src={originalImage} className="h-32 mx-auto rounded-xl object-cover shadow-2xl" />
                                    <span className="text-[10px] text-blue-400 font-bold block">تغيير الصورة</span>
                                </div>
                            ) : (
                                <div className="py-4 font-bold flex flex-col items-center gap-3">
                                    <Plus size={32} className="text-gray-600" />
                                    <p className="text-[10px] text-gray-400">تحميل صورتك الشخصية</p>
                                </div>
                            )}
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-gray-500 flex items-center gap-2 uppercase tracking-wide">
                             لون الخلفية المطلوبة
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                           {BACKGROUND_COLORS.map(color => (
                               <button 
                                key={color.id} 
                                onClick={() => setSelectedBg(color.id)}
                                className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${selectedBg === color.id ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
                               >
                                   <div className={`w-5 h-5 rounded-full border border-white/10 shadow-inner`} style={{ backgroundColor: color.color }}></div>
                                   <span className="text-[10px] font-bold">{color.name}</span>
                                   {selectedBg === color.id && <Check size={12} className="text-blue-400 ml-auto" />}
                               </button>
                           ))}
                        </div>
                    </div>

                    <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 flex gap-3 items-start">
                        <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-gray-400 leading-relaxed font-medium">سيتم عزل الشخص من الخلفية تماماً وتطبيق اللون المختار بأبعاد رسمية (3:4) وجودة استوديو.</p>
                    </div>
                </div>

                <div className="mt-auto p-4 border-t border-white/5 bg-[#080808]">
                    {error && <div className="mb-2 p-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[9px] font-bold text-center truncate">{error}</div>}
                    
                    <div className="flex items-center justify-between text-[10px] text-gray-400 mb-2 font-medium bg-white/5 p-2 rounded-lg border border-white/10">
                        <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                <Coins size={10} className="text-yellow-500" />
                            </div>
                            <span>التكلفة المتوقعة:</span>
                        </div>
                        <span className="text-white font-bold text-xs">{creditsNeeded}</span>
                    </div>

                    <PremiumButton label={isProcessing ? "جاري الإنتاج..." : "إنتاج الصورة الشخصية"} icon={isProcessing ? RefreshCw : Camera} onClick={onProcess} disabled={!originalImage || isProcessing} className="w-full py-3.5 text-xs rounded-xl" />
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto bg-[#020202] p-6 custom-scrollbar order-2">
                <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
                    {isProcessing && (
                         <div className="break-inside-avoid relative rounded-2xl overflow-hidden bg-white/5 aspect-[3/4] border border-white/10 ring-1 ring-blue-500/30 flex flex-col items-center justify-center p-4">
                             <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                             <span className="text-[10px] font-bold text-blue-400">{Math.floor(processingProgress)}%</span>
                         </div>
                    )}
                    {userImages.length === 0 && !isProcessing && (
                        <div className="col-span-full h-[400px] flex flex-col items-center justify-center text-gray-600 gap-4 opacity-30">
                            <ImageIcon size={64} />
                            <p className="font-bold text-sm">لا يوجد صور منتجة بعد</p>
                        </div>
                    )}
                    {userImages.map((img) => (
                        <div key={img.id} onClick={() => setSelectedImage(img)} className="break-inside-avoid relative rounded-2xl overflow-hidden bg-[#111] border border-white/5 cursor-pointer transition-all hover:translate-y-[-4px] mb-4 group shadow-xl">
                            <img src={img.url} className="w-full h-auto object-cover relative z-10" />
                            <div className="absolute top-2 right-2 z-20 px-2 py-0.5 bg-black/50 backdrop-blur rounded text-[8px] font-black text-white/70 uppercase">
                                {img.metadata?.background || 'ID'}
                            </div>
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 z-20">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] text-gray-500">{new Date(img.date).toLocaleDateString('ar-EG')}</span>
                                    <Maximize2 size={12} className="text-white" />
                                </div>
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
                        <img src={selectedImage.url} className="max-h-full max-w-full object-contain shadow-2xl" />
                    </div>
                    <div className="w-[300px] shrink-0 h-full max-h-[450px] bg-[#0c0c0c] border border-white/10 rounded-3xl p-6 hidden lg:flex flex-col">
                        <h3 className="text-xs font-bold text-gray-500 mb-6 uppercase tracking-wider">تفاصيل الصورة الشخصية</h3>
                        <div className="flex-1 space-y-4">
                             <div className="bg-white/5 p-4 rounded-xl text-xs text-gray-500 leading-relaxed font-medium">
                                 صورة هوية رسمية بخلفية {BACKGROUND_COLORS.find(c => c.id === selectedImage.metadata?.background)?.name || 'مخصصة'}.
                                 <br/><br/>
                                 الأبعاد: 800x1000 بكسل
                                 <br/>
                                 النوع: JPEG جودة عالية
                             </div>
                        </div>
                        <div className="space-y-3 pt-6 border-t border-white/10">
                             <button onClick={() => downloadUtils(selectedImage.url)} className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm hover:bg-blue-700 active:scale-[0.98] transition-all shadow-xl shadow-blue-500/20"><Download size={18} /> تحميل الصورة</button>
                             <button onClick={(e) => deleteImage(selectedImage.id, e)} className="w-full py-3 bg-red-500/10 border border-red-500/20 text-red-500 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all text-sm"><Trash2 size={18} /> حذف السجل</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

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
