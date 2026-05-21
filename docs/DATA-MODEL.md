# Data Model

Doménový model org. struktury — schema, typy, konvence ID, validační pravidla.

## OrgChartDocument

Top-level objekt celého org. stromu. Definice v `src/domain/orgchart.ts`.

```typescript
interface OrgChartDocument {
  schemaVersion: 4;        // bumpne se pri breaking zmene schematu
  name: string;            // human-readable název dokumentu
  updatedAt: string;       // ISO 8601 timestamp
  nodes: OrgNode[];        // všechny karty (flat list, hierarchie via parentId)
}
```

**Schema version history:**
- v1 → v2: `LEVEL_TYPES` přepsán z `['holding', 'group', 'country', 'regio', 'team', 'role', 'placeholder']` na `['B-0', 'B-1', 'B-2', 'B-3', 'B-4']`
- v2 → v3: refresh content (nové parent-child, B-úrovně, doplnění karet)
- v3 -> v4: PDF source positions, manual node positions, and source-hidden synthetic root

Při změně schemaVersion se localStorage automaticky invaliduje (`isChartDocument` v `chartValidation.ts` kontroluje pevnou hodnotu).

## OrgNode

Jedna karta v org. struktuře.

```typescript
interface OrgNode {
  id: string;                              // unique ID (kebab-case slug, viz konvence níže)
  parentId: string | null;                 // ID rodiče, null = root
  title: string;                           // pracovní titul (např. "Group Car Sales Director")
  person: string;                          // jméno osoby ("Daniel Luňáček"), prázdné = vacant
  levelType: 'B-0' | 'B-1' | 'B-2' | 'B-3' | 'B-4';  // org úroveň
  country: string;                         // 'CZ', 'SK', 'PL', 'DE', 'HU', 'CZ/SK', 'CZ/SK/PL', 'CZ/SK/PL/HU', nebo ''
  regio: string;                           // region v rámci země (např. 'Praha', 'Ostrava'), volitelné
  color: CardColorTokenId;                 // 'executive' | 'manager' | 'standard' | 'planned' | 'country' | 'regio' | 'neutral'
  status: 'active' | 'planned' | 'vacant'; // stav obsazení
  order: number;                           // pořadí mezi sourozenci (10, 20, 30, ...)
  sourcePosition?: { x: number; y: number; width: number; height: number }; // PDF source card center + size
  position?: { x: number; y: number };     // manual canvas position after drag
  sourceHidden?: boolean;                  // hidden in PDF source layout, used by synthetic root
}
```

## LEVEL_TYPES (B-úrovně)

```typescript
const LEVEL_TYPES = ['B-0', 'B-1', 'B-2', 'B-3', 'B-4'] as const;
```

Sémantika (per AAAUTO interní codebook):
- **B-0** — Top management (CO-CEOs, COO, CFO, Aures Holdings root)
- **B-1** — Chief Officers, Managing Directors, Group Directors
- **B-2** — Group Managers, Country-level senior pozice (Managing Director country level)
- **B-3** — SK country management (Country X Manager SK)
- **B-4** — PL country management + DE/HU manageři (Specialist level)

**Vizuálně:** každá karta má levý pásek v barvě své úrovně (B-0 indigo, B-1 cyan, B-2 green, B-3 amber, B-4 pink) + badge v meta řádce.

## CARD_COLOR_TOKENS

```typescript
const CARD_COLOR_TOKENS = [
  { id: 'executive', label: 'Executive', background: '#EAF1FF', border: '#2F5DA8', text: '#17325C' },
  { id: 'manager',   label: 'Manager',   background: '#E8F6EF', border: '#2F7D55', text: '#16442D' },
  { id: 'standard',  label: 'Standard',  background: '#FFFFFF', border: '#CBD5E1', text: '#1F2937' },
  { id: 'planned',   label: 'Planned',   background: '#FFF7E6', border: '#D97706', text: '#7C3F00' },
  { id: 'country',   label: 'Country',   background: '#EEF2FF', border: '#4F46E5', text: '#312E81' },
  { id: 'regio',     label: 'Regio',     background: '#ECFEFF', border: '#0891B2', text: '#155E75' },
  { id: 'neutral',   label: 'Neutral',   background: '#F8FAFC', border: '#94A3B8', text: '#334155' },
];
```

Doporučené mapování úroveň → barva (defaultní seed v `sourceOrgchart.ts`):
- B-0 → `executive`
- B-1 → `manager` (group directors) nebo `executive` (chief officers)
- B-2 → `standard`
- B-3 → `manager`
- B-4 → `country`

Uživatel může barvu změnit per kartu v editor panelu (swatch picker).

## ID konvence

ID karty je kebab-case slug ve formě:
- `<title-slug>-<person-slug>` pro většinu karet
- `<title-slug>-<country>-<person-slug>` pro disambig stejných titulů v různých zemích
- Speciální: `holding-aures` (root)

