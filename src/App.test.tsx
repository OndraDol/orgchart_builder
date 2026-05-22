import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SOURCE_ORGCHART } from './data/sourceOrgchart';
import { messages, pluralizeCards } from './i18n/messages';

vi.mock('./components/EditorPanel', () => ({
  EditorPanel: ({ onDelete }: { onDelete: (nodeId: string) => void }) => (
    <aside aria-label="Mock card editor">
      <button type="button" onClick={() => onDelete('co-ceo-petr-vanecek')}>
        Mock delete
      </button>
    </aside>
  ),
}));

import { App } from './App';

describe('App editor actions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('asks for confirmation before deleting a card', async () => {
    sessionStorage.setItem('orgchart-builder.unlocked', 'true');
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: 'Mock delete' }));

    expect(confirm).toHaveBeenCalledWith(messages.editor.confirmDelete);
    expect(
      screen.getByText(pluralizeCards(SOURCE_ORGCHART.nodes.length)),
    ).toBeInTheDocument();
  });

  it('filters the visible orgchart to a selected country plus ancestor path', async () => {
    sessionStorage.setItem('orgchart-builder.unlocked', 'true');

    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: 'SK' }));

    expect(screen.getByText('Country Business Manager SK')).toBeInTheDocument();
    expect(screen.getByText('Managing Director CZ/SK')).toBeInTheDocument();
    expect(screen.queryByText('Country OPS Manager')).not.toBeInTheDocument();
  });
});
