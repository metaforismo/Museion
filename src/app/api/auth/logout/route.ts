import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, authCookieOptions, revokeAuthSession } from "@/lib/server/auth";
import { sameOriginRequest } from "@/lib/server/request-origin";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  if (!sameOriginRequest(request)) return NextResponse.json({ error: "Please sign out from Museion." }, { status: 403 });
  await revokeAuthSession(request.cookies.get(AUTH_COOKIE)?.value);
  const response = NextResponse.json({ next: "/" });
  response.cookies.set(AUTH_COOKIE, "", { ...authCookieOptions(), maxAge: 0 });
  response.cookies.delete("museion-preferences");
  return response;
}
