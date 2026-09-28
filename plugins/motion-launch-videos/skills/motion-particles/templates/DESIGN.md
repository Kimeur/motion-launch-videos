# Design: <film>

The spec the film is built from. Numbers here and in the FILM config agree; when one changes, change both. Particle counts, cap heights and times are first guesses until `render.mjs layout` has measured them.

## Canvas and grid

- 1080 x 1080, 60 fps, 12.000 s = 720 frames, cycle loop.
- Live area 104 to 976 on both axes (margin 104). Formations that must read stay inside it; the field and bursts bleed.
- Baseline unit 8 px: every text baseline is a multiple of 8.
- Tempo 120 BPM: beat 0.5 s, 16th 0.125 s, bar 2 s. Every move starts on a 16th.

## Palette

| Role | Hex | Used for | Contrast on bg |
|---|---|---|---|
| bg | #000000 | the ground | |
| paper | | words, the field | |
| | | the accent: one element a beat, embers in the field | |

One chromatic accent (glow and overlap add inks; two chromatic inks would mix into a third).

## Type roles

| Role | Face | Size rule | Use |
|---|---|---|---|
| display | <heavy face, stems >= 0.25 cap> | cap height on the grid, or `fit` | particle words |
| mono | IBM Plex Mono 500 | 26 px | small print, typed |

## The swarm

| | |
|---|---|
| Particles | <n> (the biggest formation needs <m>; <n - m> left as dust) |
| Dot | radius <size> px at dot 1 |
| Streaks | min <min>, gamma <gamma> |
| Glow | gain <gain>, radius <r> px, flares to <g> at <t> |

## Formations

| Id | Kind | What | Particles | Spacing | Dot | Drift | Dust | Colours |
|---|---|---|---|---|---|---|---|---|
| field | field | depth, vignette, twinkle, waves | all | | | | | |
| | text | | | | | | | |
| | derived | from <id>: scale / explode | | | | | | |
| | shape | parts | | | | | | |

## Legibility

| Formation | Cap | Across the cap height | Averages to (feed size) | Fully formed |
|---|---|---|---|---|
| | | (>= 16) | (>= 3:1) | (>= 1 s) |

## Moves

| # | At (s) | Into | Spring | Spread, order | Assign | Swirl | Accent |
|---|---|---|---|---|---|---|---|
| 0 | frame 0 | <formations[0]> | | | | | |
| 1 | | | GATHER | | near | | land |
| 2 | | | | | | | |

## Camera and light

- Camera: <push, kick, return>; it ends where it starts.
- Glints: <formation, at, band width, dot>.

## Small print

- <crumb>: <font, size, baseline>, typed from <t>, erased from <t>.

## Loop seam

- Cycle: the last move returns to <formations[0]> at <t>; its last particle settles <n> s into the next pass (carried over). Waves <n> and <n> cycles, twinkle 2 to 5, drift noise 1, 3 and 7 cycles per loop.
- The camera and the glow end where they start.

## GIF budget

- 480 px, 12 fps, 16 colours, no dither: <size> MB (under 4).

## Formats

Delivered: <1:1, 9:16, 16:9>. The field fills every frame; formations keep their offset from the centre unless pinned. The patch in `FILM.formats` (positions in 1:1 pixels, merged by `id`):

| Format | Swarm | Formations | Small print |
|---|---|---|---|
| 9:16 (1080 x 1920) | <n 7400> | <acme stacked 'AC\nME', cap 330, spacing 6, dot 1.9; mark's arcs to top and bottom, r 360; burst stretch [1, 1.5]> | <y 1072, under the stack> |
| 16:9 (1920 x 1080) | <n 7400> | <acme cap 216; mark with a second pair of arcs at r 430; burst stretch [1.9, 1]; url fit 1120> | <as at 1:1> |

## Review stills

Written by `render.mjs stills` (and `--format 9:16`, into `stills/9x16/`): each move under way, each formation fully formed, each accent frame, frame 0 and the last frame, plus `contact.png`.
