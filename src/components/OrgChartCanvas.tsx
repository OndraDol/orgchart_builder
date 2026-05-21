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

  const NODE_W = 192;
  const NODE_H = 96;
  const INFLATE = 60;

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
      const previewEdge =
        dropMode === 'parent'
          ? { source: draggedNodeId, target: dropTargetId }
          : dropMode === 'child'
            ? { source: dropTargetId, target: draggedNodeId }
            : targetNode?.parentId
              ? { source: targetNode.parentId, target: draggedNodeId }
              : null;

      if (previewEdge) {
        flowEdges.push({
          id: 'drop-preview-edge',
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

  const isDescendant = useCallback(
    (sourceId: string, candidateId: string): boolean => {
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
    },
    [chart.nodes],
  );

  const isDropModeValid = useCallback(
    (sourceId: string, targetId: string, mode: DropMode): boolean => {
      if (sourceId === targetId) {
        return false;
      }

      const source = chart.nodes.find((item) => item.id === sourceId);
      const target = chart.nodes.find((item) => item.id === targetId);

      if (!source || !target) {
        return false;
      }

      if (mode === 'parent') {
        return source.parentId !== null && target.parentId !== null && !isDescendant(sourceId, targetId);
      }

      if (mode === 'sibling-left' || mode === 'sibling-right') {
        return target.parentId !== null && !isDescendant(sourceId, targetId);
      }

      return !isDescendant(sourceId, targetId);
    },
    [chart.nodes, isDescendant],
  );

  const handleNodeDragStart = useCallback((_event: unknown, node: OrgFlowNode) => {
    setDraggedNodeId(node.id);
    setDropTargetId(null);
    setDropMode(null);
  }, []);

  const handleNodeDrag = useCallback(
    (event: ReactMouseEvent, node: OrgFlowNode) => {
      const cursor = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      let bestTarget: OrgFlowNode | null = null;
      let bestDist = Infinity;

      for (const candidate of getNodes()) {
        if (candidate.id === node.id) {
          continue;
        }

        const targetW = candidate.width ?? candidate.measured?.width ?? NODE_W;
        const targetH = candidate.height ?? candidate.measured?.height ?? NODE_H;
        const left = candidate.position.x - targetW / 2 - INFLATE;
        const right = candidate.position.x + targetW / 2 + INFLATE;
        const top = candidate.position.y - targetH / 2 - INFLATE;
        const bottom = candidate.position.y + targetH / 2 + INFLATE;

        if (cursor.x < left || cursor.x > right || cursor.y < top || cursor.y > bottom) {
          continue;
        }

        const dx = cursor.x - candidate.position.x;
        const dy = cursor.y - candidate.position.y;
        const dist = dx * dx + dy * dy;

        if (dist < bestDist) {
          bestDist = dist;
          bestTarget = candidate;
        }
      }

      if (!bestTarget) {
        setDropTargetId(null);
        setDropMode(null);
        return;
      }

      const targetW = bestTarget.width ?? bestTarget.measured?.width ?? NODE_W;
      const targetH = bestTarget.height ?? bestTarget.measured?.height ?? NODE_H;
      const mode = getDropModeForCursor({
        orientation,
        cursorX: cursor.x,
        cursorY: cursor.y,
        targetX: bestTarget.position.x,
        targetY: bestTarget.position.y,
        targetWidth: targetW,
        targetHeight: targetH,
      });

      if (!isDropModeValid(node.id, bestTarget.id, mode)) {
        setDropTargetId(null);
        setDropMode(null);
        return;
      }

      setDropTargetId(bestTarget.id);
      setDropMode(mode);
    },
    [screenToFlowPosition, getNodes, orientation, isDropModeValid],
  );

  const handleNodeDragStop = useCallback(
    (_event: unknown, node: OrgFlowNode) => {
      const sourceId = node.id;
      const position = { x: node.position.x, y: node.position.y };
      const targetId = dropTargetId;
      const mode = dropMode;
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
    [dropTargetId, dropMode, onDropAsChild, onDropAsParent, onDropAsSibling],
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
