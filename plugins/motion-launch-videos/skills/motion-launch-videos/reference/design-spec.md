# Design spec: every beat on the grid before any code

Step 3, finished in step 4. The output is `videos/<film>/DESIGN.md`, filled from [../templates/DESIGN.md](../templates/DESIGN.md). The FILM config is a transcription of it, so decide here, not while coding. One thing cannot be final yet: the baselines of fitted lines depend on sizes and cap heights that only `render.mjs layout` can measure, so write them as a first guess (see "Vertical rhythm"), build, run `layout`, and then fix them in DESIGN.md and FILM together.

## Canvas and grid

- **Format.** Author the film at 1080 x 1080, the base format, and deliver 9:16 (1080 x 1920) and 16:9 (1920 x 1080) from the same FILM with `--format` and a patch per format; see "Formats". A film that only ever plays at one ratio may set `W` and `H` to it directly.
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

## Formats: one film, several ratios

`render.mjs <mode> videos/<film> --format 9:16` renders the film at 1080 x 1920 and `--format 16:9` at 1920 x 1080; the page re-sizes the canvas, keeps the short side, and merges `FILM.formats['9:16']` over the film (engine.md, "Formats"). Without a patch, every position keeps its offset from the centre: nothing is cropped and a centred stack stays centred, but big type does not re-flow by itself. Design each format you deliver:

- **16:9: a wider measure, larger lines, the stack sized by the height.** At 1920 wide the full measure is 1712 px, and `fit: true` there gives a 4-letter word a cap of about 430 px: two lines no longer fit in the 872 px live height. Set `grid.measure` so the tallest stack fits, then centre each stack on the height. For k stacked lines keep each cap under about `live height / (k x 1.3)` (about 335 px for two lines). The template's 16:9 patch uses `measure: 1504`: every line grows by 1.72 against the square, ACME's cap is 340 px, the other lines' 190 to 295 px, and each pair of lines spans 640 to 680 px, centred. The margins left and right (208 px) then match the space above and below.
- **9:16: the narrow measure, the stack using the height.** The measure stays 872 px, so fitted lines keep their square sizes and are already as large as the width allows; one word per line is the vertical setting. Centre each stack (unpinned baselines do this), open the leading a little (a few grid units per line), pin small print to the edge it belongs to (the template's crumb: `pin: 'b'`, baseline 760, which lands 320 px above the bottom), and let the motion use the height: slams from below the frame (`enter.from` about 1100) and a `wrap.dy` that clears the top (about -1480; -880 leaves the lockup on screen and the critique warns). Keep crumbs inside the middle two thirds of the height, clear of the platform UI at the top and bottom.
- **Positions in a patch are base-format pixels**, mapped by their pin like the base film's. At 16:9 unpinned baselines keep their values (the height is the same); at 9:16 they move down by 424.
- **Rules and crumbs follow the measure** when they have no `x0`, `x1` or `x`, so a lockup rule stays as wide as the lines above it.
- **Re-measure per format.** Run `render.mjs layout videos/<film> --format 16:9` for the sizes and cap tops at that format, and settle its baselines on the grid from them, as for the base film. Letter gaps are raster measurements: a pair that passes at one size can fail at another, and the critique's `pairs` value goes into that format's patch.

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
