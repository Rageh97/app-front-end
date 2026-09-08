import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
} from '@xyflow/react';

export interface WorkflowNodeData {
  title: string;
  category: 'input' | 'image' | 'video' | 'audio' | 'edit' | 'assistant' | 'output';
  toolId?: string;
  status: 'idle' | 'waiting' | 'running' | 'success' | 'error';
  progress?: number;
  error?: string;
  // Parameters
  prompt?: string;
  negativePrompt?: string;
  aspectRatio?: string;
  style?: string;
  scale?: number;
  duration?: number;
  modelId?: string;
  voiceId?: string;
  speed?: number;
  intensity?: string;
  resolution?: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  // Output result
  output?: {
    type: 'image' | 'video' | 'audio' | 'text';
    url?: string;
    text?: string;
  };
  creditsCost?: number;
  [key: string]: any;
}

export type SpacesNode = Node<WorkflowNodeData>;

export interface SpaceProject {
  id: string;
  name: string;
  nodes: SpacesNode[];
  edges: Edge[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkflowOptions {
  name?: string;
  nodes?: SpacesNode[];
  edges?: Edge[];
}

export interface PreviewModalData {
  isOpen: boolean;
  nodeId?: string;
  url?: string;
  type?: 'image' | 'video' | 'audio' | 'text';
  text?: string;
  prompt?: string;
  is_public?: boolean;
  media_id?: number;
}

export interface SpacesState {
  projects: SpaceProject[];
  hasHydrated: boolean;
  workflowId: string | null;
  workflowName: string;
  isSaving: boolean;
  lastSavedAt: string | null;

  // React Flow State
  nodes: SpacesNode[];
  edges: Edge[];
  selectedNodeId: string | null;

  // Execution State
  isRunning: boolean;
  activeNodeId: string | null;
  logs: string[];

  // Global Preview Modal State
  previewModal: PreviewModalData;

  // Actions
  setHasHydrated: (value: boolean) => void;
  createWorkflow: (options?: CreateWorkflowOptions) => string;
  openWorkflow: (id: string) => boolean;
  duplicateWorkflow: (id: string) => string | null;
  renameWorkflow: (id: string, name: string) => void;
  deleteWorkflow: (id: string) => void;
  setNodes: (nodes: SpacesNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: (changes: NodeChange<SpacesNode>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: SpacesNode) => void;
  updateNodeData: (nodeId: string, data: Partial<WorkflowNodeData>) => void;
  removeNode: (nodeId: string) => void;
  setSelectedNodeId: (id: string | null) => void;
  setWorkflowMeta: (meta: { id?: string; name?: string }) => void;
  markSaved: () => void;
  saveWorkflow: () => Promise<void>;
  setIsRunning: (running: boolean) => void;
  setActiveNodeId: (id: string | null) => void;
  addLog: (log: string) => void;
  clearLogs: () => void;
  resetWorkflow: () => void;
  loadTemplate: (nodes: SpacesNode[], edges: Edge[], name: string) => void;
  invalidateNodeAndDescendants: (nodeId: string) => void;
  openPreview: (data: Omit<PreviewModalData, 'isOpen'>) => void;
  closePreview: () => void;
}

// ─── مسار عمل افتراضي مبدئي (Initial Starter Pipeline) ───
const DEFAULT_NODES: SpacesNode[] = [
  {
    id: 'node-prompt-1',
    type: 'textPrompt',
    position: { x: 80, y: 180 },
    data: {
      title: 'الوصف والأمر النصي',
      category: 'input',
      status: 'idle',
      prompt: 'صورة سينمائية عالية الدقة لفنجان قهوة فاخر يتصاعد منه البخار على طاولة خشبية دافئة بإضاءة شمس ذهبية',
    },
  },
  {
    id: 'node-gen-1',
    type: 'imageGen',
    position: { x: 420, y: 150 },
    data: {
      title: 'استوديو توليد الصور',
      category: 'image',
      status: 'idle',
      modelId: 'gemini-3-pro-image',
      resolution: '4K',
      aspectRatio: '1:1',
      style: 'photorealistic',
      creditsCost: 54,
    },
  },
  {
    id: 'node-upscale-1',
    type: 'upscale',
    position: { x: 760, y: 180 },
    data: {
      title: 'مضاعف الدقة 4K',
      category: 'edit',
      status: 'idle',
      scale: 4,
      creditsCost: 12,
    },
  },
  {
    id: 'node-output-1',
    type: 'output',
    position: { x: 1080, y: 160 },
    data: {
      title: 'المخرجات النهائية',
      category: 'output',
      status: 'idle',
    },
  },
];

const DEFAULT_EDGES: Edge[] = [
  {
    id: 'e1-2',
    source: 'node-prompt-1',
    sourceHandle: 'prompt-out',
    target: 'node-gen-1',
    targetHandle: 'prompt-in',
    animated: true,
    style: { stroke: '#10b981', strokeWidth: 2 },
  },
  {
    id: 'e2-3',
    source: 'node-gen-1',
    sourceHandle: 'image-out',
    target: 'node-upscale-1',
    targetHandle: 'image-in',
    animated: true,
    style: { stroke: '#3b82f6', strokeWidth: 2 },
  },
  {
    id: 'e3-4',
    source: 'node-upscale-1',
    sourceHandle: 'image-out',
    target: 'node-output-1',
    targetHandle: 'media-in',
    animated: true,
    style: { stroke: '#8b5cf6', strokeWidth: 2 },
  },
];

function createSpaceId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `space-${crypto.randomUUID()}`;
  }
  return `space-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function cloneNodes(nodes: SpacesNode[]): SpacesNode[] {
  return nodes.map((node) => ({
    ...node,
    position: { ...node.position },
    data: { ...node.data, output: node.data.output ? { ...node.data.output } : undefined },
  }));
}

function cloneEdges(edges: Edge[]): Edge[] {
  return edges.map((edge) => ({
    ...edge,
    data: edge.data ? { ...edge.data } : undefined,
    style: edge.style ? { ...edge.style } : undefined,
  }));
}

function sanitizeRuntimeNodes(nodes: SpacesNode[]): SpacesNode[] {
  return cloneNodes(nodes).map((node) => node.data.status === 'running'
    ? {
        ...node,
        data: {
          ...node.data,
          status: 'idle' as const,
          progress: undefined,
          error: undefined,
        },
      }
    : node
  );
}

const RUNTIME_DATA_KEYS = new Set(['status', 'progress', 'error', 'output', 'is_public', 'media_id']);

function getAffectedNodeIds(nodeId: string, edges: Edge[]): Set<string> {
  const affected = new Set<string>([nodeId]);
  const queue = [nodeId];
  while (queue.length) {
    const current = queue.shift()!;
    edges.filter((edge) => edge.source === current).forEach((edge) => {
      if (!affected.has(edge.target)) {
        affected.add(edge.target);
        queue.push(edge.target);
      }
    });
  }
  return affected;
}

function invalidateNodes(nodes: SpacesNode[], ids: Set<string>): SpacesNode[] {
  return nodes.map((node) => ids.has(node.id)
    ? {
        ...node,
        data: {
          ...node.data,
          status: 'idle' as const,
          progress: undefined,
          error: undefined,
          output: undefined,
          media_id: undefined,
          is_public: undefined,
        },
      }
    : node
  );
}

const spacesIndexedStorage: StateStorage = {
  getItem: async (name) => {
    if (typeof window === 'undefined') return null;
    try {
      const { default: localforage } = await import('localforage');
      const stored = await localforage.getItem<string>(name);
      return stored ?? window.localStorage.getItem(name);
    } catch {
      return window.localStorage.getItem(name);
    }
  },
  setItem: async (name, value) => {
    if (typeof window === 'undefined') return;
    try {
      const { default: localforage } = await import('localforage');
      await localforage.setItem(name, value);
      window.localStorage.removeItem(name);
    } catch {
      window.localStorage.setItem(name, value);
    }
  },
  removeItem: async (name) => {
    if (typeof window === 'undefined') return;
    try {
      const { default: localforage } = await import('localforage');
      await localforage.removeItem(name);
    } finally {
      window.localStorage.removeItem(name);
    }
  },
};

export const useSpacesStore = create<SpacesState>()(
  persist(
    (set, get) => ({
      projects: [],
      hasHydrated: false,
      workflowId: null,
      workflowName: 'مشروع مساحة عمل جديد',
      isSaving: false,
      lastSavedAt: null,

      nodes: [],
      edges: [],
      selectedNodeId: null,

      isRunning: false,
      activeNodeId: null,
      logs: [],

      previewModal: { isOpen: false },

      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      createWorkflow: (options = {}) => {
        const id = createSpaceId();
        const now = new Date().toISOString();
        const name = options.name?.trim() || 'مساحة جديدة';
        const nodes = cloneNodes(options.nodes || []);
        const edges = cloneEdges(options.edges || []);
        const project: SpaceProject = { id, name, nodes, edges, createdAt: now, updatedAt: now };
        set({
          projects: [project, ...get().projects],
          workflowId: id,
          workflowName: name,
          nodes,
          edges,
          selectedNodeId: null,
          isRunning: false,
          activeNodeId: null,
          logs: [],
          lastSavedAt: now,
          previewModal: { isOpen: false },
        });
        return id;
      },

      openWorkflow: (id) => {
        const project = get().projects.find((item) => item.id === id);
        if (!project) return false;
        set({
          workflowId: project.id,
          workflowName: project.name,
          nodes: sanitizeRuntimeNodes(project.nodes),
          edges: cloneEdges(project.edges),
          selectedNodeId: null,
          isRunning: false,
          activeNodeId: null,
          logs: [],
          lastSavedAt: project.updatedAt,
          previewModal: { isOpen: false },
        });
        return true;
      },

      duplicateWorkflow: (id) => {
        const source = get().projects.find((item) => item.id === id);
        if (!source) return null;
        const copyId = createSpaceId();
        const now = new Date().toISOString();
        const copy: SpaceProject = {
          id: copyId,
          name: `${source.name} - نسخة`,
          nodes: cloneNodes(source.nodes),
          edges: cloneEdges(source.edges),
          createdAt: now,
          updatedAt: now,
        };
        set({ projects: [copy, ...get().projects] });
        return copyId;
      },

      renameWorkflow: (id, name) => {
        const cleanName = name.trim() || 'مساحة عمل بدون اسم';
        const now = new Date().toISOString();
        const isCurrent = get().workflowId === id;
        set({
          projects: get().projects.map((project) =>
            project.id === id ? { ...project, name: cleanName, updatedAt: now } : project
          ),
          ...(isCurrent ? { workflowName: cleanName, lastSavedAt: now } : {}),
        });
      },

      deleteWorkflow: (id) => {
        const isCurrent = get().workflowId === id;
        set({
          projects: get().projects.filter((item) => item.id !== id),
          ...(isCurrent ? {
            workflowId: null,
            workflowName: 'مشروع مساحة عمل جديد',
            nodes: [],
            edges: [],
            selectedNodeId: null,
            logs: [],
            lastSavedAt: null,
          } : {}),
        });
      },

      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),

      onNodesChange: (changes) => {
        const currentNodes = get().nodes;
        const currentEdges = get().edges;
        const removedIds = new Set(changes.flatMap((change) => change.type === 'remove' ? [change.id] : []));
        const affected = new Set<string>();
        currentEdges
          .filter((edge) => removedIds.has(edge.source))
          .forEach((edge) => getAffectedNodeIds(edge.target, currentEdges).forEach((id) => affected.add(id)));
        const nextNodes = applyNodeChanges(changes, currentNodes) as SpacesNode[];
        set({
          nodes: invalidateNodes(nextNodes, affected),
          edges: currentEdges.filter((edge) => !removedIds.has(edge.source) && !removedIds.has(edge.target)),
          selectedNodeId: get().selectedNodeId && removedIds.has(get().selectedNodeId!) ? null : get().selectedNodeId,
        });
      },

      onEdgesChange: (changes) => {
        const currentEdges = get().edges;
        const removedTargetIds = changes
          .flatMap((change) => change.type === 'remove' ? [change.id] : [])
          .map((id) => currentEdges.find((edge) => edge.id === id)?.target)
          .filter((id): id is string => !!id);
        const affected = new Set<string>();
        removedTargetIds.forEach((id) => getAffectedNodeIds(id, currentEdges).forEach((nodeId) => affected.add(nodeId)));
        set({
          nodes: invalidateNodes(get().nodes, affected),
          edges: applyEdgeChanges(changes, currentEdges),
        });
      },

      onConnect: (connection) => {
        const newEdge: Edge = {
          ...connection,
          id: `e-${connection.source}-${connection.target}-${Date.now()}`,
          type: 'deletable',
          animated: true,
          style: { stroke: '#3b82f6', strokeWidth: 2 },
        };

        const nextEdges = addEdge(newEdge, get().edges);
        const affected = connection.target
          ? getAffectedNodeIds(connection.target, nextEdges)
          : new Set<string>();

        set({
          nodes: invalidateNodes(get().nodes, affected),
          edges: nextEdges,
        });
      },

      addNode: (node) => {
        set({
          nodes: [...get().nodes, node],
          selectedNodeId: node.id,
        });
      },

      updateNodeData: (nodeId, data) => {
        const shouldInvalidate = Object.keys(data).some((key) => !RUNTIME_DATA_KEYS.has(key));
        const affected = shouldInvalidate ? getAffectedNodeIds(nodeId, get().edges) : new Set<string>();
        set({
          nodes: get().nodes.map((node) => {
            if (affected.has(node.id) && node.id !== nodeId) {
              return invalidateNodes([node], new Set([node.id]))[0];
            }
            if (node.id === nodeId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  ...(shouldInvalidate ? {
                    status: 'idle' as const,
                    progress: undefined,
                    error: undefined,
                    output: undefined,
                    media_id: undefined,
                    is_public: undefined,
                  } : {}),
                  ...data,
                },
              };
            }
            return node;
          }),
        });
      },

      removeNode: (nodeId) => {
        const currentEdges = get().edges;
        const affected = new Set<string>();
        currentEdges
          .filter((edge) => edge.source === nodeId)
          .forEach((edge) => getAffectedNodeIds(edge.target, currentEdges).forEach((id) => affected.add(id)));
        set({
          nodes: invalidateNodes(get().nodes.filter((node) => node.id !== nodeId), affected),
          edges: currentEdges.filter(
            (edge) => edge.source !== nodeId && edge.target !== nodeId
          ),
          selectedNodeId: get().selectedNodeId === nodeId ? null : get().selectedNodeId,
        });
      },

      setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),

      setWorkflowMeta: ({ id, name }) =>
        set((state) => ({
          workflowId: id !== undefined ? id : state.workflowId,
          workflowName: name !== undefined ? name : state.workflowName,
        })),

      markSaved: () => set({ lastSavedAt: new Date().toISOString() }),

      saveWorkflow: async () => {
        set({ isSaving: true });
        try {
          const savedAt = new Date().toISOString();
          const state = get();
          if (!state.workflowId) return;
          const projects = state.projects.map((project) => project.id === state.workflowId
            ? {
                ...project,
                name: state.workflowName,
                nodes: cloneNodes(state.nodes),
                edges: cloneEdges(state.edges),
                updatedAt: savedAt,
              }
            : project
          );
          set({ projects, lastSavedAt: savedAt });

          const current = get();
          const snapshot = {
            state: {
              projects,
              workflowId: current.workflowId,
              workflowName: current.workflowName,
              nodes: sanitizeRuntimeNodes(current.nodes),
              edges: cloneEdges(current.edges),
              lastSavedAt: savedAt,
            },
            version: 3,
          };
          await spacesIndexedStorage.setItem('nexus_spaces_workflow_v1', JSON.stringify(snapshot));
        } finally {
          set({ isSaving: false });
        }
      },

      setIsRunning: (isRunning) => set({ isRunning }),
      setActiveNodeId: (activeNodeId) => set({ activeNodeId }),

      addLog: (log) =>
        set((state) => ({
          logs: [`[${new Date().toLocaleTimeString('ar-EG')}] ${log}`, ...state.logs.slice(0, 49)],
        })),

      clearLogs: () => set({ logs: [] }),

      resetWorkflow: () => {
        set({
          nodes: [],
          edges: [],
          selectedNodeId: null,
          isRunning: false,
          activeNodeId: null,
          logs: [],
          previewModal: { isOpen: false },
        });
      },

      loadTemplate: (templateNodes, templateEdges, name) =>
        set({
          workflowName: name,
          nodes: cloneNodes(templateNodes),
          edges: cloneEdges(templateEdges),
          selectedNodeId: null,
          isRunning: false,
          activeNodeId: null,
          logs: [],
          lastSavedAt: null,
          previewModal: { isOpen: false },
        }),

      invalidateNodeAndDescendants: (nodeId) => {
        const affected = getAffectedNodeIds(nodeId, get().edges);
        set({ nodes: invalidateNodes(get().nodes, affected) });
      },

      openPreview: (data) =>
        set({
          previewModal: {
            ...data,
            isOpen: true,
          },
        }),

      closePreview: () =>
        set({
          previewModal: {
            isOpen: false,
          },
        }),
    }),
    {
      name: 'nexus_spaces_workflow_v1',
      version: 3,
      partialize: (state) => ({
        projects: state.projects.map((project) => ({
          ...project,
          nodes: sanitizeRuntimeNodes(project.nodes),
          edges: cloneEdges(project.edges),
        })),
        workflowId: state.workflowId,
        workflowName: state.workflowName,
        nodes: sanitizeRuntimeNodes(state.nodes),
        edges: cloneEdges(state.edges),
        lastSavedAt: state.lastSavedAt,
      }),
      migrate: (persistedState: any) => {
        if (!persistedState) return persistedState;
        const modelAliases: Record<string, string> = {
          'gemini-3.1-flash-image-preview': 'gemini-3.1-flash-image',
          'gemini-omni-flash-preview': 'gemini-omni-1.1-flash',
          'imagen-4.0-ultra-generate-preview-06-06': 'gemini-3-pro-image',
          'imagen-4.0-ultra-generate-001': 'gemini-3-pro-image',
        };
        const normalizeNodes = (nodes: SpacesNode[] = []) => nodes.map((node: SpacesNode) => ({
          ...node,
          data: {
            ...node.data,
            modelId: modelAliases[node.data.modelId || ''] || node.data.modelId,
            status: node.data.status === 'running' ? 'idle' : node.data.status,
            error: node.data.status === 'running' ? undefined : node.data.error,
          },
        }));

        const legacyId = persistedState.workflowId || 'space-migrated-workflow';
        const legacyUpdatedAt = persistedState.lastSavedAt || new Date().toISOString();
        const projects: SpaceProject[] = Array.isArray(persistedState.projects)
          ? persistedState.projects.map((project: SpaceProject) => ({
              ...project,
              nodes: normalizeNodes(project.nodes),
              edges: cloneEdges(project.edges || []),
            }))
          : [{
              id: legacyId,
              name: persistedState.workflowName || 'مساحتي الأولى',
              nodes: normalizeNodes(persistedState.nodes || DEFAULT_NODES),
              edges: cloneEdges(persistedState.edges || DEFAULT_EDGES),
              createdAt: legacyUpdatedAt,
              updatedAt: legacyUpdatedAt,
            }];
        const activeProject = projects.find((project) => project.id === legacyId) || projects[0];

        return {
          ...persistedState,
          projects,
          workflowId: activeProject?.id || null,
          workflowName: activeProject?.name || 'مشروع مساحة عمل جديد',
          nodes: activeProject ? normalizeNodes(activeProject.nodes) : [],
          edges: activeProject ? cloneEdges(activeProject.edges) : [],
        };
      },
      storage: createJSONStorage(() => spacesIndexedStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.setNodes(state.nodes.map((node) => node.data.status === 'running'
          ? { ...node, data: { ...node.data, status: 'idle' as const, progress: undefined, error: undefined } }
          : node
        ));
        state.setIsRunning(false);
        state.setActiveNodeId(null);
        state.setHasHydrated(true);
      },
    }
  )
);
