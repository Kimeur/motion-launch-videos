# Design: <film>

The spec the film is built from. Numbers here and in the FILM config agree; when one changes, change both. Times start as a plan and are settled after the first build, from what `render.mjs layout` reports (the pins' automatic times, the cards' windows).

## Canvas and formats

- 1920 x 1080 (16:9) master, 60 fps, <DUR> s = <N> frames, `loop: 'none'`.
- Live area 64 px in from every edge (`grid.margin`): every card and HUD block stays inside it.
- Delivered also: <9:16 (1080 x 1920) / 1:1 (1080 x 1080) / none>.

| Format | Camera framing | HUD moved (`FILM.formats`) | Story patched |
|---|---|---|---|
| 16:9 | target at the centre | | |
| 9:16 | `globe.frame` <x, y> | title, total, subtitle, source y | the open's and the total's altitude |
| 1:1 | | source line | <pin times> |

## Places

Every place on screen or at the end of an arc. Coordinates from <the user's data / a gazetteer>, read on <date>.

| Id | Name on screen | Country | Lat | Lon | Critique |
|---|---|---|---|---|---|
| | | | | | PASS: in <country> |

## Data

| Dataset | Values | Format | Prints as | Facts row | On-screen source |
|---|---|---|---|---|---|
| | | | | F | |

Derived numbers shown (`{id.sum}`, `.count`): | ref | value | computed from |

## Story

| # | Beat | At (s) | Camera | On screen | Sound |
|---|---|---|---|---|---|
| 0 | open | 0 to <form + 1.5> | from <lat, lon, alt> to <lat, lon, alt> | the world forms, orbit rings | swell, boom at <t> |
| 1 | arcs + subtitle | <at> to <until> | drifting | <n> routes; "<line 1>" / "<line 2>" | |
| 2 | region <country> | <at> | dive, arrives <t>, <alt> km, tilt <deg> | title "<name>", kicker, stat <ref> | swell + boom on the first pin; the pulse starts |
| 3 | region <country> | <at> | hop | | arc |
| 4 | region <country> | <at> | flight from <place>, lands <t> | | arc |
| 5 | total | <at> | pull back to <lat, lon, alt> | kicker, <count ref>, <second ref> | boom, data run |
| 6 | outro | <at> | the globe recedes | lockup: mark, <name>, "<tagline>", <url> | swell, boom |

## Pins and cards

| Pin | Region | Time (layout) | Card side | Open (s) | Count | Second | Bars |
|---|---|---|---|---|---|---|---|
| | | | | in to out | <ref> = <value> | | <series ref> |

At most two cards open at once; each open at least 0.9 s.

## HUD

| Block | Position (base px, pin) | Text |
|---|---|---|
| brand | 64, 68, tl | <name>, <kicker> |
| telemetry | 1856, 78, tr | LAT, LON, ALT, <COUNTER> |
| title | 64, 884, bl | per region |
| total | 1856, 904, br | |
| source | 960, 1004, b | SOURCE: <...> |

## Palette

| Role | Hex | Used for | Contrast on its backdrop |
|---|---|---|---|
| bg | | the frame | |
| body | | the sphere | |
| land, region, lit, hot | | the dots: unvisited, visited, round a pin | |
| arc, beam, white | | the light | |
| text, accent | | the subtitle, the accent line, second counts | |
| <brand> | | the wordmark, the pill | |

## Type

| Role | Face | Size | Use |
|---|---|---|---|
| serif | | 64 px subtitle, 64 px region name, 42 px tagline | |
| italic | | | the accent line |
| mono, monoLight, monoBold, monoHeavy | | 11 to 17 px labels, 28 and 44 px counts, 68 px total | |
| sans | | 92 px | the wordmark |

## Sound

- `FILM.audio`: bed in <key>, end <lift / resolve>, pulse <kick, hats> from the first pin to the lockup; loudness <-14> LUFS.
- `FILM.sound` gains: boom <-3>, swell <-2>, arc <-2>, ping <-5>, data <-16>, lock <-14>.

## Review stills

Written by `render.mjs stills`: the globe formed, the subtitle, each flight, each region locked, each card at rest, the total, the streak, the lockup, frame 0 and the last frame, plus `stills/contact.png`, per format.
