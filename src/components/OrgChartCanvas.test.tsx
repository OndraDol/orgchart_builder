import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SOURCE_ORGCHART } from '../data/sourceOrgchart';
import { OrgChartCanvas } from './OrgChartCanvas';

describe('OrgChartCanvas', () => {
  it('renders source orgchart cards', () => {
    render(
      <OrgChartCanvas
        chart={SOURCE_ORGCHART}
        orientation="vertical"
        selectedNodeId={null}
        movingNodeId={null}
        search=""
        onSelect={vi.fn()}
        onAddChild={vi.fn()}
        onMoveAsChild={vi.fn()}
        onMoveAsSibling={vi.fn()}
      />,
    );

    expect(screen.getByText('Chief HR Officer')).toBeInTheDocument();
  });

  it('calls onAddChild with the target node id from the add button', async () => {
    const user = userEvent.setup();
    const onAddChild = vi.fn();

    render(
      <OrgChartCanvas
        chart={SOURCE_ORGCHART}
        orientation="vertical"
        selectedNodeId={null}
        movingNodeId={null}
        search=""
        onSelect={vi.fn()}
        onAddChild={onAddChild}
        onMoveAsChild={vi.fn()}
        onMoveAsSibling={vi.fn()}
      />,
    );

    await user.click(screen.getByLabelText('Add child under Chief HR Officer'));

    expect(onAddChild).toHaveBeenCalledWith('chief-hr-officer-marie-vorsilkova');
  });
});
