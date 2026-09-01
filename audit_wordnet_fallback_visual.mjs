import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const projectRoot = path.resolve("..");
const browserRoot = path.resolve(process.argv[2] || path.join(projectRoot, ".tmp-task06-browser"));
const playwright = path.join(browserRoot, "node_modules", "playwright-core", "index.mjs");
const executable = [
  path.join(browserRoot, "browsers", "chromium-1187", "chrome-win", "chrome.exe"),
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
].find(fs.existsSync);
assert(fs.existsSync(playwright), `playwright-core missing: ${playwright}`);
assert(executable, "Chromium, Chrome, or Edge is required");

const { chromium } = await import(pathToFileURL(playwright).href);
const base = (process.argv[3] || "http://127.0.0.1:8765").replace(/\/$/, "");
const shots = path.join(projectRoot, "SHOTS");
fs.mkdirSync(shots, { recursive: true });

const browser = await chromium.launch({ headless: true, executablePath: executable });
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 }, deviceScaleFactor: 1 });
const errors = [];
page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
page.on("pageerror", error => errors.push(error.message));

await page.goto(`${base}/define/index-en.html`, { waitUntil: "networkidle" });
const conceptCard = page.locator('[data-panel="pConcept"]').first();
assert.equal(await page.locator("#conceptSearch").isVisible(), false,
  "concept input was visible before the Choose a concept card was clicked");
await conceptCard.click();
const search = page.locator("#conceptSearch");
await search.waitFor({ state: "visible" });
await search.fill("ontology");
const term = page.locator('[data-soon="ontology"]').first();
await term.waitFor({ state: "visible" });
await term.click();

await page.locator('[data-panel="pCorpus"]').first().click();
await page.locator("#paperList .pt-paper").first().waitFor({ state: "visible" });
await page.locator("#selAll").click();
await page.locator("#step3wrap").waitFor({ state: "visible" });
await page.locator("#step3").click();

const external = page.locator(".external-definitions");
await external.waitFor({ state: "visible" });
assert(await external.getAttribute("class").then(value => value.includes("is-off")),
  "external provider was not off by default");
assert.equal(await page.locator(".external-definition-card").count(), 0,
  "external glosses rendered before opt-in");
await page.locator("#externalDefinitionsToggle").check();
await page.locator(".external-definition-card").first().waitFor({ state: "visible" });
const text = await external.innerText();
assert(text.includes("External fallback definitions — not derived from this corpus"));
assert(text.includes("Princeton WordNet 3.0"));
assert(text.includes("License: WordNet"));
assert(text.includes("external rival definition"));
assert(text.includes("never changes corpus senses, counts, capabilities, or scores"));

await external.scrollIntoViewIfNeeded();
await page.screenshot({
  path: path.join(shots, "wordnet_fallback_ontology.png"),
  fullPage: false,
});
assert.deepEqual(errors, [], `browser errors: ${errors.join(" | ")}`);
await browser.close();
console.log("WordNet fallback interaction and screenshot audit: ok");
