# Particle craft: density, legibility, choreography, colour, blur

Step 3. What makes a particle film read as designed rather than as noise. The engine can put any particle anywhere; this file says how many, how dense, when, and in what colour.

## One formation per beat

Each beat is one formation the eye can name: a word, the user's logo, a mark built from a few shapes, a globe. The moves between them are the film's energy; the formations are what it says. Choose the formations first, then the moves.

- **A word**: at most 4 words of display type a beat, one line, heavy face (see below).
- **The user's logo**: one `path` part per colour, from the user's own SVG, filled or as an `outline` band. Never a logo that is not theirs.
- **A mark from geometry**: two to four parts (a dot in a ring, arcs, a poly). The demo's mark is a filled circle in the accent, an outlined ring and two arcs.
- **Texture, not picture**: `sphere`, `grid`, `cloud` and the field are atmosphere. They fill a beat between two pictures; they do not replace one.

## How many particles

`swarm.n` is shared by every formation: the one that needs the most sets the floor, and everything a formation does not use drifts as dust.

- **A formation's count** is about 0.6 to 0.65 x its ink area / spacing². ACME at a 183 px cap, spacing 4.1: 2960 particles. EXAMPLE.COM fitted to 848 px, spacing 3.3: 2177. The mark with a dense core: 3562. `render.mjs layout` prints every count, and the "budget" row fails a formation that needs more than the swarm has.
- **Leave dust.** 25 to 40 % of the swarm left over keeps the frame alive around a formed word. With none, the field empties when the word forms.
- **Render time** grows with n: 4600 particles render at 4 to 7 frames a second on a shared 4-core machine (the demo: 1 min 53 s for 720 frames, 3 minutes when the machine was busy).
- **GIF bytes** grow with every moving particle (see "The GIF" below): the demo's 4600 make a 3.4 MB preview.

## Legibility: a word must read at feed size

A particle word is read small, in a feed, where the eye averages dots into grey. Two numbers decide it, and the critique checks both per glyph:

- **Particles across the cap height**, the square root of particles per cap² of ink. It is about cap height / spacing. Under 12 the strokes break into scatter (FAIL); 16 or more reads cleanly. The demo: ACME 35, EXAMPLE.COM 19.
- **The light the word averages to**, the fraction of its ink the dots cover (`1 - e^(-n π r² α / area)`, bloom added) mixed with the ground. It must clear 3:1 on bg, like any display type. Small dots at a wide spacing fail this even when the shape is clear at full size: ACME with 1.4 px dots at 4.6 px spacing averaged to 2.03:1, a dim grey word. The fix is bigger dots or a tighter spacing, not more glow: the demo's ACME uses `dot: 1.25` at 4.1 px and averages to 4.2:1.
- **A heavy face.** Stems of at least 0.25 of the cap height give about 11 particles across a stroke at a 180 px cap and a 4 px spacing. The demo uses Sora 800 (stem 0.254 x cap); Outfit 900 (0.28) and Lexend 900 (0.31) are heavier. Hairline and light weights do not work in particles.
- **An accent glyph in a darker ink needs more light.** The accent orange averages to 3:1 only above about 60 % cover: give it `glyphs: { '.': { fill: 'signal', dot: 1.3, spacing: 2.9 } }`.
- **Drift under half the spacing** while formed (the "crisp" row). The demo holds words at 0.3 px.
- **Dim the dust behind a word** to 0.2 to 0.5 (`dust`). The "clutter" row compares the light the dust spreads over the frame with the light the word puts in its box.
- **A second fully formed.** The "formed" row counts from the moment every particle is within 2 % of its target to the moment the first one leaves: under 1 s is a WARN, under 0.5 s a FAIL.

## Choreography

- **Gather**: into a word from the field on GATHER, `order: 'random'` over 0.75 to 1 s, `assign: 'near'` (paths stay short and do not cross), `swirl: 30` to 50 so the swarm arcs in instead of flying straight.
- **Hold, with light**: a formed word does not need to move; a `glint` (a band of bigger dots sweeping across it) and a slow camera push (DOLLY to 1.03) keep a hold alive without softening it.
- **Anticipation**: before a burst, pull the formation in 5 to 6 % on QUICK (a derived formation with `scale: 0.94`) a quarter note ahead.
- **Burst**: `explode` from the formation's centre on BURST, inner particles first (`order: 'center'`, a 32nd of spread), `push` the dust a little so the whole frame answers, a camera kick (PUNCH to 1.08) and a glow flare. A wide word bursts into a wide band; `stretch: [1, 1.7]` rounds it out.
- **Reform while still flying**: start the next move a quarter to a half beat after the burst, on REFORM (8 % overshoot: the mark snaps together). The springs superpose, so each particle curves out and back in one path. `assign: 'angle'` brings each particle back from the side it flew out.
- **Unroll**: from a round mark into a line of type, `order: 'x'` and `assign: 'x'`: the left of the mark becomes the left of the word, and the word writes itself left to right.
- **Dissolve**: back into the field on DISSOLVE over a whole beat or two, `order: 'random'`, a negative swirl. In a cycle loop the last particles may still be settling at the loop point: they carry over.
- **On the beat.** Every `at` is a beat or a 16th; spreads are note values (`beat(1)` for a slow gather, `beat(0.125)` for a burst). Give each picture a second fully formed before the next move.

## Dust and depth

- **Most particles far, a few near**: `depth.bias` 2 to 3 makes most particles small and faint and a few big and bright, which reads as depth. The demo: alpha 0.06 to 1, size 0.35 to 1.9, bias 2.2. Much fainter (bias 2.8, alpha from 0.05) and the field reads as a black square at feed size, a quarter of the loop.
- **Vignette** 0.4 to 0.6 keeps the corners quiet and the eye in the middle.
- **Twinkle** 0.2 to 0.4 adds life to a hold without moving anything.
- **Slow waves** move the field as a medium: two waves, 10 to 30 px, 1 and 2 cycles per loop, in different directions. Faster reads as wind; slower reads as a still.

