import { describe, expect, it } from 'vitest';

import type { OrgChartDocument } from './orgchart';
import { isChartDocument, parseChartDocument, validateChartDocument } from './chartValidation';

const validChart = (): OrgChartDocument => ({
  schemaVersion: 2,
  name: 'Test',
  updatedAt: '2026-05-21T00:00:00.000Z',
  nodes: [
    {
      id: 'root',
      parentId: null,
      title: 'Root',
      person: 'A',
      levelType: 'B-0',
      country: '',
      regio: '',
      color: 'executive',
      status: 'active',
      order: 10,
    },
    {
      id: 'child',
      parentId: 'root',
      title: 'Child',
      person: 'B',
      levelType: 'B-2',
      country: '',
      regio: '',
      color: 'standard',
      status: 'active',
      order: 10,
    },
  ],
});

describe('chartValidation', () => {
  it('accepts a valid chart document', () => {
    expect(validateChartDocument(validChart())).toEqual([]);
  });

  it('rejects duplicate ids', () => {
    const chart = validChart();
    chart.nodes = [...chart.nodes, { ...chart.nodes[1], id: 'root' }];

    expect(validateChartDocument(chart)).toContain('Duplicate node id: root');
  });

  it('rejects missing parents', () => {
    const chart = validChart();
    chart.nodes = chart.nodes.map((node) => (node.id === 'child' ? { ...node, parentId: 'missing' } : node));

    expect(validateChartDocument(chart)).toContain('Missing parent missing for node child');
  });

  it('rejects cycles', () => {
    const chart = validChart();
    chart.nodes = chart.nodes.map((node) =>
      node.id === 'root' ? { ...node, parentId: 'child' } : { ...node, parentId: 'root' },
    );

    expect(validateChartDocument(chart)).toContain('Cycle detected at node root');
  });

  it('parses a valid chart document from JSON', () => {
    expect(parseChartDocument(JSON.stringify(validChart()))).toEqual(validChart());
  });

  it('throws a domain error for malformed JSON', () => {
    expect(() => parseChartDocument('{')).toThrow('Imported file is not valid JSON.');
  });

  it('rejects zero roots', () => {
    const chart = validChart();
    chart.nodes = chart.nodes.map((node) => ({ ...node, parentId: 'child' }));

    expect(validateChartDocument(chart)).toContain('Chart must contain exactly one root node.');
  });

  it('rejects multiple roots', () => {
    const chart = validChart();
    chart.nodes = chart.nodes.map((node) => ({ ...node, parentId: null }));

    expect(validateChartDocument(chart)).toContain('Chart must contain exactly one root node.');
  });

  it('rejects unknown color tokens', () => {
    const chart = validChart();
    const importedChart = {
      ...chart,
      nodes: chart.nodes.map((node) => (node.id === 'child' ? { ...node, color: 'invalid' } : node)),
    } as unknown as OrgChartDocument;

    expect(validateChartDocument(importedChart)).toContain('Unknown color invalid for node child');
  });

  it('rejects unknown color tokens through the shape guard', () => {
    const chart = validChart();
    const importedChart = {
      ...chart,
      nodes: chart.nodes.map((node) => (node.id === 'child' ? { ...node, color: 'invalid' } : node)),
    };

    expect(isChartDocument(importedChart)).toBe(false);
  });

  it('rejects unknown level types through the shape guard', () => {
    const chart = validChart();
    const importedChart = {
      ...chart,
      nodes: chart.nodes.map((node) => (node.id === 'child' ? { ...node, levelType: 'invalid' } : node)),
    };

    expect(isChartDocument(importedChart)).toBe(false);
    expect(() => parseChartDocument(JSON.stringify(importedChart))).toThrow(
      'Imported file is not an orgchart document.',
    );
  });

  it('rejects unknown statuses through the shape guard', () => {
    const chart = validChart();
    const importedChart = {
      ...chart,
      nodes: chart.nodes.map((node) => (node.id === 'child' ? { ...node, status: 'invalid' } : node)),
    };

    expect(isChartDocument(importedChart)).toBe(false);
    expect(() => parseChartDocument(JSON.stringify(importedChart))).toThrow(
      'Imported file is not an orgchart document.',
    );
  });
});
