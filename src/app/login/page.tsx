import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { currentActor } from "@/lib/server/actor";
import { safeReturnTo } from "@/lib/server/auth";
export const metadata: Metadata = { title: "Welcome back", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if ((await currentActor()).kind === "account") redirect(safeReturnTo(next));
  return <AuthForm mode="login" next={next} />;
}
