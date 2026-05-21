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
}

interface OrgFlowNodeData extends Record<string, unknown> {
  node: OrgNode;
  orientation: ChartOrientation;
  selected: boolean;
  searchMatch: boolean;
  moving: boolean;
  draft: boolean;
  dropTarget: boolean;
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
}: OrgChartCanvasProps) {
  const { fitView, getIntersectingNodes } = useReactFlow<OrgFlowNode, Edge>();
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
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
  }, []);

  const handleNodeDrag = useCallback(
    (_event: unknown, node: OrgFlowNode) => {
      const intersecting = getIntersectingNodes(node);
      const target = intersecting.find((candidate) => candidate.id !== node.id);
      setDropTargetId(target?.id ?? null);
    },
    [getIntersectingNodes],
  );

  const handleNodeDragStop = useCallback(
    (_event: unknown, node: OrgFlowNode) => {
      const sourceId = node.id;
      const targetId = dropTargetId;
      setDraggedNodeId(null);
      setDropTargetId(null);
      if (targetId && targetId !== sourceId) {
        onDropAsChild(sourceId, targetId);
      }
    },
    [dropTargetId, onDropAsChild],
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
