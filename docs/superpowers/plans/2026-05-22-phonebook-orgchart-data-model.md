# Phonebook Orgchart Data Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the orgchart dataset in line with Phonebook for B levels and employee metadata while preserving role-scope country filtering and making the Phonebook hierarchy decision explicit.

**Architecture:** Treat Phonebook as authoritative for employee metadata and B levels, but keep role scope separate from employee country. Add Phonebook fields first, update validation/tests, then apply source data corrections. Keep parent migration as a deliberate follow-up because PDF parent links and Phonebook manager links represent different hierarchy semantics.

**Tech Stack:** TypeScript, React, Vitest, existing source dataset in `src/data/sourceOrgchart.ts`, validation in `src/domain/chartValidation.ts`.

---

## File Structure

- Modify `src/domain/orgchart.ts`: add `BXX` support and optional Phonebook metadata fields.
- Modify `src/domain/chartValidation.ts`: validate new level and optional metadata fields.
- Modify `src/domain/chartValidation.test.ts`: cover `BXX`, valid metadata, and invalid metadata.
- Modify `src/data/sourceOrgchart.ts`: update B levels and add Phonebook metadata for matched source people.
- Modify `src/data/sourceOrgchart.test.ts`: assert the verified Phonebook corrections and the three unmatched source people.
- Modify `src/domain/countryFilter.test.ts`: confirm role-scope filtering is not affected by employee country.
- Modify `src/components/OrgNodeCard.tsx`: display `BXX` safely using the same level badge path as other B levels.
- Create `src/components/OrgNodeCard.test.tsx`: cover `BXX` badge rendering.
- Modify `src/components/EditorPanel.tsx`: keep country editing as role scope; do not expose employee country as an editable replacement for role scope.
- Modify `docs/DATA-MODEL.md`: document role scope vs employee country and Phonebook B-level authority.

## Task 1: Extend Domain Types For Phonebook Metadata

**Files:**
- Modify: `src/domain/orgchart.ts`
- Modify: `src/domain/chartValidation.ts`
- Test: `src/domain/chartValidation.test.ts`

- [ ] **Step 1: Write failing validation tests**

Add these tests to `src/domain/chartValidation.test.ts`:

```typescript
it('accepts BXX as a valid level type', () => {
  const chart = validChart();

  const importedChart = {
    ...chart,
    nodes: chart.nodes.map((node) =>
    node.id === 'child' ? { ...node, levelType: 'BXX' } : node,
    ),
  };

  expect(isChartDocument(importedChart)).toBe(true);
  expect(parseChartDocument(JSON.stringify(importedChart))).toEqual(importedChart);
});

it('accepts optional Phonebook employee metadata', () => {
  const chart = validChart();

  chart.nodes = chart.nodes.map((node) =>
    node.id === 'child'
      ? {
          ...node,
          phonebookPin: '110859',
          employeeCountry: 'CZ',
          companyId: '23',
          companyName: 'AURES Holdings a. s.',
          phonebookManagerPin: '1152',
        }
      : node,
  );

  expect(validateChartDocument(chart)).toEqual([]);
});

it('rejects invalid Phonebook employee country metadata', () => {
  const chart = validChart();

  const importedChart = {
    ...chart,
    nodes: chart.nodes.map((node) =>
    node.id === 'child' ? { ...node, employeeCountry: 'AT' as never } : node,
    ),
  };

  expect(isChartDocument(importedChart)).toBe(false);
  expect(validateChartDocument(importedChart as OrgChartDocument)).toContain(
    'Node child has invalid employee country AT.',
  );
});
```

- [ ] **Step 2: Run the focused tests to verify failure**

Run:

```bash
npm run test:run -- src/domain/chartValidation.test.ts
```

Expected:
- The `BXX` test fails because `LEVEL_TYPES` does not include `BXX`.
- The invalid employee country test fails because metadata is not validated yet.

- [ ] **Step 3: Update the domain type**

In `src/domain/orgchart.ts`, change the level list and extend `OrgNode`:

```typescript
export const LEVEL_TYPES = ['B-0', 'B-1', 'B-2', 'B-3', 'B-4', 'BXX'] as const;
```

Add these optional fields to `OrgNode`:

```typescript
  phonebookPin?: string;
  employeeCountry?: CountryCode;
  companyId?: string;
  companyName?: string;
  phonebookManagerPin?: string;
```

- [ ] **Step 4: Validate the new metadata fields**

In `src/domain/chartValidation.ts`, add an error for invalid `employeeCountry`:

```typescript
    if (node.employeeCountry !== undefined && !countryCodes.has(node.employeeCountry)) {
      errors.push(`Node ${node.id} has invalid employee country ${node.employeeCountry}.`);
    }
```

Place this in the per-node validation loop near the existing `countries` validation.

Also extend `isValidNode` so imports reject invalid metadata before parsing:

