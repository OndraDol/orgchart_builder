# Orgchart Builder

Temporary static prototype for editing a holding orgchart in the browser.

## Security Note

This app uses a frontend password gate only. It is not real authentication. The static bundle and embedded orgchart data can be inspected by anyone with access to the published GitHub Pages files. Use this only as a temporary prototype.

## Current Status

Implementation is in progress. The project currently has:
- Vite + React + TypeScript scaffold;
- frontend password gate;
- orgchart domain model, validation, history, storage, reducer, and layout engine;
- editor shell with toolbar, side panel, status bar;
- initial React Flow orgchart canvas and cards.

Continue from [docs/HANDOFF.md](docs/HANDOFF.md). The detailed implementation plan is in [docs/superpowers/plans/2026-05-21-orgchart-builder-implementation.md](docs/superpowers/plans/2026-05-21-orgchart-builder-implementation.md).

## Local Development

```bash
npm install
npm run dev
```

For local password testing, set `VITE_APP_PASSWORD_HASH` before starting Vite.

PowerShell example for password `secret`:

```powershell
$env:VITE_APP_PASSWORD_HASH='2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b'
npm run dev -- --host 127.0.0.1 --port 5173
```

## Password Hash

Set `VITE_APP_PASSWORD_HASH` to a SHA-256 hex hash of the temporary password.

PowerShell hash example:

```powershell
$password = "change-me"
$bytes = [System.Text.Encoding]::UTF8.GetBytes($password)
$hash = [System.Security.Cryptography.SHA256]::HashData($bytes)
($hash | ForEach-Object { $_.ToString("x2") }) -join ""
```

## Verification

```bash
npm run test:run
npm run typecheck
npm run build
```

## GitHub Pages

The deployment workflow expects repository secret `VITE_APP_PASSWORD_HASH`.

After pushing:
1. add the secret in GitHub repository settings;
2. enable GitHub Pages with GitHub Actions as the source;
3. run the Pages workflow.
