# Review: the pre-pass critique and the final checklist

Step 5 and the end of step 6. Nothing is rendered in full until the stills pass, and nothing is delivered until the files verify, you have looked at them, and the sound lines up with the words.

## Pre-pass: `render.mjs stills`

It prints only the checks that did not pass (set `VERBOSE=1` to see all), writes one PNG per planned frame to `videos/<film>/stills/`, and a labelled `contact.png`. It exits non-zero when anything fails. With `--format 1:1` (or `16:9`) it checks the film at that ratio and writes to `stills/1x1/`; run it once per delivered format.

The planned frames: frame 0, each caption with all its words up (at most 14, spread over the film), the first word popping in (pop) or the pill moving (karaoke), each emphasised word's frame, and the last frame.

### Automated checks

| Check | Fails when | Fix |
|---|---|---|
| transcript | a caption's words differ from the transcript's, in order, after the recorded punctuation, case and filler changes | a bug or a wrong transcript: never edit the captions to differ |
| clip edges | the film's start or end cuts through a word (a note lists the words outside the clip) | move `audio.offset` or `DUR` |
| timings (warn) | a word's highlight or a subtitle's start rests on a time estimated from an SRT or VTT cue | word-level JSON from the transcription tool |
| word timings | a word ends before it starts or starts before the one before it (warn: words overlap) | fix the transcript file |
| sync | a word does not light on the frame its start time falls in (warn: two words start in one frame, and the first is never lit) | a bug; or a transcript with times closer than a frame |
| pop groups, karaoke lines, subtitle lines | a pop caption over 3 words; a karaoke line over 7 (warn: under 3 when it could join a neighbour); a subtitle over 2 lines or 42 characters a line (warn: over `maxChars`) | `maxWords`, `maxChars`, `maxW` |
| caption size (warn) | a caption set under 80 % of `size` to fit, or captions under 40 px at 1080 | a wider block, a smaller `size`, fewer words a caption |
| reading speed | over 25 characters a second (warn: over 17), spaces included, over the time a caption can be read in | fewer words a caption, a longer `linger` before pauses, or another cut of the clip |
| time on screen (warn) | a caption up under `minDur` (0.7 s) that could not join a neighbour | a longer `linger`, a larger `maxWords` |
| gaps | two captions overlap, one never shows, or a gap of 1 to 3 frames between two makes them flicker | a bug; report it |
| safe zone | a caption, the brand, the speaker, the card, the bars or the progress bar outside the zone: at 9:16 `[104, 230, 907, 1536]` (the platform's UI), elsewhere the live area | move it, narrow `maxW`, patch the format |
| collision / cramped (warn) | a caption overlaps the brand, the speaker, the card or the progress bar, or sits under 16 px from it | move one of them |
| voice | the voice does not decode (an AAC `.m4a`), ends before the last word or before the film (the render would loop it), or still sounds when the film ends (warn) | convert to MP3; fix `DUR` or `audio.offset` |
| decode | two decodes of the voice differ | report it: the waveform would change between runs |
| alignment | the transcript lines up with the voice's loud frames best at a lag over 100 ms (warn: over 35 ms) | the transcript is offset: set `audio.offset`, or re-export it |
| words on sound (warn) | more than 5 % of the words fall on near silence | wrong timings, or the wrong file |
| ending (warn) | the last word ends under 0.5 s before the film does | a longer `DUR` |
| emphasis (warn), emoji | an emphasised word matches nothing; an icon outside the whitelist | fix the word or the icon name |
| cover (warn) | the audiogram's cover is drawn over 1.25 times its own size | a larger image |
| contrast | caption text under 4.5:1 against its stroke, box, pill or backdrop (words to come under 3:1); the brand under 3:1 and small print under 4.5:1 against every backdrop role; with an image and no stroke or box, the darkest 5 % of the pixels behind the captions | a stroke, a box, a veil, another role |
| glyphs | a character is not in the face that draws it (curly quotes, accents) | a face or subset that has it (fonts.md) |
| palette roles, palette gate | a colour that is not a role; mixed ink on an emphasised word's frames | use the roles |
| composition | the ink leans to one side over the stills (core.md) | centre the block; a subtitles film with nothing else leans to the bottom: give it an image backdrop or declare the lean |
| audio, audio track | no track and no cues; the track file missing | `audio.track` names the file in `assets/` |

### By eye, on the contact sheet and the full-size stills

- **Can you read each caption in the time it is up?** Say it aloud with the still in front of you.
- **Breaks.** No caption ends on "the", "a", "your"; no name split across two captions or two lines; commas end captions where the speaker paused.
- **The current word stands out** from the ones already said, and emphasis from both.
- **Strokes.** No gap between the stroke and the letter; strokes of neighbouring words do not touch.
- **The pop.** The first word popping in (`pop-in`) grows from its own centre, not from a corner.
- **Karaoke.** The pill covers its word whole, with even padding, and the word under it is readable.
- **Each format looks designed for its frame.** At 9:16 the block sits a little below centre, clear of the right edge; at 16:9 the captions are not lost in the width.

## Listen by numbers

The render normalises the voice and muxes it; check that what you hear is where the words are. Draw the MP4's waveform with the caption times over it:

```bash
ffmpeg -v error -i videos/<film>/renders/<film>.mp4 -filter_complex "[0:a]aformat=channel_layouts=mono,showwavespic=s=1800x240:colors=white[w];color=c=black:s=1800x240[b];[b][w]overlay=format=auto" -frames:v 1 videos/<film>/stills/wave.png
node <skill>/scripts/render.mjs layout videos/<film>     # each caption's first frame and each word's start
```

Each burst in `wave.png` is a word or a phrase; at 1800 px for the film's length, a word starting at t sits at `1800 x t / DUR` px. Mark the word spans on it (a `drawbox` per word, from the transcript), read the image, and check that every span covers a burst, the pauses fall between captions, and the last burst ends with the last word. The critique's `alignment` row makes the same comparison frame by frame.

## Before delivering

1. `loopcheck`: a `'none'` film checks purity only (the same frame twice gives the same pixels); every diff must be 0.
2. `render`: the full film with the voice, in the background.
3. `verify`: every check passes, including the audio stream (AAC, 48 kHz, stereo, as long as the video) and the loudness (within 1.5 LU of the target).
4. **Extract and look**: `mp4frames` decodes the planned frames into `stills/mp4/` with a contact sheet and each frame's PSNR against the canvas. Read the sheet, and a full-size frame with emphasis.
5. **Listen by numbers**, above.
6. Report: the files with sizes, what verify said (loudness, true peak), the loopcheck line, the lowest mp4frames PSNR, and anything you could not check.

Run `stills`, `render` and `verify` once per delivered format, with the same `--format` flag each time.

## What never ships

- A caption that says anything the speaker did not, or leaves out a word they said (other than a recorded filler).
- A voice without the speaker's permission, or a synthetic voice passed off as a person.
- A word lit before it is said.
- A frame with a glyph from a fallback font.
- An MP4 whose sound is shorter than its picture, or without BT.709 tags.
