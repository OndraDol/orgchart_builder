import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StatusBar } from './StatusBar';

describe('StatusBar', () => {
  it('announces normal save status politely', () => {
    render(<StatusBar nodeCount={27} warning="" saveState="saved" />);

    expect(screen.getByRole('status')).toHaveTextContent('27 cards');
    expect(screen.getByText('Changes are saved in this browser.')).toBeInTheDocument();
  });

  it('announces warnings as alerts without saved copy on save failure', () => {
    render(
      <StatusBar
        nodeCount={27}
        warning="Changes could not be saved in this browser."
        saveState="failed"
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Changes could not be saved in this browser.',
    );
    expect(screen.queryByText('Changes are saved in this browser.')).not.toBeInTheDocument();
  });
});
