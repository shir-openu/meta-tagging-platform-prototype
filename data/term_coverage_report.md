# Task 09 — coverage of every pickable term

Generated 2026-09-01T11:12:45.512Z from `http://127.0.0.1:8766/define/index-en.html` with headless Chrome driving
the production DOM and production `score.js` paths. The historical cohort begins with all 474
entries in `data/concepts.json`, then applies the same live-row predicate as the runtime picker.
Every retained historical term and every runtime abbreviation is exercised; this is not a sample.

## Result

| Check | Result |
|---|---:|
| Historical terms before shared-live filter | 474 |
| Historical terms removed as withdrawn-only | 1 |
| Live historical terms exercised | 473/473 |
| Definition/evidence cards rendered | 52 |
| Honest no-public-sense refusals | 421 |
| User definitions accepted | 473/473 |
| User definitions given a valid score path | 9 |
| Scores correctly withheld | 464 |
| Sub-term answer available | 1 |
| Sub-term answer honestly degraded | 472 |
| Tier-3 score leaks | 0 |
| Terms with console/page errors | 0 |
| Terms with broken-path failures | 0 |
| Runtime picker rows after shared-live filter | 22102 |
| Complete abbreviation class exercised | 697/697 |
| Abbreviation presentation failures | 0 |

## Honest capability tiers

| Tier | Terms |
|---|---:|
| benchmark-score | 2 |
| attested-use-coverage | 7 |
| corpus-only | 421 |
| evidence-only | 43 |

The public rights-cleared sense index supports fewer scored/evidence terms than the internal
corpus counts discussed before publication. A refusal caused by withheld or unresolved evidence
is counted separately from a broken path.

## Repairs made from the baseline sweep

- The sense route previously read only `senses`. The production index now reads the three actual
  grounded layers (`content_tags.definitions`, `senses`, and `concepts`) through one liveness
  and rights predicate. The report prints the before/after denominator and every moved term.
- Withdrawn-only picker entries are removed with the shared live-row predicate, and that movement
  is counted separately rather than hidden inside the post-filter denominator.
- The complete runtime abbreviation class is presented with every public corpus-attested expansion
  and its paper; unknown expansions are explicit, ambiguity is preserved, and denied text is not emitted.
- Known-optional missing data and the missing favicon made all 474 baseline journeys report a
  browser error. Optional paths are now checked against the generated inline file list, and the
  definition page has an explicit favicon; the final sweep has zero console/page errors.
- The 2 benchmark boards accepted and scored user text but lacked the requested visual “+”. Both
  now expose it, so all 474 terms present the same add-definition affordance.

## Default-definition selectors

| Selector | Resolved | Correctly suppressed | Not applicable to benchmark board |
|---|---:|---:|---:|
| oldest | 50 | 421 | 2 |
| newest | 50 | 421 | 2 |
| most cited | 50 | 421 | 2 |

“Most cited” is suppressed whenever any candidate paper lacks a citation count; the page does
not invent a winner. Tied oldest/newest/cited selectors may legitimately mark more than one card.

## User definition and sub-term behaviour

All 473 terms accepted free text. Benchmark terms used their manual
case scorer; multi-paper terms used attested-use coverage; one-paper and corpus-only terms
withheld a number. Only `art` has a reviewed sub-term answer (`object`); every other term
showed an explicit criteria-layer limitation instead of guessing.

Per-term evidence, selector outcomes, score-path results, capability checks, and errors are in
`term_coverage_report.json`.
