# Review: the pre-pass critique and the final checklist

Step 4 and the end of step 5. Nothing is rendered in full until the stills pass, and nothing is delivered until the files verify and you have looked at the alpha.

## Pre-pass: `render.mjs stills`

It prints only the checks that did not pass (set `VERBOSE=1` to see all), writes one PNG per planned frame to `videos/<film>/stills/` (with its alpha: a viewer shows it over white or a checkerboard), and a labelled `contact.png` with every frame composited over `bg`. It exits non-zero when anything fails. With `--format 9:16` (or `1:1`) it checks the film at that ratio and writes to `stills/9x16/`; run it once per delivered format.

The planned frames, for an overlay that comes in and goes out: frame 0 (empty), coming in, the accent (the main line landing, or the button's click), landed (the end of `timing.in`), mid-hold, going out, and the last frame (empty). For a hold loop: frame 0 at rest, the glint or a pulse, and the last frame.

### Automated checks

| Check | Fails when | Fix |
|---|---|---|
| glyphs | a character is not in the cmap of the face that draws it | change the copy, or a face or subset that has it (fonts.md) |
| timing: in | a part lands after `timing.in` | a longer `in`, or start it sooner |
| timing: out | the exit needs longer than `timing.out`, so it eats into the hold | set `timing.out` to the value it prints |
| reading time | the hold is shorter than the words take to read: 15 characters a second, at least 1.5 s (the tag's small print is not counted) | a longer `timing.hold`, or fewer words |
| title safe | a line of text leaves the title-safe area (90 %) at rest | move it in, or smaller |
| action safe | a plate, bar, icon or stroke leaves the action-safe area (93 %) at rest | move it in; `bleed: true` only for a band meant to run off the edge |
| platform zone (9:16) | a part sits under the feed's header, caption or buttons | patch its position in `FILM.formats['9:16']` |
| text size | a cap height under 26 px at 1080 | larger |
| contrast | text under 4.5:1 (3:1 at a cap height of 40 px or more) against its plate, its keyline, or, with neither, the worst of light, mid and dark footage and `bg`; a translucent plate or a faded part is mixed over each | a plate, a more opaque scrim, a keyline, another role |
| keyline | a stroke with no keyline of at least 3:1 against it | add `keyline` |
| collision / cramped | two lines overlap at rest, or sit under 16 px apart | more pad or gap |
| clean alpha | a pixel with alpha outside every part's box at rest | a part drawn outside its box: a bug in a new part type, or a stroke wider than its box allows |
| clean head and tail | frame 0 or the last frame has any alpha, in an in-and-out overlay | nothing should be on screen at 0; the exit must finish (timing: out) |
| middle of the frame | over 8 % of the middle ninth covered at rest, for longer than 1 s (a title card and an end screen excepted) | move it off centre, or make it a card on purpose |
| bug opacity, bug size | a bug over 80 % opaque at rest, or over 2 % of the frame or a tenth of its short side tall | lower `opacity`, smaller mark or wordmark |
| end screen zone | a part other than a zone's own frame overlaps a zone, or a zone leaves the frame | move the words; match the zones to YouTube Studio's layout |
| guides (warn) | the end screen's dashed guides are on | `guides: false` before the render |
| loop | a hold loop on a kind that comes and goes, or a cycle loop | `loop: 'none'` |
| palette roles | a colour is not a palette role | add the role |
| loop tail (hold loop) | the glint or a pulse is still moving in the last frame's shutter | an earlier `glint.at`, a longer hold |
| blank frames (warn) | 4 or more frames with nothing on screen | the entrance starts later than 0, or the exit ends early: check the timing |
| composition | the ink leans past a fifth of the frame in a direction nobody declared (a transparent film warns at most) | the engine declares the overlay's own lean; set `FILM.composition` per format when it guesses wrong |
| audio | `FILM.audio` with no cues and no track | `sfx` kinds, or no `audio` |
| palette gate | an accent frame has a patch of mixed ink | opaque plates under chromatic parts |

The numbers behind these checks are in `LIM` at the top of the engine; `FILM.limits` overrides them for one film (a channel's own bug rule, a broadcaster's safe areas).

### By eye, on the contact sheet and the full-size stills

- **Does it read in a glance?** The name first, then the role. If the eye goes to the bar or the tag first, it is too loud.
- **Is it the right size for the frame?** A lower third about a third of the width at 16:9; at 9:16, up to two thirds.
- **Coming in:** the text appears from behind the plate's edge, not over empty picture; the plate never runs ahead of the bar.
- **Going out:** nothing lingers; the last still is empty.
- **Descenders and accents** inside their plate (a `y`, a `g`, an `É`).
- **Each format** looks designed for its frame: at 9:16 the lower third above the caption area and away from the buttons; at 1:1 nothing that was in a corner now sits on the stack.

Fix, rebuild, and run stills again.

## Before delivering

1. `loopcheck`: for an in-and-out overlay, the purity lines are 0; for a hold loop, every maximum difference is 0.
2. `render`: the full film, in the background.
3. `verify`: every check passes, including `mov with alpha`, `webm with alpha`, both `alpha vs canvas` lines and `poster alpha`.

   Run the three once per delivered format, with the same `--format` flag each time.
4. **Look at the alpha.** Decode a mid-hold frame and a motion-blurred one (the second or third frame, one from the exit) from each file and composite them over a checkerboard and over a still like the footage:
   ```bash
   ffmpeg -i renders/<film>.mov -vf "select=eq(n\,120)" -frames:v 1 -pix_fmt rgba /tmp/mov.png
   ffmpeg -c:v libvpx-vp9 -i renders/<film>.webm -vf "select=eq(n\,120)" -frames:v 1 -pix_fmt rgba /tmp/webm.png
   ffmpeg -f lavfi -i "color=s=1920x1080:c=white" -vf "geq=lum='if(mod(floor(X/32)+floor(Y/32),2),255,190)':cb=128:cr=128" -frames:v 1 /tmp/checker.png
   ffmpeg -i /tmp/checker.png -i /tmp/mov.png -filter_complex "[0][1]overlay=format=auto" -frames:v 1 /tmp/mov-over-checker.png
   ```
   Look for: a plate edge with a dark or light halo (premultiplied alpha read as straight, or the reverse), a blur streak that darkens as it fades, anything outside the overlay, a checkerboard showing through a plate that should be opaque. `libvpx-vp9` is named as the decoder because ffmpeg's own VP9 decoder drops the alpha.
5. `mp4frames` for the preview's frames over `bg`.
6. Report: the files with sizes, what verify said, the loopcheck line, the lowest mp4frames PSNR, what you saw in the alpha, and anything you could not check.

## What never ships

- A name, role, handle or quote that is not in the brief's Facts, or a person on screen without their permission.
- A platform's logo or button, or anyone else's mark.
- Text that fails contrast on some footage, or a part outside the safe areas.
- An overlay whose first or last frame is not empty (in-and-out), or pixels drawn outside it.
- The end screen's dashed guides, or a part inside an end screen element's area.
- An MP4 used as the deliverable instead of the .mov or .webm.
