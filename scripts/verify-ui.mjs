import { mkdir } from "node:fs/promises";
import path from "node:path";

import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";

const baseURL = process.env.MUSEION_BASE_URL ?? "http://localhost:3000";
const outputDir = path.resolve("output/playwright/smoke");
const pdfFixture = path.resolve("tests/fixtures/binary-search-golden-source.pdf");
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const failures = [];

function watch(page, label) {
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(`${label} console: ${message.text()}`);
  });
  page.on("pageerror", (error) => failures.push(`${label} page: ${error.message}`));
  page.on("response", (response) => {
    if (response.status() >= 500) {
      failures.push(`${label} HTTP ${response.status()}: ${response.url()}`);
    }
  });
}

async function expectVisible(locator, description) {
  await locator.waitFor({ state: "visible", timeout: 10_000 }).catch(() => {
    throw new Error(`Expected visible: ${description}`);
  });
}

function recordAxeViolations(label, results) {
  for (const violation of results.violations) {
    const targets = violation.nodes
      .slice(0, 3)
      .map((node) => `${node.target.join(" ")} (${node.failureSummary?.replaceAll("\n", " ") ?? node.html})`)
      .join(", ");
    failures.push(`${label} axe ${violation.id} (${violation.impact ?? "unknown"}): ${violation.help} [${targets}]`);
  }
}

async function scanPage(page, label) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  recordAxeViolations(label, results);
}

async function accessibilityFlow() {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  await desktop.addInitScript(() => localStorage.setItem("museion-onboarded", "1"));
  const desktopPage = await desktop.newPage();
  watch(desktopPage, "accessibility-desktop");
  const routes = [
    "/",
    "/welcome",
    "/create",
    "/settings",
    "/create/review",
    "/judge",
    "/lessons/linear-equations-intro",
    "/lessons/linear-equations-intro/practice",
    "/progress",
    "/about",
    "/privacy",
    "/terms",
  ];

  for (const route of routes) {
    await desktopPage.goto(`${baseURL}${route}`);
    await desktopPage.locator("main").waitFor({ state: "visible" });
    await scanPage(desktopPage, `desktop ${route}`);
  }
  const notFoundPage = await desktop.newPage();
  await notFoundPage.goto(`${baseURL}/missing-route`);
  await notFoundPage.locator("main").waitFor({ state: "visible" });
  await scanPage(notFoundPage, "desktop /missing-route");
  await desktop.close();

  const mobile = await browser.newContext({ viewport: { width: 320, height: 700 }, reducedMotion: "reduce" });
  await mobile.addInitScript(() => localStorage.setItem("museion-onboarded", "1"));
  const mobilePage = await mobile.newPage();
  watch(mobilePage, "accessibility-mobile");
  for (const route of ["/", "/create", "/settings", "/judge"]) {
    await mobilePage.goto(`${baseURL}${route}`);
    await mobilePage.locator("main").waitFor({ state: "visible" });
    await scanPage(mobilePage, `mobile ${route}`);
    const currentLink = mobilePage.getByRole("navigation", { name: "Primary navigation" }).locator('[aria-current="page"]:visible');
    if (await currentLink.count()) {
      const visible = await currentLink.evaluate((link) => {
        const rect = link.getBoundingClientRect();
        return rect.left >= 0 && rect.right <= window.innerWidth;
      });
      if (!visible) failures.push(`mobile ${route}: current navigation item is outside the viewport`);
    }
    const pageOverflows = await mobilePage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    if (pageOverflows) failures.push(`mobile ${route}: page has horizontal overflow`);
  }
  await mobile.close();
}

async function keyboardActivate(page, locator, key = "Enter") {
  await locator.click({ trial: true });
  await locator.focus();
  await page.keyboard.press(key);
}

async function mobileNavigationFlow() {
  const context = await browser.newContext({ viewport: { width: 320, height: 700 }, reducedMotion: "reduce" });
  await context.addInitScript(() => localStorage.setItem("museion-onboarded", "1"));
  const page = await context.newPage();
  watch(page, "mobile-navigation");
  await page.goto(`${baseURL}/`);

  const moreButton = page.getByRole("button", { name: "More pages" });
  await keyboardActivate(page, moreButton);
  await expectVisible(page.getByRole("link", { name: "Settings", exact: true }), "mobile Settings destination");
  await page.keyboard.press("Escape");
  if (await page.locator("#mobile-more-navigation").count()) failures.push("mobile navigation: Escape did not close the More menu");
  if (!(await moreButton.evaluate((button) => button === document.activeElement))) {
    failures.push("mobile navigation: focus did not return to the More button after Escape");
  }

  await moreButton.click();
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page.waitForURL((url) => url.pathname === "/settings");
  const settingsButton = page.getByRole("button", { name: /Settings, current page; more pages/ });
  if ((await settingsButton.getAttribute("aria-current")) !== "page") {
    failures.push("mobile navigation: current secondary page is not exposed on the compact navigation");
  }
  const mobileHeaderCollision = await page.evaluate(() => {
    const brand = document.querySelector("[data-mobile-brand]");
    const navigation = document.querySelector('nav[aria-label="Primary navigation"]');
    if (!(brand instanceof HTMLElement) || !(navigation instanceof HTMLElement)) return true;
    const brandRect = brand.getBoundingClientRect();
    const navigationRect = navigation.getBoundingClientRect();
    return brandRect.right > navigationRect.left;
  });
  if (mobileHeaderCollision) failures.push("mobile navigation: brand and compact navigation overlap");
  if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) {
    failures.push("mobile navigation: compact header causes horizontal overflow");
  }
  await context.close();
}

