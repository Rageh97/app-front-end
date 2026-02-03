"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import PaymentModal from "@/components/Modals/PaymentModal";
import UpgradeModal from "@/components/Modals/UpgradeModal";
import Link from "next/link";
import { toast, Toaster } from 'react-hot-toast';
import { 
  ArrowRight, Brush, Upload, Download, RefreshCw, X, 
  CreditCard, Crown, Sparkles, Wand2, Type, Image as ImageIcon,
  Trash2, Maximize2, Plus, Info
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

export default function SketchToImagePage() {
  const [balance, setBalance] = useState<CreditsRecord | null>(null);
  const [sketchImage, setSketchImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<'realistic' | 'artistic' | 'cartoon' | 'anime'>('realistic');
  const [colorScheme, setColorScheme] = useState<'natural' | 'vibrant' | 'monochrome' | 'sepia'>('natural');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
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
      const res = await fetch(`${apiBase}/api/ai/user-images?limit=24&tool=sketch`, {
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
        }
      } catch (e) {}
    };
    init();
    return () => { cancelled = true; };
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) return toast.error('حجم الصورة كبير جداً');
      const reader = new FileReader();
      reader.onload = (e) => {
        setSketchImage(e.target?.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const onGenerate = async () => {
    if (!apiBase || !sketchImage) return toast.error('يرجى رفع الرسمة');
    
    // فحص الرصيد قبل البدء
    if (!balance || balance.remaining_credits <= 0) {
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
      const res = await fetch(`${apiBase}/api/ai/sketch-to-image`, {
        method: "POST",
        headers: { 'Authorization': getToken() as any, 'Content-Type': 'application/json', "User-Client": (global as any)?.clientId1328 },
        body: JSON.stringify({ sketch: sketchImage, prompt, style, color_scheme: colorScheme }),
      });
      
      clearInterval(interval);
      setGenerationProgress(100);
      
      if (res.status === 200) {
        toast.success('تم تحويل الرسمة إلى صورة!');
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
      <div className="h-screen flex flex-col bg-[#010101] text-white selection:bg-amber-500/30 overflow-hidden" dir="rtl">
        <header className="shrink-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 px-6 py-3 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/ai" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 font-bold text-xs"><ArrowRight size={14} /> عودة</Link>
              <div className="flex items-center gap-2">
                <span className="w-2 h-8 bg-amber-600 rounded-full"></span>
                <h1 className="text-lg font-bold">من رسمة إلى صورة AI</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2">
                <CreditCard size={12} className="text-amber-400" />
                <span className="text-sm font-bold text-amber-400">{balance?.remaining_credits || 0}</span>
              </div>
              <button onClick={() => setShowBuyModal(true)} className="bg-amber-600 px-4 py-1.5 rounded-lg text-[10px] font-black hover:bg-amber-700 transition-all flex items-center gap-2"><Crown size={12} /> شراء</button>
            </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
            <aside className="w-[320px] md:w-[360px] border-l border-white/10 bg-[#050505] overflow-y-auto custom-scrollbar flex flex-col p-5 shrink-0">
                <div className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-500 flex items-center gap-2 uppercase tracking-wide"><Upload size={14} className="text-amber-400" /> ارفع رسمتك (Sketch)</label>
                        <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-white/5 rounded-2xl p-6 text-center hover:bg-amber-500/5 hover:border-amber-500/40 cursor-pointer transition-all">
                            {sketchImage ? (
                                <div className="space-y-2 relative">
                                    <img src={sketchImage} className="h-40 mx-auto rounded-xl object-contain shadow-2xl" />
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setSketchImage(null); }} 
                                        className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-500 rounded-full transition-all"
                                    >
                                        <X size={14} />
                                    </button>
                                    <span className="text-[10px] text-amber-400 font-bold block">تغيير الرسمة</span>
                                </div>
                            ) : (
                                <div className="py-8">
                                    <Plus className="mx-auto text-gray-600 mb-2" />
                                    <p className="text-[10px] text-gray-400 font-medium">ارفع رسمة بسيطة بالقلم</p>
                                    <p className="text-[9px] text-gray-600 mt-1">PNG, JPG, WEBP (حتى 10MB)</p>
                                </div>
                            )}
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </div>

                    <div className="space-y-3">
                         <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                            <Type size={14} className="text-amber-400" /> وصف إضافي (اختياري)
                         </label>
                         <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="مثال: في يوم مشمس، إضاءة طبيعية، ألوان دافئة..." className="w-full h-24 p-3 rounded-xl bg-white/5 border border-white/10 text-xs focus:border-amber-500/40 outline-none resize-none transition-all" />
                         <p className="text-[9px] text-gray-600">يمكنك إضافة تفاصيل عن الإضاءة، الألوان، أو الأجواء المطلوبة</p>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                            <Wand2 size={14} className="text-amber-400" /> نمط الصورة
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                onClick={() => setStyle('realistic')} 
                                className={`p-3 rounded-xl text-xs font-bold transition-all ${style === 'realistic' ? 'bg-amber-500 text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                            >
                                واقعي 
                            </button>
                            <button 
                                onClick={() => setStyle('artistic')} 
                                className={`p-3 rounded-xl text-xs font-bold transition-all ${style === 'artistic' ? 'bg-amber-500 text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                            >
                                فني 
                            </button>
                            <button 
                                onClick={() => setStyle('cartoon')} 
                                className={`p-3 rounded-xl text-xs font-bold transition-all ${style === 'cartoon' ? 'bg-amber-500 text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                            >
                                كرتون 
                            </button>
                            <button 
                                onClick={() => setStyle('anime')} 
                                className={`p-3 rounded-xl text-xs font-bold transition-all ${style === 'anime' ? 'bg-amber-500 text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                            >
                                أنمي 
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                            <Type size={14} className="text-amber-400" /> نظام الألوان
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                onClick={() => setColorScheme('natural')} 
                                className={`p-3 rounded-xl text-xs font-bold transition-all ${colorScheme === 'natural' ? 'bg-amber-500 text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                            >
                                طبيعي 
                            </button>
                            <button 
                                onClick={() => setColorScheme('vibrant')} 
                                className={`p-3 rounded-xl text-xs font-bold transition-all ${colorScheme === 'vibrant' ? 'bg-amber-500 text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                            >
                                نابض 
                            </button>
                            <button 
                                onClick={() => setColorScheme('monochrome')} 
                                className={`p-3 rounded-xl text-xs font-bold transition-all ${colorScheme === 'monochrome' ? 'bg-amber-500 text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                            >
                                أبيض وأسود 
                            </button>
                            <button 
                                onClick={() => setColorScheme('sepia')} 
                                className={`p-3 rounded-xl text-xs font-bold transition-all ${colorScheme === 'sepia' ? 'bg-amber-500 text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                            >
                                سيبيا 
                            </button>
                        </div>
                    </div>

                    {/* <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 flex gap-3 items-start">
                        <Info size={16} className="text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
                            {style === 'realistic' && 'النمط الواقعي: يحول الرسم إلى صورة فوتوغرافية واقعية بتفاصيل دقيقة.'}
                            {style === 'artistic' && 'النمط الفني: يحول الرسم إلى لوحة فنية بضربات فرشاة احترافية.'}
                            {style === 'cartoon' && 'نمط الكرتون: يحول الرسم إلى رسوم متحركة ملونة وجذابة.'}
                            {style === 'anime' && 'نمط الأنمي: يحول الرسم إلى أسلوب الأنمي الياباني الشهير.'}
                        </p>
                    </div> */}
                </div>

                <div className="mt-auto pt-6 border-t border-white/5">
                    {error && <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-bold text-center">{error}</div>}
                    <PremiumButton label={isGenerating ? "جاري التحويل..." : "تحويل إلى صورة"} icon={isGenerating ? RefreshCw : Sparkles} onClick={onGenerate} disabled={!sketchImage || isGenerating} className="w-full py-4 text-sm rounded-xl" />
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto bg-[#020202] p-6 custom-scrollbar">
                <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
                    {isGenerating && (
                         <div className="break-inside-avoid relative rounded-2xl overflow-hidden bg-white/5 aspect-square border border-white/10 ring-1 ring-amber-500/30 flex flex-col items-center justify-center p-4">
                             <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                             <span className="text-[10px] font-bold text-amber-400">{Math.floor(generationProgress)}%</span>
                         </div>
                    )}
                    {userImages.map((img) => (
                        <div key={img.id} onClick={() => setSelectedImage(img)} className="break-inside-avoid group relative rounded-2xl overflow-hidden bg-[#111] border border-white/5 cursor-pointer transition-all hover:translate-y-[-4px] mb-4">
                            <img src={img.url} className="w-full h-auto object-cover" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                <span className="text-[9px] text-white font-medium line-clamp-2 mb-1">{img.prompt}</span>
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
                        <img src={selectedImage.url} className="max-h-full max-w-full object-contain shadow-2xl" />
                    </div>
                    <div className="w-[300px] shrink-0 h-full max-h-[400px] bg-[#0c0c0c] border border-white/10 rounded-2xl p-6 hidden lg:flex flex-col">
                        <h3 className="text-xs font-bold text-gray-500 mb-6 uppercase tracking-wider">التحويل الفني</h3>
                        <div className="flex-1 space-y-4">
                             <div className="bg-white/5 p-4 rounded-xl text-xs text-gray-400 leading-relaxed font-medium">{selectedImage.prompt}</div>
                        </div>
                        <div className="space-y-3 pt-6 border-t border-white/10">
                             <button onClick={() => { const link = document.createElement('a'); link.href = selectedImage.url; link.download = `sketch_${selectedImage.id}.png`; document.body.appendChild(link); link.click(); document.body.removeChild(link); }} className="w-full py-3 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 text-sm"><Download size={18} /> تحميل</button>
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
              <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center text-green-400"><Crown size={20} /></div>
                  <h2 className="text-xl font-bold text-white">شراء رصيد إضافي</h2>
                </div>
                <button onClick={() => setShowBuyModal(false)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"><X size={20} className="text-gray-400" /></button>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {loadingPlans ? (
                  <div className="text-center py-12"><div className="w-8 h-8 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div><div className="text-gray-400">جاري تحميل الخطط...</div></div>
                ) : plans.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">لا توجد خطط متاحة حالياً</div>
                ) : (
                  <div className="space-y-4">
                    {plans.map((p: any) => (
                      <button key={p.plan_id} onClick={() => { setSelectedPlan(p); setShowBuyModal(false); setOpenPaymentModal(true); }} className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-right transition-all duration-300 border border-white/5 hover:border-green-500/50 group">
                        <div className="flex items-center justify-between">
                          <div><div className="font-bold text-white text-lg group-hover:text-green-400 transition-colors">{p.plan_name}</div><div className="text-gray-400 text-sm mt-1">{p.credits_per_period} نقطة رصيد / {p.period}</div></div>
                          <div className="text-white font-bold text-xl bg-white/10 px-3 py-1 rounded-lg group-hover:bg-green-500 group-hover:text-white transition-all">${p.amount}</div>
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