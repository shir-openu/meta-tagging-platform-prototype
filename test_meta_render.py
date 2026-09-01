"""Regression controls for META_RENDER_CODEX's grounded-card and abbreviation fixes."""

from __future__ import annotations

import unittest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_sense_index import (
    abbreviation_kind,
    collect_abbreviation_expansions,
    collect_grounded_rows,
    rights_sanitize_term_corpus,
)


class GroundedLayerTests(unittest.TestCase):
    def test_all_three_layers_use_the_shared_live_row_rule(self) -> None:
        record = {
            "id": "control-paper",
            "content_tags": {"definitions": [
                {"term": "alpha", "text": "live definition", "evidence": "A live evidence passage long enough to publish safely."},
                {"term": "dead-alpha", "text": "withdrawn definition", "evidence": "A withdrawn evidence passage long enough to look usable.",
                 "withdrawn_reason": "bad source"},
            ]},
            "senses": [
                {"label": "beta - live sense gloss long enough for the card", "evidence": "A live sense passage long enough to publish safely."},
                {"label": "dead-beta - withdrawn sense gloss long enough for the card", "evidence": "A withdrawn sense passage long enough to look usable.",
                 "withdrawn_evidence": "old quote"},
            ],
            "concepts": [
                {"term": "gamma", "sense": "live concept sense long enough for the card", "evidence": "A live concept passage long enough to publish safely."},
                {"term": "repaired-gamma", "sense": "re-grounded concept sense remains live", "evidence": "A replacement passage long enough to publish safely.",
                 "retracted": "old span was replaced"},
                {"term": "dead-gamma", "sense": "withdrawn concept sense must not render", "evidence": "A withdrawn concept passage long enough to look usable.",
                 "withdrawn_reason": "bad source"},
            ],
        }

        rows, withdrawn = collect_grounded_rows(record)

        self.assertEqual(
            {row["term"] for row in rows},
            {"alpha", "beta", "gamma", "repaired-gamma"},
        )
        self.assertEqual({row["term"] for row in withdrawn}, {"dead-alpha", "dead-beta", "dead-gamma"})
        self.assertEqual(
            {row["source_layer"] for row in rows},
            {"content_tags.definitions", "senses", "concepts"},
        )


class AbbreviationClassTests(unittest.TestCase):
    def test_visual_and_hebrew_short_forms_are_enumerated(self) -> None:
        self.assertEqual(abbreviation_kind("N"), "single-letter")
        self.assertEqual(abbreviation_kind("RAM"), "all-caps-short-form")
        self.assertEqual(abbreviation_kind("ר״ת"), "hebrew-abbreviation")
        self.assertIsNone(abbreviation_kind("memory"))

    def test_ambiguous_sense_label_expansion_requires_attesting_evidence(self) -> None:
        record = {
            "id": "chemical-paper",
            "senses": [{
                "label": "`PFC` - reserved here for `perfluorocarbons`",
                "evidence": "The paper uses PFC specifically to designate perfluorocarbons.",
            }],
        }
        rows = collect_abbreviation_expansions([record])
        self.assertEqual(rows["pfc"][0]["expansion"], "perfluorocarbons")

        record["senses"][0]["evidence"] = "The paper uses PFC but gives no full form here."
        self.assertNotIn("pfc", collect_abbreviation_expansions([record]))


class TermCorpusRightsTests(unittest.TestCase):
    def test_denied_long_statistic_surface_is_removed_but_short_form_remains(self) -> None:
        long_surface = "The overall alpha level was set at 0.05"
        payload = {
            "order": ["denied-paper"],
            "papers": {},
            "terms": {
                "the-overall-alpha-level-was-set-at-0-05": [long_surface, [0], [0]],
                "ram": ["RAM", [0], [0]],
            },
        }
        records = [{
            "id": "denied-paper",
            "content_tags": {"statistics": [
                {"surface": long_surface, "evidence": long_surface},
                {"surface": "RAM"},
            ]},
        }]

        sanitized, counts = rights_sanitize_term_corpus(payload, records, set())

        self.assertNotIn("the-overall-alpha-level-was-set-at-0-05", sanitized["terms"])
        self.assertIn("ram", sanitized["terms"])
        self.assertEqual(counts["rights_removed_quote_picker_rows_this_build"], 1)

    def test_cleared_matching_slug_does_not_rescue_denied_quote_wording(self) -> None:
        denied = "A result was significant under the alpha criterion"
        public = "A-result was significant under the alpha criterion"
        term_slug = "a-result-was-significant-under-the-alpha-criterion"
        payload = {
            "order": ["denied-paper", "cleared-paper"],
            "papers": {},
            "terms": {term_slug: [denied, [0, 1], [0, 1]]},
        }
        records = [
            {"id": "denied-paper", "content_tags": {"definitions": [
                {"term": denied, "text": "a definition", "evidence": denied},
            ]}},
            {"id": "cleared-paper", "content_tags": {"key_terms": [{"term": public}]}},
        ]

        sanitized, counts = rights_sanitize_term_corpus(payload, records, {"cleared-paper"})

        self.assertNotIn(term_slug, sanitized["terms"])
        self.assertEqual(counts["rights_removed_quote_picker_rows_this_build"], 1)


if __name__ == "__main__":
    unittest.main(verbosity=2)
