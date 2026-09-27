# Design: crux-launch

The spec `src/film.html` was built from. Sizes, ink boxes and accent frames are the values `render.mjs layout` measured; times are on the 120 BPM grid.

## Canvas and grid

- 1080 x 1080, 60 fps, 12.000 s = 720 frames, seamless loop.
- Live area 104 to 976 on both axes (margin 104). Display measure 872: every display line is fitted so its ink spans 104 to 976 exactly.
- Baseline unit 8 px: every baseline, rule edge and crumb baseline is a multiple of 8.
- Tempo 120 BPM: beat 0.5 s, 16th 0.125 s, bar 2 s. Every entrance starts on a 16th.

## Palette

| Role | Hex | Used for | Contrast on bg |
|---|---|---|---|
| bg | #0B1015 | full-bleed background | |
| fg | #ECEFF2 | display type | 16.55:1 |
| accent | #4C99F8 | one line per scene, the rule, smear, misregistration left pass | 6.57:1 |
| accent2 | #7CB4FC | crumbs, scramble noise, misregistration right pass | 8.91:1 |

The misregistration pair is two tints of one blue (hues about 213 and 214 degrees), so its passes cannot mix into a third colour.

## Type roles

| Role | Face | Size rule | Tracking | Use |
|---|---|---|---|---|
| display | Archivo Black 400 | `fit` to the 872 px measure | -20 (0 for CRUXPOST.COM) | beats |
| mono | IBM Plex Mono 500 | 32 px (cap height 22.3) | +20 | crumbs, one character per frame |
| label | Syne 800 | | | embedded, not used in this cut |

