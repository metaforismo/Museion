"use client";

import { useState } from "react";

export default function AccountControls() {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const mutate = async (action: "reset" | "delete") => {
    const warning = action === "delete" ? "Delete your Museion account and all retained data? This cannot be undone." : "Reset all Museion progress, courses, uploads, and usage history?";
    if (!window.confirm(warning)) return;
    setBusy(true); setMessage(null);
    try {
      const response = await fetch("/api/account", action === "delete" ? { method: "DELETE" } : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reset" }) });
      if (!response.ok) throw new Error("The account action could not be completed.");
      if (action === "delete") location.assign("/signout-with-chatgpt?return_to=/");
      else setMessage("Your retained Museion data was reset.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Account action failed."); }
    finally { setBusy(false); }
  };
  return <div className="mt-8 space-y-5">
    <a href="/api/account?export=1" download className="inline-flex min-h-11 items-center rounded-xl bg-ink px-5 text-sm font-semibold text-white">Export my data</a>
    <div className="rounded-2xl border border-ink/10 bg-surface p-5"><h2 className="tracking-title text-xl font-semibold">Reset learning data</h2><p className="mt-2 text-sm leading-6 text-ink-soft">Keeps your account identity but removes progress, generated courses, uploads, and usage history.</p><button type="button" disabled={busy} onClick={() => void mutate("reset")} className="mt-4 rounded-xl border border-ink/15 px-4 py-2.5 text-sm font-semibold disabled:opacity-50">Reset data</button></div>
    <div className="rounded-2xl border border-wrong/25 bg-wrong-soft p-5"><h2 className="tracking-title text-xl font-semibold">Delete account</h2><p className="mt-2 text-sm leading-6 text-ink-soft">Deletes the account record and all account-scoped D1 and R2 data.</p><button type="button" disabled={busy} onClick={() => void mutate("delete")} className="mt-4 rounded-xl bg-wrong px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Delete my account</button></div>
    {message && <p role="status" className="text-sm text-ink-soft">{message}</p>}
  </div>;
}
