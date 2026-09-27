# Engine: the FILM config for charts

Step 4. The film is one HTML file with one canvas. [../templates/film.html](../templates/film.html) holds the whole engine; for a new film you copy it to `videos/<film>/src/film.html` and edit only the `FILM` block at the top. The template runs as it is: a 12 s data story for a fictional coffee app. The core it sits on (springs, motion blur, the loop, the page API) is described in core.md; the fields every engine shares (`W H FPS DUR BPM loop blur palette fonts grid springs poster`) are listed there.

Two things set this engine apart. **Every number on screen comes from `FILM.data`**: charts and counters take a dataset, text takes `{refs}`, and the engine formats every label itself. And **motion comes in two kinds that never mix**: `enter`, `keys` and `exit` move the element on any spring; `grow` moves the data, on critically damped springs only.

## Data

`FILM.data` is a map of datasets. Each one is a row (or several) of the brief's Facts table.

| Field | Meaning |
|---|---|
| `values` | one number per category |
| `categories` | the category names, in order; each is drawn as a label, so write them as they should read (`'MON'`, `'FLAT WHITE'`) |
| `series` | several series over the same categories: `{ WEB: [...], APP: [...] }` (lines; a bar chart shows the first) |
| `value` | a single number: a KPI for a counter |
| `total` | the whole the parts belong to. A donut must have one; `axis: { max: 'total' }` uses it for a progress bar |
| `format` | how every label prints it, below |
| `source` | the BRIEF.md Facts row the numbers come from (`'F2'`). Required |
| `label`, `unit` | what it measures, for whoever reads the file (not drawn) |
| `changeFormat` | the format of `.change` (default: a signed whole percent) |

`FILM.sources` maps each Facts row to what the on-screen source line says for it: `{ F2: 'ACME ANALYTICS, JUNE 2026' }`. A scene that shows any number from the data gets a source line, `FILM.sourcePrefix` (default `'SOURCE: '`) followed by the sources of every dataset it shows, joined by `; `.

### Refs: a number by name

| Ref | Is |
|---|---|
| `kpi` | a dataset with one `value` |
| `week.SAT` | the value of a category |
| `week.3` | the value at an index (0-based) |
| `week.sum`, `.max`, `.min`, `.mean`, `.first`, `.last`, `.total` | computed from the values |
| `week.change` | the change from the first value to the last, as a percent of the first, in `changeFormat` |
| `week.diff` | `last - first`, signed, in the dataset's format |
| `visits.WEB.SAT` | one series of several, then any of the above |

Text shows a ref in braces: `text: '{week.sum} CUPS'`. Counters take `ref: 'week.sum'`. A number typed by hand into text fails the critique unless it is a value the data holds (and then it warns); a number that is not a data claim (a year, a version) goes in the layer's `literal: ['2026']`.

### Format

| Field | Default | Example |
|---|---|---|
| `decimals` | 0 | `1`: 4.2 |
| `group` | `','` | `' '` (a thin or plain space), `''` for none |
| `point` | `'.'` | `','` |
| `prefix`, `suffix` | `''` | `'$'`, `'%'`, `'K'`, `' CUPS'` |
| `sign` | false | true: `+12`. Negative numbers always take a true minus, `−12` (U+2212) |
| `scale` | 1 | `1000` with `suffix: 'K'` and `decimals: 1`: 48215 prints as 48.2K |

Rounding is half away from zero, applied to the printed digits only: the bar is drawn at the exact value.

### Numbers in fixed slots

Counters and value labels lay their digits out in slots: every digit gets the widest digit's advance and each separator its own slot, taken from the widest value the label will ever show (its start, its end and every retarget). The value is right-aligned into the slots, so a count never shifts a digit sideways; the sign or prefix rides just left of the first digit; the suffix sits after the last slot. The rest position is set by the final value (a centred counter is centred on its final ink). Digits read the frame's quantised time `q`, so motion blur never averages two numbers; positions read the exact `t`.

## Scenes

A film is a list of scenes. Each is drawn inside its window and holds layers drawn in order.

