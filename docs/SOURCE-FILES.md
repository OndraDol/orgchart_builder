# Zdrojové soubory

Seznam zdrojových materiálů použitých pro vytvoření datasetu `src/data/sourceOrgchart.ts`, jejich umístění, formát, a metody parsování.

## Přehled

| Soubor | Formát | Velikost | Použití | Path |
|---|---|---|---|---|
| Original Visio | `.vsd` | 817 kB | NEPARSOVÁN (binární, vyžaduje Microsoft Visio) | `source/2026-04-01_Holding_Organizační struktura Holding.vsd` |
| PDF export | `.pdf` | 137 kB | Text extrakce přes pdftotext | `source/2026-04-01_Holding_Organizační struktura Holding.pdf` |
| SVG export | `.svg` | 187 kB | XML parsing přes Python (částečně úspěšný) | `2026-04-01_Holding_Organizační struktura Holding.svg` (root) |
| JPG render | `.jpg` | 3.9 MB | Vizuální audit přes tiles (Python PIL + Read) | `2026-04-01_Holding_Organizační struktura Holding_page-0001.jpg` (root) |
| PNG render | `.png` | 382 kB | Doplňkový lo-res render | `tmp/pdfs/holding-orgchart-page1.png` |
| Text extract | `.txt` | 23 kB | pdftotext -layout output | `tmp/pdfs/holding-orgchart.txt` |

Datum exportu: **2026-04-01**.

## Použité parsovací techniky

### PDF → text (`tmp/pdfs/holding-orgchart.txt`)

```bash
"C:/Program Files/Git/mingw64/bin/pdftotext.exe" -layout -enc UTF-8 \
  "source/2026-04-01_Holding_Organizační struktura Holding.pdf" \
  "tmp/pdfs/holding-orgchart.txt"
```

`-layout` zachovává sloupcové rozložení — text je čitelný v 95 řádcích, ale columns jsou nejednoznačné při vyšší hustotě (centrum chartu má hodně překryvů).

**Síla:** rychlé, full text content, zachová diakritiku.
**Limitace:** neumí číst connector lines, multiline tituly se rozbíjí, columns často nejsou align.

### SVG → parent-child (Python parser)

Skript: `tmp/svg-audit.py` (přibalen v repo pro reproducibilitu).

```bash
python tmp/svg-audit.py
```

**Co dělá:**
1. Parsuje XML přes `xml.etree.ElementTree`
2. Iteruje `<g>` skupiny, hledá `<path>` s rect-like geometrií (4 rohy uvnitř bounds) → karty
3. Extrahuje title+person z vnořených `<tspan>` elementů
4. Pro non-rect paths (solid, ne dashed) — hledá body, které leží na top/bottom edge karet
5. Pokud connector vidí 1+ parent (bottom edge) a 1+ child (top edge), zaznamenává relaci

**Výstup:** `tmp/svg-audit-relations.json` a `tmp/svg-audit-diff.json`.

**Úspěšnost:** ~30 relací z 117 očekávaných (25 %). Důvody:
- Visio konektory jsou multi-segment (paths rozdělené na 2-3 části → endpointy nesedí na hranách karet)
- Některé konektory mají endpoints offset (uvnitř/vně karty)
- Bus-based connectors (1 parent → N children) jen z části detekované

**Síla:** geometricky autoritativní pro relace co se podaří zachytit.
**Limitace:** parser je heuristický, nutno verifikovat výsledky vizuálně.

### JPG → vizuální audit (tiles + Read tool)

Skript pro krájení (run-once):

```python
from PIL import Image
import os
img = Image.open(r'2026-04-01_Holding_Organizační struktura Holding_page-0001.jpg')
w, h = img.size  # 6615 × 4961
cols, rows = 4, 3
overlap = 0.10
tw = w // cols; th = h // rows
ow = int(tw * overlap); oh = int(th * overlap)
os.makedirs('tmp/pdfs/tiles', exist_ok=True)
for r in range(rows):
    for c in range(cols):
        x1 = max(0, c*tw - ow); y1 = max(0, r*th - oh)
        x2 = min(w, (c+1)*tw + ow); y2 = min(h, (r+1)*th + oh)
        img.crop((x1, y1, x2, y2)).save(f'tmp/pdfs/tiles/tile_{r}_{c}.jpg', quality=92)
```

**Výstup:** 12 dlaždic ~1900 × 1800 px v `tmp/pdfs/tiles/`.

**Použití:** Read tool jako image input → vizuálně sledovat konektory → ručně zaznamenat parent-child.

**Síla:** spolehlivá pravda (pokud jsou tiles dost ostré).
**Limitace:** manuální práce; pro 117 nodů cca 30-60 minut.

## Postup pro budoucí re-audit

Pokud se org struktura aktualizuje, postup:

1. Z Visio exportovat nový **`.svg`** (Save As → SVG)
2. Z Visio exportovat **`.pdf`** (Print → Save as PDF)
3. Konvertovat PDF na hi-res JPG: např. přes online tool nebo `pdftoppm -r 300 file.pdf out`
4. Nahrát všechny soubory do repo root nebo `source/`
5. Spustit `python tmp/svg-audit.py` pro automatickou diff vs. aktuální dataset
6. Pokud SVG nepostačuje, krájet JPG na tiles a projít vizuálně (viz výše)
7. Aplikovat opravy v `src/data/sourceOrgchart.ts` přes Edit
8. Bumpnout `schemaVersion` v `src/domain/orgchart.ts` (a všech testech)
9. `npm run test:run && npm run build`
10. Commit + push → automatický deploy

## Authoritativní zdroj pro sporné B-úrovně

**AAAUTO interní Phonebook** (SharePoint, auth-gated):
`https://aaaautoeu.sharepoint.com/sites/INTRANET/SitePages/Phonebook.aspx`

Pouze ověření uživatelé (zaměstnanci AAAUTO) mají přístup. Pro pokračovatele projektu mimo AAAUTO: nutno se obrátit na původního uživatele/owner pro verifikaci sporných B-úrovní.

## .gitignore notes

Aktuálně `tmp/` je v `.gitignore`. Pokud chceš zachovat audit artifacts (svg-audit.py, diff JSON), přesuň je do `docs/audits/` nebo `scripts/`.
