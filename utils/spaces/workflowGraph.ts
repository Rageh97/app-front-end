import { Connection, Edge } from '@xyflow/react';
import { SpacesNode } from '@/stores/spacesStore';

export type WorkflowMediaType = 'text' | 'image' | 'video' | 'audio';

const SOURCE_TYPES: Record<string, WorkflowMediaType> = {
  'prompt-out': 'text',
  'image-out': 'image',
  'video-out': 'video',
  'audio-out': 'audio',
};

const TARGET_TYPES: Record<string, WorkflowMediaType[]> = {
  'prompt-in': ['text'],
  'text-in': ['text'],
  'image-in': ['image'],
  'video-in': ['video'],
  'audio-in': ['audio'],
  'face-in': ['image', 'video'],
  'media-in': ['text', 'image', 'video', 'audio'],
};

function hasPath(edges: Edge[], from: string, to: string): boolean {
  const queue = [from];
  const visited = new Set<string>();

  while (queue.length) {
    const current = queue.shift()!;
    if (current === to) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    edges.filter((edge) => edge.source === current).forEach((edge) => queue.push(edge.target));
  }

  return false;
}

export function getConnectionError(
  connection: Connection | Edge,
  nodes: SpacesNode[],
  edges: Edge[],
  ignoredEdgeId?: string
): string | null {
  const { source, target, sourceHandle, targetHandle } = connection;
  if (!source || !target || !sourceHandle || !targetHandle) return 'توصيل غير مكتمل';
  if (!nodes.some((node) => node.id === source) || !nodes.some((node) => node.id === target)) {
    return 'إحدى العقد غير موجودة';
  }
  if (source === target) return 'لا يمكن توصيل العقدة بنفسها';

  const sourceType = SOURCE_TYPES[sourceHandle];
  const acceptedTypes = TARGET_TYPES[targetHandle];
  if (!sourceType || !acceptedTypes?.includes(sourceType)) {
    return 'نوع المخرج غير متوافق مع هذا المدخل';
  }

  const relevantEdges = ignoredEdgeId ? edges.filter((edge) => edge.id !== ignoredEdgeId) : edges;
  if (relevantEdges.some((edge) =>
    edge.source === source && edge.target === target &&
    edge.sourceHandle === sourceHandle && edge.targetHandle === targetHandle
  )) {
    return 'هذا التوصيل موجود بالفعل';
  }

  if (relevantEdges.some((edge) =>
    edge.target === target && edge.targetHandle === targetHandle
  )) {
    return 'هذا المدخل متصل بالفعل؛ احذف التوصيل القديم أولاً';
  }

  if (hasPath(relevantEdges, target, source)) return 'هذا التوصيل سينشئ دورة مغلقة';
  return null;
}

export function topologicalSort(nodes: SpacesNode[], edges: Edge[]): SpacesNode[] {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const inDegree = new Map(nodes.map((node) => [node.id, 0]));
  const adjacency = new Map(nodes.map((node) => [node.id, [] as string[]]));

  edges.forEach((edge) => {
    if (!nodeMap.has(edge.source) || !nodeMap.has(edge.target)) return;
    adjacency.get(edge.source)!.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  });

  const queue = nodes.filter((node) => inDegree.get(node.id) === 0).map((node) => node.id);
  const sorted: SpacesNode[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    sorted.push(nodeMap.get(id)!);
    adjacency.get(id)!.forEach((targetId) => {
      const nextDegree = (inDegree.get(targetId) || 0) - 1;
      inDegree.set(targetId, nextDegree);
      if (nextDegree === 0) queue.push(targetId);
    });
  }

  if (sorted.length !== nodes.length) throw new Error('المسار يحتوي على دورة مغلقة؛ احذف أحد التوصيلات المتعارضة');
  return sorted;
}

function hasIncoming(nodeId: string, handles: string[], edges: Edge[]): boolean {
  return edges.some((edge) => edge.target === nodeId && handles.includes(edge.targetHandle || ''));
}

export function validateWorkflow(nodes: SpacesNode[], edges: Edge[]): string[] {
  const errors: string[] = [];
  const nodeIds = new Set(nodes.map((node) => node.id));

  edges.forEach((edge) => {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      errors.push('يوجد توصيل يشير إلى عقدة محذوفة');
    }
  });

  try {
    topologicalSort(nodes, edges);
  } catch (error: any) {
    errors.push(error.message);
  }

  nodes.forEach((node) => {
    const title = node.data.title || node.id;
    const hasImage = !!node.data.imageUrl || hasIncoming(node.id, ['image-in'], edges);
    const hasText = !!node.data.prompt?.trim() || hasIncoming(node.id, ['prompt-in', 'text-in'], edges);
    const hasVideo = !!node.data.videoUrl || hasIncoming(node.id, ['video-in'], edges);

    if (node.type === 'imageUpload' && !node.data.imageUrl) errors.push(`[${title}] تحتاج إلى رفع صورة`);
    if ((node.type === 'imageGen' || node.type === 'nano' || node.type === 'tts') && !hasText) {
      errors.push(`[${title}] تحتاج إلى نص أو أمر متصل`);
    }
    if (['upscale', 'bgRemove', 'restore', 'colorize', 'product', 'avatar', 'motion'].includes(node.type || '') && !hasImage) {
      errors.push(`[${title}] تحتاج إلى صورة متصلة`);
    }
    if (node.type === 'imageTool' && node.data.requiresImage && !hasImage) {
      errors.push(`[${title}] تحتاج إلى صورة متصلة`);
    }
    if (node.type === 'imageTool' && node.data.toolId === 'logo' && !hasText) {
      errors.push(`[${title}] تحتاج إلى اسم أو وصف للعلامة`);
    }
    if ((node.type === 'videoGen' || node.type === 'video') && !hasText && !hasImage) {
      errors.push(`[${title}] تحتاج إلى نص أو صورة متصلة`);
    }
    if (node.type === 'videoEffects' && !hasVideo) errors.push(`[${title}] تحتاج إلى فيديو متصل`);
    if (node.type === 'lipsync') {
      const hasFace = !!node.data.videoUrl || !!node.data.imageUrl || hasIncoming(node.id, ['face-in'], edges);
      const hasAudio = !!node.data.audioUrl || hasIncoming(node.id, ['audio-in'], edges);
      if (!hasFace) errors.push(`[${title}] تحتاج إلى صورة أو فيديو للوجه`);
      if (!hasAudio) errors.push(`[${title}] تحتاج إلى صوت متصل`);
    }
    if ((node.type === 'output' || node.type === 'outputMedia') && !hasIncoming(node.id, ['media-in'], edges)) {
      errors.push(`[${title}] غير متصلة بأي مخرج`);
    }
  });

  return Array.from(new Set(errors));
}

export function getDescendantIds(nodeId: string, edges: Edge[]): Set<string> {
  const descendants = new Set<string>();
  const queue = [nodeId];
  while (queue.length) {
    const current = queue.shift()!;
    edges.filter((edge) => edge.source === current).forEach((edge) => {
      if (!descendants.has(edge.target)) {
        descendants.add(edge.target);
        queue.push(edge.target);
      }
    });
  }
  return descendants;
}
