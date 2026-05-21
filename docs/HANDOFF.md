# Orgchart Builder Handoff

Last updated: 2026-05-21

This document is the handoff point for a new coding agent. Continue from the current `master` branch. Do not restart discovery from scratch.

## Project Goal

Build a polished web-based orgchart editor for HR based on the attached holding orgchart.

The app should let the HR director:
- view the orgchart dynamically;
- add a new lower level under any card using a plus button;
- edit role/person/type/country/regio/color/status;
- move cards with click-to-move and drag-and-drop drop zones;
- save work locally in the browser;
- import/export JSON variants;
- deploy as a static GitHub Pages app.

Original source files supplied by the user:
- `C:/Users/ondrej.dolejs/AppData/Local/Temp/2026-04-01_Holding_Organizační struktura Holding (1).pdf`
- `C:/Users/ondrej.dolejs/AppData/Local/Temp/2026-04-01_Holding_Organizační struktura Holding (1).vsd`

Source files included in this repository for continuity:
- `source/2026-04-01_Holding_Organizační struktura Holding.pdf`
- `source/2026-04-01_Holding_Organizační struktura Holding.vsd`

The PDF was rendered locally during discovery to:
- `tmp/pdfs/holding-orgchart-page1.png`

`tmp/` is gitignored, so the rendered preview is not in git.

## Security Decision

The user explicitly chose:
- public GitHub Pages;
- real names and real orgchart data;
- frontend-only password gate;
- temporary prototype.

Important: this is not real authentication. The built static bundle and embedded data can be inspected by anyone who can access the published files. This warning is intentionally present in the UI, README, and design docs.

Cloudflare Access / private hosting was discussed and rejected for this prototype.

## Repository State

Current branch:
- `master`

Latest committed task:
- Task 9: `5d61cfa feat: render editable orgchart canvas`

Current working tree at handoff:
- should be clean before publishing;
- verify with `git status --short --branch`.

Main docs already committed:
- `docs/superpowers/specs/2026-05-21-orgchart-builder-design.md`
- `docs/superpowers/plans/2026-05-21-orgchart-builder-implementation.md`
- this file: `docs/HANDOFF.md`

The full original implementation plan remains in `docs/superpowers/plans/2026-05-21-orgchart-builder-implementation.md`. That plan is the source of truth for remaining tasks.

## Tech Stack

- Vite
- React
- TypeScript
- Vitest
- React Testing Library
- React Flow via `@xyflow/react`
- `d3-hierarchy`
- `lucide-react`
- GitHub Actions / GitHub Pages planned

Useful scripts:

```powershell
npm run dev
npm run test:run
npm run typecheck
npm run build
```

Local dev password used during browser smoke checks:
- password: `secret`
- SHA-256 hash: `2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b`

Set it locally with:

```powershell
$env:VITE_APP_PASSWORD_HASH='2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b'
npm run dev -- --host 127.0.0.1 --port 5173
```

## Completed Implementation Tasks

### Task 1: App Scaffold

Implemented and reviewed.

Key commits:
- `57dfca4 chore: scaffold vite react app`
- `6312b99 chore: fix scaffold verification blockers`

What exists:
- `package.json`
- Vite/TypeScript/Vitest config
- `src/main.tsx`
- `src/App.tsx`
- test setup
- `.env.example`
- `.gitignore`

Important review fixes:
- added minimal `src/main.tsx` / `src/App.tsx` so build resolves;
- added scaffold smoke test so `npm run test:run` does not fail on no tests;
- ignored `*.tsbuildinfo`;
- removed Vitest globals leakage from production TS config.

### Task 2: Domain Types and Source Data Contract

Implemented and reviewed.

Key commits:
- `4e51681 feat: define orgchart data model`
- `e89f0f3 data: complete task 2 starter orgchart nodes`
- `0cd999e refactor: tighten orgchart token types`

Files:
- `src/domain/orgchart.ts`
- `src/domain/orgchart.test.ts`
- `src/data/sourceOrgchart.ts`
- `src/data/sourceOrgchart.test.ts`

Important details:
- `OrgNode.color` is strongly typed as `CardColorTokenId`.
- source data has one root node and starter visible nodes from the PDF.
- source data is not yet complete. Full transcription is Task 11.
- Czech diacritics are correct UTF-8 in files. If PowerShell shows mojibake, verify with Python/read UTF-8 before changing data.