| Field | Meaning |
|---|---|
| `id` | unique name |
| `t0`, `t1` | the window the scene is drawn in. A transition extends the outgoing scene until the incoming one covers it |
| `in` | how it arrives at `t0` (below) |
| `bg` | a palette role filling the scene's own background (default: none, the film's `bg` shows) |
| `wrap` | only on the hold loop's last scene, the lockup: `{ exit: 0, to: { scale: 0 }, spring: 'EXIT', stagger: 32 }`. Its layers are at rest at frame 0, leave at `exit` (staggered by layer), are hidden once gone, and come back with their own `enter` and `grow` |
| `punch` | `{ at, z }`: a camera punch-in about the canvas centre (1.04 is plenty), undone at the next scene's start: instantly at a cut or wipe, eased otherwise |
| `exit` | `{ at, to, spring, stagger }` for every layer of the scene that has no `exit` of its own |
| `source` | the source line: `{ at, x, y, anchor, size, font, fill, on, track }`. By default it types in small print (mono 24, muted, +20) at the left margin on the lowest grid line that keeps its descenders in the live area, starting with the scene's first data (a chart's axis a 16th before its data, a counter's entrance), and leaves when the last of its charts starts to leave (an element exit or an exit to zero), or with the scene. `false` fails the critique in a scene that shows data |
| `layers` | what is in it, below |

### Transitions (`in`)

