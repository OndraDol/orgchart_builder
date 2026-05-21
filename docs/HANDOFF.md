# Handoff — Orgchart Builder

Stav projektu, architektura, hotovo / nehotovo, doporučené další kroky pro pokračování (jiný nástroj/člověk).

## Aktuální stav (2026-05-21)

- **Live deploy:** https://ondradol.github.io/orgchart_builder/
- **Dataset:** 118 karet ve `src/data/sourceOrgchart.ts`, schema verze 3
- **Doménový model:** B-0 .. B-4 úrovně, 7 barevných tokenů, status (active/planned/vacant)
- **Heslo:** `AURES12345` (hash secret `VITE_APP_PASSWORD_HASH` v GitHub repo)
- **Testy:** 74/74 zelených

## Architektura

```
src/
├── App.tsx                       # top-level state wiring (reducer, handlers)
├── main.tsx                      # ReactDOM root, StrictMode
├── styles.css                    # všechen CSS (žádné moduly), modern slate + indigo theme
├── i18n/
│   └── messages.ts              # české UI stringy + level/status/color labely + plurály
├── domain/
│   ├── orgchart.ts              # OrgNode, OrgChartDocument, LEVEL_TYPES, CARD_COLOR_TOKENS
│   ├── chartOperations.ts       # addChildNode, moveNodeAsChild, moveNodeAsSibling (cycle/root validace)
│   ├── chartValidation.ts       # parseChartDocument, isChartDocument, validateChartDocument
│   ├── chartHistory.ts          # undo/redo stack
│   └── chartLayout.ts           # d3-hierarchy tree(), separation tuning
├── state/
│   ├── chartReducer.ts          # všechny actions (add-child, drop-as-child, save-draft, undo, ...)
│   └── storage.ts               # localStorage save/load s validation guard
├── components/
│   ├── AuthGate.tsx             # minimalistický password gate (jen "Heslo:" input)
│   ├── Toolbar.tsx              # search, orientation, undo, fit view, import, export, reset
│   ├── OrgChartCanvas.tsx       # React Flow + D&D logika (inflated rect intersection)
│   ├── OrgNodeCard.tsx          # karta s B-stripe, badge, draft style, drop indicators
│   ├── EditorPanel.tsx          # pravý panel: form + Uložit (pro draft)
│   └── StatusBar.tsx            # počet karet + save state + warning
├── data/
│   └── sourceOrgchart.ts        # 118 karet (root + 4 B-0 + 17 B-1 + ... + B-3 + B-4)
└── utils/
    └── download.ts              # downloadJson helper
```

## Co je hotovo

- Doménový model B-0 až B-4 s validací
- 118 karet 1:1 podle PDF + audit z JPG
- Modern indigo theme, glass toolbar, level stripes
- Plně česká lokalizace + plurály
- Drag & drop:
  - inflated rect intersection (60 px tolerance)
  - center → child, levá/pravá hrana → sibling left/right
  - re-fit viewport po dropu
- Draft flow pro novou kartu (dashed, NOVÁ badge, Uložit)
- Import / Export JSON (validace přes `parseChartDocument`)
- Reset, Undo, Search, Orientation switch
- GitHub Pages deploy přes Actions
- 74 testů

## Co NENÍ hotovo

- **Multi-select drag** — momentálně se přesune jen jedna karta (její podstrom jde s ní automaticky).
- **Cross-tree move / make root** — single-root invariant nelze obejít UI.
- **Redo button** — historie ho podporuje, ale UI nemá tlačítko.
- **Sibling reorder v rámci jedné rodiny přesný** — drop left/right funguje, ale neumí přesně mezi dva konkrétní siblingy v multi-sibling skupině.
- **Validace v UI** — chybové stavy zobrazují warning ve status baru, ale není modal/toast.
- **Tests for D&D handlers** — kanonické testy jsou pro reducer; D&D logiku zatím netestuju (vyžaduje DOM event simulace).
- **OCR z JPG** pro auto-audit — vyžadovalo by Tesseract nebo cloud OCR.
- **Spolehlivý SVG parser** — Visio export má geometricky složité konektory, parser najde jen ~25 % relací reliable (`tmp/svg-audit.py` je proof-of-concept).

## Doporučené další kroky

### Priority 1 — Datový audit
1. **B-úrovně z AAAUTO Phonebook** — projít každou kartu, ověřit B-úroveň proti internímu phonebooku.
2. **Parent-child napojení** — některé karty mají interpretované parent vztahy z PDF/JPG vizuálu (např. country managers funkčně vs. country MD). Sporné jsou:
   - Petr Vik, Jan Kovář, Petr Rinda (CZ B-2) — funkční pod Group X, nebo country pod Vorlík?
   - Robert Šmol, Vojtěch Karban (Director-level B-2) — možná by měli být B-1
3. **Doplnit chybějící osoby** — pokud Phonebook ukáže, že tam ještě někdo není (Phonebook auth-gated, vyžaduje uživatele)

### Priority 2 — UX
1. **Redo tlačítko** v toolbaru
2. **Sibling reorder s indexem** (drop mezi dva konkrétní siblingy)
3. **Toast notifikace** pro warnings místo statického statusbaru
4. **Hover preview** — když najedeš na kartu, zvýrazni jeho podstrom

### Priority 3 — Tech debt
1. **Dataset auto-generation** ze SVG/Visio přes lepší parser nebo CSV export
2. **Test coverage** pro D&D logiku
3. **Migration cesta** pro localStorage při bumpu schemaVersion (aktuálně se invaliduje a načte SOURCE_ORGCHART)
4. **Internationalizace** — pokud bude potřeba EN/PL/SK UI

## Klíčové repo informace

- Master branch deploys automaticky
- Repo secret `VITE_APP_PASSWORD_HASH` musí existovat (SHA-256 hash hesla v hex)
- Pages enabled s GitHub Actions jako source

## Domain context

Projekt je interní pro **Aures Holdings** (CZ holding pro AAAUTO, Mototechna, atd.). Org struktura je z **PDF/Visio souboru z 1. dubna 2026**. Karty pokrývají CZ, SK, PL, DE, HU operace.

Autoritativní zdroj pro sporné B-úrovně: **AAAUTO interní Phonebook** (SharePoint, auth-gated). Externí uživatelé tam nemají přístup; nutno konzultovat s uživatelem projektu.
