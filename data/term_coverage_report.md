# Task 09 — coverage of every pickable term

Generated 2026-08-30T11:07:01.586Z from `http://127.0.0.1:8765/define/index-en.html` with headless Chrome driving
the production DOM and production `score.js` paths. The term set is the 474 entries in the
live `data/concepts.json`; this is an exhaustive sweep, not a sample.

## Result

| Check | Result |
|---|---:|
| Terms exercised | 474/474 |
| Definition/evidence cards rendered | 25 |
| Honest no-public-sense refusals | 449 |
| User definitions accepted | 474/474 |
| User definitions given a valid score path | 3 |
| Scores correctly withheld | 471 |
| Sub-term answer available | 1 |
| Sub-term answer honestly degraded | 473 |
| Tier-3 score leaks | 0 |
| Terms with console/page errors | 0 |
| Terms with broken-path failures | 0 |

## Honest capability tiers

| Tier | Terms |
|---|---:|
| benchmark-score | 2 |
| attested-use-coverage | 1 |
| corpus-only | 449 |
| evidence-only | 22 |

The public rights-cleared sense index supports fewer scored/evidence terms than the internal
corpus counts discussed before publication. A refusal caused by withheld or unresolved evidence
is counted separately from a broken path.

## Repairs made from the baseline sweep

- 8 sense-capable terms were silently empty because their safely bound sense-source papers were
  absent from the older term-corpus snapshot. The production reader now joins those already-public
  papers into the selectable corpus; all 8 render their grounded cards.
- Known-optional missing data and the missing favicon made all 474 baseline journeys report a
  browser error. Optional paths are now checked against the generated inline file list, and the
  definition page has an explicit favicon; the final sweep has zero console/page errors.
- The 2 benchmark boards accepted and scored user text but lacked the requested visual “+”. Both
  now expose it, so all 474 terms present the same add-definition affordance.

## Default-definition selectors

| Selector | Resolved | Correctly suppressed | Not applicable to benchmark board |
|---|---:|---:|---:|
| oldest | 23 | 449 | 2 |
| newest | 23 | 449 | 2 |
| most cited | 11 | 461 | 2 |

“Most cited” is suppressed whenever any candidate paper lacks a citation count; the page does
not invent a winner. Tied oldest/newest/cited selectors may legitimately mark more than one card.

## User definition and sub-term behaviour

All 474 terms accepted free text. Benchmark terms used their manual
case scorer; multi-paper terms used attested-use coverage; one-paper and corpus-only terms
withheld a number. Only `art` has a reviewed sub-term answer (`object`); every other term
showed an explicit criteria-layer limitation instead of guessing.

Per-term evidence, selector outcomes, score-path results, capability checks, and errors are in
`term_coverage_report.json`.
