---
name: motion-cartoon
description: Make a looping cartoon of an original mascot or character, 6 to 20 seconds, from a short brief. A bean-shaped rig with rubber-hose arms and an antenna walks, hops, blinks, waves, reacts, talks in a bubble and holds up a sign with the product's name, in outlined flat colour with cel shading, on twos with a boiling line, squash and stretch, follow-through and a sunburst stage. Claude writes the film as one self-contained HTML canvas file driven by a pure seek(t), checks it with an automated critique, and renders it to MP4, GIF and poster at 1:1, 9:16 or 16:9 with a verified seamless loop. Use it for a mascot intro, a brand character saying hi, a reaction loop or sticker, or a playful launch teaser. Not for existing or trademarked characters, real people or lip-sync to audio. Other styles have their own skills: motion-launch-videos (kinetic type), motion-shapes, motion-3d, motion-charts, motion-pixel, motion-particles, motion-ui, motion-photo, motion-captions, motion-overlays and motion-globe.
---

# Motion cartoon

A character with a clear silhouette, a simple face and a short performance: it notices you, reacts, does one thing, and gets back to where it started, so the loop never ends. The whole film is one HTML file that can draw any moment from the time alone, so it previews in any browser, renders frame-exact, and loops without a seam.

The skill folder is `${CLAUDE_SKILL_DIR}`; the reference files call it `<skill>`. If the variable shows up literally or empty in your shell (you opened this file directly, as a subagent or from a copy), it is the folder that holds this SKILL.md: put that absolute path in every command below.

A film lives in the user's project at `videos/<film>/` (`BRIEF.md`, `DESIGN.md`, `src/film.html`, `fonts/`, the built `<film>.html`, `stills/`, `renders/`).

## Ground rules

- **An original character only.** Design it from the rig's shapes, or from the user's own mascot. Never draw an existing cartoon, game or brand character, a real person, or something close enough to pass for one. See [reference/brief.md](reference/brief.md).
- **True claims only.** Every word on the sign, in a bubble or in small print comes from the product's own live pages and is logged with its URL in `BRIEF.md`. A product with no live site takes its words from the user's brief only.
- **Four words a beat, one call to action** (usually the product's name on the sign).
- **`seek(t)` is pure.** No timers, `Date`, `Math.random`, state or CSS animation; seeded randomness only. Drawings and the line boil read the quantised frame, so a drawing is the same every time it is held.
- **One file.** Fonts embedded as base64; nothing loads over the network. The build enforces it.
- **The loop is seamless.** The default is a cycle loop: the performance ends where it began, every act brings its value back, and `loopcheck` finds the seam as smooth as any other instant.
- **Look before you ship.** Numbers pass while frames look wrong; read the stills and the decoded frames.
- **The user decides what leaves the machine.** Get a yes before any commit, push or upload.

## Workflow

0. **Once per machine.** `node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" doctor` checks Node 20+, playwright-core, a Chromium, ffmpeg with libx264, ffprobe, npm and tar, and prints the exact command for anything missing. Re-run it until it says `DOCTOR OK`.
1. **Brief intake.** Name the video type first (a launch bumper, a feature highlight, a testimonial, an event promo...): [reference/video-types.md](reference/video-types.md) gives each type its length, formats, beats and the styles that fit. Read the product's live site, then ask at most one round of questions: who the character is (the user's mascot, or a new one: what it is like in three words), the one thing it does, which formats (1:1, 9:16, 16:9: one film renders to each), duration, palette. Defaults: 1080 x 1080 (1:1) only, 10 s, 60 fps, 12 drawings a second, 120 BPM, cycle loop, the template's palette or the brand's colours. Fill [templates/BRIEF.md](templates/BRIEF.md) into `videos/<film>/BRIEF.md`. See [reference/brief.md](reference/brief.md).
2. **The performance.** Write the beats as acting, not as moves: notices you, reacts, shows the thing, celebrates, settles. At most 4 words in any bubble or sign. Show the user the beats and proceed unless they object; when nobody can answer, write them into BRIEF.md and proceed.
3. **Character sheet and timing.** Fill [templates/DESIGN.md](templates/DESIGN.md) into `videos/<film>/DESIGN.md`: the character's proportions and colours (fill, shade, light, outline), the stage, then every act on the tempo grid with its anticipation and settle, the loop seam, and how each other delivered format is re-staged (its patch in `FILM.formats`: engine.md, Formats). Read [reference/animation.md](reference/animation.md), [reference/engine.md](reference/engine.md) and [reference/springs.md](reference/springs.md).
4. **Build.** Copy [templates/film.html](templates/film.html) to `videos/<film>/src/film.html` and transcribe DESIGN.md into its `FILM` block (edit nothing below it). Fetch the fonts and build:
   ```bash
   node "${CLAUDE_SKILL_DIR}/scripts/fonts.mjs" videos/<film>
   node "${CLAUDE_SKILL_DIR}/scripts/build.mjs" videos/<film>
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" layout videos/<film>    # the character's box, hops, sign size
   ```
   See [reference/fonts.md](reference/fonts.md) and [reference/core.md](reference/core.md).
