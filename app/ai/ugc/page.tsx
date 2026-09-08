"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { 
  Sparkles, 
  Download, 
  Video, 
  CheckCircle2, 
  X,
  Play,
  Film,
  Users,
  Smartphone
, Trash2 } from "lucide-react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { toast, Toaster } from "react-hot-toast";
import UpgradeModal from "@/components/Modals/UpgradeModal";
import { 
  AIToolHeader, 
  AIGenerateButton, 
  AIGenerationCard, 
  AIResultModal, 
  downloadMediaDirectly,
  AIDeleteModal
} from "@/components/ai";
import { handleAuthError } from "@/utils/auth";
import { useAiPricing } from '@/hooks/useAiPricing';

interface GenerationResult {
  id?: number;
  url: string;
  prompt: string;
  styleName: string;
  time: string;
}

const UGC_STYLES = [
  { id: 'authentic', name: 'عفوي وطبيعي (Authentic)', desc: 'تصوير كاميرا هاتف واقعي كأن مستخدم حقيقي يتحدث' },
  { id: 'trendy', name: 'تريند تيك توك (Trendy Viral)', desc: 'إيقاع سريع مع مؤثرات حركية مشجعة للتفاعل' },
  { id: 'casual', name: 'يوميات وفلوق (Casual Vlog)', desc: 'مراجعة وتجربة حية للمنتج بأسلوب فلوج' },
];

