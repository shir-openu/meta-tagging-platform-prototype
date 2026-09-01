#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build the isolated, opt-in Princeton WordNet 3.0 definition layer.

This builder is deliberately incapable of writing to ``DATA/corpus.json`` or to the
platform's corpus-sense index.  It reads the 474-term picker, exact-matches WordNet
lemmas, and emits one provider-namespaced static asset plus its licence, provenance,
inline ``file://`` copy, and a measurement report.

The threshold report treats WordNet as one independent definition provider per term,
even when that term has several WordNet synsets.  Every synset is retained for display,
but polysemy must not manufacture several independent sources.
"""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
import re
import sys
import tempfile
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


HERE = Path(__file__).resolve().parent
PROJECT = HERE.parent
DATA_DIR = HERE / "data"
CONCEPTS = DATA_DIR / "concepts.json"
SENSE_INDEX = DATA_DIR / "sense_index.json"
CORPUS = PROJECT / "DATA" / "corpus.json"

OUT_DATA = DATA_DIR / "external_definitions.wordnet.json"
OUT_INLINE = DATA_DIR / "external_definitions.wordnet.inline.js"
OUT_MANIFEST = DATA_DIR / "external_definitions.wordnet.manifest.json"
OUT_LICENCE = DATA_DIR / "WORDNET_LICENSE.txt"
OUT_REPORT = DATA_DIR / "wordnet_fallback_report.json"
OUT_REPORT_MD = DATA_DIR / "wordnet_fallback_report.md"

PROVIDER_ID = "wordnet-3.0"
SOURCE_VERSION = "3.0"
SOURCE_URI = "https://wordnetcode.princeton.edu/3.0/WordNet-3.0.tar.gz"
SOURCE_PAGE = "https://wordnet.princeton.edu/"
LICENCE_SPDX = "WordNet"
LICENCE_URI = "https://spdx.org/licenses/WordNet.html"
OFFICIAL_LICENCE_URI = "https://wordnet.princeton.edu/license-and-commercial-use"
ARCHIVE_SHA256 = "640db279c949a88f61f851dd54ebbb22d003f8b90b85267042ef85a3781d3a52"
BASELINE = DATA_DIR / "external_definitions.baseline.json"
# set to a UTC stamp by --rebaseline; None means "check, do not record"
REBASELINE = None


def load_baseline() -> dict:
    """The counts the last accepted build saw.  A guard nobody can edit by hand."""
    if not BASELINE.is_file():
        raise FileNotFoundError(
            f"missing coverage baseline: {BASELINE}. Run once with --rebaseline to record it."
        )
    return json.loads(BASELINE.read_text(encoding="utf-8"))


EXPECTED_HISTORICAL_GAP = 415
EXPECTED_HISTORICAL_MATCHES = 75

POS_FILES = (
    ("noun", "n", "data.noun"),
    ("verb", "v", "data.verb"),
    ("adjective", "a", "data.adj"),
    ("adverb", "r", "data.adv"),
)
POS_CODES = {
    "noun": "n",
    "verb": "v",
    "adjective": "a",
    "adjective satellite": "s",
    "adverb": "r",
}
SENSE_POS = {"1": "n", "2": "v", "3": "a", "4": "r", "5": "s"}


def normalise(value: Any) -> str:
    return " ".join(unicodedata.normalize("NFKC", str(value or "")).split()).casefold()


def lemma_normalise(value: Any) -> str:
    return normalise(str(value or "").replace("_", " "))


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def json_bytes(value: Any, *, pretty: bool = False) -> bytes:
    if pretty:
        text = json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    else:
        text = json.dumps(value, ensure_ascii=False, separators=(",", ":")) + "\n"
    return text.encode("utf-8")


def atomic_write(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, raw_tmp = tempfile.mkstemp(prefix=path.name + ".", suffix=".tmp", dir=path.parent)
    tmp = Path(raw_tmp)
    try:
        with os.fdopen(fd, "wb") as handle:
            handle.write(data)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(tmp, path)
    finally:
        tmp.unlink(missing_ok=True)


def load_picker() -> tuple[list[dict[str, Any]], dict[str, list[str]]]:
    source = json.loads(CONCEPTS.read_text(encoding="utf-8"))
    concepts = source.get("concepts") or []
    if REBASELINE is None:
        expected = load_baseline()["picker_terms"]
        if len(concepts) != expected:
            raise RuntimeError(
                f"picker drift: baseline records {expected} concepts, found {len(concepts)}. "
                "Rerun with --rebaseline if the picker was meant to change."
            )
    by_lemma: dict[str, list[str]] = defaultdict(list)
    seen_ids: set[str] = set()
    for concept in concepts:
        term_id = str(concept.get("id") or "").strip()
        if not term_id or term_id in seen_ids:
            raise RuntimeError(f"missing or duplicate picker id: {term_id!r}")
        seen_ids.add(term_id)
        candidates = {lemma_normalise(term_id), lemma_normalise(concept.get("en"))}
        for candidate in sorted(candidates - {""}):
            by_lemma[candidate].append(term_id)
    return concepts, dict(by_lemma)


def load_sense_keys(dict_dir: Path) -> dict[tuple[str, str, str], list[str]]:
    path = dict_dir / "index.sense"
    if not path.is_file():
        raise FileNotFoundError(f"missing WordNet sense index: {path}")
    result: dict[tuple[str, str, str], list[str]] = defaultdict(list)
    for line_no, line in enumerate(path.read_text(encoding="ascii").splitlines(), 1):
        fields = line.split()
        if len(fields) != 4 or "%" not in fields[0]:
            raise RuntimeError(f"malformed index.sense line {line_no}")
        sense_key, offset = fields[0], fields[1]
        lemma, tail = sense_key.split("%", 1)
        pos = SENSE_POS.get(tail[:1])
        if pos is None:
            raise RuntimeError(f"unknown WordNet sense-key POS on line {line_no}: {sense_key}")
        result[(lemma_normalise(lemma), pos, offset)].append(sense_key)
    return dict(result)


def extract_wordnet(
    dict_dir: Path,
    lemma_to_terms: dict[str, list[str]],
) -> dict[str, list[dict[str, Any]]]:
    sense_keys = load_sense_keys(dict_dir)
    rows: dict[str, list[dict[str, Any]]] = defaultdict(list)
    provider_keys: set[tuple[str, str, str]] = set()

    for pos_label, pos_code, filename in POS_FILES:
        path = dict_dir / filename
        if not path.is_file():
            raise FileNotFoundError(f"missing WordNet data file: {path}")
        for line_no, line in enumerate(path.read_text(encoding="ascii").splitlines(), 1):
            if not line or line[0].isspace() or line.startswith("  "):
                continue
            raw, marker, gloss = line.partition("|")
            fields = raw.split()
            if not marker or len(fields) < 5 or not fields[0].isdigit():
                raise RuntimeError(f"malformed {filename} line {line_no}")
            offset, synset_type = fields[0], fields[2]
            word_count = int(fields[3], 16)
            if len(fields) < 4 + 2 * word_count:
                raise RuntimeError(f"truncated word list in {filename} line {line_no}")
            lemmas = [fields[4 + 2 * index] for index in range(word_count)]
            matched = sorted({
                term_id
                for lemma in lemmas
                for term_id in lemma_to_terms.get(lemma_normalise(lemma), [])
            })
            for term_id in matched:
                term_norm = lemma_normalise(term_id)
                key_pos = "s" if synset_type == "s" else pos_code
                keys = sorted(set(sense_keys.get((term_norm, key_pos, offset), [])))
                if not keys:
                    # The picker label can differ from its id only in case.  Resolve through
                    # the exact matched synset lemma, never by fuzzy or morphological lookup.
                    keys = sorted({
                        key
                        for lemma in lemmas
                        if term_id in lemma_to_terms.get(lemma_normalise(lemma), [])
                        for key in sense_keys.get((lemma_normalise(lemma), key_pos, offset), [])
                    })
                if not keys:
                    raise RuntimeError(
                        f"no sense key for exact match {term_id!r} at {filename}:{line_no}"
                    )
                provider_key = (term_id, key_pos, offset)
                if provider_key in provider_keys:
                    raise RuntimeError(f"duplicate provider key: {provider_key}")
                provider_keys.add(provider_key)
                rows[term_id].append({
                    "pos": "adjective satellite" if synset_type == "s" else pos_label,
                    "sense_keys": keys,
                    "synset_offset": offset,
                    "gloss": gloss.strip(),
                })

    pos_order = {"noun": 0, "verb": 1, "adjective": 2, "adjective satellite": 3, "adverb": 4}
    for definitions in rows.values():
        definitions.sort(key=lambda row: (pos_order[row["pos"]], row["synset_offset"]))
    return dict(rows)


def read_corpus_snapshot() -> tuple[list[dict[str, Any]], str]:
    sys.path.insert(0, str(PROJECT / "TOOLS"))
    from corpus_lock import corpus_lock  # type: ignore

    with corpus_lock("META_DEF_CODEX-wordnet-measurement", wait=900):
        raw = CORPUS.read_bytes()
    parsed = json.loads(raw)
    records = parsed if isinstance(parsed, list) else parsed.get("records") or []
    if not isinstance(records, list):
        raise RuntimeError("DATA/corpus.json has no records list")
    return records, sha256(raw)


def corpus_counts(
    concepts: list[dict[str, Any]],
    records: list[dict[str, Any]],
) -> dict[str, int]:
    """Return current all-layer grounded-definition row counts."""
    # Importing this collector shares the exact three-layer interpretation used to build
    # the public sense index.  The module has no import-time build or write side effect.
    sys.path.insert(0, str(HERE))
    from build_sense_index import collect_grounded_rows  # type: ignore

    picker_by_head: dict[str, set[str]] = defaultdict(set)
    for concept in concepts:
        term_id = concept["id"]
        picker_by_head[normalise(term_id)].add(term_id)
        picker_by_head[normalise(concept.get("en"))].add(term_id)

    all_layer = Counter()
    for record in records:
        active, _withdrawn = collect_grounded_rows(record)
        for row in active:
            for term_id in picker_by_head.get(normalise(row.get("term")), set()):
                all_layer[term_id] += 1

    ready = {concept["id"] for concept in concepts if concept.get("state") == "ready"}
    for concept in concepts:
        if concept["id"] in ready:
            all_layer[concept["id"]] = max(
                all_layer[concept["id"]], int(concept.get("definitions") or 1)
            )
    return dict(all_layer)


def public_counts(concepts: list[dict[str, Any]]) -> tuple[dict[str, int], str, Any]:
    raw = SENSE_INDEX.read_bytes()
    index = json.loads(raw)
    picker_terms = index.get("picker_terms") or {}
    counts: dict[str, int] = {}
    for concept in concepts:
        term_id = concept["id"]
        slug = re.sub(r"[^a-z0-9]+", "-", str(concept.get("en") or term_id).lower()).strip("-")[:60]
        if concept.get("state") == "ready":
            counts[term_id] = int(concept.get("definitions") or 0)
        else:
            counts[term_id] = len(picker_terms.get(slug) or [])
    return counts, sha256(raw), index.get("generated_utc")


def threshold_metrics(counts: dict[str, int], matched: set[str]) -> dict[str, Any]:
    exactly_one = {term for term, count in counts.items() if count == 1}
    before_two = {term for term, count in counts.items() if count >= 2}
    newly_two = exactly_one & matched
    after_two = before_two | newly_two
    return {
        "terms_with_exactly_one_corpus_definition": len(exactly_one),
        "terms_with_at_least_two_before_wordnet": len(before_two),
        "terms_newly_reaching_two_with_wordnet": len(newly_two),
        "terms_with_at_least_two_after_wordnet": len(after_two),
        "newly_reaching_two_term_ids": sorted(newly_two),
        "metric_note": (
            "WordNet contributes at most one independent provider to the threshold per term; "
            "all matching WordNet synsets remain visible but are not miscounted as independent sources."
        ),
    }


def build(wordnet_root: Path) -> dict[str, Any]:
    dict_dir = wordnet_root / "dict"
    licence_source = wordnet_root / "LICENSE"
    if not licence_source.is_file():
        raise FileNotFoundError(f"missing WordNet licence: {licence_source}")
    licence_text = licence_source.read_text(encoding="ascii").replace("\r\n", "\n")
    if "WordNet 3.0 Copyright 2006 by Princeton University" not in licence_text:
        raise RuntimeError("WordNet 3.0 copyright notice not found in source LICENSE")

    concepts, lemma_to_terms = load_picker()
    definitions = extract_wordnet(dict_dir, lemma_to_terms)
    matched = set(definitions)
    if REBASELINE is None:
        expected = load_baseline()["wordnet_matched_picker_terms"]
        if len(matched) != expected:
            raise RuntimeError(
                f"WordNet coverage drift: baseline records {expected} matched picker terms, "
                f"found {len(matched)}. Rerun with --rebaseline if this was intended."
            )

    corpus, corpus_sha = read_corpus_snapshot()
    current_counts = corpus_counts(concepts, corpus)

    public, public_index_sha, public_index_generated = public_counts(concepts)
    terms: dict[str, Any] = {}
    for term_id in [concept["id"] for concept in concepts if concept["id"] in definitions]:
        compact_rows = []
        for definition in definitions[term_id]:
            if len(definition["sense_keys"]) != 1:
                raise RuntimeError(
                    f"compact schema requires one lemma sense key per synset: {term_id} "
                    f"{definition['synset_offset']} has {len(definition['sense_keys'])}"
                )
            compact_rows.append([
                POS_CODES[definition["pos"]],
                definition["synset_offset"],
                definition["sense_keys"][0],
                definition["gloss"],
            ])
        terms[term_id] = compact_rows
    provider = {
        "id": PROVIDER_ID,
        "name": "Princeton WordNet",
        "version": SOURCE_VERSION,
        "source_uri": SOURCE_URI,
        "source_page": SOURCE_PAGE,
        "licence_spdx": LICENCE_SPDX,
        "licence_uri": LICENCE_URI,
        "official_licence_uri": OFFICIAL_LICENCE_URI,
        "licence_notice_path": "WORDNET_LICENSE.txt",
    }
    payload = {
        "schema_version": "external-definitions-1",
        "default_enabled": False,
        "definition_fields": ["pos", "synset_offset", "sense_key", "gloss"],
        "pos_codes": {
            "n": "noun", "v": "verb", "a": "adjective",
            "s": "adjective satellite", "r": "adverb",
        },
        "corpus_definition_visibility": {
            "withheld_term_ids": sorted(
                term_id for term_id in matched
                if public.get(term_id, 0) == 0 and current_counts.get(term_id, 0) > 0
            ),
        },
        "external_definitions": {
            PROVIDER_ID: {
                "provider": provider,
                "terms": terms,
            }
        },
    }
    payload_raw = json_bytes(payload)
    inline_raw = b"window.MTP_EXTERNAL_DEFINITIONS=" + payload_raw.rstrip() + b";\n"
    licence_header = (
        "Princeton WordNet 3.0\n"
        f"Source: {SOURCE_URI}\n"
        f"Archive SHA-256: {ARCHIVE_SHA256}\n"
        f"SPDX licence identifier: {LICENCE_SPDX}\n"
        f"Official licence page: {OFFICIAL_LICENCE_URI}\n"
        "Transformation: exact normalized lemma subset for the platform picker; "
        "all matched synset glosses, parts of speech, sense keys, and offsets retained.\n\n"
        "The source distribution's complete licence notice follows unchanged.\n\n"
    )
    licence_raw = (licence_header + licence_text.rstrip("\n") + "\n").encode("utf-8")

    report = {
        "schema_version": "wordnet-fallback-report-1",
        "provider": provider,
        "source_archive_sha256": ARCHIVE_SHA256,
        "corpus_snapshot_sha256": corpus_sha,
        "corpus_record_count": len(corpus),
        "public_sense_index_sha256": public_index_sha,
        "public_sense_index_generated_utc": public_index_generated,
        "historical_assignment_measurement": (
            "Frozen approved Phase-2 assignment baseline; 59/474 assigned grounded and "
            "415/474 assigned gap before implementation."
        ),
        "counts": {
            "picker_terms": len(concepts),
            "wordnet_matched_picker_terms": len(matched),
            "wordnet_synsets": sum(len(value) for value in definitions.values()),
            "historical_assignment_gap_terms": EXPECTED_HISTORICAL_GAP,
            "wordnet_matches_in_historical_assignment_gap": EXPECTED_HISTORICAL_MATCHES,
            "historical_assignment_gap_left_uncovered": (
                EXPECTED_HISTORICAL_GAP - EXPECTED_HISTORICAL_MATCHES
            ),
            "payload_bytes": len(payload_raw),
        },
        "current_all_corpus_layers": threshold_metrics(current_counts, matched),
        "current_public_rights_cleared_layer": threshold_metrics(public, matched),
        "matched_term_ids": sorted(matched),
    }
    report_raw = json_bytes(report, pretty=True)
    report_md = f"""# WordNet 3.0 fallback measurement

