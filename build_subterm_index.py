"""Build the public, non-quoting sub-term/criterion support index for TASK 06.

This builder deliberately emits only aggregate counts and indices into PLATFORM's already
published case file.  The richer ART_CASE source contains paper passages that are not all
rights-cleared; copying those passages or paper ids into this repository would expand their
publication.  Exact (paper, thing) joins are used only to locate overlaps with the existing
public benchmark.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


HERE = Path(__file__).resolve().parent
PROJECT = HERE.parent
SOURCE = PROJECT / "ART_CASE" / "object_scores.json"
PUBLIC_CASES = HERE / "data" / "cases.json"
OUT_JSON = HERE / "data" / "subterm_index.json"
OUT_JS = HERE / "data" / "subterm_index.inline.js"


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    source = load(SOURCE)
    public_cases = load(PUBLIC_CASES)

    lookup: dict[tuple[str, str], list[int]] = {}
    for index, row in enumerate(public_cases):
        lookup.setdefault((str(row.get("paper", "")), str(row.get("thing", ""))), []).append(index)

    overlaps = []
    for row in source.get("cases", []):
        verdict = row.get("asserted")
        if verdict not in {"object", "not-object", "undecided"}:
            continue
        for index in lookup.get((str(row.get("paper", "")), str(row.get("thing", ""))), []):
            overlaps.append({"case_index": index, "object_layer_verdict": verdict})

    # A duplicated exact join would make a case appear to carry more evidence than it does.
    seen = set()
    unique = []
    for row in overlaps:
        key = (row["case_index"], row["object_layer_verdict"])
        if key not in seen:
            seen.add(key)
            unique.append(row)
    unique.sort(key=lambda row: row["case_index"])

    counts = {name: sum(row["object_layer_verdict"] == name for row in unique)
              for name in ("object", "not-object", "undecided")}
    output = {
        "schema_version": "task06-subterm-index-1",
        "method": "exact (paper, thing) join; output contains no source passages or source paper ids",
        "source_sha256": sha256(SOURCE),
        "public_cases_sha256": sha256(PUBLIC_CASES),
        "concepts": {
            "art": {
                "mapping_method": "user-confirmed; no automatic semantic inference",
                "criterion_verdict_columns": 0,
                "reviewed_terms": [{
                    "id": "object",
                    "label_en": "object",
                    "label_he": "אובייקט",
                    "layer_en": "reviewed genus/type commitment",
                    "layer_he": "מחויבות סוג/טיפוס שנבדקה",
                    "source_checked": int(source.get("checked", 0)),
                    "source_counts": {
                        "object": int(source.get("P", 0)),
                        "not_object": int(source.get("N", 0)),
                        "undecided": int(source.get("U", 0)),
                    },
                    "public_case_overlap": {
                        "matched": len(unique),
                        "object": counts["object"],
                        "not_object": counts["not-object"],
                        "undecided": counts["undecided"],
                        "cases": unique,
                    },
                }],
            },
            "game": {
                "mapping_method": "unavailable; no reviewed criteria/sub-term layer",
                "criterion_verdict_columns": 0,
                "reviewed_terms": [],
            },
        },
    }

    rendered = json.dumps(output, ensure_ascii=False, indent=2) + "\n"
    OUT_JSON.write_text(rendered, encoding="utf-8")
    OUT_JS.write_text("window.MTP_SUBTERM_INDEX=" +
                      json.dumps(output, ensure_ascii=False, separators=(",", ":")) + ";\n",
                      encoding="utf-8")
    print(f"sub-term index: {len(unique)} public overlaps "
          f"({counts['object']} object, {counts['not-object']} not-object, "
          f"{counts['undecided']} undecided); source checked {source.get('checked', 0)}")


if __name__ == "__main__":
    main()
