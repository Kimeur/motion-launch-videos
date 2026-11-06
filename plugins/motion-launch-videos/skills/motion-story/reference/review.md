# Review: the pre-pass critique and the final checklist

Step 5 and the end of step 6. Nothing is rendered in full until the stills pass, and nothing is delivered until the files verify and you have watched and heard the film.

## Pre-pass: `render.mjs stills`

It prints only the checks that did not pass (set `VERBOSE=1` to see all), writes two PNGs per scene (just after the cut, mid-scene), frame 0 and the last frame to `videos/<film>/stills/`, and a labelled `contact.png`. It exits non-zero when anything fails.

### Automated checks

| Check | Fails when | Fix |
|---|---|---|
| voice timing | `DUR` is not the voice-over's length in `assets/timing.json` | run `voice.mjs` again |
| voice scenes | the scenes in FILM are not the ones the voice-over was made for | run `voice.mjs` again |
| scene (warn) | a scene lasts under 1.2 s (too short to read) or over 9 s (one picture too long) | merge or split its lines |
| the ask (warn) | the last scene is not the question card | end on `set: 'question'` |
| hook (warn) | the first line ends after 3.5 s | a shorter first line |
| timing (warn) | the transcriber heard under 60 % of a line's words; the rest were spread by length | look at that line's captions in the stills; reword it or give it a `speak` form |
| captions | no words; the caption line leaves the live area | |
| contrast | the caption fill or a mark colour against the outline | another role |
| glyphs | a character the face does not have (a phone text, a ticker) | change the text or the face |
| format (warn) | not 9:16 | |
| palette roles | a colour is not a palette role | add the role |

The core's palette gate does not run here: coloured light (lamps, neon, sodium street light) falling on things is the look.

### By eye, on the contact sheet and the full-size stills

- **The first frame**: the scene, readable at thumbnail size; not black, not empty.
- **Captions**: clear of the hero's face, of the HUD cards and of the phone's text; the coloured words are the ones that matter.
- **Each set says where we are** in one glance: car, motel, room, phone, news.
- **Cards**: the numbers readable, the card not over the action.
- **The hero**: face readable, not cut by the frame edge unless it is a back view on purpose.
- **The question card**: both answers fully on screen, the call to comment visible.

## Before delivering

1. `render`: the full film (about 1 to 2 minutes of render per 10 s at 30 fps).
2. `verify`: every check passes, including the loudness.
3. `mp4frames`, then a strip of the whole film (`ffmpeg -i renders/<film>.mp4 -vf "select=not(mod(n\,60)),scale=180:-1,tile=8x5" -frames:v 1 strip.png`): watch for a caption behind the hero, a card over a caption, a scene that does not change.
4. Play it with sound: the words on screen land with the voice, nothing clips, the score sits under the voice.
5. Report: the files with sizes, what verify said, the lowest mp4frames PSNR, and the post caption from STORY.md.

## What never ships

- A real person, company, case or news story, or a lookalike.
- A working method for a crime, a weapon detail, gore.
- A cloned voice; a synthetic voice without the AI label in the post.
- A question with one obvious answer.
