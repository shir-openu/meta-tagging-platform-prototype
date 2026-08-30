#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build the Task 06 sense index and its audit report without mutating the corpus.

Inputs (read only):
  ../DATA/corpus.json
  data/term_corpus.json

Outputs (derived and reproducible):
  data/sense_index.json
  data/sense_index.inline.js
  data/sense_index_report.json
  data/sense_index_report.md

The corpus's ``senses[].label`` values are curatorial glosses, not necessarily sentences the
paper's authors wrote.  This build keeps that distinction explicit and always ships the exact
attesting passage beside the gloss.  It also refuses semantic alias guessing: a parsed head is
bound to a picker term only when case-folded text matches exactly, optionally after removing one
pair of presentation quotes/backticks around the entire head.
"""

from __future__ import annotations

import hashlib
import json
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
PROJECT = ROOT.parent
CORPUS = PROJECT / "DATA" / "corpus.json"
TERM_CORPUS = ROOT / "data" / "term_corpus.json"
OUT_INDEX = ROOT / "data" / "sense_index.json"
OUT_INLINE = ROOT / "data" / "sense_index.inline.js"
OUT_REPORT = ROOT / "data" / "sense_index_report.json"
OUT_REPORT_MD = ROOT / "data" / "sense_index_report.md"

# Publication rights are decided by the same audited allow-list as the paper-page builders.
# The record's own `license` field is deliberately not consulted: it is known to be wrong in
# both directions.  Import the predicate from the project toolbox and fail closed if it cannot
# produce a non-empty result.
sys.path.insert(0, str(PROJECT / "TOOLS"))
from build_paper_edition import cleared_ids  # noqa: E402

DELIMITER = re.compile(r" (?:-|—) ")
WRAPPERS = (("`", "`"), ('"', '"'), ("'", "'"), ("“", "”"), ("‘", "’"))


def slug(text: str) -> str:
    """Match the platform's ASCII picker slug rule."""
    return re.sub(r"[^a-z0-9]+", "-", (text or "").lower()).strip("-")[:60]


def source_url(record: dict[str, Any]) -> str:
    identifiers = {
        item.get("type"): item.get("value")
        for item in (record.get("idno") or [])
        if isinstance(item, dict)
    }
    if identifiers.get("doi"):
        return "https://doi.org/" + str(identifiers["doi"])
    if identifiers.get("arxiv"):
        return "https://arxiv.org/abs/" + str(identifiers["arxiv"])
    return str(identifiers.get("url") or record.get("fulltext_url") or "")


def authors(record: dict[str, Any]) -> list[str]:
    rows = [x for x in (record.get("creators") or []) if isinstance(x, dict)]
    named = [str(x.get("name")) for x in rows if x.get("name") and x.get("role") == "author"]
    if not named:
        named = [str(x.get("name")) for x in rows if x.get("name")]
    return named


def unwrap_head(head: str) -> tuple[str, bool]:
    value = head.strip()
    for left, right in WRAPPERS:
        if len(value) >= len(left) + len(right) and value.startswith(left) and value.endswith(right):
            return value[len(left) : len(value) - len(right)].strip(), True
    return value, False


def atomic_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(path.name + ".tmp-task06")
    temp.write_text(text, encoding="utf-8", newline="\n")
    temp.replace(path)


def parse_label(label: str) -> dict[str, Any]:
    matches = list(DELIMITER.finditer(label))
    if not matches:
        return {"status": "hard_failure", "delimiter_count": 0, "head": None, "gloss": None}
    first = matches[0]
    head = label[: first.start()].strip()
    gloss = label[first.end() :].strip()
    return {
        "status": "parsed" if len(matches) == 1 else "delimiter_ambiguous",
        "delimiter_count": len(matches),
        "head": head,
        "gloss": gloss,
    }


