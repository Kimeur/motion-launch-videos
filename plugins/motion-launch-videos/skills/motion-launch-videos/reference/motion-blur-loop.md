# Motion blur and the seamless loop

Real motion blur comes from rendering several subframes per output frame and averaging them. A seamless loop means the last frame flows into frame 0 with nothing to see at the seam. Both are exact in this engine; this file says how, and what breaks them.

## Subframes are sampled behind the frame

Output frame n shows time `tn = n / FPS`. Its subframes sit on a trailing 270-degree shutter: `k` samples evenly spaced from `tn - 0.75 / FPS` to `tn`, averaged with equal weight and rounded (`(sum + k/2) / k`, integer). The frame shows where things are at tn, with a streak behind them, the way a film camera does.

## Adaptive sample count

`motionAt(n)` measures how far anything moves across the shutter, in screen px: every visible glyph's y, rules, crumbs, the camera's x and zoom, the mask edge at the far corner, the breath.

| Motion across the shutter | Subframes |
|---|---|
| nothing changes at all | 1 (exact: the mean of identical samples is the sample) |
| up to 20 px | 4 |
| more | `ceil(px / 5)`, up to 64 |

Fixed 4 subframes show a smash-pan (about 160 px across the shutter at 1080 px) as 4 stepped copies. At 10 px apart the copies still show as faint steps on hard edges (the round of an O); at 5 px they read as one streak. The cap of 64 keeps the sum of samples inside 16 bits; a 1920 px mask wipe or pan can still reach it, with copies 8 to 9 px apart. A static hold costs one draw per frame, which is why a 12 s film renders in minutes.

"Nothing changes" is decided from the spring event lists and the declared active windows (masks, breaths, custom `draw` hooks), not from pixels. A custom hook that moves outside its declared `active` windows would be rendered with 1 sample there and lose its blur.

## Never blur across a hard cut

A subframe that falls before a cut while its frame is after it is clamped to the cut time. Otherwise the first frame after a cut is a double exposure of both scenes. Every `cut` and `mask` start is in the engine's cut list automatically; a custom hard change inside a `draw` hook must be added there too.

## Frame 0 equals the last frame

Frame 0's subframes reach back to `-0.75 / FPS`, which wraps to the end of the loop (`t mod DUR`). So for frame 0 to be clean, the end of the loop must look exactly like t = 0:

1. **Frame 0 is the lockup at rest.** The last scene has `wrap: { exit: 0, dy }`: its elements are on screen at rest at t = 0 and leave at 0.00, then enter again at the end.
2. **Everything settles before the end.** Springs snap to exactly 1 at `16 / (ζω)`; the last settle must be at least `(1 + 0.75) / FPS` before DUR. So must the discrete state: a crumb's typing and its cursor (2 frames after the last character), a blinking cursor (`blink`), a scramble's snap, and the 3 frames of each accent. The critique's "loop tail" check reports the last change, what it is, and a lower bound on the static hold in frames; loopcheck then counts the frames that really equal frame 0.
3. **The camera returns** to the world and zoom it started with.
4. **Discrete state agrees.** Before its own entrance, a wrap scene shows its resolved state (crumbs fully typed, no cursor, scramble resolved), so t = 0 and the tail match.
5. **Breath lands on exactly 1** (sin squared, not a spring) and ends before the hold.

## loopcheck

`node <skill>/scripts/render.mjs loopcheck <film>` compares exact canvas pixels, every channel:

| Check | Why |
|---|---|
| `seek(0)` vs `seek(DUR)` | the time wrap |
| `seek(0)` vs `seek(DUR - 1 frame)` and `seek(DUR - 1.75 frames)` | the static tail covers the last frame's whole shutter |
| `renderFrame(0)` vs `seek(0)` | frame 0's wrapped subframes change nothing |
| `renderFrame(0)` vs `renderFrame(N - 1)` | the seam |
| `seek(a)` after other seeks vs a fresh `seek(a)`; `renderFrame(m)` twice | purity |

Every maximum difference must be 0. It also prints how many tail frames equal frame 0.

## The encode is not bit-exact, and that is fine

H.264 stores frame 0 as a keyframe and the last frame as a predicted frame, so decoded, they differ by encoder noise (a mean well under 1 level) even though the canvas pixels are identical. `verify` reports it for information. Keep the canvas-level check at exactly 0; that is the one that proves the film.
