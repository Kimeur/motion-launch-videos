# Core: the runtime every engine shares

Every template in this skill is one HTML file in three parts: the `FILM` block you edit, the **core** (between `CORE BEGIN` and `CORE END`, the same in every motion-* skill), and the **engine** for this vertical. You never edit the core inside a film; this file says what it guarantees and what it gives an engine or a custom drawing hook.

## The contract

- **`seek(t)` is a pure function of `t mod DUR`.** Same t, same pixels, whatever was drawn before. No timers, no `Date`, no `Math.random`, no `requestAnimationFrame` inside it, no state carried between calls. The page's CSS switches transitions and animations off.
- **Everything that measures happens once**, in the engine's `build()`, after the fonts load: text layout, geometry, spring events, decks of random numbers. Never measure inside `draw`.
- **Continuous motion reads the exact `t`; discrete state reads the quantised `q`.** `q` is the output frame's own time (`ceil(t x FPS) / FPS`, wrapped so the last subframes of the loop belong to frame 0). Typing, drawings held on twos, sprite frames, line boil, scramble glyphs and blinking cursors read `q`, so motion blur never averages two different drawings.
- **Randomness is seeded**: `hash(a, b, c)` (three integers to a number in [0, 1)) and `mulberry32(seed)`. Key the hash by what it decides (particle index, frame, axis), never by call order.
- **The canvas is pinned to the CPU** (`willReadFrequently: true` from the first call). Chrome otherwise moves a canvas to the GPU and back after repeated reads, and its antialiasing changes mid-render.
- **The canvas has an alpha channel**, though every frame is filled opaque (unless the film is transparent, below). On an opaque canvas Chromium draws text with LCD subpixel antialiasing, red and blue fringes on every glyph, whatever the command line says; with an alpha channel text is antialiased in grey, the same on every machine. An engine that draws into canvases of its own gives them an alpha channel too (the default).
- **A cache is allowed only when it is a pure function of its key** (the blurred-glyph sprite cache is keyed by font, glyph, colour and quantised blur, so a hit and a miss give the same pixels).

## What the page exposes

| Name | What it is |
|---|---|
| `window.ready` | a promise; resolves once fonts, layout and timeline are built |
| `seek(t)` | draws the sharp frame at t |
| `renderFrame(n)` | draws output frame n with motion blur; returns the number of subframes used |
| `motionAt(n)` | `{ samples, disp }`: how far things move across frame n's shutter |
| `critique()` | the automated pre-pass checks (see review.md) |
| `stillsPlan()` | the frames worth looking at: each scene in and at rest, each accent |
| `layoutTable()` | measured sizes, boxes, cuts, accents, warnings (`render.mjs layout` prints it) |
| `accentFrames()`, `offPalette(frames, mode, strict)`, `textByFace()` | the analysis behind the gates |
| `renderAudio()`, `audioCues()` | with `FILM.audio`: the cue mix (a promise of Float32 stereo PCM at 48 kHz, base64, or null) and the cues it sounds (audio.md) |
| `DURATION`, `FPS`, `WIDTH`, `HEIGHT`, `FILM_META` | film facts for the scripts, including `loop`, `blur` and the engine's name |

Open the built file in Chrome to preview it: it plays in real time, Space pauses, the arrow keys step one frame, `?t=3.5` opens paused at 3.5 s. With `FILM.audio`, M (or a click on the film) plays the cue mix in sync. `?capture=1` turns the preview off (the scripts use it).

## FILM fields every engine reads

| Field | Meaning |
|---|---|
| `title`, `alt` | page title; the canvas's accessible label (write the whole script in `alt`) |
| `W`, `H`, `FPS`, `DUR`, `BPM` | size in px, frame rate, duration in s, tempo. `beat(n)` and `bar(n)` convert to seconds |
| `loop` | `'hold'` (default): the film ends on a still copy of frame 0. `'cycle'`: it keeps moving through the seam and must be continuous there. `'none'`: not a loop. See loops.md |
| `blur` | `false` turns motion blur off (one sample per frame): cartoon and pixel-art looks |
| `palette` | `{ role: '#RRGGBB' }`; every colour the film draws is a role. `bg` fills every frame (in a transparent film, the backdrop it is judged against) |
| `transparent` | `true`: every frame starts transparent instead of filled with `bg`, for an overlay an editor lays over footage (below) |
| `audio` | sound: a music track and sound-effect cues, mixed and normalised to a loudness (audio.md). Without it the film is silent |
| `fonts` | `{ role: { family, weight } }`; each must match an `@font-face` rule in the page head |
| `grid` | `{ margin, unit }`: live-area inset (104 px at 1080 by default) and baseline unit (8) |
| `springs` | optional extra springs, `{ NAME: [zeta, omega] }` |
| `poster` | time of the poster frame |

## Formats: one film, several aspect ratios

