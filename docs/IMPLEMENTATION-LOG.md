# Implementation Log

Last updated: 2026-05-22

## Rule

After every completed task, update this file with:
- status
- changed files
- verification command and result
- next task

Primary priority: the source orgchart tree must match the provided source files. Do not guess parent-child links. If a relationship cannot be proved from the source geometry, record it as unresolved instead of silently wiring it.

## Task Checklist

- [x] Task 1: MD checkpoint system
- [x] Task 2: Strengthen source audit extraction and docs
- [x] Task 3: Add reliability tests before production changes
- [x] Task 4: Implement schema v4, source positions, and source/tree layout
- [x] Task 5: Polish DnD visual behavior and persisted manual positions
- [x] Task 6: Final verification and handoff update
- [x] Task 7: Add failing data reliability tests for confirmed parent overrides
- [x] Task 8: Implement schema v5 and confirmed parent override layer
- [x] Task 9: Strengthen PDF audit ambiguity reporting and regenerate audit artifacts
- [x] Task 10: Final verification and handoff update
- [x] Task 11: Add failing functional DnD tests
- [x] Task 12: Implement Auto strom preference and deterministic DnD intent resolution
- [x] Task 13: Verify functional DnD workflow
- [x] Task 14: Add failing DnD card-geometry regression test
- [x] Task 15: Implement card-geometry DnD intent resolution
- [x] Task 16: Final DnD verification and handoff update
- [x] Task 17: Add failing country-filter tests
- [x] Task 18: Implement country model, helper functions, reducer state
- [x] Task 19: Wire country filter into toolbar, editor, and app view
- [x] Task 20: Verify country filter and update handoff

## Checkpoints

### Task 1: MD checkpoint system

Status: complete

Changed files:
- `docs/IMPLEMENTATION-LOG.md`
- `docs/HANDOFF.md`

Verification:
- `Get-Content docs\IMPLEMENTATION-LOG.md` and `Get-Content docs\HANDOFF.md -Head 12` confirmed the checkpoint file and handoff pointer exist.

Next task:
- Strengthen source audit extraction and docs.

### Task 2: Strengthen source audit extraction and docs

Status: complete

Changed files:
- `scripts/audit_pdf_orgchart.py`
- `docs/audits/pdf-orgchart-audit.json`
- `docs/audits/pdf-orgchart-audit.md`
- `src/data/sourceAudit.test.ts`

Verification:
- RED: `npm run test:run -- src/data/sourceAudit.test.ts` failed because `sourceNodeMatches` and `sourceEdgeEvidence` were missing.
- Generated audit: `python scripts\audit_pdf_orgchart.py`.
- GREEN: `npm run test:run -- src/data/sourceAudit.test.ts` passed 2 tests.

Audit status:
- PDF cards: 121
- Source nodes: 118
- Supported source edges by same connector component: 111
- Unsupported source edges: 2
- Skipped source edges: 4

Next task:
- Add reliability tests for schema v4, source positions, critical relationships, layout mode, and persisted DnD positions.

### Task 3: Add reliability tests before production changes

Status: complete

Changed files:
- `src/data/sourceOrgchart.test.ts`
- `src/domain/chartLayout.test.ts`
- `src/domain/chartOperations.test.ts`
- `src/state/chartReducer.test.ts`
- `src/components/Toolbar.test.tsx`

Verification:
- RED: `npm run test:run -- src/data/sourceOrgchart.test.ts src/domain/chartLayout.test.ts src/domain/chartOperations.test.ts src/state/chartReducer.test.ts src/components/Toolbar.test.tsx`
- Expected result observed: 7 failures covering schema v4, missing source positions, source layout mode, reducer layout mode, persisted drop position, and toolbar layout switch.

Next task:
- Implement schema v4, source positions, source/tree layout, and reducer support.

### Task 4: Implement schema v4, source positions, and source/tree layout

Status: complete

Changed files:
- `src/domain/orgchart.ts`
- `src/domain/chartValidation.ts`
- `src/domain/chartLayout.ts`
- `src/domain/chartOperations.ts`
- `src/state/chartReducer.ts`
- `src/data/sourceOrgchart.ts`
- `src/data/sourcePositions.ts`
- `src/App.tsx`
- `src/components/Toolbar.tsx`
- `src/components/OrgChartCanvas.tsx`
- `src/i18n/messages.ts`
- related tests
- `docs/DATA-MODEL.md`

