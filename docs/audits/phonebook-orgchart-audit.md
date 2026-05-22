# Phonebook Orgchart Audit

Date: 2026-05-22

## Scope

Compared the current source chart in `src/data/sourceOrgchart.ts` against the authenticated AAAAUTO Phonebook.

Phonebook source used:
- Active employees from the `EgjeEmployee` list: 3,377 active records.
- Profile detail and visible organization chart samples in the Phonebook page.
- B level fields: `str21_dop` / `OData__x0053_TR21`.
- Employee country / company fields: `country`, `company_id`, `company_name`.
- Manager fields: `gid_mana`, `jmeno_mana`.

Current source chart:
- 121 visible people.
- 118 matched to active Phonebook employees.
- 3 source people were not found in the active Phonebook list.
- 0 ambiguous name matches after matching both first-last and last-first order.

## Main conclusions

### Country

The current `country` / `countries` values behave as role scope, not as employee legal-entity country.

This is the right interpretation for the app today:
- Source role scope and Phonebook title suffixes match: 0 scope mismatches.
- Blank source country on group roles should not be auto-filled with `CZ`.
- Phonebook employee country is separate metadata. Most group roles are employed in CZ entities, but that does not mean their role scope is CZ-only.

Only one source role has scope outside the employee country:
- Michal Válka, `SWAP Manager`: source scope `DE`, Phonebook employee country `CZ`, company `23 / AURES Holdings a. s.`

Recommendation:
- Keep `countries` as role scope for filtering.
- Add separate metadata for employee country / company if needed: `employeeCountry`, `companyId`, `companyName`.
- Do not use Phonebook employee country to overwrite role scope.

### B Levels

Phonebook has the authoritative B level. The current source differs on 39 matched people.

Current source level counts:

| Level | Count |
| --- | ---: |
| B-0 | 4 |
| B-1 | 20 |
| B-2 | 67 |
| B-3 | 14 |
| B-4 | 16 |

Phonebook level counts for matched source people:

| Level | Count |
| --- | ---: |
| B-0 | 4 |
| B-1 | 20 |
| B-2 | 62 |
| B-3 | 27 |
| B-4 | 1 |
| BXX | 4 |

Important correction: the previous semantic assumption "SK = B-3, PL = B-4" is not valid. Many SK/PL country roles are B-2 in Phonebook.

Recommendation:
- Extend the domain model to support `BXX`.
- Update `levelType` from Phonebook for matched people.
- Keep source role scope unchanged while updating B level.

### Parent Tree

The PDF/source tree and Phonebook manager tree are not the same relationship.

After applying confirmed source parent overrides:
- 53 matched people have the same source parent as Phonebook manager.
- 17 have self/empty manager patterns in Phonebook.
- 48 differ.

The differences are systematic, not random:
- The PDF tree often groups country roles under `Managing Director CZ/SK` or `Managing Director PL`.
- Phonebook often reports the same roles to functional group directors, for example Sales -> Daniel Luňáček, Purchasing -> Zdeněk Batěk, Automotive OPS -> Leoš Pilnaj, Stock/Service -> Pavel Pospíšil, Finance -> František Klufa, F&I -> Milan Dědeček.

Phonebook visual check confirms the interactive chart should be treated as a separate, current org hierarchy:
- Marie Voršilková's page shows her HR subtree.
- Martina Kahulová's page shows Jan Jarma under Martina Kahulová, confirming the existing Jan Jarma parent override.
- Some lower-level people can still show "Person is not in organization chart" on their own profile page even when they appear in a manager's subtree.

Recommendation:
- Do not silently replace `parentId` until the app decides whether it should represent the PDF chart or the Phonebook manager hierarchy.
- Add Phonebook manager metadata first, then either:
  - keep PDF parent links as the source-layout view, or
  - add a Phonebook hierarchy mode / migration step.

## Not Found In Active Phonebook

These source people were not matched to active Phonebook employees:

| Source ID | Person | Source title | Source level | Scope |
| --- | --- | --- | --- | --- |
| `mergers-acquisitions-ir-manager-radek-nemecek` | Radek Němeček | Mergers and Acquisitions IR Manager | B-2 | |
| `group-finance-controlling-manager-jiri-gross` | Jiří Gross | Group Finance Controlling Manager | B-2 | |
| `country-buying-manager-pl-ales-doudlebsky` | Aleš Doudlebský | Country Buying Manager | B-4 | PL |

These should be manually checked: inactive employee, renamed person, role moved, or source/PDF stale.

## BXX Rows

| Source ID | Person | Source title | Phonebook title | Source level | Phonebook level | Scope | Employee country |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `regional-marketing-manager-michal-krulis` | Michal Kruliš | Regional Marketing Manager | Regional Marketing Manager | B-2 | BXX | CZ | CZ |
| `facility-construction-manager-sk-pavol-rodina` | Pavol Rodina | Facility & Construction Manager | Facility and Construction Manager_SK | B-3 | BXX | SK | SK |
| `regional-marketing-manager-pl-marian-zielina` | Marian Zielina | Regional Marketing Manager | Regional Marketing Manager_PL | B-4 | BXX | PL | PL |
| `development-manager-pl-weronika-szmanda` | Weronika Szmańda | Development Manager | Development Manager_PL | B-4 | BXX | PL | PL |

## Level Mismatches To Update From Phonebook

