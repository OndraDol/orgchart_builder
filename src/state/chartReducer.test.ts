import { describe, expect, it } from 'vitest';

import { SOURCE_ORGCHART } from '../data/sourceOrgchart';
import { chartReducer, createInitialChartState } from './chartReducer';

describe('chartReducer', () => {
  it('adds a child and selects it', () => {
    const state = createInitialChartState(SOURCE_ORGCHART);
    const result = chartReducer(state, { type: 'add-child', parentId: SOURCE_ORGCHART.nodes[0].id });

    expect(result.history.current.nodes.length).toBe(SOURCE_ORGCHART.nodes.length + 1);
    expect(result.selectedNodeId).toMatch(/^nov-role-/);
  });

  it('adds a child with the active country when working in a filtered country view', () => {
    const state = { ...createInitialChartState(SOURCE_ORGCHART), countryFilter: 'CZ' as const };
    const result = chartReducer(state, { type: 'add-child', parentId: 'country-ops-manager-jan-sokola' });
    const addedNode = result.history.current.nodes.find((node) => node.id === result.selectedNodeId);

    expect(addedNode).toMatchObject({
      country: 'CZ',
      countries: ['CZ'],
    });
  });

  it('starts in Auto strom layout mode and switches layout mode without mutating chart data', () => {
    const state = createInitialChartState(SOURCE_ORGCHART);
    expect(state.layoutMode).toBe('tree');

    const result = chartReducer(state, { type: 'set-layout-mode', layoutMode: 'source' } as never);

    expect(result.layoutMode).toBe('source');
    expect(result.history.current).toBe(state.history.current);
  });

  it('starts with the All country filter and switches country filter without mutating chart data', () => {
    const state = createInitialChartState(SOURCE_ORGCHART);

    expect(state.countryFilter).toBe('all');

    const result = chartReducer(state, { type: 'set-country-filter', countryFilter: 'SK' } as never);

    expect(result.countryFilter).toBe('SK');
    expect(result.history.current).toBe(state.history.current);
  });

  it('can start from a remembered PDF source layout mode', () => {
    const state = createInitialChartState(SOURCE_ORGCHART, 'source');

    expect(state.layoutMode).toBe('source');
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
    const result = chartReducer(state, { type: 'delete', nodeId: 'chief-hr-officer-marie-vorsilkova' });

    expect(result.movingNodeId).toBeNull();
  });

  it('keeps chart unchanged and sets warning when move is invalid', () => {
    const state = { ...createInitialChartState(SOURCE_ORGCHART), movingNodeId: SOURCE_ORGCHART.nodes[0].id };
    const result = chartReducer(state, { type: 'move-as-child', targetParentId: SOURCE_ORGCHART.nodes[0].id });

    expect(result.history.current).toBe(state.history.current);
    expect(result.warning).toBe('Cannot move a node into itself.');
  });

  it('drops a node as parent of a target node', () => {
    const state = createInitialChartState(SOURCE_ORGCHART);
    const result = chartReducer(state, {
      type: 'drop-as-parent',
      sourceId: 'group-it-development-project-manager-jakub-rehak',
      targetId: 'head-of-analytics-david-tatar',
    });

    expect(
      result.history.current.nodes.find((node) => node.id === 'group-it-development-project-manager-jakub-rehak'),
    ).toMatchObject({ parentId: 'chief-executive-officer-zdenek-demeter' });
    expect(result.history.current.nodes.find((node) => node.id === 'head-of-analytics-david-tatar')).toMatchObject({
      parentId: 'group-it-development-project-manager-jakub-rehak',
    });
  });

  it('stores manual node position after a valid drop', () => {
    const state = createInitialChartState(SOURCE_ORGCHART);
    const result = chartReducer(state, {
      type: 'drop-as-child',
      sourceId: 'head-of-analytics-david-tatar',
      targetParentId: 'chief-information-officer-jiri-cabradek',
      position: { x: 420, y: 240 },
    } as never);

    expect(result.history.current.nodes.find((node) => node.id === 'head-of-analytics-david-tatar')).toMatchObject({
      parentId: 'chief-information-officer-jiri-cabradek',
      position: { x: 420, y: 240 },
    });
  });

  it('switches to Auto strom and stores Jakub Řehák as child of David Tatár after DnD child drop', () => {
    const state = createInitialChartState(SOURCE_ORGCHART, 'source');
    const result = chartReducer(state, {
      type: 'drop-as-child',
      sourceId: 'group-it-development-project-manager-jakub-rehak',
      targetParentId: 'head-of-analytics-david-tatar',
      position: { x: 980, y: 640 },
    } as never);

    expect(result.layoutMode).toBe('tree');
    expect(
      result.history.current.nodes.find((node) => node.id === 'group-it-development-project-manager-jakub-rehak'),
    ).toMatchObject({
      parentId: 'head-of-analytics-david-tatar',
    });
  });

  it('stores David Hlavnicka as child of Jan Sokola after a DnD child drop', () => {
    const state = createInitialChartState(SOURCE_ORGCHART, 'tree');
    const result = chartReducer(state, {
      type: 'drop-as-child',
      sourceId: 'country-fi-manager-cz-david-hlavnicka',
      targetParentId: 'country-ops-manager-jan-sokola',
      position: { x: 1000, y: 1160 },
    } as never);

    expect(result.layoutMode).toBe('tree');
    expect(result.history.current.nodes.find((node) => node.id === 'country-fi-manager-cz-david-hlavnicka')).toMatchObject({
      parentId: 'country-ops-manager-jan-sokola',
      position: { x: 1000, y: 1160 },
    });
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
