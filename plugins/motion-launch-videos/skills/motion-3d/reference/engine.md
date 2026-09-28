# Engine: the FILM config for 3D

Step 4. The film is one HTML file with one canvas. [../templates/film.html](../templates/film.html) holds the whole engine, a small WebGL2 renderer with no libraries; for a new film you copy it to `videos/<film>/src/film.html` and edit only the `FILM` block at the top. The template runs as it is: a 10 s demo of a fictional wordmark. The core it sits on (springs, motion blur, the loop, the page API) is described in core.md; the fields every engine shares (`W H FPS DUR BPM loop blur palette fonts grid springs poster`) are listed there.

World units are arbitrary; y is up and the floor is at y = 0. With the template's camera (30 degree field of view, 16.5 units away) the frame is about 8.8 units tall at the target.

## World

| Field | Meaning |
|---|---|
| `world.light` | `{ dir: [x, y, z], key, ambient, soft }`: the direction the key light travels (from above, front and right: `[-0.38, -0.8, -0.9]`), its strength, the ambient level, and how soft the shadow edges are (texels) |
| `world.floor` | `{ y, shadow }`, or `false`: a shadow catcher. It is drawn in the background colour and darkened by `shadow` (0 to 1) where shadowed, so floor and background meet with no horizon |
| `world.rim` | a white edge light on surfaces turned away from the camera, 0 to 0.3 |
| `world.shadowBox` | half the width of the area that casts shadows, units (default 9) |

Shading keeps hue: a surface is its palette colour times a light level, plus white highlights (gloss) and rim. Nothing tints it toward another colour.

## Camera

`camera: { fov, target: [x, y, z], dist, yaw, pitch, sway: [n, degrees], orbit: n, keys: [...] }`: an orbit camera looking at `target` from `dist` units, turned `yaw` degrees round the vertical and `pitch` degrees above the horizon. `sway` swings the yaw back and forth n times per loop; `orbit` turns it a whole n times per loop. `keys: [{ at, yaw, pitch, dist, fov, target, spring }]` move it on springs (DOLLY by default); the last key must return every value to where it started. `fit` and `subject` set how the camera frames other formats (below).

## Objects

