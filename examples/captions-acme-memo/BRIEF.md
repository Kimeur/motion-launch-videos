# Brief: Acme Memo captioned clip

The motion-captions skill's own demo, rendered as it ships in `templates/film.html`. Acme Memo is a fictional voice-notes app: there is no live site, so the brief below is the only source, the domain is the reserved `example.com`, and the film says `DEMO COPY, FICTIONAL PRODUCT` on screen. The voice is synthetic, made for this demo, and ours to use.

## Deliverable

| | |
|---|---|
| Product | Acme Memo (fictional, no live site), example.com |
| Style | motion-captions: pop captions |
| Type | Captioned clip (video-types.md) |
| Format | 1080 x 1920 (9:16) master; 1:1 and 16:9 from the same file |
| Duration | 18 s, `loop: 'none'` (1080 frames) |
| Frame rate | 60 fps |
| Sound | the voice-over, normalised to -16 LUFS; a soft tap on each emphasised word |
| Where it plays | this repo's README; built as a Reel, a TikTok or a Short would be |
| Deliverables | `captions-acme-memo.mp4` (with sound), `preview.gif`, `poster.png`, `poster-1x1.png`, `poster-16x9.png`, `captions-acme-memo.html` |

## The voice

| | |
|---|---|
| File | `assets/voice.mp3`: 18.00 s, mono, 48 kHz, MP3 at 64 kb/s |
| Speaker | a synthetic voice: eSpeak NG 1.51, voice `en-us+m3`, 195 words a minute. Not a real person; labelled `SYNTHETIC VOICE` on screen |
| Made | 29 September 2026 by `assets/make-voice.mjs`: each word synthesised on its own, trimmed to its sound (the first and last 5 ms window above 2 % of full scale), and the words laid end to end with known gaps: 0.40 s before the first word, 0.045 s between words, 0.20 s after a comma, 0.42 s after a full stop. So every word's start and end are exact. A gentle compressor (ffmpeg `acompressor`, ratio 6) evens the level; it moves no word |
| Rights | ours: made for this demo with eSpeak NG, open-source software (GPL-3.0), from our own script. It is not a recording of anyone |
| Transcript | `assets/words.json`: 37 words, `[{ word, start, end }]`, the times the synthesis wrote |

## Facts

The transcript is the Facts: every word on screen is one of these, in this order. Times are in seconds of the voice file (and the film: `audio.offset` is 0).

| # | Said | Exact wording in the transcript | From (s) | To (s) |
|---|---|---|---|---|
| F1 | sentence 1 | "Most people scroll with the sound off." | 0.400 | 2.912 |
| F2 | sentence 2 | "So, um, if your video talks, it should also read." | 3.360 | 7.323 |
| F3 | sentence 3 | "Acme Memo turns what you say into captions, word by word, in time with your voice." | 7.763 | 14.224 |
| F4 | sentence 4 | "Try it at example.com." | 14.672 | 16.723 |
| F5 | Name | "ACME MEMO" (the wordmark) | the skill's demo brief, 29 September 2026 | |
| F6 | It is not real | "DEMO COPY, FICTIONAL PRODUCT" | shown on screen | |
| F7 | The voice | "SYNTHETIC VOICE" | shown on screen | |

**Changes to the transcript, and nothing else:**

- **Filler removed:** "um," (3.865 to 4.114 s) is not shown.
- **Punctuation trimmed:** commas and full stops at a word's end are dropped (`punct: 'trim'`), the pop-caption look. `example.com` keeps its inner dot.
- **Case as said:** as the transcript writes it.

## Not on screen

- Any feature, price, rating or number: the brief states none, and the voice says none.
- Any claim about how many people watch muted beyond the speaker's own sentence (F1), which is shown as said.
- Any real app's logo or any platform's trademark: the backdrop is two flat circles, the wordmark is type.

## Message beats

The captions follow the voice; the engine cut them into 15 pop captions of 1 to 3 words (DESIGN.md lists them).

| Beat | Said | Emphasis | Facts |
|---|---|---|---|
| Hook | Most people scroll with the sound off. | off | F1 |
| Problem | So, if your video talks, it should also read. | read | F2 |
| What it does | Acme Memo turns what you say into captions, word by word, in time with your voice. | captions | F3 |
| CTA | Try it at example.com. | | F4 |

## Palette

The template's.

| Role | Hex | Use |
|---|---|---|
| bg | #16122E | the backdrop's top |
| deep | #251C52 | the backdrop's bottom |
| halo | #2E2466 | the two circles, the progress bar's track |
| paper | #FFFFFF | caption fill, the wordmark |
| ink | #0C0A1C | the stroke round every word |
| sun | #FFD23F | the current word, the progress bar |
| pink | #FF6B9A | emphasised words |
| dim | #A9A2D6 | small print, the speaker label |

## Type

| Role | Face | Use |
|---|---|---|
| caption | Montserrat 800 | the captions, the wordmark |
| text | Montserrat 600 | subtitles and the audiogram card (not used by this demo) |
| mono | IBM Plex Mono 500 | small print, the speaker label |

## Open questions

None: a demo, made to show the skill.
