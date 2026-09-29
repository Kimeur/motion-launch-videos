# Design: <film>

The spec the film is built from. Numbers here and in the FILM config agree; when one changes, change both. Text baselines start as a first guess and are settled after the first build, from the cap heights `render.mjs layout` reports.

## Canvas, grid and formats

- Master 1080 x 1080, 60 fps, <n> s = <N> frames, hold loop. Delivered at: <9:16 (1080 x 1920), 1:1, 16:9 (1920 x 1080)>.
- Live area 104 px in from every edge. Text and tags stay inside it; photos may bleed. At 9:16 type stays between y 360 and 1560.
- Baseline unit 8 px: every text baseline is a multiple of 8.
- Tempo 120 BPM: beat 0.5 s, 16th 0.125 s, bar 2 s. Every entrance starts on a 16th.

## Palette

The photos carry the colour; the palette is for what is drawn.

| Role | Hex | Used for | Contrast on its backdrop |
|---|---|---|---|
| bg | | the page, taken from the photos | |
| ink | | type on the page, scrims | |
| paper | | type on photos and dark scenes, pills, leaders | |
| shade | | frame and cutout shadows | |
| | | accent: the price, the URL | |

## Type roles

| Role | Face | Size rule | Tracking | Use |
|---|---|---|---|---|
| display | Bricolage Grotesque 800 | cap height on the grid | 0 | beats, the name |
| mono | IBM Plex Mono 500 | 26 to 36 px | +20 to +60 | tags, labels, URL, small print |

## Images

| id | File | Pixels | Focus | Subject | Shown in | Largest shown (per format) | BRIEF row |
|---|---|---|---|---|---|---|---|
| hero | assets/<file>.jpg | | [x, y] | [x0, y0, x1, y1] | hook, full-bleed | 1:1 0.63x, 9:16 ..., 16:9 ... | A1 |

## Beat sheet

| # | Scene | Window (s) | In | Picture and move | Words | Tags (fact) |
|---|---|---|---|---|---|---|
| 0 | lockup (wrap) | frame 0, rebuilt from | | | | |
| 1 | hook | 0.00-2.50 | circle | hero, full-bleed, pull back 1.16 to 1.02 | | |
| 2 | | | wipe | | | |
| 3 | | | split | | | |
| 4 | | | shape | | | |
| 5 | lockup | | wipe | | | |

## Per beat

### Hook, 0.00 to 2.50

| Layer | Kind and size | Position (pin) | Image, fit, focus | Move (kb, drift, depth) | Enter / keys / exit |
|---|---|---|---|---|---|
| | | | | | |

- Words sit on: <a quiet part of the photo / a scrim / the page>; contrast measured <n>:1.
- Tags: <text> on <target> (fact F<n>), lands at <t>.

### ...

## Transitions

| At (s) | From | To | Mask | Notes |
|---|---|---|---|---|
| 0.00 | lockup | hook | circle from the centre | the hook's own bg inside the mask |

## Other formats

| Format | Scene | Layer | Patch | Why |
|---|---|---|---|---|
| 9:16 | hook | HERO | `full: false, pin: 't', y, w, h` | the picture above the words |
| 16:9 | hook | HERO | `pin: 'l', x, w, h` | the picture beside the words |

## Loop seam

- Frame 0 shows the lockup at rest. The first scene's mask covers it from 0.00; it leaves under the cover (wrap exit) and is rebuilt from <t>.
- Every Ken Burns move and drift ends by <t>; the last spring settles at <t> s; typing ends at <t> s; frames <n> to <N-1> are a still hold equal to frame 0.

## Review stills

Written by `render.mjs stills` (and `--format 9:16`, `--format 16:9`): each transition half-way, each scene at rest, each carousel step and slider stop, the end of each move, frame 0 and the last frame, plus `stills/contact.png`.
