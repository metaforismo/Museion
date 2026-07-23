import type { Metadata } from "next";
import { redirect } from "next/navigation";

import AccountControls from "@/components/AccountControls";
import { currentActor } from "@/lib/server/actor";
import { quotaView } from "@/lib/server/usage";

export const metadata: Metadata = { title: "Account", description: "Export, reset, or delete your Museion account data." };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const actor = await currentActor();
  if (actor.kind !== "account") redirect("/signin-with-chatgpt?return_to=/account");
  const quotas = await quotaView(actor.ownerId);
  return <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:py-20"><p className="eyebrow">Account and data</p><h1 className="mt-3 title-page">Your Museion controls.</h1><p className="mt-4 max-w-2xl leading-7 text-ink-soft">Museion stores a pseudonymous account ID, not your raw email or forwarded ChatGPT name. Today you have {quotas.maia.remaining} of {quotas.maia.limit} Maia turns and {quotas.compiler.remaining} of {quotas.compiler.limit} Course Architect builds remaining.</p><AccountControls /></main>;
}
