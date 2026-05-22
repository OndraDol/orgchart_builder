import { useCallback, useEffect, useMemo, useState, type MouseEvent as ReactMouseEvent } from 'react';
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { layoutChart } from '../domain/chartLayout';
import type { ChartLayoutMode, ChartOrientation, NodePosition, OrgChartDocument, OrgNode } from '../domain/orgchart';
import { messages } from '../i18n/messages';
import { OrgNodeCard } from './OrgNodeCard';

export type DropMode = 'parent' | 'child' | 'sibling-left' | 'sibling-right';

interface OrgChartCanvasProps {
  chart: OrgChartDocument;
  orientation: ChartOrientation;
  layoutMode: ChartLayoutMode;
  selectedNodeId: string | null;
  movingNodeId: string | null;
  draftNodeId: string | null;
  search: string;
  fitViewToken: number;
  onSelect: (nodeId: string | null) => void;
  onAddChild: (nodeId: string) => void;
  onMoveAsChild: (targetParentId: string) => void;
  onMoveAsSibling: (targetId: string, side: 'left' | 'right') => void;
  onDropAsChild: (sourceId: string, targetParentId: string, position: NodePosition) => void;
  onDropAsParent: (sourceId: string, targetId: string, position: NodePosition) => void;
  onDropAsSibling: (sourceId: string, targetId: string, side: 'left' | 'right', position: NodePosition) => void;
}

interface OrgFlowNodeData extends Record<string, unknown> {
  node: OrgNode;
  orientation: ChartOrientation;
  selected: boolean;
  searchMatch: boolean;
  moving: boolean;
  draft: boolean;
  dropTarget: boolean;
  dropMode: DropMode | null;
  dropAllowed: boolean;
  onSelect: (nodeId: string) => void;
  onAddChild: (nodeId: string) => void;
}

type OrgFlowNode = Node<OrgFlowNodeData, 'orgNode'>;

interface PositionedFlowNode {
  id: string;
  position: NodePosition;
}

interface DropIntentNode extends PositionedFlowNode {
  width?: number | null;
  height?: number | null;
  measured?: {
    width?: number | null;
    height?: number | null;
  };
}

interface DropIntentEdge {
  id: string;
  source: string;
  target: string;
}

export interface DropIntent {
  mode: DropMode;
  targetId: string;
  edgeSourceId?: string;
}

interface ResolveDropIntentInput {
  chart: OrgChartDocument;
  orientation: ChartOrientation;
  sourceId: string;
  cursor: NodePosition;
  nodes: DropIntentNode[];
  edges: DropIntentEdge[];
}

export function mergeDraggedNodePosition<TNode extends PositionedFlowNode>(
  nextNodes: TNode[],
  currentNodes: PositionedFlowNode[],
  draggedNodeId: string | null,
): TNode[] {
  if (!draggedNodeId) {
    return nextNodes;
  }

  const draggedNode = currentNodes.find((node) => node.id === draggedNodeId);
  if (!draggedNode) {
    return nextNodes;
  }

  return nextNodes.map((node) => (node.id === draggedNodeId ? { ...node, position: draggedNode.position } : node));
}

function mergeActiveDropNode(nodes: DropIntentNode[], activeNode: DropIntentNode): DropIntentNode[] {
  let foundActiveNode = false;
  const mergedNodes = nodes.map((node) => {
    if (node.id !== activeNode.id) {
      return node;
    }

    foundActiveNode = true;
    return { ...node, ...activeNode };
  });

  return foundActiveNode ? mergedNodes : [...mergedNodes, activeNode];
}

interface DropModeInput {
  orientation: ChartOrientation;
  cursorX: number;
  cursorY: number;
  targetX: number;
  targetY: number;
  targetWidth: number;
  targetHeight: number;
}

