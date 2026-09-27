# Design: cartoon-pip

The spec `src/film.html` was built from. Times are on the 120 BPM grid; heights are px above Pip's feet.

## Canvas, drawings and loop

- 1080 x 1080, 60 fps, 10.000 s = 600 frames, cycle loop.
- 12 drawings a second, each held 5 frames: 120 drawings per loop, a multiple of 3 for the boil.
- Line 9 px, boil 1.6 px. No motion blur.
- Live area 104 to 976: Pip at rest (with antenna and arms) spans x 315 to 765, y 345 to 848.

## The character

Curious, bouncy, friendly. Original: a bean with big low eyes, a small mouth, rubber-hose arms and an antenna.

| Part | Size (px) | Colour roles |
|---|---|---|
| body | 330 x 350, superellipse 2.5, top taper 0.1, on 40 px legs | mint / mintDk / mintLt |
| eyes | 40 x 50, 118 apart, at 280; pupils 18 | white, ink |
| brows | 46 wide, at 348 | ink |
| mouth | 100 wide, at 196 | ink, coral tongue |
| cheeks | 28 x 17, 220 apart, at 214 | blush |
| arms | 150 long, 18 thick, shoulders at 196, hands 29 | mint |
| legs | 40 long, 104 apart, feet 50 x 24 | ink |
| antenna | 92 long, ball 21 | ink, coral |
| outline | 9 | ink |

## The stage

- Ground line at y = 848. Sunburst centred at (540, 500), 16 rays in `rays`, turning 1 ray width per loop.
- Title: DEMO COPY, FICTIONAL PRODUCT, Fredoka 600 30 px, baseline 960.
- Camera: punch to 1.06 at 4.125 s, back to 1 at 7.5 s.

## The performance

| Time (s) | Act | Detail |
|---|---|---|
| 0.25 | look | to the camera |
| 0.50 | blink | 0.14 s |
| 0.75 | face | mouth o, brows +14, pop 1.08 |
| 0.75 to 1.50 | emote | ! |
| 1.375 | hop | 210 px, 0.75 s in the air, squash 0.16 s before; mouth grin; lands 2.125 with dust and a shake |
| 2.50 | wave | right hand, 4 swings on eighths, down at 3.75 |
| 2.625 to 3.625 | say | HI! |
| 3.75 | face | smile, happy eyes |
| 4.00 to 7.50 | sign | ACME NOTES, letters on 16ths from 4.2 |
| 4.25 | face | round eyes, grin |
| 5.0 to 5.75 | pose | two bounces of 24 px on BOUNCY |
| 6.00 to 7.25 | emote | sparkles |
| 6.50 | blink | |
| 7.75 | hop | 120 px, 0.5 s; lands 8.25 |
| 8.75 | face, look | smile; back to the first look (-0.45, 0.1) |
| 9.25 | blink | |

## Loop seam

- Frame 0: Pip standing, smiling, looking left and slightly down. Every act brings its value back by 9.4 s.
- The last landing's BOUNCY settle (3.1 s) is still going at 10 s and carries over the seam into the start.
- Cycles: boil 3 drawings (40 per loop), 120 drawings, rays 1, breath 10, antenna sway 5.

## Checks

- Stills critique: 18 checks, all pass. Palette gate: 25 accent frames, no mixed ink.
- Loopcheck: purity 0; the seam changes about as many pixels as any other 0.1 ms step.
- Verify: H.264 High, yuv420p, 1080 x 1080, 60/1, 600 frames, 10.000 s, BT.709 tags, faststart.
