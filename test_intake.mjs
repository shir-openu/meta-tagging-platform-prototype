import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const projectRoot = path.resolve(process.argv[2] || "..");
const base = (process.argv[3] || "http://127.0.0.1:8765").replace(/\/$/, "");
const playwright = path.join(projectRoot, ".tmp-task06-browser", "node_modules", "playwright-core", "index.mjs");
const executable = path.join(projectRoot, ".tmp-task06-browser", "browsers", "chromium-1187", "chrome-win", "chrome.exe");
const shots = path.join(projectRoot, "SHOTS");
assert(fs.existsSync(playwright), `playwright-core missing: ${playwright}`);
assert(fs.existsSync(executable), `required Chromium missing: ${executable}`);
fs.mkdirSync(shots, { recursive: true });

const { chromium } = await import(pathToFileURL(playwright).href);
const browser = await chromium.launch({ headless: true, executablePath: executable });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
const errors = [];
page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
page.on("pageerror", error => errors.push(error.message));
await page.route("https://shir-openu.github.io/beacon.js", route =>
  route.fulfill({ status: 200, contentType: "application/javascript", body: "" }));

await page.goto(`${base}/index.html`, { waitUntil: "networkidle" });
const intakeCard = page.locator("[data-intake-card]");
assert.equal(await intakeCard.count(), 1);
assert.match(await intakeCard.innerText(), /Send a paper for us to tag/);
assert.match(await intakeCard.innerText(), /\$1 · manual service/);
assert.equal(await intakeCard.locator("a.go").getAttribute("href"), "request-tagging.html");
const cards = page.locator(".acts .act");
assert.equal(await cards.count(), 3);
assert.match(await cards.nth(1).innerText(), /The method, and its limits/);
assert.match(await cards.nth(2).innerText(), /Send a paper/);
const colour = await intakeCard.locator("h2").evaluate(element => getComputedStyle(element).color);
assert.equal(colour, "rgb(231, 29, 202)");
await intakeCard.locator('button[aria-label^="why"]').click();
assert.match(await intakeCard.locator(".why.open").innerText(), /before asking for payment/);
await page.screenshot({ path: path.join(shots, "meta_intake_button.png"), fullPage: false });

await intakeCard.locator("a.go").click();
await page.waitForLoadState("networkidle");
assert.equal(new URL(page.url()).pathname.endsWith("/request-tagging.html"), true);
assert.match(await page.locator("h1").innerText(), /Send a paper/);
assert.match(await page.locator(".fee-math").innerText(), /\$0\.33 \(32\.9%\)/);
assert.match(await page.locator(".fee-math").innerText(), /\$0\.59 \(5\.9%\)/);
assert.match(await page.locator(".flow-list").innerText(), /Deliver, then capture/);
assert.match(await page.locator(".flow-stop").innerText(), /full refund/);
assert.equal(await page.locator('script[src*="stripe"], iframe, form[action]').count(), 0,
  "test surface must not connect a payment provider or submit a form");
assert.equal(await page.locator('input[type="file"]').getAttribute("accept"),
  ".mhtml,.mht,message/rfc822");

async function choose(name, value) {
  await page.locator(`input[name="${name}"][value="${value}"]`).check();
}
async function baseline() {
  await page.locator("#locator").fill("10.0000/example");
  await choose("source", "locator");
  await choose("fulltext", "yes");
  await choose("rights", "cleared");
  await choose("quality", "selectable");
  await choose("language", "english");
  await choose("scope", "paper");
}
async function submitExpect(code) {
  await page.locator(".check-button").click();
  const result = page.locator("#preflightResult");
  assert.equal(await result.getAttribute("data-state"), "refused");
  assert.match(await result.innerText(), new RegExp(code));
  assert.match(await result.innerText(), /No payment was requested/);
  assert.equal(await page.locator("#eligibleEmail").isHidden(), true);
}

await baseline();
await choose("fulltext", "no");
await submitExpect("NO_FULL_TEXT");
await choose("fulltext", "yes");
await choose("rights", "blocked");
await submitExpect("RIGHTS_NOT_CLEARED");
await choose("rights", "cleared");
await choose("quality", "scan");
await submitExpect("IMAGE_ONLY");
await choose("quality", "selectable");
await choose("source", "pdf");
await submitExpect("PDF_ONLY");

await choose("source", "locator");
await page.locator(".check-button").click();
assert.equal(await page.locator("#preflightResult").getAttribute("data-state"), "accepted");
assert.match(await page.locator("#preflightResult").innerText(), /No payment has been taken or held/);
assert.equal(await page.locator("#eligibleEmail").isVisible(), true);
assert.match(await page.locator("#eligibleEmail").getAttribute("href"), /^mailto:shirsivroni@gmail\.com/);
await page.screenshot({ path: path.join(shots, "meta_intake_preflight.png"), fullPage: true });

await page.goto(`${base}/index-he.html`, { waitUntil: "networkidle" });
const hebrewCard = page.locator("[data-intake-card]");
assert.equal(await page.locator("html").getAttribute("dir"), "rtl");
assert.match(await hebrewCard.innerText(), /שלחו לנו מאמר לתיוג/);
assert.match(await hebrewCard.innerText(), /\$1/);
assert.equal(await hebrewCard.locator("a.go").getAttribute("href"), "request-tagging-he.html");
await hebrewCard.locator("a.go").click();
await page.waitForLoadState("networkidle");
assert.equal(await page.locator("html").getAttribute("lang"), "he");
assert.match(await page.locator("h1").innerText(), /שלחו לנו מאמר לתיוג/);
assert.match(await page.locator(".flow-stop").innerText(), /מחזירים את מלוא הסכום/);

assert.deepEqual(errors, [], `browser errors: ${errors.join(" | ")}`);
await browser.close();
console.log("Intake entry, refusal, payment-state, bilingual, and screenshot checks: ok");