```typescript
    (value.phonebookPin === undefined || isString(value.phonebookPin)) &&
    (value.employeeCountry === undefined ||
      (isString(value.employeeCountry) && countryCodes.has(value.employeeCountry as CountryCode))) &&
    (value.companyId === undefined || isString(value.companyId)) &&
    (value.companyName === undefined || isString(value.companyName)) &&
    (value.phonebookManagerPin === undefined || isString(value.phonebookManagerPin)) &&
```

Place these checks after the existing `countries` check.

- [ ] **Step 5: Run the focused tests**

Run:

```bash
npm run test:run -- src/domain/chartValidation.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain/orgchart.ts src/domain/chartValidation.ts src/domain/chartValidation.test.ts
git commit -m "feat: add phonebook org metadata"
```

## Task 2: Apply Verified Phonebook B Levels

**Files:**
- Modify: `src/data/sourceOrgchart.ts`
- Test: `src/data/sourceOrgchart.test.ts`

- [ ] **Step 1: Add failing source-data assertions**

Add this test to `src/data/sourceOrgchart.test.ts`:

```typescript
it('uses Phonebook B levels for verified rows', () => {
  const expectedLevels = new Map([
    ['call-centre-manager-praha-petr-vik', 'B-3'],
    ['call-centre-manager-ostrava-jan-kovar', 'B-3'],
    ['group-export-import-director-dusan-prochazka', 'B-2'],
    ['import-manager-filip-kvarda', 'B-3'],
    ['general-manager-export-robert-radler', 'B-3'],
    ['country-payroll-manager-czsk-jitka-horejsi', 'B-3'],
    ['hr-team-leader-jan-jarma', 'B-4'],
    ['general-manager-mototechna-2-michal-gabrhel', 'B-3'],
    ['head-of-bi-petronela-hubocanova', 'B-3'],
    ['office-manager-renata-liskova', 'B-3'],
    ['group-marketing-operations-manager-david-reich', 'B-1'],
    ['group-pr-manager-lucie-brychtova', 'B-3'],
    ['group-web-manager-czskplhu-ondrej-bober', 'B-3'],
    ['group-segment-manager-david-chvojka', 'B-3'],
    ['regional-marketing-manager-michal-krulis', 'BXX'],
    ['cars-administration-manager-michaela-beckova', 'B-3'],
    ['group-back-office-manager-pavla-smrckova', 'B-3'],
    ['back-office-manager-pl-agnieszka-romanska', 'B-3'],
    ['country-sales-manager-sk-martin-medek', 'B-2'],
    ['country-buying-manager-sk-robert-wiedner', 'B-2'],
    ['country-stock-manager-sk-bronislav-kroneisl', 'B-2'],
    ['country-service-manager-sk-michal-kossi', 'B-2'],
    ['country-fi-manager-sk-martin-bulicek', 'B-2'],
    ['facility-construction-manager-sk-pavol-rodina', 'BXX'],
    ['financial-accounting-manager-sk-danko-beran', 'B-2'],
    ['country-sales-manager-pl-jiri-vavra', 'B-2'],
    ['country-ops-manager-pl-lukas-jonsta', 'B-2'],
    ['country-stock-manager-pl-david-poncza', 'B-2'],
    ['country-service-manager-pl-filip-pavlovcin', 'B-2'],
    ['call-centre-manager-pl-kaminski-krystian', 'B-3'],
    ['country-hq-manager-pl-michal-wlodarczyk', 'B-3'],
    ['country-fi-relationship-manager-pl-pawel-molasy', 'B-2'],
    ['regional-marketing-manager-pl-marian-zielina', 'BXX'],
    ['development-manager-pl-weronika-szmanda', 'BXX'],
    ['country-personnel-staffing-manager-pl-barbara-wolska', 'B-3'],
    ['financial-accounting-manager-pl-cegiel-klemens', 'B-2'],
    ['back-office-manager-pl-country-agnieszka-romanska', 'B-3'],
    ['swap-manager-de-michal-valka', 'B-3'],
    ['country-buying-manager-hu-ondrej-suba', 'B-3'],
  ]);

  for (const [id, levelType] of expectedLevels) {
    expect(SOURCE_ORGCHART.nodes.find((node) => node.id === id)?.levelType).toBe(levelType);
  }
});
```

- [ ] **Step 2: Run the focused test to verify failure**

Run:

```bash
npm run test:run -- src/data/sourceOrgchart.test.ts
```

Expected: FAIL on the current mismatched B levels.

- [ ] **Step 3: Update source B levels**

In `src/data/sourceOrgchart.ts`, update only the `levelType` values listed in the test. Do not change `country`, `countries`, `parentId`, or `order` in this task.

- [ ] **Step 4: Run the source data tests**

Run:

```bash
npm run test:run -- src/data/sourceOrgchart.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/sourceOrgchart.ts src/data/sourceOrgchart.test.ts
git commit -m "fix: align orgchart B levels with phonebook"
```

## Task 3: Add Phonebook Metadata To Source Rows

**Files:**
- Modify: `src/data/sourceOrgchart.ts`
- Test: `src/data/sourceOrgchart.test.ts`

- [ ] **Step 1: Add focused metadata assertions**

Add this test to `src/data/sourceOrgchart.test.ts`:

```typescript
it('keeps role scope separate from employee country metadata', () => {
  const nodeById = new Map(SOURCE_ORGCHART.nodes.map((node) => [node.id, node]));

  expect(nodeById.get('swap-manager-de-michal-valka')).toMatchObject({
    country: 'DE',
    employeeCountry: 'CZ',
    companyId: '23',
  });

  expect(nodeById.get('group-web-manager-czskplhu-ondrej-bober')).toMatchObject({
    country: 'CZ/SK/PL/HU',
    employeeCountry: 'SK',
  });
});

it('records Phonebook manager pins without changing the PDF parent tree', () => {
  const janJarma = SOURCE_ORGCHART.nodes.find((node) => node.id === 'hr-team-leader-jan-jarma');

  expect(janJarma).toMatchObject({
    parentId: 'group-personnel-payroll-manager-martina-kahulova',
    phonebookManagerPin: '1152',
  });
});
```

- [ ] **Step 2: Run the focused test to verify failure**

Run:

```bash
npm run test:run -- src/data/sourceOrgchart.test.ts
```

Expected: FAIL because the metadata fields are not present.

- [ ] **Step 3: Add metadata for the audited rows**

For each matched source person, add:

```typescript
phonebookPin: '<PIN>',
employeeCountry: '<CZ|SK|PL|DE|HU>',
companyId: '<company_id>',
companyName: '<company_name>',
phonebookManagerPin: '<gid_mana>',
```

Start with the rows touched by Task 2 and the rows used in the tests. Keep this metadata non-editable in the UI until a later product decision.

- [ ] **Step 4: Run source and validation tests**

Run:

```bash
npm run test:run -- src/data/sourceOrgchart.test.ts src/domain/chartValidation.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/sourceOrgchart.ts src/data/sourceOrgchart.test.ts
git commit -m "feat: annotate source orgchart with phonebook metadata"
```

## Task 4: Preserve Country Filtering As Role Scope

**Files:**
- Modify: `src/domain/countryFilter.test.ts`
- Modify: `src/components/EditorPanel.tsx`
- Modify: `src/components/OrgNodeCard.tsx`
- Create: `src/components/OrgNodeCard.test.tsx`

- [ ] **Step 1: Add a country-filter regression test**

Add this test to `src/domain/countryFilter.test.ts`:

```typescript
it('filters by role scope, not employee country metadata', () => {
  const root = node('root', null);
  const deRoleWithCzEmployee = {
    ...node('swap', 'root', 'DE'),
    employeeCountry: 'CZ' as const,
  };

  const chart = { schemaVersion: 5 as const, name: 'test', updatedAt: new Date().toISOString(), nodes: [root, deRoleWithCzEmployee] };

  expect(filterChartByCountry(chart, 'CZ').nodes.map((item) => item.id)).toEqual([]);
  expect(filterChartByCountry(chart, 'all').nodes.map((item) => item.id)).toContain('swap');
});
```

- [ ] **Step 2: Run the test to verify current behavior**

Run:

```bash
npm run test:run -- src/domain/countryFilter.test.ts
```

Expected: PASS if filtering already ignores employee metadata. If it fails, fix `getNodeCountries` to only use `country` / `countries`.

- [ ] **Step 3: Clarify UI labels without changing behavior**

In `src/components/EditorPanel.tsx`, keep the editable country control bound to `country` / `countries`. Rename visible helper text or labels from generic country wording to role-scope wording where the UI currently implies employee country.

Use concise copy:

```typescript
Role scope
```

Do not add an editable `employeeCountry` control.

- [ ] **Step 4: Ensure cards render BXX**

Create `src/components/OrgNodeCard.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { OrgNodeCard } from './OrgNodeCard';
import type { OrgNode } from '../domain/orgchart';

const node: OrgNode = {
  id: 'bxx-node',
  parentId: 'root',
  title: 'Regional Marketing Manager',
  person: 'Michal Kruliš',
  levelType: 'BXX',
  country: 'CZ',
  regio: '',
  color: 'standard',
  status: 'active',
  order: 10,
};

describe('OrgNodeCard', () => {
  it('renders BXX as a level badge', () => {
    render(
      <OrgNodeCard
        node={node}
        selected={false}
        searchMatch={false}
        moving={false}
        draft={false}
        dropTarget={false}
        dropMode={null}
        dropAllowed={false}
        onSelect={vi.fn()}
        onAddChild={vi.fn()}
      />,
    );

    expect(screen.getByText('BXX')).toBeInTheDocument();
    expect(screen.getByLabelText('Úroveň BXX')).toBeInTheDocument();
  });
});
```

