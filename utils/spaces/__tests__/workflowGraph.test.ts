import { describe, expect, it } from 'vitest';
import { Edge } from '@xyflow/react';
import { SpacesNode } from '@/stores/spacesStore';
import { getConnectionError, topologicalSort, validateWorkflow } from '../workflowGraph';
import { WORKFLOW_TEMPLATES } from '../templates';

const node = (id: string, type: string, data: any = {}): SpacesNode => ({
  id,
  type,
  position: { x: 0, y: 0 },
  data: { title: id, category: 'input', status: 'idle', ...data },
});

describe('Spaces workflow graph safety', () => {
  it('rejects incompatible media connections', () => {
    const nodes = [node('text', 'textPrompt'), node('upscale', 'upscale')];
    expect(getConnectionError({
      source: 'text', target: 'upscale', sourceHandle: 'prompt-out', targetHandle: 'image-in',
    }, nodes, [])).toContain('غير متوافق');
  });

  it('rejects cycles before any execution', () => {
    const nodes = [node('a', 'imageGen'), node('b', 'upscale')];
    const edges: Edge[] = [{
      id: 'a-b', source: 'a', target: 'b', sourceHandle: 'image-out', targetHandle: 'image-in',
    }];
    expect(getConnectionError({
      source: 'b', target: 'a', sourceHandle: 'image-out', targetHandle: 'image-in',
    }, nodes, edges)).toContain('دورة مغلقة');
    expect(() => topologicalSort(nodes, [...edges, {
      id: 'b-a', source: 'b', target: 'a', sourceHandle: 'image-out', targetHandle: 'image-in',
    }])).toThrow('دورة مغلقة');
  });

  it('finds missing required inputs in a workflow', () => {
    const errors = validateWorkflow([
      node('upload', 'imageUpload'),
      node('lip', 'lipsync', { category: 'video' }),
      node('output', 'output', { category: 'output' }),
    ], []);
    expect(errors.some((error) => error.includes('رفع صورة'))).toBe(true);
    expect(errors.some((error) => error.includes('مقطع صوتي') || error.includes('صوت متصل'))).toBe(true);
    expect(errors.some((error) => error.includes('غير متصلة'))).toBe(true);
  });

  it('ships templates with valid graphs and only intentional upload prerequisites', () => {
    WORKFLOW_TEMPLATES.forEach((template) => {
      const unexpected = validateWorkflow(template.nodes, template.edges)
        .filter((error) => !error.includes('تحتاج إلى رفع صورة'));
      expect(unexpected, template.title).toEqual([]);
      expect(() => topologicalSort(template.nodes, template.edges)).not.toThrow();
    });
  });
});
