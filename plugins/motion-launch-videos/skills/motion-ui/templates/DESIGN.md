# Design: <film>

The spec the film is built from. Numbers here and in the FILM config agree; when one changes, change both. Screen layers are traced from the user's screenshots in screen units; callout baselines are settled after the first build, from the cap heights `render.mjs layout` reports.

## Canvas and device

- 1080 x 1080, 60 fps, 12.000 s = 720 frames, hold loop.
- Live area 104 to 976 on both axes (margin 104). The device at rest, callouts and the lockup stay inside it; the device's shadow may bleed.
- Baseline unit 8 px: every callout and lockup baseline is a multiple of 8.
- Tempo 120 BPM: beat 0.5 s, 16th 0.125 s, bar 2 s. Every action starts on a 16th.
- Device: <phone / tablet / browser>, screen <w> x <h> units (from the screenshots at <n>x), scale <s>, centre (<x>, <y>), box <x0, y0, x1, y1> on the canvas.

## Formats

Delivered: <1:1 / 9:16 / 16:9>. Positions below are in the 1080 x 1080 base; each other format is a patch in `FILM.formats` (engine.md, Formats). Say for each where the device and the words go, and what the patch changes.

| Format | Canvas | Device (centre, scale, box) | Callouts (position, pin, leader side) | Other changes | Composition |
|---|---|---|---|---|---|
| 1:1 | 1080 x 1080 | (<x>, <y>), <s>, <box> | right column, leaders left | | <lean> |
| 9:16 | 1080 x 1920 | (<x>, <y>), <s>, <box> | centred above the device, pin t, leaders down | <enter/exit offsets, zoom place, lockup size> | <lean> |
| 16:9 | 1920 x 1080 | (<x>, <y>), <s>, <box> | the column beside the device | | <lean> |

## Palette

| Role | Hex | Used for | Source (token, file or screenshot) | Contrast on its backdrop |
|---|---|---|---|---|
| bg | | the film's background | | |
| ink | | text, the device body | | |
| paper | | screen background, cards | | |
| line | | dividers, skeleton bars | | |
| muted | | secondary text, small print | | |
| brand | | buttons, the leader dot, the icon | | |
| tint | | the brand's light tint: fields, done states | | |
| shade | | the device shadow | | |

Crossfades stay in one hue (brand to tint, line to brand); scrims, ripples and the finger are neutral.

## Type roles

| Role | Face | Size rule | Use |
|---|---|---|---|
| ui | Inter 600 | 24 to 32 units | UI labels, buttons, the clock |
| display | Inter Tight 800 | cap 44 to 56 px (callouts), 36 to 44 units (titles) | callouts, large titles, the lockup name |
| mono | IBM Plex Mono 500 | 24 to 34 px | the domain, small print |

## Screens

One table per screen, traced from its screenshot. Say what was simplified.

### <screen id> (from <screenshot file>)

| Layer | Type | Box (x, y, w, h) | Paint | Text / notes |
|---|---|---|---|---|
| | | | | |

- Simplified: <rows cut, text turned into bars, ...>
- Status bar: <status role>; fixed layers: <...>; content height: <n> units.

## Script

| Beat | Time (s) | Action | Target | Notes |
|---|---|---|---|---|
| 0.25 | 0.125 | device enters | | from dy <n>, LIFT |
| | | pointer in | | |
| | | tap | | the pointer lands at <t> |
| | | push / expand | | |

## Callouts

| Id | Words | Position (x, baseline) | Names | In to out (s) |
|---|---|---|---|---|
| | | | | |

## Camera

- Focus on <id> at z <z>, placed at <fx, fy>, from <t> to <t>; back at rest by <t> (ZOOM settles 2 s after it starts).

## Loop seam

- Frame 0 shows the lockup at rest. It leaves at 0.00 (wrap exit, EXIT, 32nds by layer) and is rebuilt from <t>.
- The device waits at dy <n> (off the canvas, shadow included) before it enters, and leaves to the same place.
- The pointer is out, every caret has stopped, and the camera is at rest before the lockup.
- The last change is at <t> s (<what>); frames <n> to <N-1> are a still hold equal to frame 0.

## Review stills

Written by `render.mjs stills`: each tap, transition, state change, overlay and zoom, each callout landed, frame 0 and the last frame, plus `stills/contact.png`.