export function getDropModeForCursor({
  orientation,
  cursorX,
  cursorY,
  targetX,
  targetY,
  targetWidth,
  targetHeight,
}: DropModeInput): DropMode {
  const localX = cursorX - targetX + targetWidth / 2;
  const localY = cursorY - targetY + targetHeight / 2;

  if (orientation === 'horizontal') {
    if (localX < targetWidth * 0.28) {
      return 'parent';
    }

    if (localX > targetWidth * 0.72) {
      return 'child';
    }

    return localY < targetHeight / 2 ? 'sibling-left' : 'sibling-right';
  }

  if (localY < targetHeight * 0.28) {
    return 'parent';
  }

  if (localY > targetHeight * 0.72) {
    return 'child';
  }

  if (localX < targetWidth * 0.33) {
    return 'sibling-left';
  }

  if (localX > targetWidth * 0.67) {
    return 'sibling-right';
  }

  return 'child';
}

const NODE_W = 192;
const NODE_H = 96;
const CURSOR_HIT_PADDING = 60;
const CARD_HIT_PADDING = 96;
const EDGE_HIT_DISTANCE = 32;

const getNodeWidth = (node: DropIntentNode): number => node.width ?? node.measured?.width ?? NODE_W;

const getNodeHeight = (node: DropIntentNode): number => node.height ?? node.measured?.height ?? NODE_H;

interface DropRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
  center: NodePosition;
}

const rectFromCenter = (center: NodePosition, width: number, height: number): DropRect => ({
  left: center.x - width / 2,
  right: center.x + width / 2,
  top: center.y - height / 2,
  bottom: center.y + height / 2,
  width,
  height,
  center,
});

const getNodeRect = (node: DropIntentNode): DropRect => rectFromCenter(node.position, getNodeWidth(node), getNodeHeight(node));

const inflateRect = (rect: DropRect, padding: number): DropRect => ({
  left: rect.left - padding,
  right: rect.right + padding,
  top: rect.top - padding,
  bottom: rect.bottom + padding,
  width: rect.width + padding * 2,
  height: rect.height + padding * 2,
  center: rect.center,
});

const isPointInRect = (point: NodePosition, rect: DropRect): boolean =>
  point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;

const distanceBetweenRects = (left: DropRect, right: DropRect): number => {
  const dx = Math.max(0, Math.max(right.left - left.right, left.left - right.right));
  const dy = Math.max(0, Math.max(right.top - left.bottom, left.top - right.bottom));

  return Math.hypot(dx, dy);
};

const squaredDistance = (left: NodePosition, right: NodePosition): number => {
  const dx = left.x - right.x;
  const dy = left.y - right.y;

  return dx * dx + dy * dy;
};

function getDropModeForDraggedRect(
  orientation: ChartOrientation,
  draggedRect: DropRect,
  targetRect: DropRect,
): DropMode {
  if (orientation === 'horizontal') {
    if (draggedRect.center.x < targetRect.left || draggedRect.right < targetRect.center.x) {
      return 'parent';
    }

    if (draggedRect.center.x > targetRect.right || draggedRect.left > targetRect.center.x) {
      return 'child';
    }

    return draggedRect.center.y < targetRect.center.y ? 'sibling-left' : 'sibling-right';
  }

  if (draggedRect.center.y < targetRect.top || draggedRect.bottom < targetRect.center.y) {
    return 'parent';
  }

  if (draggedRect.center.y > targetRect.bottom || draggedRect.top > targetRect.center.y) {
    return 'child';
  }

  if (draggedRect.center.x < targetRect.center.x - targetRect.width * 0.2) {
    return 'sibling-left';
  }

  if (draggedRect.center.x > targetRect.center.x + targetRect.width * 0.2) {
    return 'sibling-right';
  }

  return 'child';
}

function isChartDescendant(chart: OrgChartDocument, sourceId: string, candidateId: string): boolean {
  const queue = [sourceId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId || visited.has(currentId)) {
      continue;
    }

    visited.add(currentId);
    const children = chart.nodes.filter((item) => item.parentId === currentId);

    for (const child of children) {
      if (child.id === candidateId) {
        return true;
      }

      queue.push(child.id);
    }
  }

  return false;
}

