#!/usr/bin/env python3
"""
reference_scorer.py -- reproduce every score this site publishes, from the published files.

No dependencies beyond the standard library. Run it before trusting your own reading of the
data; if your numbers disagree with these, the difference is in your code, not in ours.

This exists because an AI agent was given nothing but the site's URL and asked to recompute
the table. It succeeded, but it reported that the scoring recipe never said to SKIP cases
whose verdict character is '-'. Read naively, that one omission turns every number wrong -
the circular control comes out 0.608 instead of 0.983. Rather than only fixing the sentence,
here is code that cannot be misread.

Usage:
    python reference_scorer.py                 # against the live site
    python reference_scorer.py path/to/data    # against a local copy
"""
import json
import math
import sys
import urllib.request

BASE = "https://shir-openu.github.io/meta-tagging-platform-prototype/data"


def load(where, name):
    if where.startswith("http"):
        with urllib.request.urlopen(f"{where}/{name}.json", timeout=60) as r:
            return json.loads(r.read().decode("utf-8"))
    with open(f"{where}/{name}.json", encoding="utf-8") as f:
        return json.load(f)


def mcc(tp, fp, fn, tn):
    """Undefined - not zero - when a corpus has no negatives or no positives."""
    d = math.sqrt((tp + fp) * (tp + fn) * (tn + fp) * (tn + fn))
    return None if d == 0 else (tp * tn - fp * fn) / d


def score(definition_id, verdicts, cases, papers=None):
    """papers=None means the whole corpus. Otherwise pass a set of paper ids."""
    v = verdicts[definition_id]
    tp = fp = fn = tn = 0
    for c in cases:
        if papers is not None and c["paper"] not in papers:
            continue
        if c["status"] not in ("P", "N"):
            continue                      # the literature did not decide this one
        ch = v[c["i"]]
        if ch not in ("0", "1"):
            continue                      # NOT JUDGED. skipping this is the whole trick.
        pred, gold = ch == "1", c["status"] == "P"
        if pred and gold:
            tp += 1
        elif pred:
            fp += 1
        elif gold:
            fn += 1
        else:
            tn += 1
    return {"tp": tp, "fp": fp, "fn": fn, "tn": tn, "mcc": mcc(tp, fp, fn, tn)}


def main():
    where = sys.argv[1] if len(sys.argv) > 1 else BASE
    cases = load(where, "cases")
    verdicts = load(where, "verdicts")
    defs = load(where, "definitions")

    print(f"  {len(cases)} cases, {len(defs)} definitions, from {where}\n")
    print(f"  {'definition':16s}{'mine':>8}{'published':>11}{'diff':>9}   TP/FP/FN/TN")
    worst = 0.0
    rows = sorted(defs, key=lambda d: -d["published"]["mcc"])
    for d in rows:
        s = score(d["id"], verdicts, cases)
        pub = d["published"]
        diff = abs(s["mcc"] - pub["mcc"])
        worst = max(worst, diff)
        cm = f"{s['tp']}/{s['fp']}/{s['fn']}/{s['tn']}"
        want = f"{pub['tp']}/{pub['fp']}/{pub['fn']}/{pub['tn']}"
        flag = "" if cm == want else f"   CONFUSION MATRIX DIFFERS, published {want}"
        print(f"  {d['id']:16s}{s['mcc']:+8.3f}{pub['mcc']:+11.3f}{diff:9.4f}   {cm}{flag}")

    print(f"\n  worst difference {worst:.4f}")
    circ = score("circular", verdicts, cases)
    print(f"  calibration: the circular control scores {circ['mcc']:+.3f} "
          f"({'OK' if circ['mcc'] >= 0.90 else 'FAILED - do not read any other number'})")
    if worst > 0.001:
        print("\n  MISMATCH. Either the data changed or the reading is wrong.")
        sys.exit(1)
    print("  every published score reproduces.")


if __name__ == "__main__":
    main()
