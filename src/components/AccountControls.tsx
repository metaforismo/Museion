"use client";

import { useState } from "react";

import { Card } from "@/components/ui";

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

  return (
    <div className="mt-8 space-y-5">
      <a
        href="/api/account?export=1"
        download
        className="inline-flex min-h-11 items-center rounded-xl bg-ink px-5 text-body-sm font-semibold text-white transition hover:bg-lapis-dark"
      >
        Export my data
      </a>

      <Card className="p-5">
        <h2 className="title-panel">Reset learning data</h2>
        <p className="mt-2 text-body-sm leading-6 text-ink-soft">
          Keeps your account identity but removes progress, generated courses, uploads, and usage history.
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => void mutate("reset")}
          className="mt-4 min-h-11 rounded-xl border border-ink/15 px-4 text-body-sm font-semibold transition hover:border-lapis/35 hover:text-lapis-dark disabled:opacity-50"
        >
          Reset data
        </button>
      </Card>

      {/* The wrong tone is meaning here, not emphasis: this control destroys the
          account record and cannot be undone. */}
      <Card tint="var(--color-wrong-soft)" className="border-wrong/25 p-5">
        <h2 className="title-panel">Delete account</h2>
        <p className="mt-2 text-body-sm leading-6 text-ink-soft">
          Deletes the account record and all account-scoped D1 and R2 data.
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => void mutate("delete")}
          className="mt-4 min-h-11 rounded-xl bg-wrong px-4 text-body-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          Delete my account
        </button>
      </Card>

      {message && <p role="status" className="text-body-sm text-ink-soft">{message}</p>}
    </div>
  );
}
