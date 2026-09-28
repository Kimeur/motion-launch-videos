# Data design: charts that are true, read in a second, and move on the beat

Steps 2 and 3. A launch chart is seen once, small, in a feed, for two or three seconds. It has to say one thing, say it honestly, and say it before the viewer scrolls. The engine can draw anything true; this file says what to draw, how big, and when.

## One finding per beat

Each beat is one finding and one chart that shows it. Decide the finding first, then the form.

| The data says | Form | In the engine |
|---|---|---|
| one number matters | a counter, huge | `counter` |
| how a total splits, few categories in a natural order (days, months) | columns | `columns` |
| a ranking, or many categories, or long names | bars, sorted | `bars` with `sort: 'desc'`, `rank: true` |
| change over time | a line | `line` |
| parts of a whole, 2 to 5 clearly different parts | a donut | `donut` with a `total` |
| before and after | two columns and the change | `columns` and a `{ref}` to `.change` |
| progress to a goal | one bar on a full-scale track | `bars`, `axis: { max: 'total' }`, `track` |

- **The title states the finding, not the axis.** `OAT MILK LEADS.`, not `MILK SHARE`. Four words at most, and it must follow from the data on screen.
- **Emphasis beats colour-coding.** The story is usually "this one": one bar in the accent, the rest one neutral (`highlight`). Colouring every bar differently spends the colour channel on what the bars' lengths already say.
- **A donut is for parts that differ.** Close shares (31, 33, 36) read as equal slices; use bars. More than five slices is a table.
- **One chart per beat.** Two charts in one beat read as neither. A second view of the same data is a retarget (`keys: [{ data }]`) or the next beat.

## Honest by construction

The engine and its critique enforce most of this; know why, so the design does not fight it.

- **Bars start at zero.** A bar's length is its value; an axis from 5,000 turns 6,000 against 7,000 into a bar twice as long. `axis.min` above zero fails for bars and columns.
- **No truncated, broken, dual or log axes, no 3D, no exploded slices.** Each distorts a length or an angle the viewer reads as the number. Two measures of different scale are two charts.
- **A line may start above zero** only when its tick labels show the scale (`grid`) and DESIGN.md says why (a price between 180 and 220 is flat on a zero axis); the critique warns.
- **Parts sum to the whole.** A donut's parts must equal its `total` within rounding, or show the rest as `remainder`. A share without its whole is not a share.
- **Data never overshoots.** Every value bound to data moves on a critically damped spring (ζ = 1): a bar that bounces past 100 shows 108 for a moment. Overshoot is for what surrounds the data: a title landing, a point popping, a logo.
- **Labels only where the data is.** A value label rides its bar's end and counts on the bar's own spring; a line labels its points, never the drawing tip (that would print interpolated values).
- **Exits do not count down.** When a chart leaves, its labels hold their landed values and fade: a countdown to 0 % would print numbers the data never had.
- **Derived numbers are computed, not typed.** A total, a change, a maximum: `{week.sum}`, `{price.change}`. A typed number fails the critique unless the data holds it.
- **Every chart has its source on screen**, and invented data says so (`DEMO DATA`).
- **Comparisons share a scale.** A retarget keeps one axis across both datasets, so the heights compare; two charts that compare the same measure in different scenes get the same `axis.max`.

## Numbers a viewer reads in a second

- **Round the print, not the data.** The data keeps full precision; the format rounds what is printed: `{ scale: 1000000, decimals: 1, suffix: 'M' }` prints 1,234,567 as 1.2M. Five significant digits is the most a hero number should carry; chart labels, three or four.
- **One precision per chart.** Every label of a chart uses its dataset's format; do not mix 46 % and 38.2 %.
- **The unit is on the number or in the title,** never ambiguous: `%`, `K`, `$` on the number; `CUPS PER DAY` in the title.
- **Signs mean change.** `+12 %` only for a change; negatives print with a true minus (−), which the Latin subset has.
- **Figures in fixed slots.** Counters and value labels give every digit the same slot, so a count never jitters. Faces whose default figures are already tabular (Inter, IBM Plex) look the same at rest as their natural setting; a face with proportional figures looks loose in slots (a narrow 1 in a wide slot).

## Hierarchy and composition

