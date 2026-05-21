import type { NodePosition, OrgChartDocument, OrgNode, SelectedNodePatch } from './orgchart';

type SiblingSide = 'left' | 'right';

const DEFAULT_NEW_NODE: Omit<OrgNode, 'id' | 'parentId' | 'order'> = {
  title: 'Nová role',
  person: '',
  levelType: 'B-2',
  country: '',
  regio: '',
  color: 'standard',
  status: 'active',
};

const withUpdatedAt = (chart: OrgChartDocument, nodes: OrgNode[]): OrgChartDocument => ({
  ...chart,
  updatedAt: new Date().toISOString(),
  nodes,
});

const findNode = (chart: OrgChartDocument, nodeId: string): OrgNode => {
  const node = chart.nodes.find((candidate) => candidate.id === nodeId);

  if (!node) {
    throw new Error(`Node not found: ${nodeId}`);
  }

  return node;
};

const slugify = (value: string): string => {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'node';
};

const createUniqueId = (nodes: OrgNode[], label: string): string => {
  const baseId = slugify(label);
  const usedIds = new Set(nodes.map((node) => node.id));

  if (!usedIds.has(baseId)) {
    return baseId;
  }

  let suffix = 2;
  let candidate = `${baseId}-${suffix}`;

  while (usedIds.has(candidate)) {
    suffix += 1;
    candidate = `${baseId}-${suffix}`;
  }

  return candidate;
};

const getDescendantIds = (nodes: OrgNode[], nodeId: string): Set<string> => {
  const descendantIds = new Set<string>();
  const visitedIds = new Set([nodeId]);
  const queue = [nodeId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    const children = nodes.filter((node) => node.parentId === currentId);

    for (const child of children) {
      if (visitedIds.has(child.id)) {
        throw new Error('Cycle detected while traversing descendants.');
      }

      visitedIds.add(child.id);
      descendantIds.add(child.id);
      queue.push(child.id);
    }
  }

  return descendantIds;
};

const normalizeSiblingOrders = (nodes: OrgNode[], parentId: string | null): OrgNode[] => {
  const orderedIds = nodes
    .filter((node) => node.parentId === parentId)
    .slice()
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id))
    .map((node) => node.id);
  const orderById = new Map(orderedIds.map((id, index) => [id, (index + 1) * 10]));

  return nodes.map((node) => {
    const order = orderById.get(node.id);
    return order === undefined ? node : { ...node, order };
  });
};

const normalizeAllSiblingOrders = (nodes: OrgNode[]): OrgNode[] => {
  const parentIds = new Set(nodes.map((node) => node.parentId));

  return Array.from(parentIds).reduce((currentNodes, parentId) => normalizeSiblingOrders(currentNodes, parentId), nodes);
};

const nextSiblingOrder = (nodes: OrgNode[], parentId: string | null): number => {
  const siblingOrders = nodes.filter((node) => node.parentId === parentId).map((node) => node.order);

  return siblingOrders.length === 0 ? 10 : Math.max(...siblingOrders) + 10;
};

export const addChildNode = (chart: OrgChartDocument, parentId: string): OrgChartDocument => {
  findNode(chart, parentId);

  const newNode: OrgNode = {
    ...DEFAULT_NEW_NODE,
    id: createUniqueId(chart.nodes, DEFAULT_NEW_NODE.title),
    parentId,
    order: nextSiblingOrder(chart.nodes, parentId),
  };

  return withUpdatedAt(chart, [...chart.nodes, newNode]);
};

export const updateNode = (
  chart: OrgChartDocument,
  nodeId: string,
  patch: SelectedNodePatch,
): OrgChartDocument => {
  findNode(chart, nodeId);

  return withUpdatedAt(
    chart,
    chart.nodes.map((node) => (node.id === nodeId ? { ...node, ...patch } : node)),
  );
};

