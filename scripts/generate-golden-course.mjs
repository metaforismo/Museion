import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const root = process.cwd();
const fixtures = path.join(root, "tests/fixtures");
const document = JSON.parse(await readFile(path.join(fixtures, "binary-search-source-document.json"), "utf8"));
const graph = JSON.parse(await readFile(path.join(fixtures, "binary-search-source-graph.json"), "utf8"));
const generatedAt = "2026-07-15T00:00:00.000Z";

function sortValue(value) {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, sortValue(child)]));
  }
  return value;
}
const canonicalJson = (value) => JSON.stringify(sortValue(value));
const sha256 = (value) => createHash("sha256").update(value, "utf8").digest("hex");
const sourceGraphSha256 = sha256(canonicalJson(graph));
const cite = (spanId, purpose = "claim") => [{ spanId, purpose }];
const common = (id, objectiveIds, conceptIds, spanId, accessibilityLabel, estimatedSeconds = 90) => ({
  id,
  objectiveIds,
  conceptIds,
  citations: cite(spanId),
  estimatedSeconds,
  accessibilityLabel,
});

const blueprint = {
  schemaVersion: "1.0",
  sourceGraphSha256,
  title: "Binary Search: Preserve the Possible",
  audience: { level: "novice", language: "en", targetMinutes: 12, learnerGoal: "Trace inclusive binary search and justify every boundary update." },
  bigQuestion: "How can binary search discard half the array without discarding a possible target?",
  objectives: [
    { id: "objective_invariant", statement: "Identify the inclusive active-interval invariant.", conceptIds: ["active_interval"], evidenceTarget: "self_explanation" },
    { id: "objective_boundary", statement: "Move the correct boundary past a disproved midpoint.", conceptIds: ["midpoint_selection", "boundary_elimination"], evidenceTarget: "guided_practice" },
    { id: "objective_progress", statement: "Detect an update that can repeat state instead of shrinking the interval.", conceptIds: ["strict_progress", "empty_interval"], evidenceTarget: "guided_practice" },
    { id: "objective_transfer", statement: "Apply the same invariant and boundary logic to unseen surface values.", conceptIds: ["near_transfer", "active_interval", "boundary_elimination"], evidenceTarget: "near_transfer" },
  ],
  sequence: ["objective_invariant", "objective_boundary", "objective_progress", "objective_transfer"],
  ahaMoment: "The speedup is justified by an invariant: each comparison proves a whole region impossible, and moving past mid preserves possibility while guaranteeing progress.",
};

