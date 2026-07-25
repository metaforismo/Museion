import { HugeiconsIcon } from "@hugeicons/react";
import type { Atom01Icon } from "@hugeicons/core-free-icons";

/**
 * One recorded count. The accent/tint pair is passed in rather than derived,
 * but it must still mean something: these tiles report the learning record,
 * so they take the record's own colours (information, verified) — never a
 * subject colour, which would claim a subject the count does not belong to.
 */
export default function StatTile({
  label,
  value,
  icon,
  accent,
  tint,
}: {
  label: string;
  value: number;
  icon: typeof Atom01Icon;
  accent: string;
  tint: string;
}) {
  return (
    <div className="surface-card-quiet flex items-center gap-3 px-4 py-3">
      <span
        aria-hidden="true"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
        style={{ backgroundColor: tint, color: accent }}
      >
        <HugeiconsIcon icon={icon} size={20} strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-semibold leading-none tracking-title tabular-nums">{value}</p>
        <p className="mt-1 truncate text-label leading-4 text-ink-soft">{label}</p>
      </div>
    </div>
  );
}
