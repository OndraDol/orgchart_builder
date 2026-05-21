import { AlertTriangle, CheckCircle2 } from 'lucide-react';

import { messages, pluralizeCards, translateWarning } from '../i18n/messages';
import type { SaveState } from '../state/chartReducer';

interface StatusBarProps {
  nodeCount: number;
  warning: string;
  saveState: SaveState;
}

export function StatusBar({ nodeCount, warning, saveState }: StatusBarProps) {
  const translatedWarning = translateWarning(warning);
  const isFailed = saveState === 'failed';

  return (
    <footer className="status-bar" role="status" aria-label={messages.status.bar}>
      <span className="status-bar-count">{pluralizeCards(nodeCount)}</span>
      {isFailed ? (
        <span className="status-bar-state failed">
          <AlertTriangle aria-hidden="true" size={14} />
          {messages.status.failed}
        </span>
      ) : (
        <span className="status-bar-state saved">
          <CheckCircle2 aria-hidden="true" size={14} />
          {messages.status.saved}
        </span>
      )}
      {translatedWarning ? (
        <strong className="status-bar-warning" role="alert">
          {translatedWarning}
        </strong>
      ) : null}
    </footer>
  );
}
