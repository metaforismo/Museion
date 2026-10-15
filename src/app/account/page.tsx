import type { Metadata } from "next";
import { redirect } from "next/navigation";

import AccountControls from "@/components/AccountControls";
import { currentActor } from "@/lib/server/actor";
import { quotaView } from "@/lib/server/usage";

export const metadata: Metadata = { title: "Account", description: "Export, reset, or delete your Museion account data." };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const actor = await currentActor();
  if (actor.kind !== "account") redirect("/login?next=/account");
  const quotas = await quotaView(actor.ownerId);
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-7 sm:px-6 lg:py-10">
      <p className="eyebrow">Account and data</p>
      <h1 className="mt-2 title-page">Your account.</h1>
      <p className="mt-3 max-w-2xl text-body leading-6 text-ink-soft">
        {actor.displayName ? `${actor.displayName}, your` : "Your"} progress and saved courses stay together here.
        Export your records or manage the data you keep.
      </p>
      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-ink/10 bg-surface p-5"><dt className="text-label text-ink-soft">Maia questions available today</dt><dd className="mt-2 text-2xl font-semibold tabular-nums">{quotas.maia.remaining}<span className="ml-2 text-body-sm font-normal text-ink-soft">of {quotas.maia.limit}</span></dd></div>
        <div className="rounded-2xl border border-ink/10 bg-surface p-5"><dt className="text-label text-ink-soft">Course builds available today</dt><dd className="mt-2 text-2xl font-semibold tabular-nums">{quotas.compiler.remaining}<span className="ml-2 text-body-sm font-normal text-ink-soft">of {quotas.compiler.limit}</span></dd></div>
      </dl>
      <AccountControls />
    </section>
  );
}
