# Design: shapes-acme-tasks

The spec `src/film.html` was built from. Sizes and boxes are the values `render.mjs layout` measured; times are on the 120 BPM grid.

## Canvas and grid

- 1080 x 1080, 60 fps, 10.000 s = 600 frames, hold loop.
- Live area 104 to 976 on both axes (margin 104). Every text layer and every shape at rest is inside it.
- Baseline unit 8 px: every text baseline is a multiple of 8.
- Tempo 120 BPM: beat 0.5 s, 16th 0.125 s, bar 2 s. Every entrance starts on a 16th.

## Palette

| Role | Hex | Used for | Contrast on its backdrop |
|---|---|---|---|
| bg | #111018 | background | |
| paper | #F6F4EE | type on bg, strokes, rows | 17.9:1 on bg |
| ink | #111018 | type on the sun scene | 11.7:1 on sun |
| red | #FF4F2E | the tick, the mark, the bars | |
| sun | #FFC21A | list background, sparks, the domain | 11.7:1 on bg |
| teal | #2EC4B6 | the week ring | |

Shapes overlap only when opaque, so no two inks blend into a third.

## Type roles

| Role | Face | Size rule | Tracking | Use |
|---|---|---|---|---|
| display | Unbounded 700 | cap height: 128 (DONE.), 96 (ONE LIST.), 88 (EVERY DAY.), 112 (ACME) | +10 to +20 | beats, wordmark |
| mono | IBM Plex Mono 500 | 40 px (the domain), 26 px (small print) | +40, +20 | typed |

## Beat sheet

| # | Scene | Window (s) | In | Picture | Words | Accent (frame) |
|---|---|---|---|---|---|---|
| 0 | lockup, at rest | frame 0; shrinks away at 0.00 | | the mark, ACME, EXAMPLE.COM | ACME | |
| 1 | hook | 0.00 to 2.50 | none | checkbox, tick, sparks | DONE. | tick lands, 1.089 s (65) |
| 2 | list | 2.50 to 5.00 | circle wipe from the tick, into sun | three task rows | ONE LIST. | last dot lands, 4.104 s (246) |
| 3 | week | 5.00 to 8.00 | five red bars, up, 32nds | a ring round seven dots | EVERY DAY. | last day lands, 6.354 s (381) |
| 4 | lockup | 7.50 to 10.00 | none: the ring shrinks away as the mark pops | the mark, ACME, EXAMPLE.COM | ACME | the mark's tick lands, 8.214 s (493) |

## Per beat

### Hook, 0.00 to 2.50

| Layer | Shape and size | Position | Paint | Enter | Keys |
|---|---|---|---|---|---|
| BOX | rect 296 x 296, radius 64 | 540, 432 | stroke paper 28 | 0.125, trim 0 to 1, TRACE | |
| CHECK | line through (-84, 0), (-26, 58), (92, -70) | 540, 432 | stroke red 44 | 0.75, trim 0 to 1, TRACE | |
| SPARK | line 226 to 300 px out, 8 radial copies | 540, 432 | stroke sun 16 | | 1.0: trim to [0, 1] SNAP; 1.25: to [1, 1] GLIDE |
| DONE | text, cap 128, centred, baseline 872 | box 207 to 873 | paper | 0.875, from 240 px below, LAND, 32nds; clipped at y 976 | |

- Camera: punch to 1.06 at 2.00; reset at the circle wipe.

### List, 2.50 to 5.00 (background sun)

| Layer | Shape and size | Position | Paint | Enter |
|---|---|---|---|---|
| LIST | text, cap 96, baseline 256 | box 162 to 918 | ink | 2.625, from 48 below, blur 8, LAND, 32nds |
| ROW | rect 760 x 128, radius 64; 3 copies 168 apart | 540, 424 | paper | 2.75, from 1000 px right, LAND, eighths |
| RING, BAR | circle r 30 stroke ink 10; rect 380 x 24 | 250 / 526, 424 | ink | with the rows |
| DOT | circle r 30 | 250, 424 | red | 3.5, from scale 0, POP, eighths |

### Week, 5.00 to 8.00

