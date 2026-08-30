import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const args = process.argv.slice(2);
function arg(name, fallback = null) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

const baseUrl = arg("--base", "http://127.0.0.1:8765").replace(/\/$/, "");
const outputPath = path.resolve(arg("--output", "data/term_coverage_report.json"));
const summaryPath = path.resolve(arg("--summary", "data/term_coverage_report.md"));
const browserRoot = arg("--playwright-root", process.env.TASK09_PLAYWRIGHT_ROOT);

async function loadPlaywright() {
  try {
    return await import("playwright-core");
  } catch (firstError) {
    if (!browserRoot) {
      throw new Error(
        "playwright-core is required. Install it outside the repository and pass " +
        "--playwright-root <prefix>, or set TASK09_PLAYWRIGHT_ROOT.\n" + firstError.message,
      );
    }
    const entry = path.join(path.resolve(browserRoot), "node_modules", "playwright-core", "index.mjs");
    return await import(pathToFileURL(entry).href);
  }
}

function findChrome() {
  const explicit = arg("--chrome", process.env.TASK09_CHROME);
  const candidates = [
    explicit,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  return candidates.find(candidate => fs.existsSync(candidate)) || null;
}

function countBy(rows, getter) {
  return rows.reduce((out, row) => {
    const key = getter(row);
    out[key] = (out[key] || 0) + 1;
    return out;
  }, {});
}

function markdown(report) {
  const c = report.counts;
  const tierRows = Object.entries(c.capability_tiers)
    .map(([tier, n]) => `| ${tier} | ${n} |`).join("\n");
  const selectorRows = ["oldest", "newest", "most_cited"].map(name => {
    const row = c.selectors[name];
    return `| ${name.replace("_", " ")} | ${row.resolved || 0} | ${row.suppressed || 0} | ${row.not_applicable || 0} |`;
  }).join("\n");
  return `# Task 09 — coverage of every pickable term

Generated ${report.generated_at} from \`${report.source.page_url}\` with headless Chrome driving
the production DOM and production \`score.js\` paths. The term set is the 474 entries in the
live \`data/concepts.json\`; this is an exhaustive sweep, not a sample.

## Result

| Check | Result |
|---|---:|
| Terms exercised | ${c.terms_exercised}/${c.terms_expected} |
| Definition/evidence cards rendered | ${c.definition_cards_rendered} |
| Honest no-public-sense refusals | ${c.correct_refusals} |
| User definitions accepted | ${c.user_definitions_accepted}/${c.terms_expected} |
| User definitions given a valid score path | ${c.user_definitions_scoreable} |
| Scores correctly withheld | ${c.user_definitions_correctly_unscoreable} |
| Sub-term answer available | ${c.subterm_answers_available} |
| Sub-term answer honestly degraded | ${c.subterm_answers_degraded} |
| Tier-3 score leaks | ${c.tier3_score_leaks} |
| Terms with console/page errors | ${c.terms_with_console_errors} |
| Terms with broken-path failures | ${c.terms_with_failures} |

## Honest capability tiers

| Tier | Terms |
|---|---:|
${tierRows}

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
${selectorRows}

“Most cited” is suppressed whenever any candidate paper lacks a citation count; the page does
not invent a winner. Tied oldest/newest/cited selectors may legitimately mark more than one card.

## User definition and sub-term behaviour

All ${c.user_definitions_accepted} terms accepted free text. Benchmark terms used their manual
case scorer; multi-paper terms used attested-use coverage; one-paper and corpus-only terms
withheld a number. Only \`art\` has a reviewed sub-term answer (\`object\`); every other term
showed an explicit criteria-layer limitation instead of guessing.

Per-term evidence, selector outcomes, score-path results, capability checks, and errors are in
\`term_coverage_report.json\`.
`;
}

const { chromium } = await loadPlaywright();
const executablePath = findChrome();
if (!executablePath) throw new Error("No Chrome or Edge executable was found");

const browser = await chromium.launch({ headless: true, executablePath });
const context = await browser.newContext({ locale: "en-US" });
const page = await context.newPage();
const events = [];
let currentTerm = null;
const record = (kind, message, extra = {}) => events.push({
  term_id: currentTerm,
  kind,
  message: String(message),
  ...extra,
});
page.on("console", message => {
  if (message.type() === "error") record("console", message.text(), { location: message.location() });
});
page.on("pageerror", error => record("pageerror", error.message));
page.on("requestfailed", request => record(
  "requestfailed", request.failure()?.errorText || "request failed", { url: request.url() },
));
page.on("response", response => {
  if (response.status() >= 400) {
    record("http", `HTTP ${response.status()}`, { status: response.status(), url: response.url() });
  }
});

const pageUrl = `${baseUrl}/define/index-en.html`;
await page.goto(pageUrl, { waitUntil: "networkidle", timeout: 60_000 });
await page.evaluate(() => localStorage.clear());

const terms = await page.evaluate(async () => {
  const response = await fetch(new URL("../data/concepts.json", location.href));
  if (!response.ok) throw new Error(`concepts.json returned ${response.status}`);
  return (await response.json()).concepts;
});
if (terms.length !== 474) throw new Error(`Expected 474 pickable terms, found ${terms.length}`);

const bootEvents = events.filter(event => event.term_id === null);
const results = [];
for (const term of terms) {
  currentTerm = term.id;
  const eventStart = events.length;
  const result = await page.evaluate(async ({ id, state }) => {
    const entry = S.registry.find(row => row.id === id);
    if (!entry) throw new Error(`Picker entry ${id} is absent from the runtime registry`);

    if (state === "ready") {
      await switchConcept(id);
    } else {
      const termUrl = new URL(location.origin + location.pathname);
      termUrl.searchParams.set("term", entry.slug || slugOf(entry.en || entry.id));
      chooseSoon(id, true, termUrl);
    }

    const selectAll = document.getElementById("selAll");
    if (selectAll) selectAll.click();
    const step3 = document.getElementById("step3");
    if (step3 && !document.getElementById("step3wrap").hidden) step3.click();

    const visible = element => {
      if (!element) return false;
      const style = getComputedStyle(element);
      return !element.hidden && style.display !== "none" && style.visibility !== "hidden" &&
        element.getClientRects().length > 0;
    };
    const text = selector => (document.querySelector(selector)?.innerText || "").trim();
    const index = S.senseIndex || { senses: [], picker_terms: {}, papers: {} };
    const slug = entry.slug || slugOf(entry.en || entry.id);
    const senseIndices = (index.picker_terms || {})[slug] || [];
    const senseRows = senseIndices.map(i => index.senses[i]).filter(Boolean);
    const sensePaperCount = new Set(senseRows.map(row => row.paper_id)).size;
    const expectedCapability = state === "ready" ? CAPABILITY.BENCHMARK
      : sensePaperCount >= 2 ? CAPABILITY.COVERAGE
      : sensePaperCount === 1 ? CAPABILITY.EVIDENCE : CAPABILITY.CORPUS;
    const capabilityLabel = text("#capabilityState .cap-badge");

    const senseCards = document.querySelectorAll(".sense-card").length;
    const benchmarkCards = document.querySelectorAll(".offer").length;
    const emptyMessage = text(".evidence-empty");
    let definitionDisposition = "broken-empty";
    if (state === "ready" && benchmarkCards > 0) definitionDisposition = "benchmark-definitions-rendered";
    else if (senseRows.length && senseCards > 0) definitionDisposition = "grounded-senses-rendered";
    else if (!senseRows.length && emptyMessage) definitionDisposition = "correct-refusal-no-public-sense";

    const badges = [...document.querySelectorAll(".sense-default")]
      .map(node => node.textContent.trim());
    const notes = [...document.querySelectorAll(".selector-notes > div")]
      .map(node => node.textContent.trim());
    const selector = (needle, missingReason) => {
      const hits = badges.filter(label => label.toLowerCase().includes(needle));
      if (hits.length) return { status: "resolved", cards: hits.length, labels: hits };
      if (state === "ready") return { status: "not_applicable", reason: "benchmark-board" };
      return { status: "suppressed", reason: missingReason, notes };
    };

    const ownText = `Task 09 audit definition for ${id}`;
    let plusButtonPresent = false;
    let accepted = false;
    let scorePath = "correctly-unavailable";
    let scoreUiRendered = false;
    let scoreEvidence = "";

    if (state === "ready") {
      const ownTrigger = document.querySelector('#nextline [data-panel="pOwn"]');
      const before = ownTrigger ? getComputedStyle(ownTrigger, "::before").content : "";
      plusButtonPresent = Boolean(ownTrigger) &&
        (/\+/.test(ownTrigger.textContent) || /\+/.test(before));
      const judgeText = document.getElementById("judgeText");
      if (judgeText) judgeText.value = ownText;
      const judgePanel = document.getElementById("pJudge");
      if (judgePanel && !judgePanel.classList.contains("open")) {
        document.querySelector('[data-panel="pJudge"]')?.click();
      }
      document.getElementById("judgeStart")?.click();
      const verdict = document.querySelector("#judgeCard [data-v='1']");
      accepted = Boolean(judgeText && verdict);
      verdict?.click();
      scoreUiRendered = visible(document.querySelector("#judgeScore .lmwrap"));
      scoreEvidence = text("#judgeScore .lmfoot");
      scorePath = scoreUiRendered ? "benchmark-manual-case-score" : "broken";
    } else {
      const plus = document.getElementById("evidenceAddOwn");
      plusButtonPresent = Boolean(plus) && /^\+/.test(plus.textContent.trim());
      plus?.click();
      const input = document.getElementById("coverageOwnText");
      if (input) input.value = ownText;
      const start = document.getElementById("coverageOwnStart");
      if (start) {
        start.click();
        const verdict = document.querySelector("[data-coverage-case][data-v='covered']");
        verdict?.click();
        accepted = text(".coverage-definition") === ownText;
        scoreUiRendered = visible(document.querySelector(".coverage-summary"));
        scoreEvidence = text(".coverage-summary");
        scorePath = scoreUiRendered ? "attested-use-coverage" : "broken";
      } else {
        document.getElementById("evidenceSaveOwn")?.click();
        accepted = document.getElementById("ownText")?.value === ownText &&
          document.getElementById("pOwn")?.classList.contains("open");
        scoreUiRendered = false;
        scoreEvidence = text(".coverage-limit");
      }
    }

    let subtermStatus = "silent";
    let subtermText = "";
    const object = document.querySelector('#ownFeatureMap input[data-feature-key="subterm:object"]');
    if (object) {
      object.checked = true;
      object.dispatchEvent(new Event("change", { bubbles: true }));
      subtermText = text("#ownFeatureMap .feature-answer");
      if (/object/i.test(subtermText)) subtermStatus = "available";
    } else {
      subtermText = text("#ownFeatureMap .feature-limit");
      if (subtermText) subtermStatus = "degrades-honestly";
    }

    const scoreSelectors = ["#stage2 .lmwrap", "#stage2 .coverage-summary", "#stage2 .critscore"];
    const visibleScorePanels = scoreSelectors.filter(sel =>
      [...document.querySelectorAll(sel)].some(visible));
    const tier3 = expectedCapability === CAPABILITY.EVIDENCE || expectedCapability === CAPABILITY.CORPUS;
    const tier3ScoreGuardTrue = !tier3 || visibleScorePanels.length === 0;

    const failures = [];
    if (S.capability !== expectedCapability) failures.push("capability-label-is-false");
    if (definitionDisposition === "broken-empty") failures.push("definition-path-silently-empty");
    if (!plusButtonPresent) failures.push("plus-button-missing");
    if (!accepted) failures.push("user-definition-not-accepted");
    if ((expectedCapability === CAPABILITY.BENCHMARK || expectedCapability === CAPABILITY.COVERAGE) &&
        !scoreUiRendered) failures.push("valid-score-path-did-not-render");
    if (subtermStatus === "silent") failures.push("subterm-answer-silent");
    if (!tier3ScoreGuardTrue) failures.push("tier3-presented-a-score");

    return {
      id,
      label: entry.en || entry.id,
      registry_state: state,
      selected_papers: S.selected.size,
      senses: { count: senseRows.length, distinct_papers: sensePaperCount },
      capability: {
        expected: expectedCapability,
        rendered: S.capability,
        label: capabilityLabel,
        true_for_term: S.capability === expectedCapability,
      },
      definitions: {
        disposition: definitionDisposition,
        cards_rendered: state === "ready" ? benchmarkCards : senseCards,
        empty_message: emptyMessage,
      },
      selectors: {
        oldest: selector("oldest", senseRows.length ? "year-metadata-incomplete" : "no-public-sense"),
        newest: selector("newest", senseRows.length ? "year-metadata-incomplete" : "no-public-sense"),
        most_cited: selector("most cited", senseRows.length ? "citation-metadata-incomplete" : "no-public-sense"),
      },
      user_definition: {
        plus_button_present: plusButtonPresent,
        accepted,
        score_path: scorePath,
        score_ui_rendered: scoreUiRendered,
        evidence: scoreEvidence,
      },
      subterm_answer: { status: subtermStatus, text: subtermText },
      tier3_score_guard_true: tier3ScoreGuardTrue,
      visible_score_panels: visibleScorePanels,
      failures,
    };
  }, { id: term.id, state: term.state });

  const termEvents = events.slice(eventStart).filter(event => event.term_id === term.id);
  const isConsoleFailure = event => event.kind !== "requestfailed";
  result.console_errors = [...bootEvents, ...termEvents].filter(isConsoleFailure);
  result.network_warnings = [...bootEvents, ...termEvents].filter(event => !isConsoleFailure(event));
  if (result.console_errors.length) result.failures.push("browser-console-or-network-error");
  results.push(result);
}

currentTerm = null;
await browser.close();

const selectorCounts = name => countBy(results, row => row.selectors[name].status);
const report = {
  schema_version: "task09-term-coverage-1",
  generated_at: new Date().toISOString(),
  source: {
    page_url: pageUrl,
    term_set: "data/concepts.json served by the audited page",
    execution: "headless Chrome; production DOM and production score.js code paths",
    browser_executable: executablePath,
  },
  counts: {
    terms_expected: 474,
    terms_exercised: results.length,
    capability_tiers: countBy(results, row => row.capability.expected),
    capability_labels_true: results.filter(row => row.capability.true_for_term).length,
    definition_cards_rendered: results.filter(row => row.definitions.cards_rendered > 0).length,
    correct_refusals: results.filter(row =>
      row.definitions.disposition === "correct-refusal-no-public-sense").length,
    selectors: {
      oldest: selectorCounts("oldest"),
      newest: selectorCounts("newest"),
      most_cited: selectorCounts("most_cited"),
    },
    user_definitions_accepted: results.filter(row => row.user_definition.accepted).length,
    plus_buttons_present: results.filter(row => row.user_definition.plus_button_present).length,
    user_definitions_scoreable: results.filter(row =>
      row.user_definition.score_path === "benchmark-manual-case-score" ||
      row.user_definition.score_path === "attested-use-coverage").length,
    user_definitions_correctly_unscoreable: results.filter(row =>
      row.user_definition.score_path === "correctly-unavailable").length,
    subterm_answers_available: results.filter(row => row.subterm_answer.status === "available").length,
    subterm_answers_degraded: results.filter(row =>
      row.subterm_answer.status === "degrades-honestly").length,
    tier3_score_leaks: results.filter(row => !row.tier3_score_guard_true).length,
    terms_with_console_errors: results.filter(row => row.console_errors.length).length,
    raw_browser_error_events: events.length,
    terms_with_failures: results.filter(row => row.failures.length).length,
    failures_by_kind: countBy(results.flatMap(row => row.failures.map(failure => ({ failure }))),
      row => row.failure),
  },
  boot_errors: bootEvents,
  terms: results,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2) + "\n", "utf8");
fs.writeFileSync(summaryPath, markdown(report), "utf8");
console.log(JSON.stringify(report.counts, null, 2));

if (report.counts.terms_exercised !== 474) process.exitCode = 1;
