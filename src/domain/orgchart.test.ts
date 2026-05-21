import { describe, expect, expectTypeOf, it } from 'vitest';

import { CARD_COLOR_TOKENS, LEVEL_TYPES, STATUS_TYPES } from './orgchart';
import type { CardColorTokenId, OrgNode } from './orgchart';

describe('orgchart constants', () => {
  it('defines required level types', () => {
    expect(LEVEL_TYPES).toEqual(['holding', 'group', 'country', 'regio', 'team', 'role', 'placeholder']);
  });

  it('defines required statuses', () => {
    expect(STATUS_TYPES).toEqual(['active', 'planned', 'vacant']);
  });

  it('includes source color tokens', () => {
    expect(CARD_COLOR_TOKENS.map((token) => token.id)).toEqual([
      'executive',
      'manager',
      'standard',
      'planned',
      'country',
      'regio',
      'neutral',
    ]);
  });

  it('uses color token ids for node color values', () => {
    expectTypeOf<OrgNode['color']>().toEqualTypeOf<CardColorTokenId>();
  });
});
