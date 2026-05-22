import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { OrgNode } from '../domain/orgchart';
import { EditorPanel } from './EditorPanel';

const selectedNode = (overrides: Partial<OrgNode> = {}): OrgNode => ({
  id: 'node',
  parentId: 'root',
  title: 'Country role',
  person: 'Person',
  levelType: 'B-2',
  country: 'CZ',
  countries: ['CZ'],
  regio: '',
  color: 'standard',
  status: 'active',
  order: 10,
  ...overrides,
});

describe('EditorPanel', () => {
  it('edits multiple country flags and keeps the legacy country string synchronized', async () => {
    const onChange = vi.fn();

    render(
      <EditorPanel
        node={selectedNode()}
        movingNodeId={null}
        isDraft={false}
        onChange={onChange}
        onDelete={vi.fn()}
        onStartMove={vi.fn()}
        onCancelMove={vi.fn()}
        onClose={vi.fn()}
        onSaveDraft={vi.fn()}
      />,
    );

    expect(screen.getByRole('group', { name: 'Role scope' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Role scope CZ' })).toBeChecked();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Role scope SK' }));

    expect(onChange).toHaveBeenLastCalledWith({
      country: 'CZ/SK',
      countries: ['CZ', 'SK'],
    });
  });
});
