import type { ImgHTMLAttributes } from "react";

import { MAIA_SIZES, type MaiaSize, type MaiaState } from "@/lib/design/maia";

export type { MaiaState };

/**
 * Pixel-accurate poses traced from the Maia character sheet. Each
 * animated SVG carries its own idle motion (breathing, blinking,
 * pose-specific accents, entrance pop) behind a prefers-reduced-motion
 * media query, so a plain <img> is all the runtime needs; swapping
 * `state` replays the entrance. `animated={false}` serves the static
 * trace instead — pixel-identical to the animated file at rest.
 */
const ANIMATED_SRC: Record<MaiaState, string> = {
  attentive: "/brand/maia/animated/maia-neutral.svg",
  curious: "/brand/maia/animated/maia-curious.svg",
  thinking: "/brand/maia/animated/maia-thinking.svg",
  celebrating: "/brand/maia/animated/maia-celebrating.svg",
  redirecting: "/brand/maia/animated/maia-pointing.svg",
};

const STATIC_SRC: Record<MaiaState, string> = {
  attentive: "/brand/maia/maia-neutral.svg",
  curious: "/brand/maia/maia-curious.svg",
  thinking: "/brand/maia/maia-thinking.svg",
  celebrating: "/brand/maia/maia-celebrating.svg",
  redirecting: "/brand/maia/maia-pointing.svg",
};

/**
 * `animated` defaults to `false`: stillness is the norm, and she moves only
 * where she is genuinely live. `size` is the only sanctioned way to scale her —
 * it pins the height to a ladder rung and lets the width follow the pose's own
 * aspect ratio, which differs between poses. It is applied as an inline style
 * because Tailwind's preflight sets `img { height: auto }`, which would
 * silently override a height attribute.
 */
export default function MaiaCharacter({
  state = "attentive",
  size,
  className,
  title,
  animated = false,
  style,
  ...props
}: { state?: MaiaState; size?: MaiaSize; className?: string; title?: string; animated?: boolean } & Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src" | "alt" | "title"
>) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- self-hosted animated SVG; next/image offers no optimization for it
    <img
      src={(animated ? ANIMATED_SRC : STATIC_SRC)[state]}
      alt={title ?? ""}
      aria-hidden={title ? undefined : true}
      className={className ? `object-contain ${className}` : "object-contain"}
      style={size ? { height: MAIA_SIZES[size], width: "auto", ...style } : style}
      {...props}
    />
  );
}
