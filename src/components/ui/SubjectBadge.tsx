import SubjectIcon from "../SubjectIcon";
import { subjectColor } from "@/lib/curriculum/subjects";

/**
 * The one subject marker for grids and rails: the clay object, matching the
 * sidebar. The subject name carries its own accent — every accent clears
 * 4.5:1 on its subject tint by construction, and more than that on white — so
 * the colour names the subject instead of decorating the card.
 */
export default function SubjectBadge({
  subject,
  level,
  size = 38,
}: {
  subject: string;
  level?: string;
  size?: number;
}) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <SubjectIcon subject={subject} variant="object" size={size} />
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-label font-semibold" style={{ color: subjectColor(subject) }}>{subject}</span>
        {level && <span className="mt-0.5 block truncate text-micro capitalize text-ink-soft">{level}</span>}
      </span>
    </span>
  );
}
