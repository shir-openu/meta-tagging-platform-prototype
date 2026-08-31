# Task 06 sense-index failure report

Generated 2026-08-31T16:46:32+00:00 from `DATA/corpus.json` SHA-256 `57d076e1070da202768ac9637548f5e114969a0ff2eafb7b2ab41d0150ceb26b`.

| Finding | Count |
|---|---:|
| Active grounded rows across all three layers | 18,564 |
| Active legacy `senses` rows | 5,329 |
| Active `content_tags.definitions` rows | 4,436 |
| Active `concepts` rows | 8,799 |
| Verbatim sense rows published after audited rights gate | 3,085 |
| Verbatim sense rows withheld by rights gate | 2,244 |
| Picker terms with publishable grounded senses | 728 |
| Publishable multi-paper picker terms | 394 |
| Publishable one-paper picker terms | 8,260 |
| Withdrawn rows excluded | 54 |
| Hard delimiter failures | 1,507 |
| Rights-cleared hard delimiter examples published | 990 |
| Delimiter-ambiguous rows | 305 |
| Rights-cleared delimiter-ambiguous examples published | 116 |
| Parsed rows bound by exact case-folded picker label | 14,224 |
| Parsed rows bound after removing one presentation wrapper | 201 |
| Parsed rows without a safe picker-term match | 2,632 |
| Papers with more than one active sense | 901 |
| Paper/head groups with multiple active senses | 1,631 |
| Active-sense papers missing a year | 3 |
| Active-sense papers missing citation counts | 14 |
| Active sense rows missing an anchor locator | 13 |

The rights-cleared row-level findings are in `sense_index_report.json`; the counts above audit the
complete local snapshot. A sense label is a project
curatorial gloss. The exact attesting passage is preserved separately; the interface never
presents the gloss as a verbatim definition written by the paper's authors. Verbatim passages
are present in the browser-facing index only for records allowed by the audited `cleared_ids()`
predicate. No row-level example from a denied paper is written into the published report.

## Most frequent unmatched parsed heads (first 50)

- `GPGP plastic mass` — 3 row(s)
- `what an MCP-counter score is` — 3 row(s)
- `"effectively normalized"` — 2 row(s)
- ``open`` — 2 row(s)
- `a COD record's identity` — 2 row(s)
- `a deposited structure's visibility` — 2 row(s)
- `a parameter set` — 2 row(s)
- `a prebiotic effect` — 2 row(s)
- `a questionable source` — 2 row(s)
- `a training set of M structures` — 2 row(s)
- `accuracy of decontam` — 2 row(s)
- `agreement of targeted CGP with whole exome` — 2 row(s)
- `an attention map` — 2 row(s)
- `an issue covered` — 2 row(s)
- `an object class` — 2 row(s)
- `an omission` — 2 row(s)
- `an oxygen atom` — 2 row(s)
- `an xCell score` — 2 row(s)
- `annotator disagreement` — 2 row(s)
- `b-MnO2's capacity for zinc` — 2 row(s)
- `bacteria-to-human-cell ratio` — 2 row(s)
- `citation frequency` — 2 row(s)
- `confounding by indication` — 2 row(s)
- `control problem` — 2 row(s)
- `database population` — 2 row(s)
- `decision-making phases` — 2 row(s)
- `deep-sea microplastic abundance` — 2 row(s)
- `deterministic linkage` — 2 row(s)
- `discovery` — 2 row(s)
- `early activations` — 2 row(s)
- `echo chamber effect` — 2 row(s)
- `evidence of prebiotic activity` — 2 row(s)
- `family` — 2 row(s)
- `far transfer` — 2 row(s)
- `global river plastic input` — 2 row(s)
- `how much plastic should be there` — 2 row(s)
- `linkage bias` — 2 row(s)
- `measuring consciousness` — 2 row(s)
- `model failure` — 2 row(s)
- `model-observation correlation` — 2 row(s)
- `modular` — 2 row(s)
- `NequIP's MD-17 energy error` — 2 row(s)
- `neuromyths` — 2 row(s)
- `neuroprediction` — 2 row(s)
- `novelty of DAH` — 2 row(s)
- `parameter heterogeneity across genes` — 2 row(s)
- `postdiction` — 2 row(s)
- `probabilistic linkage` — 2 row(s)
- `probabilistic prediction` — 2 row(s)
- `prosocial coding` — 2 row(s)
