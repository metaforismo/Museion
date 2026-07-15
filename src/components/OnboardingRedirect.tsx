"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { hasOnboarded } from "@/lib/client/storage";

/** Sends first-time visitors to the welcome tour. Renders nothing. */
export default function OnboardingRedirect() {
  const router = useRouter();
  useEffect(() => {
    if (!hasOnboarded()) {
      router.replace("/welcome");
    }
  }, [router]);
  return null;
}