def main() -> int:
    corpus_bytes = CORPUS.read_bytes()
    corpus = json.loads(corpus_bytes.decode("utf-8"))
    term_corpus = json.loads(TERM_CORPUS.read_text(encoding="utf-8"))
    records = corpus["records"]
    cleared = set(cleared_ids())
    if not cleared:
        raise RuntimeError("cleared_ids() returned an empty set; refusing to build public quotes")

    picker_by_fold: dict[str, list[tuple[str, str]]] = defaultdict(list)
    for term_slug, entry in term_corpus.get("terms", {}).items():
        label = str(entry[0])
        picker_by_fold[label.casefold()].append((term_slug, label))

    generated = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    source = {
        "path": "../DATA/corpus.json",
        "sha256": hashlib.sha256(corpus_bytes).hexdigest(),
        "bytes": len(corpus_bytes),
        "records": len(records),
        "schema_version": corpus.get("schema_version"),
    }

    paper_rows: dict[str, dict[str, Any]] = {}
    sense_rows: list[dict[str, Any]] = []
    picker_terms: dict[str, list[int]] = defaultdict(list)
    canonical_terms: dict[str, dict[str, Any]] = {}
    hard_failures: list[dict[str, Any]] = []
    ambiguities: list[dict[str, Any]] = []
    mismatches: dict[str, dict[str, Any]] = {}
    published_mismatches: dict[str, dict[str, Any]] = {}
    withdrawn: list[dict[str, Any]] = []
    delimiter_histogram: Counter[int] = Counter()
    paper_head_counts: Counter[tuple[str, str]] = Counter()
    active_paper_ids: set[str] = set()
    ascii_delimiter_rows = 0
    em_delimiter_rows = 0
    exact_bindings = 0
    wrapper_bindings = 0
    missing_locators = 0

    for record in records:
        paper_id = str(record["id"])
        anchor_by_field = {
            str(anchor.get("field")): anchor
            for anchor in (record.get("anchors") or [])
            if isinstance(anchor, dict) and anchor.get("field")
        }
        senses = record.get("senses") or []
        for position, sense in enumerate(senses):
            if not isinstance(sense, dict):
                continue
            sense_id = f"{paper_id}:senses[{position}]"
            label = str(sense.get("label") or "")
            if sense.get("withdrawn_reason"):
                withdrawn.append({
                    "sense_id": sense_id,
                    "paper_id": paper_id,
                    "label": label,
                    "reason": str(sense.get("withdrawn_reason") or ""),
                })
                continue

            active_paper_ids.add(paper_id)
            parsed = parse_label(label)
            delimiter_histogram[parsed["delimiter_count"]] += 1
            ascii_delimiter_rows += int(" - " in label)
            em_delimiter_rows += int(" — " in label)
            head = parsed["head"]
            gloss = parsed["gloss"]
            binding_status = "unparsed"
            picker_slug = None
            picker_label = None

            if head is not None:
                paper_head_counts[(paper_id, head.casefold())] += 1
                candidates = picker_by_fold.get(head.casefold(), [])
                if len(candidates) == 1:
                    picker_slug, picker_label = candidates[0]
                    binding_status = "exact_casefold"
                    exact_bindings += 1
                else:
                    clean, changed = unwrap_head(head)
                    candidates = picker_by_fold.get(clean.casefold(), []) if changed else []
                    if len(candidates) == 1:
                        picker_slug, picker_label = candidates[0]
                        binding_status = "presentation_wrapper_removed"
                        wrapper_bindings += 1
                    elif len(candidates) > 1 or len(picker_by_fold.get(head.casefold(), [])) > 1:
                        binding_status = "picker_ambiguous"
                    else:
                        binding_status = "no_picker_match"

                canonical_id = "sense-term-" + hashlib.sha1(head.casefold().encode("utf-8")).hexdigest()[:12]
                term = canonical_terms.setdefault(canonical_id, {
                    "head": head,
                    "sense_indices": [],
                    "picker_slugs": [],
                })
                term["sense_indices"].append(len(sense_rows))
                if picker_slug and picker_slug not in term["picker_slugs"]:
                    term["picker_slugs"].append(picker_slug)

            field = f"senses[{position}].evidence"
            anchor = anchor_by_field.get(field)
            locator = None
            if anchor:
                locator = {
                    "field": field,
                    # Python produced these offsets, so start/end count Unicode code points.
                    # JavaScript/.NET consumers must not treat them as UTF-16 code units.
                    "index": "unicode-code-point",
                    "start": anchor.get("start"),
                    "end": anchor.get("end"),
                    "occurrences": anchor.get("occurrences"),
                    "text_sha1": anchor.get("text_sha1"),
                }
            else:
                missing_locators += 1

            citation = record.get("citations") if isinstance(record.get("citations"), dict) else None
            row = {
                "sense_id": sense_id,
                "paper_id": paper_id,
                "source_field": field,
                "label": label,
                "head": head,
                "gloss": gloss,
                "evidence": str(sense.get("evidence") or ""),
                "confidence": sense.get("confidence"),
                "parse_status": parsed["status"],
                "delimiter_count": parsed["delimiter_count"],
                "binding_status": binding_status,
                "picker_slug": picker_slug,
                "picker_label": picker_label,
                "wording_kind": "curatorial_gloss",
                "evidence_kind": "verbatim_source_passage",
                "locator": locator,
            }
            sense_rows.append(row)
            sense_index = len(sense_rows) - 1
            if picker_slug:
                picker_terms[picker_slug].append(sense_index)

            small = {"sense_id": sense_id, "paper_id": paper_id, "label": label}
            if parsed["status"] == "hard_failure":
                hard_failures.append(small)
            elif parsed["status"] == "delimiter_ambiguous":
                ambiguities.append({**small, "delimiter_count": parsed["delimiter_count"], "head": head})
            if head is not None and not picker_slug:
                key = head.casefold()
                item = mismatches.setdefault(key, {"head": head, "rows": 0, "examples": []})
                item["rows"] += 1
                if len(item["examples"]) < 3:
                    item["examples"].append(small)
                if paper_id in cleared:
                    public_item = published_mismatches.setdefault(
                        key, {"head": head, "rows": 0, "examples": []})
                    public_item["rows"] += 1
                    if len(public_item["examples"]) < 3:
                        public_item["examples"].append(small)

        if paper_id in active_paper_ids and paper_id not in paper_rows:
            citation = record.get("citations") if isinstance(record.get("citations"), dict) else None
            paper_rows[paper_id] = {
                "title": str(record.get("title") or paper_id),
                "authors": authors(record),
                "year": record.get("year"),
                "date": record.get("date"),
                "discipline": str(record.get("discipline") or "uncategorised"),
                "source_url": source_url(record),
                "citations": ({
                    "count": citation.get("count"),
                    "source": citation.get("source"),
                    "fetched": citation.get("fetched"),
                    "openalex": citation.get("openalex"),
                } if citation and citation.get("count") is not None else None),
            }

    multi_head_groups = []
    for (paper_id, folded_head), count in sorted(paper_head_counts.items()):
        if count > 1:
            indices = [
                i for i, row in enumerate(sense_rows)
                if row["paper_id"] == paper_id and (row.get("head") or "").casefold() == folded_head
            ]
            multi_head_groups.append({
                "paper_id": paper_id,
                "head": sense_rows[indices[0]]["head"],
                "sense_count": count,
                "sense_indices": indices,
            })

    paper_sense_counts = Counter(row["paper_id"] for row in sense_rows)
    multi_sense_papers = [
        {"paper_id": paper_id, "sense_count": count}
        for paper_id, count in sorted(paper_sense_counts.items())
        if count > 1
    ]
    missing_year_papers = sorted(pid for pid, paper in paper_rows.items() if not paper.get("year"))
    missing_citation_papers = sorted(pid for pid, paper in paper_rows.items() if not paper.get("citations"))
    unmatched_rows = sum(item["rows"] for item in mismatches.values())

    counts = {
        "sense_rows_total": len(sense_rows) + len(withdrawn),
        "sense_rows_active": len(sense_rows),
        "withdrawn_rows": len(withdrawn),
        "hard_parse_failures": len(hard_failures),
        "delimiter_ambiguities": len(ambiguities),
        "single_delimiter_rows": delimiter_histogram[1],
        "ascii_delimiter_rows": ascii_delimiter_rows,
        "em_dash_delimiter_rows": em_delimiter_rows,
        "picker_exact_casefold_rows": exact_bindings,
        "picker_wrapper_cleaned_rows": wrapper_bindings,
        "picker_unmatched_parsed_rows": unmatched_rows,
        "active_sense_papers": len(paper_rows),
        "canonical_parsed_heads": len(canonical_terms),
        "picker_terms_with_grounded_senses": len(picker_terms),
        "multi_sense_papers": len(multi_sense_papers),
        "multi_sense_paper_head_groups": len(multi_head_groups),
        "missing_year_papers": len(missing_year_papers),
        "missing_year_sense_rows": sum(1 for row in sense_rows if not paper_rows[row["paper_id"]].get("year")),
        "missing_citation_papers": len(missing_citation_papers),
        "missing_citation_sense_rows": sum(1 for row in sense_rows if not paper_rows[row["paper_id"]].get("citations")),
        "missing_quote_locators": missing_locators,
    }

    # The counts audit every corpus row.  Both the browser-facing index AND the report's row-level
    # examples can contain paper expression, so both MUST be rights-cleared. Re-index after
    # filtering so every picker and canonical-term pointer remains valid in the public array.
    published_old_indices = [
        old_index for old_index, row in enumerate(sense_rows)
        if row["paper_id"] in cleared
    ]
    old_to_new = {old: new for new, old in enumerate(published_old_indices)}
    published_senses = [sense_rows[old] for old in published_old_indices]
    published_paper_ids = {row["paper_id"] for row in published_senses}
    published_papers = {
        paper_id: paper for paper_id, paper in paper_rows.items()
        if paper_id in published_paper_ids
    }
    published_picker_terms = {
        term_slug: [old_to_new[old] for old in indices if old in old_to_new]
        for term_slug, indices in sorted(picker_terms.items())
        if any(old in old_to_new for old in indices)
    }
    published_canonical_terms = {}
    for canonical_id, term in canonical_terms.items():
        indices = [old_to_new[old] for old in term["sense_indices"] if old in old_to_new]
        if not indices:
            continue
        public_slugs = sorted({
            published_senses[index]["picker_slug"]
            for index in indices if published_senses[index].get("picker_slug")
        })
        published_canonical_terms[canonical_id] = {
            "head": term["head"],
            "sense_indices": indices,
            "picker_slugs": public_slugs,
        }
    public_term_paper_counts = {
        term_slug: len({published_senses[index]["paper_id"] for index in indices})
        for term_slug, indices in published_picker_terms.items()
    }
    counts.update({
        "rights_cleared_manifest_ids": len(cleared),
        "published_sense_rows": len(published_senses),
        "withheld_sense_rows_rights": len(sense_rows) - len(published_senses),
        "published_sense_papers": len(published_papers),
        "published_picker_terms_with_grounded_senses": len(published_picker_terms),
        "published_picker_terms_multi_paper": sum(
            paper_count >= 2 for paper_count in public_term_paper_counts.values()
        ),
        "published_picker_terms_one_paper": sum(
            paper_count == 1 for paper_count in public_term_paper_counts.values()
        ),
        "published_hard_parse_failures": sum(
            row["paper_id"] in cleared for row in hard_failures
        ),
        "published_delimiter_ambiguities": sum(
            row["paper_id"] in cleared for row in ambiguities
        ),
    })

    index = {
        "schema_version": "task06-sense-index-1",
        "generated_utc": generated,
        "source": source,
        "counts": counts,
        "semantics": {
            "displayed_label": "project curatorial gloss; not attributed as the paper author's wording",
            "evidence": "verbatim attesting passage stored in DATA/corpus.json",
            "picker_binding": "case-folded exact text, with only matching outer quote/backtick removal allowed",
            "withdrawal_rule": "rows carrying withdrawn_reason are reported but excluded",
            "rights_gate": "verbatim passages are included only when build_paper_edition.cleared_ids() allows the paper",
            "anchor_index": "locator start/end count Unicode code points, not UTF-16 code units",
        },
        "papers": published_papers,
        "senses": published_senses,
        "canonical_terms": published_canonical_terms,
        "picker_terms": published_picker_terms,
    }
    report = {
        "schema_version": "task06-sense-index-report-1",
        "generated_utc": generated,
        "source": source,
        "counts": counts,
        "semantics": {
            "global_counts": "counts audit the complete local corpus snapshot",
            "row_level_details": "examples are included only for papers allowed by build_paper_edition.cleared_ids()",
        },
        "delimiter_histogram": {str(k): v for k, v in sorted(delimiter_histogram.items())},
        "hard_failures": [row for row in hard_failures if row["paper_id"] in cleared],
        "delimiter_ambiguities": [row for row in ambiguities if row["paper_id"] in cleared],
        "term_head_mismatches": sorted(
            published_mismatches.values(), key=lambda x: (-x["rows"], x["head"].casefold())),
        "withdrawn_rows": [row for row in withdrawn if row["paper_id"] in cleared],
        "multi_sense_papers": [row for row in multi_sense_papers if row["paper_id"] in cleared],
        "multi_sense_paper_head_groups": [
            row for row in multi_head_groups if row["paper_id"] in cleared
        ],
        "missing_year_papers": [paper_id for paper_id in missing_year_papers if paper_id in cleared],
        "missing_citation_papers": [
            paper_id for paper_id in missing_citation_papers if paper_id in cleared
        ],
    }

    index_json = json.dumps(index, ensure_ascii=False, separators=(",", ":"))
    report_json = json.dumps(report, ensure_ascii=False, separators=(",", ":"))
    atomic_text(OUT_INDEX, index_json + "\n")
    atomic_text(OUT_INLINE, "window.MTP_SENSE_INDEX=" + index_json + ";\nwindow.MTP_SENSE_REPORT=" + report_json + ";\n")
    atomic_text(OUT_REPORT, report_json + "\n")

    mismatch_examples = "\n".join(
        f"- `{item['head']}` — {item['rows']} row(s)"
        for item in report["term_head_mismatches"][:50]
    )
    markdown = f"""# Task 06 sense-index failure report

Generated {generated} from `DATA/corpus.json` SHA-256 `{source['sha256']}`.

| Finding | Count |
|---|---:|
| Active grounded sense rows | {counts['sense_rows_active']:,} |
| Verbatim sense rows published after audited rights gate | {counts['published_sense_rows']:,} |
| Verbatim sense rows withheld by rights gate | {counts['withheld_sense_rows_rights']:,} |
| Picker terms with publishable grounded senses | {counts['published_picker_terms_with_grounded_senses']:,} |
| Publishable multi-paper picker terms | {counts['published_picker_terms_multi_paper']:,} |
| Publishable one-paper picker terms | {counts['published_picker_terms_one_paper']:,} |
| Withdrawn rows excluded | {counts['withdrawn_rows']:,} |
| Hard delimiter failures | {counts['hard_parse_failures']:,} |
| Rights-cleared hard delimiter examples published | {counts['published_hard_parse_failures']:,} |
| Delimiter-ambiguous rows | {counts['delimiter_ambiguities']:,} |
| Rights-cleared delimiter-ambiguous examples published | {counts['published_delimiter_ambiguities']:,} |
| Parsed rows bound by exact case-folded picker label | {counts['picker_exact_casefold_rows']:,} |
| Parsed rows bound after removing one presentation wrapper | {counts['picker_wrapper_cleaned_rows']:,} |
| Parsed rows without a safe picker-term match | {counts['picker_unmatched_parsed_rows']:,} |
| Papers with more than one active sense | {counts['multi_sense_papers']:,} |
| Paper/head groups with multiple active senses | {counts['multi_sense_paper_head_groups']:,} |
| Active-sense papers missing a year | {counts['missing_year_papers']:,} |
| Active-sense papers missing citation counts | {counts['missing_citation_papers']:,} |
| Active sense rows missing an anchor locator | {counts['missing_quote_locators']:,} |

The rights-cleared row-level findings are in `sense_index_report.json`; the counts above audit the
complete local snapshot. A sense label is a project
curatorial gloss. The exact attesting passage is preserved separately; the interface never
presents the gloss as a verbatim definition written by the paper's authors. Verbatim passages
are present in the browser-facing index only for records allowed by the audited `cleared_ids()`
predicate. No row-level example from a denied paper is written into the published report.

## Most frequent unmatched parsed heads (first 50)

{mismatch_examples or '- none'}
"""
    atomic_text(OUT_REPORT_MD, markdown)

    print(json.dumps({"generated": generated, "counts": counts}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