Verification:
- `npm run test:run -- src/data/sourceOrgchart.test.ts src/domain/chartLayout.test.ts src/domain/chartOperations.test.ts src/state/chartReducer.test.ts src/components/Toolbar.test.tsx`
- Result: 5 test files passed, 47 tests passed.

Next task:
- Polish DnD visual behavior and persisted manual positions in the source layout.

### Task 5: Polish DnD visual behavior and persisted manual positions

Status: complete

Changed files:
- `src/components/OrgChartCanvas.tsx`
- `src/components/OrgChartCanvas.test.tsx`
- `src/styles.css`

Verification:
- RED: `npm run test:run -- src/components/OrgChartCanvas.test.tsx` failed because `mergeDraggedNodePosition` did not exist.
- GREEN: `npm run test:run -- src/components/OrgChartCanvas.test.tsx` passed 4 tests.

Next task:
- Run full verification and update final handoff/checkpoint docs.

### Task 6: Final verification and handoff update

Status: complete

Changed files:
- `docs/IMPLEMENTATION-LOG.md`
- `docs/HANDOFF.md`

Verification:
- `npm run test:run` passed 15 test files and 89 tests.
- `npm run build` passed.
- Local dev server started on `http://127.0.0.1:5176/index.html`.

Remaining data audit risk:
- The current automated PDF connector evidence reports 0 unsupported source edges.
- The 4 skipped source edges are the synthetic root links; the root has no person/PDF card and is hidden in PDF source layout.

Next task:
- If continuing, review duplicate visual PDF cards and decide whether to model them as aliases or separate visible nodes.

### Task 7: Add failing data reliability tests for confirmed parent overrides

Status: complete

Changed files:
- `src/data/sourceOrgchart.test.ts`
- `src/data/sourceAudit.test.ts`

Verification:
- RED: `npm run test:run -- src/data/sourceOrgchart.test.ts src/data/sourceAudit.test.ts`
- Expected result observed: 4 failures covering schema v5, Jan Jarma parent, missing confirmed override audit status, and missing unresolved ambiguity summary.

Next task:
- Implement schema v5 and the confirmed parent override layer.

### Task 8: Implement schema v5 and confirmed parent override layer

Status: complete

Changed files:
- `src/data/sourceParentOverrides.json`
- `src/data/sourceOrgchart.ts`
- `src/domain/orgchart.ts`
- `src/domain/chartValidation.ts`
- schema fixture tests

Verification:
- `npm run test:run -- src/data/sourceOrgchart.test.ts src/domain/chartValidation.test.ts src/state/storage.test.ts src/domain/chartLayout.test.ts src/domain/chartOperations.test.ts src/domain/chartHistory.test.ts`
- Result: 6 test files passed, 50 tests passed.

Next task:
- Strengthen PDF audit ambiguity reporting and regenerate audit artifacts.

### Task 9: Strengthen PDF audit ambiguity reporting and regenerate audit artifacts

Status: complete

Changed files:
- `scripts/audit_pdf_orgchart.py`
- `docs/audits/pdf-orgchart-audit.json`
- `docs/audits/pdf-orgchart-audit.md`
- `src/data/sourceAudit.test.ts`

Verification:
- `python scripts\audit_pdf_orgchart.py`
- Result: `sourceEdgesResolvedByConfirmedOverride: 1`, `sourceEdgesAmbiguous: 0`, `sourceEdgesNotInSameConnectorComponent: 0`, `parentOverrideErrors: 0`, `unresolvedParentLinks: 0`.
- `npm run test:run -- src/data/sourceAudit.test.ts src/data/sourceOrgchart.test.ts`
- Result: 2 test files passed, 15 tests passed.

Next task:
- Update handoff/data model docs and run full verification.

### Task 10: Final verification and handoff update

Status: complete

Changed files:
- `docs/IMPLEMENTATION-LOG.md`
- `docs/HANDOFF.md`
- `docs/DATA-MODEL.md`

Verification:
- `python scripts\audit_pdf_orgchart.py`
- Result: `sourceEdgesResolvedByConfirmedOverride: 1`, `sourceEdgesAmbiguous: 0`, `sourceEdgesNotInSameConnectorComponent: 0`, `parentOverrideErrors: 0`, `unresolvedParentLinks: 0`.
- `npm run test:run`
- Result: 15 test files passed, 92 tests passed.
- `npm run build`
- Result: TypeScript and Vite production build completed successfully.