A film is authored in its base format (`W`, `H`, usually 1080 x 1080) and renders at any other ratio with `--format`:

```bash
node <skill>/scripts/render.mjs stills videos/<film> --format 9:16     # stills/9x16/
node <skill>/scripts/render.mjs render videos/<film> --format 16:9     # renders/<film>-16x9.mp4, preview-16x9.gif, poster-16x9.png
```

- The page reads `?format=9x16` before anything else and re-sizes the film, keeping the short side: 1:1, 4:5 (1080 x 1350), 9:16 (1080 x 1920), 16:9 (1920 x 1080).
- `FILM.formats` patches any field for one format: `formats: { '9:16': { titles: [{ id: 'HOOK', y: 420 }] } }`. Objects merge; an array whose items all carry an `id` merges item by item (so a patch moves one title without repeating the others); anything else is replaced. A patch may set `W` and `H` itself.
- Positions stay authored in the base format. The engine maps them with the helpers below and a **pin**: with no pin an element keeps its offset from the centre (content stays centred in any frame); `t` or `b` keeps its distance from the top or bottom edge, `l` or `r` from the left or right. `'tl'`, `'b'`, `'r'` combine as expected. Sizes scale with the short side (`fmtSz`), which is 1 between the standard formats of a 1080 film.
- Backgrounds and stages fill the whole canvas (`W` x `H`), whatever the format.
- The critique runs at the format being checked, including the composition row (below), so check every format you deliver.

| Helper | Maps |
|---|---|
| `FMT` | `{ key, W, H, BW, BH, s, aspect }`: the format in use, the base size, the scale, and `'square'`, `'vertical'` or `'horizontal'` |
| `fmtX(x, pin)`, `fmtY(y, pin)`, `fmtPos(x, y, pin)` | an authored position to this format's canvas |
| `fmtSz(v)` | an authored size |

**Composition** (a core check): the critique draws every review still and measures where the ink sits, against the background and the roles an engine lists as `backdrop` (a stage or a sky that fills the frame). The lean on an axis is the difference between the empty margins on its two sides, or twice the ink's centre of mass off the middle (a small footer stretches the box but barely moves the mass), whichever is larger. When the average lean over the stills passes a fifth of the canvas, it warns; past 30 %, it fails. A lean the design means (a title screen whose title rides high over its world) is declared with `FILM.composition = { lean: 'top', why: 'the title rides over the world' }`, per format through `FILM.formats` if need be: a warning in that direction then passes and prints the reason. A lean past 30 % still fails. It catches content authored for a square left in the top of a 9:16 frame or the left of a 16:9 one.

## Assets: the user's own images and audio

`build.mjs` replaces every `__ASSET:<path>__` token with a data URL of `videos/<film>/<path>`: PNG, JPEG, WebP, GIF and SVG images, MP3, M4A, AAC, WAV and OGG audio, SRT, VTT, JSON and text. Keep them under `videos/<film>/assets/`. The path must stay inside the film folder. An engine loads an image in `build()` (after `await img.decode()`), never while drawing. Only embed what the user owns or may use, and say where each asset came from in BRIEF.md.

## Transparent films: overlays for editors

`transparent: true` makes a film an overlay: a lower third, a caption, a corner bug, a logo sting laid over footage in an editor.

- Every frame starts cleared to transparent; the engine draws only what belongs to the overlay. A scene or stage that fills the frame (a `bg` on a scene, a full-bleed shape) fills it opaque, so leave those out.
- `bg` stays in the palette as the **assumed backdrop**: contrast rows measure text against it, the composition and palette checks read each frame composited over it, and the MP4, GIF and contact sheets show the film over it. Set it to the kind of footage the overlay will sit on (a dark or a mid grey).
- Motion blur averages premultiplied colour: each subframe's colour weighted by its alpha, divided by the summed alpha. A streak fades out in its own colour, not towards black. An engine with its own `accumulate` must do the same.
- `render` writes `renders/<film>.mov` (ProRes 4444 with alpha) and `renders/<film>.webm` (VP9 with alpha) next to the usual MP4 and GIF, which are composited over `bg`; `poster.png` keeps its alpha (render.md).
- An overlay sits where the edit needs it, off centre, so the composition row warns at most.

## Sound

`FILM.audio` gives a film sound (audio.md): the user's own or licensed track, plus sound effects synthesised in the page from cues. An engine places cues in `build()` with `cue(t, kind, opts)` (`pop`, `hit`, `whoosh`, `swish`, `tick`, `tap`, `click`, `riser`, `boing`, `coin`, `chime`, `thud`, `snap`, `blip`, `drop`, `sparkle`); `audio: { auto: true }` adds a pop at every accent and a whoosh at every cut, so every engine has sound without code. Synthesis runs in `renderAudio()`, never in `seek`, and is deterministic. `render` mixes, normalises to `audio.loudness` (-16 LUFS by default) and muxes AAC; a film without `FILM.audio` renders exactly as before.

