import { describe, expect, it } from 'vitest';

import audit from '../../docs/audits/pdf-orgchart-audit.json';

interface SourceNodeMatch {
  id: string;
  person: string;
  cards: { cardIndex: number; rect: number[]; label: string }[];
}

interface SourceEdgeEvidence {
  childId: string;
  parentId: string;
  status: 'supported' | 'unsupported' | 'skipped';
  matchingComponents: number[];
}

interface PdfAudit {
  sourceNodeMatches?: SourceNodeMatch[];
  sourceEdgeEvidence?: SourceEdgeEvidence[];
}

describe('PDF source audit artifact', () => {
  const typedAudit = audit as PdfAudit;

  it('records card match candidates for each source node with a person', () => {
    expect(typedAudit.sourceNodeMatches).toBeDefined();
    expect(typedAudit.sourceNodeMatches?.some((match) => match.id === 'chief-executive-officer-zdenek-demeter')).toBe(
      true,
    );
    expect(
      typedAudit.sourceNodeMatches?.find((match) => match.id === 'chief-executive-officer-zdenek-demeter')?.cards[0]
        ?.rect,
    ).toHaveLength(4);
  });

  it('records connector evidence for every source edge that can be checked against PDF geometry', () => {
    expect(typedAudit.sourceEdgeEvidence).toBeDefined();
    expect(
      typedAudit.sourceEdgeEvidence?.find(
        (edge) =>
          edge.childId === 'group-it-development-project-manager-jakub-rehak' &&
          edge.parentId === 'chief-executive-officer-zdenek-demeter',
      ),
    ).toMatchObject({
      status: 'supported',
      matchingComponents: expect.arrayContaining([193]),
    });
  });

  it('does not contain unsupported non-root source edges', () => {
    expect(typedAudit.sourceEdgeEvidence?.filter((edge) => edge.status === 'unsupported')).toEqual([]);
  });
});
