import type { CardColorTokenId, ChartLayoutMode, OrgNodeLevelType, OrgNodeStatus } from '../domain/orgchart';

export const messages = {
  app: {
    title: 'Editor organizační struktury',
    brand: 'Organizační struktura',
  },
  auth: {
    passwordLabel: 'Heslo:',
    submit: 'Odemknout',
    submitting: 'Ověřuji…',
    errors: {
      notConfigured: 'Hash hesla není v tomto buildu nakonfigurován.',
      unsupported: 'Hashování hesla není v tomto prohlížeči k dispozici.',
      failed: 'Hashování hesla v tomto prohlížeči selhalo.',
      mismatch: 'Heslo nesouhlasí.',
    },
  },
  toolbar: {
    searchLabel: 'Hledat role a lidi',
    searchPlaceholder: 'Hledat role a lidi…',
    orientationLabel: 'Orientace diagramu',
    orientationVertical: 'Svisle',
    orientationHorizontal: 'Vodorovně',
    layoutLabel: 'Zobrazení diagramu',
    layoutSource: 'PDF zdroj',
    layoutTree: 'Auto strom',
    countryFilterLabel: 'Země orgchartu',
    countryAll: 'All',
    fitView: 'Přizpůsobit pohled',
    undo: 'Zpět',
    importJson: 'Importovat JSON',
    exportJson: 'Exportovat JSON',
    reset: 'Obnovit',
  },
  editor: {
    panelLabel: 'Editor karty',
    empty: 'Vyberte kartu pro úpravu detailů.',
    eyebrow: 'Vybraná karta',
    untitled: 'Nepojmenovaná role',
    close: 'Zavřít editor',
    title: 'Název',
    person: 'Osoba',
    level: 'Úroveň',
    country: 'Země',
    regio: 'Region',
    status: 'Stav',
    color: 'Barva',
    move: 'Přesunout',
    cancelMove: 'Zrušit přesun',
    delete: 'Smazat',
    confirmDelete: 'Opravdu smazat tuto kartu a všechny její podřízené?',
    save: 'Uložit',
    draftBanner: 'Vyplňte detaily nové karty a uložte změny.',
    draftBadge: 'NOVÁ',
    addChildAria: (title: string) => `Přidat podřízenou kartu pod „${title}"`,
    colorAria: (label: string) => `Barva ${label}`,
    countryAria: (country: string) => `Země ${country}`,
    cardMetadataAria: 'Metadata karty',
  },
  status: {
    bar: 'Stavový řádek',
    saved: 'Změny uloženy v tomto prohlížeči.',
    failed: 'Změny se v tomto prohlížeči nepodařilo uložit.',
    saving: 'Ukládám změny…',
    idle: 'Editor připraven.',
  },
  confirm: {
    reset: 'Obnovit diagram na výchozí organizační strukturu? Tato akce přepíše současný stav.',
    importOverwrite: 'Importem se přepíše současný diagram. Pokračovat?',
  },
  errors: {
    importInvalidJson: 'Importovaný soubor není platný JSON.',
    importInvalidDocument: 'Importovaný soubor není platný dokument organizační struktury.',
    importFailed: (detail: string) => `Import selhal: ${detail}`,
    saveFailed: 'Změny se v tomto prohlížeči nepodařilo uložit.',
  },
  canvas: {
    label: 'Plátno organizační struktury',
  },
  levels: {
    'B-0': 'B-0',
    'B-1': 'B-1',
    'B-2': 'B-2',
    'B-3': 'B-3',
    'B-4': 'B-4',
    BXX: 'BXX',
  } satisfies Record<OrgNodeLevelType, string>,
  statuses: {
    active: 'Aktivní',
    planned: 'Plánovaný',
    vacant: 'Neobsazený',
  } satisfies Record<OrgNodeStatus, string>,
  colors: {
    executive: 'Vedení',
    manager: 'Manažer',
    standard: 'Standard',
    planned: 'Plánovaný',
    country: 'Země',
    regio: 'Region',
    neutral: 'Neutrální',
  } satisfies Record<CardColorTokenId, string>,
  layouts: {
    source: 'PDF zdroj',
    tree: 'Auto strom',
  } satisfies Record<ChartLayoutMode, string>,
} as const;

export const levelLabel = (level: OrgNodeLevelType): string => messages.levels[level];

export const statusLabel = (status: OrgNodeStatus): string => messages.statuses[status];

export const colorLabel = (color: CardColorTokenId): string => messages.colors[color];

export function pluralizeCards(count: number): string {
  const abs = Math.abs(count);
  if (abs === 1) {
    return `${count} karta`;
  }
  if (abs >= 2 && abs <= 4) {
    return `${count} karty`;
  }
  return `${count} karet`;
}

const WARNING_TRANSLATIONS: Record<string, string> = {
  'Chart must contain exactly one root node.': 'Diagram musí obsahovat právě jeden kořenový uzel.',
  'Cycle detected while traversing descendants.': 'Při procházení potomků byl detekován cyklus.',
  'Cannot delete the root node.': 'Kořenový uzel nelze smazat.',
  'Cannot move a node into itself.': 'Uzel nelze přesunout do sebe sama.',
  'Cannot move a node into its own descendant.': 'Uzel nelze přesunout do svého potomka.',
  'Cannot move a node beside itself.': 'Uzel nelze přesunout vedle sebe sama.',
  'Cannot move a node beside the root.': 'Uzel nelze přesunout vedle kořenového uzlu.',
  'Cannot move a node beside its own descendant.': 'Uzel nelze přesunout vedle svého potomka.',
  'Imported file is not valid JSON.': 'Importovaný soubor není platný JSON.',
  'Imported file is not an orgchart document.': 'Importovaný soubor není platný dokument organizační struktury.',
};

export function translateWarning(warning: string): string {
  if (!warning) {
    return '';
  }
  if (WARNING_TRANSLATIONS[warning]) {
    return WARNING_TRANSLATIONS[warning];
  }
  const nodeNotFound = /^Node not found: (.+)$/.exec(warning);
  if (nodeNotFound) {
    return `Uzel nenalezen: ${nodeNotFound[1]}`;
  }
  return warning;
}
