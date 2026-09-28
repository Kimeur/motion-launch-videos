---
name: motion-launch-videos
description: Make a kinetic-typography launch bumper or brand identity sting, a 6 to 20 second looping video of big animated type, from a short brief (product, message beats, palette, formats, duration). Claude writes the film as one self-contained HTML canvas file driven by a pure seek(t), laid out for 1:1, 9:16 and 16:9 from one config, then renders it to MP4 with real subframe motion blur, a verified seamless loop, a preview GIF and a poster. Use it for a launch video, product bumper, promo loop, animated type teaser, logo or identity sting, or a social video announcing a product, made in code rather than edited footage. Not for screen recordings, narrated explainers, talking heads or long product demos. For shape animation, cartoons, 3D, data charts, pixel art, particles or app UI demos, use the sibling motion-* skills.
---

# Motion launch videos

A short, loud, looping film of type: a hook, what the product does, a proof, the domain. The whole film is one HTML file that can draw any moment from the time alone, so it previews in any browser, renders frame-exact, and loops without a seam.

The skill folder is `${CLAUDE_SKILL_DIR}`; the reference files call it `<skill>`. When the skill is loaded as a skill, Claude Code fills that variable in. If it shows up literally or is empty in your shell (you opened this file directly, as a subagent or from a copy), it is the folder that holds this SKILL.md: put that absolute path in every command below, or the commands point at `/scripts/...`.

A film lives in the user's project at `videos/<film>/` (`BRIEF.md`, `DESIGN.md`, `src/film.html`, `fonts/`, the built `<film>.html`, `stills/`, `renders/`).

## Ground rules

- **True claims only.** Every word on screen comes from the product's own live pages and is logged with its URL in `BRIEF.md`. No prices, trial terms or numbers the live site does not show today. A product with no live site (a demo, a fictional or unreleased product) takes its words from the user's brief only, logged as such; see [reference/brief.md](reference/brief.md).
- **Four words a beat, one call to action.**
- **`seek(t)` is pure.** No timers, `Date`, `Math.random`, state or CSS animation; seeded randomness only. Layout is measured once, after the fonts load.
- **One file.** Fonts embedded as base64; nothing loads over the network. The build enforces it.
- **The loop is exact.** Frame 0 is the lockup at rest and equals the last frame: `loopcheck` must report a max diff of 0.
- **Look before you ship.** Numbers pass while frames look wrong; read the stills and the decoded frames.
- **The user decides what leaves the machine.** Get a yes before any commit, push or upload.

## Workflow

