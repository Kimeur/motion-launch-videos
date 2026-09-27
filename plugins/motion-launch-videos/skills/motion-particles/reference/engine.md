# Engine: the FILM config for particles

Step 4. The film is one HTML file with one canvas. [../templates/film.html](../templates/film.html) holds the whole engine; for a new film you copy it to `videos/<film>/src/film.html` and edit only the `FILM` block at the top. The template runs as it is: a 12 s cycle loop for a fictional product. The core it sits on (springs, the loop, the page API) is described in core.md; the fields every engine shares (`W H FPS DUR BPM loop blur palette fonts grid springs poster`) are listed there.

A swarm of particles moves through a chain of **formations** (where particles can be) by **moves** (when, how fast, in what order). Every particle's position is a pure function of t: the sum over formations of a weight times the particle's position in that formation. A move adds its spring's progress to the weight of the formation it goes to and takes the same from the one it leaves, one spring per particle, so moves superpose exactly like the core's Props.

## The swarm: `FILM.swarm`

| Field | Meaning | Demo |
|---|---|---|
| `n` | particles in the film, 2000 to 8000 (render time and GIF bytes grow with it) | 4600 |
| `seed` | every random choice (homes, depth, delays, jitter) is keyed by it | 7 |
| `size` | particle radius in px at `dot: 1` | 1.4 |
| `streak` | `{ min, gamma, max }`: a streak L px long on a dot d px wide draws at alpha x `max(min, (d / (d + L))^gamma)`; `max` (480 px) is a jump, drawn as a dot | `{ min: 0.2, gamma: 0.55 }` |
| `glow` | bloom, or `false`: `{ gain, radius, size, floor, keys }`. The particles are drawn again at quarter size, blurred by `radius` px, light under `floor` (0.04) clipped to zero, and added at `gain`. `size` scales the dots in the glow pass. `keys: [{ at, gain, spring }]` flare it | gain 0.55, radius 12, flare to 1.1 on the burst |

## Formations: `FILM.formations`

`formations[0]` is what frame 0 shows; a cycle loop must end there. Exactly one formation is the field. Every formation but the field uses only some of the particles (the first `n` in a seeded priority order, so the sets nest); the rest stay in the field as **dust**.

Fields every text and shape formation takes:

| Field | Meaning | Default |
|---|---|---|
| `id` | unique name, used by `moves` and `from` | |
| `spacing` | px between neighbouring particles: targets are blue noise at this spacing inside the ink | 4.5 |
| `n` | a cap on the particle count (a random subset of the sampled targets) | all |
| `dot` | particle size factor (radius = `swarm.size` x `dot` x a seeded grain of 0.82 to 1.18) | 1 |
| `alpha` | particle opacity while formed | 1 |
| `drift` | px of loop-exact noise while formed: keep it under half the spacing | 0.6 |
| `dust` | the dust's opacity factor while this formation holds (0.2 to 0.5 lets a word stand out) | 1 |
| `spin` | degrees per second the formation turns about its centre (a sphere turns about its axis) | 0 |
| `glint` | `{ at, dur, width, dot, angle }`: a band `width` px wide sweeps across the formation along `angle` (degrees, 0 = left to right) from `at` for `dur` s, growing the dots it passes to `dot` x; sin-enveloped, so it is exactly 0 at both ends | none |
| `center` | the formation's centre `[x, y]`: spin, explode, `center`/`angle` orders. Text: the ink's centre | the targets' box |
| `bleed` | `true` exempts the formation from the live-area check | |
| `assign` | only for `formations[0]` when it is not the field: how particles meet their targets at t = 0 | `index` |

### The field: `field: true`

