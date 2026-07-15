import { beforeEach, describe, expect, it, vi } from "vitest";

const pdfMock = vi.hoisted(() => ({
  destroy: vi.fn(async () => undefined),
  getPage: vi.fn(),
}));

vi.mock("pdfjs-dist/legacy/build/pdf.mjs", () => ({
  GlobalWorkerOptions: { workerSrc: "" },
  getDocument: () => ({
    destroy: pdfMock.destroy,
    promise: Promise.resolve({ numPages: 31, getPage: pdfMock.getPage }),
  }),
}));

describe("PDF extraction limits", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects an oversized page count before visiting any page and destroys the parser", async () => {
    const { extractSelectablePdfPages } = await import("@/lib/source/pdf");
    await expect(extractSelectablePdfPages(new Uint8Array([1]))).rejects.toMatchObject({ code: "too_many_pages" });
    expect(pdfMock.getPage).not.toHaveBeenCalled();
    expect(pdfMock.destroy).toHaveBeenCalledOnce();
  });
});
