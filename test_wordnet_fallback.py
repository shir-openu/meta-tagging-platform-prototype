#!/usr/bin/env python3
"""Regression gates for the generated WordNet fallback and its UI boundary."""

from __future__ import annotations

import hashlib
import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"


class WordNetFallbackTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.payload_raw = (DATA / "external_definitions.wordnet.json").read_bytes()
        cls.payload = json.loads(cls.payload_raw)
        cls.report = json.loads((DATA / "wordnet_fallback_report.json").read_text(encoding="utf-8"))
        cls.manifest = json.loads(
            (DATA / "external_definitions.wordnet.manifest.json").read_text(encoding="utf-8")
        )
        cls.layer = cls.payload["external_definitions"]["wordnet-3.0"]

    def test_provider_is_explicit_and_default_off(self) -> None:
        self.assertFalse(self.payload["default_enabled"])
        provider = self.layer["provider"]
        self.assertEqual(provider["id"], "wordnet-3.0")
        self.assertEqual(provider["version"], "3.0")
        self.assertEqual(provider["licence_spdx"], "WordNet")
        for field in ("source_uri", "source_page", "licence_uri", "official_licence_uri"):
            self.assertTrue(provider[field].startswith("https://"), field)

    def test_exact_coverage_and_complete_synset_identity(self) -> None:
        concepts = json.loads((DATA / "concepts.json").read_text(encoding="utf-8"))["concepts"]
        picker = {concept["id"] for concept in concepts}
        terms = self.layer["terms"]
        self.assertEqual(len(picker), 474)
        self.assertEqual(len(terms), 92)
        self.assertLessEqual(set(terms), picker)
        self.assertEqual(
            self.payload["definition_fields"],
            ["pos", "synset_offset", "sense_key", "gloss"],
        )
        sense_key = re.compile(r"^[^%]+%[1-5]:")
        provider_keys: set[tuple[str, str, str]] = set()
        withheld = set(self.payload["corpus_definition_visibility"]["withheld_term_ids"])
        self.assertLessEqual(withheld, set(terms))
        for term_id, definitions in terms.items():
            self.assertTrue(definitions)
            for definition in definitions:
                self.assertEqual(len(definition), 4)
                pos, offset, key, gloss = definition
                self.assertIn(pos, self.payload["pos_codes"])
                self.assertTrue(gloss.strip())
                self.assertRegex(offset, r"^\d{8}$")
                self.assertRegex(key, sense_key)
                provider_key = (term_id, pos, offset)
                self.assertNotIn(provider_key, provider_keys)
                provider_keys.add(provider_key)

    def test_assignment_and_two_definition_measurements_are_explicit(self) -> None:
        counts = self.report["counts"]
        self.assertEqual(counts["wordnet_matched_picker_terms"], 92)
        self.assertEqual(counts["historical_assignment_gap_terms"], 415)
        self.assertEqual(counts["wordnet_matches_in_historical_assignment_gap"], 75)
        self.assertEqual(counts["historical_assignment_gap_left_uncovered"], 340)
        for scope in ("current_all_corpus_layers", "current_public_rights_cleared_layer"):
            metric = self.report[scope]
            self.assertGreaterEqual(metric["terms_newly_reaching_two_with_wordnet"], 0)
            self.assertEqual(
                metric["terms_with_at_least_two_after_wordnet"],
                metric["terms_with_at_least_two_before_wordnet"]
                + metric["terms_newly_reaching_two_with_wordnet"],
            )

    def test_inline_copy_and_manifest_hashes_are_exact(self) -> None:
        inline = (DATA / "external_definitions.wordnet.inline.js").read_bytes()
        prefix = b"window.MTP_EXTERNAL_DEFINITIONS="
        self.assertTrue(inline.startswith(prefix))
        self.assertTrue(inline.endswith(b";\n"))
        self.assertEqual(json.loads(inline[len(prefix):-2]), self.payload)
        for filename, facts in self.manifest["outputs"].items():
            raw = (DATA / filename).read_bytes()
            self.assertEqual(len(raw), facts["bytes"], filename)
            self.assertEqual(hashlib.sha256(raw).hexdigest(), facts["sha256"], filename)

    def test_full_notice_and_ui_separation_are_present(self) -> None:
        notice = (DATA / "WORDNET_LICENSE.txt").read_text(encoding="utf-8")
        self.assertIn("WordNet 3.0 Copyright 2006 by Princeton University", notice)
        self.assertIn("SPDX licence identifier: WordNet", notice)
        score = (ROOT / "js" / "score.js").read_text(encoding="utf-8")
        self.assertIn("externalDefinitions: null, externalEnabled: false", score)
        self.assertIn("External fallback definitions", (ROOT / "js" / "i18n.js").read_text(encoding="utf-8"))
        self.assertNotRegex(score, r"senseIndices\s*\.\s*(?:push|concat)\([^\n]*external")


if __name__ == "__main__":
    unittest.main()
