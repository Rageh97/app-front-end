"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import PaymentModal from "@/components/Modals/PaymentModal";
import UpgradeModal from "@/components/Modals/UpgradeModal";
import Link from "next/link";
import { toast, Toaster } from 'react-hot-toast';
import { 
  ArrowRight, Brush, Upload, Download, Wand2, Sparkles, Eraser, 
  Move, RefreshCw, X, CreditCard, Crown, ImageIcon, Zap, 
  Trash2, Maximize2, Plus, Coins
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

const EDIT_TYPES = [
    { id: 'remove_object', name: 'حذف عنصر', icon: <Eraser size={14} /> },
    { id: 'add_object', name: 'إضافة عنصر', icon: <Wand2 size={14} /> },
    { id: 'change_background', name: 'تغيير الخلفية', icon: <Move size={14} /> },
    { id: 'enhance_quality', name: 'تحسين الجودة', icon: <Sparkles size={14} /> },
];

export default function AIImageEditorPage() {
  const [balance, setBalance] = useState<CreditsRecord | null>(null);
  const [selectedInImage, setSelectedInImage] = useState<string | null>(null);
  const [editType, setEditType] = useState('remove_object');
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
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
  }, [editPrompt]);

  const baseCredits = 10;
  const imageProfit = balance?.plan?.image_profit ?? 0;
  const creditsNeeded = baseCredits + imageProfit;

  const [userImages, setUserImages] = useState<any[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any | null>(null);

  const [plans, setPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
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
      const res = await fetch(`${apiBase}/api/ai/user-images?limit=24&tool=edit`, {
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
    try {
      const res = await fetch(`${apiBase}/api/credits/plans`);
      if (res.status === 200) setPlans(await res.json());
    } catch (e) {}
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) return setError('حجم الصورة كبير جداً');
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedInImage(e.target?.result as string);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const onEdit = async () => {
    if (!selectedInImage) return setError('يرجى رفع صورة أولاً');
    if (!editPrompt.trim() && editType !== 'enhance_quality') return setError('يرجى وصف التعديل');

    // فحص الرصيد قبل البدء
    if (!balance || balance.remaining_credits < creditsNeeded) {
      setShowUpgradeModal(true);
      return;
    }

    setIsEditing(true);
    setError('');
    setProcessingProgress(0);

    let progressValue = 0;
    const interval = setInterval(() => {
      progressValue += Math.random() * 3 + 1;
      if (progressValue >= 95) { clearInterval(interval); progressValue = 95; }
      setProcessingProgress(progressValue);
    }, 1000);

    try {
      const response = await fetch(`${apiBase}/api/ai/image-edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getToken() as any,
          "User-Client": (global as any)?.clientId1328
        },
        body: JSON.stringify({
          image: selectedInImage, edit_type: editType, prompt: editPrompt.trim()
        })
      });

      clearInterval(interval);
      setProcessingProgress(100);

      const data = await response.json();
      if (data.success) {
        toast.success('تم التعديل بنجاح!');
        fetchBalance();
        fetchUserImages();
      } else {
        setError(data.message || 'فشلت المعالجة');
      }
    } catch (error) {
      clearInterval(interval);
      setError('خطأ في الاتصال');
    } finally { setIsEditing(false); }
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

  const downloadUtils = async (url: string) => {
    try {
      const toastId = toast.loading('جاري التحميل...');
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `nexus_edit_${Date.now()}.png`;
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
      <div className="h-screen flex flex-col bg-[#010101] text-white selection:bg-violet-500/30 overflow-hidden" dir="rtl">
        <header className="shrink-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 px-6 py-3 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/ai" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all font-bold text-xs"><ArrowRight size={14} /> عودة</Link>
              <div className="flex items-center gap-2">
                <span className="w-2 h-8 bg-violet-600 rounded-full"></span>
                <h1 className="text-lg font-bold">محرر الصور AI</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2">
                <CreditCard size={12} className="text-violet-400" />
                <span className="text-sm font-bold text-violet-400">{balance?.remaining_credits || 0}</span>
              </div>
              <button onClick={() => setShowBuyModal(true)} className="bg-violet-600 px-4 py-1.5 rounded-lg text-[10px] font-black hover:bg-violet-700 transition-all flex items-center gap-2"><Crown size={12} /> شراء</button>
            </div>
        </header>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            <aside className="w-full lg:w-[300px] h-auto max-h-[35vh] lg:h-full lg:max-h-full border-b lg:border-b-0 lg:border-l border-white/10 bg-[#050505] overflow-y-auto custom-scrollbar flex flex-col shrink-0 order-1">
                <div className="p-4 space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 flex items-center gap-2 uppercase tracking-wide">
                            <Upload size={12} className="text-violet-400" /> الصورة الأصلية
                        </label>
                        <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-white/5 rounded-lg p-4 text-center hover:bg-violet-500/5 hover:border-violet-500/40 cursor-pointer transition-all">
                            {selectedInImage ? (
                                <div className="space-y-1">
                                    <img src={selectedInImage} className="h-24 mx-auto rounded-lg object-cover shadow-xl" />
                                    <span className="text-[9px] text-violet-400 font-bold block">تغيير الصورة</span>
                                </div>
                            ) : (
                                <div className="py-4">
                                    <Plus size={20} className="mx-auto text-gray-600 mb-1" />
                                    <p className="text-[9px] text-gray-400 font-medium">اختر صورة</p>
                                </div>
                            )}
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </div>

                    <div className="space-y-2">
                         <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                            <Wand2 size={12} className="text-violet-400" /> نوع التعديل
                         </label>
                         <div className="grid grid-cols-2 gap-1.5">
                             {EDIT_TYPES.map(t => (
                                 <button key={t.id} onClick={() => setEditType(t.id)} className={`flex items-center gap-1.5 p-2 rounded-lg border text-right transition-all truncate ${editType === t.id ? 'bg-violet-500/10 border-violet-500/40 text-violet-300' : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'}`}>
                                     <span className={`shrink-0 ${editType === t.id ? 'text-violet-400' : 'text-gray-600'}`}>
                                        {React.cloneElement(t.icon as React.ReactElement, { size: 12 })}
                                     </span>
                                     <span className="text-[10px] font-bold truncate">{t.name}</span>
                                 </button>
                             ))}
                         </div>
                    </div>

                    {editType !== 'enhance_quality' && (
                        <div className="space-y-2">
                             <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                                <Sparkles size={12} className="text-violet-400" /> وصف التعديل
                             </label>
                             <textarea 
                                ref={promptRef}
                                value={editPrompt} 
                                onChange={(e) => setEditPrompt(e.target.value)} 
                                placeholder="مثال: احذف القطة في الخلفية..." 
                                className="w-full min-h-[60px] p-2 rounded-lg bg-white/5 border border-white/10 text-[10px] focus:border-violet-500/40 outline-none resize-none transition-all overflow-hidden" 
                             />
                        </div>
                    )}
                </div>

                <div className="mt-auto p-4 border-t border-white/5 bg-[#080808]">
                    {error && <div className="mb-2 p-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-[9px] font-bold text-center truncate">{error}</div>}
                    
                    <div className="flex items-center justify-between text-[10px] text-gray-400 mb-2 font-medium bg-white/5 p-2 rounded-lg border border-white/10">
                        <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                <Coins size={10} className="text-yellow-500" />
                            </div>
                            <span>التكلفة المتوقعه:</span>
                        </div>
                        <span className="text-white font-bold text-xs">{creditsNeeded}</span>
                    </div>

                    <PremiumButton label={isEditing ? "جاري التعديل..." : "تنفيذ التعديل"} icon={isEditing ? RefreshCw : Brush} onClick={onEdit} disabled={!selectedInImage || isEditing} className="w-full py-3 text-xs rounded-xl" />
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto bg-[#020202] p-6 custom-scrollbar order-2">
                <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
                    {isEditing && (
                         <div className="break-inside-avoid relative rounded-2xl overflow-hidden bg-white/5 aspect-square border border-white/10 ring-1 ring-violet-500/30 flex flex-col items-center justify-center p-4">
                             <span className="text-xs font-bold text-violet-400 mb-2">{Math.floor(processingProgress)}%</span>
                             <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                 <div className="h-full bg-violet-600 transition-all duration-300" style={{ width: `${processingProgress}%` }}></div>
                             </div>
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
                        <h3 className="text-xs font-bold text-gray-500 mb-6 uppercase tracking-wider">تفاصيل التعديل</h3>
                        <div className="flex-1 space-y-4">
                             <div className="bg-white/5 p-4 rounded-xl text-xs text-gray-400 leading-relaxed font-medium">{selectedImage.prompt || "تعديل ذكي تم تنفيذه بدقة عالية."}</div>
                        </div>
                        <div className="space-y-3 pt-6 border-t border-white/10">
                             <button onClick={() => downloadUtils(selectedImage.url)} className="w-full py-3 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 text-sm"><Download size={18} /> تحميل</button>
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
              <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center text-purple-400"><Crown size={20} /></div>
                  <h2 className="text-xl font-bold text-white">شراء رصيد إضافي</h2>
                </div>
                <button onClick={() => setShowBuyModal(false)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"><X size={20} className="text-gray-400" /></button>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {loadingPlans ? (
                  <div className="text-center py-12"><div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div><div className="text-gray-400">جاري تحميل الخطط...</div></div>
                ) : plans.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">لا توجد خطط متاحة حالياً</div>
                ) : (
                  <div className="space-y-4">
                    {plans.map((p: any) => (
                      <button key={p.plan_id} onClick={() => { setSelectedPlan(p); setShowBuyModal(false); setOpenPaymentModal(true); }} className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-right transition-all duration-300 border border-white/5 hover:border-purple-500/50 group">
                        <div className="flex items-center justify-between">
                          <div><div className="font-bold text-white text-lg group-hover:text-purple-400 transition-colors">{p.plan_name}</div><div className="text-gray-400 text-sm mt-1">{p.credits_per_period} نقطة رصيد / {p.period}</div></div>
                          <div className="text-white font-bold text-xl bg-white/10 px-3 py-1 rounded-lg group-hover:bg-purple-500 group-hover:text-white transition-all">${p.amount}</div>
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