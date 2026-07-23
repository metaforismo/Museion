"use client";
import { useEffect, useState } from "react";
interface AccountView { actor: { kind: "guest" | "account"; displayName: string | null } }
export default function AuthButton() {
  const [account, setAccount] = useState<AccountView | null>(null);
  useEffect(() => { let active = true; fetch("/api/account", { cache: "no-store" }).then((response) => response.ok ? response.json() : null).then((value) => { if (active) setAccount(value); }).catch(() => {}); return () => { active = false; }; }, []);
  if (!account || account.actor.kind === "guest") return <a href="/signin-with-chatgpt?return_to=/dashboard" className="inline-flex min-h-10 items-center rounded-full border border-ink/15 bg-surface px-3 text-xs font-semibold text-ink hover:border-ink/30">Sign in with ChatGPT</a>;
  return <div className="flex items-center gap-2"><a href="/account" className="hidden max-w-36 truncate text-xs font-semibold text-ink-soft hover:text-ink sm:inline">{account.actor.displayName ?? "Account"}</a><a href="/signout-with-chatgpt?return_to=/" className="inline-flex min-h-10 items-center rounded-full border border-ink/15 px-3 text-xs font-semibold text-ink-soft hover:text-ink">Sign out</a></div>;
}