Then inspect `src/components/OrgNodeCard.tsx`. If the component maps level colors explicitly, add a `BXX` fallback using the neutral style. If it already derives the badge class generically from `node.levelType`, keep the component unchanged.

- [ ] **Step 5: Run component and country tests**

Run:

```bash
npm run test:run -- src/domain/countryFilter.test.ts src/components/EditorPanel.test.tsx src/components/OrgNodeCard.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain/countryFilter.test.ts src/components/EditorPanel.tsx src/components/OrgNodeCard.tsx
git commit -m "fix: keep country filters scoped to role coverage"
```

## Task 5: Document Phonebook Authority And Parent Semantics

**Files:**
- Modify: `docs/DATA-MODEL.md`
- Modify: `docs/HANDOFF.md`

- [ ] **Step 1: Update data model wording**

In `docs/DATA-MODEL.md`, replace the current B-level semantic section with:

```markdown
## LEVEL_TYPES (B-levels)

`levelType` is the B level used by Phonebook. Phonebook fields `str21_dop` / `OData__x0053_TR21` are authoritative for seeded source data.

Allowed values:
- `B-0`
- `B-1`
- `B-2`
- `B-3`
- `B-4`
- `BXX`

Do not infer B level from country rows. SK and PL country roles can be `B-2`, `B-3`, or `BXX` depending on Phonebook.
```

- [ ] **Step 2: Add country semantics**

In `docs/DATA-MODEL.md`, add:

```markdown
`country` / `countries` represent role scope used by app filtering. They do not represent employee legal-entity country.

Phonebook employee metadata is stored separately:
- `employeeCountry`
- `companyId`
- `companyName`
- `phonebookPin`
- `phonebookManagerPin`
```

- [ ] **Step 3: Add parent semantics**

In `docs/HANDOFF.md`, add:

```markdown
Phonebook manager relationships and PDF/source parent links differ. The source `parentId` still represents the current app tree. `phonebookManagerPin` records the authoritative Phonebook manager for future migration or a dedicated Phonebook hierarchy view.
```

- [ ] **Step 4: Run documentation-adjacent checks**

Run:

```bash
npm run test:run -- src/data/sourceOrgchart.test.ts src/domain/chartValidation.test.ts src/domain/countryFilter.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add docs/DATA-MODEL.md docs/HANDOFF.md
git commit -m "docs: document phonebook orgchart semantics"
```

## Task 6: Decide Whether To Migrate Parent Links

**Files:**
- Modify after decision: `src/data/sourceOrgchart.ts`
- Modify after decision: `src/data/sourceParentOverrides.json`
- Test after decision: `src/data/sourceOrgchart.test.ts`

- [ ] **Step 1: Keep this as an explicit product decision**

Use the audit counts:
- 53 same source parent and Phonebook manager.
- 17 self/empty manager patterns.
- 48 different manager links.

Do not batch-change `parentId` in the B-level metadata task.

- [ ] **Step 2: If Phonebook hierarchy becomes the source of truth, add a separate failing test**

Add this test only after the decision is confirmed:

```typescript
it('uses Phonebook manager hierarchy for selected country roles', () => {
  const nodeById = new Map(SOURCE_ORGCHART.nodes.map((node) => [node.id, node]));

  expect(nodeById.get('country-sales-manager-sk-martin-medek')?.parentId).toBe(
    'group-car-sales-director-daniel-lunacek',
  );
  expect(nodeById.get('country-buying-manager-sk-robert-wiedner')?.parentId).toBe(
    'group-purchasing-director-zdenek-batek',
  );
  expect(nodeById.get('country-ops-manager-pl-lukas-jonsta')?.parentId).toBe(
    'group-automotiveops-director-leos-pilnaj',
  );
});
```

- [ ] **Step 3: Apply parent migration only in a dedicated change**

Update `parentId` values from Phonebook manager mappings, then rerun:

```bash
npm run test:run -- src/data/sourceOrgchart.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/data/sourceOrgchart.ts src/data/sourceParentOverrides.json src/data/sourceOrgchart.test.ts
git commit -m "feat: migrate orgchart parents to phonebook hierarchy"
```

## Self-Review

- Spec coverage: The plan covers country semantics, B-level correction including `BXX`, Phonebook metadata, title/parent audit outcomes, and documentation.
- Placeholder scan: No unfinished placeholder markers are used.
- Type consistency: `employeeCountry`, `companyId`, `companyName`, `phonebookPin`, and `phonebookManagerPin` are introduced in Task 1 and reused consistently in later tasks.
