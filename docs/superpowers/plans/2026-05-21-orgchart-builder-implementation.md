# Orgchart Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved static GitHub Pages MVP: a password-gated, polished, manually editable orgchart editor seeded from the attached holding orgchart.

**Architecture:** A Vite + React + TypeScript single-page app stores chart data as a validated tree document. Pure domain functions perform add, delete, move, reorder, import, export, undo, and layout preparation; React components render the editor canvas, toolbar, and side panel.

**Tech Stack:** Vite, React, TypeScript, Vitest, React Testing Library, `@xyflow/react`, `d3-hierarchy`, `lucide-react`, GitHub Actions, GitHub Pages.

---

## File Structure

- Create `package.json`: npm scripts and dependency manifest.
- Create `index.html`: Vite entry document.
- Create `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`: TypeScript and Vite config.
- Create `vitest.config.ts`, `src/test/setup.ts`: unit and component test setup.
- Create `.env.example`: documented frontend password hash variable.
- Modify `.gitignore`: add generated app/test artifacts.
- Create `.github/workflows/deploy-pages.yml`: GitHub Pages deployment workflow.
- Create `README.md`: run, build, password, GitHub Pages, and security notes.
- Create `src/main.tsx`: React entry.
- Create `src/App.tsx`: top-level composition.
- Create `src/styles.css`: global workspace styling.
- Create `src/domain/orgchart.ts`: core types and constants.
- Create `src/domain/chartOperations.ts`: pure tree mutation helpers.
- Create `src/domain/chartValidation.ts`: import/export validation.
- Create `src/domain/chartLayout.ts`: tree-to-canvas layout.
- Create `src/domain/chartHistory.ts`: undo state helper.
- Create `src/domain/*.test.ts`: unit tests for pure data behavior.
- Create `src/data/sourceOrgchart.ts`: prepared source dataset transcribed from the attachment.
- Create `src/data/sourceOrgchart.test.ts`: seed integrity tests.
- Create `src/state/chartReducer.ts`: UI reducer around domain operations.
- Create `src/state/storage.ts`: local persistence and JSON download/upload helpers.
- Create `src/state/*.test.ts`: reducer and persistence tests.
- Create `src/components/AuthGate.tsx`: frontend password screen.
- Create `src/components/Toolbar.tsx`: search, orientation, zoom, import/export, reset, undo.
- Create `src/components/OrgChartCanvas.tsx`: pan/zoom chart surface.
- Create `src/components/OrgNodeCard.tsx`: custom orgchart card with plus button and drop zones.
- Create `src/components/EditorPanel.tsx`: selected-node editor.
- Create `src/components/StatusBar.tsx`: local state and warning display.
- Create `src/components/*.test.tsx`: component happy-path tests.

## Implementation Notes

- Treat the frontend password as a temporary gate only. Do not write copy that calls it secure authentication.
- Use the attached PDF at `C:/Users/ondrej.dolejs/AppData/Local/Temp/2026-04-01_Holding_Organizační struktura Holding (1).pdf` as the source for `src/data/sourceOrgchart.ts`.
- Keep source data in the app because the user explicitly approved a public GitHub Pages prototype with real data.
- Do not implement PDF/VSD import.
- Do not implement freehand connector drawing.
- Use stable ids in source data, for example `chief-hr-officer-marie-vorsilkova`, not generated ids.

---

### Task 1: App Scaffold

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `.env.example`
- Modify: `.gitignore`

- [ ] **Step 1: Create npm manifest**

Create `package.json`:

```json
{
  "name": "orgchart-builder",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:run": "vitest run",
    "typecheck": "tsc -b"
  },
  "dependencies": {},
  "devDependencies": {}
}
```

- [ ] **Step 2: Install dependencies**

Run:

```bash
npm install react react-dom @xyflow/react d3-hierarchy lucide-react clsx
npm install -D @vitejs/plugin-react typescript vite vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom @types/react @types/react-dom @types/d3-hierarchy
```

Expected: `package-lock.json` is created and dependencies are added to `package.json`.

- [ ] **Step 3: Create Vite entry document**

Create `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex,nofollow" />
    <title>Orgchart Builder</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Create TypeScript config**

Create `tsconfig.json`:

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "types": ["vitest/globals"]
  },
  "include": ["src", "vite.config.ts", "vitest.config.ts"]
}
```

- [ ] **Step 5: Create Vite config for GitHub Pages**

