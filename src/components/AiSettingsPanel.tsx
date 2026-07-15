"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
    <div role="status" aria-label="Loading AI settings" className="premium-surface overflow-hidden rounded-[1.8rem] border border-white/80">
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
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<ConnectionAttempt | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [checkResults, setCheckResults] = useState<ModelCheckResult[] | null>(null);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    const response = await fetch("/api/ai/status", { cache: "no-store", signal });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload) throw new Error(friendlyError(payload?.error, "AI settings could not be loaded."));
    setStatus(payload as AiStatus);
    setLoadingError(null);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;
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
        if (!disposed && !(error instanceof DOMException && error.name === "AbortError")) {
          setLoadingError(error instanceof Error ? error.message : "AI settings could not be loaded.");
        }
      });
    return () => {
      disposed = true;
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
          setNotice("ChatGPT connected. Museion can now use your Codex plan quota.");
          await refresh(controller.signal);
          return;
        }
        if (next.status !== "pending") return;
        timer = window.setTimeout(() => void poll(), 1_500);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setNotice(error instanceof Error ? error.message : "Connection status could not be refreshed.");
        timer = window.setTimeout(() => void poll(), 3_000);
      }
    };
    timer = window.setTimeout(() => void poll(), 800);
    return () => {
      controller.abort();
      if (timer) window.clearTimeout(timer);
    };
  }, [attemptId, attemptStatus, refresh]);

  const patchSettings = async (body: object, action: string) => {
    setBusyAction(action);
    setNotice(null);
    try {
      const response = await fetch("/api/ai/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(friendlyError(payload?.error, "Settings could not be updated."));
      setStatus(payload as AiStatus);
      setNotice("AI mode updated.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Settings could not be updated.");
    } finally {
      setBusyAction(null);
    }
  };

  const connect = async () => {
    setBusyAction("connect");
    setNotice(null);
    try {
      const response = await fetch("/api/ai/connect", { method: "POST" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(friendlyError(payload?.error, "Connection could not start."));
      setAttempt(payload as ConnectionAttempt);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Connection could not start.");
    } finally {
      setBusyAction(null);
    }
  };

  const check = async () => {
    const controller = new AbortController();
    checkController.current = controller;
    setChecking(true);
    setCheckResults(null);
    setNotice("Checking Luna, Terra and Sol. This uses a small amount of Codex plan quota.");
    try {
      const response = await fetch("/api/ai/check", { method: "POST", signal: controller.signal });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(friendlyError(payload?.error, "Model check failed."));
      setCheckResults(payload.results as ModelCheckResult[]);
      setNotice("Capability check finished.");
    } catch (error) {
      setNotice(error instanceof DOMException && error.name === "AbortError" ? "Capability check cancelled." : error instanceof Error ? error.message : "Model check failed.");
    } finally {
      checkController.current = null;
      setChecking(false);
    }
  };

  const cancelConnection = async () => {
    if (!attempt) return;
    setBusyAction("cancel-connection");
    try {
      const response = await fetch(`/api/ai/connect/${attempt.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("The connection attempt could not be cancelled.");
      setAttempt({ ...attempt, status: "cancelled", error: null });
      setNotice("Connection attempt cancelled. No Codex session was changed.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Cancellation failed.");
    } finally {
      setBusyAction(null);
    }
  };

  const copyDeviceCode = async () => {
    if (!attempt?.userCode) return;
    try {
      await navigator.clipboard.writeText(attempt.userCode);
      setNotice("Device code copied.");
    } catch {
      setNotice("Copy failed. Select the device code manually.");
    }
  };

  const globallyLogout = async () => {
    setBusyAction("logout");
    try {
      const response = await fetch("/api/ai/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: "LOG_OUT_CODEX_GLOBALLY" }),
      });
      if (!response.ok) throw new Error("Codex could not be logged out.");
      setNotice("Codex was logged out on this computer.");
      setConfirmLogout(false);
      await refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Logout failed.");
    } finally {
      setBusyAction(null);
    }
  };

  if (loadingError && !status) {
    return (
      <div role="alert" className="premium-surface rounded-[1.6rem] border border-wrong/20 p-7">
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

  return (
    <div className="space-y-7">
      <section aria-labelledby="provider-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="eyebrow">Provider</p><h2 id="provider-heading" className="mt-2 font-display text-3xl font-semibold">Choose the execution path.</h2></div>
          <p className="max-w-md text-sm leading-6 text-ink-soft">The offline replay is always available. Live local AI never falls through to paid API billing.</p>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <article className={`rounded-[1.4rem] border p-5 transition ${status.provider === "codex" ? "border-lapis bg-lapis-soft" : "border-ink/10 bg-surface"}`}>
            <div className="flex items-center justify-between gap-3"><h3 className="font-semibold">ChatGPT via Codex</h3><span className="rounded-md bg-surface px-2 py-1 text-xs font-semibold">{statusLabel}</span></div>
            <p className="mt-2 text-sm leading-6 text-ink-soft">Luna, Terra and Sol run through the official local Codex session and consume plan quota.</p>
            <button type="button" disabled={!liveReady || status.provider === "codex" || Boolean(busyAction)} onClick={() => void patchSettings({ provider: "codex" }, "live")} className="mt-4 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-lapis disabled:opacity-40">{status.provider === "codex" ? "Active provider" : "Use live AI"}</button>
          </article>
          <article className={`rounded-[1.4rem] border p-5 transition ${status.provider === "offline" ? "border-lapis bg-lapis-soft" : "border-ink/10 bg-surface"}`}>
            <div className="flex items-center justify-between gap-3"><h3 className="font-semibold">Offline Demo</h3><span className="rounded-md bg-surface px-2 py-1 text-xs font-semibold">Always available</span></div>
            <p className="mt-2 text-sm leading-6 text-ink-soft">Verified replay and deterministic guidance, with no account, network model call or usage charge.</p>
            <button type="button" disabled={status.provider === "offline" || Boolean(busyAction)} onClick={() => void patchSettings({ provider: "offline" }, "offline")} className="mt-4 rounded-lg border border-ink/15 bg-surface px-4 py-2.5 text-sm font-semibold transition hover:border-lapis disabled:opacity-40">{status.provider === "offline" ? "Active provider" : "Use offline demo"}</button>
          </article>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-ink/15 px-5 py-4 text-sm">
          <div><p className="font-semibold">OpenAI API</p><p className="mt-1 text-ink-soft">Future server-configured provider. Browser API keys are intentionally unsupported.</p></div>
          <span className="rounded-md bg-paper px-2 py-1 text-xs font-semibold text-ink-soft">Not configured</span>
        </div>
      </section>

      <section className="premium-surface overflow-hidden rounded-[1.8rem] border border-white/80">
        <div className="grid lg:grid-cols-[1.15fr_.85fr]">
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3"><span className={`h-2.5 w-2.5 rounded-full ${liveReady ? "bg-correct" : "bg-gold"}`} aria-hidden /><p className="text-sm font-semibold">Local runtime</p><span className={`rounded-md px-2 py-1 text-xs font-semibold ${liveReady ? "bg-correct-soft text-correct" : "bg-gold-soft text-ink"}`}>{statusLabel}</span></div>
            <h2 className="mt-5 font-display text-3xl font-semibold tracking-[-0.03em]">Use your ChatGPT plan, locally.</h2>
            <p className="mt-3 max-w-[58ch] leading-7 text-ink-soft">Museion invokes Codex without receiving OAuth credentials. Disconnecting Museion changes its provider only; global logout is a separate action.</p>
            <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2"><div className="rounded-xl bg-paper p-4"><dt className="text-ink-soft">Runtime</dt><dd className="mt-1 font-semibold">{status.installed ? status.codexVersion ?? "Codex installed" : "Not found"}</dd></div><div className="rounded-xl bg-paper p-4"><dt className="text-ink-soft">Active mode</dt><dd className="mt-1 font-semibold">{status.provider === "codex" ? "Live GPT-5.6 family" : "Offline verified guidance"}</dd></div></dl>
            <div className="mt-6 flex flex-wrap gap-3">
              {!connected && <button type="button" disabled={busyAction === "connect" || !status.enabled} onClick={() => void connect()} className="rounded-lg bg-ink px-5 py-3 font-semibold text-white transition hover:bg-lapis disabled:opacity-45">{busyAction === "connect" ? "Starting connection…" : "Connect ChatGPT"}</button>}
              {connected && !checking && <button type="button" disabled={Boolean(busyAction) || !status.enabled} onClick={() => void check()} className="rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-lapis disabled:opacity-45">Check models</button>}
              {checking && <button type="button" onClick={() => checkController.current?.abort()} className="rounded-lg border border-wrong/30 px-5 py-3 text-sm font-semibold text-wrong">Cancel model check</button>}
              <button type="button" disabled={Boolean(busyAction)} onClick={() => void refresh().catch((error) => setNotice(error instanceof Error ? error.message : "Refresh failed."))} className="rounded-lg px-3 py-3 text-sm font-semibold text-lapis-dark hover:bg-lapis-soft disabled:opacity-45">Refresh status</button>
            </div>
            {!status.enabled && <p role="alert" className="mt-4 rounded-xl bg-gold-soft p-4 text-sm">Local AI is disabled. Set <code>MUSEION_LOCAL_AI=1</code> and restart Museion to enable connection controls.</p>}
            {attempt?.status === "pending" && <div className="mt-5 rounded-xl border border-lapis/20 bg-lapis-soft p-4"><p className="font-semibold">Finish connecting in your browser</p>{attempt.userCode && <div className="mt-2 flex flex-wrap items-center gap-3"><code className="font-mono text-xl tracking-wider">{attempt.userCode}</code><button type="button" onClick={() => void copyDeviceCode()} className="text-sm font-semibold text-lapis-dark underline">Copy code</button></div>}{attempt.verificationUrl && <a className="mt-3 inline-block font-semibold text-lapis-dark underline" href={attempt.verificationUrl} target="_blank" rel="noreferrer">Open ChatGPT verification</a>}<p className="mt-2 text-sm text-ink-soft">Museion is waiting for the official Codex login flow.</p><button type="button" disabled={busyAction === "cancel-connection"} onClick={() => void cancelConnection()} className="mt-3 text-sm font-semibold text-lapis-dark underline">Cancel connection</button></div>}
            {attempt && ["failed", "expired", "cancelled"].includes(attempt.status) && <div role="alert" className="mt-5 rounded-xl bg-gold-soft p-4 text-sm"><p className="font-semibold">Connection {attempt.status}</p><p className="mt-1 text-ink-soft">{attempt.error ?? "You can start a new connection attempt when ready."}</p><button type="button" disabled={Boolean(busyAction) || !status.enabled} onClick={() => void connect()} className="mt-3 font-semibold text-lapis-dark underline">Try again</button></div>}
            {notice && <p role="status" aria-live="polite" className="mt-4 rounded-xl bg-paper p-4 text-sm">{notice}</p>}
          </div>
          <aside aria-label="Balanced model routing" className="bg-ink p-6 text-white sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/55">Balanced routing</p>
            <div className="mt-5 space-y-4">{Object.entries(status.models.compiler).map(([stage, model]) => <div key={stage} className="border-b border-white/10 pb-4"><p className="text-sm text-white/60">{STAGE_LABELS[stage] ?? stage}</p><p className="mt-1 font-mono text-sm font-semibold">{model}</p></div>)}</div>
            <div className="mt-5"><p className="text-sm text-white/60">Maia tutor</p><p className="mt-1 font-mono text-sm font-semibold">{status.models.tutor}</p></div>
            <label className="mt-6 flex items-start gap-3 text-sm leading-6 text-white/75"><input type="checkbox" checked={status.familyFallback} disabled={Boolean(busyAction)} onChange={(event) => void patchSettings({ familyFallback: event.target.checked }, "fallback")} className="mt-1" />Allow visible fallback within GPT-5.6. Sol remains mandatory for publication.</label>
          </aside>
        </div>
      </section>

      {checkResults && <section className="rounded-[1.4rem] bg-surface p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-xl font-semibold">Capability check</h2><p className="text-xs text-ink-soft">Requested and resolved models are shown separately.</p></div><div className="mt-4 grid gap-3 sm:grid-cols-3">{checkResults.map((result) => <div key={result.model} className={`rounded-xl p-4 ${result.available ? "bg-correct-soft" : "bg-wrong-soft"}`}><p className="font-mono text-sm font-semibold">{result.model}</p><p className="mt-1 text-sm">{result.available ? `Available · ${result.durationMs.toLocaleString()} ms` : friendlyError(result.error, "Unavailable")}</p>{result.resolvedModel && <p className="mt-1 font-mono text-xs text-ink-soft">Resolved: {result.resolvedModel}</p>}</div>)}</div></section>}

      {liveReady && <section className="rounded-[1.4rem] border border-wrong/20 p-5"><h2 className="font-semibold">Global Codex session</h2><p className="mt-2 max-w-[64ch] text-sm leading-6 text-ink-soft">Normally, choose Offline Demo above. Global logout also signs the Codex CLI and other local clients out of this account.</p>{!confirmLogout ? <button type="button" disabled={Boolean(busyAction)} onClick={() => setConfirmLogout(true)} className="mt-4 text-sm font-semibold text-wrong underline">Review global logout</button> : <div role="group" aria-label="Confirm global logout" className="mt-4 rounded-xl bg-wrong-soft p-4"><p className="text-sm font-semibold text-wrong">Log out every local Codex client on this computer?</p><div className="mt-3 flex flex-wrap gap-3"><button type="button" disabled={busyAction === "logout"} onClick={() => void globallyLogout()} className="rounded-lg bg-wrong px-4 py-2 text-sm font-semibold text-white">{busyAction === "logout" ? "Logging out…" : "Confirm global logout"}</button><button type="button" disabled={busyAction === "logout"} onClick={() => setConfirmLogout(false)} className="rounded-lg border border-ink/15 bg-surface px-4 py-2 text-sm font-semibold">Keep session</button></div></div>}</section>}
    </div>
  );
}
