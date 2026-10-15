"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { clearLearnerBrowserState } from "@/lib/client/storage";
import { Card } from "@/components/ui";

type AccountAction = "reset" | "delete";

export default function AccountControls() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<AccountAction | null>(null);
  const [busy, setBusy] = useState(false);
  const mutate = async (action: AccountAction) => {
    setBusy(true); setMessage(null); setError(null);
    try {
      const response = await fetch("/api/account", action === "delete" ? { method: "DELETE" } : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reset" }) });
      if (!response.ok) throw new Error("The account action could not be completed. Please try again.");
      clearLearnerBrowserState();
      if (action === "delete") location.assign("/");
      else { setMessage("Your learning data was reset. Your account is ready for a fresh start."); setPending(null); router.refresh(); }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Account action failed."); }
    finally { setBusy(false); }
  };

  const confirmation = (action: AccountAction) => pending === action && <div className="mt-4 rounded-xl border border-wrong/20 bg-wrong-soft p-4" role="region" aria-label={`Confirm ${action === "delete" ? "account deletion" : "learning data reset"}`}>
    <p className="text-body-sm font-semibold text-ink">{action === "delete" ? "Delete your account permanently?" : "Start again with an empty learning record?"}</p>
    <p className="mt-1 text-label leading-5 text-ink-soft">{action === "delete" ? "This removes your account and its saved data. You cannot undo this." : "Your courses, progress and uploads will be removed. Your sign-in and learning goal stay."}</p>
    <div className="mt-3 flex flex-wrap items-center gap-3"><button type="button" disabled={busy} aria-busy={busy} onClick={() => void mutate(action)} className="min-h-11 rounded-xl bg-wrong px-4 text-body-sm font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50">{busy ? "Working…" : action === "delete" ? "Yes, delete my account" : "Yes, reset my data"}</button><button type="button" autoFocus disabled={busy} onClick={() => setPending(null)} className="min-h-11 rounded-xl px-4 text-body-sm font-semibold text-ink-soft hover:bg-surface disabled:opacity-50">Keep my data</button></div>
  </div>;

  return <div className="mt-8 space-y-5">
    <Card className="p-5"><h2 className="title-panel">Keep a copy</h2><p className="mt-2 text-body-sm leading-6 text-ink-soft">Download your learning records and saved course details as a JSON file.</p><a href="/api/account?export=1" download className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-ink px-5 text-body-sm font-semibold text-white transition-colors hover:bg-lapis-dark">Export my data <span aria-hidden="true" className="ml-2">↓</span></a></Card>
    <Card className="p-5"><h2 className="title-panel">Reset learning data</h2><p className="mt-2 text-body-sm leading-6 text-ink-soft">Keep your account and learning goal. Remove progress, generated courses, uploads and usage history.</p>{pending !== "reset" && <button type="button" disabled={busy} onClick={() => { setPending("reset"); setError(null); }} className="mt-4 min-h-11 rounded-xl border border-ink/15 px-4 text-body-sm font-semibold transition-colors hover:border-lapis/35 hover:text-lapis-dark disabled:opacity-50">Reset data</button>}{confirmation("reset")}</Card>
    <Card className="border-wrong/25 p-5"><h2 className="title-panel">Delete account</h2><p className="mt-2 text-body-sm leading-6 text-ink-soft">Permanently remove your account, learning progress, saved courses and uploaded materials.</p>{pending !== "delete" && <button type="button" disabled={busy} onClick={() => { setPending("delete"); setError(null); }} className="mt-4 min-h-11 rounded-xl border border-wrong/30 px-4 text-body-sm font-semibold text-wrong transition-colors hover:bg-wrong-soft disabled:opacity-50">Delete my account</button>}{confirmation("delete")}</Card>
    {message && <p role="status" className="rounded-xl bg-correct-soft p-4 text-body-sm text-ink">{message}</p>}{error && <p role="alert" className="rounded-xl bg-wrong-soft p-4 text-body-sm text-wrong">{error}</p>}
  </div>;
}