## Helpers an engine (or a custom `draw` hook) may use

| Helper | What it does |
|---|---|
| `new Prop(v0, name)` | a value made of springs: `.to(t, v, 'LAND')` adds a spring to a new target, `.set(t, v)` jumps, `.at(t)` reads it, `.vel(t)` its speed per second |
| `S(tau, sp)`, `dS(tau, sp)`, `settle(sp)`, `landT(sp)`, `spring(name)` | the closed-form step response, its derivative, when it snaps to 1, when it visibly lands |
| `cyc(t, n, phase)`, `wave(t, n, phase)` | the phase and sine of n whole cycles per loop: exact at the seam |
| `loopNoise(t, n, seed)` | smooth noise in [-1, 1] that loops exactly (three whole harmonics, seeded phases) |
| `hash(a, b, c)`, `mulberry32(seed)`, `shuffled(arr, seed)` | seeded randomness |
| `frameOf(t)`, `wrapT(t)`, `typed(q, ts, n)`, `drawing(q, fps)`, `noteSec(16)` | time: the frame a time belongs to, wrap into the loop, characters typed by q, the held drawing's index, a note value in seconds |
| `layoutText(o)`, `drawText(c, line, color, fx)`, `fillGlyph(...)` | one line of type glyph by glyph (kerning recovered from pair widths, optical pairs, tracking, `fit` to a width, `cap` height), drawn with per-glyph offsets, scale, rotation, opacity and cached blur |
| `svgPath(d)` | SVG path data to a `Path2D`, its length, its bounding box and evenly spaced points (for trims and morphs) |
| `role(name)`, `col(name)` | resolve a palette role (register it for the palette check at build time; look it up while drawing) |
| `rgbOf`, `hexOf`, `mix`, `contrast`, `hueChroma`, `inksClash` | colour maths |
| `cutAt(t)`, `activeIn(a, b)`, `accentAt(t, what)`, `needContrast(id, fg, bg, min)` | tell the core about a hard cut (motion blur stops at it), a window where something moves outside the Props, an accent frame (stills and palette gate), text that must read |
| `cue(t, kind, opts)` | a sound effect at t, in `build()`: heard only when `FILM.audio` is set. `opts`: `gain` (dB), `pitch`, `pan`, `dur`, `seed`, `vary` (audio.md) |
| `checkLiveArea(add, id, box)`, `checkSpacing(add, items)` | box checks for an engine's critique |

`W H FPS DUR NFR CX CY U MARGIN UNIT MEASURE LOOP BLUR TRANSPARENT TAU PAL SP` are constants (for the format being rendered). `U` is `min(W, H) / 1080`, the scale for built-in pixel constants.

## Engine hooks

An engine ends with `boot({ name, springs, build, draw, disp, checks, cycles, lastChange, stills, layout, visible, always, backdrop, minSamples, seamCut, strictPalette, gif, accumulate })`:

| Hook | Called | Must |
|---|---|---|
| `build()` | once, after the fonts load | create every Prop and event, measure everything |
| `draw(c, t, q, nq)` | by `seek` and every subframe | draw from its arguments alone; the core has already filled `bg` |
| `disp(ta, tb)` | by `motionAt` | return how many screen px anything moves between two times (it sets the subframe count) |
| `checks(add)` | by `critique` | add `(name, 'PASS' / 'WARN' / 'FAIL', detail)` rows |
| `cycles()` | in a cycle loop | list `{ what, period }` for everything periodic; each must fit a whole number of times into DUR |
| `lastChange(see)` | in a hold loop | report discrete changes the Props do not know about (typing, blinking) |
| `stills(push)`, `layout()`, `visible(t)` | stills plan, layout table, blank-frame check | |
| `always` | | `true` when something moves on every frame (a cycle loop's drift); otherwise the core decides from the Props and `activeIn` windows |
| `backdrop` | | palette roles that fill the frame behind the content (a stage, a sky): the composition check treats them as background |
| `minSamples` | | the fewest subframes a moving frame gets (4 by default). An engine whose every subframe is costly (WebGL) may allow 2; the rule of one subframe per 5 px of movement still holds |
| `seamCut`, `strictPalette`, `gif` | | a film that deliberately cuts at the loop point; a pixel-art gate that every pixel is exactly a palette colour; GIF settings (`fps`, `width`, `colors`, `scale: 'neighbor'`, `dither: 'none'`) |
| `accumulate(ctx, times)` | by `renderFrame` | optional: render and average the subframes itself (for an engine that can do it faster than the core). In a transparent film, average premultiplied colour |

The core draws the background (or clears to transparent), runs motion blur (`renderFrame`), and adds its own checks: contrast rows, palette roles, the loop (hold: everything settles before the last frame's shutter; cycle: every Prop ends where it starts and every period is whole), blank frames, timeline warnings, composition and, with `FILM.audio`, the cues by kind.
