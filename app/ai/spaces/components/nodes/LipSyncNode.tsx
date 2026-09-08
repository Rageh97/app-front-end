import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BaseNodeWrapper } from './BaseNodeWrapper';
import { SpacesNode, useSpacesStore } from '@/stores/spacesStore';
import { Mic, Maximize2 } from 'lucide-react';

export const LipSyncNode: React.FC<NodeProps<SpacesNode>> = ({ id, data }) => {
  const { openPreview } = useSpacesStore();

  return (
    <BaseNodeWrapper id={id} data={data} icon={<Mic size={13} className="text-rose-400" />} accentColor="rose">
      {/* Input Ports */}
      <div className="space-y-1 pb-1">
        <div className="relative flex items-center justify-start">
          <Handle
            type="target"
            position={Position.Left}
            id="face-in"
            className="!bg-blue-500 !-left-4"
          />
          <span className="text-[10px] font-bold text-blue-400 mr-2">مدخل صورة أو فيديو الوجه</span>
        </div>
        <div className="relative flex items-center justify-start">
          <Handle
            type="target"
            position={Position.Left}
            id="audio-in"
            className="!bg-amber-500 !-left-4"
          />
          <span className="text-[10px] font-bold text-amber-400 mr-2">مدخل الصوت</span>
        </div>
      </div>

      <div className="space-y-1.5 mt-0.5">
        <p className="text-xs text-gray-300 leading-relaxed">
          مزامنة دقيقة لحركة الشفاه وتعبيرات الوجه مع المقطع الصوتي.
        </p>

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
              className="absolute top-2 left-2 px-2 py-1 rounded bg-black/80 hover:bg-rose-600 text-white text-[10px] font-bold flex items-center gap-1 opacity-90 hover:opacity-100 transition-all border border-white/10"
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
        <span className="text-[10px] font-bold text-rose-400 ml-2">مخرج الفيديو المتزامن</span>
        <Handle
          type="source"
          position={Position.Right}
          id="video-out"
          className="!bg-rose-500 !-right-4"
        />
      </div>
    </BaseNodeWrapper>
  );
};
