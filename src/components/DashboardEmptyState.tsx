import Link from "next/link";

import AppIcon, { type AppIconName } from "./AppIcon";

interface DashboardEmptyStateProps {
  actionHref: string;
  actionLabel: string;
  description: string;
  icon: AppIconName;
  title: string;
}

export default function DashboardEmptyState({ actionHref, actionLabel, description, icon, title }: DashboardEmptyStateProps) {
  return (
    <div className="mt-4 border-t border-ink/8 pt-4">
      <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-ink/8 bg-paper text-lapis-dark" aria-hidden="true">
          <AppIcon name={icon} className="h-[1.1rem] w-[1.1rem]" />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink">{title}</p>
          <p className="mt-1 text-xs leading-5 text-ink-soft">{description}</p>
          <Link href={actionHref} className="mt-3 inline-flex min-h-9 items-center rounded-lg text-xs font-semibold text-lapis-dark hover:underline hover:underline-offset-4">
            {actionLabel}<span className="ml-1.5" aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
