import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SOURCE_ORGCHART } from '../data/sourceOrgchart';
import { messages } from '../i18n/messages';
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
        fitViewToken={0}
        draftNodeId={null}
        onSelect={vi.fn()}
        onAddChild={vi.fn()}
        onMoveAsChild={vi.fn()}
        onMoveAsSibling={vi.fn()}
        onDropAsChild={vi.fn()}
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
        fitViewToken={0}
        draftNodeId={null}
        onSelect={vi.fn()}
        onAddChild={onAddChild}
        onMoveAsChild={vi.fn()}
        onMoveAsSibling={vi.fn()}
        onDropAsChild={vi.fn()}
      />,
    );

    await user.click(screen.getByLabelText(messages.editor.addChildAria('Chief HR Officer')));

    expect(onAddChild).toHaveBeenCalledWith('chief-hr-officer-marie-vorsilkova');
  });
});
