# Review: the pre-pass critique and the final checklist

Step 5 and the end of step 6. Nothing is rendered in full until the stills pass, and nothing is delivered until the files verify and you have looked at them.

## Pre-pass: `render.mjs stills`

It prints only the checks that did not pass (set `VERBOSE=1` to see all), writes one PNG per planned frame to `videos/<film>/stills/`, and a labelled `contact.png`. It exits non-zero when anything fails.

The planned frames: frame 0, each key move shortly after it starts, each camera move after it lands, the midpoint, and the last frame.

### Automated checks

| Check | Fails when | Fix |
|---|---|---|
| glyphs | a character of the 3D type or a label is not in the face's cmap | change the copy or the face (fonts.md) |
| words | the 3D type holds more than 4 words | shorter |
| live area | the 3D type's box on screen leaves the margins at 0, 25, 50 or 75 % of the loop; a label leaves them | move the camera back or up, smaller `cap` |
| type size (warn) | the 3D type's cap height is under 60 px on screen | larger `cap` or a closer camera |
| mesh | a text or path object built no triangles (a glyph the face lacks, an empty path) | the face, the path data |
| grid (warn), collision, cramped | labels off the 8 px grid, or overlapping or crowding each other | move them |
| contrast | a label, or the 3D type's face colour, is under its minimum against the background | another role |
| palette roles | a colour is not a palette role | add the role |
| loop closes | a keyed value or the camera ends somewhere other than where it started (a whole turn counts as where it started) | add the move back |
| cycle | a spin, orbit, bob, wobble, sway or camera orbit is not a whole number of cycles per loop | whole numbers |
| blank frames (warn) | frames show nothing | |
| renderer | information: WebGL2, the multisampling and the shadow map in use | |

The palette gate is not run for 3D: shading and antialiasing make in-between colours at every silhouette by design.

### By eye, on the contact sheet and the full-size stills

- **Intersections**: a ring through a letter, an orb through the floor, a letter through its neighbour mid-flip.
- **Grounding**: every object has a shadow under or behind it; nothing floats unless it is meant to.
- **Faces**: the type's front faces are light and even; the walls show; the bevel catches the light as a thin bright edge.
- **Shadow acne or detachment**: speckled stripes on surfaces (acne), or a gap between an object and its shadow at the contact point (too much bias).
- **Tessellation**: faceted curves on big spheres or tori in close-ups (raise the segment counts in the engine).
- **The horizon**: none. If the floor's edge shows, the camera sees past it; lower the pitch or enlarge the floor.
- **Motion blur**: fast flips and orbits streak; nothing shows stepped copies (`render.mjs frame` prints subframe counts).

Fix, rebuild, and run stills again. Show the user the contact sheet and anything you changed on their brief.

## Before delivering

1. `loopcheck`: every purity difference is 0, and the seam continuity line passes.
2. `render`: the full film, in the background (a 10 s 1080 x 1080 film takes a few minutes on the software renderer).
3. `verify`: every check passes; for a film without a plain background at frame 0, the background check uses its most common colour.
4. **Extract and look**: `mp4frames`, then a strip of the whole film (`ffmpeg -i renders/<film>.mp4 -vf "select=not(mod(n\,10)),scale=180:-1,tile=10x6" -frames:v 1 strip.png`).
5. Report: the files with sizes, what verify said, the loopcheck line, the lowest mp4frames PSNR, and anything you could not check.

## What never ships

- A logo or product that is not the user's.
- A claim that is not in the brief's Facts table.
- A frame with a glyph from a fallback font, or a glyph that failed to extrude.
- A loop that jumps at the seam.
- An MP4 without BT.709 tags, or whose background decodes lighter than the canvas.
