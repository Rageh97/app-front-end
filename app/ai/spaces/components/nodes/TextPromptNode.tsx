import React, { useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BaseNodeWrapper } from './BaseNodeWrapper';
import { SpacesNode, useSpacesStore } from '@/stores/spacesStore';
import { FileText, Sparkles, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const TextPromptNode: React.FC<NodeProps<SpacesNode>> = ({ id, data }) => {
  const { updateNodeData } = useSpacesStore();
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleEnhancePrompt = async () => {
    if (!data.prompt?.trim()) {
      toast.error('اكتب نصاً أولاً ليتم تحسينه بالذكاء الاصطناعي');
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
        toast.error('تعذر تحسين الأمر');
      }
    } catch {
      toast.error('حدث خطأ أثناء تحسين الأمر');
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <BaseNodeWrapper id={id} data={data} icon={<FileText size={13} className="text-emerald-400" />} accentColor="emerald">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-gray-300">نص الوصف والأمر:</label>
        </div>
        <textarea
          value={data.prompt || ''}
          onChange={(e) => updateNodeData(id, { prompt: e.target.value })}
          placeholder="اكتب هنا الوصف المطلوب لتوليد الصور أو الفيديو أو الصوت..."
          rows={3}
          className="w-full text-xs bg-[#07090e] border border-white/10 hover:border-white/20 rounded-md p-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none transition-all leading-relaxed"
        />
      </div>

      {/* Output Port */}
      <div className="relative flex items-center justify-end pt-1">
        <span className="text-[10px] font-bold text-emerald-400 ml-2">مخرج النص</span>
        <Handle
          type="source"
          position={Position.Right}
          id="prompt-out"
          className="!bg-emerald-500 !-right-4"
        />
      </div>
    </BaseNodeWrapper>
  );
};
