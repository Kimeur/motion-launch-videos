# Design: ui-acme-trips

The spec `src/film.html` was built from. Boxes, sizes and output pixels are the values `render.mjs layout` measured; times are on the 120 BPM grid.

## Canvas and device

- 1080 x 1080, 60 fps, 12.000 s = 720 frames, hold loop.
- Live area 104 to 976 on both axes (margin 104). Baseline unit 8 px for the callouts and the lockup.
- Tempo 120 BPM: beat 0.5 s, 16th 0.125 s, bar 2 s. Every action starts on a 16th.
- Device: a phone, screen 360 x 760 units at scale 1 (a unit is a pixel at rest), centre (392, 540): the body spans 200 to 584 by 148 to 932, the screen 212 to 572 by 160 to 920. Screen radius 46, bezel 12, body `ink` with a 2 px `edge` outline, side buttons, a camera dot. A soft `shade` shadow, blur 40, 30 down.
- Callouts in the right column, 656 to 937: 72 px clear of the phone.

## Palette

| Role | Hex | Used for | Contrast on its backdrop |
|---|---|---|---|
| bg | #EEF1F6 | the film's background | |
| ink | #0E1116 | callouts, the lockup name, UI titles, the phone body, the toast | 16.70:1 on bg, 18.91:1 on paper |
| paper | #FFFFFF | screens, trip titles on `deep`, the Save label, the toast label | 12.35:1 on deep, 5.74:1 on brand, 18.91:1 on ink |
| line | #DCE1E8 | skeleton bars | |
| muted | #5A6272 | the small print | 5.42:1 on bg |
| brand | #2356F0 | the Save button, the icon tile, leader dots, the domain, the saved label | 5.07:1 on bg, 4.76:1 on tint |
| tint | #E2EAFE | the saved state, the avatar | |
| sky, haze, deep | #BCD7FF, #8DB3EE, #15326B | the trip pictures: one blue hue, light to dark | |
| sun, roof, sand | #FFC247, #E1623A, #F6E4C4 | the pictures' warm accents; the toast's tick (11.76:1 on ink) | |
| shade, edge | #C3CCD8, #39404C | the phone's shadow and outline | |

The only crossfade is the Save button, brand to tint (one hue). Scrims, the ripple and the finger are ink or paper at partial opacity.

## Type roles

| Role | Face | Sizes | Use |
|---|---|---|---|
| ui | Inter 600 | 24 to 26 units | the avatar's initials (24 px), Save / Saved (26 px), the toast (24 px), the clock (16, chrome) |
| display | Inter Tight 800 | 32 to 40 units on screen; cap 52 (70.8 px) for callouts; cap 72 (98 px) for the lockup | trip titles (32 px in the list, 36 px on the Lisbon screen), "Trips" (40 px), callouts, ACME TRIPS |
| mono | IBM Plex Mono 500 | 34 and 24 px | EXAMPLE.COM (+60 tracking), the small print (+20) |

Callouts take `space: 80` (Inter Tight closes word spaces at display sizes) and a `T.` pair of -30.

## Screens

### trips

| Layer | Type | Box (x, y, w, h) | Paint | Notes |
|---|---|---|---|---|
| TRIPS | text | baseline 112, x 24 | display 40, ink on paper | cap top 83 |
| ME | avatar | 280, 68, 56, 56 | tint, initials AK in brand | 24 px initials |
| KYOTO | card | 20, 140, 320, 256 | the Kyoto picture at 8/9 | radius 24 |
| LISBON | card | 20, 416, 320, 256 | the Lisbon picture at 8/9 | the expand source |
| OSLO | card | 20, 692, 320, 256 | the Oslo picture at 8/9 | |
| (bar) | rect, fixed | 0, 0, 360, 50 | paper | the list scrolls under the status bar |

Each picture is 360 x 288 units: a sky, a 72-unit sun, hills or roofs, and an 80-unit `deep` band at the bottom carrying the city's name (display 36, paper, baseline 262). Content height 972 units; the scroll of 184 keeps inside it (0 to 212).

### lisbon

| Layer | Type | Box (x, y, w, h) | Paint | Notes |
|---|---|---|---|---|
| HERO | image | 0, 0, 360, 288 | the Lisbon picture at 1 | the list card is this, at 8/9 |
| BACK | button | 16, 54, 48, 48 | paper, back chevron in ink | |
| meta | icon + bars | 24, 314 and 184, 314 | calendar and pin in brand, bars in line | |
| paragraph | bars | 24, 376, 312 wide, 3 lines | line | |
| plan rows | rect + bars | 24, 480 and 24, 564 (64 x 64) | sand, sky; bars in line | |
| SAVE | button | 24, 660, 312, 64 | brand, bookmark + "Save" in paper; state `saved`: tint, check + "Saved" in brand | |
| TOAST | toast | 82, 60, 196, 60 | ink, tick in sun + "Saved" in paper | drops from above the screen |

