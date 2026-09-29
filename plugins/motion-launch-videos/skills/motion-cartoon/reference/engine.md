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
| `stage` | `{ ground, pin, raise, sunburst: { x, y, pin, rays, color, spin }, shadow }`: the floor line the feet stand on, a ray background that turns `spin` ray widths per loop (whole numbers), the floor shadow's role. `pin` and `raise` place the ground in other formats (Formats, below) |
| `cast` | the characters, below |
| `titles` | still text over the stage: `{ id, text, font, size or cap, track, anchor, x, y, pin, color, on }` (small print, a credit) |
| `camera` | `[{ at, punch: 1.06, spring }]`: zooms about the frame's centre; the last must return to 1 |
| `formats` | `{ '9:16': { ... }, '16:9': { ... } }`: a patch per format (Formats, below) |

The stage moves on ones (every frame); the characters and their effects move on the held drawings.

## A character

Every height is px above the character's feet; x is px from its centre line.

| Field | Meaning |
|---|---|
| `id`, `x` | name, and the canvas x of its feet at rest |
| `pin` | how `x` maps into another format: none keeps its offset from the centre, `'l'` or `'r'` its distance from that edge |
| `scale` | grows the whole rig about its feet (1 by default): body, limbs, face, sign, bubble, emotes, dust and hop heights. The line weight stays |
| `body` | `{ w, h, shape, taper, fill, shade, light }`: a bean. `shape` is the superellipse exponent (2 an ellipse, 3 a rounded box), `taper` narrows the top (0 to 0.3). `fill` the lit colour, `shade` the cel-shadow crescent, `light` the highlight |
| `legs` | `{ len, gap, width, foot: [w, h] }`: short ink legs and feet under the body |
| `eyes` | `{ y, gap, rx, ry, pupil }`: white eyes with ink pupils that follow the `look` |
| `brows` | `{ y, w }`: ink arcs; the `brow` value raises them |
| `mouth` | `{ y, w, tongue }`: the mouth's centre height and width, and the tongue's role |
| `cheeks` | `{ y, gap, rx, ry, fill }`: blush |
| `arms` | `{ y, len, width, hand, rest: [x, y] }`: rubber-hose arms from the shoulders (at height `y`), `len` px long (shorter reaches bend them), mitten hands; `rest` is the hand's offset from the shoulder at rest |
| `antenna` | `{ len, ball, fill }`: it trails the body's moves and rings after each jolt |
| `sign` | `{ w, h, x, y, hold, text, cap, font, fill, pad }`: the board the character pulls out; `y` is its centre's height when held, `x` its centre's offset from the centre line (0). Both hands hold its lower corners, or `hold: 'L'` or `'R'` holds it with that hand alone, from below and a little toward the body (for a sign held out to one side, so the other arm does not cross the face). The lettering keeps `cap` or shrinks to fit inside `pad` |
| `bubble` | `{ x, y, w, h, cap, font, fill }`: where a speech bubble's centre sits, px from the character's feet at rest (x across, y up); it grows from a tail at the side of the mouth it is on |
| `idle` | `{ breathe: [n, amount], sway: [n, degrees] }`: a squash breath and an antenna sway, `n` whole cycles per loop |
| `start` | `{ look: [x, y], mouth, eyes }`: the face at frame 0 (and so at the end) |
| `acts` | the performance, below |

## Acts

Each act is `{ at, act, ... }`, with an optional `id` a format patch can reach it by (`acts: [{ id: 'JOY', h: 280 }]`). They may be listed in any order; the engine sorts them and gives every value its springs in time order. A value an act moves must be moved back by a later act (a cycle loop), except the one-shot acts that return by themselves (blink, hop without `dx`, wave, emote, say, sign). A walk or a hop with `dx` moves the character: walk it back.

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

The film is authored at 1080 x 1080 and renders at 9:16 (1080 x 1920) or 16:9 (1920 x 1080) with `--format` (core.md, Formats). Every number in FILM stays in 1080 x 1080 px; the engine maps each into the frame by its pin:

| What | Maps by | With no pin |
|---|---|---|
| `stage.ground` | `stage.pin` | `'b'`: it keeps its distance from the bottom edge, less `stage.raise` px |
| the sunburst's centre | `sunburst.pin` | x keeps its offset from the centre, y its height above the ground |
| a character's `x`, a `pose` act's `x` | the character's `pin` | the offset from the centre |
| the sign, the bubble, emotes, dust, the shadow | the character | px from its feet, times its `scale` |
| a title's `x`, `y` | its `pin` | the offset from the centre; `'b'` keeps the distance from the bottom, `'g'` the height above the ground |
| hop and walk `dx` | | the format's scale (1 between the standard formats) |

The sunburst and the background fill the whole frame in any format; the camera punches about the frame's centre. The GIF keeps the pixel count of a 480 x 480 one: 360 x 640 at 9:16, 640 x 360 at 16:9. The engine declares the sunburst's and the shadow's roles as backdrop, so the core's composition row measures the character, the sign, the bubble and the titles.

Mapping alone keeps a square composition intact inside a taller or wider frame; it does not use the new space. A patch in `FILM.formats` re-stages the film for each frame. The template's:

```js
formats: {
  '9:16': {
    stage: { raise: 280 },
    cast: [{ id: 'PIP', scale: 1.4, bubble: { x: -170, y: 540 }, acts: [{ id: 'JOY', h: 280 }] }],
  },
  '16:9': {
    stage: { sunburst: { x: 330 } },
    cast: [{ id: 'PIP', x: 330, bubble: { x: 290 }, sign: { x: 330, y: 500, hold: 'R' } }],
  },
},
```

- **9:16.** Pinned to the bottom, the ground at 848 lands at 1688: Pip stands at the foot of a tall frame under 1200 px of empty rays, and the composition row fails. `raise: 280` lifts the stage to 1408, clear of the platform's buttons; the sunburst and the small print (pinned `'g'`) keep their height above it. `scale: 1.4` fills the width (the sign is 728 px wide, inside the live area), the bubble moves over the shoulder, and the first hop, patched by its `id`, goes 280 x 1.4 = 392 px up into the tall frame.
- **16:9.** Pip moves left of centre (x 330 maps to 750), the rays follow him, and the bubble and the sign go to the open side on the right; `hold: 'R'` holds the sign out with one hand.
- Move the stage with `raise`, not by patching `ground`: what is measured from the ground keeps its height above it only while `ground` is the number it was authored against.
- Patch numbers are 1080 x 1080 px too, mapped by the same pins. Arrays of items with an `id` merge item by item (the cast, an act); any other array is replaced whole.

Check every format you deliver: `render.mjs stills videos/<film> --format 9:16` runs the critique at that format, the composition row included, and writes `stills/9x16/`.

## Adding something the vocabulary lacks

A new part (ears, a hat, a tail) is a list of points in the character's own space, posed through the same transform (`rigAt(...).T`), boiled and drawn with `inked()` like the body. A new act compiles to events on the character's values (`ev(key, t, value, spring)`), so it stays pure and carries over the seam like the rest. Keep new parts simple closed shapes: fine detail boils into noise.
