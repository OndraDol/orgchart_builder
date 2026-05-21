"""Audit orgchart source data against the vector PDF export.

The PDF exported from Visio contains both text positions and connector line
geometry. This script extracts card rectangles, groups connector segments into
logical components, matches cards to SOURCE_ORGCHART people, and writes a diff
that is useful for manual parent-child review.
"""

from __future__ import annotations

import argparse
import json
import math
import re
import unicodedata
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import fitz


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PDF_GLOBS = ("source/*Holding.pdf", "*Holding.pdf")
DEFAULT_SOURCE = ROOT / "src" / "data" / "sourceOrgchart.ts"
DEFAULT_PARENT_OVERRIDES = ROOT / "src" / "data" / "sourceParentOverrides.json"
DEFAULT_JSON_OUT = ROOT / "docs" / "audits" / "pdf-orgchart-audit.json"
DEFAULT_MD_OUT = ROOT / "docs" / "audits" / "pdf-orgchart-audit.md"


@dataclass(frozen=True)
class Rect:
  x0: float
  y0: float
  x1: float
  y1: float

  @property
  def width(self) -> float:
    return self.x1 - self.x0

  @property
  def height(self) -> float:
    return self.y1 - self.y0

  @property
  def center(self) -> tuple[float, float]:
    return ((self.x0 + self.x1) / 2, (self.y0 + self.y1) / 2)

  def as_list(self) -> list[float]:
    return [round(self.x0, 3), round(self.y0, 3), round(self.x1, 3), round(self.y1, 3)]


@dataclass(frozen=True)
class Card:
  index: int
  rect: Rect
  label: str

  @property
  def normalized(self) -> str:
    return normalize_text(self.label)


@dataclass(frozen=True)
class Segment:
  x0: float
  y0: float
  x1: float
  y1: float

  @property
  def endpoints(self) -> tuple[tuple[float, float], tuple[float, float]]:
    return ((self.x0, self.y0), (self.x1, self.y1))


def normalize_text(value: str) -> str:
  normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
  return re.sub(r"[^a-z0-9]+", " ", normalized.lower()).strip()


def dedupe_words(words: list[tuple[Any, ...]]) -> list[tuple[Any, ...]]:
  seen: set[tuple[float, float, float, float, str]] = set()
  result: list[tuple[Any, ...]] = []

  for word in words:
    key = (round(word[0], 1), round(word[1], 1), round(word[2], 1), round(word[3], 1), word[4])
    if key in seen:
      continue

    seen.add(key)
    result.append(word)

  return result


def extract_cards(page: fitz.Page) -> list[Card]:
  words = dedupe_words(page.get_text("words"))
  rects: list[Rect] = []

  for drawing in page.get_drawings():
    for item in drawing.get("items", []):
      if item[0] != "re":
        continue

      source_rect = item[1]
      rect = Rect(float(source_rect.x0), float(source_rect.y0), float(source_rect.x1), float(source_rect.y1))
      if not (35 <= rect.width <= 130 and 20 <= rect.height <= 75):
        continue

      if any(
        abs(rect.x0 - existing.x0) < 0.5
        and abs(rect.y0 - existing.y0) < 0.5
        and abs(rect.x1 - existing.x1) < 0.5
        and abs(rect.y1 - existing.y1) < 0.5
        for existing in rects
      ):
        continue

      rects.append(rect)

  cards: list[Card] = []
  for rect in rects:
    label = label_for_rect(rect, words)
    if not label or label == "01.04.2026":
      continue

    cards.append(Card(index=len(cards), rect=rect, label=label))

  return cards


def label_for_rect(rect: Rect, words: list[tuple[Any, ...]]) -> str:
  inside: list[tuple[Any, ...]] = []

  for word in words:
    cx = (word[0] + word[2]) / 2
    cy = (word[1] + word[3]) / 2
    if rect.x0 - 1 <= cx <= rect.x1 + 1 and rect.y0 - 1 <= cy <= rect.y1 + 1:
      inside.append(word)

  rows: list[tuple[float, list[tuple[Any, ...]]]] = []
  for word in sorted(inside, key=lambda item: (item[1], item[0])):
    if not rows or abs(rows[-1][0] - word[1]) > 2.5:
      rows.append((word[1], [word]))
    else:
      rows[-1][1].append(word)

  return " / ".join(" ".join(item[4] for item in sorted(row, key=lambda item: item[0])) for _, row in rows)


