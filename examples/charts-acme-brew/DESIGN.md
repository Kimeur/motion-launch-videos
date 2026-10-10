# Design: charts-acme-brew

The spec `src/film.html` was built from. Sizes, boxes, cap heights and plot geometry are the values `render.mjs layout` measured; times are on the 120 BPM grid; contrast and colour distances are the critique's.

## Canvas and grid

- 1080 x 1080, 60 fps, 12.000 s = 720 frames, hold loop.
- Live area 104 to 976 on both axes (margin 104). Every label and mark stays inside it.
- Baseline unit 8 px: every text, counter and note baseline is a multiple of 8. Chart labels are placed by their data.
- Tempo 120 BPM: beat 0.5 s, 16th 0.125 s, bar 2 s. Every entrance starts on a 16th.

## Data

| Dataset | Values | Format | Prints as | Facts row | On-screen source |
|---|---|---|---|---|---|
| `week` | MON 5820, TUE 6140, WED 6390, THU 6905, FRI 7660, SAT 9120, SUN 6180 | group `,` | 5,820 ... 9,120 | F2 | DEMO DATA, FICTIONAL PRODUCT |
| `milk` | OAT 46, DAIRY 38, NONE 16, total 100 | suffix `%` | 46% | F3 | DEMO DATA, FICTIONAL PRODUCT |

Derived: `{week.sum}` = 48,215 (the counter); Saturday is the week's maximum (the note); oat is the largest share (the title and the donut's centre).

## Palette

| Role | Hex | Used for | Contrast on its backdrop |
|---|---|---|---|
| bg | #140F0C | the film's background | |
| ink | #140F0C | type on the crema hook | 9.73:1 on crema |
| well | #2B221C | the donut's track (not data) | 1.22:1: a quiet ground for the parts |
| paper | #F7F0E6 | titles, values, the note | 16.82:1 |
| muted | #A8998A | category names, captions, source lines | 6.88:1 |
| crema | #FFA62B | the accent: the hook's frame, Saturday's bar, oat, the bean, the domain | 9.73:1 |
| foam | #E6D5C3 | dairy's slice | 13.30:1 |
| roast | #8A7462 | the bars that are not the story; none's slice | 4.31:1 |

Chart colours, as the critique measures them:

| Chart | Colours | Worst contrast | Worst pair, normal | Worst pair, protan/deutan |
|---|---|---|---|---|
| WEEK | roast, crema (lit) | roast 4.31:1 | roast/crema dE 25.3 | 21.9 |
| MILK | crema, foam, roast (ring neighbours) | roast 4.31:1 | crema/foam dE 15.7 | 14.7 |

Every overlapping mark is opaque; donut slices are kept apart by an 8 px gap of the background, so no two inks ever blend.

## Type roles

| Role | Face | Size rule | Tracking | Use |
|---|---|---|---|---|
| display | Inter Tight 800 | cap height (titles 56, name 96), `fit` for the counter | +10 | titles, the counter, the donut's centre |
| label | Inter 700 | 30 and 32 px | 0 | values on the bars, slice labels |
| mono | IBM Plex Mono 500 | 24 to 44 px | +20 to +40 | category names, the note, small print, source lines |

Why these faces: Inter was drawn for screens, and its figures are tabular by default, so the counter's fixed digit slots are the face's own setting, with no loose gaps; the Tight cut is spaced for display sizes. Inter at 700 is the same skeleton at text spacing for the chart labels. IBM Plex Mono is monospaced, so the source lines and category names read as small print, and it is the small-print face of every motion-* skill. Three packages, one weight each, all under the SIL OFL.

## Beat sheet

| # | Scene | Window (s) | In | Finding (title) | Chart | Accent (frame) |
|---|---|---|---|---|---|---|
| 0 | lockup, at rest | frame 0; leaves at 0.00 | | ACME BREW / EXAMPLE.COM | | |
| 1 | hook | 0.00 to 3.00 | circle from the bean, into crema | CUPS BREWED. | counter 48,215 | the count lands, 1.717 (103) |
| 2 | week | 3.00 to 6.50 | wipe: 7 dark bars rise | CUPS PER DAY | columns, Saturday lit, a note | Saturday lights, 4.896 (294) |
| 3 | milk | 6.50 to 9.75 | cut onto the donut's track | OAT MILK LEADS. | donut, 46% in the centre | the sweep lands, 7.950 (477) |
| 4 | lockup | 9.625 to 12.00 | none: overlaps the donut's exit | ACME BREW | bean and crease | the crease lands, 10.349 (621) |

