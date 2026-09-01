# Task 06 sense-index failure report

Generated 2026-09-01T11:09:19+00:00 from `DATA/corpus.json` SHA-256 `135da110f991e1d6837fbc8646a3d225355782882c3b16402e5dc6ff5444ec5e`.

| Finding | Count |
|---|---:|
| Active grounded rows across all three layers | 20,725 |
| Active legacy `senses` rows | 5,657 |
| Active `content_tags.definitions` rows | 4,659 |
| Active `concepts` rows | 10,409 |
| Verbatim sense rows published after audited rights gate | 1,087 |
| Verbatim sense rows withheld by rights gate | 4,570 |
| Picker terms with publishable grounded senses | 133 |
| Publishable multi-paper picker terms | 179 |
| Publishable one-paper picker terms | 4,662 |
| Withdrawn rows excluded | 54 |
| Hard delimiter failures | 1,835 |
| Rights-cleared hard delimiter examples published | 787 |
| Delimiter-ambiguous rows | 305 |
| Rights-cleared delimiter-ambiguous examples published | 2 |
| Parsed rows bound by exact case-folded picker label | 16,216 |
| Parsed rows bound after removing one presentation wrapper | 201 |
| Parsed rows without a safe picker-term match | 2,473 |
| Papers with more than one active sense | 957 |
| Paper/head groups with multiple active senses | 1,787 |
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

- `modular` — 2 row(s)
- `R 2` — 2 row(s)
- `remaining carbon budget` — 2 row(s)
- `reverse inference` — 2 row(s)
- `the ambitious scenario` — 2 row(s)
- `the target` — 2 row(s)
- `training samples` — 2 row(s)
- `upper limit on Λ(1.4 M⊙)` — 2 row(s)
- `η` — 2 row(s)
- `'a general process for determining'` — 1 row(s)
- ``computability` and `effective calculability`` — 1 row(s)
- ``the 97% consensus`` — 1 row(s)
- `Abstract-only categorization` — 1 row(s)
- `ADS` — 1 row(s)
- `amino acid sequence` — 1 row(s)
- `Argo observing strategy` — 1 row(s)
- `Balanced one-family classifier` — 1 row(s)
- `batch processing` — 1 row(s)
- `Bern-model limitation` — 1 row(s)
- `Binary inspiral` — 1 row(s)
- `Black-hole coalescence` — 1 row(s)
- `Blind abstract rating` — 1 row(s)
- `bottom-up` — 1 row(s)
- `broad-sense heritability` — 1 row(s)
- `Carbon-dioxide pulse persistence` — 1 row(s)
- `Carbon-fee strategy` — 1 row(s)
- `circular and circle-free` — 1 row(s)
- `Climate-change extrapolation` — 1 row(s)
- `Climate-system inertia` — 1 row(s)
- `Cloud genomic analysis` — 1 row(s)
- `CNN weather baseline` — 1 row(s)
- `cognitive inoculation` — 1 row(s)
- `composite health behavior change score` — 1 row(s)
- `Composite null hypothesis` — 1 row(s)
- `Content-addressable representation` — 1 row(s)
- `Cook's distance` — 1 row(s)
- `coreness and uniqueness scores` — 1 row(s)
- `COVID-19 period` — 1 row(s)
- `Cronbach's alpha` — 1 row(s)
- `cross validation` — 1 row(s)
- `DASS 21` — 1 row(s)
- `DASS-21` — 1 row(s)
- `Delay penalty` — 1 row(s)
- `DESeq2 software` — 1 row(s)
- `Detection statistic / background` — 1 row(s)
- `Detector-noise background` — 1 row(s)
- `Direct / iterative forecast` — 1 row(s)
- `direct evidence` — 1 row(s)
- `Distance / inclination degeneracy` — 1 row(s)
- `domain-gap problem` — 1 row(s)
