---
name: motion-shapes
description: Make a flat 2D motion-graphics loop, 6 to 20 seconds, from a short brief. Circles, rounded rects, polygons, stars, arcs, lines and SVG paths pop in, draw on, morph and ripple in grids and rings, with type, circle and bar wipes and a camera. Claude writes the film as one self-contained HTML canvas file driven by a pure seek(t), checks it with an automated critique, and renders it to MP4, GIF and poster with real motion blur and a verified seamless loop. Use it for an explainer-style product promo, a feature highlight told with icons, an animated logo or icon (draw-on then fill), a shape-driven launch bumper or a social loop, made in code rather than After Effects. Not for screen recordings or narrated explainers. Other styles have their own skills: motion-launch-videos (kinetic type), motion-cartoon, motion-3d, motion-charts, motion-pixel, motion-particles, motion-ui, motion-photo, motion-captions and motion-overlays.
---

# Motion shapes

Flat colour, clean geometry, everything on the beat: a checkbox that draws itself and ticks, rows that slide in and tick off, a ring that fills round the week, a logo that assembles. The whole film is one HTML file that can draw any moment from the time alone, so it previews in any browser, renders frame-exact, and loops without a seam.

The skill folder is `${CLAUDE_SKILL_DIR}`; the reference files call it `<skill>`. If the variable shows up literally or empty in your shell (you opened this file directly, as a subagent or from a copy), it is the folder that holds this SKILL.md: put that absolute path in every command below.

A film lives in the user's project at `videos/<film>/` (`BRIEF.md`, `DESIGN.md`, `src/film.html`, `fonts/`, the built `<film>.html`, `stills/`, `renders/`).

## Ground rules

- **True claims only.** Every word on screen comes from the product's own live pages and is logged with its URL in `BRIEF.md`. No prices, trial terms or numbers the live site does not show today. A product with no live site takes its words from the user's brief only. See [reference/brief.md](reference/brief.md).
- **Only what is the user's to use.** Icons and marks are drawn from simple geometry or the user's own SVG logo; no other company's logo, mascot or app-store badge.
- **Four words a beat, one call to action.**
- **`seek(t)` is pure.** No timers, `Date`, `Math.random`, state or CSS animation; seeded randomness only. Layout is measured once, after the fonts load.
- **One file.** Fonts embedded as base64; nothing loads over the network. The build enforces it.
- **The loop is exact.** In the default hold loop, frame 0 is the lockup at rest and equals the last frame: `loopcheck` reports a max diff of 0.
- **Look before you ship.** Numbers pass while frames look wrong; read the stills and the decoded frames.
- **The user decides what leaves the machine.** Get a yes before any commit, push or upload.

## Workflow

