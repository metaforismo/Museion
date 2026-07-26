/**
 * Annotated product screenshots for PR packages.
 *
 * Captures real product states through the real UI and stamps each capture
 * with numbered callout badges (lapis badge, white numeral, ink caption card —
 * the product's own colours) anchored to live DOM bounding boxes. Every shot
 * writes a sidecar `<name>.md` legend mapping badge numbers to captions.
 *
 * MUST run against a PRODUCTION server — the Next dev badge stamps itself over
 * the lower-left corner of every dev capture:
 *
 *   1. `npm run build`
 *   2. `npm start` (any port; export MUSEION_BASE_URL to match).
 *   3. `MUSEION_BASE_URL=http://localhost:3000 node scripts/annotate-screenshots.mjs [shot ...]`
 *      With no arguments every shot is captured; naming shots filters the run.
 *
 * Seeded states are driven through the real UI only — lessons are completed by
 * answering the authored steps, misconceptions are registered by answering
 * wrongly — never by writing to storage. Learner identity lives in a cookie,
 * so a seeded identity's storageState is reused across shots that need the
 * same record. The server keeps learner state in memory: restart it for a
 * clean slate before regenerating.
 *
 * Output: docs/pr/annotated/ — a staging area (override with MUSEION_ANNOTATED_DIR).
 * Captures are then distributed by hand into the per-PR annotated/ directories;
 * see docs/pr/README.md for the map.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

const baseURL = process.env.MUSEION_BASE_URL ?? "http://localhost:3000";
const outputDir = path.resolve(process.env.MUSEION_ANNOTATED_DIR ?? "docs/pr/annotated");

/* ---------------------------------------------------------------- lessons */

/**
 * Authored answer keys for the lessons the seeds walk. These mirror the
 * committed lesson content in `src/lib/content/lessons/` — the seed presses
 * the same options a learner would, and the engine checks them for real.
 */
const ANSWERS = {
  "algebra-balance-equality-as-invariant": [
    { mc: 1 }, { mc: 1 }, { mc: 1 }, { mc: 0 }, { mc: 1 },
  ],
  "algebra-balance-inverse-operations-and-isolation": [
    { mc: 1 }, { num: "13" }, { num: "7" }, { num: "18" }, { mc: 0 },
  ],
  "algebra-balance-two-step-equations-and-transfer": [
    { mc: 0 }, { num: "5" }, { mc: 1 }, { mc: 2 }, { num: "6" },
  ],
};

async function answerStep(page, answer) {
  if (answer.mc !== undefined) {
    await page.locator("fieldset:not([disabled]) label").nth(answer.mc).click();
    await page.getByRole("button", { name: "Check answer" }).click();
  } else {
    const input = page.getByRole("textbox", { name: "Your answer" });
    await input.fill(answer.num);
    await page.getByRole("button", { name: "Check", exact: true }).click();
  }
}

/** Walk a lesson to completion through the real UI; ends on the completion screen. */
async function completeLesson(page, lessonId, courseId) {
  const answers = ANSWERS[lessonId];
  if (!answers?.length) throw new Error(`No answer key for ${lessonId}`);
  await page.goto(`${baseURL}/lessons/${lessonId}?course=${courseId}`, { waitUntil: "domcontentloaded" });
  for (const answer of answers) {
    await page.getByRole("button", { name: /Check( answer)?/ }).first().waitFor({ state: "visible", timeout: 20_000 });
    await answerStep(page, answer);
    const bloom = page.getByText("Correct — nice reasoning.");
    await bloom.waitFor({ state: "visible", timeout: 20_000 });
    // Every step, including the last, advances through the bloom's Continue;
    // the final advance is what flips the session to complete.
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await bloom.waitFor({ state: "hidden", timeout: 20_000 });
  }
  await page.getByRole("heading", { name: "Lesson complete" }).waitFor({ state: "visible", timeout: 20_000 });
}

