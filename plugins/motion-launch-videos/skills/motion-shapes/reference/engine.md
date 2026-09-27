# Engine: the FILM config for shapes

Step 4. The film is one HTML file with one canvas. [../templates/film.html](../templates/film.html) holds the whole engine; for a new film you copy it to `videos/<film>/src/film.html` and edit only the `FILM` block at the top. The template runs as it is: a 10 s demo for a fictional to-do app. The core it sits on (springs, motion blur, the loop, the page API) is described in core.md; the fields every engine shares (`W H FPS DUR BPM loop blur palette fonts grid springs poster`) are listed there.

## Scenes

A film is a list of scenes. Each is drawn inside its window, in its own world (x = world x W), and holds layers drawn in order.

| Field | Meaning |
|---|---|
| `id` | unique name |
| `t0`, `t1` | the window the scene is drawn in. A transition extends the outgoing scene until the incoming one covers it |
| `world` | integer; the camera shows one world at a time and a `push` moves it (default 0) |
| `in` | how it arrives at `t0` (below) |
| `bg` | a palette role filling the scene's own background (default: none, the film's `bg` shows) |
| `wrap` | only on the hold loop's last scene, the lockup: `{ exit: 0, to: { scale: 0 }, spring: 'EXIT', stagger: 32 }`. Its layers are at rest at frame 0, leave at `exit` (staggered by layer), are hidden once gone, and come back with their own `enter` |
| `punch` | `{ at, z }`: a camera punch-in (1.06 is plenty), undone at the next scene's start |
| `exit` | `{ at, to, spring, stagger }` applied to every layer of the scene that has no `exit` of its own, staggered by layer order |
| `layers` | what is in it, below |

### Transitions (`in`)

| Kind | What happens |
|---|---|
| `'none'` | the scene just starts drawing at `t0`, over or after the outgoing one; use overlapping exits and entrances |
| `'cut'` | a hard cut: motion blur stops at it; the incoming scene should have something on screen at once |
| `{ kind: 'circle', x, y, spring }` | the incoming scene (on its `bg`) is revealed inside a circle growing from (x, y) until it covers the frame (MASK, about 0.3 s). Start it where the eye already is: the element that just landed |
| `{ kind: 'bars', n: 5, dir: 'up', color, stagger: 32, spring }` | `n` bars in `color` sweep in and cover the frame by `t0`, the scenes swap under them, and they sweep on out. `dir`: `up`, `down`, `left`, `right` |
| `'push'` | the camera springs a full width to the scene's world (PAN), both worlds in shot, streaked by motion blur |

## Layers

