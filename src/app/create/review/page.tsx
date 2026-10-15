import { redirect } from "next/navigation";

/** The hackathon fixture review is retired; personal reviews live at /review/[runId]. */
export default function RetiredFixtureReviewPage() {
  redirect("/create");
}
