"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon, Clock01Icon, FlashIcon, SecurityCheckIcon } from "@hugeicons/core-free-icons";

import { sanitizedAiDiagnostics } from "@/lib/client/ai-diagnostics";
import { fetchWithTimeout } from "@/lib/client/fetch-with-timeout";

type AiStatus = {
  enabled: boolean;
  installed: boolean;
  authenticated: boolean;
  codexVersion: string | null;
  provider: "codex" | "offline" | "openai-api";
  familyFallback: boolean;
  models: { compiler: Record<string, string>; tutor: string };
  degradedReason: string | null;
};

type ConnectionAttempt = {
  id: string;
  status: "pending" | "connected" | "failed" | "cancelled" | "expired";
  verificationUrl: string | null;
  userCode: string | null;
  error: string | null;
};

type ModelCheckResult = {
  model: string;
  available: boolean;
  resolvedModel?: string;
  durationMs: number;
  error?: string;
};

type Notice = {
  tone: "info" | "success" | "error";
  text: string;
};

const STAGE_LABELS: Record<string, string> = {
  source_graph: "Source extraction",
  blueprint: "Learning design",
  course_artifact: "Questions and activities",
  critic: "Publication audit",
  repair: "Typed repair",
};

function friendlyError(value: unknown, fallback: string): string {
  const code = typeof value === "string" ? value : "";
  const messages: Record<string, string> = {
    LOCAL_AI_UNAVAILABLE: "Local AI controls are available only on an explicitly enabled loopback runtime.",
    LOCAL_AI_DISABLED: "Local AI is disabled. Enable it on the loopback runtime, then restart Museion.",
    CODEX_NOT_FOUND: "Codex was not found. Install the Codex CLI or the macOS ChatGPT app, then retry.",
    CODEX_NOT_AUTHENTICATED: "Codex needs an authenticated ChatGPT session.",
    API_PROVIDER_REQUIRES_SERVER_CONFIGURATION: "API mode must be configured on the server and cannot be enabled from the browser.",
  };
  return messages[code] ?? (code || fallback);
}

function SettingsSkeleton() {
  return (
    <div role="status" aria-label="Loading AI settings" className="premium-surface overflow-hidden rounded-[var(--radius-card)] border border-white/80">
      <div className="grid animate-pulse gap-0 lg:grid-cols-[1.15fr_.85fr]">
        <div className="space-y-5 p-6 sm:p-8">
          <div className="h-5 w-40 rounded bg-ink/10" />
          <div className="h-9 w-3/4 rounded bg-ink/10" />
          <div className="h-20 rounded-xl bg-ink/5" />
          <div className="h-12 w-52 rounded-lg bg-ink/10" />
        </div>
        <div className="min-h-80 bg-ink/95" />
      </div>
    </div>
  );
}

