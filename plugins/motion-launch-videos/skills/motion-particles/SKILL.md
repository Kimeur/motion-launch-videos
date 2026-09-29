---
name: motion-particles
description: Make a particle motion-graphics loop, 8 to 15 seconds, from a short brief. Thousands of particles drift as a starfield, swarm into a word, the user's logo or a mark, burst into streaks and reform, then dissolve; spheres and grids too. Claude writes the film as one self-contained HTML canvas file driven by a pure seek(t), checks it with an automated critique (whether each particle word reads at feed size, the live area, the seam), and renders it to MP4, GIF and poster, square, vertical or wide, with motion streaks and a verified seamless loop. Use it for a particle logo reveal, a launch sting where a name forms out of dust, a swarm into text or explode and reform transition, or an ambient particle loop for a landing page. Not for realistic smoke, fire or liquid simulation. Other styles have their own skills: motion-launch-videos (kinetic type), motion-shapes, motion-cartoon, motion-3d, motion-charts, motion-pixel, motion-ui, motion-photo, motion-captions and motion-overlays.
---

# Motion particles

A field of light that gathers into a name, blows apart, snaps back into a mark and unrolls into the domain. Thousands of particles, each one's position a pure function of the time: a drifting field, formations sampled from type and shapes, moves between them on per-particle springs, and motion streaks drawn for every particle. The whole film is one HTML file that can draw any moment from the time alone, so it previews in any browser, renders frame-exact, and loops without a seam.

The skill folder is `${CLAUDE_SKILL_DIR}`; the reference files call it `<skill>`. If the variable shows up literally or empty in your shell (you opened this file directly, as a subagent or from a copy), it is the folder that holds this SKILL.md: put that absolute path in every command below.

A film lives in the user's project at `videos/<film>/` (`BRIEF.md`, `DESIGN.md`, `src/film.html`, `fonts/`, the built `<film>.html`, `stills/`, `renders/`).

## Ground rules

- **True claims only.** Every word on screen comes from the product's own live pages and is logged with its URL in `BRIEF.md`. No prices, trial terms or numbers the live site does not show today. A product with no live site takes its words from the user's brief only. See [reference/brief.md](reference/brief.md).
- **Only what is the user's to use.** A logo is the user's own SVG (one `path` part per colour); marks are built from simple geometry. No other company's logo, mascot or app-store badge.
- **Four words a beat, one call to action.** A particle word must read at feed size, not only full screen.
- **`seek(t)` is pure.** No timers, `Date`, `Math.random`, state or CSS animation; seeded randomness only. Targets are sampled and layout is measured once, after the fonts load.
- **One file.** Fonts embedded as base64; nothing loads over the network. The build enforces it.
- **The loop is exact.** In the default cycle loop the swarm returns to the formation frame 0 shows and keeps drifting over the seam: `loopcheck` passes its continuity line and every pixel diff is 0. A hold loop ends on a still copy of frame 0.
- **Look before you ship.** Numbers pass while frames look wrong; read the stills, the decoded frames and a filmstrip.
- **The user decides what leaves the machine.** Get a yes before any commit, push or upload.

## Workflow