def extract_segments(page: fitz.Page) -> list[Segment]:
  segments: list[Segment] = []

  for drawing in page.get_drawings():
    for item in drawing.get("items", []):
      if item[0] != "l":
        continue

      p0 = item[1]
      p1 = item[2]
      segment = Segment(float(p0.x), float(p0.y), float(p1.x), float(p1.y))
      if distance((segment.x0, segment.y0), (segment.x1, segment.y1)) >= 1.5:
        segments.append(segment)

  return segments


class UnionFind:
  def __init__(self, size: int) -> None:
    self.parent = list(range(size))

  def find(self, item: int) -> int:
    while self.parent[item] != item:
      self.parent[item] = self.parent[self.parent[item]]
      item = self.parent[item]
    return item

  def union(self, left: int, right: int) -> None:
    left_root = self.find(left)
    right_root = self.find(right)
    if left_root != right_root:
      self.parent[right_root] = left_root


def group_segments(segments: list[Segment]) -> dict[int, list[int]]:
  groups = UnionFind(len(segments))

  for left_index, left in enumerate(segments):
    for right_index in range(left_index + 1, len(segments)):
      right = segments[right_index]

      if any(distance(a, b) <= 5 for a in left.endpoints for b in right.endpoints):
        groups.union(left_index, right_index)
        continue

      left_orientation = orientation(left)
      right_orientation = orientation(right)

      if (
        left_orientation == right_orientation == "H"
        and abs(left.y0 - right.y0) <= 1
        and range_gap(left.x0, left.x1, right.x0, right.x1) <= 5
      ):
        groups.union(left_index, right_index)
        continue

      if (
        left_orientation == right_orientation == "V"
        and abs(left.x0 - right.x0) <= 1
        and range_gap(left.y0, left.y1, right.y0, right.y1) <= 5
      ):
        groups.union(left_index, right_index)
        continue

      if {left_orientation, right_orientation} == {"H", "V"}:
        horizontal = left if left_orientation == "H" else right
        vertical = left if left_orientation == "V" else right
        hx0, hx1 = sorted((horizontal.x0, horizontal.x1))
        vy0, vy1 = sorted((vertical.y0, vertical.y1))
        if hx0 - 1 <= vertical.x0 <= hx1 + 1 and vy0 - 1 <= horizontal.y0 <= vy1 + 1:
          groups.union(left_index, right_index)

  components: dict[int, list[int]] = defaultdict(list)
  for index in range(len(segments)):
    components[groups.find(index)].append(index)

  return dict(components)


def orientation(segment: Segment) -> str:
  if abs(segment.y0 - segment.y1) < 0.5:
    return "H"
  if abs(segment.x0 - segment.x1) < 0.5:
    return "V"
  return "D"


def range_gap(a0: float, a1: float, b0: float, b1: float) -> float:
  left0, left1 = sorted((a0, a1))
  right0, right1 = sorted((b0, b1))
  if left1 < right0:
    return right0 - left1
  if right1 < left0:
    return left0 - right1
  return 0


def distance(left: tuple[float, float], right: tuple[float, float]) -> float:
  return math.hypot(left[0] - right[0], left[1] - right[1])


def touched_sides(segment: Segment, card: Card) -> set[str]:
  sides: set[str] = set()
  rect = card.rect

  for x, y in segment.endpoints:
    if rect.x0 - 2 <= x <= rect.x1 + 2:
      if abs(y - rect.y0) <= 2:
        sides.add("top")
      if abs(y - rect.y1) <= 2:
        sides.add("bottom")

    if rect.y0 - 2 <= y <= rect.y1 + 2:
      if abs(x - rect.x0) <= 2:
        sides.add("left")
      if abs(x - rect.x1) <= 2:
        sides.add("right")

  return sides