export default function AiSettingsPanel() {
  const checkController = useRef<AbortController | null>(null);
  const actionLock = useRef<string | null>(null);
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<ConnectionAttempt | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [checkResults, setCheckResults] = useState<ModelCheckResult[] | null>(null);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    const response = signal
      ? await fetch("/api/ai/status", { cache: "no-store", signal })
      : await fetchWithTimeout("/api/ai/status", { cache: "no-store" });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload) throw new Error(friendlyError(payload?.error, "AI settings could not be loaded."));
    setStatus(payload as AiStatus);
    setLoadingError(null);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 10_000);
    void fetch("/api/ai/status", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload) throw new Error(friendlyError(payload?.error, "AI settings could not be loaded."));
        if (!disposed) {
          setStatus(payload as AiStatus);
          setLoadingError(null);
        }
      })
      .catch((error) => {
        if (!disposed) {
          setLoadingError(timedOut
            ? "The local AI runtime did not respond within 10 seconds."
            : error instanceof Error ? error.message : "AI settings could not be loaded.");
        }
      });
    return () => {
      disposed = true;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  const attemptId = attempt?.id;
  const attemptStatus = attempt?.status;

  useEffect(() => {
    if (!attemptId || attemptStatus !== "pending") return;
    const controller = new AbortController();
    let timer: number | undefined;
    const poll = async () => {
      try {
        const response = await fetch(`/api/ai/connect/${attemptId}`, { cache: "no-store", signal: controller.signal });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload) throw new Error("Connection status could not be refreshed.");
        const next = payload as ConnectionAttempt;
        setAttempt(next);
        if (next.status === "connected") {
          setNotice({ tone: "success", text: "ChatGPT connected. Museion can now use your Codex plan quota." });
          await refresh(controller.signal);
          return;
        }
        if (next.status !== "pending") return;
        timer = window.setTimeout(() => void poll(), 1_500);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setNotice({ tone: "error", text: error instanceof Error ? error.message : "Connection status could not be refreshed." });
        timer = window.setTimeout(() => void poll(), 3_000);
      }
    };
    timer = window.setTimeout(() => void poll(), 800);
    return () => {
      controller.abort();
      if (timer) window.clearTimeout(timer);
    };
  }, [attemptId, attemptStatus, refresh]);

  const beginAction = (action: string): boolean => {
    if (actionLock.current || checkController.current) return false;
    actionLock.current = action;
    setBusyAction(action);
    return true;
  };

  const finishAction = () => {
    actionLock.current = null;
    setBusyAction(null);
  };

  const patchSettings = async (body: object, action: string) => {
    if (!beginAction(action)) return;
    setNotice(null);
    try {
      const response = await fetchWithTimeout("/api/ai/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(friendlyError(payload?.error, "Settings could not be updated."));
      setStatus(payload as AiStatus);
      setNotice({ tone: "success", text: "AI mode updated." });
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Settings could not be updated." });
    } finally {
      finishAction();
    }
  };

  const connect = async () => {
    if (!beginAction("connect")) return;
    setNotice(null);
    try {
      const response = await fetchWithTimeout("/api/ai/connect", { method: "POST" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(friendlyError(payload?.error, "Connection could not start."));
      setAttempt(payload as ConnectionAttempt);
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Connection could not start." });
    } finally {
      finishAction();
    }
  };

  const check = async () => {
    if (actionLock.current || checkController.current) return;
    const controller = new AbortController();
    checkController.current = controller;
    setChecking(true);
    setCheckResults(null);
    setNotice({ tone: "info", text: "Checking Luna, Terra and Sol. This uses a small amount of Codex plan quota." });
    try {
      const response = await fetch("/api/ai/check", { method: "POST", signal: controller.signal });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(friendlyError(payload?.error, "Model check failed."));
      setCheckResults(payload.results as ModelCheckResult[]);
      const unavailable = (payload.results as ModelCheckResult[]).filter((result) => !result.available).length;
      setNotice(unavailable === 0
        ? { tone: "success", text: "Capability check finished. Luna, Terra and Sol are available." }
        : { tone: "error", text: `Capability check finished with ${unavailable} unavailable model${unavailable === 1 ? "" : "s"}.` });
    } catch (error) {
      setNotice(error instanceof DOMException && error.name === "AbortError"
        ? { tone: "info", text: "Capability check cancelled." }
        : { tone: "error", text: error instanceof Error ? error.message : "Model check failed." });
    } finally {
      checkController.current = null;
      setChecking(false);
    }
  };

  const cancelConnection = async () => {
    if (!attempt || !beginAction("cancel-connection")) return;
    try {
      const response = await fetchWithTimeout(`/api/ai/connect/${attempt.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("The connection attempt could not be cancelled.");
      setAttempt({ ...attempt, status: "cancelled", error: null });
      setNotice({ tone: "info", text: "Connection attempt cancelled. No Codex session was changed." });
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Cancellation failed." });
    } finally {
      finishAction();
    }
  };

  const copyDeviceCode = async () => {
    if (!attempt?.userCode) return;
    try {
      await navigator.clipboard.writeText(attempt.userCode);
      setNotice({ tone: "success", text: "Device code copied." });
    } catch {
      setNotice({ tone: "error", text: "Copy failed. Select the device code manually." });
    }
  };

  const copyDiagnostics = async () => {
    if (!status) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(sanitizedAiDiagnostics(status), null, 2));
      setNotice({ tone: "success", text: "Sanitized diagnostics copied. No credentials or source content were included." });
    } catch {
      setNotice({ tone: "error", text: "Diagnostics could not be copied. Check browser clipboard permissions and try again." });
    }
  };

  const refreshStatus = async () => {
    if (!beginAction("refresh")) return;
    setNotice(null);
    try {
      await refresh();
      setNotice({ tone: "success", text: "Runtime status refreshed." });
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Refresh failed." });
    } finally {
      finishAction();
    }
  };

  const globallyLogout = async () => {
    if (!beginAction("logout")) return;
    try {
      const response = await fetchWithTimeout("/api/ai/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: "LOG_OUT_CODEX_GLOBALLY" }),
      });
      if (!response.ok) throw new Error("Codex could not be logged out.");
      setNotice({ tone: "success", text: "Codex was logged out on this computer." });
      setConfirmLogout(false);
      await refresh();
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Logout failed." });
    } finally {
      finishAction();
    }
  };

  if (loadingError && !status) {
    return (
      <div role="alert" className="premium-surface rounded-[var(--radius-card)] border border-wrong/20 p-7">
        <p className="eyebrow">Settings unavailable</p>
        <h2 className="mt-3 font-display text-2xl font-semibold">Museion could not read the local AI runtime.</h2>
        <p className="mt-3 max-w-[60ch] text-sm leading-6 text-ink-soft">{loadingError}</p>
        <button type="button" onClick={() => void refresh().catch((error) => setLoadingError(error instanceof Error ? error.message : "Retry failed."))} className="mt-5 rounded-lg bg-ink px-5 py-3 font-semibold text-white transition hover:bg-lapis">Retry status check</button>
      </div>
    );
  }
  if (!status) return <SettingsSkeleton />;

  const connected = status.installed && status.authenticated;
  const liveReady = status.enabled && connected;
  const statusLabel = liveReady ? "Ready" : !status.enabled ? "Local AI disabled" : !status.installed ? "Codex not found" : "Sign-in needed";
  const liveGuidance = liveReady
    ? "Ready to use Luna, Terra and Sol through the authenticated local Codex session."
    : "Complete the readiness steps below before selecting live AI.";
  const readiness = [
    { label: "Local execution enabled", ready: status.enabled, detail: status.enabled ? "Loopback AI controls are available." : "Set MUSEION_LOCAL_AI=1 and restart Museion." },
    { label: "Codex runtime found", ready: status.installed, detail: status.installed ? status.codexVersion ?? "Codex installed" : "Install Codex CLI or the macOS ChatGPT app." },
    { label: "ChatGPT authenticated", ready: status.authenticated, detail: status.authenticated ? "Official Codex authentication is active." : "Complete the official device login below." },
  ];

  return (
    <div className="space-y-7">
      <section aria-labelledby="provider-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="eyebrow">Provider</p><h2 id="provider-heading" className="mt-1.5 text-xl font-semibold tracking-[-0.01em]">Choose the execution path.</h2></div>
          <p className="max-w-md text-xs leading-5 text-ink-soft">The offline replay is always available. Live local AI never falls through to paid API billing.</p>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <article className={`rounded-[var(--radius-card)] border p-5 transition ${status.provider === "codex" ? "border-lapis/40 bg-lapis-soft/60 shadow-[inset_0_0_0_1px_var(--color-lapis)]" : "border-ink/10 bg-surface"}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold-soft text-gold"><HugeiconsIcon icon={FlashIcon} size={18} strokeWidth={1.8} /></span>
                <h3 className="min-w-0 font-semibold">Live AI (your ChatGPT account)</h3>
              </div>
              <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold ${liveReady ? "bg-correct-soft text-correct" : "bg-surface"}`}>{statusLabel}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-ink-soft">Runs through your authenticated local ChatGPT session and consumes plan quota.</p>
            <p id="live-provider-guidance" className={`mt-2 text-xs leading-5 ${liveReady ? "text-correct" : "text-ink-soft"}`}>{liveGuidance}</p>
            <button type="button" aria-describedby="live-provider-guidance" disabled={!liveReady || status.provider === "codex" || Boolean(busyAction) || checking} onClick={() => void patchSettings({ provider: "codex" }, "live")} className="mt-4 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-lapis disabled:cursor-not-allowed disabled:opacity-40">{status.provider === "codex" ? "Active provider" : "Use live AI"}</button>
          </article>
          <article className={`rounded-[var(--radius-card)] border p-5 transition ${status.provider === "offline" ? "border-lapis/40 bg-lapis-soft/60 shadow-[inset_0_0_0_1px_var(--color-lapis)]" : "border-ink/10 bg-surface"}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-correct-soft text-correct"><HugeiconsIcon icon={SecurityCheckIcon} size={18} strokeWidth={1.8} /></span>
                <h3 className="min-w-0 font-semibold">Offline verified guidance</h3>
              </div>
              <span className="shrink-0 rounded-md bg-surface px-2 py-1 text-xs font-semibold">Always available</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-ink-soft">Verified replay and deterministic guidance, with no account, network model call or usage charge.</p>
            <p className="mt-2 text-xs leading-5 text-ink-soft">Selecting this disables Museion’s live provider without signing Codex or other local clients out.</p>
            <button type="button" disabled={status.provider === "offline" || Boolean(busyAction) || checking} onClick={() => void patchSettings({ provider: "offline" }, "offline")} className="mt-4 rounded-lg border border-ink/15 bg-surface px-4 py-2.5 text-sm font-semibold transition hover:border-lapis disabled:cursor-not-allowed disabled:opacity-40">{status.provider === "offline" ? "Active provider" : "Use offline demo"}</button>
          </article>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-ink/15 px-5 py-4 text-sm">
          <div><p className="font-semibold">Live AI (API key)</p><p className="mt-1 text-ink-soft">Future server-configured provider. Browser API keys are intentionally unsupported.</p></div>
          <span className="rounded-md bg-paper px-2 py-1 text-xs font-semibold text-ink-soft">Not configured</span>
        </div>
      </section>

      <section className="premium-surface overflow-hidden rounded-[var(--radius-card)] border border-white/80">
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3"><span className={`h-2.5 w-2.5 rounded-full ${liveReady ? "bg-correct" : "bg-gold"}`} aria-hidden /><p className="text-sm font-semibold">Local runtime</p><span className={`rounded-md px-2 py-1 text-xs font-semibold ${liveReady ? "bg-correct-soft text-correct" : "bg-gold-soft text-ink"}`}>{statusLabel}</span></div>
          <h2 className="mt-5 font-display text-2xl font-semibold tracking-[-0.02em]">Use your ChatGPT plan, locally.</h2>
          <p className="mt-3 max-w-[58ch] leading-7 text-ink-soft">Museion invokes Codex without receiving OAuth credentials. Disconnecting Museion changes its provider only; global logout is a separate action.</p>
          <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2"><div className="rounded-xl bg-paper p-4"><dt className="text-ink-soft">Runtime</dt><dd className="mt-1 font-semibold">{status.installed ? status.codexVersion ?? "Codex installed" : "Not found"}</dd></div><div className="rounded-xl bg-paper p-4"><dt className="text-ink-soft">Active mode</dt><dd className="mt-1 font-semibold">{status.provider === "codex" ? "Live GPT-5.6 family" : "Offline verified guidance"}</dd></div></dl>
          <ol aria-label="Live AI readiness" className="mt-6 divide-y divide-ink/10 border-y border-ink/10">
            {readiness.map((item) => (
              <li key={item.label} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 py-3 text-sm">
                <span aria-hidden="true" className={`mt-0.5 grid h-6 w-6 place-items-center rounded-full ${item.ready ? "bg-correct-soft text-correct" : "bg-gold-soft text-gold"}`}>
                  <HugeiconsIcon icon={item.ready ? CheckmarkCircle02Icon : Clock01Icon} size={14} strokeWidth={2} />
                </span>
                <span>
                  <span className="block font-semibold">{item.label}</span>
                  <span className="mt-0.5 block leading-5 text-ink-soft">{item.detail}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex flex-wrap gap-3">
            {!connected && <button type="button" disabled={busyAction === "connect" || !status.enabled} onClick={() => void connect()} className="rounded-lg bg-ink px-5 py-3 font-semibold text-white transition hover:bg-lapis disabled:opacity-45">{busyAction === "connect" ? "Starting connection…" : "Connect ChatGPT"}</button>}
            {connected && !checking && <button type="button" disabled={Boolean(busyAction) || !status.enabled} onClick={() => void check()} className="rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-lapis disabled:opacity-45">Check models</button>}
            {checking && <button type="button" onClick={() => checkController.current?.abort()} className="rounded-lg border border-wrong/30 px-5 py-3 text-sm font-semibold text-wrong">Cancel model check</button>}
            <button type="button" disabled={Boolean(busyAction) || checking} onClick={() => void refreshStatus()} className="rounded-lg px-3 py-3 text-sm font-semibold text-lapis-dark hover:bg-lapis-soft disabled:cursor-not-allowed disabled:opacity-45">{busyAction === "refresh" ? "Refreshing…" : "Refresh status"}</button>
            <button type="button" disabled={Boolean(busyAction) || checking} onClick={() => void copyDiagnostics()} className="rounded-lg px-3 py-3 text-sm font-semibold text-ink-soft hover:bg-paper hover:text-ink disabled:cursor-not-allowed disabled:opacity-45">Copy diagnostics</button>
          </div>
          {!status.enabled && <p role="alert" className="mt-4 rounded-xl bg-gold-soft p-4 text-sm">Local AI is disabled. Set <code>MUSEION_LOCAL_AI=1</code> and restart Museion to enable connection controls.</p>}
          {notice && (
            <div
              role={notice.tone === "error" ? "alert" : "status"}
              aria-live={notice.tone === "error" ? "assertive" : "polite"}
              className={`mt-4 flex items-start justify-between gap-4 rounded-xl p-4 text-sm ${
                notice.tone === "error"
                  ? "bg-wrong-soft text-wrong"
                  : notice.tone === "success"
                    ? "bg-correct-soft text-correct"
                    : "bg-paper text-ink"
              }`}
            >
              <p>{notice.text}</p>
              <button type="button" onClick={() => setNotice(null)} className="shrink-0 font-semibold underline underline-offset-4">
                Dismiss
              </button>
            </div>
          )}
        </div>
        <details
          className="border-t border-ink/10"
          open={attempt?.status === "pending" || Boolean(attempt && ["failed", "expired", "cancelled"].includes(attempt.status))}
        >
          <summary className="cursor-pointer select-none bg-paper px-6 py-4 text-sm font-semibold text-ink-soft transition hover:text-ink sm:px-8">
            Advanced: models and routing
          </summary>
          {(attempt?.status === "pending" || (attempt && ["failed", "expired", "cancelled"].includes(attempt.status))) && (
            <div className="border-t border-ink/10 bg-paper px-6 py-6 sm:px-8">
              {attempt?.status === "pending" && <div className="rounded-xl border border-lapis/20 bg-lapis-soft p-4"><p className="font-semibold">Finish connecting in your browser</p>{attempt.userCode && <div className="mt-2 flex flex-wrap items-center gap-3"><code className="font-mono text-xl tracking-wider">{attempt.userCode}</code><button type="button" onClick={() => void copyDeviceCode()} className="text-sm font-semibold text-lapis-dark underline">Copy code</button></div>}{attempt.verificationUrl && <a className="mt-3 inline-block font-semibold text-lapis-dark underline" href={attempt.verificationUrl} target="_blank" rel="noreferrer">Open ChatGPT verification</a>}<p className="mt-2 text-sm text-ink-soft">Museion is waiting for the official Codex login flow.</p><button type="button" disabled={busyAction === "cancel-connection"} onClick={() => void cancelConnection()} className="mt-3 text-sm font-semibold text-lapis-dark underline">Cancel connection</button></div>}
              {attempt && ["failed", "expired", "cancelled"].includes(attempt.status) && <div role="alert" className="rounded-xl bg-gold-soft p-4 text-sm"><p className="font-semibold">Connection {attempt.status}</p><p className="mt-1 text-ink-soft">{attempt.error ?? "You can start a new connection attempt when ready."}</p><button type="button" disabled={Boolean(busyAction) || !status.enabled} onClick={() => void connect()} className="mt-3 font-semibold text-lapis-dark underline">Try again</button></div>}
            </div>
          )}
          <aside aria-label="Balanced model routing" className="border-t border-ink/10 bg-ink p-6 text-white sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/55">Balanced routing</p>
            <div className="mt-5 space-y-4">{Object.entries(status.models.compiler).map(([stage, model]) => <div key={stage} className="border-b border-white/10 pb-4"><p className="text-sm text-white/60">{STAGE_LABELS[stage] ?? stage}</p><p className="mt-1 font-mono text-sm font-semibold">{model}</p></div>)}</div>
            <div className="mt-5"><p className="text-sm text-white/60">Maia tutor</p><p className="mt-1 font-mono text-sm font-semibold">{status.models.tutor}</p></div>
            <label className="mt-6 flex items-start gap-3 text-sm leading-6 text-white/75"><input type="checkbox" checked={status.familyFallback} disabled={Boolean(busyAction)} onChange={(event) => void patchSettings({ familyFallback: event.target.checked }, "fallback")} className="mt-1" />Allow visible fallback within GPT-5.6. Sol remains mandatory for publication.</label>
          </aside>
        </details>
      </section>

      {checkResults && (
        <section className="rounded-[var(--radius-card)] bg-surface p-5" aria-labelledby="capability-check-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="capability-check-heading" className="font-display text-xl font-semibold">Capability check</h2>
            <p className="text-xs text-ink-soft">Requested and resolved models are shown separately.</p>
          </div>
          <div className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
            {checkResults.map((result) => (
              <div key={result.model} className="grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,.7fr)] sm:items-center">
                <div>
                  <p className="font-mono text-sm font-semibold">{result.model}</p>
                  {result.resolvedModel && <p className="mt-1 font-mono text-xs text-ink-soft">Resolved: {result.resolvedModel}</p>}
                </div>
                <p className={`text-sm font-medium sm:text-right ${result.available ? "text-correct" : "text-wrong"}`}>
                  {result.available ? `Available · ${result.durationMs.toLocaleString()} ms` : friendlyError(result.error, "Unavailable")}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {liveReady && <section className="rounded-[var(--radius-card)] border border-wrong/20 p-5"><h2 className="font-semibold">Global Codex session</h2><p className="mt-2 max-w-[64ch] text-sm leading-6 text-ink-soft">Normally, choose Offline Demo above. Global logout also signs the Codex CLI and other local clients out of this account.</p>{!confirmLogout ? <button type="button" disabled={Boolean(busyAction)} onClick={() => setConfirmLogout(true)} className="mt-4 text-sm font-semibold text-wrong underline">Review global logout</button> : <div role="group" aria-label="Confirm global logout" className="mt-4 rounded-xl bg-wrong-soft p-4"><p className="text-sm font-semibold text-wrong">Log out every local Codex client on this computer?</p><div className="mt-3 flex flex-wrap gap-3"><button type="button" disabled={busyAction === "logout"} onClick={() => void globallyLogout()} className="rounded-lg bg-wrong px-4 py-2 text-sm font-semibold text-white">{busyAction === "logout" ? "Logging out…" : "Confirm global logout"}</button><button type="button" disabled={busyAction === "logout"} onClick={() => setConfirmLogout(false)} className="rounded-lg border border-ink/15 bg-surface px-4 py-2 text-sm font-semibold">Keep session</button></div></div>}</section>}
    </div>
  );
}
