import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(process.argv[2] || ".tmp-task06-browser");
const entry = path.join(root, "node_modules", "playwright-core", "index.mjs");
const { chromium } = await import(pathToFileURL(entry).href);
const chrome = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
].find(fs.existsSync);
assert(chrome, "Chrome or Edge is required for the meta-render visual audit");

const base = (process.argv[3] || "http://127.0.0.1:8765").replace(/\/$/, "");
const output = path.resolve("PLATFORM/data");
const browser = await chromium.launch({ headless: true, executablePath: chrome });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
page.on("pageerror", error => errors.push(error.message));

async function picker(shortForm, expected) {
  await page.goto(`${base}/define/index-en.html?q=${encodeURIComponent(shortForm)}`, {
    waitUntil: "networkidle",
  });
  const item = page.locator(`[data-soon="${shortForm.toLowerCase()}"]`).first();
  const text = await item.innerText();
  assert(text.includes(expected), `${shortForm} picker row did not show ${expected}`);
  await item.screenshot({ path: path.join(output, `meta_render_${shortForm.toLowerCase()}.png`) });
}

await picker("N", "no corpus-attested expansion");
await picker("RAM", "no corpus-attested expansion");

await page.goto(`${base}/define/index-en.html?term=pfc`, { waitUntil: "networkidle" });
const pfc = page.locator("#conceptSoon");
const pfcText = await pfc.innerText();
assert(pfcText.includes("PFC for prefrontal cortex"));
assert(pfcText.includes("Ambiguous short form"));
assert(pfcText.includes("withheld by the public-rights gate"));
assert(!pfcText.includes("perfluorocarbons"), "rights-denied PFC expansion leaked into the UI");
await pfc.screenshot({ path: path.join(output, "meta_render_pfc.png") });

assert.deepEqual(errors, [], `browser errors: ${errors.join(" | ")}`);
await browser.close();
console.log("Meta-render N/RAM/PFC visual audit: ok");
