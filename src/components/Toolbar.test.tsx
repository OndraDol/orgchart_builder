import { useState } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { messages } from '../i18n/messages';
import { Toolbar } from './Toolbar';

describe('Toolbar', () => {
  const defaultProps = {
    search: '',
    orientation: 'vertical' as const,
    layoutMode: 'source' as const,
    canUndo: false,
    onSearchChange: vi.fn(),
    onOrientationChange: vi.fn(),
    onLayoutModeChange: vi.fn(),
    onUndo: vi.fn(),
    onReset: vi.fn(),
    onExport: vi.fn(),
    onImport: vi.fn(),
    onFitView: vi.fn(),
  };

  it('renders core editor controls', () => {
    render(<Toolbar {...defaultProps} />);

    expect(screen.getByLabelText(messages.toolbar.searchLabel)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: messages.toolbar.layoutSource })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: messages.toolbar.exportJson })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: messages.toolbar.reset })).toBeInTheDocument();
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

    await userEvent.type(screen.getByLabelText(messages.toolbar.searchLabel), 'sales');

    expect(onSearchChange).toHaveBeenLastCalledWith('sales');
  });
});
