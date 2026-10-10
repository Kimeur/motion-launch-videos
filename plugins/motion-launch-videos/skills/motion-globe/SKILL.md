---
name: motion-globe
description: Make a data globe film, 20 to 40 seconds, of a network or a launch, worldwide. A dotted Earth from real geography forms out of the dark; the camera dives, hops and flies along great circles; routes arc between cities; pins rise as beams with HUD cards that type a query and count up their numbers; a region title, telemetry, a running total; the globe recedes into the lockup. Claude writes one self-contained HTML canvas file driven by a pure seek(t), checks every place against its country and every number against sourced data, runs a critique (card collisions, contrast over the globe, reading time, camera height), scores it with a bed and cues, and renders MP4, GIF and poster with motion blur at 16:9, 9:16 or 1:1. Use it for "show our network", coverage, new markets. Not for street maps. Other styles have their own skills: motion-launch-videos (kinetic type), motion-shapes, motion-cartoon, motion-3d, motion-charts, motion-pixel, motion-particles, motion-ui, motion-photo, motion-captions and motion-overlays.
---

# Motion globe

A film about where things happen: a dotted Earth that forms out of the dark, routes flying between cities, a camera that dives to a country and flies on to the next, beams rising over each place with a card that counts what happens there, then a pull back to the whole network and its total, and the lockup. The globe is drawn from real geography (Natural Earth, public domain) with its own projection in Canvas 2D; the film is one HTML file that draws any moment from the time alone, so it previews in any browser, renders frame-exact with motion blur, and carries its own score.

The skill folder is `${CLAUDE_SKILL_DIR}`; the reference files call it `<skill>`. If the variable shows up literally or empty in your shell (you opened this file directly, as a subagent or from a copy), it is the folder that holds this SKILL.md: put that absolute path in every command below.

A film lives in the user's project at `videos/<film>/` (`BRIEF.md`, `DESIGN.md`, `src/film.html`, `fonts/`, the built `<film>.html`, `stills/`, `renders/`).

## Ground rules

- **Every place is where it says.** `FILM.places` gives each place its coordinates and its country; the critique checks the point against the country raster and fails one in the sea or across a border (latitude and longitude swapped is the usual cause). Coordinates come from the user's own data or a gazetteer, logged in `BRIEF.md`.
- **Every number comes from the data.** `FILM.data` holds each dataset with the BRIEF.md Facts row it comes from; cards, region stats and the total count up to values formatted from it, and text shows a value with `{ref}`. A number typed into a line fails the critique unless it is declared `literal` (a year, a version).
- **Real data, sourced; demo data, labelled.** Numbers come from the user's own data or the product's live pages. Invented numbers are for demos only, and the source line and the lockup say so on screen. See [reference/brief.md](reference/brief.md).
- **Study a reference's craft, never its brand.** A film the user admires teaches timing, camera, density and light. Its name, logo, copy, colours as a brand and its data stay out; the product's own mark goes in `FILM.brand`.
- **The camera stays above the world.** It never goes lower than `globe.minAlt` (400 km), its horizon never falls behind it, and it holds still long enough for each card to be read.
- **`seek(t)` is pure.** No timers, `Date`, `Math.random`, state or CSS animation; seeded randomness only; the context's stroke state is reset every frame. Layout is measured once, after the fonts load.
- **One file.** Fonts and the world dataset embedded; nothing loads over the network. The build enforces it.
- **Look before you ship.** Numbers pass while frames look wrong: read the stills and the decoded frames, every place name and every printed value against the brief.
- **The user decides what leaves the machine.** Get a yes before any commit, push or upload.

## Workflow

