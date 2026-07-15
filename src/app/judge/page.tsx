import type { Metadata } from "next";

import JudgeExperience from "@/components/JudgeExperience";

export const metadata: Metadata = {
  title: "Judge experience",
  description: "Run the complete verified binary-search learning journey without an account or API key.",
};

export default function JudgePage() {
  return <JudgeExperience />;
}