async function keyboardFill(page, locator, value) {
  await locator.focus();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type(value);
}

async function keyboardJudgeFlow() {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  watch(page, "keyboard-judge");
  await page.goto(`${baseURL}/judge`);
  await expectVisible(page.getByText("Verified replay", { exact: true }), "keyboard replay badge");
  await keyboardActivate(page, page.getByRole("button", { name: /Continue/ }));

  await keyboardActivate(page, page.getByRole("radio").first(), "Space");
  await keyboardActivate(page, page.getByRole("button", { name: "Check prediction" }));
  await expectVisible(page.getByText("Prediction matches the deterministic answer."), "keyboard prediction");
  await keyboardActivate(page, page.getByRole("button", { name: /Continue/ }));

  await keyboardFill(page, page.getByLabel("Next low"), "4");
  await keyboardFill(page, page.getByLabel("Next high"), "6");
  await keyboardActivate(page, page.getByRole("button", { name: "Update interval" }));
  await keyboardActivate(page, page.getByRole("button", { name: "Confirm target at mid" }));
  await expectVisible(page.getByText("Target found at the verified midpoint."), "keyboard range");
  await keyboardActivate(page, page.getByRole("button", { name: /Continue/ }));

  for (const [low, high, mid] of [["0", "1", "0"], ["1", "1", "1"]]) {
    await keyboardFill(page, page.getByLabel("Low", { exact: true }), low);
    await keyboardFill(page, page.getByLabel("High", { exact: true }), high);
    await keyboardFill(page, page.getByLabel("Mid", { exact: true }), mid);
    await keyboardActivate(page, page.getByRole("button", { name: "Check next state" }));
  }
  await expectVisible(page.getByText("Trace complete."), "keyboard trace");
  await keyboardActivate(page, page.getByRole("button", { name: /Continue/ }));

  const compareUp = page.locator('button[aria-label*="Compare values"][aria-label$="up"]');
  const proveUp = page.locator('button[aria-label*="prove one region"][aria-label$="up"]');
  const boundaryUp = page.locator('button[aria-label*="corresponding boundary"][aria-label$="up"]');
  for (let index = 0; index < 3; index += 1) await keyboardActivate(page, compareUp);
  for (let index = 0; index < 2; index += 1) await keyboardActivate(page, proveUp);
  await keyboardActivate(page, boundaryUp);
  await keyboardActivate(page, page.getByRole("button", { name: "Check order" }));
  await expectVisible(page.getByText("The reasoning order is valid."), "keyboard sequence");
  await keyboardActivate(page, page.getByRole("button", { name: /Finish lesson/ }));

  await keyboardActivate(page, page.getByRole("button", { name: "Start locked transfer" }));
  await expectVisible(page.getByText("Maia 0 · hints 0 · solutions 0"), "keyboard transfer lock");
  await keyboardFill(page, page.getByLabel("Final index"), "4");
  await keyboardActivate(page, page.getByRole("button", { name: "Submit only attempt" }));
  await expectVisible(page.getByRole("heading", { name: "Correct" }), "keyboard transfer result");
  await expectVisible(page.getByRole("heading", { name: "Evidence ledger" }), "keyboard evidence ledger");
  await context.close();
}

