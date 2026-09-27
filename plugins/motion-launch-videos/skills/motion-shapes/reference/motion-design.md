# Motion design: shapes that say something, on the beat

Step 3. What makes flat motion graphics read as designed rather than busy. The engine can move anything; this file says what to move, when, and how much.

## One picture per beat

Each beat has one idea and one picture that says it without words: a checkbox that ticks for "done", three rows for "a list", a ring round seven dots for "every day", an arrow drawing up for "growth". Choose the picture before the layout.

- **Icons from primitives.** Two to five shapes make most icons: a rounded rect and a polyline tick, a circle and two lines, a ring and a dot. Stroke icons read at a glance; keep one stroke width per film (a heavy one: 24 to 44 px at 1080).
- **The user's logo, as it is.** Paste its SVG `d` into `path` layers, one per colour, at `size` px across. Draw its strokes on (trim), then fade its fills in (`fill: 0` to 1): the logo builds itself. Never redraw a logo from memory.
- **The words and the picture say the same thing.** A beat whose picture shows one thing and whose words say another reads as two beats.

## Hierarchy and composition

- **One focal point per frame.** The eye goes to the largest, brightest, most recently moved thing; make that the thing that matters.
- **The live area** is the canvas minus 104 px at 1080 on every side. Type stays inside it; shapes may bleed (`bleed: true`) when they are background.
- **Centre-weighted by default.** A 1:1 film is seen small in a feed: one big picture near the middle, the words above or below it. Put the picture's optical centre slightly above the canvas centre.
- **Type on the 8 px grid**, stacked with a gap of about 0.2 to 0.3 of the cap height, and never touching a shape it does not sit on.

## Colour

- **A flat palette of three to five roles**: a background, a paper white, and two or three saturated accents. Every colour on screen is a role.
- **One accent per beat.** The colour of the focal point; everything else is paper, ink or a quieter accent.
- **Opaque over transparent.** Two chromatic shapes overlapping at partial opacity blend into a third colour that is not in the palette (orange over teal makes a muddy brown). Keep overlapping shapes opaque; fade only over the background.
- **A wipe's colour becomes the next background.** A circle wipe in sun yellow opens onto a sun yellow scene: the transition and the scene are one move.
- **Contrast.** Display type at least 3:1, small print at least 4.5:1, against whatever it sits on (`on`).

## Formats

Positions are canvas pixels, so a layout is made for one format. The template is 1:1 (1080 x 1080).

- **9:16 (1080 x 1920, stories and reels).** The live area is 104 to 976 across and 104 to 1816 down, but platform buttons and captions cover about 250 px at the top and the bottom: keep type between y 360 and 1560. Centre the composition near y 900, stack the picture above the words with more air than at 1:1, and let background shapes use the full height.
- **16:9 (1920 x 1080).** Put the picture and the words side by side (picture left of centre, words right, or the reverse) instead of stacking them; the live area is 104 to 1816 across.
- Change `W` and `H`, move every layer, then read the stills: the critique catches type outside the live area, not a composition that sits too high.

## Timing on the beat grid

- **Every time is `beat(n)` or `bar(n)`.** At 120 BPM: beat 0.5 s, 16th 0.125 s, bar 2 s. Entrances start on 16ths.
- **Something moves on every beat**: a landing, a draw-on, a ripple, a wipe. A beat where nothing changes reads as a stall.
- **Hits land where the springs say.** A POP that starts on the beat lands about 0.1 s later; put the next thing on that landing (`accent: 'land'` marks it).
- **Stagger is rhythm.** A 16th between copies (`stagger: 16`) reads as a count; a 32nd as one gesture; an eighth as a list being read. A grid staggered from the centre (`order: 'center'`) reads as a ripple.
- **Leave it landed.** Give each picture about a second at rest before anything moves it again.

## Moves that feel physical

- **Pop in, glide out.** Entrances overshoot (POP from `scale: 0`, LAND from an offset); exits are critically damped (EXIT) and fast.
- **Draw on, then fill.** A stroke traces on TRACE (critically damped: a line never draws past its end), then the fill fades in behind it.
- **Anticipation and follow-through with keys.** Before a big move, a small one the other way, then the move on a bouncy spring: `keys: [{ at: beat(6), to: { scale: 0.88 }, spring: 'SNAP' }, { at: beat(6.25), to: { scale: 1.2, rot: 8 }, spring: 'POP' }]`. The overshoot is the follow-through.
- **Overlap.** Start the next element's move while the last one is still settling; springs superpose, so nothing waits for anything to finish.
- **Sparks, not explosions.** A burst of 6 to 12 short lines round a landing (`repeat: { radial: 8 }`, trim `[0, 0]` to `[0, 1]` to `[1, 1]`) punctuates it. One burst a film is plenty.

## Transitions

Vary them. A cut, then a circle wipe, then bars reads as designed; three cuts in a row read as a slideshow.

- **Circle wipe**: from the element that just landed, into a new background colour.
- **Bars**: 3 to 6 bars in an accent colour, a 32nd apart; the scenes swap under full cover.
- **Push**: the camera springs to the next world; both scenes are in shot, streaked by blur.
- **None, with overlap**: the outgoing layers exit (scale to 0, staggered) while the incoming ones pop in at the same place. The strongest transition when the two scenes share a shape.
- **A punch-in** (`punch: { at, z: 1.06 }`) late in a scene, after everything has landed, lifts a hold.

## The loop

- **Hold (the default).** The lockup (logo, name, domain) is frame 0: it shrinks away at t 0 while the hook starts, and is rebuilt at the end, then holds still. Give it 1.5 to 2 s from its first entrance; BOUNCE settles 2.5 s after it starts.
- **Cycle.** For a loop with no end (a spinning badge, a bobbing icon field): every behaviour a whole number of cycles per loop, every keyed value back where it started.

## Things that look good in a still and bad in motion

- Everything entering at once: nothing to follow.
- A stroke drawing on in the opposite direction from the eye's path (right to left, bottom to top) unless that is the point.
- A shape scaling from 0 about a point that is not its centre: it slides as it grows.
- Two accents in the same half second.
- A shape exiting in the direction the next one enters from: it reads as the same thing coming back.
