import { describe, expect, it } from 'vitest';

import type { OrgChartDocument, OrgNode } from './orgchart';
import { countryStringFromCodes, filterChartByCountry, getNodeCountries } from './countryFilter';

const node = (id: string, parentId: string | null, country = '', countries?: OrgNode['countries']): OrgNode => ({
  id,
  parentId,
  title: id,
  person: '',
  levelType: parentId === null ? 'B-0' : 'B-2',
  country,
  ...(countries !== undefined ? { countries } : {}),
  regio: '',
  color: parentId === null ? 'executive' : 'standard',
  status: 'active',
  order: 10,
});

const chart = (): OrgChartDocument => ({
  schemaVersion: 5,
  name: 'Countries',
  updatedAt: '2026-05-22T00:00:00.000Z',
  nodes: [
    node('root', null),
    node('group', 'root'),
    node('cz', 'group', 'CZ'),
    node('sk', 'group', 'SK'),
    node('multi-legacy', 'group', 'CZ/SK/PL/HU'),
    node('multi-array', 'group', '', ['CZ', 'PL']),
    node('unrelated', 'root', 'DE'),
  ],
});

describe('countryFilter', () => {
  it('parses legacy slash-separated country strings', () => {
    expect(getNodeCountries(node('legacy', 'root', 'CZ/SK/PL/HU'))).toEqual(['CZ', 'SK', 'PL', 'HU']);
  });

  it('uses countries array as the authoritative value when present', () => {
    expect(getNodeCountries(node('array', 'root', 'SK', ['CZ', 'PL']))).toEqual(['CZ', 'PL']);
  });

  it('serializes countries in stable display order', () => {
    expect(countryStringFromCodes(['PL', 'CZ', 'SK'])).toBe('CZ/SK/PL');
  });

  it('keeps the whole chart for the All filter', () => {
    expect(filterChartByCountry(chart(), 'all')).toEqual(chart());
  });

  it('filters by role scope, not employee country metadata', () => {
    const root = node('root', null);
    const deRoleWithCzEmployee = {
      ...node('swap', 'root', 'DE'),
      employeeCountry: 'CZ' as const,
    };

    const chart = {
      schemaVersion: 5 as const,
      name: 'test',
      updatedAt: new Date().toISOString(),
      nodes: [root, deRoleWithCzEmployee],
    };

    expect(filterChartByCountry(chart, 'CZ').nodes.map((item) => item.id)).toEqual([]);
    expect(filterChartByCountry(chart, 'all').nodes.map((item) => item.id)).toContain('swap');
  });

  it('keeps matching country nodes and their ancestor path', () => {
    const filtered = filterChartByCountry(chart(), 'SK');

    expect(filtered.nodes.map((item) => item.id).sort()).toEqual(['group', 'multi-legacy', 'root', 'sk']);
    expect(filtered.nodes.find((item) => item.id === 'cz')).toBeUndefined();
    expect(filtered.nodes.find((item) => item.id === 'unrelated')).toBeUndefined();
  });
});
