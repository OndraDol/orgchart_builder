import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SOURCE_ORGCHART } from '../data/sourceOrgchart';
import { messages } from '../i18n/messages';
import { getDropModeForCursor, mergeDraggedNodePosition, OrgChartCanvas, resolveDropIntent } from './OrgChartCanvas';

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

  it('resolves a final cursor below David Tatár as a child drop for Jakub Řehák', () => {
    const nodes = [
      {
        id: 'group-it-development-project-manager-jakub-rehak',
        position: { x: 900, y: 640 },
        width: 192,
        height: 96,
      },
      {
        id: 'head-of-analytics-david-tatar',
        position: { x: 1000, y: 600 },
        width: 192,
        height: 96,
      },
    ];

    expect(
      resolveDropIntent({
        chart: SOURCE_ORGCHART,
        orientation: 'vertical',
        sourceId: 'group-it-development-project-manager-jakub-rehak',
        cursor: { x: 1000, y: 638 },
        nodes,
        edges: [],
      }),
    ).toEqual({
      mode: 'child',
      targetId: 'head-of-analytics-david-tatar',
    });
  });

  it('uses the dragged card rectangle, not only the cursor, when resolving David Hlavnicka under Jan Sokola', () => {
    const nodes = [
      {
        id: 'country-fi-manager-cz-david-hlavnicka',
        position: { x: 1000, y: 1160 },
        width: 192,
        height: 96,
      },
      {
        id: 'country-ops-manager-jan-sokola',
        position: { x: 1000, y: 1000 },
        width: 192,
        height: 96,
      },
    ];

    expect(
      resolveDropIntent({
        chart: SOURCE_ORGCHART,
        orientation: 'vertical',
        sourceId: 'country-fi-manager-cz-david-hlavnicka',
        cursor: { x: 1000, y: 1160 },
        nodes,
        edges: [],
      }),
    ).toEqual({
      mode: 'child',
      targetId: 'country-ops-manager-jan-sokola',
    });
  });

  it('resolves dropping a node on an existing edge as an insert-between parent drop', () => {
    const nodes = [
      { id: 'chief-executive-officer-zdenek-demeter', position: { x: 0, y: 0 }, width: 192, height: 96 },
      { id: 'head-of-analytics-david-tatar', position: { x: 0, y: 240 }, width: 192, height: 96 },
      { id: 'group-it-development-project-manager-jakub-rehak', position: { x: 160, y: 120 }, width: 192, height: 96 },
    ];

    expect(
      resolveDropIntent({
        chart: SOURCE_ORGCHART,
        orientation: 'vertical',
        sourceId: 'group-it-development-project-manager-jakub-rehak',
        cursor: { x: 0, y: 120 },
        nodes,
        edges: [
          {
            id: 'chief-executive-officer-zdenek-demeter-head-of-analytics-david-tatar',
            source: 'chief-executive-officer-zdenek-demeter',
            target: 'head-of-analytics-david-tatar',
          },
        ],
      }),
    ).toEqual({
      mode: 'parent',
      targetId: 'head-of-analytics-david-tatar',
      edgeSourceId: 'chief-executive-officer-zdenek-demeter',
    });
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
