# Design: <film>

The spec the film is built from. Numbers here and in the FILM config agree; when one changes, change both. Text baselines start as a first guess and are settled after the first build, from the cap heights `render.mjs layout` reports.

## Canvas and grid

- 1080 x 1080, 60 fps, 12.000 s = 720 frames, hold loop.
- Live area 104 to 976 on both axes (margin 104). Every label and mark stays inside it.
- Baseline unit 8 px: every text, counter and note baseline is a multiple of 8.
- Tempo 120 BPM: beat 0.5 s, 16th 0.125 s, bar 2 s. Every entrance starts on a 16th.

## Formats

- Master 1:1 (1080 x 1080). Delivered also: <9:16 (1080 x 1920) / 16:9 (1920 x 1080) / none>.
- Positions are in base pixels; with no `pin` an element keeps its offset from the centre. Pins: <layer: edge, or none>.

| Format | Layout | Patched (`FILM.formats`) |
|---|---|---|
| 9:16 | stacked; taller charts, bigger type; titles, labels and source between y 360 and 1560 | <boxes, sizes, y, source y> |
| 16:9 | title beside the chart, wider plots | <boxes, x, split titles, note x> |

## Data

Every number on screen, where it comes from, and how it prints. The Facts rows are in BRIEF.md.

| Dataset | Values | Format | Prints as | Facts row | On-screen source |
|---|---|---|---|---|---|
| | | | | F | |

Derived numbers shown (`{id.sum}`, `.change`): | ref | value | computed from |

## Palette

| Role | Hex | Used for | Contrast on its backdrop |
|---|---|---|---|
| bg | | the film's background | |
| paper | | titles, values | |
| muted | | category names, source lines | |
| | | accent: the one mark the story is about | |
| | | neutral mark: every other bar or slice | |

Chart colours, as the critique measures them (every mark at least 3:1; pairs at least dE 15 normal, 8 under protan/deutan simulation):

| Chart | Colours | Worst contrast | Worst pair, normal | Worst pair, CVD |
|---|---|---|---|---|
| | | | | |

## Type roles

| Role | Face | Size rule | Tracking | Use |
|---|---|---|---|---|
| display | Inter Tight 800 | cap height on the grid, or `fit` | +10 | titles, counters |
| label | Inter 700 | 28 to 36 px | 0 | values on bars, slice names |
| mono | IBM Plex Mono 500 | 24 to 32 px | +20 to +40 | category names, notes, source lines, small print |

## Beat sheet

| # | Scene | Window (s) | In | Finding (title) | Chart | Accent |
|---|---|---|---|---|---|---|
| 0 | lockup (wrap) | frame 0, rebuilt from | | | | |
| 1 | hook | 0.00-3.00 | circle | | counter | |
| 2 | | | wipe | | | |
| 3 | | | cut | | | |
| 4 | lockup | | none | | | |

## Per beat

### Hook, 0.00 to 3.00

| Layer | Kind | Data | Geometry | Paint | Element motion | Data motion |
|---|---|---|---|---|---|---|
| | counter | | x, baseline, size | | enter at, from, spring | grow at, spring; lands at |

- Words: <n> of display type.
- Source line: types from <t>, leaves at <t>.
- Rest still at <t>: every value landed.
- Accent: <layer> at <t>.

### ...

For a chart, give its `box`, its axis (from zero to ...), bar width, label sizes, the grow start, stagger and order, when the last value lands, any highlight or note, and the exit.

## Transitions

| At (s) | From | To | Kind | Notes |
|---|---|---|---|---|
| 0.00 | lockup | hook | circle from (x, y) | the incoming scene's bg is <role> |

## Loop seam

- Frame 0 shows the lockup at rest. It leaves at 0.00 (wrap exit, `scale: 0`, EXIT, 32nds by layer) and is rebuilt from <t>.
- The last spring settles at <t> s; typing ends at <t> s; frames <n> to <N-1> are a still hold equal to frame 0.
- The camera ends at z = 1.

## Review stills

Written by `render.mjs stills`: each scene in, each chart growing, each scene at rest, each accent frame, frame 0 and the last frame, plus `stills/contact.png`.
