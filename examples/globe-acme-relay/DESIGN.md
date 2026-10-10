# Design: globe-acme-relay

The spec `src/film.html` was built from (the motion-globe template as it ships). Times, altitudes, card sides and boxes are the values `render.mjs layout` measured.

## Canvas and formats

- 1920 x 1080 (16:9) master, 60 fps, 31 s = 1,860 frames, `loop: 'none'`, 100 BPM.
- Live area 64 px in from every edge (`grid.margin`).
- Delivered also: posters at 9:16 (1080 x 1920) and 1:1 (1080 x 1080); both formats pass their own critique.

| Format | Camera framing | HUD moved (`FILM.formats`) | Story patched |
|---|---|---|---|
| 16:9 | target at the centre (960, 540) | | |
| 9:16 | `globe.frame: [960, 480]` (canvas 540, 900) | title y 536, total y 560, subtitle y 520, source y 676 (all pinned to the bottom: canvas y 1312 to 1519) | the open ends at 24,000 km, the pull back at 26,000 km |
| 1:1 | target at the centre | the source line top right (1856, 140, `tr`) | the open ends at 21,500 km; Buenos Aires at 14.75 s; the pull back at 22,000 km |

## Places

Every place passes the critique's country check (`PASS: in <country>`).

| Id | Name on screen | Country | Lat | Lon | Role |
|---|---|---|---|---|---|
| saopaulo | São Paulo | BR | -23.5505 | -46.6333 | hub |
| rio | Rio de Janeiro | BR | -22.9068 | -43.1729 | hub |
| belo | Belo Horizonte | BR | -19.9167 | -43.9345 | hub |
| brasilia | Brasília | BR | -15.7939 | -47.8828 | hub |
| buenosaires | Buenos Aires | AR | -34.6037 | -58.3816 | hub |
| cordoba | Córdoba | AR | -31.4201 | -64.1888 | hub |
| johannesburg | Johannesburg | ZA | -26.2041 | 28.0473 | hub |
| capetown | Cape Town | ZA | -33.9249 | 18.4241 | hub |
| mumbai | Mumbai | IN | 19.0760 | 72.8777 | hub |
| bengaluru | Bengaluru | IN | 12.9716 | 77.5946 | hub |
| lisbon, lagos, accra, bogota, lima, santiago | (not named on screen) | PT, NG, GH, CO, PE, CL | | | ends of the open's routes |

## Data

| Dataset | Values | Format | Prints as | Facts row | On-screen source |
|---|---|---|---|---|---|
| parcels | 10 hubs | grouped | 12,480 | F2 | DEMO DATA, FICTIONAL PRODUCT |
| sameday | 10 hubs | suffix % | 97% | F3 | DEMO DATA, FICTIONAL PRODUCT |
| couriers | 4 countries | grouped | 1,840 | F4 | DEMO DATA, FICTIONAL PRODUCT |
| trend | 6 two-hour bins x 10 hubs | (bars only) | | F5 | DEMO DATA, FICTIONAL PRODUCT |

Derived: `parcels.sum` = 80,375; `couriers.sum` = 5,430; `parcels.count` = 10; `couriers.count` = 4.

## Story

| # | Beat | Time (s) | Camera | On screen | Sound |
|---|---|---|---|---|---|
| 0 | open | 0 to 2.6 | 39,000 km over (6 N, 14 E), easing to 19,400 km over (12 S, 30 W) | the world forms at 1.05: shock ring, body, rim, dots, orbit rings | swell into a boom at 2.5; the bed in E minor |
| 1 | arcs + subtitle | 2.8 to 7.3; 3.4 to 6.42 | drifting west | 9 routes cycling, 14 intro arcs; "Parcels cross oceans," / *"hand to hand."* | |
| 2 | Brazil | 5.2, arrives 8.4 | dive to 7,800 km, tilt 42.8 | ROUTES LIVE · BR, Brazil, 1,840 COURIERS ON SHIFT; 4 pins | swell + boom on the first pin (7.83); the pulse starts |
| 3 | Argentina | 12.7, arrives 15.3 | hop to 6,112 km, tilt 46.8 | 2 pins | arc |
| 4 | South Africa | 16.6, arrives 18.07 | flight from Córdoba (78 degrees, lands 17.53) to 3,200 km, tilt 53 | 2 pins | arc |
| 5 | India | 20.3, arrives 21.76 | flight from Cape Town (74 degrees, lands 21.18) to 3,800 km, tilt 52 | 2 pins | arc |
| 6 | total | 24.2 | pull back to (14 S, 4 E), 19,000 km, flat | 6 network arcs; 10 HUBS · 4 COUNTRIES, 80,375, PARCELS TODAY · 5,430 COURIERS (counts from 25.53) | boom on the count, a data run |
| 7 | outro | 27.8 | the globe shrinks to 0.55 | streak at 28.5; Acme Relay, The world, *same day.*, EXAMPLE.COM, DEMO DATA, FICTIONAL PRODUCT | swell + boom at 28.5; the chord lifts to E major |

