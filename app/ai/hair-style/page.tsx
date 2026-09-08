"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { 
  Upload, 
  Download, 
  Scissors, 
  X,
  CheckCircle2,
  Check,
  Palette
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
  hairstyle: string;
  hairColor: string;
  time: string;
}

const FEMALE_STYLES = [
  { id: 'french_bob', name: 'بوب فرنسي', tag: 'كلاسيكي أنيق', image: '/images/hairstyles/f_french_bob.jpg' },
  { id: 'pixie_cut', name: 'بيكسي قصير', tag: 'عصري وجريء', image: '/images/hairstyles/f_pixie_cut.jpg' },
  { id: 'layered_blowout', name: 'طبقات مدرجة', tag: 'كثافة وانسياب', image: '/images/hairstyles/f_layered_blowout.jpg' },
  { id: 'curly_volume', name: 'كيرلي طبيعي', tag: 'تموجات حيوية', image: '/images/hairstyles/f_curly_volume.jpg' },
  { id: 'wavy_lob', name: 'لوب مموج', tag: 'متوسط الطول', image: '/images/hairstyles/f_wavy_lob.jpg' },
  { id: 'straight_bangs', name: 'ناعم مع قُصة', tag: 'إطلالة ناعمة', image: '/images/hairstyles/f_straight_bangs.jpg' },
];

const MALE_STYLES = [
  { id: 'taper_fade', name: 'تدرج فيد حاد', tag: 'تحديد دقيق', image: '/images/hairstyles/m_taper_fade.jpg' },
  { id: 'textured_quiff', name: 'كويف عصري', tag: 'حجم وانسياب', image: '/images/hairstyles/m_textured_quiff.jpg' },
  { id: 'sleek_pompadour', name: 'بومبادور فاخر', tag: 'كلاسيكي راقي', image: '/images/hairstyles/m_sleek_pompadour.jpg' },
  { id: 'buzz_cut', name: 'باز كت عسكري', tag: 'قصة قصيرة حادة', image: '/images/hairstyles/m_buzz_cut.jpg' },
  { id: 'curly_taper', name: 'كيرلي محدد', tag: 'شبابي جذاب', image: '/images/hairstyles/m_curly_taper.jpg' },
  { id: 'slicked_undercut', name: 'أندر كت مسحوب', tag: 'عصري جريء', image: '/images/hairstyles/m_slicked_undercut.jpg' },
];

const HAIR_COLORS = [
  { id: 'natural_black', name: 'أسود طبيعي', color: '#1a1a1a', border: '#404040' },
  { id: 'dark_brown', name: 'بني داكن', color: '#3d2314', border: '#5a3825' },
  { id: 'chestnut_brown', name: 'كستنائي شوكولاتة', color: '#5a3825', border: '#8b5a2b' },
  { id: 'honey_blonde', name: 'أشقر عسلي', color: '#c29b38', border: '#e6ca65' },
  { id: 'platinum_blonde', name: 'بلاتيني ثلجي', color: '#dcdcdc', border: '#ffffff' },
  { id: 'copper_red', name: 'نحاسي قرميدي', color: '#8a3324', border: '#b84c37' },
];

