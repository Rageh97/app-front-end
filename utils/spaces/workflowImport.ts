import type { Edge } from '@xyflow/react';
import type { SpacesNode, WorkflowNodeData } from '@/stores/spacesStore';
import { getConnectionError } from './workflowGraph';

const ALLOWED_TYPES = new Set([
  'textPrompt', 'imageUpload', 'imageGen', 'nano', 'upscale', 'bgRemove', 'restore',
  'colorize', 'product', 'avatar', 'videoGen', 'video', 'motion', 'tts', 'output', 'outputMedia',
]);

const ALLOWED_CATEGORIES = new Set(['input', 'image', 'video', 'audio', 'edit', 'assistant', 'output']);
const MODEL_ALIASES: Record<string, string> = {
  'gemini-3.1-flash-image-preview': 'gemini-3.1-flash-image',
  'gemini-omni-flash-preview': 'gemini-omni-1.1-flash',
  'imagen-4.0-ultra-generate-preview-06-06': 'gemini-3-pro-image',
  'imagen-4.0-ultra-generate-001': 'gemini-3-pro-image',
};

function safeString(value: unknown, max: number): string | undefined {
  return typeof value === 'string' ? value.slice(0, max) : undefined;
}

function safeNumber(value: unknown): number | undefined {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function safeMediaUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  return /^(https?:\/\/|data:image\/(png|jpeg|webp);base64,|data:audio\/[a-z0-9.+-]+;base64,|data:video\/[a-z0-9.+-]+;base64,)/i.test(value)
    ? value
    : undefined;
}

function sanitizeData(raw: any): WorkflowNodeData {
  const category = ALLOWED_CATEGORIES.has(raw.category) ? raw.category : 'input';
  const modelId = safeString(raw.modelId, 160);
  const outputType = ['image', 'video', 'audio', 'text'].includes(raw.output?.type) ? raw.output.type : undefined;
  const outputUrl = safeMediaUrl(raw.output?.url);
  const outputText = safeString(raw.output?.text, 20_000);

  return {
    title: safeString(raw.title, 160) || 'عقدة',
    category,
    status: 'idle',
    toolId: safeString(raw.toolId, 160),
    prompt: safeString(raw.prompt, 20_000),
    negativePrompt: safeString(raw.negativePrompt, 10_000),
    aspectRatio: safeString(raw.aspectRatio, 20),
    style: safeString(raw.style, 160),
    scale: safeNumber(raw.scale),
    duration: safeNumber(raw.duration),
    modelId: modelId ? (MODEL_ALIASES[modelId] || modelId) : undefined,
    voiceId: safeString(raw.voiceId, 160),
    speed: safeNumber(raw.speed),
    intensity: safeString(raw.intensity, 80),
    resolution: safeString(raw.resolution, 20),
    imageUrl: safeMediaUrl(raw.imageUrl),
    videoUrl: safeMediaUrl(raw.videoUrl),
    audioUrl: safeMediaUrl(raw.audioUrl),
    output: outputType && (outputUrl || outputText)
      ? { type: outputType, url: outputUrl, text: outputText }
      : undefined,
  } as WorkflowNodeData;
}

export function sanitizeWorkflowImport(parsed: any): {
  workflowName: string;
  nodes: SpacesNode[];
  edges: Edge[];
} {
  if (parsed?.schema !== 'nexus-spaces' || parsed?.version !== 2) throw new Error('إصدار الملف غير مدعوم');
  if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) throw new Error('بنية ملف المشروع غير صالحة');
  if (parsed.nodes.length > 200 || parsed.edges.length > 500) throw new Error('المشروع يتجاوز الحدود الآمنة');

  const seenNodeIds = new Set<string>();
  const nodes: SpacesNode[] = parsed.nodes.map((raw: any) => {
    if (!raw || typeof raw.id !== 'string' || !ALLOWED_TYPES.has(raw.type) || !raw.data) {
      throw new Error('يحتوي الملف على عقدة غير صالحة أو غير مدعومة');
    }
    const id = raw.id.slice(0, 160);
    if (!id || seenNodeIds.has(id)) throw new Error('يحتوي الملف على معرف عقدة مكرر');
    seenNodeIds.add(id);
    return {
      id,
      type: raw.type,
      position: {
        x: safeNumber(raw.position?.x) ?? 0,
        y: safeNumber(raw.position?.y) ?? 0,
      },
      data: sanitizeData(raw.data),
    };
  });

  const edges: Edge[] = [];
  const seenEdgeIds = new Set<string>();
  parsed.edges.forEach((raw: any) => {
    if (!raw || typeof raw.id !== 'string' || typeof raw.source !== 'string' || typeof raw.target !== 'string') {
      throw new Error('يحتوي الملف على توصيل غير صالح');
    }
    const edge: Edge = {
      id: raw.id.slice(0, 160),
      source: raw.source.slice(0, 160),
      target: raw.target.slice(0, 160),
      sourceHandle: safeString(raw.sourceHandle, 80),
      targetHandle: safeString(raw.targetHandle, 80),
      animated: true,
      style: { stroke: '#3b82f6', strokeWidth: 2 },
    };
    if (!edge.id || seenEdgeIds.has(edge.id)) throw new Error('يحتوي الملف على معرف توصيل مكرر');
    const error = getConnectionError(edge, nodes, edges);
    if (error) throw new Error(`توصيل غير صالح: ${error}`);
    seenEdgeIds.add(edge.id);
    edges.push(edge);
  });

  return {
    workflowName: safeString(parsed.workflowName, 160) || 'مشروع Spaces مستورد',
    nodes,
    edges,
  };
}

