import React, { ReactNode } from 'react';
import { WorkflowNodeData, useSpacesStore } from '@/stores/spacesStore';
import { Trash2, CheckCircle2, AlertCircle, Loader2, Sparkles, Play } from 'lucide-react';
import { runSingleNode } from '@/utils/spaces/workflowRunner';

interface BaseNodeWrapperProps {
  id: string;
  data: WorkflowNodeData;
  icon?: ReactNode;
  accentColor?: string;
  children: ReactNode;
}

export const BaseNodeWrapper: React.FC<BaseNodeWrapperProps> = ({
  id,
  data,
  icon,
  children,
}) => {
  const { removeNode, selectedNodeId, setSelectedNodeId, activeNodeId } = useSpacesStore();
  const isSelected = selectedNodeId === id;
  const isActive = activeNodeId === id;

  return (
    <div
      onClick={() => setSelectedNodeId(id)}
      className={`relative min-w-[270px] max-w-[310px] rounded-lg bg-[#0c101d] border transition-all duration-150 shadow-xl ${
        isActive
          ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-indigo-500/10'
          : isSelected
          ? 'border-white/40 ring-1 ring-white/20'
          : data.status === 'error'
          ? 'border-rose-500/60'
          : data.status === 'success'
          ? 'border-emerald-500/40'
          : 'border-white/[0.08] hover:border-white/20'
      }`}
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] bg-white/[0.02] rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className="text-gray-400">
            {icon || <Sparkles size={13} />}
          </div>
          <h4 className="text-xs font-bold text-gray-200">{data.title}</h4>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Status Indicator */}
          {data.status === 'running' && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded border border-indigo-500/30">
              <Loader2 size={10} className="animate-spin text-indigo-400" />
              <span>معالجة</span>
            </span>
          )}
          {data.status === 'success' && (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
              <CheckCircle2 size={13} className="fill-emerald-500 text-[#0c101d] stroke-[3]" />
              <span>جاهز</span>
            </span>
          )}
          {data.status === 'error' && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-rose-300 bg-rose-500/15 px-2 py-0.5 rounded border border-rose-500/30">
              <AlertCircle size={11} className="fill-rose-500 text-[#0c101d]" />
              <span>خطأ</span>
            </span>
          )}

          {/* Single Node Run Button */}
          {data.category !== 'input' && data.category !== 'output' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                runSingleNode(id, apiBase);
              }}
              disabled={data.status === 'running'}
              className="w-5 h-5 rounded hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
              title="تشغيل هذه العقدة فقط"
            >
              <Play size={10} className="fill-current ml-0.5" />
            </button>
          )}

          {/* Delete Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeNode(id);
            }}
            className="w-5 h-5 rounded hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 flex items-center justify-center transition-colors"
            title="حذف العقدة"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {/* Node Body Content */}
      <div className="p-3 space-y-2">{children}</div>

      {/* Error Banner */}
      {data.status === 'error' && data.error && (
        <div className="px-3 pb-2">
          <div className="text-[11px] text-rose-300 bg-rose-950/30 border border-rose-500/20 rounded-md p-2 leading-relaxed">
            {data.error}
          </div>
        </div>
      )}
    </div>
  );
};
