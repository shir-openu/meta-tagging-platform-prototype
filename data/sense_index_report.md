# Task 06 sense-index failure report

Generated 2026-09-11T16:14:26+00:00 from `DATA/corpus.json` SHA-256 `5ca30a192398badc36113a4922123914755231ef6f3c9e41f80d854482cd0885`.

| Finding | Count |
|---|---:|
| Active grounded rows across all three layers | 25,686 |
| Active legacy `senses` rows | 6,466 |
| Active `content_tags.definitions` rows | 5,518 |
| Active `concepts` rows | 13,702 |
| Verbatim sense rows published after audited rights gate | 3,392 |
| Verbatim sense rows withheld by rights gate | 3,074 |
| Picker terms with publishable grounded senses | 654 |
| Publishable multi-paper picker terms | 639 |
| Publishable one-paper picker terms | 10,601 |
| Withdrawn rows excluded | 54 |
| Hard delimiter failures | 1,951 |
| Rights-cleared hard delimiter examples published | 1,392 |
| Delimiter-ambiguous rows | 305 |
| Rights-cleared delimiter-ambiguous examples published | 81 |
| Parsed rows bound by exact case-folded picker label | 20,927 |
| Parsed rows bound after removing one presentation wrapper | 203 |
| Parsed rows without a safe picker-term match | 2,605 |
| Papers with more than one active sense | 1,084 |
| Paper/head groups with multiple active senses | 2,561 |
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
- `P value` — 3 row(s)
- `altered consciousness` — 2 row(s)
- `analysis output` — 2 row(s)
- `ancestry` — 2 row(s)
- `ancillary material` — 2 row(s)
- `approval voting` — 2 row(s)
- `bottom-up` — 2 row(s)
- `colour` — 2 row(s)
- `concept of art` — 2 row(s)
- `content analysis` — 2 row(s)
- `discovery` — 2 row(s)
- `early activations` — 2 row(s)
- `echo chamber effect` — 2 row(s)
- `homonymy` — 2 row(s)
- `mean squared error` — 2 row(s)
- `measuring consciousness` — 2 row(s)
- `modular` — 2 row(s)
- `natural-language processing` — 2 row(s)
- `non-local evidence` — 2 row(s)
- `open access` — 2 row(s)
- `priority area` — 2 row(s)
- `prosocial coding` — 2 row(s)
- `quality` — 2 row(s)
- `R 2` — 2 row(s)
- `remaining carbon budget` — 2 row(s)
- `result provenance` — 2 row(s)
- `reverse inference` — 2 row(s)
- `runoff voting` — 2 row(s)
- `supermajority` — 2 row(s)
- `that absence` — 2 row(s)
- `THE CLASS EXISTS ONLY AS A CONJUNCTION, AND THE PAPER SAYS SO OF ITS OWN FINDING: VIP NEURONS ARE NOT THE ONLY STELLATE NEURONS IN THE IC, NOR ARE THEY THE ONLY NEURONS WITH SUSTAINED FIRING PATTERNS OR DENDRITIC SPINES` — 2 row(s)
- `THE DOSE WAS PUSHED UNTIL THE ANIMALS BROKE: WE INITIALLY USED A HIGH DOSE (300 ng PER SIDE) FOR BILATERAL PPC INFUSIONS, BUT ONLY 2 OF 6 RATS COMPLETED TRIALS, WITH INCONSISTENT RESULTS` — 2 row(s)
- `THE SAME NULL HAS BEEN SEEN IN ANOTHER SPECIES: A PRELIMINARY REPORT HAS SUGGESTED THAT UNILATERAL PRIMATE PPC INACTIVATIONS HAVE NO EFFECT ON ACCUMULATION OF EVIDENCE TRIALS, WHILE CAUSING AN IPSILATERAL BIAS ON FREE CHOICE TRIALS` — 2 row(s)
- `the standard` — 2 row(s)
- `the unit of counting` — 2 row(s)
- `training samples` — 2 row(s)
- `upper limit on Λ(1.4 M⊙)` — 2 row(s)
- `what a spatial test measures` — 2 row(s)
- `workflow` — 2 row(s)
- `η` — 2 row(s)
- `"noise" correlation` — 1 row(s)
- `"signal" correlation` — 1 row(s)
- `'a general process for determining'` — 1 row(s)
- `'Can computers create art?'` — 1 row(s)
- `'cumulative' cultural evolution` — 1 row(s)
- `**AND THE CROSS-SPECIES RESULT IS A DIFFERENCE, NOT A CONFIRMATION:** `First, in mice, the priming effect is in SUCCESS RATES and not in response times, whereas in humans, the priming effect is BOTH in success rates and response times.` So it is not that the two species use different measures` — 1 row(s)
- `**THE DEFINITION IS THE RARE THING HERE.** `Priming, a change in the mental processing of a stimulus as a result of prior encounter with a RELATED stimulus, has been observed repeatedly and studied extensively in humans.` Most of this corpus assumes the term and argues about mechanisms` — 1 row(s)
- `**THE MECHANISM CLAIM IS ASYMMETRIC AND THE PAPER SAYS SO RATHER THAN LETTING THE MEASURE IMPLY IT:** `the addition of INCONGRUENT prime stimuli reduces success rate MORE THAN congruent prime stimuli, suggesting a cognitive mechanism based on DIFFERENTIAL INTERFERENCE.` Both prime types cost performance against unprimed trials; the incongruent ones cost more. So the priming effect here is **a difference between two costs, not a benefit over a baseline**` — 1 row(s)
- `95 % confidence interval` — 1 row(s)
