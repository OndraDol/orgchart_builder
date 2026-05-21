import { describe, expect, it } from 'vitest';

import { SOURCE_ORGCHART } from '../data/sourceOrgchart';
import { chartReducer, createInitialChartState } from './chartReducer';

describe('chartReducer', () => {
  it('adds a child and selects it', () => {
    const state = createInitialChartState(SOURCE_ORGCHART);
    const result = chartReducer(state, { type: 'add-child', parentId: SOURCE_ORGCHART.nodes[0].id });

    expect(result.history.current.nodes.length).toBe(SOURCE_ORGCHART.nodes.length + 1);
    expect(result.selectedNodeId).toMatch(/^new-role-/);
  });

  it('updates selected node fields', () => {
    const state = { ...createInitialChartState(SOURCE_ORGCHART), selectedNodeId: SOURCE_ORGCHART.nodes[0].id };
    const result = chartReducer(state, { type: 'update-selected', patch: { title: 'Updated' } });

    expect(result.history.current.nodes.find((node) => node.id === SOURCE_ORGCHART.nodes[0].id)?.title).toBe(
      'Updated',
    );
  });

  it('does not push history when selected node update is unchanged', () => {
    const selectedNode = SOURCE_ORGCHART.nodes[0];
    const state = {
      ...createInitialChartState(SOURCE_ORGCHART),
      selectedNodeId: selectedNode.id,
      warning: 'Previous warning',
    };
    const unchangedResult = chartReducer(state, { type: 'update-selected', patch: { title: selectedNode.title } });
    const emptyPatchResult = chartReducer(state, { type: 'update-selected', patch: {} });

    expect(unchangedResult.history.past).toHaveLength(0);
    expect(unchangedResult.history.current).toBe(state.history.current);
    expect(unchangedResult.warning).toBe('');
    expect(emptyPatchResult.history.past).toHaveLength(0);
    expect(emptyPatchResult.history.current).toBe(state.history.current);
    expect(emptyPatchResult.warning).toBe('');
  });

  it('undoes a change', () => {
    const state = createInitialChartState(SOURCE_ORGCHART);
    const changed = chartReducer(state, { type: 'add-child', parentId: SOURCE_ORGCHART.nodes[0].id });
    const undone = chartReducer(changed, { type: 'undo' });

    expect(undone.history.current.nodes.length).toBe(SOURCE_ORGCHART.nodes.length);
  });

  it('clears warning when undoing a change', () => {
    const state = createInitialChartState(SOURCE_ORGCHART);
    const changed = chartReducer(state, { type: 'add-child', parentId: SOURCE_ORGCHART.nodes[0].id });
    const undone = chartReducer({ ...changed, warning: 'Previous warning' }, { type: 'undo' });

    expect(undone.warning).toBe('');
  });

  it('keeps chart unchanged and sets warning when adding child to missing parent', () => {
    const state = createInitialChartState(SOURCE_ORGCHART);
    const result = chartReducer(state, { type: 'add-child', parentId: 'missing' });

    expect(result.history.current).toBe(state.history.current);
    expect(result.warning).toBe('Node not found: missing');
  });

  it('keeps chart unchanged and sets warning when selected node is stale', () => {
    const state = { ...createInitialChartState(SOURCE_ORGCHART), selectedNodeId: 'missing' };
    const result = chartReducer(state, { type: 'update-selected', patch: { title: 'Updated' } });

    expect(result.history.current).toBe(state.history.current);
    expect(result.warning).toBe('Node not found: missing');
  });

  it('keeps state and sets warning when deleting root', () => {
    const state = createInitialChartState(SOURCE_ORGCHART);
    const result = chartReducer(state, { type: 'delete', nodeId: SOURCE_ORGCHART.nodes[0].id });

    expect(result.history.current).toBe(state.history.current);
    expect(result.warning).toBe('Cannot delete the root node.');
  });

  it('clears moving node when deleting its ancestor', () => {
    const state = {
      ...createInitialChartState(SOURCE_ORGCHART),
      movingNodeId: 'country-payroll-manager-czsk-jitka-horejsi',
    };
    const result = chartReducer(state, { type: 'delete', nodeId: 'group-personnel-payroll-manager-martina-kahounova' });

    expect(result.movingNodeId).toBeNull();
  });

  it('keeps chart unchanged and sets warning when move is invalid', () => {
    const state = { ...createInitialChartState(SOURCE_ORGCHART), movingNodeId: SOURCE_ORGCHART.nodes[0].id };
    const result = chartReducer(state, { type: 'move-as-child', targetParentId: SOURCE_ORGCHART.nodes[0].id });

    expect(result.history.current).toBe(state.history.current);
    expect(result.warning).toBe('Cannot move a node into itself.');
  });

  it('clears warning when canceling move', () => {
    const state = {
      ...createInitialChartState(SOURCE_ORGCHART),
      movingNodeId: SOURCE_ORGCHART.nodes[1].id,
      warning: 'Previous warning',
    };
    const result = chartReducer(state, { type: 'cancel-move' });

    expect(result.movingNodeId).toBeNull();
    expect(result.warning).toBe('');
  });

  it('clears warning on simple user actions', () => {
    const state = { ...createInitialChartState(SOURCE_ORGCHART), warning: 'Previous warning' };

    expect(chartReducer(state, { type: 'select', nodeId: SOURCE_ORGCHART.nodes[0].id }).warning).toBe('');
    expect(chartReducer(state, { type: 'set-search', search: 'finance' }).warning).toBe('');
    expect(chartReducer(state, { type: 'set-orientation', orientation: 'horizontal' }).warning).toBe('');
  });

  it('resets transient state when replacing chart', () => {
    const dirtyState = {
      ...createInitialChartState(SOURCE_ORGCHART),
      selectedNodeId: SOURCE_ORGCHART.nodes[0].id,
      movingNodeId: SOURCE_ORGCHART.nodes[1].id,
      search: 'finance',
      warning: 'Previous warning',
    };

    const result = chartReducer(dirtyState, { type: 'replace-chart', chart: SOURCE_ORGCHART });

    expect(result).toEqual(createInitialChartState(SOURCE_ORGCHART));
  });
});
