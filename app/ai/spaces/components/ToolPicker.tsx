'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import {
  searchSpaceTools,
  SPACE_TOOL_CATEGORIES,
  SpaceToolItem,
} from '@/utils/spaces/toolCatalog';

interface ToolPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (tool: SpaceToolItem) => void;
  compatibleTypes?: string[];
  title?: string;
}

export const ToolPicker: React.FC<ToolPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  compatibleTypes,
  title = 'إضافة خطوة للمسار',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [activeIndex, setActiveIndex] = useState(0);

  const tools = useMemo(() => {
    const matches = searchSpaceTools(query, category);
    return compatibleTypes?.length
      ? matches.filter((tool) => compatibleTypes.includes(tool.type))
      : matches;
  }, [category, compatibleTypes, query]);

  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setCategory('all');
    setActiveIndex(0);
    window.setTimeout(() => inputRef.current?.focus(), 40);
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, category]);

  if (!isOpen) return null;

  const pickTool = (tool: SpaceToolItem) => {
    onSelect(tool);
    onClose();
  };

  return (
    <div
      className="absolute inset-0 z-40 flex items-start justify-center bg-black/35 px-4 pt-[12vh] backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#0b0e16] shadow-2xl shadow-black/50"
        dir="rtl"
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose();
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((index) => Math.min(index + 1, Math.max(tools.length - 1, 0)));
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
          }
          if (event.key === 'Enter' && tools[activeIndex]) {
            event.preventDefault();
            pickTool(tools[activeIndex]);
          }
        }}
      >
        <div className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-3">
          <Search size={16} className="shrink-0 text-gray-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ابحث عن أداة أو اكتب ما تريد فعله..."
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-600"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-white/[0.06] hover:text-white"
            aria-label="إغلاق"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-white/[0.06] px-3 py-2 no-scrollbar">
          {SPACE_TOOL_CATEGORIES.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => setCategory(item.id)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                category === item.id
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:bg-white/[0.05] hover:text-gray-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="max-h-[390px] overflow-y-auto p-2">
          {tools.length ? (
            tools.map((tool, index) => (
              <button
                type="button"
                key={`${tool.type}-${tool.title}`}
                onClick={() => pickTool(tool)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex w-full items-start justify-between gap-4 rounded-xl px-3 py-3 text-right transition-colors ${
                  activeIndex === index ? 'bg-white/[0.075]' : 'hover:bg-white/[0.05]'
                }`}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-gray-100">{tool.title}</span>
                  <span className="mt-1 block text-[11px] leading-5 text-gray-500">{tool.description}</span>
                </span>
                <span className="mt-0.5 shrink-0 text-[10px] font-medium text-gray-600">
                  {SPACE_TOOL_CATEGORIES.find((item) => item.id === tool.category)?.label}
                </span>
              </button>
            ))
          ) : (
            <div className="px-4 py-12 text-center">
              <p className="text-sm font-semibold text-gray-300">لا توجد أداة مطابقة</p>
              <p className="mt-1 text-xs text-gray-600">جرّب كلمة أبسط أو اختر قسمًا آخر.</p>
            </div>
          )}
        </div>

        <div className="border-t border-white/[0.06] px-4 py-2 text-[10px] text-gray-600">
          الأسهم للتنقل · Enter للإضافة · Esc للإغلاق
        </div>
      </section>
    </div>
  );
};
