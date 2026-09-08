"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { toast, Toaster } from "react-hot-toast";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { 
  ArrowRight, Mic, Play, Pause, Download, Volume2,
  CreditCard, RefreshCw, Check, ChevronDown,
  X, Upload, CheckCircle2, Copy, Trash2, History, RotateCcw,
  Sparkles, Sliders, StopCircle, Radio, UserCheck, AudioLines, FileAudio,
  SlidersHorizontal, Menu
} from "lucide-react";
import { BorderBeam } from "@/components/ui/border-beam";
import UpgradeModal from "@/components/Modals/UpgradeModal";
import { AIGenerateButton, AIDeleteModal } from "@/components/ai";
import { useAiPricing } from '@/hooks/useAiPricing';

interface ClonedVoiceItem {
  id: string;
  name: string;
  date: string;
  sampleName: string;
  audioSampleBase64: string;
  gender: 'male' | 'female';
}

interface HistoryItem {
  id: number;
  text: string;
  voiceName: string;
  voiceBadge: string;
  url: string;
  date: string;
}

const QUICK_PROMPTS = [
  {
    title: 'إعلان تسويقي حماسي',
    text: 'أهلاً بكم في الجيل الجديد من الذكاء الاصطناعي الصوتي. حلول مبتكرة تمنحك الأسبقية والتميز في عالم الأعمال الرقمي.'
  },
  {
    title: 'مقدمة بودكاست رسمي',
    text: 'مرحباً بكم مستمعينا الأعزاء في حلقة جديدة من البودكاست. سنناقش اليوم أهم التحولات والتقنيات التي تعيد تشكيل المستقبل.'
  },
  {
    title: 'رسالة ترحيب احترافية',
    text: 'شكراً لتواصلكم معنا. نحن سعداء جداً بخدمتكم ونتطلع لتقديم أفضل تجربة دعم تلبي كافة تطلعاتكم واحتياجاتكم.'
  },
  {
    title: 'سرد وثائقي مهيب',
    text: 'في أعماق التاريخ، حيث تتشابك الحقائق مع الأساطير، تروي الآثار القديمة قصصاً عن حضارات صنعت مجد الإنسانية عبر العصور.'
  }
];

