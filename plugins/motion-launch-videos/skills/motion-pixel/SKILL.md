---
name: motion-pixel
description: Make a pixel-art motion loop, 6 to 20 seconds, from a short brief. A low-resolution canvas scaled up by a whole number, a strict palette of at most 16 colours, ASCII-art sprites with run cycles, parallax strips, tile maps and a built-in bitmap font. Claude writes the film as one self-contained HTML canvas file driven by a pure seek(t), checks it with an automated critique (every pixel a palette colour, whole-pixel positions, whole sprite cycles, text contrast on its real backdrop), and renders it to MP4, a crisp GIF and a poster with a verified seamless loop. Use it for a game launch teaser, an 8-bit title screen with a blinking PRESS START, a retro-styled promo, a pixel sticker or banner, or a character running through a scrolling world. Not for big kinetic type (motion-launch-videos), flat vector shapes (motion-shapes), hand-drawn character animation (motion-cartoon), 3D (motion-3d), charts of real data (motion-charts), particle fields (motion-particles) or UI mockups (motion-ui).
---

# Motion pixel

A tiny world on a tiny canvas: a hero runs through a scrolling landscape, coins spin and sparkle, a title drops in and bounces, PRESS START blinks. Everything is drawn at whole logical pixels in a strict palette and scaled up with no smoothing, so every frame is crisp pixel art. The whole film is one HTML file that can draw any frame from the time alone, so it previews in any browser, renders frame-exact, and loops without a seam.

The skill folder is `${CLAUDE_SKILL_DIR}`; the reference files call it `<skill>`. If the variable shows up literally or empty in your shell (you opened this file directly, as a subagent or from a copy), it is the folder that holds this SKILL.md: put that absolute path in every command below.

A film lives in the user's project at `videos/<film>/` (`BRIEF.md`, `DESIGN.md`, `src/film.html`, the built `<film>.html`, `stills/`, `renders/`).

## Ground rules

- **True claims only.** Every word on screen comes from the product's own live pages and is logged with its URL in `BRIEF.md`. No prices, release dates, platforms or numbers the live site does not show today. A product with no live site takes its words from the user's brief only. See [reference/brief.md](reference/brief.md).
- **Original art only.** Every sprite, tile, title and palette is drawn for this film. No character, sprite, tile set, font or logo from an existing game, and no console's or fantasy console's palette; a brand's colours are quantised into the film's own palette. The user's own logo may be redrawn as a sprite when it is theirs.
- **Four words a beat, one call to action.**
- **`seek(t)` is pure, and pixel films read the frame.** No timers, `Date`, `Math.random`, state or CSS animation; seeded randomness only. Every position, sprite frame and blink reads the frame's own time `q`, so a frame is a function of its number.
- **Every pixel is a palette colour.** Whole logical pixels, integer scales, no smoothing, no partial alpha, no motion blur: a fade is an ordered dither between two colours. The stills gate checks every pixel of every planned still.
- **One file.** The bitmap font lives in the engine; nothing loads over the network. The build enforces it.
- **The loop is exact.** In the default cycle loop every scroll, sprite cycle and blink repeats a whole number of times, and the film drawn on to `t = DUR` is frame 0, pixel for pixel.
- **Look before you ship.** Numbers pass while frames look wrong; read the stills and the decoded frames.
- **The user decides what leaves the machine.** Get a yes before any commit, push or upload.

## Workflow

0. **Once per machine.** `node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" doctor` checks Node 20+, playwright-core, a Chromium, ffmpeg with libx264 and ffprobe, and prints the exact command for anything missing (usually `npm install --prefix "${CLAUDE_SKILL_DIR}" --no-package-lock`, or `npm i -D playwright-core` in the user's project). Re-run it until it says `DOCTOR OK`. (It also checks npm and tar, which only the font fetch of the other skills needs.)
1. **Brief intake.** Read the product's live site first, then ask at most one round of questions (message, format, duration, palette), or use the defaults: 1080 x 1080 from a 180 x 180 canvas at x6, 10 s, 60 fps, 120 BPM, muted, cycle loop, an original palette of 16 colours or fewer (the brand's colours quantised into it). 16:9 is 320 x 180 at x6, 9:16 is 180 x 320 at x6. With no live site, the user's brief is the only source. Fill [templates/BRIEF.md](templates/BRIEF.md) into `videos/<film>/BRIEF.md`. See [reference/brief.md](reference/brief.md).
2. **Copy and world pass.** At most 4 words of display type a beat (a title, a gag like PRESS START, the domain), one call to action, and the world that carries them: who runs, what scrolls behind, what gets collected, what lands on the beat. Show the user the beats and proceed unless they object; when nobody can answer, write them into BRIEF.md and proceed.
3. **Design spec.** Fill [templates/DESIGN.md](templates/DESIGN.md) into `videos/<film>/DESIGN.md`: the pixel grid, palette roles with contrast, every sprite (size, frames, fps, period), every layer back to front (speed, repeat, period), the text (scale, outline, drop), the timeline on the beat grid, and the loop's periods. Read [reference/pixel-craft.md](reference/pixel-craft.md), [reference/engine.md](reference/engine.md) and [reference/springs.md](reference/springs.md).
4. **Draw and build.** Copy [templates/film.html](templates/film.html) to `videos/<film>/src/film.html` and transcribe DESIGN.md into its `FILM` block: palette, sprites as ASCII art, layers (edit nothing below it; the build copies the title, the background and the canvas size into the page head). There are no fonts to fetch: the page embeds no font files, so `fonts.mjs` has nothing to do (it says so) and the step can be skipped. Build and read the measured layout:
   ```bash
   node "${CLAUDE_SKILL_DIR}/scripts/build.mjs" videos/<film>
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" layout videos/<film>    # logical boxes, speeds, repeats, periods
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" at videos/<film> 2.5 5  # sharp stills of any moment
   ```
   Write the final numbers into DESIGN.md and FILM together. See [reference/core.md](reference/core.md).
