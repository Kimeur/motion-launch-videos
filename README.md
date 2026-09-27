# motion-launch-videos

Turn a short brief into a looping kinetic-typography launch video with Claude Code: one self-contained HTML file, rendered to MP4 with real motion blur and a seamless loop.

![A 12 second launch bumper for Crux, made with this skill](examples/crux-launch/preview.gif)

Made with this skill: a 12 s launch bumper for [Crux](https://cruxpost.com), the author's product. Every word on screen is taken from the live site, with sources in [BRIEF.md](examples/crux-launch/BRIEF.md). Files: [MP4](examples/crux-launch/crux-launch.mp4), [the single HTML file](examples/crux-launch/crux-launch.html), [design spec](examples/crux-launch/DESIGN.md).

You give it a product and what the film should say, or just a URL. Claude reads the product's site, writes 3 to 5 beats of at most four words each, lays every beat out on a baseline grid, and writes the whole film as one HTML canvas page that can draw any frame from the time alone. Then it checks the film for cramped type, missing glyphs, off-palette colours and loop errors, renders it frame by frame with subframe motion blur, and verifies the MP4 it delivers.

## Install

As a plugin, from this repo's marketplace (run these inside Claude Code):

```
/plugin marketplace add Kimeur/motion-launch-videos
/plugin install motion-launch-videos@motion-launch-videos
```

Without the plugin system, clone the repo and put the skill where Claude Code looks for personal skills:

```bash
git clone https://github.com/Kimeur/motion-launch-videos
mkdir -p ~/.claude/skills
cp -R motion-launch-videos/plugins/motion-launch-videos/skills/motion-launch-videos ~/.claude/skills/
```

For a whole team, check the same folder into the project as `.claude/skills/motion-launch-videos/` instead.

## Requirements

- **Node 20 or newer.** The scripts need one package, `playwright-core`; Claude installs it next to the scripts with `npm install --prefix <skill folder> --no-package-lock`, or you add it to your project with `npm i -D playwright-core` (that one survives plugin updates). Nothing is installed globally.
- **ffmpeg and ffprobe** with libx264 (`brew install ffmpeg`, `apt install ffmpeg`).
- **A Chromium.** Any of: `CHROME_PATH`, a Chromium already in the Playwright cache, a system Google Chrome, or the one playwright-core installs.
- **Network access** once per film, to fetch the fonts from the npm registry.

`node <skill folder>/scripts/render.mjs doctor` checks all of this and prints the exact command for anything missing, including the Chromium install line.

## Use

Ask for a film in plain words, from inside your project:

> Make a 12 second launch bumper for https://example.com

What happens next:

1. **Brief.** It reads the live site, asks at most one round of questions (message, format, duration, palette) or uses the defaults, and writes `videos/<film>/BRIEF.md` with every fact and the URL it came from. No prices or numbers the site does not show. A product with no site (a demo, a fictional or unreleased product) takes its words from your brief only.
2. **Copy.** Hook, what it does, proof, call to action: at most four words a beat, one CTA, in the product's own words.
3. **Design spec.** `videos/<film>/DESIGN.md`: an 8 px baseline grid, palette roles with contrast ratios, type roles, and every beat's lines, springs and transitions on a 120 BPM grid.
4. **Build.** It copies the engine template, fills in its `FILM` config, fetches the fonts, builds one self-contained `videos/<film>/<film>.html`, and settles the baselines from the measured cap heights.
5. **Critique.** Review stills and a contact sheet, plus automated checks (glyph coverage, words per beat, live area, collisions, letter gaps, orphans, contrast, palette, loop tail, blank frames). It fixes what fails and looks again.
6. **Render and verify.** A pixel-exact loop check, then the MP4, a preview GIF and a poster, then ffprobe facts, colour tags, and decoded frames compared with the canvas and looked at.

### 30-second quick start

The engine template runs as it is: an 8 s demo for a fictional product. On an Apple-silicon Mac with npm and a Chromium already in place, the stills take about 5 seconds and the full render about a minute.

```bash
git clone https://github.com/Kimeur/motion-launch-videos && cd motion-launch-videos
S=plugins/motion-launch-videos/skills/motion-launch-videos
npm install --prefix $S --no-package-lock
node $S/scripts/render.mjs doctor                  # everything in place? prints the fix if not
mkdir -p videos/demo/src && cp $S/templates/film.html videos/demo/src/film.html
node $S/scripts/fonts.mjs videos/demo
node $S/scripts/render.mjs stills videos/demo      # critique + stills/contact.png
node $S/scripts/render.mjs loopcheck videos/demo   # every diff must be 0
node $S/scripts/render.mjs render videos/demo      # renders/demo.mp4, preview.gif, poster.png
node $S/scripts/render.mjs verify videos/demo      # ffprobe facts and decoded pixels
node $S/scripts/render.mjs mp4frames videos/demo   # decoded review frames in stills/mp4/
```

Open `videos/demo/demo.html` in Chrome to preview it: Space pauses, the arrow keys step one frame.

## How it works

- **One file, one clock.** The film is a canvas page whose `seek(t)` draws any moment from `t` alone: no timers, no `Date`, no `Math.random`, no state between frames. Layout is measured once after the fonts load. Fonts are embedded as base64; the page loads nothing over the network.
- **Closed-form springs.** Every move is a sum of damped springs evaluated in closed form, one per target change, snapped to exactly 1 once settled, so any frame can be drawn on its own and the loop can be exact.
- **Kinetic type, one glyph at a time.** Kerning is recovered from `measureText` pair widths, optical pairs go on top, and lines are fitted so their ink spans the measure exactly. Glyphs enter on staggered springs on the tempo grid, with seeded scrambles and typed small print.
- **Designed accents.** Misregistration (two offset colour passes, never sharing a pixel) on landing frames only, a mask wipe through the outgoing line's own letterforms, and camera punch-ins and smash-pans on the beat.
- **Real motion blur.** Each frame averages 1 to 64 subframes sampled behind it on a 270-degree shutter, one per 5 px of movement, and never across a hard cut.
- **A verified seamless loop.** Frame 0 is the lockup at rest and the film ends by rebuilding it, so `loopcheck` can require every pixel of the seam to match exactly.
- **Checked output.** H.264 with BT.709 colour tags in the stream, faststart, exact frame count, and decoded frames (with an exact, not a fast, YUV-to-RGB conversion) compared with the canvas pixels.

## What's inside

```
plugins/motion-launch-videos/skills/motion-launch-videos/
├── SKILL.md              ground rules, workflow, pass criteria, pitfalls
├── package.json          one dependency: playwright-core
├── reference/            brief, design-spec, engine, springs, kinetic-type,
│                         techniques, motion-blur-loop, fonts, render, review
├── templates/
│   ├── film.html         the engine and a FILM config; runs as an 8 s demo
│   ├── BRIEF.md          fill-in brief with a sourced facts table
│   └── DESIGN.md         fill-in spec: grid, palette, type, beats, loop seam
└── scripts/
    ├── fonts.mjs         fetch Latin WOFF2 subsets and OFL texts from Fontsource
    ├── build.mjs         embed the fonts, write the single HTML file
    ├── render.mjs        doctor | stills | loopcheck | render | verify | mp4frames | at | frame | layout
    └── cmap.mjs          which characters a WOFF2 really contains
examples/crux-launch/     the showcase: brief, spec, source, built HTML, MP4, GIF, poster
```

## Credits

- Fonts: [Archivo Black](https://github.com/Omnibus-Type/ArchivoBlack), [Syne](https://gitlab.com/bonjour-monde/fonderie/syne-typeface) and [IBM Plex Mono](https://github.com/IBM/plex), all under the SIL Open Font License 1.1, via [Fontsource](https://fontsource.org). The skill ships no font files: `fonts.mjs` fetches them for each film. The example's built HTML embeds them, and their licence texts are in [examples/crux-launch/OFL](examples/crux-launch/OFL).

## License

The skill's code and documentation are under the MIT licence ([LICENSE](LICENSE)). The fonts are not covered by it: they stay under the SIL OFL 1.1.
