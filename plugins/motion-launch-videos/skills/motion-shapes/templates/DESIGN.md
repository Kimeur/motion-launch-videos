# Design: <film>

The spec the film is built from. Numbers here and in the FILM config agree; when one changes, change both. Text baselines start as a first guess and are settled after the first build, from the cap heights `render.mjs layout` reports.

## Canvas and grid

- 1080 x 1080, 60 fps, 10.000 s = 600 frames, hold loop.
- Live area 104 to 976 on both axes (margin 104). Text stays inside it; background shapes may bleed.
- Baseline unit 8 px: every text baseline is a multiple of 8.
- Tempo 120 BPM: beat 0.5 s, 16th 0.125 s, bar 2 s. Every entrance starts on a 16th.

## Formats

- Master 1:1 (1080 x 1080). Delivered also: <9:16 (1080 x 1920) / 16:9 (1920 x 1080) / none>.
- Positions are in base pixels; with no `pin` an element keeps its offset from the centre. Pins: <layer: edge, or none>.

| Format | Layout | Patched (`FILM.formats`) |
|---|---|---|
| 9:16 | stacked, bigger type; type between y 360 and 1560 | <layers and fields that move: sizes, y, split titles, entrance offsets> |
| 16:9 | picture left, words right; lockup in a row | <layers and fields that move> |

## Palette

| Role | Hex | Used for | Contrast on its backdrop |
|---|---|---|---|
| bg | | the film's background | |
| paper | | type, strokes | |
| | | accent: one focal point per beat | |
| | | second accent, a wipe or a scene background | |

Overlapping chromatic shapes are opaque (no blended third colour).

## Type roles

| Role | Face | Size rule | Tracking | Use |
|---|---|---|---|---|
| display | Unbounded 700 | cap height on the grid | +10 | beats |
| mono | IBM Plex Mono 500 | 26 to 40 px | +20 to +40 | small print, typed |

## Beat sheet

| # | Scene | Window (s) | In | Picture | Words | Accent |
|---|---|---|---|---|---|---|
| 0 | lockup (wrap) | frame 0, rebuilt from | | | | |
| 1 | hook | 0.00-2.50 | none | | | |
| 2 | | | circle | | | |
| 3 | | | bars | | | |
| 4 | lockup | | none | | | |

## Per beat

### Hook, 0.00 to 2.50

| Layer | Shape and size | Position | Paint | Enter (at, from, spring, stagger) | Keys / exit |
|---|---|---|---|---|---|
| | | | | | |

- Accent: <layer> lands at <t>.
- Camera: punch to 1.06 at <t>, after everything has landed.

### ...

## Transitions

| At (s) | From | To | Kind | Notes |
|---|---|---|---|---|
| 2.50 | hook | ... | circle from (x, y) | the incoming scene's bg is <role> |

## Loop seam

- Frame 0 shows the lockup at rest. It leaves at 0.00 (wrap exit, `scale: 0`, EXIT, 32nds by layer) and is rebuilt from <t>.
- The last spring settles at <t> s; typing ends at <t> s; frames <n> to <N-1> are a still hold equal to frame 0.
- The camera ends in the world it starts in, at z = 1.

## Review stills

Written by `render.mjs stills`: each scene in, each scene at rest, each accent frame, frame 0 and the last frame, plus `stills/contact.png`.
