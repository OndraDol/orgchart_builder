# Orgchart Builder

Interaktivní webový editor organizační struktury **Aures Holdings** (118 karet, B-0 až B-4 úrovně, drag & drop reorganizace).

**Live deploy:** https://ondradol.github.io/orgchart_builder/

---

## Co projekt umí

- **Vizualizace** stromu org. struktury (React Flow + d3-hierarchy)
- **Drag & drop reorganizace** — chytni kartu, pusť nad jinou pro:
  - **Center** → karta se stane podřízenou (indigo ring + bottom-bar pod cílovou kartou)
  - **Levá / pravá hrana** → sibling reorder (svislý bar na hraně cíle)
  - Inflated rect intersection ±60 px — drop nemusí být přesný overlap
  - Tažená karta vypadá jako šedý poloprůhledný ghost; pulzuje accent glow když je nad valid drop místem
  - Po dropu **viewport zůstává na stejné pozici** (user klepne „Přizpůsobit pohled" pro refit)
- **Editor karty** v pravém panelu (název, osoba, B-úroveň, země, region, barva, status)
- **Přidání nové karty** přes „+" tlačítko → karta jako draft (dashed border, NOVÁ badge), vyplň detaily a klikni Uložit
- **Import / Export JSON** pro zálohu a obnovu
- **Reset** — vrátí dataset na zdrojový SOURCE_ORGCHART (z PDF/Visio)
- **Undo** historie změn
- **Vyhledávání** v rolích a osobách
- **Vertikální / horizontální orientace** stromu
- **Frontend password gate** (SHA-256 hash heslo, ne real auth)
- **B-úroveň color stripe** vlevo na kartě + badge v meta řádce
- **Plně česká lokalizace** UI

## Známé limitace

- **Single root** — celý strom má jeden kořen (`holding-aures`). Nelze mít více samostatných stromů.
- **Bez cyklů** — karta nemůže být ve svém vlastním podstromu (validace v `moveNodeAsChild`).
- **Drag & drop jen v rámci jednoho stromu** — žádný cross-tree přesun.
- **localStorage cache** — pokud upravíš strom, uloží se. Při změně schemaVersion (např. 2 → 3) se cache invaliduje a načte se fresh SOURCE_ORGCHART.
- **Multi-select drag** zatím není.

## Quick start

```bash
git clone https://github.com/OndraDol/orgchart_builder.git
cd orgchart_builder
npm install
# heslo `AURES12345`:
export VITE_APP_PASSWORD_HASH=48cb56cba31a213f55426b3d1bbc7cb555ac7a8c4b69f3450ea0f0cd7f8c7b75
npm run dev
```

## Skripty

| Skript | Co dělá |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build (typecheck + vite build) |
| `npm run preview` | Preview production buildu |
| `npm run test` | Vitest interactive |
| `npm run test:run` | Vitest run (CI mode) |
| `npm run typecheck` | TS check bez výstupu |

## Technologie

- **Vite 4** + **React 19** + **TypeScript 5**
- **@xyflow/react 12** (React Flow) pro canvas + node drag
- **d3-hierarchy 3** pro tree layout
- **lucide-react** pro ikony
- **clsx** pro conditional classnames
- **Vitest** pro testy + React Testing Library

## Deploy

GitHub Pages přes Actions (`.github/workflows/deploy-pages.yml`). Po push na `master` se workflow automaticky spustí, vybuilduje a deploy nahraje. Build vyžaduje secret `VITE_APP_PASSWORD_HASH` v GitHub repo settings.

## Dokumentace

- [`docs/HANDOFF.md`](docs/HANDOFF.md) — aktuální stav, co je hotovo, co dál
- [`docs/DATA-MODEL.md`](docs/DATA-MODEL.md) — schema `OrgChartDocument`, `OrgNode`, ID konvence
- [`docs/SOURCE-FILES.md`](docs/SOURCE-FILES.md) — zdrojové soubory (PDF/VSD/SVG/JPG) a jak byly použity

## Security note

App používá pouze **frontend password gate**. Static bundle a embedded data jsou inspectable. Použít jen jako **dočasný prototyp**, ne pro produkční ochranu citlivých dat.