| Person | Source title | Phonebook title | Source | Phonebook | Scope |
| --- | --- | --- | --- | --- | --- |
| Petr Vik | Call Centre Manager Praha | Call Centre Manager_Praha | B-2 | B-3 | CZ |
| Jan Kovář | Call Centre Manager Ostrava | Call Centre Manager_Ostrava | B-2 | B-3 | CZ |
| Dušan Procházka | Group Export & Import Director | Group Export and Import Director | B-1 | B-2 | |
| Filip Kvarda | Import Manager | Import Manager | B-2 | B-3 | |
| Robert Radler | General Manager_Export | General Manager_Export | B-2 | B-3 | |
| Jitka Hořejší | Country Payroll Manager CZ+SK | Country Payroll Manager CZ+SK | B-2 | B-3 | CZ/SK |
| Jan Jarma | HR Team Leader | HR Team Leader | B-2 | B-4 | CZ |
| Michal Gabrhel | General Manager Mototechna 2.0 | General Manager_Mototechna | B-2 | B-3 | |
| Petronela Hubočanová | Head of BI | Head of BI | B-2 | B-3 | |
| Renata Lišková | Office Manager | Office Manager | B-2 | B-3 | |
| David Reich | Group Marketing Operations Manager | Group Marketing Operations Manager | B-2 | B-1 | |
| Lucie Brychtová | Group PR Manager | Group PR Manager | B-2 | B-3 | |
| Ondrej Bober | Development Operations Manager CZ/SK/PL/HU | Development Operations Manager CZ/SK/PL/HU | B-2 | B-3 | CZ/SK/PL/HU |
| David Chvojka | Group Segment Manager | Group Segment Manager | B-2 | B-3 | |
| Michal Kruliš | Regional Marketing Manager | Regional Marketing Manager | B-2 | BXX | CZ |
| Michaela Bečková | Cars Administration Manager | Cars Administration Manager_CZ | B-2 | B-3 | CZ |
| Pavla Smrčková | Group Back Office Manager | Group Back Office Manager | B-2 | B-3 | |
| Agnieszka Romańska | Back Office Manager_PL | Back Office Manager_PL | B-4 | B-3 | PL |
| Martin Medek | Country Sales Manager | Country Sales Manager_SK | B-3 | B-2 | SK |
| Robert Wiedner | Country Buying Manager | Country Buying Manager SK | B-3 | B-2 | SK |
| Bronislav Kroneisl | Country Stock Manager | Country Stock Manager_SK | B-3 | B-2 | SK |
| Michal Kóssi | Country Service Manager | Country Service Manager_SK | B-3 | B-2 | SK |
| Martin Bulíček | Country F&I Manager | Country FNI Manager SK | B-3 | B-2 | SK |
| Pavol Rodina | Facility & Construction Manager | Facility and Construction Manager_SK | B-3 | BXX | SK |
| Danko Beran | Financial Accounting Manager | Financial Accounting Manager_SK | B-3 | B-2 | SK |
| Jiří Vávra | Country Sales Manager | Country Sales Manager_PL | B-4 | B-2 | PL |
| Lukáš Jonšta | Country OPS Manager | Country OPS Manager_PL | B-4 | B-2 | PL |
| David Poncza | Country Stock Manager | Country Stock Manager_PL | B-4 | B-2 | PL |
| Filip Pavlovčin | Country Service Manager | Country Service Manager_PL | B-4 | B-2 | PL |
| Kamiński Krystian | Call Centre Manager | Call Centre Manager | B-4 | B-3 | PL |
| Michał Włodarczyk | Country HQ Manager | Country HQ Manager_PL | B-4 | B-3 | PL |
| Pawel Molasy | Country F&I and Relationship Manager | Country FNI and Relationship Manager_PL | B-4 | B-2 | PL |
| Marian Zielina | Regional Marketing Manager | Regional Marketing Manager_PL | B-4 | BXX | PL |
| Weronika Szmańda | Development Manager | Development Manager_PL | B-4 | BXX | PL |
| Barbara Wolska | Country Personnel & Staffing Manager | Country Personnel and Staffing Manager_PL | B-4 | B-3 | PL |
| Cegiel Klemens | Financial Accounting Manager | Financial Accounting Manager_PL | B-4 | B-2 | PL |
| Agnieszka Romańska | Back Office Manager_PL | Back Office Manager_PL | B-4 | B-3 | PL |
| Michal Válka | SWAP Manager | Swap Manager | B-4 | B-3 | DE |
| Ondrej Šuba | Country Buying Manager | Country Buying Manager_HU | B-4 | B-3 | HU |

## Title Differences Worth Reviewing

Most titles match after normalizing punctuation, underscores, and country suffixes. These are the meaningful differences:

| Person | Source title | Phonebook title |
| --- | --- | --- |
| Daniel Luňáček | Group Car Sales Director | Group Sales Director |
| Leoš Pilnaj | Group AutomotiveOPS Director | Group Automotive Operations Director |
| Lenka Zajíčková | Chief Legal Officer | Group Head of Legal |
| Eldar Vagabov | Chief Innovation Officer | Chief Innovations Officer |
| Jan Sokola | Country OPS Manager | Country Automotive Operations Manager |
| Michal Gabrhel | General Manager Mototechna 2.0 | General Manager_Mototechna |
| Ivo Baxant | Group IT Infrastructure Manager | Head of IT Infrastructure & Security |
| Martin Slabý | Group IT Project Manager | Head of IT Operations |
| Robert Šmol | Group IT Development Director | Head of IT Development |
| Katarína Němcová | Cars Administration Manager | Office Operations Manager_SK |

The F&I / FNI spelling differences are Phonebook conventions and should be normalized consistently if titles are refreshed.

