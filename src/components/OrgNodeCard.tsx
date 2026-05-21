import { Plus } from 'lucide-react';
import clsx from 'clsx';

import { CARD_COLOR_TOKENS, type OrgNode } from '../domain/orgchart';
import { messages, statusLabel } from '../i18n/messages';

type DropMode = 'child' | 'sibling-left' | 'sibling-right';

interface OrgNodeCardProps {
  node: OrgNode;
  selected: boolean;
  searchMatch: boolean;
  moving: boolean;
  draft: boolean;
  dropTarget: boolean;
  dropMode: DropMode | null;
  onSelect: (nodeId: string) => void;
  onAddChild: (nodeId: string) => void;
}

export function OrgNodeCard({
  node,
  selected,
  searchMatch,
  moving,
  draft,
  dropTarget,
  dropMode,
  onSelect,
  onAddChild,
}: OrgNodeCardProps) {
  const colorToken = CARD_COLOR_TOKENS.find((token) => token.id === node.color) ?? CARD_COLOR_TOKENS[2];
  const metadata = [node.country, node.regio].filter(Boolean);
  const levelClass = `level-${node.levelType.toLowerCase().replace('-', '')}`;
  const personDisplay = node.person || (draft ? '—' : statusLabel(node.status));

  return (
    <article
      className={clsx('org-card', levelClass, {
        selected,
        'search-match': searchMatch,
        moving,
        draft,
        'drop-target': dropTarget && dropMode === 'child',
        'drop-sibling-left': dropTarget && dropMode === 'sibling-left',
        'drop-sibling-right': dropTarget && dropMode === 'sibling-right',
        planned: node.status === 'planned',
        vacant: node.status === 'vacant',
      })}
      style={{
        background: colorToken.background,
        borderColor: colorToken.border,
        color: colorToken.text,
      }}
      onClick={() => onSelect(node.id)}
    >
      <div className="org-card-content">
        <h3 className="org-card-title">{node.title}</h3>
        <p className="org-card-person">{personDisplay}</p>
        <div className="org-card-meta" aria-label={messages.editor.cardMetadataAria}>
          {draft ? (
            <span className="org-card-level-badge org-card-draft-badge" aria-label={messages.editor.draftBadge}>
              {messages.editor.draftBadge}
            </span>
          ) : (
            <span className={clsx('org-card-level-badge', levelClass)} aria-label={`Úroveň ${node.levelType}`}>
              {node.levelType}
            </span>
          )}
          {metadata.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
      <button
        className="add-child-button nodrag nopan"
        type="button"
        aria-label={messages.editor.addChildAria(node.title)}
        title={messages.editor.addChildAria(node.title)}
        onClick={(event) => {
          event.stopPropagation();
          onAddChild(node.id);
        }}
      >
        <Plus size={14} strokeWidth={2.4} aria-hidden="true" />
      </button>
    </article>
  );
}
