"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import PaymentModal from "@/components/Modals/PaymentModal";
import UpgradeModal from "@/components/Modals/UpgradeModal";
import Link from "next/link";
import { toast, Toaster } from 'react-hot-toast';
import { 
  ArrowRight, Palette, Upload, Download, Loader, Wand2, Sparkles, X, 
  CreditCard, Crown, ImageIcon, RefreshCw, Trash2, Maximize2, Plus, Info
} from 'lucide-react';
import { PremiumButton } from "@/components/PremiumButton";

type CreditsRecord = {
  users_credits_id: number;
  user_id: number;
  plan_id: number;
  plan_name: string;
  total_credits: number;
  remaining_credits: number;
};

export default function PhotoColorizerPage() {
  const [balance, setBalance] = useState<CreditsRecord | null>(null);
  const [selectedInImage, setSelectedInImage] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isColorizing, setIsColorizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userImages, setUserImages] = useState<any[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any | null>(null);

  const [plans, setPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL, []);
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
      const res = await fetch(`${apiBase}/api/ai/user-images?limit=24&tool=colorization`, {
        headers: { 'Authorization': getToken() as any, "User-Client": (global as any)?.clientId1328 }
      });
      if (res.status === 200) {
        const data = await res.json();
        if (data.success) {
          setUserImages(data.images.map((img: any) => ({
            id: img.image_id, url: img.image_url || img.cloudinary_url, date: img.created_at, prompt: img.prompt
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
        setSelectedInImage(e.target?.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const colorizePhoto = async () => {
    if (!apiBase || !selectedInImage) return;
    
    // فحص الرصيد قبل البدء
    if (!balance || balance.remaining_credits <= 0) {
      setShowUpgradeModal(true);
      return;
    }
    
    setIsColorizing(true);
    setError(null);
    setProcessingProgress(0);
    
    let progressValue = 0;
    const interval = setInterval(() => {
      progressValue += Math.random() * 4 + 1;
      if (progressValue >= 95) { clearInterval(interval); progressValue = 95; }
      setProcessingProgress(progressValue);
    }, 800);
    
    try {
      const res = await fetch(`${apiBase}/api/ai/photo-colorize`, {
        method: "POST",
        headers: { 'Authorization': getToken() as any, 'Content-Type': 'application/json', "User-Client": (global as any)?.clientId1328 },
        body: JSON.stringify({ image: selectedInImage, customPrompt }),
      });
      
      clearInterval(interval);
      setProcessingProgress(100);
      
      if (res.status === 200) {
        toast.success('تم تلوين الصورة!');
        fetchBalance();
        fetchUserImages();
      } else {
        const text = await res.text();
        setError(text || 'فشلت العملية');
      }
    } catch (e) {
      clearInterval(interval);
      setError('خطأ في الاتصال');
    } finally { setIsColorizing(false); }
  };

  const deleteImage = async (id: number, e?: React.MouseEvent) => {
    if(e) e.stopPropagation();
    const prev = [...userImages];
    setUserImages(userImages.filter(img => img.id !== id));
    if (selectedImage?.id === id) setSelectedImage(null);
    try {
      await fetch(`${apiBase}/api/ai/user-images/${id}`, { method: 'DELETE', headers: { 'Authorization': getToken() as any, "User-Client": (global as any)?.clientId1328 } });
      toast.success('تم الحذف');
    } catch (error) { setUserImages(prev); }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="h-screen flex flex-col bg-[#010101] text-white selection:bg-teal-500/30 overflow-hidden" dir="rtl">
        <header className="shrink-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 px-6 py-3 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/ai" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all font-bold text-xs">
                <ArrowRight size={14} /> عودة
              </Link>
              <div className="flex items-center gap-2">
                <span className="w-2 h-8 bg-teal-600 rounded-full"></span>
                <h1 className="text-lg font-bold">تلوين الصور AI</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2">
                <CreditCard size={12} className="text-teal-400" />
                <span className="text-sm font-bold text-teal-400">{balance?.remaining_credits || 0}</span>
              </div>
              <button onClick={() => setShowBuyModal(true)} className="bg-teal-600 px-4 py-1.5 rounded-lg text-[10px] font-black hover:bg-teal-700 transition-all flex items-center gap-2"><Crown size={12} /> شراء</button>
            </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
            <aside className="w-[320px] md:w-[360px] border-l border-white/10 bg-[#050505] overflow-y-auto custom-scrollbar flex flex-col p-5 shrink-0">
                <div className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-500 flex items-center gap-2 uppercase tracking-wide">
                            <Upload size={14} className="text-teal-400" /> ارفع الصورة قديمة
                        </label>
                        <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-white/5 rounded-2xl p-6 text-center hover:bg-teal-500/5 hover:border-teal-400/40 cursor-pointer transition-all">
                            {selectedInImage ? (
                                <div className="space-y-2">
                                    <img src={selectedInImage} className="h-40 mx-auto rounded-xl object-cover shadow-2xl" />
                                    <span className="text-[10px] text-teal-400 font-bold block">تغيير الصورة</span>
                                </div>
                            ) : (
                                <div className="py-8">
                                    <Plus className="mx-auto text-gray-600 mb-2" />
                                    <p className="text-[10px] text-gray-400 font-medium">صور أبيض وأسود للحصول على أفضل تلوين</p>
                                </div>
                            )}
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </div>

                    <div className="space-y-3">
                         <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">تعليمات التلوين (اختياري)</label>
                         <textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} placeholder="مثال: ألوان طبيعية هادئة..." className="w-full h-24 p-3 rounded-xl bg-white/5 border border-white/10 text-xs focus:border-teal-500/40 transition-all outline-none resize-none" />
                    </div>
                </div>

                <div className="mt-auto pt-6 border-t border-white/5">
                    {error && <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-bold text-center">{error}</div>}
                    <PremiumButton label={isColorizing ? "جاري التلوين..." : "تلوين الآن"} icon={isColorizing ? RefreshCw : Palette} onClick={colorizePhoto} disabled={!selectedInImage || isColorizing} className="w-full py-4 text-sm rounded-xl" />
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto bg-[#020202] p-6 custom-scrollbar">
                <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
                    {isColorizing && (
                         <div className="break-inside-avoid relative rounded-2xl overflow-hidden bg-white/5 aspect-square border border-white/10 ring-1 ring-teal-500/30 flex flex-col items-center justify-center p-4">
                             <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                             <span className="text-[10px] font-bold text-teal-400">{Math.floor(processingProgress)}%</span>
                         </div>
                    )}
                    {userImages.map((img) => (
                        <div key={img.id} onClick={() => setSelectedImage(img)} className="break-inside-avoid group relative rounded-2xl overflow-hidden bg-[#111] border border-white/5 cursor-pointer transition-all hover:translate-y-[-4px] mb-4">
                            <img src={img.url} className="w-full h-auto object-cover" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
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
                    <div className="w-[300px] shrink-0 h-full max-h-[400px] bg-[#0c0c0c] border border-white/10 rounded-2xl p-6 hidden lg:flex flex-col">
                        <h3 className="text-xs font-bold text-gray-500 mb-6 uppercase tracking-wider">النتيجة النهائية</h3>
                        <div className="flex-1 space-y-4">
                             <div className="bg-white/5 p-4 rounded-xl text-xs text-gray-400 leading-relaxed">{selectedImage.prompt || "صورة قديمة تم تلوينها بدقة عالية باستخدام الذكاء الاصطناعي."}</div>
                        </div>
                        <div className="space-y-3 pt-6 border-t border-white/10">
                             <button onClick={() => {
                                const link = document.createElement('a'); link.href = selectedImage.url; link.download = `colorized_${selectedImage.id}.png`; document.body.appendChild(link); link.click(); document.body.removeChild(link);
                             }} className="w-full py-3 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 text-sm"><Download size={18} /> تحميل</button>
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
              <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-pink-500 to-rose-500"></div>
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-500/10 rounded-full flex items-center justify-center text-pink-400"><Crown size={20} /></div>
                  <h2 className="text-xl font-bold text-white">شراء رصيد إضافي</h2>
                </div>
                <button onClick={() => setShowBuyModal(false)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"><X size={20} className="text-gray-400" /></button>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {loadingPlans ? (
                  <div className="text-center py-12"><div className="w-8 h-8 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin mx-auto mb-4"></div><div className="text-gray-400">جاري تحميل الخطط...</div></div>
                ) : plans.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">لا توجد خطط متاحة حالياً</div>
                ) : (
                  <div className="space-y-4">
                    {plans.map((p: any) => (
                      <button key={p.plan_id} onClick={() => { setSelectedPlan(p); setShowBuyModal(false); setOpenPaymentModal(true); }} className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-right transition-all duration-300 border border-white/5 hover:border-pink-500/50 group">
                        <div className="flex items-center justify-between">
                          <div><div className="font-bold text-white text-lg group-hover:text-pink-400 transition-colors">{p.plan_name}</div><div className="text-gray-400 text-sm mt-1">{p.credits_per_period} نقطة رصيد / {p.period}</div></div>
                          <div className="text-white font-bold text-xl bg-white/10 px-3 py-1 rounded-lg group-hover:bg-pink-500 group-hover:text-white transition-all">${p.amount}</div>
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