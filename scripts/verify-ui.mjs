import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";

// This gate writes synthetic learner data: require an explicit isolated server.
const baseURL = process.env.MUSEION_BASE_URL ?? "http://127.0.0.1:3000";
const origin = new URL(baseURL);
assert(["127.0.0.1", "localhost", "[::1]"].includes(origin.hostname), "UI verification is loopback-only");
assert(process.env.MUSEION_UI_QA === "1", "Set MUSEION_UI_QA=1 and start the server with an isolated database/outbox");
assert(process.env.MUSEION_AUTH_OUTBOX_PATH, "The test and server must share an isolated auth outbox");
const outputDir = path.resolve("output/playwright/smoke");
await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch(process.env.MUSEION_BROWSER_PATH ? { executablePath: process.env.MUSEION_BROWSER_PATH, headless: true } : { headless: true });
const failures = [];

function watch(page, label) {
  page.on("pageerror", (error) => failures.push(`${label}: ${error.message}`));
  page.on("response", (response) => {
    if (response.status() >= 500) failures.push(`${label}: HTTP ${response.status()} ${new URL(response.url()).pathname}`);
  });
}
async function visible(locator) { await locator.waitFor({ state: "visible", timeout: 15_000 }); }
async function inspect(page, label, contrast = true) {
  await page.waitForLoadState("networkidle");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  assert(!overflow, `${label}: horizontal overflow`);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  await writeFile(path.join(outputDir, `${label}-axe.json`), JSON.stringify(results.violations, null, 2));
  for (const violation of results.violations) failures.push(`${label}: axe ${violation.id} (${violation.impact}) ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`);
  if (contrast) await scanContrast(page, label);
  await page.screenshot({ path: path.join(outputDir, `${label}.png`), fullPage: true });
}

