import { mkdir } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

const baseURL = process.env.MUSEION_BASE_URL ?? "http://localhost:3000";
const outputDir = path.resolve("docs/assets/screenshots");
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];

async function capture({ name, route, width = 1440, height = 1000, waitFor = "main", prepare }) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce" });
  const page = await context.newPage();
  page.on("console", (message) => { if (message.type() === "error") errors.push(`${name}: ${message.text()}`); });
  page.on("pageerror", (error) => errors.push(`${name}: ${error.message}`));
  page.on("response", (response) => { if (response.status() >= 500) errors.push(`${name}: HTTP ${response.status()} ${response.url()}`); });
  await page.goto(`${baseURL}${route}`, { waitUntil: "domcontentloaded" });
  await page.locator(waitFor).waitFor({ state: "visible", timeout: 15_000 });
  if (prepare) await prepare(page);
  await page.screenshot({ path: path.join(outputDir, `${name}.png`), fullPage: false });
  await context.close();
}

async function seedWrongAnswer(page) {
  await page.goto(`${baseURL}/lessons/linear-equations-intro`, { waitUntil: "domcontentloaded" });
  const answer = page.getByRole("textbox", { name: "Your answer" });
  await answer.waitFor({ state: "visible", timeout: 15_000 });
  await answer.fill("2");
  await page.getByRole("button", { name: "Check" }).click();
  await page.getByText("Not yet — stay with it.").waitFor({ state: "visible" });
}

try {
  await capture({ name: "landing-desktop", route: "/" });
  await capture({ name: "landing-mobile", route: "/", width: 375, height: 812 });
  await capture({ name: "onboarding-desktop", route: "/welcome" });
  await capture({ name: "dashboard-desktop", route: "/dashboard", prepare: async (page) => { await seedWrongAnswer(page); await page.goto(`${baseURL}/dashboard`, { waitUntil: "domcontentloaded" }); } });
  await capture({ name: "dashboard-mobile", route: "/dashboard", width: 375, height: 812, prepare: async (page) => { await seedWrongAnswer(page); await page.goto(`${baseURL}/dashboard`, { waitUntil: "domcontentloaded" }); } });
  await capture({ name: "creator-desktop", route: "/create" });
  await capture({ name: "course-review-desktop", route: "/create/review" });
  await capture({ name: "review-desktop", route: "/review" });
  await capture({ name: "misconception-lab-desktop", route: "/review", prepare: async (page) => { await seedWrongAnswer(page); await page.goto(`${baseURL}/review`, { waitUntil: "domcontentloaded" }); } });
  await capture({ name: "learning-desktop", route: "/lessons/linear-equations-intro", waitFor: "main" });
  await capture({ name: "maia-intervention-desktop", route: "/lessons/linear-equations-intro", prepare: async (page) => {
    await seedWrongAnswer(page);
    await page.getByRole("button", { name: "ask Maia why" }).click();
    await page.getByText(/Maia is offline/).waitFor({ state: "visible", timeout: 15_000 });
  } });
  await capture({ name: "evidence-desktop", route: "/progress" });
  await capture({ name: "settings-desktop", route: "/settings", prepare: async (page) => { await page.getByRole("button", { name: "Refresh status" }).waitFor({ state: "visible", timeout: 15_000 }); } });
  await capture({ name: "search-desktop", route: "/dashboard", prepare: async (page) => {
    await page.getByRole("button", { name: "Search Museion" }).click();
    await page.getByRole("combobox", { name: "Search Museion" }).fill("binary");
    await page.getByRole("option", { name: /Binary Numbers/ }).waitFor({ state: "visible" });
  } });
} finally {
  await browser.close();
}

if (errors.length) {
  throw new Error(`Screenshot browser errors:\n${errors.join("\n")}`);
}

console.log(`Captured 14 Museion product screenshots in ${outputDir}`);
