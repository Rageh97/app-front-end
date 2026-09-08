'use client';

import React, { useState } from 'react';
import { useSpacesStore } from '@/stores/spacesStore';
import {
  X,
  Download,
  Sparkles,
  Images,
  ExternalLink,
  Copy,
  Share2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export const ResultPreviewModal: React.FC = () => {
  const { previewModal, closePreview, updateNodeData } = useSpacesStore();
  const [isPublishing, setIsPublishing] = useState(false);

  if (!previewModal.isOpen || (!previewModal.url && !previewModal.text)) {
    return null;
  }

  const { url, type = 'image', text, prompt, is_public, media_id, nodeId } = previewModal;
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const handleDownload = () => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-spaces-result-${Date.now()}`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('بدء التحميل بنجاح!');
  };

  const handleCopy = (content?: string) => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    toast.success('تم النسخ للحافظة!');
  };

  const handleTogglePublic = async () => {
    if (!media_id || !['image', 'video'].includes(type)) {
      toast.error('النشر متاح للصور والفيديو المحفوظين على الخادم فقط');
      return;
    }
    setIsPublishing(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('a') || localStorage.getItem('token') : null;
    const userClient = typeof window !== 'undefined' ? (global as any)?.clientId1328 || localStorage.getItem('clientId1328') : undefined;

    try {
      const res = await fetch(`${apiBase}/api/ai/toggle-public`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || '',
          'User-Client': userClient || '',
        },
        body: JSON.stringify({
          id: Number(media_id),
          is_public: !is_public,
          type,
        }),
      });
      const resData = await res.json();
      if (!res.ok || !resData.success) throw new Error(resData.message || 'تعذر تحديث حالة النشر');
      if (nodeId) updateNodeData(nodeId, { is_public: !is_public });
      useSpacesStore.setState((prev) => ({
        previewModal: { ...prev.previewModal, is_public: !is_public },
      }));
      toast.success(!is_public ? 'تم النشر في معرض المحترفين!' : 'تمت الإزالة من المعرض');
    } catch (error: any) {
      toast.error(error?.message || 'تعذر تحديث حالة النشر');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[999999] w-screen h-screen flex items-center justify-center p-4 md:p-6 bg-black/90 backdrop-blur-xl select-none animate-in fade-in duration-150"
      onClick={closePreview}
      dir="rtl"
    >
      {/* Close Button */}
      <button
        type="button"
        onClick={closePreview}
        className="absolute top-5 right-5 p-2 bg-white/10 hover:bg-white/20 rounded-md transition-all text-white z-50 shadow-lg border border-white/10"
        title="إغلاق المعاينة"
      >
        <X size={20} />
      </button>

      {/* Main Container */}
      <div
        className="relative w-full h-full max-w-6xl flex flex-col lg:flex-row items-center justify-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Media Display Area */}
        <div className="flex-1 w-full h-full max-h-[88vh] rounded-lg bg-black/70 border border-white/10 overflow-hidden flex items-center justify-center p-3 shadow-2xl relative">
          {type === 'image' && url && (
            <img
              src={url}
              alt="Final Result"
              className="max-h-full max-w-full object-contain rounded-md shadow-lg"
            />
          )}

          {type === 'video' && url && (
            <video
              src={url}
              controls
              autoPlay
              className="max-h-full max-w-full rounded-md shadow-lg"
            />
          )}

          {type === 'audio' && url && (
            <div className="w-full max-w-lg p-8 bg-white/5 border border-white/10 rounded-lg text-center space-y-4">
              <div className="w-16 h-16 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
                <Sparkles size={28} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">الملف الصوتي المولد</h3>
                <p className="text-xs text-gray-400 mt-1">بواسطة محرك الذكاء الاصطناعي الصوتي</p>
              </div>
              <audio src={url} controls autoPlay className="w-full" />
            </div>
          )}

          {text && !url && (
            <div className="w-full max-w-3xl p-6 bg-white/5 border border-white/10 rounded-lg max-h-[75vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                <p className="text-xs font-bold text-gray-400">النص المولد:</p>
                <button
                  type="button"
                  onClick={() => handleCopy(text)}
                  className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-bold"
                >
                  <Copy size={13} />
                  <span>نسخ</span>
                </button>
              </div>
              <p className="text-sm text-gray-100 leading-relaxed whitespace-pre-wrap font-sans">{text}</p>
            </div>
          )}
        </div>

        {/* Right Sidebar: Details & Actions */}
        <div className="w-full lg:w-[320px] shrink-0 h-full max-h-[88vh] bg-[#0c101d] border border-white/10 rounded-lg p-5 flex flex-col justify-between overflow-y-auto shadow-2xl no-scrollbar">
          {/* Top Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">معاينة النتيجة النهائية</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">استوديو مخرجات مساحات العمل</p>
              </div>
            </div>

            {/* Prompt / Script display */}
            {(prompt || text) && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-xs font-bold text-gray-300">الأمر المستخدم:</h4>
                  <button
                    type="button"
                    onClick={() => handleCopy(prompt || text)}
                    className="p-1 bg-white/5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-all"
                    title="نسخ الأمر"
                  >
                    <Copy size={12} />
                  </button>
                </div>
                <div className="bg-white/5 p-3 rounded-md text-xs text-gray-300 leading-relaxed font-medium break-words whitespace-pre-wrap max-h-44 overflow-y-auto border border-white/5 no-scrollbar">
                  {prompt || text}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Buttons */}
          <div className="space-y-2 pt-4 border-t border-white/10 shrink-0">
            {/* Gallery Publish Button */}
            <button
              type="button"
              onClick={handleTogglePublic}
              disabled={isPublishing || !media_id || !['image', 'video'].includes(type)}
              className={`w-full py-2.5 rounded-md font-bold transition-all flex items-center justify-center gap-2 border text-xs ${
                is_public
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30 shadow-sm'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 text-white disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              <Sparkles size={14} className={is_public ? 'text-amber-400 fill-amber-400' : 'text-amber-400'} />
              <span>{is_public ? 'منشور في معرض المحترفين' : 'نشر في معرض المحترفين'}</span>
            </button>

            {/* Download Button */}
            {url && (
              <button
                type="button"
                onClick={handleDownload}
                className="w-full py-2.5 bg-white hover:bg-gray-100 text-black font-bold rounded-md flex items-center justify-center gap-2 text-xs transition-all shadow-md active:scale-[0.98]"
              >
                <Download size={15} />
                <span>تحميل بالدقة الكاملة</span>
              </button>
            )}

            {/* Public Gallery Link */}
            <Link
              href="/ai/gallery"
              target="_blank"
              className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-bold rounded-md flex items-center justify-center gap-1.5 text-xs transition-all"
            >
              <Images size={14} className="text-amber-400" />
              <span>تصفح معرض المحترفين</span>
              <ExternalLink size={11} />
            </Link>

            {/* Copy Link */}
            {url && (
              <button
                type="button"
                onClick={() => handleCopy(url)}
                className="w-full py-1.5 bg-transparent hover:bg-white/5 text-gray-400 hover:text-white font-bold rounded flex items-center justify-center gap-1 text-xs transition-all"
              >
                <Share2 size={11} />
                <span>نسخ رابط الوسائط</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