Optical pairs added after the ink-gap gate failed them: READS `EA +10` (EA was 0.033 em; the line's closest pair is now 0.045 em), PATTERNS `TT +16` (TT was 0.026 em; closest pair now 0.039 em). The floor is 0.037 em.

## Beat sheet

| # | Scene | World | Window (s) | In | On screen | Accent (frame) |
|---|---|---|---|---|---|---|
| 0 | lockup, at rest | 1 | frame 0; leaves at 0.00 | | CRUX / CRUXPOST.COM | |
| 1 | hook | 1 | 0.00 to 2.50 | none | STOP / GUESSING. | GUESSING. lands, 1.342 s (81) |
| 2 | reads | 0 | 2.50 to 5.00 | cut | READS / YOUR OWN / POSTS. | YOUR OWN snaps, 3.500 s (210) |
| 3 | finds | 0 | 5.00 to 8.00 | mask through READS | HOOKS. / FORMATS. / TOPICS. / TIMES. | TIMES. lands, 6.685 s (401) |
| 4 | proof | 1 | 8.00 to 10.50 | smash-pan | PATTERNS / THAT HOLD UP. | THAT HOLD UP. lands, 8.747 s (525) |
| 5 | lockup | 1 | 9.75 to 12.00 | none | CRUX / rule / CRUXPOST.COM | CRUX lands, 10.372 s (622) |

## Per beat

### Hook, 0.00 to 2.50

| Line | Size | Cap top | Baseline | Colour | Enter |
|---|---|---|---|---|---|
| STOP | 309.2 | 299.2 | 512 | fg | 0.25, from +640, SLAM, blur 16, 16ths, smear |
| GUESSING. | 146.2 | 563.4 | 664 | accent | 0.75, from +640, SLAM, blur 16, 32nds, smear |

- Crumb WHAT WORKS ON YOUR X ACCOUNT at 1.50, x 104, baseline 872.
- Gap STOP to GUESSING.: 47.7 px of clear space.
- Camera punches to 1.08 at 2.00; reset at the cut.

### Reads, 2.50 to 5.00

| Line | Size | Cap top | Baseline | Colour | Enter |
|---|---|---|---|---|---|
| READS | 242.4 | 217.3 | 384 | fg | 2.50, from +96, LAND, blur 12, 16ths |
| YOUR OWN | 147.2 | 434.7 | 536 | fg | 2.75, in place, LAND, blur 8, 32nds; scramble until 3.50 |
| POSTS. | 228.3 | 587.0 | 744 | accent | 3.75, from +96, LAND, blur 12, 32nds |

- Crumb ARCHIVE OR READ-ONLY IMPORT at 4.00, baseline 872.
- Gaps: 47.8 and 49.2 px.
- Punch to 1.08 at 4.50, after POSTS. has landed; reset at the mask.

### Finds, 5.00 to 8.00

| Line | Size | Cap top | Baseline | Colour | Enter |
|---|---|---|---|---|---|
| HOOKS. | 210.0 | 199.5 | 344 | fg | on screen from 5.00, revealed by the wipe |
| FORMATS. | 160.5 | 385.6 | 496 | fg | 5.25, from +96, LAND, blur 12, 32nds |
| TOPICS. | 204.6 | 539.2 | 680 | fg | 5.75, same |
| TIMES. | 239.0 | 723.6 | 888 | accent | 6.25, same |

- The mask is READS: anchor (318.5, 299.5), the thickest point of its ink (radius 31.5 px), which sits over HOOKS., so the wipe opens onto words. Scale solved to 45; it covers the frame at 36, 0.233 s after the cut, and hands over.
- Gaps: 39.1, 41.3 and 41.1 px.
- Punch to 1.08 at 7.50; reset inside the pan's blur at 8.031.

### Proof, 8.00 to 10.50

| Line | Size | Cap top | Baseline | Colour | Enter | Exit |
|---|---|---|---|---|---|---|
| PATTERNS | 155.4 | 349.1 | 456 | fg | 8.00, from -96 (above), LAND, blur 12, 32nds | 9.75, up 720, EXIT |
| THAT HOLD UP. | 107.1 | 502.3 | 576 | accent | 8.00, from +96, LAND, blur 12, 32nds | 9.75, down 720, EXIT |

- Crumbs AT LEAST 5 POSTS at 8.75 (baseline 696) and 500 RANDOM DRAWS at 9.00 (baseline 744), both backspaced from 9.50.
- Gaps: 44.4 px between the lines, 96.4 px from THAT HOLD UP. to the first crumb's cap top.

### Lockup, 9.75 to 12.00, and frame 0

| Element | Size | Position | Colour | Enter |
|---|---|---|---|---|
| CRUX | 286.4 | cap top 307.0, baseline 504 | fg | 9.875, from +96, LAND, blur 12, 16ths |
| rule | 872 x 8 | x 104 to 976, y 544 to 552 | accent | draws from the left at 10.00, DRAW |
| CRUXPOST.COM | 99.3 | cap top 595.7, baseline 664 | fg | 10.25, from -128 (drops from behind the rule, `clipBelow: 552`), LAND, blur 12, 32nds |
| REQUEST EARLY ACCESS | 32 mono | x 104, baseline 784 | accent2 | typed from 10.75 |

- Gaps: CRUX to the rule 36.6 px, the rule to CRUXPOST.COM 43.7 px, CRUXPOST.COM to the crumb's cap top 96.5 px.
- The group spans 307 to 784, so its centre is at 545.5.

## Transitions

| At (s) | From | To | Kind | Notes |
|---|---|---|---|---|
| 0.00 | lockup | hook | wrap exit | the lockup leaves upward (-1000 px, EXIT) as STOP slams up |
| 2.50 | hook | reads | cut, world 1 to 0 | subframes clamped at the cut |
| 5.00 | reads | finds | mask through READS | a cut for motion blur; misregistration of the mask outlines on its first 3 frames |
| 8.00 | finds | proof | smash-pan, world 0 to 1 | up to 32 subframes per frame |
| 9.75 | proof | lockup | same world | proof lines exit as CRUX enters |

## Loop seam

- Frame 0 is the lockup at rest. It leaves at 0.00 and is rebuilt from 9.875.
- The last spring settles at 11.758 s (the last glyph's focus), leaving 14 frames of provable static hold; the pixels are already identical to frame 0 for the last 43 frames (loopcheck).
- The camera ends in world 1 at z = 1, where it starts.

## Checks

- Stills critique: 58 checks, all pass. Palette gate: 25 accent frames, no mixed ink.
- Loopcheck: every maximum channel difference 0.
- Verify: H.264 High, yuv420p, 1080 x 1080, 60/1, 720 frames, 12.000 s, BT.709 tags, faststart; decoded frame 0 at 40.1 dB PSNR against the canvas; the background decodes to (9.1, 14.9, 19.1) for #0B1015 (11, 16, 21).
