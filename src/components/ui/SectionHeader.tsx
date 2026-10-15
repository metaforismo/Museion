import Link from "next/link";

import { HugeiconsIcon } from "@hugeicons/react";
import type { Atom01Icon } from "@hugeicons/core-free-icons";

/**
 * One heading geometry for every panel on a surface, so sections stop
 * drifting apart by a few pixels of margin each time one is rebuilt.
 *
 * `accent`/`tint` colour the icon square and are expected to be a
 * contrast-checked pair: the glyph is a meaningful graphic, so it needs 3:1
 * against its own square, not just against the page.
 */
export default function SectionHeader({
  id,
  title,
  icon,
  accent,
  tint,
  actionHref,
  actionLabel,
  meta,
}: {
  id: string;
  title: string;
  icon?: typeof Atom01Icon;
  accent?: string;
  tint?: string;
  actionHref?: string;
  actionLabel?: string;
  /** A short right-aligned fact, e.g. a count. Never a claim about quality. */
  meta?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-4">
      <h2 id={id} className="title-panel flex min-w-0 items-center gap-2">
        {icon && (
          <span
            aria-hidden="true"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
            style={{ backgroundColor: tint, color: accent }}
          >
            <HugeiconsIcon icon={icon} size={15} strokeWidth={2} />
          </span>
        )}
        {/* Not truncated: a clipped heading hides the one thing the section is
            for. "What this path asks you to reason about" lost its last three
            words at 375px. It wraps instead, and the row grows. */}
        <span className="min-w-0">{title}</span>
      </h2>
      {meta && <span className="shrink-0 text-label tabular-nums text-ink-soft">{meta}</span>}
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="shrink-0 text-body-sm font-medium text-lapis-dark hover:underline hover:underline-offset-4"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
