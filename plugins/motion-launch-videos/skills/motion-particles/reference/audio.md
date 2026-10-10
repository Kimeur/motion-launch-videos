# Audio: sound effects from cues, a music track, loudness

A film is silent unless `FILM.audio` is set. With it, the page synthesises sound effects from **cues** placed on the timeline, and, with `bed`, a score of its own under them; `render.mjs` mixes them with an optional **track** (the user's own music or voice-over), normalises the mix to a target loudness and muxes it into the MP4 as AAC. A film without `FILM.audio` renders exactly as before, with no audio stream.

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
  bed: { key: 'D minor' },     // music without a track: a pad, drone, bass, air and glints (below)
  space: { rt60: 2.6 },        // the reverb the bed and the tonal cues send to; false for none
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
| `boom` | a sub hit gliding down onto its note, with a long tail; the bed ducks under it | the film's structural beats: the world forming, the drop, the pull back, the lockup (3 or 4 a film) |
| `swell` | reversed noise and the chord's tones swelling into t and cut hard on it, the low end dropping out before it | the tension before a boom (`dur`, default 1 s; 0.5 for a short lift, 2 for an intro) |
| `arc` | a noise swell peaking on t with a sine rising a perfect fifth, panned along the move | a flight, a long camera move, an arc across the screen (`dur`, default 1.4 s; `from`, `to` pans) |
| `ping` | three partials chirping down 20 % with a wet tail | a pin, a reticle locking, a card arriving |
| `data` | a seeded burst of tiny blips in the key | typing (`regular: true`, `rate` = characters a second), a counter rolling, a data stream (`dur`, default 0.6 s) |
| `lock` | a quiet two-tone confirmation | a status turning complete, a region locking |
| `pad` | one chord of the bed's pad | a chord placed by hand (`chord: 'VI maj7'`, `dur`) |
| `drone` | a sustained low note with slow beating | a drone placed by hand (`note: 'D2'`, `dur`) |

Options, all optional: `gain` (dB), `pitch` (a factor: 2 is an octave up), `pan` (-1 left to 1 right), `dur` (whoosh, swish, riser, boom, swell, arc, data, pad, drone), `seed`, `vary`. Repeats of one kind vary by up to 2 % in pitch and 1 dB in level, seeded by their order, so a row of pops does not sound like a machine; `vary: 0` turns that off. Two cues of one kind within 40 ms sound once.

The last eight kinds are **tonal**: their pitch is a note, and `vary` changes only their level, so a chord never goes out of tune. `note` sets it (`'A5'`, `'F#4'`, or a frequency in Hz); without one, and with a bed, a tonal cue takes the tone of the chord sounding at t nearest its default (a ping near 2.2 kHz, an arc near 2.1 kHz, a lock near 1.76 kHz, a boom on the key's tonic in octave 1), and a `chime` moves into the key too. Without a bed they sit on their defaults. More options: `crack: true` (boom, a short bright crack on top), `gap: false` (swell, keep the low end under it), `rate`, `regular`, `lo`, `hi` (data, the blips' range in Hz), `chord`, `key` (pad without a bed). `riser` takes `shape: 'exp'`: the reverse-exponential swell of `swell`, cut hard on t (`'lin'`, the default, is the riser as it always was).

**`auto`**: `true` adds a `pop` at every accent (`accentAt`) and a `whoosh` at every cut (`cutAt`), so every engine gets sound without a line of code. `auto: { accent: 'tick', cut: 'swish', accentGain: -4, cutGain: -2 }` picks other kinds and levels; a kind of `false` turns that half off. An engine that knows its film better (a cartoon's hops, a UI's taps) places its own cues.

Place cues on the beat grid (`beat(n)`, `bar(n)`) and on the frames things happen: a `hit` on the frame a word lands, not when it starts moving. `critique` reports the cues by kind in its `audio` row.

## A bed: music without a track

`bed` turns the cue mix into a small score: a pad, a drone, a bass, air and glints in one key, changing chord on the film's sections, with the cues on top in the same key. It is music the film owns (nothing is sampled or downloaded), so it needs no licence, and it gives the loudness something to stand on: a film of sparse cues alone is hard to normalise (below).

```js
bed: {
  key: 'D minor',             // a tonic and a mode: major, minor, dorian, lydian, mixolydian, sus
  chords: [[0, 'i add9'], [7.86, 'VI maj7'], [24.66, 'VI maj9'], [27.66, 'I']],   // optional: [time, chord]
  end: 'calm',                // without chords: the last section resolves 'lift' (to major), 'calm' (sus2) or 'dark'
  gain: 0,                    // dB, the bed against its calibrated level
  brightness: 0.5,            // 0 dark .. 1 bright: the pad's low-pass
  movement: 0.5,              // 0 still .. 1 lively: filter drift, breathing, pan drift
  layers: { pad: 1, drone: 1, bass: 1, air: 0.2, glints: 0.3 },   // 0 removes a layer, other values scale it
  pulse: false,               // or { from, to, bpm, kick: 0, hats: 0 }: a kick on the beat, hats on 16ths (dB)
  fadeIn: 2.3, fadeOut: 0.9,  // s, loop: 'none' only: a dB-linear fade in, a linear fade out ending 0.05 s before DUR
  seed: 1,
},
```

- **Chords** are roman numerals in the key with a quality: `''` (the numeral's case decides major or minor), `m`, `add9`, `maj7`, `7`, `maj9`, `9`, `11`, `6`, `sus2`, `sus4`, `5`, `dim`; a `b` or `#` before the numeral moves its root (`bVII`), a slash sets the bass (`IV maj7/V`). Or the notes themselves: `['D3', 'A3', 'E4', 'F4']`. The first chord starts at 0.
- **Without `chords`**, the bed changes chord on every section the engine registers with `sectionAt(t, what)` (or on `bed.at: [times]`, or on the film's cuts): a minor key cycles i add9, VI maj7, III maj7, VII add9, iv9, VI maj9 and resolves on the last section (the lockup) as `end` says; a major key cycles I add9, vi7, IV maj7, V sus4, ii9, IV maj9 and ends on I add9.
- **The layers.** The pad: three sawtooths a chord tone, detuned -18, 0 and +18 cents and panned wide, low-passed at `brightness`, with a glass octave of the root and fifth on top; chords crossfade over 0.8 s, or 0.25 s when a `boom` lands on the change. The drone: the chord's bass note in octave 2 with two slowly beating triangles, gliding 0.3 s to each new bass note, and a sub in octave 1 that arrives with the first boom. The bass: the bass note, articulated on each chord (and on each beat of a pulse). Air: filtered noise high up. Glints: sparse high blips of the key's pentatonic scale, 20 a second before the first boom and 6 after. Below 120 Hz everything is mono and dry.
- **The cues duck it.** A `boom` dips the pad and the low end by 5 dB and the air and glints by 14 dB, recovering over 0.6 s; a `swell` takes the low end down 12 dB over its last 0.6 s (a gap before the hit); a pulse's kick pumps the bed by 3 dB. The ducking is arithmetic on the summed buses, so it costs nothing and stays bit-exact.
- **Space.** Voices that send to it (the pad, glass, air, glints, `ping`, `arc`, `data`, `lock`) ring in one reverb: a feedback delay network computed in plain JS over the summed sends, deterministic like everything else. `space: { rt60: 2.6, damp: 5500, level: -6 }` sets its decay (s), its damping (Hz) and its level (dB); `space: false` keeps every sound dry. The reverb tail wraps round in a loop like any other tail.
- **Loops.** In a `hold` or `cycle` loop the bed has no fades: its first chord crossfades in across the seam from the last, every slow modulation runs whole cycles per loop and a pulse's tempo is snapped to whole beats per loop. End the progression on the chord it starts with, or the critique warns that it wraps through a crossfade.
- **The critique** adds an `audio bed` row: the key, the chords with their times, the layers, pulse and space; it warns when a loop's last chord is not its first and when a boom lands within 2 s of the end of a `loop: 'none'` film (the fade would cut its tail).

A bed's film is mastered like music: normalise it to -14 LUFS for YouTube and social, -16 on a page next to other sound. Booms are the loudest moments: at `gain: -2` to `-4` they stay clear of the limiter after normalising. Place the structural hits where the picture changes for good (the world appearing, a region locking, the pull back, the lockup), a `swell` into each, an `arc` on each flight, a `ping` per pin, `data` under typing and counting, a `lock` on each confirmation.

## Loops: tails wrap round

In a `hold` or `cycle` loop, the cue mix is rendered from before 0 to after DUR and folded: a whoosh that swells into a cut at 0.1 s starts at the end of the file, and a chime at 9.5 s in a 10 s loop rings on into the first second. Played on repeat, the audio loops with the picture and never clicks at the seam. A `loop: 'none'` film drops whatever falls outside 0 to DUR.

A music track does not wrap: it is trimmed to the film (or looped when it is shorter), from `offset`. In a loop, choose a section that loops musically (whole bars at the film's BPM, cut on the downbeat) or fade it in and out briefly; a long `fadeOut` in a loop makes a dip every pass.

## Loudness

`render` normalises the finished mix (cues plus track) to `loudness` in LUFS, integrated over the film (EBU R128, measured with ffmpeg's `ebur128`): one gain that brings it to the target, re-measured and corrected until it is within 0.2 LU. When that gain would push the peaks past -1.5 dBTP, a limiter at -2.5 dBFS holds them. It then encodes AAC at 48 kHz, 192 kb/s, stereo. `verify` measures the MP4 again and passes within 1.5 LU of the target.

| Where it plays | Target |
|---|---|
| web and social video (the default) | -16 LUFS |
| a film with a bed (web and social, YouTube) | -14 LUFS (-16 on a page next to other sound) |
| YouTube, Spotify, most streaming (they turn louder files down) | -14 LUFS |
| Apple podcasts and Apple Music | -16 LUFS |
| broadcast (EBU R128; ATSC A/85 is -24) | -23 LUFS |

A film of a few sparse cues and no track has little sound for the loudness to be measured over: normalising it to -16 turns every cue up by 15 dB or more and the limiter flattens their attacks (`render` prints the gain and whether it limited). Give such a film a quieter target (-20 or -23), or turn on `bed`.

## Preview

Open the built file and press **M** (or click the canvas) to hear the cue mix; while it plays, the audio clock drives the picture, so they stay in sync. Space pauses both. The track is not in the page.
