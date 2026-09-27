# Changelog

## 2.0.0

Seven new styles, each its own skill in the same plugin, on a shared core.

- **New skills**: `motion-shapes` (flat 2D motion graphics: trims, morphs, repeaters, circle and bar wipes, SVG logos), `motion-cartoon` (an original mascot rig on twos with a boiling line, squash and stretch, follow-through, bubbles, a sign), `motion-3d` (a WebGL2 renderer with no libraries: extruded, bevelled type and SVG logos, primitives, soft shadows on a shadow-catcher floor, an orbit camera), `motion-charts`, `motion-pixel`, `motion-particles` and `motion-ui`. Each has its own engine, critique, docs and a rendered example.
- **A shared core** (`shared/core.js`): closed-form springs and Props, periodic helpers that loop exactly (`cyc`, `wave`, `loopNoise`), seeded randomness, glyph-by-glyph type layout, SVG path measurement, motion blur, and the plumbing of the critique and the page's API. `tools/sync.mjs` copies it into every template; `tools/check.mjs` checks the repo and, with `--smoke`, every demo.
- **Cycle loops.** Besides the hold loop (ending on a still copy of frame 0), a film can now keep moving through the seam: springs still settling at the end carry over it, periodic motion runs whole cycles, and `loopcheck` checks that the seam is as continuous as any other instant.
- **Scripts** (the same in every skill): `fonts.mjs` fetches the faces the film's own `@font-face` tokens name; `render.mjs` reads each film's loop kind, an optional strict-palette gate (pixel art), GIF hints (frames per drawing, nearest-neighbour scaling), and checks the background of a film without a flat one on its most common colour; Chromium runs WebGL on SwiftShader when there is no GPU.
- The kinetic-type skill, `motion-launch-videos`, is unchanged apart from the shared scripts; its films build and render as before.

## 1.0.3

No URL in the build script; README credits only the fonts.

## 1.0.2

Plugin icon, and the environment variables it reads, in writing.

## 1.0.1

Ready for the Claude plugin directory.

## 1.0.0

Kinetic-type launch bumpers from a brief.