- Picker coverage: **{len(matched)}/{len(concepts)} terms**.
- Historical assigned-gap coverage: **{EXPECTED_HISTORICAL_MATCHES}/{EXPECTED_HISTORICAL_GAP} terms**; **{EXPECTED_HISTORICAL_GAP - EXPECTED_HISTORICAL_MATCHES}** remain uncovered.
- Current all-corpus layer: **{report['current_all_corpus_layers']['terms_newly_reaching_two_with_wordnet']}** terms with exactly one corpus definition newly reach two source-separated definitions; **{report['current_all_corpus_layers']['terms_with_at_least_two_after_wordnet']}** picker terms have at least two after opt-in.
- Current public rights-cleared layer: **{report['current_public_rights_cleared_layer']['terms_newly_reaching_two_with_wordnet']}** terms with exactly one displayed corpus definition newly reach two source-separated definitions; **{report['current_public_rights_cleared_layer']['terms_with_at_least_two_after_wordnet']}** picker terms have at least two after opt-in.
- Static JSON payload: **{len(payload_raw):,} bytes**, containing **{report['counts']['wordnet_synsets']}** WordNet synsets.

WordNet is counted as one independent provider per term for the two-definition threshold. Every matched synset is retained and displayed, but multiple dictionary senses are not misrepresented as multiple independent sources. External definitions remain separate, opt-in, default off, and never alter corpus sense counts or scoreability.
""".encode("utf-8")

    manifest = {
        "schema_version": "external-definitions-manifest-1",
        "provider": provider,
        "source_archive_sha256": ARCHIVE_SHA256,
        "transformation": (
            "Exact Unicode-NFKC, whitespace-collapsed, case-folded picker-label to WordNet-lemma "
            "match; underscore is treated as WordNet's space encoding; no stemming, aliases, "
            "fuzzy matching, sense selection, rewriting, or corpus mutation."
        ),
        "outputs": {
            OUT_DATA.name: {"bytes": len(payload_raw), "sha256": sha256(payload_raw)},
            OUT_INLINE.name: {"bytes": len(inline_raw), "sha256": sha256(inline_raw)},
            OUT_LICENCE.name: {"bytes": len(licence_raw), "sha256": sha256(licence_raw)},
            OUT_REPORT.name: {"bytes": len(report_raw), "sha256": sha256(report_raw)},
            OUT_REPORT_MD.name: {"bytes": len(report_md), "sha256": sha256(report_md)},
        },
    }
    manifest_raw = json_bytes(manifest, pretty=True)

    atomic_write(OUT_DATA, payload_raw)
    atomic_write(OUT_INLINE, inline_raw)
    atomic_write(OUT_LICENCE, licence_raw)
    atomic_write(OUT_REPORT, report_raw)
    atomic_write(OUT_REPORT_MD, report_md)
    atomic_write(OUT_MANIFEST, manifest_raw)
    if REBASELINE is not None:
        atomic_write(BASELINE, json_bytes({
            "schema_version": "external-definitions-baseline-1",
            "recorded_utc": REBASELINE,
            "picker_terms": len(concepts),
            "wordnet_matched_picker_terms": len(matched),
        }, pretty=True))
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--wordnet-root",
        required=True,
        type=Path,
        help="extracted WordNet-3.0 directory containing LICENSE and dict/",
    )
    parser.add_argument(
        "--rebaseline",
        action="store_true",
        help="record the observed counts as the new baseline instead of checking against it",
    )
    args = parser.parse_args()
    if args.rebaseline:
        global REBASELINE
        REBASELINE = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    report = build(args.wordnet_root.resolve())
    counts = report["counts"]
    print(
        "WORDNET FALLBACK OK: "
        f"{counts['wordnet_matched_picker_terms']}/{counts['picker_terms']} picker terms, "
        f"{counts['wordnet_matches_in_historical_assignment_gap']}/"
        f"{counts['historical_assignment_gap_terms']} assigned gap, "
        f"{counts['payload_bytes']:,} bytes"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