Create `vite.config.ts`:

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/orgchart_builder/' : '/',
  plugins: [react()],
}));
```

- [ ] **Step 6: Create Vitest config**

Create `vitest.config.ts`:

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});
```

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(globalThis, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: ResizeObserverMock,
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

- [ ] **Step 7: Document password hash variable**

Create `.env.example`:

```dotenv
# SHA-256 hex hash of the temporary frontend password.
# This is not real authentication. The static app bundle can be inspected.
VITE_APP_PASSWORD_HASH=
```

- [ ] **Step 8: Extend git ignore rules**

Modify `.gitignore` so it contains:

```gitignore
.superpowers/
tmp/
node_modules/
dist/
coverage/
playwright-report/
test-results/
.env
.env.*
!.env.example
```

- [ ] **Step 9: Verify scaffold**

Run:

```bash
npm run typecheck
npm run test:run
```

Expected: both commands pass. Vitest may report no tests found only before Task 2; after Task 2 it must run tests.

- [ ] **Step 10: Commit**

Run:

```bash
git add package.json package-lock.json index.html tsconfig.json tsconfig.node.json vite.config.ts vitest.config.ts src/test/setup.ts .env.example .gitignore
git commit -m "chore: scaffold vite react app"
```

---

### Task 2: Domain Types and Source Data Contract

**Files:**
- Create: `src/domain/orgchart.ts`
- Create: `src/domain/orgchart.test.ts`
- Create: `src/data/sourceOrgchart.ts`
- Create: `src/data/sourceOrgchart.test.ts`

- [ ] **Step 1: Write domain contract test**

Create `src/domain/orgchart.test.ts`:

```ts
import { CARD_COLOR_TOKENS, LEVEL_TYPES, STATUS_TYPES } from './orgchart';

describe('orgchart constants', () => {
  it('defines required level types', () => {
    expect(LEVEL_TYPES).toEqual(['holding', 'group', 'country', 'regio', 'team', 'role', 'placeholder']);
  });

  it('defines required statuses', () => {
    expect(STATUS_TYPES).toEqual(['active', 'planned', 'vacant']);
  });

  it('includes source color tokens', () => {
    expect(CARD_COLOR_TOKENS.map((token) => token.id)).toEqual([
      'executive',
      'manager',
      'standard',
      'planned',
      'country',
      'regio',
      'neutral',
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test:run -- src/domain/orgchart.test.ts
```

Expected: FAIL because `src/domain/orgchart.ts` does not exist.

- [ ] **Step 3: Implement domain types**

Create `src/domain/orgchart.ts`:

```ts
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
  { id: 'executive', label: 'Executive', background: '#31d9a3', border: '#087f5b', text: '#06281f' },
  { id: 'manager', label: 'Manager', background: '#85d8ef', border: '#176b87', text: '#082f3f' },
  { id: 'standard', label: 'Standard', background: '#f8fafc', border: '#334155', text: '#0f172a' },
  { id: 'planned', label: 'Planned', background: '#d8f8d8', border: '#2f9e44', text: '#123d1d' },
  { id: 'country', label: 'Country', background: '#ffd43b', border: '#8d6b00', text: '#2f2500' },
  { id: 'regio', label: 'Regio', background: '#f0c2ff', border: '#8a4b9d', text: '#35163f' },
  { id: 'neutral', label: 'Neutral', background: '#e5e7eb', border: '#6b7280', text: '#111827' },
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

export interface SelectedNodePatch {
  title?: string;
  person?: string;
  levelType?: OrgNodeLevelType;
  country?: string;
  regio?: string;
  color?: string;
  status?: OrgNodeStatus;
}

export const EMPTY_NODE_PATCH: Required<SelectedNodePatch> = {
  title: '',
  person: '',
  levelType: 'role',
  country: '',
  regio: '',
  color: 'standard',
  status: 'active',
};
```

- [ ] **Step 4: Write source dataset integrity test**

Create `src/data/sourceOrgchart.test.ts`:

```ts
import { SOURCE_ORGCHART } from './sourceOrgchart';

describe('SOURCE_ORGCHART', () => {
  it('uses schema version 1 and has source nodes', () => {
    expect(SOURCE_ORGCHART.schemaVersion).toBe(1);
    expect(SOURCE_ORGCHART.nodes.length).toBeGreaterThan(20);
  });

  it('contains key roles visible in the attachment', () => {
    const titles = SOURCE_ORGCHART.nodes.map((node) => node.title);
    expect(titles).toContain('CO-Chief Executive Officer');
    expect(titles).toContain('Chief HR Officer');
    expect(titles).toContain('Chief Financial Officer');
    expect(titles).toContain('Managing Director CZ/SK');
  });

  it('has stable unique ids', () => {
    const ids = SOURCE_ORGCHART.nodes.map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
```

- [ ] **Step 5: Run source dataset test to verify it fails**

Run:

```bash
npm run test:run -- src/data/sourceOrgchart.test.ts
```

Expected: FAIL because `src/data/sourceOrgchart.ts` does not exist.

- [ ] **Step 6: Create prepared source dataset**

Create `src/data/sourceOrgchart.ts` with at least the visible executive and first operational branches from the attachment, then continue transcription in Task 11. Use this starting content:

```ts
import type { OrgChartDocument } from '../domain/orgchart';

export const SOURCE_ORGCHART: OrgChartDocument = {
  schemaVersion: 1,
  name: 'Holding organization structure 2026-04-01',
  updatedAt: '2026-04-01T00:00:00.000Z',
  nodes: [
    {
      id: 'co-ceo-petr-vanecek',
      parentId: null,
      title: 'CO-Chief Executive Officer',
      person: 'Petr Vaněček',
      levelType: 'holding',
      country: '',
      regio: '',
      color: 'executive',
      status: 'active',
      order: 10,
    },
    {
      id: 'co-ceo-karolina-topolova',
      parentId: null,
      title: 'CO-Chief Executive Officer',
      person: 'Karolína Topolová',
      levelType: 'holding',
      country: '',
      regio: '',
      color: 'executive',
      status: 'active',
      order: 20,
    },
    {
      id: 'chief-operations-officer-martin-hrudnik',
      parentId: 'co-ceo-petr-vanecek',
      title: 'Chief Operations Officer',
      person: 'Martin Hrudník',
      levelType: 'holding',
      country: '',
      regio: '',
      color: 'executive',
      status: 'active',
      order: 10,
    },
    {
      id: 'chief-financial-officer-marko-lehtonen',
      parentId: 'co-ceo-karolina-topolova',
      title: 'Chief Financial Officer',
      person: 'Marko Tapio Lehtonen',
      levelType: 'holding',
      country: '',
      regio: '',
      color: 'executive',
      status: 'active',
      order: 10,
    },
    {
      id: 'chief-performance-officer-jiri-trnka',
      parentId: 'co-ceo-petr-vanecek',
      title: 'Chief Performance Officer',
      person: 'Jiří Trnka',
      levelType: 'holding',
      country: '',
      regio: '',
      color: 'manager',
      status: 'active',
      order: 20,
    },
    {
      id: 'chief-innovation-officer-eldar-vagabov',
      parentId: 'co-ceo-petr-vanecek',
      title: 'Chief Innovation Officer',
      person: 'Eldar Vagabov',
      levelType: 'holding',
      country: '',
      regio: '',
      color: 'manager',
      status: 'active',
      order: 30,
    },
    {
      id: 'managing-director-mototechna-drive-jan-hruby',
      parentId: 'co-ceo-petr-vanecek',
      title: 'Managing Director Mototechna Drive',
      person: 'Jan Hrubý',
      levelType: 'group',
      country: '',
      regio: '',
      color: 'manager',
      status: 'active',
      order: 40,
    },
    {
      id: 'chief-legal-officer-lenka-zajickova',
      parentId: 'co-ceo-karolina-topolova',
      title: 'Chief Legal Officer',
      person: 'Lenka Zajíčková',
      levelType: 'holding',
      country: '',
      regio: '',
      color: 'manager',
      status: 'active',
      order: 20,
    },
    {
      id: 'chief-hr-officer-marie-vorsilkova',
      parentId: 'co-ceo-karolina-topolova',
      title: 'Chief HR Officer',
      person: 'Marie Voršílková',
      levelType: 'holding',
      country: '',
      regio: '',
      color: 'manager',
      status: 'active',
      order: 30,
    },
    {
      id: 'group-car-sales-director-daniel-lunacek',
      parentId: 'chief-operations-officer-martin-hrudnik',
      title: 'Group Car Sales Director',
      person: 'Daniel Luňáček',
      levelType: 'group',
      country: '',
      regio: '',
      color: 'manager',
      status: 'active',
      order: 10,
    },
    {
      id: 'group-purchasing-director-zdenek-batek',
      parentId: 'chief-operations-officer-martin-hrudnik',
      title: 'Group Purchasing Director',
      person: 'Zdeněk Batěk',
      levelType: 'group',
      country: '',
      regio: '',
      color: 'manager',
      status: 'active',
      order: 20,
    },
    {
      id: 'group-automotiveops-director-leos-pilnaj',
      parentId: 'chief-operations-officer-martin-hrudnik',
      title: 'Group AutomotiveOPS Director',
      person: 'Leoš Pilnaj',
      levelType: 'group',
      country: '',
      regio: '',
      color: 'manager',
      status: 'active',
      order: 30,
    },
    {
      id: 'group-stock-service-director-pavel-pospisil',
      parentId: 'chief-operations-officer-martin-hrudnik',
      title: 'Group Stock & Service Director',
      person: 'Pavel Pospíšil',
      levelType: 'group',
      country: '',
      regio: '',
      color: 'manager',
      status: 'active',
      order: 40,
    },
    {
      id: 'group-internal-audit-director-lukas-chlup',
      parentId: 'chief-operations-officer-martin-hrudnik',
      title: 'Group Internal Audit Director',
      person: 'Lukáš Chlup',
      levelType: 'group',
      country: '',
      regio: '',
      color: 'manager',
      status: 'active',
      order: 50,
    },
    {
      id: 'group-financial-services-director-milan-dedecek',
      parentId: 'chief-performance-officer-jiri-trnka',
      title: 'Group Financial Services Director',
      person: 'Milan Dědeček',
      levelType: 'group',
      country: '',
      regio: '',
      color: 'manager',
      status: 'active',
      order: 10,
    },
    {
      id: 'chief-executive-officer-zdenek-demeter',
      parentId: 'chief-innovation-officer-eldar-vagabov',
      title: 'Chief Executive Officer',
      person: 'Zdeněk Demeter',
      levelType: 'group',
      country: '',
      regio: '',
      color: 'manager',
      status: 'active',
      order: 10,
    },
    {
      id: 'chief-information-officer-jiri-cabradek',
      parentId: 'chief-innovation-officer-eldar-vagabov',
      title: 'Chief Information Officer',
      person: 'Jiří Čabrádek',
      levelType: 'group',
      country: '',
      regio: '',
      color: 'manager',
      status: 'active',
      order: 20,
    },
    {
      id: 'chief-digital-officer-milan-jezek',
      parentId: 'chief-innovation-officer-eldar-vagabov',
      title: 'Chief Digital Officer',
      person: 'Milan Ježek',
      levelType: 'group',
      country: '',
      regio: '',
      color: 'manager',
      status: 'active',
      order: 30,
    },
    {
      id: 'group-call-centre-director-petr-havel',
      parentId: 'co-ceo-karolina-topolova',
      title: 'Group Call Centre Director',
      person: 'Petr Havel',
      levelType: 'group',
      country: '',
      regio: '',
      color: 'manager',
      status: 'active',
      order: 40,
    },
    {
      id: 'group-business-development-director-david-cizek',
      parentId: 'co-ceo-karolina-topolova',
      title: 'Group Business Development Director',
      person: 'David Čížek',
      levelType: 'group',
      country: '',
      regio: '',
      color: 'manager',
      status: 'active',
      order: 50,
    },
    {
      id: 'group-office-operations-director-michaela-kosinerova',
      parentId: 'co-ceo-karolina-topolova',
      title: 'Group Office Operations Director',
      person: 'Michaela Kosinerová',
      levelType: 'group',
      country: '',
      regio: '',
      color: 'manager',
      status: 'active',
      order: 60,
    },
    {
      id: 'group-personnel-payroll-manager-martina-kahounova',
      parentId: 'chief-hr-officer-marie-vorsilkova',
      title: 'Group Personnel & Payroll Manager',
      person: 'Martina Kahounová',
      levelType: 'group',
      country: '',
      regio: '',
      color: 'standard',
      status: 'active',
      order: 10,
    },
    {
      id: 'country-payroll-manager-cz-sk-jitka-horejsi',
      parentId: 'group-personnel-payroll-manager-martina-kahounova',
      title: 'Country Payroll Manager CZ+SK',
      person: 'Jitka Hořejší',
      levelType: 'country',
      country: 'CZ+SK',
      regio: '',
      color: 'planned',
      status: 'planned',
      order: 10,
    },
    {
      id: 'managing-director-cz-sk-lubos-vorlik',
      parentId: 'chief-operations-officer-martin-hrudnik',
      title: 'Managing Director CZ/SK',
      person: 'Luboš Vorlík',
      levelType: 'country',
      country: 'CZ/SK',
      regio: '',
      color: 'manager',
      status: 'active',
      order: 90,
    }
  ],
};
```

- [ ] **Step 7: Run tests**

Run:

```bash
npm run test:run -- src/domain/orgchart.test.ts src/data/sourceOrgchart.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

Run:

```bash
git add src/domain/orgchart.ts src/domain/orgchart.test.ts src/data/sourceOrgchart.ts src/data/sourceOrgchart.test.ts
git commit -m "feat: define orgchart data model"
```

---

### Task 3: Pure Chart Operations

**Files:**
- Create: `src/domain/chartOperations.ts`
- Create: `src/domain/chartOperations.test.ts`

- [ ] **Step 1: Write failing operation tests**

Create `src/domain/chartOperations.test.ts`:

```ts
import type { OrgChartDocument } from './orgchart';
import {
  addChildNode,
  deleteNodeAndDescendants,
  moveNodeAsChild,
  moveNodeAsSibling,
  updateNode,
} from './chartOperations';

const baseChart = (): OrgChartDocument => ({
  schemaVersion: 1,
  name: 'Test',
  updatedAt: '2026-05-21T00:00:00.000Z',
  nodes: [
    { id: 'root', parentId: null, title: 'Root', person: 'A', levelType: 'holding', country: '', regio: '', color: 'executive', status: 'active', order: 10 },
    { id: 'child-a', parentId: 'root', title: 'Child A', person: 'B', levelType: 'role', country: '', regio: '', color: 'standard', status: 'active', order: 10 },
    { id: 'child-b', parentId: 'root', title: 'Child B', person: 'C', levelType: 'role', country: '', regio: '', color: 'standard', status: 'active', order: 20 },
    { id: 'grandchild', parentId: 'child-a', title: 'Grandchild', person: 'D', levelType: 'role', country: '', regio: '', color: 'standard', status: 'active', order: 10 },
  ],
});

describe('chartOperations', () => {
  it('adds a child under a selected node', () => {
    const result = addChildNode(baseChart(), 'child-a');
    const added = result.nodes.find((node) => node.parentId === 'child-a' && node.title === 'New role');
    expect(added).toMatchObject({ levelType: 'role', color: 'standard', status: 'active' });
  });

  it('updates editable node fields', () => {
    const result = updateNode(baseChart(), 'child-a', { title: 'Updated', country: 'CZ', color: 'country' });
    expect(result.nodes.find((node) => node.id === 'child-a')).toMatchObject({ title: 'Updated', country: 'CZ', color: 'country' });
  });

  it('deletes a node and descendants', () => {
    const result = deleteNodeAndDescendants(baseChart(), 'child-a');
    expect(result.nodes.map((node) => node.id)).toEqual(['root', 'child-b']);
  });

  it('moves a node as child of target', () => {
    const result = moveNodeAsChild(baseChart(), 'child-b', 'child-a');
    expect(result.nodes.find((node) => node.id === 'child-b')).toMatchObject({ parentId: 'child-a' });
  });

  it('blocks moving a node into its descendant', () => {
    expect(() => moveNodeAsChild(baseChart(), 'child-a', 'grandchild')).toThrow('Cannot move a node into its own descendant.');
  });

  it('moves a node beside target on the right', () => {
    const result = moveNodeAsSibling(baseChart(), 'child-a', 'child-b', 'right');
    const childA = result.nodes.find((node) => node.id === 'child-a');
    const childB = result.nodes.find((node) => node.id === 'child-b');
    expect(childA?.parentId).toBe('root');
    expect(childA!.order).toBeGreaterThan(childB!.order);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test:run -- src/domain/chartOperations.test.ts
```

Expected: FAIL because `src/domain/chartOperations.ts` does not exist.

- [ ] **Step 3: Implement operations**

Create `src/domain/chartOperations.ts`:

```ts
import type { OrgChartDocument, OrgNode, SelectedNodePatch } from './orgchart';

const nowIso = () => new Date().toISOString();

const cloneChart = (chart: OrgChartDocument): OrgChartDocument => ({
  ...chart,
  updatedAt: nowIso(),
  nodes: chart.nodes.map((node) => ({ ...node })),
});

const getNode = (chart: OrgChartDocument, id: string): OrgNode => {
  const node = chart.nodes.find((candidate) => candidate.id === id);
  if (!node) throw new Error(`Node not found: ${id}`);
  return node;
};

const childOrders = (chart: OrgChartDocument, parentId: string | null) =>
  chart.nodes.filter((node) => node.parentId === parentId).map((node) => node.order);

const nextOrder = (chart: OrgChartDocument, parentId: string | null) => {
  const orders = childOrders(chart, parentId);
  return orders.length === 0 ? 10 : Math.max(...orders) + 10;
};

const slug = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const createUniqueId = (chart: OrgChartDocument, base: string) => {
  const existing = new Set(chart.nodes.map((node) => node.id));
  const prefix = slug(base) || 'node';
  let counter = 1;
  let id = `${prefix}-${counter}`;
  while (existing.has(id)) {
    counter += 1;
    id = `${prefix}-${counter}`;
  }
  return id;
};

const descendantIds = (chart: OrgChartDocument, nodeId: string): Set<string> => {
  const result = new Set<string>();
  const visit = (id: string) => {
    chart.nodes.filter((node) => node.parentId === id).forEach((child) => {
      result.add(child.id);
      visit(child.id);
    });
  };
  visit(nodeId);
  return result;
};

const normalizeSiblingOrders = (nodes: OrgNode[], parentId: string | null): OrgNode[] => {
  const siblings = nodes
    .filter((node) => node.parentId === parentId)
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  const orderById = new Map(siblings.map((node, index) => [node.id, (index + 1) * 10]));
  return nodes.map((node) => (orderById.has(node.id) ? { ...node, order: orderById.get(node.id)! } : node));
};

export const addChildNode = (chart: OrgChartDocument, parentId: string): OrgChartDocument => {
  getNode(chart, parentId);
  const next = cloneChart(chart);
  const id = createUniqueId(next, 'new-role');
  next.nodes.push({
    id,
    parentId,
    title: 'New role',
    person: '',
    levelType: 'role',
    country: '',
    regio: '',
    color: 'standard',
    status: 'active',
    order: nextOrder(next, parentId),
  });
  return next;
};

export const updateNode = (chart: OrgChartDocument, nodeId: string, patch: SelectedNodePatch): OrgChartDocument => {
  getNode(chart, nodeId);
  const next = cloneChart(chart);
  next.nodes = next.nodes.map((node) => (node.id === nodeId ? { ...node, ...patch } : node));
  return next;
};

export const deleteNodeAndDescendants = (chart: OrgChartDocument, nodeId: string): OrgChartDocument => {
  getNode(chart, nodeId);
  const remove = descendantIds(chart, nodeId);
  remove.add(nodeId);
  const deleted = getNode(chart, nodeId);
  const next = cloneChart(chart);
  next.nodes = normalizeSiblingOrders(next.nodes.filter((node) => !remove.has(node.id)), deleted.parentId);
  return next;
};

export const moveNodeAsChild = (chart: OrgChartDocument, sourceId: string, targetParentId: string): OrgChartDocument => {
  if (sourceId === targetParentId) throw new Error('Cannot move a node under itself.');
  getNode(chart, sourceId);
  getNode(chart, targetParentId);
  if (descendantIds(chart, sourceId).has(targetParentId)) {
    throw new Error('Cannot move a node into its own descendant.');
  }
  const next = cloneChart(chart);
  const source = getNode(next, sourceId);
  next.nodes = next.nodes.map((node) =>
    node.id === sourceId ? { ...node, parentId: targetParentId, order: nextOrder(next, targetParentId) } : node,
  );
  next.nodes = normalizeSiblingOrders(next.nodes, source.parentId);
  next.nodes = normalizeSiblingOrders(next.nodes, targetParentId);
  return next;
};

export const moveNodeAsSibling = (
  chart: OrgChartDocument,
  sourceId: string,
  targetId: string,
  side: 'left' | 'right',
): OrgChartDocument => {
  if (sourceId === targetId) throw new Error('Cannot reorder a node beside itself.');
  const source = getNode(chart, sourceId);
  const target = getNode(chart, targetId);
  if (descendantIds(chart, sourceId).has(targetId)) {
    throw new Error('Cannot move a node beside its own descendant.');
  }
  const next = cloneChart(chart);
  const siblings = next.nodes
    .filter((node) => node.parentId === target.parentId && node.id !== sourceId)
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  const targetIndex = siblings.findIndex((node) => node.id === targetId);
  const insertIndex = side === 'left' ? targetIndex : targetIndex + 1;
  siblings.splice(insertIndex, 0, { ...source, parentId: target.parentId });
  const orderById = new Map(siblings.map((node, index) => [node.id, (index + 1) * 10]));
  next.nodes = next.nodes.map((node) =>
    orderById.has(node.id) ? { ...node, parentId: target.parentId, order: orderById.get(node.id)! } : node,
  );
  next.nodes = normalizeSiblingOrders(next.nodes, source.parentId);
  return next;
};
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm run test:run -- src/domain/chartOperations.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/domain/chartOperations.ts src/domain/chartOperations.test.ts
git commit -m "feat: add orgchart tree operations"
```

---

### Task 4: Validation, Serialization, History, and Storage

**Files:**
- Create: `src/domain/chartValidation.ts`
- Create: `src/domain/chartValidation.test.ts`
- Create: `src/domain/chartHistory.ts`
- Create: `src/domain/chartHistory.test.ts`
- Create: `src/state/storage.ts`
- Create: `src/state/storage.test.ts`

- [ ] **Step 1: Write validation and history tests**

Create `src/domain/chartValidation.test.ts`:

```ts
import type { OrgChartDocument } from './orgchart';
import { parseChartDocument, validateChartDocument } from './chartValidation';

const validChart: OrgChartDocument = {
  schemaVersion: 1,
  name: 'Valid',
  updatedAt: '2026-05-21T00:00:00.000Z',
  nodes: [
    { id: 'root', parentId: null, title: 'Root', person: '', levelType: 'holding', country: '', regio: '', color: 'executive', status: 'active', order: 10 },
    { id: 'child', parentId: 'root', title: 'Child', person: '', levelType: 'role', country: '', regio: '', color: 'standard', status: 'active', order: 10 },
  ],
};

describe('chartValidation', () => {
  it('accepts a valid chart document', () => {
    expect(validateChartDocument(validChart)).toEqual([]);
  });

  it('rejects duplicate ids', () => {
    const invalid = { ...validChart, nodes: [validChart.nodes[0], validChart.nodes[0]] };
    expect(validateChartDocument(invalid)).toContain('Duplicate node id: root');
  });

  it('rejects missing parents', () => {
    const invalid = { ...validChart, nodes: [{ ...validChart.nodes[1], parentId: 'missing' }] };
    expect(validateChartDocument(invalid)).toContain('Missing parent missing for node child');
  });

  it('rejects cycles', () => {
    const invalid = {
      ...validChart,
      nodes: [
        { ...validChart.nodes[0], parentId: 'child' },
        { ...validChart.nodes[1], parentId: 'root' },
      ],
    };
    expect(validateChartDocument(invalid)).toContain('Cycle detected at node root');
  });

  it('parses JSON into a chart document', () => {
    expect(parseChartDocument(JSON.stringify(validChart))).toEqual(validChart);
  });
});
```

Create `src/domain/chartHistory.test.ts`:

```ts
import type { OrgChartDocument } from './orgchart';
import { createHistory, pushHistory, undoHistory } from './chartHistory';

const chart = (name: string): OrgChartDocument => ({
  schemaVersion: 1,
  name,
  updatedAt: '2026-05-21T00:00:00.000Z',
  nodes: [],
});

describe('chartHistory', () => {
  it('pushes and undoes chart states', () => {
    const initial = createHistory(chart('A'));
    const pushed = pushHistory(initial, chart('B'));
    const undone = undoHistory(pushed);
    expect(undone.current.name).toBe('A');
    expect(undone.future[0].name).toBe('B');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm run test:run -- src/domain/chartValidation.test.ts src/domain/chartHistory.test.ts
```

Expected: FAIL because implementation files do not exist.

- [ ] **Step 3: Implement validation**

Create `src/domain/chartValidation.ts`:

```ts
import { CARD_COLOR_TOKENS, LEVEL_TYPES, STATUS_TYPES, type OrgChartDocument, type OrgNode } from './orgchart';

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNode = (value: unknown): value is OrgNode => {
  if (!isObject(value)) return false;
  return (
    typeof value.id === 'string' &&
    (typeof value.parentId === 'string' || value.parentId === null) &&
    typeof value.title === 'string' &&
    typeof value.person === 'string' &&
    typeof value.country === 'string' &&
    typeof value.regio === 'string' &&
    typeof value.color === 'string' &&
    typeof value.order === 'number' &&
    LEVEL_TYPES.includes(value.levelType as never) &&
    STATUS_TYPES.includes(value.status as never)
  );
};

export const isChartDocument = (value: unknown): value is OrgChartDocument => {
  if (!isObject(value)) return false;
  return (
    value.schemaVersion === 1 &&
    typeof value.name === 'string' &&
    typeof value.updatedAt === 'string' &&
    Array.isArray(value.nodes) &&
    value.nodes.every(isNode)
  );
};

export const validateChartDocument = (chart: OrgChartDocument): string[] => {
  const errors: string[] = [];
  const ids = new Set<string>();
  const colorIds = new Set(CARD_COLOR_TOKENS.map((token) => token.id));

  chart.nodes.forEach((node) => {
    if (ids.has(node.id)) errors.push(`Duplicate node id: ${node.id}`);
    ids.add(node.id);
    if (!node.id.trim()) errors.push('Node id cannot be empty');
    if (!node.title.trim()) errors.push(`Node ${node.id} title cannot be empty`);
    if (!colorIds.has(node.color)) errors.push(`Unknown color ${node.color} for node ${node.id}`);
  });

  chart.nodes.forEach((node) => {
    if (node.parentId !== null && !ids.has(node.parentId)) {
      errors.push(`Missing parent ${node.parentId} for node ${node.id}`);
    }
  });

  const byId = new Map(chart.nodes.map((node) => [node.id, node]));
  chart.nodes.forEach((node) => {
    const seen = new Set<string>();
    let current: OrgNode | undefined = node;
    while (current?.parentId) {
      if (seen.has(current.id)) {
        errors.push(`Cycle detected at node ${node.id}`);
        break;
      }
      seen.add(current.id);
      current = byId.get(current.parentId);
    }
  });

  return [...new Set(errors)];
};

export const parseChartDocument = (json: string): OrgChartDocument => {
  const parsed: unknown = JSON.parse(json);
  if (!isChartDocument(parsed)) throw new Error('Imported file is not an orgchart document.');
  const errors = validateChartDocument(parsed);
  if (errors.length > 0) throw new Error(errors.join('\n'));
  return parsed;
};
```

- [ ] **Step 4: Implement history**

Create `src/domain/chartHistory.ts`:

```ts
import type { OrgChartDocument } from './orgchart';

export interface ChartHistory {
  past: OrgChartDocument[];
  current: OrgChartDocument;
  future: OrgChartDocument[];
}

export const createHistory = (current: OrgChartDocument): ChartHistory => ({
  past: [],
  current,
  future: [],
});

export const pushHistory = (history: ChartHistory, current: OrgChartDocument): ChartHistory => ({
  past: [...history.past, history.current].slice(-50),
  current,
  future: [],
});

export const undoHistory = (history: ChartHistory): ChartHistory => {
  const previous = history.past.at(-1);
  if (!previous) return history;
  return {
    past: history.past.slice(0, -1),
    current: previous,
    future: [history.current, ...history.future],
  };
};
```

- [ ] **Step 5: Add storage tests**

Create `src/state/storage.test.ts`:

```ts
import type { OrgChartDocument } from '../domain/orgchart';
import { loadLocalChart, saveLocalChart } from './storage';

const chart: OrgChartDocument = {
  schemaVersion: 1,
  name: 'Storage',
  updatedAt: '2026-05-21T00:00:00.000Z',
  nodes: [],
};

describe('storage', () => {
  beforeEach(() => localStorage.clear());

  it('saves and loads chart state', () => {
    saveLocalChart(chart);
    expect(loadLocalChart()).toEqual(chart);
  });

  it('returns null for missing state', () => {
    expect(loadLocalChart()).toBeNull();
  });
});
```

- [ ] **Step 6: Implement storage**

Create `src/state/storage.ts`:

```ts
import type { OrgChartDocument } from '../domain/orgchart';
import { parseChartDocument } from '../domain/chartValidation';

const STORAGE_KEY = 'orgchart-builder.chart.v1';

export const loadLocalChart = (): OrgChartDocument | null => {
  const value = localStorage.getItem(STORAGE_KEY);
  if (!value) return null;
  try {
    return parseChartDocument(value);
  } catch {
    return null;
  }
};

export const saveLocalChart = (chart: OrgChartDocument): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chart));
};

export const clearLocalChart = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export const chartToJson = (chart: OrgChartDocument): string => JSON.stringify(chart, null, 2);
```

- [ ] **Step 7: Run tests**

Run:

```bash
npm run test:run -- src/domain/chartValidation.test.ts src/domain/chartHistory.test.ts src/state/storage.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

Run:

```bash
git add src/domain/chartValidation.ts src/domain/chartValidation.test.ts src/domain/chartHistory.ts src/domain/chartHistory.test.ts src/state/storage.ts src/state/storage.test.ts
git commit -m "feat: validate and persist chart documents"
```

---

### Task 5: Layout Engine

**Files:**
- Create: `src/domain/chartLayout.ts`
- Create: `src/domain/chartLayout.test.ts`

- [ ] **Step 1: Write failing layout tests**

Create `src/domain/chartLayout.test.ts`:

```ts
import type { OrgChartDocument } from './orgchart';
import { layoutChart } from './chartLayout';

const chart: OrgChartDocument = {
  schemaVersion: 1,
  name: 'Layout',
  updatedAt: '2026-05-21T00:00:00.000Z',
  nodes: [
    { id: 'root', parentId: null, title: 'Root', person: '', levelType: 'holding', country: '', regio: '', color: 'executive', status: 'active', order: 10 },
    { id: 'child-a', parentId: 'root', title: 'Child A', person: '', levelType: 'role', country: '', regio: '', color: 'standard', status: 'active', order: 10 },
    { id: 'child-b', parentId: 'root', title: 'Child B', person: '', levelType: 'role', country: '', regio: '', color: 'standard', status: 'active', order: 20 },
  ],
};

describe('layoutChart', () => {
  it('returns one positioned item per source node', () => {
    expect(layoutChart(chart, 'vertical').nodes.map((node) => node.id).sort()).toEqual(['child-a', 'child-b', 'root']);
  });

  it('uses different axes for horizontal layout', () => {
    const vertical = layoutChart(chart, 'vertical');
    const horizontal = layoutChart(chart, 'horizontal');
    expect(horizontal.nodes.find((node) => node.id === 'child-a')!.x).toBeGreaterThan(vertical.nodes.find((node) => node.id === 'child-a')!.x);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test:run -- src/domain/chartLayout.test.ts
```

Expected: FAIL because `src/domain/chartLayout.ts` does not exist.

- [ ] **Step 3: Implement layout**

Create `src/domain/chartLayout.ts`:

```ts
import { hierarchy, tree } from 'd3-hierarchy';
import type { ChartOrientation, OrgChartDocument, OrgNode } from './orgchart';

export interface PositionedNode {
  id: string;
  node: OrgNode;
  x: number;
  y: number;
}

export interface PositionedEdge {
  id: string;
  source: string;
  target: string;
}

export interface LayoutResult {
  nodes: PositionedNode[];
  edges: PositionedEdge[];
}

interface TreeNode {
  node: OrgNode;
  children: TreeNode[];
}

const NODE_WIDTH = 220;
const NODE_HEIGHT = 96;
const LEVEL_GAP = 150;
const SIBLING_GAP = 64;

const buildRoots = (chart: OrgChartDocument): TreeNode[] => {
  const childrenByParent = new Map<string | null, OrgNode[]>();
  chart.nodes.forEach((node) => {
    const siblings = childrenByParent.get(node.parentId) ?? [];
    siblings.push(node);
    childrenByParent.set(node.parentId, siblings);
  });
  childrenByParent.forEach((siblings) => siblings.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title)));
  const build = (node: OrgNode): TreeNode => ({
    node,
    children: (childrenByParent.get(node.id) ?? []).map(build),
  });
  return (childrenByParent.get(null) ?? []).map(build);
};

export const layoutChart = (chart: OrgChartDocument, orientation: ChartOrientation): LayoutResult => {
  const roots = buildRoots(chart);
  const syntheticRoot: TreeNode = {
    node: {
      id: '__root__',
      parentId: null,
      title: 'Root',
      person: '',
      levelType: 'placeholder',
      country: '',
      regio: '',
      color: 'neutral',
      status: 'active',
      order: 0,
    },
    children: roots,
  };

  const root = hierarchy(syntheticRoot, (node) => node.children);
  const treeLayout = tree<TreeNode>().nodeSize([NODE_WIDTH + SIBLING_GAP, NODE_HEIGHT + LEVEL_GAP]);
  const laidOut = treeLayout(root);

  const nodes: PositionedNode[] = [];
  const edges: PositionedEdge[] = [];
  laidOut.descendants().forEach((item) => {
    if (item.data.node.id === '__root__') return;
    const x = orientation === 'vertical' ? item.x : item.y;
    const y = orientation === 'vertical' ? item.y : item.x;
    nodes.push({ id: item.data.node.id, node: item.data.node, x, y });
    if (item.parent && item.parent.data.node.id !== '__root__') {
      edges.push({
        id: `${item.parent.data.node.id}->${item.data.node.id}`,
        source: item.parent.data.node.id,
        target: item.data.node.id,
      });
    }
  });

  return { nodes, edges };
};
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm run test:run -- src/domain/chartLayout.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/domain/chartLayout.ts src/domain/chartLayout.test.ts
git commit -m "feat: add tree layout engine"
```

---

### Task 6: Reducer and App State

**Files:**
- Create: `src/state/chartReducer.ts`
- Create: `src/state/chartReducer.test.ts`

- [ ] **Step 1: Write reducer tests**

Create `src/state/chartReducer.test.ts`:

```ts
import { SOURCE_ORGCHART } from '../data/sourceOrgchart';
import { chartReducer, createInitialChartState } from './chartReducer';

describe('chartReducer', () => {
  it('adds a child and selects it', () => {
    const state = createInitialChartState(SOURCE_ORGCHART);
    const result = chartReducer(state, { type: 'add-child', parentId: SOURCE_ORGCHART.nodes[0].id });
    expect(result.history.current.nodes.length).toBe(SOURCE_ORGCHART.nodes.length + 1);
    expect(result.selectedNodeId).toMatch(/^new-role-/);
  });

  it('updates selected node fields', () => {
    const state = { ...createInitialChartState(SOURCE_ORGCHART), selectedNodeId: SOURCE_ORGCHART.nodes[0].id };
    const result = chartReducer(state, { type: 'update-selected', patch: { title: 'Updated' } });
    expect(result.history.current.nodes.find((node) => node.id === SOURCE_ORGCHART.nodes[0].id)?.title).toBe('Updated');
  });

  it('undoes a change', () => {
    const state = createInitialChartState(SOURCE_ORGCHART);
    const changed = chartReducer(state, { type: 'add-child', parentId: SOURCE_ORGCHART.nodes[0].id });
    const undone = chartReducer(changed, { type: 'undo' });
    expect(undone.history.current.nodes.length).toBe(SOURCE_ORGCHART.nodes.length);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test:run -- src/state/chartReducer.test.ts
```

Expected: FAIL because `src/state/chartReducer.ts` does not exist.

- [ ] **Step 3: Implement reducer**

Create `src/state/chartReducer.ts`:

```ts
import { createHistory, pushHistory, undoHistory, type ChartHistory } from '../domain/chartHistory';
import type { ChartOrientation, OrgChartDocument, SelectedNodePatch } from '../domain/orgchart';
import { addChildNode, deleteNodeAndDescendants, moveNodeAsChild, moveNodeAsSibling, updateNode } from '../domain/chartOperations';

export interface ChartState {
  history: ChartHistory;
  selectedNodeId: string | null;
  movingNodeId: string | null;
  orientation: ChartOrientation;
  search: string;
  warning: string;
}

export type ChartAction =
  | { type: 'select'; nodeId: string | null }
  | { type: 'set-search'; search: string }
  | { type: 'set-orientation'; orientation: ChartOrientation }
  | { type: 'add-child'; parentId: string }
  | { type: 'update-selected'; patch: SelectedNodePatch }
  | { type: 'delete'; nodeId: string }
  | { type: 'start-move'; nodeId: string }
  | { type: 'cancel-move' }
  | { type: 'move-as-child'; sourceId: string; targetId: string }
  | { type: 'move-as-sibling'; sourceId: string; targetId: string; side: 'left' | 'right' }
  | { type: 'undo' }
  | { type: 'replace-chart'; chart: OrgChartDocument }
  | { type: 'set-warning'; warning: string };

export const createInitialChartState = (chart: OrgChartDocument): ChartState => ({
  history: createHistory(chart),
  selectedNodeId: null,
  movingNodeId: null,
  orientation: 'vertical',
  search: '',
  warning: '',
});

const push = (state: ChartState, chart: OrgChartDocument, selectedNodeId = state.selectedNodeId): ChartState => ({
  ...state,
  history: pushHistory(state.history, chart),
  selectedNodeId,
  warning: '',
});

export const chartReducer = (state: ChartState, action: ChartAction): ChartState => {
  switch (action.type) {
    case 'select':
      return { ...state, selectedNodeId: action.nodeId };
    case 'set-search':
      return { ...state, search: action.search };
    case 'set-orientation':
      return { ...state, orientation: action.orientation };
    case 'add-child': {
      const chart = addChildNode(state.history.current, action.parentId);
      const added = chart.nodes.filter((node) => node.parentId === action.parentId).sort((a, b) => b.order - a.order)[0];
      return push(state, chart, added.id);
    }
    case 'update-selected':
      if (!state.selectedNodeId) return state;
      return push(state, updateNode(state.history.current, state.selectedNodeId, action.patch));
    case 'delete':
      return push(state, deleteNodeAndDescendants(state.history.current, action.nodeId), null);
    case 'start-move':
      return { ...state, movingNodeId: action.nodeId };
    case 'cancel-move':
      return { ...state, movingNodeId: null };
    case 'move-as-child':
      return push(state, moveNodeAsChild(state.history.current, action.sourceId, action.targetId), action.sourceId);
    case 'move-as-sibling':
      return push(state, moveNodeAsSibling(state.history.current, action.sourceId, action.targetId, action.side), action.sourceId);
    case 'undo':
      return { ...state, history: undoHistory(state.history), selectedNodeId: null, movingNodeId: null };
    case 'replace-chart':
      return createInitialChartState(action.chart);
    case 'set-warning':
      return { ...state, warning: action.warning };
    default:
      return state;
  }
};
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm run test:run -- src/state/chartReducer.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/state/chartReducer.ts src/state/chartReducer.test.ts
git commit -m "feat: add orgchart editor reducer"
```

---

### Task 7: Password Gate and App Shell

**Files:**
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`
- Create: `src/components/AuthGate.tsx`
- Create: `src/components/AuthGate.test.tsx`

- [ ] **Step 1: Write AuthGate test**

Create `src/components/AuthGate.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthGate } from './AuthGate';

describe('AuthGate', () => {
  it('unlocks with the configured hash', async () => {
    const password = 'demo';
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
    const hashHex = Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
    const onUnlock = vi.fn();
    render(<AuthGate passwordHash={hashHex} onUnlock={onUnlock} />);
    await userEvent.type(screen.getByLabelText('Temporary password'), password);
    await userEvent.click(screen.getByRole('button', { name: 'Unlock editor' }));
    expect(onUnlock).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test:run -- src/components/AuthGate.test.tsx
```

Expected: FAIL because `AuthGate.tsx` does not exist.

- [ ] **Step 3: Implement AuthGate**

Create `src/components/AuthGate.tsx`:

```tsx
import { LockKeyhole } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface AuthGateProps {
  passwordHash: string;
  onUnlock: () => void;
}

const sha256Hex = async (value: string) => {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

export function AuthGate({ passwordHash, onUnlock }: AuthGateProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!passwordHash) {
      setError('Password hash is not configured for this build.');
      return;
    }
    if ((await sha256Hex(password)) === passwordHash) {
      sessionStorage.setItem('orgchart-builder.unlocked', 'true');
      onUnlock();
      return;
    }
    setError('Password does not match.');
  };

  return (
    <main className="auth-screen">
      <form className="auth-panel" onSubmit={submit}>
        <div className="auth-mark" aria-hidden="true"><LockKeyhole size={26} /></div>
        <h1>Orgchart Builder</h1>
        <p>This is a temporary frontend gate for a prototype. It is not server-side authentication.</p>
        <label>
          Temporary password
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoFocus />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit">Unlock editor</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 4: Create app shell**

Create `src/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles.css';
import '@xyflow/react/dist/style.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

Create `src/App.tsx`:

```tsx
import { useState } from 'react';
import { AuthGate } from './components/AuthGate';

export function App() {
  const [unlocked, setUnlocked] = useState(sessionStorage.getItem('orgchart-builder.unlocked') === 'true');
  const passwordHash = import.meta.env.VITE_APP_PASSWORD_HASH ?? '';

  if (!unlocked) {
    return <AuthGate passwordHash={passwordHash} onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <main className="workspace">
      <section className="empty-workspace">
        <h1>Orgchart Builder</h1>
        <p>Editor workspace loads in the next task.</p>
      </section>
    </main>
  );
}
```

Create `src/styles.css` with the auth screen and baseline workspace styles:

```css
:root {
  color: #111827;
  background: #f4f1ea;
  font-family: "Aptos", "Segoe UI", sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

button,
input,
select {
  font: inherit;
}

button {
  border: 0;
  cursor: pointer;
}

.auth-screen {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px;
  background:
    linear-gradient(90deg, rgba(17, 24, 39, 0.06) 1px, transparent 1px),
    linear-gradient(rgba(17, 24, 39, 0.06) 1px, transparent 1px),
    #f4f1ea;
  background-size: 28px 28px;
}

.auth-panel {
  width: min(420px, 100%);
  display: grid;
  gap: 18px;
  padding: 28px;
  background: #fffaf1;
  border: 1px solid #d7cdbc;
  box-shadow: 0 24px 70px rgba(55, 45, 31, 0.16);
}

.auth-mark {
  width: 54px;
  height: 54px;
  display: grid;
  place-items: center;
  background: #111827;
  color: #fffaf1;
}

.auth-panel h1 {
  margin: 0;
  font-size: 32px;
  line-height: 1.05;
}

.auth-panel p {
  margin: 0;
  color: #5b6472;
  line-height: 1.5;
}

.auth-panel label {
  display: grid;
  gap: 8px;
  font-weight: 700;
}

.auth-panel input {
  width: 100%;
  border: 1px solid #b7aa95;
  background: #fff;
  padding: 12px 13px;
}

.auth-panel button {
  padding: 13px 16px;
  background: #111827;
  color: #fff;
  font-weight: 800;
}

.form-error {
  color: #b42318;
  font-weight: 700;
}

.workspace {
  min-height: 100vh;
  background: #f6f3ed;
}

.empty-workspace {
  min-height: 100vh;
  display: grid;
  place-items: center;
  text-align: center;
}
```

- [ ] **Step 5: Run tests and build**

Run:

```bash
npm run test:run -- src/components/AuthGate.test.tsx
npm run build
```

Expected: both commands pass.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/main.tsx src/App.tsx src/styles.css src/components/AuthGate.tsx src/components/AuthGate.test.tsx
git commit -m "feat: add frontend password gate"
```

---

### Task 8: Editor Shell, Toolbar, and Panel

**Files:**
- Create: `src/components/Toolbar.tsx`
- Create: `src/components/EditorPanel.tsx`
- Create: `src/components/StatusBar.tsx`
- Create: `src/components/Toolbar.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write toolbar smoke test**

Create `src/components/Toolbar.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { Toolbar } from './Toolbar';

describe('Toolbar', () => {
  it('renders core editor controls', () => {
    render(
      <Toolbar
        search=""
        orientation="vertical"
        canUndo={false}
        onSearchChange={vi.fn()}
        onOrientationChange={vi.fn()}
        onUndo={vi.fn()}
        onReset={vi.fn()}
        onExport={vi.fn()}
        onImport={vi.fn()}
        onFitView={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('Search roles and people')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export JSON' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test:run -- src/components/Toolbar.test.tsx
```

Expected: FAIL because `Toolbar.tsx` does not exist.

- [ ] **Step 3: Implement toolbar**

Create `src/components/Toolbar.tsx`:

```tsx
import { Download, RotateCcw, Search, Undo2, Upload, View, Workflow } from 'lucide-react';
import type { ChartOrientation } from '../domain/orgchart';

interface ToolbarProps {
  search: string;
  orientation: ChartOrientation;
  canUndo: boolean;
  onSearchChange: (value: string) => void;
  onOrientationChange: (orientation: ChartOrientation) => void;
  onUndo: () => void;
  onReset: () => void;
  onExport: () => void;
  onImport: () => void;
  onFitView: () => void;
}

export function Toolbar(props: ToolbarProps) {
  return (
    <header className="toolbar">
      <div className="toolbar-brand">
        <Workflow size={22} />
        <span>Orgchart Builder</span>
      </div>
      <label className="toolbar-search">
        <Search size={17} />
        <input
          aria-label="Search roles and people"
          value={props.search}
          onChange={(event) => props.onSearchChange(event.target.value)}
          placeholder="Search role or person"
        />
      </label>
      <div className="segmented" aria-label="Layout orientation">
        <button className={props.orientation === 'vertical' ? 'active' : ''} onClick={() => props.onOrientationChange('vertical')}>Vertical</button>
        <button className={props.orientation === 'horizontal' ? 'active' : ''} onClick={() => props.onOrientationChange('horizontal')}>Horizontal</button>
      </div>
      <button className="icon-button" onClick={props.onFitView} aria-label="Fit view"><View size={17} /></button>
      <button className="text-button" onClick={props.onUndo} disabled={!props.canUndo}><Undo2 size={17} /> Undo</button>
      <button className="text-button" onClick={props.onImport}><Upload size={17} /> Import JSON</button>
      <button className="text-button" onClick={props.onExport}><Download size={17} /> Export JSON</button>
      <button className="text-button danger" onClick={props.onReset}><RotateCcw size={17} /> Reset</button>
    </header>
  );
}
```

- [ ] **Step 4: Implement editor panel**

Create `src/components/EditorPanel.tsx`:

```tsx
import { Trash2, MoveRight, X } from 'lucide-react';
import { CARD_COLOR_TOKENS, LEVEL_TYPES, STATUS_TYPES, type OrgNode, type SelectedNodePatch } from '../domain/orgchart';

interface EditorPanelProps {
  node: OrgNode | null;
  movingNodeId: string | null;
  onChange: (patch: SelectedNodePatch) => void;
  onDelete: (nodeId: string) => void;
  onStartMove: (nodeId: string) => void;
  onCancelMove: () => void;
  onClose: () => void;
}

export function EditorPanel({ node, movingNodeId, onChange, onDelete, onStartMove, onCancelMove, onClose }: EditorPanelProps) {
  if (!node) {
    return (
      <aside className="editor-panel empty">
        <p>Select a card to edit details.</p>
      </aside>
    );
  }

  return (
    <aside className="editor-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Selected card</span>
          <h2>{node.title}</h2>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close editor"><X size={18} /></button>
      </div>
      <label>Role title<input value={node.title} onChange={(event) => onChange({ title: event.target.value })} /></label>
      <label>Person<input value={node.person} onChange={(event) => onChange({ person: event.target.value })} /></label>
      <label>Level type<select value={node.levelType} onChange={(event) => onChange({ levelType: event.target.value as never })}>{LEVEL_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
      <label>Country<input value={node.country} onChange={(event) => onChange({ country: event.target.value })} /></label>
      <label>Regio<input value={node.regio} onChange={(event) => onChange({ regio: event.target.value })} /></label>
      <label>Status<select value={node.status} onChange={(event) => onChange({ status: event.target.value as never })}>{STATUS_TYPES.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
      <div className="swatches" aria-label="Card color">
        {CARD_COLOR_TOKENS.map((token) => (
          <button
            key={token.id}
            className={node.color === token.id ? 'swatch active' : 'swatch'}
            style={{ background: token.background, borderColor: token.border, color: token.text }}
            onClick={() => onChange({ color: token.id })}
          >
            {token.label}
          </button>
        ))}
      </div>
      <div className="panel-actions">
        {movingNodeId === node.id ? (
          <button className="text-button" onClick={onCancelMove}>Cancel move</button>
        ) : (
          <button className="text-button" onClick={() => onStartMove(node.id)}><MoveRight size={17} /> Move</button>
        )}
        <button className="text-button danger" onClick={() => onDelete(node.id)}><Trash2 size={17} /> Delete</button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 5: Implement status bar**

Create `src/components/StatusBar.tsx`:

```tsx
interface StatusBarProps {
  nodeCount: number;
  warning: string;
}

export function StatusBar({ nodeCount, warning }: StatusBarProps) {
  return (
    <footer className="status-bar">
      <span>{nodeCount} cards</span>
      <span>Changes are saved in this browser.</span>
      {warning && <strong>{warning}</strong>}
    </footer>
  );
}
```

- [ ] **Step 6: Wire shell in App**

Modify `src/App.tsx` to create reducer state from `SOURCE_ORGCHART`, load local storage on start, and render `Toolbar`, `EditorPanel`, and `StatusBar`. Use temporary placeholder `<section className="chart-placeholder">Chart canvas loads in Task 9.</section>` for the canvas.

- [ ] **Step 7: Add workspace CSS**

Append styles for `.toolbar`, `.toolbar-brand`, `.toolbar-search`, `.segmented`, `.text-button`, `.icon-button`, `.editor-panel`, `.panel-heading`, `.swatches`, `.swatch`, `.status-bar`, `.chart-placeholder`, and `.app-grid` to `src/styles.css`. Use compact controls, 8px or smaller radii, and avoid nested cards.

- [ ] **Step 8: Run tests and build**

Run:

```bash
npm run test:run -- src/components/Toolbar.test.tsx
npm run build
```

Expected: PASS.

- [ ] **Step 9: Commit**

Run:

```bash
git add src/App.tsx src/styles.css src/components/Toolbar.tsx src/components/Toolbar.test.tsx src/components/EditorPanel.tsx src/components/StatusBar.tsx
git commit -m "feat: add orgchart editor shell"
```

---

### Task 9: Orgchart Canvas and Card Rendering

**Files:**
- Create: `src/components/OrgChartCanvas.tsx`
- Create: `src/components/OrgNodeCard.tsx`
- Create: `src/components/OrgChartCanvas.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write canvas smoke test**

Create `src/components/OrgChartCanvas.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { SOURCE_ORGCHART } from '../data/sourceOrgchart';
import { OrgChartCanvas } from './OrgChartCanvas';

describe('OrgChartCanvas', () => {
  it('renders source orgchart cards', () => {
    render(
      <OrgChartCanvas
        chart={SOURCE_ORGCHART}
        orientation="vertical"
        selectedNodeId={null}
        movingNodeId={null}
        search=""
        onSelect={vi.fn()}
        onAddChild={vi.fn()}
        onMoveAsChild={vi.fn()}
        onMoveAsSibling={vi.fn()}
      />,
    );
    expect(screen.getByText('Chief HR Officer')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test:run -- src/components/OrgChartCanvas.test.tsx
```

Expected: FAIL because `OrgChartCanvas.tsx` does not exist.

- [ ] **Step 3: Implement custom node card**

Create `src/components/OrgNodeCard.tsx`:

```tsx
import { Plus } from 'lucide-react';
import { CARD_COLOR_TOKENS, type OrgNode } from '../domain/orgchart';

interface OrgNodeCardProps {
  node: OrgNode;
  selected: boolean;
  searchMatch: boolean;
  moving: boolean;
  onSelect: (nodeId: string) => void;
  onAddChild: (nodeId: string) => void;
}

export function OrgNodeCard({ node, selected, searchMatch, moving, onSelect, onAddChild }: OrgNodeCardProps) {
  const color = CARD_COLOR_TOKENS.find((token) => token.id === node.color) ?? CARD_COLOR_TOKENS[2];
  return (
    <div
      className={[
        'org-card',
        selected ? 'selected' : '',
        searchMatch ? 'search-match' : '',
        moving ? 'moving' : '',
        node.status === 'planned' ? 'planned' : '',
        node.status === 'vacant' ? 'vacant' : '',
      ].join(' ')}
      style={{ background: color.background, borderColor: color.border, color: color.text }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(node.id);
      }}
    >
      <div className="org-card-title">{node.title}</div>
      {node.person && <div className="org-card-person">{node.person}</div>}
      <div className="org-card-meta">
        <span>{node.levelType}</span>
        {node.country && <span>{node.country}</span>}
        {node.regio && <span>{node.regio}</span>}
      </div>
      <button className="add-child-button" onClick={(event) => { event.stopPropagation(); onAddChild(node.id); }} aria-label={`Add child under ${node.title}`}>
        <Plus size={16} />
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Implement canvas**

Create `src/components/OrgChartCanvas.tsx` using `@xyflow/react`. Convert `layoutChart()` results into React Flow nodes and edges, render `OrgNodeCard` inside custom node type, and call `fitView` after orientation changes.

The component props:

```ts
interface OrgChartCanvasProps {
  chart: OrgChartDocument;
  orientation: ChartOrientation;
  selectedNodeId: string | null;
  movingNodeId: string | null;
  search: string;
  onSelect: (nodeId: string | null) => void;
  onAddChild: (nodeId: string) => void;
  onMoveAsChild: (sourceId: string, targetId: string) => void;
  onMoveAsSibling: (sourceId: string, targetId: string, side: 'left' | 'right') => void;
}
```

Use `layoutChart(chart, orientation)` for positions. Use `fitView` through `useReactFlow()` in a child component or a `ReactFlowProvider` wrapper.

- [ ] **Step 5: Wire canvas in App**

Replace `chart-placeholder` in `src/App.tsx` with `OrgChartCanvas`. Pass reducer state and dispatch actions for select, add child, move as child, and move as sibling.

- [ ] **Step 6: Add card and canvas CSS**

Append styles for `.chart-canvas`, `.org-card`, `.org-card-title`, `.org-card-person`, `.org-card-meta`, `.add-child-button`, `.org-card.selected`, `.org-card.search-match`, `.org-card.planned`, and `.org-card.moving`.

- [ ] **Step 7: Run tests and build**

Run:

```bash
npm run test:run -- src/components/OrgChartCanvas.test.tsx
npm run build
```

Expected: PASS.

- [ ] **Step 8: Commit**

Run:

```bash
git add src/App.tsx src/styles.css src/components/OrgChartCanvas.tsx src/components/OrgChartCanvas.test.tsx src/components/OrgNodeCard.tsx
git commit -m "feat: render editable orgchart canvas"
```

---

### Task 10: Move Interactions, Import/Export, and Reset

**Files:**
- Modify: `src/components/OrgChartCanvas.tsx`
- Modify: `src/components/OrgNodeCard.tsx`
- Modify: `src/App.tsx`
- Modify: `src/state/storage.ts`
- Modify: `src/styles.css`
- Create: `src/components/AppFlow.test.tsx`

- [ ] **Step 1: Write app flow test**

Create `src/components/AppFlow.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App';

describe('App flow', () => {
  beforeEach(() => {
    sessionStorage.setItem('orgchart-builder.unlocked', 'true');
    localStorage.clear();
  });

  it('adds a child from a card plus button', async () => {
    render(<App />);
    await userEvent.click(screen.getByLabelText('Add child under CO-Chief Executive Officer'));
    expect(screen.getByText('New role')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails if plus is not wired**

Run:

```bash
npm run test:run -- src/components/AppFlow.test.tsx
```

Expected: FAIL until `OrgChartCanvas` and `App` wire `onAddChild` correctly.

- [ ] **Step 3: Implement click-to-move**

In `App.tsx`, when `movingNodeId` is set and the user clicks a different target card, dispatch `move-as-child` with `{ sourceId: movingNodeId, targetId }`. On invalid moves, catch the error and dispatch `set-warning` with the error message.

- [ ] **Step 4: Implement drag-and-drop drop zones**

In `OrgChartCanvas.tsx`, use React Flow `onNodeDragStart` and `onNodeDragStop`. On drag stop, find the target card under the dropped position. Compute the drop zone from the target card bounds:

```ts
const zoneFromPosition = (relativeX: number, width: number): 'left' | 'center' | 'right' => {
  if (relativeX < width * 0.28) return 'left';
  if (relativeX > width * 0.72) return 'right';
  return 'center';
};
```

Dispatch `onMoveAsChild(sourceId, targetId)` for center and `onMoveAsSibling(sourceId, targetId, zone)` for left/right.

- [ ] **Step 5: Implement import/export/reset**

In `storage.ts`, add:

```ts
export const downloadJson = (filename: string, json: string): void => {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
```

In `App.tsx`, add hidden file input for import. On import, read text, call `parseChartDocument`, confirm replacement, then dispatch `replace-chart`. On export, call `downloadJson('orgchart-builder-export.json', chartToJson(currentChart))`. On reset, confirm and replace with `SOURCE_ORGCHART`.

- [ ] **Step 6: Run tests and build**

Run:

```bash
npm run test:run
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add src/App.tsx src/styles.css src/components/OrgChartCanvas.tsx src/components/OrgNodeCard.tsx src/state/storage.ts src/components/AppFlow.test.tsx
git commit -m "feat: add move import export and reset flows"
```

---

### Task 11: Complete Source Dataset From Attachment

**Files:**
- Modify: `src/data/sourceOrgchart.ts`
- Modify: `src/data/sourceOrgchart.test.ts`
- Create: `docs/source-data-notes.md`

- [ ] **Step 1: Render and inspect the source PDF**

Use the already rendered preview at `tmp/pdfs/holding-orgchart-page1.png` or regenerate it from the PDF with PyMuPDF if the file is missing. Keep generated previews under `tmp/`, which is gitignored.

- [ ] **Step 2: Transcribe remaining visible cards**

Extend `SOURCE_ORGCHART.nodes` with every legible visible card from the PDF. Preserve these fields:

```ts
{
  id: 'stable-slug-role-person',
  parentId: 'stable-parent-id',
  title: 'Role title from PDF',
  person: 'Person name from PDF',
  levelType: 'holding',
  country: '',
  regio: '',
  color: 'standard',
  status: 'active',
  order: 10
}
```

Use `country` level type for country-specific rows such as CZ, SK, PL, DE, and HU. Use `regio` level type for roles explicitly marked regional. Use `planned` status and `planned` color for green dashed cards in the source. Use `regio` color for pink/purple dashed regional cards.

- [ ] **Step 3: Document transcription decisions**

Create `docs/source-data-notes.md`:

```markdown
# Source Data Notes

Source file: `C:/Users/ondrej.dolejs/AppData/Local/Temp/2026-04-01_Holding_Organizační struktura Holding (1).pdf`

The initial dataset was manually transcribed from the PDF because the MVP does not support PDF/VSD import. The source chart is wide and some labels are small; names that could not be read confidently are kept exactly as visible when legible.

Color mapping:
- Turquoise executive boxes: `executive`
- Light blue management boxes: `manager`
- White boxes: `standard`
- Green dashed boxes: `planned`
- Yellow country labels and country structural cards: `country`
- Pink/purple dashed regional cards: `regio`

Country/regio handling:
- Country and regio are editable node metadata.
- Country and regio can also appear as normal structural nodes when HR adds an extra level below the current bottom layer.
```

- [ ] **Step 4: Strengthen dataset tests**

Modify `src/data/sourceOrgchart.test.ts` so it asserts:

```ts
expect(SOURCE_ORGCHART.nodes.length).toBeGreaterThan(70);
expect(SOURCE_ORGCHART.nodes.some((node) => node.country === 'CZ')).toBe(true);
expect(SOURCE_ORGCHART.nodes.some((node) => node.country === 'SK')).toBe(true);
expect(SOURCE_ORGCHART.nodes.some((node) => node.country === 'PL')).toBe(true);
expect(SOURCE_ORGCHART.nodes.some((node) => node.levelType === 'regio' || node.regio)).toBe(true);
```

- [ ] **Step 5: Run dataset tests**

Run:

```bash
npm run test:run -- src/data/sourceOrgchart.test.ts
```

Expected: PASS with the completed dataset.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/data/sourceOrgchart.ts src/data/sourceOrgchart.test.ts docs/source-data-notes.md
git commit -m "data: add source orgchart dataset"
```

---

### Task 12: GitHub Pages Deployment and Final Verification

**Files:**
- Create: `.github/workflows/deploy-pages.yml`
- Create: `README.md`
- Modify: `vite.config.ts` if the final GitHub repository name differs from `orgchart_builder`

- [ ] **Step 1: Add deployment workflow**

Create `.github/workflows/deploy-pages.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [master, main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
        env:
          VITE_APP_PASSWORD_HASH: ${{ secrets.VITE_APP_PASSWORD_HASH }}
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Add README**

Create `README.md`:

```markdown
# Orgchart Builder

Temporary static prototype for editing a holding orgchart in the browser.

## Security note

This app uses a frontend password gate only. It is not real authentication. The static bundle and embedded orgchart data can be inspected by anyone with access to the published GitHub Pages files. Use this only as a temporary prototype.

## Local development

```bash
npm install
npm run dev
```

## Password hash

Set `VITE_APP_PASSWORD_HASH` to a SHA-256 hex hash of the temporary password.

PowerShell example:

```powershell
$password = "change-me"
$bytes = [System.Text.Encoding]::UTF8.GetBytes($password)
$hash = [System.Security.Cryptography.SHA256]::HashData($bytes)
($hash | ForEach-Object { $_.ToString("x2") }) -join ""
```

## Build

```bash
npm run test:run
npm run build
```

## GitHub Pages

Add repository secret `VITE_APP_PASSWORD_HASH`, then enable GitHub Pages with GitHub Actions as the source.
```

- [ ] **Step 3: Run full verification**

Run:

```bash
npm run test:run
npm run typecheck
npm run build
```

Expected: all commands pass.

- [ ] **Step 4: Run local preview**

Run:

```bash
npm run dev
```

Open the local URL. Verify:
- Password screen renders.
- After unlock, chart renders.
- Search highlights a role.
- Plus creates `New role`.
- Editor panel updates title, person, country, regio, color, and status.
- Click-to-move reassigns a card under another card.
- Drag center makes a child relationship.
- Drag side reorders siblings.
- Export downloads JSON.
- Import accepts exported JSON.
- Reset restores source data.
- Undo reverses a recent change.

- [ ] **Step 5: Commit**

Run:

```bash
git add .github/workflows/deploy-pages.yml README.md vite.config.ts
git commit -m "chore: add github pages deployment"
```

---

## Plan Self-Review

Spec coverage:
- Public GitHub Pages with frontend password is covered in Tasks 7 and 12.
- Manual editing of the attached orgchart is covered in Tasks 2, 9, 10, and 11.
- Add-level plus interaction is covered in Tasks 9 and 10.
- Click-to-move and drag-and-drop with drop zones are covered in Task 10.
- Editable role, person, level type, country, regio, and color are covered in Task 8.
- Local persistence, JSON import/export, reset, and undo are covered in Tasks 4, 6, 8, and 10.
- GitHub repo readiness and GitHub Pages deployment are covered in Task 12.

Placeholder scan:
- No task depends on PDF/VSD runtime import.
- No task leaves a code module unnamed.
- Source data completion is a concrete transcription task against the provided PDF, with integrity tests requiring country and regio coverage.

Type consistency:
- `OrgChartDocument`, `OrgNode`, `OrgNodeLevelType`, `OrgNodeStatus`, and `ChartOrientation` are defined once in `src/domain/orgchart.ts`.
- Reducer actions call the exact operation names from `src/domain/chartOperations.ts`.
- UI props pass `ChartOrientation` and `OrgChartDocument` consistently.
