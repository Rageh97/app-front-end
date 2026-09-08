import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BaseNodeWrapper } from './BaseNodeWrapper';
import { SpacesNode, useSpacesStore } from '@/stores/spacesStore';
import { ShoppingBag, Maximize2 } from 'lucide-react';

export const ProductNode: React.FC<NodeProps<SpacesNode>> = ({ id, data }) => {
  const { updateNodeData, openPreview } = useSpacesStore();

  return (
    <BaseNodeWrapper id={id} data={data} icon={<ShoppingBag size={13} className="text-amber-400" />} accentColor="amber">
      {/* Input Port */}
      <div className="relative flex items-center justify-start pb-1">
        <Handle
          type="target"
          position={Position.Left}
          id="image-in"
          className="!bg-blue-500 !-left-4"
        />
        <span className="text-[10px] font-bold text-blue-400 mr-2">مدخل صورة المنتج</span>
      </div>

      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold text-gray-300">أسلوب الاستوديو الإعلاني:</label>
        <select
          value={data.style || 'studio'}
          onChange={(e) => updateNodeData(id, { style: e.target.value })}
          className="w-full text-xs bg-[#07090e] border border-white/10 hover:border-white/20 rounded-md p-1.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
        >
          <option value="studio">استوديو فخم بإضاءة سينمائية</option>
          <option value="lifestyle">مشهد واقعي للاستخدام اليومي</option>
          <option value="minimal">منصة عصرية بسيطة</option>
          <option value="luxury">مشهد فاخر للمنتجات الراقية</option>
        </select>

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
              alt="Product model result"
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
              <span className="px-2.5 py-1 rounded bg-amber-600/90 text-white text-[11px] font-bold backdrop-blur-sm flex items-center gap-1 shadow-md">
                <Maximize2 size={11} />
                <span>عرض النتيجة</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Output Port */}
      <div className="relative flex items-center justify-end pt-1">
        <span className="text-[10px] font-bold text-amber-400 ml-2">مخرج صور المنتج</span>
        <Handle
          type="source"
          position={Position.Right}
          id="image-out"
          className="!bg-amber-500 !-right-4"
        />
      </div>
    </BaseNodeWrapper>
  );
};
