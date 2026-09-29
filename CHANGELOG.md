# Changelog

## 2.1.0

Three new styles, every style in three formats, sound, transparency, and a guide to what each video is for.

- **New skills:**
  - `motion-photo`: product and photo reels from the user's own images (Ken Burns crops, parallax cutouts, carousels, a before/after slider, mosaics, price and feature tags). Its critique checks image resolution, text contrast on the pixels behind it and subjects kept in every crop.
  - `motion-captions`: captioned clips from the user's own voice-over, podcast or interview (pop captions, a karaoke line, subtitles, an audiogram), from word-level JSON, SRT or VTT, every word lit on the frame it is said. Its critique checks that every word is shown unchanged, reading speed, the platforms' safe zones and the voice's alignment.
  - `motion-overlays`: lower thirds, title and chapter cards, social handles, end screens, corner bugs, callouts and badges for video editors, delivered with transparency.
- **Formats.** Any film renders at 1:1, 9:16, 16:9 or 4:5 with `--format`. Positions follow pins (the centre or an edge), `FILM.formats` patches what a frame needs laid out differently, and every engine and demo is designed for all three standard formats; each example has posters at 9:16 and 16:9. A composition row in the critique fails content left in a corner of a frame it was not designed for.
- **Sound.** `FILM.audio` mixes the user's own music or voice-over with sound effects synthesised in the page from the film's cues, accents and cuts: deterministic, wrapping round the loop, normalised to a loudness target and checked by `verify`.
- **Transparency.** `FILM.transparent` renders ProRes 4444 and VP9 with alpha for editors, with motion blur that keeps edge colours.
- **Video types.** `video-types.md`, linked from every skill, matches 18 kinds of video (feature highlight, what's new, app store preview, testimonial, event promo, countdown, intro, ad...) to their length, formats, beats and styles, with the platforms' formats and safe zones.
- **Checks.**
  - `loopcheck` compares the step from the last frame to frame 0 with the film's other frame steps, block by block and tile by tile, which catches seams in motion drawn from the frame number, and measures the 0.1 ms step on block averages so moving photos cannot fool it.
  - Images and audio embed with `__ASSET:path__`.
  - CI (`.github/workflows/check.yml`) runs the repo checks on every push and the smoke test at every format weekly.
- **Fixes:**
  - option values are no longer read as times in `at`, `frame` and `mp4frames`;
  - GIFs keep a 480x480 GIF's pixel count at any format;
  - the cartoon sign no longer leaves an ink dot as it vanishes;
  - `verify` compares first and last frames only in a hold loop.

## 2.0.0

Seven new styles, each its own skill in the same plugin, on a shared core.

- **New skills**: `motion-shapes` (flat 2D motion graphics: trims, morphs, repeaters, circle and bar wipes, SVG logos), `motion-cartoon` (an original mascot rig on twos with a boiling line, squash and stretch, follow-through, bubbles, a sign), `motion-3d` (a WebGL2 renderer with no libraries: extruded, bevelled type and SVG logos, primitives, soft shadows on a shadow-catcher floor, an orbit camera), `motion-charts`, `motion-pixel`, `motion-particles` and `motion-ui`. Each has its own engine, critique, docs and a rendered example.
- **A shared core** (`shared/core.js`): closed-form springs and Props, periodic helpers that loop exactly (`cyc`, `wave`, `loopNoise`), seeded randomness, glyph-by-glyph type layout, SVG path measurement, motion blur, and the plumbing of the critique and the page's API. `tools/sync.mjs` copies it into every template; `tools/check.mjs` checks the repo and, with `--smoke`, every demo.
- **Cycle loops.** Besides the hold loop (ending on a still copy of frame 0), a film can now keep moving through the seam: springs still settling at the end carry over it, periodic motion runs whole cycles, and `loopcheck` checks that the seam is as continuous as any other instant.
- **Scripts** (the same in every skill): `fonts.mjs` fetches the faces the film's own `@font-face` tokens name; `render.mjs` reads each film's loop kind, an optional strict-palette gate (pixel art), GIF hints (frames per drawing, nearest-neighbour scaling), and checks the background of a film without a flat one on its most common colour; Chromium runs WebGL on SwiftShader when there is no GPU.
- **Fixes that reach every skill, the kinetic one included.** The film canvas has an alpha channel: on an opaque canvas Chromium drew text with red and blue LCD subpixel fringes whatever `--disable-lcd-text` said, so text is now antialiased in grey, the same on every machine. `fonts.mjs` fetches several weights of one family in one run (the second used to stop it). `--gif-colors N` gives N colours (ffmpeg's palettegen keeps one entry for transparency).
- The kinetic-type skill, `motion-launch-videos`, keeps its own engine and docs; apart from the shared scripts and the canvas fix above, its films build and render as before.

## 1.0.3

No URL in the build script; README credits only the fonts.

## 1.0.2

Plugin icon, and the environment variables it reads, in writing.

## 1.0.1

Ready for the Claude plugin directory.

## 1.0.0

Kinetic-type launch bumpers from a brief.
