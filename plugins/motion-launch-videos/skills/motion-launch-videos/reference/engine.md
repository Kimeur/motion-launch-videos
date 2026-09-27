# Engine: the contract and the FILM config

Step 4. The film is one HTML file with one canvas. [../templates/film.html](../templates/film.html) holds the whole engine; for a new film you copy it to `videos/<film>/src/film.html` and edit only the `FILM` block at the top. The template runs as it is: an 8 s demo for a fictional product. You do not need to touch the `<head>`: the build copies `FILM.title` into `<title>`, `palette.bg` into the page background and `W` x `H` into the `<canvas>` (literal values only), and the engine sets `document.title` again when it runs.

## The contract

- **`seek(t)` is a pure function of `t mod DUR`.** Same t, same pixels, whatever was drawn before. No timers, no `Date`, no `Math.random`, no `requestAnimationFrame` inside it, no state carried between calls. The stylesheet forces CSS transitions and animations off.
- **Everything that measures is done once**, in `window.ready`, after the fonts load: text layout, spring event lists, the mask anchor, scramble decks. Never measure inside `seek`.
- **Randomness is seeded.** `mulberry32(seed)` and one Fisher-Yates deck per glyph slot, seeded by line and slot. A new seed is a new look; the same seed is the same film.
- **Continuous motion reads the exact `t`; discrete state reads the quantised `q`.** `q = ceil(t x FPS) / FPS`, so every subframe of output frame n sees the same q. Typing, scramble glyphs, cursor blinks and misregistration offsets use q, so motion blur never averages two different letters.
- **The canvas is pinned to the CPU** (`willReadFrequently: true` on every context, from the first call). Chrome otherwise moves a canvas from GPU to CPU after repeated reads, and its antialiasing changes mid-render.
- **Caches are allowed only when they are a pure function of their key.** The glyph sprite cache (blurred glyphs drawn once into small canvases) is keyed by font, glyph, colour and quantised blur, so a hit and a miss give the same pixels.
- **Custom drawing obeys the same rules.** A scene's `draw(c, t, q, kit)` hook may read only its arguments.

## What the page exposes

| Name | What it is |
|---|---|
| `window.ready` | a promise; resolves once fonts, layout and timeline are built |
| `seek(t)` | draws the sharp frame at t |
| `renderFrame(n)` | draws output frame n with motion blur; returns the number of subframes used |
| `motionAt(n)` | `{ samples, disp }`: how far things move across frame n's shutter |
| `critique()` | the automated pre-pass checks (see review.md) |
| `stillsPlan()` | the frames worth looking at: each scene in and at rest, each accent |
| `layoutTable()` | measured sizes, ink boxes, baselines, mask anchors, cuts, accent frames, warnings |
| `inkGaps()`, `offPalette(frames, mode)`, `misFrames()`, `textByFace()` | the analysis behind the critique |
| `DURATION`, `FPS`, `WIDTH`, `HEIGHT`, `FILM_META` | film facts for the scripts |

Open the built file in a browser to preview it: it plays in real time, Space pauses, the arrow keys step one frame, `?t=3.5` opens paused at 3.5 s. `?capture=1` turns the preview off (the scripts use it).

## FILM, top level

| Field | Meaning |
|---|---|
| `title`, `alt` | page title (the build writes it into `<title>`); the canvas's accessible label (write the whole script in `alt`) |
| `W`, `H`, `FPS`, `DUR`, `BPM` | size in px, frame rate, duration in s, tempo. `beat(n)` and `bar(n)` convert to seconds |
| `palette` | `{ role: '#RRGGBB' }`; every colour in the film is a role name |
| `misPair` | `[left, right]` roles for misregistration |
| `misAlpha` | opacity of the merged misregistration layer, 0.4 by default; 0.6 to 0.7 on a light bg |
| `smearColor`, `scrambleColor` | roles for smear ghosts and scramble noise |
| `fonts` | `{ role: { family, weight } }`; each must match an `@font-face` rule in the `<style>` |
| `grid` | `{ margin, unit }`: live-area inset and baseline unit |
| `mono` | `{ size, track }` for crumbs (px, 1/1000 em) |
| `poster` | time of the poster frame (0 is the lockup at rest) |
| `scenes` | the beats, below |

## Scenes

