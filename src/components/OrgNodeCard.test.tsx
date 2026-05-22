import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { OrgNode } from '../domain/orgchart';
import { OrgNodeCard } from './OrgNodeCard';

const node: OrgNode = {
  id: 'bxx-node',
  parentId: 'root',
  title: 'Regional Marketing Manager',
  person: 'Michal Krulis',
  levelType: 'BXX',
  country: 'CZ',
  regio: '',
  color: 'standard',
  status: 'active',
  order: 10,
};

describe('OrgNodeCard', () => {
  it('renders BXX as a level badge', () => {
    render(
      <OrgNodeCard
        node={node}
        selected={false}
        searchMatch={false}
        moving={false}
        draft={false}
        dropTarget={false}
        dropMode={null}
        dropAllowed={false}
        onSelect={vi.fn()}
        onAddChild={vi.fn()}
      />,
    );

    expect(screen.getByText('BXX')).toBeInTheDocument();
    expect(screen.getByLabelText('Úroveň BXX')).toBeInTheDocument();
  });
});
