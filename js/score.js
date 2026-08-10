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

const S = {
  papers: [], cases: [], defs: [], verdicts: {},
  selected: new Set(),   // paper ids in the corpus
  openDef: null,
};

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
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* ---------- URL is the state, so a corpus can be cited ---------- */
function writeURL() {
  const ids = S.papers.map(p => p.id);
  const bits = ids.map(id => (S.selected.has(id) ? "1" : "0")).join("");
  const u = new URL(location.href);
  if (S.selected.size === ids.length) u.searchParams.delete("c");
  else u.searchParams.set("c", bits);
  const jk = document.getElementById("jack");
  if (jk && jk.dataset.open === "1") u.searchParams.set("jk", "1");
  else u.searchParams.delete("jk");
  history.replaceState(null, "", u);
}
function readURL() {
  const u = new URL(location.href);
  const bits = u.searchParams.get("c");
  const ids = S.papers.map(p => p.id);
  const scored = new Set(S.papers.filter(p => p.n_scored).map(p => p.id));
  if (!bits || bits.length !== ids.length) scored.forEach(id => S.selected.add(id));
  else ids.forEach((id, k) => { if (bits[k] === "1" && scored.has(id)) S.selected.add(id); });
  // the sensitivity panel is part of the shareable state: a claim about how robust a result
  // is should travel with the corpus that produced it, not have to be re-found by hand.
  if (u.searchParams.get("jk") === "1") {
    const jk = document.getElementById("jack");
    if (jk) jk.dataset.open = "1";
    const b = document.getElementById("jackBtn");
    if (b) b.classList.add("on");
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

  const circ = rows.find(r => r.d.id === "circular");
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

  const max = Math.max(...rows.map(r => Math.abs(r.s.mcc)), 0.001);
  document.getElementById("board").innerHTML = rows.map(({ d, s }) => {
    const mine = d.id.startsWith("shir");
    const w = Math.max(2, Math.abs(s.mcc) / max * 100);
    const gate = t("gate." + d.gate) || d.gate;
    const wrong = s.rows.filter(r => r.kind === "fp" || r.kind === "fn");
    return `<div class="pt-def ${mine ? "mine" : ""} ${d.is_control ? "control" : ""}">
      <div class="pt-defh">
        <span class="nm">${esc(LANG === "he" ? d.name_he : (d.name_en || d.id))}</span>
        <span class="gate ${d.gate}">${gate}</span>
      </div>
      <div class="wording"${LANG === "he" ? "" : ' dir="ltr"'}>${esc(LANG === "he" ? d.he : d.text)}</div>
      <div class="pt-bar"><i style="width:${w}%"></i><span>MCC ${fmt(s.mcc)}</span></div>
      <div class="cm">TP ${s.tp} · FP ${s.fp} · FN ${s.fn} · TN ${s.tn} · n ${s.n}</div>
      <div class="plain">${plainMCC(s.mcc)}</div>
      ${wrong.length ? `<details class="pt-cases">
        <summary>${wrong.length} ${t("case.wrongN")}</summary>
        ${wrong.map(caseRow).join("")}
      </details>` : `<div class="plain">${t("case.none")}</div>`}
    </div>`;
  }).join("");
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
  const rank = idx => S.defs.map(d => ({ id: d.id, s: scoreDef(d.id, idx) }))
    .filter(r => r.s.mcc !== null && !r.id.startsWith("circular"))
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

function refresh() {
  writeURL();
  renderPapers();
  renderBoard();
  const jk = document.getElementById("jack");
  if (jk && jk.dataset.open === "1") jk.innerHTML = jackknife();
}

/* ---------- corpus tools ---------- */
function wire() {
  document.getElementById("selAll").onclick = () => {
    S.papers.forEach(p => { if (p.n_scored) S.selected.add(p.id); }); refresh();
  };
  document.getElementById("selNone").onclick = () => { S.selected.clear(); refresh(); };
  document.getElementById("selInvert").onclick = () => {
    S.papers.forEach(p => { if (!p.n_scored) return;
    S.selected.has(p.id) ? S.selected.delete(p.id) : S.selected.add(p.id); });
    refresh();
  };
  document.getElementById("jackBtn").onclick = (e) => {
    const jk = document.getElementById("jack");
    const on = jk.dataset.open === "1";
    jk.dataset.open = on ? "0" : "1";
    jk.innerHTML = on ? "" : jackknife();
    e.target.classList.toggle("on", !on);
  };
  document.getElementById("copyLink").onclick = async (e) => {
    try {
      await navigator.clipboard.writeText(location.href);
      const b = e.target; const o = b.textContent;
      b.textContent = t("corpus.copied"); setTimeout(() => b.textContent = o, 1400);
    } catch (_) { prompt("העתיקי את הקישור:", location.href); }
  };
}

/* ---------- boot ---------- */
async function boot() {
  const [papers, cases, defs, verdicts] = await Promise.all(
    ["papers", "cases", "definitions", "verdicts"].map(n =>
      fetch(`../data/${n}.json`).then(r => r.json())));
  S.papers = papers; S.cases = cases; S.defs = defs; S.verdicts = verdicts;
  S.papers.sort((a, b) => (b.n_cases - a.n_cases));
  initLang();
  readURL();
  wire();
  refresh();
}
boot();
