import {
  COUNTRY_CODES,
  type CountryCode,
  type CountryFilter,
  type OrgChartDocument,
  type OrgNode,
} from './orgchart';

const countryCodeSet = new Set<string>(COUNTRY_CODES);

export const normalizeCountryCodes = (codes: readonly string[]): CountryCode[] => {
  const selected = new Set(codes.filter((code): code is CountryCode => countryCodeSet.has(code)));

  return COUNTRY_CODES.filter((code) => selected.has(code));
};

export const countryStringFromCodes = (codes: readonly CountryCode[]): string => normalizeCountryCodes(codes).join('/');

export const getNodeCountries = (node: Pick<OrgNode, 'country' | 'countries'>): CountryCode[] => {
  if (node.countries !== undefined) {
    return normalizeCountryCodes(node.countries);
  }

  if (!node.country.trim()) {
    return [];
  }

  return normalizeCountryCodes(node.country.split(/[\/,+\s]+/).filter(Boolean));
};

const getAncestorIds = (nodesById: Map<string, OrgNode>, node: OrgNode): string[] => {
  const ancestorIds: string[] = [];
  const visitedIds = new Set<string>([node.id]);
  let currentParentId = node.parentId;

  while (currentParentId !== null) {
    if (visitedIds.has(currentParentId)) {
      break;
    }

    const parent = nodesById.get(currentParentId);
    if (!parent) {
      break;
    }

    ancestorIds.push(parent.id);
    visitedIds.add(parent.id);
    currentParentId = parent.parentId;
  }

  return ancestorIds;
};

export const filterChartByCountry = (chart: OrgChartDocument, countryFilter: CountryFilter): OrgChartDocument => {
  if (countryFilter === 'all') {
    return chart;
  }

  const nodesById = new Map(chart.nodes.map((node) => [node.id, node]));
  const visibleIds = new Set<string>();

  for (const node of chart.nodes) {
    if (!getNodeCountries(node).includes(countryFilter)) {
      continue;
    }

    visibleIds.add(node.id);
    for (const ancestorId of getAncestorIds(nodesById, node)) {
      visibleIds.add(ancestorId);
    }
  }

  return {
    ...chart,
    nodes: chart.nodes.filter((node) => visibleIds.has(node.id)),
  };
};