## Per beat

### Hook, 0.00 to 3.00, on crema

| Layer | Kind | Data | Geometry | Paint | Element motion | Data motion |
|---|---|---|---|---|---|---|
| TOTAL | counter | `week.sum` | `fit: 872`, centred; size 238.1, cap 174, baseline 520; 6 slots, digit slot 162.2 px | ink | 0.125, from +48 and op 0, LAND | 0.125, from 0, COUNT; last digit 1.717 |
| BREWED | text | | cap 72 (size 98), centred, baseline 680 | ink | 1.00, from +48, op 0, blur 8, LAND, 32nds | |
| WEEKLY | text | | mono 32, +40, centred, baseline 768 | ink | typed from 1.50 | |
| source | text | | mono 24, +20, x 104, baseline 968 | ink (`source: { fill: 'ink' }`) | typed from 0.125 | |

- Words: 3 (the counter counts as one).
- Gap from the comma's tail (568) to BREWED's cap top (608): 40 px.
- Camera punches to 1.04 at 2.25, after everything has landed; reset under the wipe.
- Rest still at 2.100: the count at 48,215, the source complete.

### Week, 3.00 to 6.50

| Layer | Kind | Data | Geometry | Paint | Element motion | Data motion |
|---|---|---|---|---|---|---|
| PERDAY | text | | cap 56 (size 76.3), x 104, baseline 168 | paper | 3.00, from +48, op 0, blur 8, LAND, 32nds | |
| WEEK | columns | `week` | box 104,344 to 976,800; axis 0 to 9,120, 0.0509 px per cup; band 124.6, bar 74.7 (0.6), radius 10 | roast; Saturday lit crema at 4.75 | | chrome at 3.25; GROW from 3.375, 16ths Monday to Sunday; last value 5.35 |
| values | | | Inter 700, 30 px, 12 px above each bar end, counting on its bar's spring | paper | fade in over the first 0.6 cap heights | |
| categories | | | mono 26, +20, baseline 840 | muted; Saturday turns paper | rise with their bars, 16ths | |
| PEAK | note | `week.SAT` | label mono 26 +20, centred at 796, baseline 232; leader from above Saturday's value label to the label's box | paper, leader crema | dot pops 5.00, leader draws 5.0625, label types 5.125 | |

- Words: 3.
- The source line types from 3.25, with the axis, and stays to the cut.
- Rest still at 5.450: all seven values at their final numbers.
- Camera punches to 1.04 at 5.75; reset at the cut.

### Milk, 6.50 to 9.75

| Layer | Kind | Data | Geometry | Paint | Element motion | Data motion |
|---|---|---|---|---|---|---|
| LEADS | text | | cap 56, x 104, baseline 168 | paper | 6.50, from +48, op 0, blur 8, LAND, 32nds | |
| MILK | donut | `milk` | centre 540,584; R 264, r 184; gap 8; OAT 165.6, DAIRY 136.8, NONE 57.6 degrees | crema, foam, roast on a well track | track on screen at the cut | SWEEP from 6.625; lands 7.950; unsweeps from 9.50 (EXIT) |
| centre | | `milk.OAT` | Inter Tight 800, cap 100, centred; caption OAT, mono 28 | paper; caption muted | counts as oat's slice sweeps | |
| labels | | | DAIRY 38% at the lower left, NONE 16% at the upper left, Inter 700 32 | names muted, values paper | count as their slices sweep; hold and fade on the exit | |

- Words: 4 (OAT MILK LEADS. and the centre).
- The source line types from 6.50 (the track is on screen at the cut) and leaves at 9.50 with the scene, as the donut's data starts to leave.
- Rest still at 8.050: the sweep at 100 of 100.
- Camera punches to 1.04 at 8.50; eased back as the lockup arrives.

### Lockup, 9.625 to 12.00, and frame 0

