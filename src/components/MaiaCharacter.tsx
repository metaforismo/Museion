import type { ImgHTMLAttributes } from "react";

export type MaiaState = "attentive" | "curious" | "thinking" | "celebrating" | "redirecting";

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

export default function MaiaCharacter({
  state = "attentive",
  className,
  title,
  animated = true,
  ...props
}: { state?: MaiaState; className?: string; title?: string; animated?: boolean } & Omit<
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
      {...props}
    />
  );
}
