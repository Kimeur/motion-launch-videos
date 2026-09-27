# Render: headless Chromium to MP4, GIF and poster, then verify

Step 6. `scripts/render.mjs` opens the built film in headless Chromium, pulls exact canvas pixels, and streams them into one ffmpeg process.

## Requirements

`node <skill>/scripts/render.mjs doctor` checks all of these on the current machine and prints the command that fixes each missing one. Run it once per machine, before the first film.

- **Node 20 or newer.**
- **playwright-core**, resolved from the film folder (and the folders above it), then the working directory, then the skill folder. Either install it once next to the scripts, `npm install --prefix <skill> --no-package-lock` (the skill's `package.json` lists it; nothing global, and no lockfile left in the skill folder), or add it to the user's project, `npm i -D playwright-core`, which survives a plugin update that replaces the skill folder.
- **A Chromium.** The script looks, in order, at:
  1. `$CHROME_PATH`
  2. playwright-core's own browser (`chromium.executablePath()`), present after `node <playwright-core folder>/cli.js install chromium` (doctor prints the exact line)
  3. the newest `chromium-*` in the Playwright cache (`$PLAYWRIGHT_BROWSERS_PATH`, or `~/Library/Caches/ms-playwright`, `~/.cache/ms-playwright`, `%LOCALAPPDATA%\ms-playwright`)
  4. a system Google Chrome or Chromium
  
  Canvas `letterSpacing` and `ctx.filter` are Chromium features; Firefox and WebKit are not supported.
- **ffmpeg and ffprobe** with libx264, from `$FFMPEG_PATH` / `$FFPROBE_PATH` or PATH (`brew install ffmpeg`, `apt install ffmpeg`).

## Modes

```bash
node <skill>/scripts/render.mjs doctor                       # once per machine: what is missing, and the fix
node <skill>/scripts/render.mjs stills    videos/<film>      # critique + review stills + contact sheet
node <skill>/scripts/render.mjs loopcheck videos/<film>      # seam and purity, every diff must be 0
node <skill>/scripts/render.mjs render    videos/<film>      # renders/<film>.mp4, preview.gif, poster.png
node <skill>/scripts/render.mjs render    videos/<film> --range 240:420 # a quick partial render: renders/<film>-f240-420.mp4
node <skill>/scripts/render.mjs verify    videos/<film>      # facts about the files, decoded pixels
node <skill>/scripts/render.mjs verify    videos/<film> --mp4 videos/<film>/renders/<film>-f240-420.mp4   # a partial render
node <skill>/scripts/render.mjs mp4frames videos/<film>      # decoded review frames + PSNR vs the canvas
node <skill>/scripts/render.mjs mp4frames videos/<film> 96 276 363      # chosen frames
node <skill>/scripts/render.mjs at        videos/<film> 2.5 7.25        # sharp seek() stills
node <skill>/scripts/render.mjs frame     videos/<film> 150 390         # motion-blurred frames
node <skill>/scripts/render.mjs layout    videos/<film>      # measured layout as JSON
```

Every film mode rebuilds `<film>.html` first, so what you check is what you ship.

## How pixels leave the browser

- Chromium runs with `--force-color-profile=srgb --disable-lcd-text --font-render-hinting=none`, a viewport of exactly W x H at device scale 1, and the page at `?capture=1` (no preview loop).
- Pixels come from `getImageData` on the film's own canvas, never from a screenshot: a screenshot goes through the compositor and colour management.
- Stills are PNGs of the canvas. The render sends raw RGB (base64 per frame) to ffmpeg's stdin; no PNG encode per frame.

## Encode

One ffmpeg process makes both deliverables from the same RGB stream:

- **MP4**: `scale=out_color_matrix=bt709:out_range=tv,format=yuv420p`, libx264 `-preset slow -crf 16`, tagged `-color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv`, with `-bsf:v h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1:video_full_range_flag=0` so the tags are in the H.264 stream itself (the SPS), not only in the container, and `-movflags +faststart` so it starts playing before it has downloaded. No audio track.
- **GIF**: every third frame (20 fps), 480 px wide (Lanczos), a 64-colour palette built from the whole film (`palettegen` then `paletteuse` with a light Bayer dither). Aim for under 4 MB; `--gif-fps 15` or `--gif-colors 32` if it is over.
- **Poster**: the exact canvas PNG of `FILM.poster` (0, the lockup at rest, by default).

The explicit BT.709 matrix matters: converting RGB to YUV with the default (BT.601) matrix and tagging it BT.709 shifts every colour slightly, and brand colours are exactly what people notice.

## Time

Measured on an Apple-silicon Mac: the 8 s template demo (480 frames) renders in about 60 s, and `stills` takes about 5 s. Two things make that possible: blurred glyphs are drawn once into cached sprites (a canvas blur filter on every glyph made the heaviest frame take 10 s instead of 0.2 s), and a frame where nothing moves is drawn once instead of 4 to 64 times. The fastest frames (smash-pans, mask wipes) cost the most, up to 64 subframes each. A 1920 x 1080 film takes about 1.8 times as long per frame as a 1080 x 1080 one (the same 3 s stretch of the demo: 45 s against 25 s). Start the full render as a background job and read the stills while it runs.

## Verify

`verify` checks the delivered files, not the page:

| Check | Pass |
|---|---|
| codec, pixel format, size, frame rate | h264, yuv420p, W x H, FPS/1 (real and average) |
| frame count and duration | exactly DUR x FPS frames, DUR within one frame |
| colour tags | bt709 matrix, transfer and primaries, tv range |
| faststart | `moov` before `mdat` |
| frame 0 and the last frame vs the canvas | decoded with the BT.709 matrix, PSNR at least 35 dB |
| background | every pixel that is the background in the canvas decodes within 2 levels of it (a range mistake lifts #0A0A0A to about #171717) |
| encoded seam | frame 0 vs the last frame, decoded (information only; see motion-blur-loop.md) |
| GIF and poster | present; GIF under 4 MB |

Frames are decoded with `scale=in_color_matrix=bt709:in_range=tv:out_range=pc:flags=accurate_rnd+full_chroma_int`. The two flags matter: swscale's default fast path reads every colour 1 to 3 levels low (white as 253, `#0B0B10` as 10,10,13) although the stream holds the exact values (white is Y 235, U and V 128), which fails the background check on any white or tinted-dark film. With the flags, `#0A0A0A` decodes as exactly 10.

A partial render (`--mp4 renders/<film>-f<a>-<b>.mp4`) is checked against frames a to b-1: frame count, duration, the first and last frame against the canvas, the background. The seam, GIF and poster are only checked on the full render.

Then **look at the files yourself**: `mp4frames` decodes the review-stills frames (each scene at rest, each transition, each accent, the loop start, frame 0 and the last frame) from the MP4 into `stills/mp4/` with a contact sheet, and prints each frame's PSNR against the exact canvas. Read the contact sheet and the full-size accent, mask and pan frames. A number that passes can still hide a frame that looks wrong. By hand, the same decode is `ffmpeg -i renders/<film>.mp4 -vf "select=eq(n\,96)+eq(n\,276),scale=in_color_matrix=bt709:in_range=tv:out_range=pc:flags=accurate_rnd+full_chroma_int,tile=2x1" -frames:v 1 check.png`.

## Troubleshooting

| Symptom | Cause |
|---|---|
| `the film failed to start` | a JavaScript error in FILM (the page error is printed), or a font file missing |
| `playwright-core not found` | `npm install --prefix <skill> --no-package-lock`, or `npm i -D playwright-core` in the project; `doctor` prints the line |
| `no Chromium found` | set `CHROME_PATH`, or run the install line `doctor` prints |
| text in the wrong face in a still | the font did not load: check the `@font-face` family and weight match `FILM.fonts` |
| stepped copies on a fast move | the move is outside anything motion detection sees (a custom `draw` hook without `active` windows), or it is so fast that 64 subframes still sit more than 5 px apart (`render.mjs frame` prints the count; slow the spring or shorten the move) |
| a double exposure right after a cut | the cut is not in the cut list (a hard change inside a `draw` hook) |
| grey background in the MP4 | the RGB-to-YUV range or matrix was changed; keep the `scale` filter above |
| background 1 to 3 levels dark in a decoded frame | the decode lacks `accurate_rnd+full_chroma_int`; the MP4 is fine |
