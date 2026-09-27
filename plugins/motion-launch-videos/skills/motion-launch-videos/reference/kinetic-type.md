# Kinetic type: one glyph at a time

The engine sets display type glyph by glyph on a canvas, so every letter can move on its own spring while the line keeps its spacing. This file says how a line is measured and laid out, and how its glyphs enter.

## Measuring a line

All measuring happens once, after the fonts load (`document.fonts.load` with every character the film uses, then a check that the face loaded).

1. **Advance of each character**: `measureText(c).width`, with `fontKerning = 'normal'` and `letterSpacing = '0px'`.
2. **The font's own kerning (GPOS), recovered**: `measureText(a + b).width - adv[a] - adv[b]`. Canvas does not expose kerning per pair, but it applies it inside a string, so the pair width gives it back.
3. **Optical pairs on top**: `pairs: { 'XA': 40 }` in 1/1000 em, for pairs the font's kerning leaves too tight or too loose at display size.
4. **Tracking**: a fixed `track` in 1/1000 em, or `justify` (solve the tracking so the ink spans a width), or `fit` (solve the size so the ink spans the measure at the given tracking; ink width is linear in size, so three iterations converge).
5. **Ink, not advance**: line edges come from `actualBoundingBoxLeft/Right` of the first and last glyphs, so a justified line's ink sits exactly on the margins, with no side-bearing gap.
6. **Cap height** from `measureText('H').actualBoundingBoxAscent`; `cap: 64` sizes a label so its caps are 64 px tall.

Spaces are glyphs with an advance and no ink; they get no slot, so staggers skip them.

`node <skill>/scripts/render.mjs layout <film>` prints every line's size, tracking, ink box and cap top.

## Spacing floor

Display pairs must keep at least 0.037 em of real ink gap. The critique rasterises each glyph alone at its position and measures the smallest Euclidean distance between neighbours' ink edges (alpha ≥ 128), minus 1 px. A pair under the floor fails; fix it with a `pairs` entry, not by loosening the whole line. The failure message gives the value to use: the critique slides the right glyph over until the gap clears the floor plus 0.005 em, because diagonal pairs (YT, AV, .A) open much more slowly than one for one, and adds the pair's current value. The margin covers the small resize `fit` makes when a pair widens the line.

## Entrances

Each glyph gets three properties, each with its own spring:

| Property | From | To | Spring |
|---|---|---|---|
| y offset | `from` px (640 for a slam, 96 for a landing, negative from above) | 0 | SLAM or LAND |
| opacity | 0 | 1 | FADE |
| blur | `blur` px (12 to 16) | 0 | FOCUS |

Glyph k starts at `at + stagger x k` (`stagger: 0` starts them together). `pop: true` replaces the fade with full opacity from the start, for type that must be on screen the frame a cut lands. **Stagger on the tempo grid**: a 16th note (`stagger: 16`, 0.125 s at 120 BPM) for short words and slams, a 32nd (`stagger: 32`) for longer or quieter words, so a word lands within a beat or two. `order: 'reverse'` enters from the last letter.

**Smear** (`smear: true`): behind each fast glyph, 6 ghosts at `t - j/120` s, alpha `0.5 x (1 - j/7) x min(1, |v| / 4000)` where v is the glyph's speed in px/s, blur + 2 px, in `smearColor`. It turns a slam into a streak that the motion blur then softens.

**Exits** move by `dy` on EXIT, staggered or not, and the glyph is hidden once it has left the canvas.

## Scramble

`scramble: { snap, dir }`: until the snap frame, each glyph shows noise from a seeded deck of A-Z and 0-9.

- A new noise glyph every 2 frames (30 Hz), counted from the glyph's own arrival, using q.
- **Never the true letter early**: if the deck deals the true letter, the next card is shown.
- The noise glyph's ink is centred in the true glyph's slot, and jitters vertically by `(charCode % 3) x 8` px in the direction `dir`.
- In `scrambleColor` until the snap, then the true letter in the line's colour. A misregistration on the snap frame (`mis: 'snap'`) makes the resolve land.

## Crumbs

Mono small print, 32 px with +20 tracking, typed one character per frame from `at`, with an 18 x 26 px block cursor (0.5625 x 0.8125 of the size) that sits after the last character while typing and for 2 frames after. `clear` backspaces one character per frame. Crumbs carry supporting facts (the proof's method, the CTA's action); they are not counted in the 4-word limit, but they are facts, so they cite a row of the brief.

## Rules of thumb

- All caps for display, sentence case never; mono crumbs all caps too.
- One size per line; lines in a stack get different sizes from `fit`, which is the point.
- Accent colour on one line per scene at most.
- A punctuation mark at the end of a line (full stop, comma) is a glyph with its own spring: it lands last, which makes the rhythm.