export default function HairstylePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4560', []);
  const getToken = useCallback(() => typeof window !== 'undefined' ? localStorage.getItem("a") : null, []);
  
  // State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [gender, setGender] = useState<'female' | 'male'>('female');
  const [selectedStyle, setSelectedStyle] = useState<string>('french_bob');
  const [selectedColor, setSelectedColor] = useState<string>('natural_black');
  
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  const [history, setHistory] = useState<GenerationResult[]>([]);
  const [selectedModalItem, setSelectedModalItem] = useState<GenerationResult | null>(null);
  const [balance, setBalance] = useState<any>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);

  const { operationPrice } = useAiPricing();
  const creditsNeeded = operationPrice('hairstyle', 10);
  const currentStyles = gender === 'female' ? FEMALE_STYLES : MALE_STYLES;

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
      const res = await fetch(`${apiBase}/api/ai/user-images?tool=hairstyle&limit=50`, {
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
            hairstyle: img.metadata?.hairstyle || 'تسريحة شعر',
            hairColor: img.metadata?.hair_color || img.metadata?.hairColor || 'طبيعي',
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
      await fetch(`${apiBase}/api/ai/user-images?tool=hair-style`, {
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
      toast.error("يرجى رفع صورة أولاً للبدء");
      return;
    }

    if (balance && balance.remaining_credits < creditsNeeded) {
      setShowUpgradeModal(true);
      return;
    }

    setIsGenerating(true);

    try {
      const activeStyleObj = currentStyles.find(s => s.id === selectedStyle) || currentStyles[0];
      const activeColorObj = HAIR_COLORS.find(c => c.id === selectedColor) || HAIR_COLORS[0];

      const response = await fetch(`${apiBase}/api/ai/hairstyle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": getToken() || '',
          "User-Client": (global as any)?.clientId1328 || ""
        },
        body: JSON.stringify({
          image: selectedImage,
          gender: gender,
          hairstyle: selectedStyle,
          hair_color: selectedColor,
          style: activeStyleObj.name,
          color: activeColorObj.name,
        }),
      });

      if (response.status === 401 || response.status === 403) {
        handleAuthError(response.status);
        return;
      }

      const data = await response.json();

      if (response.ok && data.image_url) {
        const newResult: GenerationResult = {
          imageUrl: data.image_url,
          hairstyle: activeStyleObj.name,
          hairColor: activeColorObj.name,
          time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        };
        // Add to history at slot 1 and open preview modal immediately
        setHistory(prev => [newResult, ...prev]);
        setSelectedModalItem(newResult);
        fetchBalance();
        toast.success("تم تطبيق تسريحة الشعر بنجاح!");
      } else {
        toast.error(data.message || "حدث خطأ أثناء معالجة تسريحة الشعر");
      }
    } catch (err: any) {
      toast.error("خطأ في الاتصال بالسيرفر");
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
        title="تسريحة وقصة الشعر بالذكاء الاصطناعي"
        subtitle="تم تعديل تسريحة الشعر واللون بجودة استوديو احترافية"
        details={[
          { label: "نوع القصة", value: selectedModalItem?.hairstyle || "" },
          { label: "لون الشعر", value: selectedModalItem?.hairColor || "" },
          { label: "الجنس", value: gender === "female" ? "تسريحة نسائية" : "قصة رجالية" },
          { label: "الرصيد المستخدم", value: `${creditsNeeded} رصيد` },
        ]}
        timestamp={selectedModalItem?.time}
        creditsUsed={creditsNeeded}
      />

      <div className="h-screen flex flex-col bg-[#06070B] text-white selection:bg-emerald-600/30 overflow-hidden font-sans" dir="rtl">
        
        {/* Unified AI Tool Header */}
        <AIToolHeader
          title="تسريحات وقصات الشعر"
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
                <h2 className="text-sm font-bold text-white tracking-wide">إعدادات قصة الشعر</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">تجربة قصات وتسريحات وألوان الشعر بدقة واقعية</p>
              </div>

              {/* 1. Compact Drag & Drop Upload Zone */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 block text-right">
                  الصورة الشخصية
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
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                          <CheckCircle2 size={10} />
                          جاهزة للمعالجة
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
                    className="border border-dashed border-white/[0.08] hover:border-emerald-500/40 rounded-xl py-3.5 px-4 text-center cursor-pointer transition-all bg-[#121520] hover:bg-[#161a27] flex items-center justify-center gap-3 group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                      <Upload size={14} />
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-gray-200 block group-hover:text-emerald-300 transition-colors">
                        رفع صورة الوجه
                      </span>
                      <span className="text-[10px] text-gray-500">
                        JPG, PNG حتى 10MB
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Slim Gender Switcher */}
              <div className="space-y-1.5">
                <div className="flex bg-[#121520] p-1 rounded-xl border border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => {
                      setGender('female');
                      setSelectedStyle(FEMALE_STYLES[0].id);
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      gender === 'female'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    تسريحات نسائية
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGender('male');
                      setSelectedStyle(MALE_STYLES[0].id);
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      gender === 'male'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    قصات رجالية
                  </button>
                </div>
              </div>

              {/* 3. Style Grid with Real Authentic Hair Visuals */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 block text-right">
                  اختر القصة أو التسريحة:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {currentStyles.map((style) => {
                    const isSelected = selectedStyle === style.id;
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setSelectedStyle(style.id)}
                        className={`p-1.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 relative overflow-hidden group ${
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-500/60 shadow-sm'
                            : 'bg-[#121520] border-white/[0.08] hover:border-white/20'
                        }`}
                      >
                        <div className="w-full aspect-square rounded-lg overflow-hidden bg-black/50 relative">
                          <img 
                            src={style.image} 
                            alt={style.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          />
                          {isSelected && (
                            <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shadow-md">
                              <Check size={10} className="text-white" strokeWidth={3} />
                            </div>
                          )}
                        </div>
                        <span className={`text-[11px] font-bold truncate w-full block mt-0.5 ${isSelected ? 'text-emerald-300' : 'text-gray-300'}`}>
                          {style.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Compact Hair Color Palette */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 block text-right flex items-center gap-1.5">
                  <Palette size={12} className="text-emerald-400" />
                  <span>لون الشعر:</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {HAIR_COLORS.map((col) => {
                    const isSelected = selectedColor === col.id;
                    return (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => setSelectedColor(col.id)}
                        className={`p-1.5 rounded-lg border text-right transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-500/50 text-white shadow-sm'
                            : 'bg-[#121520] border-white/[0.08] text-gray-400 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        <div
                          className="w-3.5 h-3.5 rounded-full border shrink-0"
                          style={{ backgroundColor: col.color, borderColor: col.border }}
                        />
                        <span className="text-[10px] font-bold truncate">{col.name}</span>
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
                label="إنشاء"
                generatingLabel="جاري الإنشاء..."
                icon={Scissors}
                variant="emerald"
              />
            </div>
          </aside>

          {/* ─── Left Column: Gallery Studio Grid (Slot 1 Loading & Results) ─── */}
          <main className="flex-1 overflow-y-auto no-scrollbar bg-[#06070B] p-4 lg:p-6 flex flex-col justify-start">
            
            {/* Gallery Header */}
            <div className="flex items-center justify-between mb-4 w-full">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide">النتائج والمعرض</h2>
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
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
                  icon={Scissors}
                />
              )}

              {/* 2. Results Cards */}
              {history.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedModalItem(item)}
                  className="group relative rounded-2xl overflow-hidden bg-[#0B0D14] border border-white/[0.08] hover:border-emerald-500/50 transition-all duration-300 shadow-lg cursor-pointer aspect-square"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.hairstyle}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Floating Style Badge */}
                  <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-bold text-emerald-300 shadow-md">
                    {item.hairstyle}
                  </div>

                  {/* Hover Overlay & Direct Download */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex items-end justify-between">
                    <div className="text-right">
                      <span className="text-xs font-bold text-white block">{item.hairstyle}</span>
                      <span className="text-[10px] text-gray-300 block">{item.hairColor} • {item.time}</span>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadMediaDirectly(item.imageUrl, `hairstyle-${Date.now()}.png`);
                      }}
                      className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-transform active:scale-95"
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
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-emerald-400 mb-3">
                    <Scissors size={26} />
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
