import { localAiEnabled } from "./codex-runtime";
import { openRouterConfigured } from "../maia/openrouter-provider";

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

export function localAiRequestAllowed(request: Request): boolean {
  if (!localAiEnabled()) return false;
  return loopbackRequestAllowed(request);
}

/** Tutor settings may also be changed on an explicitly configured free-router
 * runtime. This does not enable Codex login/logout or paid model checks. */
export function localAiSettingsRequestAllowed(request: Request): boolean {
  if (!localAiEnabled() && !openRouterConfigured()) return false;
  return loopbackRequestAllowed(request);
}

function loopbackRequestAllowed(request: Request): boolean {
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
