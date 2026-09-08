import React, { useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BaseNodeWrapper } from './BaseNodeWrapper';
import { SpacesNode, useSpacesStore } from '@/stores/spacesStore';
import { Wand2, Sparkles, Cpu, Maximize2, Loader2 } from 'lucide-react';
import { NANO_MODELS, IMAGE_MODELS, GPT_IMAGE_MODELS } from '@/lib/ai-models-config';
import toast from 'react-hot-toast';

export const ImageGenNode: React.FC<NodeProps<SpacesNode>> = ({ id, data }) => {
  const { updateNodeData, openPreview } = useSpacesStore();
  const [isEnhancing, setIsEnhancing] = useState(false);

  const availableModels = data.toolId === 'nano'
    ? NANO_MODELS
    : data.toolId === 'gpt-image'
      ? GPT_IMAGE_MODELS
      : IMAGE_MODELS;
  const selectedModelId = data.modelId || (data.toolId === 'nano' ? 'gemini-3.1-flash-image' : data.toolId === 'gpt-image' ? 'gpt-image-2' : 'gemini-3-pro-image');
  const selectedModel = availableModels.find((model) => model.id === selectedModelId) || availableModels[0];
  const supportedResolutions = selectedModel.supportedResolutions || ['1K'];

  const handleEnhancePrompt = async () => {
    if (!data.prompt?.trim()) {
      toast.error('اكتب وصفاً أولاً ليتم تحسينه');
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
        body: JSON.stringify({ prompt: data.prompt, type: 'image' }),
      });
      const resData = await res.json();
      if (resData.success && resData.enhanced_prompt) {
        updateNodeData(id, { prompt: resData.enhanced_prompt });
        toast.success('تم تحسين الأمر بنجاح ✨');
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
    <BaseNodeWrapper id={id} data={data} icon={<Wand2 size={13} className="text-purple-400" />} accentColor="purple">
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
          <span className="text-[10px] font-bold text-blue-400 mr-2">مدخل صورة مرجعية</span>
        </div>
      </div>

      <div className="space-y-2 mt-0.5">
        {/* Model Selector */}
        <div>
          <label className="text-[11px] font-bold text-gray-300 flex items-center gap-1 mb-1">
            <Cpu size={11} className="text-purple-400" />
            <span>محرك الذكاء الاصطناعي:</span>
          </label>
          <select
            value={selectedModelId}
            onChange={(e) => {
              const model = availableModels.find((item) => item.id === e.target.value);
              updateNodeData(id, { modelId: e.target.value, resolution: model?.defaultResolution || '1K' });
            }}
            className="w-full text-xs bg-[#07090e] border border-white/10 hover:border-white/20 rounded-md p-1.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
          >
            {availableModels.map(m => (
              <option key={m.id} value={m.id}>
                {m.name} {m.badge ? `[${m.badge}]` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Prompt Input */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-bold text-gray-300">الوصف الإبداعي:</label>
          </div>
          <textarea
            value={data.prompt || ''}
            onChange={(e) => updateNodeData(id, { prompt: e.target.value })}
            placeholder="اكتب وصف الصورة هنا أو اربط العقدة بمدخل نصي..."
            rows={2}
            className="w-full text-xs bg-[#07090e] border border-white/10 hover:border-white/20 rounded-md p-1.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed transition-colors"
          />
        </div>

        {/* Settings: Aspect Ratio, Resolution & Style */}
        <div className="grid grid-cols-3 gap-1.5">
          <div>
            <label className="block text-[11px] font-bold text-gray-300 mb-1">الأبعاد:</label>
            <select
              value={data.aspectRatio || '1:1'}
              onChange={(e) => updateNodeData(id, { aspectRatio: e.target.value })}
              className="w-full text-xs bg-[#07090e] border border-white/10 rounded-md p-1.5 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="1:1">مربع 1:1</option>
              <option value="16:9">أفقي 16:9</option>
              <option value="9:16">طولي 9:16</option>
              <option value="4:3">شاشة 4:3</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-300 mb-1">الدقة:</label>
            <select
              value={supportedResolutions.includes(data.resolution || '') ? data.resolution : selectedModel.defaultResolution}
              onChange={(e) => updateNodeData(id, { resolution: e.target.value })}
              className="w-full text-xs bg-[#07090e] border border-white/10 rounded-md p-1.5 text-white focus:outline-none focus:border-indigo-500"
            >
              {supportedResolutions.map((resolution) => (
                <option key={resolution} value={resolution}>{resolution}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-300 mb-1">الأسلوب الفني:</label>
            <select
              value={data.style || 'photorealistic'}
              onChange={(e) => updateNodeData(id, { style: e.target.value })}
              className="w-full text-xs bg-[#07090e] border border-white/10 rounded-md p-1.5 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="photorealistic">تصوير واقعي</option>
              <option value="cinematic">سينمائي مبهر</option>
              <option value="artistic">رسم فني رقمي</option>
              <option value="3d-render">ثلاثي الأبعاد</option>
              <option value="anime">أنمي ياباني</option>
            </select>
          </div>
        </div>

        {/* Output Preview */}
        {data.output?.url && (
          <div
            onClick={() =>
              openPreview({
                nodeId: id,
                url: data.output!.url,
                type: 'image',
                prompt: data.prompt,
                is_public: data.is_public,
                media_id: data.media_id,
              })
            }
            className="relative aspect-square rounded-md overflow-hidden border border-white/15 mt-1.5 group cursor-pointer shadow-md"
          >
            <img
              src={data.output.url}
              alt="Generated result"
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
              <span className="px-2.5 py-1 rounded bg-indigo-600/90 text-white text-[11px] font-bold backdrop-blur-sm flex items-center gap-1 shadow-lg">
                <Maximize2 size={11} />
                <span>عرض النتيجة</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Output Port */}
      <div className="relative flex items-center justify-end pt-1">
        <span className="text-[10px] font-bold text-indigo-400 ml-2">مخرج الصورة</span>
        <Handle
          type="source"
          position={Position.Right}
          id="image-out"
          className="!bg-indigo-500 !-right-4"
        />
      </div>
    </BaseNodeWrapper>
  );
};
