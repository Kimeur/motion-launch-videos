# Engine: the FILM config for a cartoon

Step 4. The film is one HTML file with one canvas. [../templates/film.html](../templates/film.html) holds the whole engine; for a new film you copy it to `videos/<film>/src/film.html` and edit only the `FILM` block at the top. The template runs as it is: a 10 s demo of Pip, a fictional mascot. The core it sits on (springs, the loop, the page API) is described in core.md; the fields every engine shares (`W H FPS DUR BPM loop blur palette fonts grid springs poster`) are listed there.

## Film-level fields

| Field | Meaning |
|---|---|
| `loop` | `'cycle'` (the default for a cartoon): the performance returns to its first pose |
| `blur` | `false`: cartoons smear and streak instead |
| `drawings` | drawings per second, each held for `FPS / drawings` frames. 12 is "on twos" (at 60 fps a drawing holds for 5 frames). Use a divisor of the frame rate |
| `boil` | how far the line wobbles, px. Each drawing traces the line again; three tracings repeat. 1 to 2 px |
| `line` | outline width, px at 1080 |
| `stage` | `{ ground, sunburst: { x, y, rays, color, spin }, shadow }`: the floor line the feet stand on, a ray background that turns `spin` ray widths per loop (whole numbers), the floor shadow's role |
| `cast` | the characters, below |
| `titles` | still text over the stage: `{ id, text, font, size or cap, track, anchor, x, y, color, on }` (small print, a credit) |
| `camera` | `[{ at, punch: 1.06, spring }]`: zooms about the centre; the last must return to 1 |

The stage moves on ones (every frame); the characters and their effects move on the held drawings.

## A character

Every height is px above the character's feet; x is px from its centre line.

| Field | Meaning |
|---|---|
| `id`, `x` | name, and the canvas x of its feet at rest |
| `body` | `{ w, h, shape, taper, fill, shade, light }`: a bean. `shape` is the superellipse exponent (2 an ellipse, 3 a rounded box), `taper` narrows the top (0 to 0.3). `fill` the lit colour, `shade` the cel-shadow crescent, `light` the highlight |
| `legs` | `{ len, gap, width, foot: [w, h] }`: short ink legs and feet under the body |
| `eyes` | `{ y, gap, rx, ry, pupil }`: white eyes with ink pupils that follow the `look` |
| `brows` | `{ y, w }`: ink arcs; the `brow` value raises them |
| `mouth` | `{ y, w, tongue }`: the mouth's centre height and width, and the tongue's role |
| `cheeks` | `{ y, gap, rx, ry, fill }`: blush |
| `arms` | `{ y, len, width, hand, rest: [x, y] }`: rubber-hose arms from the shoulders (at height `y`), `len` px long (shorter reaches bend them), mitten hands; `rest` is the hand's offset from the shoulder at rest |
| `antenna` | `{ len, ball, fill }`: it trails the body's moves and rings after each jolt |
| `sign` | `{ w, h, y, text, cap, font, fill, pad }`: the board the character pulls out; `y` is its centre's height when held. The lettering keeps `cap` or shrinks to fit inside `pad` |
| `bubble` | `{ x, y, w, h, cap, font, fill }`: where a speech bubble sits on the canvas; it grows from a tail at the mouth |
| `idle` | `{ breathe: [n, amount], sway: [n, degrees] }`: a squash breath and an antenna sway, `n` whole cycles per loop |
| `start` | `{ look: [x, y], mouth, eyes }`: the face at frame 0 (and so at the end) |
| `acts` | the performance, below |

## Acts

Each act is `{ at, act, ... }`. They may be listed in any order; the engine sorts them and gives every value its springs in time order. A value an act moves must be moved back by a later act (a cycle loop), except the one-shot acts that return by themselves (blink, hop without `dx`, wave, emote, say, sign). A walk or a hop with `dx` moves the character: walk it back.