| Kind | What happens |
|---|---|
| `'none'` | the scene just starts drawing at `t0`, over or after the outgoing one; overlap exits and entrances |
| `'cut'` | a hard cut: motion blur stops at it. Chart chrome (axis, category labels, a donut's track) whose entrance would start at the cut is simply on screen, so the cut lands on something |
| `{ kind: 'circle', x, y, spring }` | the incoming scene (on its `bg`) is revealed inside a circle growing from (x, y) until it covers the frame (MASK, about 0.3 s) |
| `{ kind: 'wipe', n: 5, dir: 'up', color, stagger: 32, spring }` | `n` bars in `color` sweep in and cover the frame by `t0`, the scenes swap under them, and they sweep on out. `dir`: `up`, `down`, `left`, `right`. Seven bars rising read as a column chart filling the screen |

## Layers

Every layer has `id` (unique across the film) and `kind`, and may have:

| Field | Meaning |
|---|---|
| `x`, `y` | position; for text, counters and notes the anchor x and the baseline |
| `rot`, `scale`, `op` | rest rotation (degrees), scale and opacity of the whole element |
| `on` | the role it sits on, for the contrast checks (default: the scene's `bg`) |
| `accent` | `'land'` (text and marks: the entrance lands; counters and charts: the last number reaches its final value) or a time: an accent frame for the stills and the palette gate |
| `bleed` | `true` exempts it from the live-area check |
| `enter`, `keys`, `exit` | the element's motion; `grow` the data's (below) |

An unknown field fails the critique (a typo would otherwise do nothing). So do `legend`, `depth`, `perspective`, `tilt`, `explode`, `axis2`, `y2`, `secondary`, and `axis.break` or `axis.log`, each with the reason.

### `text`: display type and small print

`text` (may hold `{refs}`), `font` (a role in `FILM.fonts`), one size rule (`size` px, `cap` px of cap height, or `fit: true` to span the measure / `fit: <px>`), `track` and `pairs` (1/1000 em), `anchor` (`L`, `C`, `R`), `fill`, `clip: [x0, y0, x1, y1]`, `literal`. Every glyph is a copy with its own springs, so `stagger` runs across the letters. `enter: { at, typed: true }` types it one character per frame with a block cursor instead (small print).

### `counter`: a number that counts

| Field | Meaning |
|---|---|
| `ref` | the number (required) |
| `font`, `size` / `cap` / `fit`, `track`, `anchor`, `fill` | as for text; `fit` sizes the final value to a width |
| `format` | overrides fields of the dataset's format |
| `grow` | `{ at, from: 0, spring: 'COUNT' }`: counts from `from` to the value |
| `keys` | `[{ at, ref, spring }]`: counts on to another value |
| `exit` | a state for the element, or `{ at, to: 'zero' }`, which fades the number out at its landed value (an exit is not a data change) |

A counter counts as one word of display type.

### `columns` and `bars`: one series from a zero line

`columns` stand up from a baseline; `bars` run right from it (ranked lists, before and after, progress).

| Field | Meaning |
|---|---|
| `data` | a dataset with categories (required) |
| `box` | `[x0, y0, x1, y1]`, the plot area (required). Columns: y1 is the axis minimum (zero for positive data), y0 the maximum. Bars: x0 is the minimum, x1 the maximum. Labels sit outside it |
| `axis` | `{ min, max }`. Default: from `min(0, values)` to `max(0, values)`, so the largest value touches the box's edge. `max: 'total'` takes the dataset's total (a progress bar). Every value of every retarget must fit |
| `width` | bar thickness: a fraction of the band (default 0.6) or px |
| `radius` | the rounded data end, px (default 8); the base is square |
| `fill`, `colors` | the bars' role; `{ SAT: 'crema' }` per category |
| `highlight` | `'SAT'`, `['SAT', 'SUN']` or `{ cat, fill }`: lit from the start. `keys: [{ at, highlight, fill }]` lights it later: the bar cross-fades to `fill` on FADE and its category label to the value labels' colour |
| `track` | a role: a full-scale track behind each bar |
| `values` | `{ font: 'label', size: 30, fill: 'paper', gap: 12, track: 0 }` or `false`: each bar's value, riding its end and counting on the bar's own spring. Fades in over the first 0.6 cap heights of growth |
| `cats` | `{ font: 'mono', size: 24, fill: 'muted', gap: 16, track: 20, pos, every: 1, y }` or `false`. `pos`: columns `'below'`; bars `'left'` (right-aligned against the zero line) or `'above'` each bar |
| `baseline` | `{ stroke: 'muted', width: 2 }` or `false`; off by default under a `track` and for bars labelled `'above'` |
| `grid` | `[2500, 5000]` or `{ at, stroke, width, font, size, fill }`: hairlines at those values with their tick labels (columns and lines: sitting on the line at the plot's left edge; bars: under the plot), with as few decimals as the ticks need |
| `sort` | `'desc'` or `'asc'`: the categories in value order, fixed at build |
| `rank` | bars: `true` numbers the category labels, `1. LATTE` |
| `grow` | `{ at, spring: 'GROW', stagger, order }`. `order`: `index`, `reverse`, `center`, `value` (smallest first), `rank` (largest first), `random` |
| `keys` | `[{ at, data: 'other', spring, stagger, order }]`: every bar retargets to another dataset with the same number of categories (matched by name, else by position; labels count along and category names swap). `[{ at, highlight, fill }]`: light a bar |
| `exit` | a state for the element, or `{ at, to: 'zero', spring: 'EXIT', stagger, order }`: the bars drop back to zero (their labels keep their values and fade), then the chrome leaves |

The axis and category labels (the chrome) arrive a 16th before the data, staggered like the bars, unless the scene starts on a cut or a wipe at that moment, when they are simply there.

### `line`: change over the categories

| Field | Meaning |
|---|---|
| `data`, `series` | the dataset; `series: ['WEB']` draws a subset (default all) |
| `box`, `axis`, `grid`, `cats`, `baseline` | as for columns. Points sit on the box's left and right edges and evenly between |
| `stroke`, `colors` | one series' role; `{ WEB: 'blue', APP: 'lime' }` for several |
| `width` | line width, px (default 6) |
| `points` | point radius, px (default 9; 0 for none). Each point pops (POP) when the line reaches it and wears a 3 px ring of the surface |
| `curve` | `'linear'` (default) or `'monotone'` (Fritsch-Carlson: smooth, and never overshoots a point) |
| `area` | a role: an opaque fill between the line and zero (one series only) |
| `labels` | which points show their value: `'end'` (default), `'all'`, `'max'`, `'min'`, `'none'`, `['SAT', 3]`, or `{ show, font, size, fill, gap, pos }` with `pos` `'above'` (default) or `'below'` |
| `names` | the series named at the line's end, `WEB 26.4K` (the end value follows the name): `{ font, size, fill: 'muted', gap: 18 }`; on by default with several series. There are no legends |
| `grow` | `{ at, spring: 'TRACE', stagger }`: each series draws on from the left; `stagger` between series |
| `keys` | `[{ at, data }]`: every point retargets; `exit: { at, to: 'zero' }` draws the line back off |

Labels appear only at points: a label riding the drawing tip would show interpolated values the data does not hold.

### `donut`: parts of a whole

| Field | Meaning |
|---|---|
| `data` | a dataset with categories and a `total` (required) |
| `x`, `y`, `r`, `width` | centre, outer radius (default 240) and ring width (default 72) |
| `gap` | a surface-coloured gap between neighbouring slices, px (default 6); it takes the same width from both sides of every boundary |
| `start` | where the first slice starts, degrees clockwise from 12 o'clock (default 0) |
| `colors` | `{ OAT: 'crema', ... }`: every slice needs a role |
| `remainder` | `'OTHER'`: when the parts sum to less than the total, the rest is a slice of that name (give it a colour) |
| `track` | a role: the whole ring, drawn under the parts |
| `centre` | `{ cat, font: 'display', size / cap, fill: 'paper', caption, captionFont: 'mono', captionSize: 26, captionFill: 'muted', gap: 20 }`: one slice's share, big, counting as its slice sweeps, with a caption naming it. Counts as one word |
| `labels` | `{ font: 'label', size: 30, fill: 'paper', catFill: 'muted', gap: 28 }` or `false`: every other slice named outside its middle, `DAIRY 38%`, counting as its slice sweeps |
| `grow` | `{ at, spring: 'SWEEP' }`: the parts sweep round from `start`. `exit: { at, to: 'zero' }` sweeps them back (labels hold their values and fade) |

### `note`: an annotation

A dot on a data point, a leader line drawing out to a label, the label typed.

| Field | Meaning |
|---|---|
| `chart`, `cat`, `series` | the point it annotates: a chart in the same scene and a category (and a line's series). The anchor rides the data: above a column's value label, beyond a bar's, at a line's point (the leader starts at the point's edge, towards the label), outside a slice's middle |
| `point` | `[x, y]` instead: a fixed point |
| `text`, `font`, `size`, `track`, `x`, `y`, `anchor`, `fill` | the label (default mono 26, +20, anchored `C`); `{refs}` allowed |
| `stroke`, `width`, `dot`, `gap` | leader colour (default the label's), width 3, dot radius 7 (0 on a line chart, whose point is the dot), clearance 12 |
| `enter` | `{ at, label }`: the dot pops at `at`, the leader draws from a 32nd later (DRAW) to the nearest edge of the label's box, the label types from a 16th later (or `label`) |

### `mark`: a simple shape

For logos and small pictures: `shape` `circle` (`r`), `ellipse` (`rx`, `ry`), `rect` (`w`, `h`, `radius`), `poly` (`sides`, `r`), `star` (`points`, `r`, `inner`), `arc` (`r`, `from`, `to`), `line` (`points` or `x1 y1 x2 y2`, `closed`), `path` (`d`, `size` px across); `fill`, `stroke`, `width`, `cap`, `join`, `trim`, `dash`. `x`, `y` is its centre. For anything richer, the shapes skill has the full vocabulary.

## Motion: enter, keys, exit and grow

The element moves on states; a state may hold `dx`, `dy` (px from rest), `rot` (degrees added), `scale`, `op`, `blur` (text only, px), `trim` (`[start, end]` of a mark's stroke) and `fill` (a mark's fill opacity).

- `enter: { at, from, spring, stagger, order }`: the element sits in the `from` state until `at`, then springs to rest. Text staggers across its letters; everything else moves as one.
- `keys: [{ at, to, spring, stagger }]`: later targets, in time order.
- `exit: { at, to, spring, stagger }`: the last move.

The data moves on `grow`, on `keys` that name `data` or `ref`, and on `exit: { to: 'zero' }`. Its springs must be critically damped (ζ = 1): the critique fails any other, and prints the false number it would show. A `highlight` key changes a colour, on FADE. `stagger` is a note value (16 is a 16th: 0.125 s at 120 BPM; 32 a 32nd; 8 an eighth).

## Springs

The core's springs (springs.md) plus these. "Last digit" is when a count shows its final number for good: a critically damped spring approaches slowly at the end, so a 5-digit number needs its value within 0.5 of the target, a relative error of 5e-5.

| Name | ζ | ω | Settles (s) | Lands (s) | Overshoot | Within 0.5 px of 500 px | Last digit of 10,000 | Use |
|---|---|---|---|---|---|---|---|---|
| COUNT | 1 | 9 | 1.778 | 0.527 | none | 1.026 | 1.390 | a counter counting |
| GROW | 1 | 11 | 1.455 | 0.431 | none | 0.839 | 1.137 | bars and columns growing, retargets |
| SWEEP | 1 | 8 | 2.000 | 0.593 | none | 1.154 | 1.563 | a donut sweeping, a progress bar filling |
| TRACE | 1 | 10 | 1.600 | 0.474 | none | 0.923 | 1.251 | a line drawing on, a mark's stroke |
| POP | 0.50 | 22 | 1.455 | 0.110 | 16.3 % | | | a line's points and a note's dot popping in, a logo mark (sizes, never values) |

A share of 100 shows its last digit sooner: 0.83 s on COUNT, 0.93 s on SWEEP. Use `landed` from the critique rather than guessing: it checks the rest still.

## Adding something the vocabulary lacks

First try the kinds together: a before and after is two columns (or bars) and a `{ref}` to `.change`; a progress bar is one bar with `axis: { max: 'total' }` and a `track`; a ranked list is `bars` with `sort: 'desc'` and `rank: true`; a KPI row is two or three counters. If a chart needs its own drawing, add a kind to the engine that keeps the contract: its numbers are Props registered as data (so the spring and landing checks see them), labels read `q` and are formatted by `fmtNum`, its motion is measured in `disp`, it is drawn only from `t` and `q`, and `visible` and `dataShown` know about it, so motion blur, stills, the source check and the critique all work.