async function performanceBudgetFlow() {
  const budgets = { totalBytes: 400 * 1024, javascriptBytes: 250 * 1024, cls: 0.02 };
  for (const route of ["/welcome", "/create", "/judge"]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    await context.addInitScript(() => {
      localStorage.setItem("museion-onboarded", "1");
      window.__museionCls = 0;
      window.__museionShifts = [];
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            window.__museionCls += entry.value;
            window.__museionShifts.push({
              value: entry.value,
              scrollY: window.scrollY,
              sources: entry.sources?.map((source) => ({
                node: source.node ? `${source.node.nodeName.toLowerCase()}${source.node.id ? `#${source.node.id}` : ""}.${[...source.node.classList].slice(0, 3).join(".")}` : "unknown",
                previousRect: source.previousRect,
                currentRect: source.currentRect,
              })) ?? [],
            });
          }
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    const page = await context.newPage();
    watch(page, `performance ${route}`);
    await page.goto(`${baseURL}${route}`, { waitUntil: "networkidle" });
    if (route === "/judge") await expectVisible(page.getByText("Verified replay", { exact: true }), "performance judge ready");
    const metrics = await page.evaluate(() => {
      const entries = [...performance.getEntriesByType("navigation"), ...performance.getEntriesByType("resource")];
      return {
        totalBytes: entries.reduce((sum, entry) => sum + (entry.encodedBodySize || entry.transferSize || 0), 0),
        javascriptBytes: entries
          .filter((entry) => entry.initiatorType === "script" || entry.name.includes("/_next/static/chunks/"))
          .reduce((sum, entry) => sum + (entry.encodedBodySize || entry.transferSize || 0), 0),
        cls: window.__museionCls ?? 0,
        shifts: window.__museionShifts ?? [],
      };
    });
    console.log(`Performance ${route}: ${(metrics.totalBytes / 1024).toFixed(1)} KiB total, ${(metrics.javascriptBytes / 1024).toFixed(1)} KiB JS, CLS ${metrics.cls.toFixed(3)}`);
    if (metrics.totalBytes > budgets.totalBytes) failures.push(`performance ${route}: total transfer exceeds 400 KiB`);
    if (metrics.javascriptBytes > budgets.javascriptBytes) failures.push(`performance ${route}: JavaScript transfer exceeds 250 KiB`);
    if (metrics.cls > budgets.cls) failures.push(`performance ${route}: CLS ${metrics.cls.toFixed(3)} exceeds ${budgets.cls}; ${JSON.stringify(metrics.shifts)}`);
    await context.close();
  }
}

async function submitTextAnswer(page, answer) {
  const input = page.getByPlaceholder("Your answer");
  await input.fill(answer);
  await page.getByRole("button", { name: "Check" }).click();
}

async function learnerRecoveryFlow() {
  const context = await browser.newContext({ viewport: { width: 768, height: 900 } });
  await context.addInitScript(() => {
    localStorage.setItem("museion-onboarded", "1");
    localStorage.setItem("museion-session-lesson-linear-equations-intro", "temporarily-unavailable");
  });
  const page = await context.newPage();
  await page.route("**/api/sessions/temporarily-unavailable", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "temporary outage" }) }));
  await page.goto(`${baseURL}/lessons/linear-equations-intro`);
  await expectVisible(page.getByRole("heading", { name: "Your lesson could not open." }), "session recovery error state");
  const preserved = await page.evaluate(() => localStorage.getItem("museion-session-lesson-linear-equations-intro"));
  if (preserved !== "temporarily-unavailable") failures.push("learner recovery: temporary server failure discarded the saved session");
  await context.close();
}

async function staleMaiaFlow() {
  const context = await browser.newContext({ viewport: { width: 768, height: 900 } });
  await context.addInitScript(() => localStorage.setItem("museion-onboarded", "1"));
  const page = await context.newPage();
  watch(page, "stale-maia");
  await page.goto(`${baseURL}/lessons/linear-equations-intro`);
  await expectVisible(page.getByText(/what number should we subtract from BOTH sides/i), "stale Maia lesson step");
  await submitTextAnswer(page, "6");
  await expectVisible(page.getByRole("button", { name: /Continue/ }), "stale Maia advance control");
  await page.route("**/api/sessions/*/maia", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 3_000));
    await route.continue();
  });
  await page.getByLabel("Message for Maia").fill("Explain this step without giving the answer");
  await page.getByRole("button", { name: "Send" }).click();
  await page.getByRole("button", { name: /Continue/ }).click();
  await expectVisible(page.getByText("Step 2 of 4"), "stale Maia advanced step");
  await expectVisible(page.getByText("The lesson moved to a new step, so I stopped that reply."), "stale Maia response cancellation");
  await context.close();
}

async function queuedMaiaOutboxFlow() {
  const context = await browser.newContext({ viewport: { width: 768, height: 900 } });
  await context.addInitScript(() => localStorage.setItem("museion-onboarded", "1"));
  const page = await context.newPage();
  watch(page, "queued-maia-outbox");
  let maiaRequests = 0;
  await page.route("**/api/sessions/*/maia", async (route) => {
    maiaRequests += 1;
    if (maiaRequests === 1) await new Promise((resolve) => setTimeout(resolve, 750));
    await route.continue();
  });

  await page.goto(`${baseURL}/lessons/linear-equations-intro`);
  await submitTextAnswer(page, "2");
  const askWhy = page.getByRole("button", { name: "ask Maia why" });
  const firstRequest = page.waitForRequest((request) => request.url().includes("/maia") && request.method() === "POST");
  await askWhy.click();
  await firstRequest;
  await expectVisible(page.getByRole("button", { name: "Cancel" }), "Maia first request in flight");

  const secondRequest = page.waitForRequest((request) => request.url().includes("/maia") && request.method() === "POST");
  await askWhy.click();
  await secondRequest;
  await expectVisible(page.getByText(/I just answered wrong and I'm not sure why/).nth(1), "queued Maia outbox delivery");
  if (maiaRequests !== 2) failures.push(`queued Maia outbox: expected 2 requests, received ${maiaRequests}`);
  await context.close();
}

async function staleQueuedOutboxFlow() {
  const context = await browser.newContext({ viewport: { width: 768, height: 900 } });
  await context.addInitScript(() => localStorage.setItem("museion-onboarded", "1"));
  const page = await context.newPage();
  watch(page, "stale-queued-outbox");
  let maiaRequests = 0;
  await page.route("**/api/sessions/*/maia", async (route) => {
    maiaRequests += 1;
    await new Promise((resolve) => setTimeout(resolve, 3_000));
    await route.continue();
  });

  await page.goto(`${baseURL}/lessons/linear-equations-intro`);
  await submitTextAnswer(page, "6");
  await page.getByLabel("Message for Maia").fill("Explain this step without giving the answer");
  await page.getByRole("button", { name: "Send" }).click();
  await expectVisible(page.getByRole("button", { name: "Cancel" }), "Maia request before queued self-explanation");
  await page.getByLabel(/Lock it in/).fill("Subtracting the same amount preserves equality");
  await page.getByRole("button", { name: "Check with Maia" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expectVisible(page.getByText("Step 2 of 4"), "advance after queued self-explanation");
  await page.waitForTimeout(3_300);
  if (maiaRequests !== 1) failures.push(`stale queued outbox: expected 1 request, received ${maiaRequests}`);
  await context.close();
}

async function safeMutationRetryFlow() {
  const context = await browser.newContext({ viewport: { width: 768, height: 900 } });
  await context.addInitScript(() => localStorage.setItem("museion-onboarded", "1"));
  const page = await context.newPage();
  page.on("pageerror", (error) => failures.push(`safe-mutation-retry page: ${error.message}`));
  const commands = [];
  let answerRequests = 0;
  await page.route("**/api/sessions/*/answer", async (route) => {
    answerRequests += 1;
    commands.push(JSON.parse(route.request().postData() ?? "{}"));
    if (answerRequests === 1) {
      await route.fetch();
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "The answer result was temporarily unavailable." }),
      });
      return;
    }
    await route.continue();
  });

  await page.goto(`${baseURL}/lessons/linear-equations-intro`);
  await submitTextAnswer(page, "2");
  await expectVisible(page.getByRole("button", { name: "Retry the same answer safely" }), "safe answer retry action");
  await expectVisible(page.getByRole("button", { name: "Recover saved state" }), "authoritative recovery action");
  await page.getByRole("button", { name: "Retry the same answer safely" }).click();
  await expectVisible(page.getByText("Not yet — stay with it."), "idempotent retry outcome");

  if (answerRequests !== 2) failures.push(`safe mutation retry: expected 2 requests, received ${answerRequests}`);
  if (commands[0]?.idempotencyKey !== commands[1]?.idempotencyKey) {
    failures.push("safe mutation retry: idempotency key changed between attempts");
  }
  await context.close();
}

