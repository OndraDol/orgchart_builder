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
  const { fitView, screenToFlowPosition, getNodes } = useReactFlow<OrgFlowNode, Edge>();
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
    (event: ReactMouseEvent, node: OrgFlowNode) => {
      // Cursor-based drop targeting: najdi nejbližší kartu k cursoru (ne k tažené kartě),
      // i bez fyzického overlapu. Umožňuje opravdu volné přeskládání.
      const cursor = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const allNodes = getNodes();
      const isVertical = orientation === 'vertical';

      // Hledej nejbližší kartu k cursoru
      let bestTarget: OrgFlowNode | null = null;
      let bestDist = Infinity;
      const MAX_RADIUS = 320;
      for (const candidate of allNodes) {
        if (candidate.id === node.id) continue;
        const w = candidate.width ?? candidate.measured?.width ?? 192;
        const h = candidate.height ?? candidate.measured?.height ?? 96;
        const cx = candidate.position.x; // nodeOrigin=[0.5, 0.5] → position je center
        const cy = candidate.position.y;
        const dx = cursor.x - cx;
        const dy = cursor.y - cy;
        // Vážená vzdálenost: zóna kolem karty je oválná podle dimenze
        const normDx = dx / (w * 0.5);
        const normDy = dy / (h * 0.5);
        const dist = Math.sqrt(normDx * normDx + normDy * normDy);
        if (dist < bestDist && dist < MAX_RADIUS / 100) {
          bestDist = dist;
          bestTarget = candidate;
        }
      }

      if (!bestTarget) {
        setDropTargetId(null);
        setDropMode(null);
        return;
      }

      // Určit drop mode podle pozice cursoru vůči target karty
      // Vertikální layout: levá/pravá hrana = sibling, centrum = child
      // Horizontální layout: horní/dolní hrana = sibling, centrum = child
      const targetW = bestTarget.width ?? bestTarget.measured?.width ?? 192;
      const targetH = bestTarget.height ?? bestTarget.measured?.height ?? 96;
      const tcx = bestTarget.position.x;
      const tcy = bestTarget.position.y;
      const offset = isVertical ? cursor.x - tcx : cursor.y - tcy;
      const dim = isVertical ? targetW : targetH;
      // Sibling zone když je cursor mimo centrální 30 % (15 % na každou stranu od center)
      const childZone = dim * 0.15;

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
    [screenToFlowPosition, getNodes, orientation],
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
