import { NextRequest, NextResponse } from "next/server";
import { savedLearningPreferences } from "./learner-settings";
import { sameOriginRequest } from "./request-origin";
import { authenticateAccount, AuthInputSchema, authAttemptAllowed, authCookieOptions, AUTH_COOKIE, createAuthSession, revokeAuthSession, safeReturnTo, type AuthAccount } from "./auth";
import { beginSignupVerification } from "./auth-verification";

export async function accountSessionResponse(request: NextRequest, account: AuthAccount, next: string) {
  await revokeAuthSession(request.cookies.get(AUTH_COOKIE)?.value);
  const token = await createAuthSession(account.id);
  const response = NextResponse.json({ preferences: await savedLearningPreferences(account.id), account: { id: account.id, displayName: account.displayName }, next }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(AUTH_COOKIE, token, authCookieOptions());
  response.cookies.delete("museion-preferences");
  response.cookies.delete("museion-learner");
  return response;
}

export async function handleAuthRequest(request: NextRequest, mode: "login" | "signup") {
  if (!sameOriginRequest(request)) return NextResponse.json({ error: "Please submit this form from Museion." }, { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > 4096) return NextResponse.json({ error: "This form is too large." }, { status: 413 });
  const parsed = AuthInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || (mode === "signup" && !parsed.data.displayName)) return NextResponse.json({ error: parsed.success ? "Enter your name." : (parsed.error.issues[0]?.message ?? "Check your details.") }, { status: 400 });
  const { email, password, displayName, next } = parsed.data;
  if (!await authAttemptAllowed(email)) return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429, headers: { "Retry-After": "900" } });
  try {
    if (mode === "signup") return NextResponse.json(await beginSignupVerification({ email, password, displayName: displayName!, next }), { status: 202, headers: { "Cache-Control": "no-store" } });
    const account = await authenticateAccount(email, password);
    if (!account) return NextResponse.json({ error: "The email or password doesn't match. Try again." }, { status: 401 });
    return accountSessionResponse(request, account, safeReturnTo(next));
  } catch (error) {
    if (error instanceof Error && error.message === "ACCOUNT_EXISTS") return NextResponse.json({ error: "This email already has an account. Sign in to continue." }, { status: 409 });
    console.error("Museion authentication storage failed", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ error: "We couldn't save your session. Please try again." }, { status: 503 });
  }
}
