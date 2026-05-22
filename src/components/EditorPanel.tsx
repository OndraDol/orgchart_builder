import { useEffect, useRef, type ChangeEvent } from 'react';
import { CheckCircle2, X } from 'lucide-react';

import {
  CARD_COLOR_TOKENS,
  COUNTRY_CODES,
  LEVEL_TYPES,
  STATUS_TYPES,
  type CardColorTokenId,
  type CountryCode,
  type OrgNode,
  type OrgNodeLevelType,
  type OrgNodeStatus,
  type SelectedNodePatch,
} from '../domain/orgchart';
import { countryStringFromCodes, getNodeCountries, normalizeCountryCodes } from '../domain/countryFilter';
import { colorLabel, levelLabel, messages, statusLabel } from '../i18n/messages';

interface EditorPanelProps {
  node: OrgNode | null;
  movingNodeId: string | null;
  isDraft: boolean;
  onChange: (patch: SelectedNodePatch) => void;
  onDelete: (nodeId: string) => void;
  onStartMove: (nodeId: string) => void;
  onCancelMove: () => void;
  onClose: () => void;
  onSaveDraft: () => void;
}

export function EditorPanel({
  node,
  movingNodeId,
  isDraft,
  onChange,
  onDelete,
  onStartMove,
  onCancelMove,
  onClose,
  onSaveDraft,
}: EditorPanelProps) {
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const roleScopeLabel = 'Role scope';

  useEffect(() => {
    if (isDraft && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isDraft, node?.id]);

  if (!node) {
    return (
      <aside className="editor-panel editor-panel-empty" aria-label={messages.editor.panelLabel}>
        <p className="panel-empty">{messages.editor.empty}</p>
      </aside>
    );
  }

  const selectedCountries = getNodeCountries(node);

  const updateTextField =
    (field: 'title' | 'person' | 'regio') =>
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange({ [field]: event.currentTarget.value });
    };

  const updateCountry =
    (country: CountryCode) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const selected = new Set(selectedCountries);

      if (event.currentTarget.checked) {
        selected.add(country);
      } else {
        selected.delete(country);
      }

      const countries = normalizeCountryCodes(Array.from(selected));
      onChange({
        country: countryStringFromCodes(countries),
        countries,
      });
    };

  return (
    <aside className="editor-panel" aria-label={messages.editor.panelLabel}>
      <div className="panel-heading">
        <div className="panel-heading-text">
          <p className="eyebrow">{isDraft ? messages.editor.draftBadge : messages.editor.eyebrow}</p>
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

      {isDraft ? (
        <div className="panel-draft-banner" role="note">
          <p>{messages.editor.draftBanner}</p>
          <button className="text-button primary" type="button" onClick={onSaveDraft}>
            <CheckCircle2 aria-hidden="true" size={16} />
            {messages.editor.save}
          </button>
        </div>
      ) : null}

      <div className="panel-fields">
        <label>
          <span>{messages.editor.title}</span>
          <input ref={titleInputRef} value={node.title} onChange={updateTextField('title')} />
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
        <fieldset className="country-checks">
          <legend>{roleScopeLabel}</legend>
          <div>
            {COUNTRY_CODES.map((country) => (
              <label key={country}>
                <input
                  type="checkbox"
                  checked={selectedCountries.includes(country)}
                  aria-label={`${roleScopeLabel} ${country}`}
                  onChange={updateCountry(country)}
                />
                <span>{country}</span>
              </label>
            ))}
          </div>
        </fieldset>
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
