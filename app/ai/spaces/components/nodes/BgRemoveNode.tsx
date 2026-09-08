import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BaseNodeWrapper } from './BaseNodeWrapper';
import { SpacesNode, useSpacesStore } from '@/stores/spacesStore';
import { Scissors, Maximize2 } from 'lucide-react';

export const BgRemoveNode: React.FC<NodeProps<SpacesNode>> = ({ id, data }) => {
  const { openPreview } = useSpacesStore();

  return (
    <BaseNodeWrapper id={id} data={data} icon={<Scissors size={13} className="text-emerald-400" />} accentColor="emerald">
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
        <p className="text-xs text-gray-300 leading-relaxed">
          عزل العناصر والأشخاص بدقة فائقة وتفريغ الخلفية بصيغة شفافة.
        </p>

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
            className="relative aspect-video rounded-md overflow-hidden border border-white/15 bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:12px_12px] mt-1.5 group cursor-pointer shadow-md"
          >
            <img
              src={data.output.url}
              alt="BG Removed result"
              className="w-full h-full object-contain p-2 transition-transform duration-200 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
              <span className="px-2.5 py-1 rounded bg-emerald-600/90 text-white text-[11px] font-bold backdrop-blur-sm flex items-center gap-1 shadow-md">
                <Maximize2 size={11} />
                <span>عرض النتيجة</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Output Port */}
      <div className="relative flex items-center justify-end pt-1">
        <span className="text-[10px] font-bold text-emerald-400 ml-2">مخرج الصورة الشفافة</span>
        <Handle
          type="source"
          position={Position.Right}
          id="image-out"
          className="!bg-emerald-500 !-right-4"
        />
      </div>
    </BaseNodeWrapper>
  );
};
