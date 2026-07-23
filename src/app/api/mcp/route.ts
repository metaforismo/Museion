import { NextResponse } from "next/server";

import { handleMcpRequest, MUSEION_MCP_TOOLS } from "@/lib/mcp/protocol";
import { isSitesRuntime, runtimeValue } from "@/lib/sites/runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function disabledOnPublicSites() {
  return isSitesRuntime() && runtimeValue("MUSEION_MCP_PUBLIC_ENABLED") !== "1";
}

const headers = {
  "Access-Control-Allow-Headers": "authorization, content-type, mcp-protocol-version, x-mcp-client-id",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "no-store",
};

export async function GET() {
  if (disabledOnPublicSites()) return NextResponse.json({ error: "MCP_PRIVATE_BETA", message: "Public MCP access remains disabled until OAuth 2.1 and per-client revocation are available." }, { status: 404 });
  return NextResponse.json({
    name: "museion-course-architect",
    transport: "Streamable HTTP (stateless)",
    endpoint: "/api/mcp",
    tools: MUSEION_MCP_TOOLS.map(({ name, description }) => ({ name, description })),
  }, { headers });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers });
}

export async function POST(request: Request) {
  if (disabledOnPublicSites()) return NextResponse.json({ error: "MCP_PRIVATE_BETA" }, { status: 404, headers });
  const payload = await request.json().catch(() => null);
  const result = await handleMcpRequest(request, payload);
  if (result.body === null) return new Response(null, { status: result.status, headers });
  return NextResponse.json(result.body, { status: result.status, headers });
}