5. **Stills and critique.** `node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" stills videos/<film>` runs the automated critique (glyph coverage, words, contrast of the sign, bubble and titles, the character inside the live area, the loop and its cycles, the face at the seam) and the palette gate, and writes a still for every key pose (each anticipation, stretch and impact, each bubble, sign and emote) plus `stills/contact.png`. Read them as an animator would: silhouette, squash, arcs, the face at thumbnail size. Fix and repeat. Run it once per delivered format: `--format 9:16` checks the 9:16 cut, composition included, and writes `stills/9x16/`. See [reference/review.md](reference/review.md).
6. **Render and verify.**
   ```bash
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" loopcheck videos/<film>   # purity 0, the seam continuous
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" render videos/<film>      # MP4, GIF (one frame per drawing), poster
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" verify videos/<film>      # ffprobe facts, tags, decoded pixels
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" mp4frames videos/<film>   # decoded review frames + PSNR
   ```
   Run the four once per delivered format, with the same `--format 9:16` (outputs `renders/<film>-9x16.mp4`, `preview-9x16.gif`, `poster-9x16.png`). Look at `stills/mp4/contact.png` and a strip of the whole film. Report the files, their sizes and the verify, loopcheck and mp4frames lines. See [reference/render.md](reference/render.md) and [reference/loops.md](reference/loops.md).

## Pass criteria

- The composition row passes at every delivered format: the performance fills each frame, not the top of a tall one or the left of a wide one.
- The silhouette reads at thumbnail size: in every key pose you can tell what the character is doing from its outline alone.
- Every big move has an anticipation before it and a settle after it; every hop lands with a squash; the antenna and hands arrive after the body.
- One action at a time; one expression per beat; the eyes lead (they look before the body moves).
- Drawings held evenly (a divisor of the frame rate); the line boil subtle (1 to 2 px); no motion blur.
- Every colour a palette role: fill, shade and light for each surface, one outline colour.
- The loop closes: the last pose, face and every value are the first ones; the stage's cycles are whole.
- The deliverable MP4 is H.264, yuv420p, BT.709-tagged in the stream, faststart, exactly DUR x FPS frames.

## Known pitfalls

- An act that moves a value must bring it back before the loop ends, or `loop closes` fails: a character that walks 300 px right walks 300 px back. A spring still settling at the end carries over the seam; a hop's arc and a walk's stride do not, so finish them before the end.
- The face at the end must be the face at the start (`start` and the last `face` act), or it snaps at the loop point.
- A hop taller than about 220 px lifts the antenna out of a 1080 frame; the critique warns when the head leaves it.
- BOUNCY settles 3.1 s after it starts: fine in a cycle loop, where it carries over the seam, but it keeps the character wobbling if you meant it to hold still.
- The sign is held by its lower corners: while it is up, the hands ignore their own targets. A sign wider than about 700 px leaves the live area. Held out to one side (`sign.x`), give it one hand (`hold: 'L'` or `'R'`), or the far arm crosses the face.
- In another format, move the stage with `stage.raise`, not by patching `ground`: the sunburst and titles pinned `'g'` are measured from the ground as authored.
- Drawings are held, so a move shorter than two drawings (1/6 s at 12 a second) can vanish between them. Make quick moves at least three drawings long, or give them an anticipation.
- Stroke-heavy details (lashes, fingers, hair) boil into noise at 1080. Keep features to simple closed shapes.