0. **Once per machine.** `node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" doctor` checks Node 20+, playwright-core, a Chromium, ffmpeg with libx264, ffprobe, npm and tar, and prints the exact command for anything missing (usually `npm install --prefix "${CLAUDE_SKILL_DIR}" --no-package-lock`, or `npm i -D playwright-core` in the user's project). Re-run it until it says `DOCTOR OK`.
1. **Brief intake.** Name the video type first (a launch bumper, a feature highlight, a testimonial, an event promo...): [reference/video-types.md](reference/video-types.md) gives each type its length, formats, beats and the styles that fit. Read the product's live site first, then ask at most one round of questions (message, formats, duration, palette), or use the defaults: 1080 x 1080, 10 s, 60 fps, 120 BPM, muted, hold loop, brand colours from the site's CSS. The 1:1 film is the master; 9:16 (1080 x 1920) and 16:9 (1920 x 1080) are delivered when asked for, from the same file. With no live site, the user's brief is the only source. Fill [templates/BRIEF.md](templates/BRIEF.md) into `videos/<film>/BRIEF.md`. See [reference/brief.md](reference/brief.md).
2. **Copy and picture pass.** 3 to 5 beats of at most 4 words each (hook, what it does, proof, CTA), and for each beat the one picture that says it in shapes: a checkbox for "done", rows for "a list", a ring for "every day". Show the user the beats and proceed unless they object; when nobody can answer, write them into BRIEF.md and proceed.
3. **Design spec.** Fill [templates/DESIGN.md](templates/DESIGN.md) into `videos/<film>/DESIGN.md`: canvas and grid, palette roles with contrast, type roles, then every scene (layers, sizes, springs, staggers, transition) on the tempo grid, and the loop seam. Read [reference/motion-design.md](reference/motion-design.md), [reference/engine.md](reference/engine.md) and [reference/springs.md](reference/springs.md).
4. **Build and measure.** Copy [templates/film.html](templates/film.html) to `videos/<film>/src/film.html` and transcribe DESIGN.md into its `FILM` block (edit nothing below it; the build copies the title, the background and the canvas size into the page head). Fetch the fonts, build, and read the measured layout:
   ```bash
   node "${CLAUDE_SKILL_DIR}/scripts/fonts.mjs" videos/<film>
   node "${CLAUDE_SKILL_DIR}/scripts/build.mjs" videos/<film>
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" layout videos/<film>    # sizes, cap tops, boxes
   ```
   Put text baselines on the 8 px grid from the reported cap heights, then write the final numbers into DESIGN.md and FILM together. For each extra format, add a patch to `FILM.formats` that restacks the layout for the frame (engine.md, Formats). See [reference/fonts.md](reference/fonts.md) and [reference/core.md](reference/core.md).
5. **Stills and critique.** `node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" stills videos/<film>` runs the automated critique (glyph coverage, words per beat, live area, text collisions, contrast against each text's own backdrop, palette roles, the loop, blank frames, composition) and the palette gate, and writes stills plus `stills/contact.png`. Read the contact sheet and the full-size stills; fix and repeat until it passes and looks right. Run it again with `--format 9:16` or `--format 16:9` for each other delivered format (stills in `stills/9x16/`, `stills/16x9/`). See [reference/review.md](reference/review.md).
6. **Render and verify.**
   ```bash
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" loopcheck videos/<film>   # hold loop: every diff must be 0
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" render videos/<film>      # MP4, GIF, poster
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" verify videos/<film>      # ffprobe facts, tags, decoded pixels
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" mp4frames videos/<film>   # decoded review frames + PSNR
   ```
   Run `loopcheck`, `render`, `verify` and `mp4frames` once per delivered format, each with its `--format` flag (outputs `renders/<film>-9x16.mp4`, `preview-9x16.gif`, `poster-9x16.png`). Look at `stills/mp4/contact.png` and the full-size frames at each transition and accent. Report the files, their sizes and the verify, loopcheck and mp4frames lines. See [reference/render.md](reference/render.md) and [reference/loops.md](reference/loops.md).

## Pass criteria

- Every colour is a palette role; overlapping chromatic shapes are opaque, so no two inks blend into a third.
- One focal point per beat; something moves on every beat; transitions vary (cut, circle wipe, bars, push).
- Entrances overshoot (POP, LAND), exits do not (EXIT); strokes draw on critically damped (TRACE, DRAW).
- Display type at least 3:1 and small print at least 4.5:1 against its own backdrop; at most 4 words of display type a beat.
- Every text layer inside the live area, baselines on the grid, no text colliding with text.
- The composition passes at every delivered format, and each format looks designed for its frame: stacked and bigger at 9:16, side by side at 16:9.
- Motion blur on every moving frame, one sample on still ones, never across a cut or the bars' scene swap.
- The deliverable MP4 is H.264, yuv420p, BT.709-tagged in the stream, faststart, exactly DUR x FPS frames.

## Known pitfalls

- A trim on a closed shape starts at 12 o'clock and runs clockwise; an SVG path starts wherever its `d` starts. Rotate the layer, reorder the path, or animate `shift`.
- A trim and a dash pattern cannot both show; the trim wins while it draws.
- A morph twists when the two outlines start in different places or differ wildly in size. The engine lines up the start points; still check a mid-morph still.
- `scale: 0` and `op: 0` hide a layer; any other `from` state is visible the moment its entrance starts. A pop (`set` on a visible layer) is only acceptable at a cut.
- The bars wipe swaps scenes under full cover at the incoming scene's `t0`: nothing of the incoming scene may enter before `t0`.
- A circle wipe reveals the incoming scene on its own `bg`; give a scene that needs a different colour a `bg`.
- Text `rot` and `scale` turn and scale each glyph about its own centre, not the line's.
- Loop behaviours (`spin`, `bob`, `pulse`, `orbit`, `sway`, `march`) keep their scene moving on every frame. The hold loop's lockup must hold still: put them elsewhere, or make the film a cycle loop.
- Stroke width scales with its layer: a thin line scaled up becomes a thick one.
- At 9:16 and 16:9, an offset that took something off screen at 1:1 (`dx: 1000`, an exit `dy: 360`) may leave it in view. Patch the offset in `FILM.formats`, and look at frame 0 at each format.