Next task:
- Review and push/commit the current working tree if deployment should update GitHub Pages.

### Task 11: Add failing functional DnD tests

Status: complete

Changed files:
- `src/state/chartReducer.test.ts`
- `src/state/storage.test.ts`
- `src/components/OrgChartCanvas.test.tsx`
- `docs/IMPLEMENTATION-LOG.md`

Verification:
- RED: `npm run test:run -- src/state/chartReducer.test.ts src/state/storage.test.ts src/components/OrgChartCanvas.test.tsx`
- Expected result observed: 6 failures covering Auto strom default, structural DnD layout switching, missing layout preference storage, and missing deterministic `resolveDropIntent`.

Next task:
- Implement Auto strom preference storage and deterministic DnD intent resolution.

### Task 12: Implement Auto strom preference and deterministic DnD intent resolution

Status: complete

Changed files:
- `src/state/storage.ts`
- `src/state/chartReducer.ts`
- `src/App.tsx`
- `src/components/OrgChartCanvas.tsx`
- `docs/HANDOFF.md`
- `docs/DATA-MODEL.md`

Verification:
- `npm run test:run -- src/state/chartReducer.test.ts src/state/storage.test.ts src/components/OrgChartCanvas.test.tsx`
- Result: 3 test files passed, 31 tests passed.

Next task:
- Run full verification and browser smoke for the functional DnD workflow.

### Task 13: Verify functional DnD workflow

Status: complete

Changed files:
- `docs/IMPLEMENTATION-LOG.md`
- `docs/HANDOFF.md`

Verification:
- `npm run test:run`
- Result: 15 test files passed, 98 tests passed.
- `npm run build`
- Result: TypeScript and Vite production build completed successfully.

Browser smoke:
- Attempted local dev server launch for Playwright smoke, but Windows process launch failed/stalled in this environment (`Start-Process` duplicated `PATH`; fallback shell start was interrupted). No code files were changed by that attempt.

Next task:
- Commit and push when ready for GitHub Pages deployment.

### Task 14: Add failing DnD card-geometry regression test

Status: complete

Changed files:
- `src/components/OrgChartCanvas.test.tsx`
- `docs/IMPLEMENTATION-LOG.md`

Verification:
- RED: `npm run test:run -- src/components/OrgChartCanvas.test.tsx`
- Expected result observed: 1 failure. `resolveDropIntent` returns `null` when `David Hlavnicka` is visually below `Jan Sokola` but the cursor is outside Jan's old inflated cursor-only zone.

Next task:
- Implement DnD intent resolution from the dragged card rectangle, not only the cursor.

### Task 15: Implement card-geometry DnD intent resolution

Status: complete

Changed files:
- `src/components/OrgChartCanvas.tsx`
- `src/components/OrgChartCanvas.test.tsx`
- `src/state/chartReducer.test.ts`
- `docs/IMPLEMENTATION-LOG.md`

Verification:
- GREEN: `npm run test:run -- src/components/OrgChartCanvas.test.tsx src/state/chartReducer.test.ts`
- Result: 2 test files passed, 26 tests passed.

Implementation notes:
- `resolveDropIntent` now scores candidates from the dragged card rectangle and keeps cursor-only detection only as a secondary signal.
- Active drag/drag-stop calls merge the live React Flow node position into the resolver input before computing preview or committing the drop.
- Added exact regression coverage for `David Hlavnicka` under `Jan Sokola`, including state persistence after drop.

Next task:
- Run full test/build verification and update handoff docs.

### Task 16: Final DnD verification and handoff update

Status: complete

Changed files:
- `docs/IMPLEMENTATION-LOG.md`
- `docs/HANDOFF.md`

Verification:
- `npm run test:run`
- Result: 15 test files passed, 100 tests passed.
- `npm run build`
- Result: TypeScript and Vite production build completed successfully.
- Playwright smoke through local Vite preview passed with hard assertions:
  - preview edge appears while dragging `David Hlavnicka` below `Jan Sokola`
  - `Jan Sokola` receives the child-drop highlight
  - after mouse up, localStorage chart stores `country-fi-manager-cz-david-hlavnicka.parentId = country-ops-manager-jan-sokola`

