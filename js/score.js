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
const MAX_HITS = 40;   // a search that prints 472 rows has not helped anybody

const S = {
  concept: DEFAULT_CONCEPT,
  registry: [], query: "",
  papers: [], cases: [], defs: [], verdicts: {}, criteria: [], manifest: null,
  selected: new Set(),   // paper ids in the corpus
  openDef: null,
};

function conf() {
  return S.registry.find(c => c.id === S.concept)
      || { id: S.concept, dir: "", calib: "circular", state: "ready" };
}
function conceptLabel(c) {
  return (LANG === "he" && c && c.he) ? c.he : (c ? (c.en || c.id) : S.concept);
}
/* Where a concept's files are. The registry stores it relative to data/; the working screen
   sits one directory down, so it is resolved here and nowhere else. */
function conceptDir(c) { return "../data/" + ((c && c.dir) || ""); }

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

function fmt(x) { return (x >= 0 ? "+" : "") + x.toFixed(3); }

/* The provenance line. Where a person proposed a definition it names them and dates it,
   because that is what provenance is for and "a user" is the opposite of it: priority is a
   dated public record bearing a name, and an anonymous record establishes nothing. */
function provLine(d) {
  let s = t("prov." + d.provenance);
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
function writeURL() {
  const ids = S.papers.map(p => p.id);
  const bits = ids.map(id => (S.selected.has(id) ? "1" : "0")).join("");
  const u = new URL(location.href);
  // The concept travels in the URL with the corpus. A link to a result has to reopen the
  // result, and half of "which result" is which concept it was about.
  if (S.concept === DEFAULT_CONCEPT) u.searchParams.delete("concept");
  else u.searchParams.set("concept", S.concept);
  if (S.selected.size === ids.length) u.searchParams.delete("c");
  else u.searchParams.set("c", bits);
  const openPanel = document.querySelector(".panel.open");
  if (openPanel) u.searchParams.set("p", openPanel.id);
  else u.searchParams.delete("p");
  history.replaceState(null, "", u);
}
function readURL() {
  const u = new URL(location.href);
  S.selected.clear();
  const bits = u.searchParams.get("c");
  const ids = S.papers.map(p => p.id);
  const scored = new Set(S.papers.filter(p => p.n_scored).map(p => p.id));
  if (!bits || bits.length !== ids.length) scored.forEach(id => S.selected.add(id));
  else ids.forEach((id, k) => { if (bits[k] === "1" && scored.has(id)) S.selected.add(id); });
  // the sensitivity panel is part of the shareable state: a claim about how robust a result
  // is should travel with the corpus that produced it, not have to be re-found by hand.
  const want = u.searchParams.get("p");
  if (want) {
    const p = document.getElementById(want);
    if (p) p.classList.add("open");
  }
}

/* ---------- render ---------- */
function renderPapers() {
  const box = document.getElementById("paperList");
  box.innerHTML = S.papers.map(p => {
    const on = S.selected.has(p.id);
    // A paper whose cases carry no verdicts yet must say so. Otherwise a visitor adds it,
    // nothing moves, and the tool looks broken when it is merely honest.
    const unscored = !p.n_scored;
    const meta = unscored
      ? (LANG === "he" ? "תויג, טרם נוקד" : "tagged, not yet scored")
      : `${p.n_cases} ${LANG === "he" ? "מקרים" : "cases"}`;
    return `<label class="pt-paper ${on ? "" : "off"} ${unscored ? "unscored" : ""}" data-id="${esc(p.id)}">
      <input type="checkbox" ${on ? "checked" : ""} ${unscored ? "disabled" : ""}>
      <span>
        <span class="t">${esc(p.title)}</span>
        <span class="m"><span class="ltr">${p.year || "—"}${p.venue ? " · " + esc(p.venue) : ""}</span>
          · ${meta}</span>
      </span>
    </label>`;
  }).join("");
  const nUn = S.papers.filter(p => !p.n_scored).length;
  const note = document.getElementById("unscoredNote");
  if (note) {
    note.innerHTML = nUn
      ? `<b>${t("unscored.h")}</b> (${nUn}) — ${t("unscored.body")}`
      : "";
    note.style.display = nUn ? "" : "none";
  }
  box.querySelectorAll(".pt-paper input").forEach(inp => {
    inp.addEventListener("change", e => {
      const id = e.target.closest(".pt-paper").dataset.id;
      if (e.target.checked) S.selected.add(id); else S.selected.delete(id);
      refresh();
    });
  });
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

function renderBoard() {
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

  renderOffered(rows);

  const max = Math.max(...rows.map(r => Math.abs(r.s.mcc)), 0.001);
  document.getElementById("board").innerHTML = rows.map(({ d, s }) => {
    const mine = d.id.startsWith("shir");
    const w = Math.max(2, Math.abs(s.mcc) / max * 100);
    const gate = t("gate." + d.gate) || d.gate;
    const wrong = s.rows.filter(r => r.kind === "fp" || r.kind === "fn");
    return `<div class="pt-def ${mine ? "mine" : ""} ${d.is_control ? "control" : ""}">
      <div class="pt-defh">
        <span class="nm">${esc(LANG === "he" ? d.name_he : (d.name_en || d.id))}</span>
        <span class="prov prov-${d.provenance}">${provLine(d)}</span>
        <span class="gate ${d.gate}">${gate}</span>
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

  return `<div class="pt-note">${head}
    <div class="plain" style="margin-top:.5rem">
      ${t("jack.top5")} (<span class="num">${fmt(topMCC)}</span>):
    </div>
    ${rows.slice(0, 5).map(r => {
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

  el.innerHTML =
    `<div class="offerhead">${t("offer.head")} <span class="lead">${t("offer.sub")}</span></div>` +
    caveat +
    real.slice(0, OFFER_N).map((r, k) => {
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
          <div class="oprov prov-${d.provenance}">${provLine(d)}</div>
        </div>
        <div class="onums">
          <div class="omcc">${fmt(s.mcc)}</div>
          <div class="olab">${t("offer.fit")}</div>
          <div class="omiss">${miss} ${t("offer.misses")}</div>
        </div>
      </div>`;
    }).join("");
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
function norm(s) {
  return String(s || "").toLowerCase().trim()
    .replace(/[֑-ׇ]/g, "")     // Hebrew niqqud and cantillation
    .replace(/["'׳״]/g, "");   // geresh, gershayim, quotes
}
function matches(c, q) {
  if (!q) return true;
  return [c.id, c.he, c.en, ...(c.aliases || [])]
    .filter(Boolean).some(s => norm(s).includes(q));
}

/* THE PICKER. A search field over the registry, not a list of buttons.
   Ready concepts sort first and are always shown even when the query is long, because the
   two that can actually be loaded must never be buried under 472 that cannot. */
function renderConcepts() {
  const box = document.getElementById("conceptResults");
  if (!box) return;
  const q = norm(S.query);
  const hits = S.registry.filter(c => matches(c, q));
  const ready = hits.filter(c => c.state === "ready");
  const rest = hits.filter(c => c.state !== "ready");
  const shown = ready.concat(rest.slice(0, MAX_HITS));

  const counts = c => t("concept.counts")
    .replace("{p}", c.papers).replace("{c}", c.cases).replace("{d}", c.definitions);

  let html = "";
  if (!hits.length) {
    // Not an empty list. An empty list reads as a broken search; this says what is true -
    // we hold nothing on that word - and what a person can do next.
    html = `<div class="cnone"><b>${t("concept.none.h").replace("{q}", esc(S.query))}</b>
      <div>${t("concept.none.body")}</div></div>`;
  } else {
    html = shown.map(c => {
      const on = c.id === S.concept;
      if (c.state === "ready") {
        return `<button class="conceptbtn ${on ? "on" : ""}" data-conc="${esc(c.id)}"
          aria-pressed="${on}"><b>${esc(conceptLabel(c))}</b>
          <span>${counts(c)}</span>
          <span class="cwhy">${esc(LANG === "he" ? c.why_he : c.why_en)}</span></button>`;
      }
      return `<button class="conceptbtn soon" data-soon="${esc(c.id)}">
        <b>${esc(c.en)}</b>
        <span>${t("concept.corpusonly").replace("{n}", c.papers)}</span></button>`;
    }).join("");
    const hidden = rest.length - Math.max(0, shown.length - ready.length);
    if (hidden > 0) {
      html += `<div class="cmore">${t("concept.more").replace("{n}", hidden)}</div>`;
    }
  }
  box.innerHTML = html;

  const tally = document.getElementById("conceptTally");
  if (tally) {
    tally.innerHTML = t("concept.tally")
      .replace("{r}", S.registry.filter(c => c.state === "ready").length)
      .replace("{t}", S.registry.length);
  }

  box.querySelectorAll("[data-conc]").forEach(b => {
    b.onclick = () => { if (b.dataset.conc !== S.concept) switchConcept(b.dataset.conc); };
  });
  box.querySelectorAll("[data-soon]").forEach(b => {
    b.onclick = () => {
      const c = S.registry.find(x => x.id === b.dataset.soon);
      const out = document.getElementById("conceptSoon");
      if (!out || !c) return;
      out.classList.add("open");
      out.innerHTML = t("concept.soon.body")
        .replace(/{term}/g, esc(c.en)).replace("{n}", c.papers);
      out.scrollIntoView({ behavior: "smooth", block: "nearest" });
    };
  });
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
  S.concept = id;
  // The old corpus selection is a list of paper ids that do not exist in the new concept, and
  // the `c` bitmask in the URL is indexed against the old paper list. Both have to go, or the
  // new board opens with an empty corpus and looks broken.
  const u = new URL(location.href);
  u.searchParams.delete("c");
  history.replaceState(null, "", u);
  await loadConcept();
  refresh();
}

/* The two step buttons must always say what is currently chosen. */
function renderSteps() {
  const cv = document.getElementById("conceptVal");
  if (cv) cv.textContent = conceptLabel(conf());
  const pv = document.getElementById("corpusVal");
  if (pv) {
    const n = S.selected.size, all = S.papers.filter(p => p.n_scored).length;
    pv.textContent = n === all ? t("corpus.allpapers").replace("{n}", n)
                               : t("corpus.npapers").replace("{n}", n);
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

function renderOwn() {
  const box = document.getElementById("ownList");
  if (!box) return;
  const all = ownAll();
  if (!all.length) { box.innerHTML = ""; return; }
  box.innerHTML = '<div class="pt-note" style="margin-top:.7rem;font-size:.86rem">'
    + "<b>" + esc(t("own.saved.h")) + "</b>"
    + all.map(r =>
        '<div style="margin-top:.45rem">'
        + '<span class="num">' + esc((r.when || "").slice(0, 16).replace("T", " ")) + "</span> · "
        + esc(r.name || "—") + " · "
        + esc(r.visibility === "public" ? t("own.vis.pub") : t("own.vis.priv"))
        + "<br>" + esc(r.text) + "</div>").join("")
    + "</div>";
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
}

/* Give every icon-only control a name a screen reader can say.
   "?" and "×" are shapes, not words: a reader announces them as "button" and a person
   listening hears five identical buttons in a row. The name is built from the card or
   panel the control belongs to, so it comes out as "why - all the definitions" and
   "close - rights and ownership". Done in script rather than in the markup because the
   titles are translated at runtime and the label has to follow the language. */
function labelControls() {
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

function refresh() {
  writeURL();
  labelControls();
  renderCrit();
  renderPapers();
  renderBoard();
  renderConcepts();
  renderDownloads();
  renderWho();
  renderSteps();
  renderOwn();
  const jk = document.getElementById("jack");
  if (jk) jk.innerHTML = jackknife();
}

/* ---------- corpus tools ---------- */
function wire() {
  const _selAll = document.getElementById("selAll");
  if (_selAll) _selAll.onclick = () => {
    S.papers.forEach(p => { if (p.n_scored) S.selected.add(p.id); }); refresh();
  };
  const _selNone = document.getElementById("selNone");
  if (_selNone) _selNone.onclick = () => { S.selected.clear(); refresh(); };
  const _selInvert = document.getElementById("selInvert");
  if (_selInvert) _selInvert.onclick = () => {
    S.papers.forEach(p => { if (!p.n_scored) return;
    S.selected.has(p.id) ? S.selected.delete(p.id) : S.selected.add(p.id); });
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
      const open = box.classList.toggle("open");
      b.setAttribute("aria-expanded", open ? "true" : "false");
    };
  });
  document.querySelectorAll("[data-panel]").forEach(b => {
    b.onclick = () => {
      const p = document.getElementById(b.dataset.panel);
      if (!p) return;
      const wasOpen = p.classList.contains("open");
      document.querySelectorAll(".panel").forEach(x => x.classList.remove("open"));
      if (!wasOpen) p.classList.add("open");
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
  if (cs) cs.addEventListener("input", () => {
    S.query = cs.value;
    const soon = document.getElementById("conceptSoon");
    if (soon) soon.classList.remove("open");
    renderConcepts();
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
      concept: S.concept,
      corpus: [...S.selected].sort(),
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
}

/* ---------- boot ---------- */

/* Load one concept's files. Called at boot and again on every concept switch, so the two
   paths cannot drift - the bug where switching left one stale array behind is the kind that
   shows a real number computed from the wrong corpus, which is worse than showing nothing. */
async function loadConcept(fromURL) {
  const dir = conceptDir(conf());
  const [papers, cases, defs, verdicts, criteria, manifest] = await Promise.all(
    ["papers", "cases", "definitions", "verdicts", "criteria", "manifest"].map(n =>
      // criteria.json is an offer rather than measurement data, and only art has one. If it
      // is missing the rest of the screen must still work, so its failure is not allowed to
      // reject the batch.
      fetch(`${dir}${n}.json`).then(r => (r.ok ? r.json() : null)).catch(() => null)));
  S.manifest = manifest;
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
  initLang();
  // The registry first: nothing else can resolve a concept to a directory without it, and
  // its counts come from each concept's own build rather than from a number typed here.
  const reg = await fetch("../data/concepts.json")
    .then(r => (r.ok ? r.json() : null)).catch(() => null);
  S.registry = (reg && reg.concepts) || [];
  if (!S.registry.length) {
    const el = document.getElementById("offered");
    if (el) el.innerHTML = `<div class="hero-result warn"><div class="win">${
      t("load.failed").replace("{dir}", "../data/concepts.json")}</div></div>`;
    return;
  }
  // A deep link may name a concept that is only in the corpus, or one we have never heard
  // of. Falling back to the default silently would show art's board under game's URL, so
  // the fallback is only taken for a concept that genuinely has a board.
  const want = new URL(location.href).searchParams.get("concept");
  const wanted = want && S.registry.find(c => c.id === want && c.state === "ready");
  if (wanted) S.concept = want;
  if (!await loadConcept(true)) return;
  wire();
  refresh();
}
boot();
