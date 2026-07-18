import { afterEach, describe, expect, it } from "vitest";

import { handleMcpRequest } from "@/lib/mcp/protocol";

const originalToken = process.env.MUSEION_MCP_TOKEN;

afterEach(() => {
  if (originalToken === undefined) delete process.env.MUSEION_MCP_TOKEN;
  else process.env.MUSEION_MCP_TOKEN = originalToken;
});

function request(authorization?: string) {
  return new Request("http://localhost/api/mcp", { headers: authorization ? { authorization } : {} });
}

describe("Museion MCP protocol", () => {
  it("negotiates stateless MCP and exposes the unified Course Architect tools", async () => {
    const initialized = await handleMcpRequest(request(), { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26" } });
    expect(initialized.status).toBe(200);
    expect(initialized.body).toMatchObject({ result: { protocolVersion: "2025-03-26", serverInfo: { name: "museion-course-architect" } } });

    const listed = await handleMcpRequest(request(), { jsonrpc: "2.0", id: 2, method: "tools/list" });
    expect(listed.body).toMatchObject({ result: { tools: expect.arrayContaining([
      expect.objectContaining({ name: "museion.prepare_source_pack" }),
      expect.objectContaining({ name: "museion.create_course" }),
      expect.objectContaining({ name: "museion.list_originals" }),
    ]) } });
  });

  it("prepares a mixed Source Pack without exposing raw material in structured output", async () => {
    const result = await handleMcpRequest(request(), {
      jsonrpc: "2.0", id: "pack", method: "tools/call",
      params: { name: "museion.prepare_source_pack", arguments: {
        title: "My material",
        materials: [
          { title: "Video notes", content: "Authorized notes about invariants.", role: "notes", reference: { kind: "youtube_playlist", url: "https://youtube.com/playlist?list=PL123", label: "Playlist" } },
          { title: "Book excerpt", content: "An authorized bounded excerpt.", role: "excerpt", reference: { kind: "book", url: "https://example.com/book", label: "Book" } },
        ],
        rights: { confirmed: true, basis: "authorized-excerpt" },
      } },
    });
    const serialized = JSON.stringify(result.body);
    expect(serialized).toContain("materialCount");
    expect(serialized).not.toContain("Authorized notes about invariants");
    expect(serialized).not.toContain("An authorized bounded excerpt");
  });

  it("fails closed before model-backed course creation when no MCP token is configured", async () => {
    delete process.env.MUSEION_MCP_TOKEN;
    const result = await handleMcpRequest(request(), {
      jsonrpc: "2.0", id: 3, method: "tools/call",
      params: { name: "museion.create_course", arguments: {} },
    });
    expect(result.body).toMatchObject({ result: { isError: true } });
    expect(JSON.stringify(result.body)).toContain("MUSEION_MCP_TOKEN");
  });

  it("rejects malformed requests and absorbs oversized invalid inputs without throwing", async () => {
    const malformed = await handleMcpRequest(request(), { jsonrpc: "1.0", id: 4, method: "tools/list" });
    expect(malformed.status).toBe(400);

    const attempts = await Promise.all(Array.from({ length: 50 }, (_, index) => handleMcpRequest(request(), {
      jsonrpc: "2.0", id: index, method: "tools/call",
      params: { name: "museion.prepare_source_pack", arguments: { title: "x", materials: [], rights: { confirmed: true, basis: "personal-notes" } } },
    })));
    expect(attempts.every((attempt) => attempt.status === 200 && JSON.stringify(attempt.body).includes("isError"))).toBe(true);
  });
});
