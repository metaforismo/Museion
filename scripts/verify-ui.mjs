import { mkdir } from "node:fs/promises";
import path from "node:path";

import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";

const baseURL = process.env.MUSEION_BASE_URL ?? "http://localhost:3000";
const outputDir = path.resolve("output/playwright/smoke");
const verificationImageDir = path.join(outputDir, "captures");
const pdfFixture = path.resolve("tests/fixtures/binary-search-golden-source.pdf");
await mkdir(outputDir, { recursive: true });
await mkdir(verificationImageDir, { recursive: true });

const launchOptions = process.env.MUSEION_BROWSER_PATH
  ? { executablePath: process.env.MUSEION_BROWSER_PATH, headless: true }
  : { channel: "chrome", headless: true };
const browser = await chromium.launch(launchOptions).catch(() => chromium.launch({ headless: true }));
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
    "/dashboard",
    "/library",
    "/courses/algebra-as-balance",
    "/courses/search-by-halving",
    "/review",
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
  for (const route of ["/", "/dashboard", "/library", "/courses/algebra-as-balance", "/review", "/progress", "/create", "/settings", "/judge"]) {
    await mobilePage.goto(`${baseURL}${route}`);
    await mobilePage.locator("main").waitFor({ state: "visible" });
    await scanPage(mobilePage, `mobile ${route}`);
    const currentLink = mobilePage.getByRole("navigation", { name: "Mobile navigation" }).locator('[aria-current="page"]:visible');
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
  await page.goto(`${baseURL}/progress`);

  const menuButton = page.getByRole("button", { name: "Open navigation" });
  await keyboardActivate(page, menuButton);
  await expectVisible(page.getByRole("complementary", { name: "Application navigation" }), "mobile navigation drawer");
  await expectVisible(page.getByRole("link", { name: "Settings", exact: true }), "mobile Settings destination");
  if (!(await page.getByRole("button", { name: "Close", exact: true }).evaluate((button) => button === document.activeElement))) {
    failures.push("mobile navigation: close button did not receive focus when the drawer opened");
  }
  await page.keyboard.press("Escape");
  if (await page.locator("#mobile-app-navigation").count()) failures.push("mobile navigation: Escape did not close the drawer");
  if (!(await menuButton.evaluate((button) => button === document.activeElement))) {
    failures.push("mobile navigation: focus did not return to the menu button after Escape");
  }

  await menuButton.click();
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page.waitForURL((url) => url.pathname === "/settings");
  await menuButton.click();
  const activeSettings = page.getByRole("link", { name: "Settings", exact: true });
  if ((await activeSettings.getAttribute("aria-current")) !== "page") {
    failures.push("mobile navigation: current page is not exposed in the drawer");
  }
  if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) {
    failures.push("mobile navigation: drawer causes horizontal overflow");
  }
  await context.close();
}

