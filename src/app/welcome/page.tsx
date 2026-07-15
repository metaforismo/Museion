import type { Metadata } from "next";

import OnboardingTour from "@/components/OnboardingTour";

export const metadata: Metadata = {
  title: "Welcome",
  description: "A two-minute tour of how learning works on Museion.",
};

export default function WelcomePage() {
  return <OnboardingTour />;
}