const blocks = {
  explanation_invariant: {
    ...common("explanation_invariant", ["objective_invariant"], ["active_interval"], "span_invariant", "Explanation of the active interval invariant", 75),
    kind: "explanation",
    title: "Keep every still-possible index",
    body: "Binary search carries one promise through every iteration: if the target exists, a possible occurrence remains inside the inclusive interval from low through high. A comparison may shrink that interval only when sorted order proves the discarded region impossible.",
  },
  prediction_discard: {
    ...common("prediction_discard", ["objective_boundary"], ["active_interval", "boundary_elimination"], "span_discard", "Predict which indices are impossible after comparing 11 with target 19"),
    kind: "prediction-choice",
    prompt: "For values [2, 5, 8, 11, 14, 19, 23], low = 0, high = 6, mid = 3 and target = 19. Which region has the comparison proved impossible?",
    options: ["Indices 0 through 3", "Indices 4 through 6", "Only index 3", "No indices yet"],
    correctIndex: 0,
    reveal: "Because values[3] = 11 is smaller than 19 and the values are sorted, every index at or below 3 is impossible.",
    misconceptionByIndex: { "1": "mis_wrong_half", "2": "mis_mid_still_candidate", "3": "mis_ignores_sorted_order" },
  },
  range_boundary: {
    ...common("range_boundary", ["objective_boundary", "objective_progress"], ["midpoint_selection", "boundary_elimination", "strict_progress"], "span_boundaries", "Explore inclusive binary search boundaries for target 19", 150),
    kind: "range-explorer",
    prompt: "Move the inclusive boundaries until target 19 is found. Every unsuccessful update must move past mid.",
    values: [2, 5, 8, 11, 14, 19, 23],
    target: 19,
    initialState: { low: 0, high: 6 },
    learnerTask: "complete-search",
    midpointPolicy: "floor",
    misconceptionRules: [
      { id: "mis_mid_reused_small", when: "mid-reused-after-too-small" },
      { id: "mis_mid_reused_large", when: "mid-reused-after-too-large" },
      { id: "mis_wrong_half", when: "wrong-half-discarded" },
    ],
  },
  trace_absent: {
    ...common("trace_absent", ["objective_progress"], ["strict_progress", "empty_interval"], "span_termination", "Trace binary search for absent target 6", 150),
    kind: "state-trace",
    prompt: "Predict the low, high and mid states while searching [2, 5, 8, 11, 14] for absent target 6.",
    values: [2, 5, 8, 11, 14],
    target: 6,
    initialState: { step: 0, low: 0, high: 4, mid: 2 },
    expectedStates: [
      { step: 0, low: 0, high: 4, mid: 2, comparison: "greater" },
      { step: 1, low: 0, high: 1, mid: 0, comparison: "less" },
      { step: 2, low: 1, high: 1, mid: 1, comparison: "less" },
    ],
    midpointPolicy: "floor",
    terminalCondition: "absent",
    responseMode: "predict-next-state",
  },
  sequence_reasoning: {
    ...common("sequence_reasoning", ["objective_boundary"], ["active_interval", "boundary_elimination", "strict_progress"], "span_progress", "Order the reasoning steps for a safe boundary update", 90),
    kind: "sequence-builder",
    prompt: "Order the reasoning that justifies an unsuccessful binary-search update.",
    items: [
      { id: "compare_mid", label: "Compare values[mid] with the target." },
      { id: "prove_region", label: "Use sorted order to prove one region impossible." },
      { id: "move_past_mid", label: "Move the corresponding boundary past mid." },
      { id: "check_shrink", label: "Check that the inclusive interval strictly shrank." },
    ],
    correctOrder: ["compare_mid", "prove_region", "move_past_mid", "check_shrink"],
  },
  guided_next_low: {
    ...common("guided_next_low", ["objective_boundary"], ["boundary_elimination"], "span_boundaries", "Enter the next low boundary after midpoint 3 is too small", 60),
    kind: "guided-response",
    prompt: "low = 0, high = 6 and mid = 3. values[mid] is too small. What is the next low?",
    responseKind: "numeric",
    options: [],
    answerSpecId: "answer_next_low",
    solution: "Index 3 has been disproved, so the next inclusive interval begins at mid + 1 = 4.",
    hints: ["The midpoint is no longer a candidate.", "Move low strictly past mid."],
    misconceptionIds: ["mis_mid_reused_small"],
  },
  transfer_unseen: {
    ...common("transfer_unseen", ["objective_transfer"], ["near_transfer", "active_interval", "boundary_elimination"], "span_transfer", "Unassisted transfer search for target 13", 180),
    kind: "transfer-challenge",
    prompt: "Without hints or Maia, trace binary search over [1, 4, 7, 9, 13, 18, 21, 26, 31] for target 13. What final index is returned?",
    responseKind: "numeric",
    options: [],
    answerSpecId: "answer_transfer_index",
    deepStructureTags: ["inclusive_bounds", "move_past_mid", "active_interval"],
    sourceSurfaceDifference: "The values and interval length differ from guided practice while the inclusive-boundary invariant is unchanged.",
    assistancePolicy: "none",
  },
};