/** Register a real misconception: a genuinely wrong numeric answer, checked by the engine. */
async function answerWrongNumeric(page, lessonId, wrongValue) {
  await page.goto(`${baseURL}/lessons/${lessonId}`, { waitUntil: "domcontentloaded" });
  const input = page.getByRole("textbox", { name: "Your answer" });
  await input.waitFor({ state: "visible", timeout: 20_000 });
  await input.fill(wrongValue);
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await page.getByText("Not yet — stay with it.").waitFor({ state: "visible", timeout: 20_000 });
}

/**
 * Walk into a lesson's second step (answering step one correctly) and leave a
 * genuinely wrong numeric answer standing there. Numeric steps are used for
 * misconception seeding on purpose: the multiple-choice control submits the
 * option INDEX, which `matchMisconception` compares against the authored
 * option TEXT, so wrong choice answers never register their misconception —
 * a pre-existing product bug this script must not paper over by pretending
 * a choice-seeded queue exists.
 */
async function seedWrongSecondStep(page, lessonId, firstAnswer, wrongValue) {
  await page.goto(`${baseURL}/lessons/${lessonId}`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Check( answer)?/ }).first().waitFor({ state: "visible", timeout: 20_000 });
  await answerStep(page, firstAnswer);
  const bloom = page.getByText("Correct — nice reasoning.");
  await bloom.waitFor({ state: "visible", timeout: 20_000 });
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await bloom.waitFor({ state: "hidden", timeout: 20_000 });
  const input = page.getByRole("textbox", { name: "Your answer" });
  await input.waitFor({ state: "visible", timeout: 20_000 });
  await input.fill(wrongValue);
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await page.getByText("Not yet — stay with it.").waitFor({ state: "visible", timeout: 20_000 });
}

/* -------------------------------------------------------------- identities */

/**
 * Learner identities, each seeded once through the real UI and reused via
 * cookie storageState. The record itself lives on the server, keyed by the
 * learner cookie, so every shot sharing an identity sees the same record.
 *
 * - fresh:    no record at all.
 * - started:  algebra lesson 1 completed; a wrong numeric answer left standing
 *             on lesson 2's second step ("5" for x − 4 = 9 — the authored
 *             subtracts-again trigger) and one in Linear Equations ("2" —
 *             subtracting the coefficient) — two real, unresolved
 *             misconceptions feeding the review queue.
 * - finished: a separate learner who walked the whole Algebra as Balance path.
 *             Deliberately NOT derived from "started": the record lives on the
 *             server under the learner cookie, so seeding more work onto the
 *             started learner would silently change every later shot that
 *             reuses it.
 */
const identityStates = new Map();

async function seedContext(browser, viewport, storageState, firstVisit = false) {
  const context = await browser.newContext({
    viewport,
    reducedMotion: "reduce",
    ...(storageState ? { storageState } : {}),
  });
  // App-shell routes redirect first-time visitors to onboarding; seed the flag
  // except when the shot is the onboarding tour itself.
  if (!firstVisit) await context.addInitScript(() => localStorage.setItem("museion-onboarded", "1"));
  return context;
}

async function identityState(browser, name) {
  if (name === "fresh") return null;
  if (identityStates.has(name)) return identityStates.get(name);
  const seedViewport = { width: 1440, height: 960 };

  if (name === "started") {
    const context = await seedContext(browser, seedViewport, null);
    const page = await context.newPage();
    await completeLesson(page, "algebra-balance-equality-as-invariant", "algebra-as-balance");
    await seedWrongSecondStep(page, "algebra-balance-inverse-operations-and-isolation", { mc: 1 }, "5");
    await answerWrongNumeric(page, "linear-equations-intro", "2");
    const state = await context.storageState();
    await context.close();
    identityStates.set(name, state);
    return state;
  }

  if (name === "finished") {
    const context = await seedContext(browser, seedViewport, null);
    const page = await context.newPage();
    await completeLesson(page, "algebra-balance-equality-as-invariant", "algebra-as-balance");
    await completeLesson(page, "algebra-balance-inverse-operations-and-isolation", "algebra-as-balance");
    await completeLesson(page, "algebra-balance-two-step-equations-and-transfer", "algebra-as-balance");
    const state = await context.storageState();
    await context.close();
    identityStates.set(name, state);
    return state;
  }

  throw new Error(`Unknown identity: ${name}`);
}

