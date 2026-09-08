import { Edge } from '@xyflow/react';
import { SpacesNode, useSpacesStore } from '@/stores/spacesStore';
import { executeNode, ExecutionContext } from './nodeExecutor';
import { topologicalSort, validateWorkflow } from './workflowGraph';
import toast from 'react-hot-toast';

export interface WorkflowExecutionOptions {
  apiBase: string;
  token?: string;
  forceAll?: boolean; // if true, re-runs cached nodes
  onProgress?: (nodeId: string, status: string) => void;
  onComplete?: () => void;
  onError?: (err: string) => void;
}

let activeController: AbortController | null = null;

export function cancelWorkflow() {
  activeController?.abort();
}

export function collectNodeInputs(
  nodeId: string,
  nodes: SpacesNode[],
  edges: Edge[],
  nodeOutputs: Map<string, any> = new Map(),
  nodeMediaIds: Map<string, number | undefined> = new Map()
): Record<string, any> {
  const inputs: Record<string, any> = {};
  edges.filter((edge) => edge.target === nodeId).forEach((edge) => {
    const sourceOutput = nodeOutputs.get(edge.source) || nodes.find((node) => node.id === edge.source)?.data.output;
    if (!sourceOutput) return;
    const sourceMediaId = nodeMediaIds.get(edge.source) || nodes.find((node) => node.id === edge.source)?.data.media_id;
    if (sourceMediaId) inputs.mediaId = sourceMediaId;

    switch (edge.targetHandle) {
      case 'prompt-in':
      case 'text-in':
        if (sourceOutput.type === 'text') inputs.prompt = sourceOutput.text;
        break;
      case 'image-in':
        if (sourceOutput.type === 'image') inputs.imageUrl = sourceOutput.url;
        break;
      case 'video-in':
        if (sourceOutput.type === 'video') inputs.videoUrl = sourceOutput.url;
        break;
      case 'audio-in':
        if (sourceOutput.type === 'audio') inputs.audioUrl = sourceOutput.url;
        break;
      case 'face-in':
        if (sourceOutput.type === 'image') inputs.imageUrl = sourceOutput.url;
        if (sourceOutput.type === 'video') inputs.videoUrl = sourceOutput.url;
        break;
      default:
        if (sourceOutput.type === 'text') inputs.prompt = sourceOutput.text;
        if (sourceOutput.type === 'image') inputs.imageUrl = sourceOutput.url;
        if (sourceOutput.type === 'video') inputs.videoUrl = sourceOutput.url;
        if (sourceOutput.type === 'audio') inputs.audioUrl = sourceOutput.url;
    }
  });
  return inputs;
}

/**
 * Propagate output from a finished node downstream to all directly and indirectly connected output nodes
 */
function propagateToOutputNodes(
  sourceId: string,
  outputData: any,
  nodes: SpacesNode[],
  edges: Edge[],
  updateNodeData: (id: string, data: any) => void,
  addLog: (log: string) => void,
  mediaId?: number
) {
  const queue = [sourceId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const outgoing = edges.filter((e) => e.source === currentId);
    for (const edge of outgoing) {
      const targetNode = nodes.find((n) => n.id === edge.target);
      if (targetNode) {
        if (targetNode.type === 'output' || targetNode.type === 'outputMedia') {
          updateNodeData(targetNode.id, {
            status: 'success',
            output: outputData,
            media_id: mediaId,
          });
          addLog(`📦 تم تحديث المخرجات النهائية (${targetNode.data.title}) تلقائياً`);
        } else {
          queue.push(targetNode.id);
        }
      }
    }
  }
}

/**
 * Run the full workflow with Smart Caching & Guaranteed Output Updating
 */
