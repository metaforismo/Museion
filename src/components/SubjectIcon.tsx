import { HugeiconsIcon } from "@hugeicons/react";
import {
  Atom01Icon,
  CalculatorIcon,
  Dna01Icon,
  FunctionSquareIcon,
  SourceCodeIcon,
  TestTube01Icon,
} from "@hugeicons/core-free-icons";

import { subjectColor } from "@/lib/curriculum/subjects";

const SUBJECT_ICONS: Record<string, typeof Atom01Icon> = {
  algebra: FunctionSquareIcon,
  arithmetic: CalculatorIcon,
  "computer science": SourceCodeIcon,
  "research methods": TestTube01Icon,
  physics: Atom01Icon,
  biology: Dna01Icon,
};

/**
 * A subject marker. Cards use the tinted tile for quick scanning; compact
 * navigation can opt into the quieter, monochrome line treatment.
 */
export default function SubjectIcon({ subject, size = 40, iconSize = 20, className, variant = "tinted" }: { subject: string; size?: number; iconSize?: number; className?: string; variant?: "tinted" | "plain" }) {
  const icon = SUBJECT_ICONS[subject.trim().toLowerCase()] ?? FunctionSquareIcon;
  const accent = subjectColor(subject);
  const tinted = variant === "tinted";
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center ${tinted ? "rounded-xl" : "text-current"} ${className ?? ""}`}
      style={{ width: size, height: size, ...(tinted ? { backgroundColor: `color-mix(in srgb, ${accent} 12%, transparent)`, color: accent } : {}) }}
    >
      <HugeiconsIcon icon={icon} size={iconSize} strokeWidth={1.8} />
    </span>
  );
}