async function scanContrast(page, label) {
  // `reducedMotion: "reduce"` collapses transitions to 0.01ms rather than
  // removing them, so a scan that lands mid-hydration reads the colour a
  // property is transitioning *from* — a skeleton's grey, not the surface the
  // learner ends up looking at. Settle before measuring anything.
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const findings = await page.evaluate(() => {
    // Tailwind's opacity modifiers compile to color-mix, which Chrome reports
    // as oklab(...). Pulling digits out of that string reads white-at-95% as
    // near-black, so every colour is resolved through a 1x1 canvas instead:
    // whatever the browser can paint, it can also report as sRGB plus alpha.
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const cache = new Map();
    const unresolved = new Set();
    const colourOf = (value) => {
      if (cache.has(value)) return cache.get(value);
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = "#010203";
      context.fillStyle = value;
      // fillStyle silently keeps its old value for anything it cannot parse,
      // so an unparsed colour is reported rather than scored as black.
      if (context.fillStyle === "#010203" && value.trim().toLowerCase() !== "#010203") {
        unresolved.add(value);
        cache.set(value, null);
        return null;
      }
      context.fillRect(0, 0, 1, 1);
      const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data;
      const resolved = { rgb: [red, green, blue], alpha: alpha / 255 };
      cache.set(value, resolved);
      return resolved;
    };

    const channel = (value) => {
      const ratio = value / 255;
      return ratio <= 0.04045 ? ratio / 12.92 : Math.pow((ratio + 0.055) / 1.055, 2.4);
    };
    const luminance = ([red, green, blue]) => 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue);
    const over = (top, bottom) => top.rgb.map((component, index) => component * top.alpha + bottom[index] * (1 - top.alpha));

    // A zone wash is a gradient, so it carries no background-colour to inherit.
    // Its first stop is composited as its own layer: full tint strength is the
    // darkest surface a learner can be standing on inside that wash.
    const washOf = (image) => {
      if (!image || image === "none" || image.startsWith("url(")) return null;
      const match = image.match(/(?:rgba?|oklab|oklch|color|hsla?)\([^)]*\)|#[0-9a-f]{3,8}/i);
      const colour = match && colourOf(match[0]);
      return colour && colour.alpha > 0 ? colour : null;
    };

    // The tints are opaque near-white fills and the overlays above them are
    // fractional ink, so the walk composites every painted layer up to the
    // first opaque one instead of stopping at the first non-transparent one.
    const backgroundOf = (element) => {
      const layers = [];
      for (let node = element; node; node = node.parentElement) {
        const style = getComputedStyle(node);
        const wash = washOf(style.backgroundImage);
        if (wash) layers.push(wash);
        const colour = colourOf(style.backgroundColor);
        if (colour && colour.alpha > 0) {
          layers.push(colour);
          if (colour.alpha >= 1) break;
        }
      }
      let base = [255, 255, 255];
      for (let index = layers.length - 1; index >= 0; index -= 1) base = over(layers[index], base);
      return base;
    };

    const rendered = (element) => {
      for (let node = element; node instanceof HTMLElement; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (style.display === "none" || style.visibility !== "visible" || Number(style.opacity) === 0) return false;
      }
      const rect = element.getBoundingClientRect();
      return rect.width >= 2 && rect.height >= 2;
    };

    const describe = (element) => {
      const id = element.id ? `#${element.id}` : "";
      const classes = [...element.classList].slice(0, 2).map((name) => `.${name}`).join("");
      return `${element.tagName.toLowerCase()}${id}${classes}`;
    };

    const seen = new Set();
    const problems = [];
    for (const element of document.body.querySelectorAll("*")) {
      if (/^(script|style|noscript|template|option|svg|title)$/i.test(element.tagName)) continue;
      // WCAG 1.4.3 exempts inactive components; everything else is in scope,
      // including aria-hidden marks, which sighted learners still read.
      if (element.closest("[hidden]") || element.matches(":disabled") || element.closest('[aria-disabled="true"]')) continue;
      // Only text the element paints itself, so the colour being scored is the
      // colour that run of text is actually drawn in.
      const text = [...element.childNodes]
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent.trim())
        .join(" ")
        .trim();
      if (!text || !rendered(element)) continue;
      const style = getComputedStyle(element);
      const foreground = colourOf(style.color);
      if (!foreground || foreground.alpha === 0) continue;
      const background = backgroundOf(element);
      const composited = over(foreground, background);
      const size = Number.parseFloat(style.fontSize);
      const weight = Number.parseInt(style.fontWeight, 10) || 400;
      const light = Math.max(luminance(composited), luminance(background));
      const dark = Math.min(luminance(composited), luminance(background));
      const ratio = (light + 0.05) / (dark + 0.05);
      const required = size >= 24 || (size >= 18.66 && weight >= 700) ? 3 : 4.5;
      if (ratio >= required) continue;
      const pair = `${composited.map(Math.round).join(",")}|${background.map(Math.round).join(",")}|${required}`;
      if (seen.has(pair)) continue;
      seen.add(pair);
      problems.push(`${describe(element)} "${text.slice(0, 44)}" rgb(${composited.map(Math.round).join(",")}) on rgb(${background.map(Math.round).join(",")}) ${ratio.toFixed(2)}:1 < ${required}`);
    }
    for (const value of unresolved) problems.push(`unresolvable colour ${value}`);
    return problems.slice(0, 10);
  });
  for (const finding of findings) failures.push(`${label} contrast: ${finding}`);
}


async function publicFlow(viewport, label) {
  const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
  const page = await context.newPage(); watch(page, label);
  try {
    for (const route of ["/", "/login", "/signup", "/about", "/help", "/privacy", "/terms", "/accessibility"]) {
      await page.goto(`${origin.origin}${route}`);
      await visible(page.locator("main h1"));
      await inspect(page, `${label}-public-${route.slice(1) || "landing"}`, route !== "/");
    }
    await page.goto(`${origin.origin}/dashboard`);
    assert(new URL(page.url()).pathname === "/login", "Unauthenticated dashboard must redirect to login");
    await page.route("**/api/auth/session", (route) => route.abort());
    await page.goto(origin.origin);
    await visible(page.getByRole("banner").getByRole("link", { name: "Sign in", exact: true }));
    assert(await page.getByRole("status", { name: "Loading account", exact: true }).count() === 0, "No empty account pill");
    const privateResponse = await context.request.get(`${origin.origin}/api/account`);
    assert([401, 403].includes(privateResponse.status()), "Account API must require authentication");
    // A keyboard user can skip the repeated navigation.
    await page.keyboard.press("Tab");
    assert(await page.evaluate(() => document.activeElement?.getAttribute("href")) === "#main-content", "First keyboard target must skip navigation");
  } finally { await context.close(); }
}

