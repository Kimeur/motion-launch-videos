# Pixel craft: small canvases that read, move and loop

Step 3. What makes pixel art look deliberate rather than low-resolution. The engine guarantees that every pixel is a palette colour at a whole position; this file says which pixels to put there, how to move them, and how to make a world that loops.

## Resolution and scale

- **The logical canvas is the design.** 180 x 180 at x6 makes 1080 x 1080: close to a handheld console's screen, big chunky pixels that read in a feed. 270 x 270 at x4 gives finer detail, 135 x 135 at x8 a bolder, simpler look. 16:9 is 320 x 180 at x6, 9:16 is 180 x 320 at x6.
- **Even scales.** The MP4 is yuv420p: colour is stored once per 2 x 2 output pixels. At an even scale every chroma block sits inside one logical pixel and edges stay crisp; at an odd scale they straddle two colours and soften.
- **One pixel size in the whole frame.** A sprite drawn at 2x next to 1x scenery reads as a mistake. Scale up only what is meant to be chunky: titles (the bitmap font at 3x or 4x), a giant boss, a close-up.
- **The GIF divides evenly.** The engine writes it at a whole fraction of the output (540 px for 1080: 3 GIF pixels per logical pixel), nearest neighbour, no dither, the exact palette.

## Palette: 10 to 16 colours of your own

- **Ramps, not lists.** Plan each material as a short ramp from dark to light: sky (3: top, lower, haze), foliage (3: dark leaf, grass, highlight), earth (2 or 3), skin (1 or 2), a title ramp (cream, gold, orange), plus one near-black ink for outlines and one near-white.
- **Shift hue along a ramp.** Shadows cooler (towards blue or purple), highlights warmer (towards yellow): gold to orange to deep blue reads richer than gold to dark gold.
- **The sky is `bg`.** It is the page background and the colour most of the frame is; `verify` checks it decodes true.
- **Contrast is measured, so plan it.** Display text needs 3:1 against the pixels that touch it, small print 4.5:1. An ink outline round a title makes that its own backdrop, whatever scrolls behind.
- **A brand's colours go into the ramps.** Take the brand's two or three colours as ramp anchors and build the other steps round them; never borrow a console's or a fantasy console's palette, which is someone's design.
- **Atmosphere is a palette job.** Far hills sit close to the sky's colour (a desaturated teal against pale blue), near hills are darker and more saturated, the foreground has ink outlines. Something far away can be drawn in its hills' colour, a silhouette with one detail (a castle with a red pennant).

## Readability at small sizes

- **Silhouette first.** Fill a sprite with one colour: it should still say what it is. A big head (half the height), a clear pose and one long shape (a scarf, a tail) read at 16 px.
- **Outline the foreground, not the background.** Ink outlines separate the hero, pickups and title from anything behind them. Background layers have no outline (a lighter edge along the top at most), which pushes them back.
- **1-px details are for still things.** An eye is 1 x 2 ink pixels; a highlight is one pixel. On a moving sprite, a lone pixel flickers; give details 2 px or make them part of the outline.
- **Text sizes.** The bitmap font is 7 px tall: at x6 that is 42 px for small print, legible in a feed. Titles at 3x (126 px) or 4x (168 px) carry a ramp fill, an ink outline and a 2 px drop.
- **Leave clear space between layers of text.** Bounces go up (with `bounce: true`) and dissolves take a while: keep 8 px or more between lines that animate.

## Animation

- **Frames on the grid.** 12 fps holds each drawing 5 output frames at 60 fps; 8, 10, 15 and 20 fps are even too. A cycle's period (`frames / fps`) must divide DUR: 6 frames at 12 fps is 0.5 s, one beat at 120 BPM.
- **A run cycle in 6 frames**: contact (legs apart), down (the body 1 px lower, the back foot kicked up), pass (the knee coming through), then the same three with the other arm forward. The head is the same in every frame, moved 1 px with the body.
- **Secondary motion sells it.** A scarf, hair or a cape that lags the body by a frame and flutters through 3 shapes makes a 16 px run feel alive.
- **Hops on the beat.** A parabola `h` px high over one beat, a separate in-air sprite, and a dust puff that stays on the ground where the feet landed. Items on the path (`y: 'path'`) are collected exactly where the hop carries the hero.
- **Coins and pickups.** A spin is 4 frames (face, three-quarter, edge, the other three-quarter) at 8 fps; collect on touch (the front edge, not the centre), with a 5-frame twinkle at 20 fps.
- **Springs in whole pixels.** An underdamped spring's tail rounds to 0 long before it settles, so pixel springs look crisp: a DROP with `bounce: true` falls, bounces 25 %, 6 % and 2 % of the drop, and rests. Stagger letters by a 32nd for a cascade.