| Field | Meaning |
|---|---|
| `id`, `kind` | unique name; `text`, `path`, `box`, `sphere`, `torus`, `cylinder`, `cone`, `capsule` |
| geometry | `text`: `text`, `font` (a role), `cap` (cap height in units), `track`, `pairs`, `depth`, `bevel`. `path`: `d` (SVG path data), `size` (units across its longer side), `depth`, `bevel`, `rule` (`nonzero` or `evenodd`). `box`: `size: [x, y, z]`, `radius` (rounded edges). `sphere`: `r`. `torus`: `r`, `tube`. `cylinder`, `cone`: `r`, `h`. `capsule`: `r`, `h` |
| `color`, `side` | palette roles: the faces, and (for text and paths) the walls and bevels |
| `gloss` | 0 (matte) to 1 (glossy highlight) |
| `toon` | `true`: three flat light bands instead of smooth shading |
| `pos`, `rot`, `scale` | rest position (units), rotation (degrees about x, y, z, applied z then y then x), scale |
| `repeat` | copies: `{ radial: n, r, start }` round the vertical axis (each turned to face out), or `{ n, dx, dy, dz }` in a row |
| `enter`, `keys`, `exit` | motion on springs (below) |
| `loop` | never-ending motion: `spin: ['y', n]` (n turns per loop about a local axis), `orbit: [n, 0]` (n turns about the world's vertical axis), `bob: [n, units]`, `wobble: [n, degrees]`, `phase: 'index'` (spread copies over the cycle) |
| `shadow` | `false`: casts no shadow |

A text object is one solid per glyph, so every glyph is a copy with its own springs: a `stagger` runs across the letters, and a glyph turns about its own centre. Type is extruded from the font itself: each glyph is drawn large, traced to outlines, triangulated with its holes, and given walls and a bevel. A `path` goes through the same steps, so any SVG logo becomes a solid.

### States

`from` and `to` hold `dx`, `dy`, `dz` (units from rest), `rx`, `ry`, `rz` (degrees added) and `scale` (a factor; 0 hides). `enter: { at, from, spring, stagger, order }` holds the `from` state until `at`, then springs to rest; `keys: [{ at, to, spring, stagger, order }]` are later targets in time order; `exit: { at, to, spring }` is the last. A rotation that ends a whole turn from where it started is folded back once it settles, so a flip of -360 closes the loop.

### Flat labels

`labels: [{ id, text, font, size or cap, track, anchor, x, y, pin, color, on, enter: { at }, exit: { at } }]`: sharp 2D type drawn over the picture, for small print and the call to action. Canvas pixels of the base format, on the 8 px grid, faded in and out on FADE. `pin` says how a label follows another format (below).

## Formats

One FILM renders at 1:1, 4:5, 9:16 and 16:9 with `--format` (core.md, Formats). The engine adapts three things by itself:

- **Framing.** The field of view is vertical, so a frame narrower than the base (4:5, 9:16) would crop the sides of a scene framed for a square. The camera pulls back until the subject's bounding sphere fills the same share of the frame's narrower side as it did in the base format: the word keeps its width, and the taller frame shows more floor above and below it. The subject is every `text` and `path` object at rest (`camera.subject: ['ACME']` names others); the pull-back multiplies `dist` at every moment, keys included. A frame wider than the base keeps the height of the view and shows more of the world at the sides. `camera.contain: ['RING', 'ORB']` names objects whose whole sweep must stay in the frame (an orbit or a spin about the vertical axis sweeps a disc, a bob adds height), with half a margin to spare at the camera's closest key: the camera pulls back further when the word's fit would crop them. `camera.fit: false` turns all of this off and takes the camera as written.
- **The floor and the background.** The shadow catcher and the far plane grow with the pull-back, so the floor still reaches past the edge of every frame, and the background fills the canvas. The floor in full shadow counts as background for the composition check (the engine declares it as a `backdrop`), so shadows do not weigh on the balance.
- **Labels.** Each label's `x` and `y` go through `fmtX` and `fmtY` with its `pin`: none keeps its offset from the centre (it stays with the hero), `'b'` its distance from the bottom edge, `'t'`, `'l'`, `'r'` likewise, `'bl'` both. A baseline moved by the format moves by whole grid units, so it stays on the 8 px grid.

Then design each format with a patch, `formats: { '9:16': {...}, '16:9': {...} }`, whose values are in the same terms as the base (world units, base-format pixels): objects and labels merge by `id`, `camera.keys` is replaced whole. The demo's patches:

| | 9:16 (1080 x 1920) | 16:9 (1920 x 1080) |
|---|---|---|
| camera | pitch 30 (the ring opens into a tall ellipse), target y -0.3 (the scene sits a little above the middle), `contain: ['RING', 'ORB']`: pulled back until the ring and the orbs' orbit stay whole and centred | dist 14, dolly to 13: closer, the ring spans two thirds of the width; target y 0.15 |
| ORB | rest y 1.2, bob 0.8: the orbs rise through the extra height | as at 1:1 |
| labels | URL y 848, DEMO y 912 (1272 and 1336 in the tall frame), under the ring | as at 1:1 |

Run `stills` and `loopcheck` with `--format` for every format you deliver: the live-area row catches type the framing lost, the composition row a scene that sits to one side.

## Springs

The core's springs (springs.md) plus these:

| Name | ζ | ω | Settles (s) | Lands (s) | Overshoot | Use |
|---|---|---|---|---|---|---|
| FLIP | 0.55 | 12 | 2.424 | 0.215 | 12.6 % | a letter turning over, with a little swing past |
| HOP | 0.80 | 22 | 0.909 | 0.189 | 1.5 % | a quick lift |
| SETTLE | 0.62 | 9 | 2.867 | 0.317 | 8.4 % | a heavy object coming to rest |
| DOLLY | 1 | 3.2 | 5.000 | 1.482 | none | slow camera moves (they carry over the seam in a cycle loop) |

## The renderer

- A shadow pass renders depth from the light (1024 px, orthographic over `shadowBox`), sampled with 4 filtered taps (16 depth tests) spread by `soft` for soft edges.
- The main pass draws into a 4x multisampled buffer, resolved and drawn onto the film's canvas, then the flat labels on top.
- Colours are converted from sRGB to linear for lighting and back to sRGB exactly.
- Motion blur is the core's: each subframe is a full render, averaged.

## Adding something the vocabulary lacks

A new primitive is a function returning a mesh (`grid(nu, nv, f)` builds any parametric surface with its normals); add it to `geometryOf`. A new loop behaviour goes in `modelOf`, as a function of `t` with whole cycles per loop, listed in `cycles()`.