async function learnerFlow(viewport, label) {
  const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
  const page = await context.newPage(); watch(page, label);
  const email = `ci-${randomUUID()}@example.test`;
  const password = `Synthetic-${randomUUID()}`;
  try {
    await page.goto(`${origin.origin}/signup`);
    await page.getByLabel("Your name", { exact: true }).fill("CI Learner");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await visible(page.getByLabel("Password", { exact: true }));
    await page.getByLabel("Password", { exact: true }).fill(password);
    const challengeResponse = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/auth/signup" && response.request().method() === "POST");
    await page.getByRole("button", { name: "Get verification code", exact: true }).click();
    const response = await challengeResponse;
    assert(response.status() === 202, "Signup should create a verification challenge");
    const challenge = await response.json();
    assert(/^[a-f0-9-]{36}$/.test(challenge.challengeId), "Expected a challenge id");
    const message = JSON.parse(await readFile(path.join(process.env.MUSEION_AUTH_OUTBOX_PATH, `${challenge.challengeId}.json`), "utf8"));
    assert(message.recipient === email && message.expiresAt > Date.now(), "Outbox must belong to this synthetic signup");
    await page.getByLabel("Verification code", { exact: true }).fill(message.code);
    await page.getByRole("button", { name: "Verify & continue", exact: true }).click();
    await page.waitForURL("**/welcome*", { timeout: 15_000 });
    const choices = [/Build a strong foundation/, /^Math/, /I know a little/, /10 minutes/];
    for (const [index, choice] of choices.entries()) {
      await page.getByRole("radio", { name: choice }).check();
      await page.getByRole("button", { name: index === 3 ? "Find my starting point" : "Continue", exact: true }).click();
    }
    await visible(page.getByRole("button", { name: "Go to my dashboard", exact: true }));
    await inspect(page, `${label}-onboarding`);
    await page.getByRole("button", { name: "Go to my dashboard", exact: true }).click();
    await page.waitForURL("**/dashboard");
    await inspect(page, `${label}-dashboard`);
    for (const route of ["/library", "/courses/algebra-as-balance", "/review", "/progress", "/create", "/settings", "/account"]) {
      await page.goto(`${origin.origin}${route}`);
      await visible(page.locator("main h1"));
      await inspect(page, `${label}-${route.slice(1).replaceAll("/", "-")}`);
    }
    await page.goto(`${origin.origin}/lessons/linear-equations-intro`);
    await visible(page.getByRole("textbox", { name: "Your answer", exact: true }));
    const composer = page.getByRole("textbox", { name: "Message for Maia", exact: true });
    assert(await composer.getAttribute("maxlength") === null, "Maia composer must not impose an arbitrary text limit");
    assert(await page.getByText(/0\/2000|Here to help|Let.s work it out together/).count() === 0, "No redundant composer labels");
    await inspect(page, `${label}-lesson-opening`);
    await page.getByRole("textbox", { name: "Your answer", exact: true }).fill("2");
    await page.getByRole("button", { name: "Check", exact: true }).click();
    await visible(page.getByText("Not yet.", { exact: true }));
    await inspect(page, `${label}-lesson-guidance`);
    await page.getByRole("textbox", { name: "Your answer", exact: true }).fill("6");
    await page.getByRole("button", { name: "Check", exact: true }).click();
    await visible(page.getByText("That’s correct.", { exact: true }));
    await page.reload();
    await visible(page.getByText("That’s correct.", { exact: true }));
    await inspect(page, `${label}-lesson-resume`);
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await visible(page.getByRole("textbox", { name: "Your answer", exact: true }));
    await page.goto(`${origin.origin}/dashboard`);
    await visible(page.getByRole("button", { name: "Sign out", exact: true }));
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await page.goto(`${origin.origin}/dashboard`);
    assert(new URL(page.url()).pathname === "/login", "Signout must restore the private boundary");
  } finally { await context.close(); }
}

try {
  for (const [viewport, label] of [[{ width: 1440, height: 900 }, "desktop"], [{ width: 390, height: 844 }, "mobile"]]) {
    await publicFlow(viewport, label);
    await learnerFlow(viewport, label);
  }
  const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 855, height: 763 } });
  try {
    const page = await noJs.newPage();
    await page.goto(origin.origin);
    await visible(page.getByRole("banner").getByRole("link", { name: "Sign in", exact: true }));
    await page.screenshot({ path: path.join(outputDir, "tablet-no-javascript.png"), fullPage: true });
  } finally { await noJs.close(); }
} finally { await browser.close(); }
if (failures.length) throw new Error(`Private-product UI gate failures:\n${failures.join("\n")}`);
console.log(`Private-product UI gates passed. Evidence: ${outputDir}`);
