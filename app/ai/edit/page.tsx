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
  Trash2, Maximize2, Plus, Coins, Palette as PaletteIcon
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

const EDIT_TYPES = [
    { id: 'remove_object', name: 'حذف عنصر', icon: <Eraser size={14} />, desc: 'حذف أي كائن من الصورة' },
    { id: 'add_object', name: 'إضافة عنصر', icon: <Wand2 size={14} />, desc: 'إضافة كائن جديد بذكاء' },
    { id: 'change_background', name: 'تغيير الخلفية', icon: <Move size={14} />, desc: 'استبدال الخلفية بالكامل' },
    { id: 'enhance_quality', name: 'تحسين الجودة', icon: <Sparkles size={14} />, desc: 'رفع الدقة وتحسين الإضاءة' },
    { id: 'inpainting', name: 'تعديل موضعي', icon: <Brush size={14} />, desc: 'تعديل أو استبدال جزء محدد' },
    { id: 'outpainting', name: 'توسيع الإطار', icon: <Maximize2 size={14} />, desc: 'توسيع الصورة إلى الخارج' },
    { id: 'face_enhance', name: 'تجميل الملامح', icon: <Sparkles size={14} />, desc: 'تحسين تفاصيل الوجه والعيون' },
    { id: 'style_transfer', name: 'تغيير النمط', icon: <PaletteIcon size={14} />, desc: 'تحويل الأسلوب الفني للصورة' },
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

  const { operationPrice } = useAiPricing();
  const baseCredits = operationPrice('image-edit', 22);
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
          setUserImages(data.images.map((img: any) => ({id: img.image_id, url: img.image_url || img.cloudinary_url, date: img.created_at, prompt: img.prompt, is_public: img.is_public })));
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
      const res = await fetch(`${apiBase}/api/ai/user-images?tool=edit`, {
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
      <div className="h-screen flex flex-col bg-[#06070B] text-white selection:bg-emerald-500/30 overflow-hidden" dir="rtl">
        {/* Unified AI Tool Header */}
        <AIToolHeader
          title="محرر وتعديل الصور"
          description="إضافة وتعديل وحذف العناصر وإعادة رسم أجزاء الصور بالذكاء الاصطناعي"
          badge="AI Image Editor"
          icon={Wand2}
          iconGradient="from-emerald-600 to-teal-600"
          userCredits={balance?.remaining_credits}
          onUpgradeClick={() => setShowBuyModal(true)}
          backHref="/ai"
        />

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            <aside className="w-full lg:w-[380px] h-[calc(100vh-3.5rem)] bg-[#0B0D14] border-b lg:border-b-0 lg:border-l border-white/[0.08] p-5 flex flex-col justify-between shrink-0 overflow-hidden z-30 shadow-2xl relative">
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-0.5 pb-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-black text-white">محرر الصور الذكي</h2>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                            <Upload size={14} className="text-emerald-400" /> الصورة المراد تعديلها
                        </label>
                        <div onClick={() => fileInputRef.current?.click()} className="border border-dashed border-white/[0.08] rounded-xl p-4 text-center hover:bg-[#161a27] hover:border-emerald-500/40 cursor-pointer transition-all bg-[#121520]">
                            {selectedInImage ? (
                                <div className="space-y-1">
                                    <img src={selectedInImage} className="h-28 mx-auto rounded-lg object-cover shadow-xl" />
                                    <span className="text-[10px] text-emerald-400 font-bold block">تغيير الصورة</span>
                                </div>
                            ) : (
                                <div className="py-3">
                                    <Plus size={22} className="mx-auto text-gray-400 mb-1" />
                                    <p className="text-xs text-gray-300 font-bold">اختر صورة أو اسحبها هنا</p>
                                </div>
                            )}
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </div>

                    <div className="space-y-2">
                         <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                            <Wand2 size={14} className="text-emerald-400" /> نوع التعديل
                         </label>
                         <div className="grid grid-cols-2 gap-1.5 max-h-[160px] overflow-y-auto custom-scrollbar">
                             {EDIT_TYPES.map(t => (
                                 <button key={t.id} onClick={() => setEditType(t.id)} className={`flex items-center gap-2 p-2 rounded-xl border text-right transition-all truncate ${editType === t.id ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-bold' : 'bg-[#121520] border-white/[0.08] text-gray-400 hover:bg-[#161a27]'}`}>
                                     <span className={`shrink-0 ${editType === t.id ? 'text-emerald-400' : 'text-gray-500'}`}>
                                        {React.cloneElement(t.icon as React.ReactElement, { size: 13 })}
                                     </span>
                                     <span className="text-xs truncate">{t.name}</span>
                                 </button>
                             ))}
                         </div>
                    </div>

                    {editType !== 'enhance_quality' && editType !== 'face_enhance' && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-400">تعليمات التعديل (الوصف)</label>
                            <div className="relative rounded-xl border border-white/[0.08] bg-[#121520] p-2.5 focus-within:border-emerald-500/50">
                                <textarea
                                    ref={promptRef}
                                    value={editPrompt}
                                    onChange={(e) => setEditPrompt(e.target.value)}
                                    placeholder="اكتب التعديل المطلوب... مثال: استبدل الخلفية بشاطئ استوائي مشمس"
                                    rows={3}
                                    className="w-full bg-transparent text-xs text-white placeholder:text-gray-500 outline-none resize-none leading-relaxed"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-3 border-t border-white/[0.08] shrink-0 bg-[#0B0D14] z-20">
                    {error && <div className="mb-2 p-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-[10px] font-bold text-center truncate">{error}</div>}
                    
                    <AIGenerateButton
                        onClick={onEdit}
                        isGenerating={isEditing}
                        disabled={!selectedInImage}
                        cost={creditsNeeded}
                        label="إنشاء"
                        generatingLabel="جاري الإنشاء..."
                        icon={Wand2}
                        variant="emerald"
                    />
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto bg-[#06070B] p-6 custom-scrollbar">
                <AIResultsGallery
                    items={userImages}
                    isGenerating={isEditing}
                    progress={processingProgress}
                    generationIcon={Wand2}
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
          title="تعديل ومعالجة أجزاء الصورة"
          subtitle="تعديل ذكي متقدم تم تنفيذه بالذكاء الاصطناعي"
          prompt={selectedImage?.prompt}
          details={[
            { label: "الوصف", value: selectedImage?.prompt || "تعديل ذكي" },
            { label: "التاريخ", value: selectedImage?.date ? new Date(selectedImage.date).toLocaleDateString('ar-EG') : "" },
          ]}
        />

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
                          <div className="text-white font-bold text-xl bg-white/10 px-3 py-1 rounded-lg group-hover:bg-purple-500 group-hover:text-white transition-all">{p.amount} <span className="bg-gradient-to-r from-[#FF0000] via-[#FFFFFF] to-[#000000] bg-clip-text text-transparent font-bold">IQD</span></div>
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
