# Design spec: every beat on the grid before any code

Step 3, finished in step 4. The output is `videos/<film>/DESIGN.md`, filled from [../templates/DESIGN.md](../templates/DESIGN.md). The FILM config is a transcription of it, so decide here, not while coding. One thing cannot be final yet: the baselines of fitted lines depend on sizes and cap heights that only `render.mjs layout` can measure, so write them as a first guess (see "Vertical rhythm"), build, run `layout`, and then fix them in DESIGN.md and FILM together.

## Canvas and grid

- **Format.** 1080 x 1080 by default. For 9:16 use 1080 x 1920; for 16:9 use 1920 x 1080. The engine takes any W and H; see "Wide and tall formats" for sizing type in them.
- **Live area.** A margin of 104 px at 1080 (about 9.6 %) on every side keeps type clear of platform crops and rounded corners. The display measure is `W - 2 x margin` (872 at 1080).
- **Baseline unit 8 px.** Every baseline, rule y and crumb baseline is a multiple of 8. The critique warns about any that is not.
- **Tempo grid.** Pick a BPM (120 is the default: beat 0.5 s, 16th 0.125 s, bar 2 s). Scene boundaries land on beats, ideally on bars or half-bars. Entrances start on 16ths. Write times as `beat(n)` and `bar(n)` in the config so they stay on the grid.

## Palette roles

Four roles cover a bumper: `bg`, `fg`, `accent`, `accent2`. More roles are allowed; every colour the film draws must be a role.

- `bg` fills every frame, full-bleed. A dark bg is the default for a launch bumper; it makes the motion blur and the misregistration read. A light bg is right when the brand is light (see "Light films"). Do not use cream or off-white.
- `fg` for most display type. Contrast against `bg` must be at least 3:1 for display type and 4.5:1 for crumbs; the critique computes it.
- `accent` for one line per beat at most, the rules and the smear.
- `accent2` for crumbs, the scramble noise and the right-hand misregistration pass.
- The misregistration pair (`misPair`) is two roles. If they are two chromatic hues more than 13 degrees apart (orange and lime), the engine keeps them from ever sharing a pixel, because their mix is a third colour (olive). Two tints of one hue (a brand blue and its lighter tint) cannot mix into a new hue, so they are always safe.

### Light films

A white or light bg works, with three changes from the dark defaults:

- **Pick the accents for the light ground.** The default lime (`#B8FF00`) is 1.2:1 on white and the default orange 2.9:1; neither can carry type there. Take the brand's own saturated colours and check each against the bg (display 3:1, crumbs 4.5:1).
- **Crumbs default to `accent2`.** On a light bg give every crumb `color: 'fg'` (or a dark role) unless accent2 passes 4.5:1; the critique fails it otherwise.
- **Raise `misAlpha`.** The misregistration layer lands at 40 % by default, which on white reads as pastel fringes. 0.6 to 0.7 gives the same weight a dark film gets at 0.4.

The build copies `palette.bg` into the page's CSS, so the preview does not flash dark before the script runs.

## Type roles

| Role | Default face | How to size it |
|---|---|---|
| display | Archivo Black 400 | `fit: true`: the size is solved so the ink spans the measure exactly at the given tracking. Stacked lines of different lengths then get different sizes and one shared width, the justified-stack look. |
| label | Syne 800 | `cap: 64`: the size is solved from a cap height, so labels sit on the grid. Anchor right to hang a label off the measure's right edge. |
| mono | IBM Plex Mono 500 | fixed 32 px with +20 tracking; crumbs type in at one character per frame. |

Track display type tight (-20 to -60 thousandths of an em) and let the ink-gap gate tell you when a pair is too close (under 0.037 em). Fix a close pair with an optical pair entry (`pairs: { XA: 40 }`), never by loosening the whole line.

## Wide and tall formats

`fit: true` sizes a line so its ink spans the whole measure (`W - 2 x margin`). That is right at 1:1 and 9:16, but at 16:9 the measure is 1712 px, and a fitted 4-letter word gets a cap height of about 430 px (STAY, measured): two such lines cannot stack inside the 872 px live height.

- **16:9.** Size the stack by height first. For k stacked display lines, keep each cap height under about `live height / (k x 1.3)`, which leaves room for the gaps (about 335 px for two lines at 1080 tall). Then give every line of the stack the same `fit: <px>` width that lands near that cap: in Archivo Black, `fit: 1400` gives 4- and 5-letter words caps of about 305 to 325 px, and `fit: 1200` about 230 px. Or use `cap: <px>` with `anchor: 'C'` when the lines should not share a width. A single-line beat can still use `fit: true`.
- **9:16.** The measure is 872 px and the live height 1712 px: fitted lines stay the right size, and there is room for stacks of 3 or 4 lines. Keep crumbs inside the middle two thirds of the height, clear of platform UI at the top and bottom.
- `grid.margin` is one value for both axes; the live height is `H - 2 x margin`.

## Vertical rhythm

For a stack of display lines, decide the baselines from the cap heights the layout reports (`render.mjs layout`). Before the first build, guess: Archivo Black's cap height is 0.69 of its size, and at `fit: true` on the 872 px measure a 5-letter word sets at about 240 px (cap about 165); longer words are smaller. Then build, run `layout`, and move each baseline so that:

- the gap between one line's lowest ink (descenders, commas) and the next line's cap top is about 0.15 to 0.3 of the smaller cap height. Less reads as one blob; the critique warns under 16 px and fails on overlap.
- Centre the stack's optical block (first cap top to last baseline) in the live area, or hang it from the top margin; do not float it.
- A rule under a line sits one grid unit or more below its baseline; type that rises from behind a rule uses `clipY` (visible above) or `clipBelow` (visible below).

## Beat sheet

One table row per scene: its window, the bars it covers, how it comes in (`none`, `cut`, `mask`, `pan`), what is on screen, and its accent frame. Then one block per beat with every line's text, role, size rule, baseline and colour, the motion (enter time, from, spring, blur, stagger), crumbs, camera and accent. See techniques.md for what each transition and accent does, springs.md for picking springs.

Rules of thumb that keep a bumper alive:

- **Something moves on every beat.** A landing, a crumb starting, a punch-in, a cut. A beat where nothing changes reads as a stall.
- **One transition kind per boundary**, and vary them: cut, then mask wipe, then smash-pan reads as designed; three cuts in a row read as a slideshow.
- **Accents are rare.** One misregistration per scene at most, on its most important landing.
- **The last scene is the first frame.** The lockup is on screen at rest at frame 0, leaves at 0.00 (the `wrap`), and is rebuilt at the end, then holds. See motion-blur-loop.md.

## Transitions and the loop seam

List every boundary with its time and kind. Hard cuts and mask starts are added to the cut list automatically (motion blur never crosses them). For the seam, write down when the last spring settles and how many frames of static hold that leaves; the loop needs at least 2 (the last frame's subframes reach back 0.75 of a frame).
