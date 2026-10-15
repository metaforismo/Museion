import { describe, expect, it } from "vitest";

import { coursePaths } from "@/lib/curriculum";
import { orderSidebarPaths, spreadPathsBySubject, type SidebarCourse } from "@/lib/design/path-selection";

const course = (id: string, lessonCount = 3): SidebarCourse => ({
  id,
  title: id,
  subject: "Algebra",
  lessonCount,
});

const catalog = ["a", "b", "c", "d", "e", "f", "g", "h"].map((id) => course(id));

describe("orderSidebarPaths", () => {
  it("keeps catalog order when there is no progress", () => {
    const { visible, hiddenCount } = orderSidebarPaths(catalog, {}, 6);
    expect(visible.map((entry) => entry.id)).toEqual(["a", "b", "c", "d", "e", "f"]);
    expect(hiddenCount).toBe(2);
  });

  it("promotes in-progress courses above unstarted ones", () => {
    const progress = { g: { completed: 1, total: 3 } };
    const { visible } = orderSidebarPaths(catalog, progress, 6);
    expect(visible[0].id).toBe("g");
  });

  it("orders completed courses after in-progress but before unstarted", () => {
    const progress = {
      h: { completed: 3, total: 3 },
      g: { completed: 1, total: 3 },
    };
    const { visible } = orderSidebarPaths(catalog, progress, 6);
    expect(visible.map((entry) => entry.id).slice(0, 2)).toEqual(["g", "h"]);
  });

  it("breaks ties inside a bucket using catalog order", () => {
    const progress = {
      c: { completed: 1, total: 3 },
      a: { completed: 2, total: 3 },
    };
    const { visible } = orderSidebarPaths(catalog, progress, 6);
    expect(visible.map((entry) => entry.id).slice(0, 2)).toEqual(["a", "c"]);
  });

  it("reports no hidden courses when everything fits", () => {
    const { visible, hiddenCount } = orderSidebarPaths(catalog.slice(0, 3), {}, 6);
    expect(visible).toHaveLength(3);
    expect(hiddenCount).toBe(0);
  });

  it("treats a zero-total course as unstarted rather than complete", () => {
    const progress = { a: { completed: 0, total: 0 } };
    const { visible } = orderSidebarPaths(catalog, progress, 6);
    expect(visible[0].id).toBe("a");
  });

  it("never mutates the input array", () => {
    const input = [...catalog];
    orderSidebarPaths(input, { h: { completed: 1, total: 3 } }, 6);
    expect(input.map((entry) => entry.id)).toEqual(catalog.map((entry) => entry.id));
  });
});

describe("spreadPathsBySubject", () => {
  const mixed = [
    { id: "alg-1", subject: "Algebra" },
    { id: "cs-1", subject: "Computer Science" },
    { id: "alg-2", subject: "Algebra" },
    { id: "phy-1", subject: "Physics" },
    { id: "cs-2", subject: "Computer Science" },
  ];

  it("deals one subject at a time before repeating one", () => {
    const picked = spreadPathsBySubject(mixed, {}, 3);
    expect(picked.map((entry) => entry.subject)).toEqual(["Algebra", "Computer Science", "Physics"]);
  });

  it("keeps catalog order inside a subject once it comes round again", () => {
    const picked = spreadPathsBySubject(mixed, {}, 5);
    expect(picked.map((entry) => entry.id)).toEqual(["alg-1", "cs-1", "phy-1", "alg-2", "cs-2"]);
  });

  it("floats the learner's own courses above the deal", () => {
    const picked = spreadPathsBySubject(mixed, { cs2: { completed: 0, total: 3 }, "cs-2": { completed: 1, total: 3 } }, 3);
    expect(picked[0].id).toBe("cs-2");
  });

  it("orders in-progress before completed, matching the rail", () => {
    const progress = {
      "alg-2": { completed: 3, total: 3 },
      "phy-1": { completed: 1, total: 3 },
    };
    const picked = spreadPathsBySubject(mixed, progress, 4);
    expect(picked.map((entry) => entry.id).slice(0, 2)).toEqual(["phy-1", "alg-2"]);
  });

  it("returns everything it has when the limit exceeds the catalog", () => {
    expect(spreadPathsBySubject(mixed, {}, 99)).toHaveLength(mixed.length);
  });

  it("never mutates the input array", () => {
    const input = [...mixed];
    spreadPathsBySubject(input, { "phy-1": { completed: 1, total: 3 } }, 3);
    expect(input.map((entry) => entry.id)).toEqual(mixed.map((entry) => entry.id));
  });

  /**
   * The dashboard's grid is six. The catalogue has six subjects, so a learner
   * with no record must be offered each of them exactly once — the whole point
   * of showing six of ten rather than all ten.
   */
  it("gives the real catalogue one path per subject at six", () => {
    const picked = spreadPathsBySubject(coursePaths, {}, 6);
    const subjects = picked.map((entry) => entry.subject);
    expect(picked).toHaveLength(6);
    expect(new Set(subjects).size).toBe(6);
  });
});
