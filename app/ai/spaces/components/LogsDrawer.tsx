import React from 'react';
import { useSpacesStore } from '@/stores/spacesStore';
import { Terminal, Trash2, X } from 'lucide-react';

interface LogsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogsDrawer: React.FC<LogsDrawerProps> = ({ isOpen, onClose }) => {
  const { logs, clearLogs, isRunning } = useSpacesStore();

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-56 bg-[#060810]/95 backdrop-blur-xl border-t border-white/[0.08] z-40 flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-150" dir="rtl">
      {/* Drawer Header */}
      <div className="px-5 py-2.5 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-indigo-400" />
          <h3 className="text-xs font-bold text-gray-200 font-sans">سجل عمليات المعالجة</h3>
          {isRunning && (
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse mr-2" />
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={clearLogs}
            className="px-2.5 py-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors text-xs flex items-center gap-1"
            title="مسح السجل"
          >
            <Trash2 size={12} />
            <span>مسح السجل</span>
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="إغلاق"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Logs Output */}
      <div className="flex-1 overflow-y-auto p-4 text-xs space-y-1.5 no-scrollbar bg-black/30 font-sans">
        {logs.length === 0 ? (
          <p className="text-gray-500 text-center py-8">لا توجد سجلات بعد. انقر على تشغيل المسار لبدء المعالجة.</p>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              className={`leading-relaxed ${
                log.includes('❌') || log.includes('⚠️')
                  ? 'text-rose-400 font-bold'
                  : log.includes('✅') || log.includes('🎉')
                  ? 'text-emerald-400 font-bold'
                  : 'text-gray-300'
              }`}
            >
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
