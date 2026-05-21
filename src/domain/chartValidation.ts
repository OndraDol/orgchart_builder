import {
  CARD_COLOR_TOKENS,
  LEVEL_TYPES,
  STATUS_TYPES,
  type CardColorTokenId,
  type OrgChartDocument,
  type OrgNode,
  type OrgNodeLevelType,
  type OrgNodeStatus,
} from './orgchart';

const colorTokenIds = new Set<CardColorTokenId>(CARD_COLOR_TOKENS.map((token) => token.id));
const levelTypes = new Set<OrgNodeLevelType>(LEVEL_TYPES);
const statusTypes = new Set<OrgNodeStatus>(STATUS_TYPES);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === 'string';

const isValidNode = (value: unknown): value is OrgNode => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isString(value.id) &&
    (value.parentId === null || isString(value.parentId)) &&
    isString(value.title) &&
    isString(value.person) &&
    isString(value.levelType) &&
    levelTypes.has(value.levelType as OrgNodeLevelType) &&
    isString(value.country) &&
    isString(value.regio) &&
    isString(value.color) &&
    colorTokenIds.has(value.color as CardColorTokenId) &&
    isString(value.status) &&
    statusTypes.has(value.status as OrgNodeStatus) &&
    typeof value.order === 'number' &&
    Number.isFinite(value.order)
  );
};

export const isChartDocument = (value: unknown): value is OrgChartDocument => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.schemaVersion === 2 &&
    isString(value.name) &&
    isString(value.updatedAt) &&
    Array.isArray(value.nodes) &&
    value.nodes.every(isValidNode)
  );
};

export const validateChartDocument = (chart: OrgChartDocument): string[] => {
  const errors: string[] = [];
  const nodeIds = new Set<string>();
  const duplicateIds = new Set<string>();

  for (const node of chart.nodes) {
    if (nodeIds.has(node.id)) {
      duplicateIds.add(node.id);
    } else {
      nodeIds.add(node.id);
    }

    if (node.id.trim() === '') {
      errors.push('Node id must not be empty.');
    }

    if (node.title.trim() === '') {
      errors.push(`Node title must not be empty for node ${node.id}`);
    }

    if (!colorTokenIds.has(node.color)) {
      errors.push(`Unknown color ${node.color} for node ${node.id}`);
    }
  }

  for (const id of duplicateIds) {
    errors.push(`Duplicate node id: ${id}`);
  }

  const rootCount = chart.nodes.filter((node) => node.parentId === null).length;
  if (rootCount !== 1) {
    errors.push('Chart must contain exactly one root node.');
  }

  for (const node of chart.nodes) {
    if (node.parentId !== null && !nodeIds.has(node.parentId)) {
      errors.push(`Missing parent ${node.parentId} for node ${node.id}`);
    }
  }

  const byId = new Map(chart.nodes.map((node) => [node.id, node]));
  const checkedIds = new Set<string>();

  for (const node of chart.nodes) {
    const pathIds = new Set<string>();
    let current: OrgNode | undefined = node;

    while (current) {
      if (pathIds.has(current.id)) {
        errors.push(`Cycle detected at node ${current.id}`);
        break;
      }

      if (checkedIds.has(current.id)) {
        break;
      }

      pathIds.add(current.id);
      current = current.parentId === null ? undefined : byId.get(current.parentId);
    }

    for (const id of pathIds) {
      checkedIds.add(id);
    }
  }

  return errors;
};

export const parseChartDocument = (json: string): OrgChartDocument => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Imported file is not valid JSON.');
  }

  if (!isChartDocument(parsed)) {
    throw new Error('Imported file is not an orgchart document.');
  }

  const errors = validateChartDocument(parsed);
  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }

  return parsed;
};
