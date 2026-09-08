import { describe, expect, it } from 'vitest';
import { NEXUS_AI_TOOLS } from '@/lib/nexus-ai-catalog';
import { SPACE_TOOLS } from '../toolCatalog';

describe('Spaces tool catalog', () => {
  it('contains every image, image-edit, trend, and image-understanding tool', () => {
    const expected = NEXUS_AI_TOOLS
      .filter((tool) => ['image', 'edit', 'trend'].includes(tool.category) || tool.id === 'image-to-text')
      .map((tool) => tool.id);
    const actual = new Set(SPACE_TOOLS.map((tool) => tool.defaultData.toolId).filter(Boolean));
    expect(expected.filter((id) => !actual.has(id))).toEqual([]);
  });
});
