import React, { useState } from 'react';
import { WORKFLOW_TEMPLATES, WorkflowTemplate } from '@/utils/spaces/templates';
import { useSpacesStore } from '@/stores/spacesStore';
import { X, ArrowLeft, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';

interface TemplatesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TemplatesPanel: React.FC<TemplatesPanelProps> = ({ isOpen, onClose }) => {
  const { loadTemplate } = useSpacesStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!isOpen) return null;

  const handleSelectTemplate = (template: WorkflowTemplate) => {
    loadTemplate(template.nodes, template.edges, template.title);
    toast.success(`تم تحميل مسار: ${template.title}`);
    onClose();
    window.dispatchEvent(new Event('nexus-spaces-fit'));
  };

  const filteredTemplates = WORKFLOW_TEMPLATES.filter((tmpl) => {
    return selectedCategory === 'all' || tmpl.category === selectedCategory;
  });

  const categories = [
    { id: 'all', label: 'كافة القوالب' },
    { id: 'ecommerce', label: 'التجارة والتسويق' },
    { id: 'creators', label: 'صناع المحتوى والريلز' },
    { id: 'designers', label: 'التصميم والمعالجة' },
    { id: 'video', label: 'إنتاج الفيديو' },
    { id: 'audio', label: 'الصوتيات والبودكاست' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150" dir="rtl">
      <div className="relative w-full max-w-4xl max-h-[88vh] rounded-lg bg-[#0c101d] border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        {/* Category Tabs Bar + Close Button (No bulky Header, No Search) */}
        <div className="p-3 border-b border-white/[0.08] bg-[#07090e] flex items-center justify-between gap-2">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors border border-white/5 shrink-0"
            title="إغلاق"
          >
            <X size={14} />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-3 no-scrollbar bg-[#080b14]">
          {filteredTemplates.map((tmpl) => (
            <div
              key={tmpl.id}
              onClick={() => handleSelectTemplate(tmpl)}
              className="group relative rounded-md bg-[#0c101d] hover:bg-[#101626] border border-white/[0.06] hover:border-indigo-500/40 p-3.5 cursor-pointer transition-all flex flex-col justify-between shadow-sm"
            >
              <div>
                {/* Title & Description */}
                <h3 className="text-xs font-bold text-gray-100 group-hover:text-indigo-300 transition-colors mb-1">
                  {tmpl.title}
                </h3>
                <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2 mb-3">
                  {tmpl.description}
                </p>

                {/* Flow Steps Visualization */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1 mb-2">
                  {tmpl.steps.map((step, idx) => (
                    <React.Fragment key={idx}>
                      <span className="text-[10px] text-gray-300 bg-white/[0.03] px-1.5 py-0.5 rounded whitespace-nowrap border border-white/[0.04]">
                        {step}
                      </span>
                      {idx < tmpl.steps.length - 1 && (
                        <ChevronLeft size={10} className="text-gray-600 shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Footer Action */}
              <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.06] mt-1">
                <span className="text-[10px] text-gray-500">جاهز للتنفيذ المباشر</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 group-hover:text-indigo-300 transition-colors">
                  <span>استخدام هذا المسار</span>
                  <ArrowLeft size={12} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
