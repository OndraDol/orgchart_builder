import { describe, expect, it } from 'vitest';

import type { OrgChartDocument } from './orgchart';
import { layoutChart } from './chartLayout';

const chart: OrgChartDocument = {
  schemaVersion: 4,
  name: 'Layout',
  updatedAt: '2026-05-21T00:00:00.000Z',
  nodes: [
    {
      id: 'root',
      parentId: null,
      title: 'Root',
      person: '',
      levelType: 'B-0',
      country: '',
      regio: '',
      color: 'executive',
      status: 'active',
      order: 10,
    },
    {
      id: 'child-a',
      parentId: 'root',
      title: 'Child A',
      person: '',
      levelType: 'B-2',
      country: '',
      regio: '',
      color: 'standard',
      status: 'active',
      order: 10,
    },
    {
      id: 'child-b',
      parentId: 'root',
      title: 'Child B',
      person: '',
      levelType: 'B-2',
      country: '',
      regio: '',
      color: 'standard',
      status: 'active',
      order: 20,
    },
  ],
};

describe('layoutChart', () => {
  it('returns one positioned item per source node', () => {
    expect(layoutChart(chart, 'vertical').nodes.map((node) => node.id).sort()).toEqual(['child-a', 'child-b', 'root']);
  });

  it('uses different axes for horizontal layout', () => {
    const vertical = layoutChart(chart, 'vertical');
    const horizontal = layoutChart(chart, 'horizontal');

    expect(horizontal.nodes.find((node) => node.id === 'child-a')!.x).toBeGreaterThan(
      vertical.nodes.find((node) => node.id === 'child-a')!.x,
    );
  });

  it('returns one edge per parent-child relation', () => {
    expect(layoutChart(chart, 'vertical').edges).toEqual([
      { id: 'root-child-a', source: 'root', target: 'child-a' },
      { id: 'root-child-b', source: 'root', target: 'child-b' },
    ]);
  });

  it('uses PDF source positions and hides source-hidden nodes in source layout mode', () => {
    const sourceChart = {
      ...chart,
      schemaVersion: 4,
      nodes: [
        { ...chart.nodes[0], sourceHidden: true },
        { ...chart.nodes[1], sourcePosition: { x: 100, y: 120, width: 50, height: 30 } },
        {
          ...chart.nodes[2],
          sourcePosition: { x: 200, y: 220, width: 50, height: 30 },
          position: { x: 240, y: 260 },
        },
      ],
    };

    const layout = layoutChart(sourceChart as OrgChartDocument, 'vertical', 'source');

    expect(layout.nodes.map((node) => node.id).sort()).toEqual(['child-a', 'child-b']);
    expect(layout.nodes.find((node) => node.id === 'child-a')).toMatchObject({ x: 100, y: 120 });
    expect(layout.nodes.find((node) => node.id === 'child-b')).toMatchObject({ x: 240, y: 260 });
    expect(layout.edges).toEqual([]);
  });

  it('orders siblings by order value', () => {
    const layout = layoutChart(
      {
        ...chart,
        nodes: [
          chart.nodes[0],
          { ...chart.nodes[1], order: 20 },
          { ...chart.nodes[2], order: 10 },
        ],
      },
      'vertical',
    );

    expect(layout.nodes.find((node) => node.id === 'child-b')!.x).toBeLessThan(
      layout.nodes.find((node) => node.id === 'child-a')!.x,
    );
  });

  it('throws when chart has zero root nodes', () => {
    expect(() =>
      layoutChart(
        {
          ...chart,
          nodes: chart.nodes.map((node) => ({ ...node, parentId: 'missing-root' })),
        },
        'vertical',
      ),
    ).toThrow('Chart must contain exactly one root node.');
  });

  it('throws when chart has multiple root nodes', () => {
    expect(() =>
      layoutChart(
        {
          ...chart,
          nodes: chart.nodes.map((node) => (node.id === 'child-a' ? { ...node, parentId: null } : node)),
        },
        'vertical',
      ),
    ).toThrow('Chart must contain exactly one root node.');
  });
});
