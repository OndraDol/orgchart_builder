import type { ChangeEvent } from 'react';
import { X } from 'lucide-react';

import {
  CARD_COLOR_TOKENS,
  LEVEL_TYPES,
  STATUS_TYPES,
  type CardColorTokenId,
  type OrgNode,
  type OrgNodeLevelType,
  type OrgNodeStatus,
  type SelectedNodePatch,
} from '../domain/orgchart';
import { colorLabel, levelLabel, messages, statusLabel } from '../i18n/messages';

interface EditorPanelProps {
  node: OrgNode | null;
  movingNodeId: string | null;
  onChange: (patch: SelectedNodePatch) => void;
  onDelete: (nodeId: string) => void;
  onStartMove: (nodeId: string) => void;
  onCancelMove: () => void;
  onClose: () => void;
}

export function EditorPanel({
  node,
  movingNodeId,
  onChange,
  onDelete,
  onStartMove,
  onCancelMove,
  onClose,
}: EditorPanelProps) {
  if (!node) {
    return (
      <aside className="editor-panel editor-panel-empty" aria-label={messages.editor.panelLabel}>
        <p className="panel-empty">{messages.editor.empty}</p>
      </aside>
    );
  }

  const updateTextField =
    (field: 'title' | 'person' | 'country' | 'regio') =>
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange({ [field]: event.currentTarget.value });
    };

  return (
    <aside className="editor-panel" aria-label={messages.editor.panelLabel}>
      <div className="panel-heading">
        <div className="panel-heading-text">
          <p className="eyebrow">{messages.editor.eyebrow}</p>
          <h2>{node.title || messages.editor.untitled}</h2>
        </div>
        <button
          className="icon-button"
          type="button"
          aria-label={messages.editor.close}
          title={messages.editor.close}
          onClick={onClose}
        >
          <X aria-hidden="true" size={16} />
        </button>
      </div>

      <div className="panel-fields">
        <label>
          <span>{messages.editor.title}</span>
          <input value={node.title} onChange={updateTextField('title')} />
        </label>
        <label>
          <span>{messages.editor.person}</span>
          <input value={node.person} onChange={updateTextField('person')} />
        </label>
        <label>
          <span>{messages.editor.level}</span>
          <select
            value={node.levelType}
            onChange={(event) => onChange({ levelType: event.currentTarget.value as OrgNodeLevelType })}
          >
            {LEVEL_TYPES.map((type) => (
              <option key={type} value={type}>
                {levelLabel(type)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{messages.editor.country}</span>
          <input value={node.country} onChange={updateTextField('country')} />
        </label>
        <label>
          <span>{messages.editor.regio}</span>
          <input value={node.regio} onChange={updateTextField('regio')} />
        </label>
        <label>
          <span>{messages.editor.status}</span>
          <select
            value={node.status}
            onChange={(event) => onChange({ status: event.currentTarget.value as OrgNodeStatus })}
          >
            {STATUS_TYPES.map((type) => (
              <option key={type} value={type}>
                {statusLabel(type)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="swatches">
        <legend>{messages.editor.color}</legend>
        <div>
          {CARD_COLOR_TOKENS.map((token) => {
            const label = colorLabel(token.id);
            return (
              <button
                key={token.id}
                className={`swatch ${node.color === token.id ? 'active' : ''}`}
                type="button"
                aria-label={messages.editor.colorAria(label)}
                aria-pressed={node.color === token.id}
                title={label}
                style={{
                  background: token.background,
                  borderColor: token.border,
                  color: token.text,
                }}
                onClick={() => onChange({ color: token.id as CardColorTokenId })}
              >
                {label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="panel-actions">
        {movingNodeId === node.id ? (
          <button className="text-button" type="button" onClick={onCancelMove}>
            {messages.editor.cancelMove}
          </button>
        ) : (
          <button className="text-button" type="button" onClick={() => onStartMove(node.id)}>
            {messages.editor.move}
          </button>
        )}
        <button className="text-button danger" type="button" onClick={() => onDelete(node.id)}>
          {messages.editor.delete}
        </button>
      </div>
    </aside>
  );
}
