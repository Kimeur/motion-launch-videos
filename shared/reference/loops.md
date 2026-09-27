# Motion blur and the seamless loop

Real motion blur comes from rendering several subframes per output frame and averaging them. A seamless loop means the last frame flows into frame 0 with nothing to see at the seam. Both are exact in the core; this file says how, and what breaks them.

## Subframes are sampled behind the frame

Output frame n shows time `tn = n / FPS`. Its subframes sit on a trailing 270-degree shutter: `k` samples evenly spaced from `tn - 0.75 / FPS` to `tn`, averaged with equal weight and rounded. The frame shows where things are at tn, with a streak behind them, the way a film camera does.

| Motion across the shutter (the engine's `disp`) | Subframes |
|---|---|
| nothing changes at all | 1 (exact: the mean of identical samples is the sample) |
| up to 20 px | 4 |
| more | `ceil(px / 5)`, up to 64 |

At 10 px apart, copies still show as faint steps on hard edges; at 5 px they read as one streak. "Nothing changes" is decided from the Props' spring events and the declared `activeIn` windows, not from pixels: a custom drawing that moves outside its declared windows is rendered with one sample there and loses its blur.

`FILM.blur: false` renders one sample per frame everywhere. That is right for cartoons (smears and speed lines instead of blur) and pixel art (every pixel exact).

## Never blur across a hard cut

A subframe that falls before a cut while its frame is after it is clamped to the cut time; otherwise the first frame after a cut is a double exposure of both scenes. Engines register their cuts with `cutAt(t)`; a custom hard change must be registered too.

## Three kinds of loop

### `loop: 'hold'` (the default): the film ends on a still copy of frame 0

1. **Frame 0 is the end state at rest**, usually the lockup. It is on screen at t = 0, leaves at once, and is rebuilt at the end.
2. **Everything settles before the end.** Springs snap to exactly 1 at `16 / (zeta x omega)`; the last settle must come at least `(1 + 0.75) / FPS` before DUR. So must the discrete state: typing and its cursor, blinks, snaps, the frames of an accent. The critique's "loop tail" row reports the last change, what it is, and how many still frames that leaves.
3. **The camera returns** to the world and zoom it started in.

`loopcheck` then requires every pixel of the seam to match exactly: `seek(0)` against `seek(DUR)`, `seek(DUR - 1 frame)` and `seek(DUR - 1.75 frames)`; `renderFrame(0)` against `seek(0)` and `renderFrame(N - 1)`. Every maximum difference must be 0. It prints how many tail frames equal frame 0.

### `loop: 'cycle'`: the film keeps moving through the seam

A spinning object, an idle bob, a walk cycle, a drifting swarm: nothing stops, and the seam is continuous instead of still.

1. **Periodic motion runs whole cycles per loop.** Write it with `cyc(t, n)`, `wave(t, n)` or `loopNoise(t, n, seed)`, where `n` is an integer number of cycles in DUR. The engine lists its periods in `cycles()`; the critique fails any that do not fit a whole number of times.
2. **Every Prop ends where it starts.** A spring still settling when the loop ends carries over the seam into the start of the next pass (only until the Prop's first `set`), so a landing may straddle the loop point. The critique's "loop closes" row fails a Prop whose last target differs from its starting value.
3. **Discrete state repeats too.** Drawings held on twos, sprite frames and line boil must cycle a whole number of times per loop, or the seam shows a skipped drawing.
4. **Frame 0's subframes come from the end of the loop**, which is the right motion blur for a periodic film.

`loopcheck` checks purity as for a hold loop, then continuity: it compares the film 0.1 ms before the loop point with frame 0 (both read frame 0's discrete state) and the same 0.1 ms step inside the frames either side of the seam. A continuous film changes about as many pixels across the seam as elsewhere; a jump changes many more and fails. A film that deliberately cuts at the loop point declares `seamCut` in its engine, and the check becomes information.

### `loop: 'none'`: not a loop

An in-and-out piece (a title that animates on and off). Only purity is checked.

## The encode is not bit-exact, and that is fine

H.264 stores frame 0 as a keyframe and the last frame as a predicted one, so decoded, they differ by encoder noise even when the canvas pixels are identical. `verify` reports it for a hold loop as information. The canvas-level check is the one that proves the film.
