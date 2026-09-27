# Design: <film>

The spec the film is built from. Numbers here and in the FILM config agree; when one changes, change both.

## Canvas, drawings and loop

- 1080 x 1080, 60 fps, 10.000 s = 600 frames, cycle loop.
- 12 drawings a second, each held 5 frames: 120 drawings per loop (a multiple of 3, for the boil).
- Tempo 120 BPM: beat 0.5 s, 16th 0.125 s, bar 2 s. Acts start on 16ths; landings fall on beats.
- Line 9 px, boil 1.6 px. No motion blur.
- Live area 104 to 976 on both axes; the character at rest and every title stay inside it.

## The character

What it is like, in three words: <curious, bouncy, helpful>. Original: <new design / the user's mascot, source>.

| Part | Size (px) | Colour roles |
|---|---|---|
| body | w, h, shape, taper | fill / shade / light |
| eyes | rx, ry, gap, pupil, height | white, ink |
| mouth | w, height | ink, tongue |
| arms | length, width, hand, shoulder height | body fill |
| legs | length, gap, foot | ink |
| antenna / detail | | |
| outline | line width | ink |

## Palette

| Role | Hex | Used for | Contrast |
|---|---|---|---|
| bg | | the stage | |
| rays | | sunburst rays (a close tint of bg) | |
| shadow | | floor shadow | |
| ink | | every outline, pupils, lettering | vs sign, bubble, bg |
| | | | |

## The stage

- Ground line at y = <848>. Sunburst centred at (<540>, <500>), <16> rays, turning <1> ray width per loop.
- Titles: <DEMO COPY, FICTIONAL PRODUCT> at baseline <960>.

## The performance

| Beat | Time (s) | Act | What the viewer should feel |
|---|---|---|---|
| 1 | 0.25 | look at camera | it noticed me |
| 2 | 0.50 | blink | alive |
| 3 | 0.75 | face: o, brow up; emote ! | surprise |
| 4 | 1.375 | hop, 210 px, 0.75 s air | joy |
| ... | | | |
| last | 9.25 | blink; back to the start face | the loop closes |

## Loop seam

- Frame 0: <pose, face, look>. The last act that moves each value brings it back by <t>.
- Springs still settling at the end: <the last landing's BOUNCY settle>, which carries over the seam.
- Cycles: boil 3 drawings, rays <1> per loop, breath <10> per loop, sway <5> per loop.

## Review stills

Written by `render.mjs stills`: every hop's anticipation, stretch and impact, each bubble, sign and emote, each accent, frame 0 and the last frame, plus `stills/contact.png`.
