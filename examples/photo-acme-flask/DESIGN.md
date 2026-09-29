# Design: photo-acme-flask

The spec `src/film.html` was built from. Sizes and boxes are the values `render.mjs layout` measured at each format; times are on the 120 BPM grid.

## Canvas, grid and formats

- Master 1080 x 1080, 60 fps, 13.000 s = 780 frames, hold loop. Also rendered at 9:16 (1080 x 1920) and 16:9 (1920 x 1080) with `--format`.
- Live area 104 px in from every edge. Every text and tag is inside it at every format; photos bleed.
- Baseline unit 8 px: every text baseline is a multiple of 8.
- Tempo 120 BPM: beat 0.5 s, 16th 0.125 s, bar 2 s. Every entrance starts on a 16th.

## Palette

| Role | Hex | Used for | Contrast measured |
|---|---|---|---|
| bg | #F4F0E8 | the page (finish, lockup, and the hook's page at 9:16 and 16:9) | |
| ink | #19181D | type on the page, the hook's scrim | 15.0:1 (FIN), 15.5:1 (NAME, DEMO) |
| paper | #FFFFFF | type on the hook's scrim and on night, pills, leaders | 3.8:1 on the scrimmed photo (NEW, 1:1), 16.7:1 on night (FOUR) |
| shade | #19181D | frame and cutout shadows | |
| coral | #B8391B | the price pill, the domain | 5.1:1 on the page (URL), 5.8:1 under paper (PRICE) |
| night | #1E1D24 | the range scene | |

## Type roles

| Role | Face | Size rule | Tracking | Use |
|---|---|---|---|---|
| display | Bricolage Grotesque 800 | cap 88 (ACME FLASK), 64 (NEW COLOURS., 72 at 9:16), 72 (NEW FINISH., FOUR COLOURS.) | 0 | beats, the name |
| mono | IBM Plex Mono 500 | 36 (the domain), 30 (the price), 28 (tags), 26 (small print), 24 (slider labels) | +20 to +60 | typed small print, pills |

## Images

| id | File | Pixels | Focus | Subject | Shown in | Largest shown: 1:1 / 9:16 / 16:9 | BRIEF |
|---|---|---|---|---|---|---|---|
| hero | hero-sage.jpg | 2000 x 2000 | 0.49, 0.36 | 0.37, 0.08 to 0.61, 0.70 | hook | 0.63 / 0.73 / 0.51 | A1 |
| set | set-coral.jpg | 1800 x 1800 | 0.50, 0.60 | | float, depth 0.3 | 0.62 / 1.11 / 1.09 | A2 |
| flask | flask-coral.webp | 378 x 1000 | 0.50, 0.40 | the whole cutout | float, depth 1 | 0.82 / 1.08 / 0.82 | A3 |
| before, after | before-graphite.jpg, after-sky.jpg | 1100 x 1100 | 0.47, 0.42 | 0.36, 0.10 to 0.60, 0.72 | finish | 0.72 / 0.91 / 0.95 | A4, A5 |
| sage, coral, sky, sand | tile-*.jpg | 690 x 920 | 0.48, 0.45 | 0.30, 0.06 to 0.68, 0.84 | range, lockup | 0.59 / 0.87 / 0.59 | A6 to A9 |

## Beat sheet

| # | Scene | Window (s) | In | Picture and move | Words | Tags |
|---|---|---|---|---|---|---|
| 0 | lockup, at rest | frame 0; covered by the hook's circle from 0.00, faded out under it at 0.50 | | the strip, the name, the domain | ACME FLASK | |
| 1 | hook | 0.00 to 2.50 | circle from the centre | hero full-bleed, Ken Burns 1.16 to 1.02, pan 0.34 to 0.42, eased drift over 2.75 s | NEW COLOURS. | |
| 2 | float | 2.50 to 5.50 | wipe, the edge travelling left | the set (depth 0.3) and the flask cutout (depth 1); drift -64 px, zoom 1.08 over 3.25 s | | LEAKPROOF LID (F3) at 3.25, 24 H COLD (F2) at 3.75 |
| 3 | finish | 5.50 to 7.75 | split, a vertical seam | before/after: the divider enters at 1, sweeps to 0.08 at 6.00, settles at 0.5 at 6.75 | NEW FINISH. | |
| 4 | range | 7.75 to 10.50 | the flask's silhouette, on night | carousel of four cards, wrapped; steps at 8.375, 8.875, 9.375 | FOUR COLOURS. | FROM $32 (F4) at 9.625 on the sand card |
| 5 | lockup | 10.50 to 13.00 | wipe, the edge travelling up | a 4 x 1 strip assembling in 16ths from 10.375, the name at 11.00, the domain typed at 11.375, the small print at 11.625 | ACME FLASK | |

## Per beat (1:1)

### Hook, 0.00 to 2.50

| Layer | Kind and size | Position | Image, fit | Move | Enter |
|---|---|---|---|---|---|
| HERO | photo, full-bleed | canvas | hero, cover | kb z 1.16 to 1.02, pan (0.49, 0.34) to (0.49, 0.42), drift, 0 to 2.75 | |
| SCRIM | scrim from the bottom, 560 px | | ink at 0.78 | | 0.50, from op 0 |
| NEW | text, cap 64, centred, baseline 928 | box 181 to 899 | paper | | 0.625, from 56 below, blur 8, LAND, 32nds |

