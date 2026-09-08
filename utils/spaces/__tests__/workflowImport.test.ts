import { describe, expect, it } from 'vitest';
import { sanitizeWorkflowImport } from '../workflowImport';

const valid = {
  schema: 'nexus-spaces',
  version: 2,
  workflowName: 'Test',
  nodes: [
    { id: 'a', type: 'textPrompt', position: { x: 1, y: 2 }, data: { title: 'A', category: 'input', prompt: 'hello', status: 'running', media_id: 99 } },
    { id: 'b', type: 'imageGen', position: { x: 3, y: 4 }, data: { title: 'B', category: 'image', modelId: 'imagen-4.0-ultra-generate-001' } },
  ],
  edges: [{ id: 'e', source: 'a', target: 'b', sourceHandle: 'prompt-out', targetHandle: 'prompt-in' }],
};

describe('Spaces workflow import hardening', () => {
  it('rebuilds trusted fields, resets runtime state, and migrates retired models', () => {
    const result = sanitizeWorkflowImport(valid);
    expect(result.nodes[0].data.status).toBe('idle');
    expect(result.nodes[0].data.media_id).toBeUndefined();
    expect(result.nodes[1].data.modelId).toBe('gemini-3-pro-image');
    expect(result.edges).toHaveLength(1);
  });

  it('rejects disabled simulated tools', () => {
    expect(() => sanitizeWorkflowImport({
      ...valid,
      nodes: [{ id: 'fake', type: 'lipsync', position: {}, data: { title: 'fake' } }],
      edges: [],
    })).toThrow('غير مدعومة');
  });

  it('rejects cycles and occupied input handles', () => {
    const bad = {
      ...valid,
      nodes: [
        { id: 'a', type: 'imageGen', position: {}, data: { title: 'A', category: 'image' } },
        { id: 'b', type: 'upscale', position: {}, data: { title: 'B', category: 'edit' } },
      ],
      edges: [
        { id: 'e1', source: 'a', target: 'b', sourceHandle: 'image-out', targetHandle: 'image-in' },
        { id: 'e2', source: 'b', target: 'a', sourceHandle: 'image-out', targetHandle: 'image-in' },
      ],
    };
    expect(() => sanitizeWorkflowImport(bad)).toThrow('دورة مغلقة');
  });
});

