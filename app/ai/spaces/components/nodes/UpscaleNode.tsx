import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BaseNodeWrapper } from './BaseNodeWrapper';
import { SpacesNode, useSpacesStore } from '@/stores/spacesStore';
import { Maximize2 } from 'lucide-react';

export const UpscaleNode: React.FC<NodeProps<SpacesNode>> = ({ id, data }) => {
  const { updateNodeData, openPreview } = useSpacesStore();

  return (
    <BaseNodeWrapper id={id} data={data} icon={<Maximize2 size={13} className="text-cyan-400" />} accentColor="cyan">
      {/* Input Port */}
      <div className="relative flex items-center justify-start pb-1">
        <Handle
          type="target"
          position={Position.Left}
          id="image-in"
          className="!bg-blue-500 !-left-4"
        />
        <span className="text-[10px] font-bold text-blue-400 mr-2">مدخل الصورة</span>
      </div>

      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold text-gray-300">معدل مضاعفة الدقة:</label>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { val: 2, label: '2x (2K)' },
            { val: 4, label: '4x (4K)' },
            { val: 8, label: '8x (8K)' },
          ].map((item) => (
            <button
              key={item.val}
              type="button"
              onClick={() => updateNodeData(id, { scale: item.val })}
              className={`py-1 rounded-md text-xs font-bold transition-all border ${
                (data.scale || 4) === item.val
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-sm'
                  : 'bg-black/30 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
              }`}
            >
              {item.label}
            </button>
          ))}
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
            className="relative aspect-video rounded-md overflow-hidden border border-white/15 mt-1.5 group cursor-pointer shadow-md"
          >
            <img
              src={data.output.url}
              alt="Upscaled result"
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
              <span className="px-2.5 py-1 rounded bg-cyan-600/90 text-white text-[11px] font-bold backdrop-blur-sm flex items-center gap-1 shadow-md">
                <Maximize2 size={11} />
                <span>عرض النتيجة</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Output Port */}
      <div className="relative flex items-center justify-end pt-1">
        <span className="text-[10px] font-bold text-cyan-400 ml-2">مخرج الصورة فائقة الدقة</span>
        <Handle
          type="source"
          position={Position.Right}
          id="image-out"
          className="!bg-cyan-500 !-right-4"
        />
      </div>
    </BaseNodeWrapper>
  );
};
