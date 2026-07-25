"use client";
import { useEffect, useState } from "react";
interface AccountView { actor: { kind: "guest" | "account"; displayName: string | null } }
export default function AuthButton() {
  const [account, setAccount] = useState<AccountView | null>(null);
  useEffect(() => { let active = true; fetch("/api/account", { cache: "no-store" }).then((response) => response.ok ? response.json() : null).then((value) => { if (active) setAccount(value); }).catch(() => {}); return () => { active = false; }; }, []);
  // The full label is the only header item with no small-screen treatment, and
  // it pushed the public header 16px past a 320px viewport into horizontal
  // scroll. The short label keeps the affordance instead of hiding it.
  //
  // body-sm is the size the rest of the header row uses — the app shell puts
  // this button directly beside "New course", and the two were a step apart.
  if (!account || account.actor.kind === "guest") return <a href="/signin-with-chatgpt?return_to=/dashboard" className="inline-flex min-h-10 shrink-0 items-center rounded-full border border-ink/15 bg-surface px-3 text-body-sm font-semibold text-ink hover:border-ink/30"><span className="sm:hidden">Sign in</span><span className="hidden sm:inline">Sign in with ChatGPT</span></a>;
  return <div className="flex items-center gap-2"><a href="/account" className="hidden max-w-36 truncate text-body-sm font-semibold text-ink-soft hover:text-ink sm:inline">{account.actor.displayName ?? "Account"}</a><a href="/signout-with-chatgpt?return_to=/" className="inline-flex min-h-10 items-center rounded-full border border-ink/15 px-3 text-body-sm font-semibold text-ink-soft hover:text-ink">Sign out</a></div>;
}
