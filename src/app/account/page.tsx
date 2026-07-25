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
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-7 sm:px-6 lg:py-10">
      <p className="text-label font-semibold uppercase tracking-[0.08em] text-lapis-dark">Account and data</p>
      <h1 className="mt-2 title-page">Your Museion controls.</h1>
      <p className="mt-3 max-w-2xl text-body leading-6 text-ink-soft">
        Museion stores a pseudonymous account ID, not your raw email or forwarded ChatGPT name. Today
        you have {quotas.maia.remaining} of {quotas.maia.limit} Maia turns and{" "}
        {quotas.compiler.remaining} of {quotas.compiler.limit} Course Architect builds remaining.
      </p>
      <AccountControls />
    </main>
  );
}
