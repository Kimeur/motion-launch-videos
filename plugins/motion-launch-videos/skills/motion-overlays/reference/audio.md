# Audio: sound effects from cues, a music track, loudness

A film is silent unless `FILM.audio` is set. With it, the page synthesises sound effects from **cues** placed on the timeline, `render.mjs` mixes them with an optional **track** (the user's own music or voice-over), normalises the mix to a target loudness and muxes it into the MP4 as AAC. A film without `FILM.audio` renders exactly as before, with no audio stream.

```js
audio: {
  track: 'assets/music.mp3',   // optional: a file in the film folder
  gain: -3,                    // the track's gain in dB
  fadeIn: 0, fadeOut: 0.5,     // the track's fades, in s
  offset: 12.0,                // where in the track the film starts, in s
  sfx: 0,                      // the cue mix's gain in dB, or false for no sound effects
  loudness: -16,               // the target integrated loudness in LUFS
  auto: true,                  // a cue per accent and per cut (below)
  cues: [{ t: beat(4), kind: 'hit' }, { t: bar(3), kind: 'riser', dur: 1.5 }],
},
```

## Music you may use

Only audio the user has the right to put in this video:

- **Their own** music, recordings or voice-over.
- **Licensed** music whose licence covers this use: online video and, for a launch or an ad, commercial use (stock libraries sell exactly this; keep the licence).
- **Public domain** recordings: the composition and the recording must both be free. A new recording of an old piece is usually not.
- **Creative Commons** tracks that allow commercial use and changes (CC0, CC BY, CC BY-SA): trimming, looping and fading are changes. Credit CC BY and CC BY-SA tracks where the video is published. Not NC (non-commercial) or ND (no derivatives) for a launch video.

Never a commercial song, however short the clip. Write where the track came from and its licence in BRIEF.md, next to the fonts. Put the file in `videos/<film>/assets/`; `track` is a path inside the film folder. The track is mixed by ffmpeg at render time and is not embedded in the HTML (the preview plays the cue mix only).

## Cues

A cue is a sound at a time. The engine places cues in `build()` with `cue(t, kind, opts)`, the same way it registers accents and cuts; `FILM.audio.cues` adds cues by hand; `auto` derives them. Every sound is synthesised in the page (oscillators, filters, and noise from a seeded buffer), so the same film always gives the same samples, and nothing is downloaded.

| Kind | Sound | Use it for |
|---|---|---|
| `pop` | a short falling blip | something appearing, a scale-in, a bubble |
| `hit` | a punchy low thump with a crack | a slam, a stamp, a word landing |
| `thud` | a deep soft thump | a heavy landing, a drop onto the floor |
| `whoosh` | filtered noise swelling into t and panning across | a cut, a wipe, a fast move (peaks on t) |
| `swish` | a short high whoosh | a small quick move, a card flick |
| `riser` | rising noise and tone that ends on t | the build before a reveal (`dur`, default 1.2 s) |
| `tick` | a tiny bright tick | a counter, a clock, a checkbox |
| `tap` | a soft wooden tap | a UI tap, a key press |
| `click` | a crisp click | a button, a toggle |
| `snap` | a finger snap | a snap cut, a pose change |
| `blip` | a two-note square blip | pixel art, a game UI |
| `coin` | the two-note pickup | a coin, a point scored |
| `boing` | a sine that wobbles | a squash and stretch, a bounce |
| `drop` | a falling sine | something falling away, an exit |
| `chime` | a bell with a long tail | the lockup, a success |
| `sparkle` | five quick high pings | a shimmer, a sparkle |

Options, all optional: `gain` (dB), `pitch` (a factor: 2 is an octave up), `pan` (-1 left to 1 right), `dur` (whoosh, swish, riser), `seed`, `vary`. Repeats of one kind vary by up to 2 % in pitch and 1 dB in level, seeded by their order, so a row of pops does not sound like a machine; `vary: 0` turns that off. Two cues of one kind within 40 ms sound once.

**`auto`**: `true` adds a `pop` at every accent (`accentAt`) and a `whoosh` at every cut (`cutAt`), so every engine gets sound without a line of code. `auto: { accent: 'tick', cut: 'swish', accentGain: -4, cutGain: -2 }` picks other kinds and levels; a kind of `false` turns that half off. An engine that knows its film better (a cartoon's hops, a UI's taps) places its own cues.

Place cues on the beat grid (`beat(n)`, `bar(n)`) and on the frames things happen: a `hit` on the frame a word lands, not when it starts moving. `critique` reports the cues by kind in its `audio` row.

## Loops: tails wrap round

In a `hold` or `cycle` loop, the cue mix is rendered from before 0 to after DUR and folded: a whoosh that swells into a cut at 0.1 s starts at the end of the file, and a chime at 9.5 s in a 10 s loop rings on into the first second. Played on repeat, the audio loops with the picture and never clicks at the seam. A `loop: 'none'` film drops whatever falls outside 0 to DUR.

A music track does not wrap: it is trimmed to the film (or looped when it is shorter), from `offset`. In a loop, choose a section that loops musically (whole bars at the film's BPM, cut on the downbeat) or fade it in and out briefly; a long `fadeOut` in a loop makes a dip every pass.

## Loudness

`render` normalises the finished mix (cues plus track) to `loudness` in LUFS, integrated over the film (EBU R128, measured with ffmpeg's `ebur128`): one gain that brings it to the target, re-measured and corrected until it is within 0.2 LU. When that gain would push the peaks past -1.5 dBTP, a limiter at -2.5 dBFS holds them. It then encodes AAC at 48 kHz, 192 kb/s, stereo. `verify` measures the MP4 again and passes within 1.5 LU of the target.

| Where it plays | Target |
|---|---|
| web and social video (the default) | -16 LUFS |
| YouTube, Spotify, most streaming (they turn louder files down) | -14 LUFS |
| Apple podcasts and Apple Music | -16 LUFS |
| broadcast (EBU R128; ATSC A/85 is -24) | -23 LUFS |

A film of a few sparse cues and no track has little sound for the loudness to be measured over: normalising it to -16 turns every cue up by 15 dB or more and the limiter flattens their attacks (`render` prints the gain and whether it limited). Give such a film a quieter target (-20 or -23) or a bed under the cues.

## Preview

Open the built file and press **M** (or click the canvas) to hear the cue mix; while it plays, the audio clock drives the picture, so they stay in sync. Space pauses both. The track is not in the page.
