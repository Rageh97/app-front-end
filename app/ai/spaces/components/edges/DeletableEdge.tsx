'use client';

import React, { useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  EdgeProps,
} from '@xyflow/react';
import { useSpacesStore } from '@/stores/spacesStore';
import { X, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const DeletableEdge: React.FC<EdgeProps> = ({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
}) => {
  const { edges, setEdges, nodes } = useSpacesStore();
  const [isHovered, setIsHovered] = useState(false);

  // Check if the source node has executed successfully or is currently running
  const sourceNode = nodes.find((n) => n.id === source);
  const isExecuted = sourceNode?.data?.status === 'success' && !!sourceNode?.data?.output;
  const isRunning = sourceNode?.data?.status === 'running';

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEdges(edges.filter((edge) => edge.id !== id));
    toast.success('تم إلغاء التوصيل');
  };

  const isHighlighted = selected || isHovered;

  // Modern subtle glowing strokes
  const defaultStroke = isExecuted
    ? '#10b981'
    : isRunning
    ? '#6366f1'
    : '#475569';

  const edgeStroke = isHighlighted ? '#f43f5e' : defaultStroke;

  return (
    <>
      {/* Invisible wider path to make hovering/interaction smooth */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={28}
        className="cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleDelete}
      />

      {/* Visible Edge Line */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: edgeStroke,
          strokeWidth: isHighlighted ? 2.5 : isExecuted ? 2.2 : 1.8,
          strokeDasharray: isHighlighted ? '4 3' : undefined,
          transition: 'stroke 0.2s, stroke-width 0.2s',
          filter: isExecuted
            ? 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.4))'
            : isRunning
            ? 'drop-shadow(0 0 6px rgba(99, 102, 241, 0.6))'
            : undefined,
        }}
      />

      {/* Delete badge - ONLY rendered when hovered or selected, or clean status badge when executing */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan transition-opacity duration-200"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {isHighlighted ? (
            <button
              type="button"
              onClick={handleDelete}
              title="إلغاء التوصيل"
              className="w-5 h-5 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 transition-transform scale-110 active:scale-90 border border-white/40"
            >
              <X size={11} className="stroke-[2.5]" />
            </button>
          ) : isRunning ? (
            <div className="w-4 h-4 rounded-full bg-indigo-500/20 border border-indigo-400 flex items-center justify-center shadow-sm">
              <Loader2 size={9} className="animate-spin text-indigo-400" />
            </div>
          ) : isExecuted ? (
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center shadow-sm">
              <Check size={8} className="text-emerald-400 stroke-[3]" />
            </div>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