Příklady:
- `holding-aures` — root, no person
- `co-ceo-petr-vanecek` — kebab z "CO-CEO" + "Petr Vaněček"
- `chief-hr-officer-marie-vorsilkova` — diakritika odstraněna, lowercase
- `country-sales-manager-jiri-pokorak` — bez country suffix (jediná osoba)
- `country-sales-manager-sk-martin-medek` — s country suffix pro disambig (jsou další "Country Sales Manager" v jiných zemích)
- `regional-ops-manager-sk-milos-vitko` — tři osoby na stejné roli (sk-milos-vitko, sk-juraj-chrast, sk-michal-ledvenyi)

**Slugify pravidla** (v `chartOperations.ts:slugify`):
1. `value.trim().toLowerCase()`
2. `.replace(/[^a-z0-9]+/g, '-')` (diakritika odstraní, mezera → pomlčka)
3. `.replace(/^-+|-+$/g, '')` (trim pomlček)
4. Vrátí `slug` nebo `'node'` pokud prázdné

**Nová karta** (přidaná přes „+"):
- Default title "Nová role" → slug `nov-role`
- Pokud `nov-role` ID už existuje, dostane suffix `nov-role-N` (kde N = počet aktuálních karet, inkrementuje se až najde volné)

## SelectedNodePatch

Pro update karty v editoru:

```typescript
type SelectedNodePatch = Partial<Pick<OrgNode,
  'title' | 'person' | 'levelType' | 'country' | 'regio' | 'color' | 'status'
>>;
```

`id`, `parentId`, `order` se mění jen přes specifické akce v reduceru (move-as-child, move-as-sibling, drop-as-child, drop-as-sibling).

## Validation pravidla

`chartValidation.ts:validateChartDocument` kontroluje:

1. **Schema version** — musí být `3`
2. **Single root** — přesně jeden node s `parentId === null`
3. **Unique IDs** — žádné duplicity
4. **Valid parent references** — všechny `parentId` musí ukazovat na existující ID
5. **Non-empty title** — žádný node nesmí mít prázdný `title`
6. **No cycles** — node nemůže být ve vlastním podstromu (sledováno DFS)
7. **Valid level type** — `levelType` musí být jednou z `LEVEL_TYPES`
8. **Valid status** — `status` musí být jeden z `STATUS_TYPES`
9. **Valid color** — `color` musí být jeden z `CARD_COLOR_TOKENS[].id`

`chartOperations.ts` operace dodatečně validují:
- **`moveNodeAsChild`**: nelze přesunout do sebe sama, nelze do vlastního potomka, nelze z root
- **`moveNodeAsSibling`**: nelze vedle sebe sama, nelze vedle root, nelze vedle vlastního potomka
- **`deleteNodeAndDescendants`**: nelze smazat root

## Příklady karet

**B-0 root:**
```typescript
{
  id: 'holding-aures',
  parentId: null,
  title: 'Aures Holdings',
  person: '',
  levelType: 'B-0',
  country: '',
  regio: '',
  color: 'executive',
  status: 'active',
  order: 0,
}
```

**B-1 Chief Officer:**
```typescript
{
  id: 'chief-hr-officer-marie-vorsilkova',
  parentId: 'co-ceo-karolina-topolova',
  title: 'Chief HR Officer',
  person: 'Marie Voršílková',
  levelType: 'B-1',
  country: '',
  regio: '',
  color: 'executive',
  status: 'active',
  order: 30,
}
```

**B-2 Group Manager:**
```typescript
{
  id: 'group-buying-manager-martin-roudnicky',
  parentId: 'group-purchasing-director-zdenek-batek',
  title: 'Group Buying Manager',
  person: 'Martin Roudnický',
  levelType: 'B-2',
  country: '',
  regio: '',
  color: 'standard',
  status: 'active',
  order: 10,
}
```

**B-3 Country (SK):**
```typescript
{
  id: 'country-sales-manager-sk-martin-medek',
  parentId: 'managing-director-czsk-lubos-vorlik',
  title: 'Country Sales Manager',
  person: 'Martin Medek',
  levelType: 'B-3',
  country: 'SK',
  regio: '',
  color: 'manager',
  status: 'active',
  order: 20,
}
```

**B-4 Specialist (PL):**
```typescript
{
  id: 'country-sales-manager-pl-jiri-vavra',
  parentId: 'managing-director-pl-miroslav-vapenik',
  title: 'Country Sales Manager',
  person: 'Jiří Vávra',
  levelType: 'B-4',
  country: 'PL',
  regio: '',
  color: 'country',
  status: 'active',
  order: 10,
}
```

## Import / Export

Export: button v toolbaru → `downloadJson()` (utils) → JSON soubor `orgchart-YYYY-MM-DD.json`.

Import: hidden `<input type="file">` → `file.text()` → `parseChartDocument(json)` → validace + dispatch `replace-chart`. Při chybě se zobrazí warning ve status baru.

Soubor je plain JSON odpovídající `OrgChartDocument` shape, se všemi nodes inline.
