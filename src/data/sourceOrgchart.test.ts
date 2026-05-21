import { describe, expect, it } from 'vitest';

import { SOURCE_ORGCHART } from './sourceOrgchart';

describe('SOURCE_ORGCHART', () => {
  it('uses schema version 1 and has source nodes', () => {
    expect(SOURCE_ORGCHART.schemaVersion).toBe(1);
    expect(SOURCE_ORGCHART.nodes.length).toBeGreaterThan(20);
  });

  it('contains key roles visible in the attachment', () => {
    const titles = SOURCE_ORGCHART.nodes.map((node) => node.title);
    expect(titles).toContain('CO-Chief Executive Officer');
    expect(titles).toContain('Chief HR Officer');
    expect(titles).toContain('Chief Financial Officer');
    expect(titles).toContain('Managing Director CZ/SK');
  });

  it('has stable unique ids', () => {
    const ids = SOURCE_ORGCHART.nodes.map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
