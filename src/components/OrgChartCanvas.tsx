import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { layoutChart } from '../domain/chartLayout';
import type { ChartOrientation, OrgChartDocument, OrgNode } from '../domain/orgchart';
import { messages } from '../i18n/messages';
import { OrgNodeCard } from './OrgNodeCard';

type DropMode = 'child' | 'sibling-left' | 'sibling-right';

interface OrgChartCanvasProps {
  chart: OrgChartDocument;
  orientation: ChartOrientation;
  selectedNodeId: string | null;
  movingNodeId: string | null;
  draftNodeId: string | null;
  search: string;
  fitViewToken: number;
  onSelect: (nodeId: string | null) => void;
  onAddChild: (nodeId: string) => void;
  onMoveAsChild: (targetParentId: string) => void;
  onMoveAsSibling: (targetId: string, side: 'left' | 'right') => void;
  onDropAsChild: (sourceId: string, targetParentId: string) => void;
  onDropAsSibling: (sourceId: string, targetId: string, side: 'left' | 'right') => void;
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
  onSelect: (nodeId: string) => void;
  onAddChild: (nodeId: string) => void;
}

type OrgFlowNode = Node<OrgFlowNodeData, 'orgNode'>;

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
  onDropAsSibling,
}: OrgChartCanvasProps) {
  const { fitView, getIntersectingNodes } = useReactFlow<OrgFlowNode, Edge>();
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropMode, setDropMode] = useState<DropMode | null>(null);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  void onMoveAsChild;
  void onMoveAsSibling;

  const { nodes, edges } = useMemo(() => {
    const layout = layoutChart(chart, orientation);
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

    return { nodes: flowNodes, edges: flowEdges };
  }, [
    chart,
    orientation,
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

  useEffect(() => {
    fitView({ padding: 0.2, duration: 0 });
  }, [fitView, orientation, chart.nodes.length]);

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
    (_event: unknown, node: OrgFlowNode) => {
      const intersecting = getIntersectingNodes(node);
      const target = intersecting.find((candidate) => candidate.id !== node.id);
      if (!target) {
        setDropTargetId(null);
        setDropMode(null);
        return;
      }

      // Vypočti pozici tažené karty vůči cíli na ose souhlasné s orientací sourozenců.
      // vertikální layout → siblingy se rozprostírají horizontálně (osa x)
      // horizontální layout → siblingy svisle (osa y)
      const isVertical = orientation === 'vertical';
      const draggedCoord = isVertical ? node.position.x : node.position.y;
      const targetCoord = isVertical ? target.position.x : target.position.y;
      const dimension = isVertical
        ? (target.width ?? target.measured?.width ?? 192)
        : (target.height ?? target.measured?.height ?? 96);
      const delta = draggedCoord - targetCoord;
      const threshold = dimension * 0.35;

      let mode: DropMode;
      if (delta < -threshold) {
        mode = 'sibling-left';
      } else if (delta > threshold) {
        mode = 'sibling-right';
      } else {
        mode = 'child';
      }

      setDropTargetId(target.id);
      setDropMode(mode);
    },
    [getIntersectingNodes, orientation],
  );

  const handleNodeDragStop = useCallback(
    (_event: unknown, node: OrgFlowNode) => {
      const sourceId = node.id;
      const targetId = dropTargetId;
      const mode = dropMode;
      setDraggedNodeId(null);
      setDropTargetId(null);
      setDropMode(null);
      if (!targetId || targetId === sourceId) {
        return;
      }
      if (mode === 'sibling-left') {
        onDropAsSibling(sourceId, targetId, 'left');
      } else if (mode === 'sibling-right') {
        onDropAsSibling(sourceId, targetId, 'right');
      } else {
        onDropAsChild(sourceId, targetId);
      }
    },
    [dropTargetId, dropMode, onDropAsChild, onDropAsSibling],
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