async function globalSearchFlow() {
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  await desktop.addInitScript(() => localStorage.setItem("museion-onboarded", "1"));
  const page = await desktop.newPage();
  watch(page, "global-search");
  await page.goto(`${baseURL}/dashboard`);

  const searchTrigger = page.getByRole("button", { name: "Search Museion" });
  await searchTrigger.click();
  const searchInput = page.getByRole("combobox", { name: "Search Museion" });
  await expectVisible(searchInput, "global search input");
  if (!(await searchInput.evaluate((input) => input === document.activeElement))) {
    failures.push("global search: input did not receive focus when opened");
  }
  await searchInput.fill("concept-that-does-not-exist");
  await expectVisible(page.getByText("No matching destination"), "global search empty state");
  await page.getByRole("button", { name: "Clear search" }).click();
  await expectVisible(page.getByRole("option", { name: /Home/ }), "global search reset");
  await page.waitForFunction(() => document.activeElement?.id === "global-search");
  await page.keyboard.press("Escape");
  await page.getByRole("dialog", { name: "Search Museion" }).waitFor({ state: "detached" });
  if (!(await searchTrigger.evaluate((button) => button === document.activeElement))) failures.push("global search: focus did not return to its trigger");

  await searchTrigger.click();
  await searchInput.fill("binary");
  await expectVisible(page.getByRole("option", { name: /Binary Numbers/ }), "global concept result");
  await page.keyboard.press("Enter");
  await page.waitForURL((url) => url.pathname === "/lessons/binary-numbers");
  await expectVisible(page.getByRole("heading", { name: "Binary Numbers" }), "global search destination rendered");

  const shortcutPage = await desktop.newPage();
  watch(shortcutPage, "global-search-shortcut");
  await shortcutPage.goto(`${baseURL}/dashboard`, { waitUntil: "networkidle" });
  // Chrome on macOS may reserve synthetic Meta+K for the omnibox. The product
  // handler supports both modifiers; Control+K exercises the page-owned path.
  await shortcutPage.keyboard.press("Control+K");
  await expectVisible(shortcutPage.getByRole("dialog", { name: "Search Museion" }), "global search keyboard shortcut");
  await shortcutPage.keyboard.press("Escape");
  await desktop.close();

  const mobile = await browser.newContext({ viewport: { width: 320, height: 700 }, reducedMotion: "reduce" });
  await mobile.addInitScript(() => localStorage.setItem("museion-onboarded", "1"));
  const mobilePage = await mobile.newPage();
  watch(mobilePage, "global-search-mobile");
  await mobilePage.goto(`${baseURL}/dashboard`);
  await mobilePage.getByRole("button", { name: "Search Museion" }).click();
  await expectVisible(mobilePage.getByRole("dialog", { name: "Search Museion" }), "mobile global search");
  await mobilePage.getByRole("combobox", { name: "Search Museion" }).fill("fractions");
  await mobilePage.getByRole("option", { name: /Fractions/ }).click();
  await mobilePage.waitForURL((url) => url.pathname.includes("fractions"));
  await mobile.close();
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
  await expectVisible(page.getByText("Sample lesson", { exact: true }), "keyboard replay badge");
  await keyboardActivate(page, page.getByRole("button", { name: /Continue/ }));

  await keyboardActivate(page, page.getByRole("radio").first(), "Space");
  await keyboardActivate(page, page.getByRole("button", { name: "Check prediction" }));
  await expectVisible(page.getByText("Prediction matches the deterministic answer."), "keyboard prediction");
  await keyboardActivate(page, page.getByRole("button", { name: /Continue/ }));

  await keyboardFill(page, page.getByLabel("Next low"), "-1");
  await keyboardFill(page, page.getByLabel("Next high"), "-2");
  await page.getByLabel("Next high").blur();
  await expectVisible(page.getByRole("alert").filter({ hasText: "Low must be non-negative" }), "keyboard range boundary validation");
  if (await page.getByRole("button", { name: "Update interval" }).isEnabled()) failures.push("keyboard range: invalid negative boundaries can be submitted");
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

  await keyboardActivate(page, page.getByRole("button", { name: "Start independent challenge" }));
  await expectVisible(page.getByText("Maia 0 · hints 0 · solutions 0"), "keyboard transfer lock");
  await keyboardFill(page, page.getByLabel("Your number"), "4");
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
    if (route === "/judge") await expectVisible(page.getByText("Sample lesson", { exact: true }), "performance judge ready");
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
  await page.getByRole("button", { name: "Check", exact: true }).click();
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
  await page.getByRole("button", { name: "Ask Maia" }).click();
  await page.getByLabel("Message for Maia").fill("Explain this step without giving the answer");
  await page.getByRole("button", { name: "Send" }).click();
  await page.getByRole("button", { name: /Continue/ }).click();
  await expectVisible(page.getByText("Step 2 of 4"), "stale Maia advanced step");
  await expectVisible(page.getByText("The lesson moved to a new step, so I stopped that reply."), "stale Maia response cancellation");
  await context.close();
}

