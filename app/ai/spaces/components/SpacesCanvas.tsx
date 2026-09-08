'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  reconnectEdge,
  Edge,
  Connection,
  FinalConnectionState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSpacesStore, SpacesNode } from '@/stores/spacesStore';
import { getConnectionError } from '@/utils/spaces/workflowGraph';
import { SPACE_TOOLS, SpaceToolItem } from '@/utils/spaces/toolCatalog';
import { nodeTypes } from './nodes/nodeTypes';
import { edgeTypes } from './edges/edgeTypes';
import { ToolPicker } from './ToolPicker';

interface SpacesCanvasProps {
  onOpenLibrary: () => void;
}

type StarterKind = 'image' | 'video' | 'audio';

interface PendingConnection {
  source: string;
  sourceHandle: string;
}

const compatibleToolsForHandle = (handleId: string) => {
  if (handleId === 'prompt-out') return ['imageGen', 'imageTool', 'videoGen', 'tts'];
  if (handleId === 'image-out') {
    return ['imageGen', 'imageTool', 'product', 'avatar', 'upscale', 'bgRemove', 'restore', 'colorize', 'videoGen', 'motion', 'output'];
  }
  if (handleId === 'video-out' || handleId === 'audio-out') return ['output'];
  return [];
};

const targetHandleForTool = (sourceHandle: string, toolType: string) => {
  if (toolType === 'output') return 'media-in';
  if (sourceHandle === 'prompt-out') return toolType === 'tts' ? 'text-in' : 'prompt-in';
  if (sourceHandle === 'image-out') return 'image-in';
  return 'media-in';
};

