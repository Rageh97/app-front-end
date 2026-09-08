"use client";

import React, { useEffect } from "react";
import { Trash2, AlertTriangle, X, Loader2 } from "lucide-react";

export interface AIDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDeleting?: boolean;
  type?: "single" | "all";
  itemType?: string; // e.g. "فيديو", "صورة", "مقطع صوتي", "عمل"
}

export const AIDeleteModal: React.FC<AIDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel = "إلغاء",
  isDeleting = false,
  type = "single",
  itemType = "العنصر",
}) => {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  const defaultTitle =
    type === "all"
      ? `مسح سجل ${itemType} بالكامل`
      : `تأكيد حذف ${itemType}`;

  const defaultDescription =
    type === "all"
      ? `هل أنت متأكد من رغبتك في مسح كافة عناصر السجل السابقة؟ سيتم حذف جميع النتائج نهائياً من حسابك ولن يمكنك استرجاعها.`
      : `هل أنت متأكد من رغبتك في حذف هذا ال${itemType} نهائياً؟ لا يمكن التراجع عن هذا الإجراء بعد تنفيذه.`;

  const defaultConfirmLabel =
    type === "all" ? "نعم، مسح السجل بالكامل" : "نعم، حذف";

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-md bg-[#0B0D14] border border-white/[0.1] rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
        {/* Danger Glow Gradient Line at Top */}
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-rose-600 via-red-500 to-rose-600" />
        
        {/* Soft Radial Ambient Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 left-4 p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white transition-all disabled:opacity-40"
          title="إغلاق"
        >
          <X size={16} />
        </button>

        {/* Icon & Heading */}
        <div className="flex flex-col items-center text-center sm:items-start sm:text-right mb-6">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-4 shadow-lg shadow-rose-500/10">
            {type === "all" ? (
              <AlertTriangle size={24} className="text-rose-400" />
            ) : (
              <Trash2 size={24} className="text-rose-400" />
            )}
          </div>

          <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
            {title || defaultTitle}
          </h3>
          <p className="text-xs sm:text-sm text-gray-400 mt-2 leading-relaxed">
            {description || defaultDescription}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="w-full py-2.5 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] active:scale-[0.98] border border-white/[0.08] text-gray-300 font-bold text-xs sm:text-sm transition-all disabled:opacity-40"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>جاري الحذف...</span>
              </>
            ) : (
              <>
                <Trash2 size={15} />
                <span>{confirmLabel || defaultConfirmLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIDeleteModal;
