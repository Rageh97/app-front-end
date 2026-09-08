'use client';

import React, { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { SpacesNode, useSpacesStore } from '@/stores/spacesStore';
import {
  searchSpaceTools,
  SPACE_TOOL_CATEGORIES,
  SpaceToolItem,
} from '@/utils/spaces/toolCatalog';

interface SpacesToolbarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SpacesToolbar: React.FC<SpacesToolbarProps> = ({ isOpen, onClose }) => {
  const { addNode, nodes } = useSpacesStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const filteredTools = useMemo(
    () => searchSpaceTools(searchTerm, activeCategory),
    [activeCategory, searchTerm]
  );

  const addTool = (tool: SpaceToolItem) => {
    const furthestX = nodes.reduce((max, node) => Math.max(max, node.position.x), 0);
    const newNode: SpacesNode = {
      id: `node-${tool.type}-${crypto.randomUUID()}`,
      type: tool.type,
      position: {
        x: nodes.length ? furthestX + 360 : 180,
        y: 180 + (nodes.length % 3) * 36,
      },
      data: { ...tool.defaultData },
    };
    addNode(newNode);
    window.dispatchEvent(new Event('nexus-spaces-fit'));
  };

  const onDragStart = (event: React.DragEvent, tool: SpaceToolItem) => {
    event.dataTransfer.setData('application/reactflow-type', tool.type);
    event.dataTransfer.setData('application/reactflow-data', JSON.stringify(tool.defaultData));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside
      className={`absolute inset-y-0 right-0 z-30 flex w-[290px] flex-col border-l border-white/[0.08] bg-[#080b12]/98 shadow-2xl shadow-black/40 backdrop-blur-xl transition-transform duration-200 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      dir="rtl"
      aria-hidden={!isOpen}
    >
      <div className="border-b border-white/[0.07] p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">الأدوات</h2>
            <p className="mt-0.5 text-[11px] text-gray-600">انقر للإضافة أو اسحب للمكان المناسب</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-white/[0.06] hover:text-white"
            aria-label="إغلاق مكتبة الأدوات"
          >
            <X size={15} />
          </button>
        </div>

        <label className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-2.5 focus-within:border-indigo-500/60">
          <Search size={14} className="text-gray-600" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="ابحث عن أداة..."
            className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-gray-600"
          />
        </label>

        <div className="mt-3 flex gap-1 overflow-x-auto no-scrollbar">
          {SPACE_TOOL_CATEGORIES.map((category) => (
            <button
              type="button"
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`whitespace-nowrap rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-colors ${
                activeCategory === category.id
                  ? 'bg-white/10 text-white'
                  : 'text-gray-600 hover:text-gray-300'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto p-2.5">
        {filteredTools.map((tool) => (
          <button
            type="button"
            key={`${tool.type}-${tool.title}`}
            draggable
            onDragStart={(event) => onDragStart(event, tool)}
            onClick={() => addTool(tool)}
            className="block w-full cursor-grab rounded-xl px-3 py-2.5 text-right transition-colors hover:bg-white/[0.06] active:cursor-grabbing"
          >
            <span className="block text-xs font-bold text-gray-200">{tool.title}</span>
            <span className="mt-1 block text-[10px] leading-4 text-gray-600">{tool.description}</span>
          </button>
        ))}
        {!filteredTools.length && (
          <p className="px-3 py-10 text-center text-xs text-gray-600">لا توجد نتيجة مطابقة.</p>
        )}
      </div>
    </aside>
  );
};
