import type { SourceReferenceKind } from "./contracts";

export function normalizeSourceUrl(value: string): string {
  const url = new URL(value.trim());
  if (url.protocol !== "https:") throw new Error("Source links must use HTTPS.");
  if (url.username || url.password) throw new Error("Source links cannot contain credentials.");
  const sensitiveParameters = ["access_token", "api_key", "apikey", "auth", "key", "signature", "token"];
  if (sensitiveParameters.some((parameter) => url.searchParams.has(parameter))) {
    throw new Error("Remove access tokens or signed credentials from the source link.");
  }
  url.hash = "";
  return url.toString();
}

export function inferSourceReferenceKind(value: string): SourceReferenceKind {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLocaleLowerCase().replace(/^www\./, "");
    if (host === "youtu.be") return "youtube_video";
    if (host === "youtube.com" || host.endsWith(".youtube.com")) {
      if (url.pathname === "/playlist" || url.searchParams.has("list")) return "youtube_playlist";
      return "youtube_video";
    }
    if (/\b(book|books|archive|gutenberg|openstax)\b/i.test(`${host}${url.pathname}`)) return "book";
  } catch {
    // The form reports malformed URLs; inference only supplies a useful default.
  }
  return "webpage";
}
