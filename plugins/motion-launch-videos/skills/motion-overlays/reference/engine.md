# Engine: the FILM config for overlays

Step 3. The film is one HTML file with one canvas. [../templates/film.html](../templates/film.html) holds the whole engine; for a new film you copy it to `videos/<film>/src/film.html` and edit only the `FILM` block at the top. The template runs as it is: a lower third for a fictional host at a fictional studio. The core it sits on (springs, motion blur, transparency, sound, the page API) is described in core.md; the fields every engine shares (`W H FPS BPM loop blur palette fonts springs poster transparent audio`) are listed there.

One film is one overlay. It comes in from frame 0, holds, and goes out before the last frame, over a transparent background (`transparent: true`, `loop: 'none'`). A bug or a badge that stays on for a whole video can instead be a hold loop: at rest on frame 0, an idle glint or pulse, at rest again at the end.

## The FILM block

| Field | Meaning |
|---|---|
| `W`, `H` | the base format: 1920 x 1080. Positions are authored in it (Formats, below) |
| `FPS` | 60 by default; set the edit's rate (30, 25, 24) when the editor asks for it |
| `palette` | roles; `bg` is the footage the overlay is judged and previewed against, never drawn. Set it to the kind of footage it will sit on (a mid grey by default) |
| `transparent` | `true` (the default here): every frame starts transparent; `render` writes the .mov and .webm with alpha. `false` draws `bg` behind the overlay, a plain film |
| `loop` | `'none'` (in, hold, out). `'hold'` for a `bug` or a `badge` only |
| `timing` | `{ in, hold, out }` in seconds. Everything lands within `in`; the overlay rests at least `hold`; the exit fits in `out`. `DUR` is a getter that adds them up: change `hold`, never `DUR` |
| `overlay` | what the film is: `{ kind, ... }`, below |
| `tag` | optional small print on its own plate that comes and goes with the overlay (the demo's `DEMO COPY, FICTIONAL PRODUCT`): `{ text, font, cap, track, fill, plate, x, y, pin }`. Not counted in the reading time |
| `sfx` | the cues the engine places, heard only with `FILM.audio`: `{ in: 'whoosh', land: false, out: 'swish', click: 'click' }` by default; any cue kind (audio.md), or `false` for none |
| `composition` | the lean the overlay means (core.md, Composition). Left out, the engine declares the lean of its own parts ("a lower-third sits where the edit needs it") |
| `platformZones` | the 9:16 feed's UI (below); `false` turns the check off, or a list of `{ id, box: [x0, y0, x1, y1] }` in canvas px of the vertical frame |
| `limits` | overrides for the thresholds of the checks (review.md): `titleSafe`, `actionSafe`, `minCap`, `bigCap`, `cps`, `minRead`, `middle`, `moment`, `bugOpacity`, `bugArea`, `bugHeight` |
| `formats` | patches per aspect ratio (Formats, below) |

### Placing: `x`, `y` and `pin`

Every kind is placed by one point and a pin. `(x, y)` is the point of the overlay's box on the side of its pin: with `pin: 'bl'` it is the bottom-left corner, with `'tr'` the top-right corner, with `'b'` the middle of the bottom edge, with no pin the centre. In other formats the pin keeps that corner's distance to its edges (core.md, Formats), so a lower third pinned `'bl'` stays in the bottom-left corner of any frame.

Title safe at 1920 x 1080 runs from (96, 54) to (1824, 1026), action safe from (67, 38) to (1853, 1042). Common anchors: a lower third at `x: 144, y: 918, pin: 'bl'`; a bug at `x: 1776, y: 96, pin: 'tr'`; a card at the centre, `x: 960, y: 540`.

### Text

A line of text is `{ id, text, font, cap, size, track, fill, plate, pad, keyline, keylineWidth }`: `cap` is the cap height in px (or `size` the font size), `track` the tracking in 1/1000 em, `fill` a role, `plate` the role of the box behind it (`null` for none), `pad` `[x, y]` inside that box. A `keyline` role with a `keylineWidth` of at least a tenth of the cap height outlines the glyphs, for text with no plate.

## Kinds

Every snippet below passes the critique at 16:9 with the template's palette (`dark`, `light`, `accent`, unless it gives its own), fonts (`name`, `label`) and timing (unless it gives its own).

### `lower-third`

Name and role, a place, or a quote's attribution: a stack of tiers, each line on its own plate, with an optional accent bar and icon block on the pinned side.

| Field | Meaning |
|---|---|
| `lines` | the tiers, top to bottom. The first defaults to the `name` font, the rest to `label`. Each line may have its own `plate` and `pad` |
| `bar` | `{ fill, w, gap }`: a bar the height of the stack that grows up first |
| `icon` | `{ name, plate, fill, size, gap }`: a square block beside the tiers with an icon (`pin` for a place, `quote` for an attribution, `mic`, `play`...) |
| `gap` | px between tiers (0 joins them) |
| `even` | `true`: every tier as wide as the widest |
| `plate`, `radius` | the default plate role and corner radius of the tiers |

Pinned right (`'br'`), the stack mirrors: the bar and icon on the right, the tiers right-aligned, wiping in from the right. In: the bar grows (GROW), each plate wipes open from the bar (WIPE), each line slides out from behind the bar's edge, clipped by its plate, focusing from a blur (SLIDE), 70 ms apart. Out: the lines slide back, the plates close, the bar drops (EXIT).

```js
overlay: { kind: 'lower-third', x: 144, y: 918, pin: 'bl', icon: { name: 'pin', plate: 'accent', fill: 'dark' }, even: true,
  lines: [{ id: 'place', text: 'Harbour Studio', cap: 44, fill: 'light', plate: 'dark' },
          { id: 'where', text: 'PIER 4, EAST DOCKS', font: 'label', cap: 26, track: 90, fill: 'light', plate: 'dark' }] },
```

### `title`

A title or chapter card: an optional kicker ("CHAPTER 2"), an optional rule, and one or two title lines, on an optional plate or a full-width band. The one kind allowed to hold the middle of the frame.

| Field | Meaning |
|---|---|
| `kicker` | a line above, `label` font in the accent by default |
| `rule` | `{ w, h, fill, gap }`: a short rule between kicker and title, drawn out from its centre |
| `lines` | the title lines |
| `plate`, `plateOpacity`, `band` | the plate's role and opacity; `band: true` runs it the full width of the frame (it bleeds past the safe areas, as a band should) |
| `pad`, `gap`, `gapKicker`, `align` | padding `[x, y]`, the gaps between lines, `'L'`, `'C'` or `'R'` (from the pin by default) |

In: the band opens from its centre line, the kicker drops in tracking together, the rule draws out, the title rises through a blur and tracks in. Out: the words lift and fade, the band closes.

```js
overlay: { kind: 'title', x: 960, y: 540, plate: 'dark', plateOpacity: 0.78, band: true, pad: [0, 56],
  kicker: { text: 'CHAPTER 2', cap: 30, track: 200, fill: 'accent' }, rule: { w: 120, h: 6, fill: 'accent' },
  lines: [{ id: 'title', text: 'The first build', cap: 88, fill: 'light' }] },
```

### `social`

Handles on pills, in a row (or `dir: 'column'`), and an optional follow or subscribe button that a pointer clicks.

| Field | Meaning |
|---|---|
| `items` | `[{ id, icon, text, cap, iconFill, plate }]`: `at`, `globe`, `play`, `bell`, `mic` or no icon. Handles only as the user gives them |
| `button` | `{ text, done, icon, fill, ink, doneFill, doneInk, click, pointer }`: the button, its label after the click (`done`), and when the click comes, in seconds after `timing.in`. `pointer: false` clicks it without the pointer |
| `h`, `pad`, `gap`, `radius`, `plate` | pill height, inner padding, gap, corner radius (a full pill by default), default plate |

In: the pills pop from their centres (POP), their icons pop, the words slide in. The pointer glides in (GLIDE), presses (the button dips to 92 %, SNAP, and springs back, POP), the button crossfades to its done colours and label, a bell rings (SNAP, SNAP, SWING). A `click` cue sounds on the press.

```js
overlay: { kind: 'social', x: 144, y: 936, pin: 'bl',
  items: [{ id: 'handle', icon: 'at', text: '@acmestudio', cap: 30 }, { id: 'site', icon: 'globe', text: 'example.com', cap: 30 }],
  button: { text: 'SUBSCRIBE', done: 'SUBSCRIBED', icon: 'bell', cap: 28, track: 80, fill: 'accent', ink: 'dark', doneFill: 'dark', doneInk: 'light', click: 1.2 } },
```

### `endscreen`

The last 5 to 20 seconds of a YouTube video, where the platform draws its own end-screen elements (videos, playlists, a subscribe button) on top. The overlay supplies the words and the frames round them and keeps the elements' areas clear.

| Field | Meaning |
|---|---|
| `lines` | each line placed on its own: `{ id, text, cap, fill, plate, pad, x, y, pin, align }` |
| `zones` | the areas the platform's elements will cover, as you will set them in YouTube Studio: `{ id, x, y, w, h, pin }` for a video or playlist (16:9), `{ id, x, y, r }` for the round subscribe element |
| `frames` | `{ stroke, w, inset, keyline }`: an outline drawn on just outside each zone |
| `guides` | `true` draws the zones as dashed outlines, to check the layout; the critique warns until it is off again |

Nothing but a zone's own frame may overlap a zone (the critique fails it). Set `timing.hold` to the end screen's length minus the in and out.

```js
timing: { in: 1, hold: 18, out: 0.5 },     // a 19.5 s end screen
overlay: { kind: 'endscreen',
  lines: [{ id: 'head', text: 'WATCH NEXT', cap: 56, track: 60, fill: 'light', plate: 'dark', pad: [40, 26], x: 960, y: 196 },
          { id: 'url', text: 'EXAMPLE.COM', cap: 28, track: 120, fill: 'dark', plate: 'accent', pad: [28, 16], x: 960, y: 986 }],
  zones: [{ id: 'video-1', x: 192, y: 322, w: 704, h: 396, pin: 'tl' }, { id: 'video-2', x: 1024, y: 322, w: 704, h: 396, pin: 'tl' },
          { id: 'subscribe', x: 960, y: 834, r: 64 }],
  frames: { stroke: 'accent', w: 6, inset: 14 }, guides: false },
```

### `bug`

A corner mark for the whole video: a rounded square with an icon or a letter, and an optional wordmark beside it, settling to a set opacity.

| Field | Meaning |
|---|---|
| `mark` | `{ icon, letter, d, rule, scale, font, cap, size, plate, fill, radius }`: on a plate `size` px square, an icon (`play` by default), a letter, or the user's own logo as SVG path data `d` (one colour, `rule: 'evenodd'` for holes), fitted to `scale` (0.62) of the plate |
| `text` | an optional wordmark line, on the side away from the corner; with no plate, give it a keyline |
| `opacity` | the rest opacity, 0.8 at most (the critique's limit) |
| `glint` | `{ at, fill, op }` or `false`: a light band crossing the mark once, at `at` s in a hold loop, after the in otherwise |

With `loop: 'none'`: the mark pops, the letter or icon turns in, the wordmark slides out from behind it, and all of it settles to `opacity` (SETTLE). With `loop: 'hold'` and `timing: { in: 0, hold: 6, out: 0 }`: at rest at `opacity` on frame 0, the glint crosses, at rest again; the editor loops the clip under the whole video.

```js
loop: 'hold', timing: { in: 0, hold: 6, out: 0 },
overlay: { kind: 'bug', x: 1776, y: 96, pin: 'tr', opacity: 0.8, glint: { at: 1 },
  mark: { icon: 'play', size: 84, plate: 'accent', fill: 'dark', radius: 18 },
  text: { text: 'ACME STUDIO', cap: 26, track: 100, fill: 'light', keyline: 'dark', keylineWidth: 4 } },
```

### `callout`

A ring round a spot in the footage, an arrow to it from a label, or both.

| Field | Meaning |
|---|---|
| `target` | `[x, y]`: the spot, in base px, with `pin` (none: its offset from the centre, as the footage is usually framed) |
| `mark` | `'circle'`, `'arrow'` or `'both'` |
| `r`, `width`, `stroke`, `keyline`, `keylineWidth` | ring radius, stroke width and role, and the keyline under it (`dark`, 4 px by default) |
| `label` | a line on its own plate, with its own `x`, `y` and `pin` |

In: the ring draws on from 12 o'clock and settles from 125 % (TRACE, POP), the arrow draws from the label to the ring and its head pops, the label wipes in. The target follows the footage, not the frame: at another aspect ratio, patch it to where the spot is in that crop.

```js
overlay: { kind: 'callout', target: [1240, 420], r: 96, mark: 'both', width: 8,
  label: { text: 'NEW DIAL', cap: 30, track: 80, fill: 'dark', plate: 'accent', x: 1560, y: 760, pin: '' } },
```

### `progress`

A thin bar that fills across the hold, with optional ticks and a label: a segment's progress, a countdown's bar.

| Field | Meaning |
|---|---|
| `x`, `y`, `pin`, `w`, `h` | the bar's box; by default the full width of title safe, sitting on its bottom edge |
| `fill`, `track`, `trackOpacity` | the fill's role, the track's role and opacity |
| `from`, `to` | the fill at the start and end of the hold (0 to 1) |
| `ticks` | positions of chapter marks, 0 to 1 |
| `label` | a line on a plate above the bar's left end |
| `bleed` | `true` for an edge-to-edge bar (web players), exempt from action safe |

The fill runs linearly in time from the end of the in to the start of the out: it measures time, so it neither eases nor overshoots.

```js
overlay: { kind: 'progress', h: 10, fill: 'accent', track: 'dark', trackOpacity: 0.6, ticks: [1 / 3, 2 / 3], from: 0, to: 1 / 3,
  label: { text: 'PART 1 OF 3', cap: 26, track: 100, fill: 'light', plate: 'dark' } },
```

### `badge`

A pill with a dot and a word ("LIVE", "NEW", "REPLAY"). The dot sends out a ring every `period` seconds, a whole number of times, so it is at rest when the pulses stop. `loop: 'hold'` suits a badge that stays on; with `loop: 'none'` it comes in, pulses through the hold and goes out.

| Field | Meaning |
|---|---|
| `text`, `cap`, `track`, `fill`, `plate` | the word and its plate |
| `dot`, `dotR`, `dotFill` | `false` for no dot; its radius and role |
| `period` | seconds per pulse (1 by default) |

```js
palette: { bg: '#56606B', dark: '#111318', light: '#FFFFFF', red: '#C8281E' },   // white on red: 5.56:1
loop: 'hold', timing: { in: 0, hold: 4, out: 0 },
overlay: { kind: 'badge', text: 'LIVE', cap: 30, track: 120, fill: 'light', plate: 'red', x: 144, y: 96, pin: 'tl', period: 1 },
```

## Formats

The master is 16:9 (1920 x 1080); `--format 9:16` renders it at 1080 x 1920 and `--format 1:1` at 1080 x 1080 (core.md, Formats). Sizes do not change between these formats (the short side is 1080 in all three); positions map through the pin. `FILM.formats` patches what should differ:

```js
formats: {
  '9:16': {
    overlay: { x: 72, y: 592, lines: [{ id: 'name', cap: 56 }, { id: 'role', cap: 30 }] },  // raised above the caption, bigger
    tag: { x: 72, y: 324, pin: 'tl' },
    composition: { lean: 'left', why: 'a lower third starts at the left edge of a narrow frame' },
  },
  '1:1': { tag: { y: 96, pin: 'tr' } },
},
```

Objects merge and `lines` merge by `id`, so a patch names only what changes. Positions in a patch are still base-format px mapped through the pin: at 9:16, `y: 592` with `pin: 'bl'` puts the stack's bottom 488 px above the bottom edge, at canvas y 1432 of 1920, just above the feed's caption.

- **9:16.** The feeds draw their UI over the video: the header and tabs over the top tenth, the caption, handle and sound over the bottom quarter, the like, comment and share buttons down the right 14 % below 40 % of the height (`platformZones`; an approximation of Reels, TikTok and Shorts, which move them now and then). The critique fails a part that touches one. Bigger type reads better on a phone.
- **1:1.** Same sizes as 16:9 in a narrower frame: check that corner elements (a tag, a bug) do not now collide with the stack.
- The critique, the safe areas and the zones run at the format being checked: run `stills` once per delivered format.

## Preview over footage

The core composites the MP4, the GIF and the contact sheets over `bg` only, a flat colour. To see the overlay over a still of the real footage (or to give the client a preview), composite the .webm or .mov over it with ffmpeg; ffmpeg's built-in VP9 decoder drops the alpha, so name `libvpx-vp9` as the decoder:

```bash
ffmpeg -loop 1 -framerate 60 -i footage.jpg -c:v libvpx-vp9 -i renders/<film>.webm \
  -filter_complex "[0]scale=1920:1080,setsar=1[b];[b][1]overlay=shortest=1:repeatlast=0:format=auto,format=yuv420p" \
  -c:v libx264 -crf 18 -movflags +faststart renders/<film>-over-footage.mp4
```

`-framerate` is the film's `FPS` (the still otherwise runs at 25 and sets the output's rate); `repeatlast=0` keeps the last frame.

The still is the user's own frame; it stays out of the film folder's deliverables.

## Springs

The core's springs (springs.md) plus these:

| Name | ζ | ω | Settles (s) | Lands (s) | Overshoot | Use |
|---|---|---|---|---|---|---|
| SLIDE | 0.78 | 24 | 0.855 | 0.164 | 2.0 % | text sliding out from behind an edge |
| WIPE | 1 | 24 | 0.667 | 0.198 | none | a plate opening (a reveal never overshoots its box) |
| GROW | 0.80 | 26 | 0.769 | 0.160 | 1.5 % | an accent bar growing |
| POP | 0.50 | 24 | 1.333 | 0.101 | 16.3 % | pills, icons, a ring popping in |
| SNAP | 0.80 | 40 | 0.500 | 0.104 | 1.5 % | a button press, a bell's first swings |
| SWING | 0.40 | 30 | 1.333 | 0.072 | 25.4 % | a bell settling |
| TRACE | 1 | 14 | 1.143 | 0.339 | none | a callout's ring or arrow drawing on, an end screen's frames |
| GLIDE | 1 | 9 | 1.778 | 0.527 | none | the pointer gliding in, a glint crossing |
| SETTLE | 1 | 8 | 2.000 | 0.593 | none | a bug fading down to its rest opacity |

Exits use the core's EXIT (critically damped, 32.4 rad/s), always with opacity to 0: an exit is gone, to under 0.15 % of its opacity, 0.27 s after it starts.

## How the timeline is built

Each kind makes **parts** (a box, a line of text, an icon, a stroke, a dot, a fill, a glint), each with its own Props: `dx`, `dy`, `sc`, `op`, `rv` (how much of a box is revealed, from its `side`), `tr` (a stroke's trim), `bl` (blur), `rot`, `tk` (extra tracking). A part gets an entrance (it sits in a `from` state until its time, then springs to rest), keys during the hold (the button press) and an exit.

- Entrances are timed from 0; `timing: in` fails a part that lands after `timing.in`.
- Exits are scheduled back from the end: the last part is gone two frames before the last frame, so the clip ends clean, and the hold takes whatever is left. `timing: out` fails when the exit needs more than `timing.out` and so eats into the hold, and prints the value to set.
- A text part inside a plate is clipped to the plate as it is at that moment: it slides out from behind the edge that is wiping open.
- Motion blur measures every part's move (`disp`): offsets, scale and rotation about the part's centre, the reveal across its box, the trim along a stroke, the progress fill and the pulse.

## Adding something the vocabulary lacks

A new kind is a function that makes parts from its FILM fields and gives them entrances and exits, added to `KINDS`. Use the existing part types where you can: a box, a line of text, an icon, a stroke. A new icon is SVG path data on a 24-unit grid (`ICONS`), drawn from simple geometry: never a platform's logo. A part type of your own must be drawn only from `t`, measured in `disp`, and give a `box` for the safe-area and clean-alpha checks.
