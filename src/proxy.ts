import { NextRequest, NextResponse } from "next/server";
import { accountForSession, AUTH_COOKIE } from "@/lib/server/auth";
import { sameOriginRequest } from "@/lib/server/request-origin";
import { PUBLIC_PAGE_PATHS, AUTH_PAGE_PATHS } from "@/lib/site/public-routes";

const publicPages = new Set(PUBLIC_PAGE_PATHS);
const authPages = new Set(AUTH_PAGE_PATHS);
const publicAuth = new Set(["/api/auth/login", "/api/auth/signup", "/api/auth/verify", "/api/auth/resend", "/api/auth/logout", "/api/auth/session"]);
const staticFiles = new Set(["/favicon.ico", "/icon.svg", "/og.png", "/manifest.webmanifest", "/robots.txt", "/sitemap.xml", "/llms.txt"]);

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === "/judge" || path.startsWith("/judge/") || path === "/api/judge" || path.startsWith("/api/judge/")) return new NextResponse(null, { status: 404 });
  if (path === "/signin-with-chatgpt") return NextResponse.redirect(new URL("/login", request.url));
  if (path === "/signout-with-chatgpt") return NextResponse.redirect(new URL("/account", request.url));
  if (staticFiles.has(path) || ["/_next/", "/brand/", "/landing/", "/images/", "/fonts/", "/videos/"].some((prefix) => path.startsWith(prefix))) return NextResponse.next();
  if (path.startsWith("/api/") && !["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    if (!sameOriginRequest(request)) return NextResponse.json({ error: "Please submit this request from Museion." }, { status: 403 });
  }
  if (publicPages.has(path) || publicAuth.has(path)) {
    const response = NextResponse.next();
    if (authPages.has(path) || publicAuth.has(path)) {
      response.headers.set("X-Robots-Tag", "noindex, nofollow");
      response.headers.set("Cache-Control", "private, no-store");
    }
    return response;
  }
  const account = await accountForSession(request.cookies.get(AUTH_COOKIE)?.value);
  if (!account) {
    if (path.startsWith("/api/")) return NextResponse.json({ error: "SIGN_IN_REQUIRED", signIn: "/login" }, { status: 401, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });
    const login = new URL("/login", request.url);
    login.searchParams.set("next", path + request.nextUrl.search);
    const response = NextResponse.redirect(login);
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image).*)"] };
