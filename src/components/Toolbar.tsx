import { Download, Maximize2, RotateCcw, Search, Undo2, Upload, Workflow } from 'lucide-react';

import type { ChartLayoutMode, ChartOrientation } from '../domain/orgchart';
import { messages } from '../i18n/messages';

interface ToolbarProps {
  search: string;
  orientation: ChartOrientation;
  layoutMode: ChartLayoutMode;
  canUndo: boolean;
  onSearchChange: (value: string) => void;
  onOrientationChange: (orientation: ChartOrientation) => void;
  onLayoutModeChange: (layoutMode: ChartLayoutMode) => void;
  onUndo: () => void;
  onReset: () => void;
  onExport: () => void;
  onImport: () => void;
  onFitView: () => void;
}

export function Toolbar({
  search,
  orientation,
  layoutMode,
  canUndo,
  onSearchChange,
  onOrientationChange,
  onLayoutModeChange,
  onUndo,
  onReset,
  onExport,
  onImport,
  onFitView,
}: ToolbarProps) {
  return (
    <header className="toolbar">
      <div className="toolbar-brand">
        <span className="toolbar-brand-mark" aria-hidden="true">
          <Workflow size={18} strokeWidth={2.2} />
        </span>
        <span className="toolbar-brand-text">{messages.app.brand}</span>
      </div>

      <label className="toolbar-search">
        <Search aria-hidden="true" size={16} />
        <input
          aria-label={messages.toolbar.searchLabel}
          placeholder={messages.toolbar.searchPlaceholder}
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.currentTarget.value)}
        />
      </label>

      <div className="segmented prominent" role="group" aria-label={messages.toolbar.layoutLabel}>
        <button
          className={layoutMode === 'source' ? 'active' : undefined}
          type="button"
          aria-pressed={layoutMode === 'source'}
          onClick={() => onLayoutModeChange('source')}
        >
          {messages.toolbar.layoutSource}
        </button>
        <button
          className={layoutMode === 'tree' ? 'active' : undefined}
          type="button"
          aria-pressed={layoutMode === 'tree'}
          onClick={() => onLayoutModeChange('tree')}
        >
          {messages.toolbar.layoutTree}
        </button>
      </div>

      <div className="segmented" role="group" aria-label={messages.toolbar.orientationLabel}>
        <button
          className={orientation === 'vertical' ? 'active' : undefined}
          type="button"
          aria-pressed={orientation === 'vertical'}
          onClick={() => onOrientationChange('vertical')}
        >
          {messages.toolbar.orientationVertical}
        </button>
        <button
          className={orientation === 'horizontal' ? 'active' : undefined}
          type="button"
          aria-pressed={orientation === 'horizontal'}
          onClick={() => onOrientationChange('horizontal')}
        >
          {messages.toolbar.orientationHorizontal}
        </button>
      </div>

      <div className="toolbar-actions">
        <button
          className="icon-button"
          type="button"
          aria-label={messages.toolbar.fitView}
          title={messages.toolbar.fitView}
          onClick={onFitView}
        >
          <Maximize2 aria-hidden="true" size={16} />
        </button>
        <button
          className="text-button"
          type="button"
          disabled={!canUndo}
          onClick={onUndo}
          title={messages.toolbar.undo}
        >
          <Undo2 aria-hidden="true" size={16} />
          {messages.toolbar.undo}
        </button>
        <button className="text-button" type="button" onClick={onImport} title={messages.toolbar.importJson}>
          <Upload aria-hidden="true" size={16} />
          {messages.toolbar.importJson}
        </button>
        <button className="text-button" type="button" onClick={onExport} title={messages.toolbar.exportJson}>
          <Download aria-hidden="true" size={16} />
          {messages.toolbar.exportJson}
        </button>
        <button className="text-button danger" type="button" onClick={onReset} title={messages.toolbar.reset}>
          <RotateCcw aria-hidden="true" size={16} />
          {messages.toolbar.reset}
        </button>
      </div>
    </header>
  );
}
