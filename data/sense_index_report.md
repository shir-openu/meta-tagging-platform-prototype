# Task 06 sense-index failure report

Generated 2026-09-08T07:54:57+00:00 from `DATA/corpus.json` SHA-256 `51e01f611387d4b58c3df85272d9d2045ba172cf79947c6c05bb4473a43bf18b`.

| Finding | Count |
|---|---:|
| Active grounded rows across all three layers | 25,423 |
| Active legacy `senses` rows | 6,439 |
| Active `content_tags.definitions` rows | 5,447 |
| Active `concepts` rows | 13,537 |
| Verbatim sense rows published after audited rights gate | 3,069 |
| Verbatim sense rows withheld by rights gate | 3,370 |
| Picker terms with publishable grounded senses | 620 |
| Publishable multi-paper picker terms | 531 |
| Publishable one-paper picker terms | 9,890 |
| Withdrawn rows excluded | 54 |
| Hard delimiter failures | 1,951 |
| Rights-cleared hard delimiter examples published | 1,392 |
| Delimiter-ambiguous rows | 305 |
| Rights-cleared delimiter-ambiguous examples published | 81 |
| Parsed rows bound by exact case-folded picker label | 20,527 |
| Parsed rows bound after removing one presentation wrapper | 203 |
| Parsed rows without a safe picker-term match | 2,742 |
| Papers with more than one active sense | 1,077 |
| Paper/head groups with multiple active senses | 2,504 |
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
- `aesthetic` — 2 row(s)
- `aesthetic complexity` — 2 row(s)
- `altered consciousness` — 2 row(s)
- `analysis output` — 2 row(s)
- `ancestry` — 2 row(s)
- `bottom-up` — 2 row(s)
- `colour` — 2 row(s)
- `compression ratios` — 2 row(s)
- `concept of art` — 2 row(s)
- `content analysis` — 2 row(s)
- `discovery` — 2 row(s)
- `early activations` — 2 row(s)
- `echo chamber effect` — 2 row(s)
- `Institutional Definition` — 2 row(s)
- `Kolmogorov complexity` — 2 row(s)
- `mean squared error` — 2 row(s)
- `measuring consciousness` — 2 row(s)
- `modular` — 2 row(s)
- `non-local evidence` — 2 row(s)
- `Non-Photorealistic Rendering` — 2 row(s)
- `normalized compression distance` — 2 row(s)
- `priority area` — 2 row(s)
- `prosocial coding` — 2 row(s)
- `quality` — 2 row(s)
- `R 2` — 2 row(s)
- `remaining carbon budget` — 2 row(s)
- `result provenance` — 2 row(s)
- `reverse inference` — 2 row(s)
- `social agent` — 2 row(s)
- `suitcase words` — 2 row(s)
- `temporal resemblance` — 2 row(s)
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