async function desktopMaiaDockFlow() {
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  await context.addInitScript(() => localStorage.setItem("museion-onboarded", "1"));
  const page = await context.newPage();
  watch(page, "desktop-maia-dock");
  await page.goto(`${baseURL}/lessons/linear-equations-intro`);

  const launcher = page.getByRole("button", { name: "Open Maia chat" });
  await expectVisible(launcher, "desktop Maia compact launcher");
  if (await page.getByLabel("Message for Maia").count()) failures.push("desktop Maia: composer is visible before the learner opens chat");
  if (await page.getByText(/I'm right here with this step/).count()) failures.push("desktop Maia: legacy speech bubble still covers the activity");

  const coveredControls = await launcher.evaluate((button) => {
    const launcherRect = button.getBoundingClientRect();
    const intersects = (rect) => rect.width > 0 && rect.height > 0 && !(rect.right <= launcherRect.left || rect.left >= launcherRect.right || rect.bottom <= launcherRect.top || rect.top >= launcherRect.bottom);
    return [...document.querySelectorAll("main button, main input, main textarea, main label, main p, main h1, main h2")]
      .filter((element) => element !== button && intersects(element.getBoundingClientRect()))
      .map((element) => element.textContent?.trim() || element.getAttribute("aria-label") || element.tagName)
      .filter(Boolean);
  });
  if (coveredControls.length) failures.push(`desktop Maia: compact launcher overlaps lesson content (${coveredControls.join(", ")})`);

  await launcher.click();
  const drawer = page.getByRole("complementary", { name: "Maia chat" });
  await expectVisible(drawer, "desktop Maia side panel");
  await expectVisible(page.getByLabel("Message for Maia"), "desktop Maia drawer composer");
  await page.waitForFunction(() => document.documentElement.hasAttribute("data-maia-drawer-open"));
  const obscuredContent = await drawer.evaluate((panel) => {
    const panelRect = panel.getBoundingClientRect();
    const intersects = (rect) => rect.width > 0 && rect.height > 0 && !(rect.right <= panelRect.left || rect.left >= panelRect.right || rect.bottom <= panelRect.top || rect.top >= panelRect.bottom);
    return [...document.querySelectorAll("main button, main input, main textarea, main label, main p, main h1, main h2")]
      .filter((element) => !panel.contains(element) && !element.closest("[aria-controls='maia-desktop-conversation']") && intersects(element.getBoundingClientRect()))
      .map((element) => element.textContent?.trim() || element.getAttribute("aria-label") || element.tagName)
      .filter(Boolean);
  });
  if (obscuredContent.length) failures.push(`desktop Maia: open sidebar covers lesson content (${obscuredContent.join(", ")})`);
  await page.waitForFunction(() => document.activeElement?.textContent?.trim() === "Close", null, { timeout: 2_000 })
    .catch(() => failures.push("desktop Maia: focus did not move to drawer close control"));
  await page.keyboard.press("Escape");
  if (await page.getByRole("complementary", { name: "Maia chat" }).count()) failures.push("desktop Maia: Escape did not close the side panel");
  await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "Open Maia chat", null, { timeout: 2_000 })
    .catch(() => failures.push("desktop Maia: focus did not return to launcher"));
  await page.screenshot({ path: path.join(outputDir, "desktop-maia-dock.png"), fullPage: true });
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
  await expectVisible(page.getByRole("button", { name: "Stop" }), "Maia first request in flight");

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
  await page.getByRole("button", { name: "Ask Maia" }).click();
  await page.getByLabel("Message for Maia").fill("Explain this step without giving the answer");
  await page.getByRole("button", { name: "Send" }).click();
  await expectVisible(page.getByRole("button", { name: "Stop" }), "Maia request before queued self-explanation");
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
  await expectVisible(page.getByRole("button", { name: "Check", exact: true }), "answer control after state recovery");
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
  await page.waitForURL((url) => url.pathname === "/dashboard", { waitUntil: "domcontentloaded" });
  await expectVisible(page.getByRole("heading", { name: "Welcome back." }), "onboarding dashboard destination");
  await expectVisible(page.getByText("No evidence has been recorded", { exact: true }), "dashboard evidence empty state");
  await expectVisible(page.getByText("Nothing needs correction yet", { exact: true }), "dashboard misconception empty state");
  await expectVisible(page.getByText("No source has been compiled", { exact: true }), "dashboard source empty state");
  await page.goto(`${baseURL}/`);
  await expectVisible(page.getByRole("heading", { name: /Sources.*don.t have to stay passive/ }), "landing heading");
  await expectVisible(page.getByRole("heading", { name: "A lesson that waits for your move." }), "product contract");
  await expectVisible(page.getByRole("link", { name: "Open Museion", exact: true }), "workspace entry");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(verificationImageDir, "museion-landing.png"), fullPage: false });

  await page.goto(`${baseURL}/library`);
  await expectVisible(page.getByRole("heading", { name: /Learn through designed investigations/ }), "library heading");
  await expectVisible(page.getByText(/\d+ paths · \d+ lessons/), "real sidebar catalog totals");
  const sidebarExtent = await page.getByRole("complementary", { name: "Application navigation" }).evaluate((element) => ({
    documentHeight: document.documentElement.scrollHeight,
    sidebarHeight: element.getBoundingClientRect().height,
  }));
  if (sidebarExtent.sidebarHeight + 1 < sidebarExtent.documentHeight) {
    failures.push(`desktop /library sidebar ends early (${sidebarExtent.sidebarHeight}px < ${sidebarExtent.documentHeight}px)`);
  }
  const firstAuthoredCourse = page
    .getByRole("region", { name: "Follow a designed reasoning path." })
    .getByRole("link", { name: /Algebra as Balance/ });
  await expectVisible(firstAuthoredCourse, "authored course entry");
  await firstAuthoredCourse.click();
  await page.waitForURL((url) => url.pathname === "/courses/algebra-as-balance");
  await expectVisible(page.getByRole("heading", { name: "Algebra as Balance" }), "authored course detail");
  await expectVisible(page.getByText(/one immediate near-transfer observation/), "course evidence boundary");
  await page.getByRole("link", { name: "Start the path", exact: true }).click();
  await page.waitForURL((url) => url.pathname === "/lessons/algebra-balance-equality-as-invariant" && url.searchParams.get("course") === "algebra-as-balance");
  await expectVisible(page.getByRole("link", { name: "Back to Algebra as Balance", exact: true }), "course-aware lesson return");
  await expectVisible(page.getByText("Algebra as Balance · 1/3", { exact: true }), "course lesson position");
  await page.goto(`${baseURL}/library`);
  const catalogSearch = page.getByLabel("Find a lesson or concept");
  const catalogResults = page.getByRole("region", { name: "Lesson catalog results" });
  await expectVisible(catalogSearch, "catalog search after route return");
  for (let attempt = 0; attempt < 10; attempt += 1) {
    await page.keyboard.press("/");
    if (await catalogSearch.evaluate((input) => input === document.activeElement)) break;
    await page.waitForTimeout(50);
  }
  if (!(await catalogSearch.evaluate((input) => input === document.activeElement))) {
    failures.push("catalog: slash shortcut did not focus search");
  }
  await catalogSearch.fill("binary");
  await expectVisible(catalogResults.getByRole("link", { name: /Binary Numbers/ }), "catalog concept search");
  if (await catalogResults.getByRole("link", { name: /Solving Linear Equations/ }).count()) {
    failures.push("catalog: search retained a non-matching lesson");
  }
  await catalogSearch.fill("concept-that-does-not-exist");
  await expectVisible(catalogResults.getByRole("heading", { name: "No lesson matches yet" }), "catalog empty state");
  await page.getByRole("button", { name: "Reset the catalog" }).click();
  await page.getByRole("button", { name: "Computer Science" }).click();
  await expectVisible(catalogResults.getByRole("link", { name: /Binary Numbers/ }), "catalog subject filter");
  if (await catalogResults.getByRole("link", { name: /Solving Linear Equations/ }).count()) {
    failures.push("catalog: subject filter retained an algebra lesson");
  }
  await page.getByRole("button", { name: "Clear search and filters" }).click();
  await expectVisible(catalogResults.getByRole("link", { name: /Solving Linear Equations/ }), "catalog reset");
  await page.screenshot({ path: path.join(outputDir, "desktop-catalog.png"), fullPage: true });

  await catalogResults.getByRole("link", { name: /Solving Linear Equations/ }).click();
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
  await page.getByRole("button", { name: "Check", exact: true }).evaluate((button) => {
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

  await page.getByRole("button", { name: "Open Maia chat" }).click();
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
  await expectVisible(page.getByText(/Practice mode removes the hint ladder/), "practice mode");
  if (await page.getByRole("button", { name: "Take a hint" }).count()) {
    failures.push("practice: hint control is visible");
  }

  await page.goto(`${baseURL}/dashboard`);
  await expectVisible(page.getByRole("heading", { name: "Welcome back." }), "dashboard page");
  await expectVisible(page.getByText("Review queue", { exact: true }), "dashboard review queue");
  await expectVisible(page.getByText(/not proof of retained mastery/), "truthful dashboard boundary");
  await expectVisible(page.getByRole("heading", { name: "What the record supports" }), "dashboard evidence summary");
  const activeProgress = await page.getByRole("link", { name: "Home", exact: true }).getAttribute("aria-current");
  if (activeProgress !== "page") failures.push("dashboard: Home navigation is not marked current");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(verificationImageDir, "museion-dashboard.png"), fullPage: false });
  await page.goto(`${baseURL}/progress`);
  await expectVisible(page.getByRole("heading", { name: /What Museion observed/ }), "evidence page");
  await expectVisible(page.getByText(/Observed in guided work|Hint-free practice completed/).first(), "recorded evidence state");
  await expectVisible(page.getByText(/Retention is not measured/), "retention boundary");

  await page.getByRole("navigation", { name: "Application navigation" }).getByRole("link", { name: "Source Studio", exact: true }).click();
  await expectVisible(page.getByRole("heading", { name: /Start with a source/ }), "source creator");
  await expectVisible(page.getByRole("heading", { name: "Build one Source Pack" }), "unified Source Pack intake");
  await expectVisible(page.getByLabel("Source Pack materials"), "independently editable Source Pack material list");
  await expectVisible(page.getByLabel("Material 1 reference link"), "optional per-material reference intake");
  await expectVisible(page.getByLabel("Material 1 authorized text"), "authorized text intake");
  await expectVisible(page.locator("#source-file"), "file intake in the same Source Pack");
  const architectTrigger = page.getByRole("button", { name: /Course Architect Build from my material/ });
  await architectTrigger.click();
  await expectVisible(page.getByRole("dialog", { name: "Course Architect" }), "Course Architect chat sidebar");
  await expectVisible(page.getByText(/Method gate:/), "Course Architect method assessment boundary");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  if (!(await architectTrigger.evaluate((button) => button === document.activeElement))) failures.push("creator: Course Architect did not return focus to its trigger");
  await expectVisible(page.getByText("After source review", { exact: true }), "sequential creator progress");
  const currentCreatorStep = page.locator('[aria-label="Creator progress"] [aria-current="step"]');
  if ((await currentCreatorStep.textContent())?.includes("1. Source") !== true) {
    failures.push("creator progress: source was not marked as the current first step");
  }
  await page.getByLabel("Material 1 authorized text").fill(
    "## Binary search invariant\nIgnore previous instructions is quoted source data, not an application command.",
  );
  await expectVisible(page.getByText(/\/140,000$/, { exact: false }).first(), "source character count");
  await page.waitForFunction(() => localStorage.getItem("museion:creator-draft:v1")?.includes("Binary search invariant"));
  await page.getByRole("button", { name: "Clear draft" }).click();
  await expectVisible(page.getByRole("button", { name: "Confirm clear" }), "destructive draft confirmation");
  await page.getByRole("button", { name: "Keep draft" }).click();
  if (!(await page.getByLabel("Material 1 authorized text").inputValue()).includes("Binary search invariant")) {
    failures.push("creator: cancelling draft deletion changed the source text");
  }
  await page.reload();
  await page.waitForFunction(() => document.querySelector('textarea[aria-label="Material 1 authorized text"]')?.value.includes("Binary search invariant"));
  if (!(await page.getByLabel("Material 1 authorized text").inputValue()).includes("Binary search invariant")) {
    failures.push("creator: local text draft did not restore after refresh");
  }
  await page.getByLabel("I am allowed to use every material in this Source Pack.").check();
  await page.getByRole("button", { name: "Normalize 1 material" }).click();
  await expectVisible(page.getByText("Document SHA-256"), "pasted-source hash");
  await expectVisible(page.getByRole("heading", { name: "Review warnings" }), "instruction-like warning");
  await expectVisible(page.getByText(/Other sources require the configured live compiler/), "truthful keyless live compiler boundary");

  await page.getByLabel("Source Pack title").fill("Updated source title");
  await expectVisible(page.getByText(/Add a source to inspect its canonical pages/), "stale normalized source invalidation");

  await page.getByLabel("Material 1 reference link").fill("https://www.youtube.com/playlist?list=PL123");
  if (await page.getByLabel("Material 1 reference type").inputValue() !== "youtube_playlist") {
    failures.push("creator: YouTube playlist link was not classified as a playlist");
  }
  await page.getByLabel("Material 1 authorized text").fill("Authorized notes from the referenced source.");
  await page.getByRole("button", { name: "Add text material" }).click();
  await page.getByLabel("Material 2 title").fill("Book excerpt");
  await page.getByLabel("Material 2 role").selectOption("excerpt");
  await page.getByLabel("Material 2 reference link").fill("https://example.com/books/binary-search");
  await page.getByLabel("Material 2 reference type").selectOption("book");
  await page.getByLabel("Material 2 authorized text").fill("An authorized excerpt that distinguishes an invariant from a stopping condition.");
  await page.getByRole("button", { name: "Move Book excerpt up" }).click();
  const firstMaterialTitle = page.getByLabel("Material 1 title");
  if (await firstMaterialTitle.inputValue() !== "Book excerpt") failures.push("creator: material reorder did not preserve the moved record");
  await page.getByLabel("I am allowed to use every material in this Source Pack.").check();
  await page.getByRole("button", { name: "Normalize 2 materials" }).click();
  await expectVisible(page.getByText("2 normalized materials"), "multi-material normalized summary");
  await expectVisible(page.getByText("youtube playlist reference", { exact: true }), "hash-bound playlist reference");
  await expectVisible(page.getByText("book reference", { exact: true }), "hash-bound book reference");
  await expectVisible(page.getByText(/Every material hash and reference is bound to this pack/), "multi-material truth boundary");

  await page.getByRole("button", { name: "Clear draft" }).click();
  await page.getByRole("button", { name: "Confirm clear" }).click();
  await page.locator("#source-file").setInputFiles(pdfFixture);
  await expectVisible(page.getByText("File ready for normalization"), "attached PDF material card");
  await page.waitForFunction(() => localStorage.getItem("museion:creator-draft:v1")?.includes("binary-search-golden-source.pdf"));
  await page.reload();
  await expectVisible(page.getByText("File must be reattached"), "file-byte privacy after draft recovery");
  await page.getByLabel("Reattach this file").setInputFiles(pdfFixture);
  await expectVisible(page.getByText("File ready for normalization"), "explicit PDF reattachment recovery");
  await page.getByLabel("Rights basis").selectOption("creator-owned");
  await page.getByLabel("I am allowed to use every material in this Source Pack.").check();
  await page.getByRole("button", { name: "Normalize 1 material" }).click();
  await expectVisible(
    page.getByLabel("Source pages").getByRole("button", { name: "6", exact: true }),
    "six-page PDF record",
  );
  await page.waitForFunction(() => localStorage.getItem("museion:creator-draft:v1")?.includes('"rightsBasis":"creator-owned"'));
  await page.getByLabel("Language").fill("");
  await expectVisible(page.getByText("Enter a language.", { exact: true }), "creator language validation");
  const compileReplay = page.getByRole("button", { name: "Create verified replay run" });
  if (!(await compileReplay.isDisabled())) failures.push("creator: compile remained enabled with an invalid learning brief");
  await expectVisible(page.getByText(/Complete the language, duration and learner goal/), "creator blocked-brief guidance");
  await page.getByLabel("Language").fill("en");
  await page.getByRole("button", { name: "Create verified replay run" }).click();
  await page.waitForURL((url) => url.pathname.startsWith("/create/review/"));
  await expectVisible(page.getByText("Accepted for learning"), "accepted compiler validation");
  await expectVisible(page.getByRole("heading", { name: "Coverage by supplied material" }), "persisted Source Pack evidence ledger");
  await expectVisible(page.getByText("creator owned", { exact: true }), "persisted rights basis");
  await expectVisible(page.getByRole("progressbar", { name: /citation coverage/ }), "per-material citation coverage");
  await expectVisible(page.getByText(/^material [a-f0-9]{64}$/), "raw-content-free material hash");
  await expectVisible(page.getByRole("heading", { name: "Source quotations" }), "run grounding review");
  await expectVisible(page.getByRole("link", { name: "Back to Creator Studio" }), "review return path");
  await expectVisible(page.getByRole("link", { name: "Validation", exact: true }), "review validation navigation");
  await expectVisible(page.getByRole("heading", { name: "Deterministic validation" }), "review validation details");
  await expectVisible(page.getByRole("heading", { name: "Model and runtime trace" }), "review model trace");
  const firstEvidenceDisclosure = page.getByText("Inspect linked source evidence", { exact: true }).first();
  await firstEvidenceDisclosure.click();
  await expectVisible(page.getByText("Open in citation record", { exact: true }).first(), "block-adjacent source evidence");
  const traceTable = page.getByRole("table");
  await expectVisible(traceTable.getByRole("columnheader", { name: "Requested" }), "requested model trace");
  await expectVisible(traceTable.getByRole("columnheader", { name: "Resolved" }), "resolved model trace");
  await expectVisible(page.getByText("Locked transfer"), "separate transfer boundary");
  await expectVisible(page.getByText(/exact authored order/), "authoritative learning sequence");
  await page.screenshot({ path: path.join(outputDir, "desktop-source-creator.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  const reviewOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (reviewOverflow > 1) failures.push(`compiler review: mobile page overflows horizontally by ${reviewOverflow}px`);
  await page.screenshot({ path: path.join(outputDir, "mobile-compiler-review.png"), fullPage: true });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole("link", { name: /Launch generated learner experience/ }).click();
  await expectVisible(page.getByText("Sample lesson", { exact: true }), "compiler-run learner launch");
  await expectVisible(page.getByRole("heading", { name: /Binary Search/ }), "compiler-run learner title");

  await page.goto(`${baseURL}/settings`);
  await expectVisible(page.getByRole("heading", { name: "Settings" }), "AI settings");
  await expectVisible(page.getByText("Local AI disabled", { exact: true }).first(), "hosted-safe AI state");
  await expectVisible(page.getByRole("list", { name: "Live AI readiness" }), "AI readiness checklist");
  await page.getByRole("button", { name: "Copy setup prompt" }).click();
  await expectVisible(page.getByText(/Codex setup prompt copied/), "Codex setup prompt copy");
  const setupPrompt = await page.evaluate(() => navigator.clipboard.readText());
  if (
    !setupPrompt.includes("https://github.com/metaforismo/Museion") ||
    !setupPrompt.includes("MUSEION_LOCAL_AI=1 npm run dev") ||
    setupPrompt.includes("OPENAI_API_KEY")
  ) {
    failures.push("settings: Codex setup prompt is missing the repository or local command, or asks for an API key");
  }
  await page.getByText("Advanced: models and routing").click();
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
  await page.waitForURL((url) => url.pathname === "/dashboard", { waitUntil: "domcontentloaded" });
  await expectVisible(page.getByRole("heading", { name: "Welcome back." }), "mobile onboarding dashboard destination");
  await page.goto(`${baseURL}/`);
  await expectVisible(page.getByRole("heading", { name: /Sources.*don.t have to stay passive/ }), "mobile redesigned home");
  const homeOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  if (homeOverflow) failures.push("mobile homepage: horizontal overflow");
  await page.screenshot({ path: path.join(outputDir, "mobile-home.png"), fullPage: true });
  await page.goto(`${baseURL}/library`);
  await page.getByRole("region", { name: "Lesson catalog results" }).getByRole("link", { name: /Solving Linear Equations/ }).click();
  await expectVisible(page.getByText(/what number should we subtract from BOTH sides/i), "mobile lesson");
  await expectVisible(page.getByRole("button", { name: "Ask Maia" }), "mobile collapsed Maia trigger");
  if (await page.getByRole("log", { name: "Conversation with Maia" }).count()) failures.push("mobile lesson: Maia conversation is expanded before the learner asks");
  const titleCollidesWithStep = await page.evaluate(() => {
    const title = document.querySelector("main h1")?.getBoundingClientRect();
    const step = [...document.querySelectorAll("main span")].find((node) => node.textContent?.startsWith("Step "))?.getBoundingClientRect();
    return Boolean(title && step && !(title.right <= step.left || step.right <= title.left || title.bottom <= step.top || step.bottom <= title.top));
  });
  if (titleCollidesWithStep) failures.push("mobile lesson: title overlaps the step count");
  const lessonOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  if (lessonOverflow) failures.push("mobile lesson: horizontal overflow");
  await page.screenshot({ path: path.join(outputDir, "mobile-lesson.png"), fullPage: true });

  await page.goto(`${baseURL}/create`);
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
  await expectVisible(page.getByText("Sample lesson", { exact: true }), `${label} replay badge`);
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

  await page.getByRole("button", { name: "Start independent challenge" }).click();
  await expectVisible(page.getByText("Maia 0 · hints 0 · solutions 0"), `${label} transfer lock`);
  await page.getByLabel("Your number").fill("not-a-number");
  await page.getByLabel("Your number").blur();
  await expectVisible(page.getByText("Enter a valid number."), `${label} transfer numeric validation`);
  if (await page.getByRole("button", { name: "Submit only attempt" }).isEnabled()) failures.push(`${label}: invalid numeric transfer answer can be submitted`);
  await page.getByLabel("Your number").fill("4");
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
  await expectVisible(page.getByText("Sample lesson", { exact: true }), "judge recovery initial session");
  const sessionId = await page.evaluate(() => localStorage.getItem("museion_judge_session_v1"));
  if (!sessionId) throw new Error("Judge recovery fixture did not create a session");

  await page.evaluate((id) => localStorage.setItem(`museion_judge_session_v1:${id}:block`, "999"), sessionId);
  await page.reload();
  await expectVisible(page.getByRole("radio").first(), "judge recovery clamps skipped interactive block");
  if (await page.getByRole("button", { name: "Start independent challenge" }).count()) failures.push("judge recovery: corrupted local index skipped to transfer");

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

async function judgeConcurrencyFlow() {
  const context = await browser.newContext({ viewport: { width: 1024, height: 800 } });
  const concurrencyRunKey = `browser-concurrency-${crypto.randomUUID()}`;
  await context.addCookies([{
    name: "museion_learner",
    value: "00000000-0000-4000-8000-000000000007",
    url: baseURL,
    httpOnly: true,
    sameSite: "Lax",
  }]);
  await context.addInitScript((runKey) => localStorage.setItem("museion_judge_run_v1", runKey), concurrencyRunKey);
  const first = await context.newPage();
  const second = await context.newPage();
  first.on("pageerror", (error) => failures.push(`judge-concurrency-first page: ${error.message}`));
  second.on("pageerror", (error) => failures.push(`judge-concurrency-second page: ${error.message}`));
  await Promise.all([first.goto(`${baseURL}/judge`), second.goto(`${baseURL}/judge`)]);
  await Promise.all([
    expectVisible(first.getByText("Sample lesson", { exact: true }), "judge concurrency first session"),
    expectVisible(second.getByText("Sample lesson", { exact: true }), "judge concurrency second session"),
  ]);
  const [firstId, secondId] = await Promise.all([
    first.evaluate(() => localStorage.getItem("museion_judge_session_v1")),
    second.evaluate(() => localStorage.getItem("museion_judge_session_v1")),
  ]);
  if (!firstId || firstId !== secondId) failures.push("judge concurrency: tabs did not converge on one stable session");

  await first.getByRole("button", { name: /Continue/ }).click();
  await first.waitForFunction(() => {
    const radio = document.querySelector('input[type="radio"]');
    return radio instanceof HTMLInputElement && !radio.disabled;
  });
  await second.reload();
  await second.waitForFunction(() => {
    const radio = document.querySelector('input[type="radio"]');
    return radio instanceof HTMLInputElement && !radio.disabled;
  });
  await Promise.all([first.getByRole("radio").first().check(), second.getByRole("radio").first().check()]);
  await Promise.all([
    first.getByRole("button", { name: "Check prediction" }).click(),
    second.getByRole("button", { name: "Check prediction" }).click(),
  ]);
  await Promise.race([
    first.getByText(/Updated in another tab/).waitFor({ state: "visible", timeout: 10_000 }),
    second.getByText(/Updated in another tab/).waitFor({ state: "visible", timeout: 10_000 }),
  ]).catch(() => failures.push("judge concurrency: conflict recovery notice did not appear"));
  const restoredNotices = await Promise.all([
    first.getByText(/Updated in another tab/).count(),
    second.getByText(/Updated in another tab/).count(),
  ]);
  if (restoredNotices[0] + restoredNotices[1] !== 1) failures.push("judge concurrency: expected exactly one visible conflict recovery");
  const authoritative = await first.evaluate(async (sessionId) => {
    const response = await fetch(`/api/judge/${sessionId}`, { cache: "no-store" });
    return response.json();
  }, firstId);
  if (authoritative.revision !== 1 || !authoritative.completedBlockIds?.includes("prediction_discard")) {
    failures.push("judge concurrency: authoritative session did not retain exactly one completed mutation");
  }
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
    await globalSearchFlow();
  }
  if (process.env.MUSEION_A11Y_ONLY !== "1" && process.env.MUSEION_KEYBOARD_ONLY !== "1" && process.env.MUSEION_PERFORMANCE_ONLY !== "1") {
    await desktopFlow();
    await multipleChoiceConfirmationFlow();
    await learnerRecoveryFlow();
    await desktopMaiaDockFlow();
    await staleMaiaFlow();
    await queuedMaiaOutboxFlow();
    await staleQueuedOutboxFlow();
    await safeMutationRetryFlow();
    await authoritativeRecoveryFlow();
    await designSystemFlow();
    await mobileFlow();
    await performanceBudgetFlow();
    await keyboardJudgeFlow();
    await judgeConcurrencyFlow();
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