| Layer | Shape and size | Position | Paint | Enter |
|---|---|---|---|---|
| TRACK | circle r 212, stroke 20, opacity 0.16 | 540, 448 | paper | on screen |
| FILLRING | circle r 212, stroke 44 | 540, 448 | teal | 5.25, trim 0 to 1, FILL |
| DAYS | circle r 20, 7 radial copies at r 212 | 540, 448 | sun | 5.5, from scale 0, POP, 16ths |
| DAILY | text, cap 88, baseline 880 | box 117 to 963 | paper | 5.75, from 48 below, blur 8, LAND, 32nds |

- Exit at 7.50: every layer to scale 0 on EXIT, 32nds by layer; DAILY drops 360 px.

### Lockup, 7.50 to 10.00, and frame 0

| Layer | Shape and size | Position | Paint | Enter |
|---|---|---|---|---|
| MARK | circle r 104 | 540, 392 | red | 7.625, from scale 0, POP |
| TICK | line through (-46, 4), (-12, 38), (52, -34) | 540, 392 | stroke paper 26 | 7.875, trim 0 to 1, TRACE |
| ACME | text, cap 112, track +20, baseline 664 | box 249 to 831 | paper | 8.0, from 64 below, blur 10, LAND, 32nds |
| URL | text, mono 40, baseline 752 | box 403 to 678 | sun | typed from 8.375 |
| DEMO | text, mono 26, baseline 872 | box 316 to 764 | paper | typed from 8.75 |

## Transitions

| At (s) | From | To | Kind | Notes |
|---|---|---|---|---|
| 0.00 | lockup | hook | wrap exit | the lockup shrinks away (EXIT, 32nds by layer) as the checkbox starts drawing |
| 2.50 | hook | list | circle wipe from the tick, into sun | about 0.3 s to cover the frame |
| 5.00 | list | week | five red bars, up | they cover the frame by 5.00, the scenes swap under them, then they clear |
| 7.50 | week | lockup | none | the ring shrinks away as the mark pops in the same place |

## Formats

The MP4, GIF and poster are the 1:1 master. The same `src/film.html` renders at 9:16 and 16:9 with `--format`; `poster-9x16.png` and `poster-16x9.png` are frame 0 of each. `FILM.formats` patches only what moves; no layer is pinned, so everything else keeps its offset from the centre.

- **9:16 (1080 x 1920).** Stacked and bigger, type between y 360 and 1560. The lockup grows (mark r 128, ACME cap 136) with the small print at y 1400. The checkbox is 360 px with longer sparks and `DONE.` at cap 160; it rises 300 px from behind a clip at y 1504. `ONE LIST.` and `EVERY DAY.` split onto two lines at cap 160 and 144 (a new layer for the second word, entering where the stagger would have reached it). The rows take the full measure (872 x 152, 196 apart); the ring is r 300. The words drop out 640 px so they leave the taller frame.
- **16:9 (1920 x 1080).** Side by side. The lockup is a row: the mark left, `ACME` and the domain flush left beside it. The checkbox sits left of centre with `DONE.` beside it (cap 144, rising from behind a clip at y 720). `ONE` / `LIST.` stack flush left at cap 144 with the rows on the right; the ring (r 280) sits left with `EVERY` / `DAY.` beside it at cap 128. The circle wipe opens from the checkbox wherever it is.
- Checks at each format: critique 37 checks, all pass, composition included (a lean of 10 % top to bottom at 9:16, 12 % left to right at 16:9); loopcheck max diff 0.

## Loop seam

- Frame 0 is the lockup at rest. It shrinks away at 0.00 and is rebuilt from 7.625.
- The last change is the small print's cursor at about 9.27 s; loopcheck finds the last 44 frames identical to frame 0.
- The camera ends in world 0 at z = 1, where it starts.

## Checks

- Stills critique: 32 checks, all pass. Palette gate: 20 accent frames, no mixed ink.
- Loopcheck: every maximum channel difference 0.
- Verify: H.264 High, yuv420p, 1080 x 1080, 60/1, 600 frames, 10.000 s, BT.709 tags, faststart; the background decodes to (16, 16, 23) for #111018.
