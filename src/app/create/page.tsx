import type { Metadata } from "next";

import SourceCreator from "@/components/SourceCreator";

export const metadata: Metadata = {
  title: "Create a course",
  description: "Normalize and review a trusted source before compiling a course.",
};

export default function CreatePage() {
  return <SourceCreator />;
}