Environment note:
- The sandbox blocks Vite dev/preview startup via esbuild `spawn EPERM`; the browser smoke was run outside the sandbox with explicit approval and the preview job was stopped afterward.

Next task:
- Commit and push the DnD fix for GitHub Pages deployment.

### Task 17: Add failing country-filter tests

Status: complete

Changed files:
- `src/domain/countryFilter.test.ts`
- `src/domain/chartValidation.test.ts`
- `src/state/chartReducer.test.ts`
- `src/components/Toolbar.test.tsx`
- `src/components/EditorPanel.test.tsx`
- `src/App.test.tsx`
- `docs/IMPLEMENTATION-LOG.md`

Verification:
- RED: `npm run test:run -- src/domain/countryFilter.test.ts src/state/chartReducer.test.ts src/components/Toolbar.test.tsx src/components/EditorPanel.test.tsx src/App.test.tsx src/domain/chartValidation.test.ts`
- Expected result observed: failures cover missing country helper module, optional `countries` validation, `countryFilter` reducer state/action, toolbar country controls, editor multi-country checkboxes, filtered app view, and filtered add-child defaults.

Next task:
- Implement country model types, filtering helpers, validation, reducer state, and add-child country defaults.

### Task 18: Implement country model, helper functions, reducer state

Status: complete

Changed files:
- `src/domain/orgchart.ts`
- `src/domain/countryFilter.ts`
- `src/domain/chartValidation.ts`
- `src/domain/chartOperations.ts`
- `src/state/chartReducer.ts`
- `docs/IMPLEMENTATION-LOG.md`

Verification:
- `npm run test:run -- src/domain/countryFilter.test.ts src/domain/chartValidation.test.ts src/state/chartReducer.test.ts`
- Result: 3 test files passed, 40 tests passed.

Implementation notes:
- Added `CountryCode`, `CountryFilter`, optional `countries`, and strict validation for country arrays.
- Added helper functions that parse legacy slash-separated `country`, prefer explicit `countries`, and filter the visible chart to matching nodes plus ancestor path.
- `countryFilter` is view state only; chart data is not mutated by switching All/CZ/SK/PL.
- Adding a child in a filtered CZ/SK/PL view initializes the new node with matching `country` and `countries`.

Next task:
- Wire country filter into toolbar, app rendering, status count, and editor multi-country controls.

### Task 19: Wire country filter into toolbar, editor, and app view

Status: complete

Changed files:
- `src/components/Toolbar.tsx`
- `src/components/EditorPanel.tsx`
- `src/components/OrgNodeCard.tsx`
- `src/App.tsx`
- `src/i18n/messages.ts`
- `src/styles.css`
- `docs/IMPLEMENTATION-LOG.md`

Verification:
- `npm run test:run -- src/components/Toolbar.test.tsx src/components/EditorPanel.test.tsx src/App.test.tsx`
- Result: 3 test files passed, 6 tests passed.

Implementation notes:
- Toolbar now exposes a compact `All/CZ/SK/PL` segmented filter.
- `App` renders `filterChartByCountry(currentChart, countryFilter)` into the canvas and status count, while save/export/import keep the full chart.
- Editor country editing is now a multi-select checkbox control for `CZ/SK/PL/DE/HU` and keeps legacy `country` synchronized.
- Cards display normalized country metadata from explicit `countries` when present, otherwise from the legacy `country` string.

Next task:
- Run full test/build verification and update handoff docs.

### Task 20: Verify country filter and update handoff

Status: complete

Changed files:
- `docs/IMPLEMENTATION-LOG.md`
- `docs/HANDOFF.md`

Verification:
- `npm run test:run`
- Result: 17 test files passed, 112 tests passed.
- `npm run build`
- Result: TypeScript and Vite production build completed successfully.

Implementation notes:
- Country filtering is view-only: All/CZ/SK/PL changes the visible chart and status count, but the persisted/exported chart stays complete.
- Filtered country views include matching nodes plus their ancestor path to preserve context.
- `countries` is optional, schema remains v5, and legacy `country` strings continue to work.
- New cards created while filtered to CZ/SK/PL are initialized with that country flag.

Next task:
- Commit and push when the country filter should be deployed to GitHub Pages.
