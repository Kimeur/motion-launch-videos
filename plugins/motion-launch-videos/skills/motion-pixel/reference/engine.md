# Engine: the FILM config for pixel art

Step 4. The film is one HTML file with one canvas. [../templates/film.html](../templates/film.html) holds the whole engine; for a new film you copy it to `videos/<film>/src/film.html` and edit only the `FILM` block at the top. The template runs as it is: a 10 s title-screen loop for a fictional game. The core it sits on (springs, the loop, the page API) is described in core.md; the fields every engine shares (`W H FPS DUR BPM loop palette springs poster title alt`) are listed there.

## How a frame is made

The engine draws into an indexed framebuffer of `px.w x px.h` logical pixels, each one a palette index, then scales it up by `px.scale` into the canvas, pixel by pixel, and writes it with `putImageData`. No canvas path, text or smoothing is ever involved, so every output pixel is exactly one palette colour and nothing can antialias. Every position is rounded to a whole logical pixel every frame, and everything reads the frame's own time `q`, not the exact `t`: a pixel film is a function of its frame number. Motion blur is off (`blur: false`).

## FILM fields

| Field | Meaning |
|---|---|
| `W`, `H` | the output size: `px.w x px.scale` by `px.h x px.scale` |
| `px` | `{ w, h, scale, margin }`: the logical canvas, a whole (and even) scale, and the live-area inset in logical px (default 8). In another format the logical canvas follows the frame (Formats, below) |
| `blur` | `false`: one sample per frame. Blur would average pixels into colours outside the palette |
| `loop` | `'cycle'` (the template): the world keeps moving through the seam. `'hold'` works too, for a sting that ends still (every scroll, cycle and blink must stop first) |
| `palette` | `{ role: '#RRGGBB' }`, at most 16 roles. `bg` is the page background and fills any pixel nothing draws (in a scene with a sky, make it the sky's top) |
| `sprites` | named ASCII art, below |
| `glyphs` | `{ 'char': [7 rows] }`: adds a glyph to the bitmap font or redraws one (`'#'` ink, `'.'` blank, all rows one width) |
| `shake` | `[{ at, px, dur, hz }]` or `on: '<layer>'` instead of `at` (its first landing): a whole-pixel screen shake that decays over `dur` s, a new offset `hz` times a second (30) |
| `layers` | what is drawn, back to front, below |
| `gif` | `{ fps, width }` overrides the GIF hints (20 fps, the widest crisp width up to 720 px) |
| `backdrop` | the roles the composition row treats as background. By default the roles of every `sky`, `ridge` and `tiles` layer |
| `formats` | `{ '9:16': { ... }, '16:9': { ... } }`: a patch per format (Formats, below) |
| `poster` | the time of the poster frame |

`fonts` and `grid` are not used: text is the built-in bitmap font, and the live area is `px.margin`.

## Sprites

```js
hero: { fps: 12, key: { k: 'ink', s: 'skin', r: 'red' }, sheet: [
  '..kk.. ..kk..',     // every row holds every frame, one space apart
  '.kssk. .kssk.',
] },
coin: { key: { y: 'gold', k: 'ink' }, art: ['.kk.', 'kyyk', '.kk.'] },   // one frame
```

| Field | Meaning |
|---|---|
| `key` | `{ character: role }`. `'.'` is transparent and never in the key; any other character must be |
| `art` | one frame: an array of rows, one character per pixel, all rows one width |
| `sheet` | several frames side by side, one space between them on every row; frames share a size |
| `frames` | several frames as an array of `art` arrays |
| `fps` | the animation rate. Frame `i` shows at `drawing(q, fps) + phase`, so the cycle lasts `frames / fps` s, which must divide DUR in a cycle loop. 12 fps holds each drawing 5 frames at 60 fps; 8, 10, 15 and 20 are also even |

The critique fails a sprite whose frames or rows differ in size, or that uses a character not in its key.

## Layers

Every layer has an `id` and a `kind`. These fields work on any layer where they make sense:

| Field | Meaning |
|---|---|
| `pin` | how the layer's positions map into another format: none keeps their offset from the centre, `'t'`, `'b'`, `'l'`, `'r'` their distance from that edge (Formats, below) |
| `show` | `[t0, t1]`: drawn only from t0 until t1 (t0 after t1 wraps round the seam) |
| `shake` | `false` keeps the layer still when the screen shakes (sky and fill never shake) |
| `blink` | `[period, duty]`: on for `duty x period` of every period, counted from `show[0]`. The period must divide DUR |
| `cycle` | palette cycling (sprite, text): `{ of: 'gold', roles: ['gold', 'cream', 'white', 'cream'], fps: 12, band: 3 }`. Every pixel drawn in `of` steps through `roles` at `fps`; `band` offsets the step by one every `band` px along the diagonal, so bands of colour travel across it. A list cycles several roles. Period `roles.length / fps` |
| `bob` | `[n, px]`: bobs up and down `px` whole pixels, `n` whole cycles per loop (sprite). On text `[n, px, lag]`: `lag` radians per glyph turns the bob into a wave |

### Kinds

| Kind | Fields | What it draws |
|---|---|---|
| `sky` | `bands: [[y, role], ...]`, `dither` (rows, 4) | the whole frame in horizontal bands; each change of colour is Bayer-dithered over `dither` rows above it |
| `fill` | `color`, `op`, `enter` / `keys` / `exit` on `op` | the whole frame in one colour at a dithered opacity: fades to and from a colour |
| `strip` | `width`, `speed`, `place: [[sprite, x, y], ...]` | sprites placed along a band `width` px long that scrolls left at `speed` px/s and repeats (clouds, a castle, plants) |
| `ridge` | `width`, `speed`, `y`, `bumps: [[x, w, h], ...]`, `fill`, `edge` | rounded hills: half-ellipse bumps standing on the line `y`, filled to the bottom of the frame, with a 1 px `edge` along the top and down steep sides |
| `tiles` | `map: ['GHG...', ...]`, `tiles: { G: 'grassA' }`, `x`, `y`, `speed`, `extend` | a tile map (one character per tile, `'.'` empty) that scrolls and repeats every `columns x tile width` px; `extend` fills from its last row to the bottom of the frame (so a shake never shows a gap) |
| `sprite` | `sprite`, `x`, `y` (top-left), `scale`, `flip`, `phase`, `fps`, `jumps`, `air`, `dust`, `enter` / `keys` / `exit` | a character or prop, animated at its fps. `jumps: [{ at, h, dur }]` are parabolic hops `h` px high over `dur` s (a beat); `air` is the sprite shown while airborne; `dust: { sprite, speed }` plays once where the feet land and drifts back at the ground's speed |
| `items` | `sprite`, `by`, `line`, `speed`, `at: [t, ...]`, `y`, `pickup`, `burst`, `phase` | pickups riding the ground at `speed`, placed by the time each reaches the collection line: item `i` reaches it at `at[i]`. `by: 'HERO'` puts the line at the sprite's front edge; `y: 'path'` puts each item where that sprite will be at that moment (hops included); `pickup` hides it once it has been collected, until it comes round again, and `burst` plays once there. The world is `speed x DUR` px long, so each item passes once per loop |
| `text` | below | a line of the bitmap font |
| `sparkles` | `sprite`, `box: [x0, y0, x1, y1]`, `n`, `every`, `seed` | `n` one-shot twinkles spread over every `every` s, each at a seeded spot inside the box; the spots repeat every loop (`every` must divide DUR) |

Scrolling layers move left: the world goes by as the hero runs right (a negative speed scrolls a strip, ridge or tile map to the right; items always ride left). A layer at `speed` px/s moves `speed x DUR` px a loop, so its repeat (`width`, or the tile map's width) must divide that; the critique lists every period. Speeds of `FPS / n` or `n x FPS` px/s step evenly: at 60 fps, 60 (1 px a frame), 30, 20, 15, 12, 10.

## Text

| Field | Meaning |
|---|---|
| `text` | the characters (the bitmap font has caps, digits, punctuation and a few symbols; add others with `FILM.glyphs`) |
| `scale` | whole: each font pixel becomes `scale x scale` logical px. 1 for small print, 2 to 4 for titles |
| `x`, `anchor`, `y` | `x` is the left edge (`'L'`), centre (`'C'`) or right edge (`'R'`); `y` is the top of the caps |
| `track` | font px between glyphs (1) |
| `fill` | a role, or a list of roles split over the 7 font rows from top to bottom: `['cream', 'gold', 'gold', 'gold', 'gold', 'orange', 'orange']` is a classic title ramp |
| `outline` | a 1 logical px outline round the letters (8-neighbour; `round: true` for 4-neighbour, softer corners) |
| `depth`, `side` | `[dx, dy]`: a drop of the outlined letter in `side`, drawn only outside the letter so its counters stay open. `[0, 2]` reads as a slab under the title |
| `shine` | `{ at: [t, ...], dur, width, color }`: a diagonal glint `width` px wide sweeps across the fill in `dur` s at each time |
| `on` | the role behind text with no outline, for the contrast row |
| `bleed` | `true` exempts it from the live-area check |
| `enter`, `keys`, `exit` | per-letter motion, below; `stagger` runs across the letters |

Letters are drawn in three passes (every drop, then every outline, then every fill), so no letter's outline cuts into its neighbour's fill while they move.

## Motion: enter, keys, exit

Every letter of a text layer, and every sprite and fill layer, has three Props: `dx`, `dy` (whole pixels, rounded every frame) and `op` (opacity, drawn as an ordered 4 x 4 Bayer dither in the layer's own pixel size: a letter at scale 3 dissolves in 3 x 3 blocks).

- `enter: { at, from: { dy: -64 }, spring: 'DROP', bounce: true, stagger: 32, order }`: jumps to `from` at `at` (while it is hidden) and springs to rest. `bounce` mirrors `dy` to the side it came from, so an underdamped spring bounces off the rest line like a dropped ball instead of sinking through it.
- `keys: [{ at, to, spring }]`: later targets, in time order.
- `exit: { at, to: { op: 0 }, fade: 'DISSOLVE', stagger: 32 }`: the last move.
- `spring` moves `dx` and `dy` (LAND by default); `fade` moves `op` (FADE by default). `stagger` is a note value (32 is a 32nd); `order` is `index` (default), `reverse` or `random`.
- Each Prop starts from the state it ends in, so a cycle loop closes by construction: a title that dissolves at the end is invisible at frame 0 and drops in again. A layer that enters and never leaves is at rest before its entrance and pops (the critique warns).

## Springs

The core's springs (springs.md) plus these:

| Name | ζ | ω | Settles (s) | Lands (s) | Overshoot | Use |
|---|---|---|---|---|---|---|
| DROP | 0.40 | 11 | 3.636 | 0.197 | 25.4 % | a title dropping in with `bounce: true`: bounces of 25.4, 6.4 and 1.6 % of the drop, 0.31 s apart (a 96 px drop bounces 24, 6 and 2 px and rests, in whole pixels, 1.07 s after it starts) |
| HOP | 0.50 | 18 | 1.778 | 0.134 | 16.3 % | a quick pop into place, a prop springing up |
| SLIDE | 1 | 14 | 1.143 | 0.339 | none | a slide in or out with no bounce |
| DISSOLVE | 1 | 12 | 1.333 | 0.395 | none | a dithered fade you can watch (FADE takes 0.15 s) |

In whole pixels a spring rests well before it settles (the last sub-pixel wobble rounds to 0), but the hold loop's tail is measured from the settle time.

## Time: q, not t

Every position, frame, blink, glint and twinkle reads `q`, the output frame's own time. Periodic things and their periods, which the critique checks are whole per loop:

| What | Period |
|---|---|
| a scroll | `width / speed` (`speed x DUR` must be a multiple of the width) |
| a sprite's animation | `frames / fps` |
| items on the ground | `speed x DUR / speed` = DUR, by construction |
| `blink` | its period |
| `cycle` | `roles.length / fps` |
| `bob` | `DUR / n` |
| `sparkles` | `every` |

Hops, shakes, glints, dust and bursts are one-shots placed in the loop; each wraps round the seam if it straddles it.

## The bitmap font

5 x 7 caps: A to Z, 0 to 9, space and `. , : ; ! ? ' ’ " - – + = / ( ) [ ] < > & # % * _ @ $ €`, plus `♥ ★ → ← ▶ ·`. Most glyphs are 5 px wide; I, 1 and most punctuation are narrower (proportional). A glyph advances by its width plus `track`. There is no lowercase: a character outside the font fails the `glyphs` check, and `FILM.glyphs` adds it. A text layer's caps are `7 x scale` logical px, `7 x scale x px.scale` output px: at x6, scale 1 is 42 px, legible in a feed; the critique fails anything under 35.

## Formats

The film is authored on its base canvas (180 x 180 at x6) and renders at 9:16 or 16:9 with `--format` (core.md, Formats). The core sizes the output by the short side (1080 x 1920, 1920 x 1080), and the logical canvas follows it at the same scale: 180 x 320 and 320 x 180 at x6 (4:5 is 180 x 225). A format's patch may set `px: { w, h }` itself; keep `px.scale` the same in every format.

Positions stay in the base canvas's logical px and map by each layer's `pin`, rounded to whole pixels:

| `pin` | x | y |
|---|---|---|
| none | keeps its offset from the centre | keeps its offset from the centre |
| `'l'`, `'r'` | keeps its distance from that edge | |
| `'t'`, `'b'` | | keeps its distance from that edge |

What maps: the sky's band edges, a strip's placed `y`s, a ridge's `y`, a tile map's `y`, a sprite's `x` and `y`, an items layer's `line` and numeric `y`, a text's `x` and `y`, a sparkles `box`. Positions along a scrolling layer (a strip's placed `x`s, a ridge's bumps, a tile map's `x`) are places in the world, not on the screen: they do not map, and every scrolling layer fills whatever width the frame has. Motion (`enter`, `keys`, `exit`, hops) is relative and does not map either.

The template pins the world to the bottom (sky, castle, hills, ground, plants, the hero: `pin: 'b'`), hangs the clouds from the top (`'t'`), and leaves the title and its sparkles centred, so a tall frame gains sky above the world and a wide one gains world on both sides. The engine lists the sky's, the hills' and the ground's roles as backdrop, so the composition row measures what stands in front of them: the title, the hero, the coins, the clouds and the props.

Pins keep the square layout intact; a patch in `FILM.formats` uses the new space. The template's:

```js
formats: {
  '9:16': {
    layers: [
      { id: 'ACME', scale: 4, x: 90, y: 0, enter: { from: { dy: -120 } } },
      { id: 'QUEST', scale: 5, x: 90, y: 34, enter: { from: { dy: -160 } } },
      { id: 'TWINKLE', box: [12, -10, 168, 84] },
      { id: 'START', y: 88 }, { id: 'URL', y: 88 },
    ],
  },
  '16:9': {
    layers: [
      { id: 'CASTLE', width: 300, speed: 30, place: [['castle', 70, 90]] },
      { id: 'FAR', width: 300, speed: 30, bumps: [[18, 64, 14], [78, 90, 26], [160, 70, 20], [236, 84, 16]] },
      { id: 'ACME', y: 28 }, { id: 'QUEST', y: 56 },
      { id: 'TWINKLE', box: [16, 20, 164, 96] },
      { id: 'START', y: 96 }, { id: 'URL', y: 96 },
    ],
  },
},
```

- **9:16.** 140 more rows, all sky. The title goes up a scale (ACME x4, QUEST x5: 147 px wide in a live width of 164) and fills the open sky; centred, base y 0, 34 and 88 land at 70, 104 and 158. A drop is relative: 96 px above a title that now rests at y 104 is on screen, so the letters drop from 160 px up instead.
- **16:9.** 140 more columns. A layer at 20 px/s repeats every 200 px, so across 320 px the castle would show twice most of the time: the far hills and the castle move to 30 px/s (a 300 px repeat), where both copies are on screen only while one leaves at the left edge and the other enters at the right, 1.2 s a loop. The castle is placed to stand clear of both edges at the poster frame. The title sits lower, over the hills, which also balances the composition.
- Patch numbers are base-canvas px too, mapped by the same pins; `layers` merge by `id`, and any array without ids (`bumps`, `place`) is replaced whole.

Check every format you deliver: `render.mjs stills videos/<film> --format 9:16` runs the critique at that format (the pixel grid, the live area on the new canvas, the composition row) and writes `stills/9x16/`.

## The GIF

The engine asks the render for a nearest-neighbour GIF with no dither, at the widest multiple of `px.w` that divides the output evenly and is at most 720 px (180 wide at x6: 540 px, 3 GIF pixels per logical pixel; 320 wide in 16:9: 640 px), 20 fps, and exactly `palette size` colours (the render adds the entry ffmpeg's palettegen keeps for transparency, so no two palette colours merge into a third).

## Adding something the vocabulary lacks

First try sprites, strips and tiles: most scenery is a sprite placed on a strip. If a picture needs its own drawing, add a kind to the engine: a `BUILD.<kind>(L)` that resolves its roles with `ix(role)` (palette indices, registered for the palette check) and a `DRAW.<kind>(L, q, sx, sy)` that writes indices into `FB` at whole pixels from `q` alone, offset by the shake `(sx, sy)`. Report its periods in `cycles()` and its one-shots in `lastChange()`, and list anything that is not a whole pixel in `ODD`.
