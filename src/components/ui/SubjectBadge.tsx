import SubjectIcon from "../SubjectIcon";
import { subjectColor } from "@/lib/curriculum/subjects";

/**
 * The one subject marker for grids and rails: the clay object, matching the
 * sidebar. The subject name carries its own accent — every accent clears
 * 4.5:1 on its subject tint by construction, and more than that on white — so
 * the colour names the subject instead of decorating the card.
 *
 * It names the subject and nothing else. It briefly carried the authored
 * `level` too, which put "Developing" under eight of ten course cards and
 * "Extension" under the other two — an internal difficulty taxonomy the
 * learner has never been told the terms of. Where difficulty is worth stating,
 * `CoursePathCard`'s `band` says it in years and prerequisites instead.
 */
export default function SubjectBadge({
  subject,
  size = 38,
}: {
  subject: string;
  size?: number;
}) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <SubjectIcon subject={subject} variant="object" size={size} />
      <span className="min-w-0 truncate text-label font-semibold leading-tight" style={{ color: subjectColor(subject) }}>{subject}</span>
    </span>
  );
}