5. **Stills and critique.** `node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" stills videos/<film>` runs the automated critique (pixel grid, sprite and tile maps, whole pixels, even scroll steps, bitmap-font coverage, legibility, live area, contrast against each text's measured backdrop, collisions, words, pickups, entrances, whole periods, the seam) and the strict palette gate, and writes stills plus `stills/contact.png`. Read the contact sheet and the full-size stills; fix and repeat until it passes and looks right. See [reference/review.md](reference/review.md).
6. **Render and verify.**
   ```bash
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" loopcheck videos/<film>   # cycle loop: pure and continuous over the seam
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" render videos/<film>      # MP4, GIF (nearest neighbour, the exact palette), poster
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" verify videos/<film>      # ffprobe facts, tags, decoded pixels
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" mp4frames videos/<film>   # decoded review frames + PSNR
   ```
   Look at `stills/mp4/contact.png`, the full-size frames at each landing and dissolve, and a filmstrip of the MP4. Report the files, their sizes and the verify, loopcheck and mp4frames lines. See [reference/render.md](reference/render.md) and [reference/loops.md](reference/loops.md).

## Pass criteria

- Every pixel of every frame is a palette colour (the strict gate), and the GIF holds exactly the palette.
- Every position is a whole logical pixel; every scroll steps evenly (1 px every n frames, or n px every frame).
- Every sprite cycle, scroll, blink, palette cycle and twinkle repeats a whole number of times per loop; drawn on to `t = DUR`, the film is frame 0.
- Text is at least 35 px tall on output, 3:1 (display) or 4.5:1 (small print) against the pixels that actually touch it, inside the live area, at most 4 display words at once.
- One focal point per beat; something moves on every beat; silhouettes read at 1x.
- The deliverable MP4 is H.264, yuv420p, BT.709-tagged in the stream, faststart, exactly DUR x FPS frames, at least 35 dB PSNR on every review frame.

## Known pitfalls

- A slow layer repeats sooner than you think: at v px/s it repeats every v x DUR px. Anything unique on it (a castle, a big cloud) needs v x DUR of at least the screen width plus its own width, or it shows twice. In a 10 s loop at 180 px wide, that is 20 px/s or more.
- A speed that is not FPS / n or n x FPS px/s steps unevenly (1, 1, 2, 1, 1, 2 px): a visible judder. `scroll steps` warns.
- A sprite's frames at fps f repeat every frames / f seconds: 6 frames at 12 fps is 0.5 s, whole in a 10 s loop; 8 frames at 12 fps is not.
- In a cycle loop, a layer that enters and never leaves sits at rest before its entrance and pops. Give it an exit, or a `show` window.
- `bounce: true` mirrors every dy of the layer to the side it dropped from, exits included: a title that drops from above can only leave upward or by dissolving.
- Adjacent outlined letters share the gap: at scale 1 a 1-px track leaves no clear pixel between outlines; use `track: 2` or no outline for small print.
- A 1-px Bayer dissolve is the hardest thing H.264 can meet. The engine dithers text and scaled sprites in their own pixel size; if a dissolve frame still decodes under 35 dB, shorten the fade or render with `--crf 12`.
- ffmpeg's palettegen keeps one of its colours for transparency, so the engine asks the GIF for palette size + 1 colours; with fewer, two palette colours merge into one that is not in the palette.
- The core's `margin` in `render.mjs layout` is the kinetic-type default in canvas px; this engine's live area is `px.margin` in logical px (the `px.live` row).
