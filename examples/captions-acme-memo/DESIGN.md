# Design: captions-acme-memo

The spec `src/film.html` was built from. Caption breaks, frames and boxes are the values `render.mjs layout` reported; sizes are at the 9:16 master unless a format says otherwise.

## Canvas and time

- 1080 x 1920 (9:16), 60 fps, 18.000 s = 1080 frames, `loop: 'none'`.
- The voice: `assets/voice.mp3`, 18.00 s, from 0 s. The first word starts at 0.400 s, the last ends at 16.723 s; the last caption holds to the end, 1.28 s later.
- Transcript: `assets/words.json`, word-level JSON, 37 words with exact times.

## Style

- Pop captions: the demo is built as a Reel, where the words are the picture.
- Changes to the transcript: punctuation trimmed (`punct: 'trim'`), case as said, one filler removed ("um,").
- Emphasis: "off" (the hook turns on it), "read" (the problem), "captions" (the product). A `tap` at -10 dB on each.
- Emoji: off.

## Formats

The MP4, GIF and `poster.png` are the 9:16 master. The same `src/film.html` renders at 1:1 and 16:9 with `--format`; `poster-1x1.png` and `poster-16x9.png` are the poster frame (10.6 s) of each. Positions are in 9:16 pixels.

| Format | Caption block | Brand | Speaker, progress | Safe zone |
|---|---|---|---|---|
| 9:16 | centre 540, 1008; 720 wide; 88 px; up to 2 lines | baseline 296 (pin t) | 1424 and 1472 (pin b), 720 wide | [104, 230, 907, 1536], the platform's UI |
| 1:1 | centre y 1000 (canvas 580); 840 wide; 84 px | 176 | 1728 and 1776 (canvas 888, 936), 840 wide | [104, 104, 976, 976] |
| 16:9 | centre y 1000 (canvas 580); 1200 wide; 96 px; 1 line | 176 | 1728 and 1776, 1000 wide | [104, 104, 1816, 976] |

The backdrop's two circles move per format (`H1`, `H2` by id) so they stay in the corners.

## Palette

| Role | Hex | Used for | Contrast |
|---|---|---|---|
| bg | #16122E | the backdrop's top | |
| deep | #251C52 | the backdrop's bottom | |
| halo | #2E2466 | the circles, the progress track | |
| paper | #FFFFFF | caption fill, the wordmark | 19.5:1 on ink; the wordmark 13.5:1 on halo or better |
| ink | #0C0A1C | the stroke round every word, 0.1 em | |
| sun | #FFD23F | the current word, the progress bar | 13.5:1 on ink |
| pink | #FF6B9A | emphasis | 7.3:1 on ink |
| dim | #A9A2D6 | small print, the speaker label | 5.7:1 on halo, 7.6:1 on bg |

## Type roles

| Role | Face | Size | Use |
|---|---|---|---|
| caption | Montserrat 800 | 88 px (9:16), 84 (1:1), 96 (16:9); emphasis 1.12 times | captions; the wordmark at 40 px, tracked +180 |
| mono | IBM Plex Mono 500 | 26 px (small print), 28 px (speaker) | `DEMO COPY, FICTIONAL PRODUCT`, `SYNTHETIC VOICE` |

## Captions (9:16)

First frame, last frame (exclusive), time on screen, characters a second:

| # | Caption | Frames | On screen (s) | Chars/s |
|---|---|---|---|---|
| 0 | Most people | 24 to 73 | 0.80 | 13.7 |
| 1 | scroll with | 73 to 123 | 0.84 | 13.1 |
| 2 | the sound off | 123 to 202 | 1.31 | 9.9 |
| 3 | So if | 202 to 273 | 1.17 | 4.3 |
| 4 | your video / talks | 273 to 358 | 1.43 | 11.2 |
| 5 | it should also | 358 to 422 | 1.07 | 13.1 |
| 6 | read | 422 to 466 | 0.73 | 5.4 |
| 7 | Acme Memo / turns | 466 to 540 | 1.23 | 12.2 |
| 8 | what you say | 540 to 600 | 1.01 | 11.9 |
| 9 | into captions | 600 to 672 | 1.19 | 10.9 |
| 10 | word by word | 672 to 745 | 1.21 | 9.9 |
| 11 | in time with | 745 to 809 | 1.07 | 11.3 |
| 12 | your voice | 809 to 881 | 1.21 | 8.3 |
| 13 | Try it at | 881 to 936 | 0.93 | 9.7 |
| 14 | example.com | 936 to 1080 | 2.40 | 4.6 |

- Every caption follows the next with no gap: the pauses are shorter than the time a caption needs, so each is held until the next appears.
- "So," and "if" share a caption across the comma (an opening "So," is not a clause break); "talks," ends its caption, and "it should also / read." follow. "Acme Memo" stays on one line.
- Each word pops in on POP from 0.72 of its size, rising 0.1 em, on the frame its start falls in; the current word is sun and 6 % larger (HI), until the next word starts.

## The frame

- Backdrop: a vertical gradient from bg to deep, and two halo circles (r 300 at the top right, r 380 at the bottom left), drawn once.
- Brand: `ACME MEMO`, with `DEMO COPY, FICTIONAL PRODUCT` 48 px under it.
- Speaker: `SYNTHETIC VOICE`. Progress: an 8 px bar, sun on halo, a frame at a time.

## Sound

- Track: the voice, gain 0 dB, normalised to -16 LUFS.
- Cues: three `tap`s at -10 dB, on "off", "read" and "captions".

## Checks

- Stills critique at 9:16: 33 checks, all pass (sync: each word on its frame, at most 16.3 ms after its start; reading speed at most 13.7 characters a second; the shortest caption 0.73 s; alignment +0 ms; composition a lean of 9 % top to bottom). At 1:1: 34 checks, all pass ("Acme Memo turns" set at 98 % to fit 840 px; composition 12 % left to right). At 16:9: 33 checks, all pass (composition 9 % left to right). Palette gate: 15 accent frames, no mixed ink.
- Loopcheck: seek and renderFrame purity, max diff 0.
