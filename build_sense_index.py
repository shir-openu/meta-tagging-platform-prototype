#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build the Task 06 sense index and its audit report without mutating the corpus.

Inputs (read only):
  ../DATA/corpus.json
  ../DATA/facet_queue/*.txt (rights-cleared HTML/MHTML records only)
  data/term_corpus.json

Outputs (derived and reproducible):
  data/term_corpus.json (rights-sanitized in place after the project-wide term build)
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
import os
import re
import shutil
import sys
import time
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
PROJECT = ROOT.parent
CORPUS = PROJECT / "DATA" / "corpus.json"
RIGHTS = PROJECT / "DATA" / "rights_manifest.json"
TERM_CORPUS = ROOT / "data" / "term_corpus.json"
STAGED_DIR = PROJECT / "DATA" / "facet_queue"
CONCEPTS = ROOT / "data" / "concepts.json"
OUT_INDEX = ROOT / "data" / "sense_index.json"
OUT_INLINE = ROOT / "data" / "sense_index.inline.js"
OUT_REPORT = ROOT / "data" / "sense_index_report.json"
OUT_REPORT_MD = ROOT / "data" / "sense_index_report.md"
OUT_META_REPORT = ROOT / "data" / "meta_render_report.json"
OUT_META_REPORT_MD = ROOT / "data" / "meta_render_report.md"

# Publication rights are decided by the same audited allow-list as the paper-page builders.
# The record's own `license` field is deliberately not consulted: it is known to be wrong in
# both directions.  Import the predicate from the project toolbox and fail closed if it cannot
# produce a non-empty result.
sys.path.insert(0, str(PROJECT / "TOOLS"))
from build_paper_edition import cleared_ids  # noqa: E402
from build_concept_index import _normalised_is_attested, _paper_defined_acronym  # noqa: E402
from live_quote_fields import is_live, iter_quote_fields  # noqa: E402

DELIMITER = re.compile(r" (?:-|—) ")
WRAPPERS = (("`", "`"), ('"', '"'), ("'", "'"), ("“", "”"), ("‘", "’"))


def abbreviation_kind(label: str) -> str | None:
    """Classify the complete short-form class requested by Shir.

    A single letter means exactly one letter, not a statistic such as ``N = 5``. An all-caps
    short form has two to ten Latin letters and may contain the separators used by real corpus
    labels (for example ``CIDOC CRM``); equations and prose are outside this visual class. Hebrew
    abbreviations are identified by geresh/gershayim spelling rather than English case.
    """
    value = " ".join(str(label or "").split())
    if len(value) == 1 and value.isalpha():
        return "single-letter"
    letters = "".join(character for character in value if character.isalpha())
    if (
        2 <= len(letters) <= 10
        and letters.upper() == letters
        and re.fullmatch(r"[A-Z][A-Z0-9]*(?:[ ./&+_-][A-Z0-9]+)*", value)
    ):
        return "all-caps-short-form"
    if (
        re.search(r"[\u0590-\u05ff]", value)
        and any(mark in value for mark in ("״", "׳", '"', "'"))
        and len(letters) <= 12
    ):
        return "hebrew-abbreviation"
    return None


def collect_grounded_rows(record: dict[str, Any]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Collect grounded definitions from all three real layers using shared ``is_live``."""
    paper_id = str(record.get("id") or "")
    active: list[dict[str, Any]] = []
    withdrawn: list[dict[str, Any]] = []

    def consider(
        item: dict[str, Any],
        *,
        source_layer: str,
        position: int,
        term: str,
        gloss: str,
        label: str,
    ) -> None:
        clean_term = " ".join(str(term or "").split()).strip()
        clean_gloss = " ".join(str(gloss or "").split()).strip()
        evidence = " ".join(str(item.get("evidence") or "").split()).strip()
        row = {
            "term": clean_term,
            "gloss": clean_gloss,
            "label": " ".join(str(label or "").split()).strip(),
            "evidence": evidence,
            "confidence": item.get("confidence"),
            "paper_id": paper_id,
            "source_layer": source_layer,
            "position": position,
            "source_field": f"{source_layer}[{position}].evidence",
        }
        if not is_live(item):
            withdrawn.append(row)
            return
        if clean_term and clean_gloss and evidence:
            active.append(row)

    content_tags = record.get("content_tags") or {}
    if isinstance(content_tags, dict):
        for position, item in enumerate(content_tags.get("definitions") or []):
            if not isinstance(item, dict):
                continue
            consider(
                item,
                source_layer="content_tags.definitions",
                position=position,
                term=str(item.get("term") or ""),
                gloss=str(item.get("text") or item.get("evidence") or ""),
                label=str(item.get("term") or ""),
            )

    senses = record.get("senses") or []
    if isinstance(senses, dict):
        senses = [senses]
    for position, item in enumerate(senses):
        if not isinstance(item, dict):
            continue
        label = " ".join(str(item.get("label") or "").split())
        parsed = parse_label(label)
        consider(
            item,
            source_layer="senses",
            position=position,
            term=str(parsed.get("head") or ""),
            gloss=str(parsed.get("gloss") or ""),
            label=label,
        )

    concepts = record.get("concepts") or []
    if isinstance(concepts, dict):
        concepts = [concepts]
    for position, item in enumerate(concepts):
        if not isinstance(item, dict):
            continue
        consider(
            item,
            source_layer="concepts",
            position=position,
            term=str(item.get("term") or ""),
            gloss=str(item.get("sense") or ""),
            label=str(item.get("term") or ""),
        )

    return active, withdrawn


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
    # Windows indexers and browser previews can hold a generated JS file open without delete
    # sharing while still permitting writes. Retry the atomic path first. If that exact lock
    # persists, keep a byte-for-byte recovery copy while replacing the contents and fsync before
    # removing the recovery copy. This avoids leaving the six-file build permanently mixed.
    for attempt in range(20):
        try:
            temp.replace(path)
            return
        except PermissionError:
            if attempt == 19:
                recovery = path.with_name(path.name + ".recovery-task06")
                if path.exists():
                    shutil.copyfile(path, recovery)
                try:
                    with temp.open("rb") as source, path.open("wb") as destination:
                        shutil.copyfileobj(source, destination, length=1024 * 1024)
                        destination.flush()
                        os.fsync(destination.fileno())
                    temp.unlink()
                    if recovery.exists():
                        recovery.unlink()
                    return
                except Exception:
                    if recovery.exists():
                        with recovery.open("rb") as source, path.open("wb") as destination:
                            shutil.copyfileobj(source, destination, length=1024 * 1024)
                            destination.flush()
                            os.fsync(destination.fileno())
                    raise
            time.sleep(0.25)


def rights_sanitize_term_corpus(
    term_corpus: dict[str, Any],
    records: list[dict[str, Any]],
    cleared: set[str],
) -> tuple[dict[str, Any], dict[str, int]]:
    """Remove picker labels that reproduce a live quote from a redistribution-denied paper.

    ``build_term_corpus.py`` indexes the complete internal tag layer. Most entries are
    project-authored labels, but any source field can accidentally repeat its evidence verbatim;
    statistic surfaces do so routinely, and real records also contain a definition term equal to
    its evidence and a concept term equal to relation evidence. Use the project's shared live
    quote enumerator rather than guessing the source field. Short notation (``N``, ``RAM``,
    ``PFC``) remains enumerable because the quote gate starts at 25 characters. A shared slug does
    not rescue exact denied wording.
    """

    denied_quote_labels: set[str] = set()
    for record in records:
        paper_id = str(record.get("id") or "")
        if paper_id in cleared:
            continue
        for _path, quote, _holder in iter_quote_fields(record, min_len=25):
            label = " ".join(str(quote or "").split())
            if len(label) >= 25:
                denied_quote_labels.add(label)

    sanitized = dict(term_corpus)
    terms = dict(term_corpus.get("terms") or {})
    removed_now = 0
    for term_slug, entry in list(terms.items()):
        label = " ".join(str(entry[0] if entry else "").split())
        if label in denied_quote_labels:
            del terms[term_slug]
            removed_now += 1
    sanitized["terms"] = terms
    return sanitized, {
        "rights_removed_quote_picker_rows_this_build": removed_now,
    }


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


def folded(value: object) -> str:
    return " ".join(str(value or "").split()).casefold()


def phrase_key(value: object) -> str:
    """Fold a displayed phrase while treating punctuation as a word boundary."""
    return " ".join(re.findall(r"[a-z0-9\u0590-\u05ff]+", str(value or "").casefold()))


def literal_evidence_slice(body: str, start: int, end: int) -> str:
    """Return the one compact source sentence/line that contains a literal expansion."""
    left = max(body.rfind("\n", 0, start), body.rfind(". ", 0, start))
    right_candidates = [position for position in (
        body.find("\n", end), body.find(". ", end)
    ) if position >= 0]
    right = min(right_candidates) + 1 if right_candidates else min(len(body), end + 500)
    return " ".join(body[left + 1:right].split())[:1200]


def cleared_staged_mhtml_sources(
    records: list[dict[str, Any]], cleared: set[str]
) -> tuple[dict[str, str], dict[Path, str]]:
    """Read only cleared HTML/MHTML staging text, never text derived from a PDF.

    The source hash map is rechecked before output so a concurrently replaced staged file makes
    the complete build fail closed instead of mixing generations.
    """
    sources: dict[str, str] = {}
    hashes: dict[Path, str] = {}
    marker = "QUOTE ONLY FROM HERE -----"
    for record in records:
        paper_id = str(record.get("id") or "")
        source_format = str(record.get("source_format") or "").casefold()
        if paper_id not in cleared or source_format not in {"html", "mhtml"}:
            continue
        path = STAGED_DIR / f"{paper_id}.txt"
        if not path.exists():
            continue
        raw_bytes = path.read_bytes()
        raw = raw_bytes.decode("utf-8", errors="replace")
        position = raw.find(marker)
        if position >= 0:
            newline = raw.find("\n", position)
            raw = raw[newline + 1:] if newline >= 0 else ""
        sources[paper_id] = raw
        hashes[path] = hashlib.sha256(raw_bytes).hexdigest()
    return sources, hashes


def presentation_base_term(value: str) -> str:
    """Remove a trailing project qualifier, never words from the source term itself."""
    return re.sub(
        r"\s*\([^)]*(?:usage|sense|meaning|context)[^)]*\)\s*$",
        "",
        " ".join(str(value or "").split()),
        flags=re.IGNORECASE,
    ).strip()


def collect_abbreviation_expansions(
    records: list[dict[str, Any]],
    *,
    literal_sources: dict[str, str] | None = None,
    short_forms: list[str] | None = None,
    runtime_labels: list[str] | None = None,
) -> dict[str, list[dict[str, Any]]]:
    """Return paper-attributed expansion rows without guessing from general knowledge.

    The primary detector is the existing concept-index predicate.  A narrow literal fallback
    handles non-initial forms such as ``prefrontal cortex (PFC)``: both strings must occur together
    in the row's own evidence.  Stored ``normalised`` values are accepted only for visually short
    terms and only when the existing attestation predicate confirms that the paper writes the
    expansion.
    """
    by_short: dict[str, dict[tuple[str, str], dict[str, Any]]] = defaultdict(dict)

    def add(short: str, expansion: str, record: dict[str, Any], source: str, evidence: str) -> None:
        clean_short = " ".join(str(short or "").split()).strip("`\"“”‘’")
        clean_expansion = " ".join(str(expansion or "").split()).strip("`\"“”‘’")
        paper_id = str(record.get("id") or "")
        if (
            not clean_short
            or not clean_expansion
            or not paper_id
            or folded(clean_short) == folded(clean_expansion)
            or len(clean_expansion) <= len(clean_short)
        ):
            return
        key = (folded(clean_expansion), paper_id)
        by_short[folded(clean_short)][key] = {
            "short_form": clean_short,
            "expansion": clean_expansion,
            "paper_id": paper_id,
            "source": source,
            "evidence": " ".join(str(evidence or "").split()),
        }

    for record in records:
        groundings, _ = collect_grounded_rows(record)
        candidates = [
            (str(row["term"]), str(row["evidence"]), str(row["source_layer"]))
            for row in groundings
        ]
        # Curated sense rows sometimes state the ambiguity more explicitly than the concept
        # layer: `PFC` - reserved here for `perfluorocarbons`. Accept a wrapped candidate only
        # when the same words occur in the attesting passage; the label alone is not evidence.
        for row in groundings:
            short = unwrap_head(str(row["term"]))[0]
            if row["source_layer"] != "senses" or not abbreviation_kind(short):
                continue
            evidence_folded = folded(row["evidence"])
            for candidate_match in re.finditer(
                r"[`\u201c\u201d]([^`\u201c\u201d]+)[`\u201c\u201d]", str(row["gloss"])
            ):
                # A gloss can quote criticism as well as an expansion.  The earlier version
                # treated `AN UNFORTUNATE AND INAPPROPRIATE` as a PFC expansion merely because
                # the criticism also appeared in the evidence.  Require an explicit expansion
                # cue immediately before the wrapped phrase.
                cue = str(row["gloss"])[max(0, candidate_match.start() - 55):candidate_match.start()]
                if not re.search(r"(?:\bfor|\bmeans|\bexpands?\s+to|\babbreviation\s+for)\s*$", cue, re.I):
                    continue
                clean_candidate = " ".join(candidate_match.group(1).split()).strip(".,;:()[]{}")
                if (
                    len(clean_candidate) > len(short)
                    and 1 <= len(clean_candidate.split()) <= 12
                    and folded(clean_candidate) in evidence_folded
                ):
                    add(
                        short,
                        clean_candidate,
                        record,
                        f"{row['source_field']}:attested-wrapped-expansion",
                        str(row["evidence"]),
                    )
        concepts = record.get("concepts") or []
        if isinstance(concepts, dict):
            concepts = [concepts]
        for position, concept in enumerate(concepts):
            if not isinstance(concept, dict) or not is_live(concept):
                continue
            term = " ".join(str(concept.get("term") or "").split())
            evidence = " ".join(str(concept.get("evidence") or "").split())
            if term and evidence:
                candidates.append((term, evidence, f"concepts[{position}]"))
            normalised = " ".join(str(concept.get("normalised") or "").split())
            if (
                term
                and normalised
                and abbreviation_kind(term)
                and folded(term) != folded(normalised)
                and _normalised_is_attested(record, normalised)
            ):
                add(term, normalised, record, f"concepts[{position}].normalised", evidence)

        for term, evidence, source in candidates:
            for expansion in {term, presentation_base_term(term)}:
                if not expansion:
                    continue
                acronym = _paper_defined_acronym(record, expansion)
                if acronym:
                    add(acronym, expansion, record, "build_concept_index._paper_defined_acronym", evidence)

                # Literal Expansion (SHORT) fallback.  It does not infer initials: it only returns
                # the exact parenthetical string beside this exact corpus term in this evidence.
                parts = [re.escape(part) for part in re.split(r"[\s\-‐‑‒–—_]+", expansion) if part]
                if not parts or not evidence:
                    continue
                expansion_pattern = r"[\s\-‐‑‒–—_]*".join(parts)
                match = re.search(
                    r"(?<!\w)" + expansion_pattern
                    + r"\s*\(\s*([A-Za-z][A-Za-z0-9./_-]{1,11})\s*\)",
                    evidence,
                    flags=re.IGNORECASE,
                )
                if match:
                    add(match.group(1), expansion, record, "literal-expansion-parenthesis", evidence)

    # The tag layer does not repeat every paper definition as a concept row.  Search only the
    # already-staged HTML/MHTML bodies that the caller has rights-cleared, and accept only a
    # literal ``Expansion (SHORT)`` witness.  This closes the class-wide gap that hid explicit
    # corpus statements such as ``random access memory (RAM)`` and ``sample size (N)`` without
    # importing a dictionary or guessing initials from general knowledge.
    if literal_sources and short_forms:
        records_by_id = {str(record.get("id") or ""): record for record in records}
        short_by_key = {folded(value): value for value in short_forms if folded(value)}
        label_by_key = {
            phrase_key(value): " ".join(str(value).split())
            for value in (runtime_labels or [])
            if len(phrase_key(value).split()) >= 2
        }
        parenthetical = re.compile(
            r"\(\s*([A-Za-z\u0590-\u05ff][A-Za-z0-9\u0590-\u05ff ./&+_'\u05f3\u05f4\-]{0,24})\s*\)"
        )
        token_pattern = re.compile(r"[A-Za-z][A-Za-z0-9]*(?:[-\u2010-\u2015][A-Za-z0-9]+)*")

        for paper_id, body in literal_sources.items():
            record = records_by_id.get(paper_id)
            if not record:
                continue
            for match in parenthetical.finditer(body):
                written_short = " ".join(match.group(1).split())
                short_key = folded(written_short)
                if short_key not in short_by_key and written_short.casefold().endswith("s"):
                    short_key = folded(written_short[:-1])
                if short_key not in short_by_key:
                    continue
                short = short_by_key[short_key]
                prefix = body[max(0, match.start() - 260):match.start()]
                tokens = token_pattern.findall(prefix)[-12:]
                candidates: list[str] = []

                target = "".join(character for character in short if character.isalpha()).upper()

                # First prefer an exact runtime term or already-curated expansion immediately
                # before the parentheses.  This handles non-initial forms such as PFC.
                prefix_key = phrase_key(prefix)
                adjacent = []
                for width in range(2, min(12, len(tokens)) + 1):
                    canonical = label_by_key.get(phrase_key(" ".join(tokens[-width:])))
                    # Parenthetical N is frequently a table count placed after the name of a
                    # measure (``age acceleration (N)``); that does not expand N.  For a one-letter
                    # symbol, accept only an explicit quantity label whose head names a count.
                    single_letter_head = phrase_key(canonical).split()[-1:] if canonical else []
                    if canonical and (
                        len(target) != 1
                        or single_letter_head in (["size"], ["number"], ["count"], ["rank"])
                    ):
                        adjacent.append(canonical)
                adjacent.extend(
                    row["expansion"] for row in by_short.get(short_key, {}).values()
                    if phrase_key(row["expansion"])
                    and prefix_key.endswith(phrase_key(row["expansion"]))
                )
                if adjacent:
                    candidates.append(max(adjacent, key=lambda value: len(phrase_key(value))))

                # Otherwise the paper itself supplies the initials.  Work backwards from the
                # parenthesis and keep the shortest exact suffix, e.g. random access memory -> RAM.
                targets = {target}
                if target.endswith("S") and len(target) > 2:
                    targets.add(target[:-1])
                if len(target) >= 2:
                    for width in range(2, min(12, len(tokens)) + 1):
                        words = tokens[-width:]
                        initials = "".join(
                            part[0].upper()
                            for word in words
                            for part in re.findall(r"[A-Za-z]+", word)
                            if part
                        )
                        if initials in targets:
                            candidates.append(" ".join(words))
                            break

                evidence = literal_evidence_slice(body, match.start(), match.end())
                for expansion in dict.fromkeys(candidates):
                    add(short, expansion, record, "staged-mhtml-literal-expansion-parenthesis", evidence)

    return {
        short: sorted(rows.values(), key=lambda row: (folded(row["expansion"]), row["paper_id"]))
        for short, rows in sorted(by_short.items())
    }


def main() -> int:
    corpus_bytes = CORPUS.read_bytes()
    rights_bytes = RIGHTS.read_bytes()
    concepts_bytes = CONCEPTS.read_bytes()
    corpus = json.loads(corpus_bytes.decode("utf-8"))
    records = corpus["records"]
    cleared = set(cleared_ids())
    if not cleared:
        raise RuntimeError("cleared_ids() returned an empty set; refusing to build public quotes")
    if RIGHTS.read_bytes() != rights_bytes:
        raise RuntimeError("rights manifest changed while the allow-list was read; retry the build")

    raw_term_corpus_bytes = TERM_CORPUS.read_bytes()
    raw_term_corpus = json.loads(raw_term_corpus_bytes.decode("utf-8"))
    term_corpus, term_rights_counts = rights_sanitize_term_corpus(
        raw_term_corpus, records, cleared
    )
    term_corpus_text = json.dumps(
        term_corpus, ensure_ascii=False, separators=(",", ":")
    )
    term_corpus_bytes = term_corpus_text.encode("utf-8")
    if term_corpus_bytes != raw_term_corpus_bytes:
        atomic_text(TERM_CORPUS, term_corpus_text)

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
        "rights_sha256": hashlib.sha256(rights_bytes).hexdigest(),
        "term_corpus_sha256": hashlib.sha256(term_corpus_bytes).hexdigest(),
        "concepts_sha256": hashlib.sha256(concepts_bytes).hexdigest(),
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
    grounded_layer_counts: Counter[str] = Counter()
    withdrawn_layer_counts: Counter[str] = Counter()
    live_picker_slugs: set[str] = set()

    def add_direct_grounding(
        record: dict[str, Any],
        raw_row: dict[str, Any],
        anchor_by_field: dict[str, dict[str, Any]],
    ) -> None:
        """Append a content-definition or concept-sense row in the legacy browser shape."""
        nonlocal exact_bindings, wrapper_bindings, missing_locators
        paper_id = str(record["id"])
        head = str(raw_row["term"])
        paper_head_counts[(paper_id, head.casefold())] += 1
        candidates = picker_by_fold.get(head.casefold(), [])
        binding_status = "no_picker_match"
        picker_slug = None
        picker_label = None
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

        canonical_id = "sense-term-" + hashlib.sha1(head.casefold().encode("utf-8")).hexdigest()[:12]
        term = canonical_terms.setdefault(canonical_id, {
            "head": head,
            "sense_indices": [],
            "picker_slugs": [],
        })
        term["sense_indices"].append(len(sense_rows))
        if picker_slug and picker_slug not in term["picker_slugs"]:
            term["picker_slugs"].append(picker_slug)

        source_field = str(raw_row["source_field"])
        anchor = anchor_by_field.get(source_field)
        locator = None
        if anchor:
            locator = {
                "field": source_field,
                "index": "unicode-code-point",
                "start": anchor.get("start"),
                "end": anchor.get("end"),
                "occurrences": anchor.get("occurrences"),
                "text_sha1": anchor.get("text_sha1"),
            }
        else:
            missing_locators += 1

        source_layer = str(raw_row["source_layer"])
        row_id = f"{paper_id}:{source_layer}[{raw_row['position']}]"
        row = {
            "sense_id": row_id,
            "paper_id": paper_id,
            "source_field": source_field,
            "source_layer": source_layer,
            "label": raw_row["label"],
            "head": head,
            "term": head,
            "gloss": raw_row["gloss"],
            "evidence": raw_row["evidence"],
            "confidence": raw_row["confidence"],
            "parse_status": "direct_term",
            "delimiter_count": None,
            "binding_status": binding_status,
            "picker_slug": picker_slug,
            "picker_label": picker_label,
            "wording_kind": "tagged_definition" if source_layer == "content_tags.definitions" else "curatorial_gloss",
            "evidence_kind": "verbatim_source_passage",
            "locator": locator,
        }
        sense_rows.append(row)
        grounded_layer_counts[source_layer] += 1
        active_paper_ids.add(paper_id)
        if picker_slug:
            picker_terms[picker_slug].append(len(sense_rows) - 1)
        else:
            key = head.casefold()
            small = {"sense_id": row_id, "paper_id": paper_id, "label": raw_row["label"]}
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

    for record in records:
        paper_id = str(record["id"])
        anchor_by_field = {
            str(anchor.get("field")): anchor
            for anchor in (record.get("anchors") or [])
            if isinstance(anchor, dict) and anchor.get("field")
        }

        # The two legacy picker builders do not filter withdrawn concept rows. Publish a live
        # registry predicate beside this index so the browser can fail closed without modifying
        # files outside this task's PLATFORM-only scope.
        live_terms: list[str] = []
        for concept in (record.get("concepts") or []):
            if isinstance(concept, dict) and is_live(concept):
                live_terms.append(str(concept.get("term") or ""))
        content_tags = record.get("content_tags") or {}
        if isinstance(content_tags, dict):
            for key in ("key_terms", "variables", "definitions"):
                for item in (content_tags.get(key) or []):
                    if isinstance(item, dict):
                        if is_live(item):
                            live_terms.append(str(item.get("term") or ""))
                    else:
                        live_terms.append(str(item or ""))
            for item in (content_tags.get("statistics") or []):
                if isinstance(item, dict):
                    if is_live(item):
                        live_terms.append(str(item.get("surface") or ""))
                else:
                    live_terms.append(str(item or ""))
        if record.get("method"):
            live_terms.append(str(record["method"]))
        live_picker_slugs.update(slug(term) for term in live_terms if slug(term))

        record_groundings, record_withdrawn = collect_grounded_rows(record)
        for raw_row in record_groundings:
            if raw_row["source_layer"] != "senses":
                add_direct_grounding(record, raw_row, anchor_by_field)
        for raw_row in record_withdrawn:
            if raw_row["source_layer"] == "senses":
                continue
            withdrawn_layer_counts[str(raw_row["source_layer"])] += 1
            withdrawn.append({
                "sense_id": f"{paper_id}:{raw_row['source_layer']}[{raw_row['position']}]",
                "paper_id": paper_id,
                "label": raw_row["label"],
                "term": raw_row["term"],
                "source_layer": raw_row["source_layer"],
                "reason": "withdrawn by the shared live-row predicate",
            })

        senses = record.get("senses") or []
        if isinstance(senses, dict):
            senses = [senses]
        for position, sense in enumerate(senses):
            if not isinstance(sense, dict):
                continue
            sense_id = f"{paper_id}:senses[{position}]"
            label = str(sense.get("label") or "")
            if not is_live(sense):
                withdrawn_layer_counts["senses"] += 1
                withdrawn.append({
                    "sense_id": sense_id,
                    "paper_id": paper_id,
                    "label": label,
                    "term": str(parse_label(label).get("head") or ""),
                    "source_layer": "senses",
                    "reason": str(sense.get("withdrawn_reason") or "withdrawn by the shared live-row predicate"),
                })
                continue

            evidence = str(sense.get("evidence") or "").strip()
            if not evidence:
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
                "source_layer": "senses",
                "label": label,
                "head": head,
                "term": head,
                "gloss": gloss,
                "evidence": evidence,
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
            grounded_layer_counts["senses"] += 1
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
        "sense_rows_total": grounded_layer_counts["senses"] + withdrawn_layer_counts["senses"],
        "sense_rows_active": grounded_layer_counts["senses"],
        "grounding_rows_total": len(sense_rows) + len(withdrawn),
        "grounding_rows_active": len(sense_rows),
        "grounding_rows_by_layer": dict(sorted(grounded_layer_counts.items())),
        "withdrawn_rows_by_layer": dict(sorted(withdrawn_layer_counts.items())),
        "withdrawn_rows": len(withdrawn),
        "hard_parse_failures": len(hard_failures),
        "delimiter_ambiguities": len(ambiguities),
        "single_delimiter_rows": delimiter_histogram[1],
        "ascii_delimiter_rows": ascii_delimiter_rows,
        "em_dash_delimiter_rows": em_delimiter_rows,
        "picker_exact_casefold_rows": exact_bindings,
        "picker_wrapper_cleaned_rows": wrapper_bindings,
        "picker_unmatched_parsed_rows": unmatched_rows,
        "active_sense_papers": len({row["paper_id"] for row in sense_rows if row["source_layer"] == "senses"}),
        "active_grounding_papers": len(paper_rows),
        "canonical_parsed_heads": len(canonical_terms),
        "picker_terms_with_grounded_senses": len({
            row["picker_slug"] for row in sense_rows
            if row["source_layer"] == "senses" and row.get("picker_slug")
        }),
        "picker_terms_with_grounded_rows": len(picker_terms),
        "multi_sense_papers": len(multi_sense_papers),
        "multi_sense_paper_head_groups": len(multi_head_groups),
        "missing_year_papers": len(missing_year_papers),
        "missing_year_sense_rows": sum(1 for row in sense_rows if not paper_rows[row["paper_id"]].get("year")),
        "missing_citation_papers": len(missing_citation_papers),
        "missing_citation_sense_rows": sum(1 for row in sense_rows if not paper_rows[row["paper_id"]].get("citations")),
        "missing_quote_locators": missing_locators,
        **term_rights_counts,
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
        "published_sense_rows": sum(row["source_layer"] == "senses" for row in published_senses),
        "published_grounding_rows": len(published_senses),
        "withheld_sense_rows_rights": (
            grounded_layer_counts["senses"]
            - sum(row["source_layer"] == "senses" for row in published_senses)
        ),
        "withheld_grounding_rows_rights": len(sense_rows) - len(published_senses),
        "published_sense_papers": len({
            row["paper_id"] for row in published_senses if row["source_layer"] == "senses"
        }),
        "published_grounding_papers": len(published_papers),
        "published_picker_terms_with_grounded_senses": len({
            row["picker_slug"] for row in published_senses
            if row["source_layer"] == "senses" and row.get("picker_slug")
        }),
        "published_picker_terms_with_grounded_rows": len(published_picker_terms),
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

    # Build the complete runtime-picker denominator. concepts.json is the historical 474-term
    # cohort used by Task 09; score.js then merges every term_corpus row into it.
    concept_payload = json.loads(concepts_bytes.decode("utf-8"))
    base_concepts = concept_payload.get("concepts") or []
    runtime_labels = {
        slug(str(concept.get("en") or concept.get("id") or "")):
            str(concept.get("en") or concept.get("id") or "")
        for concept in base_concepts
        if isinstance(concept, dict) and slug(str(concept.get("en") or concept.get("id") or ""))
    }
    ready_slugs = {
        slug(str(concept.get("en") or concept.get("id") or ""))
        for concept in base_concepts
        if isinstance(concept, dict) and concept.get("state") == "ready"
    }
    for term_slug, entry in term_corpus.get("terms", {}).items():
        runtime_labels.setdefault(str(term_slug), str(entry[0]))
    live_runtime_slugs = set(live_picker_slugs) | ready_slugs

    staged_sources, staged_source_hashes = cleared_staged_mhtml_sources(records, cleared)
    visual_short_forms = [
        label for term_slug, label in runtime_labels.items()
        if term_slug in live_runtime_slugs and abbreviation_kind(label)
    ]
    all_expansions = collect_abbreviation_expansions(
        records,
        literal_sources=staged_sources,
        short_forms=visual_short_forms,
        runtime_labels=list(runtime_labels.values()),
    )
    public_expansions = {
        short: [row for row in rows if row["paper_id"] in cleared]
        for short, rows in all_expansions.items()
    }
    abbreviation_rows = []
    for term_slug, label in sorted(runtime_labels.items(), key=lambda item: folded(item[1])):
        if term_slug not in live_runtime_slugs:
            continue
        kind = abbreviation_kind(label)
        internal_rows = all_expansions.get(folded(label), [])
        public_rows = public_expansions.get(folded(label), [])
        if not kind and not internal_rows:
            continue
        expansion_names = {folded(row["expansion"]) for row in internal_rows}
        abbreviation_rows.append({
            "slug": term_slug,
            "label": label,
            "kind": kind or "corpus-attested-abbreviation",
            "expansions": public_rows,
            # A count is safe to publish; the denied paper's wording and identity are not.
            "withheld_expansion_rows": len(internal_rows) - len(public_rows),
            "internal_expansion_count": len(expansion_names),
            "ambiguous": len(expansion_names) > 1,
        })

    # Expansion rows can cite a rights-cleared paper that has no definition card of its own.
    # Add metadata only after the same rights decision that admitted the expansion.
    records_by_id = {str(record["id"]): record for record in records}
    for abbreviation in abbreviation_rows:
        for expansion in abbreviation["expansions"]:
            paper_id = expansion["paper_id"]
            if paper_id in published_papers:
                continue
            record = records_by_id[paper_id]
            citation = record.get("citations") if isinstance(record.get("citations"), dict) else None
            published_papers[paper_id] = {
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

    base_slugs = {
        slug(str(concept.get("en") or concept.get("id") or ""))
        for concept in base_concepts if isinstance(concept, dict)
    }
    strict_public_slugs = {
        row["picker_slug"] for row in published_senses
        if row["source_layer"] == "senses" and row.get("picker_slug") in base_slugs
    }
    all_layer_public_slugs = {
        row["picker_slug"] for row in published_senses
        if row.get("picker_slug") in base_slugs
    }
    render_gap_slugs = sorted(all_layer_public_slugs - strict_public_slugs - ready_slugs)
    before_rendered = strict_public_slugs | ready_slugs
    after_rendered = all_layer_public_slugs | ready_slugs
    live_historical_slugs = base_slugs & live_runtime_slugs

    counts.update({
        "historical_picker_terms": len(base_slugs),
        "historical_picker_terms_before_live_filter": len(base_slugs),
        "historical_picker_terms_after_live_filter": len(live_historical_slugs),
        "historical_picker_terms_removed_as_withdrawn_only": len(base_slugs - live_runtime_slugs),
        "historical_terms_grounded_any_layer": len(all_layer_public_slugs),
        "historical_terms_grounded_strict_senses": len(strict_public_slugs),
        "historical_definition_cards_before": len(before_rendered),
        "historical_definition_cards_after": len(after_rendered),
        "historical_render_gap_before": len(render_gap_slugs),
        "historical_render_gap_after": 0,
        "runtime_picker_terms_before_live_filter": len(runtime_labels),
        "runtime_picker_terms_after_live_filter": len(live_runtime_slugs & set(runtime_labels)),
        "runtime_picker_terms_removed_as_withdrawn_only": len(set(runtime_labels) - live_runtime_slugs),
        "abbreviation_class_terms": len(abbreviation_rows),
        "abbreviation_single_letter_terms": sum(
            row["kind"] == "single-letter" for row in abbreviation_rows
        ),
        "abbreviation_all_caps_terms": sum(
            row["kind"] == "all-caps-short-form" for row in abbreviation_rows
        ),
        "abbreviation_hebrew_terms": sum(
            row["kind"] == "hebrew-abbreviation" for row in abbreviation_rows
        ),
        "abbreviation_terms_with_public_expansions": sum(
            bool(row["expansions"]) for row in abbreviation_rows
        ),
        "abbreviation_ambiguous_terms_internal": sum(
            row["ambiguous"] for row in abbreviation_rows
        ),
        "abbreviation_withheld_expansion_rows": sum(
            row["withheld_expansion_rows"] for row in abbreviation_rows
        ),
        "abbreviation_staged_mhtml_sources_scanned": len(staged_sources),
        "abbreviation_staged_literal_expansion_rows": sum(
            row.get("source") == "staged-mhtml-literal-expansion-parenthesis"
            for rows in all_expansions.values() for row in rows
        ),
    })

    gap_rows = []
    for term_slug in render_gap_slugs:
        indices = published_picker_terms[term_slug]
        rows = [published_senses[index] for index in indices]
        gap_rows.append({
            "slug": term_slug,
            "label": runtime_labels.get(term_slug, term_slug),
            "grounded_rows": len(rows),
            "papers": sorted({row["paper_id"] for row in rows}),
            "source_layers": dict(sorted(Counter(row["source_layer"] for row in rows).items())),
            "outcome": "renders after three-layer index",
        })

    meta_report = {
        "schema_version": "meta-render-1",
        "generated_utc": generated,
        "source": source,
        "counts": counts,
        "historical_render_gap_terms": gap_rows,
        "abbreviation_class": abbreviation_rows,
        "rights_rule": (
            "Expansion wording and evidence are emitted only for papers in the audited "
            "cleared_ids allow-list; denied expansions contribute counts only."
        ),
    }

    index = {
        "schema_version": "meta-render-sense-index-2",
        "generated_utc": generated,
        "source": source,
        "counts": counts,
        "semantics": {
            "displayed_label": "project curatorial gloss; not attributed as the paper author's wording",
            "evidence": "verbatim attesting passage stored in DATA/corpus.json",
            "picker_binding": "case-folded exact text, with only matching outer quote/backtick removal allowed",
            "grounding_layers": ["content_tags.definitions", "senses", "concepts"],
            "withdrawal_rule": "the shared is_live predicate excludes every non-live row",
            "rights_gate": "verbatim passages are included only when build_paper_edition.cleared_ids() allows the paper",
            "anchor_index": "locator start/end count Unicode code points, not UTF-16 code units",
            "abbreviation_rule": "expansions are corpus-attested and paper-attributed; ambiguity is preserved",
        },
        "papers": published_papers,
        "senses": published_senses,
        "canonical_terms": published_canonical_terms,
        "picker_terms": published_picker_terms,
        "picker_live_slugs": sorted(live_runtime_slugs & set(runtime_labels)),
        "abbreviations": {row["slug"]: row for row in abbreviation_rows},
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
    meta_report_json = json.dumps(meta_report, ensure_ascii=False, separators=(",", ":"))

    mismatch_examples = "\n".join(
        f"- `{item['head']}` — {item['rows']} row(s)"
        for item in report["term_head_mismatches"][:50]
    )
    markdown = f"""# Task 06 sense-index failure report

Generated {generated} from `DATA/corpus.json` SHA-256 `{source['sha256']}`.

| Finding | Count |
|---|---:|
| Active grounded rows across all three layers | {counts['grounding_rows_active']:,} |
| Active legacy `senses` rows | {counts['sense_rows_active']:,} |
| Active `content_tags.definitions` rows | {counts['grounding_rows_by_layer'].get('content_tags.definitions', 0):,} |
| Active `concepts` rows | {counts['grounding_rows_by_layer'].get('concepts', 0):,} |
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
    gap_markdown = "\n".join(
        f"- `{row['slug']}` — {row['label']} — {row['grounded_rows']} grounded row(s); "
        f"layers: {', '.join(f'{layer}={count}' for layer, count in row['source_layers'].items())}"
        for row in gap_rows
    )
    abbreviation_markdown_rows = []
    for row in abbreviation_rows:
        if row["expansions"]:
            details = []
            for expansion in row["expansions"]:
                paper = published_papers.get(expansion["paper_id"], {})
                details.append(
                    f"{expansion['expansion']} — {paper.get('title', expansion['paper_id'])} "
                    f"({paper.get('year') or 'year unavailable'})"
                )
            rendered = "; ".join(details)
        else:
            rendered = "no corpus-attested public expansion"
        withheld = (
            f"; {row['withheld_expansion_rows']} additional expansion row(s) withheld by rights gate"
            if row["withheld_expansion_rows"] else ""
        )
        ambiguity = "; ambiguous across corpus records" if row["ambiguous"] else ""
        abbreviation_markdown_rows.append(
            f"- `{row['slug']}` — {row['label']} [{row['kind']}] — {rendered}{withheld}{ambiguity}"
        )
    meta_markdown = f"""# Meta-render audit report

Generated {generated}. This report audits the complete runtime picker, with public expansion
wording limited to the audited rights-cleared paper set.

| Denominator / outcome | Count |
|---|---:|
| Historical picker cohort | {counts['historical_picker_terms']:,} |
| Historical picker cohort after shared-live filtering | {counts['historical_picker_terms_after_live_filter']:,} |
| Historical rows removed as withdrawn-only | {counts['historical_picker_terms_removed_as_withdrawn_only']:,} |
| Definition cards before three-layer repair | {counts['historical_definition_cards_before']:,} |
| Definition cards after three-layer repair | {counts['historical_definition_cards_after']:,} |
| Historical render gap before | {counts['historical_render_gap_before']:,} |
| Historical render gap after | {counts['historical_render_gap_after']:,} |
| Runtime picker rows before shared-live filtering | {counts['runtime_picker_terms_before_live_filter']:,} |
| Runtime picker rows after shared-live filtering | {counts['runtime_picker_terms_after_live_filter']:,} |
| Runtime rows removed as withdrawn-only | {counts['runtime_picker_terms_removed_as_withdrawn_only']:,} |
| Complete abbreviation class | {counts['abbreviation_class_terms']:,} |
| Abbreviations with public corpus-attested expansions | {counts['abbreviation_terms_with_public_expansions']:,} |
| Rights-withheld expansion rows (count only) | {counts['abbreviation_withheld_expansion_rows']:,} |
| Rights-cleared staged HTML/MHTML sources scanned for literal expansions | {counts['abbreviation_staged_mhtml_sources_scanned']:,} |
| Literal expansion rows recovered from those sources | {counts['abbreviation_staged_literal_expansion_rows']:,} |
| Picker labels matching denied live quotes removed in this build | {counts['rights_removed_quote_picker_rows_this_build']:,} |

## Historical terms repaired by the three-layer route

{gap_markdown or '- none'}

## Complete runtime abbreviation class

{chr(10).join(abbreviation_markdown_rows) or '- none'}
"""

    # These inputs are maintained by concurrent workers. A mixed-generation output is worse
    # than no output, so compare every byte snapshot immediately before the first atomic write.
    stable_inputs = (
        (CORPUS, corpus_bytes),
        (RIGHTS, rights_bytes),
        (TERM_CORPUS, term_corpus_bytes),
        (CONCEPTS, concepts_bytes),
    )
    changed_inputs = [str(path) for path, snapshot in stable_inputs if path.read_bytes() != snapshot]
    changed_inputs.extend(
        str(path) for path, snapshot_hash in staged_source_hashes.items()
        if not path.exists() or hashlib.sha256(path.read_bytes()).hexdigest() != snapshot_hash
    )
    if changed_inputs:
        raise RuntimeError(
            "input changed during meta-render build; refusing all output writes: "
            + ", ".join(changed_inputs)
        )

    atomic_text(OUT_INDEX, index_json + "\n")
    atomic_text(
        OUT_INLINE,
        "window.MTP_SENSE_INDEX=" + index_json
        + ";\nwindow.MTP_SENSE_REPORT=" + report_json + ";\n",
    )
    atomic_text(OUT_REPORT, report_json + "\n")
    atomic_text(OUT_META_REPORT, meta_report_json + "\n")
    atomic_text(OUT_REPORT_MD, markdown)
    atomic_text(OUT_META_REPORT_MD, meta_markdown)

    print(json.dumps({"generated": generated, "counts": counts}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
