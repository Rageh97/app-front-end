"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { toast, Toaster } from "react-hot-toast";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { 
  ArrowRight, Music, Music2, Play, Pause, Download, Volume2,
  CreditCard, RefreshCw, Check, ChevronDown,
  X, Upload, CheckCircle2, Copy, Trash2, History, RotateCcw,
  Sparkles, Disc, Sliders, AudioLines, Flame, Radio, Piano,
  Waves, Compass, FileText, AlignLeft, Film, Headphones, Zap,
  SlidersHorizontal, Menu
} from "lucide-react";
import { BorderBeam } from "@/components/ui/border-beam";
import UpgradeModal from "@/components/Modals/UpgradeModal";
import { AIGenerateButton, AIDeleteModal } from "@/components/ai";
import { useAiPricing } from '@/hooks/useAiPricing';

interface MusicGenre {
  id: string;
  name: string;
  desc: string;
  icon: any;
  color: string;
  badge: string;
}

const GENRES: MusicGenre[] = [
  { id: 'arabic pop', name: 'بوب وطربي عربي', desc: 'ألحان عربية مع إيقاعات حديثة وغناء', icon: Music2, color: 'text-purple-400', badge: 'شائع' },
  { id: 'cinematic orchestra', name: 'سينمائي ملحمي', desc: 'أوركسترا ضخمة وتصاعد ملحمي مهيب', icon: Film, color: 'text-indigo-400', badge: 'أفلام' },
  { id: 'lofi hip hop chill', name: 'Lo-Fi Chill & Study', desc: 'ألحان استرخاء وتركيز كلاسيكية', icon: Headphones, color: 'text-emerald-400', badge: 'دراسة' },
  { id: 'electronic synthwave', name: 'Electronic & Synthwave', desc: 'طاقة إلكترونية مستقبلية وسينثويف', icon: Zap, color: 'text-cyan-400', badge: 'حماسي' },
  { id: 'acoustic piano and strings', name: 'بيانو وأوتار عذبة', desc: 'معزوفات بيانو رومانسية هادئة', icon: Piano, color: 'text-amber-400', badge: 'عاطفي' },
  { id: 'ambient meditation', name: 'Ambient & استرخاء', desc: 'ترددات تأمل وموسيقى روحانية', icon: Waves, color: 'text-teal-400', badge: 'هدوء' },
  { id: 'podcast modern upbeat', name: 'بودكاست وإعلانات', desc: 'خلفيات متوازنة للمحتوى والفيديوهات', icon: Radio, color: 'text-rose-400', badge: 'محتوى' },
  { id: 'energetic rock guitar', name: 'Rock & Energy', desc: 'غيتارات كهربائية وحماس عالي', icon: Flame, color: 'text-orange-400', badge: 'طاقة' },
];

const MOODS = [
  'حماسي ومبهج', 'ملهم ومحفز', 'غامض وتشويقي', 'حزين ومؤثر', 'هادئ ومسالم', 'فخم وأصيل', 'رومانسي وعاطفي'
];

const MUSIC_PROMPT_PRESETS = [
  {
    title: 'أغنية بوب عربية مبهجة',
    prompt: 'أغنية بوب عربية عصرية ومبهجة مع صوت نسائي دافئ، تجمع بين آلات العود والجيتار وإيقاع طربي سريع يناسب الصيف والاحتفالات.',
    lyrics: 'يا ليل يا عين طاب السمر، نسهر سوى تحت القمر'
  },
  {
    title: 'موسيقى فيلم وثائقي ملحمي',
    prompt: 'مقطوعة سينمائية أوركسترالية ضخمة بآلات وترية وطبول ملحمية تتصاعد تدريجياً لتعبر عن العظمة والانتصار.',
    lyrics: ''
  },
  {
    title: 'مقدمة بودكاست حديث ولطيف',
    prompt: 'لحن Lo-Fi إلكتروني دافئ مع إيقاع بيس هادئ ومناسب كخلفية حوارية مريحة للمستمع.',
    lyrics: ''
  },
  {
    title: 'معزوفة بيانو حزينة ومؤثرة',
    prompt: 'لحن بيانو كلاسيكي منفرد بطيء مع صدى شاعري هادئ يعبر عن الشوق والذكريات.',
    lyrics: ''
  }
];

