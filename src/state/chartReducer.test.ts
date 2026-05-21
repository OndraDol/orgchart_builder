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

  it('undoes a change', () => {
    const state = createInitialChartState(SOURCE_ORGCHART);
    const changed = chartReducer(state, { type: 'add-child', parentId: SOURCE_ORGCHART.nodes[0].id });
    const undone = chartReducer(changed, { type: 'undo' });

    expect(undone.history.current.nodes.length).toBe(SOURCE_ORGCHART.nodes.length);
  });

  it('keeps state and sets warning when deleting root', () => {
    const state = createInitialChartState(SOURCE_ORGCHART);
    const result = chartReducer(state, { type: 'delete', nodeId: SOURCE_ORGCHART.nodes[0].id });

    expect(result.history.current).toBe(state.history.current);
    expect(result.warning).toBe('Cannot delete the root node.');
  });

  it('keeps chart unchanged and sets warning when move is invalid', () => {
    const state = { ...createInitialChartState(SOURCE_ORGCHART), movingNodeId: SOURCE_ORGCHART.nodes[0].id };
    const result = chartReducer(state, { type: 'move-as-child', targetParentId: SOURCE_ORGCHART.nodes[0].id });

    expect(result.history.current).toBe(state.history.current);
    expect(result.warning).toBe('Cannot move a node into itself.');
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