## Colour

- **Palette roles only**, as everywhere: a ground, a warm white, one accent. Every particle's colour is a role; a particle changes colour mid-flight, at the halfway point of its move, where it is a streak and the switch cannot be seen.
- **One chromatic accent.** Glow is additive and particles overlap at partial alpha: two chromatic inks that meet make a third colour, which the palette gate fails on accent frames. With one accent and neutrals, any overlap stays on the accent's hue. A second accent is safe only where the two never share pixels.
- **A black ground** (`#000000`) is the cleanest for particles and for the GIF: a near-black ground lets the GIF scaler ring below it, and the palette then spends entries on shades darker than the ground.
- **Glow** at gain 0.4 to 0.6, radius 10 to 14 px, lifts a formed word and a burst. It is drawn under the particles, so their cores stay exactly their role; its `floor` clips the faint haze a sparse field would otherwise leave over the whole frame.

## Motion blur: streaks

Particles are too small and too fast for averaged subframes: 64 copies of a 3 px dot at 5 px apart still read as a dotted line, and cost 64 draws of 4600 particles. The engine draws each particle once per frame as a line from where it was at the start of the shutter to where it is, with round caps, so a still particle is a dot and a fast one a streak (see engine.md). Its alpha falls with its length so a streak carries about the light of the dot, with a floor (`streak.min`, 0.2) so a burst still shows: `alpha x max(min, (d / (d + L))^gamma)`.

- The camera is inside each particle's position, so a zoom streaks every particle radially with no extra samples.
- A jump longer than `streak.max` (480 px in one shutter) is not a move and is drawn as a dot.
- Seeked stills (`render.mjs at`) have no streaks; motion-blurred ones (`frame`, the review stills, the render) do.

## The loop

- **Cycle** (the default): the last move returns to `formations[0]`; every wave, twinkle and drift runs whole cycles per loop (`cycles()`); springs still settling at the loop point carry over, so the seam is continuous. The "swarm across the seam" row compares a 0.1 ms step over the loop point with the same step inside the loop, particle by particle, before anything is rendered.
- **Hold**: `formations[0]` is the lockup, and the film ends on a still copy of it. The field must be still (waves, drift and twinkle 0), the lockup's drift and spin 0, every move settled before the tail. The "hold" and "loop tail" rows name what still moves.

## The GIF

A GIF stores only the pixels that change from one frame to the next. A particle film changes almost everywhere on almost every frame, so its GIF is large. Measured on the demo (480 px, 12 fps, 16 colours): transitions cost 330 to 470 KB a second, holds 140 to 230; the whole loop is 3.4 MB. The same film at the render's defaults (20 fps, 64 colours, Bayer dither) is 7.9 MB, at 12 fps and 32 colours 4.3 MB.

- **The engine's hints** (`gif: { fps: 12, colors: 16, dither: 'none' }`): on two inks and greys on black, 16 undithered colours look the same as 64 dithered ones, and 12 fps still reads the moves.
- **Faint dust costs bytes** when the palette gives it shades of its own: keep most of the field faint enough to fold into the ground (a depth bias), and dim the dust while words hold.
- **A haze costs bytes**: glow without a floor lifts the whole frame by 1 to 3 levels, and every level is a palette entry that changes each frame.
- **What made no measurable difference**: removing twinkle, a faster dissolve.
- If the GIF is still over 4 MB: `--gif-width 432` (the demo: 2.9 MB), fewer particles, or less time in transitions.

## The MP4

H.264 finds little to reuse in thousands of moving dots, so a particle film's MP4 is large: the demo is 17.3 MB for 12 s (11.5 Mb/s at the default CRF 16), where the other skills' demos are 1 to 2.5 MB. A higher CRF saves less than it costs: `--crf 20` gives 11.8 MB and its lowest review frame falls to 34.8 dB, `--crf 23` 8.6 MB and 32.5 dB, and the fine streaks go first. Deliver the CRF 16 file; a platform that re-encodes on upload starts from the best copy.

## Formats

The same beats in a different frame (engine.md, Formats, has the mechanics). The field fills any frame by itself; the formations follow the centre; what the patch adds is a design for the frame's shape.

- **9:16**: the width is the limit and the height is spare. Stack a short name into two lines at a much bigger cap (the demo's `'AC\nME'` at a 330 px cap against 183 at 1:1), turn a mark's side elements to the top and bottom, and stretch the burst tall. A domain stays on one line: split, it stops reading as an address.
- **16:9**: the height is the limit. Widen instead: a slightly bigger name, a wider domain, a second pair of arcs, a burst stretched sideways.
- **Scale spacing and dot with the cap.** A word twice as tall at the same spacing needs four times the particles; at twice the spacing and twice the dot it needs the same number and averages to the same light at feed size.
- **Raise `swarm.n` with the area**, 1.7 x for 9:16 or 16:9, so the dust is as dense as at 1:1, and keep the budget row's 25 to 40 % of dust.
- **Small print with the content**, unpinned, a grid step or two under the lowest formation; pinned to the bottom edge of a tall frame it drags the composition down.

## Things that look good in a still and bad in motion

- A word that forms with every particle arriving at once: no swarm, just a fade.
- Paths that cross (`assign: 'random'`) on a gather: a scramble instead of a flow. Keep `random` for a scramble you mean.
- A burst that leaves nothing on screen for more than a few frames: start the reform while the particles are still flying.
- Drift on a formed word above half the spacing: it boils.
- Two accents in the same half second, or a glint during a move.
