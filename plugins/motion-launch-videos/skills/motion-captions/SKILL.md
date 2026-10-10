---
name: motion-captions
description: Make a captioned clip, 15 to 60 seconds, from the user's own voice-over, podcast cut, interview or talking-head audio and its transcript. The words appear in time with the speech, as on Reels, TikTok, Shorts and LinkedIn, where most people watch muted - pop captions (1 to 3 big words, each popping as it is said), a karaoke line with a moving highlight, classic subtitles, or an audiogram with a speaker card and bars driven by the voice. Claude writes one HTML canvas file driven by a pure seek(t), lays the transcript out once without paraphrasing it, checks reading speed, time on screen, sync to the frame, contrast and the platforms' safe zones, and renders MP4 with the voice at 9:16, 1:1 or 16:9. Not for transcribing audio (bring a transcript) or films without a voice. Other styles have their own skills: motion-launch-videos (kinetic type), motion-shapes, motion-cartoon, motion-3d, motion-charts, motion-pixel, motion-particles, motion-ui, motion-photo, motion-overlays and motion-globe.
---

# Motion captions

A voice, and its words on screen as they are said: big pop captions that land word by word, a karaoke line whose highlight follows the speaker, classic subtitles at the foot of the frame, or an audiogram with the show's cover and bars that move with the voice. The whole film is one HTML file that draws any moment from the time alone, so it previews in any browser, renders frame-exact, and every word lights on the frame its start time falls in.

The skill folder is `${CLAUDE_SKILL_DIR}`; the reference files call it `<skill>`. If the variable shows up literally or empty in your shell (you opened this file directly, as a subagent or from a copy), it is the folder that holds this SKILL.md: put that absolute path in every command below.

A film lives in the user's project at `videos/<film>/` (`BRIEF.md`, `DESIGN.md`, `assets/` with the audio and the transcript, `src/film.html`, `fonts/`, the built `<film>.html`, `stills/`, `renders/`).

## Ground rules

