import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BaseNodeWrapper } from './BaseNodeWrapper';
import { SpacesNode, useSpacesStore } from '@/stores/spacesStore';
import { Sparkles, Maximize2 } from 'lucide-react';

export const VideoEffectsNode: React.FC<NodeProps<SpacesNode>> = ({ id, data }) => {
  const { updateNodeData, openPreview } = useSpacesStore();

  return (
    <BaseNodeWrapper id={id} data={data} icon={<Sparkles size={13} className="text-cyan-400" />} accentColor="cyan">
      {/* Input Port */}
      <div className="relative flex items-center justify-start pb-1">
        <Handle
          type="target"
          position={Position.Left}
          id="video-in"
          className="!bg-purple-500 !-left-4"
        />
        <span className="text-[10px] font-bold text-purple-400 mr-2">مدخل الفيديو الخام</span>
      </div>

      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold text-gray-300">المؤثر البصري السينمائي:</label>
        <select
          value={data.style || 'cinematic-glow'}
          onChange={(e) => updateNodeData(id, { style: e.target.value })}
          className="w-full text-xs bg-[#07090e] border border-white/10 hover:border-white/20 rounded-md p-1.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
        >
          <option value="cinematic-glow">توهج وإضاءة سينمائية</option>
          <option value="vintage-film">فيلم كلاسيكي 35mm</option>
          <option value="cyber-glitch">مؤثرات بصرية رقمية</option>
          <option value="hdr-color">ألوان سينمائية فائقة HDR</option>
        </select>

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
        <span className="text-[10px] font-bold text-cyan-400 ml-2">مخرج الفيديو المعدل</span>
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
