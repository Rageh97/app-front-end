"use client";

import React, { useEffect, useState, useRef } from "react";
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  Calendar, 
  Film, 
  Image as ImageIcon,
  Trash2,
  Globe,
  Share2,
  Loader2,
  Maximize2
} from "lucide-react";
import { toast } from "react-hot-toast";

export interface AIResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string | null;
  mediaType?: "image" | "video";
  title?: string;
  subtitle?: string;
  prompt?: string;
  details?: { label: string; value: string }[];
  timestamp?: string;
  creditsUsed?: number;
  // Dynamic actions
  mediaId?: number | string;
  isPublic?: boolean;
  onTogglePublic?: (isPublic: boolean) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  onDownload?: () => Promise<void> | void;
}

/**
 * Direct file download without opening a new tab or window
 */
export const downloadMediaDirectly = async (url: string, filename: string) => {
  if (!url) return;
  const toastId = toast.loading("جاري تجهيز الملف للتحميل...");
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Fetch failed");
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(blobUrl);
    document.body.removeChild(a);
    toast.success("تم التحميل بنجاح!", { id: toastId });
  } catch (error) {
    try {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.target = "_self";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("تم بدء التحميل!", { id: toastId });
    } catch (e) {
      toast.error("فشل تحميل الملف، يرجى المحاولة لاحقاً", { id: toastId });
    }
  }
};

