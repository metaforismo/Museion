# Museion brand mark

The Museion mark is a compact learning symbol designed to remain recognizable from a favicon to a presentation cover.

- **Organic lapis form:** a living house of knowledge rather than a static archive.
- **Open book / threshold:** the Mouseion of Alexandria as a place one enters and learns within.
- **Gold point:** an idea brought into view through Maia's maieutic guidance, not an answer handed over.
- **Flat geometry:** a precise, reproducible mark that reflects Museion's deterministic ground truth.

## Production assets

- `public/brand/museion-mark.svg` is the transparent primary mark used by the website and README.
- `src/app/icon.svg` is the paper-backed application icon used by Next.js metadata.
- `src/components/BrandMark.tsx` is the reusable interface component.
- `museion-logo-concept-imagegen.png` preserves the final image-generation concept; the application does not ship this raster image.

The production mark uses only `#2b4acb` lapis, `#fff9ed` ivory and `#d9a514` gold. Do not add gradients, shadows or extra internal detail. Preserve clear space of at least one quarter of the mark width.

## Image generation provenance

Use case: `logo-brand`. The final concept prompt asked for an original, softly asymmetrical learning-app symbol: an organic lapis form containing an ivory book/threshold and a small gold idea brought into view. It used Brilliant only as a reference for icon-scale simplicity, explicitly prohibited copying its contour, proportions, colors or composition, and excluded text, gradients, shadows and thin strokes. The generated concept was then manually reduced to three flat vector shapes for small-size legibility and deterministic reproduction.

![Image-generated Museion logo concept](museion-logo-concept-imagegen.png)
