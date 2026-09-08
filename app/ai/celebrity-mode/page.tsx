"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { 
  Sparkles, 
  Upload, 
  Download, 
  Film, 
  Image as ImageIcon,
  Crown, 
  X,
  Play,
  CheckCircle2,
  Check,
  Star
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
  imageUrl?: string;
  videoUrl?: string;
  setting: string;
  mode: 'image' | 'video';
  time: string;
}

const SETTING_OPTIONS = [
  { id: 'vip_airport', label: "وصول المطار VIP", desc: "خروج من صالة كبار الشخصيات محاطاً بالحراس والكاميرات", isPopular: true },
  { id: 'red_carpet', label: "السجادة الحمراء Red Carpet", desc: "أضواء المهرجانات وفلاشات المصورين على السجادة الحمراء" },
  { id: 'press_conference', label: "المؤتمر الصحفي العالمي", desc: "منصة المتحدثين وسط عشرات الميكروفونات وعدسات الإعلام" },
];

export default function CelebrityModePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4560', []);
  const getToken = useCallback(() => typeof window !== 'undefined' ? localStorage.getItem("a") : null, []);
  
  // State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [setting, setSetting] = useState<string>('vip_airport');
  const [mode, setMode] = useState<'image' | 'video'>('video');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  const [history, setHistory] = useState<GenerationResult[]>([]);
  const [selectedModalItem, setSelectedModalItem] = useState<GenerationResult | null>(null);
  const [balance, setBalance] = useState<any>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);

  const { operationPrice } = useAiPricing();
  const creditsNeeded = operationPrice('celebrity-mode', mode === 'video' ? 400 : 20, mode);

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
      const res = await fetch(`${apiBase}/api/ai/user-images?tool=celebrity-mode&limit=50`, {
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
          const mapped: GenerationResult[] = data.images.map((img: any) => {
            const url = img.image_url || img.cloudinary_url;
            const isVid = url && (url.endsWith('.mp4') || url.includes('/video/'));
            return {
              imageUrl: !isVid ? url : undefined,
              videoUrl: isVid ? url : undefined,
              setting: img.metadata?.setting || 'مشهد مشاهير VIP',
              mode: isVid ? 'video' : 'image',
              time: img.created_at ? new Date(img.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''
            };
          });
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
      await fetch(`${apiBase}/api/ai/user-images?tool=celebrity-mode`, {
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error("يرجى اختيار ملف صورة صالح (JPG أو PNG)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن لا يتجاوز 10 ميجابايت");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
      toast.success("تم رفع صورتك بنجاح!");
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!selectedImage) {
      toast.error("يرجى رفع صورتك أولاً");
      return;
    }

    if (balance && balance.remaining_credits < creditsNeeded) {
      setShowUpgradeModal(true);
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch(`${apiBase}/api/ai/celebrity-mode`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": getToken() || '',
          "User-Client": (global as any)?.clientId1328 || ""
        },
        body: JSON.stringify({
          image: selectedImage,
          setting: setting,
          mode: mode
        })
      });

      if (response.status === 401 || response.status === 403) {
        handleAuthError(response.status);
        return;
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "فشلت عملية إنتاج مشهد المشاهير");
      }

      const activeSettingObj = SETTING_OPTIONS.find(s => s.id === setting) || SETTING_OPTIONS[0];

      const newResult: GenerationResult = {
        imageUrl: data.image_url,
        videoUrl: data.video_url,
        setting: activeSettingObj.label,
        mode: mode,
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };

      setHistory(prev => [newResult, ...prev]);
      setSelectedModalItem(newResult);
      toast.success("تم إنتاج مشهد الـ VIP بنجاح!");
      fetchBalance();

    } catch (err: any) {
      console.error("Celebrity mode error:", err);
      toast.error(err.message || "حدث خطأ أثناء المعالجة، يرجى المحاولة ثانية");
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
        mediaUrl={selectedModalItem?.videoUrl || selectedModalItem?.imageUrl || null}
        mediaType={selectedModalItem?.mode || "video"}
        title="مشهد المشاهير وVIP بالذكاء الاصطناعي"
        subtitle={selectedModalItem?.setting}
        details={[
          { label: "المشهد", value: selectedModalItem?.setting || "" },
          { label: "نوع الإخراج", value: selectedModalItem?.mode === "video" ? "فيديو سينمائي" : "صورة فوتوغرافية" },
          { label: "الرصيد المستخدم", value: `${creditsNeeded} رصيد` },
        ]}
        timestamp={selectedModalItem?.time}
        creditsUsed={creditsNeeded}
      />

      <div className="h-screen flex flex-col bg-[#06070B] text-white selection:bg-amber-500/30 overflow-hidden font-sans" dir="rtl">
        
        {/* Unified AI Tool Header */}
        <AIToolHeader
          title="وضع المشاهير (Celebrity VIP Mode)"
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
                <h2 className="text-sm font-bold text-white tracking-wide">إعدادات مشهد المشاهير</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">حوّل صورتك إلى وصول سينمائي فاخر مع فلاشات الكاميرات</p>
              </div>

              {/* 1. Compact Photo Upload Zone */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 block text-right">
                  صورتك الشخصية
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {selectedImage ? (
                  <div className="p-2.5 rounded-xl bg-[#121520] border border-white/[0.08] flex items-center justify-between gap-2.5 shadow-sm">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/20 bg-black shrink-0">
                        <img src={selectedImage} alt="الصورة المرفوعة" className="w-full h-full object-cover" />
                      </div>
                      <div className="text-right truncate">
                        <span className="text-xs font-bold text-white block truncate">تم تحديد الصورة</span>
                        <span className="text-[10px] text-amber-400 flex items-center gap-1 font-medium">
                          <CheckCircle2 size={10} />
                          جاهزة للإنتاج
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedImage(null)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-900/50 text-gray-400 hover:text-rose-300 border border-white/10 transition-all shrink-0"
                      title="إزالة الصورة"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-white/[0.08] hover:border-amber-500/40 rounded-xl py-3.5 px-4 text-center cursor-pointer transition-all bg-[#121520] hover:bg-[#161a27] flex items-center justify-center gap-3 group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shrink-0">
                      <Upload size={14} />
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-gray-200 block group-hover:text-amber-300 transition-colors">
                        رفع صورة شخصية
                      </span>
                      <span className="text-[10px] text-gray-500">
                        JPG, PNG حتى 10MB
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Output Mode Switcher */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 block text-right">
                  نوع المخرج المطلوب:
                </label>
                <div className="flex bg-[#121520] p-1 rounded-xl border border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setMode('video')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      mode === 'video'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Film size={13} />
                    <span>فيديو سينمائي</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('image')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      mode === 'image'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <ImageIcon size={13} />
                    <span>صورة فوتوغرافية</span>
                  </button>
                </div>
              </div>

              {/* 3. Setting Selection */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 block text-right">
                  اختر أجواء المشهد:
                </label>
                <div className="space-y-1.5">
                  {SETTING_OPTIONS.map((opt) => {
                    const isSelected = setting === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSetting(opt.id)}
                        className={`w-full p-2.5 rounded-xl border text-right transition-all flex items-start justify-between gap-2.5 relative ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500/50 shadow-sm'
                            : 'bg-[#121520] border-white/[0.08] hover:border-white/20'
                        }`}
                      >
                        <div className="text-right">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-bold ${isSelected ? 'text-amber-300' : 'text-white'}`}>
                              {opt.label}
                            </span>
                            {opt.isPopular && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold flex items-center gap-0.5">
                                <Star size={8} /> الأكثر طلباً
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{opt.desc}</p>
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                            <Check size={10} className="text-black" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Bottom Generate Action */}
            <div className="pt-3 border-t border-white/[0.08] shrink-0 bg-[#0B0D14] z-20">
              <AIGenerateButton
                onClick={handleGenerate}
                isGenerating={isGenerating}
                disabled={!selectedImage}
                cost={creditsNeeded}
                label={mode === 'video' ? "إنشاء الفيديو" : "إنشاء الصورة"}
                generatingLabel="جاري الإنتاج..."
                icon={Crown}
                variant="amber"
              />
            </div>
          </aside>

          {/* ─── Left Column: Gallery Studio Grid (Slot 1 Loading & Results) ─── */}
          <main className="flex-1 overflow-y-auto no-scrollbar bg-[#06070B] p-4 lg:p-6 flex flex-col justify-start">
            
            {/* Gallery Header */}
            <div className="flex items-center justify-between mb-4 w-full">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide">النتائج والمعرض</h2>
                <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
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
                  icon={Crown}
                  className="border-amber-500/30"
                />
              )}

              {/* 2. Results Cards */}
              {history.map((item, idx) => {
                const mediaSrc = item.videoUrl || item.imageUrl || "";
                const isItemVideo = item.mode === "video";
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedModalItem(item)}
                    className="group relative rounded-2xl overflow-hidden bg-[#0B0D14] border border-white/[0.08] hover:border-amber-500/50 transition-all duration-300 shadow-lg cursor-pointer aspect-square"
                  >
                    {isItemVideo ? (
                      <video
                        src={mediaSrc}
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onMouseEnter={(e) => e.currentTarget.play()}
                        onMouseLeave={(e) => e.currentTarget.pause()}
                      />
                    ) : (
                      <img
                        src={mediaSrc}
                        alt={item.setting}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}

                    {/* Floating Setting Badge */}
                    <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-bold text-amber-300 shadow-md flex items-center gap-1">
                      {isItemVideo ? <Film size={10} /> : <ImageIcon size={10} />}
                      <span>{item.setting}</span>
                    </div>

                    {/* Hover Overlay & Direct Download */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex items-end justify-between">
                      <div className="text-right">
                        <span className="text-xs font-bold text-white block">{item.setting}</span>
                        <span className="text-[10px] text-gray-300 block">{item.mode === 'video' ? 'فيديو سينمائي' : 'صورة'} • {item.time}</span>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadMediaDirectly(mediaSrc, `celebrity-${Date.now()}.${isItemVideo ? 'mp4' : 'png'}`);
                        }}
                        className="p-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white shadow-lg transition-transform active:scale-95"
                        title="تحميل مباشر دون فتح صفحة جديدة"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSingle((item as any).id || item.time, (item as any).mode === 'video');
                        }}
                        className="p-2 rounded-xl bg-black/60 hover:bg-rose-600 text-white shadow-lg transition-transform active:scale-95"
                        title="حذف هذه النتيجة"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* 3. Clean Empty State if no history and not generating */}
              {history.length === 0 && !isGenerating && (
                <div className="col-span-full py-16 flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-dashed border-white/[0.08] bg-[#0B0D14]/50">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-amber-400 mb-3">
                    <Crown size={26} />
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
