---
name: motion-charts
description: Make a looping animated data story, 6 to 20 seconds, from a brief and its numbers. A key metric counts up to its exact figure, bars and columns grow from zero with labels counting on the same spring, lines draw on, donuts sweep, a note points at the peak, the source always on screen. Claude writes the film as one self-contained HTML canvas file driven by a pure seek(t), binds every number to sourced data, runs a critique that fails dishonest charts (truncated axes, overshooting values, missing sources, parts that do not sum, legends, 3D), and renders MP4, GIF and poster with real motion blur and a verified seamless loop. Use it to "animate our numbers": a launch stat or milestone, a KPI or growth chart, a year in review, a before and after, a ranking. Not for numbers without a source. Other styles have their own skills: motion-launch-videos (kinetic type), motion-shapes, motion-cartoon, motion-3d, motion-pixel, motion-particles, motion-ui, motion-photo, motion-captions, motion-overlays and motion-globe.
---

# Motion charts

Numbers that move and stay true: a total counting up to the exact figure, columns growing from zero with their labels riding the tops, a line drawing across the months, a donut sweeping to its shares, a note pointing at the peak. The whole film is one HTML file that can draw any moment from the time alone, so it previews in any browser, renders frame-exact, and loops without a seam. Every number in it is formatted from the data, and the data cites its source.

The skill folder is `${CLAUDE_SKILL_DIR}`; the reference files call it `<skill>`. If the variable shows up literally or empty in your shell (you opened this file directly, as a subagent or from a copy), it is the folder that holds this SKILL.md: put that absolute path in every command below.

A film lives in the user's project at `videos/<film>/` (`BRIEF.md`, `DESIGN.md`, `src/film.html`, `fonts/`, the built `<film>.html`, `stills/`, `renders/`).

## Ground rules

- **Every number comes from the data.** `FILM.data` holds each dataset with its values, its format and the BRIEF.md Facts row it comes from; counters, chart labels and `{refs}` in text are formatted from it by the engine. A number typed into a title fails the critique unless the data holds it.
- **Real data, sourced; demo data, labelled.** Numbers come from the user's own data or the product's live pages, logged in `BRIEF.md` with where and when they were read. Invented numbers are for demos only, and the source line says so on screen. See [reference/brief.md](reference/brief.md).
- **Honest charts only.** Bars start at zero; no truncated, broken, dual or log axes, no 3D, no legends; a donut has at most 5 slices and its parts make the whole; every mark is at least 3:1 on its background and distinguishable from its neighbours, also under colour-blindness simulation. See [reference/data-design.md](reference/data-design.md).
- **Data moves on critically damped springs.** ζ = 1 for anything bound to data, or a bar passing 100 on its way to 100 shows 108. Counters land exactly on the formatted value, in fixed digit slots that never jitter.
- **A source line whenever a number is on screen,** and every value landed in its scene's rest still.
- **One finding a beat, four words a beat, one call to action.**
- **`seek(t)` is pure.** No timers, `Date`, `Math.random`, state or CSS animation; seeded randomness only. Layout is measured once, after the fonts load.
- **One file.** Fonts embedded as base64; nothing loads over the network. The build enforces it.
- **The loop is exact.** In the default hold loop, frame 0 is the lockup at rest and equals the last frame: `loopcheck` reports a max diff of 0.
- **Look before you ship.** Numbers pass while frames look wrong; read the stills and the decoded frames, and every printed value against the brief.
- **The user decides what leaves the machine.** Get a yes before any commit, push or upload.

## Workflow

