# Design: <film>

The spec the film is built from. Numbers here and in the FILM config agree; when one changes, change both. Baselines start as a first guess and are settled after the first build, from the cap heights `render.mjs layout` reports.

## Canvas and grid

- 1080 x 1080, 60 fps, 12.000 s = 720 frames, seamless loop.
- Live area 104 to 976 on both axes (margin 104). Display measure 872.
- Baseline unit 8 px: every baseline and rule edge is a multiple of 8.
- Tempo 120 BPM: beat 0.5 s, 16th 0.125 s, bar 2 s. Every entrance starts on a 16th; every accent lands on a frame the springs compute.

## Palette

| Role | Hex | Used for | Contrast on bg |
|---|---|---|---|
| bg | | full-bleed background | |
| fg | | display type | |
| accent | | accent lines, rules, misregistration left pass, smear | |
| accent2 | | crumbs, scramble noise, misregistration right pass | |

## Type roles

| Role | Face | Size rule | Tracking | Use |
|---|---|---|---|---|
| display | Archivo Black 400 | `fit`: ink spans the measure exactly | -20 (1/1000 em) | beats |
| label | Syne 800 | cap height on the grid | -30 | small display labels |
| mono | IBM Plex Mono 500 | 32 px | +20 | crumbs, typed one character per frame |

## Beat sheet

| # | Scene | Window (s) | Bars (1-based) | In | On screen | Accent |
|---|---|---|---|---|---|---|
| 0 | lockup (wrap) | frame 0, rebuilt from | | | | |
| 1 | hook | 0.00-2.50 | 1 to 2.25 | none | | |
| 2 | | | | cut | | |
| 3 | | | | mask | | |
| 4 | | | | pan | | |

## Per beat

### Hook, 0.00 to 2.50

- World 1, enters with no transition (the lockup leaves at 0.00).
- Lines (text, role, size rule, baseline, colour; measured size and cap height from `layout`):
  - 
- Motion: enter at, from (px), spring, blur, stagger.
- Crumb: text, starts at, x, baseline.
- Camera: punch to 1.08 at 2.00.
- Accent: misregistration on the landing of <line>.

### ...

## Transitions

| At (s) | From | To | Kind | Notes |
|---|---|---|---|---|
| 2.50 | hook | ... | cut | motion blur clamped at the cut |

## Loop seam

- Frame 0 shows the lockup at rest. It leaves at 0.00 (wrap exit, dy -880, EXIT spring) and is rebuilt from <t>.
- The last spring settles at <t> s; frames <n> to <N-1> are a static hold equal to frame 0.
- The camera ends in the world it starts in, at z = 1.

## Review stills

Written by `render.mjs stills`: each scene in, each scene at rest, each accent frame, frame 0 and the last frame, plus `stills/contact.png`.
