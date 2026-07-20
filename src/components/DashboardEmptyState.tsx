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
const TINTS = {
  evidence: "var(--color-subject-biology)",
  review: "var(--color-gold)",
  source: "var(--color-lapis)",
} as const;

export default function DashboardEmptyState({ actionHref, actionLabel, description, icon, title }: DashboardEmptyStateProps) {
  const tint = TINTS[icon];
  return (
    <div className="flex items-start gap-3 p-4">
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
        style={{ backgroundColor: `color-mix(in srgb, ${tint} 12%, transparent)`, color: tint }}
        aria-hidden="true"
      >
        <HugeiconsIcon icon={ICONS[icon]} size={16} strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-ink-soft">{description}</p>
        <Link href={actionHref} className="mt-2 inline-flex min-h-8 items-center text-xs font-semibold text-lapis-dark hover:underline hover:underline-offset-4">
          {actionLabel}<span className="ml-1.5" aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
