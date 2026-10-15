import type { CSSProperties, ReactNode } from "react";

import { cardClasses, type CardTone } from "./card-classes";

/**
 * Card owns the surface, not the layout: padding stays with the caller so a
 * card can hold a full-bleed tinted band.
 *
 * Links are deliberately not an option here — a card that renders <a> would
 * have to re-declare next/link's whole prop surface. Interactive cards call
 * `cardClasses()` directly on their <Link>, which is why the helper, not this
 * component, is the tested contract.
 */
export default function Card({
  as: Tag = "div",
  tone = "quiet",
  interactive = false,
  accent,
  tint,
  className = "",
  style,
  children,
  ...rest
}: {
  as?: "div" | "section" | "article" | "aside" | "li";
  tone?: CardTone;
  interactive?: boolean;
  /** Subject or state colour for the 3px top edge. */
  accent?: string;
  /** Surface fill — pass `subjectTint(subject)`, never a hand-rolled color-mix. */
  tint?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  /** For the cases where the card itself is the live region, e.g. role="alert". */
  role?: string;
} & { "aria-labelledby"?: string; "aria-label"?: string }) {
  return (
    <Tag
      className={`${cardClasses(tone, interactive)} ${className}`.trim()}
      style={{
        ...(tint ? { backgroundColor: tint } : null),
        ...(accent ? { borderTop: `3px solid ${accent}` } : null),
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