Poster: 26.7 s (frame 1,602), the pull back with the total landed.

## Pins and cards

Every card: chip HUB SCAN, status SYNCING then LIVE, query `parcels today · <hub>`, count `parcels.<hub>` PARCELS, second `sameday.<hub>` SAME DAY, bars `trend.<hub>`, progress, coordinates.

| Pin | Region | Time | Card (16:9) | In to out | Count | Second |
|---|---|---|---|---|---|---|
| saopaulo | BR | 7.83 | ul | 8.05 to 9.78 | 12,480 | 97% |
| rio | BR | 8.83 | ur | 9.05 to 10.78 | 9,215 | 95% |
| belo | BR | 10.10 | ul | 10.32 to 12.05 | 4,870 | 96% |
| brasilia | BR | 11.20 | dl | 11.42 to 12.75 | 3,360 | 94% |
| buenosaires | AR | 14.55 | ul | 14.77 to 16.50 | 10,940 | 93% |
| cordoba | AR | 15.25 | ul | 15.47 to 16.65 | 3,725 | 95% |
| johannesburg | ZA | 18.37 (auto) | dr | 18.59 to 20.32 | 8,630 | 92% |
| capetown | ZA | 19.07 (auto) | ul | 19.29 to 20.35 | 5,190 | 96% |
| mumbai | IN | 22.20 (auto) | ul | 22.42 to 24.15 | 14,320 | 91% |
| bengaluru | IN | 22.90 (auto) | ur | 23.12 to 24.25 | 7,645 | 94% |

At most two cards open at once; the shortest open time is Cape Town's, 0.96 s (the critique counts from when the card is fully open, 0.10 s after it starts in). The sides differ per format (the placement is solved per format); every format passes.

## HUD (16:9, measured)

| Block | Box | Text |
|---|---|---|
| brand | 64, 66 to 304, 109 | Acme Relay, GLOBAL COURIER NETWORK |
| telemetry | 1472, 68 to 1856, 122 | LAT, LON, ALT, HUBS 01/10 to 10/10 |
| title | 64, 874 to 437, 1004 | per region |
| subtitle | 644, 808 to 1276, 941 | two lines, 64 px |
| total | 1532, 894 to 1856, 1006 | |
| source | 788, 994 to 1132, 1007 | SOURCE: DEMO DATA, FICTIONAL PRODUCT |

## Palette and type

As BRIEF.md. Contrast as measured by the critique against the real backdrop (the frame drawn without its text): the worst text is the Brazil title's stat at 4.86:1 (needs 4.5), the subtitle accent 4.84:1 (needs 3), the source line 5.24:1.

## Sound

`audio: { loudness: -14, bed: { key: 'E minor', end: 'lift', movement: 0.55, pulse: { kick: -8, hats: -12 } } }`, `sound` at the engine's defaults. 38 cues: 4 booms, 3 swells, 3 arcs, 10 pings, 11 data runs, 7 locks (the three cards cut short by their region's end get none). Chords: 0.00 i add9, 2.50 VI maj7, 7.83 III maj7, 14.00 VII add9, 17.50 iv9, 21.20 VI maj9, 25.53 i add9, 28.50 I (the lift).

## Renders

- `globe-acme-relay.mp4`: `render.mjs render --crf 30`, 6.08 MB (1.57 Mb/s), H.264 High, yuv420p, BT.709, faststart, 1,860 frames; AAC 48 kHz 192 kb/s at -14.1 LUFS (range 1.4 LU, true peak -2.7 dBTP). Rendered in 11 min on 4 cores. The default CRF 16 makes 38.5 MB; at 30 the decoded frames are 33.9 to 40.8 dB PSNR against the canvas: the grain and the finest dot texture are smoothed, the dots, arcs and card text intact (checked full size).
- `preview.gif`: the engine's GIF defaults for a globe film, 320 x 180, 8 fps, 32 colours: 2.50 MB, 248 frames.
- `poster.png`, `poster-9x16.png`, `poster-1x1.png`: frame 1,602 (the render's poster at 16:9, byte for byte the same as `render.mjs frame 1602`; the same frame with `--format 9:16` and `--format 1:1`), quantised to 256 colours with ffmpeg for the repository (palettegen, then paletteuse without dithering): 773, 685 and 481 KB. `render.mjs` writes them in full colour, 1.7 to 2.6 MB each.

## Review stills

`render.mjs stills` at each format: frame 0, the globe formed, the subtitle, each flight, each region locked, each card at rest, the total, the streak, the lockup and the last frame. 133 checks, 0 warnings, 0 failures at 16:9, 9:16 and 1:1.
