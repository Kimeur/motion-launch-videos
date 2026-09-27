# Render: headless Chromium to MP4, GIF and poster, then verify

`scripts/render.mjs` opens the built film in headless Chromium, pulls exact canvas pixels, and streams them into one ffmpeg process. The same scripts serve every motion-* skill: they read what the film declares (`FILM_META`: its loop kind, whether it blurs, its palette gate) and check accordingly.

## Requirements

`node <skill>/scripts/render.mjs doctor` checks all of these on the current machine and prints the command that fixes each missing one. Run it once per machine, before the first film.

- **Node 20 or newer.**
- **playwright-core**, resolved from the film folder (and the folders above it), then the working directory, then the skill folder. Install it once next to the scripts, `npm install --prefix <skill> --no-package-lock`, or add it to the user's project, `npm i -D playwright-core`, which survives a plugin update and serves every motion-* skill at once.
- **A Chromium.** The script looks, in order, at `$CHROME_PATH`, playwright-core's own browser (after `node <playwright-core folder>/cli.js install chromium`; doctor prints the exact line), the newest `chromium-*` in the Playwright cache (`$PLAYWRIGHT_BROWSERS_PATH`, or the default cache folder), then a system Google Chrome or Chromium. Canvas `letterSpacing` and `ctx.filter` are Chromium features; Firefox and WebKit are not supported. A WebGL film (motion-3d) runs on the GPU when there is one and on SwiftShader, Chromium's software renderer, when there is not.
- **ffmpeg and ffprobe** with libx264, from `$FFMPEG_PATH` / `$FFPROBE_PATH` or PATH (`brew install ffmpeg`, `apt install ffmpeg`).

## Modes

```bash
node <skill>/scripts/render.mjs doctor                       # once per machine: what is missing, and the fix
node <skill>/scripts/render.mjs stills    videos/<film>      # critique + review stills + contact sheet
node <skill>/scripts/render.mjs loopcheck videos/<film>      # seam and purity (see loops.md)
node <skill>/scripts/render.mjs render    videos/<film>      # renders/<film>.mp4, preview.gif, poster.png
node <skill>/scripts/render.mjs render    videos/<film> --range 240:420 # a quick partial render: renders/<film>-f240-420.mp4
node <skill>/scripts/render.mjs verify    videos/<film>      # facts about the files, decoded pixels
node <skill>/scripts/render.mjs verify    videos/<film> --mp4 videos/<film>/renders/<film>-f240-420.mp4
node <skill>/scripts/render.mjs mp4frames videos/<film>      # decoded review frames + PSNR vs the canvas
node <skill>/scripts/render.mjs mp4frames videos/<film> 96 276 363      # chosen frames
node <skill>/scripts/render.mjs at        videos/<film> 2.5 7.25        # sharp seek() stills
node <skill>/scripts/render.mjs frame     videos/<film> 150 390         # motion-blurred frames
node <skill>/scripts/render.mjs layout    videos/<film>      # measured layout as JSON
```

Every film mode rebuilds `<film>.html` first, so what you check is what you ship. `fonts.mjs` fetches the faces the film's `@font-face` tokens name; `build.mjs` embeds them and refuses a page that would load anything over the network.

## How pixels leave the browser

- Chromium runs with `--force-color-profile=srgb --disable-lcd-text --font-render-hinting=none`, a viewport of exactly W x H at device scale 1, and the page at `?capture=1` (no preview loop).
- Pixels come from `getImageData` on the film's own canvas, never from a screenshot: a screenshot goes through the compositor and colour management.
- Stills are PNGs of the canvas. The render sends raw RGB to ffmpeg's stdin; no PNG encode per frame.

## Encode

One ffmpeg process makes both deliverables from the same RGB stream:

- **MP4**: `scale=out_color_matrix=bt709:out_range=tv,format=yuv420p`, libx264 `-preset slow -crf 16`, tagged BT.709 in the container and, through `h264_metadata`, in the H.264 stream itself, with `-movflags +faststart`. No audio track.
- **GIF**: every third frame (20 fps), 480 px wide, a 64-colour palette built from the whole film, a light Bayer dither. An engine may ask for other settings (pixel art: nearest-neighbour scaling, no dither). Aim for under 4 MB; `--gif-fps 15` or `--gif-colors 32` if it is over.
- **Poster**: the exact canvas PNG of `FILM.poster`.

The explicit BT.709 matrix matters: converting RGB to YUV with the default BT.601 matrix and tagging it BT.709 shifts every colour slightly, and brand colours are exactly what people notice.

## Time

On an Apple-silicon Mac or a 4-core cloud machine, a 10 s 1080 x 1080 film renders in one to three minutes: a frame where nothing moves costs one draw, the fastest moves up to 64. A 1920 x 1080 film takes about 1.8 times as long per frame. WebGL on SwiftShader, and particle swarms, cost more per draw. Start the full render as a background job and read the stills while it runs.

## Verify

`verify` checks the delivered files, not the page:

| Check | Pass |
|---|---|
| codec, pixel format, size, frame rate | h264, yuv420p, W x H, FPS/1 (real and average) |
| frame count and duration | exactly DUR x FPS frames, DUR within one frame |
| colour tags | bt709 matrix, transfer and primaries, tv range |
| faststart | `moov` before `mdat` |
| first and last frame vs the canvas | decoded with the BT.709 matrix, PSNR at least 35 dB |
| background | every pixel that is the background in the canvas decodes within 2 levels of it (a range mistake lifts #0A0A0A to about #171717). A first frame without a plain background is checked on its most common colour |
| encoded seam | frame 0 vs the last frame, decoded (information only, hold loops) |
| GIF and poster | present; GIF under 4 MB |

Frames are decoded with `scale=in_color_matrix=bt709:in_range=tv:out_range=pc:flags=accurate_rnd+full_chroma_int`. The two flags matter: swscale's default path reads every colour 1 to 3 levels low (white as 253) although the stream holds the exact values.

Then **look at the files yourself**: `mp4frames` decodes the review-stills frames from the MP4 into `stills/mp4/` with a contact sheet and each frame's PSNR against the exact canvas. A number that passes can still hide a frame that looks wrong.

## Troubleshooting

| Symptom | Cause |
|---|---|
| `the film failed to start` | a JavaScript error in FILM (the page error is printed), or a font file missing |
| `playwright-core not found` | `npm install --prefix <skill> --no-package-lock`, or `npm i -D playwright-core` in the project |
| `no Chromium found` | set `CHROME_PATH`, or run the install line `doctor` prints |
| text in the wrong face in a still | the font did not load: the `@font-face` family and weight must match `FILM.fonts` |
| stepped copies on a fast move | the move is outside anything the engine's `disp` measures, or so fast that 64 subframes still sit more than 5 px apart (`render.mjs frame` prints the count; slow the spring or shorten the move) |
| a double exposure right after a cut | the cut is not registered (`cutAt`) |
| `LOOPCHECK FAIL` in a cycle loop | something jumps at the loop point: a Prop that does not return to its start, a period that is not whole (the critique names both) |
| grey background in the MP4 | the RGB-to-YUV range or matrix was changed; keep the `scale` filter above |
