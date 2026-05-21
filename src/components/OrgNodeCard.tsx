import { Plus } from 'lucide-react';
import clsx from 'clsx';

import { CARD_COLOR_TOKENS, type OrgNode } from '../domain/orgchart';

interface OrgNodeCardProps {
  node: OrgNode;
  selected: boolean;
  searchMatch: boolean;
  moving: boolean;
  onSelect: (nodeId: string) => void;
  onAddChild: (nodeId: string) => void;
}

export function OrgNodeCard({
  node,
  selected,
  searchMatch,
  moving,
  onSelect,
  onAddChild,
}: OrgNodeCardProps) {
  const colorToken = CARD_COLOR_TOKENS.find((token) => token.id === node.color) ?? CARD_COLOR_TOKENS[2];
  const metadata = [node.levelType, node.country, node.regio].filter(Boolean);

  return (
    <article
      className={clsx('org-card', {
        selected,
        'search-match': searchMatch,
        moving,
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
        <p className="org-card-person">{node.person || node.status}</p>
        <div className="org-card-meta" aria-label="Card metadata">
          {metadata.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
      <button
        className="add-child-button nodrag nopan"
        type="button"
        aria-label={`Add child under ${node.title}`}
        onClick={(event) => {
          event.stopPropagation();
          onAddChild(node.id);
        }}
      >
        <Plus size={15} strokeWidth={2.4} aria-hidden="true" />
      </button>
    </article>
  );
}