export const AIResultModal: React.FC<AIResultModalProps> = ({
  isOpen,
  onClose,
  mediaUrl,
  mediaType = "image",
  title = "نتيجة المعالجة بالذكاء الاصطناعي",
  subtitle,
  prompt,
  details = [],
  timestamp,
  creditsUsed,
  mediaId,
  isPublic = false,
  onTogglePublic,
  onDelete,
  onDownload,
}) => {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPublicState, setIsPublicState] = useState(isPublic);
  const [isTogglingPublic, setIsTogglingPublic] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleToggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else if (video.requestFullscreen) {
      video.requestFullscreen();
    } else if ((video as any).webkitRequestFullscreen) {
      (video as any).webkitRequestFullscreen();
    }
  };

  useEffect(() => {
    setIsPublicState(isPublic);
    setConfirmDelete(false);
  }, [isPublic, mediaUrl, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mediaUrl) return null;

  const isVideo = mediaType === "video" || mediaUrl.match(/\.(mp4|webm|mov)(\?.*)?$/i);
  const defaultFilename = `nexus-ai-${Date.now()}.${isVideo ? "mp4" : "png"}`;

  const handleDownload = async () => {
    if (onDownload) {
      await onDownload();
      return;
    }
    setIsDownloading(true);
    await downloadMediaDirectly(mediaUrl, defaultFilename);
    setIsDownloading(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(mediaUrl);
    setCopied(true);
    toast.success("تم نسخ الرابط المباشر للملف!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("تم نسخ النص بنجاح!");
  };

  const handleToggleGallery = async () => {
    setIsTogglingPublic(true);
    const targetStatus = !isPublicState;
    try {
      if (onTogglePublic) {
        await onTogglePublic(targetStatus);
        setIsPublicState(targetStatus);
      } else if (mediaId) {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const token = typeof window !== 'undefined' ? (localStorage.getItem("a") || localStorage.getItem("token")) : null;
        const userClient = typeof window !== 'undefined' ? (global as any)?.clientId1328 || localStorage.getItem('clientId1328') : undefined;

        const res = await fetch(`${apiBase}/api/ai/toggle-public`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token || '',
            'User-Client': userClient || '',
          },
          body: JSON.stringify({
            id: Number(mediaId),
            is_public: targetStatus,
            type: isVideo ? 'video' : 'image',
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'تعذر تحديث حالة النشر');
        }
        setIsPublicState(targetStatus);
        toast.success(targetStatus ? 'تمت إضافة النتيجة إلى معرض المحترفين بنجاح!' : 'تمت إزالة النتيجة من المعرض');
      } else {
        setIsPublicState(targetStatus);
        toast.success(targetStatus ? 'تمت إضافة النتيجة إلى المعرض' : 'تمت الإزالة من المعرض');
      }
    } catch (err: any) {
      toast.error(err?.message || 'تعذر تحديث حالة المعرض');
    } finally {
      setIsTogglingPublic(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete();
        toast.success("تم حذف النتيجة بنجاح");
        onClose();
      } else if (mediaId) {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const token = typeof window !== 'undefined' ? (localStorage.getItem("a") || localStorage.getItem("token")) : null;
        const userClient = typeof window !== 'undefined' ? (global as any)?.clientId1328 || localStorage.getItem('clientId1328') : undefined;

        const res = await fetch(`${apiBase}/api/ai/user-${isVideo ? 'videos' : 'images'}/${mediaId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': token || '',
            'User-Client': userClient || '',
          },
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'تعذر حذف النتيجة');
        }
        toast.success("تم حذف النتيجة بنجاح");
        onClose();
      } else {
        toast.success("تم حذف النتيجة");
        onClose();
      }
    } catch (err: any) {
      toast.error(err?.message || 'فشل حذف النتيجة');
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
      dir="rtl"
    >
      {/* Modal Container */}
      <div 
        className="relative w-full max-w-5xl max-h-[90vh] bg-[#0A0C13] border border-white/[0.1] rounded-lg shadow-2xl flex flex-col md:flex-row overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 left-3 z-30 p-1.5 rounded-md bg-black/60 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 backdrop-blur-md transition-colors active:scale-95"
          title="إغلاق (Esc)"
        >
          <X size={17} />
        </button>

        {/* ─── Media Preview Area (Left in RTL) ─── */}
        <div className="flex-1 min-h-[320px] sm:min-h-[440px] max-h-[70vh] md:max-h-[90vh] bg-[#05060A] flex items-center justify-center p-2 sm:p-5 relative overflow-hidden group">
          {isVideo ? (
            <video
              ref={videoRef}
              src={mediaUrl}
              controls
              autoPlay
              loop
              playsInline
              className="w-auto h-auto max-w-full max-h-[66vh] md:max-h-[85vh] rounded-md object-contain shadow-2xl transition-all"
            />
          ) : (
            <img
              src={mediaUrl}
              alt={title}
              className="w-auto h-auto max-w-full max-h-[66vh] md:max-h-[85vh] rounded-md object-contain shadow-2xl"
            />
          )}

          {/* Top Controls Badge & Fullscreen */}
          <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/70 border border-white/10 backdrop-blur-md text-[10px] font-bold text-emerald-400 shadow-sm">
              {isVideo ? <Film size={12} /> : <ImageIcon size={12} />}
              <span>{isVideo ? "فيديو فائق الدقة" : "صورة عالية الجودة"}</span>
            </div>
            {isVideo && (
              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-black/75 hover:bg-emerald-600 text-white border border-white/15 backdrop-blur-md text-[10px] font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                title="عرض بكامل أبعاد الشاشة (Fullscreen)"
              >
                <Maximize2 size={12} />
                <span>ملء الشاشة</span>
              </button>
            )}
          </div>
        </div>

        {/* ─── Details & Actions Sidebar (Right in RTL) ─── */}
        <div className="w-full md:w-[320px] lg:w-[350px] bg-[#0A0C13] border-t md:border-t-0 md:border-r border-white/[0.08] p-4 sm:p-5 flex flex-col justify-between shrink-0 overflow-y-auto no-scrollbar">
          
          <div className="space-y-3.5">
            {/* Title & Subtitle */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Sparkles size={11} />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                  {title}
                </h3>
              </div>
              {subtitle && (
                <p className="text-[11px] text-slate-400 leading-relaxed mr-7 line-clamp-2">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Prompt Box (if applicable) */}
            {prompt && (
              <div className="p-2.5 rounded-md bg-[#10131e] border border-white/[0.07] space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                  <span>الوصف:</span>
                  <button
                    onClick={() => handleCopyPrompt(prompt)}
                    className="hover:text-emerald-400 transition-colors flex items-center gap-1"
                  >
                    <Copy size={10} />
                    <span>نسخ</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-200 leading-relaxed max-h-20 overflow-y-auto no-scrollbar select-text">
                  {prompt}
                </p>
              </div>
            )}

            {/* Structured Details Grid */}
            {details.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5">
                {details.map((item, idx) => (
                  <div key={idx} className="p-2 rounded-md bg-[#10131e] border border-white/[0.07] text-right">
                    <span className="text-[10px] text-slate-500 block font-medium">{item.label}</span>
                    <span className="text-[11px] font-bold text-white truncate block mt-0.5">{item.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Metadata (Time & Credits) */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-white/[0.06]">
              {timestamp && (
                <div className="flex items-center gap-1">
                  <Calendar size={11} />
                  <span>{timestamp}</span>
                </div>
              )}
              {creditsUsed !== undefined && (
                <span className="text-emerald-400 font-mono font-bold">
                  {creditsUsed} رصيد
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons Group */}
          <div className="pt-3.5 border-t border-white/[0.08] space-y-2 mt-3.5">
            {/* Primary Download Button */}
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full py-2 px-3 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              <Download size={14} />
              <span>{isDownloading ? "جاري التحميل..." : "تحميل مباشر إلى جهازك"}</span>
            </button>

            {/* Add to Gallery Button */}
            <button
              onClick={handleToggleGallery}
              disabled={isTogglingPublic}
              className={`w-full py-2 px-3 rounded-md text-xs font-semibold border transition-all flex items-center justify-center gap-2 active:scale-98 ${
                isPublicState
                  ? "bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-300"
                  : "bg-[#121522] hover:bg-[#181c2d] text-slate-300 hover:text-white border-white/[0.08]"
              }`}
            >
              {isTogglingPublic ? (
                <Loader2 size={13} className="animate-spin" />
              ) : isPublicState ? (
                <Check size={13} className="text-emerald-400" />
              ) : (
                <Globe size={13} className="text-emerald-400" />
              )}
              <span>{isPublicState ? "منشور في المعرض (إلغاء النشر)" : "إضافة إلى المعرض العام"}</span>
            </button>

            {/* Copy Link Button */}
            <button
              onClick={handleCopyLink}
              className="w-full py-1.5 px-3 rounded-md bg-[#121522] hover:bg-[#181c2d] text-slate-300 hover:text-white text-xs font-semibold border border-white/[0.08] transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copied ? "تم نسخ الرابط!" : "نسخ رابط النتيجة"}</span>
            </button>

            {/* Delete Button (with inline confirmation) */}
            {confirmDelete ? (
              <div className="p-2 rounded-md bg-rose-500/10 border border-rose-500/20 space-y-1.5 animate-in fade-in">
                <p className="text-[11px] text-rose-300 font-semibold text-center">هل أنت متأكد من حذف هذه النتيجة؟</p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 py-1 px-2 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold transition-all disabled:opacity-50"
                  >
                    {isDeleting ? "جاري الحذف..." : "نعم، احذف"}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    disabled={isDeleting}
                    className="py-1 px-2.5 rounded-md bg-white/10 hover:bg-white/15 text-slate-300 text-[11px] font-semibold transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full py-1.5 px-3 rounded-md bg-rose-500/[0.07] hover:bg-rose-500/15 text-rose-400 hover:text-rose-300 text-xs font-semibold border border-rose-500/20 transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                <Trash2 size={13} />
                <span>حذف النتيجة</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default AIResultModal;
