# Design: <film or pack>

The spec the overlay is built from. Numbers here and in the FILM config agree; when one changes, change both. Boxes and cap heights are settled after the first build, from what `render.mjs layout` reports. For a pack, one DESIGN.md serves every film in it: the shared design first, then a row per film.

## Overlay

- Kind: <lower-third / title / social / endscreen / bug / callout / progress / badge>, one per film.
- Plays over: <the footage: an interview, a screen recording, a night street>; `bg` <hex>, the stand-in for it in the previews.
- Delivered to: <the editor or platform>, at <fps> fps: the .mov (ProRes 4444) and the .webm (VP9), both with alpha; the MP4 and GIF over `bg` for review; the .wav if it has sound.

## Canvas and safe areas

- Master 16:9, 1920 x 1080, <fps> fps, transparent, `loop: 'none'` (or `'hold'` for a bug or badge that stays on).
- Title safe 96 to 1824, 54 to 1026 (all text). Action safe 67 to 1853, 38 to 1042 (every other part).
- Delivered also: <9:16 (1080 x 1920) / 1:1 (1080 x 1080) / none>.

| Format | Anchor (x, y, pin) | Patched (`FILM.formats`) | Clear of |
|---|---|---|---|
| 16:9 | 144, 918, bl | | title and action safe |
| 9:16 | | <position, sizes> | the feed's header (top tenth), caption (bottom quarter), buttons (right 14 %, below 40 %) |
| 1:1 | | | |

## Palette

| Role | Hex | Used for | Contrast |
|---|---|---|---|
| bg | | the footage (never drawn) | |
| dark | | plates | |
| light | | text on dark plates | on dark: |
| accent | | the bar, the second plate, the button | dark on accent: |

Text with no plate: <none / keyline role and width / tested on light, mid and dark>.

## Type

| Role | Face | Cap height | Tracking | Use |
|---|---|---|---|---|
| name | Barlow 700 | 48 px | 0 | names, titles |
| label | Barlow 600 | 26 px (at least) | +60 to +120 | roles, kickers, handles, small print |

## Words

| Part | Text | Characters | Facts |
|---|---|---|---|
| | | | F1 |

Reading time: <characters> / 15 = <s>, at least 1.5 s; the hold is <s>.

## Timing

| Phase | Seconds | What happens |
|---|---|---|
| in | 0.00 to <in> | <the bar grows, the plates wipe open, the lines slide out from behind the bar> |
| hold | <in> to <exit> | at rest (<or: the button is clicked at ..., the dot pulses every ...>) |
| out | <exit> to <DUR> | <the lines slide back, the plates close, the bar drops>; clean for the last two frames |

`timing: { in: , hold: , out: }`, DUR = <s> = <frames> frames. The exit starts where the critique's `timing: out` row says.

## Motion

| Part | In (at, from, spring) | Out (offset, to) |
|---|---|---|
| | | |

Accent: <part> lands at <t> s. Cues (with `FILM.audio`): <whoosh at ..., swish at ...>, loudness <-20> LUFS.

## Pack

| Film | Kind | Words | Notes |
|---|---|---|---|
| <pack>-01 | | | |

## Review stills

Written by `render.mjs stills`: frame 0 (empty), coming in, the accent, landed, mid-hold, going out, the last frame (empty), plus `stills/contact.png` over `bg`. Check each delivered format, and a decoded frame of the .mov and .webm over a checkerboard and over a still like the footage.