async function authoritativeRecoveryFlow() {
  const context = await browser.newContext({ viewport: { width: 768, height: 900 } });
  await context.addInitScript(() => localStorage.setItem("museion-onboarded", "1"));
  const page = await context.newPage();
  page.on("pageerror", (error) => failures.push(`authoritative-recovery page: ${error.message}`));
  let answerRequests = 0;
  await page.route("**/api/sessions/*/answer", async (route) => {
    answerRequests += 1;
    if (answerRequests === 1) {
      await route.fetch();
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "The answer result was temporarily unavailable." }),
      });
      return;
    }
    await route.continue();
  });

  await page.goto(`${baseURL}/lessons/linear-equations-intro`);
  await submitTextAnswer(page, "2");
  await page.getByRole("button", { name: "Recover saved state" }).click();
  await expectVisible(page.getByRole("button", { name: "Check" }), "answer control after state recovery");
  await submitTextAnswer(page, "6");
  await expectVisible(page.getByText(/Correct — nice reasoning/), "answer after authoritative recovery");
  if (answerRequests !== 2) failures.push(`authoritative recovery: expected 2 answer requests, received ${answerRequests}`);
  await context.close();
}

async function desktopFlow() {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();
  watch(page, "desktop");

  await page.goto(`${baseURL}/welcome`);
  await page.getByRole("button", { name: "Skip" }).click();
  await page.waitForURL((url) => url.pathname === "/");
  await expectVisible(page.getByRole("heading", { name: /Learn by reasoning/ }), "catalog heading");
  await expectVisible(page.getByText("Every link in the chain is inspectable."), "source-to-evidence narrative");
  const activeLessons = await page.getByRole("link", { name: "Lessons", exact: true }).getAttribute("aria-current");
  if (activeLessons !== "page") failures.push("desktop: Lessons navigation is not marked current");

  await page.keyboard.press("/");
  const catalogSearch = page.getByLabel("Find a lesson or concept");
  if (!(await catalogSearch.evaluate((input) => input === document.activeElement))) {
    failures.push("catalog: slash shortcut did not focus search");
  }
  await catalogSearch.fill("binary");
  await expectVisible(page.getByRole("link", { name: /Binary Numbers/ }), "catalog concept search");
  if (await page.getByRole("link", { name: /Solving Linear Equations/ }).count()) {
    failures.push("catalog: search retained a non-matching lesson");
  }
  await catalogSearch.fill("concept-that-does-not-exist");
  await expectVisible(page.getByRole("heading", { name: "No lesson matches yet" }), "catalog empty state");
  await page.getByRole("button", { name: "Reset the catalog" }).click();
  await page.getByRole("button", { name: "Computer Science" }).click();
  await expectVisible(page.getByRole("link", { name: /Binary Numbers/ }), "catalog subject filter");
  if (await page.getByRole("link", { name: /Solving Linear Equations/ }).count()) {
    failures.push("catalog: subject filter retained an algebra lesson");
  }
  await page.getByRole("button", { name: "Clear search and filters" }).click();
  await expectVisible(page.getByRole("link", { name: /Solving Linear Equations/ }), "catalog reset");
  await page.screenshot({ path: path.join(outputDir, "desktop-catalog.png"), fullPage: true });

  await page.getByRole("link", { name: /Solving Linear Equations/ }).click();
  await expectVisible(page.getByText(/what number should we subtract from BOTH sides/i), "first lesson step");

  let rapidAnswerRequests = 0;
  const delayedAnswer = async (route) => {
    rapidAnswerRequests += 1;
    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.continue();
  };
  await page.route("**/api/sessions/*/answer", delayedAnswer);
  const answerInput = page.getByPlaceholder("Your answer");
  await answerInput.fill("2");
  await page.getByRole("button", { name: "Check" }).evaluate((button) => {
    button.click();
    button.click();
  });
  await expectVisible(page.getByRole("button", { name: "Checking…" }), "answer pending state");
  await expectVisible(page.getByText("Not yet — stay with it."), "wrong-answer feedback");
  const wrongFeedback = page.getByRole("alert").filter({ hasText: "Not yet" });
  if (!(await wrongFeedback.evaluate((element) => element === document.activeElement))) {
    failures.push("lesson feedback: wrong-answer result did not receive focus");
  }
  await page.getByRole("button", { name: "Try the answer again" }).click();
  if (!(await answerInput.evaluate((input) => input === document.activeElement))) {
    failures.push("lesson feedback: retry action did not return focus to the answer");
  }
  await page.unroute("**/api/sessions/*/answer", delayedAnswer);
  if (rapidAnswerRequests !== 1) failures.push(`lesson answer lock: expected 1 request, received ${rapidAnswerRequests}`);
  await page.getByRole("button", { name: "Take a hint" }).click();
  await expectVisible(page.getByText(/^1\./), "first deterministic hint");

  const maiaInput = page.getByLabel("Message for Maia");
  await maiaInput.fill("x".repeat(2_050));
  if ((await maiaInput.inputValue()).length !== 2_000) {
    failures.push("Maia composer: browser limit did not match the server limit");
  }
  await expectVisible(page.getByText("2000/2000", { exact: true }), "Maia character limit");
  await maiaInput.fill("Give me a nudge");
  await page.getByRole("button", { name: "Send" }).click();
  await expectVisible(page.getByText(/Maia is offline/), "deterministic Maia fallback");

  await submitTextAnswer(page, "6");
  await expectVisible(page.getByText(/Correct — nice reasoning/), "correct feedback");
  await page.reload();
  await expectVisible(page.getByText(/Correct — nice reasoning/), "post-solve resume feedback");
  await expectVisible(page.getByRole("button", { name: /Continue/ }), "post-solve resume advance");
  await page.getByRole("button", { name: /Continue/ }).click();
  for (const answer of ["4", "5"]) {
    await submitTextAnswer(page, answer);
    await page.getByRole("button", { name: /Continue/ }).click();
  }
  await submitTextAnswer(page, "3");
  await expectVisible(page.getByText(/Correct — nice reasoning/), "final correct feedback");
  await page.getByRole("button", { name: /Continue/ }).click();
  await expectVisible(page.getByRole("heading", { name: "Lesson complete" }), "lesson completion");
  await expectVisible(page.getByRole("link", { name: /Try practice mode/ }), "practice entry");
  await page.screenshot({ path: path.join(outputDir, "desktop-complete.png"), fullPage: true });

  await page.getByRole("link", { name: /Try practice mode/ }).click();
  await expectVisible(page.getByText(/Practice mode: no hint ladder/), "practice mode");
  if (await page.getByRole("button", { name: "Take a hint" }).count()) {
    failures.push("practice: hint control is visible");
  }

  await page.getByRole("link", { name: "Progress", exact: true }).click();
  await expectVisible(page.getByRole("heading", { name: "My progress" }), "progress page");
  await expectVisible(page.getByText("Solving Linear Equations").first(), "completed lesson progress");
  await expectVisible(page.getByText(/not proof of durable mastery or transfer/), "truthful progress boundary");
  await expectVisible(page.getByRole("progressbar", { name: /adaptive support estimate/ }).first(), "accessible support estimate");
  await expectVisible(page.getByRole("link", { name: "Practice without hints" }).first(), "recommended practice action");

  await page.getByRole("link", { name: "Create", exact: true }).click();
  await expectVisible(page.getByRole("heading", { name: /Start with a source/ }), "source creator");
  await expectVisible(page.getByText("After source review", { exact: true }), "sequential creator progress");
  const currentCreatorStep = page.locator('[aria-label="Creator progress"] [aria-current="step"]');
  if ((await currentCreatorStep.textContent())?.includes("1. Source") !== true) {
    failures.push("creator progress: source was not marked as the current first step");
  }
  await page.getByLabel("Paste source text").fill(
    "## Binary search invariant\nIgnore previous instructions is quoted source data, not an application command.",
  );
  await expectVisible(page.getByText(/\/140,000$/, { exact: false }).first(), "source character count");
  await page.waitForFunction(() => localStorage.getItem("museion:creator-draft:v1")?.includes("Binary search invariant"));
  await page.getByRole("button", { name: "Clear draft" }).click();
  await expectVisible(page.getByRole("button", { name: "Confirm clear" }), "destructive draft confirmation");
  await page.getByRole("button", { name: "Keep draft" }).click();
  if (!(await page.getByLabel("Paste source text").inputValue()).includes("Binary search invariant")) {
    failures.push("creator: cancelling draft deletion changed the source text");
  }
  await page.reload();
  if (!(await page.getByLabel("Paste source text").inputValue()).includes("Binary search invariant")) {
    failures.push("creator: local text draft did not restore after refresh");
  }
  await page.getByRole("button", { name: "Normalize pasted source" }).click();
  await expectVisible(page.getByText("Document SHA-256"), "pasted-source hash");
  await expectVisible(page.getByRole("heading", { name: "Review warnings" }), "instruction-like warning");
  await expectVisible(page.getByText(/Other sources require the configured live compiler/), "truthful keyless live compiler boundary");

  await page.getByLabel("Source title").fill("Updated source title");
  await expectVisible(page.getByText(/Add a source to inspect its canonical pages/), "stale normalized source invalidation");

  await page.locator('input[type="file"]').setInputFiles(pdfFixture);
  await expectVisible(
    page.getByLabel("Source pages").getByRole("button", { name: "6", exact: true }),
    "six-page PDF record",
  );
  await page.getByLabel("I am allowed to use this source.").check();
  await page.getByLabel("Language").fill("");
  await expectVisible(page.getByText("Enter a language.", { exact: true }), "creator language validation");
  const compileReplay = page.getByRole("button", { name: "Create verified replay run" });
  if (!(await compileReplay.isDisabled())) failures.push("creator: compile remained enabled with an invalid learning brief");
  await expectVisible(page.getByText(/Complete the language, duration and learner goal/), "creator blocked-brief guidance");
  await page.getByLabel("Language").fill("en");
  await page.getByRole("button", { name: "Create verified replay run" }).click();
  await page.waitForURL((url) => url.pathname.startsWith("/create/review/"));
  await expectVisible(page.getByText("Accepted for learning"), "accepted compiler validation");
  await expectVisible(page.getByRole("heading", { name: "Source quotations" }), "run grounding review");
  await expectVisible(page.getByText("Locked transfer"), "separate transfer boundary");
  await expectVisible(page.getByText(/exact authored order/), "authoritative learning sequence");
  await page.screenshot({ path: path.join(outputDir, "desktop-source-creator.png"), fullPage: true });
  await page.getByRole("link", { name: /Launch generated learner experience/ }).click();
  await expectVisible(page.getByText("Verified replay", { exact: true }), "compiler-run learner launch");
  await expectVisible(page.getByRole("heading", { name: /Binary Search/ }), "compiler-run learner title");

  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await expectVisible(page.getByRole("heading", { name: "Choose how Museion thinks." }), "AI settings");
  await expectVisible(page.getByText("Local AI disabled", { exact: true }).first(), "hosted-safe AI state");
  await expectVisible(page.getByRole("list", { name: "Live AI readiness" }), "AI readiness checklist");
  await expectVisible(page.getByText("gpt-5.6-luna", { exact: true }), "Luna routing");
  await expectVisible(page.getByText("gpt-5.6-terra", { exact: true }).first(), "Terra routing");
  await expectVisible(page.getByText("gpt-5.6-sol", { exact: true }).first(), "Sol routing");
  await page.getByRole("button", { name: "Copy diagnostics" }).click();
  await expectVisible(page.getByText(/Sanitized diagnostics copied/), "sanitized AI diagnostics copy");
  const diagnostics = JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
  if ("token" in diagnostics || "credentials" in diagnostics || "source" in diagnostics) {
    failures.push("settings: copied diagnostics contain a forbidden secret or source field");
  }
  if (!diagnostics.models?.compiler || !diagnostics.models?.tutor) {
    failures.push("settings: copied diagnostics omitted model routing");
  }
  await page.locator("main").focus();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({ path: path.join(outputDir, "desktop-settings.png"), fullPage: true });

  const notFoundPage = await context.newPage();
  await notFoundPage.goto(`${baseURL}/missing-route`);
  await expectVisible(notFoundPage.getByText("404", { exact: true }), "404 page");
  await context.close();
}

