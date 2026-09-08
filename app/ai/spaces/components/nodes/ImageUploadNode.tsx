import React, { useRef } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BaseNodeWrapper } from './BaseNodeWrapper';
import { SpacesNode, useSpacesStore } from '@/stores/spacesStore';
import { UploadCloud, Image as ImageIcon, X, Maximize2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const ImageUploadNode: React.FC<NodeProps<SpacesNode>> = ({ id, data }) => {
  const { updateNodeData, openPreview } = useSpacesStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error('الصيغ المدعومة: JPG وPNG وWEBP فقط');
        e.target.value = '';
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('حجم الصورة يجب ألا يتجاوز 10 ميجابايت');
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        updateNodeData(id, { imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  return (
    <BaseNodeWrapper id={id} data={data} icon={<ImageIcon size={13} className="text-blue-400" />} accentColor="blue">
      <div className="space-y-1.5">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {data.imageUrl ? (
          <div
            onClick={() =>
              openPreview({
                nodeId: id,
                url: data.imageUrl!,
                type: 'image',
                prompt: data.title || 'صورة مرفوعة',
              })
            }
            className="relative aspect-video rounded-md overflow-hidden border border-white/10 group cursor-pointer shadow-md"
          >
            <img
              src={data.imageUrl}
              alt="Uploaded preview"
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
              <span className="px-2.5 py-1 rounded bg-blue-600/90 text-white text-[11px] font-bold backdrop-blur-sm flex items-center gap-1 shadow-md">
                <Maximize2 size={11} />
                <span>معاينة الصورة</span>
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                updateNodeData(id, { imageUrl: undefined });
              }}
              className="absolute top-1.5 right-1.5 w-5 h-5 rounded bg-black/80 hover:bg-rose-600 text-white flex items-center justify-center transition-colors z-10"
              title="حذف الصورة"
            >
              <X size={11} />
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/10 hover:border-indigo-500/50 rounded-md p-3.5 text-center cursor-pointer transition-all bg-white/[0.01] hover:bg-indigo-500/[0.04] group"
          >
            <UploadCloud size={18} className="mx-auto text-gray-500 group-hover:text-indigo-400 mb-1 transition-colors" />
            <p className="text-xs font-bold text-gray-300 group-hover:text-white transition-colors">انقر لرفع صورة</p>
            <p className="text-[10px] text-gray-500 mt-0.5">PNG, JPG, WEBP</p>
          </div>
        )}
      </div>

      {/* Output Port */}
      <div className="relative flex items-center justify-end pt-1">
        <span className="text-[10px] font-bold text-blue-400 ml-2">مخرج الصورة</span>
        <Handle
          type="source"
          position={Position.Right}
          id="image-out"
          className="!bg-blue-500 !-right-4"
        />
      </div>
    </BaseNodeWrapper>
  );
};