def load_parent_overrides(path: Path) -> dict[str, dict[str, str]]:
  if not path.exists():
    return {}

  data = json.loads(path.read_text(encoding="utf-8"))
  if not isinstance(data, list):
    raise ValueError(f"Parent override file must contain a list: {path}")

  overrides: dict[str, dict[str, str]] = {}
  for item in data:
    if not isinstance(item, dict):
      raise ValueError(f"Invalid parent override item in {path}: {item!r}")

    child_id = item.get("childId")
    parent_id = item.get("parentId")
    if not isinstance(child_id, str) or not isinstance(parent_id, str):
      raise ValueError(f"Parent override must contain string childId and parentId: {item!r}")

    overrides[child_id] = {
      "childId": child_id,
      "parentId": parent_id,
      "source": str(item.get("source", "")),
      "reason": str(item.get("reason", "")),
    }

  return overrides


def load_source_nodes(
  source_path: Path, parent_overrides: dict[str, dict[str, str]] | None = None
) -> list[dict[str, str | None]]:
  source = source_path.read_text(encoding="utf-8")
  node_pattern = re.compile(
    r"\{\s*id:\s*'([^']+)',\s*parentId:\s*(?:'([^']+)'|null),\s*title:\s*'([^']*)',\s*person:\s*'([^']*)'",
    re.S,
  )

  overrides = parent_overrides or {}
  nodes: list[dict[str, str | None]] = []

  for match in node_pattern.finditer(source):
    node_id = match.group(1)
    original_parent_id = match.group(2)
    override = overrides.get(node_id)
    nodes.append(
      {
        "id": node_id,
        "parentId": override["parentId"] if override else original_parent_id,
        "originalParentId": original_parent_id,
        "title": match.group(3),
        "person": match.group(4),
      }
    )

  return nodes