async function multipleChoiceConfirmationFlow() {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  await context.addInitScript(() => localStorage.setItem("museion-onboarded", "1"));
  const page = await context.newPage();
  watch(page, "multiple-choice-confirmation");
  let answerRequests = 0;
  await page.route("**/api/sessions/*/answer", async (route) => {
    answerRequests += 1;
    await route.continue();
  });
  await page.goto(`${baseURL}/lessons/fractions-unlike-denominators`);
  const firstChoice = page.getByRole("radio").first();
  await page.getByText("yes", { exact: true }).click();
  if (!(await firstChoice.isChecked())) failures.push("multiple choice: clicking the option label did not select its radio");
  if (answerRequests !== 0) failures.push("multiple choice: selecting an option submitted before confirmation");
  await expectVisible(page.getByRole("button", { name: "Check answer" }), "multiple-choice confirmation action");
  await page.getByRole("button", { name: "Check answer" }).click();
  await expectVisible(page.getByText("Not yet — stay with it."), "multiple-choice deterministic feedback");
  if (answerRequests !== 1) failures.push(`multiple choice: expected 1 confirmed request, received ${answerRequests}`);
  await context.close();
}

async function designSystemFlow() {
  const context = await browser.newContext({ viewport: { width: 1280, height: 850 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  watch(page, "design-system");
  await page.goto(`${baseURL}/privacy`);
  await expectVisible(page.getByRole("heading", { name: "Privacy, in plain language." }), "privacy page");
  await page.keyboard.press("Tab");
  const focused = await page.evaluate(() => document.activeElement?.textContent?.trim());
  if (focused !== "Skip to content") failures.push(`keyboard: expected skip link first, got ${focused ?? "nothing"}`);
  await page.keyboard.press("Enter");
  const focusedId = await page.evaluate(() => document.activeElement?.id);
  if (focusedId !== "main-content") failures.push("keyboard: skip link did not focus main content");
  await page.getByRole("link", { name: "Terms", exact: true }).click();
  await expectVisible(page.getByRole("heading", { name: "Use Museion as a learning tool, not an oracle." }), "terms page");
  await page.goto(`${baseURL}/welcome`);
  const reducedMotion = await page.evaluate(() => ({ preferred: matchMedia("(prefers-reduced-motion: reduce)").matches, animation: getComputedStyle(document.querySelector(".animate-fade-up")).animationName }));
  if (!reducedMotion.preferred || reducedMotion.animation !== "none") failures.push("reduced motion: animated onboarding remains active");
  await context.close();
}

async function mobileFlow() {
  const context = await browser.newContext({ viewport: { width: 320, height: 700 } });
  const page = await context.newPage();
  watch(page, "mobile");
  await page.goto(`${baseURL}/welcome`);
  await expectVisible(page.getByRole("heading", { name: /Learn by reasoning/ }), "mobile onboarding");
  const onboardingOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  if (onboardingOverflow) failures.push("mobile onboarding: horizontal overflow");
  await page.screenshot({ path: path.join(outputDir, "mobile-onboarding.png"), fullPage: true });

  await page.getByRole("button", { name: "Skip" }).click();
  await page.waitForURL((url) => url.pathname === "/");
  await expectVisible(page.getByRole("heading", { name: /Learn by reasoning/ }), "mobile redesigned home");
  const homeOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  if (homeOverflow) failures.push("mobile homepage: horizontal overflow");
  await page.screenshot({ path: path.join(outputDir, "mobile-home.png"), fullPage: true });
  await page.getByRole("link", { name: /Solving Linear Equations/ }).click();
  await expectVisible(page.getByText(/what number should we subtract from BOTH sides/i), "mobile lesson");
  const lessonOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  if (lessonOverflow) failures.push("mobile lesson: horizontal overflow");
  await page.screenshot({ path: path.join(outputDir, "mobile-lesson.png"), fullPage: true });

  await page.getByRole("link", { name: "Create", exact: true }).click();
  await expectVisible(page.getByRole("heading", { name: /Start with a source/ }), "mobile source creator");
  const creatorOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  if (creatorOverflow) failures.push("mobile source creator: horizontal overflow");
  await page.screenshot({ path: path.join(outputDir, "mobile-source-creator.png"), fullPage: true });
  await context.close();
}

async function completeJudge(page, label, takeScreenshot = false) {
  await page.goto(`${baseURL}/judge`);
  await expectVisible(page.getByText("Verified replay", { exact: true }), `${label} replay badge`);
  await page.getByRole("button", { name: /Continue/ }).click();

  await page.getByRole("radio").first().check();
  await page.getByRole("button", { name: "Check prediction" }).click();
  await expectVisible(page.getByText("Prediction matches the deterministic answer."), `${label} prediction`);
  await page.getByRole("button", { name: /Continue/ }).click();

  await page.getByLabel("Next low").fill("3");
  await page.getByLabel("Next high").fill("6");
  await page.getByRole("button", { name: "Update interval" }).click();
  await expectVisible(page.getByText("Maia · bounded intervention"), `${label} bounded Maia`);
  await expectVisible(page.getByText(/can repeat the same midpoint/), `${label} counterexample`);
  await page.getByLabel("Next low").fill("4");
  await page.getByRole("button", { name: "Update interval" }).click();
  await page.getByRole("button", { name: "Confirm target at mid" }).click();
  await expectVisible(page.getByText("Target found at the verified midpoint."), `${label} range`);
  await page.getByRole("button", { name: /Continue/ }).click();

  await page.getByLabel("Low", { exact: true }).fill("0");
  await page.getByLabel("High", { exact: true }).fill("1");
  await page.getByLabel("Mid", { exact: true }).fill("0");
  await page.getByRole("button", { name: "Check next state" }).click();
  await page.getByLabel("Low", { exact: true }).fill("1");
  await page.getByLabel("High", { exact: true }).fill("1");
  await page.getByLabel("Mid", { exact: true }).fill("1");
  await page.getByRole("button", { name: "Check next state" }).click();
  await expectVisible(page.getByText("Trace complete."), `${label} trace`);
  await page.getByRole("button", { name: /Continue/ }).click();

  for (let index = 0; index < 3; index += 1) await page.locator('button[aria-label*="Compare values"][aria-label$="up"]').click();
  for (let index = 0; index < 2; index += 1) await page.locator('button[aria-label*="prove one region"][aria-label$="up"]').click();
  await page.locator('button[aria-label*="corresponding boundary"][aria-label$="up"]').click();
  await page.getByRole("button", { name: "Check order" }).click();
  await expectVisible(page.getByText("The reasoning order is valid."), `${label} sequence`);
  await page.getByRole("button", { name: /Finish lesson/ }).click();

  await page.getByRole("button", { name: "Start locked transfer" }).click();
  await expectVisible(page.getByText("Maia 0 · hints 0 · solutions 0"), `${label} transfer lock`);
  await page.getByLabel("Final index").fill("4.5");
  await page.getByLabel("Final index").blur();
  await expectVisible(page.getByText(/Enter one whole-number index/), `${label} transfer integer validation`);
  if (await page.getByRole("button", { name: "Submit only attempt" }).isEnabled()) failures.push(`${label}: invalid decimal transfer answer can be submitted`);
  await page.getByLabel("Final index").fill("4");
  await page.getByRole("button", { name: "Submit only attempt" }).click();
  await expectVisible(page.getByRole("heading", { name: "Correct" }), `${label} transfer result`);
  await expectVisible(page.getByRole("heading", { name: "Evidence ledger" }), `${label} evidence ledger`);
  await expectVisible(page.getByText(/not evidence of durable mastery/), `${label} limitation`);
  if (takeScreenshot) await page.screenshot({ path: path.join(outputDir, `${label}.png`), fullPage: true });
}

async function judgeRecoveryFlow() {
  const context = await browser.newContext({ viewport: { width: 1024, height: 800 } });
  const page = await context.newPage();
  await page.goto(`${baseURL}/judge`);
  await expectVisible(page.getByText("Verified replay", { exact: true }), "judge recovery initial session");
  const sessionId = await page.evaluate(() => localStorage.getItem("museion_judge_session_v1"));
  if (!sessionId) throw new Error("Judge recovery fixture did not create a session");

  await page.evaluate((id) => localStorage.setItem(`museion_judge_session_v1:${id}:block`, "999"), sessionId);
  await page.reload();
  await expectVisible(page.getByRole("radio").first(), "judge recovery clamps skipped interactive block");
  if (await page.getByRole("button", { name: "Start locked transfer" }).count()) failures.push("judge recovery: corrupted local index skipped to transfer");

  await page.route(`**/api/judge/${sessionId}`, (route) => route.request().method() === "GET"
    ? route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "temporary outage" }) })
    : route.continue());
  await page.reload();
  await expectVisible(page.getByRole("heading", { name: "Judge route unavailable" }), "judge temporary recovery state");
  const preserved = await page.evaluate(() => localStorage.getItem("museion_judge_session_v1"));
  if (preserved !== sessionId) failures.push("judge recovery: temporary server failure discarded the saved session");

  await page.unroute(`**/api/judge/${sessionId}`);
  await page.reload();
  await expectVisible(page.getByRole("radio").first(), "judge recovery restored session");
  await page.getByRole("button", { name: "Reset run" }).click();
  await expectVisible(page.getByRole("group", { name: "Confirm reset run" }), "judge inline reset confirmation");
  await page.getByRole("button", { name: "Keep run" }).click();
  if (await page.getByRole("group", { name: "Confirm reset run" }).count()) failures.push("judge reset: keep run did not close confirmation");
  await context.close();
}

