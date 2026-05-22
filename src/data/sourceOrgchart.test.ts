import { describe, expect, it } from 'vitest';

import { CARD_COLOR_TOKENS, LEVEL_TYPES, STATUS_TYPES } from '../domain/orgchart';
import { SOURCE_ORGCHART, SOURCE_PHONEBOOK_METADATA_BY_ID } from './sourceOrgchart';

describe('SOURCE_ORGCHART', () => {
  it('uses schema version 5 and contains the full org chart', () => {
    expect(SOURCE_ORGCHART.schemaVersion).toBe(5);
    expect(SOURCE_ORGCHART.nodes.length).toBeGreaterThanOrEqual(100);
  });

  it('has a source PDF position for every visible source node', () => {
    const visibleNodes = SOURCE_ORGCHART.nodes.filter((node) => {
      const positionedNode = node as { sourceHidden?: boolean };
      return !positionedNode.sourceHidden;
    });

    expect(visibleNodes.length).toBeGreaterThan(100);
    expect(
      visibleNodes.every((node) => {
        const positionedNode = node as { sourcePosition?: { x: number; y: number; width: number; height: number } };
        return (
          positionedNode.sourcePosition !== undefined &&
          Number.isFinite(positionedNode.sourcePosition.x) &&
          Number.isFinite(positionedNode.sourcePosition.y) &&
          positionedNode.sourcePosition.width > 0 &&
          positionedNode.sourcePosition.height > 0
        );
      }),
    ).toBe(true);
  });

  it('keeps critical innovation branch direct reports exactly as the source connectors show', () => {
    const childrenOf = (parentId: string) =>
      SOURCE_ORGCHART.nodes
        .filter((node) => node.parentId === parentId)
        .map((node) => `${node.title} / ${node.person}`)
        .sort();

    expect(childrenOf('chief-innovation-officer-eldar-vagabov')).toEqual([
      'Chief Digital Officer / Milan Ježek',
      'Chief Executive Officer / Zdeněk Demeter',
      'Chief Information Officer / Jiří Čabrádek',
      'Head of PMO & Digital Transformation Manager / Daniel Fárek',
    ].sort());

    expect(childrenOf('chief-executive-officer-zdenek-demeter')).toEqual([
      'Head of Analytics / David Tatár',
      'Head of BI / Petronela Hubočanová',
      'Project Manager / Jakub Řehák',
    ].sort());

    expect(childrenOf('chief-information-officer-jiri-cabradek')).toEqual([
      'Group IT Development Director / Robert Šmol',
      'Group IT Infrastructure Manager / Ivo Baxant',
      'Group IT Project Manager / Martin Slabý',
      'Office Manager / Renata Lišková',
    ].sort());
  });

  it('keeps manually verified PDF parent corrections for shared connector rails', () => {
    const nodeById = new Map(SOURCE_ORGCHART.nodes.map((node) => [node.id, node]));

    expect(nodeById.get('group-car-sales-director-daniel-lunacek')?.parentId).toBe('coo-martin-hrudnik');
    expect(nodeById.get('group-purchasing-director-zdenek-batek')?.parentId).toBe('coo-martin-hrudnik');
    expect(nodeById.get('group-automotiveops-director-leos-pilnaj')?.parentId).toBe('coo-martin-hrudnik');
    expect(nodeById.get('group-stock-service-director-pavel-pospisil')?.parentId).toBe('coo-martin-hrudnik');
    expect(nodeById.get('group-internal-audit-director-lukas-chlup')?.parentId).toBe('coo-martin-hrudnik');
    expect(nodeById.get('group-call-centre-director-petr-havel')?.parentId).toBe('co-ceo-karolina-topolova');
    expect(nodeById.get('group-office-operations-director-michaela-kosinerova')?.parentId).toBe(
      'co-ceo-karolina-topolova',
    );
    expect(nodeById.get('head-of-pmo-digital-transformation-daniel-farek')?.parentId).toBe(
      'chief-innovation-officer-eldar-vagabov',
    );
    expect(nodeById.get('regional-marketing-manager-pl-marian-zielina')?.parentId).toBe(
      'managing-director-pl-miroslav-vapenik',
    );
  });

  it('keeps source-PDF duplicate cards as separate visible source nodes', () => {
    const visibleNodes = SOURCE_ORGCHART.nodes.filter((node) => !(node as { sourceHidden?: boolean }).sourceHidden);
    const nodeById = new Map(SOURCE_ORGCHART.nodes.map((node) => [node.id, node]));

    expect(visibleNodes).toHaveLength(121);
    expect(nodeById.get('group-it-development-project-manager-jakub-rehak')).toMatchObject({
      title: 'Project Manager',
      parentId: 'chief-executive-officer-zdenek-demeter',
    });
    expect(nodeById.get('group-buying-manager-martin-roudnicky')).toMatchObject({
      parentId: 'group-purchasing-director-zdenek-batek',
      country: '',
    });
    expect(nodeById.get('group-buying-manager-cz-martin-roudnicky')).toMatchObject({
      parentId: 'managing-director-czsk-lubos-vorlik',
      country: 'CZ',
    });
    expect(nodeById.get('group-stock-manager-josef-borovec')).toMatchObject({
      parentId: 'group-stock-service-director-pavel-pospisil',
      country: '',
    });
    expect(nodeById.get('group-stock-manager-cz-josef-borovec')).toMatchObject({
      parentId: 'managing-director-czsk-lubos-vorlik',
      country: 'CZ',
    });
    expect(nodeById.get('group-service-manager-miloslav-knap')).toMatchObject({
      parentId: 'group-stock-service-director-pavel-pospisil',
      country: '',
    });
    expect(nodeById.get('group-service-manager-cz-miloslav-knap')).toMatchObject({
      parentId: 'managing-director-czsk-lubos-vorlik',
      country: 'CZ',
    });
    expect(nodeById.get('back-office-manager-pl-agnieszka-romanska')).toMatchObject({
      parentId: 'group-office-operations-director-michaela-kosinerova',
    });
    expect(nodeById.get('back-office-manager-pl-country-agnieszka-romanska')).toMatchObject({
      parentId: 'managing-director-pl-miroslav-vapenik',
      country: 'PL',
    });
  });

  it('keeps Jan Jarma under Martina Kahulová as a confirmed HR branch correction', () => {
    const janJarma = SOURCE_ORGCHART.nodes.find((node) => node.id === 'hr-team-leader-jan-jarma');

    expect(janJarma).toMatchObject({
      parentId: 'group-personnel-payroll-manager-martina-kahulova',
      person: 'Jan Jarma',
      title: 'HR Team Leader',
    });
  });

  it('keeps role scope separate from employee country metadata', () => {
    const nodeById = new Map(SOURCE_ORGCHART.nodes.map((node) => [node.id, node]));

    expect(nodeById.get('swap-manager-de-michal-valka')).toMatchObject({
      country: 'DE',
      employeeCountry: 'CZ',
      companyId: '23',
    });

    expect(nodeById.get('group-web-manager-czskplhu-ondrej-bober')).toMatchObject({
      country: 'CZ/SK/PL/HU',
      employeeCountry: 'SK',
    });
  });

  it('records Phonebook manager pins without changing the PDF parent tree', () => {
    const janJarma = SOURCE_ORGCHART.nodes.find((node) => node.id === 'hr-team-leader-jan-jarma');

    expect(janJarma).toMatchObject({
      parentId: 'group-personnel-payroll-manager-martina-kahulova',
      phonebookManagerPin: '1152',
    });
  });

  it('keeps Phonebook metadata keys aligned with source nodes', () => {
    const sourceIds = new Set(SOURCE_ORGCHART.nodes.map((node) => node.id));

    expect(Object.keys(SOURCE_PHONEBOOK_METADATA_BY_ID)).toHaveLength(118);
    expect(Object.keys(SOURCE_PHONEBOOK_METADATA_BY_ID).sort()).toEqual(
      Object.keys(SOURCE_PHONEBOOK_METADATA_BY_ID)
        .filter((id) => sourceIds.has(id))
        .sort(),
    );
  });

  it('annotates every Phonebook-matched source person and leaves unmatched people unannotated', () => {
    const unmatchedIds = new Set([
      'mergers-acquisitions-ir-manager-radek-nemecek',
      'group-finance-controlling-manager-jiri-gross',
      'country-buying-manager-pl-ales-doudlebsky',
    ]);
    const visiblePeople = SOURCE_ORGCHART.nodes.filter((node) => !node.sourceHidden && node.person.trim());
    const annotatedPeople = visiblePeople.filter((node) => node.phonebookPin !== undefined);

    expect(visiblePeople).toHaveLength(121);
    expect(annotatedPeople).toHaveLength(118);

    for (const id of unmatchedIds) {
      expect(SOURCE_ORGCHART.nodes.find((node) => node.id === id)?.phonebookPin).toBeUndefined();
    }
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

  it('uses Phonebook B levels for verified rows', () => {
    const expectedLevels = new Map([
      ['call-centre-manager-praha-petr-vik', 'B-3'],
      ['call-centre-manager-ostrava-jan-kovar', 'B-3'],
      ['group-export-import-director-dusan-prochazka', 'B-2'],
      ['import-manager-filip-kvarda', 'B-3'],
      ['general-manager-export-robert-radler', 'B-3'],
      ['country-payroll-manager-czsk-jitka-horejsi', 'B-3'],
      ['hr-team-leader-jan-jarma', 'B-4'],
      ['general-manager-mototechna-2-michal-gabrhel', 'B-3'],
      ['head-of-bi-petronela-hubocanova', 'B-3'],
      ['office-manager-renata-liskova', 'B-3'],
      ['group-marketing-operations-manager-david-reich', 'B-1'],
      ['group-pr-manager-lucie-brychtova', 'B-3'],
      ['group-web-manager-czskplhu-ondrej-bober', 'B-3'],
      ['group-segment-manager-david-chvojka', 'B-3'],
      ['regional-marketing-manager-michal-krulis', 'BXX'],
      ['cars-administration-manager-michaela-beckova', 'B-3'],
      ['group-back-office-manager-pavla-smrckova', 'B-3'],
      ['back-office-manager-pl-agnieszka-romanska', 'B-3'],
      ['country-sales-manager-sk-martin-medek', 'B-2'],
      ['country-buying-manager-sk-robert-wiedner', 'B-2'],
      ['country-stock-manager-sk-bronislav-kroneisl', 'B-2'],
      ['country-service-manager-sk-michal-kossi', 'B-2'],
      ['country-fi-manager-sk-martin-bulicek', 'B-2'],
      ['facility-construction-manager-sk-pavol-rodina', 'BXX'],
      ['financial-accounting-manager-sk-danko-beran', 'B-2'],
      ['country-sales-manager-pl-jiri-vavra', 'B-2'],
      ['country-ops-manager-pl-lukas-jonsta', 'B-2'],
      ['country-stock-manager-pl-david-poncza', 'B-2'],
      ['country-service-manager-pl-filip-pavlovcin', 'B-2'],
      ['call-centre-manager-pl-kaminski-krystian', 'B-3'],
      ['country-hq-manager-pl-michal-wlodarczyk', 'B-3'],
      ['country-fi-relationship-manager-pl-pawel-molasy', 'B-2'],
      ['regional-marketing-manager-pl-marian-zielina', 'BXX'],
      ['development-manager-pl-weronika-szmanda', 'BXX'],
      ['country-personnel-staffing-manager-pl-barbara-wolska', 'B-3'],
      ['financial-accounting-manager-pl-cegiel-klemens', 'B-2'],
      ['back-office-manager-pl-country-agnieszka-romanska', 'B-3'],
      ['swap-manager-de-michal-valka', 'B-3'],
      ['country-buying-manager-hu-ondrej-suba', 'B-3'],
    ]);

    for (const [id, levelType] of expectedLevels) {
      expect(SOURCE_ORGCHART.nodes.find((node) => node.id === id)?.levelType).toBe(levelType);
    }
  });

  it('uses the new B-level enum on every node', () => {
    const bLevelPattern = /^(B-[0-4]|BXX)$/;
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
