import { describe, expect, it } from 'vitest';

import { SOURCE_ORGCHART } from '../data/sourceOrgchart';
import { validateChartDocument } from './chartValidation';
import type { OrgChartDocument } from './orgchart';
import {
  addChildNode,
  deleteNodeAndDescendants,
  moveNodeAsParent,
  moveNodeAsChild,
  moveNodeAsSibling,
  updateNode,
} from './chartOperations';

const baseChart = (): OrgChartDocument => ({
  schemaVersion: 5,
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
      id: 'child-a',
      parentId: 'root',
      title: 'Child A',
      person: 'B',
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
      person: 'C',
      levelType: 'B-2',
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
      levelType: 'B-2',
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
    const added = result.nodes.find((node) => node.parentId === 'child-a' && node.title === 'Nová role');

    expect(added).toMatchObject({ levelType: 'B-2', color: 'standard', status: 'active' });
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

  it('stores a manual position when moving a node as child from drag-and-drop', () => {
    const result = moveNodeAsChild(baseChart(), 'child-b', 'child-a', { x: 123, y: 456 });

    expect(result.nodes.find((node) => node.id === 'child-b')).toMatchObject({
      parentId: 'child-a',
      position: { x: 123, y: 456 },
    });
  });

  it('promotes a direct child and moves the source under it when dropping a node under its own descendant', () => {
    const result = moveNodeAsChild(baseChart(), 'child-a', 'grandchild');

    expect(result.nodes.find((node) => node.id === 'grandchild')).toMatchObject({ parentId: 'root' });
    expect(result.nodes.find((node) => node.id === 'child-a')).toMatchObject({ parentId: 'grandchild' });
    expect(validateChartDocument(result)).toEqual([]);
  });

  it('promotes Lubos Vorlik direct reports when moving him under Renata Havlova', () => {
    const sourceId = 'managing-director-czsk-lubos-vorlik';
    const targetId = 'financial-accounting-manager-cz-renata-havlova';
    const source = SOURCE_ORGCHART.nodes.find((node) => node.id === sourceId);
    const originalDirectChildIds = SOURCE_ORGCHART.nodes
      .filter((node) => node.parentId === sourceId)
      .map((node) => node.id);

    expect(source?.parentId).toBe('co-ceo-petr-vanecek');
    expect(originalDirectChildIds).toContain(targetId);

    const result = moveNodeAsChild(SOURCE_ORGCHART, sourceId, targetId, { x: 123, y: 456 });

    expect(result.nodes.find((node) => node.id === sourceId)).toMatchObject({
      parentId: targetId,
      position: { x: 123, y: 456 },
    });

    for (const childId of originalDirectChildIds) {
      expect(result.nodes.find((node) => node.id === childId)).toMatchObject({
        parentId: 'co-ceo-petr-vanecek',
      });
    }

    expect(validateChartDocument(result)).toEqual([]);
  });

  it('still blocks moving the root node under its own descendant', () => {
    expect(() => moveNodeAsChild(baseChart(), 'root', 'grandchild')).toThrow('Cannot move the root node.');
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

  it('moves a node as parent of a target node', () => {
    const result = moveNodeAsParent(baseChart(), 'grandchild', 'child-b');
    const moved = result.nodes.find((node) => node.id === 'grandchild');
    const target = result.nodes.find((node) => node.id === 'child-b');

    expect(moved).toMatchObject({ parentId: 'root' });
    expect(target).toMatchObject({ parentId: 'grandchild' });
  });

  it('blocks moving a node as parent of the root', () => {
    expect(() => moveNodeAsParent(baseChart(), 'child-a', 'root')).toThrow(
      'Cannot move a node above the root.',
    );
  });

  it('blocks moving a node above its own descendant', () => {
    expect(() => moveNodeAsParent(baseChart(), 'child-a', 'grandchild')).toThrow(
      'Cannot move a node above its own descendant.',
    );
  });

  it('blocks moving a node beside the root', () => {
    expect(() => moveNodeAsSibling(baseChart(), 'child-a', 'root', 'right')).toThrow(
      'Cannot move a node beside the root.',
    );
  });
});