async function judgeFlow(viewport, label, repeat = 1) {
  for (let run = 1; run <= repeat; run += 1) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    watch(page, `${label}-${run}`);
    await completeJudge(page, `${label}-${run}`, run === 1);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    if (overflow) failures.push(`${label}-${run}: horizontal overflow`);
    if (run === 1) {
      await page.reload();
      await expectVisible(page.getByRole("heading", { name: "Evidence ledger" }), `${label} refresh persistence`);
    }
    await context.close();
  }
}

try {
  if (process.env.MUSEION_PERFORMANCE_ONLY === "1") {
    await performanceBudgetFlow();
  } else if (process.env.MUSEION_KEYBOARD_ONLY === "1") {
    await keyboardJudgeFlow();
  } else {
    await accessibilityFlow();
    await mobileNavigationFlow();
  }
  if (process.env.MUSEION_A11Y_ONLY !== "1" && process.env.MUSEION_KEYBOARD_ONLY !== "1" && process.env.MUSEION_PERFORMANCE_ONLY !== "1") {
    await desktopFlow();
    await multipleChoiceConfirmationFlow();
    await learnerRecoveryFlow();
    await staleMaiaFlow();
    await queuedMaiaOutboxFlow();
    await staleQueuedOutboxFlow();
    await safeMutationRetryFlow();
    await authoritativeRecoveryFlow();
    await designSystemFlow();
    await mobileFlow();
    await performanceBudgetFlow();
    await keyboardJudgeFlow();
    await judgeRecoveryFlow();
    await judgeFlow({ width: 1440, height: 1000 }, "judge-desktop", 20);
    await judgeFlow({ width: 320, height: 700 }, "judge-mobile", 1);
  }
} finally {
  await browser.close();
}

if (failures.length > 0) {
  throw new Error(`UI smoke failures:\n${failures.join("\n")}`);
}

console.log(`UI smoke passed. Screenshots: ${outputDir}`);