| Field | Meaning |
|---|---|
| `id` | unique name |
| `world` | integer; the scene lives at x = world x W. The camera shows one world at a time and smash-pans between them |
| `t0`, `t1` | the window in which the scene is drawn. The engine extends the outgoing scene's window through a pan or a mask |
| `in` | how it arrives at `t0`: `'none'` (just appears), `'cut'` (hard cut, motion blur clamped), `'mask'` (revealed through an outgoing line's letterforms), `'pan'` (the camera springs to this world) |
| `mask` | for `in: 'mask'`: `{ line: '<id of a line in the outgoing scene>' }`. Optional `anchor: [x, y]`, `scale`, `dur`, `spring`; by default the anchor is the thickest point of the line's ink and the scale is solved to cover the frame |
| `punch` | `{ at, z }`: a punch-in on the camera (z 1.08 is plenty). It is undone at the next scene's start: instantly at a cut or mask, hidden inside the blur at a pan, eased back on EXIT when the next scene just appears |
| `wrap` | only on the last scene (the lockup): `{ exit: 0, dy: -880 }`. The scene is on screen at rest at frame 0 and leaves at `exit`; it must leave the canvas |
| `breath` | `{ t0, t1, amount }`: a sin-squared swell of the whole scene (0.012 is enough); lands on exactly 1 |
| `lines`, `rules`, `crumbs` | what is in it, below |
| `draw(c, t, q, kit)` | optional escape hatch, drawn last in the scene's world coordinates. `kit` has `W H FPS DUR col rect fillGlyph monoText setFont fontStr S SP frameOf typed mulberry32`. Set `active: [[a, b]]` to the windows where it moves, so static frames stay 1-sample fast |

## Lines (per-glyph display type)

| Field | Meaning |
|---|---|
| `id`, `text` | unique id; the text (spaces allowed) |
| `font` | a role from `FILM.fonts` (default `'display'`) |
| size: `fit` or `size` or `cap` | `fit: true` solves the size so the ink spans the live measure (or `fit: <px>`); `size: <px>`; `cap: <px>` solves the size from a cap height |
| `track` or `justify` | tracking in 1/1000 em; or `justify: <px>` solves the tracking so the ink spans that width at a fixed size |
| `pairs` | optical pair corrections, `{ 'XA': 40 }` in 1/1000 em, on top of the font's own kerning |
| `x`, `anchor` | `'L'` (default, x = left margin), `'R'` (x = right margin), `'C'` (x = centre); x is where the ink edge or centre lands |
| `baseline` | px, on the grid |
| `color` | a palette role |
| `enter` | `{ at, from, spring, blur, stagger, order, smear, pop }`. Each glyph starts at `at + stagger x slot`, rises from `from` px (negative drops from above), fades in on FADE, focuses from `blur` px. `stagger` is a note value: 16 is a 16th, 32 a 32nd, 0 all at once. `smear: true` draws ghosts behind fast glyphs. `pop: true` skips the fade: the glyph is at full opacity from its start, for a line that must be on screen the frame a cut lands (only at a cut; anywhere else it is a visible pop) |
| `exit` | `{ at, dy, spring, stagger }`; hidden once it has left the canvas |
| `scramble` | `{ snap, dir }`: noise glyphs (a new one every 2 frames) until the `snap` frame, then the true letters |
| `mis` | `'land'` (the last glyph's landing), `'snap'` (the scramble snap), a time, or an array. A mask wipe gets its own accent on its first frame automatically |
| `clipY` / `clipBelow` | visible only above / below this y (type rising from behind a rule) |
| `bleed` | `true` exempts the line from the live-area check |

A line without `enter` is on screen for its whole scene (useful for text a mask reveals).

## Rules (rects)

`{ id, x0, x1, y, h, color, draw: { at, spring, from: 'L' | 'R' | 'C' }, exit, mis }`. `draw` grows the rule from one end on a spring.

## Crumbs (typed small print)

`{ id, text, at, x, anchor, baseline, color, cursor, clear, blink, exit }`. Types one character per frame from `at` with a block cursor; `clear` backspaces from that time; `blink: [t0, t1]` blinks the cursor at 2 Hz after typing.

## Worlds and the camera

`screen = C + z x (world - C - cam_x)`, with C the canvas centre. `cam_x` is `world x W` of the current scene; a `pan` springs it on PAN (settles in 0.49 s), a cut sets it. The camera must end the film in the world and at the zoom it starts with (the wrap scene's world, z = 1); the engine warns otherwise and loopcheck fails.

## Adding something the vocabulary lacks

First try to express it with lines, rules and crumbs. If you need a new element (a waveform, an orbit of crumbs, a logo path), use the scene's `draw` hook, keep every input a function of `t` and `q`, seed any randomness, and declare its `active` windows. If it recurs, promote it into the engine with its own props, so motion detection, stills and the critique know about it.
