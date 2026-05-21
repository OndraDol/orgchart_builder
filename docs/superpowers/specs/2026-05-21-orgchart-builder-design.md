# Orgchart Builder Design

**Goal:** Build a polished, browser-based editor for the attached holding orgchart so HR can experiment with structure, add levels such as country and regio, move roles around, and save variants without a backend.

**Status:** Approved design direction, pending implementation plan.

## Context

The source orgchart is a one-page holding organization chart provided as PDF and VSD. The PDF contains a wide hierarchical chart with holding-level roles, country rows, colored cards, dashed planned/open roles, and country labels such as CZ, SK, PL, DE, and HU. The first product version will use the attachment as the source for a prepared starting dataset. It will not support importing new PDF or VSD files.

The user wants a temporary public GitHub Pages prototype with real names and a frontend password gate. This is intentionally not strong data protection. The app bundle and embedded dataset can be inspected by anyone who has access to the published files. The password gate is only a friction layer for a temporary experiment.

## Hosting and Security

The application will be deployed as a static site on GitHub Pages from a GitHub repository.

The app will show a password screen before rendering the orgchart. The password check will run entirely in the frontend and will not be described as secure authentication. The repository and design should include a clear warning that this setup is unsuitable for long-term hosting of real HR data.

The design does not include a backend, database, server-side authentication, or Cloudflare Access in the MVP.

## Product Scope

The first version will support manual editing of the prepared orgchart from the attachment.

In scope:
- Open the app behind a simple frontend password screen.
- View the orgchart on a pan-and-zoom canvas.
- Switch between horizontal and vertical tree layout.
- Search roles and people.
- Select a card and edit its fields.
- Add a new child level from a plus button under any card.
- Move cards using click-to-move.
- Move cards using drag-and-drop drop zones.
- Delete cards with confirmation.
- Change card color.
- Persist edits in the browser.
- Export the current chart as JSON.
- Import a previously exported JSON file.
- Reset to the original prepared dataset.
- Undo recent editing actions.

Out of scope for MVP:
- Automatic import from PDF, VSD, Excel, HRIS, or Graph API.
- Multi-user collaboration.
- Server-side storage.
- Strong authentication.
- Permission roles.
- Audit log.
- Freehand drawing of arbitrary connector lines.
- Perfect recreation of the original Visio layout.

## Data Model

The chart will be stored as structured tree data. Each node represents one orgchart card or grouping level.

Each node will contain:
- `id`: stable unique string.
- `parentId`: parent node id or `null` for root nodes.
- `title`: role or level title, for example `Chief HR Officer` or `Country Payroll Manager`.
- `person`: displayed person name, optional for structural levels.
- `levelType`: category such as `holding`, `group`, `country`, `regio`, `team`, `role`, or `placeholder`.
- `country`: optional country code or label.
- `regio`: optional region label.
- `color`: visual color token for the card.
- `status`: `active`, `planned`, or `vacant`.
- `order`: sibling ordering number.

Country and regio are not hard-coded as fixed rows. They are editable node metadata and can also be represented by ordinary nodes when HR wants to add another structural level below the existing lower layer.

## Editing Model

The primary interaction is direct editing on the chart.

Every card has a visible plus affordance below it. Clicking plus creates a new child node under that card, gives it a default title such as `New role`, and opens it for editing.

Selecting a card opens an editor panel with fields for title, person, level type, country, regio, color, and status. The panel also contains actions for move, duplicate, delete, and reset selection.

Moving cards works in two modes:
- Click-to-move: select a source card, choose Move, then click the target card.
- Drag-and-drop: drag a card over another card and use drop zones.

Drop zone behavior:
- Dropping on the center of a target card makes the dragged card a child of that target.
- Dropping on the left or right side of a target card keeps the dragged card at the same parent level as the target and changes sibling order.
- Invalid moves, such as moving a node under itself or into its own descendant, are blocked.