0. **Once per machine.** `node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" doctor` checks Node 20+, playwright-core, a Chromium, ffmpeg with libx264, ffprobe, npm and tar, and prints the exact command for anything missing (usually `npm install --prefix "${CLAUDE_SKILL_DIR}" --no-package-lock`, or `npm i -D playwright-core` in the user's project). Re-run it until it says `DOCTOR OK`.
1. **Brief, places and data.** Name the video type first (a launch, a feature highlight, a year in review...): [reference/video-types.md](reference/video-types.md) gives each type its length, formats and beats. Get the places (city, country, coordinates), what to count at each (the user's export or report, with its period), the story (which regions, in what order) and the brand (name, mark as SVG path data, tagline, URL). Ask at most one round of questions, or use the defaults: 1920 x 1080 (16:9) master, 60 fps, 25 to 35 s, `loop: 'none'`, sound with a bed at -14 LUFS, the template's palette. 9:16 and 1:1 come from the same file when asked for. Fill [templates/BRIEF.md](templates/BRIEF.md) into `videos/<film>/BRIEF.md` (it is shared by every style: replace its format, loop, tempo and sound lines with the defaults above, and its GIF size with 320 x 180): one Facts row per dataset and one for the places. With no data there is only a demo, labelled as one.
2. **Story pass.** Open (the globe forms, routes arc over it, one line of subtitle), 2 to 4 regions (a dive to the first, a hop to a neighbour, a flight across an ocean), 2 to 4 pins a region each with a card, the pull back with the total, the lockup. One finding a card (a count and a second count), at most two cards open at once. Show the user the beats and proceed unless they object. See [reference/globe-craft.md](reference/globe-craft.md).
3. **Design spec.** Fill [templates/DESIGN.md](templates/DESIGN.md) into `videos/<film>/DESIGN.md`: canvas and formats, the places with their checks, the data, the story beat by beat on a time line, the camera per beat, the cards, the HUD, palette and type, the sound map. Read [reference/globe-craft.md](reference/globe-craft.md) and [reference/engine.md](reference/engine.md).
4. **Build and measure.** Copy [templates/film.html](templates/film.html) to `videos/<film>/src/film.html` and transcribe DESIGN.md into its `FILM` block (edit nothing below it). Fetch the fonts, build, and read the measured layout:
   ```bash
   node "${CLAUDE_SKILL_DIR}/scripts/fonts.mjs" videos/<film>
   node "${CLAUDE_SKILL_DIR}/scripts/build.mjs" videos/<film>
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" layout videos/<film>    # places, regions, pin times, cards, arcs, HUD boxes
   ```
   The layout prints each region's arrival and altitude, each pin's time (automatic after a flight: when the camera has it in the middle of the frame), each card's side and window. Write the final times into DESIGN.md. For 9:16 and 1:1 add a patch to `FILM.formats` (engine.md, Formats). See [reference/fonts.md](reference/fonts.md) and [reference/core.md](reference/core.md).
5. **Stills and critique.** `node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" stills videos/<film>` runs the critique (places, data and numbers, the source line, arcs, the camera, every card for its whole life, reading times, live area, contrast over the real backdrop, glyphs, palette roles, composition, audio) and writes a still per beat and card plus `stills/contact.png`. Read the contact sheet and the full-size stills; fix and repeat until it passes with 0 FAIL and 0 WARN and looks right. Run it again with `--format 9:16` and `--format 1:1` for each delivered format. See [reference/review.md](reference/review.md).
6. **Render and verify.**
   ```bash
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" loopcheck videos/<film>   # loop 'none': the purity lines must be 0
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" render videos/<film>      # MP4 with sound, GIF, poster (in the background)
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" verify videos/<film>      # ffprobe facts, tags, audio, decoded pixels
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" mp4frames videos/<film>   # decoded review frames + PSNR
   ```
   A 30 s film at 1080p renders in about 12 minutes on 4 cores (2.6 frames a second: the example's flights took up to 23 motion-blur samples a frame, of at most 64). The default `--crf 16` makes a 30 s film of moving dots about 38 MB; `--crf 28` about 7.5 MB and `--crf 30` about 6 MB, the dots and the card text intact. Run `render`, `verify` and `mp4frames` once per delivered format with its `--format` flag. Look at `stills/mp4/contact.png`, and at a flight frame and a card frame full size. Report the files, their sizes, the critique counts and the verify, loopcheck and mp4frames lines. See [reference/render.md](reference/render.md) and [reference/audio.md](reference/audio.md).

## Pass criteria

- Every place lies in its named country; every arc joins two checked places; every number on screen is formatted from `FILM.data`, every dataset cites a Facts row, and the source line is on screen whenever a number is.
- The camera never goes below `globe.minAlt` and its horizon never falls behind it; flights follow great circles and land without overshoot.
- Every card stays inside the live area, clear of the other cards, the HUD blocks and the beams, for its whole life, and is open at least 0.9 s; at most two at once; the subtitle, each region title and the total hold long enough to read.
- Text over the globe at least 4.5:1 (3:1 for display type) against what is really behind it, measured on the frame drawn without its text.
- The composition passes at every delivered format, and each format looks designed for its frame.
- Motion blur on every moving frame, its samples set by how far the world moves (up to 64), one sample on still ones.
- The deliverable MP4 is H.264, yuv420p, BT.709-tagged, faststart, exactly DUR x FPS frames, with AAC sound at the target loudness.

## Known pitfalls

- A card closes when its region is left: the last pin of a region needs its card open 0.9 s before the next beat's `at`. Move the next beat later (the critique warns under 0.9 s and fails under 0.6 s).
- After a flight the first pin waits for the camera to settle (`render.mjs layout` prints when): give the region enough time before the next beat, or the cards are squeezed.
- `fitView` pulls the camera back until every pin of a region sits in the middle of the frame, where its card has room: pins far apart (both coasts of a big country) give a wide shot. Split them into two regions.
- The land dots fall about 0.6 degrees apart, so a very small country (Monaco, Singapore, Bahrain) lights few dots or none; its pins and cards still work. Frame such a place from its neighbour or a wider view.
- The globe keeps its pixel size in every format (it is sized from the short side), so a 9:16 frame shows sky above and below: raise the camera's target with `globe.frame` and move the HUD blocks in.
- Card counts ease out over 0.84 s; a count that starts late is still rolling in the card's rest still. Do not shorten the card's life below its counts.
- Moving dots cost bitrate: a 30 s 1080p MP4 is about 38 MB at the default CRF 16 (raise `--crf`, above). The PNG posters are about 2.6 MB each, the grain and the dots do not compress; the preview GIF defaults to 320 x 180, 8 fps, 32 colours, about 3 MB for 30 s.
- A beam whose base turns behind the limb rises from the horizon; a pin that is out of sight for most of its card's life fails. Re-aim the region's `view`.
- The world dataset (the template's WORLD block) adds 145 KB to every film; it is what lets the critique check places offline.