## Dithering

- **Fades are dithers.** Partial opacity would blend colours; an ordered 4 x 4 Bayer pattern shows 0 to 16 of every 16 pixels instead. Text and scaled sprites dither in their own pixel size (a 3x title dissolves in 3 x 3 blocks), which reads as a pixel dissolve and compresses far better than a 1 px checker.
- **Gradients are dithered bands.** A sky of 3 colours with 4 to 8 dithered rows between them reads as a smooth gradient.
- **Never dither a moving fill.** A dither pattern tied to the screen crawls across anything that moves through it; keep dithers on still bands and on the things that fade.
- **Dithers cost bits.** A 1 px checker is the hardest pattern H.264 can meet; frames full of it decode a few dB lower. Keep dissolves short and chunky.

## Parallax and scrolling

- **Speeds on the frame grid.** At 60 fps, 60, 30, 20, 15, 12 and 10 px/s step evenly (1 px every 1, 2, 3, 4, 5, 6 frames). Anything else steps 1, 1, 2, 1, 1, 2: a judder the critique warns about.
- **Farther is slower, lighter and flatter.** Clouds and far hills 20, near hills 30, the ground and everything on it 60 (1 px a frame: a brisk run for a 16 px hero). Two layers at the same speed read as one plane; that is fine for clouds and distant hills.
- **The repeat constraint.** A layer at v px/s moves v x DUR px a loop, so its pattern repeats every v x DUR px or a divisor of it. For nothing unique to appear twice, v x DUR must be at least the screen width plus the object's width: in a 10 s loop 180 px wide, 20 px/s or more. A slower layer needs a pattern that is happy to repeat (a flat band, a row of identical hills) or a longer loop.
- **Tiles repeat, decorations do not.** A ground of 8 x 8 tiles can repeat every 120 px; put flowers, bushes and rocks on a strip one loop long (`speed x DUR` px) so the world never looks tiled.
- **Shake the world, not the sky.** A shake moves every layer but the sky; the ground's `extend` fills to the bottom so no gap opens.

## Effects, sparingly

- **Palette cycling.** One role steps through a short ramp (`gold, gold, gold, gold, gold, cream, white, cream`), offset along the diagonal in bands: a shimmer that travels across the call to action.
- **A glint.** A diagonal white band a few px wide sweeps across a title in 0.4 s, once every few seconds, never while it is landing.
- **Blink.** PRESS START on for 60 % of a beat, every beat.
- **Shake.** 2 px for 0.2 s on the one landing that matters. One a film.
- **Sparkles.** 2 or 3 twinkles at a time around the title while it holds; they reappear at seeded spots each cycle.

## The loop

- **Cycle loops for worlds.** The hero runs forever; the loop is the world going by once. Design the world to be `speed x DUR` px long and place pickups by the time they reach the hero (`at: [t, ...]`), on the beat.
- **A title card inside a cycle.** The world runs alone for a beat or two, the title drops and lands, holds with glints and a blinking line, the call to action takes over, the title dissolves, and the world runs alone again into the seam. Everything that enters also leaves (or has a `show` window), so frame 0 is the world alone.
- **Hold loops for stings.** A logo that assembles and ends still: nothing may scroll, animate or blink at the end, and the last settle comes before the last frame.

## Things that look good in a still and bad in motion

- A sub-pixel speed: the layer judders.
- A slow layer whose castle, sun or big cloud shows twice across the screen.
- A 1 px dither on something that moves: it crawls.
- A title letter bouncing up into the line above it: drop the lower line first, or leave room for the bounce.
- A coin drawn over the hero's face for a few frames before it is collected: collect on touch.
- Every layer moving at a different odd speed: the eye cannot settle. Three or four planes are plenty.
- Two accents in the same half second: a shake and a glint compete.
