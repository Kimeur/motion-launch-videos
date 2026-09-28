# Design: <film>

The spec the film is built from. Numbers here and in the FILM config agree; when one changes, change both. Positions are logical pixels on the small canvas, top-left origin; `render.mjs layout` reports the measured boxes, speeds and repeats.

## Pixel grid

- Logical canvas 180 x 180 at x6 = 1080 x 1080 (16:9: 320 x 180; 9:16: 180 x 320, from the same film with `--format`). The scale is a whole, even number.
- 60 fps, 10.000 s = 600 frames, cycle loop. Motion blur off.
- Live area: margin 8 logical px (8 to 172 on both axes). Text stays inside it; the world bleeds.
- Tempo 120 BPM: beat 0.5 s, 16th 0.125 s, bar 2 s. Entrances, hops and blinks sit on the grid.

## Palette

At most 16 colours, drawn for this film (or the brand's colours quantised into it). Every pixel is one of them.

| Role | Hex | Used for | Contrast where it matters |
|---|---|---|---|
| bg | | the sky's top, the page background | |
| ink | | outlines, text outline | |
| | | | |

## Sprites

| Sprite | Size | Frames | fps | Period (s) | Whole per loop | Notes |
|---|---|---|---|---|---|---|
| hero | 16 x 20 | 6 | 12 | 0.5 | 20 | run: contact, down, pass, then the other leg |
| | | | | | | |

## Layers, back to front

| Layer | Kind | y | Speed (px/s) | Step | Repeat (px) | Period (s) | What is on it |
|---|---|---|---|---|---|---|---|
| SKY | sky | 0 | | | | | bands and dithered changes |
| | strip | | 20 | 1 px / 3 frames | 200 | 10 | |
| | tiles | | 60 | 1 px / frame | | | |

Nothing unique on a layer shows twice: speed x DUR is at least the screen width plus the object's width.

## Text

| Layer | Text | Scale | Box (logical) | Output cap height | Fill | Outline / drop | Backdrop, contrast |
|---|---|---|---|---|---|---|---|
| | | 3 | | 126 px | | ink / deep [0, 2] | ink, : 1 |
| DEMO | DEMO COPY, FICTIONAL PRODUCT | 1 | | 42 px | | none | , : 1 |

At most 4 words of display type (scale 2 and up) on screen at once.

## Formats

Every position above is on the base canvas. Each layer's `pin` maps it into the other formats; each delivered format has a patch in `FILM.formats` (engine.md, Formats).

| Format | Logical canvas | Patch | Staging |
|---|---|---|---|
| 1:1 | 180 x 180 | none: the base | <as above> |
| 9:16 | 180 x 320 | <titles a scale up, higher drops> | <140 rows more sky; the title fills it> |
| 16:9 | 320 x 180 | <far layers at 30 px/s, 300 px repeat; title lower> | <140 columns more world; nothing unique shows twice> |

- Pins: <world layers 'b', clouds 't', title and sparkles centred>.
- Composition at each format (from `render.mjs stills --format`): <1:1 x %, 9:16 x %, 16:9 x %>.

## Timeline

| Time (s) | Beat | What happens | Spring / effect |
|---|---|---|---|
| 0.00 | 0 | | |
| | | | |

- Accents: <layer> lands at <t>; shake <px> px for <dur> s on <layer>.
- Something moves on every beat: <the run cycle, the scroll, blinks, hops>.

## The loop

- Cycle loop: every period above divides DUR; the world is speed x DUR px long, so every item passes once per loop.
- Layers that enter also leave (or have a `show` window), so nothing pops at its entrance.
- `seam` in the critique: the film drawn on to t = DUR is frame 0.

## Review stills

Written by `render.mjs stills`: frame 0 and the last frame, each text landing and at rest, each exit, the first glint, the first hop and pickup, the shake, the poster, plus `stills/contact.png`.
