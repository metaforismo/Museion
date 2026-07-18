import { NextResponse } from "next/server";

import { handleMcpRequest, MUSEION_MCP_TOOLS } from "@/lib/mcp/protocol";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const headers = {
  "Access-Control-Allow-Headers": "authorization, content-type, mcp-protocol-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "no-store",
};

export async function GET() {
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
  const payload = await request.json().catch(() => null);
  const result = await handleMcpRequest(request, payload);
  if (result.body === null) return new Response(null, { status: result.status, headers });
  return NextResponse.json(result.body, { status: result.status, headers });
}
