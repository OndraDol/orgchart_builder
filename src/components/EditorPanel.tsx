import type { ChangeEvent } from 'react';

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
      <aside className="editor-panel" aria-label="Card editor">
        <p className="panel-empty">Select a card to edit details.</p>
      </aside>
    );
  }

  const updateTextField =
    (field: 'title' | 'person' | 'country' | 'regio') =>
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange({ [field]: event.currentTarget.value });
    };

  return (
    <aside className="editor-panel" aria-label="Card editor">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Selected card</p>
          <h2>{node.title || 'Untitled role'}</h2>
        </div>
        <button className="icon-button" type="button" aria-label="Close editor" onClick={onClose}>
          x
        </button>
      </div>

      <div className="panel-fields">
        <label>
          Title
          <input value={node.title} onChange={updateTextField('title')} />
        </label>
        <label>
          Person
          <input value={node.person} onChange={updateTextField('person')} />
        </label>
        <label>
          Level
          <select
            value={node.levelType}
            onChange={(event) => onChange({ levelType: event.currentTarget.value as OrgNodeLevelType })}
          >
            {LEVEL_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label>
          Country
          <input value={node.country} onChange={updateTextField('country')} />
        </label>
        <label>
          Regio
          <input value={node.regio} onChange={updateTextField('regio')} />
        </label>
        <label>
          Status
          <select
            value={node.status}
            onChange={(event) => onChange({ status: event.currentTarget.value as OrgNodeStatus })}
          >
            {STATUS_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="swatches">
        <legend>Color</legend>
        <div>
          {CARD_COLOR_TOKENS.map((token) => (
            <button
              key={token.id}
              className={`swatch ${node.color === token.id ? 'active' : ''}`}
              type="button"
              aria-label={`Color ${token.label}`}
              aria-pressed={node.color === token.id}
              title={token.label}
              style={{
                background: token.background,
                borderColor: token.border,
                color: token.text,
              }}
              onClick={() => onChange({ color: token.id as CardColorTokenId })}
            >
              {token.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="panel-actions">
        {movingNodeId === node.id ? (
          <button className="text-button" type="button" onClick={onCancelMove}>
            Cancel move
          </button>
        ) : (
          <button className="text-button" type="button" onClick={() => onStartMove(node.id)}>
            Move
          </button>
        )}
        <button className="text-button danger" type="button" onClick={() => onDelete(node.id)}>
          Delete
        </button>
      </div>
    </aside>
  );
}