/* ------------------------------------------------------------------ shots */

/**
 * The shot list. Each entry:
 *   name      output basename
 *   route     path to open
 *   identity  "fresh" | "started" | "finished" (see above)
 *   width/height  viewport (1440×960 default)
 *   prepare   optional async (page) — drive the page into the capture state
 *   scrollTo  optional selector centred before measuring callout boxes
 *   callouts  [{ selector, label, placement?, optional? }]
 *             placement: where the badge+caption sit relative to the target
 *             box — "top-left" (default), "top-right", "bottom-left",
 *             "bottom-right", "left", "right". Badges sit OUTSIDE the box so
 *             they never cover what they label.
 */
const SHOTS = [
  {
    name: "dashboard-1440",
    route: "/dashboard",
    identity: "started",
    callouts: [
      { selector: 'main a.pressable:has-text("Begin")', label: "One full-accent next move — pressable depth on a real recommendation", placement: "bottom-left", caption: false },
      { selector: 'a.pressable:has-text("to revisit")', label: "The review press appears only when the queue is real — a count, not guilt", placement: "right" },
      { selector: 'section[aria-label="Your journey so far"]', label: "Journey tiles count up to recorded values; zero-valued tiles stay hidden", placement: "left", caption: false },
      { selector: 'main img[alt^="Maia"]', label: "Maia posed from the recommendation state", placement: "left", ring: false },
    ],
  },
  {
    name: "dashboard-390",
    route: "/dashboard",
    identity: "started",
    width: 390,
    height: 844,
    callouts: [
      { selector: 'main a.pressable:has-text("Begin")', label: "Full-accent next move — pressable depth on a real recommendation", placement: "bottom-left", caption: false },
      { selector: 'a.pressable:has-text("to revisit")', label: "Real review count — never guilt", placement: "right", caption: false },
      { selector: 'section[aria-label="Your journey so far"]', label: "Journey tiles count up to recorded values only", placement: "top-left", caption: false },
    ],
  },
  {
    name: "trail-fresh-1440",
    route: "/courses/forces-and-motion",
    identity: "fresh",
    height: 1200,
    scrollTo: 'a.pressable[aria-current="step"]',
    callouts: [
      { selector: 'ol[role="list"] span:has(> .path-halo)', label: "Current node — full subject accent with a breathing halo", placement: "left", caption: false },
      { selector: 'ol[role="list"] img:visible', label: "Maia stands at the current node, posed from state", placement: "top-right", caption: false, ring: false, optional: true },
      { selector: 'a.pressable[aria-current="step"]', label: "The row's single tab stop — a chunky subject press", placement: "bottom-left" },
      { selector: 'ol[role="list"] li:nth-child(2) a', label: "Ahead rows stay quiet and open — recommended order, never a padlock", placement: "bottom-right" },
    ],
  },
  {
    name: "trail-fresh-390",
    route: "/courses/forces-and-motion",
    identity: "fresh",
    width: 390,
    height: 1100,
    scrollTo: 'a.pressable[aria-current="step"]',
    callouts: [
      { selector: 'ol[role="list"] span:has(> .path-halo)', label: "Current node at full subject accent", placement: "left", caption: false },
      { selector: 'a.pressable[aria-current="step"]', label: "The single press per lesson", placement: "bottom-left" },
      { selector: 'ol[role="list"] li:nth-child(2) a', label: "Ahead rows stay quiet and open", placement: "bottom-right", caption: false, optional: true },
    ],
  },
  {
    name: "trail-progress-1440",
    route: "/courses/algebra-as-balance",
    identity: "started",
    height: 1200,
    scrollTo: 'a.pressable[aria-current="step"]',
    callouts: [
      { selector: 'ol[role="list"] li:first-child .h-13', label: "Done node and accent rail — walked ground from the real record", placement: "left", caption: false },
      { selector: 'a.pressable[aria-current="step"]', label: "The current lesson keeps the full card and the one loud press", placement: "bottom-left" },
      { selector: 'ol[role="list"] img:visible', label: "Maia at the frontier of the record", placement: "top-right", caption: false, ring: false, optional: true },
    ],
  },
  {
    name: "trail-progress-390",
    route: "/courses/algebra-as-balance",
    identity: "started",
    width: 390,
    height: 1100,
    scrollTo: 'a.pressable[aria-current="step"]',
    callouts: [
      { selector: 'ol[role="list"] li:first-child .h-13', label: "Done node — walked ground from the record", placement: "left", caption: false },
      { selector: 'a.pressable[aria-current="step"]', label: "Continue — the one loud press", placement: "bottom-left" },
    ],
  },
  {
    name: "trail-complete-1440",
    route: "/courses/algebra-as-balance",
    identity: "finished",
    height: 1200,
    scrollTo: 'ol[role="list"] li:last-child',
    callouts: [
      { selector: 'ol[role="list"] span.bg-gold', label: "The crown — course completion is an engine-checked fact", placement: "top-right" },
      { selector: 'ol[role="list"] li:first-child .h-13', label: "Every node filled, the whole rail accent: all walked ground", placement: "left", caption: false },
    ],
  },
  {
    name: "lesson-wrong-1440",
    route: "/lessons/linear-equations-intro",
    identity: "fresh",
    prepare: async (page) => {
      const input = page.getByRole("textbox", { name: "Your answer" });
      await input.waitFor({ state: "visible", timeout: 20_000 });
      await input.fill("2");
      await page.getByRole("button", { name: "Check", exact: true }).click();
      await page.getByText("Not yet — stay with it.").waitFor({ state: "visible", timeout: 20_000 });
    },
    scrollTo: '[role="alert"]',
    callouts: [
      { selector: 'button.pressable:has-text("Check")', label: "Check is a subject-accent press — the key the engine answers", placement: "right" },
      { selector: '[role="alert"]', label: "Checked by code, not by a model — wrong keeps its honest copy", placement: "right" },
      { selector: 'button.pressable:has-text("Try again")', label: "Warm gold retry press; help stays quieter", placement: "bottom-left" },
    ],
  },
  {
    name: "completion-1440",
    route: "/lessons/algebra-balance-equality-as-invariant?course=algebra-as-balance",
    identity: "fresh",
    height: 1250,
    prepare: async (page) => {
      await completeLesson(page, "algebra-balance-equality-as-invariant", "algebra-as-balance");
    },
    callouts: [
      { selector: "main dl", label: "The observation leads: the exact session counts the engine recorded", placement: "right" },
      { selector: "main .border-gold", label: "Completion is not mastery — the caveat ships with the beat", placement: "right" },
      { selector: 'a.pressable:has-text("Back to")', label: "One full-accent press back to the trail, carrying the arrival", placement: "bottom-left" },
      { selector: 'main img[alt="Maia celebrating"]', label: "Maia celebrating — live only at verified moments", placement: "left", ring: false, optional: true },
    ],
  },
  {
    name: "review-1440",
    route: "/review",
    identity: "started",
    callouts: [
      { selector: 'header p:has-text("to revisit")', label: "The queue length is the page's one honest urgency — counted up, never invented", placement: "left" },
      { selector: 'a.pressable:has-text("Review now")', label: "The head of the queue takes the page's one warm gold press", placement: "top-right" },
      { selector: 'main ol li:nth-child(2) a', label: "The rest of the queue: pressable cards in the same gold family", placement: "left", caption: false, optional: true },
    ],
  },
  {
    name: "judge-demo-1440",
    route: "/judge",
    identity: "fresh",
    prepare: async (page) => {
      await page.locator('span.rounded-md:has-text("Sample lesson")').waitFor({ state: "visible", timeout: 20_000 });
      // Advance past the grounded explanation to the first checked block, so
      // the capture shows the key the engine actually answers.
      await page.getByRole("button", { name: "Continue", exact: true }).click();
      await page.getByRole("button", { name: "Check prediction" }).waitFor({ state: "visible", timeout: 20_000 });
      // Choose an option so the Check key stands live rather than disabled.
      await page.locator("fieldset label").first().click();
    },
    callouts: [
      { selector: 'span.rounded-md:has-text("Sample lesson")', label: "The sample's subject supplies the accent — CS violet, derived, not decorative", placement: "left" },
      { selector: '[role="progressbar"]', label: "Progress carries the subject accent; the counter sits on the type scale", placement: "top-right", caption: false },
      { selector: 'button.pressable:has-text("Check prediction")', label: "Check is a subject-accent press — the same key grammar as the app behind the gate", placement: "bottom-left" },
    ],
  },
  {
    name: "studio-spine-1440",
    route: "/create",
    identity: "fresh",
    height: 1200,
    prepare: async (page) => {
      await page.getByLabel("Material 1 title").fill("Playlist transcript");
      await page.getByLabel("Material 1 reference link").fill("https://www.youtube.com/playlist?list=OPEN-COURSE");
      await page.getByLabel("Material 1 authorized text").fill("Authorized creator notes explaining the central ideas and the learner decisions supported by this playlist.");
      await page.getByLabel("Material 1 role").selectOption("transcript");
      await page.getByLabel("I am allowed to use every material in this Source Pack.").check();
      await page.getByRole("button", { name: "Normalize 1 material" }).click();
      await page.getByText("1 normalized material", { exact: true }).waitFor({ state: "visible", timeout: 20_000 });
    },
    scrollTo: 'ol[aria-label="Creator progress"]',
    callouts: [
      { selector: 'a.pressable:has-text("Check connection")', label: "The gating action is a real press, not a bare text link", placement: "right" },
      { selector: 'ol[aria-label="Creator progress"] li:first-child .grid', label: "A satisfied stage speaks the studio accent — a precondition never wears correct-green", placement: "left" },
      { selector: 'ol[aria-label="Creator progress"] .path-halo', label: "The current stage stands in the licensed halo — the trail's node grammar at pipeline scale", placement: "top-right" },
    ],
  },
  {
    name: "onboarding-tour-1440",
    route: "/welcome",
    identity: "fresh",
    firstVisit: true,
    height: 1100,
    prepare: async (page) => {
      for (let i = 0; i < 4; i += 1) await page.getByRole("button", { name: "Next", exact: true }).click();
      await page.getByRole("button", { name: /Start learning/ }).waitFor({ state: "visible", timeout: 20_000 });
      await page.getByRole("button", { name: "Educator", exact: true }).click();
    },
    scrollTo: 'button.pressable[aria-pressed="true"]',
    callouts: [
      { selector: 'button.pressable[aria-pressed="true"]', label: "A chosen posture holds lapis-dark on lapis-soft above the deep edge", placement: "right" },
      { selector: 'button.pressable:has-text("Start learning")', label: "The tour's forward key presses in lapis — the first minute speaks the product's grammar", placement: "top-right" },
      { selector: 'button:has-text("Skip")', label: "Skip stays a quiet text action — leaving is not weighted like advancing", placement: "left", optional: true },
    ],
  },
  {
    name: "library-1440",
    route: "/library",
    identity: "started",
    callouts: [
      { selector: 'a.pressable-card:has-text("Algebra as Balance")', label: "A started course warms to its subject tint — the record leaves the door ajar", placement: "bottom-left", caption: false },
      { selector: 'a.pressable-card:has-text("Algebra as Balance") span.inline-grid', label: "Real progress ring — 1 of 3 from the learner record, never invented", placement: "top-right", caption: false, optional: true },
    ],
  },
];

