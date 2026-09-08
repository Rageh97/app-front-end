"use client";

import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import UpgradeModal from "@/components/Modals/UpgradeModal";
import Link from "next/link";
import { toast, Toaster } from 'react-hot-toast';
import { 
  Copy, Check, ArrowRight, Image as ImageIcon, RefreshCw, 
  Download, X, Sparkles, Wand2, Palette, Camera, 
  ChevronLeft, ChevronDown, ChevronRight, CreditCard, Crown, 
  Trash2, Maximize2, Upload, XCircle, Search,
  SlidersHorizontal, CheckCircle2, Layers, Cpu, Zap, Bot, Eye, ShieldCheck
} from 'lucide-react';
import { GPT_IMAGE_MODELS, AIModel, calculateImageCost } from '@/lib/ai-models-config';
import { processImagePrompt } from '@/lib/prompt-utils';
import { AIToolHeader, AIGenerateButton, AIResultModal, AIResultsGallery, downloadMediaDirectly, AIResultCardItem } from '@/components/ai';
import { useAiPricing } from '@/hooks/useAiPricing';

type CreditsRecord = {
  users_credits_id: number;
  user_id: number;
  plan_id: number;
  plan_name: string;
  total_credits: number;
  remaining_credits: number;
  plan?: { 
    image_profit: number;
  };
};

const ASPECT_RATIOS = [
  { id: '1:1', label: 'مربع 1:1', value: '1024x1024', desc: 'Instagram & Posts' },
  { id: '16:9', label: 'أفقي 16:9', value: '1792x1024', desc: 'YouTube & Banners' },
  { id: '9:16', label: 'طولي 9:16', value: '1024x1792', desc: 'Reels & TikTok' },
  { id: '4:3', label: 'كلاسيكي 4:3', value: '1024x768', desc: 'Photography' },
  { id: '3:4', label: 'بورتريه 3:4', value: '768x1024', desc: 'Studio Portrait' },
];

const GPT_STYLES = [
  { id: 'auto', label: 'تلقائي (GPT Smart)', icon: Wand2, desc: 'تحسين ذكي متوازن' },
  { id: 'photorealistic', label: 'واقعي فوتوغرافي 8K', icon: Camera, desc: 'تفاصيل بشرة وعدسات DSLR' },
  { id: '3d-render', label: 'تصميم ثلاثي الأبعاد 3D', icon: Layers, desc: 'Render Octane & Pixar' },
  { id: 'cyberpunk', label: 'سايبربانك ونيون', icon: Zap, desc: 'أضواء نيون ومستقبلية' },
  { id: 'anime', label: 'أنمي ياباني احترافي', icon: Palette, desc: 'رسم استوديو Ghibli' },
  { id: 'cinematic', label: 'سينمائي درامي', icon: Eye, desc: 'إضاءة سينمائية عميقة' },
  { id: 'minimalist', label: 'فيكتور مينيمل', icon: Sparkles, desc: 'تصميم مسطح ونظيف' },
];

const PROMPT_SUGGESTIONS = [
  "رائد فضاء عربي يستكشف واحة فضائية مستقبلية على كوكب المريخ بأسلوب سينمائي واقعي 8K",
  "صقر ذهبي مهيب بأجنحة ليزرية يحلق فوق ناطحات سحاب دبي في عام 2090 بإضاءة نيون",
  "فنجان قهوة عربية تقليدية مصنوع من الكريستال يطفو في الفضاء مع بخار من النجوم المتوهجة",
  "مكتبة قديمة ساحرة في بغداد بأعمدة رخامية وأشعة شمس ذهبية تخترق النوافذ الملونة",
];