export const deleteNodeAndDescendants = (chart: OrgChartDocument, nodeId: string): OrgChartDocument => {
  const node = findNode(chart, nodeId);

  if (node.parentId === null) {
    throw new Error('Cannot delete the root node.');
  }

  const idsToDelete = getDescendantIds(chart.nodes, nodeId);
  idsToDelete.add(nodeId);

  const remainingNodes = chart.nodes.filter((node) => !idsToDelete.has(node.id));

  return withUpdatedAt(chart, normalizeAllSiblingOrders(remainingNodes));
};

export const moveNodeAsChild = (
  chart: OrgChartDocument,
  sourceId: string,
  targetParentId: string,
  position?: NodePosition,
): OrgChartDocument => {
  const source = findNode(chart, sourceId);
  findNode(chart, targetParentId);

  if (sourceId === targetParentId) {
    throw new Error('Cannot move a node into itself.');
  }

  if (getDescendantIds(chart.nodes, sourceId).has(targetParentId)) {
    throw new Error('Cannot move a node into its own descendant.');
  }

  const movedNodes = chart.nodes.map((node) =>
    node.id === sourceId
      ? { ...node, parentId: targetParentId, order: nextSiblingOrder(chart.nodes, targetParentId), ...(position ? { position } : {}) }
      : node,
  );

  return withUpdatedAt(chart, normalizeAllSiblingOrders(movedNodes));
};

export const moveNodeAsParent = (
  chart: OrgChartDocument,
  sourceId: string,
  targetId: string,
  position?: NodePosition,
): OrgChartDocument => {
  const source = findNode(chart, sourceId);
  const target = findNode(chart, targetId);

  if (sourceId === targetId) {
    throw new Error('Cannot move a node above itself.');
  }

  if (source.parentId === null) {
    throw new Error('Cannot move the root node.');
  }

  if (target.parentId === null) {
    throw new Error('Cannot move a node above the root.');
  }

  if (getDescendantIds(chart.nodes, sourceId).has(targetId)) {
    throw new Error('Cannot move a node above its own descendant.');
  }

  const targetOriginalParentId = target.parentId;
  const targetOrderUnderSource = nextSiblingOrder(chart.nodes, sourceId);
  const movedNodes = chart.nodes.map((node) => {
    if (node.id === sourceId) {
      return { ...node, parentId: targetOriginalParentId, order: target.order, ...(position ? { position } : {}) };
    }

    if (node.id === targetId) {
      return { ...node, parentId: sourceId, order: targetOrderUnderSource };
    }

    return node;
  });

  return withUpdatedAt(chart, normalizeAllSiblingOrders(movedNodes));
};

export const moveNodeAsSibling = (
  chart: OrgChartDocument,
  sourceId: string,
  targetId: string,
  side: SiblingSide,
  position?: NodePosition,
): OrgChartDocument => {
  findNode(chart, sourceId);
  const target = findNode(chart, targetId);

  if (sourceId === targetId) {
    throw new Error('Cannot move a node beside itself.');
  }

  if (target.parentId === null) {
    throw new Error('Cannot move a node beside the root.');
  }

  if (getDescendantIds(chart.nodes, sourceId).has(targetId)) {
    throw new Error('Cannot move a node beside its own descendant.');
  }

  const siblings = chart.nodes
    .filter((node) => node.parentId === target.parentId && node.id !== sourceId)
    .slice()
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));
  const targetIndex = siblings.findIndex((node) => node.id === targetId);
  const sourceInsertIndex = side === 'left' ? targetIndex : targetIndex + 1;
  const reorderedSiblingIds = [
    ...siblings.slice(0, sourceInsertIndex).map((node) => node.id),
    sourceId,
    ...siblings.slice(sourceInsertIndex).map((node) => node.id),
  ];
  const orderById = new Map(reorderedSiblingIds.map((id, index) => [id, (index + 1) * 10]));

  const movedNodes = chart.nodes.map((node) => {
    if (node.id === sourceId) {
      return { ...node, parentId: target.parentId, order: orderById.get(sourceId) ?? node.order, ...(position ? { position } : {}) };
    }

    const order = orderById.get(node.id);
    return order === undefined ? node : { ...node, order };
  });

  return withUpdatedAt(chart, normalizeAllSiblingOrders(movedNodes));
};
