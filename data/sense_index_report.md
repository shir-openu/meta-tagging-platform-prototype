# Task 06 sense-index failure report

Generated 2026-09-08T04:45:25+00:00 from `DATA/corpus.json` SHA-256 `3a790ea7e0ae1a55209b6dd80269d78a992f032a82d3a534027795dd43b82f6b`.

| Finding | Count |
|---|---:|
| Active grounded rows across all three layers | 24,814 |
| Active legacy `senses` rows | 6,328 |
| Active `content_tags.definitions` rows | 5,337 |
| Active `concepts` rows | 13,149 |
| Verbatim sense rows published after audited rights gate | 2,992 |
| Verbatim sense rows withheld by rights gate | 3,336 |
| Picker terms with publishable grounded senses | 511 |
| Publishable multi-paper picker terms | 481 |
| Publishable one-paper picker terms | 8,232 |
| Withdrawn rows excluded | 54 |
| Hard delimiter failures | 1,950 |
| Rights-cleared hard delimiter examples published | 1,391 |
| Delimiter-ambiguous rows | 305 |
| Rights-cleared delimiter-ambiguous examples published | 81 |
| Parsed rows bound by exact case-folded picker label | 17,565 |
| Parsed rows bound after removing one presentation wrapper | 202 |
| Parsed rows without a safe picker-term match | 5,097 |
| Papers with more than one active sense | 1,062 |
| Paper/head groups with multiple active senses | 2,372 |
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

- `criticality` — 6 row(s)
- `Darwin Core` — 5 row(s)
- `coral cover` — 4 row(s)
- `Evolutionary Distinctiveness` — 4 row(s)
- `Singularity` — 4 row(s)
- `contact` — 3 row(s)
- `developable surface` — 3 row(s)
- `disorders of consciousness` — 3 row(s)
- `EDGE species` — 3 row(s)
- `epidemiological change` — 3 row(s)
- `human capital` — 3 row(s)
- `lift` — 3 row(s)
- `natural kind term` — 3 row(s)
- `neuronal avalanche` — 3 row(s)
- `next generation matrix` — 3 row(s)
- `P value` — 3 row(s)
- `Phylogenetic Diversity` — 3 row(s)
- `physical contact` — 3 row(s)
- `population ageing` — 3 row(s)
- `proportional range rarity` — 3 row(s)
- `protection` — 3 row(s)
- `range rarity` — 3 row(s)
- `reporting bias` — 3 row(s)
- `restoration` — 3 row(s)
- `shared code base` — 3 row(s)
- `Simple Darwin Core` — 3 row(s)
- `smoking impact` — 3 row(s)
- `software` — 3 row(s)
- `support` — 3 row(s)
- `threatened` — 3 row(s)
- `unit tests` — 3 row(s)
- `version control system` — 3 row(s)
- `active intellect` — 2 row(s)
- `active-set approach` — 2 row(s)
- `AD-frame` — 2 row(s)
- `AD-model` — 2 row(s)
- `adequacy target` — 2 row(s)
- `aggregate models` — 2 row(s)
- `agricultural opportunity cost` — 2 row(s)
- `altered consciousness` — 2 row(s)
- `analysis output` — 2 row(s)
- `analysis workflow` — 2 row(s)
- `analytic idealism` — 2 row(s)
- `ancestry` — 2 row(s)
- `apophenia` — 2 row(s)
- `aqueous solubility` — 2 row(s)
- `Aristotelian diagram` — 2 row(s)
- `Aristotelian isomorphism` — 2 row(s)
- `ARRIVE` — 2 row(s)
- `assertion` — 2 row(s)
