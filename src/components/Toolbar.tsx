import { Download, RotateCcw, Search, Undo2, Upload, View, Workflow } from 'lucide-react';

import type { ChartOrientation } from '../domain/orgchart';

interface ToolbarProps {
  search: string;
  orientation: ChartOrientation;
  canUndo: boolean;
  onSearchChange: (value: string) => void;
  onOrientationChange: (orientation: ChartOrientation) => void;
  onUndo: () => void;
  onReset: () => void;
  onExport: () => void;
  onImport: () => void;
  onFitView: () => void;
}

export function Toolbar({
  search,
  orientation,
  canUndo,
  onSearchChange,
  onOrientationChange,
  onUndo,
  onReset,
  onExport,
  onImport,
  onFitView,
}: ToolbarProps) {
  return (
    <header className="toolbar">
      <div className="toolbar-brand">
        <Workflow aria-hidden="true" size={20} />
        <span>Orgchart Builder</span>
      </div>

      <label className="toolbar-search">
        <Search aria-hidden="true" size={16} />
        <input
          aria-label="Search roles and people"
          placeholder="Search roles and people"
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.currentTarget.value)}
        />
      </label>

      <div className="segmented" aria-label="Chart orientation">
        <button
          className={orientation === 'vertical' ? 'active' : undefined}
          type="button"
          aria-pressed={orientation === 'vertical'}
          onClick={() => onOrientationChange('vertical')}
        >
          Vertical
        </button>
        <button
          className={orientation === 'horizontal' ? 'active' : undefined}
          type="button"
          aria-pressed={orientation === 'horizontal'}
          onClick={() => onOrientationChange('horizontal')}
        >
          Horizontal
        </button>
      </div>

      <div className="toolbar-actions">
        <button className="icon-button" type="button" aria-label="Fit view" title="Fit view" onClick={onFitView}>
          <View aria-hidden="true" size={17} />
        </button>
        <button className="text-button" type="button" disabled={!canUndo} onClick={onUndo}>
          <Undo2 aria-hidden="true" size={16} />
          Undo
        </button>
        <button className="text-button" type="button" onClick={onImport}>
          <Upload aria-hidden="true" size={16} />
          Import JSON
        </button>
        <button className="text-button" type="button" onClick={onExport}>
          <Download aria-hidden="true" size={16} />
          Export JSON
        </button>
        <button className="text-button danger" type="button" onClick={onReset}>
          <RotateCcw aria-hidden="true" size={16} />
          Reset
        </button>
      </div>
    </header>
  );
}
