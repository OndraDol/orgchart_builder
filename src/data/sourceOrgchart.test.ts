import { describe, expect, it } from 'vitest';

import { CARD_COLOR_TOKENS, LEVEL_TYPES, STATUS_TYPES } from '../domain/orgchart';
import { SOURCE_ORGCHART } from './sourceOrgchart';

describe('SOURCE_ORGCHART', () => {
  it('uses schema version 2 and contains the full org chart', () => {
    expect(SOURCE_ORGCHART.schemaVersion).toBe(2);
    expect(SOURCE_ORGCHART.nodes.length).toBeGreaterThanOrEqual(100);
  });

  it('contains required role and person pairs from the source PDF', () => {
    const rolePeople = SOURCE_ORGCHART.nodes.map((node) => `${node.title} / ${node.person}`);

    expect(rolePeople).toEqual(
      expect.arrayContaining([
        'CO-Chief Executive Officer / Petr Vaněček',
        'CO-Chief Executive Officer / Karolína Topolová',
        'Chief Operations Officer / Martin Hrudník',
        'Chief Financial Officer / Marko Tapio Lehtonen',
        'Chief Performance Officer / Jiří Trnka',
        'Chief Innovation Officer / Eldar Vagabov',
        'Managing Director Mototechna Drive / Jan Hrubý',
        'Chief Legal Officer / Lenka Zajíčková',
        'Chief HR Officer / Marie Voršílková',
        'Group Car Sales Director / Daniel Luňáček',
        'Group Purchasing Director / Zdeněk Batěk',
        'Group AutomotiveOPS Director / Leoš Pilnaj',
        'Group Stock & Service Director / Pavel Pospíšil',
        'Group Internal Audit Director / Lukáš Chlup',
        'Group Financial Services Director / Milan Dědeček',
        'Chief Executive Officer / Zdeněk Demeter',
        'Chief Information Officer / Jiří Čabrádek',
        'Chief Digital Officer / Milan Ježek',
        'Group Call Centre Director / Petr Havel',
        'Group Business Development Director / David Čížek',
        'Group Office Operations Director / Michaela Kosinerová',
        'Country Payroll Manager CZ+SK / Jitka Hořejší',
        'Managing Director CZ/SK / Luboš Vorlík',
        'Managing Director PL / Miroslav Vápeník',
        'SWAP Manager / Michal Válka',
        'Country Buying Manager / Ondrej Šuba',
      ]),
    );
  });

  it('has stable unique ids', () => {
    const ids = SOURCE_ORGCHART.nodes.map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('references existing parent ids and has exactly one root', () => {
    const ids = new Set(SOURCE_ORGCHART.nodes.map((node) => node.id));
    const roots = SOURCE_ORGCHART.nodes.filter((node) => node.parentId === null);

    expect(roots).toHaveLength(1);
    expect(SOURCE_ORGCHART.nodes.every((node) => node.parentId === null || ids.has(node.parentId))).toBe(true);
  });

  it('uses only declared domain tokens', () => {
    const colors = new Set(CARD_COLOR_TOKENS.map((token) => token.id));
    const levelTypes = new Set(LEVEL_TYPES);
    const statuses = new Set(STATUS_TYPES);

    expect(SOURCE_ORGCHART.nodes.every((node) => colors.has(node.color))).toBe(true);
    expect(SOURCE_ORGCHART.nodes.every((node) => levelTypes.has(node.levelType))).toBe(true);
    expect(SOURCE_ORGCHART.nodes.every((node) => statuses.has(node.status))).toBe(true);
  });

  it('uses the new B-level enum on every node', () => {
    const bLevelPattern = /^B-[0-4]$/;
    expect(SOURCE_ORGCHART.nodes.every((node) => bLevelPattern.test(node.levelType))).toBe(true);
  });

  it('does not contain parent cycles', () => {
    const nodesById = new Map(SOURCE_ORGCHART.nodes.map((node) => [node.id, node]));

    for (const node of SOURCE_ORGCHART.nodes) {
      const ancestors = new Set<string>();
      let parentId = node.parentId;

      while (parentId !== null) {
        expect(parentId).not.toBe(node.id);
        expect(ancestors.has(parentId)).toBe(false);
        ancestors.add(parentId);

        parentId = nodesById.get(parentId)?.parentId ?? null;
      }
    }
  });
});