/* -------------------------------------------------------------- annotation */

/**
 * Badge + caption geometry, computed in document coordinates so the overlay
 * holds wherever the page is scrolled. The badge never covers its target: it
 * sits just outside the labelled box, with the ink caption card growing away
 * from it. Positions are expressed as an anchor point plus a percentage
 * translation, so caption size never enters the math. `badgeFirst` keeps the
 * numeral adjacent to the box it names.
 */
function overlayPlan(box, placement, viewport) {
  const GAP = 10;
  const anchors = {
    "top-left": { x: box.x, y: box.y - GAP, tx: "0", ty: "-100%", badgeFirst: true },
    "top-right": { x: box.x + box.width, y: box.y - GAP, tx: "-100%", ty: "-100%", badgeFirst: false },
    "bottom-left": { x: box.x, y: box.y + box.height + GAP, tx: "0", ty: "0", badgeFirst: true },
    "bottom-right": { x: box.x + box.width, y: box.y + box.height + GAP, tx: "-100%", ty: "0", badgeFirst: false },
    left: { x: box.x - GAP, y: box.y + box.height / 2, tx: "-100%", ty: "-50%", badgeFirst: false },
    right: { x: box.x + box.width + GAP, y: box.y + box.height / 2, tx: "0", ty: "-50%", badgeFirst: true },
  };
  const plan = { ...(anchors[placement] ?? anchors["top-left"]) };
  // Clamp inside the viewport horizontally so nothing is cropped away.
  plan.x = Math.max(8, Math.min(plan.x, viewport.width - 8));
  return plan;
}

