import {
  addChildNode,
  deleteNodeAndDescendants,
  moveNodeAsChild,
  moveNodeAsSibling,
  updateNode,
} from '../domain/chartOperations';
import { createHistory, pushHistory, undoHistory, type ChartHistory } from '../domain/chartHistory';
import type { ChartOrientation, OrgChartDocument, SelectedNodePatch } from '../domain/orgchart';

type SiblingSide = 'left' | 'right';

export interface ChartState {
  history: ChartHistory;
  selectedNodeId: string | null;
  movingNodeId: string | null;
  orientation: ChartOrientation;
  search: string;
  warning: string;
}

export type ChartAction =
  | { type: 'select'; nodeId: string | null }
  | { type: 'set-search'; search: string }
  | { type: 'set-orientation'; orientation: ChartOrientation }
  | { type: 'add-child'; parentId: string }
  | { type: 'update-selected'; patch: SelectedNodePatch }
  | { type: 'delete'; nodeId: string }
  | { type: 'start-move'; nodeId: string }
  | { type: 'cancel-move' }
  | { type: 'move-as-child'; targetParentId: string }
  | { type: 'move-as-sibling'; targetId: string; side: SiblingSide }
  | { type: 'undo' }
  | { type: 'replace-chart'; chart: OrgChartDocument }
  | { type: 'set-warning'; warning: string };

export const createInitialChartState = (chart: OrgChartDocument): ChartState => ({
  history: createHistory(chart),
  selectedNodeId: null,
  movingNodeId: null,
  orientation: 'vertical',
  search: '',
  warning: '',
});

const warningFromError = (error: unknown): string => (error instanceof Error ? error.message : String(error));

const withPushedChart = (state: ChartState, chart: OrgChartDocument): ChartState => ({
  ...state,
  history: pushHistory(state.history, chart),
  warning: '',
});

const findAddedNodeId = (previous: OrgChartDocument, next: OrgChartDocument): string | null => {
  const previousIds = new Set(previous.nodes.map((node) => node.id));
  return next.nodes.find((node) => !previousIds.has(node.id))?.id ?? null;
};

const ensureGeneratedNodeIdHasSuffix = (chart: OrgChartDocument, nodeId: string | null): OrgChartDocument => {
  if (!nodeId || nodeId !== 'new-role') {
    return chart;
  }

  const usedIds = new Set(chart.nodes.map((node) => node.id));
  let suffix = chart.nodes.length;
  let nextId = `new-role-${suffix}`;

  while (usedIds.has(nextId)) {
    suffix += 1;
    nextId = `new-role-${suffix}`;
  }

  return {
    ...chart,
    nodes: chart.nodes.map((node) => (node.id === nodeId ? { ...node, id: nextId } : node)),
  };
};

export const chartReducer = (state: ChartState, action: ChartAction): ChartState => {
  switch (action.type) {
    case 'select':
      return { ...state, selectedNodeId: action.nodeId };

    case 'set-search':
      return { ...state, search: action.search };

    case 'set-orientation':
      return { ...state, orientation: action.orientation };

    case 'add-child': {
      const addedChart = addChildNode(state.history.current, action.parentId);
      const originalAddedNodeId = findAddedNodeId(state.history.current, addedChart);
      const nextChart = ensureGeneratedNodeIdHasSuffix(addedChart, originalAddedNodeId);
      const selectedNodeId = findAddedNodeId(state.history.current, nextChart);

      return {
        ...withPushedChart(state, nextChart),
        selectedNodeId,
      };
    }

    case 'update-selected': {
      if (!state.selectedNodeId) {
        return state;
      }

      return withPushedChart(state, updateNode(state.history.current, state.selectedNodeId, action.patch));
    }

    case 'delete':
      try {
        return {
          ...withPushedChart(state, deleteNodeAndDescendants(state.history.current, action.nodeId)),
          selectedNodeId: null,
        };
      } catch (error) {
        return { ...state, warning: warningFromError(error) };
      }

    case 'start-move':
      return { ...state, movingNodeId: action.nodeId };

    case 'cancel-move':
      return { ...state, movingNodeId: null };

    case 'move-as-child': {
      if (!state.movingNodeId) {
        return state;
      }

      try {
        return {
          ...withPushedChart(state, moveNodeAsChild(state.history.current, state.movingNodeId, action.targetParentId)),
          movingNodeId: null,
        };
      } catch (error) {
        return { ...state, warning: warningFromError(error) };
      }
    }

    case 'move-as-sibling': {
      if (!state.movingNodeId) {
        return state;
      }

      try {
        return {
          ...withPushedChart(
            state,
            moveNodeAsSibling(state.history.current, state.movingNodeId, action.targetId, action.side),
          ),
          movingNodeId: null,
        };
      } catch (error) {
        return { ...state, warning: warningFromError(error) };
      }
    }

    case 'undo':
      return {
        ...state,
        history: undoHistory(state.history),
        selectedNodeId: null,
        movingNodeId: null,
      };

    case 'replace-chart':
      return createInitialChartState(action.chart);

    case 'set-warning':
      return { ...state, warning: action.warning };
  }
};