0. **Once per machine.** `node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" doctor` checks Node 20+, playwright-core, a Chromium, ffmpeg with libx264, ffprobe, npm and tar, and prints the exact command for anything missing (usually `npm install --prefix "${CLAUDE_SKILL_DIR}" --no-package-lock`, or `npm i -D playwright-core` in the user's project). Re-run it until it says `DOCTOR OK`.
1. **Brief intake.** Name the video type first (a launch bumper, a feature highlight, a testimonial, an event promo...): [reference/video-types.md](reference/video-types.md) gives each type its length, formats, beats and the styles that fit. Read the product's live site first, then ask at most one round of questions (message, which formats to deliver (1:1, 4:5, 9:16, 16:9), duration, palette), or use the defaults: 1080 x 1080 only, 12 s, 60 fps, 120 BPM, muted, cycle loop, one brand colour as the accent on a black ground. With no live site, the user's brief is the only source. Fill [templates/BRIEF.md](templates/BRIEF.md) into `videos/<film>/BRIEF.md`. See [reference/brief.md](reference/brief.md).
2. **Copy and formation pass.** 3 to 5 beats of at most 4 words each (hook, what it does, proof, CTA), and for each beat the formation that says it: the name, the user's logo, a mark from a few shapes, the domain. Then the moves between them: gather, hold, burst and reform, unroll, dissolve. Show the user the beats and proceed unless they object; when nobody can answer, write them into BRIEF.md and proceed.
3. **Design spec.** Fill [templates/DESIGN.md](templates/DESIGN.md) into `videos/<film>/DESIGN.md`: canvas and grid, palette roles, type roles, the swarm, every formation (spacing, dot, drift, dust), the moves on the tempo grid, camera and glints, the loop seam, the GIF budget, and each other format's patch. Read [reference/particle-craft.md](reference/particle-craft.md), [reference/engine.md](reference/engine.md) and [reference/springs.md](reference/springs.md).
4. **Build and measure.** Copy [templates/film.html](templates/film.html) to `videos/<film>/src/film.html` and transcribe DESIGN.md into its `FILM` block (edit nothing below it; the build copies the title, the background and the canvas size into the page head). Fetch the fonts, build, and read the measured layout:
   ```bash
   node "${CLAUDE_SKILL_DIR}/scripts/fonts.mjs" videos/<film>
   node "${CLAUDE_SKILL_DIR}/scripts/build.mjs" videos/<film>
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" layout videos/<film>    # particles per formation and glyph, cap heights, boxes, move timings
   ```
   Put text baselines on the 8 px grid, set `swarm.n` to the biggest formation plus 25 to 40 % for dust, then write the final numbers into DESIGN.md and FILM together. For each other format, write its patch in `FILM.formats` (a stack or a taller mark for 9:16, a wider mark or burst for 16:9; engine.md, Formats) and measure it with `layout --format 9:16`. See [reference/fonts.md](reference/fonts.md) and [reference/core.md](reference/core.md).
5. **Stills and critique.** `node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" stills videos/<film>` runs the automated critique (glyph coverage, words per beat, particle budget, live area, legibility of each word at feed size, time fully formed, dust clutter, contrast, palette roles, the swarm across the seam, whole periods, blank frames, the composition's balance) and the palette gate, and writes motion-blurred stills plus `stills/contact.png`. Run it once per delivered format with `--format 9:16` and so on (stills land in `stills/9x16/`). Read the contact sheet (about feed size) and the full-size stills; fix and repeat until it passes and looks right. See [reference/review.md](reference/review.md).
6. **Render and verify.**
   ```bash
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" loopcheck videos/<film>   # purity, and the seam: continuous (cycle) or 0 (hold)
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" render videos/<film>      # MP4, GIF, poster; 2 to 3 minutes for 4600 particles
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" verify videos/<film>      # ffprobe facts, tags, decoded pixels, GIF size
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" mp4frames videos/<film>   # decoded review frames + PSNR
   ```
   Run `loopcheck`, `render`, `verify` and `mp4frames` once per delivered format, with the same `--format` (the outputs carry it: `renders/<film>-9x16.mp4`, `preview-9x16.gif`, `poster-9x16.png`). Look at `stills/mp4/contact.png`, the full-size frames at each burst and landing, and a filmstrip of the MP4. Report the files, their sizes and the verify, loopcheck and mp4frames lines. See [reference/render.md](reference/render.md) and [reference/loops.md](reference/loops.md).

## Pass criteria

- The critique, the composition row included, passes at every delivered format, and each format's formations use its frame's shape.
- Every particle word reads at the contact sheet's size: 16 or more particles across the cap height, and the light it averages to at least 3:1 on the ground.
- Every formation fully formed for a second before the next move leaves it; one formation, one accent, per beat.
- Every colour is a palette role; one chromatic accent, so glow and overlaps never mix a third colour.
- Moves flow: gathers arc in without crossing, a burst streaks and reforms before the frame empties, every move starts on the grid.
- Streaks on every moving frame, one pass per frame; the seam continuous (cycle) or exact (hold).
- The preview GIF under 4 MB; the MP4 H.264, yuv420p, BT.709-tagged in the stream, faststart, exactly DUR x FPS frames.

## Known pitfalls

- Small dots at a wide spacing make a word that is clear full size and a dim grey smear in a feed. Check the legibility row's averaged contrast, not just the shape.
- A text formation's `size` is the font size; the particle size is `dot`.
- A derived formation needs its source assigned first: move into `acme` before moving into a burst `from: 'acme'`.
- A wide word bursts into a wide band and leaves a hole in the middle; `stretch` rounds the burst out, and a reform that starts while particles still fly fills the frame again.
- A cycle loop's last move may still be settling at the loop point; that is fine (it carries over), unless a formation on either side of it spins.
- A hold loop needs a still field: waves, drift and twinkle 0, and the lockup's drift and spin 0.
- Every moving particle costs GIF bytes, and a faint haze costs more: keep the glow's floor, most of the field faint, the dust dimmed while words hold, and the engine's GIF hints (12 fps, 16 colours, no dither).
- `render.mjs at` stills are sharp dots; `frame`, the review stills and the render are streaked.
