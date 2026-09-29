# Design: overlays-acme-studio

The spec `src/film.html` was built from. Boxes and cap heights are the values `render.mjs layout` measured.

## Overlay

- Kind: `lower-third`, name and role, one per film.
- Plays over: an interview; `bg` #56606B (a mid, cool grey), the stand-in for it in the previews.
- Delivered: the .webm (VP9) with alpha, the .mov (ProRes 4444) with alpha, the .wav; the MP4 and GIF over `bg` for review.

## Canvas and safe areas

- Master 16:9, 1920 x 1080, 60 fps, transparent, `loop: 'none'`.
- Title safe 96 to 1824, 54 to 1026 (all text). Action safe 67 to 1853, 38 to 1042 (every other part).
- Delivered also: 9:16 (1080 x 1920) and 1:1 (1080 x 1080).

| Format | Anchor (x, y, pin) | Patched (`FILM.formats`) | Measured stack (bar to role plate) |
|---|---|---|---|
| 16:9 | 144, 918, bl | | 144, 766 to 658, 918 |
| 9:16 | 72, 592, bl (canvas 72, 1432) | the anchor; name cap 56, role cap 30, bigger pads; the tag top-left at 72, 324; the lean declared left | 72, 1256 to 667, 1432: above the feed's caption (y 1440), left of its buttons (x 929) |
| 1:1 | 144, 918, bl | the tag top-right at 936, 96 | 144, 766 to 658, 918 |

## Palette

| Role | Hex | Used for | Contrast |
|---|---|---|---|
| bg | #56606B | the footage (never drawn) | |
| dark | #111318 | the name plate, the tag's plate, the role's text | on accent: 10.3:1 |
| light | #FFFFFF | the name, the tag | on dark: 18.6:1 |
| accent | #FFB224 | the bar, the role plate | |

Every line sits on its own opaque plate, so it reads on any footage.

## Type

| Role | Face | Cap height | Tracking | Use |
|---|---|---|---|---|
| name | Barlow 700 | 48 px (56 at 9:16), 68.3 px font size | 0 | the name |
| label | Barlow 600 | 26 px (30 at 9:16) | +90 (role), +60 (tag) | the role, the tag |

## Words

| Part | Text | Characters | Facts |
|---|---|---|---|
| name | Rowan Tessaly | 13 | F1 |
| role | HOST, ACME STUDIO | 17 | F2 |
| tag | DEMO COPY, FICTIONAL PRODUCT | small print, not counted | F3 |

Reading time: 31 characters (with the space) / 15 = 2.07 s; the hold is 4.08 s.

## Parts (16:9, measured)

| Part | Box | Plate pad | Baseline |
|---|---|---|---|
| bar | 144, 766 to 156, 918 (12 px wide) | | |
| name plate | 156, 766 to 658, 862 | 32 x 24 | |
| name | 188, 790 to 626, 852 | | 838 |
| role plate | 156, 862 to 597, 918 | 32 x 15 | |
| role | 188, 877 to 565, 906 | | 903 |
| tag plate | 1134, 868 to 1776, 918 (pinned br) | 20 x 12 | |

## Timing

`timing: { in: 0.75, hold: 4, out: 0.5 }`, DUR = 5.25 s = 315 frames.

| Phase | Seconds | What happens |
|---|---|---|
| in | 0.00 to 0.75 | the bar grows up (GROW); the name plate wipes open from it at 0.08 and the role plate at 0.14 (WIPE); the name slides out from behind the bar at 0.16, the role at 0.23, 56 px, focusing from a 6 px blur (SLIDE); the tag fades in at 0.20. Everything lands by 0.47 s (the role's blur focusing is the last) |
| hold | 0.75 to 4.83 | at rest |
| out | 4.83 to 5.25 | the lines slide back 24 px and fade, the plates close towards the bar, the bar drops, the tag fades (EXIT); gone 0.42 s after the exit starts, two frames before the end |

Accent: the name lands, sharp, at 0.40 s (frame 24). Cues: a whoosh peaking at 0.35 s and a swish at 4.88 s, normalised to -20 LUFS.

## Review stills

Frame 0 (empty), coming in (7), the accent (24), landed (45), mid-hold (167), going out (297), the last frame (314, empty), at each format; a decoded frame of the .mov and the .webm over a checkerboard and over a photo-like still.
