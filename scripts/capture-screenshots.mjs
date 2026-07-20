import { mkdir } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

const baseURL = process.env.MUSEION_BASE_URL ?? "http://localhost:3000";
const outputDir = path.resolve("docs/assets/screenshots");
const pdfFixture = path.resolve("tests/fixtures/binary-search-golden-source.pdf");
await mkdir(outputDir, { recursive: true });

const launchOptions = process.env.MUSEION_BROWSER_PATH
  ? { executablePath: process.env.MUSEION_BROWSER_PATH, headless: true }
  : { channel: "chrome", headless: true };
const browser = await chromium.launch(launchOptions).catch(() => chromium.launch({ headless: true }));
const errors = [];

async function capture({ name, route, width = 1440, height = 1000, waitFor = "main", prepare, firstVisit = false }) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce" });
  // App-shell routes redirect first-time visitors to onboarding; seed the
  // flag except when capturing onboarding itself.
  if (!firstVisit) await context.addInitScript(() => localStorage.setItem("museion-onboarded", "1"));
  const page = await context.newPage();
  page.on("console", (message) => { if (message.type() === "error") errors.push(`${name}: ${message.text()}`); });
  page.on("pageerror", (error) => errors.push(`${name}: ${error.message}`));
  page.on("response", (response) => { if (response.status() >= 500) errors.push(`${name}: HTTP ${response.status()} ${response.url()}`); });
  await page.goto(`${baseURL}${route}`, { waitUntil: "domcontentloaded" });
  await page.locator(waitFor).waitFor({ state: "visible", timeout: 15_000 });
  if (prepare) await prepare(page);
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await page.screenshot({ path: path.join(outputDir, `${name}.png`), fullPage: false });
  await context.close();
}

async function seedWrongAnswer(page) {
  await page.goto(`${baseURL}/lessons/linear-equations-intro`, { waitUntil: "domcontentloaded" });
  const answer = page.getByRole("textbox", { name: "Your answer" });
  await answer.waitFor({ state: "visible", timeout: 15_000 });
  await answer.fill("2");
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await page.getByText("Not yet — stay with it.").waitFor({ state: "visible" });
}

try {
  await capture({ name: "landing-desktop", route: "/" });
  await capture({ name: "landing-mobile", route: "/", width: 375, height: 812 });
  await capture({ name: "onboarding-desktop", route: "/welcome", firstVisit: true });
  await capture({ name: "dashboard-desktop", route: "/dashboard", prepare: async (page) => { await seedWrongAnswer(page); await page.goto(`${baseURL}/dashboard`, { waitUntil: "domcontentloaded" }); } });
  await capture({ name: "dashboard-mobile", route: "/dashboard", width: 375, height: 812, prepare: async (page) => { await seedWrongAnswer(page); await page.goto(`${baseURL}/dashboard`, { waitUntil: "domcontentloaded" }); } });
  await capture({ name: "library-desktop", route: "/library" });
  await capture({ name: "course-physics-desktop", route: "/courses/forces-and-motion" });
  await capture({ name: "course-algebra-desktop", route: "/courses/algebra-as-balance" });
  await capture({ name: "creator-desktop", route: "/create", prepare: async (page) => {
    await page.getByRole("button", { name: /Course Architect Build from my material/ }).click();
    await page.getByRole("dialog", { name: "Course Architect" }).waitFor({ state: "visible" });
  } });
  await capture({ name: "creator-linked-source-desktop", route: "/create", prepare: async (page) => {
    await page.getByLabel("Material 1 title").fill("Playlist transcript");
    await page.getByLabel("Material 1 reference link").fill("https://www.youtube.com/playlist?list=OPEN-COURSE");
    await page.getByLabel("Material 1 authorized text").fill("Authorized creator notes explaining the central ideas and the learner decisions supported by this playlist.");
    await page.getByLabel("Material 1 role").selectOption("transcript");
    await page.getByRole("button", { name: "Add text material" }).click();
    await page.getByLabel("Material 2 title").fill("Book excerpt");
    await page.getByLabel("Material 2 role").selectOption("excerpt");
    await page.getByLabel("Material 2 reference link").fill("https://example.com/books/reasoning");
    await page.getByLabel("Material 2 reference type").selectOption("book");
    await page.getByLabel("Material 2 authorized text").fill("An authorized excerpt that supplies a second bounded explanation and a contrasting example.");
    await page.getByLabel("I am allowed to use every material in this Source Pack.").check();
    await page.getByRole("button", { name: "Normalize 2 materials" }).click();
    await page.getByText("2 normalized materials").waitFor({ state: "visible" });
    await page.getByText("youtube playlist reference", { exact: true }).waitFor({ state: "visible" });
    await page.getByText("Saved on this device", { exact: true }).waitFor({ state: "visible" });
  } });
  await capture({ name: "course-review-desktop", route: "/create", prepare: async (page) => {
    await page.getByText("No local draft", { exact: true }).waitFor({ state: "visible" });
    await page.locator("#source-file").setInputFiles(pdfFixture);
    await page.getByText("File ready for normalization").waitFor({ state: "visible" });
    await page.getByLabel("Rights basis").selectOption("creator-owned");
    await page.getByLabel("I am allowed to use every material in this Source Pack.").check();
    await page.getByRole("button", { name: "Normalize 1 material" }).click();
    await page.getByLabel("Source pages").getByRole("button", { name: "6", exact: true }).waitFor({ state: "visible" });
    await page.getByRole("button", { name: "Create verified replay run" }).click();
    await page.waitForURL((url) => url.pathname.startsWith("/create/review/"));
    await page.getByRole("heading", { name: "Coverage by supplied material" }).waitFor({ state: "visible" });
  } });
  await capture({ name: "review-desktop", route: "/review" });
  await capture({ name: "misconception-lab-desktop", route: "/review", prepare: async (page) => { await seedWrongAnswer(page); await page.goto(`${baseURL}/review`, { waitUntil: "domcontentloaded" }); } });
  await capture({
    name: "learning-desktop",
    route: "/lessons/algebra-balance-equality-as-invariant?course=algebra-as-balance",
    waitFor: "main",
  });
  await capture({ name: "recursion-lab-desktop", route: "/lessons/recursion-code-lab", prepare: async (page) => {
    await page.locator("label", { hasText: "calls f(5) forever" }).click();
    await page.getByRole("button", { name: "Check answer" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel("Choose base", { exact: true }).selectOption("0");
    await page.getByLabel("Choose baseReturn").selectOption("0");
    await page.getByLabel("Choose head").selectOption("n");
    await page.getByLabel("Choose next").selectOption("n");
    await page.getByText("It never stops.").waitFor({ state: "visible", timeout: 15_000 });
  } });
  await capture({ name: "transformation-lab-desktop", route: "/lessons/functions-as-change-transformation-lab", prepare: async (page) => {
    await page.locator("label", { hasText: "3 right and 2 up" }).click();
    await page.getByRole("button", { name: "Check answer" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Check my curve" }).waitFor({ state: "visible", timeout: 15_000 });
  } });
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

console.log(`Captured 20 Museion product screenshots in ${outputDir}`);
