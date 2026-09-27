# Review: the pre-pass critique and the final checklist

Step 5 and the end of step 6. Nothing is rendered in full until the stills pass, and nothing is delivered until the files verify and you have looked at them.

## Pre-pass: `render.mjs stills`

It prints only the checks that did not pass (set `VERBOSE=1` to see all), writes one PNG per planned frame to `videos/<film>/stills/`, and a labelled `contact.png`. It exits non-zero when anything fails.

The planned frames: frame 0, the loop start (the lockup leaving and the first scene arriving), each transition just after it starts, each scene at rest (before its punch-in, or after the punch settles, never inside its zoom blur), each accent frame (every `mis` landing and each mask wipe's first frame), and the last frame.

### Automated checks

| Check | Fails when | Fix |
|---|---|---|
| glyphs | a character is not in the cmap of the face that draws it | change the copy, or fetch a subset or face that has it (fonts.md) |
| words | a scene has more than 4 words of display type | cut words, or split the beat |
| live area | a line's or crumb's ink leaves the margins | smaller size, shorter crumb, or `bleed: true` if intended |
| grid (warn) | a baseline is not a multiple of the unit | move it to the grid |
| collision | two elements of one scene overlap at rest | move baselines apart |
| cramped (warn) | two elements are under 16 px apart | same |
| letter gaps | a display pair has under 0.037 em of ink gap | the `pairs` entry the message suggests (for ANYTHING at -20 tracking: `YT 2px (0.013 em) < 0.037 em; try pairs: { "YT": 29 }`): it already includes the current value and a 0.005 em margin, so it holds after `fit` resizes the line |
| orphan (warn) | a lone word of 3 letters or fewer is stacked against lines 2.5 times wider | rewrite, or make it a label |
| contrast | display type under 3:1 or crumbs under 4.5:1 against the background | a lighter role |
| palette roles | a colour in the film is not a palette role | add the role, or use an existing one |
| loop tail | anything still changes in the last frame's shutter: a spring, a crumb typing or its cursor blinking, a scramble, an accent | end the lockup sooner, stop the blink earlier, or lengthen the film. The hold it prints is a lower bound; loopcheck counts identical pixels and often finds a few more |
| blank frames (warn) | 4 or more frames (1/15 s) in a row show nothing at half opacity: a flash between the lockup's exit and the hook, or after a cut | start the next entrance sooner, or `enter.pop` at a cut |
| timeline (warn) | the camera does not return, a punch is never reset, a wrap exit stays on canvas | see motion-blur-loop.md |
| palette gate | an accent frame (a landing or a mask wipe's first frame) has a patch of mixed ink (two hues blended into a third) | check `misPair` and the element colours (techniques.md) |

### By eye, on the contact sheet and the full-size stills

Open `stills/contact.png` first, then every full-size still that looks off. For each still, ask:

- **Cramped?** Lines that nearly touch, a stack that reads as one block, a crumb pressed against a line.
- **Orphans and widows?** A word alone that is not meant to be alone; a line much shorter than its neighbours without a reason.
- **Contrast in motion?** Blurred type loses contrast; an accent-on-accent frame may disappear.
- **Palette?** Only palette colours, plus their blends with the background. No olive, no mustard, no grey boxes.
- **Hierarchy?** One thing to read per frame. If two lines compete, one is the wrong size or colour.
- **The accent frames**: the misregistration should be visible and brief, on the landing, not before it.
- **The transitions**: the mask wipe covers the frame before it hands over; the pan reads as a streak, not as copies.
- **The loop start**: the lockup leaves and the hook arrives with no empty frame between them.
- **The first frame after each cut** shows something: a cut onto one faint glyph reads as a glitch.
- **Frame 0 and the last frame** look identical, and the lockup is complete in both.

Fix, rebuild, and run stills again. Show the user the contact sheet and anything you changed on their brief.

## Before delivering

1. `loopcheck`: every maximum channel difference is 0.
2. `render`: the full film, in the background.
3. `verify`: every check passes. The encoded seam and the GIF size are information and warnings.
4. **Extract and look**: `mp4frames` decodes the planned frames from the MP4 into `stills/mp4/` with a contact sheet and each frame's PSNR against the canvas. Read the sheet and at least the accent, mask, pan and lockup frames full size. Confirm they match the stills.
5. Report: the files with sizes, what verify said, the loopcheck line, the lowest mp4frames PSNR, and anything you could not check.

## What never ships

- A claim that is not in the brief's Facts table, or a number the product's site does not show.
- A frame with a glyph from a fallback font.
- A loop whose loopcheck is not 0.
- An MP4 without BT.709 tags, or whose background decodes lighter than the canvas.
