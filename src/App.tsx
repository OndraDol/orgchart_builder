import { useEffect, useReducer, useRef, useState, type ChangeEvent } from 'react';

import { AuthGate } from './components/AuthGate';
import { EditorPanel } from './components/EditorPanel';
import { OrgChartCanvas } from './components/OrgChartCanvas';
import { StatusBar } from './components/StatusBar';
import { Toolbar } from './components/Toolbar';
import { SOURCE_ORGCHART } from './data/sourceOrgchart';
import { parseChartDocument } from './domain/chartValidation';
import { messages } from './i18n/messages';
import { chartReducer, createInitialChartState } from './state/chartReducer';
import { loadLocalChart, saveLocalChart } from './state/storage';
import { downloadJson, formatExportFilename } from './utils/download';

type ViteImportMeta = ImportMeta & {
  env?: {
    VITE_APP_PASSWORD_HASH?: string;
  };
};

function readStoredUnlockState(): boolean {
  try {
    return sessionStorage.getItem('orgchart-builder.unlocked') === 'true';
  } catch {
    return false;
  }
}

function readInitialChart() {
  return loadLocalChart() ?? SOURCE_ORGCHART;
}

export function App() {
  const [isUnlocked, setIsUnlocked] = useState(readStoredUnlockState);
  const [initialChart] = useState(readInitialChart);
  const [state, dispatch] = useReducer(
    chartReducer,
    initialChart,
    createInitialChartState,
  );
  const [fitViewToken, setFitViewToken] = useState(0);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const passwordHash =
    (import.meta as ViteImportMeta).env?.VITE_APP_PASSWORD_HASH ?? '';
  const currentChart = state.history.current;
  const selectedNode =
    currentChart.nodes.find((node) => node.id === state.selectedNodeId) ?? null;

  useEffect(() => {
    if (!isUnlocked) {
      return;
    }

    try {
      saveLocalChart(currentChart);
      dispatch({ type: 'set-save-state', saveState: 'saved' });
    } catch {
      dispatch({ type: 'set-save-state', saveState: 'failed' });
    }
  }, [currentChart, isUnlocked]);

  function handleExport() {
    try {
      downloadJson(formatExportFilename(currentChart.name || 'orgchart'), currentChart);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      dispatch({ type: 'set-warning', warning: messages.errors.importFailed(detail) });
    }
  }

  function handleImportClick() {
    importInputRef.current?.click();
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) {
      return;
    }

    if (!window.confirm(messages.confirm.importOverwrite)) {
      return;
    }

    try {
      const text = await file.text();
      const chart = parseChartDocument(text);
      dispatch({ type: 'replace-chart', chart });
      setFitViewToken((token) => token + 1);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      dispatch({ type: 'set-warning', warning: detail });
    }
  }

  function handleReset() {
    if (window.confirm(messages.confirm.reset)) {
      dispatch({ type: 'replace-chart', chart: SOURCE_ORGCHART });
      setFitViewToken((token) => token + 1);
    }
  }

  function handleDelete(nodeId: string) {
    if (window.confirm(messages.editor.confirmDelete)) {
      dispatch({ type: 'delete', nodeId });
    }
  }

  if (!isUnlocked) {
    return (
      <AuthGate
        passwordHash={passwordHash}
        onUnlock={() => setIsUnlocked(true)}
      />
    );
  }

  return (
    <main className="workspace">
      <div className="app-grid">
        <Toolbar
          search={state.search}
          orientation={state.orientation}
          canUndo={state.history.past.length > 0}
          onSearchChange={(search) => dispatch({ type: 'set-search', search })}
          onOrientationChange={(orientation) =>
            dispatch({ type: 'set-orientation', orientation })
          }
          onUndo={() => dispatch({ type: 'undo' })}
          onReset={handleReset}
          onExport={handleExport}
          onImport={handleImportClick}
          onFitView={() => setFitViewToken((token) => token + 1)}
        />

        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={handleImportFile}
          aria-hidden="true"
          tabIndex={-1}
        />

        <OrgChartCanvas
          chart={currentChart}
          orientation={state.orientation}
          selectedNodeId={state.selectedNodeId}
          movingNodeId={state.movingNodeId}
          draftNodeId={state.draftNodeId}
          search={state.search}
          fitViewToken={fitViewToken}
          onSelect={(nodeId) => dispatch({ type: 'select', nodeId })}
          onAddChild={(parentId) => dispatch({ type: 'add-child', parentId })}
          onMoveAsChild={(targetParentId) => dispatch({ type: 'move-as-child', targetParentId })}
          onMoveAsSibling={(targetId, side) => dispatch({ type: 'move-as-sibling', targetId, side })}
          onDropAsChild={(sourceId, targetParentId) =>
            dispatch({ type: 'drop-as-child', sourceId, targetParentId })
          }
          onDropAsSibling={(sourceId, targetId, side) =>
            dispatch({ type: 'drop-as-sibling', sourceId, targetId, side })
          }
        />

        <EditorPanel
          node={selectedNode}
          movingNodeId={state.movingNodeId}
          isDraft={selectedNode !== null && state.draftNodeId === selectedNode.id}
          onChange={(patch) => dispatch({ type: 'update-selected', patch })}
          onDelete={handleDelete}
          onStartMove={(nodeId) => dispatch({ type: 'start-move', nodeId })}
          onCancelMove={() => dispatch({ type: 'cancel-move' })}
          onClose={() => dispatch({ type: 'select', nodeId: null })}
          onSaveDraft={() => dispatch({ type: 'save-draft' })}
        />

        <StatusBar
          nodeCount={currentChart.nodes.length}
          warning={state.warning}
          saveState={state.saveState}
        />
      </div>
    </main>
  );
}
