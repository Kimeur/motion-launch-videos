# Engine: the FILM config for a data globe

Step 4. The film is one HTML file with one canvas. [../templates/film.html](../templates/film.html) holds the whole engine; for a new film you copy it to `videos/<film>/src/film.html` and edit only the `FILM` block at the top. The template runs as it is: a courier network for a fictional product, Acme Relay, on demo data. The core it sits on (springs, motion blur, sound, formats, the page API) is described in core.md; the fields every engine shares (`W H FPS DUR BPM loop palette fonts poster audio formats`) are listed there. The world dataset (`WORLD`: a 0.25-degree country raster, ISO codes, outlines, lookups) is spliced in below the core, from Natural Earth (public domain).

The engine draws the world in Canvas 2D with its own perspective projection: a Fibonacci lattice of dots kept where there is land, an opaque body with a fresnel rim and an atmosphere, arcs, beams and rings in additive light, a quarter-size bloom, then the HUD on top, sharp, and a fixed grain and scanline plate. Everything is a function of `t`.

## The FILM block

| Field | Meaning |
|---|---|
| `W`, `H` | the base format, 1920 x 1080. Positions are authored in it (Formats, below) |
| `FPS`, `DUR`, `BPM` | 60 fps; 25 to 35 s for a story of 3 or 4 regions; the tempo of the bed's pulse |
| `loop` | `'none'`: the film plays once and ends on its lockup (the critique warns on any other) |
| `palette`, `fonts` | roles (Palette, Fonts, below) |
| `grid` | `{ margin: 64, unit: 8 }`: the live area's margin. Cards and HUD blocks stay inside it |
| `poster` | the time of the poster frame: the pull back with the total landed |
| `brand` | `{ name, kicker, url, tagline, mark, markBox, demo }`: the brand block top left and the lockup. `mark` is the product's own line icon as SVG path data in a `markBox` px square, stroked; `tagline` is `[roman, italic accent]`; `demo` prints under the lockup (`'DEMO DATA, FICTIONAL PRODUCT'` for a demo, removed for a real film) |
| `sources` | `{ F2: 'what the source line says' }`, one entry per Facts row a dataset cites. `sourcePrefix` (default `'SOURCE: '`) |
| `data` | the datasets (Data, below) |
| `places` | every place the film names (Places, below) |
| `card` | the card every pin starts from (Cards, below) |
| `hud` | positions and options of the HUD blocks (HUD, below) |
| `globe` | the look of the world (Globe, below) |
| `story` | the beats, in time order (Story, below) |
| `audio`, `sound` | the bed and the engine's cues (Sound, below) |
| `formats` | patches per aspect ratio (Formats, below) |

## Data

```js
data: {
  parcels: { label: 'Parcels handed over today, per hub', unit: 'parcels', source: 'F2',
    categories: ['saopaulo', 'rio'], values: [12480, 9215] },
  sameday: { label: '...', unit: '%', source: 'F3', format: { suffix: '%' }, categories: [...], values: [...] },
  trend:   { label: '...', source: 'F5', categories: ['06', '08', '10'], series: { saopaulo: [1210, 1980, 2460], rio: [...] } },
  total:   { label: '...', source: 'F6', value: 80375 },
},
```

A dataset is one `value`, or `categories` with `values`, or `categories` with named `series`; every one names its Facts row in `source`, and `FILM.sources` says what the source line prints for it. `format` is `{ decimals, group, point, prefix, suffix, sign, scale }` (defaults: 0 decimals, `,` groups). A negative number prints with a true minus.

