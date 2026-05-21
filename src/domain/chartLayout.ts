import { hierarchy, tree } from 'd3-hierarchy';

import type { ChartLayoutMode, ChartOrientation, OrgChartDocument, OrgNode } from './orgchart';

const NODE_WIDTH = 192;
const NODE_HEIGHT = 100;
const LEVEL_GAP = 130;
const SIBLING_GAP = 24;

export interface PositionedNode {
  id: string;
  node: OrgNode;
  x: number;
  y: number;
}

export interface PositionedEdge {
  id: string;
  source: string;
  target: string;
}

export interface LayoutResult {
  nodes: PositionedNode[];
  edges: PositionedEdge[];
}

interface TreeNode {
  node: OrgNode;
  children: TreeNode[];
}

export function layoutChart(
  chart: OrgChartDocument,
  orientation: ChartOrientation,
  layoutMode: ChartLayoutMode = 'tree',
): LayoutResult {
  if (layoutMode === 'source') {
    return layoutSourceChart(chart, orientation);
  }

  return layoutTreeChart(chart, orientation);
}

function layoutSourceChart(chart: OrgChartDocument, orientation: ChartOrientation): LayoutResult {
  const fallbackLayout = layoutTreeChart(chart, orientation);
  const fallbackById = new Map(fallbackLayout.nodes.map((node) => [node.id, node]));
  const hiddenIds = new Set(chart.nodes.filter((node) => node.sourceHidden).map((node) => node.id));

  const nodes = chart.nodes
    .filter((node) => !hiddenIds.has(node.id))
    .map((node) => {
      const position = node.position ?? node.sourcePosition ?? fallbackById.get(node.id);

      return {
        id: node.id,
        node,
        x: position?.x ?? 0,
        y: position?.y ?? 0,
      };
    });

  const edges = chart.nodes
    .filter((node) => node.parentId !== null && !hiddenIds.has(node.id) && !hiddenIds.has(node.parentId))
    .map((node) => ({
      id: `${node.parentId}-${node.id}`,
      source: node.parentId as string,
      target: node.id,
    }));

  return { nodes, edges };
}

function layoutTreeChart(chart: OrgChartDocument, orientation: ChartOrientation): LayoutResult {
  const roots = chart.nodes.filter((node) => node.parentId === null);

  if (roots.length !== 1) {
    throw new Error('Chart must contain exactly one root node.');
  }

  const childrenByParentId = new Map<string, OrgNode[]>();
  for (const node of chart.nodes) {
    if (node.parentId === null) {
      continue;
    }

    const siblings = childrenByParentId.get(node.parentId) ?? [];
    siblings.push(node);
    childrenByParentId.set(node.parentId, siblings);
  }

  const toTreeNode = (node: OrgNode): TreeNode => ({
    node,
    children: (childrenByParentId.get(node.id) ?? []).sort(compareNodes).map(toTreeNode),
  });

  const root = hierarchy(toTreeNode(roots[0]));
  const layout = tree<TreeNode>()
    .nodeSize([NODE_WIDTH + SIBLING_GAP, NODE_HEIGHT + LEVEL_GAP])
    .separation((a, b) => (a.parent === b.parent ? 1 : 1.35))(root);

  const nodes = layout.descendants().map((item) => {
    const x = orientation === 'vertical' ? item.x : item.y;
    const y = orientation === 'vertical' ? item.y : item.x;

    return {
      id: item.data.node.id,
      node: item.data.node,
      x,
      y,
    };
  });

  const edges = layout.links().map((link) => ({
    id: `${link.source.data.node.id}-${link.target.data.node.id}`,
    source: link.source.data.node.id,
    target: link.target.data.node.id,
  }));

  return { nodes, edges };
}

function compareNodes(left: OrgNode, right: OrgNode): number {
  if (left.order !== right.order) {
    return left.order - right.order;
  }

  const titleComparison = left.title.localeCompare(right.title);
  if (titleComparison !== 0) {
    return titleComparison;
  }

  return left.id.localeCompare(right.id);
}
