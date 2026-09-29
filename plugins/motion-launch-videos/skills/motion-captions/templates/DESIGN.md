# Design: <film>

The spec the film is built from. Numbers here and in the FILM config agree; when one changes, change both. Caption breaks and times come from the engine: paste the table `render.mjs layout` prints after the first build, and change the transcript's punctuation only where the speaker really paused.

## Canvas and time

- 1080 x 1920 (9:16), 60 fps, <n> s = <n x 60> frames, `loop: 'none'`.
- The voice: `assets/<file>` (<duration> s, <MP3 / WAV / OGG>), from <offset> s. The last word ends at <t> s; the film ends <0.5 to 1.5> s later.
- Transcript: <word-level JSON / SRT / VTT>, <n> words; exact / approximate word times.

## Style

- Style: <pop / karaoke / subtitles / audiogram (karaoke / pop)>, because <where it plays and what the picture is>.
- Changes to the transcript (as BRIEF.md records them): punctuation <keep / trim / strip>, case <as-is / upper>, fillers removed <none / um, uh>.
- Emphasis: <the words, and why each>. Emphasis cue: <kind and gain / none>.
- Emoji: off / <word: icon, ...>.

## Formats

- Master 9:16 (1080 x 1920). Delivered also: <1:1 (1080 x 1080) / 16:9 (1920 x 1080) / none>.
- Positions are in base pixels (9:16); with no `pin` an element keeps its offset from the centre.

| Format | Caption block (x, y, maxW, size, lines) | Brand | Speaker, progress | Safe zone |
|---|---|---|---|---|
| 9:16 | 540, <y>, 720, <size>, <lines> | y <y>, pin t | y <y>, <y>, pin b | [104, 230, 907, 1536] |
| 1:1 | | | | [104, 104, 976, 976] |
| 16:9 | | | | [104, 104, 1816, 976] |

## Palette

| Role | Hex | Used for | Contrast |
|---|---|---|---|
| bg | | the backdrop's top | |
| | | the backdrop's bottom, shapes | |
| paper | | caption fill, brand | on the stroke / box: |
| ink | | the stroke round every word (or the subtitle box) | |
| | | the current word | on the stroke: |
| | | emphasis | on the stroke: |
| dim | | small print, the speaker; words to come (karaoke) | on every backdrop role: |

## Type roles

| Role | Face | Size | Use |
|---|---|---|---|
| caption | Montserrat 800 | <size> px | the captions |
| text | Montserrat 600 | 44 px | subtitles, the speaker's name on a card |
| mono | IBM Plex Mono 500 | 26 to 28 px | small print, the speaker label |

## Captions

From `render.mjs layout` (first frame, last frame exclusive, time on screen, characters a second):

| # | Caption | Frames | On screen (s) | Chars/s |
|---|---|---|---|---|
| 0 | | | | |

## The frame

- Backdrop: <gradient from, to; shapes; image and veil>.
- Brand: <text>, small print <text>.
- Speaker: <name>. Progress bar: <y, width>.
- Audiogram card: cover <size> px at <x, y>; name and show; <n> bars, <w> x <h>.

## Sound

- Track: the voice, gain <n> dB, loudness <-16> LUFS.
- Cues: <emphasis taps / none>.

## Review stills

Written by `render.mjs stills`: frame 0, each caption with its words up, the first pop (or the pill moving), each emphasised word, the last frame, plus `stills/contact.png`.