| Layer | Kind | Geometry | Paint | Enter |
|---|---|---|---|---|
| BEAN | mark | ellipse 64 x 88, rotated 32 degrees, at 540,368 | crema | 9.625, from scale 0, POP |
| CREASE | mark | path, 140 px, stroke 15, rotated 32 | ink | 9.875, trim from 0, TRACE |
| ACME | text | cap 96 (size 130.7), centred, baseline 624 | paper | 9.75, from +64, op 0, blur 10, LAND, 32nds |
| URL | text | mono 44, +40, centred, baseline 720 | crema | typed from 10.125 |
| DEMO | text | mono 24, +20, x 104, baseline 968 (where the source lines sit) | muted | typed from 10.375 |

- The bean pops where the donut's sweep retracts to, at 12 o'clock.

## Transitions

| At (s) | From | To | Kind | Notes |
|---|---|---|---|---|
| 0.00 | lockup | hook | circle from (540, 368) | the lockup shrinks away (EXIT, 32nds by layer) as the crema circle opens from the bean |
| 2.50 to 3.00 | hook | week | wipe, 7 bars up in `bg`, 32nds | the dark bars rise like columns and cover the frame by 3.00, where the scenes swap (a cut for motion blur); they clear dark on dark |
| 6.50 | week | milk | cut on the downbeat | the donut's track is on screen the frame it cuts |
| 9.50 to 9.625 | milk | lockup | overlap | the donut unsweeps back to 12 o'clock and the bean pops there |

## Formats

The MP4, GIF and poster are the 1:1 master. The same `src/film.html` renders at 9:16 and 16:9 with `--format`; `poster-9x16.png` and `poster-16x9.png` are the week chart at 5.50 s, like `poster.png`. `FILM.formats` patches only what moves; no layer is pinned, so everything else keeps its offset from the centre. The data, the timing and the source text are the same in every format.

- **9:16 (1080 x 1920).** Stacked, titles, labels and source lines between y 360 and 1560. Titles at cap 72 on y 440; the source line of the chart scenes at y 1480, the hook's at 1400. The week's columns run 680 px tall (box 104, 680, 976, 1360) with value labels at 34 px and days at 28; the note sits at y 568. The donut grows to r 300 (ring 92, centre cap 120) and sits at x 600, right of centre, so `DAIRY 38%` stays inside the live area. The lockup grows (bean 80 x 110, name cap 100) with the small print centred at y 1480.
- **16:9 (1920 x 1080).** The title beside the chart: `CUPS` / `PER DAY` and `OAT MILK` / `LEADS.` stack flush left at cap 80 (a new layer for the second line, entering where the stagger would have reached it). The columns widen to 1096 px (x 720 to 1816) and the note follows SAT; the donut sits at x 1340. The hook's counter spans 1100 px; its source line is centred at y 888. The lockup is a row: the bean left, the name and domain flush left beside it, the small print centred at y 800.
- Checks at each format: critique all pass, composition included (a lean of 4 % top to bottom and 9 % left to right at 9:16, 12 % top to bottom at 16:9); loopcheck max diff 0.

## Loop seam

- Frame 0 is the lockup at rest. It leaves at 0.00 and is rebuilt from 9.625.
- The last spring settles at 11.475 s (the crease's trace), leaving at least 31 still frames; the pixels already equal frame 0 for the last 58 frames (loopcheck).
- The camera ends at z = 1.
- The poster is 5.500 s, the week chart at rest, lit and annotated.

## Checks

- Stills critique: 80 checks, all pass: every number bound to data and sourced, every data spring critically damped, the axis from zero, the donut's parts making its whole, both charts' colours apart, the source line on screen whenever a number is, every value landed in its scene's rest still. Palette gate: 20 accent frames, no mixed ink.
- Loopcheck: every maximum channel difference 0; the last 58 frames equal frame 0.
- Verify: H.264 High, yuv420p, 1080 x 1080, 60/1, 720 frames, 12.000 s, BT.709 tags in the stream, faststart; decoded frame 0 at 44.1 dB PSNR against the canvas; the background decodes to (20.1, 16.0, 12.0) for #140F0C (20, 15, 12).
- mp4frames: 16 review frames decoded from the MP4, lowest PSNR 40.8 dB.
- Files: `charts-acme-brew.mp4` 1.04 MB, `preview.gif` 0.90 MB (480 x 480, 20 fps), `poster.png` (frame 330, 5.500 s). The full render took 3 min 15 s on an 8-core Mac, alongside two other renders.
