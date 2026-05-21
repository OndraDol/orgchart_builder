import { useEffect, useReducer, useState } from 'react';

import { AuthGate } from './components/AuthGate';
import { EditorPanel } from './components/EditorPanel';
import { StatusBar } from './components/StatusBar';
import { Toolbar } from './components/Toolbar';
import { SOURCE_ORGCHART } from './data/sourceOrgchart';
import { chartReducer, createInitialChartState } from './state/chartReducer';
import { loadLocalChart, saveLocalChart } from './state/storage';

const SAVE_FAILURE_WARNING = 'Changes could not be saved in this browser.';

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
    } catch {
      dispatch({
        type: 'set-warning',
        warning: SAVE_FAILURE_WARNING,
      });
    }
  }, [currentChart, isUnlocked]);

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
          onReset={() => {
            if (window.confirm('Reset the chart to the source orgchart?')) {
              dispatch({ type: 'replace-chart', chart: SOURCE_ORGCHART });
            }
          }}
          onExport={() =>
            dispatch({
              type: 'set-warning',
              warning: 'JSON import/export will be available in the import/export task.',
            })
          }
          onImport={() =>
            dispatch({
              type: 'set-warning',
              warning: 'JSON import/export will be available in the import/export task.',
            })
          }
          onFitView={() =>
            dispatch({
              type: 'set-warning',
              warning: 'Fit view will be available after canvas integration.',
            })
          }
        />

        <section className="chart-placeholder">
          Chart canvas loads in Task 9.
        </section>

        <EditorPanel
          node={selectedNode}
          movingNodeId={state.movingNodeId}
          onChange={(patch) => dispatch({ type: 'update-selected', patch })}
          onDelete={(nodeId) => {
            if (window.confirm('Delete this card and all child cards?')) {
              dispatch({ type: 'delete', nodeId });
            }
          }}
          onStartMove={(nodeId) => dispatch({ type: 'start-move', nodeId })}
          onCancelMove={() => dispatch({ type: 'cancel-move' })}
          onClose={() => dispatch({ type: 'select', nodeId: null })}
        />

        <StatusBar
          nodeCount={currentChart.nodes.length}
          warning={state.warning}
          saveState={state.warning === SAVE_FAILURE_WARNING ? 'failed' : 'saved'}
        />
      </div>
    </main>
  );
}
