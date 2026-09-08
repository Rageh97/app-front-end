import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BaseNodeWrapper } from './BaseNodeWrapper';
import { SpacesNode, useSpacesStore } from '@/stores/spacesStore';
import { Film, Cpu, Maximize2 } from 'lucide-react';
import { MOTION_MODELS } from '@/lib/ai-models-config';

export const MotionNode: React.FC<NodeProps<SpacesNode>> = ({ id, data }) => {
  const { updateNodeData, openPreview } = useSpacesStore();

  const selectedModelId = data.modelId || 'gemini-omni-1.1-flash';

  return (
    <BaseNodeWrapper id={id} data={data} icon={<Film size={13} className="text-cyan-400" />} accentColor="cyan">
      {/* Input Port */}
      <div className="relative flex items-center justify-start pb-1">
        <Handle
          type="target"
          position={Position.Left}
          id="image-in"
          className="!bg-blue-500 !-left-4"
        />
        <span className="text-[10px] font-bold text-blue-400 mr-2">مدخل الصورة الثابتة</span>
      </div>

      <div className="space-y-1.5 mt-0.5">
        {/* Model Selector */}
        <div>
          <label className="text-[11px] font-bold text-gray-300 flex items-center gap-1 mb-1">
            <Cpu size={11} className="text-cyan-400" />
            <span>محرك تحريك الصور:</span>
          </label>
          <select
            value={selectedModelId}
            onChange={(e) => updateNodeData(id, { modelId: e.target.value })}
            className="w-full text-xs bg-[#07090e] border border-white/10 hover:border-white/20 rounded-md p-1.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
          >
            {MOTION_MODELS.map(m => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-300 mb-1">شدة الحركة:</label>
          <select
            value={data.intensity || 'moderate'}
            onChange={(e) => updateNodeData(id, { intensity: e.target.value })}
            className="w-full text-xs bg-[#07090e] border border-white/10 rounded-md p-1.5 text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="gentle">حركة بطيئة سينمائية هادئة</option>
            <option value="moderate">حركة طبيعية متوازنة</option>
            <option value="dynamic">حركة ديناميكية سريعة وحيوية</option>
          </select>
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
              className="absolute top-2 left-2 px-2 py-1 rounded bg-black/80 hover:bg-cyan-600 text-white text-[10px] font-bold flex items-center gap-1 opacity-90 hover:opacity-100 transition-all border border-white/10"
              title="عرض سينمائي"
            >
              <Maximize2 size={11} />
              <span>معاينة</span>
            </button>
          </div>
        )}
      </div>

      {/* Output Port */}
      <div className="relative flex items-center justify-end pt-1">
        <span className="text-[10px] font-bold text-cyan-400 ml-2">مخرج حركة الفيديو</span>
        <Handle
          type="source"
          position={Position.Right}
          id="video-out"
          className="!bg-cyan-500 !-right-4"
        />
      </div>
    </BaseNodeWrapper>
  );
};
