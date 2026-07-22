# Museion Build Week video

Editable Remotion source for the 2:09 Museion product demo. The composition is
1920x1080 at 30fps and keeps the original product capture local.

## Local assets

The following files are deliberately ignored by Git:

- `public/source/museion1-720-keyframes.mp4` — the optimized screen capture.
- `public/voiceover.mp3` — the final authorized voice track.
- `out/` — rendered review and final exports.

## Commands

```bash
npm install
npm run studio
npm run still
npm run render
```

The default composition renders a silent review cut. After an authorized
voiceover is available, set `voiceoverSrc` to `voiceover.mp3` through Remotion
input props and render again. The narration and timing guide live in
`VOICEOVER_SCRIPT.md`.

The public demo must not be uploaded as the hackathon version until the audio
clearly covers both Codex and GPT-5.6.