| Field | Meaning |
|---|---|
| `id` | unique across the film |
| `shape` | `circle` (`r`), `ellipse` (`rx`, `ry`), `rect` (`w`, `h`, `radius`), `poly` (`sides`, `r`), `star` (`points`, `r`, `inner` ratio), `arc` (`r`, `from`, `to` in degrees clockwise from 12 o'clock), `line` (`points: [[x, y], ...]` or `x1 y1 x2 y2`, `closed`), `path` (`d`: SVG path data, `size`: px across its longer side), `text` (below) |
| `x`, `y` | the layer's centre (its own 0,0; `line` and `arc` points are relative to it). Text: the anchor x and the baseline |
| `rot`, `scale`, `op` | rest rotation (degrees), scale and opacity |
| `fill`, `stroke`, `width` | palette roles for fill and stroke, and the stroke width in px (it scales with the layer) |
| `cap`, `join`, `dash` | stroke caps and joins (`round` by default), a dash pattern `[on, off]` in px |
| `trim` | the part of the stroke shown at rest, `[start, end]` from 0 to 1 (default `[0, 1]`) |
| `repeat` | copies, each with its own springs: `{ n, dx, dy, rot, scale }` in a row, `{ grid: [cols, rows], gap: [dx, dy] }` centred on x, y, or `{ radial: n, r, start, rotate }` round x, y (copies turn to face out unless `rotate: false`) |
| `morphs` | extra outlines, `[{ shape: 'rect', w, h, radius }, ...]`; the state `morph` moves between them (0 is the layer's own shape) |
| `loop` | behaviours that never stop: `spin: n` turns per loop, `sway: [n, degrees]`, `bob: [n, px]`, `pulse: [n, amount]`, `orbit: [n, radius]`, `march: n` (dash patterns per loop), `phase: 'index'` spreads copies over the cycle. `n` is cycles per DUR; whole numbers keep a cycle loop exact |
| `clip` | `[x0, y0, x1, y1]`: draw only inside this box (type rising from behind an edge) |
| `accent` | `'land'` (when the last copy lands) or a time: an accent frame for the stills and the palette gate |
| `bleed` | `true` exempts the layer from the live-area check |
| `enter`, `keys`, `exit` | the motion, below |

### Text layers

`shape: 'text'`, with `text`, `font` (a role in `FILM.fonts`), one size rule (`size` px, `cap` px of cap height, or `fit: true` to span the measure / `fit: <px>`), `track` and `pairs` (1/1000 em), `anchor` (`L`, `C`, `R`), `fill`, and `on` (the role it sits on, for the contrast check; default the scene's `bg`). Every glyph is a copy with its own springs, so `stagger` runs across the letters. `enter: { at, typed: true }` types it in one character per frame with a block cursor instead (small print).

## Motion: enter, keys, exit

Every animated value is a Prop: a rest value plus springs. A **state** names some of them:

| Key | Meaning |
|---|---|
| `dx`, `dy` | offset from rest, px |
| `rot` | degrees added to rest |
| `scale`, `sx`, `sy` | factors on the rest scale (`scale: 0` hides) |
| `op` | opacity (always on FADE) |
| `trim` | `[start, end]` of the stroke, or one number for `[0, end]` |
| `shift` | moves the trimmed segment round a closed outline (1 is one lap) |
| `fill` | fill opacity, 0 to 1 (on FADE): a stroke that draws on, then fills |
| `morph` | index into the layer's outlines; fractions are in between |
| `blur` | text only: px of blur that focuses on FOCUS |

- `enter: { at, from, spring, stagger, order }`: the layer sits in the `from` state until `at`, then springs to rest.
- `keys: [{ at, to, spring, stagger, order }]`: later targets, in time order.
- `exit: { at, to, spring, stagger, order }`: the last move.

`stagger` is a note value (16 is a 16th: 0.125 s at 120 BPM; 32 a 32nd; 8 an eighth); `order` is `index` (default), `reverse`, `center` (a ripple from the middle of a grid), `random` (seeded), `x` or `y`.

## Springs

The core's springs (springs.md) plus these:

| Name | ζ | ω | Settles (s) | Lands (s) | Overshoot | Use |
|---|---|---|---|---|---|---|
| POP | 0.45 | 22 | 1.616 | 0.104 | 20.5 % | shapes popping in from `scale: 0` |
| BOUNCE | 0.35 | 18 | 2.540 | 0.114 | 30.9 % | a playful, rubbery pop; settles late |
| SNAP | 0.80 | 40 | 0.500 | 0.104 | 1.5 % | quick, crisp moves, a spark leaving |
| SWING | 0.55 | 14 | 2.078 | 0.184 | 12.6 % | rotations, a tilt that settles |
| TRACE | 1 | 14 | 1.143 | 0.339 | none | a stroke drawing on |
| GLIDE | 1 | 12 | 1.333 | 0.395 | none | a slow move with no bounce, a trim's tail following |
| FILL | 1 | 8 | 2.000 | 0.593 | none | a progress ring or bar filling |

## Adding something the vocabulary lacks

First try shapes, repeats and paths: most icons are two to five primitives, and an SVG logo is one `path` per colour. If a picture needs its own drawing, add a layer type to the engine with its own props, measured in `disp`, drawn only from `t` and `q`, and listed in `visible`, so motion blur, stills and the critique know about it.
