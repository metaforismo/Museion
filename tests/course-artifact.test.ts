import { describe, expect, it } from "vitest";

import { allLessons } from "@/lib/content";
import {
  PublicCourseArtifactV2Schema,
  CourseArtifactV2Schema,
  CourseBlueprintSchema,
  adaptLegacyLesson,
  canonicalJson,
  canonicalSha256,
  toPublicCourseArtifact,
  validateArtifactReferences,
} from "@/lib/compiler";
import goldenArtifactJson from "./fixtures/binary-search-course-artifact-v2.json";
import goldenBlueprintJson from "./fixtures/binary-search-blueprint.json";
import goldenGraphJson from "./fixtures/binary-search-source-graph.json";
import goldenDocumentJson from "./fixtures/binary-search-source-document.json";
import replayManifestJson from "./fixtures/binary-search-replay-manifest.json";

const generatedAt = "2026-07-15T00:00:00.000Z";

describe("Course Artifact v2 private/public boundary", () => {
  it.each(allLessons().map((lesson) => [lesson.id, lesson] as const))(
    "adapts legacy lesson %s without changing authored content",
    async (_id, lesson) => {
      const snapshot = canonicalJson(lesson);
      const artifact = await adaptLegacyLesson(lesson, generatedAt);
      expect(artifact.validation.status).toBe("needs-review");
      expect(artifact.source.origin).toBe("legacy_v1");
      expect(validateArtifactReferences(artifact, new Set())).toEqual([]);
      expect(canonicalJson(lesson)).toBe(snapshot);
    },
  );

  it("removes every restricted truth field before browser serialization", async () => {
    const lesson = allLessons()[0];
    const artifact = await adaptLegacyLesson(lesson, generatedAt);
    const publicArtifact = toPublicCourseArtifact(artifact);
    expect(PublicCourseArtifactV2Schema.parse(publicArtifact)).toEqual(publicArtifact);
    const serialized = JSON.stringify(publicArtifact);
    expect(serialized).not.toContain("answerSpecs");
    expect(serialized).not.toContain("misconceptions");
    expect(serialized).not.toContain("answerSpecId");
    expect(serialized).not.toContain("solution");
    expect(serialized).not.toContain("hints");
    expect(serialized).not.toContain("correctIndex");
    expect(serialized).not.toContain("expectedStates");
    expect(serialized).not.toContain("misconceptionRules");
    for (const block of Object.values(publicArtifact.blocks)) {
      expect(block).not.toHaveProperty("answerSpecId");
      expect(block).not.toHaveProperty("solution");
      expect(block).not.toHaveProperty("hints");
      expect(block).not.toHaveProperty("correctIndex");
    }
  });

  it("rejects unknown public block fields", async () => {
    const artifact = toPublicCourseArtifact(await adaptLegacyLesson(allLessons()[0], generatedAt));
    const first = Object.keys(artifact.blocks)[0];
    expect(() => PublicCourseArtifactV2Schema.parse({ ...artifact, blocks: { ...artifact.blocks, [first]: { ...artifact.blocks[first], solution: "leak" } } })).toThrow();
  });

  it("rejects model-invented block kinds", async () => {
    const artifact = await adaptLegacyLesson(allLessons()[0], generatedAt);
    const first = Object.keys(artifact.blocks)[0];
    expect(() =>
      PublicCourseArtifactV2Schema.parse({
        ...toPublicCourseArtifact(artifact),
        blocks: {
          [first]: {
            id: first,
            kind: "generated-react",
            objectiveIds: [],
            conceptIds: [],
            citations: [],
            estimatedSeconds: 10,
            accessibilityLabel: "unsafe",
            code: "window.location = 'https://example.com'",
          },
        },
      }),
    ).toThrow();
  });

  it("validates the source-grounded golden Blueprint and Course Artifact", async () => {
    const blueprint = CourseBlueprintSchema.parse(goldenBlueprintJson);
    const artifact = CourseArtifactV2Schema.parse(goldenArtifactJson);
    const knownSpanIds = new Set(Object.keys(goldenGraphJson.spans));
    expect(validateArtifactReferences(artifact, knownSpanIds)).toEqual([]);
    expect(artifact.source.sourceGraphSha256).toBe(await canonicalSha256(goldenGraphJson));
    expect(replayManifestJson.blueprintSha256).toBe(await canonicalSha256(blueprint));
    expect(replayManifestJson.courseArtifactSha256).toBe(await canonicalSha256(artifact));
  });

  it("keeps golden replay truth private", () => {
    const publicArtifact = toPublicCourseArtifact(CourseArtifactV2Schema.parse(goldenArtifactJson));
    const serialized = JSON.stringify(publicArtifact);
    for (const restricted of ["answerSpecs", "solution", "hints", "correctIndex", "correctOrder", "expectedStates", "misconceptionRules"]) {
      expect(serialized).not.toContain(`\"${restricted}\"`);
    }
  });

  it("blocks uncited source-grounded blocks and a missing transfer", () => {
    const artifact = structuredClone(CourseArtifactV2Schema.parse(goldenArtifactJson));
    artifact.blocks.explanation_invariant.citations = [];
    artifact.transferBlockIds = [];
    const codes = validateArtifactReferences(artifact, new Set(Object.keys(goldenGraphJson.spans))).map((issue) => issue.code);
    expect(codes).toContain("missing_citation");
    expect(codes).toContain("missing_transfer");
  });

  it("fails closed for learner structures the current renderer cannot complete", () => {
    const artifact = structuredClone(CourseArtifactV2Schema.parse(goldenArtifactJson));
    artifact.lessons.push({ ...artifact.lessons[0], id: "second_lesson", blockIds: [...artifact.lessons[0].blockIds] });
    artifact.lessons[0].blockIds.push("transfer_unseen");
    const issues = validateArtifactReferences(artifact, new Set(Object.keys(goldenGraphJson.spans)));
    expect(issues.filter((issue) => issue.code === "unsupported_learner_structure")).toHaveLength(2);
  });

  it("requires transfer controls and private answer specs to agree", () => {
    const artifact = structuredClone(CourseArtifactV2Schema.parse(goldenArtifactJson));
    const transfer = artifact.blocks.transfer_unseen;
    if (transfer.kind !== "transfer-challenge") throw new Error("Fixture transfer block is missing");
    transfer.responseKind = "expression";
    const issues = validateArtifactReferences(artifact, new Set(Object.keys(goldenGraphJson.spans)));
    expect(issues.map((issue) => issue.code)).toContain("invalid_answer_spec");
  });

  it("binds source-grounded provenance to the validated document and graph", async () => {
    const artifact = CourseArtifactV2Schema.parse(goldenArtifactJson);
    const issues = validateArtifactReferences(artifact, new Set(Object.keys(goldenGraphJson.spans)), {
      sourceId: `${goldenDocumentJson.id}_wrong`,
      sourceSha256: "b".repeat(64),
      sourceGraphSha256: "c".repeat(64),
    });
    expect(issues.map((issue) => issue.code)).toEqual(expect.arrayContaining(["source_id_mismatch", "source_hash_mismatch", "source_graph_hash_mismatch"]));
  });
});