export default function GPTImagePage() {
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<AIModel>(GPT_IMAGE_MODELS[0]);
  const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS[0]);
  const [selectedStyle, setSelectedStyle] = useState(GPT_STYLES[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [history, setHistory] = useState<AIResultCardItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<AIResultCardItem | null>(null);
  
  // Credits & Modals
  const [userCredits, setUserCredits] = useState<CreditsRecord | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const { modelPrice } = useAiPricing();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const getToken = useCallback(() => {
    return typeof window !== "undefined"
      ? (localStorage.getItem("a") || localStorage.getItem("token"))
      : null;
  }, []);

  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL || "http://localhost:4560", []);

  // Load history from backend and sync with localStorage
  const fetchUserImages = useCallback(async () => {
    try {
      const token = getToken();
      if (token) {
        const res = await fetch(`${apiBase}/api/ai/user-images?limit=30&tool=text-to-image`, {
          headers: {
            Authorization: token,
            "User-Client": (global as any)?.clientId1328 || ""
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.images)) {
            const mapped: AIResultCardItem[] = data.images.map((img: any) => ({
              id: img.image_id || img.id,
              url: img.image_url || img.cloudinary_url,
              prompt: img.prompt,
              date: img.created_at ? new Date(img.created_at).toLocaleDateString('ar-EG') : new Date().toLocaleDateString('ar-EG'),
              is_public: img.is_public,
              type: 'image'
            }));
            if (mapped.length > 0) {
              setHistory(mapped);
              return;
            }
          }
        }
      }
      // Fallback to localStorage
      const saved = localStorage.getItem("nexus_gpt_image_history");
      if (saved) {
        const parsed = JSON.parse(saved);
        setHistory(parsed.map((item: any) => ({
          id: item.id || item.url,
          url: item.url,
          prompt: item.prompt,
          date: item.date || new Date().toLocaleDateString('ar-EG'),
          is_public: item.is_public || false,
          type: 'image'
        })));
      }
    } catch (e) {
      const saved = localStorage.getItem("nexus_gpt_image_history");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setHistory(parsed);
        } catch (_) {}
      }
    }
  }, [apiBase, getToken]);

  // Fetch Credits & Pricing
  const fetchCredits = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch(`${apiBase}/api/credits/me/balance`, {
        headers: {
          Authorization: token,
          "User-Client": (global as any)?.clientId1328 || ""
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUserCredits(data || null);
      }
    } catch (e) {}
  }, [apiBase, getToken]);

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
          fetchCredits();
          fetchUserImages();
        }
      } catch (e) {}
    };
    init();
    return () => { cancelled = true; };
  }, [fetchCredits, fetchUserImages]);

  // Timer for generation
  useEffect(() => {
    if (isGenerating) {
      setTimerSeconds(0);
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isGenerating]);

  // Cost calculation
  const calculatedCost = useMemo(() => {
    return calculateImageCost(
      { ...selectedModel, baseCostCredits: modelPrice(selectedModel.id, selectedModel.baseCostCredits) },
      selectedRatio.value,
      userCredits?.plan?.image_profit || 0
    );
  }, [modelPrice, selectedModel, selectedRatio, userCredits]);

  // Delete single result
  const handleDeleteSingle = async (id: number | string) => {
    try {
      const token = getToken();
      if (token && typeof id === 'number') {
        await fetch(`${apiBase}/api/ai/user-images/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: token,
            "User-Client": (global as any)?.clientId1328 || ""
          }
        });
      }
      setHistory(prev => {
        const updated = prev.filter(item => item.id !== id);
        try {
          localStorage.setItem("nexus_gpt_image_history", JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
      if (selectedImage?.id === id) setSelectedImage(null);
      toast.success("تم حذف النتيجة بنجاح");
    } catch (e) {
      toast.error("فشل حذف النتيجة");
    }
  };

  // Delete all previous results
  const handleDeleteAll = async () => {
    try {
      const token = getToken();
      if (token) {
        await fetch(`${apiBase}/api/ai/user-images?tool=text-to-image`, {
          method: "DELETE",
          headers: {
            Authorization: token,
            "User-Client": (global as any)?.clientId1328 || ""
          }
        });
      }
      setHistory([]);
      setSelectedImage(null);
      try {
        localStorage.removeItem("nexus_gpt_image_history");
      } catch (e) {}
      toast.success("تم حذف جميع النتائج السابقة بنجاح");
    } catch (e) {
      toast.error("فشل حذف النتائج");
    }
  };

  // Generate Image
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("يرجى كتابة وصف للصورة أولاً");
      return;
    }

    if (userCredits && userCredits.remaining_credits < calculatedCost) {
      setIsUpgradeModalOpen(true);
      return;
    }

    setIsGenerating(true);

    try {
      const token = getToken();
      let finalStyleParam = selectedStyle.id !== 'auto' ? selectedStyle.label : '';
      const processedPrompt = processImagePrompt(prompt, selectedStyle.id);

      const response = await fetch(`${apiBase}/api/ai/text-to-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token || "",
          "User-Client": (global as any)?.clientId1328 || ""
        },
        body: JSON.stringify({
          prompt: processedPrompt,
          style: finalStyleParam,
          size: selectedRatio.value,
          model: selectedModel.id,
          is_public: false
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.message === "رصيدك غير كافٍ" || response.status === 402) {
          setIsUpgradeModalOpen(true);
          return;
        }
        throw new Error(data.message || "فشل توليد الصورة");
      }

      const imageUrl = data.image_url || data.cloudinary_url;
      toast.success("تم توليد الصورة بنجاح عبر GPT! ✨");

      // Save to history
      const newHistoryItem: AIResultCardItem = {
        id: data.image_id || Date.now(),
        url: imageUrl,
        prompt: prompt.trim(),
        date: new Date().toLocaleDateString('ar-EG'),
        is_public: false,
        type: 'image'
      };
      const updatedHistory = [newHistoryItem, ...history.filter(h => h.url !== imageUrl)];
      setHistory(updatedHistory);
      try {
        localStorage.setItem("nexus_gpt_image_history", JSON.stringify(updatedHistory));
      } catch (e) {}

      // Refresh credits
      fetchCredits();

    } catch (err: any) {
      console.error("[GPT_IMAGE] Error:", err);
      toast.error(err.message || "حدث خطأ أثناء التوليد، يرجى المحاولة مرة أخرى");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    toast.success("تم نسخ النص");
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="flex flex-col h-screen bg-[#06070B] text-white overflow-hidden selection:bg-emerald-500/30 selection:text-emerald-200" dir="rtl">
      <Toaster position="top-center" reverseOrder={false} />

      {/* Unified AI Tool Header */}
      <AIToolHeader
        title="توليد الصور بـ GPT"
        description="الاستدلال البصري المتقدم وفهم النصوص الدقيقة عبر GPT Image 2"
        badge="👑 GPT Image 2"
        icon={Bot}
        iconGradient="from-emerald-500 via-teal-500 to-cyan-500"
        userCredits={userCredits?.remaining_credits}
        onUpgradeClick={() => setIsUpgradeModalOpen(true)}
        backHref="/ai"
      />

      {/* Main Studio Body: Sidebar Controls + Results Canvas */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* ─── Sidebar Controls (380px) ─── */}
        <aside className="w-full lg:w-[380px] h-[calc(100vh-3.5rem)] border-b lg:border-b-0 lg:border-l border-white/[0.08] bg-[#0B0D14] p-5 overflow-hidden flex flex-col justify-between shrink-0 z-30 space-y-4 shadow-2xl relative">
          
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-0.5 pb-2">
            
            {/* Prompt Input Card */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-emerald-400" />
                  <span>أمر التوليد (Prompt)</span>
                </label>
                {prompt && (
                  <button
                    onClick={() => setPrompt("")}
                    className="text-[10px] text-gray-400 hover:text-red-400 transition-colors"
                  >
                    مسح
                  </button>
                )}
              </div>

              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="اكتب وصفاً مفصلاً للصورة التي تريد من GPT توليدها... (يدعم العربية والإنجليزية)"
                  rows={4}
                  className="w-full p-3.5 rounded-xl bg-[#121520] border border-white/[0.08] text-white placeholder-gray-500 text-xs focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all resize-none leading-relaxed"
                />
                {prompt && (
                  <button
                    onClick={handleCopyPrompt}
                    className="absolute bottom-2.5 left-2.5 p-1 rounded-md bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all text-xs flex items-center gap-1"
                    title="نسخ الأمر"
                  >
                    {copiedPrompt ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  </button>
                )}
              </div>
              

              {/* Prompt Inspiration Chips */}
              {/* <div className="space-y-1">
                <span className="text-[10px] text-gray-500 font-medium">أفكار مقترحة:</span>
                <div className="flex flex-wrap gap-1.5">
                  {PROMPT_SUGGESTIONS.slice(0, 2).map((sugg, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPrompt(sugg)}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-emerald-500/10 border border-white/[0.06] hover:border-emerald-500/30 text-gray-300 hover:text-emerald-300 transition-all text-right line-clamp-1 max-w-full"
                    >
                      {sugg}
                    </button>
                  ))}
                </div>
              </div> */}
            </div>

            {/* Model Info Card */}
            {/* <div className="p-3.5 rounded-xl bg-[#121520] border border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <Bot size={15} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">OpenAI GPT Image 2</span>
                    <span className="text-[10px] text-gray-500 font-mono">(gpt-image-2)</span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                  نشط 👑
                </span>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                استدلال بصري فائق الدقة مع دعم استثنائي للخط العربي وفهم التفاصيل المعقدة.
              </p>
              <div className="text-[10px] text-emerald-400/90 font-medium flex items-center gap-1 pt-0.5">
                <ShieldCheck size={12} />
                <span>حماية تلقائية مع محرك النسخ الاحتياطي (Fallback)</span>
              </div>
            </div> */}

            {/* Aspect Ratio Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                <SlidersHorizontal size={13} className="text-emerald-400" />
                <span>أبعاد ومقاس الصورة</span>
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {ASPECT_RATIOS.map((ratio) => {
                  const isSelected = selectedRatio.id === ratio.id;
                  return (
                    <button
                      key={ratio.id}
                      onClick={() => setSelectedRatio(ratio)}
                      className={`py-2 px-1 rounded-lg border flex flex-col items-center gap-0.5 transition-all ${
                        isSelected 
                          ? "bg-emerald-500/15 border-emerald-500/50 text-white font-bold" 
                          : "bg-[#121520] border-white/[0.08] text-gray-400 hover:text-gray-200 hover:border-white/20"
                      }`}
                    >
                      <span className="text-[11px] font-bold font-mono">{ratio.id}</span>
                      <span className="text-[9px] text-gray-500 truncate">{ratio.label.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Style Presets */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                <Palette size={13} className="text-emerald-400" />
                <span>نمط الإخراج الفني</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {GPT_STYLES.map((style) => {
                  const isSelected = selectedStyle.id === style.id;
                  const Icon = style.icon;
                  return (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style)}
                      className={`p-2 rounded-lg border flex items-center gap-2 text-right transition-all ${
                        isSelected 
                          ? "bg-emerald-500/15 border-emerald-500/50 text-white font-bold" 
                          : "bg-[#121520] border-white/[0.08] text-gray-400 hover:text-gray-200 hover:border-white/20"
                      }`}
                    >
                      <Icon size={14} className={isSelected ? "text-emerald-400" : "text-gray-500"} />
                      <div className="truncate">
                        <div className="text-[11px] font-bold truncate">{style.label.split(' ')[0]}</div>
                        <div className="text-[9px] text-gray-500 truncate">{style.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Sticky Bottom Generate Action */}
          <div className="pt-3 border-t border-white/[0.08] shrink-0 bg-[#0B0D14] z-20">
            <AIGenerateButton
              onClick={handleGenerate}
              isGenerating={isGenerating}
              disabled={!prompt.trim()}
              cost={calculatedCost}
              label="إنشاء"
              generatingLabel="جاري التوليد عبر GPT..."
              timerSeconds={timerSeconds}
              icon={Bot}
              variant="emerald"
            />
          </div>
        </aside>

        {/* ─── Main Gallery & Results ─── */}
        <main className="flex-1 overflow-y-auto bg-[#06070B] p-6 custom-scrollbar">
          <AIResultsGallery
            items={history}
            isGenerating={isGenerating}
            progress={timerSeconds ? Math.min(timerSeconds * 10, 95) : 0}
            generationIcon={Bot}
            onItemClick={(item) => setSelectedImage(item)}
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
        mediaType="image"
        mediaId={selectedImage?.id}
        isPublic={selectedImage?.is_public}
        title="صورة مولدة بـ GPT"
        subtitle="OpenAI GPT Image 2"
        prompt={selectedImage?.prompt}
        details={[
          { label: "الوصف", value: selectedImage?.prompt || "توليد صورة عبر GPT" },
          { label: "النموذج", value: "OpenAI GPT Image 2" },
          { label: "التاريخ", value: selectedImage?.date || "" }
        ]}
        onDelete={() => selectedImage && handleDeleteSingle(selectedImage.id)}
      />

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </div>
  );
}
