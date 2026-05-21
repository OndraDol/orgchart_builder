import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { messages, pluralizeCards, translateWarning } from '../i18n/messages';
import { StatusBar } from './StatusBar';

describe('StatusBar', () => {
  it('announces normal save status politely', () => {
    render(<StatusBar nodeCount={27} warning="" saveState="saved" />);

    expect(screen.getByRole('status')).toHaveTextContent(pluralizeCards(27));
    expect(screen.getByText(messages.status.saved)).toBeInTheDocument();
  });

  it('announces warnings as alerts without saved copy on save failure', () => {
    render(
      <StatusBar
        nodeCount={27}
        warning="Imported file is not valid JSON."
        saveState="failed"
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      translateWarning('Imported file is not valid JSON.'),
    );
    expect(screen.queryByText(messages.status.saved)).not.toBeInTheDocument();
    expect(screen.getByText(messages.status.failed)).toBeInTheDocument();
  });

  it('uses Czech card plural forms', () => {
    expect(pluralizeCards(1)).toBe('1 karta');
    expect(pluralizeCards(3)).toBe('3 karty');
    expect(pluralizeCards(7)).toBe('7 karet');
    expect(pluralizeCards(0)).toBe('0 karet');
  });
});
