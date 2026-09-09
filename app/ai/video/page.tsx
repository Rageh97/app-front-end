"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { toast, Toaster } from "react-hot-toast";
import {
  Sparkles,
  Video,
  Wand2,
  Image as ImageIcon,
  Play,
  Pause,
  Download,
  Share2,
  ChevronLeft,
  Film,
  Zap,
  RefreshCw,
  Columns,
  ArrowRight,
  X,
  Clock,
  Volume2,
  History,
  Trash2,
  Copy,
  SlidersHorizontal,
  Menu,
  ExternalLink,
  CheckCircle2,
  CreditCard,
  Eye
} from "lucide-react";
import { AIToolHeader, AIGenerateButton, AILoadingOverlay, downloadMediaDirectly, AIDeleteModal, AIResultModal } from "@/components/ai";
import { handleAuthError } from "@/utils/auth";
import UpgradeModal from "@/components/Modals/UpgradeModal";
import { VIDEO_MODELS, VideoModel, calculateVideoCost, syncVideoWithDynamicPricing } from "@/lib/ai-models-config";
import { BorderBeam } from "@/components/ui/border-beam";

const ASPECT_RATIOS = [
  { id: "16:9", label: "أفقي 16:9", desc: "YouTube / شاشات" },
  { id: "9:16", label: "طولي 9:16", desc: "Reels / TikTok" },
];

const DURATIONS = [
  { sec: 4, label: "4 ثوانٍ" },
  { sec: 6, label: "6 ثوانٍ" },
  { sec: 8, label: "8 ثوانٍ" },
  { sec: 10, label: "10 ثوانٍ" },
  { sec: 20, label: "20 ثانية", long: true },
  { sec: 30, label: "30 ثانية", long: true },
  { sec: 40, label: "40 ثانية", long: true },
  { sec: 60, label: "دقيقة كاملة", long: true },
];

const RESOLUTIONS = [
  { id: '720p', label: '720p' },
  { id: '1080p', label: '1080p' },
  { id: '4k', label: '4K' },
];

interface VideoHistoryItem {
  id: string | number;
  url: string;
  prompt: string;
  model?: string;
  time: string;
}