function isDropModeValid(chart: OrgChartDocument, sourceId: string, targetId: string, mode: DropMode): boolean {
  if (sourceId === targetId) {
    return false;
  }

  const source = chart.nodes.find((item) => item.id === sourceId);
  const target = chart.nodes.find((item) => item.id === targetId);

  if (!source || !target) {
    return false;
  }

  if (mode === 'parent') {
    return source.parentId !== null && target.parentId !== null && !isChartDescendant(chart, sourceId, targetId);
  }

  if (mode === 'sibling-left' || mode === 'sibling-right') {
    return target.parentId !== null && !isChartDescendant(chart, sourceId, targetId);
  }

  return source.parentId !== null;
}

function distanceToLineSegment(point: NodePosition, start: NodePosition, end: NodePosition): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const ratio = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
  const projected = {
    x: start.x + ratio * dx,
    y: start.y + ratio * dy,
  };

  return Math.hypot(point.x - projected.x, point.y - projected.y);
}

export function resolveDropIntent({
  chart,
  orientation,
  sourceId,
  cursor,
  nodes,
  edges,
}: ResolveDropIntentInput): DropIntent | null {
  const sourceNode = nodes.find((node) => node.id === sourceId);
  const draggedRect = sourceNode ? getNodeRect(sourceNode) : rectFromCenter(cursor, NODE_W, NODE_H);
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  let bestEdgeIntent: DropIntent | null = null;
  let bestEdgeDist = EDGE_HIT_DISTANCE;

  for (const edge of edges) {
    if (edge.id.startsWith('drop-preview-edge') || edge.source === sourceId || edge.target === sourceId) {
      continue;
    }

    const sourceNodeForEdge = nodeById.get(edge.source);
    const targetNodeForEdge = nodeById.get(edge.target);
    if (!sourceNodeForEdge || !targetNodeForEdge) {
      continue;
    }

    if (!isDropModeValid(chart, sourceId, edge.target, 'parent')) {
      continue;
    }

    const dist = distanceToLineSegment(cursor, sourceNodeForEdge.position, targetNodeForEdge.position);
    if (dist <= bestEdgeDist) {
      bestEdgeDist = dist;
      bestEdgeIntent = { mode: 'parent', targetId: edge.target, edgeSourceId: edge.source };
    }
  }

  const cursorOverActualNode = nodes.some((candidate) => candidate.id !== sourceId && isPointInRect(cursor, getNodeRect(candidate)));

  if (bestEdgeIntent && !cursorOverActualNode) {
    return bestEdgeIntent;
  }

  let bestNodeIntent: DropIntent | null = null;
  let bestNodeDist = Infinity;

  for (const candidate of nodes) {
    if (candidate.id === sourceId) {
      continue;
    }

    const targetRect = getNodeRect(candidate);
    const cursorHitRect = inflateRect(targetRect, CURSOR_HIT_PADDING);
    const cardDistance = distanceBetweenRects(draggedRect, targetRect);
    const cardInRange = cardDistance <= CARD_HIT_PADDING;
    const cursorInActualTarget = isPointInRect(cursor, targetRect);
    const cursorInRange = isPointInRect(cursor, cursorHitRect);

    if (!cardInRange && !cursorInRange) {
      continue;
    }

    const mode = cursorInActualTarget
      ? getDropModeForCursor({
          orientation,
          cursorX: cursor.x,
          cursorY: cursor.y,
          targetX: candidate.position.x,
          targetY: candidate.position.y,
          targetWidth: targetRect.width,
          targetHeight: targetRect.height,
        })
      : getDropModeForDraggedRect(orientation, draggedRect, targetRect);

    if (!isDropModeValid(chart, sourceId, candidate.id, mode)) {
      continue;
    }

    const dist = cardDistance * 100000 + squaredDistance(draggedRect.center, targetRect.center);

    if (dist < bestNodeDist) {
      bestNodeDist = dist;
      bestNodeIntent = { mode, targetId: candidate.id };
    }
  }

  return bestNodeIntent ?? bestEdgeIntent;
}

function getClientPositionFromEvent(event: unknown): NodePosition | null {
  if (
    typeof event === 'object' &&
    event !== null &&
    'clientX' in event &&
    'clientY' in event &&
    typeof event.clientX === 'number' &&
    typeof event.clientY === 'number'
  ) {
    return { x: event.clientX, y: event.clientY };
  }

  return null;
}

