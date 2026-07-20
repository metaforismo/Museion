import { z } from "zod";

export const DashboardActionSchema = z.object({
  kind: z.enum(["resume", "review", "practice", "launch", "create"]),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(400),
  href: z.string().startsWith("/"),
  reason: z.string().min(1).max(300),
}).strict();

export const DashboardSnapshotSchema = z.object({
  schemaVersion: z.literal("1.0"),
  nextAction: DashboardActionSchema,
  activeLearning: z.array(z.object({
    id: z.string(),
    title: z.string(),
    kind: z.enum(["authored", "generated"]),
    progress: z.number().min(0).max(1),
    detail: z.string(),
    href: z.string().startsWith("/"),
    updatedAt: z.string().datetime().nullable(),
  }).strict()).max(6),
  reviewQueue: z.array(z.object({
    id: z.string(),
    concept: z.string(),
    reason: z.string(),
    href: z.string().startsWith("/"),
    priority: z.enum(["high", "normal"]),
  }).strict()).max(6),
  evidence: z.array(z.object({
    concept: z.string(),
    state: z.enum(["observed-guided", "hint-free-practice", "immediate-transfer"]),
    result: z.enum(["developing", "consistent", "correct", "incorrect"]),
    support: z.enum(["more", "some", "light"]),
  }).strict()).max(12),
  misconceptions: z.array(z.object({
    id: z.string(),
    concept: z.string(),
    label: z.string(),
    status: z.enum(["observed", "corrected-in-session"]),
    observedAt: z.string().datetime(),
    href: z.string().startsWith("/"),
  }).strict()).max(5),
  recentSources: z.array(z.object({
    id: z.string(),
    title: z.string(),
    pages: z.number().int().positive(),
    templateId: z.string(),
    createdAt: z.string().datetime(),
    href: z.string().startsWith("/"),
  }).strict()).max(4),
  // Real per-course completion, keyed by course id. Counts a lesson as done
  // only when the learner has actually completed it — no invented progress.
  courseProgress: z.record(z.string(), z.object({
    completed: z.number().int().nonnegative(),
    total: z.number().int().positive(),
  }).strict()),
  // Honest journey totals for tasteful milestones — all from real records.
  journey: z.object({
    lessonsCompleted: z.number().int().nonnegative(),
    coursesCompleted: z.number().int().nonnegative(),
    unassistedTransfers: z.number().int().nonnegative(),
    conceptsObserved: z.number().int().nonnegative(),
  }).strict(),
  runtime: z.object({
    provider: z.enum(["offline", "codex", "openai-api"]),
    label: z.string(),
    persistence: z.enum(["process-local", "hybrid"]),
  }).strict(),
  limitations: z.array(z.string()),
  generatedAt: z.string().datetime(),
}).strict();

export type DashboardSnapshot = z.infer<typeof DashboardSnapshotSchema>;