0. **Once per machine.** `node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" doctor` checks Node 20+, playwright-core, a Chromium, ffmpeg with libx264, ffprobe, npm and tar, and prints the exact command for anything missing (usually `npm install --prefix "${CLAUDE_SKILL_DIR}" --no-package-lock`, or `npm i -D playwright-core` in the user's project). Re-run it until it says `DOCTOR OK`.
1. **Brief and data intake.** Name the video type first (a launch bumper, a feature highlight, a testimonial, an event promo...): [reference/video-types.md](reference/video-types.md) gives each type its length, formats, beats and the styles that fit. Read the product's live site and get the numbers: the user's own export or report, or figures the live site states today. Ask at most one round of questions (the story, the numbers with their source and period, formats, duration, palette), or use the defaults: 1080 x 1080, 12 s, 60 fps, 120 BPM, muted, hold loop, brand colours from the site's CSS. The 1:1 film is the master; 9:16 (1080 x 1920) and 16:9 (1920 x 1080) are delivered when asked for, from the same file. Fill [templates/BRIEF.md](templates/BRIEF.md) into `videos/<film>/BRIEF.md`: one Facts row per dataset, with its values, unit, period and source. With no data there is only a demo, labelled as one. See [reference/brief.md](reference/brief.md).
2. **Story pass.** 3 to 5 beats, each one finding and the chart that shows it: a total counting up (the hook), a breakdown or a ranking, a trend or a share, the call to action. Title each chart with its finding in at most 4 words (`OAT MILK LEADS.`, not `MILK SHARE`). Show the user the beats and proceed unless they object; when nobody can answer, write them into BRIEF.md and proceed. See [reference/data-design.md](reference/data-design.md).
3. **Design spec.** Fill [templates/DESIGN.md](templates/DESIGN.md) into `videos/<film>/DESIGN.md`: canvas and grid, the data (every number, its format, its Facts row), palette roles with the chart colours measured, type roles, then every scene (chart box, axis, labels, grow timing, highlight and notes, transition) on the tempo grid, and the loop seam. Read [reference/data-design.md](reference/data-design.md), [reference/engine.md](reference/engine.md) and [reference/springs.md](reference/springs.md).
4. **Build and measure.** Copy [templates/film.html](templates/film.html) to `videos/<film>/src/film.html` and transcribe DESIGN.md into its `FILM` block, data first (edit nothing below it; the build copies the title, the background and the canvas size into the page head). Fetch the fonts, build, and read the measured layout:
   ```bash
   node "${CLAUDE_SKILL_DIR}/scripts/fonts.mjs" videos/<film>
   node "${CLAUDE_SKILL_DIR}/scripts/build.mjs" videos/<film>
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" layout videos/<film>    # datasets, sizes, plot geometry, label boxes
   ```
   Put text baselines on the 8 px grid from the reported cap heights, check the datasets it prints against BRIEF.md, then write the final numbers into DESIGN.md and FILM together. For each extra format, add a patch to `FILM.formats`: a taller chart and bigger type at 9:16, the title beside a wider plot at 16:9 (engine.md, Formats). See [reference/fonts.md](reference/fonts.md) and [reference/core.md](reference/core.md).
5. **Stills and critique.** `node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" stills videos/<film>` runs the automated critique: the numbers (bound to data, sourced, on screen with their source, landed at rest, no free numbers), honest charts (zero baselines, axes, data springs, slices and wholes, colours, direct labels), and the picture (glyph coverage, words per beat, live area, collisions, contrast, palette roles, the loop, blank frames, composition), then the palette gate, and writes stills plus `stills/contact.png`. Read the contact sheet and the full-size stills; fix and repeat until it passes and looks right. Run it again with `--format 9:16` or `--format 16:9` for each other delivered format (stills in `stills/9x16/`, `stills/16x9/`). See [reference/review.md](reference/review.md).
6. **Render and verify.**
   ```bash
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" loopcheck videos/<film>   # hold loop: every diff must be 0
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" render videos/<film>      # MP4, GIF, poster
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" verify videos/<film>      # ffprobe facts, tags, decoded pixels
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" mp4frames videos/<film>   # decoded review frames + PSNR
   ```
   Run `loopcheck`, `render`, `verify` and `mp4frames` once per delivered format, each with its `--format` flag (outputs `renders/<film>-9x16.mp4`, `preview-9x16.gif`, `poster-9x16.png`). Look at `stills/mp4/contact.png` and the growth, highlight and transition frames full size. Report the files, their sizes, the critique counts and the verify, loopcheck and mp4frames lines. See [reference/render.md](reference/render.md) and [reference/loops.md](reference/loops.md).

## Pass criteria

- Every number on screen is formatted from `FILM.data`, every dataset cites a Facts row, and the source line is on screen whenever a number is.
- Bars and columns start at zero; every value sits inside its axis; a donut's parts make its whole; no legends, dual axes or 3D.
- Values bound to data move on ζ = 1 springs; labels count on their bar's own spring in fixed slots; every value has landed in its scene's rest still.
- One finding a beat, stated in at most 4 words; the accent on the mark the finding is about; something moves on every beat; transitions vary (circle, wipe, cut, overlap).
- Every mark at least 3:1 on its background, a chart's colours at least dE 15 apart (8 under CVD simulation); display type at least 3:1, labels and small print at least 4.5:1.
- Every label and mark inside the live area, baselines on the grid, no label colliding with a label or a mark.
- The composition passes at every delivered format, and each format looks designed for its frame: a taller chart and bigger type at 9:16, the title beside a wider plot at 16:9.
- Motion blur on every moving frame, one sample on still ones, never across a cut or a wipe's swap.
- The deliverable MP4 is H.264, yuv420p, BT.709-tagged in the stream, faststart, exactly DUR x FPS frames.

## Known pitfalls

- A critically damped count shows its last digit late: about 1.4 s after COUNT starts for a 5-digit number (the table in engine.md). Start counts early in their scene, or the landed check fails.
- `enter` moves the element, `grow` moves the data. A chart with only `enter` shows its values from its first frame; a `grow` on an underdamped spring fails the critique.
- Labels are laid out in slots from the widest value they will show, and placed by their final value: during a count a centred number grows leftward from its final right edge.
- A face with proportional figures looks loose in fixed slots (a narrow 1 in a digit-wide slot). Inter and IBM Plex have tabular figures by default.
- A donut's centre counts its slice as the sweep crosses it: put that slice first, or the centre sits at 0 % while the others sweep.
- The source line types from the scene's first data (a chart's axis, a counter's entrance) and leaves when the last of its charts starts to leave; at a cut it starts with its cursor, and a scene that ends on a cut or a wipe keeps it to the end.
- A highlight cross-fades between two fills for about 0.15 s, and its accent frame is the landing. Keep the base fill a neutral, so the fade cannot pass through a third hue.
- A note's anchor rides its data point: a note that starts while its bar still grows swings its leader. Start notes after the chart lands.
- A retarget keeps one axis for both datasets, so a retarget to a much larger dataset leaves the first one's bars short. When the scales differ, cut to a new chart.
- In a hold loop nothing of the first scene may show at t 0, not even a typing cursor: its first entrance starts on a 16th after 0.
- At 9:16 a donut cannot simply grow: its side labels need room outside the ring. Move it off centre, away from its labels, or keep it the size it is.
- Negative numbers print with a true minus (U+2212). The template's faces have it in their Latin subsets; check the cmap if you change faces.