def build_audit(pdf_path: Path, source_path: Path, parent_override_path: Path = DEFAULT_PARENT_OVERRIDES) -> dict[str, Any]:
  document = fitz.open(pdf_path)
  page = document[0]
  cards = extract_cards(page)
  segments = extract_segments(page)
  components = group_segments(segments)
  parent_overrides = load_parent_overrides(parent_override_path)
  source_nodes = load_source_nodes(source_path, parent_overrides)

  card_components: dict[int, dict[int, set[str]]] = defaultdict(lambda: defaultdict(set))
  component_cards: dict[int, list[dict[str, Any]]] = defaultdict(list)

  for component_id, segment_indexes in components.items():
    for card in cards:
      sides: set[str] = set()
      for segment_index in segment_indexes:
        sides.update(touched_sides(segments[segment_index], card))

      if sides:
        card_components[card.index][component_id].update(sides)
        component_cards[component_id].append(
          {
            "cardIndex": card.index,
            "label": card.label,
            "sides": sorted(sides),
            "rect": card.rect.as_list(),
          }
        )

  person_to_card_indexes: dict[str, list[int]] = defaultdict(list)
  for node in source_nodes:
    person = node["person"]
    if not person:
      continue

    normalized_person = normalize_text(person)
    for card in cards:
      if normalized_person and normalized_person in card.normalized:
        person_to_card_indexes[person].append(card.index)

  cards_by_index = {card.index: card for card in cards}
  source_node_matches = [
    {
      "id": node["id"],
      "title": node["title"],
      "person": node["person"],
      "cards": [
        {
          "cardIndex": card_index,
          "label": cards_by_index[card_index].label,
          "rect": cards_by_index[card_index].rect.as_list(),
        }
        for card_index in person_to_card_indexes.get(str(node["person"]), [])
      ],
    }
    for node in source_nodes
    if node["person"]
  ]

  id_to_node = {node["id"]: node for node in source_nodes}
  unsupported_edges: list[dict[str, Any]] = []
  ambiguous_source_edges: list[dict[str, Any]] = []
  confirmed_override_edges: list[dict[str, Any]] = []
  parent_review_rows: list[dict[str, Any]] = []
  parent_override_errors: list[dict[str, str]] = []
  source_edge_evidence: list[dict[str, Any]] = []
  supported_edge_count = 0
  confirmed_override_count = 0
  skipped_edge_count = 0
  unresolved_parent_links = 0

  for child_id, override in parent_overrides.items():
    if child_id not in id_to_node:
      parent_override_errors.append(
        {"childId": child_id, "parentId": override["parentId"], "error": "childId not found in source nodes"}
      )
    elif override["parentId"] not in id_to_node:
      parent_override_errors.append(
        {"childId": child_id, "parentId": override["parentId"], "error": "parentId not found in source nodes"}
      )

  def node_card_indexes(node: dict[str, str | None]) -> list[int]:
    return person_to_card_indexes.get(str(node["person"]), []) if node["person"] else []

  def component_ids_for_card_indexes(card_indexes: list[int]) -> set[int]:
    return set().union(*(card_components[index].keys() for index in card_indexes)) if card_indexes else set()

  def matching_components_for(
    child: dict[str, str | None], parent: dict[str, str | None]
  ) -> tuple[list[int], list[int], list[int], list[int]]:
    child_card_indexes = node_card_indexes(child)
    parent_card_indexes = node_card_indexes(parent)
    child_component_ids = component_ids_for_card_indexes(child_card_indexes)
    parent_component_ids = component_ids_for_card_indexes(parent_card_indexes)
    return (
      sorted(child_component_ids & parent_component_ids),
      child_card_indexes,
      parent_card_indexes,
      sorted(child_component_ids),
    )

  def candidate_parent_count(child: dict[str, str | None]) -> int:
    child_card_indexes = node_card_indexes(child)
    child_component_ids = component_ids_for_card_indexes(child_card_indexes)
    if not child_component_ids:
      return 0

    count = 0
    for candidate in source_nodes:
      if candidate["id"] == child["id"] or not candidate["person"]:
        continue

      candidate_component_ids = component_ids_for_card_indexes(node_card_indexes(candidate))
      if child_component_ids & candidate_component_ids:
        count += 1

    return count

  for node in source_nodes:
    parent_id = node["parentId"]
    if parent_id is None:
      continue

    parent = id_to_node.get(parent_id)
    override = parent_overrides.get(str(node["id"]))
    if not parent or not node["person"] or not parent["person"]:
      skipped_edge_count += 1
      source_edge_evidence.append(
        {
          "childId": node["id"],
          "childTitle": node["title"],
          "childPerson": node["person"],
          "parentId": parent_id,
          "originalParentId": node.get("originalParentId"),
          "parentTitle": parent["title"] if parent else None,
          "parentPerson": parent["person"] if parent else None,
          "status": "skipped",
          "selectedParentSource": "confirmedOverride" if override else "geometry",
          "selectedParentConfidence": "skipped",
          "matchingComponents": [],
          "childCards": [],
          "parentCards": [],
          "childComponentIds": [],
          "candidateParentCount": 0,
        }
      )
      continue

    matching_components, child_card_indexes, parent_card_indexes, child_component_ids = matching_components_for(
      node, parent
    )
    candidate_count = candidate_parent_count(node)

    base_edge = {
      "childId": node["id"],
      "childTitle": node["title"],
      "childPerson": node["person"],
      "parentId": parent["id"],
      "originalParentId": node.get("originalParentId"),
      "parentTitle": parent["title"],
      "parentPerson": parent["person"],
      "matchingComponents": matching_components,
      "childCards": child_card_indexes,
      "parentCards": parent_card_indexes,
      "childComponentIds": child_component_ids,
      "candidateParentCount": candidate_count,
    }

    if override:
      confirmed_override_count += 1
      override_edge = {
        **base_edge,
        "status": "confirmedOverride",
        "selectedParentSource": "confirmedOverride",
        "selectedParentConfidence": "confirmed",
        "overrideSource": override.get("source", ""),
        "overrideReason": override.get("reason", ""),
      }
      confirmed_override_edges.append(override_edge)
      source_edge_evidence.append(override_edge)
      parent_review_rows.append(override_edge)
    elif matching_components:
      supported_edge_count += 1
      supported_edge = {
        **base_edge,
        "status": "supported",
        "selectedParentSource": "geometry",
        "selectedParentConfidence": "high",
      }
      source_edge_evidence.append(supported_edge)
      parent_review_rows.append(supported_edge)
    else:
      unsupported_edge = {
        **base_edge,
        "status": "unsupported",
        "selectedParentSource": "geometry",
        "selectedParentConfidence": "unresolved",
      }
      unresolved_parent_links += 1
      unsupported_edges.append(unsupported_edge)
      ambiguous_source_edges.append(unsupported_edge)
      source_edge_evidence.append(unsupported_edge)
      parent_review_rows.append(unsupported_edge)

  duplicate_labels = [
    {"label": label, "count": count}
    for label, count in sorted(Counter(card.label for card in cards).items())
    if count > 1
  ]
  unmatched_people = [
    node
    for node in source_nodes
    if node["person"] and not person_to_card_indexes.get(str(node["person"]))
  ]

  meaningful_components = [
    {
      "componentId": component_id,
      "segmentCount": len(components[component_id]),
      "cards": sorted(component_cards[component_id], key=lambda item: (item["rect"][1], item["rect"][0])),
    }
    for component_id in sorted(component_cards)
    if len(component_cards[component_id]) >= 2
  ]

  multi_component_cards = [
    {
      "cardIndex": card.index,
      "label": card.label,
      "rect": card.rect.as_list(),
      "components": {
        str(component_id): sorted(sides)
        for component_id, sides in sorted(card_components.get(card.index, {}).items())
      },
    }
    for card in cards
    if len(card_components.get(card.index, {})) > 1
  ]

  return {
    "pdf": str(pdf_path),
    "source": str(source_path),
    "parentOverrides": str(parent_override_path),
    "summary": {
      "pdfCards": len(cards),
      "uniquePdfCardLabels": len(set(card.label for card in cards)),
      "sourceNodes": len(source_nodes),
      "sourcePeople": sum(1 for node in source_nodes if node["person"]),
      "connectorSegments": len(segments),
      "connectorComponents": len(components),
      "connectorComponentsWithMultipleCards": len(meaningful_components),
      "sourceEdgesSupportedBySameConnectorComponent": supported_edge_count,
      "sourceEdgesResolvedByConfirmedOverride": confirmed_override_count,
      "sourceEdgesAmbiguous": len(ambiguous_source_edges),
      "sourceEdgesNotInSameConnectorComponent": len(unsupported_edges),
      "sourceEdgesSkipped": skipped_edge_count,
      "parentOverrideErrors": len(parent_override_errors),
      "multiComponentCards": len(multi_component_cards),
      "unresolvedParentLinks": unresolved_parent_links + len(parent_override_errors),
    },
    "confirmedParentOverrides": list(parent_overrides.values()),
    "parentOverrideErrors": parent_override_errors,
    "duplicatePdfLabels": duplicate_labels,
    "unmatchedSourcePeople": unmatched_people,
    "multiComponentCards": multi_component_cards,
    "sourceNodeMatches": source_node_matches,
    "sourceEdgeEvidence": source_edge_evidence,
    "parentReviewRows": parent_review_rows,
    "confirmedOverrideEdges": confirmed_override_edges,
    "ambiguousSourceEdges": ambiguous_source_edges,
    "sourceEdgesNotInSameConnectorComponent": unsupported_edges,
    "connectorComponents": meaningful_components,
    "cards": [
      {
        "cardIndex": card.index,
        "label": card.label,
        "rect": card.rect.as_list(),
        "components": {
          str(component_id): sorted(sides)
          for component_id, sides in sorted(card_components.get(card.index, {}).items())
        },
      }
      for card in cards
    ],
  }


