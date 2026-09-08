'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Copy,
  Trash2,
  Edit2,
  Download,
  Upload,
  LayoutGrid,
  List as ListIcon,
  X,
  Clock,
  ArrowUpRight,
  Workflow,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSpacesStore, SpaceProject } from '@/stores/spacesStore';
import { WORKFLOW_TEMPLATES, WorkflowTemplate } from '@/utils/spaces/templates';

// حساب التاريخ النسبي بدقة وبساطة
const relativeDate = (value: string) => {
  const timestamp = new Date(value).getTime();
  if (isNaN(timestamp)) return 'مؤخراً';
  const diffMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  if (diffMinutes < 1) return 'الآن';
  if (diffMinutes < 60) return `منذ ${diffMinutes} د`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `منذ ${diffHours} س`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `منذ ${diffDays} يوم`;
  return new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'short' }).format(timestamp);
};

const TEMPLATE_TABS = [
  { id: 'all', label: 'الكل' },
  { id: 'ecommerce', label: 'تجارة وتسويق' },
  { id: 'creators', label: 'صناع المحتوى' },
  { id: 'designers', label: 'تصميم ومعالجة' },
  { id: 'video', label: 'فيديو' },
  { id: 'audio', label: 'صوتيات' },
];

export default function SpacesHomePage() {
  const router = useRouter();
  const {
    projects,
    hasHydrated,
    createWorkflow,
    duplicateWorkflow,
    renameWorkflow,
    deleteWorkflow,
  } = useSpacesStore();

  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modals
  const [renamingProject, setRenamingProject] = useState<SpaceProject | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [deletingProject, setDeletingProject] = useState<SpaceProject | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = 'NEXUS Spaces | مساحات العمل';
  }, []);

  const visibleProjects = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('ar');
    return [...projects]
      .filter((p) => !q || p.name.toLocaleLowerCase('ar').includes(q))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [projects, query]);

  const filteredTemplates = useMemo(() => {
    if (selectedCategory === 'all') return WORKFLOW_TEMPLATES;
    return WORKFLOW_TEMPLATES.filter((t) => t.category === selectedCategory);
  }, [selectedCategory]);

  const handleCreate = (template?: WorkflowTemplate) => {
    const id = createWorkflow(
      template
        ? { name: template.title, nodes: template.nodes, edges: template.edges }
        : { name: 'مساحة عمل جديدة' }
    );
    router.push(`/ai/spaces/${id}`);
  };

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const copyId = duplicateWorkflow(id);
    if (copyId) toast.success('تم إنشاء نسخة من المساحة');
  };

  const handleExport = (project: SpaceProject, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const payload = {
        name: project.name,
        nodes: project.nodes,
        edges: project.edges,
        version: '2.0',
        exportedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name.replace(/\s+/g, '_')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('تم تنزيل ملف المسار');
    } catch {
      toast.error('تعذر تصدير المسار');
    }
  };

  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!data || (!data.nodes && !data.edges && !data.name)) {
          throw new Error('ملف غير صالح');
        }
        const id = createWorkflow({
          name: data.name ? `${data.name} (مستورد)` : 'مسار مستورد',
          nodes: data.nodes || [],
          edges: data.edges || [],
        });
        toast.success('تم استيراد المسار');
        router.push(`/ai/spaces/${id}`);
      } catch {
        toast.error('ملف JSON غير صالح');
      }
    };
    reader.readAsText(file);
  };

  const handleSaveRename = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!renamingProject) return;
    const clean = renameInput.trim();
    if (clean) {
      renameWorkflow(renamingProject.id, clean);
      toast.success('تم تعديل الاسم');
    }
    setRenamingProject(null);
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 antialiased" dir="rtl">
      {/* ── Top Bar ── */}
      <header className="border-b border-white/[0.06] bg-[#07090e]">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-slate-400">
            <Link href="/dashboard" className="transition-colors hover:text-white">
              الرئيسية
            </Link>
            <ChevronLeft size={13} className="text-slate-600" />
            <Link href="/ai" className="transition-colors hover:text-white">
              استوديو AI
            </Link>
            <ChevronLeft size={13} className="text-slate-600" />
            <span className="font-semibold text-white">Spaces</span>
          </nav>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImportFile(f);
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.02] px-3 text-xs font-medium text-slate-300 transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
            >
              <Upload size={13} />
              <span>استيراد JSON</span>
            </button>

            <button
              type="button"
              onClick={() => handleCreate()}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-white px-3.5 text-xs font-semibold text-black transition-colors hover:bg-slate-200"
            >
              <Plus size={14} />
              <span>مساحة جديدة</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Container ── */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* ── Header Title & Overview ── */}
        <div className="flex flex-col gap-1 pb-8 border-b border-white/[0.06]">
          <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            مساحات العمل الذكية
          </h1>
          <p className="text-xs text-slate-400 sm:text-sm">
            بناء وتوصيل مسارات توليد الوسائط وتعديلها عبر عقد ذكية تفاعلية وحفظ فوري.
          </p>
        </div>

        {/* ── Section: Your Projects ── */}
        <section className="pt-8" aria-label="مشاريعك">
          {/* Controls Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">المشاريع</span>
              <span className="rounded bg-white/[0.06] px-2 py-0.5 text-[11px] font-mono text-slate-400">
                {visibleProjects.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="بحث في المشاريع..."
                  className="h-8 w-full rounded-md border border-white/[0.08] bg-white/[0.02] pr-8 pl-7 text-xs text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* View Switcher */}
              <div className="flex items-center rounded-md border border-white/[0.08] bg-white/[0.02] p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`rounded p-1 text-slate-400 transition-colors ${
                    viewMode === 'grid' ? 'bg-white/10 text-white' : 'hover:text-white'
                  }`}
                  title="عرض البطاقات"
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`rounded p-1 text-slate-400 transition-colors ${
                    viewMode === 'list' ? 'bg-white/10 text-white' : 'hover:text-white'
                  }`}
                  title="عرض القائمة"
                >
                  <ListIcon size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Projects Content */}
          {!hasHydrated ? (
            <div className="rounded-lg border border-white/[0.06] bg-[#0c0e14] py-14 text-center text-xs text-slate-500">
              جاري مزامنة مساحات العمل...
            </div>
          ) : visibleProjects.length === 0 ? (
            <div className="rounded-lg border border-dashed border-white/[0.08] bg-white/[0.01] p-10 text-center">
              <p className="text-xs text-slate-400">
                {query ? 'لا توجد مساحات مطابقة لهذا البحث.' : 'لم تقم بإنشاء أي مساحة عمل بعد.'}
              </p>
              {!query && (
                <button
                  type="button"
                  onClick={() => handleCreate()}
                  className="mt-3 inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white hover:bg-white/[0.08]"
                >
                  <Plus size={13} />
                  <span>إنشاء أول مساحة</span>
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            /* ── Grid View ── */
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {visibleProjects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => router.push(`/ai/spaces/${project.id}`)}
                  className="group relative rounded-lg p-[1px] bg-gradient-to-br from-emerald-400/45 via-white/[0.12] to-emerald-500/25 hover:from-emerald-400/80 hover:via-white/[0.22] hover:to-emerald-400/45 transition-all duration-300 cursor-pointer shadow-sm"
                >
                  <div className="relative flex flex-col justify-between h-full rounded-[7px] bg-gradient-to-b from-[#0f1322] via-[#0b0e17] to-[#07090e] p-3.5">
                    <div>
                      {/* Visual Node Chain Preview */}
                      <div className="mb-3 flex h-20 w-full items-center justify-center rounded-md border border-white/[0.08] bg-[#05070c] px-2.5">
                        {project.nodes.length > 0 ? (
                          <div className="flex max-w-full items-center gap-1.5 overflow-hidden" dir="ltr">
                            {project.nodes.slice(0, 4).map((node, i) => (
                              <React.Fragment key={node.id}>
                                <span className="truncate rounded border border-white/[0.1] bg-white/[0.04] px-2 py-1 text-[10px] font-medium text-slate-300">
                                  {node.data.title}
                                </span>
                                {i < Math.min(project.nodes.length, 4) - 1 && (
                                  <ChevronRight size={11} className="shrink-0 text-slate-600" />
                                )}
                              </React.Fragment>
                            ))}
                            {project.nodes.length > 4 && (
                              <span className="text-[10px] text-slate-500 font-mono">
                                +{project.nodes.length - 4}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">
                            مساحة فارغة جاهزة للبناء
                          </span>
                        )}
                      </div>

                      {/* Title & Metadata */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate text-xs font-semibold text-white transition-colors group-hover:text-emerald-300">
                            {project.name}
                          </h3>
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            {project.nodes.length} خطوات • {relativeDate(project.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="mt-3.5 flex items-center justify-between border-t border-white/[0.08] pt-2.5 text-[11px]"
                    >
                      <button
                        type="button"
                        onClick={() => router.push(`/ai/spaces/${project.id}`)}
                        className="text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1 transition-colors"
                      >
                        <span>فتح المساحة</span>
                        <ArrowUpRight size={12} className="text-emerald-400" />
                      </button>

                      <div className="flex items-center gap-1 text-slate-400">
                        <button
                          type="button"
                          onClick={() => {
                            setRenamingProject(project);
                            setRenameInput(project.name);
                          }}
                          className="rounded p-1 transition-colors hover:bg-white/[0.08] hover:text-white"
                          title="إعادة تسمية"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDuplicate(project.id, e)}
                          className="rounded p-1 transition-colors hover:bg-white/[0.08] hover:text-white"
                          title="تكرار"
                        >
                          <Copy size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleExport(project, e)}
                          className="rounded p-1 transition-colors hover:bg-white/[0.08] hover:text-white"
                          title="تصدير JSON"
                        >
                          <Download size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingProject(project)}
                          className="rounded p-1 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                          title="حذف"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ── List/Table View ── */
            <div className="overflow-hidden rounded-lg p-[1px] bg-gradient-to-br from-emerald-400/35 via-white/[0.1] to-emerald-500/20">
              <div className="rounded-[7px] bg-[#090c14] divide-y divide-white/[0.06]">
                {visibleProjects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => router.push(`/ai/spaces/${project.id}`)}
                    className="group flex items-center justify-between px-4 py-3 transition-colors hover:bg-white/[0.04] cursor-pointer"
                  >
                    <div className="min-w-0 flex-1 flex items-center gap-3">
                      <h3 className="truncate text-xs font-semibold text-white transition-colors group-hover:text-emerald-300">
                        {project.name}
                      </h3>
                      <span className="rounded bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-slate-400 font-mono shrink-0">
                        {project.nodes.length} عقدة
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-[11px] text-slate-500 hidden sm:inline">
                        {relativeDate(project.updatedAt)}
                      </span>

                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-slate-400"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setRenamingProject(project);
                            setRenameInput(project.name);
                          }}
                          className="rounded p-1 hover:text-white"
                          title="تسمية"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDuplicate(project.id, e)}
                          className="rounded p-1 hover:text-white"
                          title="نسخ"
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleExport(project, e)}
                          className="rounded p-1 hover:text-white"
                          title="تصدير"
                        >
                          <Download size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingProject(project)}
                          className="rounded p-1 hover:text-rose-400"
                          title="حذف"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── Section: Starter Templates ── */}
        <section className="pt-12" aria-label="قوالب جاهزة">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-white">مسارات عمل جاهزة للبدء</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              اختر نموذجاً مصمماً مسبقاً وابدأ العمل عليه مباشرة.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="mb-4 flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-white/[0.06] pb-2">
            {TEMPLATE_TABS.map((tab) => {
              const active = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-white/[0.08] text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => handleCreate(template)}
                className="group relative rounded-lg p-[1px] bg-gradient-to-br from-emerald-400/40 via-white/[0.12] to-emerald-500/25 hover:from-emerald-400/75 hover:via-white/[0.22] hover:to-emerald-400/45 transition-all duration-300 cursor-pointer shadow-sm"
              >
                <div className="relative flex flex-col justify-between h-full rounded-[7px] bg-gradient-to-b from-[#0f1322] via-[#0b0e17] to-[#07090e] p-4">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h3 className="text-xs sm:text-sm font-bold text-emerald-400 transition-colors group-hover:text-emerald-300">
                        {template.title}
                      </h3>
                      <span className="text-[10px] text-emerald-300 font-mono shrink-0 rounded border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5">
                        {template.categoryLabel}
                      </span>
                    </div>

                    <p className="text-[11px] leading-relaxed text-slate-400">
                      {template.description}
                    </p>

                    <div className="mt-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1" dir="ltr">
                      {template.steps.map((step, idx) => (
                        <React.Fragment key={idx}>
                          <span className="rounded border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[9px] text-slate-300 whitespace-nowrap">
                            {step}
                          </span>
                          {idx < template.steps.length - 1 && (
                            <ChevronRight size={10} className="shrink-0 text-slate-600" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-white/[0.08] pt-2.5 text-xs">
                    <span className="text-[11px] text-slate-500">
                      {template.nodes.length} خطوات مدمجة
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-400 transition-colors group-hover:text-emerald-300">
                      <span>استخدام القالب</span>
                      <ChevronLeft size={13} className="transition-transform group-hover:-translate-x-0.5 duration-200" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── Modal: Rename ── */}
      {renamingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs" dir="rtl">
          <form
            onSubmit={handleSaveRename}
            className="w-full max-w-sm rounded-lg border border-white/10 bg-[#0d1017] p-5 shadow-2xl"
          >
            <h3 className="text-sm font-semibold text-white">تعديل اسم المساحة</h3>
            <input
              type="text"
              autoFocus
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              className="mt-3 w-full rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white focus:border-white/30 focus:outline-none"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRenamingProject(null)}
                className="rounded-md px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={!renameInput.trim()}
                className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-slate-200 disabled:opacity-50"
              >
                حفظ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Modal: Delete ── */}
      {deletingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs" dir="rtl">
          <div className="w-full max-w-sm rounded-lg border border-white/10 bg-[#0d1017] p-5 shadow-2xl">
            <h3 className="text-sm font-semibold text-rose-400">حذف مساحة العمل</h3>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              هل أنت متأكد من حذف «{deletingProject.name}»؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingProject(null)}
                className="rounded-md px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteWorkflow(deletingProject.id);
                  toast.success('تم حذف المساحة');
                  setDeletingProject(null);
                }}
                className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
