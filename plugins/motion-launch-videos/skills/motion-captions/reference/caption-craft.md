# Caption craft: words that read at the speed they are said

Step 3. What makes captions easy to read on a phone with the sound off, and honest to the speaker. The engine can set any transcript; this file says which style to pick, how to cut and colour the words, and what never to change.

## The transcript is the Facts

A captioned clip claims that the speaker said these words. So the words on screen are the transcript's, in its order.

- **Never paraphrase.** No shortening a long sentence, no tidying grammar, no swapping a word for a clearer one, no dropping a clause that reads badly. If a sentence is too long to read, cut the clip, not the sentence.
- **Allowed changes, recorded in BRIEF.md.** Punctuation (`punct: 'trim'` drops trailing commas and full stops, the pop-caption look; `'keep'` for subtitles), letter case (`case: 'upper'`), and fillers (`fillers: ['um', 'uh']`). A filler list is a choice the brief states; "like" and "you know" are words, not fillers, unless the user says otherwise.
- **A machine transcript is a draft.** Speech recognisers mishear names, numbers and jargon. Have the user read the transcript against the audio and correct what was misheard: that is fixing the record, not the speaker. Names and product names spelled as their owners spell them.
- **Numbers as said.** "twenty twenty-six" may be written `2026`; "about thirty percent" stays "about 30%", never "30%".
- **Speaker permission.** A voice that is not the user's needs its owner's permission, recorded in BRIEF.md with the date. No clips of other people's podcasts, interviews or videos.

## Choosing a style

| Style | Use it for | Avoid it for |
|---|---|---|
| Pop captions | a talking head or voice-over in a vertical feed (Reels, TikTok, Shorts): the captions are the picture | a long clip with dense speech (it tires); a calm, formal piece |
| Karaoke line | a podcast cut, a narrated explainer, a quote read aloud: the viewer reads ahead and the highlight keeps the place | fast speech (a line flips before it is read) |
| Classic subtitles | a video with its own picture (a still, a screen, a scene), a 16:9 film, a longer clip, accessibility-first delivery | a clip where the words are the only thing to look at |
| Audiogram | a podcast with no video: the show's cover, bars that move with the voice, and a karaoke line or pop captions | a clip with a picture of its own |

One style per film. A series keeps one style across episodes.

## Cutting the words

- **Pop captions: 1 to 3 words.** Cut at phrase boundaries: after a comma, before "what", "because", "and"; never after "the", "a", "your" or a preposition, and never inside a name. The engine's costs do this (engine.md, How captions are cut); read the layout table and move a break with a comma in the transcript only if the speaker paused there.
- **Karaoke: 3 to 7 words a line.** A line is a phrase; the highlight moves through it as it is said.
- **Subtitles: at most 42 characters a line, 2 lines.** At 9:16 the line is narrower: about 32 characters at 44 px. Break a two-line subtitle where a reader would breathe, a little bottom-heavy when unequal ("Acme Memo turns / what you say into captions,").
- **At least 0.7 s on screen.** Anything shorter flashes. Pop captions follow the voice, so a caption is as long as its words take to say; a lone short word before a pause lingers (`linger`) to reach it.
- **At most about 17 characters a second.** That is the pace adults read captions at comfortably (20 is the usual ceiling for subtitles, and a fast talker reaches 20 in pop captions). Above 17 the critique warns, above 25 it fails: fewer words a caption, or a cut of the clip where the speaker is slower.
- **No flicker.** Captions either follow each other with no gap, or leave a pause of at least 4 frames; a gap of 1 to 3 frames reads as a blink.

## Sync

- **A word lights on the frame its start time falls in.** Frame n shows the film from `(n - 1) / FPS` to `n / FPS`; a word starting at 2.738 s lights on frame 165 (2.750 s), 12 ms after it is said. Early is worse than late: a word lit before it is heard reads as a spoiler.
- **Word-level timings are exact; SRT and VTT are per cue.** Estimated word times can be off by a syllable. For per-word styles, get word-level JSON from the transcription tool (Whisper with word timestamps, or the editor's word-level export).
- **Check the offset.** A transcript of the whole episode against a trimmed clip is late by the trim. The `alignment` row finds the lag at which the transcript's words line up with the voice's loud frames, within half a second either way.

## Type and colour

- **Big and heavy.** Pop captions at 84 to 104 px at 1080 wide in an 800-weight sans (the template's Montserrat 800); karaoke at 56 to 72 px; subtitles at 40 to 48 px in a 500 to 600 weight. Nothing under 40 px at 1080: it cannot be read on a phone.
- **Contrast first.** Captions sit on anything, so give them their own backdrop: a dark stroke round light letters (0.08 to 0.12 em), a box, or a karaoke pill. At least 4.5:1 against it. Words to come (karaoke) at least 3:1.
- **Three colours for the words.** The fill (white), the current word (one accent), emphasis (a second accent). More reads as noise.
- **Emphasis, sparingly.** A few words a clip, each the one word the sentence turns on ("off", "read", "captions"). Emphasis on every other word is no emphasis.
- **Emoji off by default.** When on, one icon per caption at most, from the engine's whitelist, only where it says what the word says (a microphone on "voice").

## Where the words sit

| Format | Where | Why |
|---|---|---|
| 9:16 (Reels, TikTok, Shorts) | the middle of the frame, a little below centre; inside `[104, 230, 907, 1536]` | the platform's header covers the top, its buttons the right edge, its caption and progress the bottom fifth |
| 1:1 (feeds) | centred; the live area | nothing covers a feed post, but it is seen small |
| 16:9 (YouTube, the web) | pop and karaoke centred; subtitles at the bottom, inside the live area | the player's controls cover the bottom while paused |

Keep the brand, the speaker's name and the progress bar inside the same zones: a name under the platform's buttons is a name nobody reads.

## Sound

The voice is the film's sound; normalise it to -16 LUFS for social video (audio.md). Most viewers watch muted, so the captions must carry every word; the sound is for those who turn it on. A cue on each emphasised word (`emphasisCue`, a soft `tap` at -10 dB) is plenty; no music bed under a voice unless the user supplies a licensed one and it sits at least 18 dB under the speech.

## The loop

A captioned clip is `loop: 'none'`: it starts on the first word and ends when the speaker does, with the last caption held to the end. `DUR` is the clip's length: the last word's end plus 0.5 to 1.5 s.
