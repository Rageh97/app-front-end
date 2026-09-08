import { beforeEach, describe, expect, it } from 'vitest';
import { useSpacesStore } from '@/stores/spacesStore';
import { searchSpaceTools, SPACE_TOOLS } from '@/utils/spaces/toolCatalog';

describe('Spaces project library', () => {
  beforeEach(() => {
    useSpacesStore.setState({
      projects: [],
      workflowId: null,
      workflowName: 'مشروع مساحة عمل جديد',
      nodes: [],
      edges: [],
      selectedNodeId: null,
      isRunning: false,
      activeNodeId: null,
      logs: [],
      lastSavedAt: null,
    });
  });

  it('creates and opens independent spaces', () => {
    const firstId = useSpacesStore.getState().createWorkflow({ name: 'الحملة الأولى' });
    const secondId = useSpacesStore.getState().createWorkflow({ name: 'الحملة الثانية' });

    expect(firstId).not.toBe(secondId);
    expect(useSpacesStore.getState().projects).toHaveLength(2);
    expect(useSpacesStore.getState().openWorkflow(firstId)).toBe(true);
    expect(useSpacesStore.getState().workflowName).toBe('الحملة الأولى');
  });

  it('duplicates and deletes a space without changing the source', () => {
    const sourceId = useSpacesStore.getState().createWorkflow({
      name: 'إعلان منتج',
      nodes: [{
        id: 'prompt-1',
        type: 'textPrompt',
        position: { x: 0, y: 0 },
        data: { title: 'النص', category: 'input', status: 'idle', prompt: 'اختبار' },
      }],
    });
    const copyId = useSpacesStore.getState().duplicateWorkflow(sourceId);

    expect(copyId).toBeTruthy();
    expect(useSpacesStore.getState().projects).toHaveLength(2);
    const copy = useSpacesStore.getState().projects.find((project) => project.id === copyId);
    expect(copy?.name).toContain('نسخة');

    useSpacesStore.getState().deleteWorkflow(sourceId);
    expect(useSpacesStore.getState().projects).toHaveLength(1);
    expect(useSpacesStore.getState().projects[0].id).toBe(copyId);
  });

  it('saves the active canvas back into the project library', async () => {
    const id = useSpacesStore.getState().createWorkflow({ name: 'مساحة تلقائية' });
    useSpacesStore.getState().setNodes([{
      id: 'image-1',
      type: 'imageGen',
      position: { x: 100, y: 100 },
      data: { title: 'صورة', category: 'image', status: 'idle' },
    }]);

    await useSpacesStore.getState().saveWorkflow();
    const saved = useSpacesStore.getState().projects.find((project) => project.id === id);
    expect(saved?.nodes).toHaveLength(1);
    expect(saved?.updatedAt).toBeTruthy();
  });
});

describe('Spaces tool search', () => {
  it('finds tools using Arabic and English keywords', () => {
    expect(searchSpaceTools('سينمائي').some((tool) => tool.type === 'videoGen')).toBe(true);
    expect(searchSpaceTools('upscale').some((tool) => tool.type === 'upscale')).toBe(true);
  });

  it('filters tools by category', () => {
    const audioTools = searchSpaceTools('', 'audio');
    expect(audioTools.length).toBeGreaterThan(0);
    expect(audioTools.every((tool) => tool.category === 'audio')).toBe(true);
    expect(SPACE_TOOLS.length).toBeGreaterThan(10);
  });
});
