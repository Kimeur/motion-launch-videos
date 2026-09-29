# Review: the pre-pass critique and the final checklist

Step 5 and the end of step 6. Nothing is rendered in full until the stills pass, and nothing is delivered until the files verify and you have looked at them.

## Pre-pass: `render.mjs stills`

It prints only the checks that did not pass (set `VERBOSE=1` to see all), writes one PNG per planned frame to `videos/<film>/stills/`, and a labelled `contact.png`. It exits non-zero when anything fails. Run it at every format you deliver: `--format 9:16` checks that cut and writes `stills/9x16/`.

The planned frames: frame 0, every hop's anticipation, stretch and impact, each bubble, sign and emote, each accent (landings, the sign appearing), and the last frame.

### Automated checks

| Check | Fails when | Fix |
|---|---|---|
| glyphs | a character on the sign, in a bubble or a title is not in the face's cmap | change the copy or the face (fonts.md) |
| words | a bubble or the sign holds more than 4 words | shorter |
| contrast | the sign's or bubble's lettering under 3:1 on its board, small print under 4.5:1 on the background | another role |
| live area | the character at rest (with its antenna and arms), the sign held up, the bubble or a title leaves the margins | move or shrink it |
| composition | averaged over the review stills, the ink (the character, the sign, the bubble, the titles; the rays and the floor shadow count as background) leaves more of the frame empty on one side than the other, or sits off-centre, by more than 30 % of the frame (warns past 20 %) | at 1:1, centre the character. In another format, a patch in `FILM.formats`: raise the stage, scale the character up, put the sign or the bubble on the open side (engine.md, Formats) |
| grid (warn) | a title's baseline is off the 8 px grid | move it |
| drawings (warn) | the drawings a second do not divide the frame rate: holds of uneven length judder | 12, 15, 20 or 30 at 60 fps |
| hop (warn) | a hop straddles the loop point, or lifts the head out of the frame | land it earlier; lower `h` |
| walk (warn) | a walk straddles the loop point | finish it earlier |
| eyes (warn) | the pupils nearly fill the eyes, so the look direction cannot read | smaller pupils or larger eyes |
| loop face | the face at the end is not the face at the start | end with a `face` act back to `start` |
| loop closes | a value (a pose, the camera) ends somewhere other than where it started | add the move back |
| cycle | the boil, the drawings, the rays' spin, the breath or the sway do not fit a whole number of times into the loop | whole cycle counts; a duration that is a multiple of 3 drawings |
| palette roles | a colour is not a palette role | add the role |
| palette gate | an accent frame has a patch of mixed ink | opaque shapes only (no partial alpha between two chromatic colours) |

### By eye, on the contact sheet and the full-size stills

- **Silhouette**: can you read every key pose from its outline alone?
- **Squash and stretch**: the anticipation still is visibly squashed, the stretch still visibly long, the impact still flattened. If the three look alike, exaggerate.
- **Arcs and overlap**: the antenna trails the body in the stretch still; the hands arrive after the body on landing.
- **The face at thumbnail size**: open the contact sheet at 25 %: can you tell the expression?
- **Tangents**: no arm running exactly along the body's outline, no hand sitting on an eye, no bubble tail crossing the face.
- **The sign and bubble**: every letter on the board, none over the edge, readable in one glance.
- **The boil**: alive, not jittery. Compare two consecutive drawings full size.
- **The loop start and end**: the last frame and frame 0 are the same pose, the same face, the same place.
- **Each format** (`stills/9x16/contact.png`, `stills/16x9/contact.png`): the film looks staged for that frame, not a square dropped into it. A tall frame is filled by a bigger character and higher hops; a wide one has the character to one side and the sign or bubble in the open space.

Fix, rebuild, and run stills again. Show the user the contact sheet and anything you changed on their brief.

## Before delivering

1. `loopcheck`: every purity difference is 0, and the seam continuity line passes.
2. `render`: the full film, in the background (a cartoon renders one sample a frame: about a minute for 10 s).
3. `verify`: every check passes. The GIF has one frame per drawing.
4. **Extract and look**: `mp4frames`, then a strip of the whole film (`ffmpeg -i renders/<film>.mp4 -vf "select=not(mod(n\,10)),scale=180:-1,tile=10x6" -frames:v 1 strip.png`). Watch for a pose that pops, a drawing that repeats, a face that snaps.
5. Report: the files with sizes, what verify said, the loopcheck line, the lowest mp4frames PSNR, and anything you could not check.

## What never ships

- A character that is not original or not the user's; a real person's likeness.
- A claim that is not in the brief's Facts table.
- A frame with a glyph from a fallback font.
- A loop that jumps at the seam.
- An MP4 without BT.709 tags, or whose background decodes lighter than the canvas.
