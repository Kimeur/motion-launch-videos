# Review: the pre-pass critique and the final checklist

Step 5 and the end of step 6. Nothing is rendered in full until the stills pass, and nothing is delivered until the files verify, every number on screen matches the brief, and you have looked at the frames.

## Pre-pass: `render.mjs stills`

It prints only the checks that did not pass (set `VERBOSE=1` to see all), writes one PNG per planned frame to `videos/<film>/stills/`, and a labelled `contact.png`. It exits non-zero when anything fails.

The planned frames: frame 0, the loop start (the lockup leaving), each transition just after it starts (a wipe mid-cover), each chart while its data grows, each scene at rest (every number landed, before its punch-in or exits), each accent frame (a counter landing, a highlight lighting, a sweep completing), and the last frame.

### Automated checks: the numbers

| Check | Fails when | Fix |
|---|---|---|
| data | a dataset has a value that is not a finite number, a length that does not match its categories, repeated categories, no `source`, a source row missing from `FILM.sources`, or an unknown field | fix the data; every dataset cites a Facts row of BRIEF.md |
| numbers | a `{ref}`, a counter's `ref` or a chart's `data` does not resolve | the ref grammar is in engine.md |
| free numbers | text holds a number typed by hand that the data does not hold (a warning when it does) | write it as a `{ref}`; a year or a version goes in `literal` |
| data spring | a value bound to data moves on a spring with ζ < 1; the row names the false number it would show | COUNT, GROW, SWEEP, TRACE or EXIT |
| axis | a value falls outside the axis (a clipped bar), a bar or column axis leaves out zero, or a line's axis leaves out zero with no tick labels (a warning with them) | widen the axis, start at zero, or show `grid` ticks and say why in DESIGN.md |
| honest chart | a legend, 3D (`depth`, `perspective`, `tilt`), an exploded slice, a dual axis (`axis2`, `y2`, `secondary`), a broken or log axis, an area under one of several lines | label directly; one axis; two charts |
| slices | a donut has more than 5 slices | fold the smallest into a remainder, or use bars |
| whole | a donut has no `total`, a negative part, or parts that do not sum to the total within rounding | fix the data, or `remainder: 'OTHER'` |
| retarget | a retarget's dataset has a different number of categories (a warning when the names differ) | cut to a new chart instead |
| source | a number of the scene can be read (its chart is on screen, not entering or leaving) while its source line is not on screen, or a scene with data has `source: false` | start the source sooner or keep it longer (`source: { at }`) |
| landed | at the scene's rest still a value is not at its final number (within half a printed unit and 0.5 px), or the source line is still typing | give the scene longer, start the data sooner, or a stiffer ζ = 1 spring |
| counter | information: the value it lands on and its fixed slots | |

### Automated checks: the picture

| Check | Fails when | Fix |
|---|---|---|
| glyphs | a character is not in the cmap of the face that draws it (every digit, separator, sign and suffix a label can show is checked) | change the copy or the format, or a face or subset that has it (fonts.md) |
| words | a scene has more than 4 words of display type (a counter and a donut's centre count as one each; chart labels and small print do not) | cut words, or split the beat |
| live area | a text, a chart label, or a chart's marks at rest leave the margins | smaller, move it, a narrower `box`, or `bleed: true` for a background mark |
| grid (warn) | a text, counter or note baseline is not a multiple of the unit | move it to the grid |
| collision / cramped (warn) | two texts overlap at rest, or sit under 16 px apart (6 px within one chart); a text or label overlaps a chart's bars, line, points or ring | move it, shorten the format, or give the chart more room |
| small print (warn) | mono text under 24 px at 1080 | larger |
| colours | a chart's mark is under 3:1 against its background; two of its colours are under dE 15 apart in normal vision or under 6 under simulated protanopia or deuteranopia (a warning from 6 to 8) | a lighter or darker step of the role; fewer colours (emphasis) |
| labels | several series without names, slices without labels (fail); a donut caption that does not name its slice (warn) | direct labels |
| fields | an unknown field, a highlight on a category that does not exist or without a fill, a slice without a colour, a note without a chart or point | engine.md lists every field |
| contrast | display type under 3:1, or small print, chart labels and notes under 4.5:1, against their backdrop (`on`, or the scene's `bg`) | another role |
| palette roles | a colour in the film is not a palette role | add the role, or use an existing one |
| loop tail (hold) | anything still changes in the last frame's shutter: a spring, typing, a relabel | start the lockup sooner, or lengthen the film |
| blank frames (warn) | 4 or more frames show nothing | start the next entrance sooner; a cut lands on chrome or a track |
| timeline (warn) | an event outside the loop, a punch-in never reset | see loops.md |
| palette gate | an accent frame has a patch of mixed ink (two hues blended into a third) | opaque roles; slices separated by a surface `gap` |

### By eye, on the contact sheet and the full-size stills

- **The finding first.** Is the biggest, brightest thing the one the title states? If the eye goes elsewhere, the accent or a size is wrong.
- **Every number against the brief.** Read each rest still and tick every printed value against BRIEF.md's Facts rows (`render.mjs layout` prints the datasets). Derived numbers (a sum, a change) against a calculator.
- **Growth stills.** Bars grow from the baseline; labels ride their bar ends and count; no label jumps sideways; the axis and categories are there before the bars.
- **Rest stills.** Every label legible, nothing clipped, nothing crowding; the highlighted bar and its label are the only accent; a note's leader points at the right bar and crosses no mark.
- **Transitions.** A cut lands on the next chart's chrome or track, never on an empty frame; a wipe covers the frame completely at the swap; the circle starts on the element that just landed.
- **The source line** is on every frame that shows a number, and invented data says so.
- **Frame 0 and the last frame** look identical (hold loop), and the lockup is complete in both.

Fix, rebuild, and run stills again. Show the user the contact sheet and anything you changed on their brief.

## Before delivering

1. `loopcheck`: every maximum channel difference is 0.
2. `render`: the full film, in the background.
3. `verify`: every check passes. The encoded seam and the GIF size are information and warnings.
4. **Extract and look**: `mp4frames` decodes the planned frames from the MP4 into `stills/mp4/` with a contact sheet and each frame's PSNR against the canvas. Read the sheet and the growth, highlight and transition frames full size; make a filmstrip of the whole MP4 and watch the counts slow onto their final numbers.
5. Report: the files with sizes, what verify said, the loopcheck line, the lowest mp4frames PSNR, the critique counts, and anything you could not check.

## What never ships

- A number that is not in FILM.data, or data that is not in the brief's Facts table with its source.
- A chart without its source line, or invented data without a label saying so.
- A bar that does not start at zero, a value that overshoots, parts that do not make their whole.
- A frame with a glyph from a fallback font.
- A hold loop whose loopcheck is not 0.
- An MP4 without BT.709 tags, or whose background decodes lighter than the canvas.
