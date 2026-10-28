import { chromium } from "playwright-core";
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const candidates = [
  process.env.BROWSER_PATH,
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
].filter(Boolean);

const executablePath = candidates.find((candidate) => existsSync(candidate));
if (!executablePath) {
  throw new Error("No Chromium-based browser found. Set BROWSER_PATH to Edge or Chrome.");
}

const base = process.env.APP_URL || "http://127.0.0.1:5173/";
const browser = await chromium.launch({ executablePath, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });

const targets = [
  { name: "screenshot.png", query: "", fullPage: true },
  { name: "screenshot-evolution.png", query: "?gene=HBB&view=evolution", fullPage: true },
  { name: "screenshot-variants.png", query: "?gene=HBB&view=variants&variant=HbS", fullPage: false },
  { name: "screenshot-cftr.png", query: "?gene=CFTR&view=variants&variant=F508del", fullPage: true },
  { name: "screenshot-protein.png", query: "?gene=TP53&view=protein", fullPage: false },
  { name: "screenshot-codons.png", query: "?gene=TP53&view=codons", fullPage: false },
  { name: "screenshot-frames.png", query: "?gene=S&view=frames", fullPage: false },
  { name: "screenshot-methods.png", query: "?gene=HBB&view=methods", fullPage: true },
  { name: "screenshot-mobile.png", query: "", fullPage: false, mobile: true },
];

mkdirSync(resolve("docs"), { recursive: true });
for (const target of targets) {
  const url = new URL(base);
  url.search = target.query.replace(/^\?/, "");
  await page.setViewportSize(
    target.mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
  );
  await page.goto(url.toString(), { waitUntil: "networkidle" });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(850);
  await page.screenshot({ path: resolve("docs", target.name), fullPage: target.fullPage });
  console.log(`${target.name} ← ${url}`);
}

await browser.close();
