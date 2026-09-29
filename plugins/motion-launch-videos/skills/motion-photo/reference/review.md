# Review: the pre-pass critique and the final checklist

Step 5 and the end of step 6. Nothing is rendered in full until the stills pass at every format you deliver, and nothing is delivered until the files verify and you have looked at them.

## Pre-pass: `render.mjs stills`

It prints only the checks that did not pass (set `VERBOSE=1` to see all), writes one PNG per planned frame to `videos/<film>/stills/` (`stills/9x16/` with `--format 9:16`), and a labelled `contact.png`. It exits non-zero when anything fails.

The planned frames: frame 0, the loop start (the lockup being covered), each masked transition half-way, each scene at rest (after its entrances land), each key of a layer landed (a carousel step, a slider stop), the end of every Ken Burns move or drift, and the last frame.

### Automated checks

| Check | Fails when | Fix |
|---|---|---|
| glyphs | a character is not in the cmap of the face that draws it | change the copy, or a face or subset that has it (fonts.md) |
| asset | an image is not embedded (its `src` is not an asset token), or names no BRIEF.md Assets row (`brief`); warns when an image is never shown | put the file in `assets/`, add the row, or remove the image |
| resolution (warn) | an image is shown at more than 1.15x its own pixels at some frame, or never at more than half of them | a larger original, a smaller frame or zoom; or resize the file to the size the row names |
| crop | an image's focus leaves the part of it on screen (the frame, clipped to the canvas) while the layer is at rest; warns when less than 90 % of its subject box is in frame, fails under 75 % | move the frame, the pan or the focus; frame the photo instead of filling the canvas at that format |
| contrast | display text under 3:1 or small print under 4.5:1 against the pixels behind it: the frame drawn without the text, the worst 5 % of the text's box, at the start, middle and end of its rest | a scrim, a quieter part of the picture, the words off the photo, or another fill |
| contrast (tags, labels) | a tag's or a comparison label's ink under 4.5:1 on its pill | another role |
| claim | a tag names no fact (`fact: 'F2'`) | cite the BRIEF.md fact, or cut the tag |
| words | a scene has more than 4 words of display type | cut words, or split the beat |
| live area | a text layer's ink, a tag's pill or a tag's dot leaves the margins | move it, or `bleed: true` |
| grid (warn) | a text baseline is not a multiple of the unit | move it to the grid |
| collision / cramped (warn) | two texts or tags of one scene overlap at rest, or sit under 16 px apart | move them apart |
| small print (warn) | mono text under 24 px at 1080 | larger |
| kb (warn) | a cover zoom below 1 (held at 1), or a Ken Burns move ending after the loop | zoom from above 1; end the move sooner |
| hold | a loop behaviour on the hold loop's lockup | move it, or make the film a cycle loop |
| palette roles | a drawn colour (type, pills, frames, scrims) is not a palette role | add the role, or use an existing one |
| loop tail (hold) | anything still changes in the last frame's shutter: a spring, a drift, typing | start the lockup sooner, or lengthen the film |
| loop closes, cycle (cycle) | a value ends somewhere other than where it starts; a behaviour's cycles per loop are not whole | add the move back; a whole `n` |
| blank frames (warn) | 4 or more frames show nothing | start the next entrance sooner, as the mask opens |
| composition | the stills lean to one side of the frame (a square layout left at the top of a 9:16 canvas) | a format patch that places the picture and the words for that format |

The palette gate (mixed inks) does not run: the engine marks no accent frames, since a photograph's colours are its own.

### By eye, on the contact sheet and the full-size stills

- **One thing to look at?** The product or the subject, not a busy background or a prop.
- **Sharp?** A soft photo next to sharp type is an upscaled one; check the resolution rows.
- **Crops**: nobody's head cut at the eyes, no product cut at an edge it should not be, the same framing in a before and after.
- **Words on photos**: read them at the size of a phone in a feed; the contrast row is a floor, not a target.
- **Tags**: the dot on the part the words name, the pill in empty space, the leader short and clear of the subject.
- **Parallax**: the cutout sits in the scene (shadow, scale) and moves at a different speed from its background.
- **Transitions**: the mask opens on a new background, and nothing of the incoming scene is missing when it does (a blank reveal).
- **Formats**: at 9:16 the picture above the words and the type between y 360 and 1560; at 16:9 the picture beside them; nothing that looks like a square floating in the middle.
- **The loop start**: the lockup leaves and the first picture arrives with no empty frame between them. **Frame 0 and the last frame** look identical.

Fix, rebuild, and run stills again at each format. Show the user the contact sheets and anything you changed on their brief.

## Before delivering

1. `loopcheck` at each format: every maximum channel difference is 0.
2. `render`: the full film, in the background, once per format.
3. `verify`: every check passes. The encoded seam and the GIF size are information and warnings.
4. **Extract and look**: `mp4frames` decodes the planned frames from the MP4 into `stills/mp4/` with a contact sheet and each frame's PSNR against the canvas. Read the sheet and the transition, carousel and slider frames full size: fine detail in photos is what H.264 softens first.
5. Report: the files with sizes, what verify said, the loopcheck line, the lowest mp4frames PSNR, and anything you could not check.

## What never ships

- An image that is not the user's own or licensed to them, or has no row in the Assets table.
- A claim that is not in the brief's Facts table; a price the product's page does not show.
- A photo upscaled past 1.15x, or a face or product cut by a crop.
- A frame with a glyph from a fallback font.
- A hold loop whose loopcheck is not 0.
- An MP4 without BT.709 tags, or whose background decodes lighter than the canvas.
