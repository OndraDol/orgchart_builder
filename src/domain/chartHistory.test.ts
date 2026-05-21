import { describe, expect, it } from 'vitest';

import type { OrgChartDocument } from './orgchart';
import { createHistory, pushHistory, undoHistory } from './chartHistory';

const chart = (name: string): OrgChartDocument => ({
  schemaVersion: 3,
  name,
  updatedAt: '2026-05-21T00:00:00.000Z',
  nodes: [
    {
      id: 'root',
      parentId: null,
      title: name,
      person: '',
      levelType: 'B-0',
      country: '',
      regio: '',
      color: 'executive',
      status: 'active',
      order: 10,
    },
  ],
});

describe('chartHistory', () => {
  it('creates history around the current chart', () => {
    const current = chart('A');

    expect(createHistory(current)).toEqual({ past: [], current, future: [] });
  });

  it('pushes a chart and clears future history', () => {
    const first = chart('A');
    const second = chart('B');
    const future = chart('C');

    expect(pushHistory({ past: [], current: first, future: [future] }, second)).toEqual({
      past: [first],
      current: second,
      future: [],
    });
  });

  it('undoes the current chart into future history', () => {
    const first = chart('A');
    const second = chart('B');
    const history = pushHistory(createHistory(first), second);

    expect(undoHistory(history)).toEqual({ past: [], current: first, future: [second] });
  });
});
