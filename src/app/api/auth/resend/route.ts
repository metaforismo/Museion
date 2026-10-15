import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resendSignupCode } from "@/lib/server/auth-verification";
import { sameOriginRequest } from "@/lib/server/request-origin";
export const runtime = "nodejs";
const ResendSchema = z.object({ challengeId: z.string().uuid() }).strict();
export async function POST(request: NextRequest) {
  if (!sameOriginRequest(request)) return NextResponse.json({ error: "Please request your code from Museion." }, { status: 403 });
  const parsed = ResendSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please restart signup to request a new code." }, { status: 400 });
  try {
    const result = await resendSignupCode(parsed.data.challengeId);
    if (!result) return NextResponse.json({ error: "Please restart signup to request a new code." }, { status: 400 });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "VERIFICATION_RESEND_WAIT") return NextResponse.json({ error: "Please wait a minute before requesting another code." }, { status: 429, headers: { "Retry-After": "60" } });
    return NextResponse.json({ error: "The verification message couldn't be delivered. Please try again." }, { status: 503 });
  }
}
