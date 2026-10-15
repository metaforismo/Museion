import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifySignupCode } from "@/lib/server/auth-verification";
import { accountSessionResponse } from "@/lib/server/auth-handler";
import { sameOriginRequest } from "@/lib/server/request-origin";
export const runtime = "nodejs";
const VerifySchema = z.object({ challengeId: z.string().uuid(), code: z.string().regex(/^\d{6}$/) }).strict();
export async function POST(request: NextRequest) {
  if (!sameOriginRequest(request)) return NextResponse.json({ error: "Please verify your code from Museion." }, { status: 403 });
  const parsed = VerifySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter the six-digit verification code." }, { status: 400 });
  try {
    const result = await verifySignupCode(parsed.data.challengeId, parsed.data.code);
    if (!result) return NextResponse.json({ error: "That code couldn't be verified. Check the code, or restart signup if it expired. If you already have an account, sign in." }, { status: 400 });
    const destination = result.next === "/dashboard" ? "/welcome" : `/welcome?next=${encodeURIComponent(result.next)}`;
    return accountSessionResponse(request, result.account, destination);
  } catch { return NextResponse.json({ error: "We couldn't verify your account. Please try again." }, { status: 503 }); }
}
