/** Next dev normalizes nextUrl to localhost, so compare the browser origin to
 * the actual Host header. Forwarded host headers never establish authority. */
export function sameOriginRequest(request: Request): boolean {
  const incoming = request.headers.get("origin");
  const host = request.headers.get("host") ?? new URL(request.url).host;
  if (!incoming || request.headers.get("sec-fetch-site") === "cross-site") return false;
  try {
    const origin = new URL(incoming);
    if (origin.host.toLowerCase() !== host.toLowerCase() || origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash) return false;
    const configured = process.env.NEXT_PUBLIC_SITE_URL;
    const expectedProtocol = process.env.NODE_ENV === "production" && configured ? new URL(configured).protocol : new URL(request.url).protocol;
    return origin.protocol === expectedProtocol && ["http:", "https:"].includes(origin.protocol);
  } catch { return false; }
}
