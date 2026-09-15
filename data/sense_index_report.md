# Task 06 sense-index failure report

Generated 2026-09-15T15:13:17+00:00 from `DATA/corpus.json` SHA-256 `610e83e7aa699f5a269b6e8dd7a320e9d34775504d3945f3c0145e0a52ad5e57`.

| Finding | Count |
|---|---:|
| Active grounded rows across all three layers | 25,629 |
| Active legacy `senses` rows | 6,481 |
| Active `content_tags.definitions` rows | 5,344 |
| Active `concepts` rows | 13,804 |
| Verbatim sense rows published after audited rights gate | 3,407 |
| Verbatim sense rows withheld by rights gate | 3,074 |
| Picker terms with publishable grounded senses | 657 |
| Publishable multi-paper picker terms | 674 |
| Publishable one-paper picker terms | 10,143 |
| Withdrawn rows excluded | 503 |
| Hard delimiter failures | 1,951 |
| Rights-cleared hard delimiter examples published | 1,392 |
| Delimiter-ambiguous rows | 305 |
| Rights-cleared delimiter-ambiguous examples published | 81 |
| Parsed rows bound by exact case-folded picker label | 20,261 |
| Parsed rows bound after removing one presentation wrapper | 203 |
| Parsed rows without a safe picker-term match | 3,214 |
| Papers with more than one active sense | 1,086 |
| Paper/head groups with multiple active senses | 2,713 |
| Active-sense papers missing a year | 3 |
| Active-sense papers missing citation counts | 18 |
| Active sense rows missing an anchor locator | 8 |

The rights-cleared row-level findings are in `sense_index_report.json`; the counts above audit the
complete local snapshot. A sense label is a project
curatorial gloss. The exact attesting passage is preserved separately; the interface never
presents the gloss as a verbatim definition written by the paper's authors. Verbatim passages
are present in the browser-facing index only for records allowed by the audited `cleared_ids()`
predicate. No row-level example from a denied paper is written into the published report.

## Most frequent unmatched parsed heads (first 50)

- `communication probability` — 3 row(s)
- `contact` — 3 row(s)
- `garbage codes` — 3 row(s)
- `P value` — 3 row(s)
- `suspected case` — 3 row(s)
- `altered consciousness` — 2 row(s)
- `analysis output` — 2 row(s)
- `ancestry` — 2 row(s)
- `associated with` — 2 row(s)
- `bottom-up` — 2 row(s)
- `burden` — 2 row(s)
- `CellChatDB` — 2 row(s)
- `cognitive inoculation` — 2 row(s)
- `colour` — 2 row(s)
- `communication pattern` — 2 row(s)
- `comorbidity correction` — 2 row(s)
- `concept of art` — 2 row(s)
- `content analysis` — 2 row(s)
- `disability-adjusted life-years` — 2 row(s)
- `discovery` — 2 row(s)
- `early activations` — 2 row(s)
- `echo chamber effect` — 2 row(s)
- `expert` — 2 row(s)
- `hierarchical plot` — 2 row(s)
- `intercellular communication network` — 2 row(s)
- `mean squared error` — 2 row(s)
- `measuring consciousness` — 2 row(s)
- `modular` — 2 row(s)
- `MR-BRT` — 2 row(s)
- `natural-language processing` — 2 row(s)
- `non-local evidence` — 2 row(s)
- `open access` — 2 row(s)
- `outgoing patterns` — 2 row(s)
- `point prevalence` — 2 row(s)
- `post-COVID-19 condition` — 2 row(s)
- `priority area` — 2 row(s)
- `prosocial coding` — 2 row(s)
- `quality` — 2 row(s)
- `R 2` — 2 row(s)
- `regression methods` — 2 row(s)
- `remaining carbon budget` — 2 row(s)
- `result provenance` — 2 row(s)
- `reverse inference` — 2 row(s)
- `Sarbecovirus` — 2 row(s)
- `sequelae` — 2 row(s)
- `that absence` — 2 row(s)
- `THE CLASS EXISTS ONLY AS A CONJUNCTION, AND THE PAPER SAYS SO OF ITS OWN FINDING: VIP NEURONS ARE NOT THE ONLY STELLATE NEURONS IN THE IC, NOR ARE THEY THE ONLY NEURONS WITH SUSTAINED FIRING PATTERNS OR DENDRITIC SPINES` — 2 row(s)
- `THE DOSE WAS PUSHED UNTIL THE ANIMALS BROKE: WE INITIALLY USED A HIGH DOSE (300 ng PER SIDE) FOR BILATERAL PPC INFUSIONS, BUT ONLY 2 OF 6 RATS COMPLETED TRIALS, WITH INCONSISTENT RESULTS` — 2 row(s)
- `THE SAME NULL HAS BEEN SEEN IN ANOTHER SPECIES: A PRELIMINARY REPORT HAS SUGGESTED THAT UNILATERAL PRIMATE PPC INACTIVATIONS HAVE NO EFFECT ON ACCUMULATION OF EVIDENCE TRIALS, WHILE CAUSING AN IPSILATERAL BIAS ON FREE CHOICE TRIALS` — 2 row(s)
- `the standard` — 2 row(s)
