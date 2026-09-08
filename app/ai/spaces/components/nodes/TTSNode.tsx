import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BaseNodeWrapper } from './BaseNodeWrapper';
import { SpacesNode, useSpacesStore } from '@/stores/spacesStore';
import { Volume2 } from 'lucide-react';

const REAL_VOICES = [
  { id: 'zaid', name: 'زيد', desc: 'قوي ومعبر' },
  { id: 'amira', name: 'أميرة', desc: 'عذب ورخيم' },
  { id: 'nesreen', name: 'نهرين', desc: 'سلس وهادئ' },
  { id: 'layan', name: 'ليان', desc: 'عفوي ومنطلق' },
  { id: 'adnan', name: 'عدنان', desc: 'إذاعي عميق' },
  { id: 'tariq', name: 'طارق', desc: 'شبابي وواثق' },
  { id: 'ali', name: 'علي', desc: 'حيوي وجذاب' },
];

export const TTSNode: React.FC<NodeProps<SpacesNode>> = ({ id, data }) => {
  const { updateNodeData } = useSpacesStore();

  return (
    <BaseNodeWrapper id={id} data={data} icon={<Volume2 size={13} className="text-amber-400" />} accentColor="amber">
      {/* Input Port */}
      <div className="relative flex items-center justify-start pb-1">
        <Handle
          type="target"
          position={Position.Left}
          id="text-in"
          className="!bg-emerald-500 !-left-4"
        />
        <span className="text-[10px] font-bold text-emerald-400 mr-2">مدخل النص</span>
      </div>

      <div className="space-y-1.5 mt-0.5">
        {/* Voice Selector */}
        <div>
          <label className="block text-[11px] font-bold text-gray-300 mb-1">الصوت:</label>
          <select
            value={data.voiceId || 'zaid'}
            onChange={(e) => updateNodeData(id, { voiceId: e.target.value, modelId: 'gemini-3.1' })}
            className="w-full text-xs bg-[#07090e] border border-white/10 hover:border-white/20 rounded-md p-1.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
          >
            {REAL_VOICES.map(v => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.desc})
              </option>
            ))}
          </select>
        </div>

        {/* Script / Text input */}
        <div>
          <label className="block text-[11px] font-bold text-gray-300 mb-1">النص المطلوب:</label>
          <textarea
            value={data.prompt || ''}
            onChange={(e) => updateNodeData(id, { prompt: e.target.value })}
            placeholder="اكتب النص المراد تحويله لصوت أو اربط العقدة بمدخل نصي..."
            rows={2}
            className="w-full text-xs bg-[#07090e] border border-white/10 hover:border-white/20 rounded-md p-1.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed transition-colors"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-300 mb-1">سرعة الإلقاء:</label>
          <select
            value={data.speed || 1.0}
            onChange={(e) => updateNodeData(id, { speed: Number(e.target.value) })}
            className="w-full text-xs bg-[#07090e] border border-white/10 rounded-md p-1.5 text-white focus:outline-none focus:border-indigo-500"
          >
            <option value={0.75}>0.75x هادئ وبطيء</option>
            <option value={1.0}>1.0x طبيعي</option>
            <option value={1.25}>1.25x سريع</option>
            <option value={1.5}>1.5x سريع جداً</option>
          </select>
        </div>

        {/* Audio Output Preview */}
        {data.output?.url && (
          <div className="mt-1.5 p-1.5 rounded-md bg-[#07090e] border border-white/10">
            <audio src={data.output.url} controls className="w-full h-7" />
          </div>
        )}
      </div>

      {/* Output Port */}
      <div className="relative flex items-center justify-end pt-1">
        <span className="text-[10px] font-bold text-amber-400 ml-2">مخرج الصوت</span>
        <Handle
          type="source"
          position={Position.Right}
          id="audio-out"
          className="!bg-amber-500 !-right-4"
        />
      </div>
    </BaseNodeWrapper>
  );
};
