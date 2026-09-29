# Render: headless Chromium to MP4, GIF and poster, then verify

`scripts/render.mjs` opens the built film in headless Chromium, pulls exact canvas pixels, and streams them into one ffmpeg process. The same scripts serve every motion-* skill: they read what the film declares (`FILM_META`: its loop kind, whether it blurs, its palette gate) and check accordingly.

## Requirements

`node <skill>/scripts/render.mjs doctor` checks all of these on the current machine and prints the command that fixes each missing one. Run it once per machine, before the first film.

- **Node 20 or newer.**
- **playwright-core**, resolved from the film folder (and the folders above it), then the working directory, then the skill folder. Install it once next to the scripts, `npm install --prefix <skill> --no-package-lock`, or add it to the user's project, `npm i -D playwright-core`, which survives a plugin update and serves every motion-* skill at once.
- **A Chromium.** The script looks, in order, at `$CHROME_PATH`, playwright-core's own browser (after `node <playwright-core folder>/cli.js install chromium`; doctor prints the exact line), the newest `chromium-*` in the Playwright cache (`$PLAYWRIGHT_BROWSERS_PATH`, or the default cache folder), then a system Google Chrome or Chromium. Canvas `letterSpacing` and `ctx.filter` are Chromium features; Firefox and WebKit are not supported. A WebGL film (motion-3d) runs on the GPU when there is one and on SwiftShader, Chromium's software renderer, when there is not; `doctor` prints which (an INFO line, never a failure).
- **ffmpeg and ffprobe** with libx264, from `$FFMPEG_PATH` / `$FFPROBE_PATH` or PATH (`brew install ffmpeg`, `apt install ffmpeg`). A film with sound needs the AAC encoder (every build has it); a transparent film needs `prores_ks` and `libvpx-vp9` (the Homebrew and apt builds have both). `doctor` reports all three as INFO lines.

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

Every film mode takes `--format 9:16` (or `16:9`, `4:5`, `1:1`): the film at that aspect ratio (core.md, Formats), its outputs suffixed: `stills/9x16/`, `renders/<film>-9x16.mp4`, `preview-9x16.gif`, `poster-9x16.png`. Run `stills`, `loopcheck`, `render` and `verify` once per format you deliver.

Every film mode rebuilds `<film>.html` first, so what you check is what you ship. `fonts.mjs` fetches the faces the film's `@font-face` tokens name; `build.mjs` embeds them and refuses a page that would load anything over the network.

## How pixels leave the browser

- Chromium runs with `--force-color-profile=srgb --disable-lcd-text --font-render-hinting=none`, a viewport of exactly W x H at device scale 1, and the page at `?capture=1` (no preview loop). The flag alone does not stop LCD text on an opaque canvas, so the film's canvas has an alpha channel (core.md).
- Pixels come from `getImageData` on the film's own canvas, never from a screenshot: a screenshot goes through the compositor and colour management.
- Stills are PNGs of the canvas. The render sends raw RGB to ffmpeg's stdin; no PNG encode per frame.
- A transparent film (`FILM.transparent`) is read as RGBA. The script composites it over `bg` for the MP4 and GIF (`c x a + bg x (255 - a)`, rounded, the same sum the page's checks use) and sends the RGBA itself to a second ffmpeg for the alpha outputs.

## Encode

One ffmpeg process makes both deliverables from the same RGB stream:

- **MP4**: `scale=out_color_matrix=bt709:out_range=tv,format=yuv420p`, libx264 `-preset slow -crf 16`, tagged BT.709 in the container and, through `h264_metadata`, in the H.264 stream itself, with `-movflags +faststart`. No audio track, unless the film sets `FILM.audio` (below).
- **GIF**: every third frame (20 fps), the pixel count of a 480 x 480 GIF at the film's aspect ratio (360 x 640 at 9:16, 640 x 360 at 16:9, 430 x 538 at 4:5; an engine may set its own, and `--gif-width` sets the width), a 64-colour palette built from the whole film, a light Bayer dither. An engine may ask for other settings (pixel art: nearest-neighbour scaling, no dither). Aim for under 4 MB; `--gif-fps 15` or `--gif-colors 32` if it is over.
- **Poster**: the exact canvas PNG of `FILM.poster` (with its alpha, in a transparent film).

### Sound (`FILM.audio`)

After the video, the page synthesises the cue mix (`renderAudio()`: Float32 stereo at 48 kHz, exactly DUR long, loop tails already wrapped) and the script writes it to a WAV. ffmpeg mixes it with the track (`track`, trimmed from `offset` to DUR, or looped when shorter, then `gain` in dB and the fades), measures the mix's integrated loudness (EBU R128, `ebur128`) and applies the gain that reaches `loudness` (default -16 LUFS), re-measuring until it is within 0.2 LU; a limiter at -2.5 dBFS comes in only when that gain would push the peaks past -1.5 dBTP. The last pass encodes AAC at 48 kHz, 192 kb/s, stereo, and muxes it next to the video stream, copied untouched, with faststart. A `--range` render gets the matching slice of the audio. See audio.md for cues, music you may use and loudness targets.

### Alpha (`FILM.transparent`)

A full render of a transparent film also writes, from the same frames:

- `renders/<film>.mov`: ProRes 4444 with alpha, `prores_ks -profile:v 4 -pix_fmt yuva444p10le` (16-bit alpha), BT.709. For Premiere, Resolve, Final Cut and After Effects.
- `renders/<film>.webm`: VP9 with alpha, `libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0 -crf 20`. For the web and for editors that take WebM. ffmpeg's built-in VP9 decoder drops the alpha: decode with `-c:v libvpx-vp9`.

The MP4 and GIF are the film over `bg`, for review. The .mov and .webm are silent; a transparent film with `FILM.audio` also gets `renders/<film>.wav`, the normalised mix (24-bit, 48 kHz), for the editor's timeline.

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
| audio (no `FILM.audio`) | no audio stream (a warning) |
| audio stream (`FILM.audio`) | AAC, 48 kHz, stereo; its duration within one frame of the video's |
| loudness (`FILM.audio`) | integrated loudness (ffmpeg `ebur128`) within 1.5 LU of `audio.loudness`; loudness range and true peak reported. A warning only, on a partial render |
| .mov and .webm (`FILM.transparent`) | ProRes 4444 with a `yuva` pixel format; VP9 with `alpha_mode` 1; size and frame count |
| alpha vs canvas (`FILM.transparent`) | the poster, the review stills and the most motion-blurred frame, decoded: the alpha plane's PSNR against the canvas alpha (at least 45 dB for ProRes, 35 dB for VP9), and the colour over `bg` |
| poster alpha (`FILM.transparent`) | the PNG has an alpha channel |

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
| `LOOPCHECK FAIL` in a cycle loop | something jumps at the loop point: a Prop that does not return to its start, a period that is not whole (the critique names both). When the frame step fails on one tile, a drawing, sprite or idle cycle there does not fit the loop (loops.md) |
| `loudness` far from the target | a film of a few short cues and no track: give it a lower `loudness` or a bed under the cues (audio.md) |
| an overlay with a dark fringe in the editor | the editor reads the .mov as premultiplied: set its alpha to straight (unpremultiplied) |
| grey background in the MP4 | the RGB-to-YUV range or matrix was changed; keep the `scale` filter above |
