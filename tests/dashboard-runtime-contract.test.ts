import { describe, expect, it } from "vitest";

import { DashboardSnapshotSchema } from "@/lib/dashboard/contracts";

/**
 * Every branch of stateBackend().kind in src/lib/dashboard/snapshot.ts must
 * produce a persistence value the schema accepts. It did not: a D1 backend
 * emitted "synced", which the enum rejected, so buildDashboardSnapshot threw
 * on the Sites deployment and took the dashboard and /api/progress with it.
 */
const runtime = (persistence: string) => ({
  provider: "offline" as const,
  label: "Offline verified guidance",
  persistence,
});

describe("dashboard runtime contract", () => {
  it.each(["process-local", "local-durable", "hybrid", "synced"])("accepts persistence %s", (persistence) => {
    expect(DashboardSnapshotSchema.shape.runtime.safeParse(runtime(persistence)).success).toBe(true);
  });

  it("still rejects a persistence value no backend emits", () => {
    expect(DashboardSnapshotSchema.shape.runtime.safeParse(runtime("carrier-pigeon")).success).toBe(false);
  });
});