const CanvasInner: React.FC<SpacesCanvasProps> = ({ onOpenLibrary }) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, fitView } = useReactFlow();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerPoint, setPickerPoint] = useState<{ x: number; y: number } | null>(null);
  const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(null);
  const [starterKind, setStarterKind] = useState<StarterKind>('image');
  const [starterPrompt, setStarterPrompt] = useState('');

  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setSelectedNodeId,
    invalidateNodeAndDescendants,
  } = useSpacesStore();

  const validateConnection = useCallback(
    (connection: Connection | Edge, ignoredEdgeId?: string) =>
      getConnectionError(connection, nodes, edges, ignoredEdgeId),
    [nodes, edges]
  );

  const handleConnect = useCallback((connection: Connection) => {
    const error = validateConnection(connection);
    if (error) {
      toast.error(error);
      return;
    }
    onConnect(connection);
  }, [onConnect, validateConnection]);

  const onReconnect = useCallback((oldEdge: Edge, newConnection: Connection) => {
    const error = validateConnection(newConnection, oldEdge.id);
    if (error) {
      toast.error(error);
      return;
    }
    setEdges(reconnectEdge(oldEdge, newConnection, edges));
    invalidateNodeAndDescendants(oldEdge.target);
    if (newConnection.target) invalidateNodeAndDescendants(newConnection.target);
    toast.success('تم تعديل التوصيل');
  }, [edges, setEdges, invalidateNodeAndDescendants, validateConnection]);

  const onEdgeDoubleClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    setEdges(edges.filter((item) => item.id !== edge.id));
    invalidateNodeAndDescendants(edge.target);
    toast.success('تم إلغاء التوصيل');
  }, [edges, setEdges, invalidateNodeAndDescendants]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const createNode = useCallback((tool: SpaceToolItem, position: { x: number; y: number }): SpacesNode => ({
    id: `node-${tool.type}-${crypto.randomUUID()}`,
    type: tool.type,
    position,
    data: { ...tool.defaultData },
  }), []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow-type');
    const dataStr = event.dataTransfer.getData('application/reactflow-data');
    if (!type) return;

    try {
      const defaultData = dataStr ? JSON.parse(dataStr) : {};
      addNode({
        id: `node-${type}-${crypto.randomUUID()}`,
        type,
        position: screenToFlowPosition({ x: event.clientX, y: event.clientY }),
        data: defaultData,
      });
    } catch {
      toast.error('تعذر إضافة الأداة إلى المساحة');
    }
  }, [screenToFlowPosition, addNode]);

  const openPickerAt = useCallback((clientPoint?: { x: number; y: number }) => {
    setPendingConnection(null);
    setPickerPoint(clientPoint || null);
    setIsPickerOpen(true);
  }, []);

  const addToolFromPicker = useCallback((tool: SpaceToolItem) => {
    const bounds = reactFlowWrapper.current?.getBoundingClientRect();
    const screenPoint = pickerPoint || {
      x: (bounds?.left || 0) + (bounds?.width || window.innerWidth) / 2,
      y: (bounds?.top || 0) + (bounds?.height || window.innerHeight) / 2,
    };
    const node = createNode(tool, screenToFlowPosition(screenPoint));
    addNode(node);
    if (pendingConnection) {
      onConnect({
        source: pendingConnection.source,
        sourceHandle: pendingConnection.sourceHandle,
        target: node.id,
        targetHandle: targetHandleForTool(pendingConnection.sourceHandle, tool.type),
      });
      toast.success('تمت إضافة الخطوة وربطها تلقائيًا');
    }
    setPendingConnection(null);
  }, [addNode, createNode, onConnect, pendingConnection, pickerPoint, screenToFlowPosition]);

  const handleConnectEnd = useCallback((event: MouseEvent | TouchEvent, state: FinalConnectionState) => {
    if (state.isValid || !state.fromNode || !state.fromHandle || state.toNode) return;
    const sourceHandle = state.fromHandle.id;
    if (!sourceHandle || !compatibleToolsForHandle(sourceHandle).length) return;
    const point = 'changedTouches' in event
      ? { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY }
      : { x: event.clientX, y: event.clientY };
    setPendingConnection({ source: state.fromNode.id, sourceHandle });
    setPickerPoint(point);
    setIsPickerOpen(true);
  }, []);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.matches('input, textarea, select, [contenteditable="true"]');
      if (isTyping) return;
      if (event.key === '/' || (event.key.toLowerCase() === 'a' && event.shiftKey)) {
        event.preventDefault();
        openPickerAt();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [openPickerAt]);

  useEffect(() => {
    const handleFitRequest = () => {
      window.setTimeout(() => fitView({ padding: 0.18, duration: 350 }), 40);
    };
    window.addEventListener('nexus-spaces-fit', handleFitRequest);
    return () => window.removeEventListener('nexus-spaces-fit', handleFitRequest);
  }, [fitView]);

  const createStarterWorkflow = () => {
    const prompt = starterPrompt.trim();
    if (!prompt) {
      toast.error('اكتب فكرتك أولاً');
      return;
    }

    const promptTool = SPACE_TOOLS.find((tool) => tool.type === 'textPrompt')!;
    const generatorType = starterKind === 'image' ? 'imageGen' : starterKind === 'video' ? 'videoGen' : 'tts';
    const generatorTool = SPACE_TOOLS.find((tool) => tool.type === generatorType)!;
    const outputTool = SPACE_TOOLS.find((tool) => tool.type === 'output')!;
    const bounds = reactFlowWrapper.current?.getBoundingClientRect();
    const center = screenToFlowPosition({
      x: (bounds?.left || 0) + (bounds?.width || window.innerWidth) / 2,
      y: (bounds?.top || 0) + (bounds?.height || window.innerHeight) / 2,
    });

    const promptNode = createNode(promptTool, { x: center.x - 520, y: center.y - 120 });
    promptNode.data.prompt = prompt;
    const generatorNode = createNode(generatorTool, { x: center.x - 140, y: center.y - 150 });
    const outputNode = createNode(outputTool, { x: center.x + 250, y: center.y - 90 });
    const targetHandle = starterKind === 'audio' ? 'text-in' : 'prompt-in';
    const sourceHandle = starterKind === 'image' ? 'image-out' : starterKind === 'video' ? 'video-out' : 'audio-out';

    setNodes([promptNode, generatorNode, outputNode]);
    setEdges([
      {
        id: `e-${promptNode.id}-${generatorNode.id}`,
        source: promptNode.id,
        sourceHandle: 'prompt-out',
        target: generatorNode.id,
        targetHandle,
        type: 'deletable',
        animated: true,
      },
      {
        id: `e-${generatorNode.id}-${outputNode.id}`,
        source: generatorNode.id,
        sourceHandle,
        target: outputNode.id,
        targetHandle: 'media-in',
        type: 'deletable',
        animated: true,
      },
    ]);
    window.setTimeout(() => fitView({ padding: 0.18, duration: 350 }), 50);
    toast.success('تم تجهيز المسار. راجع الإعدادات ثم شغّله.');
  };

  return (
    <div
      ref={reactFlowWrapper}
      className="relative h-full w-full overflow-hidden bg-[#06080e]"
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDoubleClick={(event) => {
        const target = event.target as HTMLElement;
        if (target.classList.contains('react-flow__pane')) {
          openPickerAt({ x: event.clientX, y: event.clientY });
        }
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onConnectEnd={handleConnectEnd}
        isValidConnection={(connection) => !validateConnection(connection)}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onReconnect={onReconnect}
        onEdgeDoubleClick={onEdgeDoubleClick}
        onPaneClick={() => setSelectedNodeId(null)}
        onPaneContextMenu={(event) => {
          event.preventDefault();
          openPickerAt({ x: event.clientX, y: event.clientY });
        }}
        deleteKeyCode={['Backspace', 'Delete']}
        fitView
        minZoom={0.2}
        maxZoom={2.5}
        connectionRadius={35}
        connectionLineStyle={{ stroke: '#6366f1', strokeWidth: 2 }}
        defaultEdgeOptions={{
          type: 'deletable',
          animated: true,
          style: { stroke: '#475569', strokeWidth: 2 },
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1.1} color="#1e293b" className="bg-[#06080e]" />
        <Controls className="!overflow-hidden !rounded-xl !border !border-white/10 !bg-[#0c101d]/90 !shadow-xl [&>button]:!border-b [&>button]:!border-white/5 [&>button]:!bg-transparent [&>button]:!text-gray-400 hover:[&>button]:!bg-white/10 hover:[&>button]:!text-white" />
        {nodes.length > 7 && (
          <MiniMap
            nodeColor={(node) => {
              if (node.data.status === 'running') return '#6366f1';
              if (node.data.status === 'success') return '#10b981';
              if (node.data.status === 'error') return '#ef4444';
              return '#1e293b';
            }}
            maskColor="rgba(6, 8, 14, 0.85)"
            className="!overflow-hidden !rounded-xl !border !border-white/10 !bg-[#0c101d]/90 !shadow-xl"
          />
        )}
      </ReactFlow>

      {nodes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-5">
          <div className="pointer-events-auto w-full max-w-2xl rounded-2xl border border-white/[0.08] bg-[#0a0d15]/95 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl" dir="rtl">
            <p className="text-xs font-semibold text-indigo-300">ابدأ من الفكرة</p>
            <h2 className="mt-1 text-xl font-bold text-white">ماذا تريد أن تصنع؟</h2>
            <p className="mt-1 text-xs leading-5 text-gray-500">سنجهز لك المسار الأساسي تلقائيًا، ويمكنك تعديله بحرية بعد ذلك.</p>

            <div className="mt-4 flex gap-1 rounded-xl bg-white/[0.035] p-1">
              {([
                ['image', 'صورة'],
                ['video', 'فيديو'],
                ['audio', 'تعليق صوتي'],
              ] as Array<[StarterKind, string]>).map(([kind, label]) => (
                <button
                  type="button"
                  key={kind}
                  onClick={() => setStarterKind(kind)}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                    starterKind === kind ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <textarea
              value={starterPrompt}
              onChange={(event) => setStarterPrompt(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) createStarterWorkflow();
              }}
              rows={3}
              placeholder={starterKind === 'image' ? 'مثال: لقطة سينمائية لمنتج فاخر...' : starterKind === 'video' ? 'صف المشهد والحركة والصوت...' : 'اكتب نص التعليق الصوتي...'}
              className="mt-3 w-full resize-none rounded-xl border border-white/[0.09] bg-[#05070c] px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-gray-700 focus:border-indigo-500/60"
            />

            <div className="mt-3 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onOpenLibrary}
                className="text-xs font-semibold text-gray-500 transition-colors hover:text-white"
              >
                بناء المسار يدويًا
              </button>
              <button
                type="button"
                onClick={createStarterWorkflow}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-indigo-500"
              >
                تجهيز المسار
              </button>
            </div>
          </div>
        </div>
      )}

      {nodes.length > 0 && (
        <button
          type="button"
          onClick={() => openPickerAt()}
          className="absolute right-4 top-4 z-20 flex items-center gap-2 rounded-xl border border-white/10 bg-[#0c101d]/95 px-3 py-2 text-xs font-bold text-gray-200 shadow-lg backdrop-blur-md transition-colors hover:border-indigo-500/40 hover:bg-[#111729] hover:text-white"
        >
          <Plus size={14} />
          <span>إضافة خطوة</span>
          <kbd className="mr-1 rounded bg-black/30 px-1.5 py-0.5 text-[9px] font-normal text-gray-600">/</kbd>
        </button>
      )}

      <ToolPicker
        isOpen={isPickerOpen}
        onClose={() => {
          setIsPickerOpen(false);
          setPendingConnection(null);
        }}
        onSelect={addToolFromPicker}
        compatibleTypes={pendingConnection ? compatibleToolsForHandle(pendingConnection.sourceHandle) : undefined}
        title={pendingConnection ? 'اختر الخطوة التالية' : 'إضافة خطوة للمسار'}
      />

      <style jsx global>{`
        .react-flow__node,
        .react-flow__node-output,
        .react-flow__node-input,
        .react-flow__node-default {
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
          box-shadow: none !important;
          color: inherit !important;
          width: auto !important;
          text-align: inherit !important;
        }
        .react-flow__handle {
          width: 12px !important;
          height: 12px !important;
          border-radius: 50% !important;
          border: 2px solid #0b0f19 !important;
          z-index: 50 !important;
          cursor: crosshair !important;
          transition: transform 0.15s ease, box-shadow 0.15s ease !important;
        }
        .react-flow__handle:hover {
          transform: scale(1.4) !important;
          box-shadow: 0 0 10px rgba(99, 102, 241, 0.8) !important;
        }
        .react-flow__handle-connecting { background: #6366f1 !important; }
        .react-flow__handle-valid { background: #10b981 !important; }
      `}</style>
    </div>
  );
};

export const SpacesCanvas: React.FC<SpacesCanvasProps> = (props) => (
  <ReactFlowProvider>
    <CanvasInner {...props} />
  </ReactFlowProvider>
);
