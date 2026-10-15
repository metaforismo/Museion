import { NextRequest, NextResponse } from "next/server";
import { accountForSession, AUTH_COOKIE } from "@/lib/server/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const account = await accountForSession(request.cookies.get(AUTH_COOKIE)?.value);
  return NextResponse.json({ actor: account ? { kind: "account", displayName: account.displayName } : { kind: "guest", displayName: null } }, { headers: { "Cache-Control": "no-store" } });
}