export async function runWorkflow(options: WorkflowExecutionOptions) {
  const store = useSpacesStore.getState();
  const { nodes, edges, updateNodeData, setIsRunning, setActiveNodeId, addLog } = store;

  if (store.isRunning) return;

  const validationErrors = validateWorkflow(nodes, edges);
  if (validationErrors.length) {
    const message = validationErrors.slice(0, 4).join(' — ');
    addLog(`⛔ تعذر بدء المسار: ${message}`);
    options.onError?.(message);
    return;
  }

  setIsRunning(true);
  activeController = new AbortController();
  addLog('🚀 بدء تشغيل مسار العمل الذكي...');

  const executionOrder = topologicalSort(nodes, edges);
  const nodeOutputs = new Map<string, any>();
  const nodeMediaIds = new Map<string, number | undefined>();

  try {
    for (const node of executionOrder) {
      // Never skip output nodes from refreshing their contents
      const isTerminalOutput = node.type === 'output' || node.type === 'outputMedia';

      // 1. If non-output node is already successful, has output, and we aren't forcing a full re-run:
      if (!isTerminalOutput && !options.forceAll && node.data.status === 'success' && node.data.output) {
        nodeOutputs.set(node.id, node.data.output);
        nodeMediaIds.set(node.id, node.data.media_id);
        addLog(`⚡ استخدام النتيجة المخزنة للعقدة [${node.data.title}] دون إعادة الاستهلاك`);
        continue;
      }

      setActiveNodeId(node.id);
      updateNodeData(node.id, { status: 'running', error: undefined });
      addLog(`▶ جاري معالجة: ${node.data.title}`);

      const inputs = collectNodeInputs(node.id, nodes, edges, nodeOutputs, nodeMediaIds);

      const context: ExecutionContext = {
        apiBase: options.apiBase,
        token: options.token,
        inputs,
        signal: activeController.signal,
      };

      const result = await executeNode(node.type || 'textPrompt', node.data, context);

      if (!result.success) {
        updateNodeData(node.id, { status: result.cancelled ? 'idle' : 'error', error: result.cancelled ? undefined : result.error });
        addLog(`❌ فشلت العقدة [${node.data.title}]: ${result.error}`);
        if (result.cancelled) throw new DOMException('تم إلغاء التنفيذ', 'AbortError');
        throw new Error(result.error || `خطأ في تنفيذ ${node.data.title}`);
      }

      nodeOutputs.set(node.id, result.output);
      nodeMediaIds.set(node.id, result.mediaId);
      updateNodeData(node.id, {
        status: 'success',
        output: result.output,
        media_id: result.mediaId,
        is_public: false,
      });
      addLog(`✅ اكتملت بنجاح: ${node.data.title}`);
    }

    addLog('🎉 اكتمل تنفيذ المسار بنجاح وتحديث كافة المخرجات!');
    options.onComplete?.();
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      addLog('⏹ تم إيقاف مسار العمل بأمان');
      options.onError?.('تم إلغاء التنفيذ');
    } else {
      addLog(`⚠️ توقف مسار العمل: ${err.message}`);
      options.onError?.(err.message);
    }
  } finally {
    activeController = null;
    setIsRunning(false);
    setActiveNodeId(null);
  }
}

/**
 * Execute ONLY a single node using cached outputs of upstream nodes,
 * AND instantly propagate the generated output to any connected Output nodes!
 */
export async function runSingleNode(nodeId: string, apiBase: string) {
  const store = useSpacesStore.getState();
  const { nodes, edges, updateNodeData, setIsRunning, setActiveNodeId, addLog } = store;

  if (store.isRunning) return;

  const targetNode = nodes.find((n) => n.id === nodeId);
  if (!targetNode) return;

  setIsRunning(true);
  activeController = new AbortController();
  setActiveNodeId(nodeId);
  updateNodeData(nodeId, { status: 'running', error: undefined });
  addLog(`🎯 تشغيل فوري للعقدة: ${targetNode.data.title}`);

  const token = typeof window !== 'undefined' ? localStorage.getItem('a') || localStorage.getItem('token') || undefined : undefined;

  try {
    const inputs = collectNodeInputs(nodeId, nodes, edges);

    const context: ExecutionContext = {
      apiBase,
      token,
      inputs,
      signal: activeController.signal,
    };

    const result = await executeNode(targetNode.type || 'textPrompt', targetNode.data, context);

    if (!result.success) {
      updateNodeData(nodeId, { status: result.cancelled ? 'idle' : 'error', error: result.cancelled ? undefined : result.error });
      addLog(`❌ فشلت العقدة [${targetNode.data.title}]: ${result.error}`);
      toast.error(result.error || 'فشلت عملية تشغيل العقدة');
      return;
    }

    updateNodeData(nodeId, {
      status: 'success',
      output: result.output,
      media_id: result.mediaId,
      is_public: false,
    });
    addLog(`✅ اكتمل تشغيل [${targetNode.data.title}] بنجاح`);
    toast.success(`تم تنفيذ [${targetNode.data.title}] بنجاح!`);

    // 2. Propagate the output to any downstream Output nodes automatically!
    propagateToOutputNodes(nodeId, result.output, nodes, edges, updateNodeData, addLog, result.mediaId);
  } catch (err: any) {
    updateNodeData(nodeId, { status: 'error', error: err.message });
    addLog(`⚠️ خطأ أثناء تشغيل العقدة: ${err.message}`);
    toast.error(err.message || 'حدث خطأ غير متوقع');
  } finally {
    activeController = null;
    setIsRunning(false);
    setActiveNodeId(null);
  }
}
