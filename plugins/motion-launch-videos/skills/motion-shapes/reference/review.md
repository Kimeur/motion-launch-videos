# Review: the pre-pass critique and the final checklist

Step 5 and the end of step 6. Nothing is rendered in full until the stills pass, and nothing is delivered until the files verify and you have looked at them.

## Pre-pass: `render.mjs stills`

It prints only the checks that did not pass (set `VERBOSE=1` to see all), writes one PNG per planned frame to `videos/<film>/stills/`, and a labelled `contact.png`. It exits non-zero when anything fails.

The planned frames: frame 0, the loop start (the lockup leaving), each transition just after it starts (a bars wipe mid-cover), each scene at rest (after its entrances land, before its punch-in or exits), each accent frame, and the last frame.

### Automated checks

| Check | Fails when | Fix |
|---|---|---|
| glyphs | a character is not in the cmap of the face that draws it | change the copy, or a face or subset that has it (fonts.md) |
| words | a scene has more than 4 words of display type | cut words, or split the beat |
| live area | a text layer's ink, or a shape's box at rest, leaves the margins | smaller, move it, or `bleed: true` for a background shape |
| grid (warn) | a text baseline is not a multiple of the unit | move it to the grid |
| collision / cramped (warn) | two text layers of one scene overlap at rest, or sit under 16 px apart | move baselines apart |
| small print (warn) | mono text under 24 px at 1080 | larger |
| contrast | display text under 3:1 or small print under 4.5:1 against its backdrop (`on`, or the scene's `bg`) | another role |
| palette roles | a colour in the film is not a palette role | add the role, or use an existing one |
| hold | a loop behaviour on the hold loop's lockup | move it, or make the film a cycle loop |
| loop tail (hold) | anything still changes in the last frame's shutter: a spring, typing, an accent | start the lockup sooner, use a spring that settles sooner, or lengthen the film |
| loop closes (cycle) | a value ends somewhere other than where it starts | add the move back |
| cycle (cycle) | a behaviour's cycles per loop are not whole | a whole `n` |
| blank frames (warn) | 4 or more frames show nothing | start the next entrance sooner |
| timeline (warn) | the camera does not return, a punch is never reset, a morph mixes open and closed outlines | see loops.md, engine.md |
| palette gate | an accent frame has a patch of mixed ink (two hues blended into a third) | make the overlapping shapes opaque, or change a role |

### By eye, on the contact sheet and the full-size stills

- **One thing to look at?** If two elements compete, one is the wrong size or colour.
- **Cramped?** Type nearly touching a shape it does not sit on; a stack that reads as one block.
- **Strokes**: one weight across the film; round caps where lines end in the open; draw-ons running with the eye.
- **Mid-morph and mid-trim stills**: no twist, no stray segment, no gap at a closed outline's start.
- **Transitions**: the circle wipe starts on the element that just landed; the bars cover the frame completely at the swap; a push reads as a streak, not copies.
- **The loop start**: the lockup leaves and the hook arrives with no empty frame between them.
- **Frame 0 and the last frame** look identical (hold loop), and the lockup is complete in both.

Fix, rebuild, and run stills again. Show the user the contact sheet and anything you changed on their brief.

## Before delivering

1. `loopcheck`: every maximum channel difference is 0 (and, for a cycle loop, the seam continuity line passes).
2. `render`: the full film, in the background.
3. `verify`: every check passes. The encoded seam and the GIF size are information and warnings.
4. **Extract and look**: `mp4frames` decodes the planned frames from the MP4 into `stills/mp4/` with a contact sheet and each frame's PSNR against the canvas. Read the sheet and the transition and accent frames full size.
5. Report: the files with sizes, what verify said, the loopcheck line, the lowest mp4frames PSNR, and anything you could not check.

## What never ships

- A claim that is not in the brief's Facts table; a logo or mark that is not the user's.
- A frame with a glyph from a fallback font.
- A hold loop whose loopcheck is not 0, or a cycle loop that jumps at the seam.
- An MP4 without BT.709 tags, or whose background decodes lighter than the canvas.
