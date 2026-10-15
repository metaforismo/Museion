import type { ImgHTMLAttributes } from "react";

import { MAIA_SIZES, type MaiaSize, type MaiaState } from "@/lib/design/maia";

export type { MaiaState };

const STATIC_SRC: Record<MaiaState, string> = {
  attentive: "/brand/maia/maia-book-attentive.webp",
  curious: "/brand/maia/maia-book-curious.webp",
  thinking: "/brand/maia/maia-book-thinking.webp",
  celebrating: "/brand/maia/maia-book-celebrating.webp",
  redirecting: "/brand/maia/maia-book-redirecting.webp",
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
    // eslint-disable-next-line @next/next/no-img-element -- small optimized local WebP; one shared character contract
    <img
      src={STATIC_SRC[state]}
      alt={title ?? ""}
      aria-hidden={title ? undefined : true}
      className={`maia-character object-contain ${className ?? ""}`}
      data-state={state}
      data-animated={animated ? "true" : undefined}
      decoding="async"
      style={size ? { height: MAIA_SIZES[size], width: "auto", ...style } : style}
      {...props}
    />
  );
}
