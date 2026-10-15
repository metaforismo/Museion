# Original product imagery

Generated for this local redesign with the built-in `image_gen` tool. The supplied Genie video/style text informed light, spacing and material direction; no brand artwork or competitor character was copied. The original PNGs are preserved in `source/`; browser assets are transparent WebP derivatives. The built-in tool did not expose a model identifier, so no specific model version is asserted here.

## Reusable generation briefs

**Maia:** An original learning companion shaped like a living pocket notebook. Periwinkle blue rounded book body, ivory page face and folded page ears, a small yellow bookmark tuft, navy expressive eyes, tiny arms and feet. Friendly, thoughtful, recognisable at small UI sizes; a tactile matte clay3D object in soft daylight, transparent background, generous clean margin, no text or logo. Avoid an apple, owl or generic blob. The attentive image is the identity reference for expression edits. Keep body proportions, face, colours, materials and lighting invariant; change only expression and pose: curious/questioning, thinking, small celebration, gentle redirection after a mistake.

**Hero:** Original floating study still life: an open pale notebook, cobalt orbital model, mint geometric objects and lavender ribbon, a small warm yellow spark. Soft daylight, matte clay surfaces, airy composition with generous margins and a real transparent background. No readable text, branding, watermark or UI.

**Sources:** A matching still life of a study notebook, blank source pages, folder, pencil and paperclip. Matte pastel clay surfaces, cobalt/periwinkle with mint, pale sky and yellow accents. Wide1536×1024 composition, transparent background, no text or logo.

**Course covers:** A single clear tactile learning metaphor, centered square composition, generous margin, transparent background. Soft daylight, matte clay texture, restrained cobalt, periwinkle, mint and warm yellow palette. No text, numbers, labels or UI. Subjects are listed below. Each cover was generated separately; coordinated colour/light constraints were repeated across prompts.

| Asset | Subject / expression | Runtime path |
| --- | --- | --- |
| Maia attentive | Calm, welcoming notebook companion | `public/brand/maia/maia-book-attentive.webp` |
| Maia curious | Questioning, attentive pose | `public/brand/maia/maia-book-curious.webp` |
| Maia thinking | Thoughtful pose, same identity | `public/brand/maia/maia-book-thinking.webp` |
| Maia celebrating | Small, joyful celebration | `public/brand/maia/maia-book-celebrating.webp` |
| Maia redirecting | Encouraging redirection | `public/brand/maia/maia-book-redirecting.webp` |
| Learning world | Open notebook and study objects | `public/landing/learning-world.webp` |
| Learning tools | Sources, folder and writing tools | `public/landing/learning-tools.webp` |
| Algebra | Balance beam with spheres and cubes | `public/landing/product/course-algebra-as-balance.webp` |
| Search | Nested boxes illustrating narrowing | `public/landing/product/course-search-by-halving.webp` |
| Probability | Bowl and coloured beads | `public/landing/product/course-probability-as-evidence.webp` |
| Functions | Curved ramp and ball | `public/landing/product/course-functions-as-change.webp` |
| Claims | Magnifying glass over a paper | `public/landing/product/course-claims-to-evidence.webp` |
| Samples | Group of pebbles and selection ring | `public/landing/product/course-samples-to-conclusions.webp` |
| Biology | Plant and seed | `public/landing/product/course-natural-selection.webp` |
| Physics | Orbital rings and spheres | `public/landing/product/course-forces-and-motion.webp` |
| Cloud finale | Notebook Maia leaning on the original cloud landscape | `public/landing/footer-maia-cloud-scene-v2.webp` |

Course art maps through `src/lib/design/assets.ts`. Proportional reasoning shares the balance metaphor, and recursion shares the nested-box metaphor. These are illustrations, not scientific diagrams or generated learning evidence.

## Delivery

Maia and course covers are resized to640px WebP with preserved transparency; landing still lifes keep their wide aspect ratio. Next Image provides responsive sizing for large landing/course assets. Character states use the shared `MaiaCharacter` component with brief optional entry motion. The restored immersive landing retains its floating illustrations and scroll transitions. Reduced-motion preferences are honoured.

The six original subject PNG illustrations are also preserved. Their 256×256 transparent WebP derivatives live in `public/landing/subjects/`, totaling about66KiB. They are served directly with eager loading for the scroll scene; this is a delivery optimization of existing artwork, not new generated imagery.

Prompts above record the final design briefs rather than a verbatim transcript of tool calls. Original PNGs preserve the selected generated outputs for future refinement.

## Cloud finale identity edit

The immersive landing retains its original cloud landscape. Only the central mascot was replaced using the built-in image tool, with `footer-maia-cloud-scene-v1.webp` as the edit target and `maia-book-attentive.webp` as the identity reference. The generated original is `source/footer-maia-cloud-scene-v2.png`; the runtime derivative is a 1672×941 transparent WebP, about 79 KiB. The v1 asset remains preserved.

Final tool prompt:

> Use case: precise-object-edit / compositing. Asset type: transparent wide website footer illustration. Image 1 is the EDIT TARGET: preserve its continuous fluffy white cloud bank, blue soft shadows, camera, framing, and transparent upper backdrop. Image 2 is the CHARACTER IDENTITY reference to insert. Change ONLY the blue flame-shaped central mascot into Maia from image 2: a cobalt blue friendly rounded pocket notebook, cream page face with dark oval eyes, folded ivory paper ears and yellow bookmark tuft, small blue arms. Render this same notebook character leaning on the original cloud bank, looking at the viewer with an inviting smile, hands resting naturally on the front clouds, lower body concealed by the clouds. Maintain original central scale and balance with substantial transparent space above the clouds at both sides. Keep the cloudscape full-width and unchanged in style, including rounded edge clouds and luminous white foreground. Match the original soft matte 3D illustration lighting, cream/cobalt/periwinkle palette. No flame character, no text, no icons, no extra objects, no watermark. True alpha transparency outside the cloudscape and character. Preserve the wide approximately 16:9 canvas.

## Auth landscape — 3 October 2026

Generated with the built-in `image_gen` tool; its model identifier is not exposed. Original source: `source/auth-scene-v1.png`. Runtime: `public/landing/auth-scene-v1.webp`, 960×1440, opaque WebP, 48,286 bytes, quality88. This is original background art; headings, fields, and verification remain real HTML.

Exact generation prompt:

> Use case: stylized-concept. Asset type: original portrait background illustration for the RIGHT side of Museion signup/login, in a two-column learning app. Create an imaginative soft daylight learning landscape in matte clay 3D: a small open cobalt-blue notebook resting on floating rounded periwinkle and pale mint platforms, one delicate orbital ring with a sphere, a curled pale paper path weaving down through the platforms, a few tiny blue geometric study objects. Composition: vertical portrait, visual objects concentrated in lower half and lower-right, top 45 percent airy near-white cool sky with very faint periwinkle atmospheric gradient and no foreground objects so real HTML headline can be placed there. Gentle curved cloud forms at the lower edge, generous quiet space, careful soft contact shadows and tactile paper edges. Palette: cobalt, periwinkle, white, pale mint, a single small warm yellow bookmark accent; NO cream/yellow background. Polished handcrafted visual identity, calm but curious, playful sophistication, clear silhouette, restrained detail. No mascot or human figure (Maia will be a separate reusable UI layer), no text, equations, labels, logos, letters, UI panels, watermark or borders. Opaque cool near-white to pale blue background, portrait framing.