interface MusicHistoryItem {
  id: number;
  prompt: string;
  genre: string;
  mood: string;
  model: string;
  lyrics?: string;
  url: string;
  date: string;
}

export default function MusicGenerationPage() {
  const [prompt, setPrompt] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("arabic pop");
  const [selectedMood, setSelectedMood] = useState("حماسي ومبهج");
  const [selectedModel, setSelectedModel] = useState<"lyria-3-pro-preview" | "lyria-3-clip-preview">("lyria-3-clip-preview");
  const [duration, setDuration] = useState(30);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [generatedLyrics, setGeneratedLyrics] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [balance, setBalance] = useState<any>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Navigation: 'studio' | 'presets' | 'history'
  const [currentView, setCurrentView] = useState<'studio' | 'presets' | 'history'>('studio');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [history, setHistory] = useState<MusicHistoryItem[]>([]);
  const [playingHistoryId, setPlayingHistoryId] = useState<number | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; type: 'single' | 'all'; id?: number | null }>({ isOpen: false, type: 'single', id: null });
  const [isDeletingModal, setIsDeletingModal] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const historyAudioRef = useRef<HTMLAudioElement>(null);
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL, []);
  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem("a") : null;

  const { modelPrice } = useAiPricing();
  const creditsNeeded = modelPrice(selectedModel, selectedModel === 'lyria-3-pro-preview' ? 15 : 10);

  const fetchBalance = async () => {
    if (!apiBase) return;
    try {
      const res = await fetch(`${apiBase}/api/credits/me/balance`, {
        headers: { 'Authorization': getToken() as any, "User-Client": (global as any)?.clientId1328 }
      });
      if (res.ok) setBalance(await res.json());
    } catch (e) {}
  };

  const fetchUserAudios = async () => {
    if (!apiBase) return;
    try {
      const res = await fetch(`${apiBase}/api/ai/user-audios?tool=music`, {
        headers: { 'Authorization': getToken() as any, "User-Client": (global as any)?.clientId1328 }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.audios) && data.audios.length > 0) {
          const musicItems = data.audios
            .filter((a: any) => a.operation_type === 'music' || a.operation_type === 'music-generation' || (a.voiceBadge && a.voiceBadge.includes('موسيقى')))
            .map((a: any) => ({
              id: a.id,
              prompt: a.text,
              genre: 'Google Lyria 3',
              mood: a.dialect || 'ملهم',
              model: 'lyria-3',
              url: a.url,
              date: new Date(a.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
            }));
          if (musicItems.length > 0) {
            setHistory(musicItems);
            return;
          }
        }
      }
    } catch (e) {}

    if (typeof window !== 'undefined') {
      const savedHist = localStorage.getItem('nexus_lyria_music_history');
      if (savedHist) {
        try { setHistory(JSON.parse(savedHist)); } catch (e) {}
      }
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
          fetchUserAudios();
        }
      } catch (e) {}
    };
    init();
    return () => { cancelled = true; };
  }, []);

  const handleGenerateMusic = async () => {
    if (!prompt.trim()) {
      toast.error('يرجى كتابة وصف الأغنية أو المقطوعة الموسيقية');
      return;
    }

    if (!balance || balance.remaining_credits < creditsNeeded) {
      setShowUpgradeModal(true);
      return;
    }

    setIsGenerating(true);
    setGeneratedLyrics(null);
    try {
      const genreName = GENRES.find(g => g.id === selectedGenre)?.name || selectedGenre;
      const response = await fetch(`${apiBase}/api/ai/music`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getToken() as any,
          "User-Client": (global as any)?.clientId1328
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          lyrics: lyrics.trim() || undefined,
          genre: selectedGenre,
          mood: selectedMood,
          model: selectedModel,
          duration: selectedModel === 'lyria-3-pro-preview' ? 180 : 30
        })
      });

      const data = await response.json();
      if (data.success && data.audio_url) {
        setAudioUrl(data.audio_url);
        if (data.lyrics) {
          setGeneratedLyrics(data.lyrics);
        }
        toast.success(`✨ تم الانشاء بنجاح`);
        fetchBalance();

        const newItem: MusicHistoryItem = {
          id: Date.now(),
          prompt: prompt.trim(),
          genre: genreName,
          mood: selectedMood,
          model: selectedModel === 'lyria-3-pro-preview' ? 'Lyria 3 Pro' : 'Lyria 3 Clip',
          lyrics: data.lyrics,
          url: data.audio_url,
          date: new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
        };

        const updatedHistory = [newItem, ...history];
        setHistory(updatedHistory);
        localStorage.setItem('nexus_lyria_music_history', JSON.stringify(updatedHistory));
      } else {
        toast.error(data.message || 'فشل الانشاء ');
      }
    } catch (e) {
      toast.error('خطأ في الاتصال بالخادم');
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const togglePlayHistory = (item: MusicHistoryItem) => {
    if (!historyAudioRef.current) return;
    if (playingHistoryId === item.id) {
      historyAudioRef.current.pause();
      setPlayingHistoryId(null);
    } else {
      historyAudioRef.current.src = item.url;
      historyAudioRef.current.play();
      setPlayingHistoryId(item.id);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) {
      toast.error('اكتب وصفاً بسيطاً أولاً ليتم تحسينه وتوسيعه');
      return;
    }

    setIsEnhancing(true);
    try {
      const res = await fetch(`${apiBase}/api/ai/enhance-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getToken() as any,
          "User-Client": (global as any)?.clientId1328
        },
        body: JSON.stringify({ prompt, type: 'music' })
      });

      const data = await res.json();
      if (data.success && data.enhanced_prompt) {
        setPrompt(data.enhanced_prompt);
        toast.success('✨ تم تحسين الوصف بواسطة الذكاء الاصطناعي');
      } else {
        toast.error('فشل تحسين الوصف');
      }
    } catch (e) {
      toast.error('خطأ في الاتصال');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleDownload = async (url: string, name: string = 'nexus_lyria_song') => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${name}_${Date.now()}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success('تم تحميل ملف الأغنية MP3');
    } catch (e) {
      window.open(url, '_blank');
    }
  };

  const handleDeleteHistory = async (id: number) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem('nexus_lyria_music_history', JSON.stringify(updated));
    try {
      if (apiBase && id) {
        await fetch(`${apiBase}/api/ai/user-audios/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': getToken() as any, "User-Client": (global as any)?.clientId1328 }
        });
      }
    } catch (e) {}
    toast.success('تم حذف الأغنية من السجل');
  };

  const handleDeleteAllHistory = async () => {
    setHistory([]);
    localStorage.removeItem('nexus_lyria_music_history');
    if (apiBase) {
      await fetch(`${apiBase}/api/ai/user-audios?tool=music`, {
        method: 'DELETE',
        headers: { 'Authorization': getToken() as any, "User-Client": (global as any)?.clientId1328 }
      }).catch(() => undefined);
    }
    toast.success('تم مسح سجل الموسيقى');
  };

  const handleConfirmDelete = async () => {
    setIsDeletingModal(true);
    try {
      if (deleteModal.type === 'single' && deleteModal.id != null) await handleDeleteHistory(deleteModal.id);
      else if (deleteModal.type === 'all') await handleDeleteAllHistory();
      setDeleteModal({ isOpen: false, type: 'single', id: null });
    } finally {
      setIsDeletingModal(false);
    }
  };



  return (
    <>
      <Toaster position="top-right" />
      <audio ref={historyAudioRef} onEnded={() => setPlayingHistoryId(null)} className="hidden" />

      {/* Global Zero Scrollbars */}
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

      {/* Main Luxury Frame */}
      <div className="h-screen flex flex-col bg-[#06070B] text-[#dcdfe8] selection:bg-emerald-500/30 overflow-hidden font-sans" dir="rtl">
        
        {/* Studio Luxury Header */}
        <header className="shrink-0 z-50 bg-[#0B0D14] border-b border-white/[0.08] px-3.5 sm:px-6 py-2.5 flex flex-col md:flex-row gap-2.5 md:gap-0 justify-between items-stretch md:items-center">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 sm:gap-4">
              <Link 
                href="/ai" 
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#121520] hover:bg-[#161a27] border border-white/[0.08] transition-all font-semibold text-xs text-gray-300 hover:text-white"
              >
                <ArrowRight size={13} />
                <span className="hidden sm:inline">الرئيسية</span>
              </Link>
              
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold tracking-tight text-white">
                  استوديو الموسيقى
                </span>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-2 md:hidden">
              <div className="bg-[#121520] border border-white/[0.08] px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs">
                <CreditCard size={11} className="text-emerald-400" />
                <span className="font-bold text-white font-mono text-[11px]">{balance?.remaining_credits || 0}</span>
              </div>

              {currentView === 'studio' && (
                <button
                  onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-200 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
                >
                  <SlidersHorizontal size={12} />
                  <span>النمط والموديل</span>
                </button>
              )}
            </div>
          </div>

          {/* Segmented View Switcher with BorderBeam */}
          <div className="relative rounded-lg overflow-x-auto no-scrollbar bg-[#121520] border border-white/[0.08] p-1 flex items-center gap-1 shadow-md shrink-0">
            <BorderBeam size={50} duration={6} delay={0} colorFrom="#10b981" colorTo="#059669" borderWidth={1.5} borderRadius={8} className="z-50" />
            
            <button
              onClick={() => setCurrentView('studio')}
              className={`relative z-10 px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                currentView === 'studio'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              استوديو التأليف
            </button>

            <button
              onClick={() => setCurrentView('presets')}
              className={`relative z-10 px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                currentView === 'presets'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              أفكار وإلهام
            </button>

            <button
              onClick={() => setCurrentView('history')}
              className={`relative z-10 px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 ${
                currentView === 'history'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <span>سجل الأغاني</span>
              {history.length > 0 && (
                <span className="px-1.5 py-0.2 rounded bg-[#06070B] text-emerald-300 text-[10px] font-mono">
                  {history.length}
                </span>
              )}
            </button>
          </div>

          {/* Desktop Credits & Plan */}
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

        {/* VIEW 1: Main Studio */}
        {currentView === 'studio' && (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
            
            {/* Mobile Backdrop for Drawer */}
            {showMobileSidebar && (
              <div 
                onClick={() => setShowMobileSidebar(false)}
                className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm lg:hidden transition-opacity"
              />
            )}

            {/* Left Settings Sidebar (Slide-over drawer on mobile, static on desktop) */}
            <aside className={`fixed inset-y-0 right-0 z-50 lg:static lg:z-auto w-[85%] sm:w-[370px] lg:w-[370px] h-full lg:h-[calc(100vh-3.5rem)] border-l border-white/[0.08] bg-[#0B0D14] p-4 overflow-y-auto space-y-4 shrink-0 shadow-2xl transition-transform duration-300 ${
              showMobileSidebar ? 'translate-x-0' : 'translate-x-full lg:translate-x-0 hidden lg:block'
            }`}>
              
              {/* Drawer Mobile Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] lg:hidden">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <SlidersHorizontal size={13} className="text-emerald-400" />
                  <span>إعدادات النمط والنموذج</span>
                </span>
                <button 
                  onClick={() => setShowMobileSidebar(false)}
                  className="p-1.5 rounded-lg bg-[#121520] text-gray-400 hover:text-white"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Google Lyria Model Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white flex items-center gap-2">
                  <Sparkles size={13} className="text-emerald-400" />
                  <span>نموذج الذكاء الاصطناعي (Google AI)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedModel("lyria-3-clip-preview")}
                    className={`p-2.5 rounded-lg border text-right transition-all flex flex-col justify-between ${
                      selectedModel === 'lyria-3-clip-preview'
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-bold'
                        : 'bg-[#121520] border-white/[0.08] text-gray-400 hover:text-white hover:bg-[#161a27]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">Lyria 3 Clip</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">سريع (30s)</span>
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1">مقاطع وألحان قصيرة سريعة</span>
                  </button>

                  <button
                    onClick={() => setSelectedModel("lyria-3-pro-preview")}
                    className={`p-2.5 rounded-lg border text-right transition-all flex flex-col justify-between ${
                      selectedModel === 'lyria-3-pro-preview'
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-bold'
                        : 'bg-[#121520] border-white/[0.08] text-gray-400 hover:text-white hover:bg-[#161a27]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">Lyria 3 Pro</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">أغنية كاملة</span>
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1">توليد أغنية كاملة حتى 3 دقائق</span>
                  </button>
                </div>
              </div>

              {/* Genre Selection */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-white flex items-center gap-2">
                    <Disc size={13} className="text-emerald-400" />
                    <span>النمط الموسيقي</span>
                  </label>
                  <span className="text-[10px] text-emerald-300 font-mono">8 أنماط</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {GENRES.map((g) => {
                    const isSelected = selectedGenre === g.id;
                    const IconComp = g.icon;
                    return (
                      <div
                        key={g.id}
                        onClick={() => {
                          setSelectedGenre(g.id);
                          setShowMobileSidebar(false);
                        }}
                        className={`p-2.5 rounded-lg border transition-all cursor-pointer text-right flex flex-col justify-between ${
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-bold'
                            : 'bg-[#121520] border-white/[0.08] hover:bg-[#161a27]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isSelected ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
                            <IconComp size={13} className={isSelected ? 'text-emerald-300' : g.color} />
                          </div>
                          <span className={`text-[8px] px-1.5 py-0.2 rounded font-medium ${
                            isSelected
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-white/5 text-gray-400'
                          }`}>
                            {g.badge}
                          </span>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white tracking-tight">{g.name}</div>
                          <div className="text-[9px] text-gray-400 line-clamp-1 mt-0.5">{g.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mood Tags */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white flex items-center gap-2">
                  <Flame size={13} className="text-emerald-400" />
                  <span>طابع ومشاعِر العمل</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {MOODS.map((m) => {
                    const isSelected = selectedMood === m;
                    return (
                      <button
                        key={m}
                        onClick={() => setSelectedMood(m)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm font-bold'
                            : 'bg-[#121520] text-gray-400 border-white/[0.08] hover:text-white hover:bg-[#161a27]'
                        }`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Lyrics (Optional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                  <FileText size={12} className="text-emerald-400" />
                  <span>كلمات الأغنية (اختياري):</span>
                </label>
                <textarea
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  placeholder="اكتب كلمات أو أبيات الأغنية التي تريد من المغني غنائها..."
                  rows={3}
                  className="w-full bg-[#121520] border border-white/[0.08] rounded-lg p-2 text-xs text-white placeholder:text-gray-600 focus:border-emerald-500 outline-none resize-none"
                />
              </div>

            </aside>

            {/* Main Canvas */}
            <main className="flex-1 flex flex-col bg-[#06070B] p-3 sm:p-5 overflow-y-auto space-y-3 sm:space-y-4">
              
              {/* Mobile Active Quick Bar */}
              <div className="flex lg:hidden items-center justify-between p-2.5 rounded-lg bg-[#0B0D14] border border-white/[0.08] shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
                    <Music size={15} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">
                        {GENRES.find(g => g.id === selectedGenre)?.name || selectedGenre}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 font-medium">
                        {selectedModel === 'lyria-3-pro-preview' ? 'Lyria 3 Pro' : 'Lyria 3 Clip'}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400">{selectedMood}</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowMobileSidebar(true)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-200 hover:bg-emerald-600 hover:text-white text-xs font-semibold border border-emerald-500/30 transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
                >
                  <SlidersHorizontal size={11} />
                  <span>النمط والموديل</span>
                </button>
              </div>

              {/* Prompt Input Canvas */}
              <div className="flex-1 flex flex-col space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-gray-300 flex items-center gap-2">
                    <Sparkles size={13} className="text-emerald-400" />
                    <span>وصف وتفاصيل الأغنية أو اللحن</span>
                  </label>
                  <div className="flex items-center gap-2.5">
                    {prompt && (
                      <button
                        onClick={() => setPrompt("")}
                        className="text-[11px] text-gray-400 hover:text-rose-400 transition-colors"
                      >
                        مسح
                      </button>
                    )}
                    <span className="text-[11px] text-gray-500 font-mono bg-[#121520] px-2 py-0.5 rounded border border-white/[0.08]">
                      {prompt.length} / 1500 حرف
                    </span>
                  </div>
                </div>

                <div className="relative flex-1 min-h-[220px] rounded-xl bg-[#0B0D14] border border-white/[0.08] focus-within:border-emerald-500/80 transition-all p-4 flex flex-col justify-between shadow-sm">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="صف تفاصيل العمل الموسيقي... مثال: أغنية بوب عربية بطابع خليجي حماسي مع صوت نسائي وإيقاع حديث، مناسبة للاحتفالات والمناسبات السعيدة..."
                    maxLength={1500}
                    className="w-full flex-1 bg-transparent text-sm text-gray-100 placeholder:text-gray-600 outline-none resize-none leading-relaxed font-normal"
                  />

                  {/* Quick Preset Inspiration Chips */}
                  <div className="pt-3 border-t border-white/[0.08]">
                    <div className="text-[11px] font-semibold text-gray-400 mb-2">أفكار واستلهام سريع:</div>
                    <div className="flex flex-wrap gap-2">
                      {MUSIC_PROMPT_PRESETS.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setPrompt(item.prompt);
                            if (item.lyrics) setLyrics(item.lyrics);
                            toast.success(`تم اختيار "${item.title}"`);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#121520] hover:bg-[#161a27] border border-white/[0.08] text-[11px] font-medium text-gray-300 hover:text-white transition-all active:scale-95"
                        >
                          {item.title}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Audio Result Player Card */}
              {audioUrl && (
                <div className="p-4 rounded-xl bg-[#0B0D14] border border-white/[0.08] flex flex-col gap-3 shadow-lg">
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                  />

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 w-full sm:w-auto">
                      <button
                        onClick={togglePlay}
                        className="w-11 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-all shrink-0 shadow-md"
                      >
                        {isPlaying ? <Pause size={20} /> : <Play size={20} className="ms-0.5" />}
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">الأغنية جاهزة (Google Lyria 3)</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium">
                            {GENRES.find(g => g.id === selectedGenre)?.name || selectedGenre}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          جودة ستيريو عالية • SynthID معتمد • {selectedModel === 'lyria-3-pro-preview' ? 'أغنية كاملة' : 'مقطع 30 ثانية'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(audioUrl);
                          toast.success('تم نسخ الرابط');
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-[#121520] hover:bg-[#161a27] text-gray-300 hover:text-white text-xs font-semibold transition-all border border-white/[0.08]"
                      >
                        نسخ الرابط
                      </button>

                      <button
                        onClick={() => handleDownload(audioUrl, 'nexus_lyria_song')}
                        className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <Download size={13} />
                        <span>تحميل MP3</span>
                      </button>
                    </div>
                  </div>

                  {/* Lyrics / Song Structure Box */}
                  {generatedLyrics && (
                    <div className="p-3 rounded-lg bg-[#121520] border border-white/[0.08] text-xs text-gray-300 font-mono leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                      <div className="text-[10px] font-bold text-emerald-300 mb-1 flex items-center gap-1">
                        <AlignLeft size={11} /> بنية الأغنية والكلمات المتزامنة:
                      </div>
                      {generatedLyrics}
                    </div>
                  )}
                </div>
              )}

              {/* Main Bottom Action */}
              <div>
                <AIGenerateButton
                  onClick={handleGenerateMusic}
                  isGenerating={isGenerating}
                  disabled={!prompt.trim()}
                  cost={creditsNeeded}
                  label="إنشاء"
                  generatingLabel="جاري الإنشاء..."
                  icon={Music}
                  variant="emerald"
                />
              </div>

            </main>
          </div>
        )}

        {/* VIEW 2: Presets */}
        {currentView === 'presets' && (
          <main className="flex-1 bg-[#06070B] p-5 lg:p-7 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="p-4 rounded-xl bg-[#0B0D14] border border-white/[0.08] shadow-sm space-y-1">
                <div className="flex items-center gap-2">
                  <Compass size={16} className="text-emerald-400" />
                  <h2 className="text-sm font-bold text-white">مكتبة الأفكار والأنماط الغنائية الجاهزة (Google Lyria)</h2>
                </div>
                <p className="text-xs text-gray-400">
                  اختر أي نموذج غنائي لتطبيقه فوراً في الاستوديو وتخصيصه بكلماتك وألحانك
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MUSIC_PROMPT_PRESETS.map((preset, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-white/[0.08] bg-[#0B0D14] hover:border-emerald-500/50 transition-all space-y-2.5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Music size={13} className="text-emerald-400" />
                        <span>{preset.title}</span>
                      </span>
                      <button
                        onClick={() => {
                          setPrompt(preset.prompt);
                          if (preset.lyrics) setLyrics(preset.lyrics);
                          setCurrentView('studio');
                          toast.success(`تم تحميل "${preset.title}" في الاستوديو`);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-500/30 text-xs font-semibold transition-all"
                      >
                        استخدام النموذج
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 font-normal leading-relaxed">
                      {preset.prompt}
                    </p>
                    {preset.lyrics && (
                      <div className="p-2 rounded-lg bg-[#121520] border border-white/[0.08] text-[11px] text-emerald-300 font-mono">
                        كلمات: &quot;{preset.lyrics}&quot;
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </main>
        )}

        {/* VIEW 3: History */}
        {currentView === 'history' && (
          <main className="flex-1 bg-[#06070B] p-5 lg:p-7 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-white/[0.08]">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <History size={16} className="text-emerald-400" />
                    <span>سجل الأغاني السابقة (Google Lyria)</span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    استمع وحمّل كافة الأغاني والمقطوعات التي تم تأليفها بجودة MP3
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {history.length > 0 && (
                    <button
                      onClick={() => setDeleteModal({ isOpen: true, type: 'all', id: null })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition-all border border-red-500/20"
                      title="مسح كافة الأعمال الموسيقية"
                    >
                      <Trash2 size={13} />
                      <span>مسح السجل</span>
                    </button>
                  )}
                  <button
                    onClick={() => setCurrentView('studio')}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-sm"
                  >
                    انشاء جديد
                  </button>
                </div>
              </div>

              {history.length === 0 ? (
                <div className="py-16 text-center bg-[#0B0D14] rounded-xl border border-white/[0.08] space-y-2">
                  <p className="text-xs text-gray-400">لا توجد أعمال موسيقية محفوظة حالياً</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((item) => {
                    const isItemPlaying = playingHistoryId === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isItemPlaying 
                            ? 'bg-emerald-950/20 border-emerald-500/70 shadow-sm' 
                            : 'bg-[#0B0D14] border-white/[0.08] hover:border-white/20'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-3 w-full sm:w-auto">
                            <button
                              onClick={() => togglePlayHistory(item)}
                              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                                isItemPlaying
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-[#121520] text-emerald-300 hover:bg-emerald-600 hover:text-white border border-white/[0.08]'
                              }`}
                            >
                              {isItemPlaying ? <Pause size={15} /> : <Play size={15} className="ms-0.5" />}
                            </button>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-white">{item.genre}</span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                                  {item.model}
                                </span>
                                <span className="text-[10px] text-gray-500 font-mono">
                                  {item.date}
                                </span>
                              </div>
                              <p className="text-xs text-gray-300 max-w-xl font-normal line-clamp-1">
                                {item.prompt}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                            <button
                              onClick={() => {
                                setPrompt(item.prompt);
                                if (item.lyrics) setLyrics(item.lyrics);
                                setCurrentView('studio');
                                toast.success('تم تحميل الوصف في الاستوديو');
                              }}
                              className="p-1.5 px-2.5 rounded-lg bg-[#121520] hover:bg-[#161a27] text-gray-300 hover:text-white text-xs font-medium transition-all border border-white/[0.08] flex items-center gap-1.5"
                              title="إعادة استخدام"
                            >
                              <RotateCcw size={12} />
                              <span className="hidden sm:inline">إعادة استخدام</span>
                            </button>

                            <button
                              onClick={() => handleDownload(item.url, item.genre)}
                              className="p-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                            >
                              <Download size={12} />
                              <span>تحميل MP3</span>
                            </button>

                            <button
                              onClick={() => setDeleteModal({ isOpen: true, type: 'single', id: item.id })}
                              className="p-1.5 rounded-lg bg-rose-950/20 hover:bg-rose-600 text-rose-400 hover:text-white transition-all border border-rose-500/20"
                              title="حذف"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </main>
        )}

        {/* Upgrade Modal */}
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          currentPlan={balance?.plan_name || 'مجاني'}
          requiredCredits={creditsNeeded}
          currentCredits={balance?.remaining_credits || 0}
        />
      </div>
      <AIDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmDelete}
        type={deleteModal.type}
        itemType="مقطع موسيقي"
        isDeleting={isDeletingModal}
      />
    </>
  );
}
