# Meta-Tagging Platform — prototype

A verbatim-grounded tag layer for academic literature. The purpose is to accelerate
interdisciplinary research: to save the step where a reader stalls on entering an
unfamiliar field.

**Live:** https://shir-openu.github.io/meta-tagging-platform-prototype/

## What works today

**Find an optimal definition for a given corpus** (`define/`). Pick which papers make up
your corpus and every rival definition of the concept is re-ranked immediately. Under each
score sits the case table that produced it, and under each case the exact sentence from the
paper it was read from.

The concept currently loaded is **art**: 29 papers, 439 cases (355 adjudicated), 13 rival
definitions including three deliberate controls.

Everything else on the entry page is marked **בקרוב / coming** and does nothing. A button
that looks live and is not does more damage than one that says it is not built yet.

## No server, and why that matters

Every number is recomputed in your browser from `data/verdicts.json` and `data/cases.json`.
`TOOLS/build_platform_data.py` in the parent project refuses to export unless all 13
published scores reproduce from those files, so the arithmetic here and the arithmetic in
the paper are the same. Download them and check us with your own tools.

`data/manifest.json` documents every file and the type of every field — written for AI
agents as much as for people. GitHub Pages serves `access-control-allow-origin: *`, so any
other tool may fetch this data directly, without permission and without a key.

## The circular control

One of the definitions is "whatever people call art". It is circular and worthless, and it
is there to check us: it copies the answer, so it must score near +1.000 on any corpus. If
it does not, the coding contradicts itself for that corpus and no other number may be read —
the tool raises that warning itself.

## Honest limitations

Single coder. Confidence intervals overlap at the top, so ranks are not separable. Scores
are comparable only within one run — instruction wording alone moves MCC by about 0.12 for
an identical definition. The corpus tilts contemporary, by choice.

## Rights

Tag layer: CC BY 4.0. Paper text belongs to its authors and publishers; it is linked, never
redistributed. Quotes shown are short, for identification and verification.

The optional external dictionary layer is separate from corpus senses and is off by default.
Its first provider is the exact-lemma 474-term subset of Princeton WordNet 3.0, distributed
under the SPDX `WordNet` licence. The complete notice is in
`data/WORDNET_LICENSE.txt`; provenance and file hashes are in
`data/external_definitions.wordnet.manifest.json`. Rebuild it from an extracted official
WordNet 3.0 archive with:

```text
python build_wordnet_fallback.py --wordnet-root /path/to/WordNet-3.0
```

## Design

The shell — the wave background, palette and card system — is imported unchanged from
[PrimingToolbox](https://github.com/shir-openu/PrimingToolbox) (`css/shell.css` is that
project's `css/main.css`), so this sits in the same family as the rest of
[shir-openu.github.io](https://shir-openu.github.io/).
