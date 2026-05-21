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
  status: 'supported' | 'confirmedOverride' | 'ambiguous' | 'unsupported' | 'skipped';
  matchingComponents: number[];
  selectedParentSource?: 'geometry' | 'confirmedOverride';
  selectedParentConfidence?: 'high' | 'confirmed' | 'unresolved' | 'skipped';
}

interface PdfAudit {
  summary?: {
    unresolvedParentLinks?: number;
    sourceEdgesResolvedByConfirmedOverride?: number;
    sourceEdgesAmbiguous?: number;
  };
  sourceNodeMatches?: SourceNodeMatch[];
  sourceEdgeEvidence?: SourceEdgeEvidence[];
  ambiguousSourceEdges?: SourceEdgeEvidence[];
  confirmedOverrideEdges?: SourceEdgeEvidence[];
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

  it('records Jan Jarma as a confirmed override under Martina Kahulová', () => {
    expect(
      typedAudit.sourceEdgeEvidence?.find((edge) => edge.childId === 'hr-team-leader-jan-jarma'),
    ).toMatchObject({
      parentId: 'group-personnel-payroll-manager-martina-kahulova',
      status: 'confirmedOverride',
      selectedParentSource: 'confirmedOverride',
      selectedParentConfidence: 'confirmed',
    });
  });

  it('fails the audit when ambiguous parent links remain unresolved', () => {
    expect(typedAudit.summary?.unresolvedParentLinks).toBe(0);
    expect(typedAudit.ambiguousSourceEdges).toEqual([]);
  });
});
