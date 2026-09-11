# Task 06 sense-index failure report

Generated 2026-09-11T15:35:26+00:00 from `DATA/corpus.json` SHA-256 `467e4b706d2163257876376d256ee8d08a90ebd4fcb8db133f9ebfed2641f553`.

| Finding | Count |
|---|---:|
| Active grounded rows across all three layers | 25,644 |
| Active legacy `senses` rows | 6,461 |
| Active `content_tags.definitions` rows | 5,507 |
| Active `concepts` rows | 13,676 |
| Verbatim sense rows published after audited rights gate | 3,387 |
| Verbatim sense rows withheld by rights gate | 3,074 |
| Picker terms with publishable grounded senses | 651 |
| Publishable multi-paper picker terms | 632 |
| Publishable one-paper picker terms | 10,499 |
| Withdrawn rows excluded | 54 |
| Hard delimiter failures | 1,951 |
| Rights-cleared hard delimiter examples published | 1,392 |
| Delimiter-ambiguous rows | 305 |
| Rights-cleared delimiter-ambiguous examples published | 81 |
| Parsed rows bound by exact case-folded picker label | 20,769 |
| Parsed rows bound after removing one presentation wrapper | 203 |
| Parsed rows without a safe picker-term match | 2,721 |
| Papers with more than one active sense | 1,083 |
| Paper/head groups with multiple active senses | 2,550 |
| Active-sense papers missing a year | 7 |
| Active-sense papers missing citation counts | 18 |
| Active sense rows missing an anchor locator | 13 |

The rights-cleared row-level findings are in `sense_index_report.json`; the counts above audit the
complete local snapshot. A sense label is a project
curatorial gloss. The exact attesting passage is preserved separately; the interface never
presents the gloss as a verbatim definition written by the paper's authors. Verbatim passages
are present in the browser-facing index only for records allowed by the audited `cleared_ids()`
predicate. No row-level example from a denied paper is written into the published report.

## Most frequent unmatched parsed heads (first 50)

- `contact` — 3 row(s)
- `hallucination` — 3 row(s)
- `P value` — 3 row(s)
- `AlphaFold-multimer` — 2 row(s)
- `altered consciousness` — 2 row(s)
- `analysis output` — 2 row(s)
- `ancestry` — 2 row(s)
- `BFD` — 2 row(s)
- `bottom-up` — 2 row(s)
- `cause hierarchy` — 2 row(s)
- `CODEm` — 2 row(s)
- `ColabFold` — 2 row(s)
- `ColabFoldDB` — 2 row(s)
- `Colaboratory` — 2 row(s)
- `colour` — 2 row(s)
- `concept of art` — 2 row(s)
- `confidence score` — 2 row(s)
- `content analysis` — 2 row(s)
- `CorrTest` — 2 row(s)
- `cross-distillation` — 2 row(s)
- `diffusion module` — 2 row(s)
- `discovery` — 2 row(s)
- `DisMod-MR` — 2 row(s)
- `distance error matrix` — 2 row(s)
- `early activations` — 2 row(s)
- `early stop criterion` — 2 row(s)
- `echo chamber effect` — 2 row(s)
- `evidence channels` — 2 row(s)
- `evolutionary probabilities` — 2 row(s)
- `FAVA` — 2 row(s)
- `functional association` — 2 row(s)
- `genomic context` — 2 row(s)
- `interologs` — 2 row(s)
- `ipTM` — 2 row(s)
- `mean squared error` — 2 row(s)
- `measuring consciousness` — 2 row(s)
- `MEGA-CC` — 2 row(s)
- `modular` — 2 row(s)
- `natural-language processing` — 2 row(s)
- `neutral theory of molecular evolution` — 2 row(s)
- `non-local evidence` — 2 row(s)
- `open access` — 2 row(s)
- `pairformer` — 2 row(s)
- `priority area` — 2 row(s)
- `prosocial coding` — 2 row(s)
- `quality` — 2 row(s)
- `R 2` — 2 row(s)
- `recycle count` — 2 row(s)
- `redistribution algorithms` — 2 row(s)
- `RelTime` — 2 row(s)
