# Review: the pre-pass critique and the final checklist

Step 5 and the end of step 6. Nothing is rendered in full until the stills pass, and nothing is delivered until the files verify and you have looked at them.

## Pre-pass: `render.mjs stills`

Run it once per format you deliver (`--format 9:16`, `--format 16:9`; the square needs no flag): every check below is measured in that format. It prints only the checks that did not pass (set `VERBOSE=1` to see all), writes one PNG per planned frame to `videos/<film>/stills/`, and a labelled `contact.png`. It exits non-zero when anything fails.

The planned frames: frame 0, the lockup leaving, the device landed, each tap (just after the press), each scroll, each push, expand and cut (mid-move and landed), each state change, toggle and tick, each toast, sheet and modal open, each focus zoom landed, each callout landed, the lockup coming back, every accent frame, and the last frame.

### Automated checks

| Check | Fails when | Fix |
|---|---|---|
| glyphs | a character is not in the cmap of the face that draws it | change the copy, or a face or subset that has it (fonts.md) |
| text size | a UI or free text is under 24 px at 1080 (its size x every scale above it x the device scale, camera at rest) | make it bigger, or turn it into `bars` if nobody needs to read it; the status-bar clock and the URL are chrome and exempt |
| contrast | a text under 4.5:1 against its own container (3:1 from 40 px): the topmost filled box behind it on its screen, its `on` role, or the screen's `bg` | another role, or put it on its own fill |
| backdrop (warn) | a text sits partly off the box behind it (half on an image, half on the page) | move it onto one backdrop, or give it one |
| overflow | a text's ink leaves its box (a label wider than its button), or runs off the screen | shorten it, make it smaller, or make the box wider |
| collision | two texts of one screen overlap at rest | move one |
| screen (warn) | a layer runs off the screen's width | move it, or `bleed: true` |
| words | a callout has more than 4 words; two callouts on screen together have more than 4; the lockup has more than 4 words of display type | cut words, or split the callout across two steps |
| words: screen (warn) | a screen shows more than 16 words of UI text | turn what does not matter into bars |
| grid (warn) | a callout or free text baseline is off the 8 px grid | move it to the grid |
| live area | a callout, a free layer, or the device at rest leaves the margins | smaller, move it, or `bleed: true` for a device cropped on purpose |
| clearance | a callout overlaps the device at rest (warn under 24 px), or the device runs under it while the camera moves | move the callout, or take it out before the zoom |
| overlap | a callout sits on another callout, or on a free layer (a headline, the lockup), while both show | move one, or time them apart |
| leader | a callout's element does not exist, is not on screen while the callout shows, or the leader ends off the screen or on its own words | point at something on the screen of that step; time the callout to it |
| focus (warn) | a focus zoom's target is larger than the live area at its zoom (a target that fits is kept inside: the camera moves as little as it must, and the row says how far) | zoom less |
| tap | the element is not on the screen on top, the pointer is not on it when it presses, or (warn) the pointer lands after the press | aim with `move` (and `point`) three 16ths before the tap |
| crossfade | a button state or toggle crossfades two fills whose hues mix into a third | fade through a neutral, or use two tints of one hue |
| scroll (warn) | a scroll heads outside the content (0 to its height minus the screen's) | scroll less, or make the content taller |
| caret | an input's caret still blinks at the end of a hold loop | `blur` it, or leave its screen |
| pointer | the pointer is still on screen at the end of a hold loop | `pointer: 'out'` before the lockup |
| device seam | in a hold loop, the device (or its shadow) shows at frame 0 or at the end, in two different places | enter from where it exits to, far enough off the canvas |
| palette roles | a colour in the film is not a palette role | add the role, or use an existing one |
| loop tail (hold) | anything still changes in the last frame's shutter: a spring, typing, a caret, an accent | start the lockup sooner, or lengthen the film |
| loop closes (cycle) | a value ends somewhere other than where it starts | undo the action: pop, close, scroll back, toggle back, `clear` |
| blank frames (warn) | 4 or more frames show nothing | overlap the device's exit and the lockup's entrance |
| timeline (warn) | an event lies outside the loop | move it inside 0 to DUR |
| composition | the ink in the review stills leans to one side: a warning past a lean of 20 % of the canvas on average, a failure past 30 % (core.md) | a patch for that format: move the device toward the centre, bring the callouts to the other side, pin what belongs at an edge |
| palette gate | an accent frame (each tap, state change, toggle, tick and tab) has a patch of mixed ink | make overlapping inks opaque, or the overlay neutral |

### By eye, on the contact sheet and the full-size stills

- **Is it their product?** Put a still next to each screenshot: layout, colours and words match, minus what BRIEF.md says was simplified.
- **One thing to look at?** The pointer, the thing it presses, then the result, then the callout; never two at once.
- **Crisp UI text**, no fallback faces, no text touching the edge of its box; skeleton bars where text does not matter.
- **The pointer** lands on the element (not its edge), lifts out between steps, and never covers a label while it changes.
- **Transitions**: a card grows into its screen without a jump at the start (the card is the screen's top, scaled); a push shows both screens with the old one dimmed; sheets and modals have their scrim.
- **The zoom** frames the device, not empty background; nothing the viewer needs is cut off at the frame's edge.
- **Each format looks designed for itself**: in 9:16 a big phone with the words above it and leaders that do not cross other UI; in 16:9 the phone and the words together, not a square in the middle of a wide frame.
- **Callouts** are level with what they name, the dot sits on it, the leader does not cross other text.
- **The lockup** is complete and still in frame 0 and the last frame, and nothing of the device (or its shadow) shows in either.

Fix, rebuild, and run stills again. Show the user the contact sheet next to their screenshots, and anything you changed on their brief.

## Before delivering

Steps 1 to 4 run once per delivered format, with `--format`.

1. `loopcheck`: every maximum channel difference is 0 (and, for a cycle loop, the seam continuity line passes).
2. `render`: the full film, in the background.
3. `verify`: every check passes. The encoded seam and the GIF size are information and warnings.
4. **Extract and look**: `mp4frames` decodes the planned frames from the MP4 into `stills/mp4/` with a contact sheet and each frame's PSNR against the canvas. Read the sheet and the tap, transition and zoom frames full size; make a filmstrip of the whole MP4 to judge the pacing.
5. Report: the files with sizes, what verify said, the loopcheck line, the lowest mp4frames PSNR, and anything you could not check.

## What never ships

- A screen, feature or piece of data the product does not have; a claim that is not in the brief's Facts table.
- A real person's photo, an app-store badge, or another company's logo or device.
- A frame with a glyph from a fallback font.
- A hold loop whose loopcheck is not 0, or a cycle loop that jumps at the seam.
- An MP4 without BT.709 tags, or whose background decodes lighter than the canvas.
