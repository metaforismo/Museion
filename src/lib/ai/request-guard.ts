import { localAiEnabled } from "./codex-runtime";

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

export function localAiRequestAllowed(request: Request): boolean {
  if (!localAiEnabled()) return false;
  const url = new URL(request.url);
  if (!LOOPBACK_HOSTS.has(url.hostname)) return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === url.host;
  } catch {
    return false;
  }
}
