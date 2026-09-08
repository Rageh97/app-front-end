import React, { useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BaseNodeWrapper } from './BaseNodeWrapper';
import { SpacesNode, useSpacesStore } from '@/stores/spacesStore';
import { Video, Sparkles, Cpu, Maximize2, Loader2 } from 'lucide-react';
import { VIDEO_MODELS } from '@/lib/ai-models-config';
import toast from 'react-hot-toast';

export const VideoGenNode: React.FC<NodeProps<SpacesNode>> = ({ id, data }) => {
  const { updateNodeData, openPreview, edges } = useSpacesStore();
  const [isEnhancing, setIsEnhancing] = useState(false);

  const selectedModelId = data.modelId || 'gemini-omni-1.1-flash';
  const selectedModel = VIDEO_MODELS.find((model) => model.id === selectedModelId) || VIDEO_MODELS[0];
  const supportedDurations = selectedModel.supportedDurations || [4, 6, 8];
  const supportedResolutions = selectedModel.supportedResolutions || ['720p'];
  const hasReferenceInput = edges.some((edge) => edge.target === id && edge.targetHandle === 'image-in');
  const requiresEightSeconds = !selectedModelId.includes('omni') &&
    (hasReferenceInput || (data.resolution || selectedModel.defaultResolution || '720p').toLowerCase() !== '720p');
  const visibleDurations = requiresEightSeconds ? [8] : supportedDurations;

  const handleEnhancePrompt = async () => {
    if (!data.prompt?.trim()) {
      toast.error('اكتب وصفاً أو فكرة فيديو أولاً ليتم تحسينها');
      return;
    }
    setIsEnhancing(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = typeof window !== 'undefined' ? localStorage.getItem('a') : null;
      const res = await fetch(`${apiBase}/api/ai/enhance-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': token } : {}),
        },
        body: JSON.stringify({ prompt: data.prompt, type: 'video' }),
      });
      const resData = await res.json();
      if (resData.success && resData.enhanced_prompt) {
        updateNodeData(id, { prompt: resData.enhanced_prompt });
        toast.success('تم تحسين الأمر السينمائي بنجاح ✨');
      } else {
        toast.error('تعذر تحسين الأمر حالياً');
      }
    } catch {
      toast.error('حدث خطأ أثناء تحسين الأمر');
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <BaseNodeWrapper id={id} data={data} icon={<Video size={13} className="text-purple-400" />} accentColor="purple">
      {/* Input Ports */}
      <div className="space-y-1 pb-1">
        <div className="relative flex items-center justify-start">
          <Handle
            type="target"
            position={Position.Left}
            id="prompt-in"
            className="!bg-emerald-500 !-left-4"
          />
          <span className="text-[10px] font-bold text-emerald-400 mr-2">مدخل النص</span>
        </div>
        <div className="relative flex items-center justify-start">
          <Handle
            type="target"
            position={Position.Left}
            id="image-in"
            className="!bg-blue-500 !-left-4"
          />
          <span className="text-[10px] font-bold text-blue-400 mr-2">مدخل صورة المشهد</span>
        </div>
      </div>

      <div className="space-y-2 mt-0.5">
        {/* Model Selector */}
        <div>
          <label className="text-[11px] font-bold text-gray-300 flex items-center gap-1 mb-1">
            <Cpu size={11} className="text-purple-400" />
            <span>محرك الفيديو السينمائي:</span>
          </label>
          <select
            value={selectedModelId}
            onChange={(e) => {
              const model = VIDEO_MODELS.find((item) => item.id === e.target.value);
              updateNodeData(id, {
                modelId: e.target.value,
                duration: model && !model.id.includes('omni') && model.defaultResolution !== '720p'
                  ? 8
                  : (model?.supportedDurations?.[0] || 4),
                resolution: model?.defaultResolution || '720p',
              });
            }}
            className="w-full text-xs bg-[#07090e] border border-white/10 hover:border-white/20 rounded-md p-1.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
          >
            {VIDEO_MODELS.map(m => (
              <option key={m.id} value={m.id}>
                {m.name} {m.badge ? `[${m.badge}]` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Prompt Input */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-bold text-gray-300">فكرة المشهد والحركة:</label>
          </div>
          <textarea
            value={data.prompt || ''}
            onChange={(e) => updateNodeData(id, { prompt: e.target.value })}
            placeholder="اكتب وصف حركة الفيديو أو اربط العقدة بمدخل نصي..."
            rows={2}
            className="w-full text-xs bg-[#07090e] border border-white/10 hover:border-white/20 rounded-md p-1.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed transition-colors"
          />
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <div>
            <label className="block text-[11px] font-bold text-gray-300 mb-1">المدة:</label>
            <select
              value={requiresEightSeconds ? 8 : (data.duration || 4)}
              onChange={(e) => updateNodeData(id, { duration: Number(e.target.value) })}
              className="w-full text-xs bg-[#07090e] border border-white/10 rounded-md p-1.5 text-white focus:outline-none focus:border-indigo-500"
            >
              {visibleDurations.map((duration) => (
                <option key={duration} value={duration}>{duration} ثوانٍ</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-300 mb-1">الدقة:</label>
            <select
              value={supportedResolutions.includes(data.resolution || '') ? data.resolution : selectedModel.defaultResolution}
              onChange={(e) => updateNodeData(id, {
                resolution: e.target.value,
                ...(!selectedModelId.includes('omni') && e.target.value.toLowerCase() !== '720p' ? { duration: 8 } : {}),
              })}
              className="w-full text-xs bg-[#07090e] border border-white/10 rounded-md p-1.5 text-white focus:outline-none focus:border-indigo-500"
            >
              {supportedResolutions.map((resolution) => (
                <option key={resolution} value={resolution}>{resolution.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-300 mb-1">الأبعاد:</label>
            <select
              value={data.aspectRatio || '16:9'}
              onChange={(e) => updateNodeData(id, { aspectRatio: e.target.value })}
              className="w-full text-xs bg-[#07090e] border border-white/10 rounded-md p-1.5 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="16:9">أفقي 16:9</option>
              <option value="9:16">طولي 9:16 (ريلز)</option>
              <option value="1:1">مربع 1:1</option>
            </select>
          </div>
        </div>

        {/* Video Output Preview */}
        {data.output?.url && (
          <div className="relative aspect-video rounded-md overflow-hidden border border-white/15 mt-1.5 bg-black group shadow-md">
            <video src={data.output.url} controls className="w-full h-full object-contain" />
            <button
              type="button"
              onClick={() =>
                openPreview({
                  nodeId: id,
                  url: data.output!.url,
                  type: 'video',
                  prompt: data.prompt,
                  is_public: data.is_public,
                  media_id: data.media_id,
                })
              }
              className="absolute top-2 left-2 px-2 py-1 rounded bg-black/80 hover:bg-purple-600 text-white text-[10px] font-bold flex items-center gap-1 opacity-90 hover:opacity-100 transition-all border border-white/10"
              title="عرض سينمائي شاشة كاملة"
            >
              <Maximize2 size={11} />
              <span>معاينة</span>
            </button>
          </div>
        )}
      </div>

      {/* Output Port */}
      <div className="relative flex items-center justify-end pt-1">
        <span className="text-[10px] font-bold text-purple-400 ml-2">مخرج الفيديو</span>
        <Handle
          type="source"
          position={Position.Right}
          id="video-out"
          className="!bg-purple-500 !-right-4"
        />
      </div>
    </BaseNodeWrapper>
  );
};
