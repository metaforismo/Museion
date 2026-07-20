# Maia mascot

Maia is a living idea: an asymmetrical lapis seed/flame opening around an ivory threshold and a restrained gold spark. The silhouette connects to Museion’s organic mark, while eyes and gesture turn it into a contextual guide.

The production family is flat SVG in `public/brand/maia/`. Five states — neutral, thinking, celebrating, curious, and pointing — are pixel-accurate vector recreations of the character sheet, traced layer by layer from the source raster so silhouette, face, and gesture match the original art exactly. Encouraging and offline are simplified derivative states with no sheet counterpart. Use 24–48 px for status/identity and larger illustrations only for onboarding, an empty/next state, or a meaningful intervention. Do not use Maia as decoration on every card.

## Animated variants

`public/brand/maia/animated/` holds the same five poses with self-contained CSS idle animations: gentle breathing and periodic blinking on every pose, a bobbing question mark on thinking, a hop with popping sparks on celebrating, and drifting thought bubbles on curious. The eyes, brows, belly, and floating marks are separate vector groups, so the static frame stays pixel-identical to the static family. All motion sits inside a `prefers-reduced-motion: no-preference` media query — reduced-motion users get the static character with no extra work. The animations run when the SVG is loaded inline or via `<img>`; preview them in `docs/design/maia-animated-preview.html`. Prefer the static family for persistent UI; reserve the animated variants for the moments that already justify a larger illustration.

## Image generation provenance

Built-in Codex Imagegen produced the exploration sheet at `docs/design/maia-character-sheet-source.png`. Prompt intent: an original non-human, non-owl, non-robot seed/flame companion for Museion; lapis, ivory, and gold; five states; no text; explicit prohibition on resembling Brilliant, Duolingo, Khanmigo, or existing education mascots; flat magenta removal background. The raw raster was never shipped as a product asset. It was quantized to its five flat colors (`#f904f6` background, `#1953c8` lapis, `#f8f6de` ivory, `#eaae0c` gold, `#0b0b0e` pupils) and each color layer was vector-traced into deterministic SVG geometry without gradients or raster dependencies. `docs/design/maia-character-sheet.svg` is the full-sheet vector recreation; the per-pose files in `public/brand/maia/` are tight-cropped, transparent-background cuts of the same trace.

## Accessibility

Decorative instances are hidden from assistive technology. Meaningful instances carry a short state label (“Maia thinking”, “Maia offline”). Color never carries the status alone; adjacent text explains provider/fallback state.
