"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clearLearnerBrowserState } from "@/lib/client/storage";
import { readPublicAccount, type PublicAccountView } from "@/lib/client/public-account";
import styles from "./SiteHeader.module.css";

export default function AuthButton() {
  const [account, setAccount] = useState<PublicAccountView | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      controller.abort();
      if (active) setUnavailable(true);
    }, 6000);
    readPublicAccount(controller.signal)
      .then((value) => { if (active) setAccount(value); })
      .catch(() => { if (active) setUnavailable(true); })
      .finally(() => window.clearTimeout(timeout));
    return () => { active = false; window.clearTimeout(timeout); controller.abort(); };
  }, []);

  async function logout() {
    setBusy(true); setError(false);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Logout failed");
      clearLearnerBrowserState();
      window.location.assign("/");
    } catch { setBusy(false); setError(true); }
  }

  if (account?.actor.kind !== "account") return <div className={styles.accountControls}>
    <Link href="/login" className={styles.accountButton} title={unavailable ? "Account status unavailable. Open sign in to check your account." : undefined}>Sign in</Link>
    {unavailable && <span className="sr-only" role="status">Account status unavailable. You can still sign in.</span>}
  </div>;

  return <div className={styles.accountControls}>
    <Link href="/account" className={styles.accountName}>{account.actor.displayName ?? "Account"}</Link>
    <button type="button" disabled={busy} onClick={() => void logout()} className={styles.accountButton}>{busy ? "Signing out…" : error ? "Retry sign out" : "Sign out"}</button>
    {error && <span className="sr-only" role="alert">Sign out failed. Please try again.</span>}
  </div>;
}
