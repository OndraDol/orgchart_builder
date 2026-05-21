export const LEVEL_TYPES = ['holding', 'group', 'country', 'regio', 'team', 'role', 'placeholder'] as const;

export type OrgNodeLevelType = (typeof LEVEL_TYPES)[number];

export const STATUS_TYPES = ['active', 'planned', 'vacant'] as const;

export type OrgNodeStatus = (typeof STATUS_TYPES)[number];

export type ChartOrientation = 'vertical' | 'horizontal';

export interface CardColorToken {
  id: string;
  label: string;
  background: string;
  border: string;
  text: string;
}

export const CARD_COLOR_TOKENS: CardColorToken[] = [
  {
    id: 'executive',
    label: 'Executive',
    background: '#EAF1FF',
    border: '#2F5DA8',
    text: '#17325C',
  },
  {
    id: 'manager',
    label: 'Manager',
    background: '#E8F6EF',
    border: '#2F7D55',
    text: '#16442D',
  },
  {
    id: 'standard',
    label: 'Standard',
    background: '#FFFFFF',
    border: '#CBD5E1',
    text: '#1F2937',
  },
  {
    id: 'planned',
    label: 'Planned',
    background: '#FFF7E6',
    border: '#D97706',
    text: '#7C3F00',
  },
  {
    id: 'country',
    label: 'Country',
    background: '#EEF2FF',
    border: '#4F46E5',
    text: '#312E81',
  },
  {
    id: 'regio',
    label: 'Regio',
    background: '#ECFEFF',
    border: '#0891B2',
    text: '#155E75',
  },
  {
    id: 'neutral',
    label: 'Neutral',
    background: '#F8FAFC',
    border: '#94A3B8',
    text: '#334155',
  },
];

export interface OrgNode {
  id: string;
  parentId: string | null;
  title: string;
  person: string;
  levelType: OrgNodeLevelType;
  country: string;
  regio: string;
  color: string;
  status: OrgNodeStatus;
  order: number;
}

export interface OrgChartDocument {
  schemaVersion: 1;
  name: string;
  updatedAt: string;
  nodes: OrgNode[];
}

export type SelectedNodePatch = Partial<Pick<OrgNode, 'title' | 'person' | 'levelType' | 'country' | 'regio' | 'color' | 'status'>>;

export const EMPTY_NODE_PATCH: Required<SelectedNodePatch> = {
  title: '',
  person: '',
  levelType: 'role',
  country: '',
  regio: '',
  color: 'standard',
  status: 'active',
};
