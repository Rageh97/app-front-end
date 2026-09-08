"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { 
  Sparkles, 
  Upload, 
  Download, 
  Shirt, 
  User, 
  CheckCircle2, 
  X,
  Layers,
  ShoppingBag
, Trash2 } from "lucide-react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { toast, Toaster } from "react-hot-toast";
import UpgradeModal from "@/components/Modals/UpgradeModal";
import { 
  AIToolHeader, 
  AIGenerateButton, 
  AIGenerationCard, 
  AIResultModal, 
  downloadMediaDirectly 
} from "@/components/ai";
import { handleAuthError } from "@/utils/auth";
import { useAiPricing } from '@/hooks/useAiPricing';

interface GenerationResult {
  imageUrl: string;
  styleName: string;
  time: string;
}

const PRESET_STYLES = [
  { id: 'luxury_suit', name: "بدلة رسمية فاخرة", desc: "تصميم إيطالي كلاسيكي مع ربطة عنق راقية" },
  { id: 'casual_streetwear', name: "ملابس ستريت وير عصرية", desc: "هودي أوفر سايز وبنطال كارجو بتصميم جذاب" },
  { id: 'summer_linen', name: "طقم كتان صيفي", desc: "قميص وبنطال كتان أبيض بيج ناعم ومريح" },
  { id: 'leather_jacket', name: "جاكيت جلد عصري", desc: "جاكيت بايكر جلدي أسود أنيق مع تيشرت بسيط" },
];