## Script

| Beat | Time (s) | Action | Notes |
|---|---|---|---|
| 0.25 | 0.125 | the phone rises | from dy 1160, LIFT (lands 0.45) |
| 1 | 0.500 | finger in | from below right to (214, 628) on the Lisbon card, MOVE |
| 2 | 1.000 | scroll 184 | the finger drags 156 up; the content settles on SCROLL (lands 1.46) |
| 3 | 1.500 | PLAN IT. in | leader to the Lisbon card |
| 4.5 | 2.250 | move to Lisbon | lands 2.56 |
| 5.25 | 2.625 | tap Lisbon | press, ripple, release a 16th later |
| 5.5 | 2.750 | PLAN IT. out | |
| 5.75 | 2.875 | expand into lisbon | EXPAND lands 3.24; the list dims |
| 6.25 | 3.125 | finger out | |
| 7 | 3.500 | SEE IT. in | leader to the picture's band |
| 9.5 | 4.750 | SEE IT. out; finger in to Save | lands 5.06 |
| 10.25 | 5.125 | focus on Save | z 1.36, placed 72 % down the frame; ZOOM lands 5.72 |
| 11.5 | 5.750 | tap Save | after the zoom lands |
| 11.75 | 5.875 | Save becomes Saved | brand to tint on FADE |
| 12.25 | 6.125 | finger out | uncovers "Saved" |
| 13.25 | 6.625 | camera back to rest | lands 7.22 |
| 13.5 | 6.750 | toast opens | TOAST lands 6.91 |
| 14.25 | 7.125 | SAVE IT. in | leader to the toast |
| 17 | 8.500 | SAVE IT. out; toast closes | |
| 17.5 | 8.750 | the phone drops away | to dy 1160, DROP |

## Callouts

| Id | Words | Position (x, baseline) | Box | Names | In to out (s) |
|---|---|---|---|---|---|
| PLAN | PLAN IT. | 656, 528 | 656, 477 to 937, 529 | the Lisbon card at (0.9, 0.42) | 1.50 to 2.75 |
| SEE | SEE IT. | 656, 424 | 656, 372 to 881, 425 | the Lisbon picture's band at (0.9, 0.82) | 3.50 to 4.75 |
| KEEP | SAVE IT. | 656, 280 | 656, 228 to 936, 281 | the toast at (0.88, 0.5) | 7.13 to 8.50 |

Each baseline puts the cap-height middle level with its target, so the leaders run level.

## Lockup and loop seam

| Element | Size | Position | Colour | Enter |
|---|---|---|---|---|
| ICON | 184 x 184, radius 44, a paper plane of three paths | 448, 348 | brand; plane paper, tint, haze | 8.875, from scale 0, POP |
| NAME | ACME TRIPS, cap 72 (98 px), tracking -10 | centred, baseline 656 | ink | 9.125, from +48 and blur 10, LAND, 32nds |
| URL | EXAMPLE.COM, mono 34, +60 | centred, baseline 736 | brand | typed from 9.5 |
| DEMO | DEMO COPY, FICTIONAL PRODUCT, mono 24, +20 | centred, baseline 880 | muted | typed from 9.75 |

- Frame 0 is the lockup at rest. It leaves at 0.00 (up 56 and out, EXIT, a 32nd between layers) behind the rising phone.
- The phone waits at dy 1160 before it rises and leaves to the same place, so neither it nor its shadow shows at frame 0 or at the end (the `device seam` check).
- The last change is at 10.475 s (the icon's POP settling); loopcheck finds the last 98 frames identical to frame 0.

## Checks

- Stills critique: 54 checks, all pass (text size, contrast against each text's own backdrop, overflow, collisions, words, leaders, clearance, taps, the crossfade, the device seam, palette roles, the loop tail). Palette gate: 15 accent frames, no mixed ink.
- Loopcheck: every maximum channel difference 0; the last 98 frames equal frame 0.
- Verify: H.264 High, yuv420p, 1080 x 1080, 60/1, 720 frames, 12.000 s, BT.709 tags, faststart; decoded frame 0 at 44.8 dB PSNR against the canvas; the background decodes to (237.0, 241.0, 247.0) for #EEF1F6 (238, 241, 246).
- mp4frames: 19 review frames decoded, lowest PSNR 41.7 dB (the camera settling on Save).
- Files: `ui-acme-trips.mp4` 1.40 MB, `preview.gif` 1.48 MB (480 px, 240 frames), `poster.png` (4.25 s), `ui-acme-trips.html` 213 KB. The full render took about 2.5 minutes on a shared 4-core machine; at most 15 subframes a frame (the phone rising and dropping).
