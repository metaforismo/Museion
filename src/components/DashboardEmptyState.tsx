import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ChartUpIcon, Files02Icon, RepeatIcon } from "@hugeicons/core-free-icons";

interface DashboardEmptyStateProps {
  actionHref: string;
  actionLabel: string;
  description: string;
  icon: "evidence" | "review" | "source";
  title: string;
}

const ICONS = { evidence: ChartUpIcon, review: RepeatIcon, source: Files02Icon } as const;

/**
 * Token pairs, not hand-mixed subject accents: "evidence" used to borrow the
 * biology green, which reads as a subject the panel has nothing to do with.
 * Review is the attention state; the glyph is ink because gold on gold-soft
 * is 2.5:1, below the 3:1 a meaningful graphic needs.
 */
const MARKS = {
  evidence: { tint: "var(--color-lapis-soft)", glyph: "var(--color-lapis)" },
  review: { tint: "var(--color-gold-soft)", glyph: "var(--color-ink)" },
  source: { tint: "var(--color-lapis-soft)", glyph: "var(--color-lapis)" },
} as const;

export default function DashboardEmptyState({ actionHref, actionLabel, description, icon, title }: DashboardEmptyStateProps) {
  const mark = MARKS[icon];
  return (
    <div className="flex items-start gap-3 p-4">
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
        style={{ backgroundColor: mark.tint, color: mark.glyph }}
        aria-hidden="true"
      >
        <HugeiconsIcon icon={ICONS[icon]} size={16} strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <p className="text-body-sm font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-label leading-5 text-ink-soft">{description}</p>
        <Link href={actionHref} className="mt-2 inline-flex min-h-8 items-center text-label font-semibold text-lapis-dark hover:underline hover:underline-offset-4">
          {actionLabel}<span className="ml-1.5" aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