function OrgFlowCard({ data }: NodeProps<OrgFlowNode>) {
  const targetPosition = data.orientation === 'vertical' ? Position.Top : Position.Left;
  const sourcePosition = data.orientation === 'vertical' ? Position.Bottom : Position.Right;

  return (
    <>
      <Handle className="org-node-handle" type="target" position={targetPosition} />
      <OrgNodeCard
        node={data.node}
        selected={data.selected}
        searchMatch={data.searchMatch}
        moving={data.moving}
        draft={data.draft}
        dropTarget={data.dropTarget}
        dropMode={data.dropMode}
        dropAllowed={data.dropAllowed}
        onSelect={data.onSelect}
        onAddChild={data.onAddChild}
      />
      <Handle className="org-node-handle" type="source" position={sourcePosition} />
    </>
  );
}

const nodeTypes = {
  orgNode: OrgFlowCard,
};

function OrgChartFlow({
  chart,
  orientation,
  layoutMode,
  selectedNodeId,
  movingNodeId,
  draftNodeId,
  search,
  fitViewToken,
  onSelect,
  onAddChild,
  onMoveAsChild,
  onMoveAsSibling,
  onDropAsChild,
  onDropAsParent,
  onDropAsSibling,
}: OrgChartCanvasProps) {
  const { fitView, screenToFlowPosition, getNodes } = useReactFlow<OrgFlowNode, Edge>();
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropMode, setDropMode] = useState<DropMode | null>(null);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  void onMoveAsChild;
  void onMoveAsSibling;

  const { nodes: layoutNodes, edges } = useMemo(() => {
    const layout = layoutChart(chart, orientation, layoutMode);
    const flowNodes: OrgFlowNode[] = layout.nodes.map(({ id, node, x, y }) => {
      const searchMatch =
        normalizedSearch.length > 0 &&
        `${node.title} ${node.person} ${node.levelType} ${node.country} ${node.regio}`
          .toLocaleLowerCase()
          .includes(normalizedSearch);

      return {
        id,
        type: 'orgNode',
        position: { x, y },
        data: {
          node,
          orientation,
          selected: selectedNodeId === id,
          searchMatch,
          moving: movingNodeId === id,
          draft: draftNodeId === id,
          dropTarget: dropTargetId === id && draggedNodeId !== null && draggedNodeId !== id,
          dropMode: dropTargetId === id && draggedNodeId !== null && draggedNodeId !== id ? dropMode : null,
          dropAllowed: draggedNodeId === id && dropTargetId !== null,
          onSelect: (nodeId) => onSelect(nodeId),
          onAddChild,
        },
        selected: selectedNodeId === id,
        draggable: true,
        className: draggedNodeId === id ? 'dragging' : undefined,
      };
    });

    const flowEdges: Edge[] = layout.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      animated: movingNodeId !== null || draggedNodeId !== null,
      style: { stroke: '#94a3b8', strokeWidth: 1.4 },
    }));

    if (draggedNodeId && dropTargetId && draggedNodeId !== dropTargetId && dropMode) {
      const targetNode = chart.nodes.find((node) => node.id === dropTargetId);
      const previewEdges =
        dropMode === 'parent'
          ? [
              ...(targetNode?.parentId ? [{ source: targetNode.parentId, target: draggedNodeId }] : []),
              { source: draggedNodeId, target: dropTargetId },
            ]
          : dropMode === 'child'
            ? [{ source: dropTargetId, target: draggedNodeId }]
            : targetNode?.parentId
              ? [{ source: targetNode.parentId, target: draggedNodeId }]
              : [];

      for (const [index, previewEdge] of previewEdges.entries()) {
        flowEdges.push({
          id: index === 0 ? 'drop-preview-edge' : `drop-preview-edge-${index}`,
          ...previewEdge,
          type: 'smoothstep',
          animated: true,
          className: 'drop-preview-edge',
          style: { stroke: '#4f46e5', strokeWidth: 3 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#4f46e5',
            width: 18,
            height: 18,
          },
          zIndex: 10,
        });
      }
    }

    return { nodes: flowNodes, edges: flowEdges };
  }, [
    chart,
    orientation,
    layoutMode,
    normalizedSearch,
    selectedNodeId,
    movingNodeId,
    draftNodeId,
    dropTargetId,
    dropMode,
    draggedNodeId,
    onSelect,
    onAddChild,
  ]);
  const [nodes, setNodes, onNodesChange] = useNodesState<OrgFlowNode>([]);

  useEffect(() => {
    setNodes((currentNodes) => mergeDraggedNodePosition(layoutNodes, currentNodes, draggedNodeId));
  }, [layoutNodes, draggedNodeId, setNodes]);

  useEffect(() => {
    fitView({ padding: 0.2, duration: 0 });
  }, [fitView, orientation, layoutMode, chart.nodes.length]);

  useEffect(() => {
    if (fitViewToken > 0) {
      fitView({ padding: 0.2, duration: 320 });
    }
  }, [fitView, fitViewToken]);

  const handleNodeDragStart = useCallback((_event: unknown, node: OrgFlowNode) => {
    setDraggedNodeId(node.id);
    setDropTargetId(null);
    setDropMode(null);
  }, []);

  const handleNodeDrag = useCallback(
    (event: ReactMouseEvent, node: OrgFlowNode) => {
      const cursor = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const intent = resolveDropIntent({
        chart,
        orientation,
        sourceId: node.id,
        cursor,
        nodes: mergeActiveDropNode(getNodes(), node),
        edges,
      });

      if (!intent) {
        setDropTargetId(null);
        setDropMode(null);
        return;
      }

      setDropTargetId(intent.targetId);
      setDropMode(intent.mode);
    },
    [chart, orientation, screenToFlowPosition, getNodes, edges],
  );

  const handleNodeDragStop = useCallback(
    (event: unknown, node: OrgFlowNode) => {
      const sourceId = node.id;
      const position = { x: node.position.x, y: node.position.y };
      const clientPosition = getClientPositionFromEvent(event);
      const cursor = clientPosition ? screenToFlowPosition(clientPosition) : null;
      const intent = cursor
        ? resolveDropIntent({
            chart,
            orientation,
            sourceId,
            cursor,
            nodes: mergeActiveDropNode(getNodes(), node),
            edges,
          })
        : null;
      const targetId = intent?.targetId ?? dropTargetId;
      const mode = intent?.mode ?? dropMode;
      setDraggedNodeId(null);
      setDropTargetId(null);
      setDropMode(null);
      if (!targetId || targetId === sourceId) {
        return;
      }
      if (mode === 'sibling-left') {
        onDropAsSibling(sourceId, targetId, 'left', position);
      } else if (mode === 'sibling-right') {
        onDropAsSibling(sourceId, targetId, 'right', position);
      } else if (mode === 'parent') {
        onDropAsParent(sourceId, targetId, position);
      } else {
        onDropAsChild(sourceId, targetId, position);
      }
      // Bez fitView: viewport zůstane na stejném místě po uživatelově přání.
      // Uživatel může kdykoli kliknout „Přizpůsobit pohled" v toolbaru pro refit.
    },
    [
      chart,
      orientation,
      screenToFlowPosition,
      getNodes,
      edges,
      dropTargetId,
      dropMode,
      onDropAsChild,
      onDropAsParent,
      onDropAsSibling,
    ],
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      nodeOrigin={[0.5, 0.5]}
      minZoom={0.15}
      maxZoom={1.6}
      fitView
      onlyRenderVisibleElements={false}
      nodesConnectable={false}
      onPaneClick={() => onSelect(null)}
      onNodesChange={onNodesChange}
      onNodeDragStart={handleNodeDragStart}
      onNodeDrag={handleNodeDrag}
      onNodeDragStop={handleNodeDragStop}
    >
      <Background color="#cbd5e1" gap={28} size={1} />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}

export function OrgChartCanvas(props: OrgChartCanvasProps) {
  return (
    <section className="chart-canvas" aria-label={messages.canvas.label}>
      <ReactFlowProvider>
        <OrgChartFlow {...props} />
      </ReactFlowProvider>
    </section>
  );
}