export default function VoiceClonePage() {
  const [text, setText] = useState("");
  const [audioSample, setAudioSample] = useState<string | null>(null);
  const [sampleFileName, setSampleFileName] = useState<string | null>(null);
  const [voiceName, setVoiceName] = useState("بروفايل صوتي مطابق");
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [speed, setSpeed] = useState(1.0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [balance, setBalance] = useState<any>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Navigation: 'studio' | 'saved_voices' | 'history'
  const [currentView, setCurrentView] = useState<'studio' | 'saved_voices' | 'history'>('studio');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Mic Direct Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Sample Preview State
  const [isSamplePlaying, setIsSamplePlaying] = useState(false);
  const sampleAudioRef = useRef<HTMLAudioElement>(null);

  // Saved Cloned Voices & History
  const [savedVoices, setSavedVoices] = useState<ClonedVoiceItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; type: 'single' | 'all'; id?: number | null }>({ isOpen: false, type: 'single', id: null });
  const [isDeletingModal, setIsDeletingModal] = useState(false);
  const [playingHistoryId, setPlayingHistoryId] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const historyAudioRef = useRef<HTMLAudioElement>(null);
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL, []);
  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem("a") : null;

  const { operationPrice } = useAiPricing();
  const creditsNeeded = operationPrice('voice-clone', 8);

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
      const res = await fetch(`${apiBase}/api/ai/user-audios?tool=voice-clone`, {
        headers: { 'Authorization': getToken() as any, "User-Client": (global as any)?.clientId1328 }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.audios) && data.audios.length > 0) {
          const cloneItems = data.audios
            .filter((a: any) => a.voiceBadge === 'مطابقة نبرة' || (a.operation_type && a.operation_type === 'voice-clone'))
            .map((a: any) => ({
              id: a.id,
              text: a.text,
              voiceName: a.voiceName || 'صوت مطابق',
              voiceBadge: 'مطابقة نبرة',
              url: a.url,
              date: new Date(a.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
            }));
          if (cloneItems.length > 0) {
            setHistory(cloneItems);
            return;
          }
        }
      }
    } catch (e) {}

    if (typeof window !== 'undefined') {
      const savedHist = localStorage.getItem('nexus_clone_history');
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

          if (typeof window !== 'undefined') {
            const voices = localStorage.getItem('nexus_custom_cloned_voices');
            if (voices) {
              try { setSavedVoices(JSON.parse(voices)); } catch (e) {}
            }
          }
        }
      } catch (e) {}
    };
    init();
    return () => { cancelled = true; };
  }, []);

  // Handle File Upload
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast.error('يرجى رفع ملف صوتي صالح (MP3, WAV, M4A)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('حجم الملف الصوتي كبير جداً (الحد الأقصى 10MB)');
      return;
    }

    setSampleFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setAudioSample(event.target?.result as string);
      toast.success('تم تحميل العينة المرجعية بنجاح');
    };
    reader.readAsDataURL(file);
  };

  // Direct Mic Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioSample(reader.result as string);
          setSampleFileName(`تسجيل_مباشر_${new Date().toLocaleTimeString('ar-EG')}.mp3`);
          toast.success('تم إنهاء التسجيل واستخراج العينة');
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      toast.error('يرجى السماح بصلاحية الميكروفون في المتصفح');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // Clone Execution
  const handleCloneAndSpeak = async () => {
    if (!audioSample) {
      toast.error('يرجى رفع أو تسجيل عينة صوتية (10 إلى 30 ثانية)');
      return;
    }

    if (!text.trim()) {
      toast.error('يرجى كتابة النص المطلوب نطقه بالصوت');
      return;
    }

    if (!balance || balance.remaining_credits < creditsNeeded) {
      setShowUpgradeModal(true);
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`${apiBase}/api/ai/voice-clone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getToken() as any,
          "User-Client": (global as any)?.clientId1328
        },
        body: JSON.stringify({
          audio_sample: audioSample,
          text: text.trim(),
          voice_name: voiceName.trim() || 'صوت مطابق'
        })
      });

      const data = await response.json();
      if (data.success && data.audio_url) {
        setAudioUrl(data.audio_url);
        toast.success(`تمت مطابقة النبرة وإنتاج النطق بنجاح`);
        fetchBalance();

        // Save Voice Profile
        const newVoiceProfile: ClonedVoiceItem = {
          id: `clone_${Date.now()}`,
          name: voiceName.trim() || 'صوت مطابق',
          date: new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }),
          sampleName: sampleFileName || 'عينة صوتية',
          audioSampleBase64: audioSample,
          gender: gender
        };
        const updatedVoices = [newVoiceProfile, ...savedVoices.filter(v => v.name !== newVoiceProfile.name)];
        setSavedVoices(updatedVoices);
        localStorage.setItem('nexus_custom_cloned_voices', JSON.stringify(updatedVoices));

        // Save to History
        const newItem: HistoryItem = {
          id: Date.now(),
          text: text.trim(),
          voiceName: voiceName.trim() || 'صوت مطابق',
          voiceBadge: 'مطابقة نبرة',
          url: data.audio_url,
          date: new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
        };

        const updatedHistory = [newItem, ...history];
        setHistory(updatedHistory);
        localStorage.setItem('nexus_clone_history', JSON.stringify(updatedHistory));
      } else {
        toast.error(data.message || 'فشلت مطابقة النبرة الصوتية');
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

  const togglePlaySample = () => {
    if (!sampleAudioRef.current) return;
    if (isSamplePlaying) {
      sampleAudioRef.current.pause();
      setIsSamplePlaying(false);
    } else {
      sampleAudioRef.current.play();
      setIsSamplePlaying(true);
    }
  };

  const togglePlayHistory = (item: HistoryItem) => {
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

  const handleDownload = async (url: string, name: string = 'nexus_cloned_voice') => {
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
      toast.success('تم تحميل ملف MP3');
    } catch (e) {
      window.open(url, '_blank');
    }
  };

  const handleDeleteHistory = async (id: number) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem('nexus_clone_history', JSON.stringify(updated));
    try {
      if (apiBase && id) {
        await fetch(`${apiBase}/api/ai/user-audios/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': getToken() as any, "User-Client": (global as any)?.clientId1328 }
        });
      }
    } catch (e) {}
    toast.success('تم حذف التسجيل');
  };

  const handleDeleteAllHistory = async () => {
    setHistory([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nexus_clone_history');
      localStorage.removeItem('nexus_voice_clone_history');
    }
    try {
      if (apiBase) {
        await fetch(`${apiBase}/api/ai/user-audios?tool=voice-clone`, {
          method: 'DELETE',
          headers: { 'Authorization': getToken() as any, "User-Client": (global as any)?.clientId1328 }
        });
      }
    } catch (e) {}
    toast.success('تم حذف جميع التسجيلات من السجل');
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
const handleDeleteSavedVoice = (id: string) => {
    const updated = savedVoices.filter(v => v.id !== id);
    setSavedVoices(updated);
    localStorage.setItem('nexus_custom_cloned_voices', JSON.stringify(updated));
    toast.success('تم حذف الصوت المحفوظ');
  };

  return (
    <>
      <Toaster position="top-right" />
      <audio ref={historyAudioRef} onEnded={() => setPlayingHistoryId(null)} className="hidden" />

      {/* Global CSS for Zero Scrollbars */}
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
        
        {/* Luxury Studio Header */}
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
                  استوديو مطابقة النبرة الصوتية
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
                  <span>الإعدادات</span>
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
              استوديو المطابقة
            </button>

            <button
              onClick={() => setCurrentView('saved_voices')}
              className={`relative z-10 px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 ${
                currentView === 'saved_voices'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <span>بروفايلاتي الصوتية</span>
              {savedVoices.length > 0 && (
                <span className="px-1.5 py-0.2 rounded bg-[#06070B] text-emerald-300 text-[10px] font-mono">
                  {savedVoices.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setCurrentView('history')}
              className={`relative z-10 px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 ${
                currentView === 'history'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <span>السجل والإنتاج</span>
              {history.length > 0 && (
                <span className="px-1.5 py-0.2 rounded bg-[#06070B] text-emerald-300 text-[10px] font-mono">
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

            {/* Sidebar: Voice Reference & Profile (Slide-over drawer on mobile, static on desktop) */}
            <aside className={`fixed inset-y-0 right-0 z-50 lg:static lg:z-auto w-[85%] sm:w-[360px] lg:w-[360px] h-full lg:h-[calc(100vh-3.5rem)] border-l border-white/[0.08] bg-[#0B0D14] p-4 overflow-y-auto space-y-4 shrink-0 shadow-2xl transition-transform duration-300 ${
              showMobileSidebar ? 'translate-x-0' : 'translate-x-full lg:translate-x-0 hidden lg:block'
            }`}>
              
              {/* Drawer Mobile Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] lg:hidden">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <SlidersHorizontal size={13} className="text-emerald-400" />
                  <span>إعدادات العينة ومطابقة النبرة</span>
                </span>
                <button 
                  onClick={() => setShowMobileSidebar(false)}
                  className="p-1.5 rounded-lg bg-[#121520] text-gray-400 hover:text-white"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="space-y-1">
                <h2 className="text-xs font-bold text-white flex items-center gap-2">
                  <UserCheck size={14} className="text-emerald-400" />
                  <span>بيانات العينة الصوتية</span>
                </h2>
                <p className="text-[11px] text-gray-400">
                  ارفع مقطعاً صوتياً واضحاً أو سجّل نبرتك مباشرة لتحليل طبقات الصوت.
                </p>
              </div>

              {/* Upload or Record Container */}
              <div className="space-y-2">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`border border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                    audioSample 
                      ? 'border-emerald-500/80 bg-emerald-500/10' 
                      : 'border-white/[0.08] hover:border-emerald-500/50 bg-[#121520] hover:bg-[#161a27]'
                  }`}
                >
                  {audioSample ? (
                    <div className="flex flex-col items-center gap-1.5">
                      <CheckCircle2 size={22} className="text-emerald-400" />
                      <span className="text-xs font-bold text-white truncate max-w-[240px]">
                        {sampleFileName || 'تم تجهيز العينة الصوتية'}
                      </span>
                      <span className="text-[10px] text-emerald-300 underline font-medium">
                        انقر لتغيير الملف المرفوع
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 py-1">
                      <FileAudio size={22} className="text-gray-400" />
                      <span className="text-xs font-semibold text-gray-200">
                        اختر ملفاً صوتياً (MP3, WAV, M4A)
                      </span>
                      <span className="text-[10px] text-gray-500">
                        مدة مثالية: من 10 إلى 30 ثانية
                      </span>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />

                {/* Direct Mic Record Button */}
                <div className="flex items-center gap-2">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="w-full py-2 rounded-lg bg-[#121520] hover:bg-[#161a27] border border-white/[0.08] text-xs font-semibold text-gray-300 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <Mic size={13} className="text-rose-400" />
                      <span>تسجيل عينة مباشرة عبر الميكروفون</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="w-full py-2 rounded-lg bg-rose-950/50 border border-rose-500/60 text-rose-300 text-xs font-bold transition-all flex items-center justify-center gap-2 animate-pulse"
                    >
                      <StopCircle size={14} className="text-rose-400" />
                      <span>إيقاف التسجيل ({recordingSeconds} ثانية)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Sample Audio Preview Player */}
              {audioSample && (
                <div className="p-3 rounded-xl bg-[#121520] border border-white/[0.08] flex items-center justify-between gap-3">
                  <audio 
                    ref={sampleAudioRef} 
                    src={audioSample} 
                    onEnded={() => setIsSamplePlaying(false)} 
                    className="hidden" 
                  />
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={togglePlaySample}
                      className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-all shadow-sm shrink-0"
                    >
                      {isSamplePlaying ? <Pause size={14} /> : <Play size={14} className="ms-0.5" />}
                    </button>
                    <div>
                      <div className="text-xs font-bold text-white">معاينة العينة المرجعية</div>
                      <div className="text-[10px] text-gray-400">تأكد من وضوح ونقاء الصوت</div>
                    </div>
                  </div>
                  <button
                    onClick={() => { setAudioSample(null); setSampleFileName(null); }}
                    className="text-gray-400 hover:text-rose-400 p-1 transition-colors"
                    title="حذف العينة"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}

              {/* Voice Label Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">اسم الصوت المستعار</label>
                <input
                  type="text"
                  value={voiceName}
                  onChange={(e) => setVoiceName(e.target.value)}
                  placeholder="مثال: صوتي الرسمي أو صوت أحمد الإذاعي"
                  className="w-full bg-[#121520] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder:text-gray-600 focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Gender Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">نوع الصوت التقريبي</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setGender('male')}
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      gender === 'male'
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-bold'
                        : 'bg-[#121520] border-white/[0.08] text-gray-400 hover:text-white hover:bg-[#161a27]'
                    }`}
                  >
                    ذكر (Male)
                  </button>
                  <button
                    onClick={() => setGender('female')}
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      gender === 'female'
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-bold'
                        : 'bg-[#121520] border-white/[0.08] text-gray-400 hover:text-white hover:bg-[#161a27]'
                    }`}
                  >
                    أنثى (Female)
                  </button>
                </div>
              </div>

              {/* Speed Slider */}
              <div className="p-3 rounded-xl bg-[#121520] border border-white/[0.08] space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                    <Sliders size={12} className="text-emerald-400" />
                    <span>سرعة النطق:</span>
                  </label>
                  <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{speed}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-[#252838] rounded appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

            </aside>

            {/* Main Canvas */}
            <main className="flex-1 flex flex-col bg-[#06070B] p-3 sm:p-5 overflow-y-auto space-y-3 sm:space-y-4">
              
              {/* Mobile Active Quick Bar */}
              <div className="flex lg:hidden items-center justify-between p-2.5 rounded-lg bg-[#0B0D14] border border-white/[0.08] shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
                    <Mic size={15} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">{voiceName}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 font-medium">بصمة صوتية</span>
                    </div>
                    <span className="text-[10px] text-gray-400">
                      {audioSample ? 'تم تجهيز العينة' : 'بانتظار العينة'} • سرعة {speed}x
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowMobileSidebar(true)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-200 hover:bg-emerald-600 hover:text-white text-xs font-semibold border border-emerald-500/30 transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
                >
                  <SlidersHorizontal size={11} />
                  <span>الإعدادات</span>
                </button>
              </div>

              {/* Text Input Canvas */}
              <div className="flex-1 flex flex-col space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-gray-300 flex items-center gap-2">
                    <Sparkles size={13} className="text-emerald-400" />
                    <span>النص المراد نطقه بأقرب صوت مطابق</span>
                  </label>
                  <div className="flex items-center gap-3">
                    {text && (
                      <button
                        onClick={() => setText("")}
                        className="text-[11px] text-gray-400 hover:text-rose-400 transition-colors"
                      >
                        مسح النص
                      </button>
                    )}
                    <span className="text-[11px] text-gray-500 font-mono bg-[#121520] px-2 py-0.5 rounded border border-white/[0.08]">
                      {text.length} / 5000 حرف
                    </span>
                  </div>
                </div>

                <div className="relative flex-1 min-h-[260px] rounded-xl bg-[#0B0D14] border border-white/[0.08] focus-within:border-emerald-500/80 transition-all p-4 flex flex-col justify-between shadow-sm">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="اكتب النص الذي تريد نطقه بأقرب صوت جاهز إلى نبرة العينة المرجعية..."
                    maxLength={5000}
                    className="w-full flex-1 bg-transparent text-sm text-gray-100 placeholder:text-gray-600 outline-none resize-none leading-relaxed font-normal"
                  />

                  {/* Suggestions Chips */}
                  <div className="pt-3.5 border-t border-white/[0.08]">
                    <div className="text-[11px] font-semibold text-gray-400 mb-2">نماذج ونصوص مقترحة سريعة:</div>
                    <div className="flex flex-wrap gap-2">
                      {QUICK_PROMPTS.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setText(item.text);
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
                <div className="p-3.5 rounded-xl bg-[#0B0D14] border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                  />

                  <div className="flex items-center gap-3.5 w-full sm:w-auto">
                    <button
                      onClick={togglePlay}
                      className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-all shrink-0 shadow-md"
                    >
                      {isPlaying ? <Pause size={18} /> : <Play size={18} className="ms-0.5" />}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">الملف الصوتي المطابق جاهز</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium">
                          {voiceName} (بصمة صوتية)
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        ملف MP3 عالي النقاء • سرعة {speed}x
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
                      onClick={() => handleDownload(audioUrl, voiceName)}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <Download size={13} />
                      <span>تحميل MP3</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Main Bottom Generate Action */}
              <div>
                <AIGenerateButton
                  onClick={handleCloneAndSpeak}
                  isGenerating={isGenerating}
                  disabled={!audioSample || !text.trim()}
                  cost={creditsNeeded}
                  label="مطابقة النبرة ونطق النص"
                  generatingLabel="جاري تحليل النبرة واختيار أقرب صوت وتوليد النطق..."
                  icon={Mic}
                  variant="emerald"
                />
              </div>

            </main>
          </div>
        )}

        {/* VIEW 2: Saved Cloned Voices */}
        {currentView === 'saved_voices' && (
          <main className="flex-1 bg-[#06070B] p-5 lg:p-7 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-white/[0.08]">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <UserCheck size={16} className="text-emerald-400" />
                    <span>مكتبة البروفايلات الصوتية المطابقة</span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    البروفايلات المحفوظة التي تمت مطابقتها مع أصوات جاهزة مسبقاً
                  </p>
                </div>
                <button
                  onClick={() => setCurrentView('studio')}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-sm"
                >
                  مطابقة صوت جديد
                </button>
              </div>

              {savedVoices.length === 0 ? (
                <div className="py-16 text-center bg-[#0B0D14] rounded-xl border border-white/[0.08] space-y-2">
                  <p className="text-xs text-gray-400">لا توجد بصمات صوتية محفوظة حتى الآن</p>
                  <button
                    onClick={() => setCurrentView('studio')}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all mt-1 shadow-sm"
                  >
                    طابق أول نبرة صوتية لك
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {savedVoices.map((voice) => (
                    <div
                      key={voice.id}
                      className="p-3.5 rounded-xl border border-white/[0.08] bg-[#0B0D14] hover:border-emerald-500/50 transition-all flex items-center justify-between gap-3 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                          <Mic size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{voice.name}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                              {voice.gender === 'female' ? 'أنثى' : 'ذكر'}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[180px]">
                            {voice.sampleName} • {voice.date}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setAudioSample(voice.audioSampleBase64);
                            setVoiceName(voice.name);
                            setSampleFileName(voice.sampleName);
                            setCurrentView('studio');
                            toast.success(`تم اختيار "${voice.name}" للاستخدام`);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-500/30 text-xs font-semibold transition-all"
                        >
                          استخدام
                        </button>
                        <button
                          onClick={() => handleDeleteSavedVoice(voice.id)}
                          className="p-1.5 rounded-lg bg-rose-950/20 hover:bg-rose-600 text-rose-400 hover:text-white transition-all border border-rose-500/20"
                          title="حذف"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                    <span>سجل التسجيلات المطابقة</span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    استمع وحمّل المقاطع الصوتية التي أنشأتها بأصوات مطابقة سابقاً
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {history.length > 0 && (
                    <button
                      onClick={() => setDeleteModal({ isOpen: true, type: 'all', id: null })}
                      className="px-3 py-1.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <Trash2 size={13} />
                      <span>مسح السجل</span>
                    </button>
                  )}
                  <button
                    onClick={() => setCurrentView('studio')}
                    className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-sm"
                  >
                    مطابقة جديدة
                  </button>
                </div>
              </div>

              {history.length === 0 ? (
                <div className="py-16 text-center bg-[#0B0D14] rounded-xl border border-white/[0.08] space-y-2">
                  <p className="text-xs text-gray-400">لا توجد تسجيلات مطابقة محفوظة حالياً</p>
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
                                <span className="text-xs font-bold text-white">{item.voiceName}</span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                                  بصمة صوتية
                                </span>
                                <span className="text-[10px] text-gray-500 font-mono">
                                  {item.date}
                                </span>
                              </div>
                              <p className="text-xs text-gray-300 max-w-xl font-normal line-clamp-1">
                                {item.text}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                            <button
                              onClick={() => {
                                setText(item.text);
                                setCurrentView('studio');
                                toast.success('تم تحميل النص في الاستوديو');
                              }}
                              className="p-1.5 px-2.5 rounded-lg bg-[#121520] hover:bg-[#161a27] text-gray-300 hover:text-white text-xs font-medium transition-all border border-white/[0.08] flex items-center gap-1.5"
                              title="إعادة استخدام النص"
                            >
                              <RotateCcw size={12} />
                              <span className="hidden sm:inline">إعادة استخدام</span>
                            </button>

                            <button
                              onClick={() => handleDownload(item.url, item.voiceName)}
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
        itemType="تسجيل صوتي"
        isDeleting={isDeletingModal}
      />
    </>
  );
}
