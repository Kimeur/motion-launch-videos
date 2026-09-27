# Core: the runtime every engine shares

Every template in this skill is one HTML file in three parts: the `FILM` block you edit, the **core** (between `CORE BEGIN` and `CORE END`, the same in every motion-* skill), and the **engine** for this vertical. You never edit the core inside a film; this file says what it guarantees and what it gives an engine or a custom drawing hook.

## The contract

- **`seek(t)` is a pure function of `t mod DUR`.** Same t, same pixels, whatever was drawn before. No timers, no `Date`, no `Math.random`, no `requestAnimationFrame` inside it, no state carried between calls. The page's CSS switches transitions and animations off.
- **Everything that measures happens once**, in the engine's `build()`, after the fonts load: text layout, geometry, spring events, decks of random numbers. Never measure inside `draw`.
- **Continuous motion reads the exact `t`; discrete state reads the quantised `q`.** `q` is the output frame's own time (`ceil(t x FPS) / FPS`, wrapped so the last subframes of the loop belong to frame 0). Typing, drawings held on twos, sprite frames, line boil, scramble glyphs and blinking cursors read `q`, so motion blur never averages two different drawings.
- **Randomness is seeded**: `hash(a, b, c)` (three integers to a number in [0, 1)) and `mulberry32(seed)`. Key the hash by what it decides (particle index, frame, axis), never by call order.
- **The canvas is pinned to the CPU** (`willReadFrequently: true` from the first call). Chrome otherwise moves a canvas to the GPU and back after repeated reads, and its antialiasing changes mid-render.
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
| `DURATION`, `FPS`, `WIDTH`, `HEIGHT`, `FILM_META` | film facts for the scripts, including `loop`, `blur` and the engine's name |

Open the built file in Chrome to preview it: it plays in real time, Space pauses, the arrow keys step one frame, `?t=3.5` opens paused at 3.5 s. `?capture=1` turns the preview off (the scripts use it).

## FILM fields every engine reads

| Field | Meaning |
|---|---|
| `title`, `alt` | page title; the canvas's accessible label (write the whole script in `alt`) |
| `W`, `H`, `FPS`, `DUR`, `BPM` | size in px, frame rate, duration in s, tempo. `beat(n)` and `bar(n)` convert to seconds |
| `loop` | `'hold'` (default): the film ends on a still copy of frame 0. `'cycle'`: it keeps moving through the seam and must be continuous there. `'none'`: not a loop. See loops.md |
| `blur` | `false` turns motion blur off (one sample per frame): cartoon and pixel-art looks |
| `palette` | `{ role: '#RRGGBB' }`; every colour the film draws is a role. `bg` fills every frame |
| `fonts` | `{ role: { family, weight } }`; each must match an `@font-face` rule in the page head |
| `grid` | `{ margin, unit }`: live-area inset (104 px at 1080 by default) and baseline unit (8) |
| `springs` | optional extra springs, `{ NAME: [zeta, omega] }` |
| `poster` | time of the poster frame |

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
| `checkLiveArea(add, id, box)`, `checkSpacing(add, items)` | box checks for an engine's critique |

`W H FPS DUR NFR CX CY U MARGIN UNIT MEASURE LOOP BLUR TAU PAL SP` are constants. `U` is `min(W, H) / 1080`, the scale for built-in pixel constants.

## Engine hooks

An engine ends with `boot({ name, springs, build, draw, disp, checks, cycles, lastChange, stills, layout, visible, always, minSamples, seamCut, strictPalette, gif, accumulate })`:

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
| `minSamples` | | the fewest subframes a moving frame gets (4 by default). An engine whose every subframe is costly (WebGL) may allow 2; the rule of one subframe per 5 px of movement still holds |
| `seamCut`, `strictPalette`, `gif` | | a film that deliberately cuts at the loop point; a pixel-art gate that every pixel is exactly a palette colour; GIF settings (`fps`, `width`, `colors`, `scale: 'neighbor'`, `dither: 'none'`) |
| `accumulate(ctx, times)` | by `renderFrame` | optional: render and average the subframes itself (for an engine that can do it faster than the core) |

The core draws the background, runs motion blur (`renderFrame`), and adds its own checks: contrast rows, palette roles, the loop (hold: everything settles before the last frame's shutter; cycle: every Prop ends where it starts and every period is whole), blank frames and timeline warnings.
