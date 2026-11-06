---
name: motion-story
description: Make a vertical story short, 45 to 120 seconds, told in the second person ("You just robbed a bank. Your partner is an hour late...") that ends on a choice the viewer answers in the comments. A synthetic voice-over made on this machine, its words popping on screen as they are said, a drawn set per scene (a car at night, a back seat of cash, a city map, a motel, a phone, a counting table, TV news, the question card), a hero in a beanie, HUD cards (cash counter, clock, countdown), rain, neon and a score. Claude writes the script and one HTML canvas film driven by a pure seek(t), voices it with Kokoro, times every word, checks it and renders a 1080 x 1920 MP4 with sound. Use it for what-would-you-do dilemmas made to start a debate in the comments. Not for real people, real crimes or news, or 16:9. Other styles have their own skills (motion-cartoon, motion-captions, motion-pixel...).
---

# Motion story

A dilemma told to the viewer as if it were happening to them: a hook in the first line, a plan, a wait, a twist or two, and a last card that asks what they would do. The comments are the point: a choice with two defensible answers gets people arguing under the video. The whole film is one HTML file that draws any moment from the time alone, so it previews in any browser and renders frame-exact.

The skill folder is `${CLAUDE_SKILL_DIR}`; the reference files call it `<skill>`. If the variable shows up literally or empty in your shell (you opened this file directly, as a subagent or from a copy), it is the folder that holds this SKILL.md: put that absolute path in every command below.

A film lives in the user's project at `videos/<film>/` (`STORY.md`, `DESIGN.md`, `src/film.html`, `assets/` with the voice and its timing, `fonts/`, the built `<film>.html`, `stills/`, `renders/`).

## Ground rules

- **Fiction, and it says so.** Invented people and places only: no real person, company, case, crime or news story, no lookalike of one. The hero is the skill's own bean in a beanie (or the user's own character). The post says it is fiction.
- **Nothing that teaches harm.** A heist, a scam or an escape stays at the level of a story: no working method, no weapon detail, no real place to rob. No gore, no sexual content, no real-world group targeted.
- **The voice is synthetic and labelled.** Kokoro on this machine, one of its stock voices; never a clone of a real person. The post or the description says the voice is AI.
- **Two good answers.** The last question has two choices a reasonable viewer could each defend. A question with an obvious answer gets no comments.
- **`seek(t)` is pure.** No timers, `Date`, `Math.random`, state or CSS animation; seeded randomness only.
- **One file.** Fonts and the timing embedded; nothing loads over the network. The voice WAV is mixed in at render time.
- **Look and listen before you ship.** Read the stills and the decoded frames; play the MP4 with sound.
- **The user decides what leaves the machine.** Get a yes before any commit, push, upload or post.

## Workflow

0. **Once per machine.** `node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" doctor` (Node 20+, playwright-core, a Chromium, ffmpeg, ffprobe, npm, tar; it prints the fix for anything missing, usually `npm install --prefix "${CLAUDE_SKILL_DIR}" --no-package-lock`). The voice needs Kokoro in a Python 3.10+:
   ```bash
   python3 -m venv ~/.venvs/kokoro && ~/.venvs/kokoro/bin/pip install kokoro-onnx soundfile
   export HYPERFRAMES_PYTHON=~/.venvs/kokoro/bin/python
   ```
   `npx hyperframes tts` and `npx hyperframes transcribe` (whisper) download their models on first use.
1. **The story.** Agree the premise in one line with the user, or pick one: [reference/story-craft.md](reference/story-craft.md) has the shape (hook, plan, wait, twist, the ask), the rules for each line and a list of premises. Write it into `videos/<film>/STORY.md` from [templates/STORY.md](templates/STORY.md): premise, the two answers, the scenes with their lines, what is never shown, and the post. Defaults: English, 1080 x 1920, 30 fps, about 60 to 80 s, voice `am_michael`.
2. **The film block.** Copy [templates/film.html](templates/film.html) to `videos/<film>/src/film.html` and edit only its `FILM` block: one scene per beat, each with its `set`, its `say` lines (marks for coloured words), its camera, hero, HUD cards and set options. Fill [templates/DESIGN.md](templates/DESIGN.md). See [reference/engine.md](reference/engine.md).
3. **The voice.**
   ```bash
   node "${CLAUDE_SKILL_DIR}/scripts/voice.mjs" videos/<film> --check   # the script, its word count, the spoken forms
   node "${CLAUDE_SKILL_DIR}/scripts/voice.mjs" videos/<film>           # assets/voice.wav, assets/timing.json, DUR
   ```
   It speaks each line once and keeps it (re-runs only speak what changed), times every word, lays the lines end to end and sets `DUR`. A `WARN timing` line means the transcriber missed words in that line: their times are spread by length; check them in the stills. Run it again after any change to a line, the voice or the gaps.
4. **Build.**
   ```bash
   node "${CLAUDE_SKILL_DIR}/scripts/fonts.mjs" videos/<film>
   node "${CLAUDE_SKILL_DIR}/scripts/build.mjs" videos/<film>
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" layout videos/<film>   # every scene's window, every caption group
   ```
5. **Stills and critique.** `node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" stills videos/<film>` runs the critique (the voice matches DUR and the scenes, every scene long enough to read and under 9 s, the hook inside 3 s, the film ends on the question, captions inside the live area and their contrast, glyphs, palette roles) and writes two stills per scene plus `stills/contact.png`. Read them: is the caption clear of the hero's face, does every card read, does each set say where we are at a glance? Fix and repeat. See [reference/review.md](reference/review.md).
6. **Render, verify and listen.**
   ```bash
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" render videos/<film>     # renders/<film>.mp4 with the voice and the score
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" verify videos/<film>
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" mp4frames videos/<film>
   ```
   Play it with sound once. Report the files, their sizes and the verify lines.
7. **The post.** Write the caption into STORY.md: the premise in one or two lines, the question with its two answers ("STAY or RUN? 👇"), that it is fiction with an AI voice, 3 to 5 hashtags. See story-craft.md, The post.

## Pass criteria

- The first line is the hook and ends inside 3 s; frame 0 already shows the scene, never black.
- Every line is short (under about 12 words), in the present tense, in the second person.
- Every scene holds 1.2 to 9 s; a new picture at least every 6 s or so.
- Captions are clear of the hero's face and of the HUD cards in every still; the coloured words are the ones that carry the story (money, names, times, the twist), two or three a scene at most.
- The last scene is the question card with exactly two answers, and the post asks the same question.
- The MP4 is 1080 x 1920, H.264, yuv420p, BT.709, faststart, exactly DUR x FPS frames, with AAC sound at the loudness in `FILM.audio`.

## Known pitfalls

- A changed line without re-running `voice.mjs`: the critique fails `voice timing` or `voice scenes`. Run it again; unchanged lines are reused.
- Numbers and times are read by the voice as written: "11:52" can come out wrong. Give the line a `speak` form ("eleven fifty two") and keep the digits on screen.
- A hero whose `ground` puts the face at the caption line (y about 1250 to 1350) is hidden by the captions. Put the feet near the bottom (1750 to 1800) or the head above 1150.
- Captions are white with an ink outline and survive any set; HUD cards sit at y 300 by default. Two cards in one scene need different `y`.
- Kokoro speaks one line at a time: a question mark lifts the end of a line; three dots do not make a pause. Split a line where you want a breath, or raise `voice.gap`.
- The sets are drawn for 9:16; other formats render but are not staged for (the critique warns).
