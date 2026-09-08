"use client";

import React, { useState } from "react";
import { 
  Trash2, 
  Download, 
  Maximize2, 
  Sparkles, 
  Film, 
  Image as ImageIcon,
  AlertTriangle,
  Loader2,
  Play
} from "lucide-react";
import { AIGenerationCard } from "./AIGenerationCard";
import { downloadMediaDirectly } from "./AIResultModal";
import { AIDeleteModal } from "./AIDeleteModal";

export interface AIResultCardItem {
  id: number | string;
  url: string;
  date?: string;
  prompt?: string;
  is_public?: boolean;
  type?: "image" | "video";
  [key: string]: any;
}

export interface AIResultsGalleryProps {
  title?: string;
  items: AIResultCardItem[];
  isGenerating?: boolean;
  progress?: number;
  generationIcon?: any;
  emptyMessage?: string;
  emptySubtitle?: string;
  onItemClick: (item: AIResultCardItem) => void;
  onDeleteItem?: (id: number | string) => Promise<void> | void;
  onDeleteAll?: () => Promise<void> | void;
  aspectRatio?: string;
  isCheckerboard?: boolean;
  columnsClass?: string;
}

export const AIResultsGallery: React.FC<AIResultsGalleryProps> = ({
  title = "النتائج السابقة",
  items = [],
  isGenerating = false,
  progress = 0,
  generationIcon = Sparkles,
  emptyMessage = "لا توجد نتائج سابقة بعد",
  emptySubtitle = "ابدأ بإنشاء أول عمل لمعاينته وحفظه هنا",
  onItemClick,
  onDeleteItem,
  onDeleteAll,
  aspectRatio = "aspect-auto",
  isCheckerboard = false,
  columnsClass = "columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-3.5 space-y-3.5",
}) => {
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    type: "single" | "all";
    id: number | string | null;
  }>({
    isOpen: false,
    type: "single",
    id: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenSingleDelete = (e: React.MouseEvent, id: number | string) => {
    e.stopPropagation();
    setDeleteModalState({ isOpen: true, type: "single", id });
  };

  const handleOpenDeleteAll = () => {
    setDeleteModalState({ isOpen: true, type: "all", id: null });
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (deleteModalState.type === "single" && deleteModalState.id !== null && onDeleteItem) {
        await onDeleteItem(deleteModalState.id);
      } else if (deleteModalState.type === "all" && onDeleteAll) {
        await onDeleteAll();
      }
      setDeleteModalState({ isOpen: false, type: "single", id: null });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadItem = async (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    await downloadMediaDirectly(url, `nexus-ai-${Date.now()}`);
  };

  return (
    <div className="w-full space-y-4" dir="rtl">
      {/* ─── Header Toolbar ─── */}
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <h3 className="text-xs font-bold text-slate-300">{title}</h3>
          {items.length > 0 && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/[0.05] text-slate-400 border border-white/[0.08]">
              {items.length}
            </span>
          )}
        </div>

        {/* Delete All Previous Results Button */}
        {items.length > 0 && onDeleteAll && (
          <button
            onClick={handleOpenDeleteAll}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-all active:scale-95"
            title="حذف جميع النتائج السابقة"
          >
            <Trash2 size={12} />
            <span>مسح سجل الأداة</span>
          </button>
        )}
      </div>

      {/* ─── Grid / Masonry Area ─── */}
      {items.length === 0 && !isGenerating ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-2.5">
          <div className="w-12 h-12 rounded-lg bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-slate-500">
            <Sparkles size={20} />
          </div>
          <p className="text-xs font-semibold text-slate-400">{emptyMessage}</p>
          <p className="text-[11px] text-slate-600 max-w-xs">{emptySubtitle}</p>
        </div>
      ) : (
        <div className={columnsClass}>
          {/* Active Generation Card */}
          {isGenerating && (
            <AIGenerationCard progress={progress} icon={generationIcon} />
          )}

          {/* Result Cards */}
          {items.map((item) => {
            const isVideo = item.type === "video" || item.url?.match(/\.(mp4|webm|mov)(\?.*)?$/i);

            return (
              <div
                key={item.id}
                onClick={() => onItemClick(item)}
                className={`break-inside-avoid group relative rounded-md overflow-hidden bg-[#0e111a] border border-white/[0.08] hover:border-white/20 cursor-pointer transition-all duration-200 mb-3.5 ${aspectRatio} ${
                  isCheckerboard ? "bg-[url('/img/checkerboard.png')]" : ""
                }`}
              >
                {/* Visual Media */}
                {isVideo ? (
                  <div className="w-full h-full min-h-[160px] bg-black/70 flex items-center justify-center relative">
                    <video
                      src={item.url}
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-contain block"
                      onMouseEnter={(e) => e.currentTarget.play()}
                      onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-80 group-hover:opacity-0 transition-opacity">
                      <div className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center border border-white/20 text-white shadow-lg">
                        <Play size={14} className="fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={item.url}
                    alt={item.prompt || "AI Result"}
                    loading="lazy"
                    className="w-full h-auto object-cover block group-hover:scale-[1.02] transition-transform duration-300"
                  />
                )}

                {/* Top Action Buttons (Always accessible on hover) */}
                <div className="absolute top-2 left-2 flex items-center gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onDeleteItem && (
                    <button
                      onClick={(e) => handleOpenSingleDelete(e, item.id)}
                      className="p-1 rounded-md bg-black/70 hover:bg-rose-600 text-slate-300 hover:text-white border border-white/10 backdrop-blur-md transition-colors"
                      title="حذف هذه النتيجة"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDownloadItem(e, item.url)}
                    className="p-1 rounded-md bg-black/70 hover:bg-emerald-600 text-slate-300 hover:text-white border border-white/10 backdrop-blur-md transition-colors"
                    title="تحميل مباشر"
                  >
                    <Download size={11} />
                  </button>
                </div>

                {/* Video Indicator Tag */}
                {isVideo && (
                  <div className="absolute top-2 right-2 p-1 rounded-md bg-black/70 border border-white/10 text-emerald-400 z-10">
                    <Film size={10} />
                  </div>
                )}

                {/* Bottom Overlay Info */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5 z-10 pointer-events-none">
                  {item.prompt && (
                    <p className="text-[10px] text-slate-200 line-clamp-1 leading-snug mb-1 font-medium">
                      {item.prompt}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
                    <span>{item.date ? new Date(item.date).toLocaleDateString('ar-EG') : ""}</span>
                    <span className="flex items-center gap-0.5 text-slate-300 font-sans">
                      <span>عرض</span>
                      <Maximize2 size={10} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Unified AI Delete Confirmation Modal */}
      <AIDeleteModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmDelete}
        type={deleteModalState.type}
        isDeleting={isDeleting}
        itemType={items[0]?.type === "video" ? "فيديو" : "صورة"}
      />
    </div>
  );
};

export default AIResultsGallery;