### Task 3: Pure Chart Operations

Implemented and reviewed.

Key commits:
- `9ced719 feat: add orgchart tree operations`
- `2c6c872 fix: preserve orgchart root invariants`

Files:
- `src/domain/chartOperations.ts`
- `src/domain/chartOperations.test.ts`

Implemented operations:
- `addChildNode`
- `updateNode`
- `deleteNodeAndDescendants`
- `moveNodeAsChild`
- `moveNodeAsSibling`

Important review fixes:
- cannot delete root;
- cannot move a node beside root and create multiple roots;
- descendant traversal has a cycle guard.

### Task 4: Validation, History, Storage

Implemented and reviewed.

Key commits:
- `1d5c1ce feat: validate and persist chart documents`
- `a0df089 fix: harden chart import and storage guards`

Files:
- `src/domain/chartValidation.ts`
- `src/domain/chartValidation.test.ts`
- `src/domain/chartHistory.ts`
- `src/domain/chartHistory.test.ts`
- `src/state/storage.ts`
- `src/state/storage.test.ts`

Important review fixes:
- `isChartDocument` rejects unknown colors, level types, and statuses;
- malformed JSON throws `Imported file is not valid JSON.`;
- `loadLocalChart` returns `null` if localStorage read throws.

### Task 5: Layout Engine

Implemented and reviewed.

Commit:
- `f1659ef feat: add tree layout engine`

Files:
- `src/domain/chartLayout.ts`
- `src/domain/chartLayout.test.ts`

Details:
- uses `d3-hierarchy`;
- requires exactly one root;
- returns positioned nodes and edges;
- supports `vertical` and `horizontal` orientation.

### Task 6: Reducer and App State

Implemented and reviewed.

Key commits:
- `1fcdc62 feat: add orgchart editor reducer`
- `f57a4e7 fix: harden reducer stale state handling`

Files:
- `src/state/chartReducer.ts`
- `src/state/chartReducer.test.ts`

Important review fixes:
- stale `add-child` and `update-selected` preserve chart and set warning;
- successful delete clears stale moving state;
- no-op updates do not push undo history;
- simple recovery actions clear stale warnings.

### Task 7: Password Gate and App Shell

Implemented and reviewed.

Key commits:
- `6a6fd92 feat: add frontend password gate`
- `92f95af fix: harden password gate runtime fallbacks`
- `52ff684 fix: handle password hashing failures`

Files:
- `src/components/AuthGate.tsx`
- `src/components/AuthGate.test.tsx`
- `src/main.tsx`
- `src/App.tsx`
- `src/styles.css`

Important review fixes:
- `sessionStorage.getItem` and `setItem` are guarded;
- missing `crypto.subtle.digest` has a user-facing error;
- rejected digest calls have a user-facing error.

Browser smoke check:
- local app at `http://127.0.0.1:5173/`;
- unlocked successfully with password `secret` when the matching hash was set.

### Task 8: Editor Shell, Toolbar, Panel, Status

Implemented and reviewed.

Key commits:
- `1a905f2 feat: add orgchart editor shell`
- `a6899f7 fix: harden editor shell status actions`

Files:
- `src/components/Toolbar.tsx`
- `src/components/Toolbar.test.tsx`
- `src/components/EditorPanel.tsx`
- `src/components/StatusBar.tsx`
- `src/components/StatusBar.test.tsx`
- `src/App.test.tsx`
- `src/App.tsx`
- `src/styles.css`

Important review fixes:
- delete requires confirmation;
- warnings use accessible announcement semantics;
- placeholder import/export warning copy no longer says it depends on canvas integration.

Known non-blocking follow-up from review:
- `saveState` is derived from warning text in `App.tsx`. A later warning can overwrite a save failure warning, making the status say saved while storage may still be failing. This is not blocking Task 9, but should be cleaned up during Task 10 or before final polish by separating persistence state from transient warning text.

### Task 9: Orgchart Canvas and Card Rendering

Implemented by subagent and committed before handoff.

Commit:
- `5d61cfa feat: render editable orgchart canvas`

Files:
- `src/components/OrgChartCanvas.tsx`
- `src/components/OrgNodeCard.tsx`
- `src/components/OrgChartCanvas.test.tsx`
- `src/App.tsx`
- `src/styles.css`

