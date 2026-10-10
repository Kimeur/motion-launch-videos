---
name: motion-overlays
description: Make an animated overlay for editors and streamers to lay over their own footage, delivered with alpha: a lower third (name and role, a place, a quote's attribution), a title or chapter card, social handles and a subscribe button, a YouTube end screen round the platform's elements, a corner bug, a callout pointing into the footage, a progress bar or a LIVE badge. Each comes in on springs with motion blur, holds as long as asked and goes out. Claude writes it as one self-contained HTML canvas file driven by a pure seek(t), checks safe areas, the 9:16 feeds' UI, contrast on unknown footage, reading time and clean alpha, and renders a ProRes 4444 .mov and a VP9 .webm with alpha, an MP4 and GIF preview, at 16:9, 9:16 or 1:1. Not for captions timed to speech or complete films. Other styles have their own skills: motion-launch-videos (kinetic type), motion-shapes, motion-cartoon, motion-3d, motion-charts, motion-pixel, motion-particles, motion-ui, motion-photo, motion-captions and motion-globe.
---

# Motion overlays

Graphics for someone else's timeline: a name that wipes in under a speaker, a chapter card between two segments, a subscribe button that gets clicked, the end screen round YouTube's own elements, a bug in the corner for the whole video. The film is one HTML file that draws any moment from the time alone, over a transparent background; the render delivers it with an alpha channel for Premiere Pro, DaVinci Resolve, Final Cut Pro, After Effects or OBS, and a preview over a stand-in for the footage.

The skill folder is `${CLAUDE_SKILL_DIR}`; the reference files call it `<skill>`. If the variable shows up literally or empty in your shell (you opened this file directly, as a subagent or from a copy), it is the folder that holds this SKILL.md: put that absolute path in every command below.

A film lives in the user's project at `videos/<film>/` (`BRIEF.md`, `DESIGN.md`, `src/film.html`, `fonts/`, the built `<film>.html`, `stills/`, `renders/`). One film is one overlay; a pack (a lower third per speaker, a card per chapter) is several film folders made from the same template and one shared DESIGN.md ([reference/overlay-craft.md](reference/overlay-craft.md), Packs).

## Ground rules

- **True names only.** Every name, role, handle, place and URL on screen comes from the user or the product's own pages and is logged in `BRIEF.md`. A person's name and role only as they gave it, with their permission; a quote only in the speaker's words. See [reference/brief.md](reference/brief.md).
- **Only what is the user's to use.** Icons are the skill's generic marks (a play triangle in a circle, a bell, a pin, an at sign) or the user's own SVG logo. Never a platform's logo or button (no YouTube, TikTok, Instagram or X marks), and no real person the user has not cleared.
- **It must read on footage nobody has seen.** Text sits on its own plate, or carries a keyline, or passes on light, mid and dark footage alike.
- **It stays out of the way.** Inside the broadcast safe areas, clear of the 9:16 feeds' buttons and captions and of the end screen's element areas, and never over the middle of the frame for longer than a moment (a title card excepted).
- **`seek(t)` is pure.** No timers, `Date`, `Math.random`, state or CSS animation; seeded randomness only. Layout is measured once, after the fonts load.
- **One file.** Fonts embedded as base64; nothing loads over the network. The build enforces it.
- **Clean alpha.** Nothing is drawn outside the overlay's parts, and a clip that comes in and goes out starts and ends fully transparent.
- **Look before you ship.** Numbers pass while frames look wrong: read the stills, and look at a decoded frame of the .mov or .webm over a checkerboard and over a still like the footage.
- **The user decides what leaves the machine.** Get a yes before any commit, push or upload.

## Workflow

0. **Once per machine.** `node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" doctor` checks Node 20+, playwright-core, a Chromium, ffmpeg with libx264, ffprobe, npm and tar, and prints the exact command for anything missing (usually `npm install --prefix "${CLAUDE_SKILL_DIR}" --no-package-lock`, or `npm i -D playwright-core` in the user's project). A transparent film also needs ffmpeg's `prores_ks` and `libvpx-vp9` (doctor reports both). Re-run it until it says `DOCTOR OK`.
1. **Brief intake.** Name the video type first (a launch bumper, a feature highlight, a testimonial, an event promo...): [reference/video-types.md](reference/video-types.md) gives each type its length, formats, beats and the styles that fit. What the overlay says (the exact name, role, title or handle, spelled as the user spells it), the kind, where it plays (the editor or platform, the frame rate of the edit) and the footage it sits on. Ask at most one round of questions, or use the defaults: a lower third, 16:9 at 1920 x 1080 as the master, 60 fps, a 4 s hold, transparent, a whoosh in and a swish out. 9:16 (1080 x 1920) and 1:1 (1080 x 1080) are delivered when asked for, from the same file. Fill [templates/BRIEF.md](templates/BRIEF.md) into `videos/<film>/BRIEF.md`: the Facts table holds every string on screen and where it came from. See [reference/brief.md](reference/brief.md) and [reference/video-types.md](reference/video-types.md) (Lower thirds, Intro and outro).
2. **Design spec.** Fill [templates/DESIGN.md](templates/DESIGN.md) into `videos/<film>/DESIGN.md`: the kind and its corner, the palette with each text's contrast, the type, the timing (in, hold, out) and the safe areas per format. Read [reference/overlay-craft.md](reference/overlay-craft.md), [reference/engine.md](reference/engine.md) and [reference/springs.md](reference/springs.md).
3. **Build and measure.** Copy [templates/film.html](templates/film.html) to `videos/<film>/src/film.html` and transcribe DESIGN.md into its `FILM` block (edit nothing below it; the build copies the title, the background and the canvas size into the page head). Fetch the fonts, build, and read the measured layout:
   ```bash
   node "${CLAUDE_SKILL_DIR}/scripts/fonts.mjs" videos/<film>
   node "${CLAUDE_SKILL_DIR}/scripts/build.mjs" videos/<film>
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" layout videos/<film>    # parts, boxes, safe areas, the timing
   ```
   For each extra format, add a patch to `FILM.formats` (engine.md, Formats). See [reference/fonts.md](reference/fonts.md) and [reference/core.md](reference/core.md).
4. **Stills and critique.** `node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" stills videos/<film>` runs the automated critique (glyph coverage, timing, reading time, title and action safe, platform zones, text size, contrast, keylines, clean alpha, the middle of the frame, the bug's opacity and size, end screen zones, palette, composition, audio) and writes stills with alpha plus `stills/contact.png` over `bg`. Read the contact sheet and the full-size stills; fix and repeat until it passes and looks right. Run it again with `--format 9:16` and `--format 1:1` for each other delivered format. See [reference/review.md](reference/review.md).
5. **Render and verify.**
   ```bash
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" loopcheck videos/<film>   # purity (and, for a hold loop, the seam)
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" render videos/<film>      # .mov and .webm with alpha, MP4, GIF, poster, .wav
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" verify videos/<film>      # the files, the alpha plane vs the canvas
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" mp4frames videos/<film>   # decoded review frames + PSNR
   ```
   Run the four once per delivered format, each with its `--format` flag. Then decode a frame of the .mov and of the .webm and look at it over a checkerboard and over a still like the footage (review.md, Look at the alpha). Report the files, their sizes and the verify, loopcheck and mp4frames lines. See [reference/render.md](reference/render.md) and [reference/loops.md](reference/loops.md).

## Pass criteria

- Text inside title safe (90 %), every other part inside action safe (93 %), at rest, in every delivered format; at 9:16, clear of the feed's header, caption and buttons.
- Every text at least 4.5:1 (3:1 at a cap height of 40 px or more) against its own plate, or its keyline, or the worst of light, mid and dark footage; strokes with no plate carry a keyline.
- Cap heights of at least 26 px at 1080; the hold at least as long as the words take to read (15 characters a second, 1.5 s at least).
- Entrances on springs (SLIDE, WIPE, POP), exits critically damped (EXIT) and quicker than the entrance; motion blur on every moving frame.
- Alpha 0 outside the overlay's parts; frame 0 and the last frame fully transparent for an in-and-out overlay.
- A bug at most 80 % opaque and 2 % of the frame; an end screen's element areas clear.
- The .mov is ProRes 4444 with alpha and the .webm VP9 with alpha, each with exactly DUR x FPS frames, whose decoded alpha matches the canvas; the MP4 is H.264, yuv420p, BT.709-tagged, faststart.

## Known pitfalls

- `bg` is never drawn: it is the footage the overlay is judged and previewed against. Set it to the kind of footage the overlay will sit on. The MP4 and GIF are composited over `bg` only; for a preview over a real still, composite the .webm yourself (engine.md, Preview over footage).
- Change `timing.hold`, not `DUR`: DUR follows the timing. The exit is scheduled back from the end of the film, and the critique's `timing: out` row says when `timing.out` is too short for it.
- An editor that reads the .mov as premultiplied shows a dark fringe on soft edges: set the clip's alpha to straight (render.md, Troubleshooting).
- The overlay's frame rate should match the edit's timeline (`FPS: 30`, `25` or `24`); a 60 fps overlay on a 30 fps timeline drops every other frame and keeps its blur.
- White text with no plate fails on light footage. Give it a plate, a scrim (a band at 70 to 85 % opacity) or a keyline of at least a tenth of its cap height.
- A lower third pinned bottom-left at 9:16 lands in the feed's caption; the template's 9:16 patch raises it. A tag or small print pinned to a corner may land on the feed's buttons.
- A button that changes state (Subscribe to Subscribed) is two labels crossfading: both must fit the button, which is sized for the longer one.
- A hold loop is only for an overlay that stays on (a bug, a badge): it is at rest on frame 0 and its idle motion (a glint, a pulse) ends at rest before the last frame.
