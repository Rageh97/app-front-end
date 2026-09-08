"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { 
  Sparkles, 
  Upload, 
  Download, 
  Mic, 
  Video, 
  CheckCircle2, 
  X,
  Play,
  Film,
  Music
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
  id?: number | string;
  video_url: string;
  videoName: string;
  audioName: string;
  time: string;
}

export default function LipSyncPage() {
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4560', []);
  const getToken = useCallback(() => typeof window !== 'undefined' ? localStorage.getItem("a") : null, []);
  
  // State
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<string | null>(null);
  const [videoName, setVideoName] = useState<string>('');
  const [audioName, setAudioName] = useState<string>('');
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
  const creditsNeeded = operationPrice('lipsync', 18);

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
      const res = await fetch(`${apiBase}/api/ai/user-videos?tool=lip_sync&limit=50`, {
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
            video_url: v.video_url || v.cloudinary_url,
            videoName: v.metadata?.videoName || 'فيديو الوجه',
            audioName: v.metadata?.audioName || 'التسجيل الصوتي',
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
      await fetch(`${apiBase}/api/ai/user-videos?tool=lip_sync`, {
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

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      toast.error("يرجى اختيار ملف فيديو صالح");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedVideo(event.target?.result as string);
      setVideoName(file.name);
      toast.success("تم رفع الفيديو بنجاح");
    };
    reader.readAsDataURL(file);
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('audio/')) {
      toast.error("يرجى اختيار ملف صوتي صالح (MP3, WAV)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedAudio(event.target?.result as string);
      setAudioName(file.name);
      toast.success("تم رفع الصوت بنجاح");
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!selectedVideo || !selectedAudio) {
      toast.error("يرجى رفع ملف الفيديو والملف الصوتي معاً");
      return;
    }

    if (balance && balance.remaining_credits < creditsNeeded) {
      setShowUpgradeModal(true);
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch(`${apiBase}/api/ai/lip-sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": getToken() || '',
          "User-Client": (global as any)?.clientId1328 || ""
        },
        body: JSON.stringify({
          video: selectedVideo,
          audio: selectedAudio
        })
      });

      if (response.status === 401 || response.status === 403) {
        handleAuthError(response.status);
        return;
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "فشلت عملية مزامنة الشفاه");
      }

      const newResult: GenerationResult = {
        id: data.video_id || data.id,
        video_url: data.video_url,
        videoName: videoName || 'فيديو الوجه',
        audioName: audioName || 'الصوت المتزامن',
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };

      setHistory(prev => [newResult, ...prev]);
      setSelectedModalItem(newResult);
      toast.success("تمت مزامنة حركة الشفاه والصوت بنجاح!");
      fetchBalance();

    } catch (err: any) {
      console.error("LipSync error:", err);
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
        mediaUrl={selectedModalItem?.video_url || null}
        mediaType="video"
        title="مزامنة حركة الشفاه مع الصوت (LipSync AI)"
        subtitle="فيديو متزامن بدقة عالية مع نبرة الصوت المرفوعة"
        details={[
          { label: "الملف الصوتي", value: selectedModalItem?.audioName || "صوت متزامن" },
          { label: "الرصيد المستخدم", value: `${creditsNeeded} رصيد` },
        ]}
        timestamp={selectedModalItem?.time}
        creditsUsed={creditsNeeded}
      />

      <div className="h-screen flex flex-col bg-[#06070B] text-white selection:bg-cyan-500/30 overflow-hidden font-sans" dir="rtl">
        
        {/* Unified AI Tool Header */}
        <AIToolHeader
          title="مزامنة حركة الشفاه مع الصوت (LipSync)"
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
                <h2 className="text-sm font-bold text-white tracking-wide">إعدادات مزامنة الشفاه</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">مطابقة نطق وحركة فم الشخصية مع أي تسجيل صوتي بدقة ملي ثانية</p>
              </div>

              {/* 1. Upload Video */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 block text-right flex items-center gap-1.5">
                  <Video size={12} className="text-cyan-400" />
                  <span>1. فيديو الشخصية (يظهر فيها الوجه بوضوح):</span>
                </label>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={handleVideoUpload}
                  className="hidden"
                />

                {selectedVideo ? (
                  <div className="p-2.5 rounded-xl bg-[#121520] border border-white/[0.08] flex items-center justify-between gap-2.5 shadow-sm">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/20 bg-black shrink-0 flex items-center justify-center text-cyan-400">
                        <Film size={18} />
                      </div>
                      <div className="text-right truncate">
                        <span className="text-xs font-bold text-white block truncate">{videoName || 'تم تحديد الفيديو'}</span>
                        <span className="text-[10px] text-cyan-400 flex items-center gap-1 font-medium">
                          <CheckCircle2 size={10} /> جاهز للمزامنة
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedVideo(null);
                        setVideoName('');
                      }}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-900/50 text-gray-400 hover:text-rose-300 border border-white/10 transition-all shrink-0"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => videoInputRef.current?.click()}
                    className="border border-dashed border-white/[0.08] hover:border-cyan-500/40 rounded-xl py-3 px-4 text-center cursor-pointer transition-all bg-[#121520] hover:bg-[#161a27] flex items-center justify-center gap-3 group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform shrink-0">
                      <Upload size={14} />
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-gray-200 block group-hover:text-cyan-300 transition-colors">
                        رفع فيديو الوجه
                      </span>
                      <span className="text-[10px] text-gray-500">MP4 حتى 50MB</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Upload Audio */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 block text-right flex items-center gap-1.5">
                  <Mic size={12} className="text-cyan-400" />
                  <span>2. الملف الصوتي أو التعليق المراد نطقه:</span>
                </label>
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/mp3,audio/wav,audio/m4a"
                  onChange={handleAudioUpload}
                  className="hidden"
                />

                {selectedAudio ? (
                  <div className="p-2.5 rounded-xl bg-[#121520] border border-white/[0.08] flex items-center justify-between gap-2.5 shadow-sm">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/20 bg-black shrink-0 flex items-center justify-center text-cyan-400">
                        <Music size={18} />
                      </div>
                      <div className="text-right truncate">
                        <span className="text-xs font-bold text-white block truncate">{audioName || 'تم تحديد الصوت'}</span>
                        <span className="text-[10px] text-cyan-400 flex items-center gap-1 font-medium">
                          <CheckCircle2 size={10} /> جاهز للدمج
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedAudio(null);
                        setAudioName('');
                      }}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-900/50 text-gray-400 hover:text-rose-300 border border-white/10 transition-all shrink-0"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => audioInputRef.current?.click()}
                    className="border border-dashed border-white/[0.08] hover:border-cyan-500/40 rounded-xl py-3 px-4 text-center cursor-pointer transition-all bg-[#121520] hover:bg-[#161a27] flex items-center justify-center gap-3 group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform shrink-0">
                      <Upload size={14} />
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-gray-200 block group-hover:text-cyan-300 transition-colors">
                        رفع التسجيل الصوتي
                      </span>
                      <span className="text-[10px] text-gray-500">MP3, WAV حتى 25MB</span>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Bottom Generate Action */}
            <div className="pt-3 border-t border-white/[0.08] shrink-0 bg-[#0B0D14] z-20">
              <AIGenerateButton
                onClick={handleGenerate}
                isGenerating={isGenerating}
                disabled={!selectedVideo || !selectedAudio}
                cost={creditsNeeded}
                label="مزامنة الشفاه والصوت"
                generatingLabel="جاري مطابقة الصوت وحركة الفم..."
                icon={Mic}
                variant="cyan"
              />
            </div>
          </aside>

          {/* ─── Left Column: Gallery Studio Grid (Slot 1 Loading & Results) ─── */}
          <main className="flex-1 overflow-y-auto no-scrollbar bg-[#06070B] p-4 lg:p-6 flex flex-col justify-start">
            
            {/* Gallery Header */}
            <div className="flex items-center justify-between mb-4 w-full">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide">النتائج والمعرض</h2>
                <span className="text-[11px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                  {history.length} {history.length === 1 ? 'نتيجة' : 'نتائج'}
                </span>
              </div>
              {history.length > 0 && (
                <button
                  onClick={() => setDeleteModal({ isOpen: true, type: 'all', id: null })}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-400 transition-colors px-2.5 py-1 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
                  title="مسح سجل مزامنة الشفاه بالكامل"
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
                  aspectRatio="aspect-video"
                  icon={Mic}
                  className="border-cyan-500/30"
                />
              )}

              {/* 2. Results Cards */}
              {history.map((item, idx) => (
                <div
                  key={item.id || idx}
                  onClick={() => setSelectedModalItem(item)}
                  className="group relative rounded-2xl overflow-hidden bg-black border border-white/[0.08] hover:border-cyan-500/50 transition-all duration-300 shadow-lg cursor-pointer aspect-video flex items-center justify-center"
                >
                  <video
                    src={item.video_url}
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                    onMouseEnter={(e) => e.currentTarget.play()}
                    onMouseLeave={(e) => e.currentTarget.pause()}
                  />

                  {/* Floating Setting Badge */}
                  <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-bold text-cyan-300 shadow-md flex items-center gap-1">
                    <Mic size={10} />
                    <span className="truncate max-w-[120px]">{item.audioName}</span>
                  </div>

                  {/* Hover Overlay & Direct Download / Delete */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex items-end justify-between">
                    <div className="text-right">
                      <span className="text-xs font-bold text-white block truncate max-w-[140px]">{item.audioName}</span>
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
                          downloadMediaDirectly(item.video_url, `lipsync-${Date.now()}.mp4`);
                        }}
                        className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg transition-transform active:scale-95"
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
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-cyan-400 mb-3">
                    <Mic size={26} />
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
        itemType="فيديو"
        isDeleting={isDeletingModal}
      />
    </>
  );
}
