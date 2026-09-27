# 3D design: a clean studio, one hero, a camera that breathes

Step 3. What makes simple 3D read as designed: a hero object, a light that models it, a floor that grounds it, and motion that respects weight.

## The hero

- **One hero per film**: the word, or the logo. Everything else (rings, orbs, cubes) orbits it, frames it or points at it, and is smaller, quieter in colour, and further back.
- **Heavy type extrudes best.** Unbounded 800 to 900 or Archivo Black: thick strokes make solid walls and a clean bevel. A light weight turns into slivers.
- **Depth about half the cap height, bevel about a twentieth.** Deep enough that the walls show at an angle, shallow enough that the letters stay a word. Track flipping type open (+30 to +60).
- **Two colours on the type**: a light face and a saturated side (`side`). The side colour carries the brand; the face carries legibility.
- **A logo as it is.** Paste the user's SVG path into a `path` object; extrude it; check its silhouette against the flat logo. Never redraw a mark from memory.

## Light

- **One key light from above, in front and to one side** (`dir` with a strong -y and a -z toward the camera's side). It models the bevels and puts the shadow behind and beside the hero, where it grounds it without covering the floor in front.
- **Ambient 0.3 to 0.4**, so shadowed sides keep their colour instead of going black.
- **Gloss for small things, matte for big ones.** Spheres and rings at 0.5 to 0.7 get a clean highlight; type at 0.3 to 0.4 stays readable.
- **Rim 0.1 to 0.2** separates dark objects from a dark background.
- **Shadows soft and not too dark** (floor `shadow` 0.35 to 0.5, `soft` 1.5 to 2).

## The floor and the background

The floor is a shadow catcher: drawn in the background colour and darkened only where shadowed, so the scene sits in an infinite studio with no horizon line. Choose a background that is not the hero's colour: a deep violet under cream and coral type, a warm off-white under ink and red. A dark background makes glossy highlights sing; a light one reads as clay.

## Camera

- **A three-quarter view** (yaw 12 to 25 degrees, pitch 10 to 20) shows the type's walls and its shadow; straight on, extrusion is invisible.
- **A long lens** (field of view 25 to 35) keeps the type from distorting; move the camera back instead of widening it.
- **Move slowly and continuously.** A sway of 8 to 12 degrees once per loop and a dolly of 5 to 10 % on DOLLY make the scene breathe. Fast camera moves read as a mistake unless they are the point.
- **Frame for the whole loop.** Check stills across the loop: orbiting things leave the frame at the sides (fine), the hero never does.

## Formats

The field of view is vertical, so a format change keeps the height of the view and changes its width.

- **9:16 (1080 x 1920).** The frame is narrow: move the camera back (about 1.8 times the 1:1 distance) or make the type smaller, and move the flat labels to y 1400 to 1560. The critique fails 3D type that leaves the live area at any sampled moment, which is how a too-close camera shows up.
- **16:9 (1920 x 1080).** The frame is wide: bring the camera closer or add supporting objects to the sides; place labels under the hero as at 1:1.

## Motion with weight

- **Letters one at a time.** A stagger of a 16th across the glyphs turns a move into a wave: a flip (`rx: -360` on FLIP), a hop (`dy` up on HOP, down on LAND), a turn (`ry: 360`).
- **Big things move slowly.** A cube tumbles on SETTLE, a sphere bobs a fraction of its size.
- **Orbits and spins are whole cycles per loop**, so the loop closes by construction. One or two turns per 10 s is calm; four is busy.
- **Overlap** one object's move with another's settle; nothing waits.
- **Something moves on every beat**, but the hero moves on the big ones: a flip on bar 1, a hop on bar 3.

## Composition

- The hero's optical centre slightly above the frame centre; flat labels (the domain, small print) under it on the 8 px grid, in the live area.
- Leave air: the hero at 50 to 70 % of the frame's width.
- Orbiting objects pass in front of the hero only briefly and never cover its words. A ring round a word belongs near the floor: at mid-height its near arc slices across the letters whenever its tilt turns toward the camera.

## Things that look good in a still and bad in motion

- A ring through a letter: it flickers as the depth test decides which is in front.
- A spin about a symmetric object's own axis: it looks still, so the eye reads it as a stall.
- A shadow that pops when an object leaves the shadow box: keep everything within `shadowBox` of the centre.
- A camera move and a hero move in the same direction at once: the hero seems to stand still.
