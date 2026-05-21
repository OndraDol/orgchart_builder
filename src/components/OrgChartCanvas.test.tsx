import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SOURCE_ORGCHART } from '../data/sourceOrgchart';
import { messages } from '../i18n/messages';
import { getDropModeForCursor, mergeDraggedNodePosition, OrgChartCanvas } from './OrgChartCanvas';

describe('OrgChartCanvas', () => {
  it('maps vertical cursor position to parent, child, and sibling drop modes', () => {
    const baseTarget = {
      orientation: 'vertical' as const,
      targetX: 100,
      targetY: 100,
      targetWidth: 120,
      targetHeight: 90,
    };

    expect(getDropModeForCursor({ ...baseTarget, cursorX: 100, cursorY: 62 })).toBe('parent');
    expect(getDropModeForCursor({ ...baseTarget, cursorX: 100, cursorY: 138 })).toBe('child');
    expect(getDropModeForCursor({ ...baseTarget, cursorX: 58, cursorY: 100 })).toBe('sibling-left');
    expect(getDropModeForCursor({ ...baseTarget, cursorX: 142, cursorY: 100 })).toBe('sibling-right');
  });

  it('preserves the actively dragged node position when preview state rerenders nodes', () => {
    const nextNodes = [
      { id: 'a', position: { x: 0, y: 0 } },
      { id: 'b', position: { x: 100, y: 100 } },
    ];
    const currentNodes = [
      { id: 'a', position: { x: 300, y: 400 } },
      { id: 'b', position: { x: 100, y: 100 } },
    ];

    expect(mergeDraggedNodePosition(nextNodes, currentNodes, 'a')).toEqual([
      { id: 'a', position: { x: 300, y: 400 } },
      { id: 'b', position: { x: 100, y: 100 } },
    ]);
  });

  it('renders source orgchart cards', () => {
    render(
      <OrgChartCanvas
        chart={SOURCE_ORGCHART}
        orientation="vertical"
        layoutMode="source"
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
        onDropAsParent={vi.fn()}
        onDropAsSibling={vi.fn()}
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
        layoutMode="source"
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
        onDropAsParent={vi.fn()}
        onDropAsSibling={vi.fn()}
      />,
    );

    await user.click(screen.getByLabelText(messages.editor.addChildAria('Chief HR Officer')));

    expect(onAddChild).toHaveBeenCalledWith('chief-hr-officer-marie-vorsilkova');
  });
});