async function annotate(page, callouts, viewport) {
  const resolved = [];
  const missing = [];
  for (const callout of callouts) {
    const locator = page.locator(callout.selector).first();
    let box = null;
    try {
      await locator.waitFor({ state: "visible", timeout: callout.optional ? 3_000 : 15_000 });
      box = await locator.boundingBox();
    } catch {
      box = null;
    }
    if (!box) {
      if (callout.optional) continue;
      missing.push(callout.selector);
      continue;
    }
    resolved.push({ callout, box });
  }
  if (missing.length) throw new Error(`Callout targets not found: ${missing.join(" | ")}`);

  const metrics = await page.evaluate(() => ({ scrollX: window.scrollX, scrollY: window.scrollY }));
  const items = resolved.map(({ callout, box }, index) => {
    const ring = { x: box.x + metrics.scrollX, y: box.y + metrics.scrollY, width: box.width, height: box.height };
    const plan = overlayPlan(ring, callout.placement, viewport);
    // Cap the caption so a side placement never runs off the capture edge:
    // the row grows rightward for tx 0 and leftward for tx -100%.
    const available = plan.tx === "0" ? viewport.width - plan.x - 60 : plan.x - 60;
    return {
      n: index + 1,
      label: callout.label,
      ring,
      drawRing: callout.ring !== false,
      drawCaption: callout.caption !== false,
      captionMax: Math.max(140, Math.min(300, available)),
      plan,
    };
  });

  await page.evaluate((payload) => {
    const LAPIS = "#2b5ee7";
    const INK = "#10131b";
    const root = document.createElement("div");
    root.id = "museion-annotations";
    root.style.cssText = "position:absolute;left:0;top:0;width:0;height:0;overflow:visible;pointer-events:none;z-index:2147483000;font-family:var(--font-sans,Inter,sans-serif);";
    for (const item of payload) {
      const { ring, plan } = item;
      if (item.drawRing) {
        const ringEl = document.createElement("div");
        ringEl.style.cssText = [
          "position:absolute",
          `left:${ring.x - 5}px`, `top:${ring.y - 5}px`,
          `width:${ring.width + 10}px`, `height:${ring.height + 10}px`,
          `border:2.5px solid ${LAPIS}`,
          "border-radius:14px",
          "box-shadow:0 0 0 2px rgba(255,255,255,.9), inset 0 0 0 2px rgba(255,255,255,.9)",
        ].join(";");
        root.appendChild(ringEl);
      }

      const badge = document.createElement("span");
      badge.style.cssText = `flex:none;display:grid;place-items:center;width:27px;height:27px;border-radius:50%;background:${LAPIS};color:#fff;font-size:14px;font-weight:700;box-shadow:0 0 0 2.5px #fff,0 2px 6px rgba(16,19,27,.35);`;
      badge.textContent = String(item.n);

      const group = document.createElement("div");
      group.style.cssText = `position:absolute;left:${plan.x}px;top:${plan.y}px;transform:translate(${plan.tx},${plan.ty});display:flex;align-items:center;gap:7px;width:max-content;`;
      if (item.drawCaption) {
        const card = document.createElement("span");
        card.style.cssText = `background:${INK};color:#fff;font-size:12.5px;font-weight:600;line-height:1.35;padding:6px 10px;border-radius:10px;box-shadow:0 2px 8px rgba(16,19,27,.3);max-width:${item.captionMax}px;`;
        card.textContent = item.label;
        group.append(...(plan.badgeFirst ? [badge, card] : [card, badge]));
      } else {
        group.append(badge);
      }
      root.appendChild(group);
    }
    document.body.appendChild(root);
  }, items);

  return items.map(({ n, label }) => ({ n, label }));
}