def write_markdown(audit: dict[str, Any], path: Path) -> None:
  lines = [
    "# PDF Orgchart Audit",
    "",
    "Generated by `python scripts/audit_pdf_orgchart.py`.",
    "",
    "## Summary",
    "",
  ]

  for key, value in audit["summary"].items():
    lines.append(f"- `{key}`: {value}")

  lines.extend(["", "## Unsupported Source Edges", ""])
  for item in audit["sourceEdgesNotInSameConnectorComponent"]:
    lines.append(
      f"- {item['childPerson']} ({item['childTitle']}) -> "
      f"{item['parentPerson']} ({item['parentTitle']})"
    )

  lines.extend(["", "## Confirmed Parent Overrides", ""])
  if audit["confirmedOverrideEdges"]:
    for item in audit["confirmedOverrideEdges"]:
      lines.append(
        f"- {item['childPerson']} ({item['childTitle']}) -> "
        f"{item['parentPerson']} ({item['parentTitle']}); "
        f"original parent id: `{item['originalParentId']}`; "
        f"components: `{','.join(str(component) for component in item['matchingComponents'])}`"
      )
  else:
    lines.append("- none")

  lines.extend(["", "## Parent Review Table", ""])
  lines.append("| Child | Parent | Status | Source | Confidence | Components | Candidate parents |")
  lines.append("|---|---|---|---|---|---:|---:|")
  for item in audit["parentReviewRows"]:
    components = ",".join(str(component) for component in item["matchingComponents"]) or "-"
    lines.append(
      f"| {item['childPerson']} ({item['childTitle']}) "
      f"| {item['parentPerson']} ({item['parentTitle']}) "
      f"| `{item['status']}` "
      f"| `{item['selectedParentSource']}` "
      f"| `{item['selectedParentConfidence']}` "
      f"| {components} "
      f"| {item['candidateParentCount']} |"
    )

  lines.extend(["", "## Multi-Component PDF Cards", ""])
  for item in audit["multiComponentCards"]:
    components = ", ".join(
      f"{component_id}:{','.join(sides)}" for component_id, sides in item["components"].items()
    )
    lines.append(f"- card {item['cardIndex']}: {item['label']} (`{components}`)")

  lines.extend(["", "## Duplicate PDF Labels", ""])
  for item in audit["duplicatePdfLabels"]:
    lines.append(f"- {item['label']} ({item['count']}x)")

  lines.extend(["", "## Connector Components", ""])
  for component in audit["connectorComponents"]:
    lines.append(f"### Component {component['componentId']} ({component['segmentCount']} segments)")
    for card in component["cards"]:
      lines.append(f"- `{','.join(card['sides'])}` {card['label']}")
    lines.append("")

  path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def find_default_pdf() -> Path:
  matches: list[Path] = []
  for pattern in DEFAULT_PDF_GLOBS:
    matches.extend(sorted(ROOT.glob(pattern)))

  if not matches:
    raise FileNotFoundError(f"No PDF matching {DEFAULT_PDF_GLOBS!r} found in {ROOT}")
  return matches[0]


def main() -> None:
  parser = argparse.ArgumentParser(description=__doc__)
  parser.add_argument("--pdf", type=Path, default=None)
  parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
  parser.add_argument("--parent-overrides", type=Path, default=DEFAULT_PARENT_OVERRIDES)
  parser.add_argument("--json-out", type=Path, default=DEFAULT_JSON_OUT)
  parser.add_argument("--md-out", type=Path, default=DEFAULT_MD_OUT)
  args = parser.parse_args()

  pdf_path = args.pdf or find_default_pdf()
  audit = build_audit(pdf_path, args.source, args.parent_overrides)

  args.json_out.parent.mkdir(parents=True, exist_ok=True)
  args.md_out.parent.mkdir(parents=True, exist_ok=True)
  args.json_out.write_text(json.dumps(audit, ensure_ascii=False, indent=2), encoding="utf-8")
  write_markdown(audit, args.md_out)

  print(json.dumps(audit["summary"], ensure_ascii=False, indent=2))
  print(f"Wrote {args.json_out}")
  print(f"Wrote {args.md_out}")


if __name__ == "__main__":
  main()
