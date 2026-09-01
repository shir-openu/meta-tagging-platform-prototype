import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(?:[A-Za-z]:)/, match => match.slice(1)));
const read = name => fs.readFileSync(path.join(root, name), "utf8");
const enEntry = read("index.html");
const heEntry = read("index-he.html");
const en = read("request-tagging.html");
const he = read("request-tagging-he.html");
const css = read("css/intake.css");
const js = read("js/intake.js");

for (const [name, source] of [["index.html", enEntry], ["index-he.html", heEntry]]) {
  assert.equal((source.match(/data-intake-card/g) || []).length, 1, `${name}: intake card count`);
  assert(source.indexOf("data-intake-card") > source.indexOf("The method, and its limits") || name.endsWith("-he.html"));
  assert(source.indexOf("data-intake-card") < source.indexOf('class="pt-soon"'), `${name}: card must precede live strip`);
  assert(!/planned:[^<]*upload a paper/i.test(source), `${name}: obsolete planned-upload line remains`);
}
assert(enEntry.includes('href="request-tagging.html"'));
assert(heEntry.includes('href="request-tagging-he.html"'));
assert(enEntry.includes("$1 · manual service"));
assert(heEntry.includes("$1"));

for (const [name, source] of [["request-tagging.html", en], ["request-tagging-he.html", he]]) {
  assert(source.includes('id="intakePreflight"'));
  assert(!/<form[^>]+action=/i.test(source), `${name}: form must not submit`);
  assert(!/(js\.stripe\.com|checkout\.stripe\.com|pay\.google\.com)/i.test(source), `${name}: live payment code present`);
  assert(source.includes('accept=".mhtml,.mht,message/rfc822"'));
  assert(source.includes("NO_FULL_TEXT"));
  assert(source.includes("RIGHTS_NOT_CLEARED"));
  assert(source.includes("IMAGE_ONLY"));
  assert(source.includes("$0.33 (32.9%)"));
  assert(source.includes("$0.59 (5.9%)"));
  assert(source.includes("$9.41"));
  assert(source.includes("https://stripe.com/pricing"));
  assert(source.includes("https://developers.google.com/pay/api/web/support/faq"));
  assert(source.includes("https://vercel.com/pricing"));
  assert(source.includes("$20") || source.includes("20 דולר"));
}
assert(en.includes("Deliver, then capture"));
assert(en.includes("full refund"));
assert(he.includes("מסירה, ואז חיוב"));
assert(he.includes("מחזירים את מלוא הסכום"));
assert(!/(?:color\s*:\s*(?:white|#fff(?:fff)?))(?:\s|;|})/i.test(css),
  "intake CSS violates the no-white-text rule");

const sandbox = { window: {}, document: { getElementById() { return null; } } };
vm.createContext(sandbox);
vm.runInContext(js, sandbox);
const evaluate = sandbox.window.__INTAKE_EVALUATE__;
assert.equal(typeof evaluate, "function");
const good = {
  locator: "10.0000/example", source: "locator", rights: "cleared", fulltext: "yes",
  quality: "selectable", language: "english", scope: "paper"
};
assert.equal(evaluate(good).state, "accepted");
for (const [change, reason] of [
  [{ fulltext: "no" }, "NO_FULL_TEXT"],
  [{ rights: "blocked" }, "RIGHTS_NOT_CLEARED"],
  [{ rights: "unknown" }, "RIGHTS_NOT_CLEARED"],
  [{ quality: "scan" }, "IMAGE_ONLY"],
  [{ source: "pdf" }, "PDF_ONLY"],
  [{ language: "other" }, "UNSUPPORTED_LANGUAGE"],
  [{ scope: "other" }, "OUT_OF_SCOPE"]
]) {
  const decision = evaluate({ ...good, ...change });
  assert.equal(decision.state, "refused");
  assert.equal(decision.reason, reason);
}
assert.equal(evaluate({ ...good, locator: "" }).state, "incomplete");

for (const source of [en, he]) {
  for (const match of source.matchAll(/(?:href|src)="([^"#]+)"/g)) {
    const target = match[1].split("?")[0];
    if (/^(?:https?:|mailto:)/.test(target)) continue;
    assert(fs.existsSync(path.join(root, target)), `missing local target: ${target}`);
  }
}

console.log("Intake static, refusal-state, pricing, bilingual, and local-link checks: ok");
