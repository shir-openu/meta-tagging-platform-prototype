# Task 06 sense-index failure report

Generated 2026-09-08T07:24:50+00:00 from `DATA/corpus.json` SHA-256 `55da546506da2a27f8171968b53f88e746f50ea318200112a0c985a281ffcc80`.

| Finding | Count |
|---|---:|
| Active grounded rows across all three layers | 25,177 |
| Active legacy `senses` rows | 6,392 |
| Active `content_tags.definitions` rows | 5,408 |
| Active `concepts` rows | 13,377 |
| Verbatim sense rows published after audited rights gate | 3,056 |
| Verbatim sense rows withheld by rights gate | 3,336 |
| Picker terms with publishable grounded senses | 605 |
| Publishable multi-paper picker terms | 522 |
| Publishable one-paper picker terms | 9,724 |
| Withdrawn rows excluded | 54 |
| Hard delimiter failures | 1,951 |
| Rights-cleared hard delimiter examples published | 1,392 |
| Delimiter-ambiguous rows | 305 |
| Rights-cleared delimiter-ambiguous examples published | 81 |
| Parsed rows bound by exact case-folded picker label | 20,226 |
| Parsed rows bound after removing one presentation wrapper | 203 |
| Parsed rows without a safe picker-term match | 2,797 |
| Papers with more than one active sense | 1,071 |
| Paper/head groups with multiple active senses | 2,455 |
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

- `export painting` — 4 row(s)
- `kitsch` — 4 row(s)
- `aesthetic value` — 3 row(s)
- `artworld` — 3 row(s)
- `contact` — 3 row(s)
- `intention condition` — 3 row(s)
- `Liking` — 3 row(s)
- `P value` — 3 row(s)
- `aesthetic account` — 2 row(s)
- `aesthetic agency` — 2 row(s)
- `altered consciousness` — 2 row(s)
- `analysis output` — 2 row(s)
- `ancestry` — 2 row(s)
- `anti-AI bias` — 2 row(s)
- `aposematism` — 2 row(s)
- `artefactual essentialism` — 2 row(s)
- `artistic value` — 2 row(s)
- `artwork` — 2 row(s)
- `biotic art` — 2 row(s)
- `bottom-up` — 2 row(s)
- `brightness` — 2 row(s)
- `cluster accounts of art` — 2 row(s)
- `collative` — 2 row(s)
- `colour` — 2 row(s)
- `concept of art` — 2 row(s)
- `conceptual fluency` — 2 row(s)
- `content analysis` — 2 row(s)
- `crossmodal correspondences` — 2 row(s)
- `definition of art` — 2 row(s)
- `discovery` — 2 row(s)
- `disjunctive accounts` — 2 row(s)
- `dual character concept` — 2 row(s)
- `dual-hormone hypothesis` — 2 row(s)
- `early activations` — 2 row(s)
- `echo chamber effect` — 2 row(s)
- `effort heuristic` — 2 row(s)
- `emotional mediation` — 2 row(s)
- `essential property` — 2 row(s)
- `essentialist identification` — 2 row(s)
- `folk concept of art` — 2 row(s)
- `function essentialism` — 2 row(s)
- `institutional account` — 2 row(s)
- `intrinsic essentialism` — 2 row(s)
- `lexical/semantic account` — 2 row(s)
- `mean squared error` — 2 row(s)
- `measuring consciousness` — 2 row(s)
- `modification condition` — 2 row(s)
- `modular` — 2 row(s)
- `narrativity` — 2 row(s)
- `naturefacts` — 2 row(s)
