/* =====================================================
   score.js -- the whole measurement, in the browser.

   There is no server and no API key. Every number this page shows is recomputed here from
   data/verdicts.json and data/cases.json, which is the point: a visitor can download those
   two files and get the same answers with their own tools. TOOLS/build_platform_data.py
   refuses to export unless all 13 published scores reproduce from these files, so what runs
   here and what is in the paper are the same arithmetic.

   MCC and not F1: the base rate here is about 0.80, and F1 ignores true negatives, so a
   definition that admits nearly everything scores well on F1 and badly on MCC. MCC is the
   one that notices.
   ===================================================== */

/* THE CONCEPTS ARE DATA, NOT CODE.
   Shir, 2026-08-12: "יש חלון שצריך לבחור מושג להגדיר אבל את לא נותנת אפשרות לבחור, זה כבר
   מובנה בעמוד ובחלון. ומה כשיהיו 1000 מושגים????"

   She was right and the criticism was structural. This used to be an object literal with two
   keys, and two keys written into a script is not a picker - it is a pair of tabs for two
   concepts somebody else already chose. A concept you cannot type is a concept the tool does
   not offer.

   The registry now lives in data/concepts.json and the picker is a search over it. It holds
   474 concepts: two with a scored definition board, and 472 that the main corpus discusses
   but for which no board exists. Typing one of those 472 gets an honest answer - how many
   papers we hold and what building a board would take - and typing something absent
   altogether gets "we hold nothing on this", which is a real answer where an empty result
   list is just a search that looks broken.

   Two fields still matter per concept and both come from the file:
   `dir`   where that concept's five files live, relative to data/. Art is at the root and
           game at game/ - historical, not principled: the art URLs are cited in a deposited
           Zenodo record and in llms.txt, and moving them would break published links.
   `calib` the control that must score near +1.000, WITHOUT WHICH NO ROW MAY BE READ. It is
           not the same control for every concept, and that is the most interesting thing on
           the site: for art "whatever people call art" is a tautology that calibrates
           everything else, and for game the same sentence is a contested position that loses
           to five published definitions. Hard-coding one control silently disabled the
           safety rail on the game board once already. */
const DEFAULT_CONCEPT = "art";
// Was 40, when the registry held 474 terms. It now holds 10,506, and Shir opened the
// picker and asked "I have like 20-30 terms to choose from, where are all the tags?" -
// a cap that silently hides 99.6% of the list reads as a list that does not exist. The
// dropdown scrolls, so show a real slice and always say how many are behind it.
const MAX_HITS = 300;

const S = {
  // Shir, 2026-08-15: "ART SHOULD BE REMOVED FROM THE FIRST PURPLE BUTTON". The board used to
  // open already holding art - button labelled ART, corpus labelled "all 29 papers", results
  // for a concept nobody had asked for. A tool that answers before it is asked teaches the
  // visitor that the answer was not about their question. Nothing is picked until someone picks.
  concept: DEFAULT_CONCEPT,
  // One state, not the old picked/pickedConcept pair.  null means the visitor has not selected
  // a term yet; every selected term is then explicit about what the corpus can support.
  capability: null,
  pickedCorpus: false,
  // The ranked list is capped at OFFER_N. This is the visitor asking to see past the cap.
  showAllOffers: false,
  registry: [], query: "",
  papers: [], cases: [], defs: [], verdicts: {}, criteria: [], manifest: null,
  senseIndex: null, senseReport: null,
  // External dictionaries are a separate provider layer.  Loading this object never enables
  // it, and none of its rows can enter the corpus sense index, capability state, or scoring.
  externalDefinitions: null, externalEnabled: false,
  subtermIndex: null,
  coverageDef: null,
  featureSelection: new Set(),
  hits: [], sel: 0,
  selected: new Set(),   // paper ids in the corpus
  openDef: null,
};

function conf() {
  return S.registry.find(c => c.id === S.concept)
      || { id: S.concept, dir: "", calib: "circular", state: "ready" };
}
function abbreviationEntry(c) {
  const termSlug = c && (c.slug || slugOf(c.en || c.id));
  return termSlug && (((S.senseIndex || {}).abbreviations || {})[termSlug] || null);
}
function abbreviationSearchValues(c) {
  const entry = abbreviationEntry(c);
  if (!entry) return [];
  const papers = (S.senseIndex || {}).papers || {};
  return (entry.expansions || []).flatMap(row => [
    row.expansion,
    (papers[row.paper_id] || {}).title,
  ]).filter(Boolean);
}
function conceptLabel(c) {
  const base = (LANG === "he" && c && c.he) ? c.he : (c ? (c.en || c.id) : S.concept);
  const entry = abbreviationEntry(c);
  if (!entry) return base;
  const expansions = [...new Set((entry.expansions || []).map(row => row.expansion).filter(Boolean))];
  if (expansions.length) {
    const joiner = LANG === "he" ? " / " : "; ";
    const relation = LANG === "he"
      ? " \u2013 \u05e8\u05d0\u05e9\u05d9 \u05ea\u05d9\u05d1\u05d5\u05ea \u05e9\u05dc "
      : " for ";
    return expansions.map(expansion => `${base}${relation}${expansion}`).join(joiner);
  }
  if (entry.withheld_expansion_rows) {
    const note = LANG === "he"
      ? "\u05d4\u05e4\u05d9\u05e8\u05d5\u05e9 \u05d0\u05d9\u05e0\u05d5 \u05d6\u05de\u05d9\u05df \u05dc\u05e4\u05e8\u05e1\u05d5\u05dd \u05dc\u05e4\u05d9 \u05de\u05d2\u05d1\u05dc\u05d5\u05ea \u05d4\u05e8\u05e9\u05d0\u05d4"
      : "expansion unavailable from the public rights-cleared corpus";
    return `${base} \u2014 ${note}`;
  }
  const note = LANG === "he"
    ? "\u05dc\u05d0 \u05e0\u05de\u05e6\u05d0 \u05e4\u05d9\u05e8\u05d5\u05e9 \u05de\u05ea\u05d5\u05e2\u05d3 \u05d1\u05e7\u05d5\u05e8\u05e4\u05d5\u05e1"
    : "no corpus-attested expansion";
  return `${base} \u2014 ${note}`;
}

function abbreviationDetailsHTML(c, compact = false) {
  const entry = abbreviationEntry(c);
  if (!entry) return "";
  const he = LANG === "he";
  const papers = (S.senseIndex || {}).papers || {};
  const relation = he
    ? " \u2013 \u05e8\u05d0\u05e9\u05d9 \u05ea\u05d9\u05d1\u05d5\u05ea \u05e9\u05dc "
    : " for ";
  const rows = (entry.expansions || []).map(row => {
    const paper = papers[row.paper_id] || {};
    const year = paper.year || (he ? "\u05e9\u05e0\u05d4 \u05dc\u05d0 \u05d6\u05de\u05d9\u05e0\u05d4" : "year unavailable");
    return `<li><b>${esc(entry.label + relation + row.expansion)}</b>` +
      ` <span>\u2014 ${esc(paper.title || row.paper_id)} (${esc(String(year))})</span></li>`;
  }).join("");
  const noExpansion = rows ? "" : `<div class="abbr-none">${esc(he
    ? "\u05dc\u05d0 \u05e0\u05de\u05e6\u05d0 \u05e4\u05d9\u05e8\u05d5\u05e9 \u05e4\u05d5\u05de\u05d1\u05d9 \u05de\u05ea\u05d5\u05e2\u05d3 \u05d1\u05e7\u05d5\u05e8\u05e4\u05d5\u05e1; \u05dc\u05d0 \u05e0\u05e0\u05d7\u05e9 \u05e4\u05d9\u05e8\u05d5\u05e9."
    : "No public corpus-attested expansion; no expansion is guessed.")}</div>`;
  const ambiguous = entry.ambiguous ? `<div class="abbr-warning">${esc(he
    ? "\u05e8\u05d0\u05e9\u05d9 \u05d4\u05ea\u05d9\u05d1\u05d5\u05ea \u05d3\u05d5-\u05de\u05e9\u05de\u05e2\u05d9\u05d9\u05dd \u05d1\u05e7\u05d5\u05e8\u05e4\u05d5\u05e1; \u05db\u05dc \u05d4\u05e4\u05d9\u05e8\u05d5\u05e9\u05d9\u05dd \u05d4\u05e4\u05d5\u05de\u05d1\u05d9\u05d9\u05dd \u05de\u05d5\u05e6\u05d2\u05d9\u05dd."
    : "Ambiguous short form: every public corpus-attested expansion is shown.")}</div>` : "";
  const withheld = entry.withheld_expansion_rows ? `<div class="abbr-withheld">${esc(he
    ? `${entry.withheld_expansion_rows} \u05e8\u05e9\u05d5\u05de\u05d5\u05ea \u05e4\u05d9\u05e8\u05d5\u05e9 \u05e0\u05d5\u05e1\u05e4\u05d5\u05ea \u05e0\u05e1\u05e4\u05e8\u05d5 \u05d0\u05da \u05e0\u05d5\u05ea\u05e8\u05d5 \u05d7\u05e1\u05d5\u05d9\u05d5\u05ea \u05d1\u05e9\u05e2\u05e8 \u05d4\u05d4\u05e8\u05e9\u05d0\u05d5\u05ea.`
    : `${entry.withheld_expansion_rows} additional expansion record(s) counted but withheld by the public-rights gate.`)}</div>` : "";
  const heading = he
    ? "\u05e4\u05d9\u05e8\u05d5\u05e9\u05d9\u05dd \u05de\u05ea\u05d5\u05e2\u05d3\u05d9\u05dd \u05d1\u05e7\u05d5\u05e8\u05e4\u05d5\u05e1"
    : "Corpus-attested expansions";
  return `<div class="abbr-details${compact ? " compact" : ""}">` +
    `<div class="abbr-head">${esc(heading)}</div>` +
    (rows ? `<ul>${rows}</ul>` : noExpansion) + ambiguous + withheld + `</div>`;
}

/* Where a concept's files are. The registry stores it relative to data/; the working screen
   sits one directory down, so it is resolved here and nowhere else. */
function conceptDir(c) { return "../data/" + ((c && c.dir) || ""); }

const CAPABILITY = Object.freeze({
  BENCHMARK: "benchmark-score",
  COVERAGE: "attested-use-coverage",
  EVIDENCE: "evidence-only",
  CORPUS: "corpus-only",
});

// Has the visitor actually chosen a corpus? Five separate labels say "your chosen corpus",
// and before a choice is made all five are false. One predicate so they cannot drift apart.
function corpusChosen() {
  return !!(S.pickedCorpus && S.selected && S.selected.size > 0);
}

function capabilityInfo(kind) {
  if (kind === CAPABILITY.BENCHMARK) {
    return { cls: "benchmark", title: t("cap.benchmark.h"), body: t("cap.benchmark.body") };
  }
  if (kind === CAPABILITY.COVERAGE) {
    return { cls: "coverage", title: t("cap.coverage.h"), body: t("cap.coverage.body") };
  }
  if (kind === CAPABILITY.EVIDENCE) {
    return { cls: "evidence", title: t("cap.evidence.h"), body: t("cap.evidence.body") };
  }
  return { cls: "corpus", title: t("cap.corpus.h"), body: t("cap.corpus.body") };
}

function senseIndicesForSlug(termSlug) {
  return (((S.senseIndex || {}).picker_terms || {})[termSlug] || []).slice();
}

function sensePaperCountForSlug(termSlug) {
  const senses = (S.senseIndex || {}).senses || [];
  return new Set(senseIndicesForSlug(termSlug).map(index => senses[index] && senses[index].paper_id)
    .filter(Boolean)).size;
}

function capabilityForRegistryEntry(c) {
  if (c && c.state === "ready") return CAPABILITY.BENCHMARK;
  const termSlug = c && (c.slug || slugOf(c.en || c.id));
  const paperCount = sensePaperCountForSlug(termSlug);
  if (paperCount >= 2) return CAPABILITY.COVERAGE;
  return paperCount === 1 ? CAPABILITY.EVIDENCE : CAPABILITY.CORPUS;
}

// A DOOR INTO THE 1,234. The board's opening screen was the title, two step buttons and the
// footer -- forty words, no concept, no definition. A visitor had to guess a word before the
// tool could show them anything, and the words that pay off are exactly the ones they cannot
// guess: the terms the literature defines more than once.
//
// Shir, 2026-09-03: "THE USER'S INTEREST IS IN THE DIFFERENT DEFINITIONS."
//
// The list is COMPUTED from the sense index, never typed: the terms with the most rival
// senses, which is the same measure the tally counts. Cached because it is one pass over
// 22,519 registry entries and the board re-renders on every state change.
let _startTerms = null;
function topRivalTerms(limit) {
  if (_startTerms) return _startTerms.slice(0, limit);
  const idx = S.senseIndex || {};
  const pt = idx.picker_terms || {};
  const senses = idx.senses || [];
  const papers = idx.papers || {};
  if (!Object.keys(pt).length || !(S.registry || []).length) return [];
  const out = [];
  for (const c of S.registry) {
    const slug = c.slug || slugOf(c.en || c.id);
    const list = pt[slug] || [];
    if (list.length < 2) continue;
    // RANK BY FIELDS, NOT BY COUNT. The first version offered the terms with the most
    // senses, and put `biostimulant` first: 18 definitions, nearly all from one field.
    // That is a term the corpus covers thickly, not a term the literature disagrees about.
    // 317 of the 1,234 terms are defined in two or more DIFFERENT fields, and those are the
    // ones that show what this project is for -- attention has 11 definitions across 9.
    const fields = new Set();
    for (const i of list) {
      const sense = senses[i];
      const d = sense && (papers[sense.paper_id] || {}).discipline;
      if (d) fields.add(d);
    }
    out.push({ c, n: list.length, f: fields.size });
  }
  out.sort((a, b) => b.f - a.f || b.n - a.n || String(a.c.id).localeCompare(String(b.c.id)));
  _startTerms = out;
  return out.slice(0, limit);
}

function renderStartHere() {
  const steps = document.querySelector(".steps");
  if (!steps) return;
  let box = document.getElementById("startHere");
  // The SAME predicate the step button uses. S.concept is "art" on first load -- a default
  // that is never displayed -- so testing it made this block hide itself on exactly the
  // screen it exists for, while the button beside it read "not chosen yet". Two tests for
  // one question is how the two disagree.
  const idle = !S.capability && !S.termPick;
  if (!idle) { if (box) box.remove(); return; }
  const picks = topRivalTerms(8);
  if (!picks.length) { if (box) box.remove(); return; }
  if (!box) {
    box = document.createElement("div");
    box.id = "startHere";
    box.className = "start-here";
    steps.insertAdjacentElement("afterend", box);
  }
  box.innerHTML = `<p>${esc(t("start.here"))}</p><div class="start-row">` +
    // The SHORT form on the chip. conceptLabel() expands abbreviations, so CONSORT arrived as
    // "CONSORT for Consolidated Standards of Reporting Trials; CONSORT for CONSORT statement"
    // and took a whole row to itself. The expansion is worth having and is kept on hover.
    picks.map(({ c, n, f }) => {
      const short = (LANG === "he" ? (c.he || c.en || c.id) : (c.en || c.id));
      const full = conceptLabel(c) || c.id;
      return `<button type="button" class="start-term" data-start="${escAttr(c.id)}"` +
        (full && full !== short ? ` title="${escAttr(full)}"` : "") + `>` +
        `${esc(short)} <span class="start-n">${t("start.chip")
          .replace("{n}", n).replace("{f}", f)}</span></button>`;
    }).join("") +
    `</div>`;
  if (!box.dataset.wired) {
    box.dataset.wired = "1";
    box.addEventListener("click", ev => {
      const b = ev.target.closest("[data-start]");
      if (b) chooseSoon(b.getAttribute("data-start"));
    });
  }
}

function renderCapability() {
  let box = document.getElementById("capabilityState");
  if (!box) {
    box = document.createElement("div");
    box.id = "capabilityState";
    box.className = "capability-state";
    const first = document.querySelector(".steps");
    if (first) first.insertAdjacentElement("afterend", box);
  }
  if (!box) return;
  if (!S.capability) { box.hidden = true; return; }
  const info = capabilityInfo(S.capability);
  const evidenceReady = S.capability === CAPABILITY.BENCHMARK ||
    S.capability === CAPABILITY.COVERAGE || S.capability === CAPABILITY.EVIDENCE;
  const coverageReady = S.capability === CAPABILITY.COVERAGE;
  const benchmarkReady = S.capability === CAPABILITY.BENCHMARK;
  box.hidden = false;
  box.className = `capability-state cap-${info.cls}`;
  box.innerHTML = `<div class="cap-main"><span class="cap-badge">${esc(info.title)}</span>` +
    `<span>${info.body}</span></div>` +
    `<div class="cap-screens" aria-label="${esc(t("cap.screens"))}">` +
      `<span class="cap-chip ${evidenceReady ? "ready" : "off"}">${esc(t("cap.screen.evidence"))} · ${esc(evidenceReady ? t("cap.ready") : t("cap.unavailable"))}</span>` +
      `<span class="cap-chip ${coverageReady ? "ready coverage" : "off"}">${esc(t("cap.screen.coverage"))} · ${esc(coverageReady ? t("cap.ready") : t("cap.unavailable"))}</span>` +
      `<span class="cap-chip ${benchmarkReady ? "ready" : "off"}">${esc(t("cap.screen.benchmark"))} · ${esc(benchmarkReady ? t("cap.ready") : t("cap.unavailable"))}</span>` +
    `</div>` +
    // SAY THE PLAIN THING. Shir picked `order` and asked where the definitions were. The box
    // above told her what is unavailable in method words -- "independent positive and negative
    // cases", "MCC and bootstrap" -- and never said that NO DEFINITIONS EXIST for this concept,
    // which is the sentence she was actually asking for. The picker says "3 concepts ready to
    // score, out of 22519"; the board, where the reader is standing, did not repeat it.
    //
    // The three are read from the registry, never typed here: a list retyped in a second place
    // is a list that goes stale in one of them.
    (benchmarkReady ? "" :
      `<div class="cap-nodefs">${esc(t("cap.nodefs"))} ` +
      (S.registry || []).filter(c => c.state === "ready")
        .map(c => `<button type="button" class="cap-go" data-switch="${escAttr(c.id)}">` +
                  `${esc(conceptLabel(c) || c.id)}</button>`).join(" ") +
      `</div>`);
  // One delegated listener, bound once: the box is re-rendered on every state change and a
  // per-button listener would be added again each time.
  if (!box.dataset.wired) {
    box.dataset.wired = "1";
    box.addEventListener("click", ev => {
      const b = ev.target.closest("[data-switch]");
      if (b) switchConcept(b.getAttribute("data-switch"));
    });
  }
}

/* ---------- metric ---------- */
function mcc(tp, fp, fn, tn) {
  const d = Math.sqrt((tp + fp) * (tp + fn) * (tn + fp) * (tn + fn));
  return d === 0 ? null : (tp * tn - fp * fn) / d;
}

/* Score one definition over the currently selected corpus.
   Cases whose status is 'U' are excluded from the metric - the literature did not decide
   them, so counting them as either answer would invent a label nobody asserted. They are
   still counted and shown, because abstention is part of the picture and hiding it would
   flatter every definition equally. */
function scoreDef(id, caseIdx) {
  const v = S.verdicts[id] || "";
  let tp = 0, fp = 0, fn = 0, tn = 0, skipped = 0;
  const rows = [];
  for (const i of caseIdx) {
    const c = S.cases[i];
    const ch = v[i];
    if (ch !== "0" && ch !== "1") { skipped++; continue; }
    const pred = ch === "1", gold = c.status === "P";
    let kind;
    if (pred && gold) { tp++; kind = "tp"; }
    else if (pred) { fp++; kind = "fp"; }
    else if (gold) { fn++; kind = "fn"; }
    else { tn++; kind = "tn"; }
    rows.push({ i, kind });
  }
  return { id, tp, fp, fn, tn, skipped, rows, n: tp + fp + fn + tn, mcc: mcc(tp, fp, fn, tn) };
}

/* The case indices the current corpus contributes, split by whether they are adjudicable. */
function corpusCases() {
  const judged = [], undecided = [];
  S.cases.forEach((c, i) => {
    if (!S.selected.has(c.paper)) return;
    if (c.status === "P" || c.status === "N") judged.push(i);
    else undecided.push(i);
  });
  return { judged, undecided };
}

/* ---------- plain language, because a number nobody can read is not evidence ---------- */
function plainMCC(m) {
  if (m === null) return t("plain.none");
  if (m >= 0.90) return t("plain.90");
  if (m >= 0.70) return t("plain.70");
  if (m >= 0.50) return t("plain.50");
  if (m >= 0.25) return t("plain.25");
  if (m > 0.02) return t("plain.02");
  if (m > -0.02) return t("plain.00");
  return t("plain.neg");
}

/* MCC is undefined whenever a whole row or column of the matrix is empty -- which is the
   NORMAL state after the first case a person judges, and mcc() correctly returns null there.
   fmt() then called .toFixed on null and threw. Inside renderJudge that killed the re-render,
   so the card never advanced and every click overwrote the same case: four clicks, one
   verdict, an empty score, and nothing on screen to say anything had gone wrong.
   A formatter must be able to say "there is no number yet". */