0. **Once per machine.** `node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" doctor` checks Node 20+, playwright-core, a Chromium, ffmpeg with libx264, ffprobe, npm and tar, and prints the exact command for anything missing. Usually that is `npm install --prefix "${CLAUDE_SKILL_DIR}" --no-package-lock` (or `npm i -D playwright-core` in the user's project, which survives plugin updates), then the Chromium install line it prints if no Chromium is found. Re-run it until it says `DOCTOR OK`.
1. **Brief intake.** Read the product's live site first, then ask at most one round of questions (the message; the formats, one or several of 1:1, 9:16 and 16:9; the duration; the palette), or use the defaults: 1080 x 1080 only, 12 s, 60 fps, 120 BPM, muted, brand colours from the site's CSS. With no live site, the user's brief is the only source; do not fetch a domain that merely shares the product's name. Fill [templates/BRIEF.md](templates/BRIEF.md) into `videos/<film>/BRIEF.md` with every fact and its source. See [reference/brief.md](reference/brief.md).
2. **Copy pass.** 3 to 5 beats of at most 4 words each (hook, what it does, proof, CTA), lifted from the source's own words, one CTA. Crumbs (small typed lines) are facts too and cite a row. Show the user the beats and proceed unless they object; when nobody can answer (a subagent, a scripted run, a "go"), write them into BRIEF.md and proceed. See [reference/brief.md](reference/brief.md) for beat splits at 8, 10, 12 and 15 s.
3. **Design spec, first pass.** Fill [templates/DESIGN.md](templates/DESIGN.md) into `videos/<film>/DESIGN.md`: canvas, 8 px baseline grid, palette roles with contrast, type roles, then every beat (lines, size rules, springs, stagger, transition, accent) on the tempo grid, and the loop seam. Baselines are a first guess here: the real cap heights come from `layout` in step 4. For each extra format, fill the Formats section: its measure, how each stack re-flows, what is pinned. Read [reference/design-spec.md](reference/design-spec.md) (light films and the 9:16 and 16:9 formats are covered there), [reference/kinetic-type.md](reference/kinetic-type.md), [reference/techniques.md](reference/techniques.md) and [reference/springs.md](reference/springs.md).
4. **Build, measure, settle the baselines.** Copy [templates/film.html](templates/film.html) to `videos/<film>/src/film.html` and transcribe DESIGN.md into its `FILM` block (edit nothing below it; the build copies `FILM.title`, the background and the canvas size into the page head). Fetch the fonts, build, and read the measured layout:
   ```bash
   node "${CLAUDE_SKILL_DIR}/scripts/fonts.mjs" videos/<film>
   node "${CLAUDE_SKILL_DIR}/scripts/build.mjs" videos/<film>
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" layout videos/<film>    # sizes, cap tops, ink boxes
   ```
   Move each baseline to the grid from the reported cap heights, then write the final numbers into DESIGN.md and FILM together. Then write a `FILM.formats` patch for each extra format and settle its baselines the same way, from `layout videos/<film> --format 16:9`. See [reference/engine.md](reference/engine.md) for every FILM field, formats and pins, and [reference/fonts.md](reference/fonts.md).
5. **Pre-pass stills and critique.** `node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" stills videos/<film>` runs the automated critique (glyph coverage from each font's cmap, words per beat, live area, collisions, letter gaps with the `pairs` value that fixes each, orphans, contrast, palette, loop tail, blank frames, composition) and writes stills plus `stills/contact.png`. Read the contact sheet and the full-size stills for cramped type, orphans, contrast and off-palette mixes; fix and repeat until it passes and looks right. See [reference/review.md](reference/review.md).
6. **Render and verify.**
   ```bash
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" loopcheck videos/<film>   # every diff must be 0
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" render videos/<film>      # MP4, GIF, poster
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" verify videos/<film>      # ffprobe facts, tags, decoded pixels
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" mp4frames videos/<film>   # decoded review frames + PSNR
   ```
   Then look at `stills/mp4/contact.png` and the full-size decoded frames at each accent, the mask, the pan and the lockup. Report the files, their sizes and the verify, loopcheck and mp4frames lines.

**Steps 5 and 6 run once per format you deliver**: add `--format 9:16` or `--format 16:9` to every command. The outputs are suffixed (`stills/9x16/`, `renders/<film>-9x16.mp4`, `preview-9x16.gif`, `poster-9x16.png`), and the critique checks the film at that format. See [reference/render.md](reference/render.md) and [reference/motion-blur-loop.md](reference/motion-blur-loop.md).

## Pass criteria

Every delivered format meets all of these, each checked at its own format:

- Display type fits its measure exactly; pairs keep 0.037 em of ink gap; every baseline is on the grid.
- The critique has no FAIL (and a WARN only where you looked and meant it), the composition row included: each format's stacks sit centred in its frame, re-flowed for it, not a square layout left in the top of a 9:16 frame or crowding a 16:9 one.
- Something moves on every beat; transitions vary (cut, mask wipe, smash-pan); one accent per scene at most.
- Every transition lands on something: no run of blank frames at a cut or at the loop point.
- Misregistration only on landing frames, and two chromatic inks never share a pixel.
- Motion blur on every moving frame, never across a hard cut; fast moves read as streaks, not copies.
- Only palette colours; display type at least 3:1 and crumbs at least 4.5:1 against the background.
- The deliverable MP4 is H.264, yuv420p, BT.709-tagged in the stream, faststart, exactly DUR x FPS frames.

## Known pitfalls

- A blurred `fillText` blurs a whole-canvas layer (about 25 ms at 1080 px). The engine caches blurred glyphs as sprites; keep new blurred drawing going through `fillGlyph`.
- The browser cannot tell you a font lacks a glyph; it falls back silently. Trust the cmap check, not a screenshot.
- Canvas drawing is lazy: timing `seek()` alone measures nothing; time `seek` plus `getImageData`.
- A spring never lands exactly; the engine snaps at `16 / (ζω)`. A custom easing that does not snap breaks the loop.
- `set()` on a visible element is a pop. Only while invisible, at a cut, or inside fast blur.
- Frame 0's subframes wrap to the end of the loop: the tail must be a static copy of t = 0.
- The mask wipe needs something already on screen in the incoming scene, or it reveals an empty frame; a cut needs something that is on screen at once (`enter.pop`), not a fade-in.
- Decode MP4 frames with `accurate_rnd+full_chroma_int` (verify and mp4frames do). swscale's default path reads 1 to 3 levels dark: white as 253, `#0B0B10` as 10,10,13. With the flags, `#0A0A0A` decodes as exactly 10. A background near `#171717` means the range or matrix is wrong.