| Field | Meaning | Demo |
|---|---|---|
| `box` | `[x0, y0, x1, y1]` the homes fill, as blue noise | the canvas plus 48 px |
| `colors` | `{ role: weight }`: each particle's colour in the field and as dust | `{ paper: 0.85, signal: 0.15 }` |
| `depth` | `{ size: [a, b], alpha: [a, b], bias }`: a seeded depth per particle (0 far, 1 near), raised to `bias` (above 1: most far and faint, a few near and bright), sets its size factor and opacity | size 0.35 to 1.9, alpha 0.06 to 1, bias 2.2 |
| `vignette` | dust dims toward the corners by this much | 0.55 |
| `twinkle` | loop-exact shimmer: each particle's opacity dips by up to this much, 2 to 5 whole cycles per loop | 0.3 |
| `waves` | `[{ amp, length, dir, n, roll }]`: travelling waves of orbital motion, `amp` px, `length` px, direction in degrees, `n` whole cycles per loop, `roll` 1 for circles, 0 for a back-and-forth. Near particles move further (parallax) | amp 26 and 12 |
| `drift` | px of loop-exact noise on every particle in the field | 7 |
| `driftN` | cycles per loop of the noise's first harmonic (it adds `2n+1` and `4n+3`) | 1 |

The field never wraps: every particle circles its own home, so a particle can leave it at any moment and come back without a jump. A starfield that streams past, or snow and confetti that fall, would have to wrap at the frame's edge, and a wrapping particle caught mid-move jumps across the frame. The field does not do that; a streaming or falling layer is new engine code (see the last section), drawn apart from the swarm.

### Text: `text`

A line of type laid out with the core's `layoutText` (kerning, `pairs`, `track`, `fit`, `cap`), rasterised glyph by glyph, and sampled inside each glyph's ink.

| Field | Meaning |
|---|---|
| `text`, `font` | the words and the font role (`FILM.fonts`) |
| `size`, `cap`, `fit`, `justify` | one size rule: font size px, cap height px, `fit: true` to span the measure or `fit: <px>` |
| `track`, `pairs`, `anchor`, `x`, `y` | tracking and optical pairs in 1/1000 em, `L` `C` `R`, the anchor x and the baseline |
| `fill` | the particles' colour role |
| `glyphs` | per character: `{ '.': { fill, dot, spacing } }`, an accent glyph in another role, bigger or denser |

### Shapes: `parts`

A formation of one or more parts, sampled one by one at the formation's `spacing` (or the part's own). Positions are canvas px; `x`, `y` default to `center`.

