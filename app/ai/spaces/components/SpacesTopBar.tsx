'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Loader2, Play, Square } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSpacesStore } from '@/stores/spacesStore';
import { estimateNodeCredits } from '@/utils/spaces/creditEstimate';
import { sanitizeWorkflowImport } from '@/utils/spaces/workflowImport';
import { cancelWorkflow, runWorkflow } from '@/utils/spaces/workflowRunner';
import { AIDeleteModal } from '@/components/ai';

interface SpacesTopBarProps {
  onOpenTemplates: () => void;
  onOpenLibrary: () => void;
  onToggleLogs: () => void;
  isLogsOpen: boolean;
  apiBase: string;
}

export const SpacesTopBar: React.FC<SpacesTopBarProps> = ({
  onOpenTemplates,
  onOpenLibrary,
  onToggleLogs,
  isLogsOpen,
  apiBase,
}) => {
  const {
    workflowName,
    setWorkflowMeta,
    nodes,
    edges,
    isRunning,
    isSaving,
    lastSavedAt,
    resetWorkflow,
    saveWorkflow,
    loadTemplate,
  } = useSpacesStore();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(workflowName);
  const [showClearModal, setShowClearModal] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const totalCredits = nodes.reduce((sum, node) => sum + estimateNodeCredits(node), 0);

  const handleSaveTitle = () => {
    setWorkflowMeta({ name: titleInput.trim() || 'مساحة جديدة' });
    setIsEditingTitle(false);
  };

  const handleRun = async () => {
    if (isRunning) {
      cancelWorkflow();
      toast.loading('جاري إيقاف المسار بأمان...', { id: 'run-toast' });
      return;
    }
    if (!nodes.length) {
      toast.error('ابدأ بكتابة فكرتك أو أضف أداة أولاً');
      return;
    }

    const token = typeof window !== 'undefined'
      ? localStorage.getItem('a') || localStorage.getItem('token') || undefined
      : undefined;
    toast.loading('جاري تنفيذ المسار...', { id: 'run-toast' });
    await runWorkflow({
      apiBase,
      token,
      onComplete: () => toast.success('اكتمل المسار بنجاح', { id: 'run-toast' }),
      onError: (error) => {
        if (error === 'تم إلغاء التنفيذ') toast.success(error, { id: 'run-toast' });
        else toast.error(error, { id: 'run-toast' });
      },
    });
  };

  const handleExport = async () => {
    await saveWorkflow();
    const payload = {
      schema: 'nexus-spaces', version: 3, exportedAt: new Date().toISOString(),
      workflowName, nodes, edges,
    };
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nexus-spaces-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success('تم تصدير المشروع');
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error('ملف المشروع أكبر من الحد المسموح');
      return;
    }
    try {
      const imported = sanitizeWorkflowImport(JSON.parse(await file.text()));
      loadTemplate(imported.nodes, imported.edges, imported.workflowName || file.name.slice(0, 160));
      toast.success('تم استيراد المشروع');
    } catch (error: any) {
      toast.error(error?.message || 'تعذر استيراد المشروع');
    }
  };

  return (
    <header className="flex min-h-[56px] items-center justify-between gap-3 border-b border-white/[0.07] bg-[#07090e] px-3 sm:px-4" dir="rtl">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <Link
          href="/ai/spaces"
          className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-gray-500 transition-colors hover:bg-white/[0.05] hover:text-white"
        >
          <ChevronRight size={14} />
          <span className="hidden sm:inline">المساحات</span>
        </Link>
        <span className="hidden h-5 w-px bg-white/[0.08] sm:block" />

        {isEditingTitle ? (
          <input
            autoFocus
            value={titleInput}
            onChange={(event) => setTitleInput(event.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleSaveTitle();
              if (event.key === 'Escape') setIsEditingTitle(false);
            }}
            className="min-w-0 max-w-[240px] rounded-lg border border-indigo-500/60 bg-[#0c101d] px-2.5 py-1.5 text-sm font-bold text-white outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setTitleInput(workflowName);
              setIsEditingTitle(true);
            }}
            className="min-w-0 truncate rounded-lg px-2 py-1 text-right text-sm font-bold text-gray-200 transition-colors hover:bg-white/[0.04] hover:text-white"
            title="تعديل اسم المشروع"
          >
            {workflowName}
          </button>
        )}
      </div>

      <div className="hidden items-center gap-2 text-[10px] text-gray-600 lg:flex">
        <span>{nodes.length} خطوات</span>
        <span className="text-gray-800">•</span>
        <span>{totalCredits} نقطة تقديريًا</span>
        <span className="text-gray-800">•</span>
        <span>{isSaving ? 'جاري الحفظ...' : lastSavedAt ? 'محفوظ تلقائيًا' : 'سيُحفظ تلقائيًا'}</span>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button type="button" onClick={onOpenLibrary} className="rounded-lg px-2.5 py-2 text-xs font-semibold text-gray-400 hover:bg-white/[0.06] hover:text-white">
          الأدوات
        </button>
        <button type="button" onClick={onOpenTemplates} className="hidden rounded-lg px-2.5 py-2 text-xs font-semibold text-gray-400 hover:bg-white/[0.06] hover:text-white sm:block">
          القوالب
        </button>

        <details className="relative">
          <summary className="list-none cursor-pointer rounded-lg px-2.5 py-2 text-xs font-semibold text-gray-500 hover:bg-white/[0.06] hover:text-white">
            المزيد
          </summary>
          <div className="absolute left-0 top-10 z-50 w-40 rounded-xl border border-white/10 bg-[#0c101d] p-1.5 text-xs shadow-2xl">
            <button type="button" onClick={onToggleLogs} className="block w-full rounded-lg px-3 py-2 text-right text-gray-300 hover:bg-white/[0.06]">
              {isLogsOpen ? 'إغلاق السجل' : 'سجل التنفيذ'}
            </button>
            <button type="button" onClick={handleExport} className="block w-full rounded-lg px-3 py-2 text-right text-gray-300 hover:bg-white/[0.06]">
              تصدير المشروع
            </button>
            <button type="button" onClick={() => importInputRef.current?.click()} className="block w-full rounded-lg px-3 py-2 text-right text-gray-300 hover:bg-white/[0.06]">
              استيراد مشروع
            </button>
            <button
              type="button"
              onClick={() => setShowClearModal(true)}
              className="block w-full rounded-lg px-3 py-2 text-right text-rose-400 hover:bg-rose-500/10"
            >
              مسح الكانفاس
            </button>
          </div>
        </details>
        <input ref={importInputRef} type="file" accept="application/json,.json" className="hidden" onChange={handleImport} />

        <button
          type="button"
          onClick={handleRun}
          className={`mr-1 flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-white transition-colors ${
            isRunning ? 'bg-rose-600 hover:bg-rose-500' : 'bg-indigo-600 hover:bg-indigo-500'
          }`}
        >
          {isRunning ? <><Loader2 size={13} className="animate-spin" /><Square size={10} /></> : <Play size={12} className="fill-current" />}
          <span>{isRunning ? 'إيقاف' : 'تشغيل'}</span>
        </button>
      </div>

      <AIDeleteModal
        isOpen={showClearModal}
        type="all"
        title="مسح محتوى الكانفاس"
        description="هل أنت متأكد من رغبتك في مسح كافة عناصر ومسارات العمل الحالية في هذه المساحة؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="مسح الكانفاس"
        onClose={() => setShowClearModal(false)}
        onConfirm={() => {
          resetWorkflow();
          setShowClearModal(false);
          toast.success('تم مسح محتوى الكانفاس');
        }}
      />
    </header>
  );
};
