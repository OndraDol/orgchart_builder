import { describe, expect, it } from 'vitest';

import type { OrgChartDocument } from './orgchart';
import {
  addChildNode,
  deleteNodeAndDescendants,
  moveNodeAsChild,
  moveNodeAsSibling,
  updateNode,
} from './chartOperations';

const baseChart = (): OrgChartDocument => ({
  schemaVersion: 1,
  name: 'Test',
  updatedAt: '2026-05-21T00:00:00.000Z',
  nodes: [
    {
      id: 'root',
      parentId: null,
      title: 'Root',
      person: 'A',
      levelType: 'holding',
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
      person: 'B',
      levelType: 'role',
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
      person: 'C',
      levelType: 'role',
      country: '',
      regio: '',
      color: 'standard',
      status: 'active',
      order: 20,
    },
    {
      id: 'grandchild',
      parentId: 'child-a',
      title: 'Grandchild',
      person: 'D',
      levelType: 'role',
      country: '',
      regio: '',
      color: 'standard',
      status: 'active',
      order: 10,
    },
  ],
});

describe('chartOperations', () => {
  it('adds a child under a selected node', () => {
    const result = addChildNode(baseChart(), 'child-a');
    const added = result.nodes.find((node) => node.parentId === 'child-a' && node.title === 'New role');

    expect(added).toMatchObject({ levelType: 'role', color: 'standard', status: 'active' });
  });

  it('updates editable node fields', () => {
    const result = updateNode(baseChart(), 'child-a', { title: 'Updated', country: 'CZ', color: 'country' });

    expect(result.nodes.find((node) => node.id === 'child-a')).toMatchObject({
      title: 'Updated',
      country: 'CZ',
      color: 'country',
    });
  });

  it('deletes a node and descendants', () => {
    const result = deleteNodeAndDescendants(baseChart(), 'child-a');

    expect(result.nodes.map((node) => node.id)).toEqual(['root', 'child-b']);
  });

  it('blocks deleting the root node', () => {
    expect(() => deleteNodeAndDescendants(baseChart(), 'root')).toThrow('Cannot delete the root node.');
  });

  it('moves a node as child of target', () => {
    const result = moveNodeAsChild(baseChart(), 'child-b', 'child-a');

    expect(result.nodes.find((node) => node.id === 'child-b')).toMatchObject({ parentId: 'child-a' });
  });

  it('blocks moving a node into its descendant', () => {
    expect(() => moveNodeAsChild(baseChart(), 'child-a', 'grandchild')).toThrow(
      'Cannot move a node into its own descendant.',
    );
  });

  it('detects cycles while traversing descendants', () => {
    const cyclicChart = baseChart();
    cyclicChart.nodes = cyclicChart.nodes.map((node) =>
      node.id === 'child-a' ? { ...node, parentId: 'grandchild' } : node,
    );

    expect(() => moveNodeAsChild(cyclicChart, 'child-a', 'root')).toThrow(
      'Cycle detected while traversing descendants.',
    );
  });

  it('moves a node beside target on the right', () => {
    const result = moveNodeAsSibling(baseChart(), 'child-a', 'child-b', 'right');
    const childA = result.nodes.find((node) => node.id === 'child-a');
    const childB = result.nodes.find((node) => node.id === 'child-b');

    expect(childA?.parentId).toBe('root');
    expect(childA!.order).toBeGreaterThan(childB!.order);
  });

  it('blocks moving a node beside the root', () => {
    expect(() => moveNodeAsSibling(baseChart(), 'child-a', 'root', 'right')).toThrow(
      'Cannot move a node beside the root.',
    );
  });
});
