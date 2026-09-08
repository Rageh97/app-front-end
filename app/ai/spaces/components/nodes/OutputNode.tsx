import React, { useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BaseNodeWrapper } from './BaseNodeWrapper';
import { SpacesNode, useSpacesStore } from '@/stores/spacesStore';
import {
  Download,
  CheckCircle2,
  Copy,
  Eye,
  ExternalLink,
  Images,
  Maximize2,
  Sparkles,
  Share2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export const OutputNode: React.FC<NodeProps<SpacesNode>> = ({ id, data }) => {
  const { updateNodeData, openPreview } = useSpacesStore();
  const output = data.output;
  const [isPublishing, setIsPublishing] = useState(false);
  const isPublic = !!data.is_public;

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const handleOpenPreview = () => {
    if (!output) return;
    openPreview({
      nodeId: id,
      url: output.url,
      type: output.type,
      text: output.text,
      prompt: data.prompt,
      is_public: isPublic,
      media_id: data.media_id,
    });
  };

  const handleDownload = () => {
    if (!output?.url) return;
    const a = document.createElement('a');
    a.href = output.url;
    a.download = `nexus-spaces-result-${Date.now()}`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('بدء التحميل بنجاح!');
  };

  const handleCopyText = () => {
    if (!output?.text && !output?.url) return;
    navigator.clipboard.writeText(output.text || output.url || '');
    toast.success('تم النسخ للحافظة!');
  };

  const handleTogglePublic = async () => {
    if (!data.media_id || !output || !['image', 'video'].includes(output.type)) {
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
          id: Number(data.media_id),
          is_public: !isPublic,
          type: output.type,
        }),
      });
      const resData = await res.json();
      if (!res.ok || !resData.success) throw new Error(resData.message || 'تعذر تحديث حالة النشر');
      updateNodeData(id, { is_public: !isPublic });
      toast.success(!isPublic ? 'تم النشر في معرض المحترفين!' : 'تمت الإزالة من المعرض');
    } catch (error: any) {
      toast.error(error?.message || 'تعذر تحديث حالة النشر');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <BaseNodeWrapper
      id={id}
      data={data}
      icon={<CheckCircle2 size={14} className="fill-emerald-500 text-[#0c101d] stroke-[2.5]" />}
      accentColor="emerald"
    >
      {/* Input Port */}
      <div className="relative flex items-center justify-start pb-1">
        <Handle
          type="target"
          position={Position.Left}
          id="media-in"
          className="!bg-emerald-500 !-left-4"
        />
        <span className="text-[10px] font-bold text-emerald-400 mr-2">مدخل المخرجات النهائية</span>
      </div>

      <div className="space-y-2">
        {output?.url || output?.text ? (
          <div className="space-y-1.5">
            {/* Image Preview */}
            {output.type === 'image' && output.url && (
              <div
                className="relative aspect-video rounded-md overflow-hidden border border-white/10 group bg-black/40 cursor-pointer shadow-md"
                onClick={handleOpenPreview}
              >
                <img
                  src={output.url}
                  alt="Final result"
                  className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-indigo-600 text-white text-xs font-bold backdrop-blur-sm flex items-center gap-1 shadow-md">
                    <Maximize2 size={11} />
                    <span>عرض النتيجة</span>
                  </span>
                </div>
              </div>
            )}

            {/* Video Preview */}
            {output.type === 'video' && output.url && (
              <div className="relative aspect-video rounded-md overflow-hidden border border-white/10 bg-black group shadow-md">
                <video src={output.url} controls className="w-full h-full object-contain" />
                <button
                  type="button"
                  onClick={handleOpenPreview}
                  className="absolute top-2 left-2 px-2 py-1 rounded bg-black/80 hover:bg-black text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 flex items-center gap-1"
                  title="تكبير"
                >
                  <Maximize2 size={10} />
                  <span>تكبير</span>
                </button>
              </div>
            )}

            {/* Audio Preview */}
            {output.type === 'audio' && output.url && (
              <div className="p-1.5 rounded-md bg-[#07090e] border border-white/10">
                <audio src={output.url} controls className="w-full h-7" />
              </div>
            )}

            {/* Text Preview */}
            {output.text && (
              <div className="p-2 rounded-md bg-[#07090e] border border-white/10 text-xs text-gray-200 leading-relaxed max-h-32 overflow-y-auto">
                {output.text}
              </div>
            )}

            {/* Main Action */}
            <button
              type="button"
              onClick={handleOpenPreview}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm active:scale-[0.98]"
            >
              <Eye size={13} />
              <span>معاينة النتيجة النهائية</span>
            </button>

            {/* Actions: Gallery Publish & Download */}
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={handleTogglePublic}
                disabled={isPublishing || !data.media_id || !['image', 'video'].includes(output.type)}
                className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-md text-[11px] font-bold transition-all border ${
                  isPublic
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                <Sparkles size={11} className={isPublic ? 'text-amber-400 fill-amber-400' : 'text-amber-400'} />
                <span>{isPublic ? 'منشور بالمعرض' : 'إضافة للمعرض'}</span>
              </button>

              {output.url ? (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold transition-colors"
                >
                  <Download size={11} />
                  <span>تحميل</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-md bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold transition-colors border border-white/10"
                >
                  <Copy size={11} />
                  <span>نسخ</span>
                </button>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px]">
              <Link
                href="/ai/gallery"
                target="_blank"
                className="flex items-center gap-1 text-gray-400 hover:text-amber-400 transition-colors"
              >
                <Images size={11} className="text-amber-400" />
                <span>معرض المحترفين</span>
                <ExternalLink size={9} />
              </Link>

              <button
                type="button"
                onClick={handleCopyText}
                className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
              >
                <Share2 size={10} />
                <span>نسخ الرابط</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="py-5 px-3 text-center rounded-md border border-dashed border-white/10 bg-white/[0.01]">
            <p className="text-xs font-bold text-gray-400">في انتظار تشغيل مسار العمل</p>
            <p className="text-[10px] text-gray-500 mt-0.5">ستظهر المخرجات هنا بعد اكتمال المعالجة</p>
          </div>
        )}
      </div>
    </BaseNodeWrapper>
  );
};
