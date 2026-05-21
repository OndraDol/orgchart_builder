import { useState } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Toolbar } from './Toolbar';

describe('Toolbar', () => {
  const defaultProps = {
    search: '',
    orientation: 'vertical' as const,
    canUndo: false,
    onSearchChange: vi.fn(),
    onOrientationChange: vi.fn(),
    onUndo: vi.fn(),
    onReset: vi.fn(),
    onExport: vi.fn(),
    onImport: vi.fn(),
    onFitView: vi.fn(),
  };

  it('renders core editor controls', () => {
    render(<Toolbar {...defaultProps} />);

    expect(screen.getByLabelText('Search roles and people')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export JSON' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
  });

  it('calls onSearchChange when search text changes', async () => {
    const onSearchChange = vi.fn();

    function StatefulToolbar() {
      const [search, setSearch] = useState('');

      return (
        <Toolbar
          {...defaultProps}
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            onSearchChange(value);
          }}
        />
      );
    }

    render(<StatefulToolbar />);

    await userEvent.type(screen.getByLabelText('Search roles and people'), 'sales');

    expect(onSearchChange).toHaveBeenLastCalledWith('sales');
  });
});
