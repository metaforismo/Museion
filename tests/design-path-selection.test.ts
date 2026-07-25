import { describe, expect, it } from "vitest";

import { orderSidebarPaths, type SidebarCourse } from "@/lib/design/sidebar-paths";

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
