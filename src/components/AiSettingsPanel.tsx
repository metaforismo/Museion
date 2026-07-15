"use client";

import { useCallback, useEffect, useState } from "react";

type AiStatus = {
  enabled: boolean;
  installed: boolean;
  authenticated: boolean;
  codexVersion: string | null;
  provider: "codex" | "offline" | "openai-api";
  familyFallback: boolean;
  models: {
    compiler: Record<string, string>;
    tutor: string;
  };
  degradedReason: string | null;
};

type ConnectionAttempt = {
  id: string;
  status: "pending" | "connected" | "failed" | "cancelled" | "expired";
  verificationUrl: string | null;
  userCode: string | null;
  error: string | null;
};

const STAGE_LABELS: Record<string, string> = {
  source_graph: "Source extraction",
  blueprint: "Learning design",
  course_artifact: "Questions and activities",
  critic: "Publication audit",
  repair: "Typed repair",
};

export default function AiSettingsPanel() {
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [attempt, setAttempt] = useState<ConnectionAttempt | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checkResults, setCheckResults] = useState<Array<{ model: string; available: boolean; durationMs: number }> | null>(null);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/ai/status", { cache: "no-store" });
    if (response.ok) setStatus(await response.json() as AiStatus);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/ai/status", { cache: "no-store" }).then(async (response) => {
      if (response.ok && !cancelled) setStatus(await response.json() as AiStatus);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!attempt || attempt.status !== "pending") return;
    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/ai/connect/${attempt.id}`, { cache: "no-store" });
      if (!response.ok) return;
      const next = await response.json() as ConnectionAttempt;
      setAttempt(next);
      if (next.status === "connected") {
        setNotice("ChatGPT connected. Museion can now use your Codex plan quota.");
        void refresh();
      }
    }, 1_500);
    return () => window.clearInterval(timer);
  }, [attempt, refresh]);

  const patchSettings = async (body: object) => {
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch("/api/ai/status", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? "Settings could not be updated.");
      await refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Settings could not be updated.");
    } finally { setBusy(false); }
  };

  const connect = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch("/api/ai/connect", { method: "POST" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? "Connection could not start.");
      setAttempt(payload as ConnectionAttempt);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Connection could not start.");
    } finally { setBusy(false); }
  };

  const check = async () => {
    setBusy(true);
    setNotice("Checking Luna, Terra and Sol. This uses a small amount of Codex plan quota.");
    try {
      const response = await fetch("/api/ai/check", { method: "POST" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? "Model check failed.");
      setCheckResults(payload.results);
      setNotice("Capability check finished.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Model check failed.");
    } finally { setBusy(false); }
  };

  const cancelConnection = async () => {
    if (!attempt) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/ai/connect/${attempt.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("The connection attempt could not be cancelled.");
      setAttempt({ ...attempt, status: "cancelled", error: null });
      setNotice("Connection attempt cancelled. No Codex session was changed.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Cancellation failed.");
    } finally { setBusy(false); }
  };

  const globallyLogout = async () => {
    if (!window.confirm("Log out of Codex globally? This also affects the Codex CLI and other local Codex clients.")) return;
    setBusy(true);
    try {
      const response = await fetch("/api/ai/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmation: "LOG_OUT_CODEX_GLOBALLY" }) });
      if (!response.ok) throw new Error("Codex could not be logged out.");
      setNotice("Codex was logged out on this computer.");
      await refresh();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Logout failed."); }
    finally { setBusy(false); }
  };

  if (!status) return <div role="status" className="premium-surface min-h-64 animate-pulse rounded-[1.6rem] bg-surface/70" aria-label="Loading AI settings" />;

  const connected = status.enabled && status.installed && status.authenticated;
  return <div className="space-y-6">
    <section className="premium-surface overflow-hidden rounded-[1.8rem] border border-white/80">
      <div className="grid lg:grid-cols-[1.15fr_.85fr]">
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`h-2.5 w-2.5 rounded-full ${connected ? "bg-correct" : "bg-gold"}`} aria-hidden />
            <p className="text-sm font-semibold">ChatGPT via Codex</p>
            <span className={`rounded-md px-2 py-1 text-xs font-semibold ${connected ? "bg-correct-soft text-correct" : "bg-gold-soft text-ink"}`}>{connected ? "Connected" : "Setup needed"}</span>
          </div>
          <h2 className="mt-5 font-display text-3xl font-semibold tracking-[-0.03em]">Use your ChatGPT plan, locally.</h2>
          <p className="mt-3 max-w-[58ch] leading-7 text-ink-soft">Museion asks the official Codex runtime to run GPT-5.6 models. It never receives your OAuth token. This uses plan quota, but it does not silently create API charges.</p>
          <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-xl bg-paper p-4"><dt className="text-ink-soft">Runtime</dt><dd className="mt-1 font-semibold">{status.installed ? status.codexVersion ?? "Codex installed" : "Not found"}</dd></div>
            <div className="rounded-xl bg-paper p-4"><dt className="text-ink-soft">Active mode</dt><dd className="mt-1 font-semibold">{status.provider === "codex" ? "Live GPT-5.6 family" : "Offline verified guidance"}</dd></div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-3">
            {!connected && <button type="button" disabled={busy || !status.enabled} onClick={() => void connect()} className="rounded-lg bg-ink px-5 py-3 font-semibold text-white transition hover:bg-lapis disabled:opacity-45">Connect ChatGPT</button>}
            {connected && status.provider !== "codex" && <button type="button" disabled={busy} onClick={() => void patchSettings({ provider: "codex" })} className="rounded-lg bg-ink px-5 py-3 font-semibold text-white">Use live AI</button>}
            <button type="button" disabled={busy} onClick={() => void patchSettings({ provider: "offline" })} className="rounded-lg border border-ink/15 px-5 py-3 font-semibold transition hover:border-lapis">Use offline demo</button>
            {connected && <button type="button" disabled={busy} onClick={() => void check()} className="rounded-lg px-3 py-3 text-sm font-semibold text-lapis-dark hover:bg-lapis-soft">Check models</button>}
          </div>
          {!status.enabled && <p role="alert" className="mt-4 rounded-xl bg-gold-soft p-4 text-sm">Local AI is disabled. Set <code>MUSEION_LOCAL_AI=1</code> and restart Museion to enable connection controls.</p>}
          {attempt?.status === "pending" && <div className="mt-5 rounded-xl border border-lapis/20 bg-lapis-soft p-4"><p className="font-semibold">Finish connecting in your browser</p>{attempt.userCode && <p className="mt-2 font-mono text-xl tracking-wider">{attempt.userCode}</p>}{attempt.verificationUrl && <a className="mt-3 inline-block font-semibold text-lapis-dark underline" href={attempt.verificationUrl} target="_blank" rel="noreferrer">Open ChatGPT verification</a>}<p className="mt-2 text-sm text-ink-soft">Museion is waiting for the official Codex login flow.</p><button type="button" disabled={busy} onClick={() => void cancelConnection()} className="mt-3 text-sm font-semibold text-lapis-dark underline">Cancel connection</button></div>}
          {attempt && ["failed", "expired", "cancelled"].includes(attempt.status) && <div role="alert" className="mt-5 rounded-xl bg-gold-soft p-4 text-sm"><p className="font-semibold">Connection {attempt.status}</p><p className="mt-1 text-ink-soft">{attempt.error ?? "You can start a new connection attempt when ready."}</p><button type="button" disabled={busy || !status.enabled} onClick={() => void connect()} className="mt-3 font-semibold text-lapis-dark underline">Try again</button></div>}
          {notice && <p role="status" aria-live="polite" className="mt-4 rounded-xl bg-paper p-4 text-sm">{notice}</p>}
        </div>
        <div className="bg-ink p-6 text-white sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/55">Balanced routing</p>
          <div className="mt-5 space-y-4">{Object.entries(status.models.compiler).map(([stage, model]) => <div key={stage} className="border-b border-white/10 pb-4"><p className="text-sm text-white/60">{STAGE_LABELS[stage] ?? stage}</p><p className="mt-1 font-mono text-sm font-semibold">{model}</p></div>)}</div>
          <div className="mt-5"><p className="text-sm text-white/60">Maia tutor</p><p className="mt-1 font-mono text-sm font-semibold">{status.models.tutor}</p></div>
          <label className="mt-6 flex items-start gap-3 text-sm leading-6 text-white/75"><input type="checkbox" checked={status.familyFallback} onChange={(event) => void patchSettings({ familyFallback: event.target.checked })} className="mt-1" />Allow visible fallback within the GPT-5.6 family when a lower tier is unavailable.</label>
        </div>
      </div>
    </section>
    {checkResults && <section className="rounded-[1.4rem] bg-surface p-5"><h2 className="font-display text-xl font-semibold">Capability check</h2><div className="mt-4 grid gap-3 sm:grid-cols-3">{checkResults.map((result) => <div key={result.model} className={`rounded-xl p-4 ${result.available ? "bg-correct-soft" : "bg-wrong-soft"}`}><p className="font-mono text-sm font-semibold">{result.model}</p><p className="mt-1 text-sm">{result.available ? `Available · ${result.durationMs} ms` : "Unavailable"}</p></div>)}</div></section>}
    {connected && <section className="rounded-[1.4rem] border border-wrong/20 p-5"><h2 className="font-semibold">Global Codex session</h2><p className="mt-2 max-w-[64ch] text-sm leading-6 text-ink-soft">Normally, choose Offline Demo above. Global logout also signs the Codex CLI and other local clients out of this account.</p><button type="button" disabled={busy} onClick={() => void globallyLogout()} className="mt-4 text-sm font-semibold text-wrong underline">Log out of Codex globally</button></section>}
  </div>;
}