- **The transcript is the Facts.** Captions show the speaker's words unchanged and in order. The only changes allowed are the ones the brief records: punctuation (trimmed or kept), letter case, and removed fillers ("um", "uh"). Never paraphrase, shorten, "fix" grammar or swap a word, even a wrong one: correct a misheard word only against the audio, with the user. See [reference/caption-craft.md](reference/caption-craft.md).
- **Only a voice the user may use.** Their own recording, or a guest's with the guest's permission, recorded in BRIEF.md. No clips of other people's shows, no voice of a real person made by a synthesiser. A synthetic voice for a demo is labelled synthetic.
- **True claims only.** Anything else on screen (the brand, the speaker's name, the show) comes from the brief. A product with no live site takes its words from the user's brief only; a demo says `DEMO COPY, FICTIONAL PRODUCT`. See [reference/brief.md](reference/brief.md).
- **`seek(t)` is pure.** No timers, `Date`, `Math.random`, state or CSS animation. The transcript, the layout and the voice's level per frame are computed once, after the fonts load.
- **One file.** Fonts, the transcript and the voice embedded; nothing loads over the network. The build enforces it.
- **Look and listen before you ship.** Read the stills and the decoded frames, and compare the waveform with the caption times.
- **The user decides what leaves the machine.** Get a yes before any commit, push or upload.

## Workflow

0. **Once per machine.** `node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" doctor` checks Node 20+, playwright-core, a Chromium, ffmpeg with libx264 and AAC, ffprobe, npm and tar, and prints the exact command for anything missing (usually `npm install --prefix "${CLAUDE_SKILL_DIR}" --no-package-lock`). Re-run it until it says `DOCTOR OK`.
1. **The audio, the transcript and the brief.** Name the video type first (a launch bumper, a feature highlight, a testimonial, an event promo...): [reference/video-types.md](reference/video-types.md) gives each type its length, formats, beats and the styles that fit. Ask for the audio file, its transcript with timings (word-level JSON from a transcription tool, or an SRT or VTT export), who is speaking and their permission, and in the same single round the style, the formats and the brand; or use the defaults: pop captions, a 9:16 master (1080 x 1920) with 1:1 and 16:9 from the same file, 60 fps, the clip's own length, `loop: 'none'`, the brand's colours. No transcript: ask for one; a machine transcript is a draft the user checks against the audio before it becomes Facts. Fill [templates/BRIEF.md](templates/BRIEF.md) into `videos/<film>/BRIEF.md`: the Facts table is the transcript, with the fillers and punctuation you changed, and the audio's source. See [reference/brief.md](reference/brief.md) and [reference/video-types.md](reference/video-types.md) (Captioned clip).
2. **Prepare the assets.** Put the audio and the transcript in `videos/<film>/assets/`. Chromium, which decodes the voice for the checks and the waveform, has no AAC decoder: give it MP3, WAV, OGG or FLAC (`ffmpeg -i in.m4a -c:a libmp3lame -b:a 128k assets/voice.mp3`). Trim a long recording to the clip first (`ffmpeg -ss 754.2 -to 781.9 -i episode.mp3 -c:a libmp3lame -b:a 128k assets/voice.mp3`) and shift the transcript to match, or keep the file and set `audio.offset`. See [reference/engine.md](reference/engine.md) (The voice and the transcript).
3. **Design spec.** Fill [templates/DESIGN.md](templates/DESIGN.md) into `videos/<film>/DESIGN.md`: the style, the caption block per format, the palette with contrast, the emphasised words (a few), and what else is on screen (brand, speaker, progress bar, card). Read [reference/caption-craft.md](reference/caption-craft.md) and [reference/engine.md](reference/engine.md).
4. **Build and measure.** Copy [templates/film.html](templates/film.html) to `videos/<film>/src/film.html` and edit only its `FILM` block: `DUR` is the clip's length, `audio.track` and `voice` name the same file. Fetch the fonts, build, and read the units the engine made:
   ```bash
   node "${CLAUDE_SKILL_DIR}/scripts/fonts.mjs" videos/<film>
   node "${CLAUDE_SKILL_DIR}/scripts/build.mjs" videos/<film>
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" layout videos/<film>    # every caption: its words, frames, reading speed, box
   ```
   The template runs as it is with the demo's files in [templates/assets/](templates/assets/): copy that folder to `videos/<film>/assets/` to try it. See [reference/fonts.md](reference/fonts.md) and [reference/core.md](reference/core.md).
5. **Stills and critique.** `node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" stills videos/<film>` runs the automated critique (every transcript word shown and unchanged, sync to the frame, reading speed, words per caption, time on screen, gaps, safe zones, contrast, the voice's length, decode and alignment, glyphs, palette, composition) and writes stills plus `stills/contact.png`. Read the contact sheet and the full-size stills; fix and repeat until it passes and looks right. Run it again with `--format 1:1` and `--format 16:9` for each other format. See [reference/review.md](reference/review.md).
6. **Render, verify and listen.**
   ```bash
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" loopcheck videos/<film>   # 'none': seek and renderFrame are pure
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" render videos/<film>      # MP4 with the voice, GIF, poster
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" verify videos/<film>      # the video, the AAC stream, the loudness
   node "${CLAUDE_SKILL_DIR}/scripts/render.mjs" mp4frames videos/<film>   # decoded review frames + PSNR
   ```
   Then compare a waveform of the MP4's sound with the caption times (review.md, Listen by numbers). Render the other formats with `--format`. Report the files, their sizes and the verify, loopcheck and mp4frames lines. See [reference/render.md](reference/render.md) and [reference/audio.md](reference/audio.md).

## Pass criteria

- Every transcript word on screen, in order, unchanged apart from the recorded punctuation, case and filler choices; no caption says anything the speaker did not.
- Every word lights (or its caption appears) on the frame that contains its start time.
- Reading speed at most about 17 characters a second; every caption on screen about 0.7 s or more; no flicker between captions.
- Pop captions 1 to 3 words; a karaoke line 3 to 7; subtitles 1 or 2 lines of at most 42 characters, broken at phrase boundaries.
- Caption text at least 4.5:1 against the stroke, box or backdrop it sits on.
- At 9:16 nothing sits in the platform's UI: the top 12 %, the right 16 % and the bottom fifth. Elsewhere the live area.
- The MP4 carries the voice (AAC, 48 kHz, stereo) at the target loudness, as long as the picture.

## Known pitfalls

- An `.m4a` or `.aac` voice fails to decode in the page (Chromium has no AAC decoder). Convert it to MP3.
- A transcript in the recording's time with a trimmed clip: set `audio.offset` to where the clip starts, or every word is late. The alignment row reports the lag it finds.
- SRT and VTT timings are per cue: word timings inside a cue are estimated from syllables, so a word may light a few frames off. Word-level JSON is exact.
- Words said faster than about 17 characters a second cannot be read, whatever the style; pop captions follow the voice, so a fast talker needs 1 or 2 words a caption.
- A word too wide for the block is set smaller (to 72 % at most); a karaoke line or a subtitle never is. Check `caption size` and the layout table.
- Colour emoji come from a system font and differ between machines: the engine draws its own icons from a short whitelist, off by default.
- A brand, a speaker's name or a progress bar in the bottom fifth at 9:16 is covered by the platform's buttons and caption: the safe zone row fails it.