After every structural edit, the layout recalculates automatically. The app does not allow freehand connectors because they would break the orgchart as structured data.

## Layout and Navigation

The main workspace is an editor, not a landing page.

The first screen after password entry shows:
- Top toolbar with search, orientation switch, zoom controls, import/export, reset, and undo.
- Main chart canvas with pan and zoom.
- Right editor panel that appears when a card is selected.
- Compact status area showing whether local changes exist.

The canvas supports:
- Mouse wheel or trackpad zoom.
- Drag-to-pan on empty space.
- Fit-to-screen.
- Expand/collapse branches if the chart becomes too dense.
- Highlight search results and selected ancestry.

The chart can be displayed vertically or horizontally. The app chooses stable spacing so added cards do not overlap.

## Visual Direction

The design should feel like a modern internal HR planning tool: calm, precise, and polished. It should avoid a generic AI-generated look and avoid a marketing landing-page style.

Visual principles:
- Dense but readable workspace.
- Distinct card colors that echo the source chart without copying its dated Visio look.
- Clear selected, hovered, dragged, and invalid-drop states.
- Subtle grid or canvas background for orientation.
- Clean typography with strong hierarchy inside cards.
- Buttons and controls use clear iconography for common actions such as add, delete, move, undo, import, export, zoom, and fit-to-screen.

The color system should include tokens for current source colors, planned/open roles, country/regio levels, and neutral structural cards.

## Persistence

All edits are saved locally in the browser using local storage or IndexedDB. The app automatically loads the last local version after password entry.

The toolbar includes:
- `Export JSON`: downloads the full current dataset.
- `Import JSON`: replaces the current chart after validation and confirmation.
- `Reset`: restores the prepared source dataset after confirmation.

Imported JSON must be validated before use. Invalid imports show a clear error and leave the current chart unchanged.

## Error Handling

The app should prevent destructive mistakes where possible.

Rules:
- Deleting a node with children requires confirmation and clearly states that its descendants will also be removed.
- Invalid drag targets show an invalid state and do nothing on drop.
- Import validation rejects missing ids, duplicate ids, cycles, missing parents, and unknown required fields.
- Local storage failures show a non-blocking warning and keep the in-memory chart editable.
- Reset and import actions are undoable when feasible.

## Testing

Core data operations should be covered by unit tests:
- Add child node.
- Delete node and descendants.
- Move node as child.
- Reorder node as sibling.
- Block moving a node into its own descendant.
- Serialize and deserialize chart JSON.
- Reject invalid imported JSON.
- Restore original dataset.

UI tests should cover the main happy path:
- Unlock with the configured frontend password.
- Add a child using the plus affordance.
- Edit card fields.
- Move a card using click-to-move.
- Export JSON and re-import it.

## Implementation Approach

Use Vite, React, and TypeScript for a static GitHub Pages deployment.

Recommended library choices:
- React for UI.
- TypeScript for data model safety.
- A tree/layout library or a graph canvas library only if it does not fight the custom editing interactions.
- A reducer-based state layer for predictable editing and undo.
- Vitest for data operation tests.
- Playwright for browser-level workflow tests if setup time allows.

The source PDF/VSD extraction is not part of the runtime app. The initial dataset can be manually prepared from the attachment during implementation.

## Deployment

The repository will include a GitHub Actions workflow that builds the static app and deploys it to GitHub Pages.

The app should work under a repository subpath, so asset paths must be compatible with GitHub Pages project sites.

## Acceptance Criteria

The MVP is complete when:
- The app runs locally.
- It builds as a static site.
- It can be deployed to GitHub Pages.
- A user can unlock the app with the frontend password.
- The prepared orgchart from the attachment is visible.
- A user can add a lower level under any card using plus.
- A user can edit title, person, level type, country, regio, and color.
- A user can move cards with click-to-move and drag-and-drop drop zones.
- A user can export JSON, import JSON, reset to source data, and undo recent edits.
- Data operation tests pass.