/* -------------------------------------------------------------------- run */

const launchOptions = process.env.MUSEION_BROWSER_PATH
  ? { executablePath: process.env.MUSEION_BROWSER_PATH, headless: true }
  : { channel: "chrome", headless: true };

const only = process.argv.slice(2);
const shots = only.length ? SHOTS.filter((shot) => only.includes(shot.name)) : SHOTS;
if (!shots.length) throw new Error(`No shots matched: ${only.join(", ")}`);

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch(launchOptions).catch(() => chromium.launch({ headless: true }));
const errors = [];

try {
  for (const shot of shots) {
    const viewport = { width: shot.width ?? 1440, height: shot.height ?? 960 };
    const storageState = await identityState(browser, shot.identity ?? "fresh");
    const context = await seedContext(browser, viewport, storageState, shot.firstVisit ?? false);
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(`${shot.name}: ${error.message}`));
    page.on("response", (response) => { if (response.status() >= 500) errors.push(`${shot.name}: HTTP ${response.status()} ${response.url()}`); });

    await page.goto(`${baseURL}${shot.route}`, { waitUntil: "domcontentloaded" });
    await page.locator("main").waitFor({ state: "visible", timeout: 20_000 });
    await page.waitForLoadState("networkidle").catch(() => {});
    if (shot.prepare) await shot.prepare(page);
    if (shot.scrollTo) {
      // Centre the anchor so bottom-of-fold targets clear fixed chrome (the
      // mobile tab bar) instead of resting under it.
      await page.locator(shot.scrollTo).first()
        .evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }))
        .catch(() => {});
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    }
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });

    const legend = await annotate(page, shot.callouts, viewport);
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.screenshot({ path: path.join(outputDir, `${shot.name}.png`), fullPage: false });

    const legendLines = legend.map(({ n, label }) => `${n}. ${label}`).join("\n");
    await writeFile(
      path.join(outputDir, `${shot.name}.md`),
      `# ${shot.name}\n\nRoute: \`${shot.route}\` · viewport ${viewport.width}×${viewport.height} · identity: ${shot.identity ?? "fresh"}\n\n${legendLines}\n`,
    );
    console.log(`✓ ${shot.name} (${legend.length} callouts)`);
    await context.close();
  }
} finally {
  await browser.close();
}

if (errors.length) {
  console.error(`Browser errors during capture:\n${errors.join("\n")}`);
  process.exitCode = 1;
}
