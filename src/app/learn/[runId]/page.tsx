import JudgeExperience from "@/components/JudgeExperience";

export default async function GeneratedLearnerPage({ params }: { params: Promise<{ runId: string }> }) {
  return <JudgeExperience compilerRunId={(await params).runId} />;
}
