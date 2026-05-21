import { useCallback, useEffect, useMemo, useState, type MouseEvent as ReactMouseEvent } from 'react';
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
  dropAllowed: boolean;
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
  const { fitView, screenToFlowPosition, getIntersectingNodes } = useReactFlow<OrgFlowNode, Edge>();
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropMode, setDropMode] = useState<DropMode | null>(null);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  void onMoveAsChild;
  void onMoveAsSibling;

  const NODE_W = 192;
  const NODE_H = 96;
  const INFLATE = 60;

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
    (event: ReactMouseEvent, node: OrgFlowNode) => {
      const cursor = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const isVertical = orientation === 'vertical';

      // Inflated rect kolem tažené karty (nodeOrigin = [0.5, 0.5] → position je center)
      const w = node.width ?? node.measured?.width ?? NODE_W;
      const h = node.height ?? node.measured?.height ?? NODE_H;
      const inflatedRect = {
        x: node.position.x - w / 2 - INFLATE,
        y: node.position.y - h / 2 - INFLATE,
        width: w + INFLATE * 2,
        height: h + INFLATE * 2,
      };
      const candidates = getIntersectingNodes(inflatedRect, true).filter((c) => c.id !== node.id);

      // Pokud nemáme intersection kandidáty, najdeme nejbližší kartu k cursoru (volnější fallback)
      let bestTarget: OrgFlowNode | null = null;
      if (candidates.length > 0) {
        // Vyber nejbližší k cursoru
        let bestDist = Infinity;
        for (const c of candidates) {
          const dx = cursor.x - c.position.x;
          const dy = cursor.y - c.position.y;
          const dist = dx * dx + dy * dy;
          if (dist < bestDist) {
            bestDist = dist;
            bestTarget = c;
          }
        }
      }

      if (!bestTarget) {
        setDropTargetId(null);
        setDropMode(null);
        return;
      }

      // Drop mode podle pozice cursoru vůči target center
      const targetW = bestTarget.width ?? bestTarget.measured?.width ?? NODE_W;
      const targetH = bestTarget.height ?? bestTarget.measured?.height ?? NODE_H;
      const offset = isVertical ? cursor.x - bestTarget.position.x : cursor.y - bestTarget.position.y;
      const dim = isVertical ? targetW : targetH;
      const childZone = dim * 0.18;

      let mode: DropMode;
      if (offset < -childZone) {
        mode = 'sibling-left';
      } else if (offset > childZone) {
        mode = 'sibling-right';
      } else {
        mode = 'child';
      }

      setDropTargetId(bestTarget.id);
      setDropMode(mode);
    },
    [screenToFlowPosition, getIntersectingNodes, orientation],
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
      // Bez fitView: viewport zůstane na stejném místě po uživatelově přání.
      // Uživatel může kdykoli kliknout „Přizpůsobit pohled" v toolbaru pro refit.
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