| Act | Fields | What happens |
|---|---|---|
| `hop` | `h` px, `air` s, `dx` px, `antic` s, `dust`, `shake` | squash `antic` before `at` (default 0.16 s), stretch at take-off, a ballistic arc `h` high for `air` seconds, arms flung up, an impact squash, a bouncy settle, dust puffs and (for a big hop) a camera shake on landing. `dx` moves it sideways |
| `walk` | `dx` px, `steps`, `every`, `bob`, `lean` | `steps` steps, one per `every` (a note value: 8 is an eighth), `dx` px in all: each step surges forward, dips `bob` px (default 7) and squashes on contact while the stepping foot swings forward and lifts, the planted one slides back, and the arms swing against the legs; the body leans into the walk. A walk the other way brings it back |
| `blink` | `dur` | the eyes close and open (default 0.14 s) |
| `look` | `x`, `y` | pupils turn to a direction, -1 to 1 |
| `face` | `mouth`, `eyes`, `brow`, `open`, `pop` | switch the mouth (`smile`, `grin`, `open`, `o`, `flat`, `frown`) or the eyes (`round`, `happy`), raise the brows (px), open the mouth (0 to 1), or pop the body (a quick stretch, 1.05 to 1.1) |
| `wave` | `arm` (`L`, `R`), `swings`, `every` | the hand goes up by the head and swings side to side, one swing per `every` (a note value: 8 is an eighth), then comes back down |
| `pose` | `dy`, `lean`, `sq`, `x`, `armL`, `armR`, `spring` | any value directly: a crouch (`dy`), a lean in degrees, a squash (`sq`), a slide (`x`), a hand at `[x, y]` from its shoulder |
| `emote` | `kind` (`!`, `?`, `sparkle`, `heart`), `until` | a reaction pops above the head (or sparkles round it) and pops away |
| `say` | `text`, `until` | a speech bubble grows from the mouth, then shrinks away |
| `sign` | `until` | the board appears from thin air in both hands, its letters pop in on 16ths; it vanishes at `until` |

## Springs

The core's springs (springs.md) plus these, which every act uses:

| Name | ζ | ω | Settles (s) | Lands (s) | Overshoot | Use |
|---|---|---|---|---|---|---|
| SNAP | 0.70 | 38 | 0.602 | 0.086 | 4.6 % | quick squashes, blinks, looks |
| POP | 0.42 | 20 | 1.905 | 0.110 | 23.4 % | things appearing: bubbles, emotes, letters, a raised hand |
| BOUNCY | 0.32 | 16 | 3.125 | 0.125 | 34.6 % | settles after a landing, a jiggle, the sign |
| SWING | 0.50 | 14 | 2.286 | 0.173 | 16.3 % | a hand swinging, a lean |
| GLIDE | 1 | 12 | 1.333 | 0.395 | none | easing out of a stretch in the air |

## Drawing

- Every surface is a flat fill, a cel-shade crescent on the side away from the light, and a highlight toward it, then one ink outline of `line` px. Squash and stretch reshape the points, not the stroke, so the line keeps its weight.
- Limbs are ink tubes with a coloured core. Features are closed shapes; the mouth's tongue is clipped to it.
- The boil moves every point of every line by a seeded amount that changes each drawing and repeats every three drawings, so a held drawing is still and the next one breathes.

## Formats

Positions are canvas pixels; the template is 1:1 (1080 x 1080). For another format move the stage and the cast together:

- **9:16 (1080 x 1920).** `stage.ground` about 1400 (the character stands in the lower-middle, clear of the platform buttons below), the sunburst centred near y 900, titles between y 360 and 1560, the bubble above the head. The extra height is room for bigger hops.
- **16:9 (1920 x 1080).** The character left or right of centre (`x` about 640 or 1280), the sign or bubble on the open side, titles on that side too.
- Hop heights are pixels, so a hop that fits 1080 tall may be small in 1920: scale `h` with the frame.

## Adding something the vocabulary lacks

A new part (ears, a hat, a tail) is a list of points in the character's own space, posed through the same transform (`rigAt(...).T`), boiled and drawn with `inked()` like the body. A new act compiles to events on the character's values (`ev(key, t, value, spring)`), so it stays pure and carries over the seam like the rest. Keep new parts simple closed shapes: fine detail boils into noise.