export default function ClothesSwapPage() {
  const personInputRef = useRef<HTMLInputElement>(null);
  const garmentInputRef = useRef<HTMLInputElement>(null);
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4560', []);
  const getToken = useCallback(() => typeof window !== 'undefined' ? localStorage.getItem("a") : null, []);
  
  // State
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [garmentImage, setGarmentImage] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('luxury_suit');
  const [customStylePrompt, setCustomStylePrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  const [history, setHistory] = useState<GenerationResult[]>([]);
  const [selectedModalItem, setSelectedModalItem] = useState<GenerationResult | null>(null);
  const [balance, setBalance] = useState<any>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);

  const { operationPrice } = useAiPricing();
  const creditsNeeded = operationPrice('clothes-swap', 5);

  const fetchBalance = useCallback(async () => {
    if (!apiBase) return;
    try {
      const res = await fetch(`${apiBase}/api/credits/me/balance`, {
        headers: { 
          'Authorization': getToken() || '',
          "User-Client": (global as any)?.clientId1328 || ""
        }
      });
      if (res.status === 401 || res.status === 403) {
        handleAuthError(res.status);
        return;
      }
      if (res.ok) setBalance(await res.json());
    } catch (e) {}
  }, [apiBase, getToken]);

  const fetchHistory = useCallback(async () => {
    if (!apiBase) return;
    try {
      const res = await fetch(`${apiBase}/api/ai/user-images?tool=clothes-swap&limit=50`, {
        headers: { 
          'Authorization': getToken() || '',
          "User-Client": (global as any)?.clientId1328 || ""
        }
      });
      if (res.status === 401 || res.status === 403) {
        handleAuthError(res.status);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.images)) {
          const mapped: GenerationResult[] = data.images.map((img: any) => ({
            imageUrl: img.image_url || img.cloudinary_url,
            styleName: img.prompt || img.metadata?.stylePrompt || 'تبديل أزياء وتجربة افتراضية',
            time: img.created_at ? new Date(img.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''
          }));
          setHistory(mapped);
        }
      }
    } catch (e) {}
  }, [apiBase, getToken]);

  const handleDeleteSingle = async (idOrIdx: number | string, isVideo = false) => {
    if (!apiBase) return;
    try {
      const endpoint = isVideo
        ? `${apiBase}/api/ai/user-videos/${idOrIdx}`
        : `${apiBase}/api/ai/user-images/${idOrIdx}`;
      await fetch(endpoint, {
        method: 'DELETE',
        headers: { 
          'Authorization': getToken() || '',
          'User-Client': (global as any)?.clientId1328 || ''
        }
      });
      setHistory(prev => prev.filter((item: any) => (item.id || item.time) !== idOrIdx));
      toast.success('تم حذف النتيجة بنجاح');
      if (selectedModalItem && ((selectedModalItem as any).id === idOrIdx || selectedModalItem.time === idOrIdx)) {
        setSelectedModalItem(null);
      }
    } catch (e) {
      toast.error('فشل حذف النتيجة');
    }
  };

  const handleDeleteAll = async () => {
    if (!apiBase) return;
    try {
      await fetch(`${apiBase}/api/ai/user-images?tool=clothes-swap`, {
        method: 'DELETE',
        headers: { 
          'Authorization': getToken() || '',
          'User-Client': (global as any)?.clientId1328 || ''
        }
      });
      setHistory([]);
      toast.success('تم حذف جميع النتائج السابقة');
      setSelectedModalItem(null);
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
          fetchHistory();
        }
      } catch (e) {}
    };
    init();
    return () => { cancelled = true; };
  }, [fetchBalance, fetchHistory]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'person' | 'garment') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error("يرجى اختيار ملف صورة صالح");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (type === 'person') setPersonImage(event.target?.result as string);
      else setGarmentImage(event.target?.result as string);
      toast.success("تم رفع الصورة بنجاح");
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!personImage) {
      toast.error("يرجى رفع صورة الشخص أولاً");
      return;
    }

    if (balance && balance.remaining_credits < creditsNeeded) {
      setShowUpgradeModal(true);
      return;
    }

    setIsGenerating(true);

    try {
      const activePresetObj = PRESET_STYLES.find(s => s.id === selectedPreset);
      const promptToSend = customStylePrompt.trim() || activePresetObj?.name || 'Virtual try-on clothes swap';

      const response = await fetch(`${apiBase}/api/ai/clothes-swap`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": getToken() || '',
          "User-Client": (global as any)?.clientId1328 || ""
        },
        body: JSON.stringify({
          image: personImage,
          garment_image: garmentImage || undefined,
          style_prompt: promptToSend
        })
      });

      if (response.status === 401 || response.status === 403) {
        handleAuthError(response.status);
        return;
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "فشلت عملية تبديل الملابس");
      }

      const newResult: GenerationResult = {
        imageUrl: data.image_url,
        styleName: promptToSend,
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };

      setHistory(prev => [newResult, ...prev]);
      setSelectedModalItem(newResult);
      toast.success("تم قياس وتبديل الملابس بنجاح!");
      fetchBalance();

    } catch (err: any) {
      console.error("Clothes swap error:", err);
      toast.error(err.message || "حدث خطأ أثناء المعالجة");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

      {/* Unified AI Result Modal */}
      <AIResultModal
        isOpen={!!selectedModalItem}
        onClose={() => setSelectedModalItem(null)}
        mediaUrl={selectedModalItem?.imageUrl || null}
        mediaType="image"
        title="تبديل وقياس الملابس بالذكاء الاصطناعي"
        subtitle={selectedModalItem?.styleName}
        details={[
          { label: "الوصف والستايل", value: selectedModalItem?.styleName || "" },
          { label: "الرصيد المستخدم", value: `${creditsNeeded} رصيد` },
        ]}
        timestamp={selectedModalItem?.time}
        creditsUsed={creditsNeeded}
      />

      <div className="h-screen flex flex-col bg-[#06070B] text-white selection:bg-purple-500/30 overflow-hidden font-sans" dir="rtl">
        
        {/* Unified AI Tool Header */}
        <AIToolHeader
          title="تبديل الملابس والقياس الافتراضي (Clothes Swap)"
          userCredits={balance?.remaining_credits}
          onUpgradeClick={() => setShowUpgradeModal(true)}
          backHref="/ai"
        />

        {/* ─── Studio 2-Column Layout ─── */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* ─── Right Column: Control Sidebar (Compact, No Scrollbar) ─── */}
          <aside className="w-full lg:w-[360px] xl:w-[380px] h-[calc(100vh-3.5rem)] bg-[#0B0D14] border-b lg:border-b-0 lg:border-l border-white/[0.08] p-4 flex flex-col justify-between shrink-0 overflow-hidden z-30 shadow-2xl relative">
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-0.5 pb-2">
              
              <div>
                <h2 className="text-sm font-bold text-white tracking-wide">إعدادات تبديل الأزياء</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">تجربة الملابس افتراضياً على جسمك بدقة فائقة وتناسق واقعي</p>
              </div>

              {/* 1. Upload Person Image */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 block text-right flex items-center gap-1.5">
                  <User size={12} className="text-purple-400" />
                  <span>صورة الشخص (الجسم بالكامل أو النصف العلوي):</span>
                </label>
                <input
                  ref={personInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handleFileUpload(e, 'person')}
                  className="hidden"
                />

                {personImage ? (
                  <div className="p-2.5 rounded-xl bg-[#121520] border border-white/[0.08] flex items-center justify-between gap-2.5 shadow-sm">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/20 bg-black shrink-0">
                        <img src={personImage} alt="الشخص" className="w-full h-full object-cover" />
                      </div>
                      <div className="text-right truncate">
                        <span className="text-xs font-bold text-white block truncate">تم تحديد صورة الشخص</span>
                        <span className="text-[10px] text-purple-400 flex items-center gap-1 font-medium">
                          <CheckCircle2 size={10} /> جاهزة للقياس
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setPersonImage(null)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-900/50 text-gray-400 hover:text-rose-300 border border-white/10 transition-all shrink-0"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => personInputRef.current?.click()}
                    className="border border-dashed border-white/[0.08] hover:border-purple-500/40 rounded-xl py-3 px-4 text-center cursor-pointer transition-all bg-[#121520] hover:bg-[#161a27] flex items-center justify-center gap-3 group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform shrink-0">
                      <Upload size={14} />
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-gray-200 block group-hover:text-purple-300 transition-colors">
                        رفع صورة الشخص
                      </span>
                      <span className="text-[10px] text-gray-500">موصى بها واضحة الإضاءة</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Upload Garment Image (Optional) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 block text-right flex items-center gap-1.5">
                  <Shirt size={12} className="text-purple-400" />
                  <span>صورة قطعة الملابس (اختياري):</span>
                </label>
                <input
                  ref={garmentInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handleFileUpload(e, 'garment')}
                  className="hidden"
                />

                {garmentImage ? (
                  <div className="p-2.5 rounded-xl bg-[#121520] border border-white/[0.08] flex items-center justify-between gap-2.5 shadow-sm">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/20 bg-black shrink-0">
                        <img src={garmentImage} alt="الملابس" className="w-full h-full object-cover" />
                      </div>
                      <div className="text-right truncate">
                        <span className="text-xs font-bold text-white block truncate">تم تحديد قطعة الملابس</span>
                        <span className="text-[10px] text-purple-400 flex items-center gap-1 font-medium">
                          <CheckCircle2 size={10} /> ستُطبّق على الجسم
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setGarmentImage(null)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-900/50 text-gray-400 hover:text-rose-300 border border-white/10 transition-all shrink-0"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => garmentInputRef.current?.click()}
                    className="border border-dashed border-white/[0.08] hover:border-purple-500/40 rounded-xl py-3 px-4 text-center cursor-pointer transition-all bg-[#121520] hover:bg-[#161a27] flex items-center justify-center gap-3 group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform shrink-0">
                      <ShoppingBag size={14} />
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-gray-200 block group-hover:text-purple-300 transition-colors">
                        رفع صورة الملابس المراد ارتداؤها
                      </span>
                      <span className="text-[10px] text-gray-500">أو اختر من الأنماط الجاهزة بالأسفل</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Preset Styles Grid */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 block text-right">
                  أو اختر ستايل وتصميم جاهز:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {PRESET_STYLES.map((style) => {
                    const isSelected = selectedPreset === style.id && !garmentImage;
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => {
                          setSelectedPreset(style.id);
                          setGarmentImage(null);
                        }}
                        className={`p-2.5 rounded-xl border text-right transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-purple-500/15 border-purple-500/50 shadow-sm'
                            : 'bg-[#121520] border-white/[0.08] hover:border-white/20'
                        }`}
                      >
                        <span className={`text-xs font-bold ${isSelected ? 'text-purple-300' : 'text-white'}`}>
                          {style.name}
                        </span>
                        <span className="text-[10px] text-gray-400 line-clamp-1 mt-1">{style.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Custom Style Prompt */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 block text-right">
                  وصف إضافي للملابس (اختياري):
                </label>
                <input
                  type="text"
                  value={customStylePrompt}
                  onChange={(e) => setCustomStylePrompt(e.target.value)}
                  placeholder="مثال: فستان سهرة حرير كحلي، قميص جينز أزرق فاتح..."
                  className="w-full p-2.5 rounded-xl bg-[#121520] border border-white/[0.08] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-all text-right"
                />
              </div>

            </div>

            {/* Bottom Generate Action */}
            <div className="pt-3 border-t border-white/[0.08] shrink-0 bg-[#0B0D14] z-20">
              <AIGenerateButton
                onClick={handleGenerate}
                isGenerating={isGenerating}
                disabled={!personImage}
                cost={creditsNeeded}
                label="تبديل الملابس"
                generatingLabel="جاري القياس والتوليد..."
                icon={Shirt}
                variant="purple"
              />
            </div>
          </aside>

          {/* ─── Left Column: Gallery Studio Grid (Slot 1 Loading & Results) ─── */}
          <main className="flex-1 overflow-y-auto no-scrollbar bg-[#06070B] p-4 lg:p-6 flex flex-col justify-start">
            
            {/* Gallery Header */}
            <div className="flex items-center justify-between mb-4 w-full">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide">النتائج والمعرض</h2>
                <span className="text-[11px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                  {history.length} {history.length === 1 ? 'نتيجة' : 'نتائج'}
                </span>
              </div>
            </div>

            {/* Gallery Grid starting at Slot 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 w-full">
              
              {/* 1. Ghost Loading Card in Slot 1 while generating */}
              {isGenerating && (
                <AIGenerationCard
                  aspectRatio="aspect-square"
                  icon={Shirt}
                  className="border-purple-500/30"
                />
              )}

              {/* 2. Results Cards */}
              {history.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedModalItem(item)}
                  className="group relative rounded-2xl overflow-hidden bg-[#0B0D14] border border-white/[0.08] hover:border-purple-500/50 transition-all duration-300 shadow-lg cursor-pointer aspect-square"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.styleName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Floating Style Badge */}
                  <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-bold text-purple-300 shadow-md">
                    {item.styleName}
                  </div>

                  {/* Hover Overlay & Direct Download */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex items-end justify-between">
                    <div className="text-right">
                      <span className="text-xs font-bold text-white block truncate max-w-[140px]">{item.styleName}</span>
                      <span className="text-[10px] text-gray-300 block">{item.time}</span>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadMediaDirectly(item.imageUrl, `clothes-swap-${Date.now()}.png`);
                      }}
                      className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-lg transition-transform active:scale-95"
                      title="تحميل مباشر دون فتح صفحة جديدة"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {/* 3. Clean Empty State if no history and not generating */}
              {history.length === 0 && !isGenerating && (
                <div className="col-span-full py-16 flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-dashed border-white/[0.08] bg-[#0B0D14]/50">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-purple-400 mb-3">
                    <Shirt size={26} />
                  </div>
                  <h3 className="text-sm font-bold text-white">لا توجد نتائج سابقة بعد</h3>
                </div>
              )}

            </div>

          </main>

        </div>
      </div>
    </>
  );
}
