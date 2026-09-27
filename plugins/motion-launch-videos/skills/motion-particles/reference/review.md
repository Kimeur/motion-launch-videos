# Review: the pre-pass critique and the final checklist

Step 5 and the end of step 6. Nothing is rendered in full until the stills pass, and nothing is delivered until the files verify and you have looked at them.

## Pre-pass: `render.mjs stills`

It prints only the checks that did not pass (set `VERBOSE=1` to see all), writes one PNG per planned frame to `videos/<film>/stills/`, and a labelled `contact.png`. It exits non-zero when anything fails.

The planned frames: frame 0, each move under way (halfway through its spread and landing), each text or shape formation fully formed (before the next move leaves it), each accent frame, and the last frame. The stills are motion-blurred: a moving particle is a streak.

### Automated checks

The engine's rows:

| Check | Fails when | Fix |
|---|---|---|
| swarm | (information) particles, colour roles, formations, moves | |
| budget | a formation needs more particles than the swarm has | a wider `spacing`, a smaller formation, or a bigger `swarm.n` |
| words | a text formation has more than 4 words | cut words, or split the beat |
| grid (warn) | a text formation's baseline is not a multiple of the unit | move it to the grid |
| live area | a formation's targets, plus dot, drift, glint and the camera's zoom while it is formed, leave the margins | smaller, move it, or `bleed: true` for texture |
| legibility (text) | under 12 particles across the cap height (WARN under 16), or the light the word averages to at feed size, bloom included, under 3:1 on bg | tighter `spacing`, a bigger `dot`, a heavier face, a bigger cap; per glyph with `glyphs` |
| legibility (shape) | a filled or outlined part averages under 3:1 at feed size (grids, spheres, clouds and dotted outlines are texture: no row) | as above, per part |
| crisp (warn) | a formation drifts more than half its spacing while formed | lower `drift` |
| formed | a formation is fully formed (every particle within 2 % of its move) for under 1 s (WARN) or 0.5 s (FAIL) before the next move leaves it | start the gather sooner, the next move later, a shorter `spread` |
| clutter (warn) | the dust's light across the frame is more than 25 % of the word's light in its box | `dust: 0.2` to `0.5` on the formation |
| live area, grid, small print (warn) | a `type` line leaves the margins, sits off the grid, or is under 24 px | move it, larger |
| typed | a cycle loop types a line in and never erases it, or is still erasing at the loop point | add `erase`, or show it from frame 0 |
| loop: the swarm returns (cycle) | the last move ends somewhere other than `formations[0]` | add the move back |
| loop: the swarm across the seam (cycle) | a 0.1 ms step over the loop point moves a particle, or changes its alpha, more than 4 x the same step inside the loop | something is not periodic or does not carry over: a wave or twinkle with a fractional `n`, a formation that spins through the seam |
| loop: a move over the seam (cycle) | a move still settling at the loop point involves a spinning formation | settle it before the loop point, or drop the spin |
| hold (hold) | the field moves (waves, drift, twinkle) or the last formation drifts or spins, so the still tail cannot be still | set them to 0, or make the film a cycle loop |

The core's rows (core.md): glyph coverage from each font's cmap, contrast for each formation's fills and each `type` line, palette roles, the loop (hold: the loop tail; cycle: loop closes for the camera and glow Props, and every period in `cycles()` whole: waves, twinkle, the drift noise's three harmonics), blank frames, timeline warnings. Then the palette gate: sharp frames around each accent (the landing of each `accent: 'land'` move, the burst) with no patch of mixed ink.

### By eye, on the contact sheet and the full-size stills

- **Does each word read at the contact sheet's size?** That is roughly how it looks in a feed. If it reads only full size, the legibility numbers are borderline: tighten it.
- **Edges**: blue noise, not a grid; no gap along a glyph's edge; round parts have an even rim.
- **Gathers**: paths flow in one direction and do not cross; no clump arrives long after the rest.
- **Bursts**: streaks, not dotted lines; something on screen on every frame; the reform starts before the frame empties.
- **Dust**: quieter than the formation; no bright near particle parked on a letter.
- **Colour**: the accent only where it means something; no pink or yellow where two inks meet.
- **Frame 0 and the last frame**: a cycle loop's last frame flows into frame 0 (same field, a small step on); a hold loop's are identical.

Fix, rebuild, and run stills again. Show the user the contact sheet and anything you changed on their brief.

## Before delivering

1. `loopcheck`: every maximum channel difference is 0, and for a cycle loop the seam continuity line passes (the change over 0.1 ms across the loop point is about what the same step changes elsewhere).
2. `render`: the full film, in the background. The log's subframe counts are the core's budget; the engine draws one pass of streaks per frame.
3. `verify`: every check passes; the GIF under 4 MB. The engine asks for a 12 fps, 16-colour, undithered GIF (see particle-craft.md).
4. **Extract and look**: `mp4frames` decodes the planned frames from the MP4 into `stills/mp4/` with a contact sheet and each frame's PSNR against the canvas; read it, then a filmstrip of the whole MP4 (`ffmpeg -i renders/<film>.mp4 -vf "select=not(mod(n\,12)),scale=180:180,tile=10x6" -frames:v 1 strip.png`) for the rhythm of the moves. Particle frames compress hard: the lowest PSNR should still be 35 dB or more.
5. Report: the files with sizes, what verify said, the loopcheck line, the lowest mp4frames PSNR, the GIF size, and anything you could not check.

## What never ships

- A claim that is not in the brief's Facts table; a logo or mark that is not the user's.
- A word that reads at full size but not in the contact sheet.
- A frame with a glyph from a fallback font.
- A hold loop whose loopcheck is not 0, or a cycle loop that jumps at the seam.
- An MP4 without BT.709 tags, or whose background decodes lighter than the canvas.