function fmt(x) {
  if (x === null || x === undefined || Number.isNaN(x)) return "—";
  return (x >= 0 ? "+" : "") + x.toFixed(3);
}

/* The provenance line. Where a person proposed a definition it names them and dates it,
   because that is what provenance is for and "a user" is the opposite of it: priority is a
   dated public record bearing a name, and an anonymous record establishes nothing. */
function provLine(d) {
  // t() RETURNS THE KEY ON A MISS, so an unlisted provenance printed "prov.usage" straight
  // onto the board - the game board's ordinary-usage definition, one of fifteen, on one of
  // the two boards that exist. `prov.unknown` is already written for exactly this case and
  // was unreachable, because the miss never fell through to it.
  const provKey = "prov." + d.provenance;
  let s = t(provKey) === provKey ? t("prov.unknown") : t(provKey);
  if (d.proposed_by) {
    s += " " + esc(d.proposed_by);
    if (d.provenance === "user+tool") s += t("prov.tool");
    if (d.proposed_on) s += ' <span class="num">' + esc(d.proposed_on) + "</span>";
  }
  return s;
}
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escAttr(s) {
  return esc(s).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/* Corpus anchors are produced in Python and count Unicode code points.  JavaScript's native
   String#slice counts UTF-16 code units and silently shifts any span after a non-BMP character.
   Every reader that resolves locator.start/end into source text must go through this helper. */
function codePointSlice(text, start, end) {
  return Array.from(String(text == null ? "" : text)).slice(start, end).join("");
}

/* WHO SAID IT, AND IS THIS THEIR SENTENCE.
   Shir asked for the classic definitions to name who proposed them and where, "even if we
   don't have the paper yet". The second half is the part that needs care. A one-line summary
   of Dickie sitting under Dickie's name looks exactly like a quotation from Dickie, and this
   project's whole discipline is that a quote is checkable. So a definition whose wording is
   ours says so, in the same breath as the citation, every time it is shown.

   Where the corpus contains papers tagged with that theorist, the citation also becomes a
   button: restrict the corpus to those papers and re-score there. That is the checkable part
   - not the citation, which a reader must take on trust, but what happens to the number when
   only the papers engaging that theorist are in the room. */
function citeLine(d) {
  if (!d.cited) return "";
  const ours = d.wording === "ours"
    ? `<span class="ourwords">${t("cite.ours")}</span> ` : "";
  const n = d.n_papers_on_theorist || 0;
  const btn = n
    ? ` <button class="pt-btn tiny" data-theorist="${esc(d.theorist)}">${
        t("cite.restrict").replace("{n}", n)}</button>`
    : "";
  // The citation itself is its own LTR run. Left in the surrounding RTL flow it comes apart:
  // "…applying Wittgenstein's argument about GAMES to art, which is" / "why the two concepts
  // on this site are these two" - the clause split and reversed across the line break,
  // because the trailing neutrals get swept into the Hebrew run. This is the same bidi trap
  // that once printed a confidence interval with its bounds the wrong way round.
  return `<div class="cited"><span class="flag">${ours}</span>` +
         `<span dir="ltr" class="ref">${esc(d.cited)}</span>${btn}</div>`;
}

/* ---------- URL is the state, so a corpus can be cited ---------- */
function benchmarkCorpusIds(bits) {
  const boardIds = (S.papers || []).map(p => p.id);
  const libraryIds = (S.index || []).map(p => p.id).filter(Boolean);
  // Links created before TASK 06 used the board's shorter paper order. Keep them readable,
  // while new links use the same full-library order the corpus picker actually exposes.
  if (bits && bits.length === boardIds.length && bits.length !== libraryIds.length) return boardIds;
  return libraryIds.length ? libraryIds : boardIds;
}

function writeURL(push) {
  const u = new URL(location.href);
  if (S.termPick) {
    // A term corpus has a different paper order from an art/game board.  Its own bitmask is
    // therefore named `tc`; reusing `c` decoded the same bits against the wrong papers.
    const ids = S.termPick.ids;
    const bits = ids.map(id => (S.selected.has(id) ? "1" : "0")).join("");
    u.searchParams.delete("concept");
    u.searchParams.delete("c");
    u.searchParams.set("term", S.termPick.slug);
    if (S.pickedCorpus && S.selected.size) u.searchParams.set("tc", bits); else u.searchParams.delete("tc");
  } else if (S.capability === CAPABILITY.BENCHMARK) {
    const ids = benchmarkCorpusIds();
    const bits = ids.map(id => (S.selected.has(id) ? "1" : "0")).join("");
    // Keep `concept=art` when art was explicitly selected.  The clean URL now means "nothing
    // selected", so deleting the default made those two user states indistinguishable on Back.
    u.searchParams.set("concept", S.concept);
    u.searchParams.delete("term");
    u.searchParams.delete("tc");
    if (S.pickedCorpus && S.selected.size) u.searchParams.set("c", bits); else u.searchParams.delete("c");
  } else {
    u.searchParams.delete("concept");
    u.searchParams.delete("term");
    u.searchParams.delete("c");
    u.searchParams.delete("tc");
  }
  u.searchParams.delete("q");
  const openPanel = document.querySelector(".panel.open");
  if (openPanel) u.searchParams.set("p", openPanel.id);
  else u.searchParams.delete("p");
  history[push ? "pushState" : "replaceState"](null, "", u);
}
function readURL() {
  const u = new URL(location.href);
  S.selected.clear();
  const bits = u.searchParams.get("c");
  const ids = benchmarkCorpusIds(bits);
  // Shir, 2026-08-15: "THE ALL 29 PAPERS SHOULD BE REMOVED AND THE USER SHOULD HAVE THE
  // OPTION TO PICK HIS OWN CORPUS." No bits in the URL now means NOTHING chosen, not
  // everything. "הכל" still selects all in one press - the difference is that choosing all
  // is now something the visitor DID, not something that happened to them.
  if (!bits || bits.length !== ids.length) { /* start empty - the visitor picks */ }
  else ids.forEach((id, k) => { if (bits[k] === "1") S.selected.add(id); });
  S.pickedCorpus = !!bits && bits.length === ids.length && S.selected.size > 0;
  // the sensitivity panel is part of the shareable state: a claim about how robust a result
  // is should travel with the corpus that produced it, not have to be re-found by hand.
  const want = u.searchParams.get("p");
  if (want) {
    const p = document.getElementById(want);
    if (p) p.classList.add("open");
  }
}

function readTermURL(sourceURL) {
  S.selected.clear();
  const bits = (sourceURL || new URL(location.href)).searchParams.get("tc");
  const ids = (S.termPick && S.termPick.ids) || [];
  if (bits && bits.length === ids.length) {
    ids.forEach((id, k) => { if (bits[k] === "1") S.selected.add(id); });
  }
  S.pickedCorpus = !!bits && bits.length === ids.length && S.selected.size > 0;
}

/* ---------- LOADING DATA WHEN THERE IS NO SERVER ----------
   Shir opens the page by double-clicking it. That is file://, where a browser refuses fetch,
   so every data file was blocked and she met two empty buttons — while every screenshot I
   took ran over http://127.0.0.1 and looked perfect. A tool that only works when its author
   starts a web server is not a tool she can show anyone.

   So: try the network first (on a real server that is the live path and nothing changes), and
   fall back to the copy that data/inline.js puts on `window`. A <script> tag is not subject to
   the fetch restriction. Both come from the same build, so they cannot disagree. */
async function getData(rel) {
  try {
    const r = await fetch("../data/" + rel + "?v=" + (window.ASSET_STAMP || ""));
    if (r.ok) return await r.json();
  } catch (e) { /* file:// — fall through to the inlined copy */ }
  if (rel === "sense_index.json" && window.MTP_SENSE_INDEX) return window.MTP_SENSE_INDEX;
  if (rel === "sense_index_report.json" && window.MTP_SENSE_REPORT) return window.MTP_SENSE_REPORT;
  if (rel === "subterm_index.json" && window.MTP_SUBTERM_INDEX) return window.MTP_SUBTERM_INDEX;
  if (rel === "external_definitions.wordnet.json" && window.MTP_EXTERNAL_DEFINITIONS) {
    return window.MTP_EXTERNAL_DEFINITIONS;
  }
  const inl = window.MTP_INLINE || {};
  return (rel in inl) ? inl[rel] : null;
}

async function loadSenseData() {
  let index = await getData("sense_index.json");
  let report = await getData("sense_index_report.json");
  if (!index && location.protocol === "file:") {
    // Keep the large fallback off normal HTTP visits. It exists only because fetch() is blocked
    // when the page is opened by double-clicking it.
    await new Promise(resolve => {
      const script = document.createElement("script");
      script.src = "../data/sense_index.inline.js";
      script.onload = resolve;
      script.onerror = resolve;
      document.head.appendChild(script);
    });
    index = window.MTP_SENSE_INDEX || null;
    report = window.MTP_SENSE_REPORT || null;
  }
  return { index, report };
}

async function loadSubtermData() {
  let index = await getData("subterm_index.json");
  if (!index && location.protocol === "file:") {
    await new Promise(resolve => {
      const script = document.createElement("script");
      script.src = "../data/subterm_index.inline.js";
      script.onload = resolve;
      script.onerror = resolve;
      document.head.appendChild(script);
    });
    index = window.MTP_SUBTERM_INDEX || null;
  }
  return index;
}

async function loadExternalDefinitions() {
  let data = await getData("external_definitions.wordnet.json");
  if (!data && location.protocol === "file:") {
    await new Promise(resolve => {
      const script = document.createElement("script");
      script.src = "../data/external_definitions.wordnet.inline.js";
      script.onload = resolve;
      script.onerror = resolve;
      document.head.appendChild(script);
    });
    data = window.MTP_EXTERNAL_DEFINITIONS || null;
  }
  if (!data || data.default_enabled !== false || !data.external_definitions) return null;
  return data;
}

/* A term's paper ids, decoded on demand.

   term_corpus.json stores ids as INDICES into its `order` array - 156,641 (term, paper) pairs
   would otherwise repeat a 45-character id in every one of them and weigh 8 MB, which cannot be
   inlined for the file:// path these pages are opened on.

   Decoding is LAZY, one term at a time. Expanding all 10,986 terms at load would build 156,641
   strings to use sixty of them. */
function termIds(ent) {
  if (!ent) return [];
  const ord = S.termOrder;
  const raw = ent[1] || [];
  if (!ord) return raw;                       // older file: ids were already strings
  return raw.map(i => (typeof i === "number" ? ord[i] : i)).filter(Boolean);
}

/* The subset that was TAGGED with the term, as opposed to merely containing the word. Two
   different claims, so the row says which one it is rather than implying the stronger. */
function termTaggedSet(ent) {
  const ord = S.termOrder;
  const raw = (ent && ent[2]) || [];
  return new Set(ord ? raw.map(i => (typeof i === "number" ? ord[i] : i)) : raw);
}

/* The public sense index and term-corpus index were built from different snapshots. Eight of
   the original 474 picker terms have a rights-cleared, safely bound sense whose source paper is
   absent from the older term-corpus list. Capability was computed from the sense index, but the
   corpus picker could not select that paper, so the page promised evidence and rendered none.

   A safely bound sense is itself evidence that the paper tags this term. Keep the term-corpus
   list, then add those source papers and their already-public metadata. This is a runtime join
   between two published derived files; it does not mutate either source or weaken rights. */
function sensePaperIdsForSlug(termSlug) {
  const senses = (S.senseIndex || {}).senses || [];
  return [...new Set(senseIndicesForSlug(termSlug)
    .map(index => senses[index] && senses[index].paper_id).filter(Boolean))];
}

function termIdsWithSenseSources(ent, termSlug) {
  return [...new Set(termIds(ent).concat(sensePaperIdsForSlug(termSlug)))];
}

function termTaggedSetWithSenseSources(ent, termSlug) {
  const tagged = termTaggedSet(ent);
  sensePaperIdsForSlug(termSlug).forEach(id => tagged.add(id));
  return tagged;
}

function ensureSensePaperMetadata(paperIds) {
  const papers = (S.senseIndex || {}).papers || {};
  S.termPapers = S.termPapers || {};
  paperIds.forEach(id => {
    if (S.termPapers[id] || !papers[id]) return;
    const paper = papers[id];
    S.termPapers[id] = [paper.title || id, paper.year || null,
      paper.discipline || "uncategorised", paper.source_url || ""];
  });
}

/* ---------- render ---------- */
/* ---------- PAPER INDEX: the whole library, searched like Scholar ----------
   S.papers is the board's own working set - the papers that carry verdicts. The picker must
   offer more than that: Shir, "all open access papers should appear there, we cannot limit
   the users." So the list is drawn from data/paper_index.json (the full corpus, 528 papers
   across 87 disciplines) and the board's set is used only to decide what can be ticked.

   An empty search box shows everything, grouped by discipline in the colours report54 uses.
   Typing matches a discipline, a title, an author or a year - whichever the visitor happens
   to have in mind, the way a literature search actually works. */
function paperMatches(p, q) {
  if (!q) return true;
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const hay = [p.title, p.discipline, (p.authors || []).join(" "), String(p.year || ""),
               p.id].join(" ").toLowerCase();
  return terms.every(t => hay.includes(t));
}

function renderPapers() {
  const box = document.getElementById("paperList");
  if (!box) return;
  // TERM MODE. The green button now opens the corpus OF THE CHOSEN TERM - every paper the
  // term occurs in - rather than the definition board's own working set. None of them carry
  // judged cases, so none is tickable, and the panel says that instead of offering checkboxes
  // that would do nothing.
  if (S.termPick) {
    // 2026-08-19, Shir, of this exact panel: "all papers that contain the word consciousness or
    // linked to the tag consciousness should appear here ENABLING THEIR SELECTION."
    //
    // Two faults, and only the first was about the data. The list held the papers where the term
    // had been WRITTEN AS A TAG - six for `consciousness`, against sixty that contain the word -
    // which is fixed in build_term_corpus.py. The second was here: these rows were rendered as
    // plain <div>s with no checkbox, on the reasoning that none of them carries a judged case so
    // ticking one could not move a score.
    //
    // That is the same overshoot the normal branch already had removed on 2026-08-16 ("THE USER -
    // E.G. ME - SHOULD HAVE THE OPTION TO PICK HIS OWN CORPUS"). A paper with no verdicts
    // contributes no case, so ticking it cannot pool anything; what it can do is let a person
    // assemble the corpus they mean to work on. The panel states both halves instead.
    const q = norm((document.getElementById("paperSearch") || {}).value || "");
    const rows = S.termPick.ids
      .map(pid => [pid, (S.termPapers || {})[pid]])
      .filter(([, p]) => p && (!q || norm(p[0]).includes(q)));
    const groups = new Map();
    rows.forEach(([pid, p]) => {
      const d = p[2] || "uncategorised";
      if (!groups.has(d)) groups.set(d, []);
      groups.get(d).push([pid, p]);
    });
    const tally = document.getElementById("paperTally");
    if (tally) {
      tally.innerHTML = `<b>${esc(S.termPick.label)}</b> — <span class="num">${rows.length}</span> ` +
        (LANG === "he" ? "מאמרים · " : "papers · ") +
        `<span class="num">${groups.size}</span> ` + (LANG === "he" ? "דיסציפלינות" : "disciplines");
    }
    const tagged = S.termPick.tagged || new Set();
    box.innerHTML = [...groups.entries()].sort((a, b) => b[1].length - a[1].length)
      .map(([d, rs]) =>
        `<div class="disc-h" style="color:#c77dff">${esc(d)}<span class="n">${rs.length}</span></div>` +
        rs.sort((a, b) => (b[1][1] || 0) - (a[1][1] || 0)).map(([pid, p]) => {
          const on = S.selected.has(pid);
          const isTag = tagged.has(pid);
          const how = isTag
            ? (LANG === "he" ? "מתויג במונח" : "tagged with this term")
            : (LANG === "he" ? "המונח מופיע בטקסט" : "term appears in the text");
          // NOT `unscored`: that class means "carries no verdicts, cannot be ticked" and brings
          // cursor:not-allowed plus a second opacity multiplier with it.
          return `<label class="pt-paper ${on ? "" : "off"} ${isTag ? "istag" : "mention"}"
                         data-id="${esc(pid)}">
            <input type="checkbox" ${on ? "checked" : ""}>
            <span>
              <span class="t">${paperLink(pid, d, p[0], p[3] || "")}</span>
              <span class="m"><span class="ltr">${esc(String(p[1] || "—"))}</span> · ${how}</span>
            </span>
          </label>`;
        }).join("")).join("");
    // all / none / invert act on what is on screen, so the visible set has to be this list and
    // not the library's.
    S.visible = rows.map(([pid]) => pid);
    box.querySelectorAll(".pt-paper input").forEach(inp => {
      inp.addEventListener("change", e => {
        const id = e.target.closest(".pt-paper").dataset.id;
        if (e.target.checked) S.selected.add(id); else S.selected.delete(id);
        S.pickedCorpus = true;
        renderSteps();
        updateStep3();
        writeURL();
      });
    });
    return;
  }
  const q = (document.getElementById("paperSearch") || {}).value || "";
  const scored = new Map(S.papers.map(p => [p.id, p]));
  const asRow = p => ({
    id: p.id, title: p.title, authors: [], year: p.year,
    discipline: p.field || "—", colour: "#5a6472", open: false,
    n_cases: p.n_cases, n_scored: p.n_scored });
  // THE UNION, NOT THE FALLBACK. This used to read `S.index.length ? S.index : S.papers`, so a
  // board whose papers are absent from a NON-EMPTY library index got neither of them. That is
  // not hypothetical: paper_index.json holds 599 papers and none of the consciousness board's
  // seven, because those papers are not ingested into the corpus yet. The panel then said
  // "6 papers selected" above 599 rows with nothing ticked, and the six could not be seen or
  // unticked. art (29) and game (10) tick correctly and are the controls for this.
  //
  // A panel that offers to choose a corpus must show the corpus being scored. Matched by id,
  // so a board paper already in the index is not listed twice, and this keeps behaving once
  // the ingest lands.
  const indexed = new Set((S.index || []).map(p => p.id));
  const all = ((S.index && S.index.length) ? S.index : []).concat(
    S.papers.filter(p => !indexed.has(p.id)).map(asRow));

  const hits = all.filter(p => paperMatches(p, q));

  // Shir: "why won't it let me choose papers from the corpus?"
  // Because the ones she CAN choose were buried. The list is the whole library, ordered by
  // discipline, so the first two screens were anaesthesiology, anthropology and
  // applied-behavior-analysis — all tagged but not yet judged, every checkbox disabled. The
  // 29 that can actually be ticked sat hundreds of rows down under philosophy-of-art. A list
  // that opens showing only things you cannot pick reads as a list you cannot pick from.
  // So the selectable papers come first, in their own group, and the library follows.
  const scoredSet = new Set(S.papers.filter(x => x.n_scored).map(x => x.id));
  const ready = hits.filter(p => scoredSet.has(p.id));
  const rest = hits.filter(p => !scoredSet.has(p.id));
  const groups = new Map();
  if (ready.length) {
    groups.set(LANG === "he" ? "מוכנים לניקוד — אפשר לבחור" : "ready to score — selectable",
               ready);
  }
  rest.forEach(p => {
    if (!groups.has(p.discipline)) groups.set(p.discipline, []);
    groups.get(p.discipline).push(p);
  });

  const tally = document.getElementById("paperTally");
  if (tally) {
    tally.innerHTML = q
      ? `<span class="num">${hits.length}</span> ${t("corpus.hits")} · ` +
        `<span class="num">${groups.size}</span> ${t("corpus.disc")}`
      : `<span class="num">${all.length}</span> ${t("corpus.hits")} · ` +
        `<span class="num">${groups.size}</span> ${t("corpus.disc")}`;
  }
  if (!hits.length) {
    box.innerHTML = `<div class="pt-note">${t("corpus.none.found")}</div>`;
    return;
  }

  box.innerHTML = [...groups.entries()].map(([disc, rows]) => {
    const isReady = rows.every(r => scoredSet.has(r.id));
    const col = isReady ? "#5cc46f" : (rows[0].colour || "#5a6472");
    const head = `<div class="disc-h" style="color:${col}">${esc(disc)}` +
                 `<span class="n">${rows.length}</span></div>`;
    return head + rows.map(p => {
      const board = scored.get(p.id);
      // 2026-08-16, Shir: "THE ALL 29 PAPERS SHOULD BE REMOVED AND THE USER - E.G. ME - SHOULD
      // HAVE THE OPTION TO PICK HIS OWN CORPUS." Every paper is now tickable.
      //
      // The lock that used to sit here was mine and it OVERSHOT ITS OWN FINDING. The measurement
      // behind it is real - instruction wording alone moves MCC by about 0.12 for an identical
      // definition, so scores from different runs are not comparable - but that says nothing
      // about WHICH PAPERS A PERSON MAY PUT IN A CORPUS. It licenses "never pool two runs", and I
      // had implemented "you may not choose". A paper with no verdicts contributes no case to
      // corpusCases(), so ticking one cannot move a number and cannot pool anything.
      //
      // What it CAN do is mislead by silence: choose fifty papers, watch the matrix not move, and
      // conclude the definition fits. So the panel states both halves of the selection every time
      // - how many carry verdicts and how many do not - and canScore now drives that line and the
      // row's own label instead of driving `disabled`.
      const canScore = !!(board && board.n_scored);
      const on = S.selected.has(p.id);
      const who = (p.authors || []).slice(0, 3).join(", ");
      const meta = canScore
        ? `${board.n_cases} ${LANG === "he" ? "מקרים" : "cases"}`
        : (LANG === "he" ? "תויג, טרם נוקד" : "tagged, not yet scored");
      return `<label class="pt-paper ${on ? "" : "off"} ${canScore ? "" : "unscored"}"
                     data-id="${esc(p.id)}">
        <input type="checkbox" ${on ? "checked" : ""}>
        <span>
          <span class="t">${esc(p.title)}</span>
          <span class="m"><span class="ltr">${p.year || "—"}</span>
            ${who ? `· <span class="who">${esc(who)}</span>` : ""}
            · ${meta}${p.open ? `<span class="open-badge">${t("corpus.open")}</span>` : ""}</span>
        </span>
      </label>`;
    }).join("");
  }).join("");

  // The whole library is selectable, so the visitor's own selection is what has to be described -
  // and described in BOTH halves. "3 of your 12 are scored" and "9 of your 12 change nothing" are
  // the same fact, and only the second one warns.
  S.visible = hits.map(p => p.id);
  const nSel = S.selected.size;
  const nSelScored = [...S.selected].filter(id => scoredSet.has(id)).length;
  const note = document.getElementById("unscoredNote");
  if (note) {
    note.innerHTML = nSel
      ? t("corpus.split").replace("{n}", nSel).replace("{k}", nSelScored)
                         .replace("{m}", nSel - nSelScored)
        + (nSelScored === 0 ? ` <b>${t("corpus.split.none")}</b>` : "")
      : `<b>${t("unscored.h")}</b> — ${t("unscored.body").replace("{n}", (S.index && S.index.length) || all.length)}`;
    note.style.display = "";
  }
  box.querySelectorAll(".pt-paper input").forEach(inp => {
    inp.addEventListener("change", e => {
      const id = e.target.closest(".pt-paper").dataset.id;
      if (e.target.checked) S.selected.add(id); else S.selected.delete(id);
      S.pickedCorpus = true;
      refresh();
      updateStep3();
    });
  });
}

/* The third button exists only once there is something for it to open. */
function updateStep3() {
  const wrap = document.getElementById("step3wrap");
  if (!wrap) return;
  // Gate on what the VISITOR chose, not on the defaults the board boots with. The page loads
  // with a concept and every scored paper already selected so the board is reproducible; if
  // that counted as a choice, the third button would be there before she had pressed
  // anything -- which is the same fault as showing the ranking before she asked for it.
  const haveConcept = !!S.capability;
  const haveCorpus = !!S.pickedCorpus && S.selected && S.selected.size > 0;
  wrap.hidden = !(haveConcept && haveCorpus);
  renderCapability();
  renderStartHere();
  const ttl = document.querySelector("#step3 .ttl");
  if (ttl) ttl.textContent = S.capability === CAPABILITY.BENCHMARK
    ? t("step.go") : t("evidence.step");
  const v = document.getElementById("goVal");
  if (v && !wrap.hidden) {
    v.textContent = `${S.selected.size} ${LANG === "he" ? "מאמרים נבחרו" : "papers selected"}`;
  }
}

function renderState(judged, undecided) {
  const nPos = judged.filter(i => S.cases[i].status === "P").length;
  const base = judged.length ? (nPos / judged.length) : 0;
  const alpha = (judged.length + undecided.length)
    ? undecided.length / (judged.length + undecided.length) : 0;
  // The label stays Hebrew and OUTSIDE the numeric run. A Hebrew word inside an LTR block
  // opens a bidi run that drags the following separators with it and the whole line reads
  // backwards - the same trap that swapped a confidence interval's bounds on an earlier page.
  // Hebrew phrases stay in the RTL run; each bare number is isolated so the digits cannot be
  // dragged around by the neutrals beside them. Only the pure-ASCII tail is a single LTR run.
  // This is the trap that once printed a confidence interval with its bounds swapped.
  const n = x => `<span class="num">${x}</span>`;
  document.getElementById("stateBar").innerHTML =
    `<b>${t("corpus.label")}</b> ${n(S.selected.size)} ${t("corpus.papers")} · ` +
    `${n(judged.length)} ${t("corpus.judged")} · ${n(nPos)} ${t("corpus.pos")} · ` +
    `<span class="ltr">base rate ${base.toFixed(3)} · abstention α ${alpha.toFixed(3)}</span>`;
}

function caseRow(r) {
  const c = S.cases[r.i];
  const lab = t("case." + r.kind);
  // The visible name follows the interface language; the QUOTE never does. A translated
  // quote is not the sentence the paper contains, and the quote is the evidence.
  const name = LANG === "he" ? (c.thing_he || c.thing) : (c.thing || c.thing_he);
  return `<div class="pt-case">
    <span class="th">${esc(name)}</span>
    <span class="vd ${r.kind}">${lab}</span>
    <div class="q" dir="ltr">"${esc(c.quote)}"</div>
    <div class="src">${t("case.paper")}: ${esc(c.paper)} · ${t("case.case")} #${r.i}</div>
  </div>`;
}

/* WHAT "ALL THE DEFINITIONS" SAYS WHEN THERE ARE NONE.

   renderBoard() has two early returns and NEITHER of them wrote to #board, so the panel kept
   whatever the last run had left there - on a fresh load, nothing at all. It opened to its
   heading and a close button, twenty-one characters, for every concept that has no board,
   which is all but three of the fourteen thousand seven hundred and sixty-seven in the
   registry. The panel beside it says "choose a concept" and the jackknife panel says "at
   least three papers are needed": both explain their own absence, and this one did not.

   The two absences are different and do not get the same sentence. S.termPick is what tells
   them apart - a term with no board is not a concept selection, so S.concept stays on the
   default and S.capability stays null, and a condition written on capability fires on the
   wrong one. It carries the label, so the sentence can name the term the visitor typed. */
function boardEmptyNote() {
  const bd = document.getElementById("board");
  if (!bd) return;
  const term = S.termPick && S.termPick.label;
  bd.innerHTML = `<div class="pt-note" style="padding:.9rem 0">${
    term ? t("board.noboard").replace(
             "{term}", `<span class="ltr" dir="ltr">${esc(term)}</span>`)
         : esc(t("board.pick"))}</div>`;
}

function renderBoard() {
  if (S.capability && S.capability !== CAPABILITY.BENCHMARK) {
    ["calib", "discrim"].forEach(id => {
      const el = document.getElementById(id); if (el) el.style.display = "none";
    });
    boardEmptyNote();
    const stage = document.getElementById("stage2");
    if (stage && !stage.hidden) renderEvidenceWorkspace();
    return;
  }
  // With nothing picked there is nothing to say, and saying it badly is worse than saying
  // nothing: an empty corpus makes every definition unscorable, which the calibration check
  // would otherwise report as "the calibration definition is missing" - a warning about our
  // data, on a screen where the visitor has simply not chosen yet.
  if (S.capability !== CAPABILITY.BENCHMARK || S.selected.size === 0) {
    const w = document.getElementById("calib");
    if (w) w.style.display = "none";
    const off = document.getElementById("offered");
    if (off) off.innerHTML = `<div class="pt-note" style="padding:.9rem 0">${esc(t("board.pick"))}</div>`;
    // AND #board, WHICH THIS SAME BRANCH LEFT BLANK. "All the definitions" opened to its
    // heading and a close button - twenty-one characters - on a fresh load and for every
    // concept that has no board, which is all but two of them. The panel beside it says
    // "choose a concept", and the jackknife panel says "at least three papers are needed":
    // both explain their own absence. This one said nothing, and a panel that opens empty
    // reads as a tool that is broken rather than one that has not been asked yet.
    // The two absences are not the same, so they do not get the same sentence: nothing
    // picked yet, versus a term picked that has no board to show.
    boardEmptyNote();
    return;
  }
  const { judged, undecided } = corpusCases();
  renderState(judged, undecided);

  const rows = S.defs.map(d => ({ d, s: scoreDef(d.id, judged) }))
    .filter(r => r.s.mcc !== null)
    .sort((a, b) => b.s.mcc - a.s.mcc);

  const circ = rows.find(r => r.d.id === conf().calib);
  const warn = document.getElementById("calib");
  if (!circ) {
    warn.innerHTML = t("calib.missing");
    warn.style.display = "";
  } else if (circ.s.mcc < 0.90) {
    warn.innerHTML = `${t("calib.failed")} <span class="num">${fmt(circ.s.mcc)}</span> ` +
      `${t("calib.instead")} <span class="num">+1.000</span>. ${t("calib.why")}`;
    warn.style.display = "";
  } else {
    warn.style.display = "none";
  }

  // THE SECOND CALIBRATION: can this corpus discriminate at all?
  //
  // The circular control above only proves the arithmetic and the case indexing. It is
  // reproducing the gold labels, so it scores near +1.000 however useless the corpus is.
  // The deliberately-bad controls are the ones that test the corpus: "any activity governed
  // by rules" is meant to come last. When the game corpus grew from 32 cases to 53, the new
  // cases were 17 positive to 4 negative, the base rate went from 0.571 to 0.667, and that
  // control rose to +0.725 and beat three published definitions - because a corpus that is
  // two-thirds positives rewards admitting everything. The first calibration said OK
  // throughout. This one says what is actually wrong.
  const badControls = rows.filter(r => r.d.is_control && r.d.id !== conf().calib);
  const litRows = rows.filter(r => r.d.provenance === "literature");
  const outranked = badControls
    .map(c => ({ c, beat: litRows.filter(l => l.s.mcc < c.s.mcc) }))
    .filter(x => x.beat.length);
  const disc = document.getElementById("discrim");
  if (disc) {
    if (outranked.length) {
      const nPos = judged.filter(i => S.cases[i].status === "P").length;
      const worst = outranked[0];
      disc.innerHTML = t("discrim.body")
        .replace("{ctrl}", esc(LANG === "he" ? worst.c.d.name_he : worst.c.d.name_en))
        .replace("{mcc}", fmt(worst.c.s.mcc))
        .replace("{k}", worst.beat.length)
        .replace("{base}", (nPos / judged.length).toFixed(3))
        .replace("{pos}", nPos)
        .replace("{neg}", judged.length - nPos);
      disc.style.display = "";
    } else {
      disc.style.display = "none";
    }
  }

  renderOffered(rows);

  const max = Math.max(...rows.map(r => Math.abs(r.s.mcc)), 0.001);
  document.getElementById("board").innerHTML = rows.map(({ d, s }) => {
    const mine = d.id.startsWith("shir");
    const w = Math.max(2, Math.abs(s.mcc) / max * 100);
    // t() RETURNS THE KEY ON A MISS, so `t("gate." + d.gate) || d.gate` can never reach its
    // fallback: for a definition with no gate the key is "gate.undefined", that string is
    // truthy, and it is what all TEN rows of the consciousness board showed a visitor. The
    // game board's fifteen definitions all carry a gate and rendered correctly, which is why
    // this survived - one of the two boards was clean and the other was never opened here.
    // A missing gate is not a gate called "undefined". The gate is a verdict on whether a
    // definition may be read at all; where the data records none, the honest thing is to
    // show no chip rather than invent one.
    const gateKey = d.gate ? "gate." + d.gate : "";
    const gateTxt = gateKey ? (t(gateKey) === gateKey ? d.gate : t(gateKey)) : "";
    const wrong = s.rows.filter(r => r.kind === "fp" || r.kind === "fn");
    return `<div class="pt-def ${mine ? "mine" : ""} ${d.is_control ? "control" : ""}">
      <div class="pt-defh">
        <span class="nm">${esc(LANG === "he" ? d.name_he : (d.name_en || d.id))}</span>
        <span class="prov prov-${d.provenance}">${provLine(d)}</span>
        ${gateTxt ? `<span class="gate ${esc(d.gate)}">${esc(gateTxt)}</span>` : ""}
      </div>
      <div class="wording"${LANG === "he" ? "" : ' dir="ltr"'}>${esc(LANG === "he" ? d.he : d.text)}</div>
      ${citeLine(d)}
      <div class="pt-bar"><i style="width:${w}%"></i><span>MCC ${fmt(s.mcc)}</span></div>
      <div class="cm">TP ${s.tp} · FP ${s.fp} · FN ${s.fn} · TN ${s.tn} · n ${s.n}</div>
      ${(s.skipped && d.may_abstain) ? `<div class="abstain">${t("abstain.n")
        .replace("{k}", s.skipped).replace("{n}", s.skipped + s.n)}</div>` : ""}
      <div class="plain">${plainMCC(s.mcc)}</div>
      ${wrong.length ? `<details class="pt-cases">
        <summary>${wrong.length} ${t("case.wrongN")}</summary>
        ${wrong.map(caseRow).join("")}
      </details>` : `<div class="plain">${t("case.none")}</div>`}
    </div>`;
  }).join("");
  wireTheorists();
}

/* "Test this definition on the papers that discuss its author." The citation itself a reader
   has to take on trust; this is the part they can check. Wired after every render because
   the buttons are rebuilt with the board. */
function wireTheorists() {
  document.querySelectorAll("[data-theorist]").forEach(b => {
    b.onclick = () => {
      const who = b.dataset.theorist;
      S.selected.clear();
      S.papers.forEach(p => {
        if (p.n_scored && (p.theorists || []).includes(who)) S.selected.add(p.id);
      });
      refresh();
      const off = document.getElementById("offered");
      if (off) off.scrollIntoView({ behavior: "smooth", block: "start" });
    };
  });
}

/* ---------- leave-one-paper-out: which paper is carrying the result? ----------
   Two things at once. It is the sensitivity analysis that turns "the score is
   corpus-relative" from a slogan into a measurement, and it is the thing a sceptical reader
   most wants: a result that rests on one paper is not a result. Removing a paper is exactly
   as cheap and as measurable as adding one, which is the point. */
function jackknife() {
  const ids = [...S.selected];
  if (ids.length < 3) {
    return `<div class="plain">${t("jack.few")}</div>`;
  }
  const all = corpusCases().judged;
  // Controls are excluded by their own flag, not by a name. Matching on "circular" left the
  // game board ranking its copy-the-answer control as the winner of the sensitivity test,
  // which is a sentence that means nothing.
  const isControl = id => (S.defs.find(d => d.id === id) || {}).is_control;
  const rank = idx => S.defs.map(d => ({ id: d.id, s: scoreDef(d.id, idx) }))
    .filter(r => r.s.mcc !== null && !isControl(r.id))
    .sort((a, b) => b.s.mcc - a.s.mcc);
  const base = rank(all);
  if (!base.length) return "";
  const topId = base[0].id, topMCC = base[0].s.mcc;

  const rows = ids.map(pid => {
    const idx = all.filter(i => S.cases[i].paper !== pid);
    const r = rank(idx);
    if (!r.length) return null;
    const nowTop = r[0].id;
    const mineNow = r.find(x => x.id === topId);
    return {
      pid,
      flips: nowTop !== topId,
      newTop: nowTop,
      delta: mineNow ? mineNow.s.mcc - topMCC : null,
      n: all.length - idx.length,
    };
  }).filter(Boolean).sort((a, b) => Math.abs(b.delta || 0) - Math.abs(a.delta || 0));

  const nameOf = id => {
    const d = S.defs.find(x => x.id === id) || {};
    return (LANG === "he" ? d.name_he : (d.name_en || d.id)) || id;
  };
  const flips = rows.filter(r => r.flips);
  const head = flips.length
    ? `${t("jack.fragile")} ${t("jack.removing")} ${flips.length} ` +
      `${flips.length === 1 ? t("jack.paperChanges") : t("jack.papersChange")}`
    : `${t("jack.stable")} (<span class="num">${esc(nameOf(topId))}</span>).`;

  // The heading used to say "five" and the list is `rows.slice(0, 5)` - on the consciousness
  // board only three papers survive the filter, so a visitor read "the five papers" above
  // three of them. It names what it shows.
  const jackRows = rows.slice(0, 5);
  return `<div class="pt-note">${head}
    <div class="plain" style="margin-top:.5rem">
      ${jackRows.length === 1 ? t("jack.top1")
        : t("jack.topk").replace("{k}", jackRows.length)} (<span class="num">${fmt(topMCC)}</span>):
    </div>
    ${jackRows.map(r => {
      const p = S.papers.find(x => x.id === r.pid) || { title: r.pid };
      return `<div class="pt-case">
        <span class="th">${esc(p.title)}</span>
        <span class="vd ${r.flips ? "fp" : "tn"}">${r.flips
          ? t("jack.removes") + " " + esc(nameOf(r.newTop))
          : t("jack.keeps")}</span>
        <div class="src">${r.n} ${t("jack.cases")}
          <span class="num">${r.delta === null ? "—" : fmt(r.delta)}</span></div>
      </div>`;
    }).join("")}
  </div>`;
}

/* WHAT THE TOOL OFFERS.
   Shir, describing the process the two of us actually went through: the tool should propose
   a few definitions based on the corpus and show the numbers that matter for each, and only
   then let you try your own or ask for a particular scholar's. So this is a short list -
   never the full thirteen with their confusion matrices - and the full table stays one
   button away for whoever wants it. Controls are excluded: a deliberately circular
   definition is a check on us, not a candidate to offer anybody. */
const OFFER_N = 4;


/* ---------- THE LIVE CONFUSION MATRIX ----------
   Shir asked for this twice: "the confusion matrix can be shown and be updated according to
   my definition", and "there I can insert a definition and ask for its score relative to the
   given corpus."

   It is the same four numbers the board already computes - scoreDef() returns them - but put
   where a person can act on them: one definition at a time, over the corpus THEY picked, with
   every cell clickable through to the cases behind it. A score with no way to see the cases
   is the thing this project exists not to ship.

   Colours are the ones the preprint uses, so the same cell means the same thing in both
   places: TP teal, FP pink, FN red, TN blue. */
const LM = {
  tp: { c: "#0d9488", d: "#00544c", l: "rgba(13,148,136,.14)" },
  fp: { c: "#b5179e", d: "#7d0f6c", l: "rgba(181,23,158,.14)" },
  fn: { c: "#c0392b", d: "#8e2b20", l: "rgba(192,57,43,.14)" },
  tn: { c: "#1565c0", d: "#0d3f77", l: "rgba(21,101,192,.14)" },
};

function liveCell(kind, n, label, sub) {
  const k = LM[kind];
  return `<button class="lmcell" data-kind="${kind}"
      style="--c:${k.c};--d:${k.d};--l:${k.l}">
    <span class="lmk">${kind.toUpperCase()}</span>
    <span class="lmn">${n}</span>
    <span class="lml">${label}</span>
    <span class="lms">${sub}</span>
  </button>`;
}

function renderLiveMatrix(defId) {
  if (S.capability !== CAPABILITY.BENCHMARK) return;
  const el = document.getElementById("liveMatrix");
  if (!el) return;
  const d = S.defs.find(x => x.id === defId) || S.defs.find(x => !x.is_control);
  if (!d) { el.innerHTML = ""; return; }
  S.liveDef = d.id;
  const { judged } = corpusCases();
  const he = LANG === "he";
  // An empty corpus is a normal state -- it is what "select none" produces -- and it must not
  // be an error. With no cases, mcc() returns null, and calling .toFixed on it threw inside
  // refresh(), which then never reached renderState: pressing "none" left the state bar
  // showing the previous selection. A crash upstream of a display is invisible until the
  // display is wrong.
  if (!judged.length) {
    // TWO DIFFERENT EMPTINESSES, AND THEY WANT DIFFERENT ACTIONS. `judged` is the selected papers
    // that ALSO carry a yes/no judgement for this concept. Sixty selected papers with no
    // judgement on this concept produced an empty `judged` and a message saying no papers were
    // selected - so the step-3 header said 60 and the panel under it said none, from one state.
    const n = S.selected.size;
    el.innerHTML = `<div class="pt-note">${
      n === 0
        ? (he ? "לא נבחרו מאמרים. בחרי קורפוס בכפתור 2 והמטריצה תופיע כאן."
              : "No papers selected. Choose a corpus with button 2 and the matrix appears here.")
        : (he ? `${n} מאמרים נבחרו, ולאף אחד מהם אין עדיין הכרעה על המושג הזה. הכריעי כמה בכפתור 2, או בחרי מושג שהמאמרים האלה מכסים.`
              : `${n} papers selected, and none of them carries a yes/no judgement for this concept yet. Judge a few with button 2, or choose a concept these papers cover.`)
    }</div>`;
    return;
  }
  const r = scoreDef(d.id, judged);
  const name = he ? (d.name_he || d.name_en) : (d.name_en || d.name_he);

  const pick = S.defs.filter(x => x.gate !== "disqualified").map(x =>
    `<option value="${esc(x.id)}" ${x.id === d.id ? "selected" : ""}>` +
    `${esc(he ? (x.name_he || x.name_en) : (x.name_en || x.name_he))}` +
    `${x.is_control ? (he ? " — בקרה" : " — control") : ""}</option>`).join("");

  el.innerHTML = `
    <div class="lmhead">
      <label class="lmlab">${he ? "ההגדרה שנבדקת" : "Definition under test"}</label>
      <select id="lmPick" class="owninput">${pick}</select>
      <div class="lmscore">MCC <b class="ltr">${fmt(r.mcc)}</b></div>
    </div>
    <div class="lmwrap">
      <div class="lmcorner"></div>
      <div class="lmcolh">${he ? "הספרות אומרת: כן" : "The literature says: YES"}</div>
      <div class="lmcolh">${he ? "הספרות אומרת: לא" : "The literature says: NO"}</div>
      <div class="lmrowh">${he ? "ההגדרה מכניסה" : "the definition INCLUDES"}</div>
      ${liveCell("tp", r.tp, he ? "פגיעה" : "hit", he ? "צדקה" : "correct")}
      ${liveCell("fp", r.fp, he ? "אזעקת שווא" : "false alarm", he ? "הכניסה מה שלא" : "let in what it should not")}
      <div class="lmrowh">${he ? "ההגדרה מוציאה" : "the definition EXCLUDES"}</div>
      ${liveCell("fn", r.fn, he ? "פספוס" : "miss", he ? "פספסה" : "missed it")}
      ${liveCell("tn", r.tn, he ? "דחייה נכונה" : "correct rejection", he ? "צדקה" : "correct")}
    </div>
    <div class="lmfoot">
      ${he ? "מתוך" : "over"} <span class="num">${r.n}</span>
      ${he ? "מקרים מוכרעים ב־" : "adjudicated cases in "}<span class="num">${S.selected.size}</span>
      ${he ? "מאמרים שבחרת" : "papers you chose"}${r.skipped
        ? ` · <span class="num">${r.skipped}</span> ${he ? "נמנעה" : "abstained"}` : ""}
      · ${he ? "לחצי על תא כדי לראות את המקרים שבו" : "click a cell to see the cases in it"}
    </div>
    <div id="lmCases"></div>`;

  const sel = document.getElementById("lmPick");
  if (sel) sel.addEventListener("change", e => renderLiveMatrix(e.target.value));
  el.querySelectorAll(".lmcell").forEach(b => {
    b.addEventListener("click", () => {
      const kind = b.dataset.kind;
      const box = document.getElementById("lmCases");
      const hits = r.rows.filter(x => x.kind === kind);
      box.innerHTML = `<div class="lmcaseh" style="color:${LM[kind].d}">` +
        `${kind.toUpperCase()} — <span class="num">${hits.length}</span> ` +
        `${he ? "מקרים" : "cases"}</div>` +
        hits.map(x => caseRow(x)).join("");
      box.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  });
}


/* ---------- ONE AUTHOR, ONE ROW ----------
   Shir, seeing the board: "cluster account, Sivroni v7, Sivroni v1, Sivroni v6??? what is it?
   why is it there? what is the 3 Sivroni definitions? no no."

   Three rows were three drafts of one person's one definition, ranked against each other as
   though they were rival positions. They are a version history, and a version history belongs
   inside the entry, not spread across the leaderboard where it crowds out other people's
   definitions and makes one author look like three.

   Grouped by proposed_by rather than by an id prefix, so this works for the next visitor who
   saves four attempts, not only for Shir. The best-scoring version represents the lineage;
   the others travel with it. Nothing is deleted and nothing is re-scored - the full board
   still lists every version, because that table has to stay reproducible from the files. */
function collapseVersions(rows) {
  const byAuthor = new Map();
  const out = [];
  rows.forEach(r => {
    const who = (r.d.proposed_by || "").trim();
    if (!who) { out.push({ ...r, versions: [] }); return; }
    if (!byAuthor.has(who)) {
      const entry = { ...r, versions: [] };
      byAuthor.set(who, entry);
      out.push(entry);
      return;
    }
    const kept = byAuthor.get(who);
    // the better score represents the lineage; the loser becomes history on the winner
    if (r.s.mcc > kept.s.mcc) {
      kept.versions.push({ d: kept.d, s: kept.s });
      kept.d = r.d; kept.s = r.s;
    } else {
      kept.versions.push({ d: r.d, s: r.s });
    }
  });
  out.forEach(e => e.versions.sort((a, b) => b.s.mcc - a.s.mcc));
  return out.sort((a, b) => b.s.mcc - a.s.mcc);
}

function versionLine(r) {
  if (!r.versions || !r.versions.length) return "";
  const he = LANG === "he";
  const n = r.versions.length + 1;
  const rows = r.versions.map(v => {
    const nm = he ? (v.d.name_he || v.d.name_en) : (v.d.name_en || v.d.name_he);
    const when = v.d.proposed_on ? `<span class="num">${esc(v.d.proposed_on)}</span> · ` : "";
    return `<div class="verrow">${when}${esc(nm)} · ` +
           `<span class="num">${fmt(v.s.mcc)}</span></div>`;
  }).join("");
  return `<details class="vers"><summary>${he
    ? `${n} גרסאות של אותה הגדרה — זו הטובה שבהן`
    : `${n} versions of the same definition — this is the best of them`}</summary>` +
    `<div class="verbody">${rows}</div></details>`;
}

function renderOffered(rows) {
  const el = document.getElementById("offered");
  if (!el) return;
  const real = rows.filter(r => !r.d.is_control && r.d.gate !== "disqualified");
  const next = document.getElementById("nextline");
  if (!real.length) {
    el.innerHTML = `<div class="hero-result warn"><div class="win">${t("hero.empty")}</div></div>`;
    if (next) next.hidden = true;
    return;
  }
  if (next) next.hidden = false;

  // IS THE WINNER WINNING, OR JUST ANSWERING LESS?
  //
  // A definition entitled to abstain is not being asked the same questions as the rest, and
  // on the game corpus the abstainer - Wittgenstein - comes top. Left alone, the first thing
  // a visitor reads is "family resemblance fits this corpus best", and that is an artefact of
  // it declining the four hardest cases. So when the leader abstains, every definition is
  // re-scored on exactly the cases the leader answered and the result is stated right there.
  // It reverses: on the same 24 questions, five definitions beat it.
  //
  // The published numbers are untouched. This is a second, clearly labelled comparison, not a
  // different ranking rule - the board must stay reproducible from the downloaded files.
  let caveat = "";
  const top = real[0];
  if (top && top.s.skipped && top.d.may_abstain) {
    const sub = corpusCases().judged
      .filter(i => { const c = S.verdicts[top.d.id][i]; return c === "0" || c === "1"; });
    const fair = real.map(r => ({ d: r.d, m: scoreDef(r.d.id, sub).mcc }))
      .filter(r => r.m !== null);
    const mine = (fair.find(r => r.d.id === top.d.id) || {}).m;
    const beat = fair.filter(r => r.m > mine + 1e-9);
    if (beat.length) {
      caveat = `<div class="offerwarn">${t("offer.abstainlead")
        .replace("{name}", esc(LANG === "he" ? top.d.name_he : top.d.name_en))
        .replace("{k}", top.s.skipped)
        .replace("{n}", sub.length)
        .replace("{beat}", beat.length)
        .replace("{who}", esc(LANG === "he" ? beat[0].d.name_he : beat[0].d.name_en))}</div>`;
    }
  }

  // THE CAP HID THE FINDING. This list stops at OFFER_N and said nothing about stopping.
  // On the consciousness board seven of the nine definitions tie at +1.000; a visitor saw
  // four and no sign the other five existed, while i18n's own note tells the reader that
  // seven tie. A truncation that is not stated reads as a complete ranking -- and here the
  // tie IS the result: it says this corpus cannot separate these definitions.
  const all = collapseVersions(real);
  const shown = S.showAllOffers ? all : all.slice(0, OFFER_N);
  const lead = all.length ? all[0].s.mcc : null;
  const tied = lead === null ? 0 : all.filter(r => Math.abs(r.s.mcc - lead) < 1e-9).length;

  el.innerHTML =
    `<div class="offerhead">${t("offer.head")} <span class="lead">${t("offer.sub")}</span></div>` +
    caveat +
    shown.map((r, k) => {
      const d = r.d, s = r.s;
      const name = LANG === "he" ? d.name_he : (d.name_en || d.id);
      const word = LANG === "he" ? d.he : d.text;
      const miss = s.fp + s.fn;
      return `<div class="offer ${k === 0 ? "best" : ""}">
        <div class="orank">${k + 1}</div>
        <div class="obody">
          <div class="oname">${esc(name)}</div>
          <div class="oword"${LANG === "he" ? "" : ' dir="ltr"'}>${esc(word)}</div>
          <div class="oplain">${plainMCC(s.mcc)}</div>
          ${(s.skipped && d.may_abstain) ? `<div class="oabstain">${t("abstain.n")
            .replace("{k}", s.skipped).replace("{n}", s.skipped + s.n)}</div>` : ""}
          ${citeLine(d)}
          ${versionLine(r)}
          <div class="oprov prov-${d.provenance}">${provLine(d)}</div>
        </div>
        <div class="onums">
          <div class="omcc">${fmt(s.mcc)}</div>
          <div class="olab">${t("offer.fit")}</div>
          <div class="omiss">${miss} ${t("offer.misses")}</div>
        </div>
      </div>`;
    }).join("") +
    (all.length > OFFER_N ? `<div class="offermore">
      <span class="lead">${t("offer.shown").replace("{k}", shown.length)
        .replace("{n}", all.length)}${tied >= 2
        ? " " + t("offer.tie").replace("{t}", tied).replace("{s}", fmt(lead)) : ""}</span>
      <button class="pt-btn" data-offer-toggle>${S.showAllOffers
        ? t("offer.showfewer").replace("{k}", OFFER_N)
        : t("offer.showall").replace("{n}", all.length)}</button>
    </div>` : "");

  // Re-render rather than unhiding rows: the rank number is positional, so a row revealed in
  // place would keep the number it was given while the list was still four long.
  const tog = el.querySelector("[data-offer-toggle]");
  if (tog) tog.onclick = () => { S.showAllOffers = !S.showAllOffers; renderOffered(rows); };
}

/* Ask for the definitions of a particular scholar: keep only papers that engage them.
   The theorist tags are already in papers.json - 209 of them - so this needs no new data. */
function renderWho() {
  const box = document.getElementById("whoList");
  if (!box) return;
  const count = {};
  S.papers.forEach(p => {
    if (!p.n_scored) return;
    (p.theorists || []).forEach(n => { count[n] = (count[n] || 0) + 1; });
  });
  const top = Object.entries(count).filter(([, n]) => n >= 3)
    .sort((a, b) => b[1] - a[1]).slice(0, 18);
  box.innerHTML = top.map(([n, c]) =>
    `<button class="pt-btn" data-who="${esc(n)}">${esc(n)} <span class="lead">(${c})</span></button>`
  ).join("") || `<span class="lead">${t("who.none")}</span>`;
  box.querySelectorAll("[data-who]").forEach(b => {
    b.onclick = () => {
      const who = b.dataset.who;
      S.selected.clear();
      S.papers.forEach(p => {
        if (p.n_scored && (p.theorists || []).includes(who)) S.selected.add(p.id);
      });
      refresh();
      document.getElementById("offered").scrollIntoView({ behavior: "smooth", block: "start" });
    };
  });
}

/* Match a typed string against a concept. Deliberately forgiving: Hebrew is typed with and
   without the alef ("אמנות" / "אומנות"), and a reader who types "games" must find "game". */
/* The one slug rule, matching TOOLS/build_term_corpus.py character for character. Two copies
   of a key drift; this is the only copy on the JavaScript side. */
function slugOf(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-")
         .replace(/^-+|-+$/g, "").slice(0, 60);
}

function norm(s) {
  return String(s || "").toLowerCase().trim()
    .replace(/[֑-ׇ]/g, "")     // Hebrew niqqud and cantillation
    .replace(/["'׳״]/g, "");   // geresh, gershayim, quotes
}
function matches(c, q) {
  if (!q) return true;
  return [c.id, c.he, c.en, ...(c.aliases || []), ...abbreviationSearchValues(c)]
    .filter(Boolean).some(s => norm(s).includes(q));
}

/* THE PICKER: a field with a dropdown under it.
   The tile grid was unusable - "אי אפשר לעבוד עם החלון של בחירת מושג" - so this follows the
   pattern of the direction-field tool Shir named as the reference: a list that appears under
   the caret, narrows as you type, and is driveable from the keyboard.
   Ready concepts always sort first: the two that can actually be loaded must never be buried
   under 472 that cannot. */
function openConcepts(open) {
  const box = document.getElementById("conceptResults");
  const inp = document.getElementById("conceptSearch");
  if (!box) return;
  box.classList.toggle("open", !!open);
  if (inp) inp.setAttribute("aria-expanded", open ? "true" : "false");
}

function renderConcepts() {
  const box = document.getElementById("conceptResults");
  if (!box) return;
  const q = norm(S.query);
  const hits = S.registry.filter(c => matches(c, q));
  const ready = hits.filter(c => c.state === "ready");
  // RANK BY HOW WELL THE TERM MATCHES WHAT WAS TYPED, not by how many papers it has.
  // Shir typed "ART" and the panel came back with "job shop scheduling problem". The list was
  // ordered by paper count across the whole corpus, so a term that merely CONTAINS the letters
  // and happens to be well covered outranked the term she actually typed. Exact first, then
  // starts-with, then a word that starts with it, then anywhere; paper count only breaks ties.
  const rank = c => {
    const n = norm(c.en || c.id);
    if (!q) return 4;
    if (n === q) return 0;
    if (n.startsWith(q)) return 1;
    // No RegExp here on purpose: the query is user text, and building a pattern out of it
    // needs escaping that is easy to get wrong - the first version of this line compiled to
    // an invalid expression and would have killed the whole file at parse time.
    if (n.includes(" " + q) || n.includes("-" + q)) return 2;
    return 3;
  };
  const rest = hits.filter(c => c.state !== "ready")
    .sort((a, b) => rank(a) - rank(b) || (b.papers || 0) - (a.papers || 0));
  const shown = ready.concat(rest.slice(0, MAX_HITS));
  S.hits = shown;
  if (S.sel == null || S.sel >= shown.length) S.sel = 0;

  const counts = c => t("concept.counts")
    .replace("{p}", c.papers).replace("{c}", c.cases).replace("{d}", c.definitions);

  let html = "";
  if (!hits.length) {
    // Not an empty list. An empty list reads as a broken search; this says what is true -
    // we hold nothing on that word - and what a person can do next.
    html = `<div class="ac-none"><b>${t("concept.none.h").replace("{q}", esc(S.query))}</b>
      ${t("concept.none.body")}</div>`;
  } else {
    html = shown.map((c, i) => {
      const on = !!S.capability && !S.termPick && c.id === S.concept;
      const sel = i === S.sel ? " sel" : "";
      if (c.state === "ready") {
        return `<button class="ac-item${sel}${on ? " on" : ""}" role="option"
          aria-selected="${on}" data-conc="${esc(c.id)}"
          ><span class="nm">${esc(conceptLabel(c))}</span>${abbreviationDetailsHTML(c, true)}
          <span class="sub">${counts(c)} · ${esc(LANG === "he" ? c.why_he : c.why_en)}</span>
          </button>`;
      }
      const cap = capabilityForRegistryEntry(c);
      // THE DISPUTE COUNT WINS OVER THE GROUNDING LABELS, because it answers a different and
      // scarcer question. "3 grounded senses, evidence only" says what we HAVE; "4 of them argue
      // what it means" says what could be BUILT, and only 34 of 14,768 corpus terms can say it.
      // `working memory` is the case that forced this: it is the best board candidate in the
      // corpus and it was reading as "evidence only, no benchmark score" like any other term.
      const sub = (c.disputed_by || 0) >= 4
        ? t("concept.disputed").replace("{n}", c.papers).replace("{d}", c.disputed_by)
        : cap === CAPABILITY.COVERAGE
        ? t("concept.coverage").replace("{n}", c.papers).replace("{s}", c.sense_count || 0)
        : cap === CAPABILITY.EVIDENCE
          ? t("concept.evidenceonly").replace("{n}", c.papers).replace("{s}", c.sense_count || 0)
          : t("concept.corpusonly").replace("{n}", c.papers);
      return `<button class="ac-item soon${sel}" role="option" data-soon="${esc(c.id)}"
        ><span class="nm">${esc(conceptLabel(c))}</span><span class="sub">${sub}</span>
        ${abbreviationDetailsHTML(c, true)}</button>`;
    }).join("");
    const hidden = rest.length - Math.max(0, shown.length - ready.length);
    if (hidden > 0) {
      html += `<div class="ac-more">${t("concept.more").replace("{n}", hidden)}</div>`;
    }
  }
  box.innerHTML = html;

  const tally = document.getElementById("conceptTally");
  if (tally) {
    // "3 ready to score, out of 22519" was the whole message, and it read as "almost nothing
    // works here". It is true and it was the wrong headline: 1,234 of the 8,626 terms in the
    // sense index carry TWO OR MORE rival definitions, and as of today the board shows them.
    // Counted from the index at render time, never typed: a number in prose beside a number
    // from data is a number that goes stale.
    const rivals = Object.values(((S.senseIndex || {}).picker_terms) || {})
      .filter(v => Array.isArray(v) && v.length >= 2).length;
    tally.innerHTML = t("concept.tally")
      .replace("{r}", S.registry.filter(c => c.state === "ready").length)
      .replace("{t}", S.registry.length)
      + (rivals ? " " + t("concept.tally.rivals").replace("{d}", rivals.toLocaleString()) : "");
  }

  // mousedown, not click: the input's blur would close the dropdown before a click lands.
  box.querySelectorAll("[data-conc]").forEach(b => {
    b.addEventListener("mousedown", ev => {
      ev.preventDefault();
      openConcepts(false);
      switchConcept(b.dataset.conc);
    });
  });
  box.querySelectorAll("[data-soon]").forEach(b => {
    b.addEventListener("mousedown", ev => {
      ev.preventDefault();
      chooseSoon(b.dataset.soon);
    });
  });
}

/* A concept we hold papers on but have no board for. Pressing it must say what is missing,
   not do nothing - that is the difference between an honest answer and a dead control. */
function chooseSoon(id, fromURL, sourceURL) {
  const c = S.registry.find(x => x.id === id);
  if (!c) return;
  S.capability = capabilityForRegistryEntry(c);
  // Provider consent is session-local and term-local.  A previous opt-in must never carry
  // silently to the next concept or become a URL/default setting.
  S.externalEnabled = false;
  S.coverageDef = null;
  S.featureSelection = new Set();
  S.selected.clear();
  S.pickedCorpus = false;
  const st = document.getElementById("stage2");
  if (st) st.hidden = true;
  // The box kept the typed letters while the panel described a different term, which is how
  // "I chose ART" produced a screenshot of job-shop scheduling. Whatever is chosen is what the
  // field says.
  {
    const inp = document.getElementById("conceptSearch");
    if (inp) { inp.value = conceptLabel(c); S.query = inp.value; }
  }
  const out = document.getElementById("conceptSoon");
  if (!out) return;
  openConcepts(false);
  out.classList.add("open");
  const termSlug = c.slug || slugOf(c.en || c.id);
  const ent = S.termCorpus && S.termCorpus[termSlug];
  const ids = termIdsWithSenseSources(ent, termSlug);
  ensureSensePaperMetadata(ids);
  S.termPick = { id: c.id, slug: termSlug, label: conceptLabel(c), ids,
                 tagged: termTaggedSetWithSenseSources(ent, termSlug),
                 senseIndices: senseIndicesForSlug(termSlug),
                 capability: S.capability };
  if (fromURL) { readTermURL(sourceURL); writeURL(false); }
  else writeURL(true);
  // Shir, 2026-08-14: "all the text below after I choose a term - hide it in a comment for
  // now, the field of view should be clean." The paragraph explaining why there is no
  // definition board is kept in the markup as a comment and not rendered.
  out.innerHTML = "<!-- " + t("concept.soon.body")
    .replace(/{term}/g, esc(c.en)).replace("{n}", c.papers).replace(/<!--|-->/g, "")
    + " -->" + termCorpusHTML(c);
  // The art-vs-game comparison note and the board's own state bar both describe the loaded
  // definition board, not the term just chosen. Leaving them on screen under a term's corpus
  // is the same fault as the green button: text that belongs to something else.
  const note = document.getElementById("conceptNote");
  if (note) note.style.display = "none";
  ["liveStats", "stateBar"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
  renderSteps();
  renderPapers();
  renderCapability();
  renderStartHere();
  updateStep3();
  // AND THE BOARD PANEL, which this function set the state for and never redrew. Four
  // renderers were called here and renderBoard was not, so "All the definitions" kept
  // whatever the previous state had left in it: on a fresh visit that is the empty string,
  // and after a first look it is the sentence for a DIFFERENT state - the panel told a
  // visitor who had just chosen `priming` to "choose a concept". Everything it needs was
  // already set six lines above; nothing asked it to look.
  renderBoard();
  out.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/* Where a paper in a term's corpus goes.

   Locally there is a full tagged page under CORPUS/. Inside the published platform repo there
   is not - that directory is a different repository - so writing the local path into the page
   would ship several thousand links that 404 on the live site. Off file:// the row falls back
   to the paper's own address, and a paper with neither is printed as plain text rather than as
   a link that goes nowhere. */
/* THE TAGGED PAGE IS ON THE WEB, and this function used to send readers to the publisher.

   The tagged pages live in another repository, so a local CORPUS/ path would 404 on the live
   site - which is why the published build fell back to the paper's own url and Shir clicked a
   paper and landed on nature.com behind a cookie wall. But the showcase publishes every one of
   them, so what was missing was not the page: it was the LIST of which ids have one.

   data/showcase_pages.json carries that list, written by
   TOOLS/export_showcase_pages_for_platform.py. Our page first; the publisher only when we have
   no page, because a link to a page we do not publish is worse than a link to the paper. */
let SHOWCASE = null;

function showcaseHref(pid) {
  if (!SHOWCASE || !pid) return "";
  const known = SHOWCASE.full_text.includes(pid) || SHOWCASE.tags_only.includes(pid);
  return known ? (SHOWCASE.base + "papers/" + pid + ".html") : "";
}

function paperLink(pid, disc, title, url) {
  const local = location.protocol === "file:";
  const href = (local ? ("../../CORPUS/" + disc + "/" + pid + "/paper_colored.html") : "")
    || showcaseHref(pid) || url;
  if (!href) return `<span class="t">${esc(title)}</span>`;
  const ours = href.indexOf("meta-tagging-showcase") !== -1 || href.indexOf("CORPUS/") === 0
    || href.indexOf("../../CORPUS/") === 0;
  const full = ours && SHOWCASE && SHOWCASE.full_text.includes(pid);
  const note = full ? (LANG === "he" ? "טקסט מלא מתויג" : "full tagged text")
    : ours ? (LANG === "he" ? "שכבת התגים" : "our tag layer") : "";
  return `<a href="${esc(href)}" target="_blank" rel="noopener"${note ? ` title="${esc(note)}"` : ""}>`
    + `${esc(title)}</a>`;
}

/* The corpus behind the count: every paper in which this term appears at least once.
   Shir's rule for the whole platform applies here too - saying "13 papers" and not showing
   which 13 is a number without its evidence, which is the thing this project exists against. */
function termCorpusHTML(c) {
  const he = LANG === "he";
  const ent = S.termCorpus && S.termCorpus[c.slug || slugOf(c.en || c.id)];
  if (!ent) return "";
  const termSlug = c.slug || slugOf(c.en || c.id);
  const ids = termIdsWithSenseSources(ent, termSlug);
  ensureSensePaperMetadata(ids);
  if (!ids.length) return "";
  const byDisc = new Map();
  ids.forEach(pid => {
    const p = (S.termPapers || {})[pid];
    if (!p) return;
    const d = p[2] || "uncategorised";
    if (!byDisc.has(d)) byDisc.set(d, []);
    byDisc.get(d).push([pid, p[0], p[1], p[3] || ""]);
  });
  const disc = [...byDisc.entries()].sort((a, b) => b[1].length - a[1].length);
  const head = `<div class="tc-h">${he ? "הקורפוס של המונח" : "the corpus for this term"} —
    <span class="num">${ids.length}</span> ${he ? "מאמרים" : "papers"} ·
    <span class="num">${disc.length}</span> ${he ? "דיסציפלינות" : "disciplines"}</div>`;
  const body = disc.map(([d, rows]) =>
    `<div class="tc-d">${esc(d)} <span class="n">${rows.length}</span></div>` +
    rows.sort((a, b) => (b[2] || 0) - (a[2] || 0)).map(([pid, title, year, url]) =>
      `<div class="tc-p"><span class="ltr y">${esc(String(year || "—"))}</span>
        ${paperLink(pid, d, title, url)}</div>`).join("")
  ).join("");
  const note = he
    ? "אין עדיין מקרים מוכרעים למונח הזה, ולכן אפשר לעיין בקורפוס אך לא לנקד עליו הגדרות."
    : "This term has no judged cases yet, so the corpus can be browsed but definitions "
      + "cannot be scored against it.";
  return `<div class="tc">${abbreviationDetailsHTML(c)}${head}<div class="tc-list">${body}</div>
          <div class="tc-note">${note}</div></div>`;
}

function evidenceSelectorPlan(rows) {
  const byPaper = new Map();
  rows.forEach(row => {
    if (!byPaper.has(row.paper_id)) byPaper.set(row.paper_id, []);
    byPaper.get(row.paper_id).push(row);
  });
  const papers = [...byPaper.keys()].map(id => [id, (S.senseIndex.papers || {})[id] || {}]);
  const badges = new Map(papers.map(([id]) => [id, []]));
  const notes = [];
  const add = (id, label) => {
    const list = badges.get(id) || [];
    if (!list.includes(label)) list.push(label);
    badges.set(id, list);
  };

  if (papers.length === 1) notes.push(t(corpusChosen() ? "evidence.onepaper" : "evidence.onepaper.all"));
  const hasYear = p => p.year !== null && p.year !== "" && Number.isFinite(Number(p.year));
  const years = papers.filter(([, p]) => hasYear(p)).map(([, p]) => Number(p.year));
  if (years.length !== papers.length) {
    notes.push(t("evidence.year.unavailable").replace("{n}", papers.length - years.length));
  } else if (papers.length) {
    const oldest = Math.min(...years), newest = Math.max(...years);
    const _sel = corpusChosen();
    papers.filter(([, p]) => hasYear(p) && Number(p.year) === oldest)
          .forEach(([id]) => add(id, t(_sel ? "evidence.oldest" : "evidence.oldest.all")));
    papers.filter(([, p]) => hasYear(p) && Number(p.year) === newest)
          .forEach(([id]) => add(id, t(_sel ? "evidence.newest" : "evidence.newest.all")));
    const oldTies = papers.filter(([, p]) => hasYear(p) && Number(p.year) === oldest).length;
    const newTies = papers.filter(([, p]) => hasYear(p) && Number(p.year) === newest).length;
    if (oldTies > 1) notes.push(t("evidence.oldest.tie").replace("{n}", oldTies).replace("{y}", oldest));
    if (newTies > 1 && newest !== oldest) notes.push(t("evidence.newest.tie").replace("{n}", newTies).replace("{y}", newest));
  }

  const cited = papers.filter(([, p]) => p.citations && Number.isFinite(Number(p.citations.count)));
  if (cited.length !== papers.length) {
    notes.push(t("evidence.cited.unavailable")
      .replace("{n}", papers.length - cited.length).replace("{all}", papers.length));
  } else if (cited.length) {
    const max = Math.max(...cited.map(([, p]) => Number(p.citations.count)));
    cited.filter(([, p]) => Number(p.citations.count) === max)
      .forEach(([id]) => add(id, t(corpusChosen() ? "evidence.cited" : "evidence.cited.all")));
  }
  return { byPaper, papers, badges, notes };
}

/* ---------- attested-use coverage ---------------------------------------------------
   This is deliberately NOT the art/game benchmark.  The corpus supplies positive attested
   uses, while the visitor supplies the definition-versus-use judgements.  With no independent
   negatives there can be no TN, FP, MCC or bootstrap.  What this can answer is narrower and
   useful: which published uses would the wording leave out? */
const COVERAGE_KEY = "mtp_attested_coverage_v1";

function smallHash(text) {
  let h = 2166136261;
  for (let i = 0; i < String(text).length; i++) {
    h ^= String(text).charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function coverageAll() {
  try { return JSON.parse(localStorage.getItem(COVERAGE_KEY) || "{}"); } catch (_) { return {}; }
}

function coverageCases(definition, rows) {
  return rows.filter(row => !definition.sourcePaper || row.paper_id !== definition.sourcePaper);
}

function coverageRunKey(definition, rows) {
  const sourceHash = (((S.senseIndex || {}).source || {}).sha256 || "unversioned").slice(0, 16);
  const caseIds = rows.map(row => row.sense_id).sort().join("|");
  return [sourceHash, S.termPick && S.termPick.slug, smallHash(definition.text),
          definition.sourcePaper || "user", smallHash(caseIds)].join(":");
}

function coverageRun(definition, rows) {
  const key = coverageRunKey(definition, rows);
  const all = coverageAll();
  const saved = all[key];
  return { key, verdicts: (saved && saved.verdicts) || {} };
}

function saveCoverageRun(definition, rows, verdicts) {
  const key = coverageRunKey(definition, rows);
  const all = coverageAll();
  all[key] = {
    schema_version: "attested-use-coverage-1",
    term: S.termPick.slug,
    definition: definition.text,
    definition_source_sense: definition.senseId || null,
    definition_source_paper: definition.sourcePaper || null,
    corpus: [...S.selected].sort(),
    case_senses: rows.map(row => row.sense_id),
    verdicts,
    updated: new Date().toISOString(),
  };
  try { localStorage.setItem(COVERAGE_KEY, JSON.stringify(all)); } catch (_) {}
}

function coverageMetrics(rows, verdicts) {
  const counts = { covered: 0, omitted: 0, uncertain: 0, open: 0 };
  const papers = new Map();
  rows.forEach(row => {
    const value = verdicts[row.sense_id];
    if (value === "covered") counts.covered++;
    else if (value === "omitted") counts.omitted++;
    else if (value === "uncertain") counts.uncertain++;
    else counts.open++;
    if (!papers.has(row.paper_id)) papers.set(row.paper_id, { covered: 0, omitted: 0 });
    const paper = papers.get(row.paper_id);
    if (value === "covered") paper.covered++;
    if (value === "omitted") paper.omitted++;
  });
  const decided = counts.covered + counts.omitted;
  const paperRates = [...papers.values()].filter(paper => paper.covered + paper.omitted)
    .map(paper => paper.covered / (paper.covered + paper.omitted));
  return {
    ...counts,
    decided,
    caseRate: decided ? counts.covered / decided : null,
    paperRate: paperRates.length ? paperRates.reduce((a, b) => a + b, 0) / paperRates.length : null,
    papersDecided: paperRates.length,
  };
}

function evidenceOwnHTML() {
  const canCover = S.capability === CAPABILITY.COVERAGE;
  return `<button class="pt-btn evidence-add" id="evidenceAddOwn">+ ${esc(t("evidence.add"))}</button>` +
    `<div class="coverage-own" id="evidenceOwnBox" hidden>` +
      `<label for="coverageOwnText">${esc(t("coverage.own.label"))}</label>` +
      `<textarea id="coverageOwnText" rows="3"></textarea>` +
      `<div class="pt-tools">` +
        (canCover ? `<button class="pt-btn" id="coverageOwnStart">${esc(t("coverage.own.test"))}</button>` : "") +
        `<button class="pt-btn" id="evidenceSaveOwn">${esc(t("coverage.own.save"))}</button>` +
      `</div>` +
      (!canCover ? `<div class="coverage-limit">${esc(t("coverage.unavailable.one"))}</div>` : "") +
    `</div>`;
}

function externalDefinitionEntry() {
  if (!S.termPick || !S.externalDefinitions) return null;
  const providers = S.externalDefinitions.external_definitions || {};
  for (const layer of Object.values(providers)) {
    const compact = layer && layer.terms && layer.terms[S.termPick.id];
    if (!Array.isArray(compact) || !compact.length) continue;
    const posCodes = S.externalDefinitions.pos_codes || {};
    const definitions = compact.map(row => ({
      pos: posCodes[row[0]] || row[0],
      synset_offset: row[1],
      sense_keys: [row[2]],
      gloss: row[3],
    }));
    const withheld = new Set(
      ((S.externalDefinitions.corpus_definition_visibility || {}).withheld_term_ids) || []
    );
    const corpusStatus = senseIndicesForSlug(S.termPick.slug).length
      ? "available" : withheld.has(S.termPick.id) ? "withheld" : "absent";
    return {
      provider: layer.provider || {},
      term: { definitions, corpus_definition_status: corpusStatus },
    };
  }
  return null;
}

function externalDefinitionsHTML(corpusRowCount) {
  const entry = externalDefinitionEntry();
  if (!entry) return "";
  const provider = entry.provider;
  const definitions = entry.term.definitions || [];
  const checked = S.externalEnabled ? " checked" : "";
  const sourceLabel = `${provider.name || "WordNet"} ${provider.version || ""}`.trim();
  const source = `<a href="${escAttr(provider.source_page || provider.source_uri || "#")}" ` +
    `target="_blank" rel="noopener">${esc(sourceLabel)}</a>`;
  const licence = `<a href="${escAttr(provider.licence_uri || "#")}" target="_blank" ` +
    `rel="noopener">${esc(provider.licence_spdx || "licence")}</a>`;
  const notice = `<a href="../data/${escAttr(provider.licence_notice_path || "WORDNET_LICENSE.txt")}" ` +
    `target="_blank" rel="noopener">${esc(t("external.notice"))}</a>`;
  const meta = `${esc(t("external.source"))}: ${source} · ${esc(t("external.licence"))}: ${licence} · ${notice}`;
  const cards = !S.externalEnabled ? "" : definitions.map((definition, index) => {
    const keys = (definition.sense_keys || []).join(", ");
    const rival = corpusRowCount === 1
      ? `<span class="external-rival">${esc(t("external.rival"))}</span>` : "";
    return `<article class="external-definition-card" data-external-definition="${index}">` +
      `<div class="external-card-head">${rival}<span>${esc(definition.pos || "")}</span></div>` +
      `<h4 dir="ltr">${esc(definition.gloss || "")}</h4>` +
      `<div class="external-card-source">${meta}</div>` +
      `<div class="sense-locator" dir="ltr">WordNet 3.0 · synset ${esc(definition.synset_offset || "")} · ${esc(keys)}</div>` +
      `</article>`;
  }).join("");
  const state = S.externalEnabled
    ? `<div class="external-count">${esc(t("external.senses").replace("{n}", definitions.length))}</div>${cards}`
    : `<div class="external-off">${esc(t("external.off"))}</div>`;
  return `<section class="external-definitions ${S.externalEnabled ? "is-on" : "is-off"}">` +
    `<div class="external-heading"><span>${esc(t("external.heading"))}</span></div>` +
    `<label class="external-optin"><input id="externalDefinitionsToggle" type="checkbox"${checked}>` +
      `<span>${esc(t("external.optin"))}</span></label>` +
    `<div class="external-meta">${meta}</div>` +
    `<div class="external-separation">${esc(t("external.separation"))}</div>` + state + `</section>`;
}

function renderCoverageWorkbench(rows) {
  if (S.capability !== CAPABILITY.COVERAGE) return "";
  const paperCount = new Set(rows.map(row => row.paper_id)).size;
  if (paperCount < 2) {
    return `<section class="coverage-workbench unavailable"><h3>${esc(t("coverage.h"))}</h3>` +
      `<p>${esc(t("coverage.need.two"))}</p></section>`;
  }
  const definition = S.coverageDef;
  if (!definition) {
    return `<section class="coverage-workbench"><span class="screen-kicker">${esc(t("coverage.screen"))}</span>` +
      `<h3>${esc(t("coverage.h"))}</h3><p>${esc(t("coverage.choose"))}</p>` +
      `<div class="coverage-warning">${esc(t("coverage.warning"))}</div></section>`;
  }
  const cases = coverageCases(definition, rows);
  if (!cases.length) {
    return `<section class="coverage-workbench unavailable"><h3>${esc(t("coverage.h"))}</h3>` +
      `<p>${esc(t("coverage.no.heldout"))}</p></section>`;
  }
  const run = coverageRun(definition, cases);
  const metrics = coverageMetrics(cases, run.verdicts);
  const pct = value => value == null ? "—" : `${Math.round(value * 100)}%`;
  const sourceNote = definition.sourcePaper
    ? `<div class="coverage-source">${esc(t("coverage.source.excluded")
        .replace("{paper}", ((S.senseIndex.papers || {})[definition.sourcePaper] || {}).title || definition.sourcePaper))}</div>`
    : `<div class="coverage-source">${esc(t("coverage.source.user"))}</div>`;
  const summary = `<div class="coverage-summary">` +
    `<div><b>${pct(metrics.caseRate)}</b><span>${esc(t("coverage.caseweighted"))}</span></div>` +
    `<div><b>${pct(metrics.paperRate)}</b><span>${esc(t("coverage.paperweighted"))}</span></div>` +
    `<div><b>${metrics.covered}/${metrics.decided}</b><span>${esc(t("coverage.covered"))}</span></div>` +
    `<div><b>${metrics.uncertain}</b><span>${esc(t("coverage.uncertain"))}</span></div>` +
    `</div>`;
  const caseCards = cases.map(row => {
    const paper = (S.senseIndex.papers || {})[row.paper_id] || {};
    const selected = run.verdicts[row.sense_id] || "";
    const button = (value, label) => `<button class="pt-btn coverage-v ${selected === value ? "on" : ""}" ` +
      `data-coverage-case="${escAttr(row.sense_id)}" data-v="${value}" aria-pressed="${selected === value}">${esc(label)}</button>`;
    return `<article class="coverage-case"><div class="coverage-case-head">${esc(row.gloss || row.label)}</div>` +
      `<blockquote>${esc(row.evidence)}</blockquote>` +
      `<div class="coverage-case-paper">${esc(paper.title || row.paper_id)} · ${esc(String(paper.year || "—"))}</div>` +
      `<div class="pt-tools">${button("covered", t("coverage.v.covered"))}` +
        `${button("omitted", t("coverage.v.omitted"))}${button("uncertain", t("coverage.v.uncertain"))}</div></article>`;
  }).join("");
  return `<section class="coverage-workbench"><span class="screen-kicker">${esc(t("coverage.screen"))}</span>` +
    `<h3>${esc(t("coverage.h"))}</h3><div class="coverage-definition">${esc(definition.text)}</div>` +
    sourceNote + summary + `<div class="coverage-warning">${esc(t("coverage.warning"))}</div>` +
    `<div class="coverage-actions"><button class="pt-btn" id="coverageReset">${esc(t("coverage.reset"))}</button></div>` +
    `<div class="coverage-cases">${caseCards}</div></section>`;
}

function renderEvidenceWorkspace() {
  const out = document.getElementById("offered");
  if (!out || !S.termPick) return;
  const next = document.getElementById("nextline");
  if (next) next.hidden = true;
  const acts = document.getElementById("acts");
  if (acts) acts.hidden = true;
  const live = document.getElementById("liveMatrix");
  if (live) live.style.display = "none";

  const index = S.senseIndex || {};
  const allRows = (S.termPick.senseIndices || []).map(i => index.senses && index.senses[i])
    .filter(Boolean);
  // SHOW THE DEFINITIONS. Shir, 2026-09-03: "the users interest is in the DIFFERENT
  // DEFINITIONS." A visitor who picked `attention` was told "this term has 11 grounded senses
  // in the index, but none comes from the papers you selected" -- while step 2 beside it read
  // "494 papers in this term's corpus". The board held all eleven and showed none, because
  // this line filters them to a selection the visitor has not made yet.
  //
  //     THE FILTER IS RIGHT ONCE A CORPUS IS CHOSEN AND WRONG BEFORE IT. Filtering to an
  //     empty set is not "no results", it is "you have not asked yet", and the page said the
  //     first while displaying the second.
  //
  // 1,234 of the 8,626 terms in the index carry two or more rival senses -- attention has 11,
  // covid-19 11, deep-learning 11, bias 9. Every one of them was reachable and blank.
  const chosenCorpus = S.pickedCorpus && S.selected.size > 0;
  const rows = chosenCorpus
    ? allRows.filter(row => S.selected.has(row.paper_id))
    : allRows;
  const info = capabilityInfo(S.capability);
  const reportCounts = index.counts || {};
  const external = externalDefinitionEntry();
  const availability = external && external.term.corpus_definition_status;

  if (!rows.length) {
    out.innerHTML = `<section class="evidence-workspace"><div class="evidence-head">` +
      `<span class="cap-badge">${esc(info.title)}</span><h2>${esc(S.termPick.label)}</h2></div>` +
      `<div class="evidence-empty">${allRows.length
        ? t("evidence.none.selected").replace("{n}", allRows.length)
        : availability === "withheld"
          ? t("external.corpus.withheld")
          : external ? t("external.no.corpus") : t("evidence.none.term")}</div>` +
      externalDefinitionsHTML(rows.length) + evidenceOwnHTML() + renderCoverageWorkbench(rows) + `</section>`;
  } else {
    const plan = evidenceSelectorPlan(rows);
    const paperById = new Map(plan.papers);
    const defaultIds = new Set([...plan.badges].filter(([, b]) => b.length).map(([id]) => id));
    const ordered = plan.papers.sort((a, b) =>
      Number(defaultIds.has(b[0])) - Number(defaultIds.has(a[0]))
      || Number(a[1].year || 9999) - Number(b[1].year || 9999)
      || String(a[1].title || a[0]).localeCompare(String(b[1].title || b[0])));
    const cards = ordered.map(([paperId, paper]) => {
      const defaults = (plan.badges.get(paperId) || []).map(x =>
        `<span class="sense-default">${esc(x)}</span>`).join("");
      const who = (paper.authors || []).join(", ");
      const citation = paper.citations
        ? ` · ${esc(t("evidence.citation"))}: <span class="num">${Number(paper.citations.count).toLocaleString()}</span>`
        : "";
      // OUR PAGE FIRST, exactly as paperLink() has done since 2026-08-19 -- this one call site
      // never went through it. Every definition card offered `open source`, straight to the
      // publisher, for 248 of the 273 papers behind the terms the showcase now advertises:
      // a paywall in place of a tagged page we publish ourselves.
      //
      //     A LINK TO THE WRONG PLACE IS SILENT WHERE A DEAD ONE IS LOUD. doi.org resolves
      //     perfectly. Fourth instance of this today, and the first on the platform.
      //
      // The showcase page carries the same quotation in its tag layer and links onward to the
      // publisher itself, so nothing is taken away from a reader who wants the original.
      // `paperId`, not `row.paper_id`: this block is the PAPER scope and `row` is the sense
      // inside it, declared further down. The driver caught it on the first run -- 0 cards,
      // 1 JS error -- which is what driving a page instead of reading it is for.
      const ourPage = showcaseHref(paperId);
      const source = (ourPage || paper.source_url)
        ? `<a class="pt-btn tiny" href="${escAttr(ourPage || paper.source_url)}" target="_blank" rel="noopener">${esc(t(ourPage ? "evidence.ourpage" : "evidence.source"))}</a>`
        : "";
      const senses = (plan.byPaper.get(paperId) || []).map(row => {
        const loc = row.locator || {};
        // Anchor offsets are UNICODE CODE POINT indices -- they are produced in Python.
        // JavaScript indexes strings in UTF-16 code units, so ANY future code that resolves
        // these into text must not use body.slice(start, end): a non-BMP character is one code
        // point and two UTF-16 units, and 698 of the corpus's 63,899 anchors shift under UTF-16.
        // Use codePointSlice(body, start, end) instead.
        // It fails SILENTLY -- the wrong span is still a plausible sentence and no verbatim
        // check compares it to anything. Positive control: schlemper2019-attention-gated-networks
        // has ONE such glyph and 52 of its 75 anchors move.
        // Today this line only DISPLAYS the numbers; the derived locator records the convention.
        const locator = loc.start != null
          ? `${row.source_field} · ${t("evidence.chars")} ${loc.start}–${loc.end} · SHA-1 ${String(loc.text_sha1 || "").slice(0, 12)}`
          : row.source_field;
        return `<article class="sense-card" id="${esc(row.sense_id)}">` +
          `<h4>${esc(row.gloss || row.label)}</h4>` +
          `<div class="sense-provenance">${esc(t("evidence.gloss.note"))}</div>` +
          `<blockquote dir="ltr"><span class="sense-quote-label">${esc(t("evidence.quote"))}</span>` +
            `${esc(row.evidence)}</blockquote>` +
          `<div class="sense-locator">${esc(locator)}</div>` +
          (S.capability === CAPABILITY.COVERAGE
            ? `<button class="pt-btn tiny sense-test" data-coverage-def="${escAttr(row.sense_id)}">${esc(t("coverage.test.this"))}</button>`
            : "") + `</article>`;
      }).join("");
      return `<section class="sense-paper ${defaults ? "is-default" : ""}">` +
        `<div class="sense-defaults">${defaults}</div>` +
        `<h3>${esc(paper.title || paperId)}</h3>` +
        `<div class="sense-meta"><span class="num">${esc(String(paper.year || "—"))}</span>` +
          ` · ${esc(paper.discipline || "uncategorised")}${who ? ` · ${esc(who)}` : ""}${citation} ${source}</div>` +
        senses + `</section>`;
    }).join("");
    const notes = plan.notes.length
      ? `<div class="selector-notes">${plan.notes.map(n => `<div>${n}</div>`).join("")}</div>` : "";
    out.innerHTML = `<section class="evidence-workspace"><div class="evidence-head">` +
      `<span class="cap-badge">${esc(info.title)}</span><h2>${esc(S.termPick.label)}</h2>` +
      // HOW MANY FIELDS DISAGREE is the sentence this project exists to say, and the summary
      // counted only definitions and papers. attention: 11 definitions, 10 papers, 9 fields.
      `<p>${t(chosenCorpus ? "evidence.summary" : "evidence.summary.all")
              .replace("{s}", rows.length).replace("{p}", plan.papers.length)
              .replace("{f}", new Set(rows.map(r => (paperById.get(r.paper_id) || {}).discipline)
                                          .filter(Boolean)).size)}</p>` +
      // Say WHICH set is on screen. Without a corpus chosen these are every definition the
      // term has; with one they are the subset from those papers. The same count with two
      // different meanings is how a reader mistakes one for the other.
      (chosenCorpus ? "" : `<p class="evidence-scope">${esc(t("evidence.all.corpus"))}</p>`) +
      `</div>` +
      // THE DEFINITIONS COME FIRST. Measured on ?term=attention: the first definition sat at
      // y=859 on a 900px screen -- one full screen down, behind 180 words of framing:
      // "no independent negatives", "not a benchmark score", "no TN, FP, MCC, confusion
      // matrix or bootstrap here". Shir, 2026-09-03: "TOO MUCH TEXT ON THE SCREEN AND THE
      // IMPORTANT TEXT IS NOT SHOWN ... THE USER'S INTEREST IS IN THE DIFFERENT DEFINITIONS."
      //
      // Nothing is removed. The coverage workbench is what makes this tool honest about what
      // it cannot measure, and it keeps every word -- it moves BELOW the definitions, which
      // is where a caveat belongs relative to the thing it qualifies.
      notes + evidenceOwnHTML() +
      // THE WORDINGS TOGETHER, BEFORE THE FULL CARDS. Measured on attention: the 11
      // definitions sat 488px apart, y=808 to y=5364 -- 4.6 screens to see them all. The
      // copy promised "side by side" and the page delivered one every other screen, because
      // each wording carries its full attesting passage beneath it.
      //
      // Nothing is duplicated in substance: this is the same gloss text, listed, each row a
      // link to its own card lower down. The passages stay where they are -- they are the
      // evidence, and evidence belongs with the claim, not in a comparison list.
      // plan.papers is a list of [id, paper] entries; a Map of it is the lookup this needs.
      // `plan.byId` was something I assumed rather than checked, and it does not exist.
      (rows.length > 1
        ? `<div class="compare-head">${esc(t("evidence.compare").replace("{n}", rows.length))}</div>` +
          `<ol class="compare-list">` + rows.map(row => {
            const paper = paperById.get(row.paper_id) || {};
            const meta = [paper.year, paper.discipline].filter(Boolean).join(" · ");
            return `<li><a href="#${escAttr(row.sense_id)}">${esc(row.gloss || row.label)}</a>` +
                   (meta ? `<span class="compare-src">${esc(meta)}</span>` : "") + `</li>`;
          }).join("") + `</ol>`
        : "") +
      `<div class="sense-all-head">${esc(t(chosenCorpus ? "evidence.all" : "evidence.all.all"))}</div>${cards}` +
      renderCoverageWorkbench(rows) +
      externalDefinitionsHTML(rows.length) +
      `<div class="sense-audit">${t("evidence.audit")
        .replace("{active}", reportCounts.sense_rows_active || "—")
        .replace("{hard}", reportCounts.hard_parse_failures || "—")
        .replace("{ambig}", reportCounts.delimiter_ambiguities || "—")}` +
        ` <a href="../data/sense_index_report.md" target="_blank" rel="noopener">${esc(t("evidence.audit.link"))}</a></div>` +
      `</section>`;
  }
  const externalToggle = document.getElementById("externalDefinitionsToggle");
  if (externalToggle) externalToggle.onchange = () => {
    S.externalEnabled = externalToggle.checked;
    renderEvidenceWorkspace();
    const layer = document.querySelector(".external-definitions");
    if (layer) layer.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };
  const add = document.getElementById("evidenceAddOwn");
  if (add) add.onclick = () => {
    const box = document.getElementById("evidenceOwnBox");
    if (!box) return;
    box.hidden = !box.hidden;
    if (!box.hidden) document.getElementById("coverageOwnText").focus();
  };
  const saveOwn = document.getElementById("evidenceSaveOwn");
  if (saveOwn) saveOwn.onclick = () => {
    const text = (document.getElementById("coverageOwnText").value || "").trim();
    if (!text) return;
    const panel = document.getElementById("pOwn");
    if (!panel) return;
    const ownText = document.getElementById("ownText");
    if (ownText) ownText.value = text;
    document.querySelectorAll(".panel").forEach(x => x.classList.remove("open"));
    panel.classList.add("open");
    document.querySelectorAll('[data-panel="pOwn"]').forEach(b => b.setAttribute("aria-expanded", "true"));
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const ownStart = document.getElementById("coverageOwnStart");
  if (ownStart) ownStart.onclick = () => {
    const text = (document.getElementById("coverageOwnText").value || "").trim();
    if (!text) return;
    S.coverageDef = { id: "user-" + smallHash(text), text, sourcePaper: null, senseId: null };
    renderEvidenceWorkspace();
    document.querySelector(".coverage-workbench").scrollIntoView({ behavior: "smooth", block: "start" });
  };
  document.querySelectorAll("[data-coverage-def]").forEach(button => {
    button.onclick = () => {
      const row = rows.find(item => item.sense_id === button.dataset.coverageDef);
      if (!row) return;
      S.coverageDef = { id: row.sense_id, text: row.gloss || row.label,
                        sourcePaper: row.paper_id, senseId: row.sense_id };
      renderEvidenceWorkspace();
      document.querySelector(".coverage-workbench").scrollIntoView({ behavior: "smooth", block: "start" });
    };
  });
  document.querySelectorAll("[data-coverage-case]").forEach(button => {
    button.onclick = () => {
      const definition = S.coverageDef;
      if (!definition) return;
      const cases = coverageCases(definition, rows);
      const run = coverageRun(definition, cases);
      run.verdicts[button.dataset.coverageCase] = button.dataset.v;
      saveCoverageRun(definition, cases, run.verdicts);
      renderEvidenceWorkspace();
    };
  });
  const reset = document.getElementById("coverageReset");
  if (reset) reset.onclick = () => {
    const definition = S.coverageDef;
    if (!definition) return;
    const cases = coverageCases(definition, rows);
    saveCoverageRun(definition, cases, {});
    renderEvidenceWorkspace();
  };
}

/* Keyboard: the reference tool is fully driveable without a mouse and so is this. */
function conceptKey(ev) {
  const box = document.getElementById("conceptResults");
  const open = box && box.classList.contains("open");
  const hits = S.hits || [];
  if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
    ev.preventDefault();
    if (!open) { openConcepts(true); renderConcepts(); return; }
    S.sel = Math.max(0, Math.min(hits.length - 1,
      (S.sel || 0) + (ev.key === "ArrowDown" ? 1 : -1)));
    renderConcepts();
    const sel = box.querySelector(".ac-item.sel");
    if (sel) sel.scrollIntoView({ block: "nearest" });
  } else if (ev.key === "Enter") {
    const c = hits[S.sel || 0];
    if (!c) return;
    ev.preventDefault();
    openConcepts(false);
    if (c.state === "ready") switchConcept(c.id);
    else chooseSoon(c.id);
  } else if (ev.key === "Escape") {
    openConcepts(false);
  }
}

/* The download list, read from the concept's own manifest. The manifest is the contract the
   build already enforces against the directory, so listing from it means the buttons cannot
   offer a file that is not there, and cannot omit one that is. */
function renderDownloads() {
  const box = document.getElementById("dlList");
  if (!box) return;
  const dir = conceptDir(conf());
  const files = Object.keys((S.manifest && S.manifest.files) || {}).concat(["manifest.json"]);
  box.innerHTML = [...new Set(files)].sort().map(f =>
    `<a class="pt-btn" href="${dir}${esc(f)}" download>${esc(f)}</a>`).join("");
}

async function switchConcept(id) {
  const c = S.registry.find(x => x.id === id);
  // Only a concept with a board can be loaded. A corpus-only term reaching here would fetch
  // a directory that does not exist and blank the screen, so it is refused at the door.
  if (!c || c.state !== "ready") return;
  // Loading a real definition board ends term mode, or the green button would keep showing
  // the previous term's papers under the new concept's name.
  S.termPick = null;
  S.coverageDef = null;
  S.featureSelection = new Set();
  S.selected.clear();
  S.pickedCorpus = false;
  S.capability = CAPABILITY.BENCHMARK;
  const stage = document.getElementById("stage2");
  if (stage) stage.hidden = true;
  const soon = document.getElementById("conceptSoon");
  if (soon) { soon.classList.remove("open"); soon.innerHTML = ""; }
  const note0 = document.getElementById("conceptNote");
  if (note0) note0.style.display = "";
  ["liveStats", "stateBar"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "";
  });
  S.concept = id;
  // The old corpus selection is a list of paper ids that do not exist in the new concept, and
  // the `c` bitmask in the URL is indexed against the old paper list. Both have to go, or the
  // new board opens with an empty corpus and looks broken.
  writeURL(true);
  await loadConcept();
  refresh();
}

/* The two step buttons must always say what is currently chosen. */
function renderSteps() {
  // When a tagged term is the current pick, BOTH buttons must follow it. Shir chose a term,
  // pressed the green button, and got art's 29 papers - because the buttons still described
  // the loaded definition board rather than the thing she had just chosen.
  const cv = document.getElementById("conceptVal");
  if (cv) cv.textContent = S.termPick ? S.termPick.label
                        : (S.capability ? conceptLabel(conf()) : t("step.nopick"));
  const pv = document.getElementById("corpusVal");
  if (pv) {
    if (S.termPick) {
      // Until something is ticked this says how many papers the TERM has, which is the number
      // the visitor came for; once anything is ticked it says how many THEY chose. Printing the
      // corpus size under the word "selected" was true only while the rows could not be ticked.
      const k = S.selected.size;
      pv.textContent = k ? t("corpus.npapers").replace("{n}", k)
                         : t("corpus.navail").replace("{n}", S.termPick.ids.length);
    } else {
      // "all {n} papers" is gone. It named the 29 that carried verdicts as though they were the
      // corpus, which is the label Shir asked to remove: the corpus is whatever she picked, and
      // the count of judged ones belongs beside the number it affects, not in the button.
      const n = S.selected.size;
      pv.textContent = n === 0 ? t("corpus.nopick")
                               : t("corpus.npapers").replace("{n}", n);
    }
  }
}

/* ---------- your own definition ----------
   There is no server. Everything here happens on the visitor's machine, and the wording on
   screen says so rather than implying a submission that never happens.

   Every saved record carries a name and an ISO timestamp, because that is the only thing
   that actually protects a definition. A one-sentence definition is too short and too
   functional for copyright to attach, so what establishes ownership is priority: a dated
   record bearing a name. The download button exists so the visitor holds that record
   themselves rather than trusting us to hold it - we cannot, there is nowhere to hold it. */
function ownAll() {
  try { return JSON.parse(localStorage.getItem("mtp_own") || "[]"); } catch (_) { return []; }
}

function ownVis() {
  const r = document.querySelector('input[name="ownVis"]:checked');
  return r ? r.value : "private";
}


/* The stored timestamp is ISO 8601 in UTC, which is right for a record of priority and wrong
   to show to a person unlabelled: a definition saved at 20:15 in Israel displayed as 17:15,
   three hours before it was written. The file keeps UTC; the screen shows local time, and the
   UTC original is on the tooltip so nothing is hidden. */
function localWhen(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return String(iso).slice(0, 16).replace("T", " ");
  const p2 = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ` +
         `${p2(d.getHours())}:${p2(d.getMinutes())}`;
}


/* ---------- JUDGE YOUR OWN DEFINITION ----------
   Shir: "there I can insert a definition and ask for its score relative to the given corpus."

   The automatic route needs a judged column per criterion, and that run has not happened yet.
   This is not a substitute for it: it is the SAME job every other column on this board was
   made by -- a person reading the thing and the sentence the literature decided it in, and
   saying yes or no. The verdicts go through scoreDef's arithmetic unchanged, so a definition
   judged here is comparable with the rest of THIS run and with nothing else.

   The gold labels are never shown while judging. A scorer who can see the answer is measuring
   their own agreeableness. */
const JKEY = "mtp_judge_v2";

function judgeAll() {
  try { return JSON.parse(localStorage.getItem(JKEY) || "{}"); } catch (_) { return {}; }
}

function judgeDefinition() {
  return ((document.getElementById("judgeText") || {}).value || "").trim();
}

function judgeRunKey() {
  const definition = judgeDefinition();
  if (!definition) return null;
  const q = judgeQueue();
  const caseIdentity = q.map(index => {
    const row = S.cases[index] || {};
    return row.id || `${row.paper || ""}|${row.thing || ""}|${smallHash(row.quote || "")}`;
  }).join(";");
  const version = (S.manifest && S.manifest.built) || "unversioned";
  return [S.concept, version, smallHash(definition), smallHash(caseIdentity),
          smallHash([...S.selected].sort().join("|"))].join(":");
}

function judgeState() {
  const key = judgeRunKey();
  if (!key) return { key: null, verdicts: {} };
  const record = judgeAll()[key];
  return { key, verdicts: (record && record.verdicts) || {} };
}

function judgeSave(verdicts) {
  const key = judgeRunKey();
  if (!key) return;
  const all = judgeAll();
  all[key] = {
    schema_version: "definition-bound-judge-2",
    definition: judgeDefinition(),
    concept: S.concept,
    corpus: [...S.selected].sort(),
    case_set: judgeQueue().map(index => index),
    case_set_version: (S.manifest && S.manifest.built) || null,
    prediction_provenance: "visitor judgement, gold label hidden",
    verdicts,
    updated: new Date().toISOString(),
  };
  try { localStorage.setItem(JKEY, JSON.stringify(all)); } catch (_) {}
}

function judgeResetCurrent() {
  const key = judgeRunKey();
  if (!key) return;
  const all = judgeAll();
  delete all[key];
  try { localStorage.setItem(JKEY, JSON.stringify(all)); } catch (_) {}
}

/* ---------- transparent feature / sub-term mapping ---------------------------------
   Arbitrary prose cannot be decomposed honestly by a static browser.  The API-free path is
   therefore confirmation, not inference: the visitor identifies which reviewed feature their
   wording requires.  The object layer is separate from the fourteen art criteria (it is a
   genus/type commitment), and the interface keeps those layers visibly separate. */
function featureInventory() {
  if (S.termPick || S.capability !== CAPABILITY.BENCHMARK) return [];
  const concept = (((S.subtermIndex || {}).concepts || {})[S.concept]) || {};
  const reviewed = (concept.reviewed_terms || []).map(row => ({
    key: `subterm:${row.id}`, id: row.id, layer: "subterm",
    label: LANG === "he" ? (row.label_he || row.label_en) : row.label_en,
    row,
  }));
  const criteria = (S.criteria || []).map(row => ({
    key: `criterion:${row.id}`, id: row.id, layer: "criterion",
    label: LANG === "he" ? (row.he || row.en) : row.en,
    row,
  }));
  return reviewed.concat(criteria);
}

function selectedFeatureMap() {
  const selected = featureInventory().filter(row => S.featureSelection.has(row.key));
  return {
    method: "user-confirmed; no automatic semantic inference",
    features: selected.map(row => ({ id: row.id, layer: row.layer, label: row.label })),
  };
}

function featureCaseRow(row) {
  const c = S.cases[row.case_index];
  if (!c) return "";
  const verdict = row.object_layer_verdict;
  const label = verdict === "object" ? t("feature.v.object")
    : verdict === "not-object" ? t("feature.v.notobject") : t("feature.v.undecided");
  return `<div class="pt-case feature-case"><span class="th">${esc(
      LANG === "he" ? (c.thing_he || c.thing) : (c.thing || c.thing_he))}</span>` +
    `<span class="feature-v ${escAttr(verdict)}">${esc(label)}</span>` +
    `<div class="q" dir="ltr">"${esc(c.quote)}"</div>` +
    `<div class="src">${esc(t("case.paper"))}: ${esc(c.paper)} · ${esc(t("case.case"))} #${row.case_index}</div></div>`;
}

function renderFeatureMap() {
  const ownText = document.getElementById("ownText");
  if (!ownText) return;
  let box = document.getElementById("ownFeatureMap");
  if (!box) {
    box = document.createElement("section");
    box.id = "ownFeatureMap";
    box.className = "feature-map";
    ownText.insertAdjacentElement("afterend", box);
  }

  if (S.termPick || S.capability !== CAPABILITY.BENCHMARK) {
    box.innerHTML = `<h3>${esc(t("feature.h"))}</h3><div class="feature-limit">${esc(
      t("feature.unavailable.term"))}</div>`;
    return;
  }

  const concept = (((S.subtermIndex || {}).concepts || {})[S.concept]) || {};
  const items = featureInventory();
  if (!items.length) {
    box.innerHTML = `<h3>${esc(t("feature.h"))}</h3><div class="feature-limit">${esc(
      t("feature.unavailable.concept"))}</div>`;
    return;
  }

  const itemHTML = item => `<label class="feature-row ${item.layer}">` +
    `<input type="checkbox" data-feature-key="${escAttr(item.key)}" ${S.featureSelection.has(item.key) ? "checked" : ""}>` +
    `<span><b>${esc(item.label)}</b><small>${esc(item.layer === "subterm"
      ? t("feature.layer.subterm") : t("feature.layer.criterion"))}</small></span></label>`;
  const subterms = items.filter(row => row.layer === "subterm");
  const criteria = items.filter(row => row.layer === "criterion");
  const mapped = selectedFeatureMap();
  const answer = mapped.features.length
    ? t("feature.answer").replace("{features}", mapped.features.map(row => row.label).join(", "))
    : t("feature.none");

  let objectEvidence = "";
  const objectItem = subterms.find(row => row.id === "object");
  if (objectItem && S.featureSelection.has(objectItem.key)) {
    const overlap = objectItem.row.public_case_overlap || {};
    const rows = (overlap.cases || []).filter(row => {
      const c = S.cases[row.case_index];
      return c && S.selected.has(c.paper);
    });
    objectEvidence = `<div class="feature-evidence"><b>${esc(t("feature.object.overlap")
      .replace("{n}", rows.length).replace("{all}", overlap.matched || 0))}</b>` +
      `<div>${esc(t("feature.object.source")
        .replace("{p}", objectItem.row.source_counts.object)
        .replace("{n}", objectItem.row.source_counts.not_object)
        .replace("{u}", objectItem.row.source_counts.undecided))}</div>` +
      `<div class="feature-limit">${esc(t("feature.object.limit"))}</div>` +
      (rows.length ? `<details><summary>${esc(t("feature.cases").replace("{n}", rows.length))}</summary>` +
        rows.map(featureCaseRow).join("") + `</details>` : "") + `</div>`;
  }

  box.innerHTML = `<h3>${esc(t("feature.h"))}</h3><p>${esc(t("feature.body"))}</p>` +
    subterms.map(itemHTML).join("") +
    (criteria.length ? `<details class="feature-criteria"><summary>${esc(t("feature.criteria")
      .replace("{n}", criteria.length))}</summary>${criteria.map(itemHTML).join("")}</details>` : "") +
    `<div class="feature-answer">${esc(answer)}</div>${objectEvidence}` +
    (Number(concept.criterion_verdict_columns || 0) === 0
      ? `<div class="feature-limit">${esc(t("feature.no.columns"))}</div>` : "");

  box.querySelectorAll("input[data-feature-key]").forEach(input => {
    input.addEventListener("change", () => {
      if (input.checked) S.featureSelection.add(input.dataset.featureKey);
      else S.featureSelection.delete(input.dataset.featureKey);
      renderFeatureMap();
    });
  });
}

function judgeQueue() {
  return corpusCases().judged;
}

function renderJudge() {
  const card = document.getElementById("judgeCard");
  const out = document.getElementById("judgeScore");
  if (!card || !out) return;
  const he = LANG === "he";
  const definition = judgeDefinition();
  if (!definition) {
    card.innerHTML = `<div class="pt-note">${esc(t("judge.definition.required"))}</div>`;
    out.innerHTML = "";
    return;
  }
  const run = judgeState();
  const st = run.verdicts;
  const q = judgeQueue();
  if (!q.length) {
    card.innerHTML = `<div class="pt-note">${he
      ? "בחרי קורפוס קודם — בכפתור 2." : "Choose a corpus first, with button 2."}</div>`;
    out.innerHTML = "";
    return;
  }
  // find() returns the case INDEX, and the first case in the queue is index 0, which is
  // falsy. `if (!next)` therefore reported "done, 355 cases" before a single case had
  // been judged. Compare against undefined, which is the only value that means "none".
  const next = q.find(i => !(i in st));
  const finished = next === undefined;

  // the score so far, through the same arithmetic as every other definition
  let tp = 0, fp = 0, fn = 0, tn = 0;
  const scoredRows = [];
  q.forEach(i => {
    const v = st[i];
    if (v !== "1" && v !== "0") return;
    const gold = S.cases[i].status === "P", pred = v === "1";
    let kind;
    if (pred && gold) { tp++; kind = "tp"; }
    else if (pred) { fp++; kind = "fp"; }
    else if (gold) { fn++; kind = "fn"; }
    else { tn++; kind = "tn"; }
    scoredRows.push({ i, kind });
  });
  const done = tp + fp + fn + tn;
  const m = mcc(tp, fp, fn, tn);
  const metricNote = m === null
    ? `<div class="judge-validity warn">${esc(t("judge.mcc.unavailable"))}</div>`
    : (done < q.length
      ? `<div class="judge-validity">${esc(t("judge.mcc.provisional"))}</div>` : "");

  out.innerHTML = done ? `
    <div class="lmwrap" style="margin-top:.8rem">
      <div class="lmcorner"></div>
      <div class="lmcolh">${he ? "הספרות: כן" : "literature: YES"}</div>
      <div class="lmcolh">${he ? "הספרות: לא" : "literature: NO"}</div>
      <div class="lmrowh">${he ? "אתם: כן" : "you: yes"}</div>
      ${liveCell("tp", tp, he ? "פגיעה" : "hit", "")}
      ${liveCell("fp", fp, he ? "אזעקת שווא" : "false alarm", "")}
      <div class="lmrowh">${he ? "אתם: לא" : "you: no"}</div>
      ${liveCell("fn", fn, he ? "פספוס" : "miss", "")}
      ${liveCell("tn", tn, he ? "דחייה נכונה" : "correct rejection", "")}
    </div>
    <div class="lmfoot">MCC <b class="ltr">${fmt(m)}</b> · ${he ? "על" : "over"}
      <span class="num">${done}</span> ${he ? "מקרים שהכרעת" : "cases you judged"}
      ${done < q.length ? ` · ${he ? "עוד" : ""} <span class="num">${q.length - done}</span> ${he ? "נותרו" : "to go"}` : ""}
      · ${he ? "בר-השוואה רק להרצה הזאת" : "comparable within this run only"}</div>
    ${metricNote}
    <div class="judge-bound">${esc(t("judge.bound").replace("{id}", run.key.slice(0, 28)))}</div>
    <div id="judgeCases"></div>` : "";

  if (done) {
    out.querySelectorAll(".lmcell").forEach(button => {
      button.addEventListener("click", () => {
        const kind = button.dataset.kind;
        const hits = scoredRows.filter(row => row.kind === kind);
        const cases = document.getElementById("judgeCases");
        cases.innerHTML = `<div class="lmcaseh" style="color:${LM[kind].d}">${kind.toUpperCase()} — ` +
          `<span class="num">${hits.length}</span> ${esc(t("judge.cases"))}</div>` +
          hits.map(row => caseRow(row)).join("");
      });
    });
  }

  if (finished) {
    card.innerHTML = `<div class="pt-note">${he
      ? `סיימת — ${q.length} מקרים.` : `Done — ${q.length} cases.`}</div>`;
  } else {
    const c = S.cases[next];
    if (!c) {
      card.innerHTML = `<div class="pt-note">${he
        ? "מקרה " + next + " לא נמצא בקורפוס הזה." : "case " + next + " is not in this corpus."}</div>`;
      return;
    }
    card.innerHTML = `
      <div class="jcard">
        <div class="jcount"><span class="num">${done + 1}</span> / <span class="num">${q.length}</span></div>
        <div class="jthing">${esc(c.thing)}</div>
        <div class="jquote">&ldquo;${esc(c.quote)}&rdquo;</div>
        <div class="jpaper">${esc(c.paper)}</div>
        <div class="pt-tools">
          <button class="pt-btn jyes" data-v="1">${he ? "כן — נכנס להגדרה שלי" : "yes — my definition admits it"}</button>
          <button class="pt-btn jno"  data-v="0">${he ? "לא — לא נכנס" : "no — it does not"}</button>
          <button class="pt-btn"      data-v="-">${he ? "לא ניתן להכריע" : "cannot tell"}</button>
        </div>
      </div>`;
    card.querySelectorAll("[data-v]").forEach(b => {
      b.addEventListener("click", () => {
        // Editing the wording while a card is open starts a different run. Do not let the
        // visible card from the old run write a verdict into the new definition's record.
        if (judgeRunKey() !== run.key) { renderJudge(); return; }
        const s2 = judgeState().verdicts;
        s2[next] = b.dataset.v;
        judgeSave(s2);
        renderJudge();
      });
    });
  }

}

function renderOwn() {
  renderFeatureMap();
  const box = document.getElementById("ownList");
  if (!box) return;
  const all = ownAll();
  if (!all.length) { box.innerHTML = ""; return; }
  // The rights panel now promises exactly three things: a timestamp, a name, and the corpus
  // the definition was scored against. Two of those were stored and never shown. A promise
  // the page does not display is a promise the reader cannot check.
  box.innerHTML = '<div class="pt-note" style="margin-top:.7rem;font-size:.86rem">'
    + "<b>" + esc(t("own.saved.h")) + "</b>"
    + all.map((r, k) =>
        '<div class="ownrec" style="margin-top:.55rem">'
        + '<span class="num" title="' + esc(r.when || "") + '">'
        + esc(localWhen(r.when)) + "</span> · "
        + "<b>" + esc(r.name || "—") + "</b> · "
        + esc(r.concept || "—") + " · "
        + esc(t("own.saved.corpus")) + " <span class="
        + '"num">' + ((r.corpus || []).length) + "</span> " + esc(t("own.saved.papers")) + " · "
        + esc(r.visibility === "public" ? t("own.vis.pub") : t("own.vis.priv"))
        + ' <button class="pt-btn ownDel" data-k="' + k + '">'
        + esc(t("own.saved.del")) + "</button>"
        + "<br>" + esc(r.text)
        + ((r.feature_map && r.feature_map.features || []).length
          ? '<div class="ownfeatures">' + esc(t("feature.saved")) + ": "
            + esc(r.feature_map.features.map(f => f.label).join(", ")) + "</div>" : "")
        + "</div>").join("")
    + "</div>";
  // Deleting one record, not all of them. "delete what is saved" wiped every definition the
  // visitor had ever written, which is not what anyone means by delete next to a list.
  box.querySelectorAll(".ownDel").forEach(b => {
    b.addEventListener("click", () => {
      const k = Number(b.dataset.k);
      const list = ownAll();
      list.splice(k, 1);
      try { localStorage.setItem("mtp_own", JSON.stringify(list)); } catch (_) {}
      const ack = document.getElementById("ownAck");
      if (ack) { ack.classList.add("open"); ack.textContent = t("own.saved.delone"); }
      renderOwn();
    });
  });
}

/* ---------- build a definition from criteria ----------
   Shir's design and her reason for it: "אולי משתמשים יצירתיים יחליטו שאחד התנאים מיותר
   ואולי הקורפוס שלהם יתמוך בכך." So the fourteen are candidates on offer - every one can be
   unticked, and a user can add their own.

   What this does NOT do is score the result, and the panel says so. Scoring means judging
   all 355 cases against the new definition in the same run as the other thirteen; a number
   obtained any other way cannot be set beside the numbers on this screen, because we
   measured that instruction wording alone moves MCC by about 0.12. */
function critText() {
  const on = S.criteria.filter(c => c.on);
  if (!on.length) return "";
  const body = on.map(c => (LANG === "he" ? c.he : c.en)).join(LANG === "he" ? "; " : "; ");
  return t("crit.out.pre") + " " + body;
}

function renderCrit() {
  const box = document.getElementById("critList");
  if (!box || !S.criteria.length) return;
  box.innerHTML = S.criteria.map((c, i) => {
    const excl = LANG === "he" ? c.excludes_he : c.excludes_en;
    return `<label class="critrow ${c.on ? "" : "off"}">
      <input type="checkbox" data-crit="${i}" ${c.on ? "checked" : ""}>
      <span>
        <span class="t">${esc(LANG === "he" ? c.he : c.en)}</span>
        ${excl ? `<span class="m">${esc(t("crit.excl"))} ${esc(excl)}</span>` : ""}
      </span>
    </label>`;
  }).join("");
  box.querySelectorAll("input[data-crit]").forEach(inp => {
    inp.addEventListener("change", e => {
      S.criteria[+e.target.dataset.crit].on = e.target.checked;
      renderCrit();
    });
  });
  const out = document.getElementById("critOut");
  const txt = critText();
  out.innerHTML = txt
    ? `<b>${esc(t("crit.out.h"))}</b><br>${esc(txt)}`
    : `<b>${esc(t("crit.out.h"))}</b><br>${esc(t("crit.out.none"))}`;
  if (txt) out.innerHTML += critScoreLine();
  renderFeatureMap();
  const jump = document.getElementById("critJudge");
  if (jump) jump.addEventListener("click", () => {
    const box = document.getElementById("judgeText");
    if (box) box.value = txt;
    document.querySelectorAll(".panel").forEach(x => x.classList.remove("open"));
    const jp = document.getElementById("pJudge");
    if (jp) { jp.classList.add("open"); jp.scrollIntoView({ behavior: "smooth", block: "start" }); }
    renderJudge();
  });
}

/* ---------- SCORING A COMPOSED DEFINITION ----------
   Composing a definition from the criteria is the designed automatic route: pick conditions,
   and because each criterion already carries a judged column over every case, the browser can
   intersect those columns and produce a score with no model and no server.

   The columns do not exist yet. The run that would produce them judged the wrong list once and
   has not been redone, so this says exactly what is missing rather than showing a number it
   cannot justify or, worse, nothing at all. The moment data/criteria_verdicts.json appears the
   same function starts scoring, because the arithmetic is already here. */
function critColumns() {
  return (S.critVerdicts && Object.keys(S.critVerdicts).length) ? S.critVerdicts : null;
}

function critScoreLine() {
  const he = LANG === "he";
  const chosen = S.criteria.filter(c => c.on);
  const cols = critColumns();
  if (!cols) {
    return `<div class="critgap">${he
      ? "<b>אי אפשר לנקד את ההרכבה הזאת עדיין.</b> ניקוד אוטומטי דורש עמודת הכרעות לכל קריטריון "
        + "מול כל מקרה, וההרצה שהייתה אמורה לייצר אותן ניקדה רשימת קריטריונים שגויה ולא הורצה "
        + "מחדש. אין כאן מספר כי אין לו על מה לעמוד."
      : "<b>This composition cannot be scored yet.</b> Automatic scoring needs a judged column "
        + "for every criterion over every case, and the run that was to produce them judged the "
        + "wrong list and has not been redone. There is no number here because there is nothing "
        + "for one to stand on."}
      <div class="pt-tools" style="margin-top:.5rem">
        <button class="pt-btn" id="critJudge">${he
          ? "לנקד אותה בעצמכם, מקרה־מקרה" : "score it yourself, case by case"}</button>
      </div></div>`;
  }
  // The columns exist: a composed definition admits a case only if EVERY chosen criterion
  // admits it. Conjunction is what "a definition made of conditions" means.
  const { judged } = corpusCases();
  let tp = 0, fp = 0, fn = 0, tn = 0, skipped = 0;
  judged.forEach(i => {
    let pred = true, known = true;
    chosen.forEach(c => {
      const v = (cols[c.id] || "")[i];
      if (v !== "0" && v !== "1") { known = false; return; }
      if (v === "0") pred = false;
    });
    if (!known) { skipped++; return; }
    const gold = S.cases[i].status === "P";
    if (pred && gold) tp++; else if (pred) fp++; else if (gold) fn++; else tn++;
  });
  const m = mcc(tp, fp, fn, tn);
  return `<div class="critscore">MCC <b class="ltr">${fmt(m)}</b> · `
    + `<span class="ltr">TP ${tp} · FP ${fp} · FN ${fn} · TN ${tn}</span>`
    + (skipped ? ` · ${skipped} ${he ? "לא ידועים" : "unknown"}` : "")
    + ` · ${he ? "מתוך " : "over "}<span class="num">${tp + fp + fn + tn}</span> `
    + `${he ? "מקרים בקורפוס שבחרת" : "cases in the corpus you chose"}</div>`;
}

/* Give every icon-only control a name a screen reader can say.
   "?" and "×" are shapes, not words: a reader announces them as "button" and a person
   listening hears five identical buttons in a row. The name is built from the card or
   panel the control belongs to, so it comes out as "why - all the definitions" and
   "close - rights and ownership". Done in script rather than in the markup because the
   titles are translated at runtime and the label has to follow the language. */
/* Every action names the concept it acts on. "Try your own definition" is ambiguous
   the moment the site holds more than one concept, and it holds two. */
function namedActions() {
  // conceptLabel needs the registry ENTRY; called bare it falls through to the id and
  // the Hebrew page ended up saying "למושג art".
  const entry = (S.registry || []).find(c => c.id === S.concept);
  const name = conceptLabel(entry);
  if (!name) return;
  const of = LANG === "he" ? " למושג " : " of the term ";
  [["next.own", '[data-panel="pOwn"]'],
   ["next.who", '[data-panel="pWho"]'],
   ["crit.btn", '[data-panel="pCrit"]']].forEach(([key, sel]) => {
    const b = document.querySelector(sel);
    if (b) b.textContent = t(key) + of + name;
  });
}

function labelControls() {
  namedActions();

  // The back link must land in the language the reader is already in. It was
  // hard-coded to "../" (the Hebrew index) while its label was translated, so an
  // English reader was sent to a Hebrew page by a button that said "back".
  const back = document.getElementById("backLink");
  if (back) back.setAttribute("href", LANG === "en" ? "../index-en.html" : "../");

  document.querySelectorAll(".tog[data-why]").forEach(b => {
    const card = b.closest(".act");
    const h = card && card.querySelector("h2");
    b.setAttribute("aria-label",
      t("a11y.why") + (h ? " — " + h.textContent.trim() : ""));
    b.setAttribute("aria-controls", b.dataset.why);
    const w = document.getElementById(b.dataset.why);
    b.setAttribute("aria-expanded", w && w.classList.contains("open") ? "true" : "false");
  });
  document.querySelectorAll("[data-close]").forEach(b => {
    const p = document.getElementById(b.dataset.close);
    const h = p && p.querySelector(".phead b");
    b.setAttribute("aria-label",
      t("a11y.close") + (h ? " — " + h.textContent.trim() : ""));
    b.setAttribute("aria-controls", b.dataset.close);
  });
  document.querySelectorAll("[data-panel]").forEach(b => {
    const p = document.getElementById(b.dataset.panel);
    b.setAttribute("aria-controls", b.dataset.panel);
    b.setAttribute("aria-expanded", p && p.classList.contains("open") ? "true" : "false");
    if (!(b.textContent || "").trim()) {
      const h = p && p.querySelector(".phead b");
      if (h) b.setAttribute("aria-label", t("a11y.open") + " — " + h.textContent.trim());
    }
  });
}


/* THE STAGE HEADING, in one place. It used to be a closure set only when step 3 was revealed,
   so every control that changes the corpus afterwards left it behind: "test it on the 5 papers
   that discuss them" narrowed 28 papers to 5 and re-scored (+0.745 to +0.729) under a heading
   still reading "against the 28 papers you chose". Same for the by-scholar buttons. refresh()
   calls this now, so the sentence cannot disagree with the corpus it describes. */
function renderStageHead() {
  const h = document.getElementById("stageHead");
  if (!h) return;
  if (S.capability && S.capability !== CAPABILITY.BENCHMARK) {
    // Before a corpus is chosen there is no paper count to give here -- the number of papers
    // carrying senses is computed further down, in the workspace, and printing S.selected.size
    // put "0 papers" above a list of eleven definitions. The heading drops the count instead
    // of guessing it; the workspace states it exactly, one line below.
    h.textContent = t(corpusChosen() ? "evidence.stage" : "evidence.stage.all")
      .replace("{term}", S.termPick ? S.termPick.label : conceptLabel(conf()))
      .replace("{n}", S.selected.size);
    return;
  }
  const entry = (S.registry || []).find(c => c.id === S.concept);
  const name = conceptLabel(entry);
  h.textContent = LANG === "he"
    ? `הגדרה למושג ${name} — מול ${S.selected.size} המאמרים שבחרת`
    : `Defining ${name} — against the ${S.selected.size} papers you chose`;
}

function refresh() {
  writeURL();
  if (typeof renderLiveMatrix === 'function') renderLiveMatrix(S.liveDef);
  labelControls();
  renderCrit();
  renderPapers();
  updateStep3();
  renderBoard();
  renderConcepts();
  renderDownloads();
  renderWho();
  renderSteps();
  renderOwn();
  renderCapability();
  renderStartHere();
  renderStageHead();
  const jk = document.getElementById("jack");
  if (jk) jk.innerHTML = jackknife();
}

/* ---------- corpus tools ---------- */
function wire() {
  const _selAll = document.getElementById("selAll");
  if (_selAll) _selAll.onclick = () => {
    // "all" now means every paper CURRENTLY LISTED, which is what a person reading a filtered
    // list means by it. It used to mean "the 29 that carry verdicts" whatever was on screen -
    // so searching for a discipline and pressing all silently selected papers from another one.
    const ids = (S.visible && S.visible.length) ? S.visible : S.papers.map(p => p.id);
    ids.forEach(id => S.selected.add(id));
    S.pickedCorpus = true;
    refresh();
  };
  const _selNone = document.getElementById("selNone");
  if (_selNone) _selNone.onclick = () => { S.selected.clear(); refresh(); };
  const _selInvert = document.getElementById("selInvert");
  if (_selInvert) _selInvert.onclick = () => {
    const ids = S.termPick ? ((S.visible && S.visible.length) ? S.visible : S.termPick.ids)
                           : S.papers.filter(p => p.n_scored).map(p => p.id);
    ids.forEach(id => { S.selected.has(id) ? S.selected.delete(id) : S.selected.add(id); });
    S.pickedCorpus = true;
    refresh();
  };
  /* Every disclosure on the page. These were deleted by accident along with a dead handler
     next to them, which is exactly the failure Shir hit: the panels existed, the buttons
     existed, and nothing connected them. A click test now covers all nine (PLATFORM/_probe
     pattern), because reading the code was what missed it the first time. */
  document.querySelectorAll(".tog[data-why]").forEach(b => {
    b.onclick = () => {
      const box = document.getElementById(b.dataset.why);
      if (!box) return;
      // One explainer open per card. A card carries two of these — "?" and "≡" — and the probe
      // caught both standing open at once, which is the same complaint Shir made about the two
      // entry buttons. Cards stay independent of each other, so two cards can still be compared.
      const card = b.closest(".act, .offer, .row, li, section") || document;
      card.querySelectorAll(".tog[data-why]").forEach(o => {
        if (o === b) return;
        const ob = document.getElementById(o.dataset.why);
        if (ob) ob.classList.remove("open");
        o.setAttribute("aria-expanded", "false");
      });
      const open = box.classList.toggle("open");
      b.setAttribute("aria-expanded", open ? "true" : "false");
    };
  });
  document.querySelectorAll("[data-panel]").forEach(b => {
    b.onclick = () => {
      const p = document.getElementById(b.dataset.panel);
      if (!p) return;
      const wasOpen = p.classList.contains("open");
      // Exactly one panel open at a time, on the entry screen as everywhere else.
      // Shir, 2026-08-13: "presing purple should open purple options pressing green shoud
      // close purple options and open green options and vice versa". An earlier note here
      // claimed keeping both open avoided a jump; the jump had a different cause (the grid
      // was auto-fit, so an opening panel changed the column count and moved the buttons),
      // and that is fixed in the stylesheet. Two open panels was never what was asked for.
      const inSteps = !!p.closest(".stepcol");
      document.querySelectorAll(".panel").forEach(x => {
        if (x !== p && !!x.closest(".stepcol") === inSteps) x.classList.remove("open");
      });
      p.classList.toggle("open", !wasOpen);
      // aria has to follow the DOM, including on the button whose panel just closed.
      document.querySelectorAll("[data-panel]").forEach(o => {
        const op = document.getElementById(o.dataset.panel);
        o.setAttribute("aria-expanded", op && op.classList.contains("open") ? "true" : "false");
      });
      writeURL();
    };
  });
  document.querySelectorAll("[data-close]").forEach(b => {
    b.onclick = () => {
      const p = document.getElementById(b.dataset.close);
      if (p) p.classList.remove("open");
      writeURL();
    };
  });

  // The concept search. Renders on every keystroke - the registry is 474 rows in memory and
  // filtering it is free, so there is no reason to make anyone press a button to search.
  const cs = document.getElementById("conceptSearch");
  if (cs) {
    cs.addEventListener("input", () => {
      S.query = cs.value;
      S.sel = 0;
      const soon = document.getElementById("conceptSoon");
      if (soon) soon.classList.remove("open");
      openConcepts(true);
      renderConcepts();
    });
    // Focusing the empty field shows the whole list - the commonest thing a first-time
    // visitor wants is to see what there is, not to guess a word.
    cs.addEventListener("focus", () => { openConcepts(true); renderConcepts(); });
    cs.addEventListener("keydown", conceptKey);
    cs.addEventListener("blur", () => setTimeout(() => openConcepts(false), 120));
  }
  const caret = document.getElementById("conceptCaret");
  if (caret) caret.onclick = () => {
    const box = document.getElementById("conceptResults");
    const open = box && box.classList.contains("open");
    openConcepts(!open);
    if (!open) { renderConcepts(); if (cs) cs.focus(); }
  };
  // Opening the concept panel should land the caret in the field, ready to type.
  ['selAll','selNone','selInvert'].forEach(id => {
    const b = document.getElementById(id);
    if (b) b.addEventListener('click', () => {
      S.pickedCorpus = true; setTimeout(updateStep3, 0); });
  });
  const psearch = document.getElementById('paperSearch');
  if (psearch) psearch.addEventListener('input', renderPapers);
  const add = document.getElementById('addPaper');
  if (add) add.addEventListener('click', () => {
    const n = document.getElementById('addPaperNote');
    if (n) { n.classList.toggle('open'); n.innerHTML = t('corpus.add.note'); }
  });
  const head = renderStageHead;   // one definition; see renderStageHead above

  const js_ = document.getElementById('judgeStart');
  if (js_) js_.addEventListener('click', renderJudge);
  const jr_ = document.getElementById('judgeReset');
  if (jr_) jr_.addEventListener('click', () => {
    judgeResetCurrent();
    renderJudge();
  });
  const s3 = document.getElementById('step3');
  if (s3) s3.addEventListener('click', () => {
    const st = document.getElementById('stage2');
    if (!st) return;
    st.hidden = false;
    head();
    if (S.capability === CAPABILITY.BENCHMARK) {
      const live = document.getElementById("liveMatrix");
      if (live) live.style.display = "";
      renderLiveMatrix(S.liveDef);
      renderBoard();
    } else {
      renderStageHead();
      renderEvidenceWorkspace();
    }
    st.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  document.querySelectorAll('[data-panel="pConcept"]').forEach(b => {
    b.addEventListener("click", () => setTimeout(() => {
      const i = document.getElementById("conceptSearch");
      if (i && document.getElementById("pConcept").classList.contains("open")) i.focus();
    }, 60));
  });

  const more = document.getElementById("moreBtn");
  if (more) more.onclick = () => {
    const acts = document.getElementById("acts");
    acts.hidden = !acts.hidden;
    more.textContent = acts.hidden ? t("more.show") : t("more.hide");
  };
  const send = document.getElementById("ownSend");
  if (send) send.onclick = () => {
    const box = document.getElementById("ownText");
    const ack = document.getElementById("ownAck");
    const v = (box.value || "").trim();
    ack.classList.add("open");
    if (!v) { ack.textContent = t("own.empty"); return; }
    const vis = ownVis();
    const all = ownAll();
    all.push({
      text: v,
      name: (document.getElementById("ownName").value || "").trim(),
      visibility: vis,
      concept: S.termPick ? S.termPick.id : S.concept,
      corpus: [...S.selected].sort(),
      feature_map: selectedFeatureMap(),
      when: new Date().toISOString()
    });
    try { localStorage.setItem("mtp_own", JSON.stringify(all)); } catch (_) {}
    // "public" cannot mean published - we have nowhere to publish it to. Saying so here is
    // the whole point of the choice; a mark that silently does nothing would be worse than
    // no choice at all.
    ack.textContent = vis === "public" ? t("own.ack.pub") : t("own.ack");
    box.value = "";
    renderOwn();
  };

  const ownDl = document.getElementById("ownDl");
  if (ownDl) ownDl.onclick = () => {
    const ack = document.getElementById("ownAck");
    ack.classList.add("open");
    const all = ownAll();
    if (!all.length) { ack.textContent = t("own.dl.none"); return; }
    const blob = new Blob([JSON.stringify({
      note: "Definitions written in the meta-tagging platform, saved locally by their author. "
          + "Each record carries a name and an ISO 8601 timestamp so it can serve as a dated "
          + "record of priority. Nothing here was ever sent to a server.",
      source: location.href,
      exported: new Date().toISOString(),
      definitions: all
    }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "my-definitions-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };

  const ownClear = document.getElementById("ownClear");
  if (ownClear) ownClear.onclick = () => {
    localStorage.removeItem("mtp_own");
    const ack = document.getElementById("ownAck");
    ack.classList.add("open");
    ack.textContent = t("own.cleared");
    renderOwn();
  };

  renderOwn();
  renderWho();
  renderCrit();
  labelControls();

  const cAll = document.getElementById("critAll");
  if (cAll) cAll.onclick = () => { S.criteria.forEach(c => c.on = true); renderCrit(); };
  const cNone = document.getElementById("critNone");
  if (cNone) cNone.onclick = () => { S.criteria.forEach(c => c.on = false); renderCrit(); };

  const cAdd = document.getElementById("critAdd");
  if (cAdd) cAdd.onclick = () => {
    const inp = document.getElementById("critOwn");
    const v = (inp.value || "").trim();
    if (!v) return;
    // A user's own criterion carries the same text in both languages, because we have no
    // business translating what somebody else wrote.
    S.criteria.push({ id: "user-" + S.criteria.length, en: v, he: v,
                      excludes_en: "", excludes_he: "", on: true, mine: true });
    inp.value = "";
    renderCrit();
  };

  const cUse = document.getElementById("critUse");
  if (cUse) cUse.onclick = () => {
    const txt = critText();
    const ack = document.getElementById("critAck");
    ack.classList.add("open");
    if (!txt) { ack.textContent = t("crit.out.none"); return; }
    document.getElementById("ownText").value = txt;
    ack.textContent = t("crit.used");
  };

  const _copyLink = document.getElementById("copyLink");
  if (_copyLink) _copyLink.onclick = async (e) => {
    try {
      await navigator.clipboard.writeText(location.href);
      const b = e.target; const o = b.textContent;
      b.textContent = t("corpus.copied"); setTimeout(() => b.textContent = o, 1400);
    } catch (_) { prompt("העתיקי את הקישור:", location.href); }
  };
  // Explicit concept/term choices use pushState. Re-running boot on Back/Forward is deliberate:
  // each capability has different data and paper ordering, so partial restoration risks leaving
  // a real art/game number under another term's URL.
  window.addEventListener("popstate", () => location.reload(), { once: true });
}

/* ---------- boot ---------- */

/* Load one concept's files. Called at boot and again on every concept switch, so the two
   paths cannot drift - the bug where switching left one stale array behind is the kind that
   shows a real number computed from the wrong corpus, which is worse than showing nothing. */
async function loadConcept(fromURL) {
  const dir = conceptDir(conf());
  const prefix = dir.replace("../data/", "");
  const optionalData = rel => Object.prototype.hasOwnProperty.call(window.MTP_INLINE || {}, rel)
    ? getData(rel) : Promise.resolve(null);
  const [papers, cases, defs, verdicts, manifest, criteria] = await Promise.all([
    ...["papers", "cases", "definitions", "verdicts", "manifest"]
      .map(n => getData(prefix + n + ".json")),
    // criteria.json is an offer rather than measurement data, and only art has one. The
    // inline manifest is the build's file list, so consult it before fetching an optional
    // path instead of producing a browser-console 404 for every game visit.
    optionalData(prefix + "criteria.json"),
  ]);
  S.manifest = manifest;
  // WHICH PAPERS HAVE A TAGGED PAGE ON THE SHOWCASE. Loaded once; a failure here must never stop
  // the screen, because without it every link simply falls back to the publisher, which is the
  // behaviour we are replacing rather than something the page depends on.
  if (SHOWCASE === null) {
    try { SHOWCASE = await getData("showcase_pages.json"); } catch (e) { SHOWCASE = null; }
    if (SHOWCASE && !(SHOWCASE.full_text && SHOWCASE.tags_only)) SHOWCASE = null;
  }
  if (!papers || !cases || !defs || !verdicts) {
    const el = document.getElementById("offered");
    if (el) el.innerHTML = `<div class="hero-result warn"><div class="win">${
      t("load.failed").replace("{dir}", esc(dir))}</div></div>`;
    return false;
  }
  S.papers = papers; S.cases = cases; S.defs = defs; S.verdicts = verdicts;
  // Every criterion starts ticked, because the fourteen ARE the drafted set; the point is
  // that a user can untick any of them, not that they must assemble one from nothing.
  S.criteria = ((criteria && criteria.criteria) || []).map(c => ({ ...c, on: true }));
  S.papers.sort((a, b) => (b.n_cases - a.n_cases));
  S.selected.clear();
  if (fromURL) readURL();
  else S.papers.forEach(p => { if (p.n_scored) S.selected.add(p.id); });
  // Buttons that belong to a concept the current one does not have must go, not sit there
  // doing nothing when clicked. Only art carries criteria and theorist tags.
  const hide = (sel, gone) => document.querySelectorAll(sel)
    .forEach(b => { b.hidden = gone; });
  hide('[data-panel="pCrit"]', !S.criteria.length);
  hide('[data-panel="pWho"]', !S.papers.some(p => (p.theorists || []).length));
  return true;
}

async function boot() {
  // The whole library, for the corpus picker. Loaded once, here, because it is boot
  // data and not render data -- putting the fetch in refresh() both re-fetched on every
  // keystroke and, being an await inside a plain function, stopped the file parsing at
  // all: the entire page went dead and the screenshot still looked plausible.
  try {
    // This optional file has not been produced yet. data/inline.js is generated from the same
    // publishable file list and will contain the key when it exists; until then, do not request
    // a known-missing URL and turn every otherwise healthy journey into a console error.
    const haveCriteriaVerdicts = Object.prototype.hasOwnProperty.call(
      window.MTP_INLINE || {}, "criteria_verdicts.json");
    const _cv = haveCriteriaVerdicts ? await getData("criteria_verdicts.json") : null;
    S.critVerdicts = _cv ? (_cv.verdicts || {}) : null;
  } catch (e) { S.critVerdicts = null; }
  try {
    const _pi = await getData("paper_index.json");
    S.index = (_pi && _pi.papers) || [];
  } catch (e) { S.index = []; }

  initLang();
  try {
    const senseData = await loadSenseData();
    S.senseIndex = senseData.index;
    S.senseReport = senseData.report;
  } catch (e) {
    S.senseIndex = null;
    S.senseReport = null;
  }
  try { S.subtermIndex = await loadSubtermData(); }
  catch (e) { S.subtermIndex = null; }
  try { S.externalDefinitions = await loadExternalDefinitions(); }
  catch (e) { S.externalDefinitions = null; }
  // The registry first: nothing else can resolve a concept to a directory without it, and
  // its counts come from each concept's own build rather than from a number typed here.
  // getData returns the PARSED object, not a Response. Leaving the old `.then(r => r.ok
  // ? r.json() : null)` on it made `r.ok` undefined, so reg came back null and the whole
  // registry was empty — the page would have shown "could not load" on every visit.
  const reg = await getData("concepts.json");
  S.registry = (reg && reg.concepts) || [];

  // ---- EVERY TAG IN THE PICKER, EACH WITH ITS OWN CORPUS -------------------------------
  // Shir, 2026-08-14: "I will want to see a list of ALL our tags in the term-to-define
  // window. For every term like that I choose I will need to see the corpus containing all
  // papers in which the term appears at least once."
  //
  // The registry held 474 terms and, for each, only a COUNT of papers - so the picker could
  // say thirteen and could not show you which thirteen. term_corpus.json carries the list
  // behind the count for all 10,506 tagged terms. Merged rather than replaced: a concept
  // with a real definition board keeps its own entry and its `ready` state, and the tag
  // layer only fills in what the registry does not already have.
  try {
    const tc = await getData("term_corpus.json");
    if (tc && tc.terms) {
      S.termPapers = tc.papers || {};
      S.termOrder = tc.order || null;   // index -> paper id; absent in the pre-2026-08-19 file
      S.termCorpus = tc.terms;
      // The registry's ids are RAW TERMS with spaces ("working memory"); term_corpus is keyed
      // by slug ("working-memory"). Every entry therefore carries its slug from here on, or
      // the two files silently fail to meet - which they did on the first attempt, and the
      // screenshot showed a page where nothing happened at all.
      const bySlug = new Map();
      S.registry.forEach(c => { c.slug = slugOf(c.en || c.id); bySlug.set(c.slug, c); });
      Object.keys(tc.terms).forEach(sl => {
        const [label, ids] = tc.terms[sl];
        const have = bySlug.get(sl);
        if (have) {
          // Its count came from an older build: "working memory" said 1 paper where the tag
          // layer holds 24. The layer is the newer measurement, so it wins.
          //
          // EXCEPT FOR A SCORED BOARD, where the two numbers mean different things and the max
          // silently picks the wrong one. A ready concept's `papers` is HOW MANY PAPERS THE BOARD
          // SCORES - 29 for art, 10 for game, 7 for consciousness - and the tag layer's count is
          // how many corpus papers mention the word, which is 80 for game and 86 for consciousness.
          // Taking the larger published "game - 80 papers - 28 adjudicated cases", inviting a
          // reader to divide one by the other and conclude the board ignores 52 of its papers.
          // The comment three lines up already says a board "keeps its own entry"; this is what
          // that has to mean for the number as well as the state.
          if (have.state !== "ready") have.papers = Math.max(have.papers || 0, ids.length);
          return;
        }
        S.registry.push({ id: sl, slug: sl, state: "corpus", en: label, he: null,
                          aliases: [], papers: ids.length, cases: 0, definitions: 0 });
      });
      // term_corpus is generated by an older builder that can still carry withdrawn-only tags.
      // The sense index publishes the shared Python is_live decision for the complete runtime
      // denominator. Fail closed when that decision is unavailable: only scored boards remain.
      const publishedLive = new Set(((S.senseIndex || {}).picker_live_slugs) || []);
      S.registry = S.registry.filter(c => c.state === "ready" ||
        publishedLive.has(c.slug || slugOf(c.en || c.id)));
      // Terms carried by more papers are the ones that can join fields, so they surface
      // first when the search box is empty.
      S.registry.sort((a, b) => (b.state === "ready") - (a.state === "ready")
                             || (b.papers || 0) - (a.papers || 0));
      S.registry.forEach(c => {
        const sl = c.slug || slugOf(c.en || c.id);
        c.sense_count = senseIndicesForSlug(sl).length;
        const ent = tc.terms[sl];
        const ids = termIdsWithSenseSources(ent, sl);
        ensureSensePaperMetadata(ids);
        // Same rule, second place. This loop runs over EVERY entry including the ready ones, so
        // guarding only the merge above would have left the board counts overwritten here.
        if (c.state !== "ready") c.papers = Math.max(c.papers || 0, ids.length);
        c.capability = capabilityForRegistryEntry(c);
      });
    }
  } catch (e) { S.termCorpus = null; }

  if (!S.registry.length) {
    const el = document.getElementById("offered");
    if (el) el.innerHTML = `<div class="hero-result warn"><div class="win">${
      t("load.failed").replace("{dir}", "../data/concepts.json")}</div></div>`;
    return;
  }
  // A deep link may name a concept that is only in the corpus, or one we have never heard
  // of. Falling back to the default silently would show art's board under game's URL, so
  // the fallback is only taken for a concept that genuinely has a board.
  // Capture the incoming URL once. The first refresh normalises address state; reading `term`
  // after that refresh erased a deep link before boot had consumed it.
  const bootURL = new URL(location.href);
  const want = bootURL.searchParams.get("concept");
  const wanted = want && S.registry.find(c => c.id === want && c.state === "ready");
  if (wanted) { S.concept = want; S.capability = CAPABILITY.BENCHMARK; }
  if (!await loadConcept(true)) return;
  wire();
  refresh();

  // ?term=<slug> opens a tagged term's corpus straight away. It exists so a term can be sent
  // to somebody as a link - and so this feature can be screenshot-tested without a click,
  // which is the only way I can check it before handing it over.
  // ?q= prefills the search and opens the dropdown. It exists so a SEARCH can be screenshot-
  // tested - Shir typed "consciousness", saw no option to pick it, and I had no way to look at
  // what she was looking at. A feature I cannot reproduce is a feature I cannot fix.
  const wantQ = bootURL.searchParams.get("q");
  if (wantQ) {
    const p = document.getElementById("pConcept");
    if (p) {
      document.querySelectorAll(".panel").forEach(x => x.classList.remove("open"));
      p.classList.add("open");
    }
    const inp = document.getElementById("conceptSearch");
    if (inp) inp.value = wantQ;
    S.query = wantQ;
    openConcepts(true);
    renderConcepts();
  }

  const wantTerm = bootURL.searchParams.get("term");
  const termRow = wantTerm && S.registry.find(
    c => (c.slug || slugOf(c.en || c.id)) === slugOf(wantTerm) && c.state !== "ready");
  if (termRow) {
    // The concept panel is collapsed until its step button is pressed, so opening the term
    // without opening the panel writes the corpus into a box nobody can see - which is what
    // the first screenshot of this feature showed, and why it is checked with a screenshot.
    const p = document.getElementById("pConcept");
    if (p) {
      document.querySelectorAll(".panel").forEach(x => x.classList.remove("open"));
      p.classList.add("open");
      const b = document.querySelector('[data-panel="pConcept"]');
      if (b) b.setAttribute("aria-expanded", "true");
    }
    chooseSoon(termRow.id, true, bootURL);

    // SEE THE DEFINITIONS, WHICH IS WHAT THE LINK PROMISED.
    //
    // 3,300 links across the showcase say "the same word, defined differently" or "N rival
    // definitions across M fields" and land here. Driven on 2026-09-03, arriving with ?term=
    // put the reader on the term's CORPUS -- 494 papers for `attention` -- and the wordings
    // were three actions away: open step 2, select the papers, open step 3. The page was
    // right and the promise was early.
    //
    // THE THREE STEPS ARE THE METHOD and they are not touched: a definition is judged
    // AGAINST a chosen corpus, so choosing one is the reader's act. This is opt-in. A link
    // that carries &see=definitions says "I already know which corpus I mean -- the one this
    // term brings" and gets taken to the wordings; every other arrival behaves as before.
    //
    // It uses the page's own controls rather than reimplementing them, so it cannot drift
    // from what pressing them does: the same selection "all" makes, and the same step-3
    // button a reader would press.
    if (bootURL.searchParams.get("see") === "definitions") {
      const ids = (S.termPick && S.termPick.ids) || [];
      if (ids.length) {
        ids.forEach(id => S.selected.add(id));
        S.pickedCorpus = true;
        refresh();
        const w = document.getElementById("step3wrap");
        const b3 = w && w.querySelector("button");
        if (b3) b3.click();
      }
    }
  }
}
boot();