### Float, 2.50 to 5.50

| Layer | Kind and size | Position | Image | Depth | Enter |
|---|---|---|---|---|---|
| SET | photo, full-bleed (overscanned to 1094 px so the drift keeps it covered) | canvas | set | 0.3 | |
| FLASK | cutout, 760 px tall (287 wide), silhouette shadow blur 30, offset (26, 34) at 0.3 | 540, 528 | flask | 1 | 2.625, from 180 below, op 0, LAND |
| LID | tag, mono 28, pill left edge at 704, y 208 | pill 704 to 966 | dot on the flask at (0.66, 0.17) | 1 (follows the flask) | 3.25, draw 0 to 1, TRACE |
| COLD | tag, pill right edge at 376, y 720 | pill 184 to 376 | dot at (0.30, 0.64) | follows | 3.75, TRACE |

### Finish, 5.50 to 7.75

| Layer | Kind and size | Position | Enter / keys |
|---|---|---|---|
| CMP | compare 792 x 592, radius 28, shadow blur 30, dy 18 at 0.2; labels GRAPHITE and SKY | 540, 448 (box 144 to 936, 152 to 744) | split from 1 at 5.50; to 0.08 at 6.00 SWIPE; to 0.5 at 6.75 SWIPE |
| FIN | text, cap 72, baseline 880 | box 207 to 873 | 5.75, from 48 below, blur 8, LAND, 32nds |

### Range, 7.75 to 10.50 (background night)

| Layer | Kind and size | Position | Enter / keys |
|---|---|---|---|
| CARDS | gallery, row, wrapped; card 408 x 544, radius 24, gap 36, side cards at 0.78, dimmed 0.45 toward night | 540, 440 | 7.875, from 360 right, op 0, LAND, 16ths; idx 1, 2, 3 at 8.375, 8.875, 9.375, SWIPE |
| PRICE | tag, mono 30, coral pill, paper ink, coral leader | pill 776 to 961, y 160; dot on card 3 at (0.63, 0.34) | 9.625, TRACE |
| FOUR | text, cap 72, baseline 880 | box 120 to 961 | 8.00, from 48 below, blur 8, LAND, 32nds |

### Lockup, 10.50 to 13.00

| Layer | Kind and size | Position | Enter |
|---|---|---|---|
| STRIP | grid 4 x 1, 872 x 288, gap 24, radius 20, shadow; cells reveal through a wipe up | 540, 392 | 10.375, from 56 below, reveal 0, LAND, 16ths |
| NAME | text, cap 88, baseline 688 | box 125 to 955 | 11.00, from 48 below, blur 8, LAND, 32nds |
| URL | mono 36, +60, coral, baseline 776 | | typed from 11.375 |
| DEMO | mono 26, +20, ink, baseline 848 | | typed from 11.625 |

## Transitions

| At (s) | From | To | Mask | Notes |
|---|---|---|---|---|
| 0.00 | lockup | hook | circle from the centre | the lockup fades out under it at 0.50 (wrap) |
| 2.50 | hook | float | wipe, travelling left | opens on the coral set |
| 5.50 | float | finish | split, vertical seam | opens on the page |
| 7.75 | finish | range | the flask's silhouette (an SVG path) | opens on night |
| 10.50 | range | lockup | wipe, travelling up | the strip is already rising when it opens |

## Other formats

| Format | Scene | Layer | Patch | Why |
|---|---|---|---|---|
| 9:16 | hook | HERO, SCRIM, NEW | a 1080 x 1328 frame pinned to the top; no scrim; NEW in ink, cap 72, at y 1528 | the picture above the words; on the full-bleed crop the words fell on the white plinth (1.6:1) |
| 9:16 | float | FLASK | 1000 px tall | fills the taller frame; the tags keep their offsets from the centre |
| 9:16 | finish | CMP, FIN | an 872 x 1000 frame at y 776 (pinned top); FIN at 1448 | a taller comparison, type above 1560 |
| 9:16 | range | CARDS, PRICE, FOUR | 600 x 800 cards at y 816; the price at 336; FOUR at 1448 | bigger cards, side cards cut by the edges |
| 9:16 | lockup | STRIP, NAME, URL, DEMO | a 2 x 2 grid, 872 x 1000, at y 744; the words at 1376, 1448, 1512 | a square block of four above the name |
| 16:9 | hook | HERO, SCRIM, NEW | an 880 x 872 frame at x 1344 (pinned left), shadowed; no scrim; NEW in ink, left-aligned at x 136, y 568 | the picture beside the words; full-bleed kept 78 % of the subject |
| 16:9 | finish | CMP, FIN | a 1040 x 752 frame at y 456; FIN at 944 | a wider comparison that keeps the whole flask |

## Loop seam

- Frame 0 shows the lockup at rest. The hook's circle covers it from 0.00; it fades out under the cover (wrap exit at 0.50, EXIT) and is rebuilt from 10.375.
- The Ken Burns move ends at 2.75, the float's drift at 5.75; the last spring (NAME's focus) settles at 12.32 s; typing ends by 12.14 s; the last 52 frames are a still hold equal to frame 0 (loopcheck, every format).

## Review stills

Written by `render.mjs stills` (and `--format 9:16`, `--format 16:9`): each mask half-way, each scene at rest, each slider and carousel key, the end of the hook's and the float's moves, frame 0 and the last frame, plus `stills/contact.png`.
