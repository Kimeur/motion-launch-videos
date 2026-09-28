# Design: <film>

The spec the film is built from. Numbers here and in the FILM config agree; when one changes, change both.

## Canvas and loop

- 1080 x 1080, 60 fps, 10.000 s = 600 frames, cycle loop.
- Tempo 120 BPM: beat 0.5 s, 16th 0.125 s, bar 2 s. Keyed moves start on 16ths.
- Live area 104 to 976 on both axes: the 3D type stays inside it through the whole loop; labels on the 8 px grid.

## Palette and materials

| Role | Hex | Used for | Material |
|---|---|---|---|
| bg | | background and floor | shadow <0.42> |
| | | the type's faces | gloss <0.35> |
| | | the type's walls and bevels | |
| | | supporting objects | gloss <0.6> |

## Light

- Key light travelling <[-0.38, -0.8, -0.9]> (from above, front, right), key <0.74>, ambient <0.34>, soft <1.8>, rim <0.18>.

## Camera

| At (s) | Yaw | Pitch | Distance | Target | Field of view | Spring |
|---|---|---|---|---|---|---|
| rest | -16 | 14 | 16.5 | 0, 0.35, 0 | 30 | |
| 1.00 | | | 15.0 | | | DOLLY |
| 7.00 | | | 16.5 | | | DOLLY |

Sway: <1> cycle per loop, <10> degrees.

## Objects

| Object | Kind and size | Rest place and turn | Colours | Motion | Loop |
|---|---|---|---|---|---|
| hero | text "<WORD>", cap <1.08>, depth <0.5>, bevel <0.05>, track <40> | 0, 0.02, 0 | face / side | flip at <1.5> (-360 on FLIP, 16ths); hop at <5.0> | |
| | | | | | orbit <1> |

## Labels

| Label | Text | Face and size | Baseline | Colour |
|---|---|---|---|---|
| | | | | |

## Loop seam

- Every keyed value returns by <t>; whole turns fold back once they settle.
- Springs still settling at the end: <the camera's dolly back>, which carries over the seam.
- Cycles: <ring orbit 1, orbs orbit -1 and bob 4, cube spin 1, camera sway 1>.

## Formats

Delivered: <1:1, 9:16, 16:9>. The camera fits the hero to each frame's narrower side by itself; the patch in `FILM.formats` redesigns the rest (positions in 1:1 terms).

| Format | Camera | Objects | Labels |
|---|---|---|---|
| 9:16 (1080 x 1920) | <pitch 30, target y -0.3, contain the ring and the orbs> | <orbs bob higher: rest y 1.2, bob 0.8> | <under the ring: y 848 and 912, no pin> |
| 16:9 (1920 x 1080) | <dist 14, dolly to 13> | | <as at 1:1> |

## Review stills

Written by `render.mjs stills` (and `--format 9:16`, into `stills/9x16/`): each key move, each camera landing, the midpoint, frame 0 and the last frame, plus `contact.png`.