A **ref** names one number: `total` (a single value), `parcels.rio` (a category), `parcels.3` (an index), `parcels.sum` (also `max`, `min`, `mean`, `first`, `last`, `count`), `trend.rio.08` (one value of a series). `trend.rio` is a whole series (a card's bars). In text, `{parcels.sum}` prints the formatted value; a pin's card, a region and the total also fill the context tokens `{pin}` (the place id), `{place}` (its name), `{a2}` (the country code) and `{country}`. A digit typed into a text fails the critique unless the data holds it (a warning: write it as a ref) or it is declared in the beat's `literal: ['2026']`.

## Places

```js
places: {
  saopaulo: { name: 'São Paulo', country: 'BR', lat: -23.5505, lon: -46.6333 },
},
```

`country` is an ISO 3166 alpha-2 or alpha-3 code or the English name; `lat` and `lon` are decimal degrees, north and east positive. The critique passes a place inside its country's raster cells (or within 50 km of the coast, on the nearest land cell), warns within 30 km of the country across a border (a border town, a microstate: check it), and fails anything else, naming where the point really lies. A place may sit in an entity without its own code (`parent`, as `WORLD.countries` lists it).

Every arc, pin and flight refers to places by id; an arc between two ids that do not exist, or between a point and its antipode, fails.

## Story

`story` is a list of beats; the engine turns each into camera moves, arcs, pins, cards, titles and sound cues. Times are seconds.

### `open`: the world forms

| Field | Default | Meaning |
|---|---|---|
| `form` | 1.05 | when the world appears: the shock ring pops, the body fades in (0.75 s), the rim lights (1 s), the dots fade in (1.5 s) |
| `from` | `{ lat: 10, lon: 0, alt: 39000 }` | where the camera starts, far out |
| `to` | 40 degrees west, `alt: 19400` | where it drifts to before the first region; the altitude it settles to over 2.85 s |

### `arcs`: routes over the open

`{ id, kind: 'arcs', at, until, every: 0.3, routes: [['saopaulo', 'lisbon'], ...] }`: an intro arc launches every `every` seconds on average (seeded jitter), cycling through `routes`, each drawn in 0.45 to 0.8 s and lifted by its length; every fourth in the `rim` colour. Each stays lit (its glow settling to a third over 1.4 s, its head lit 0.9 s where it lands), so the routes build up; they all fade at `until` (0.4 s).

### `subtitle`

`{ kind: 'subtitle', at, until, lines: ['Parcels cross oceans,', 'hand to hand.'], size }`: centred lines in the `serif` face, the last in the `italic` accent; in over 0.36 s from a 6 px blur and 6 px below, out over 0.3 s. 6 to 10 words; the critique wants `0.3 s a word + 0.6 s` of hold.

### `region`: a country, its title and its pins

| Field | Default | Meaning |
|---|---|---|
| `id` | the country code | used by `formats` patches |
| `at` | | when the move to it starts |
| `country` | | ISO code or name; its land lights up when the camera locks and stays lit, dimmer, once left |
| `via` | `'dive'` first, then `'hop'` under 35 degrees, else `'fly'` | the move (below) |
| `from` | the last pin | a flight's start: a place id |
| `name`, `kicker` | the country's name, `'REGION · {a2}'` | the title block, bottom left |
| `stat` | | `{ ref: 'couriers.{a2}', label: 'COURIERS ON SHIFT', format }`: a count under the title |
| `view` | fitted | `{ lat, lon, alt, tilt, heading, fit }`: the camera's target and height. By default the centre of the country's main body, pulled towards its pins; the altitude from its size (3,200 to 14,000 km); the tilt from the altitude (53 degrees low, flat above 16,000 km); then pulled back until every pin sits in the middle of the frame (`fit: false` keeps the altitude) |
| `pins` | | the places, in order (Pins, below) |

The moves:
- **dive** (the first region): 3.2 s along the great circle with the altitude falling in step, the tilt coming in from 0.8 s; the title types in 1.55 s before the camera arrives.
- **hop** (a neighbour): 2.6 s; the camera lifts 13 % and flattens its tilt by half on the way, and comes down over the new country; the title at `at + 1.3`.
- **fly** (across an ocean): a hero arc launches from `from` to the first pin at `at`, drawn in 0.2 to 1.8 s by its length; 0.25 s later the camera chases its head along the same great circle (the `chase` ease: a soft start, the fastest at a third, a long settle) in 1.8 to 2.6 s, lifting 30 % and flattening to 5 degrees of tilt mid-flight. The title at `at + 0.9`.

### Pins

`{ id, place, at, gap: 0.7, still: false, link: true, card: { ... } }`.

- `at` is optional. Without it the first pin of a region comes 0.35 s after the camera arrives (0.48 s after a flight lands), and only once the camera has it in the middle of the frame (20 to 80 % across, 25 to 80 % down) and moving less than 14 % of the short side in half a second: a card cannot ride a pin that is still sliding. Each next pin comes `gap` seconds later. `render.mjs layout` prints the times.
- A pin: an orange reticle locks on 0.48 s before (shrinks from 2.4x, spins, holds), a flash, the beam rises in 0.15 s, a ring expands at its base over 1.2 s and a light wave runs through the dots round it. The beam's head is a ring with a dark eye while its region is on, a white square after.
- From the second pin on, the camera leans 42 % of the way towards each pin (`still: true` keeps it), and settles back over the region 1.25 s after the last. A link arc flies from the previous pin to land on this pin's flash (`link: false` for none).
- The pin counter in the telemetry counts every pin of the film.

### `total`: the pull back

`{ kind: 'total', at, view: { lat, lon, alt }, kicker, count: { ref, label }, second: { ref, label }, network }`: the camera pulls back over 3 s to `view` (default: the centre of every pin, at the open's altitude), flat and north up, with a slight push in at `at + 2.4`. Network arcs fly between the regions' hubs (the first pin of each region to the second of each later one, at most 8; or `network: [['a', 'b'], ...]`), 0.12 s apart from `at + 1.2`. The total block comes in at `at + 1.3` bottom right and counts for 1.16 s: the kicker, the big count, its label and the second figure.

### `outro`: the lockup

`{ kind: 'outro', at }`: the HUD goes at `at + 0.15`, the arcs at `+ 0.2`, the globe shrinks to 0.55 of its size over 1.75 s; at `+ 0.7` a flash and a light streak cross the frame through the globe's centre, the mark appears and the wordmark focuses in at `+ 0.86`, the tagline at `+ 1.11`, the URL pill at `+ 1.31`, the demo line at `+ 1.5`. The land breaks into drifting dust from `+ 1.0`, the dots are gone by `+ 1.7`, the rim and body by `+ 2.0`. Leave at least 1.5 s of lockup at rest after `+ 1.5`.

## Cards

```js
card: {
  chip: 'HUB SCAN', status: ['SYNCING', 'LIVE'], query: 'parcels today · {place}',
  count: { ref: 'parcels.{pin}', label: 'PARCELS' },
  second: { ref: 'sameday.{pin}', label: 'SAME DAY' },
  bars: 'trend.{pin}',
},
```

`FILM.card` is every pin's card; a pin's own `card` merges over it (`card: false` for none). Fields: `chip` (a label in a box), `status` (`[busy, done]`: a pulsing gold dot and word, mint once the progress bar fills), `query` (typed after a `>` at 85 characters a second, with a cursor), `count` and `second` (refs with labels and an optional `format`), `bars` (a series ref: up to 8 bars growing in), `progress` (`false` hides the bar and its percentage: the card's own loading state, not a claim), `coords` (`false` hides the coordinates line), `literal`, and placement: `side` (`'ur' 'ul' 'dr' 'dl' 'uc' 'dc'`), `dx`, `dy` (the gap from the beam's head), `w`, `h` (356 x 232 by default; it widens to fit its counts and query, up to 480).

The card's life, from its pin's time T0: the leader draws from the beam's head at T0 + 0.15; the card opens from a line of light at T0 + 0.22 (0.1 s); typing at + 0.28; the counts from + 0.33 and + 0.5 (easeOutCubic over 0.84 s, so they land without overshoot; the digits read the frame's quantised time); bars from + 0.6; the status turns done at + 1.47; it closes at T0 + 1.95, or when its region is left, whichever is first.

Placement is solved once, at build, for the card's whole life: every side and a grid of gaps is tried against the live area, the other open cards (and their leaders crossing), the HUD blocks and every beam that is up; the first clean one wins, else the least bad, and the critique reports what it hits.

## HUD

Positions are base px with a pin (core.md, Formats). `FILM.hud` merges over the defaults:

| Block | Default | What it is |
|---|---|---|
| `brand` | `{ x: 64, y: 68, pin: 'tl' }` | the mark, the name in `sans`, the brand kicker |
| `telemetry` | `{ x: 1856, y: 78, pin: 'tr' }` | LAT, LON, ALT of the camera's target, the pin counter, a progress line |
| `counter` | `'PINS'` | the counter's label (`'HUBS'`, `'STORES'`) |
| `title` | `{ x: 64, y: 884, pin: 'bl' }` | the region's kicker, name (typed, a grey to white gradient), rule and stat |
| `total` | `{ x: 1856, y: 904, pin: 'br' }` | the total block, right-aligned |
| `subtitle` | `{ x: 960, y: 856, pin: 'b', size: 64, lead: 84 }` | the subtitle's first baseline |
| `source` | `{ x: 960, y: 1004, pin: 'b', align: 'C' }` | the source line, on whenever a number is |
| `scrim` | 0.7 | a soft dark field under the title, the total and the source line, where they sit over the globe |
| `lockup` | `{ x: 960, y: 540 }` | the lockup's centre |
| `brackets` | `{ inset: 36, arm: 34 }` | the corner brackets |

## Globe

`FILM.globe` merges over these (the reference's measurements):

| Field | Default | Meaning |
|---|---|---|
| `dots` | 120000 | points of the lattice over the whole sphere; about 30 % fall on land and are drawn |
| `dotSize` | 0.1 | a dot's radius in degrees of arc: world-sized, big when close |
| `minDot` | 1.05 | px: the smallest a dot gets in a wide shot |
| `fov` | 34.3 | the vertical field of view of the short side, degrees |
| `frame` | the centre | `[x, y]` base px where the camera's target sits (raise it at 9:16) |
| `minAlt` | 400 | km: the critique fails a camera lower than this |
| `beam` | 150 | a beam's height, px on screen when seen side on |
| `rings` | 3 | orbit rings in wide shots (above 12,500 km), 0 for none |
| `sparkle`, `motes` | 1, 14 | the star field (specks that live two frames), slow drifting squares |
| `grain`, `scanlines` | 1, 1 | the texture plate's strength |
| `vignette` | 0 | darken the corners by this share (0.06 at most reads as a lens; the reference has none, its background is flat to the corners) |
| `bloom`, `bloomFloor`, `bloomRadius` | 0.45, 0.14, 12 | the bloom's gain (0 for none), the light below which nothing blooms, its radius in px |

Dots are drawn in four colours: `land`, `region` (a locked country), `lit` and `hot` (round a pin as it lands). The limb fades them; the outro breaks them into dust.

## Palette

| Group | Roles |
|---|---|
| the world | `bg` (the frame), `body` (the sphere), `rim`, `rimLit` (the fresnel rim and the lit crescent), `atmo` (the halo), `land`, `region`, `lit`, `hot` (dots) |
| light | `arc`, `white`, `beam`, `bloom`, `pin`, `leader`, `orbit`, `orbit2`, `mote`, `spark`, `streak`, `dust`, `reticle`, `reticleGlow` |
| cards | `card`, `cardEdge`, `tick`, `chip`, `chipEdge`, `busy`, `busyText`, `done`, `doneText`, `query`, `number`, `accent`, `label`, `coords`, `pct`, `bar`, `track` |
| HUD | `hudLabel`, `hudValue`, `kicker`, `titleLo`, `titleHi`, `total`, `statLabel`, `bracket`, `source`, `text` |
| lockup | `wordmark`, `brandDim`, `tagline`, `pill` |

Light is added (`lighter`), so a colour's brightness is its weight: keep arcs and beams light and saturated, the body near black, the land dim. Text colours are checked against the real backdrop (review.md).

## Fonts

`serif` (the subtitle, region names, the tagline), `italic` (the accent line, the tagline's accent), `mono` (labels, kickers, the query, the source), `monoLight` (card labels, coordinates), `monoBold` (telemetry values, second counts, the URL), `monoHeavy` (the big counts), `sans` (the wordmark; use the product's own). The mono roles must be monospaced: their widths are arithmetic, so a counter never shifts a digit.

## Sound

With `FILM.audio` the engine places its cues on its own beats; `FILM.sound` sets each kind's gain in dB, or `false` to drop it:

| Cue | Default gain | Where |
|---|---|---|
| `swell` + `boom` | -2, -3 | the world forming (a 1.4 s swell), the first pin of the first region (a short one), the lockup (0.9 s) |
| `boom` | -4 | the total landing |
| `arc` | -2 | each hop and flight, peaking as it lands, panned along it |
| `ping` | -5 | each pin, panned to its beam |
| `data` | -16 | under each card's typing, and under the total's count (4 a beat) |
| `lock` | -14 | each card's status turning done |

The engine registers a section at the world forming, at each region (the first at its first pin) and at the total and the lockup, so a `bed` changes chord there; a bed's `pulse` runs from the first pin to the lockup unless the film sets `from` and `to`. See audio.md.

## Formats

The master is 16:9 (1920 x 1080); `--format 9:16` renders 1080 x 1920 and `--format 1:1` 1080 x 1080. The globe is sized from the short side, so it keeps its pixel size in all three; HUD blocks keep their distance to the edges they are pinned to. `FILM.formats` patches what should differ; objects merge, and story beats and pins merge by `id`:

```js
formats: {
  '9:16': {
    globe: { frame: [960, 480] },                     // the camera's target above the middle of the tall frame
    hud: { title: { y: 536 }, total: { y: 560 }, subtitle: { y: 520 }, source: { y: 676 } },
    story: [{ id: 'open', to: { alt: 24000 } }, { id: 'total', view: { alt: 26000 } }],
  },
  '1:1': {
    hud: { source: { x: 1856, y: 140, pin: 'tr', align: 'R' } },
    story: [{ id: 'open', to: { alt: 21500 } }, { id: 'ar', pins: [{ id: 'buenosaires', at: 14.75 }] }, { id: 'total', view: { alt: 22000 } }],
  },
},
```

At 9:16 the frame shows sky above and below the globe: bring the title, total and subtitle in towards it, and pull the wide shots back so the whole globe fits the width. At 1:1 the cards have less room to the sides: a pin time or a view may need a patch. The region framing (`fitView`) uses shares of the frame, so it pulls back further in a narrow frame on its own. Run `stills` once per format.

## The camera

The camera looks at a target on the surface from `alt` km above it; `tilt` swings it back from straight down towards the south (so the horizon curves across the top of the frame), `heading` turns it (0 = north up). Each channel is a track of timed moves that superpose, and the target moves along great circles: each leg is a rotation, applied in order, so overlapping legs blend and the last lands exactly on its target. Every ease is monotonic: nothing overshoots. The critique walks every frame and fails a camera under `minAlt` or one whose horizon falls behind it.

## Motion blur

The world (globe, arcs, beams, rings) is averaged over the shutter on a canvas of its own; the HUD and the texture are drawn once, sharp, on top. `disp` measures how far 64 probe points on the globe, every pin's beam and the limb move across the shutter, so a slow drift gets 1 sample and a flight more, up to `MAX_SAMPLES` (64; the example's flights peak at 23); a still frame gets 1.

## Previews

The preview GIF defaults to 8 fps, 32 colours and 57,600 px (320 x 180 at 16:9, 180 x 320 at 9:16, 240 x 240 at 1:1): a globe of moving dots is dense, and these keep a 30 s film near 3 MB, under the 4 MB `verify` allows. `render --gif-fps 12 --gif-width 480 --gif-colors 64` overrides them. The MP4's size is set with `--crf` (SKILL.md, step 6).

## How the build goes

`build()` runs once, after the fonts load: the data (and its errors), the places (and their checks), the lattice (the land dots), the story (camera tracks and legs, arcs, regions, pins, the total and the outro), the cards (measured), the HUD (measured, its boxes registered), the cards' placement against those boxes, the sound cues, and the texture plate. `render.mjs layout` prints the result.

## Adding something the vocabulary lacks

A new layer is a function of `(c, t, cam)` called from `drawWorld` (in the light, under the HUD) or `drawHud` (sharp, on top). Draw from `t` alone, through `proj(cam, P)` for anything on the globe (with `facing(cam, P)` or `hiddenBySphere(cam, P)` to hide what is behind it), with colours from `col(role)`; add its motion to `disp` if it moves fast, and a box to `HUD_BOXES` if cards must keep clear of it. Text goes through `mono()` or `layoutText`/`drawText` (core.md), so the glyph check sees it.
