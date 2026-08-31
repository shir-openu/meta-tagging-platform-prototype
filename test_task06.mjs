import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const scorePath = new URL("./js/score.js", import.meta.url);
const indexPath = new URL("./data/sense_index.json", import.meta.url);
const reportPath = new URL("./data/sense_index_report.json", import.meta.url);
const metaReportPath = new URL("./data/meta_render_report.json", import.meta.url);
const subtermPath = new URL("./data/subterm_index.json", import.meta.url);
const source = fs.readFileSync(scorePath, "utf8");
assert(!source.includes("S.pickedConcept"), "legacy pickedConcept gate remains");
assert(!source.includes("S.picked "), "legacy picked flag remains");

let written = "";
const sandbox = {
  console,
  URL,
  setTimeout,
  clearTimeout,
  location: { href: "http://127.0.0.1:8765/define/index-en.html", protocol: "http:" },
  history: {
    replaceState(_state, _title, url) { written = String(url); sandbox.location.href = written; },
    pushState(_state, _title, url) { written = String(url); sandbox.location.href = written; },
  },
  window: {},
  document: {
    querySelector() { return null; },
    querySelectorAll() { return []; },
    getElementById() { return null; },
    createElement() { return { classList: { toggle() {} } }; },
  },
  LANG: "en",
  t(key) { return key; },
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(source.replace(/\nboot\(\);\s*$/, "\n") +
  "\nglobalThis.__task06={S,CAPABILITY,capabilityForRegistryEntry,evidenceSelectorPlan,coverageMetrics,coverageCases,selectedFeatureMap,writeURL,codePointSlice,conceptLabel,abbreviationDetailsHTML,matches};", sandbox);

const { S, CAPABILITY, capabilityForRegistryEntry, evidenceSelectorPlan, coverageMetrics, coverageCases, selectedFeatureMap, writeURL, codePointSlice, conceptLabel, abbreviationDetailsHTML, matches } = sandbox.__task06;
const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const metaReport = JSON.parse(fs.readFileSync(metaReportPath, "utf8"));
const subterms = JSON.parse(fs.readFileSync(subtermPath, "utf8"));
S.senseIndex = index;

assert.equal(index.schema_version, "meta-render-sense-index-2");
assert.deepEqual(Object.keys(index.counts.grounding_rows_by_layer).sort(),
  ["concepts", "content_tags.definitions", "senses"]);
assert.equal(Object.values(index.counts.grounding_rows_by_layer).reduce((a, b) => a + b, 0),
  index.counts.grounding_rows_active);
assert.equal(index.counts.published_sense_rows + index.counts.withheld_sense_rows_rights,
  index.counts.sense_rows_active);
assert.equal(index.counts.published_grounding_rows + index.counts.withheld_grounding_rows_rights,
  index.counts.grounding_rows_active);
assert(index.senses.some(row => row.source_layer === "content_tags.definitions"));
assert(index.senses.some(row => row.source_layer === "senses"));
assert(index.senses.some(row => row.source_layer === "concepts"));
assert.equal(index.counts.historical_render_gap_after, 0);
assert.equal(index.counts.historical_definition_cards_after -
  index.counts.historical_definition_cards_before,
  index.counts.historical_render_gap_before);
assert.equal(metaReport.historical_render_gap_terms.length,
  index.counts.historical_render_gap_before);
assert(metaReport.historical_render_gap_terms.every(row =>
  row.outcome === "renders after three-layer index"));
assert.equal(index.counts.runtime_picker_terms_before_live_filter,
  index.counts.runtime_picker_terms_after_live_filter +
  index.counts.runtime_picker_terms_removed_as_withdrawn_only);
assert.equal(index.picker_live_slugs.length, index.counts.runtime_picker_terms_after_live_filter);
assert.equal(Object.keys(index.abbreviations).length, index.counts.abbreviation_class_terms);
assert.equal(metaReport.abbreviation_class.length, index.counts.abbreviation_class_terms);
assert.equal(index.abbreviations.n.kind, "single-letter");
assert.equal(index.abbreviations.n.expansions.length, 0);
assert.equal(index.abbreviations.ram.kind, "all-caps-short-form");
assert.equal(index.abbreviations.ram.expansions.length, 0);
assert(index.abbreviations.pfc.ambiguous);
assert(index.abbreviations.pfc.withheld_expansion_rows > 0);
assert(index.abbreviations.pfc.expansions.every(row => row.expansion === "prefrontal cortex"));
assert(index.abbreviations.pfc.expansions.every(row => index.papers[row.paper_id]));
assert(!JSON.stringify(index.abbreviations.pfc.expansions).includes("perfluorocarbons"));
assert(conceptLabel({ id: "n", slug: "n", en: "N" }).includes("no corpus-attested expansion"));
assert(conceptLabel({ id: "pfc", slug: "pfc", en: "PFC" }).includes("PFC for prefrontal cortex"));
const pfcHTML = abbreviationDetailsHTML({ id: "pfc", slug: "pfc", en: "PFC" });
assert(pfcHTML.includes("Ambiguous short form"));
assert(pfcHTML.includes("withheld by the public-rights gate"));
assert(matches({ id: "pfc", slug: "pfc", en: "PFC", aliases: [] }, "prefrontal cortex"));
assert.equal(index.semantics.anchor_index,
  "locator start/end count Unicode code points, not UTF-16 code units");
assert(index.senses.filter(row => row.locator).every(row =>
  row.locator.index === "unicode-code-point"));
assert(index.counts.missing_quote_locators > 0,
  "the missing-locator denominator must remain visible rather than silently filtering rows");
const clearedPaperIds = new Set(Object.keys(index.papers));
for (const key of ["hard_failures", "delimiter_ambiguities", "withdrawn_rows",
  "multi_sense_papers", "multi_sense_paper_head_groups"]) {
  assert(report[key].every(row => clearedPaperIds.has(row.paper_id)),
    `${key} exposes a row-level example from a rights-denied paper`);
}
assert(report.term_head_mismatches.every(item =>
  item.examples.every(row => clearedPaperIds.has(row.paper_id))));
assert(report.missing_year_papers.every(paperId => clearedPaperIds.has(paperId)));
assert(report.missing_citation_papers.every(paperId => clearedPaperIds.has(paperId)));
assert.equal(report.hard_failures.length, report.counts.published_hard_parse_failures);
assert.equal(report.delimiter_ambiguities.length, report.counts.published_delimiter_ambiguities);

// The corpus is outside the separately deployable PLATFORM repository, so this named positive
// control runs when the project checkout is present and stays skippable in a standalone clone.
// No sentence from this rights-denied paper is copied into the test or the public repository.
const projectCorpusPath = new URL("../DATA/corpus.json", import.meta.url);
const schlemperBodyPath = new URL(
  "../DATA/facet_queue/schlemper2019-attention-gated-networks-learning.txt", import.meta.url);
if (fs.existsSync(projectCorpusPath) && fs.existsSync(schlemperBodyPath)) {
  const corpus = JSON.parse(fs.readFileSync(projectCorpusPath, "utf8"));
  const record = corpus.records.find(row =>
    row.id === "schlemper2019-attention-gated-networks-learning");
  assert(record, "schlemper2019 Unicode positive-control record missing");
  const wall = "----- ARTICLE TEXT BELOW; QUOTE ONLY FROM HERE -----";
  const rawBody = fs.readFileSync(schlemperBodyPath, "utf8");
  const body = rawBody.split(wall).at(-1).trim().replace(/\s+/g, " ");
  const codePoints = Array.from(body);
  const firstNonBmp = codePoints.findIndex(character => character.length === 2);
  assert(firstNonBmp >= 0);
  assert.equal(codePoints.filter(character => character.length === 2).length, 1);

  function fieldValue(row, field) {
    return field.replace(/\[(\d+)\]/g, ".$1").split(".").reduce((value, key) => value[key], row);
  }
  const shifted = record.anchors.filter(anchor =>
    anchor.start > firstNonBmp &&
    body.slice(anchor.start, anchor.end) !== codePointSlice(body, anchor.start, anchor.end));
  assert.equal(shifted.length, 52);
  for (const anchor of shifted) {
    assert.equal(codePointSlice(body, anchor.start, anchor.end), fieldValue(record, anchor.field));
  }
}
const objectLayer = subterms.concepts.art.reviewed_terms[0];
assert.equal(objectLayer.id, "object");
assert.equal(objectLayer.source_checked, 233);
assert.deepEqual(objectLayer.source_counts, { object: 165, not_object: 45, undecided: 23 });
assert.equal(objectLayer.public_case_overlap.matched, 22);
assert.equal(objectLayer.public_case_overlap.object, 20);
assert.equal(objectLayer.public_case_overlap.not_object, 2);
assert(!Object.keys(objectLayer.public_case_overlap.cases[0]).some(key =>
  ["paper", "quote", "evidence", "thing"].includes(key)), "sub-term output copied source content");
assert.equal(capabilityForRegistryEntry({ state: "ready", id: "art" }), CAPABILITY.BENCHMARK);
assert.equal(capabilityForRegistryEntry({ state: "corpus", slug: "accuracy" }), CAPABILITY.COVERAGE);
assert.equal(capabilityForRegistryEntry({ state: "corpus", slug: "network" }), CAPABILITY.EVIDENCE);
assert.equal(capabilityForRegistryEntry({ state: "corpus", slug: "active-user" }), CAPABILITY.CORPUS);
assert.equal(capabilityForRegistryEntry({ state: "corpus", slug: "not-a-real-term" }), CAPABILITY.CORPUS);

S.subtermIndex = subterms;
S.capability = CAPABILITY.BENCHMARK;
S.concept = "art";
S.termPick = null;
S.criteria = [];
S.featureSelection = new Set(["subterm:object"]);
assert.deepEqual(JSON.parse(JSON.stringify(selectedFeatureMap().features)),
  [{ id: "object", layer: "subterm", label: "object" }]);

function rowsFor(term) {
  return index.picker_terms[term].map(i => index.senses[i]);
}

const chirpMass = evidenceSelectorPlan(rowsFor("chirp-mass"));
assert.equal(chirpMass.papers.length, 2);
assert.equal([...chirpMass.badges.values()].flat().filter(x => x === "evidence.oldest").length, 1);
assert.equal([...chirpMass.badges.values()].flat().filter(x => x === "evidence.newest").length, 1);
assert.equal([...chirpMass.badges.values()].flat().filter(x => x === "evidence.cited").length, 1);
assert(!chirpMass.notes.some(x => x.startsWith("evidence.cited.unavailable")));

const accuracy = evidenceSelectorPlan(rowsFor("accuracy"));
assert(accuracy.papers.length >= 1);
assert(Array.isArray(accuracy.notes));

const onePaper = evidenceSelectorPlan(rowsFor("algorithmic-fairness"));
assert.equal(onePaper.papers.length, 1);
assert(onePaper.notes.includes("evidence.onepaper"));

const coverageRows = rowsFor("chirp-mass");
const sourcePaper = coverageRows[0].paper_id;
const heldOut = coverageCases({ sourcePaper }, coverageRows);
assert(heldOut.every(row => row.paper_id !== sourcePaper));
const coverage = coverageMetrics(heldOut, {
  [heldOut[0].sense_id]: "covered",
});
assert.equal(coverage.covered, 1);
assert.equal(coverage.decided, 1);
assert.equal(coverage.caseRate, 1);

S.capability = CAPABILITY.EVIDENCE;
S.termPick = { slug: "accuracy", ids: ["p1", "p2"] };
S.selected = new Set(["p2"]);
S.pickedCorpus = true;
writeURL(false);
let url = new URL(written);
assert.equal(url.searchParams.get("term"), "accuracy");
assert.equal(url.searchParams.get("tc"), "01");
assert.equal(url.searchParams.has("c"), false);

S.termPick = null;
S.capability = CAPABILITY.BENCHMARK;
S.concept = "art";
S.papers = [{ id: "p1" }, { id: "p2" }];
S.selected = new Set(["p1"]);
S.pickedCorpus = true;
writeURL(false);
url = new URL(written);
assert.equal(url.searchParams.get("concept"), "art");
assert.equal(url.searchParams.get("c"), "10");
assert.equal(url.searchParams.has("term"), false);

S.capability = null;
S.pickedCorpus = false;
writeURL(false);
url = new URL(written);
assert.equal(url.searchParams.has("concept"), false);
assert.equal(url.searchParams.has("term"), false);

console.log("Task 06 static state/data tests: ok");