export default function UnifiedVideoGenerationPage() {
  const [balance, setBalance] = useState<any>(null);

  // Navigation View: 'studio' | 'history'
  const [currentView, setCurrentView] = useState<'studio' | 'history'>('studio');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Model & Inputs
  const [selectedModel, setSelectedModel] = useState<VideoModel>(VIDEO_MODELS[0]);
  const [dynamicPrices, setDynamicPrices] = useState<Record<string, number>>({});
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0]);
  const [durationSec, setDurationSec] = useState<number>(8);
  const [resolution, setResolution] = useState<string>(VIDEO_MODELS[0].defaultResolution || '1080p');

  // Reference Media (image/video; audio references are not supported by the Omni API)
  const [referenceMedia, setReferenceMedia] = useState<string | null>(null);
  const [referenceType, setReferenceType] = useState<"image" | "video">("image");
  const [endMedia, setEndMedia] = useState<string | null>(null);
  const [omniMode, setOmniMode] = useState<"single" | "first_last">("single");

  // Dropdown Popovers
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isRatioDropdownOpen, setIsRatioDropdownOpen] = useState(false);
  const [isDurationDropdownOpen, setIsDurationDropdownOpen] = useState(false);
  const [isResolutionDropdownOpen, setIsResolutionDropdownOpen] = useState(false);

  // Execution
  const [isGenerating, setIsGenerating] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isEnhancing, setIsEnhancing] = useState(false);

  useEffect(() => {
    if (!isGenerating) {
      setElapsedSeconds(0);
      return;
    }
    const timer = window.setInterval(() => setElapsedSeconds(value => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [isGenerating]);

  // Result Player State
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [previousVideoUrl, setPreviousVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [splitView, setSplitView] = useState(false);
  const [history, setHistory] = useState<VideoHistoryItem[]>([]);

  // Modals
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedHistoryModal, setSelectedHistoryModal] = useState<VideoHistoryItem | null>(null);
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
        const id = deleteModal.id;
        if (apiBase) {
          await fetch(`${apiBase}/api/ai/user-videos/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': getToken() || (typeof window !== 'undefined' ? localStorage.getItem('a') : '') || '',
              'User-Client': (global as any)?.clientId1328 || ''
            }
          });
          setHistory(prev => {
            const updated = prev.filter(item => String(item.id) !== String(id));
            if (typeof window !== 'undefined') localStorage.setItem('nexus_video_history', JSON.stringify(updated));
            return updated;
          });
          toast.success('تم حذف الفيديو بنجاح');
        }
      } else if (deleteModal.type === 'all') {
        setHistory([]);
        if (typeof window !== "undefined") {
          localStorage.removeItem("nexus_video_history");
        }
        const token = getToken();
        if (token && apiBase) {
          await fetch(`${apiBase}/api/ai/user-videos?tool=video`, {
            method: 'DELETE',
            headers: { Authorization: token as any, "User-Client": (global as any)?.clientId1328 }
          });
        }
        toast.success("تم مسح السجل بالكامل");
      }
      setDeleteModal({ isOpen: false, type: 'single', id: null });
    } catch (err) {
      toast.error('حدث خطأ أثناء الحذف');
    } finally {
      setIsDeletingModal(false);
    }
  };

  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL, []);
  const getToken = () => typeof window !== "undefined" ? (localStorage.getItem("a") || localStorage.getItem("token")) : null;

  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const endFileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const prevVideoRef = useRef<HTMLVideoElement>(null);
  const playbackRetryCountRef = useRef(0);
  const playbackRetryTimerRef = useRef<number | null>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
        setIsRatioDropdownOpen(false);
        setIsDurationDropdownOpen(false);
        setIsResolutionDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch User Balance
  const fetchBalance = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch(`${apiBase || ""}/api/credits/me/balance`, {
        headers: {
          Authorization: token as any,
          "User-Client": (global as any)?.clientId1328
        }
      });
      if (res.status === 401 || res.status === 403) {
        handleAuthError(res.status);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setBalance(data);
      }
    } catch (e) {
      console.warn("Failed to fetch balance", e);
    }
  };

  const fetchDynamicPricing = async () => {
    if (!apiBase) return;
    try {
      const res = await fetch(`${apiBase}/api/admin/settings/public/ai-pricing`);
      if (res.ok) setDynamicPrices(await res.json());
    } catch (e) {
      console.warn('Failed to fetch video pricing', e);
    }
  };

  // Fetch Video History
  const fetchHistory = async (optimisticItems: VideoHistoryItem[] = []) => {
    try {
      const token = getToken();
      if (token && apiBase) {
        const res = await fetch(`${apiBase}/api/ai/user-videos?tool=video&limit=50&_=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            Authorization: token as any,
            "User-Client": (global as any)?.clientId1328,
            "Cache-Control": "no-cache"
          }
        });
        if (res.status === 401 || res.status === 403) {
          handleAuthError(res.status);
          return;
        }
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.videos) {
            const mapped = data.videos.map((v: any) => ({
              id: v.video_id || v.id,
              url: v.video_url || v.cloudinary_url || v.url,
              prompt: v.prompt,
              model: v.model || 'AI Video',
              time: new Date(v.created_at || Date.now()).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
            }));
            const optimisticIds = new Set(optimisticItems.map(item => String(item.id)));
            const merged = [
              ...optimisticItems,
              ...mapped.filter((item: VideoHistoryItem) => !optimisticIds.has(String(item.id)))
            ];
            setHistory(merged);
            if (typeof window !== 'undefined') {
              localStorage.setItem('nexus_video_history', JSON.stringify(merged));
            }
            return;
          }
        }
      }
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("nexus_video_history");
        if (saved) setHistory(JSON.parse(saved));
      }
    } catch (e) {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("nexus_video_history");
        if (saved) setHistory(JSON.parse(saved));
      }
    }
  };

  useEffect(() => {
    fetchBalance();
    fetchDynamicPricing();
    fetchHistory();
    return () => {
      if (playbackRetryTimerRef.current !== null) {
        window.clearTimeout(playbackRetryTimerRef.current);
      }
    };
  }, []);

  const handleDeleteVideoItem = async (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    try {
      await fetch(`${apiBase}/api/ai/user-videos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': getToken() || (typeof window !== 'undefined' ? localStorage.getItem('a') : '') || '',
          'User-Client': (global as any)?.clientId1328 || ''
        }
      });
      setHistory(prev => {
        const updated = prev.filter(item => String(item.id) !== String(id));
        if (typeof window !== 'undefined') localStorage.setItem('nexus_video_history', JSON.stringify(updated));
        return updated;
      });
      toast.success('تم حذف الفيديو بنجاح');
    } catch (err) {
      toast.error('فشل حذف الفيديو');
    }
  };




  const availableModels = useMemo(
    () => syncVideoWithDynamicPricing(VIDEO_MODELS, dynamicPrices),
    [dynamicPrices]
  );

  useEffect(() => {
    const updated = availableModels.find(model => model.id === selectedModel.id);
    if (updated && updated !== selectedModel) setSelectedModel(updated);
  }, [availableModels, selectedModel.id]);

  // Calculate live cost
  const videoProfit = Number(balance?.plan?.video_profit ?? 0);
  const totalCost = useMemo(() => {
    return calculateVideoCost(selectedModel, durationSec, videoProfit, resolution);
  }, [selectedModel, durationSec, videoProfit, resolution]);

  const supportedDurations = useMemo(() => {
    const hasFixedEndFrame = !!endMedia || omniMode === 'first_last';
    return DURATIONS.filter(item =>
      (selectedModel.supportedDurations || [4, 6, 8]).includes(item.sec) &&
      (!hasFixedEndFrame || item.sec <= 10)
    );
  }, [selectedModel, endMedia, omniMode]);

  const supportedResolutions = useMemo(
    () => RESOLUTIONS.filter(item => (selectedModel.supportedResolutions || ['720p']).includes(item.id)),
    [selectedModel]
  );

  useEffect(() => {
    if (!supportedDurations.some(item => item.sec === durationSec)) {
      setDurationSec(selectedModel.supportedDurations?.includes(8) ? 8 : (selectedModel.supportedDurations?.[0] || 4));
    }
    if (!selectedModel.supportedResolutions?.includes(resolution)) {
      setResolution(selectedModel.defaultResolution || selectedModel.supportedResolutions?.[0] || '720p');
    }
  }, [selectedModel, durationSec, resolution, supportedDurations]);

  useEffect(() => {
    if (!selectedModel.id.includes('omni') && durationSec > 10 && resolution !== '720p') {
      setResolution('720p');
    } else if (!selectedModel.id.includes('omni') && resolution !== '720p' && durationSec !== 8) {
      setDurationSec(8);
    }
  }, [selectedModel, resolution, durationSec]);

  // Magic Prompt Enhancer
  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) {
      toast.error("اكتب وصفاً بسيطاً أولاً ليتم تحسينه");
      return;
    }
    setIsEnhancing(true);
    try {
      const res = await fetch(`${apiBase || ""}/api/ai/enhance-prompt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: getToken() as any,
          "User-Client": (global as any)?.clientId1328
        },
        body: JSON.stringify({ prompt: prompt.trim(), type: "video" })
      });
      const data = await res.json();
      if (data.success && data.enhanced_prompt) {
        setPrompt(data.enhanced_prompt);
        toast.success("تم تحسين الوصف بنجاح!");
      }
    } catch (e) {
      toast.error("تعذر تحسين الوصف");
    } finally {
      setIsEnhancing(false);
    }
  };

  // Upload Reference Media Handler (Omni: image/video | Veo: image only)
  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith("video");
      const isOmni = selectedModel.id.includes('omni');
      const supportedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];

      if (!isVideo && !supportedImageTypes.includes(file.type.toLowerCase())) {
        toast.error("استخدم صورة JPG أو PNG أو WebP");
        e.target.value = "";
        return;
      }

      if (isVideo && !isOmni) {
        toast.error("رفع الفيديو المرجعي متاح مع Gemini Omni فقط");
        e.target.value = "";
        return;
      }

      const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(
          isVideo ? "حجم الفيديو يجب ألا يتجاوز 50 ميجابايت" :
          "حجم الصورة يجب ألا يتجاوز 10 ميجابايت"
        );
        e.target.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setReferenceMedia(reader.result as string);
        if (isVideo) {
          setReferenceType("video");
          toast.success("تم رفع الفيديو كمرجع للتعديل بالمحادثة");
        } else {
          setReferenceType("image");
          // Google requires an 8-second native Veo generation whenever an
          // image is supplied. Keep long extension choices intact, but repair
          // incompatible 4/6-second short requests automatically.
          if (!isOmni && durationSec <= 10 && durationSec !== 8) {
            setDurationSec(8);
            toast.success("تم رفع الصورة وضبط مدة Veo تلقائيًا إلى 8 ثوانٍ");
          } else {
            toast.success(omniMode === 'first_last' ? "تم رفع إطار البداية (Start Frame)" : "تم رفع الصورة كمرجع للتحريك");
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload End Frame / Last Frame (For Omni First & Last Frame Mode)
  const handleEndMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type.toLowerCase())) {
        toast.error("استخدم صورة JPG أو PNG أو WebP");
        e.target.value = "";
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("حجم الصورة يجب ألا يتجاوز 10 ميجابايت");
        e.target.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setEndMedia(reader.result as string);
        toast.success("تم رفع إطار النهاية (End Frame) بنجاح!");
      };
      reader.readAsDataURL(file);
    }
  };

  // Main Generate Action
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("يرجى كتابة وصف المشهد");
      return;
    }
    if (!balance || balance.remaining_credits < totalCost) {
      setShowUpgradeModal(true);
      return;
    }

    const isContinuousRequest = durationSec > 10;
    if (isContinuousRequest && endMedia) {
      toast.error("إطار النهاية الثابت غير متاح مع التمديد الطويل. احذفه أو اختر مدة قصيرة.");
      return;
    }
    if (isContinuousRequest && selectedModel.id.includes('lite')) {
      toast.error("Veo Lite لا يدعم التمديد. اختر Veo Standard أو Veo Fast.");
      return;
    }
    if (durationSec === 60 && selectedModel.id.includes('omni')) {
      toast.error("Gemini Omni يدعم حتى 40 ثانية. استخدم Veo Standard أو Veo Fast للدقيقة.");
      return;
    }

    setIsGenerating(true);
    setIsModelDropdownOpen(false);
    setIsRatioDropdownOpen(false);
    setIsDurationDropdownOpen(false);
    setIsResolutionDropdownOpen(false);

    if (currentVideoUrl) {
      setPreviousVideoUrl(currentVideoUrl);
    }

    try {
      // Normalize provider constraints again at submission time so a fast click
      // cannot send stale UI state before React applies the resolution update.
      const requestQuality = isContinuousRequest && !selectedModel.id.includes('omni') ? '720p' : resolution;
      const payload: any = {
        prompt: prompt.trim(),
        duration: durationSec,
        aspect_ratio: aspectRatio.id,
        model: selectedModel.id,
        quality: requestQuality,
        hasAudio: true
      };

      if (referenceMedia) {
        payload.reference_media = referenceMedia;
        payload.reference_type = referenceType;
      }

      if (endMedia) {
        payload.end_media = endMedia;
        payload.last_frame = endMedia;
      }

      const res = await fetch(`${apiBase || ""}/api/ai/text-to-video`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: getToken() as any,
          "User-Client": (global as any)?.clientId1328
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success && data.video_url) {
        toast.success("🎉 تم إنتاج الفيديو بنجاح!");
        playbackRetryCountRef.current = 0;
        setCurrentVideoUrl(data.video_url);
        setCurrentView('studio');
        
        const newItem: VideoHistoryItem = {
          id: data.video_id || data.id || `v-${Date.now()}`,
          url: data.video_url,
          prompt: prompt.trim(),
          model: selectedModel.name,
          time: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
        };

        setHistory(previousItems => {
          const updatedHistory = [
            newItem,
            ...previousItems.filter(item => String(item.id) !== String(newItem.id))
          ];
          if (typeof window !== "undefined") {
            localStorage.setItem("nexus_video_history", JSON.stringify(updatedHistory));
          }
          return updatedHistory;
        });

        fetchBalance();
        // Reconcile with the database without allowing a stale proxy response
        // to remove the item that was just returned by the generation request.
        void fetchHistory([newItem]);
      } else {
        const validationMessage = Array.isArray(data.errors)
          ? data.errors.map((error: any) => error?.msg).filter(Boolean).join(" — ")
          : "";
        toast.error(validationMessage || data.message || "فشل توليد الفيديو");
      }
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء معالجة الفيديو");
    } finally {
      setIsGenerating(false);
    }
  };

  // Download Video
  const downloadVideo = async (url: string, filename = "generated-video.mp4") => {
    try {
      toast.loading("جاري بدء التنزيل...", { duration: 2000 });
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
      toast.success("تم التنزيل بنجاح!");
    } catch (e) {
      window.open(url, "_blank");
    }
  };



  // Use Video for Conversational Editing with Gemini Omni
  const handleUseForEdit = async (videoUrl: string, promptText?: string) => {
    try {
      const tid = toast.loading("جاري إعداد الفيديو للتعديل بالمحادثة...");
      setPreviousVideoUrl(videoUrl);
      
      const omniModel = VIDEO_MODELS.find(m => m.id === 'gemini-omni-1.1-flash') || VIDEO_MODELS[0];
      setSelectedModel(omniModel);
      setReferenceType("video");

      if (videoUrl.startsWith('data:')) {
        setReferenceMedia(videoUrl);
      } else {
        try {
          const res = await fetch(videoUrl);
          const blob = await res.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            setReferenceMedia(reader.result as string);
          };
          reader.readAsDataURL(blob);
        } catch (e) {
          setReferenceMedia(videoUrl);
        }
      }
      
      setCurrentView('studio');
      toast.dismiss(tid);
      toast.success("تم إدراج الفيديو كمرجع في Gemini Omni! اكتب التعديلات المطلوبة.");
    } catch (e) {
      toast.dismiss();
      toast.error("تعذر إدراج الفيديو للتعديل");
    }
  };

  const handleCurrentVideoError = () => {
    if (!currentVideoUrl || playbackRetryTimerRef.current !== null) return;
    if (playbackRetryCountRef.current >= 6) {
      toast.error("الفيديو محفوظ، لكن عرضه ما زال قيد التجهيز. ستجده في الأعمال السابقة.");
      return;
    }

    playbackRetryCountRef.current += 1;
    const retryNumber = playbackRetryCountRef.current;
    playbackRetryTimerRef.current = window.setTimeout(() => {
      playbackRetryTimerRef.current = null;
      setCurrentVideoUrl(value => {
        if (!value) return value;
        try {
          const refreshed = new URL(value, window.location.origin);
          refreshed.searchParams.set('_play', `${Date.now()}-${retryNumber}`);
          return refreshed.toString();
        } catch {
          const separator = value.includes('?') ? '&' : '?';
          return `${value}${separator}_play=${Date.now()}-${retryNumber}`;
        }
      });
    }, Math.min(1500 * retryNumber, 6000));
  };

  const handleCurrentVideoReady = () => {
    playbackRetryCountRef.current = 0;
    if (playbackRetryTimerRef.current !== null) {
      window.clearTimeout(playbackRetryTimerRef.current);
      playbackRetryTimerRef.current = null;
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      if (prevVideoRef.current) prevVideoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      if (prevVideoRef.current) prevVideoRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="h-screen bg-[#05060a] text-white flex flex-col font-sans selection:bg-blue-500/30 overflow-hidden" dir="rtl">
      <Toaster position="top-right" />

      {/* Global CSS for Clean Scrollbars */}
      <style jsx global>{`
        *::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        * {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}</style>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 1. TOP RESPONSIVE HEADER */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <header className="shrink-0 z-50 bg-[#0B0D14] border-b border-white/[0.08] px-3.5 sm:px-6 py-2.5 flex flex-col md:flex-row gap-2.5 md:gap-0 justify-between items-stretch md:items-center">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-4">
            <Link 
              href="/ai" 
              className="p-1.5 rounded-lg bg-[#121520] hover:bg-[#161a27] text-gray-300 hover:text-white transition-all active:scale-95 border border-white/[0.08]"
              title="العودة"
            >
              <ArrowRight size={18} />
            </Link>
            
            <h1 className="text-sm sm:text-base font-bold text-white tracking-wide">
              استوديو الفيديو AI
            </h1>
          </div>

          {/* Mobile Right Bar Actions */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="bg-[#121520] border border-white/[0.08] px-2 py-1 rounded-lg flex items-center gap-1.5 text-[11px]">
              <CreditCard size={11} className="text-emerald-400" />
              <span className="font-bold text-white font-mono">{balance?.remaining_credits || 0}</span>
            </div>

            <button 
              onClick={() => setShowUpgradeModal(true)} 
              className="bg-emerald-600 hover:bg-emerald-500 px-2 py-1 rounded-lg text-[11px] font-bold text-white transition-all shadow-sm border border-emerald-500/40"
            >
              ترقية
            </button>

            <button 
              onClick={() => setShowMobileSidebar(true)}
              className="p-1.5 rounded-lg bg-[#121520] border border-white/[0.08] text-gray-300 hover:text-white"
            >
              <SlidersHorizontal size={14} />
            </button>
          </div>
        </div>

        {/* Center: View Switcher (Studio vs History) */}
        <div className="flex items-center justify-center gap-1 bg-[#121520] p-1 rounded-xl border border-white/[0.08] self-center">
          <button
            onClick={() => setCurrentView('studio')}
            className={`relative z-10 px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              currentView === 'studio'
                ? 'bg-[#0B0D14] text-white shadow-sm border border-white/[0.08]'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            استوديو الفيديو
          </button>

          <button
            onClick={() => {
              setCurrentView('history');
              void fetchHistory(history);
            }}
            className={`relative z-10 px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
              currentView === 'history'
                ? 'bg-[#0B0D14] text-white shadow-sm border border-white/[0.08]'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <History size={12} className={currentView === 'history' ? 'text-emerald-400' : 'text-gray-400'} />
            <span>الأعمال السابقة</span>
            {history.length > 0 && (
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                {history.length}
              </span>
            )}
          </button>
        </div>

        {/* Desktop Credits & Upgrade */}
        <div className="hidden md:flex items-center gap-3">
          <div className="bg-[#121520] border border-white/[0.08] px-3.5 py-1.5 rounded-lg flex items-center gap-2 text-xs">
            <CreditCard size={13} className="text-emerald-400" />
            <span className="text-gray-400">الرصيد:</span>
            <span className="font-bold text-white font-mono">{balance?.remaining_credits || 0}</span>
          </div>
          <button 
            onClick={() => setShowUpgradeModal(true)} 
            className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all shadow-sm border border-emerald-500/40"
          >
            ترقية
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 2. VIEW: PREVIOUS WORKS (HISTORY) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {currentView === 'history' && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-black text-white">سجل أعمالك السابقة</h2>
                <p className="text-xs text-gray-400">جميع مقاطع الفيديو التي قمت بإنشائها أو تعديلها</p>
              </div>
              {history.length > 0 && (
                <button
                  onClick={() => setDeleteModal({ isOpen: true, type: 'all' })}
                  className="px-3 py-1.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Trash2 size={13} />
                  <span>مسح السجل</span>
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500">
                  <Film size={28} />
                </div>
                <h3 className="text-sm font-bold text-gray-300">لا توجد أعمال سابقة حتى الآن</h3>
                <p className="text-xs text-gray-500 max-w-sm">قم بتوليد أول فيديو لتجربة الإخراج السينمائي الذكي</p>
                <button
                  onClick={() => setCurrentView('studio')}
                  className="mt-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md"
                >
                  بدء التوليد الآن
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {history.map((item) => (
                  <div key={item.id} className="relative rounded-xl border border-white/10 bg-[#0d0e17] overflow-hidden group hover:border-blue-500/40 transition-all flex flex-col">
                    <div 
                      onClick={() => setSelectedHistoryModal(item)}
                      className="relative aspect-video bg-black flex items-center justify-center overflow-hidden cursor-pointer group/vid"
                    >
                      <video 
                        src={item.url} 
                        loop 
                        muted 
                        playsInline 
                        className="w-full h-full object-contain" 
                        onMouseEnter={(e) => e.currentTarget.play()}
                        onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/vid:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <div className="w-10 h-10 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-lg transform group-hover/vid:scale-110 transition-transform">
                          <Play size={18} className="fill-white ml-0.5" />
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedHistoryModal(item); }}
                        className="absolute top-2 left-2 p-1.5 rounded-md bg-black/70 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md opacity-0 group-hover/vid:opacity-100 transition-opacity text-xs"
                        title="عرض الفيديو بكامل أبعاده"
                      >
                        <Eye size={12} />
                      </button>
                    </div>
                    <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono mb-1.5">
                          <span>{item.model}</span>
                          <span>{item.time}</span>
                        </div>
                        <p className="text-xs text-gray-200 line-clamp-2 leading-relaxed">
                          {item.prompt}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                        <button
                          onClick={() => handleUseForEdit(item.url, item.prompt)}
                          className="flex-1 py-1.5 px-2 rounded bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Wand2 size={12} />
                          <span>تعديل بالمحادثة</span>
                        </button>
                        <button
                          onClick={() => setSelectedHistoryModal(item)}
                          className="p-1.5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-xs transition-colors"
                          title="عرض الفيديو بكامل أبعاده"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() => downloadVideo(item.url, `nexus-${item.id}.mp4`)}
                          className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white text-xs transition-colors"
                          title="تحميل"
                        >
                          <Download size={13} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteModal({ isOpen: true, type: 'single', id: item.id }); }}
                          className="p-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs transition-colors"
                          title="حذف هذا الفيديو"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 3. VIEW: STUDIO WORKSPACE */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {currentView === 'studio' && (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative" ref={dropdownRef}>
          
          {/* LEFT/RIGHT: STUDIO CONTROL PANEL */}
          <aside className={`
            fixed inset-y-0 right-0 z-40 w-full sm:w-[420px] bg-[#0B0D14] border-l border-white/[0.08] p-4 lg:p-5 flex flex-col transition-transform duration-300 ease-in-out
            lg:relative lg:translate-x-0 lg:z-auto lg:shrink-0 overflow-y-auto custom-scrollbar
            ${showMobileSidebar ? "translate-x-0 shadow-2xl" : "translate-x-full lg:translate-x-0"}
          `}>
            
            {/* Drawer Mobile Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 lg:hidden shrink-0 mb-3">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-emerald-400" />
                <span>إعدادات الفيديو والنموذج</span>
              </span>
              <button 
                onClick={() => setShowMobileSidebar(false)}
                className="p-1.5 rounded-lg bg-[#121520] text-gray-400 hover:text-white border border-white/[0.08]"
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 space-y-4 pr-0.5 pb-2 overflow-visible relative">
              
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white tracking-wide">إعدادات الفيديو</h2>
              </div>

              {/* Prompt Box */}
              <div className="relative rounded-xl border border-white/[0.08] bg-[#121520] p-3.5 focus-within:border-emerald-500/50 transition-all">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="صف المشهد الذي تريده مع الأصوات المطلوبة..."
                  rows={4}
                  className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-gray-500 outline-none resize-none leading-relaxed custom-scrollbar"
                />
              </div>

              {/* REFERENCE MEDIA & FIRST-LAST FRAME CONTROLS */}
              <div className="space-y-2.5">
                {selectedModel.id.includes('omni') && (
                  <div className="flex items-center justify-between bg-[#121520] p-1 rounded-xl border border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => {
                        setOmniMode("single");
                        setEndMedia(null);
                      }}
                      className={`flex-1 py-1.5 text-center rounded-lg text-xs font-bold transition-all ${
                        omniMode === "single"
                          ? "bg-[#0B0D14] text-white shadow-sm border border-white/[0.08]"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      وسائط مرجعية
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOmniMode("first_last");
                        setReferenceType("image");
                      }}
                      className={`flex-1 py-1.5 text-center rounded-lg text-xs font-bold transition-all ${
                        omniMode === "first_last"
                          ? "bg-[#0B0D14] text-white shadow-sm border border-white/[0.08]"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      الإطار الأول والأخير
                    </button>
                  </div>
                )}

                {omniMode === "first_last" && selectedModel.id.includes('omni') ? (
                  /* Dual Dropzones: Start Frame & End Frame */
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Start Frame */}
                    <div>
                      {!referenceMedia ? (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="cursor-pointer h-20 rounded-xl border border-dashed border-white/[0.08] hover:border-emerald-500/40 bg-[#121520] hover:bg-[#161a27] transition-all flex flex-col items-center justify-center p-2 text-center"
                        >
                          <span className="text-xs font-bold text-gray-200 block mb-0.5">إطار البداية</span>
                          <span className="text-[10px] text-gray-500">اختر صورة</span>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleMediaUpload}
                            className="hidden"
                          />
                        </div>
                      ) : (
                        <div className="h-20 rounded-xl overflow-hidden border border-white/[0.08] bg-[#121520] flex items-center justify-between p-2">
                          <img src={referenceMedia} alt="Start Frame" className="w-14 h-14 object-cover rounded-lg border border-white/10" />
                          <div className="flex-1 pr-2 min-w-0">
                            <span className="text-xs font-bold text-white block">إطار البداية</span>
                            <span className="text-[10px] text-emerald-400 font-bold">تم الرفع</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setReferenceMedia(null)}
                            className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* End Frame */}
                    <div>
                      {!endMedia ? (
                        <div
                          onClick={() => endFileInputRef.current?.click()}
                          className="cursor-pointer h-20 rounded-xl border border-dashed border-white/[0.08] hover:border-emerald-500/40 bg-[#121520] hover:bg-[#161a27] transition-all flex flex-col items-center justify-center p-2 text-center"
                        >
                          <span className="text-xs font-bold text-gray-200 block mb-0.5">إطار النهاية</span>
                          <span className="text-[10px] text-gray-500">اختر صورة</span>
                          <input
                            ref={endFileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleEndMediaUpload}
                            className="hidden"
                          />
                        </div>
                      ) : (
                        <div className="h-20 rounded-xl overflow-hidden border border-white/[0.08] bg-[#121520] flex items-center justify-between p-2">
                          <img src={endMedia} alt="End Frame" className="w-14 h-14 object-cover rounded-lg border border-white/10" />
                          <div className="flex-1 pr-2 min-w-0">
                            <span className="text-xs font-bold text-white block">إطار النهاية</span>
                            <span className="text-[10px] text-emerald-400 font-bold">تم الرفع</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEndMedia(null)}
                            className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Single Media Dropzone (Image or Video) */
                  <div className="relative">
                    {!referenceMedia ? (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="cursor-pointer h-20 rounded-xl border border-dashed border-white/[0.08] hover:border-emerald-500/40 bg-[#121520] hover:bg-[#161a27] transition-all flex flex-col items-center justify-center gap-1 text-center p-2"
                      >
                        <span className="text-xs font-semibold text-gray-300">
                          {selectedModel.id.includes('omni')
                            ? 'رفع صورة للتحريك أو فيديو للتعديل'
                            : 'رفع صورة للتحريك (Image-to-Video)'}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {selectedModel.id.includes('omni')
                            ? 'ملفات JPG, PNG, MP4'
                            : 'ملفات JPG, PNG'}
                        </span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept={selectedModel.id.includes('omni')
                            ? "image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                            : "image/jpeg,image/png,image/webp"}
                          onChange={handleMediaUpload}
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <div className="h-20 rounded-xl overflow-hidden border border-white/[0.08] bg-[#121520] flex items-center justify-between p-3">
                        <div className="flex items-center gap-3">
                          {referenceType === "image" ? (
                            <img src={referenceMedia} alt="Reference" className="w-14 h-14 object-cover rounded-lg border border-white/10" />
                          ) : (
                            <video src={referenceMedia} className="w-14 h-14 object-cover rounded-lg border border-white/10" />
                          )}
                          <div>
                            <span className="text-xs font-bold text-emerald-400 block">
                              {referenceType === "image" ? "تم رفع الصورة المرجعية" : "تم رفع الفيديو المرجعي"}
                            </span>
                            <span className="text-[10px] text-gray-500">سيتم استخدام الوسائط لتوجيه التوليد</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setReferenceMedia(null)}
                          className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* MODEL SELECTOR (CLEAN: NAME + COST ONLY) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsModelDropdownOpen(!isModelDropdownOpen);
                    setIsRatioDropdownOpen(false);
                    setIsDurationDropdownOpen(false);
                    setIsResolutionDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-right border ${
                    isModelDropdownOpen
                      ? "bg-[#161a27] border-emerald-500/40 shadow-lg"
                      : "bg-[#121520] hover:bg-[#161a27] border-white/[0.08]"
                  }`}
                >
                  <div className="flex items-center justify-between flex-1 min-w-0 pr-1 pl-2">
                    <span className="text-xs font-bold text-white">{selectedModel.name}</span>
                    <span className="text-xs text-emerald-400 font-bold font-mono">
                      {calculateVideoCost(selectedModel, durationSec, videoProfit, resolution)} نقطة
                    </span>
                  </div>
                  <ChevronLeft size={16} className={`transition-transform duration-200 shrink-0 ${isModelDropdownOpen ? "-rotate-90 text-emerald-400" : "text-gray-400"}`} />
                </button>

                {/* Models Dropdown Menu (Opens directly below button) */}
                {isModelDropdownOpen && (
                  <div className="absolute top-full right-0 mt-1.5 w-full bg-[#0E111A] border border-white/10 rounded-xl shadow-2xl p-2 z-50 space-y-1 backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center justify-between px-2 py-1 border-b border-white/10 mb-1">
                      <span className="text-[11px] font-bold text-gray-300">اختر نموذج الفيديو</span>
                      <span className="text-[10px] text-gray-500 font-mono">{availableModels.length} نماذج</span>
                    </div>
                    <div className="space-y-1 max-h-[220px] overflow-y-auto custom-scrollbar pr-0.5">
                      {availableModels.map((m) => {
                        const isSelected = selectedModel.id === m.id;
                        const modelResolution = m.supportedResolutions?.includes(resolution) ? resolution : (m.defaultResolution || '720p');
                        const modelCost = calculateVideoCost(m, durationSec, videoProfit, modelResolution);
                        return (
                          <div
                            key={m.id}
                            onClick={() => {
                              setSelectedModel(m);
                              setResolution(m.defaultResolution || m.supportedResolutions?.[0] || '720p');
                              setDurationSec(m.supportedDurations?.includes(8) ? 8 : (m.supportedDurations?.[0] || 4));
                              setIsModelDropdownOpen(false);
                            }}
                            className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all border ${
                              isSelected
                                ? "bg-emerald-500/10 border-emerald-500/40 text-white"
                                : "bg-white/[0.02] hover:bg-white/[0.05] border-white/5 text-gray-300"
                            }`}
                          >
                            <span className="text-xs font-bold text-white">{m.name}</span>
                            <span className="text-xs text-emerald-400 font-bold font-mono">{modelCost} نقطة</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* SIZE, DURATION & RESOLUTION SELECTORS */}
              <div className="grid grid-cols-3 gap-2.5">
                {/* Aspect Ratio */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRatioDropdownOpen(!isRatioDropdownOpen);
                      setIsModelDropdownOpen(false);
                      setIsDurationDropdownOpen(false);
                      setIsResolutionDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-[#121520] hover:bg-[#161a27] border border-white/[0.08] text-right transition-all"
                  >
                    <div>
                      <span className="text-[10px] text-gray-500 block mb-0.5">الأبعاد</span>
                      <span className="text-xs font-bold text-white">{aspectRatio.label}</span>
                    </div>
                    <ChevronLeft size={14} className={`transition-transform ${isRatioDropdownOpen ? "-rotate-90 text-emerald-400" : "text-gray-400"}`} />
                  </button>

                  {isRatioDropdownOpen && (
                    <div className="absolute top-full right-0 mt-1 w-full bg-[#0E111A] border border-white/10 rounded-xl shadow-xl p-1.5 z-50 space-y-1 backdrop-blur-xl">
                      {ASPECT_RATIOS.map((r) => (
                        <div
                          key={r.id}
                          onClick={() => {
                            setAspectRatio(r);
                            setIsRatioDropdownOpen(false);
                          }}
                          className={`p-2 rounded-lg cursor-pointer text-right transition-all flex items-center justify-between ${
                            aspectRatio.id === r.id ? "bg-emerald-600 text-white font-bold" : "hover:bg-white/5 text-gray-300"
                          }`}
                        >
                          <span className="text-xs">{r.label}</span>
                          <span className="text-[9px] text-gray-500">{r.desc}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Duration */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDurationDropdownOpen(!isDurationDropdownOpen);
                      setIsModelDropdownOpen(false);
                      setIsRatioDropdownOpen(false);
                      setIsResolutionDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-[#121520] hover:bg-[#161a27] border border-white/[0.08] text-right transition-all"
                  >
                    <div>
                      <span className="text-[10px] text-gray-500 block mb-0.5">المدة</span>
                      <span className="text-xs font-bold text-white">
                        {DURATIONS.find(d => d.sec === durationSec)?.label || `${durationSec} ثوانٍ`}
                      </span>
                    </div>
                    <ChevronLeft size={14} className={`transition-transform ${isDurationDropdownOpen ? "-rotate-90 text-emerald-400" : "text-gray-400"}`} />
                  </button>

                  {isDurationDropdownOpen && (
                    <div className="absolute top-full right-0 mt-1 w-full bg-[#0E111A] border border-white/10 rounded-xl shadow-xl p-1.5 z-50 space-y-1 backdrop-blur-xl">
                      {supportedDurations.map((d) => (
                        <div
                          key={d.sec}
                          onClick={() => {
                            setDurationSec(d.sec);
                            if (d.sec > 10 && !selectedModel.id.includes('omni')) setResolution('720p');
                            setIsDurationDropdownOpen(false);
                          }}
                          className={`p-2 rounded-lg cursor-pointer text-right transition-all flex items-center justify-between ${
                            durationSec === d.sec ? "bg-emerald-600 text-white font-bold" : "hover:bg-white/5 text-gray-300"
                          }`}
                        >
                          <span className="text-xs">{d.label}</span>
                          <span className={`text-[9px] ${d.long ? 'text-emerald-300' : 'text-gray-500'}`}>
                            {d.long ? 'تمديد متصل • ملف واحد' : `${d.sec}s`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Resolution */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsResolutionDropdownOpen(!isResolutionDropdownOpen);
                      setIsModelDropdownOpen(false);
                      setIsRatioDropdownOpen(false);
                      setIsDurationDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-[#121520] hover:bg-[#161a27] border border-white/[0.08] text-right transition-all"
                  >
                    <div>
                      <span className="text-[10px] text-gray-500 block mb-0.5">الدقة</span>
                      <span className="text-xs font-bold text-white">{RESOLUTIONS.find(item => item.id === resolution)?.label || resolution}</span>
                    </div>
                    <ChevronLeft size={14} className={`transition-transform ${isResolutionDropdownOpen ? "-rotate-90 text-emerald-400" : "text-gray-400"}`} />
                  </button>

                  {isResolutionDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-[#0E111A] border border-white/10 rounded-xl shadow-xl p-1.5 z-50 space-y-1 backdrop-blur-xl">
                      {supportedResolutions.map(item => (
                        <div
                          key={item.id}
                          onClick={() => {
                            setResolution(item.id);
                            setIsResolutionDropdownOpen(false);
                          }}
                          className={`p-2 rounded-lg cursor-pointer text-right text-xs transition-all ${
                            resolution === item.id ? "bg-emerald-600 text-white font-bold" : "hover:bg-white/5 text-gray-300"
                          }`}
                        >
                          {item.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* ACTION GENERATE BUTTON (STICKY BOTTOM) */}
            <div className="pt-3 border-t border-white/[0.08] shrink-0 bg-[#0B0D14]">
              <AIGenerateButton
                onClick={handleGenerate}
                isGenerating={isGenerating}
                disabled={!prompt.trim()}
                cost={totalCost}
                label="إنشاء"
                generatingLabel="جاري الإنشاء..."
                icon={Video}
                variant="emerald"
              />
            </div>

          </aside>

          {/* RIGHT/LEFT: MAIN CINEMATIC VIEWPORT */}
          <main className="flex-1 flex flex-col p-3 sm:p-5 overflow-hidden bg-[#06070B]">
            
            {/* Viewport Card */}
            <div className="relative flex-1 rounded-2xl border border-white/[0.08] bg-[#0B0D14] flex items-center justify-center overflow-hidden p-2 sm:p-4 shadow-2xl">
              <BorderBeam size={250} duration={12} delay={9} />

              {/* Minimalist Nano-Banana Style Loading Overlay */}
              <AILoadingOverlay
                isGenerating={isGenerating}
                timerSeconds={elapsedSeconds}
                icon={Video}
                title={durationSec > 10 ? `نبني فيديو متصل لمدة ${durationSec} ثانية` : 'جاري صناعة الفيديو'}
                subMessage={durationSec > 10 ? 'يتم تمديد المشهد على مراحل مع الحفاظ على الشخصيات والحركة والصوت، ثم تسليم ملف نهائي واحد.' : undefined}
              />

              {currentVideoUrl ? (
                /* Active Result Player */
                <div className="w-full h-full flex flex-col md:flex-row gap-3 relative z-10">
                  
                  {/* Split View (Previous / Original) */}
                  {splitView && previousVideoUrl && (
                    <div className="flex-1 h-full relative rounded-md overflow-hidden border border-white/10 bg-black group">
                      <div className="absolute top-3 right-3 z-10 bg-black/80 px-2.5 py-1 rounded text-[10px] font-bold text-gray-300 border border-white/10">
                        الفيديو الأصلي
                      </div>
                      <video
                        ref={prevVideoRef}
                        src={previousVideoUrl}
                        loop
                        muted
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  {/* Main Video Player */}
                  <div className="flex-1 h-full relative rounded-md overflow-hidden border border-blue-500/30 bg-black group flex flex-col">
                    {splitView && previousVideoUrl && (
                      <div className="absolute top-3 right-3 z-10 bg-blue-600/90 px-2.5 py-1 rounded text-[10px] font-bold text-white border border-white/20 shadow-md">
                        بعد التعديل (Omni)
                      </div>
                    )}

                    {/* Floating Quick Close Button on Video */}
                    <button
                      onClick={() => {
                        setCurrentVideoUrl(null);
                        setPreviousVideoUrl(null);
                        setSplitView(false);
                        setIsPlaying(false);
                        toast.success("تم إغلاق العرض");
                      }}
                      className="absolute top-3 left-3 z-20 w-8 h-8 rounded-full bg-black/70 hover:bg-rose-900/80 border border-white/20 hover:border-rose-500 text-gray-300 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                      title="إغلاق العرض"
                    >
                      <X size={15} />
                    </button>

                    <video
                      key={currentVideoUrl}
                      ref={videoRef}
                      src={currentVideoUrl}
                      controls
                      autoPlay
                      loop
                      playsInline
                      preload="auto"
                      onCanPlay={handleCurrentVideoReady}
                      onError={handleCurrentVideoError}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      className="w-full h-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
                    />

                    {/* Overlaid Player Bar */}
                    <div className="absolute inset-x-0 bottom-0 p-3.5 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={togglePlay}
                          className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-all shadow-lg"
                        >
                          {isPlaying ? <Pause size={15} /> : <Play size={15} className="fill-white ml-0.5" />}
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            handleUseForEdit(currentVideoUrl);
                            setPrompt("تمديد المشهد بمواصلة الحركة الطبيعية مع الحفاظ على تناسق الشخصيات والإضاءة والبيئة");
                            setDurationSec(8);
                            toast.success("تم إعداد المشهد للتمديد عبر Gemini Omni!");
                          }}
                          className="p-2 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-white/10"
                          title="تمديد المشهد لمدة أطول عبر Gemini Omni"
                        >
                          <Clock size={13} className="text-emerald-400" />
                          <span>تمديد المشهد</span>
                        </button>

                        <button
                          onClick={() => handleUseForEdit(currentVideoUrl)}
                          className="p-2 rounded-md bg-emerald-600/20 hover:bg-emerald-600 text-emerald-200 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 border border-emerald-500/30"
                          title="تعديل هذا الفيديو بالمحادثة عبر Gemini Omni"
                        >
                          <Wand2 size={13} className="text-yellow-300" />
                          <span>تعديل بالمحادثة (Omni)</span>
                        </button>

                        <button
                          onClick={() => downloadMediaDirectly(currentVideoUrl, `nexus-video-${Date.now()}.mp4`)}
                          className="p-2 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5"
                          title="تحميل المقطع MP4"
                        >
                          <Download size={14} />
                          <span>تحميل</span>
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                /* Empty Cinema Placeholder */
                <div className="flex flex-col items-center justify-center text-center p-8 space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-400">
                    <Film size={32} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
                      اكتب الوصف أو ارفع صورة/فيديو مرجعي لتوليد مقاطع سينمائية متقدمة مع الصوت عبر Gemini Omni و Google Veo.
                    </p>
                  </div>
                  <span className="text-[10px] text-gray-500 px-3 py-1 rounded-full bg-white/[0.02] border border-white/5 font-mono">
                    مدعوم بنماذج Google Gemini Omni و Veo 3.1
                  </span>
                </div>
              )}

            </div>

          </main>

        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradeModal 
          isOpen={showUpgradeModal} 
          onClose={() => setShowUpgradeModal(false)} 
        />
      )}


      <AIDeleteModal
        isOpen={deleteModal.isOpen}
        type={deleteModal.type}
        isDeleting={isDeletingModal}
        onClose={() => setDeleteModal({ isOpen: false, type: 'single', id: null })}
        onConfirm={handleConfirmDelete}
      />

      {selectedHistoryModal && (
        <AIResultModal
          isOpen={!!selectedHistoryModal}
          onClose={() => setSelectedHistoryModal(null)}
          mediaUrl={selectedHistoryModal.url}
          mediaType="video"
          title="فيديو بالذكاء الاصطناعي"
          subtitle={selectedHistoryModal.model || "Google Veo / Gemini Omni"}
          prompt={selectedHistoryModal.prompt}
          timestamp={selectedHistoryModal.time}
          onDelete={() => setDeleteModal({ isOpen: true, type: 'single', id: selectedHistoryModal.id })}
          details={[
            { label: "النموذج المستخدم", value: selectedHistoryModal.model || "Google Veo" },
            { label: "الوصف", value: selectedHistoryModal.prompt || "" },
            { label: "التاريخ", value: selectedHistoryModal.time || "" }
          ]}
        />
      )}
    </div>
  );
}
