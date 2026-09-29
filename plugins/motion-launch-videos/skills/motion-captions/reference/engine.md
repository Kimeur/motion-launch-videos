# Engine: the FILM config for captions

Step 4. The film is one HTML file with one canvas. [../templates/film.html](../templates/film.html) holds the whole engine; for a new film you copy it to `videos/<film>/src/film.html` and edit only the `FILM` block at the top. The template runs as it is, with its files: an 18 s pop-caption clip for a fictional voice-notes app, whose synthetic voice-over and word timings are in [../templates/assets/](../templates/assets/) (copy that folder to `videos/<film>/assets/` to run the demo, and replace its files with the user's own). The core it sits on (springs, motion blur, formats, sound, the page API) is described in core.md; the fields every engine shares (`W H FPS DUR BPM loop blur palette fonts grid springs poster formats audio`) are listed there.

The base format is 9:16, 1080 x 1920: vertical video is where captions are watched most. `--format 1:1` and `--format 16:9` render the same film at 1080 x 1080 and 1920 x 1080.

## The voice and the transcript

| Field | Meaning |
|---|---|
| `audio.track` | the voice's file, `assets/<file>`, muxed into the MP4 by `render` (audio.md) |
| `audio.offset` | where in the file the film starts, in s (default 0). Transcript times are in the file's own time; the engine subtracts the offset |
| `audio.loudness`, `audio.sfx` | the target loudness (-16 LUFS for social video) and the level of the cues, in dB |
| `voice` | the same file, embedded: `'__ASSET:assets/voice.mp3__'`. The page decodes it in `build()` for the waveform and the checks |
| `transcript.words` | word-level JSON, `[{ word, start, end }]` in seconds (also Whisper's `{ segments: [{ words }] }` and `{ words }`; `unit: 'ms'` for milliseconds). Embedded with an ASSET token, or an array pasted in |
| `transcript.srt`, `transcript.vtt` | a subtitle file instead (embedded, or the text pasted in). Timings are per cue, so word times are estimated (below) |
| `transcript.weight` | how an SRT or VTT cue's time is shared out over its words: `'syllables'` (default) or `'chars'` |
| `transcript.fillers` | words dropped from the captions, such as `['um', 'uh']`; matched without case or punctuation. Default none |
| `transcript.punct` | `'keep'` (default), `'trim'` (drop `, . ; :` at a word's end) or `'strip'` (also `? !`). Internal punctuation (`example.com`, `don't`) always stays |
| `transcript.case` | `'as-is'` (default), `'upper'` or `'lower'` |

- **The voice must decode in Chromium.** The open-source Chromium the scripts use has no AAC decoder, so an `.m4a` fails with a `voice` FAIL that prints the conversion. MP3, WAV, OGG (Vorbis or Opus) and FLAC decode. The decode runs twice, and the critique checks both give the same samples.
- **The level per frame.** Output frame n shows the film from `(n - 1) / FPS` to `n / FPS`; the engine takes the voice's RMS over exactly that span, in dB, and maps the file's loud speech (its 95th percentile) to 1 and 36 dB below it to 0. The audiogram's bars read it, and the alignment check compares it with the transcript.
- **Estimated word times.** From an SRT or VTT cue, each word gets a share of the cue proportional to its syllables (vowel groups, a silent final e dropped, at least 1; a number counts a syllable a digit), or to its letters and digits with `weight: 'chars'`. The words fill the cue end to end. A VTT cue with inline `<00:00:01.200>` stamps (as YouTube and some tools write) gives each word its stamp, which is exact. The `timings` row warns whenever a word's highlight, or a subtitle's start, rests on an estimate.
- **A clip from a longer recording.** Trim the file to the clip with ffmpeg and keep the transcript's words for that span, shifted to start at 0; or keep the file whole and set `audio.offset`. Words outside the film are left out and listed; a word the clip cuts through fails `clip edges`.

## Styles

`style` picks one. Every style reads `captions` for its block; the defaults below apply to any field left out.

| Style | What it shows | Defaults |
|---|---|---|
| `'pop'` | 1 to 3 words at a time, big and centred; each word pops in (scale, POP spring) on the frame its start falls in; the current word in `current`, emphasised words in `emph`, spoken ones in `fill`; words not yet said are hidden (`upcoming: 'hide'`) or shown in `dim` (`'dim'`) | `font: 'caption'`, `size: 92`, `maxWords: 3`, `lines: 2`, `stroke: 'ink'`, `strokeW: 0.1` (em), `from: 0.72` (the pop's first scale), `hi: 0.06` (the current word's extra scale), `emphScale: 1.12` |
| `'karaoke'` | a line of 3 to 7 words, on screen whole; a pill in `pill` slides from word to word (SLIDE spring), the word under it in `pillText`, words already said in `fill`, words to come in `dim` | `size: 60`, `maxW: 760`, `minWords: 3`, `maxWords: 7`, `lines: 1`, no stroke |
| `'subtitles'` | 1 or 2 lines of at most `maxChars` characters, at the bottom, on a box in `box` (at `boxAlpha`); the whole cue appears on its first word's frame and leaves on its last word's end plus `linger` | `font: 'text'`, `size: 44`, `maxChars: 42`, `y: 1440`, `pin: 'b'`, `maxW: 872`, `maxDur: 7` |
| `'audiogram'` | the speaker card (`audiogram`, below) and bars driven by the voice, with the captions as a karaoke line (`captions.mode: 'karaoke'`, the default) or pop captions (`mode: 'pop'`) under them | as its mode, `size: 52`, `y: 1296`, `maxW: 800` |

Fields every style reads:

| Field | Meaning |
|---|---|
| `x`, `y`, `pin` | the block's position in base pixels: its centre for pop and karaoke, the last line's baseline for subtitles |
| `maxW` | the widest a line may be, px. Pop captions shrink a unit that does not fit (to 72 % at most); a karaoke line and a subtitle are cut shorter instead |
| `size`, `font`, `lead` | the font size in px, the font role, the line spacing as a multiple of the size |
| `fill`, `current`, `emph`, `dim`, `stroke`, `strokeW`, `box`, `boxAlpha`, `pill`, `pillText` | palette roles (and the stroke's width in em) |
| `minDur` | the least time a caption stays up, s (0.7) |
| `linger` | how long a caption stays after its last word when a pause follows, s (pop 0.5, karaoke 0.6, subtitles 0.4) |
| `holdLast` | the last caption stays to the end of the film when the film ends within this many seconds of its last word (2) |
| `gapBreak` | a pause longer than this always ends a caption, s (pop 0.35, karaoke 0.6, subtitles 0.8). A removed filler counts as speech, not as a pause |
| `commaBreak`, `commaBonus` | `true` makes every comma end a caption; otherwise a comma is a strong preference (`commaBonus`, 1.5) |

### How captions are cut

1. **Hard breaks.** A sentence's end (`. ? !`), a pause over `gapBreak`, and with `commaBreak` a comma, split the words into runs.
2. **Each run is cut by a small dynamic program** into the cheapest sequence of captions. A caption costs 1, plus: its time on screen under `minDur` (a lot), set smaller to fit (a lot), a karaoke line under `minWords` (less when it is a phrase of its own), a comma inside it (twice what breaking after it gains, except after an opening "So," or "Well,"), and a break after "the", "your", "what" or a preposition, or between two capitalised words ("Acme | Memo"). A break after a comma, or before "what", "because", "and", gains.
3. **Short captions join a neighbour** when one is still under `minDur` and the two fit, across no sentence end.
4. **Lines.** A caption that fits on one line at full size takes one; otherwise the best split into `lines`, balanced and scored with the same break costs (a subtitle's lines each at most `maxChars`).
5. **Timing.** A caption appears on the frame its first word starts in and stays until the next one appears; before a pause it leaves `linger` after its last word (at least `minDur` after it appeared), fading out on EXIT, unless the next caption comes within 0.15 s, when it is held.

`render.mjs layout` lists every caption: its lines, first and last frames, time on screen, characters a second and box.

## Emphasis, emoji, sound

| Field | Meaning |
|---|---|
| `emphasis` | words drawn in `emph` and `emphScale` larger: a string matches every occurrence (without case or punctuation), a number one word by its index in the transcript. A few a clip; one idea each |
| `emphasisCue` | `{ kind, gain }`: a sound effect on each emphasised word's frame (audio.md), or `null` |
| `emoji` | `{ on: false, words: { sound: 'mute' }, x, y, pin, size, fill, stroke }`. Off by default. When on, a caption holding a mapped word shows its icon above the block (or at `x`, `y`), popping with the word. Icons come from a whitelist drawn in code, `mic mute check star heart bolt bulb clock`, since colour emoji fonts are not embeddable and differ between machines |

Emphasised words are the film's accent frames: the review stills include them and the palette gate checks them (not with an image backdrop, whose colours are not roles).

## The frame around the captions

| Field | Meaning |
|---|---|
| `backdrop` | `{ from, to, shapes, image, veil, veilOp }`: a vertical gradient between two roles, flat `shapes` (`{ id, shape: 'circle' or 'rect', x, y, r or w and h, fill, op, pin }`, drawn once), or an `image` (an ASSET token: a still from the video, the user's own) cropped to fill, under a `veil` role at `veilOp`. Drawn once in `build()`. The roles are the composition check's background |
| `brand` | `{ text, size, track, fill, small, smallFill, y, pin }`: a wordmark and a line of small print under it (a demo's `DEMO COPY, FICTIONAL PRODUCT`) |
| `speaker` | `{ name, show, fill, y, pin }`: the speaker's name as a label (and, in an audiogram, the name and the show on the card) |
| `progress` | `{ x, y, pin, w, h, fill, track }`: a bar that fills over the film, a frame at a time |
| `audiogram` | `{ cover: { src, x, y, size, radius, fill }, name: { x, y, anchor, size, fill }, show: {...}, bars: { x, y, w, h, n, fill, min, spread } }`: the square cover (an ASSET token; a square image at least the size it is drawn), the name and the show, and `n` bars whose level spreads out from the middle bar, `spread` frames a bar |

## Formats

The film is authored in 9:16 and rendered at 1:1 and 16:9 with `--format` (core.md, Formats). Every `x`, `y` goes through `fmtX` / `fmtY` with its `pin`, every size through `fmtSz`; text baselines land back on the 8 px grid. `FILM.formats` redesigns what should look different, in base-format pixels:

```js
formats: {
  '1:1': {                                   // square feed: the block wider, the frame's pieces closer in
    captions: { y: 1000, maxW: 840, size: 84 },
    brand: { y: 176 },                       // pin 't': 176 px from the top
    speaker: { y: 1728 }, progress: { y: 1776, w: 840 },   // pin 'b': 192 and 144 px from the bottom
  },
  '16:9': { captions: { y: 1000, maxW: 1200, size: 96, lines: 1 }, brand: { y: 176 }, speaker: { y: 1728 }, progress: { y: 1776, w: 1000 } },
},
```

With no pin, a position keeps its offset from the centre: at 1:1, `y: 1000` is canvas y 580 (40 px below the centre). With `pin: 'b'`, it keeps its distance from the bottom: `y: 1728` is 192 px above it in any format. Arrays of items with an `id` (the backdrop's shapes) merge item by item.

**Safe zones.** At 9:16 (and any frame over 1.6 times taller than wide) the platform's own buttons, caption and header cover the top 12 %, the right 16 % and the bottom fifth: every caption, the brand, the speaker, the card and the progress bar must sit inside `[104, 230, 907, 1536]`. That is why the template's block is 720 px wide, centred at x 540. At 1:1 and 16:9, the live area (104 px in from each edge).

An audiogram at 16:9 sets the card beside the bars and captions:

```js
'16:9': {
  captions: { x: 860, y: 1180, maxW: 760, size: 52 },
  audiogram: { cover: { x: 220, y: 960, size: 440 }, name: { x: 480, y: 750, anchor: 'L' }, show: { x: 480, y: 802, anchor: 'L' },
    bars: { x: 860, y: 980, w: 760, h: 150, n: 33 } },
  emoji: { x: 1140, y: 750, size: 130 },
  brand: { y: 176 }, progress: { x: 860, y: 1720, w: 760 },
},
```

A heavy cover on one side leans the composition that way; balance it with the bars and captions, or declare the lean (core.md, Composition).

## Springs

The core's springs (springs.md) plus these:

| Name | ζ | ω | Settles (s) | Lands (s) | Overshoot | Use |
|---|---|---|---|---|---|---|
| POP | 0.50 | 26 | 1.231 | 0.093 | 16.3 % | a word popping in |
| HI | 1 | 40 | 0.400 | 0.119 | none | the current word's extra scale, on and off |
| SLIDE | 0.85 | 34 | 0.554 | 0.144 | 0.6 % | the karaoke pill moving to the next word |

Every spring starts at the start of the frame its word starts in, `(f - 1) / FPS`, so the whole of that frame's shutter sees the move. Which caption is up and which word is current read the frame alone (`q`): every subframe of a frame agrees, and a caption never shows as a double exposure of two.

## Adding something the vocabulary lacks

A new style is a mode in `DEFAULTS`, a line in `unitFits` and `layUnit`, a draw function reading `unitAt(nq)` and `wordAt(U, nq)`, and its moves in `disp`. Keep discrete state on the frame and springs on `t`, measure in `build()`, and add its rules to `checks`.
