# Task 06 sense-index failure report

Generated 2026-10-06T07:39:10+00:00 from `DATA/corpus.json` SHA-256 `4eae9d93aa6348a4feb204fd9c0e141461d6b479bec61f71ac3f5e39ab6ab875`.

| Finding | Count |
|---|---:|
| Active grounded rows across all three layers | 34,949 |
| Active legacy `senses` rows | 7,605 |
| Active `content_tags.definitions` rows | 5,957 |
| Active `concepts` rows | 21,387 |
| Verbatim sense rows published after audited rights gate | 4,610 |
| Verbatim sense rows withheld by rights gate | 2,995 |
| Picker terms with publishable grounded senses | 954 |
| Publishable multi-paper picker terms | 1,499 |
| Publishable one-paper picker terms | 15,996 |
| Withdrawn rows excluded | 500 |
| Hard delimiter failures | 1,946 |
| Rights-cleared hard delimiter examples published | 1,394 |
| Delimiter-ambiguous rows | 304 |
| Rights-cleared delimiter-ambiguous examples published | 85 |
| Parsed rows bound by exact case-folded picker label | 29,438 |
| Parsed rows bound after removing one presentation wrapper | 210 |
| Parsed rows without a safe picker-term match | 3,355 |
| Papers with more than one active sense | 1,656 |
| Paper/head groups with multiple active senses | 3,426 |
| Active-sense papers missing a year | 3 |
| Active-sense papers missing citation counts | 17 |
| Active sense rows missing an anchor locator | 8 |

The rights-cleared row-level findings are in `sense_index_report.json`; the counts above audit the
local snapshot without the 16 record(s) this project withholds
from every public surface. A sense label is a project
curatorial gloss. The exact attesting passage is preserved separately; the interface never
presents the gloss as a verbatim definition written by the paper's authors. Verbatim passages
are present in the browser-facing index only for records allowed by the audited `cleared_ids()`
predicate. No row-level example from a denied paper is written into the published report.

## Most frequent unmatched parsed heads (first 50)

- `bottom-up` — 4 row(s)
- `biodiversity hotspots` — 3 row(s)
- `orphan` — 3 row(s)
- `P value` — 3 row(s)
- `quality` — 3 row(s)
- `altered consciousness` — 2 row(s)
- `Alzheimer’s disease` — 2 row(s)
- `analysis output` — 2 row(s)
- `ancestry` — 2 row(s)
- `associated with` — 2 row(s)
- `bacteria-to-human-cell ratio` — 2 row(s)
- `band gap` — 2 row(s)
- `bulk-heterojunction` — 2 row(s)
- `cell type specificity` — 2 row(s)
- `colour` — 2 row(s)
- `concept of art` — 2 row(s)
- `decoupling` — 2 row(s)
- `disability-adjusted life-years` — 2 row(s)
- `discovery` — 2 row(s)
- `early activations` — 2 row(s)
- `echo chamber effect` — 2 row(s)
- `is_a` — 2 row(s)
- `linked data strategy` — 2 row(s)
- `marker gene` — 2 row(s)
- `mean squared error` — 2 row(s)
- `measuring consciousness` — 2 row(s)
- `modular` — 2 row(s)
- `natural-language processing` — 2 row(s)
- `non-local evidence` — 2 row(s)
- `open access` — 2 row(s)
- `OWL's purpose` — 2 row(s)
- `priority area` — 2 row(s)
- `prosocial coding` — 2 row(s)
- `public` — 2 row(s)
- `remaining carbon budget` — 2 row(s)
- `resilience (ecology)` — 2 row(s)
- `result provenance` — 2 row(s)
- `reverse inference` — 2 row(s)
- `that absence` — 2 row(s)
- `THE CLASS EXISTS ONLY AS A CONJUNCTION, AND THE PAPER SAYS SO OF ITS OWN FINDING: VIP NEURONS ARE NOT THE ONLY STELLATE NEURONS IN THE IC, NOR ARE THEY THE ONLY NEURONS WITH SUSTAINED FIRING PATTERNS OR DENDRITIC SPINES` — 2 row(s)
- `THE DOSE WAS PUSHED UNTIL THE ANIMALS BROKE: WE INITIALLY USED A HIGH DOSE (300 ng PER SIDE) FOR BILATERAL PPC INFUSIONS, BUT ONLY 2 OF 6 RATS COMPLETED TRIALS, WITH INCONSISTENT RESULTS` — 2 row(s)
- `the graph problem` — 2 row(s)
- `the place name` — 2 row(s)
- `THE SAME NULL HAS BEEN SEEN IN ANOTHER SPECIES: A PRELIMINARY REPORT HAS SUGGESTED THAT UNILATERAL PRIMATE PPC INACTIVATIONS HAVE NO EFFECT ON ACCUMULATION OF EVIDENCE TRIALS, WHILE CAUSING AN IPSILATERAL BIAS ON FREE CHOICE TRIALS` — 2 row(s)
- `the standard` — 2 row(s)
- `the unit of counting` — 2 row(s)
- `training samples` — 2 row(s)
- `upper limit on Λ(1.4 M⊙)` — 2 row(s)
- `what a spatial test measures` — 2 row(s)
- `workflow` — 2 row(s)