const misconception = (id, conceptId, description, remediationFocus, spanId, triggerAnswers = []) => ({ id, conceptId, triggerAnswers, description, remediationFocus, citations: cite(spanId, "instruction") });
const artifact = {
  schemaVersion: "2.0",
  id: "binary_search_golden",
  title: blueprint.title,
  source: { origin: "source_graph", sourceId: document.id, sourceSha256: document.sha256, sourceGraphSha256 },
  audience: blueprint.audience,
  description: "A cited interactive course about the invariant, inclusive boundaries, strict progress, and near transfer in binary search.",
  bigQuestion: blueprint.bigQuestion,
  objectives: blueprint.objectives.map(({ id, statement, conceptIds }) => ({ id, statement, conceptIds })),
  concepts: graph.concepts.map((concept) => ({
    id: concept.id,
    label: concept.label,
    prerequisiteIds: graph.prerequisiteEdges.filter((edge) => edge.toConceptId === concept.id).map((edge) => edge.fromConceptId),
    sourceConceptId: concept.id,
  })),
  lessons: [{
    id: "lesson_binary_search",
    title: "Preserve, eliminate, progress",
    objectiveIds: blueprint.objectives.map((item) => item.id),
    blockIds: [
      "explanation_invariant",
      "prediction_discard",
      "range_boundary",
      "trace_absent",
      "sequence_reasoning",
    ],
  }],
  blocks,
  answerSpecs: {
    answer_next_low: { id: "answer_next_low", kind: "numeric", value: 4, tolerance: 0 },
    answer_transfer_index: { id: "answer_transfer_index", kind: "numeric", value: 4, tolerance: 0 },
  },
  misconceptions: {
    mis_mid_reused_small: misconception("mis_mid_reused_small", "boundary_elimination", "Keeps mid after values[mid] is too small.", "Move low to mid + 1 because mid has been disproved.", "span_off_by_one", ["low = mid"]),
    mis_mid_reused_large: misconception("mis_mid_reused_large", "boundary_elimination", "Keeps mid after values[mid] is too large.", "Move high to mid - 1 because mid has been disproved.", "span_boundaries", ["high = mid"]),
    mis_wrong_half: misconception("mis_wrong_half", "active_interval", "Discards the region that may still contain the target.", "Use sorted order and the comparison direction before moving a boundary.", "span_discard"),
    mis_mid_still_candidate: misconception("mis_mid_still_candidate", "boundary_elimination", "Treats the disproved midpoint as still uncertain.", "Name what the comparison proved before updating the interval.", "span_off_by_one"),
    mis_ignores_sorted_order: misconception("mis_ignores_sorted_order", "active_interval", "Does not use sorted order to eliminate a region.", "Connect the comparison at mid to every value on one side.", "span_discard"),
  },
  transferBlockIds: ["transfer_unseen"],
  validation: { validatorVersion: "artifact-validator-v1", status: "accepted", blockingIssueCount: 0, warningCount: 0, validatedAt: generatedAt },
  provenance: { compilerVersion: "golden-replay-v1", promptBundleVersion: "golden-binary-search-v1", model: "deterministic-replay", generatedAt, deterministicSeed: "binary-search-golden-v1", generationRunId: "golden_binary_search_v1" },
};

const blueprintPath = path.join(fixtures, "binary-search-blueprint.json");
const artifactPath = path.join(fixtures, "binary-search-course-artifact-v2.json");
const manifestPath = path.join(fixtures, "binary-search-replay-manifest.json");
await writeFile(blueprintPath, `${JSON.stringify(blueprint, null, 2)}\n`, "utf8");
await writeFile(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
await writeFile(manifestPath, `${JSON.stringify({ schemaVersion: "1.0", sourceDocumentSha256: document.sha256, sourceGraphSha256, blueprintSha256: sha256(canonicalJson(blueprint)), courseArtifactSha256: sha256(canonicalJson(artifact)), generatedAt }, null, 2)}\n`, "utf8");
console.log("Generated golden Blueprint, Course Artifact v2, and replay manifest");
