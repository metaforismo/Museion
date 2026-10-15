import { HugeiconsIcon } from "@hugeicons/react";
import {
  Atom01Icon,
  CalculatorIcon,
  Dna01Icon,
  FunctionSquareIcon,
  SourceCodeIcon,
  TestTube01Icon,
} from "@hugeicons/core-free-icons";

import { subjectColor, subjectTint } from "@/lib/curriculum/subjects";
import { subjectObjectSrc } from "@/lib/design/assets";

const SUBJECT_ICONS: Record<string, typeof Atom01Icon> = {
  algebra: FunctionSquareIcon,
  arithmetic: CalculatorIcon,
  "computer science": SourceCodeIcon,
  "research methods": TestTube01Icon,
  physics: Atom01Icon,
  biology: Dna01Icon,
};

/**
 * A subject marker. `object` renders the clay illustration for grids and the
 * sidebar; `tinted` is the glyph on its subject tint; `plain` is the quiet
 * monochrome line treatment.
 */
export default function SubjectIcon({
  subject,
  size = 40,
  iconSize = 20,
  className,
  variant = "tinted",
}: {
  subject: string;
  size?: number;
  iconSize?: number;
  className?: string;
  variant?: "tinted" | "plain" | "object";
}) {
  if (variant === "object") {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- fixed-size decorative clay asset; next/image adds no value at this scale
      <img
        src={subjectObjectSrc(subject)}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        className={`shrink-0 object-contain ${className ?? ""}`}
        style={{ width: size, height: size }}
      />
    );
  }

  const icon = SUBJECT_ICONS[subject.trim().toLowerCase()] ?? FunctionSquareIcon;
  const tinted = variant === "tinted";
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center ${tinted ? "rounded-xl" : "text-current"} ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        ...(tinted ? { backgroundColor: subjectTint(subject), color: subjectColor(subject) } : {}),
      }}
    >
      <HugeiconsIcon icon={icon} size={iconSize} strokeWidth={1.8} />
    </span>
  );
}