Reported verification before commit:
- `npm run test:run -- src/components/OrgChartCanvas.test.tsx`: passed, 2 tests.
- `npm run test:run`: passed, 72 tests.
- `npm run typecheck`: passed.
- `npm run build`: passed.

Important: Task 9 has not yet gone through the normal two-stage review loop in the main controller because the user interrupted to request this handoff. The next tool must start by reviewing Task 9:

1. Spec compliance review for commit range `a6899f7..5d61cfa`.
2. Code quality review for commit range `a6899f7..5d61cfa`.
3. Browser smoke check of the rendered canvas.

Known incomplete from subagent:
- full drag/drop move behavior intentionally not implemented; it belongs to Task 10;
- toolbar `Fit view` remains placeholder from Task 8;
- canvas has initial fit behavior internally but no imperative fit wiring exposed to `App`.

## Remaining Work

Continue with the implementation plan from Task 9 review onward.

### Immediate Next Step

Do not start Task 10 until Task 9 is reviewed.

Run:

```powershell
git status --short --branch
npm run test:run -- src/components/OrgChartCanvas.test.tsx
npm run test:run
npm run typecheck
npm run build
```

Then review:
- `src/components/OrgChartCanvas.tsx`
- `src/components/OrgNodeCard.tsx`
- `src/App.tsx`
- `src/styles.css`
- `src/components/OrgChartCanvas.test.tsx`

Check especially:
- React Flow node positions match `layoutChart`;
- all visible cards render;
- plus buttons call `onAddChild`;
- selected/search/moving states are visually represented;
- `onSelect(null)` works on pane click;
- no runtime console errors in browser;
- canvas is not blank and is framed correctly in the editor shell.

### Task 10: Move, Import, Export, Reset

Still pending.

Must implement:
- app flow test for plus button and `New role`;
- click-to-move;
- drag-and-drop drop zones:
  - center = make child;
  - left/right = sibling reorder;
- export JSON download;
- import JSON through validation;
- reset source data;
- probably improve `saveState` separate from warning text.

### Task 11: Complete Source Dataset

Still pending.

Must manually transcribe remaining legible cards from the PDF. Starter dataset currently has 26 cards, not the full chart.

Requirements from plan:
- `SOURCE_ORGCHART.nodes.length > 70`;
- include CZ/SK/PL coverage;
- include regio roles;
- add `docs/source-data-notes.md`.

### Task 12: GitHub Pages Deployment

Partly handled by this handoff/publish step if workflow/README were added. Verify final state.

Still needs:
- GitHub Pages workflow if not present;
- repository secret `VITE_APP_PASSWORD_HASH`;
- Pages source set to GitHub Actions;
- final GitHub Pages URL verification.

## Review Workflow To Continue

The previous workflow used subagent-driven development:

For every task:
1. implement task with TDD;
2. run focused tests, all tests, typecheck, build;
3. commit;
4. spec compliance review;
5. code quality review;
6. fix review findings before moving on.

Do not skip the review loop for Task 9 even though it is already committed.

## Current Verification Baseline

Last reported full verification at Task 9 commit:
- 72 tests passed;
- typecheck passed;
- build passed.

Before making claims, run fresh verification in the new session.

## Local Browser State

At handoff, a Vite dev server may still be running at:
- `http://127.0.0.1:5173/`

It was started with:

```powershell
$env:VITE_APP_PASSWORD_HASH='2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b'
npm run dev -- --host 127.0.0.1 --port 5173
```

Use password:

```text
secret
```

If the port is occupied, stop the old process or use another port.

## GitHub Publishing Notes

This repo was initially local only. The handoff step should publish it to GitHub under the authenticated account `OndraDol` unless the user changes the target.

Recommended repository name:
- `orgchart_builder`

The Vite production base is already:

```ts
base: mode === 'production' ? '/orgchart_builder/' : '/'
```

If the GitHub repository name changes, update `vite.config.ts` before deploying Pages.

## Safety Notes For Next Agent

- Do not remove the warning that frontend password is not real auth.
- Do not implement PDF/VSD runtime import; it is explicitly out of scope.
- Do not create freehand connector drawing; chart must remain structured tree data.
- Do not silently revert any existing commits.
- Do not rewrite source data names for apparent mojibake unless you verify file encoding with UTF-8 reads.
- Do not publish a real password in git.
- Set GitHub secret `VITE_APP_PASSWORD_HASH` outside git for Pages.
