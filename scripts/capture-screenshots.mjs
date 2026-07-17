import { mkdir } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

const baseURL = process.env.MUSEION_BASE_URL ?? "http://localhost:3000";
const outputDir = path.resolve("docs/assets/screenshots");
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];

async function capture({ name, route, width = 1440, height = 1000, waitFor = "main" }) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce" });
  const page = await context.newPage();
  page.on("console", (message) => { if (message.type() === "error") errors.push(`${name}: ${message.text()}`); });
  page.on("pageerror", (error) => errors.push(`${name}: ${error.message}`));
  page.on("response", (response) => { if (response.status() >= 500) errors.push(`${name}: HTTP ${response.status()} ${response.url()}`); });
  await page.goto(`${baseURL}${route}`, { waitUntil: "domcontentloaded" });
  await page.locator(waitFor).waitFor({ state: "visible", timeout: 15_000 });
  await page.screenshot({ path: path.join(outputDir, `${name}.png`), fullPage: false });
  await context.close();
}

try {
  await capture({ name: "landing-desktop", route: "/" });
  await capture({ name: "dashboard-desktop", route: "/dashboard" });
  await capture({ name: "dashboard-mobile", route: "/dashboard", width: 375, height: 812 });
  await capture({ name: "creator-desktop", route: "/create" });
  await capture({ name: "review-desktop", route: "/review" });
  await capture({ name: "learning-desktop", route: "/lessons/linear-equations-intro", waitFor: "main" });
  await capture({ name: "evidence-desktop", route: "/progress" });
  await capture({ name: "settings-desktop", route: "/settings" });
} finally {
  await browser.close();
}

if (errors.length) {
  throw new Error(`Screenshot browser errors:\n${errors.join("\n")}`);
}

console.log(`Captured 8 Museion product screenshots in ${outputDir}`);