- **The finding is the biggest thing.** The counter spans the measure; the highlighted bar is the one saturated mark; the donut's centre shows the leading share.
- **Text wears text colours, marks wear data colours.** Values and category names are in paper and muted text roles; the colour that identifies a series is on the mark beside them. The single accent goes to the story.
- **Direct labels, no legends.** Values on bar ends, names and last values at line ends (`WEB 26.4K`), names beside slices. A legend makes the viewer match colours in two seconds they do not have.
- **Label selectively on lines** (the end, the peak); every bar can carry its value while there are eight or fewer and the labels fit their bands (the critique checks collisions).
- **A steady frame.** Titles top left on the same baseline in every chart scene, the source line bottom left: the eye learns where to look once.
- **Sized for a phone.** At 1080: value labels 28 px or more, small print 24 px or more, bars about 60 % of their band, lines 6 px, points 9 px radius.
- **The live area** is the canvas minus 104 px on every side; every label and mark stays inside it.

## Formats

The master is 1:1 (1080 x 1080); 9:16 and 16:9 are the same film with a patch each (engine.md, Formats). The data, the findings, the timing and the source lines do not change between formats; the layout does.

- **9:16 (1080 x 1920).** The width is the same, so the gain is height: columns grow taller (more pixels per unit, the differences easier to see), type and labels a size bigger, everything stacked: title, chart, source line. Platform buttons and captions cover about 250 px at the top and the bottom: keep titles, labels and the source line between y 360 and 1560. Bars (horizontal) gain rows, not length.
- **16:9 (1920 x 1080).** The height is the same, so the gain is width: the title beside the chart, set flush left on two lines, and the plot wider. Columns get wider bands (more room for value labels); a line gets longer segments. The source line stays bottom left under the title.
- **A steady frame per format.** Titles and the source line in the same place in every chart scene of that format.
- A donut is square: it gains little from either format. Give it the space the labels need, not the whole frame.

## Colour

- **A dark, neutral background** keeps the data the loudest thing on screen. A full-bleed accent scene (the hook on crema) is one beat, not a chart background.
- **Every mark at least 3:1 against its background,** and the colours of one chart apart from each other: OKLab distance (x 100) at least 15 in normal vision and at least 8 under simulated protanopia and deuteranopia (6 is the floor with direct labels). The critique computes all three for every chart; do not eyeball them.
- **Emphasis palette:** one accent and one or two neutrals, not a rainbow. A second or third mark colour (a donut's slices) steps in lightness, not only in hue, so it survives colour blindness.
- **Opaque tints, not transparency.** A track, a well or an area fill is its own opaque role (`well: '#2B221C'`); a transparent fill over the background blends into a colour that is not in the palette.
- **Colour follows the entity.** If oat is crema in the donut, it is crema wherever oat appears.

## Pacing on the beat grid

- **Every time is `beat(n)`,** entrances on 16ths; at 120 BPM a beat is 0.5 s, a 16th 0.125 s, a bar 2 s.
- **A count takes longer than it looks.** A critically damped spring rushes most of the way, then settles: COUNT shows the last digit of a 5-digit number about 1.4 s after it starts (engine.md). The viewer reads the number while it slows; do not start the next event before it lands.
- **Stagger is the chart's rhythm.** Bars a 16th apart read as a count across the days; a 32nd as one gesture. Order by `value` to build up to the biggest.
- **Chrome first, data second, story third.** The axis and categories arrive a 16th before the bars; once they land, the highlight lights on a beat, and the note draws after it.
- **Leave it landed.** Give each chart a second at rest after its last number lands; a punch-in (1.04) late in the hold keeps it alive.
- **Something moves on every beat;** a count ticking its last digits counts.
- **Vary the transitions.** A circle from the logo into the hook, a wipe of rising bars into a bar chart, a cut on the downbeat onto the next chart's track, an overlap into the lockup. A cut lands on something: the incoming chart's chrome or track is on screen the frame it cuts.

## The loop

The default is a hold loop: frame 0 is the lockup at rest (logo, name, domain), it leaves at t 0 as the hook arrives, and it is rebuilt at the end. A chart can be the last scene instead, when the film is one chart's story. Give the lockup 1.5 to 2 s from its first entrance; the loop tail check reports the still frames left.

## Things that look good in a still and bad in motion

- Everything growing at once: no order, nothing to follow.
- A centre number waiting at 0 % while other slices sweep: put the slice it shows first (the sweep starts there).
- A retarget to a dataset of a different scale: the bars jump to a new meaning mid-shot. Cut to a new chart instead.
- A line drawn on in a quarter of a second: the points pop faster than the eye can read them.
- Value labels wider than their bands: they collide as the bars grow. Shorten the format (`K`), widen the chart, or turn columns into bars.
- Two accents in one beat: the highlight and a punch-in on the same frame fight.
