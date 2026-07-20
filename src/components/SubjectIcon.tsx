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
 * A tinted icon tile identifying a subject — the accent color at 12%
 * for the tile, full strength for the stroke. Small color, big clarity.
 */
export default function SubjectIcon({ subject, size = 40, iconSize = 20, className }: { subject: string; size?: number; iconSize?: number; className?: string }) {
  const icon = SUBJECT_ICONS[subject.trim().toLowerCase()] ?? FunctionSquareIcon;
  const accent = subjectColor(subject);
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-xl ${className ?? ""}`}
      style={{ width: size, height: size, backgroundColor: `color-mix(in srgb, ${accent} 12%, transparent)`, color: accent }}
    >
      <HugeiconsIcon icon={icon} size={iconSize} strokeWidth={1.8} />
    </span>
  );
}