| `shape` | Geometry | Sampled |
|---|---|---|
| `circle`, `ellipse`, `rect`, `poly`, `star`, `arc`, `line` | `r`; `rx ry`; `w h radius`; `sides r`; `points r inner`; `r from to` (degrees clockwise from 12 o'clock); `points` or `x1 y1 x2 y2`, `closed` | filled, or with `outline: <px>` a band that wide along the outline (round caps; `cap` to change) |
| `path` | `d`: SVG path data, `size`: px across its longer side (the user's own logo, one part per colour) | filled, `outline`, or `dots` |
| any outline | `dots: <px>`: single file along the outline, evenly spaced (decoration: no legibility row) | |
| `grid` | `grid: [cols, rows]`, `gap: [dx, dy]` | lattice points |
| `sphere` | `r`, `n` points (Fibonacci, even), `persp` (camera distance in radii, 4), `back` (opacity of the far side, 0.3), `tilt` (degrees toward the viewer); turns with the formation's `spin` | projected every frame |
| `cloud` | `r`, `n`: a seeded gaussian blob | points |

Per part: `fill`, `dot`, `spacing`.

### Derived: `from`

Another formation's particles and targets, transformed. The source must have been moved into earlier in the chain (its targets are assigned then). Dust particles keep their home unless `push` moves them.

| Field | Meaning |
|---|---|
| `from` | the source formation (a field, text or shape formation) |
| `scale`, `rot`, `dx`, `dy`, `center` | scale and turn about `center` (default the source's), then move, px and degrees |
| `explode` | `[min, max]` px: each particle is thrown outward from `center` through its place in the source, most a short way and a few far (`u²` between min and max) |
| `stretch` | `[sx, sy]` on the explode offsets: `[1, 1.7]` rounds out the burst of a wide word |
| `jitter` | degrees of seeded spread on each particle's direction (14) |
| `push` | `[min, max]` px the same way for the dust: a shock wave through the field |
| `alpha`, `dot`, `drift`, `dust` | override the source's look |

## Moves: `FILM.moves`

In time order. Each move takes every particle from the formation the last move went to (or `formations[0]`) to `to`.

| Field | Meaning |
|---|---|
| `at` | when the first particle leaves |
| `to` | the formation it goes to |
| `spring` | a spring name or `[ζ, ω]` (`GATHER`) |
| `spread` | seconds between the first and last particle's start |
| `order` | who goes first: `random`, `x`, `-x`, `y`, `-y`, `center` (inside out), `edge` (outside in), `angle` (clockwise from 12 o'clock), `index`. Ranked by where the particle is going when `to` is a text or shape, else by where it is |
| `jitter` | 0 to 1: how much seeded randomness loosens a non-random order (0.25) |
| `assign` | the first time particles enter a text or shape formation, who goes to which target: both sides are sorted by the same key and paired by rank. `near` (a Hilbert curve: neighbours stay neighbours, short paths), `x`, `y`, `angle`, `radius`, `random` (paths cross), `index` |
| `swirl` | degrees: each path bows to one side and is straight at both ends (a seeded 0.6 to 1.4 x per particle); negative bows the other way |
| `accent` | `'land'` (when the last particle lands) or a time: an accent frame for the stills and the palette gate |

A spring still settling at the end of a cycle loop carries over into the start of the next pass, as the core's Props do; the formations on both sides of it must be periodic (no `spin`), which the critique checks.

## Camera: `FILM.camera`

`[{ at, z, rot, x, y, spring }]` in time order: zoom, turn (degrees) and move (px) about `FILM.cameraPivot` (the canvas centre), each a Prop on `spring` (`DOLLY`). The camera is applied to every particle before its streak is drawn, so a camera move streaks correctly with no subframes. It must end where it starts (the core's "loop closes" row). Small print is not under the camera.

## Small print: `FILM.type`

`[{ id, text, font, size, cap, track, pairs, anchor, x, y, fill, on, at, erase, cursor }]`: a line of real type, typed in one character per frame from `at` with a block cursor, backspaced from `erase`. Without `at` it is on screen from frame 0. In a cycle loop a line typed in must be erased before the loop point.

## Springs

The core's springs (springs.md) plus these:

| Name | ζ | ω | Settles (s) | Lands (s) | Within 2 % (s) | Overshoot | Use |
|---|---|---|---|---|---|---|---|
| GATHER | 0.78 | 7.2 | 2.849 | 0.547 | 0.501 | 2.0 % | a swarm converging into a word or shape from far |
| BURST | 1 | 16 | 1.000 | 0.296 | 0.365 | none | thrown outward: fast out, no bounce |
| REFORM | 0.62 | 10 | 2.581 | 0.285 | 0.599 | 8.4 % | snapping back into a mark after a burst |
| DISSOLVE | 1 | 4.5 | 3.556 | 1.054 | 1.297 | none | letting go, back into the field |
| QUICK | 1 | 24 | 0.667 | 0.198 | 0.243 | none | anticipation, a glow flare |
| DOLLY | 1 | 3 | 5.333 | 1.581 | 1.945 | none | a slow camera push |

"Within 2 %" is when every particle of a move is within 2 % of its target for good: the critique's "formed" row counts from the last particle's start plus this. The long settle times are the snap to exactly 1; a cycle loop carries them over the seam, a hold loop must fit them before its still tail.

## Motion blur: streaks, not subframes

The core averages 4 to 64 subframes per moving frame. For 4600 tiny particles that is slow and, at 5 px a sample, still shows stepped copies of a fast dot. The engine implements the core's `accumulate` hook instead: for each output frame it evaluates every particle at the start and the end of the shutter (`tn - 0.75 / FPS` and `tn`, clamped at cuts by the core) and strokes one round-capped line between them, its alpha scaled down by its length (`streak`). Particles are batched by colour, alpha level (24) and width (0.25 px steps), one path per batch: a frame of the demo is 150 to 600 strokes (half of them the glow pass) and about 35 ms. The subframe count `render` and `frame` print is the core's budget for the frame, not a number of draws. The camera is folded into each particle's position, so a zoom or a turn streaks too; nothing else in the film moves continuously.

## Adding something the vocabulary lacks

First try formations and moves: most pictures are one text or a few parts, a logo is one `path` part per colour, an effect is a derived formation. If a picture needs new geometry, add a part shape that returns target points (in `sampleParts`); if it needs new motion, add it to `formPos` as a pure function of `t`, and report any period in `cycles()`, so streaks, stills, the critique and the loop checks know about it.