export default function UGCPage() {
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4560', []);
  const getToken = useCallback(() => typeof window !== 'undefined' ? localStorage.getItem("a") : null, []);
  
  // State
  const [prompt, setPrompt] = useState<string>('');
  const [style, setStyle] = useState<string>('authentic');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  const [history, setHistory] = useState<GenerationResult[]>([]);
  const [selectedModalItem, setSelectedModalItem] = useState<GenerationResult | null>(null);
  const [balance, setBalance] = useState<any>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'single' | 'all';
    id?: number | string | null;
  }>({ isOpen: false, type: 'single', id: null });
  const [isDeletingModal, setIsDeletingModal] = useState(false);

  const handleConfirmDelete = async () => {
    setIsDeletingModal(true);
    try {
      if (deleteModal.type === 'single' && deleteModal.id !== undefined && deleteModal.id !== null) {
        await handleDeleteSingle(deleteModal.id, true);
      } else if (deleteModal.type === 'all') {
        await handleDeleteAll();
      }
      setDeleteModal({ isOpen: false, type: 'single', id: null });
    } finally {
      setIsDeletingModal(false);
    }
  };

  const { operationPrice } = useAiPricing();
  const creditsNeeded = operationPrice('ugc', 13);

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
      const res = await fetch(`${apiBase}/api/ai/user-videos?tool=ugc&limit=50`, {
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
        if (data.success && Array.isArray(data.videos)) {
          const mapped: GenerationResult[] = data.videos.map((v: any) => ({
            id: v.id || v.video_id,
            url: v.video_url || v.cloudinary_url,
            prompt: v.prompt || 'فيديو إعلاني UGC',
            styleName: v.style || 'UGC Authentic',
            time: v.created_at ? new Date(v.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''
          }));
          setHistory(mapped);
        }
      }
    } catch (e) {}
  }, [apiBase, getToken]);

  const handleDeleteSingle = async (idOrIdx: number | string, isVideo = true) => {
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
      await fetch(`${apiBase}/api/ai/user-videos?tool=ugc`, {
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

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("يرجى كتابة سيناريو أو فكرة الفيديو");
      return;
    }

    if (balance && balance.remaining_credits < creditsNeeded) {
      setShowUpgradeModal(true);
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch(`${apiBase}/api/ai/ugc-create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": getToken() || '',
          "User-Client": (global as any)?.clientId1328 || ""
        },
        body: JSON.stringify({
          prompt: prompt,
          style: style
        })
      });

      if (response.status === 401 || response.status === 403) {
        handleAuthError(response.status);
        return;
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "فشلت عملية إنشاء فيديو UGC");
      }

      const activeStyleObj = UGC_STYLES.find(s => s.id === style) || UGC_STYLES[0];

      const newResult: GenerationResult = {
        id: data.video_id || data.id,
        url: data.video_url,
        prompt: prompt,
        styleName: activeStyleObj.name,
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };

      setHistory(prev => [newResult, ...prev]);
      setSelectedModalItem(newResult);
      toast.success("تم إنشاء فيديو UGC بنجاح!");
      fetchBalance();

    } catch (err: any) {
      console.error("UGC creation error:", err);
      toast.error(err.message || "حدث خطأ أثناء التوليد");
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
        mediaUrl={selectedModalItem?.url || null}
        mediaType="video"
        title="فيديوهات UGC الإعلانية (User-Generated Content)"
        subtitle={selectedModalItem?.prompt}
        prompt={selectedModalItem?.prompt}
        details={[
          { label: "الوصف والسيناريو", value: selectedModalItem?.prompt || "" },
          { label: "النمط الإعلاني", value: selectedModalItem?.styleName || "" },
          { label: "الرصيد المستخدم", value: `${creditsNeeded} رصيد` },
        ]}
        timestamp={selectedModalItem?.time}
        creditsUsed={creditsNeeded}
      />

      <div className="h-screen flex flex-col bg-[#06070B] text-white selection:bg-teal-500/30 overflow-hidden font-sans" dir="rtl">
        
        {/* Unified AI Tool Header */}
        <AIToolHeader
          title="صانع فيديوهات UGC التسويقية"
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
                <h2 className="text-sm font-bold text-white tracking-wide">إعدادات فيديو UGC</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">توليد مقاطع تيك توك وريلز واقعية تحاكي مراجعات وتجارب المستخدمين</p>
              </div>

              {/* 1. Prompt / Script Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 block text-right">
                  فكرة الإعلان أو سيناريو المقطع:
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="اكتب وصف المنتج وما الذي يجب أن يقوله أو يفعله الشخص في الفيديو..."
                  rows={4}
                  className="w-full p-3 rounded-xl bg-[#121520] border border-white/[0.08] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-teal-500/50 transition-all text-right resize-none custom-scrollbar"
                />
              </div>

              {/* 2. Style Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 block text-right">
                  نمط التصوير والإخراج:
                </label>
                <div className="space-y-1.5">
                  {UGC_STYLES.map((st) => {
                    const isSelected = style === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setStyle(st.id)}
                        className={`w-full p-2.5 rounded-xl border text-right transition-all flex items-start justify-between gap-2.5 ${
                          isSelected
                            ? 'bg-teal-500/15 border-teal-500/50 shadow-sm'
                            : 'bg-[#121520] border-white/[0.08] hover:border-white/20'
                        }`}
                      >
                        <div className="text-right">
                          <span className={`text-xs font-bold ${isSelected ? 'text-teal-300' : 'text-white'}`}>
                            {st.name}
                          </span>
                          <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{st.desc}</p>
                        </div>
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-teal-400 shrink-0 mt-1.5 animate-pulse" />
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
                disabled={!prompt.trim()}
                cost={creditsNeeded}
                label="إنشاء فيديو UGC"
                generatingLabel="جاري التوليد والإنتاج..."
                icon={Smartphone}
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
                <span className="text-[11px] font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
                  {history.length} {history.length === 1 ? 'نتيجة' : 'نتائج'}
                </span>
              </div>
              {history.length > 0 && (
                <button
                  onClick={() => setDeleteModal({ isOpen: true, type: 'all', id: null })}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-400 transition-colors px-2.5 py-1 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
                  title="مسح سجل UGC بالكامل"
                >
                  <Trash2 size={13} />
                  <span>مسح السجل</span>
                </button>
              )}
            </div>

            {/* Gallery Grid starting at Slot 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 w-full">
              
              {/* 1. Ghost Loading Card in Slot 1 while generating */}
              {isGenerating && (
                <AIGenerationCard
                  aspectRatio="aspect-[9/16]"
                  icon={Smartphone}
                  className="border-teal-500/30"
                />
              )}

              {/* 2. Results Cards */}
              {history.map((item, idx) => (
                <div
                  key={item.id || idx}
                  onClick={() => setSelectedModalItem(item)}
                  className="group relative rounded-2xl overflow-hidden bg-black border border-white/[0.08] hover:border-teal-500/50 transition-all duration-300 shadow-lg cursor-pointer aspect-[9/16] flex items-center justify-center"
                >
                  <video
                    src={item.url}
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                    onMouseEnter={(e) => e.currentTarget.play()}
                    onMouseLeave={(e) => e.currentTarget.pause()}
                  />

                  {/* Floating Setting Badge */}
                  <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-bold text-teal-300 shadow-md flex items-center gap-1">
                    <Film size={10} />
                    <span>{item.styleName}</span>
                  </div>

                  {/* Hover Overlay & Direct Download / Delete */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex items-end justify-between">
                    <div className="text-right">
                      <span className="text-xs font-bold text-white block line-clamp-1 max-w-[140px]">{item.prompt}</span>
                      <span className="text-[10px] text-gray-300 block">{item.time}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteModal({ isOpen: true, type: 'single', id: item.id || idx });
                        }}
                        className="p-2 rounded-xl bg-red-500/80 hover:bg-red-500 text-white shadow-lg transition-transform active:scale-95"
                        title="حذف الفيديو"
                      >
                        <Trash2 size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadMediaDirectly(item.url, `ugc-${Date.now()}.mp4`);
                        }}
                        className="p-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white shadow-lg transition-transform active:scale-95"
                        title="تحميل مباشر دون فتح صفحة جديدة"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* 3. Clean Empty State if no history and not generating */}
              {history.length === 0 && !isGenerating && (
                <div className="col-span-full py-16 flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-dashed border-white/[0.08] bg-[#0B0D14]/50">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-teal-400 mb-3">
                    <Smartphone size={26} />
                  </div>
                  <h3 className="text-sm font-bold text-white">لا توجد نتائج سابقة بعد</h3>
                </div>
              )}

            </div>

          </main>

        </div>
      </div>
      <AIDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmDelete}
        type={deleteModal.type}
        itemType="فيديو UGC"
        isDeleting={isDeletingModal}
      />
    </>
  );
}
