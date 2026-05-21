import { describe, expect, it } from 'vitest';

import { SOURCE_ORGCHART } from './sourceOrgchart';

describe('SOURCE_ORGCHART', () => {
  it('uses schema version 1 and has source nodes', () => {
    expect(SOURCE_ORGCHART.schemaVersion).toBe(1);
    expect(SOURCE_ORGCHART.nodes.length).toBeGreaterThan(20);
  });

  it('contains required role and person pairs visible in the attachment', () => {
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
        'Group Personnel & Payroll Manager / Martina Kahounová',
        'Country Payroll Manager CZ+SK / Jitka Hořejší',
        'Managing Director CZ/SK / Luboš Vorlík',
      ]),
    );
  });

  it('has stable unique ids', () => {
    const ids = SOURCE_ORGCHART.nodes.map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
