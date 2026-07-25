import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

import { pressableClasses, type PressableVariant } from "./pressable-classes";

/**
 * The pressable action — flat accent fill standing on a 4px deep edge of the
 * same hue. Renders a real `<button>` unless `href` is given, in which case it
 * is a next/link with identical physics.
 *
 * `accent`/`edge` are only read by the primary variant and must arrive as a
 * pair from the palette — `subjectColor(s)` with `subjectDeep(s)`, or a state
 * token with its `-deep` partner. Components never darken a colour themselves;
 * that is the whole reason the deep shades exist as literals.
 */
type CommonProps = {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

/**
 * Primary requires its fill/edge pair at the type level: `variant="primary"`
 * without an accent renders white text on transparent, and the compiler is the
 * cheapest place to make that impossible.
 */
type BaseProps = CommonProps &
  (
    | {
        variant?: "primary";
        /** Fill for the primary variant — `subjectColor(...)` or a state token. */
        accent: string;
        /** The matching deep edge — `subjectDeep(...)` or the token's `-deep`. */
        edge: string;
      }
    | { variant: Exclude<PressableVariant, "primary">; accent?: undefined; edge?: undefined }
  );

type PressableLinkProps = BaseProps & { href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className" | "style" | "children">;
type PressableButtonProps = BaseProps & { href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "style" | "children">;

export default function Pressable(props: PressableLinkProps | PressableButtonProps) {
  const { variant = "primary", accent, edge, className = "", style, children, ...rest } = props;
  const composedClassName = `${pressableClasses(variant)} ${className}`.trim();
  const composedStyle: CSSProperties = {
    ...(variant === "primary" && accent ? { backgroundColor: accent } : null),
    ...(variant === "primary" && edge ? ({ "--pressable-edge": edge } as CSSProperties) : null),
    ...style,
  };

  if (props.href !== undefined) {
    const { href, ...anchorRest } = rest as { href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className" | "style" | "children">;
    return (
      <Link href={href} {...anchorRest} className={composedClassName} style={composedStyle}>
        {children}
      </Link>
    );
  }

  const buttonRest = rest as Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "style" | "children">;
  return (
    <button type="button" {...buttonRest} className={composedClassName} style={composedStyle}>
      {children}
    </button>
  );
}
