# motion-launch-videos

Short launch and social videos made in code, in eleven styles, each its own skill: kinetic type, flat shape animation, cartoons, 3D, data charts, pixel art, particles, app UI demos, photo reels, captioned clips and overlays for editors. Claude writes each film as one self-contained HTML canvas file whose `seek(t)` draws any frame from the time alone, reviews its own stills with an automated critique, then renders the film to MP4, a preview GIF and a poster with real motion blur and a verified seamless loop, at 1:1, 9:16 or 16:9, with sound when it needs it and with transparency for overlays.

| Skill | What it makes |
|---|---|
| `motion-launch-videos` | kinetic-typography bumpers and identity stings |
| `motion-shapes` | flat 2D motion graphics: icons that draw on, pop and ripple, wipes, animated SVG logos |
| `motion-cartoon` | an original mascot that hops, waves, talks and holds up the product's name |
| `motion-3d` | extruded 3D type and logos, primitives, soft shadows, a moving camera |
| `motion-charts` | animated charts from sourced data |
| `motion-pixel` | pixel-art loops with sprites, parallax and a bitmap font |
| `motion-particles` | particle swarms that form words and logos |
| `motion-ui` | app and product UI demos in a device frame |
| `motion-photo` | product and photo reels from your own images |
| `motion-captions` | captioned clips from your own voice-over or podcast, every word on the frame it is said |
| `motion-overlays` | lower thirds, title cards, end screens and corner bugs with transparency, for video editors |

Ask for a film in plain words, for example: "Make a 12 second launch bumper for https://example.com", "Make a cartoon mascot loop for our app", or "Make a 3D sting of our wordmark". Claude picks the skill, reads the product's public site, writes three to five short beats, designs and builds the film, critiques it and renders it.

## What it runs, fetches and sends

Everything runs on your machine, inside the project you are working in.

- **Reads the product's public web pages** that you point it at, to take the copy from the product's own words.
- **Fetches open-source fonts** named by each film (SIL Open Font License faces such as Archivo Black, Unbounded, Lilita One, Fredoka, IBM Plex Mono) from the npm registry with `npm pack @fontsource/...`, and embeds them in the film's HTML file.
- **Installs one npm package**, `playwright-core` 1.63.0, next to a skill's scripts (or in your project), to drive a local headless Chromium. If no Chromium is found, it can install Playwright's Chromium build (a download from Playwright's CDN). `render.mjs doctor` prints the exact command first.
- **Reads the images and audio you give it** (product photos, screenshots, a voice-over, music) from the film's folder and embeds them in the film's HTML file. Use only files you own or may use.
- **Runs your local ffmpeg and ffprobe** to encode and verify the MP4 (and the sound, and the transparent .mov and .webm for overlays).
- **Reads only local paths from the environment:** `CHROME_PATH`, `PLAYWRIGHT_BROWSERS_PATH`, `FFMPEG_PATH`, `FFPROBE_PATH` and `PATH`, to find programs already on your machine. It reads no credentials and needs no API keys.
- **Sends nothing anywhere else.** No analytics, no accounts, no API keys, no data leaves your machine apart from the package and font downloads above. The 3D skill's renderer is inline WebGL2; no 3D library is downloaded.

## Requirements

Node 20 or newer, ffmpeg with libx264, and a Chromium (an existing Chrome, Playwright's cached build, or `CHROME_PATH`). `node <skill folder>/scripts/render.mjs doctor` checks all of it.

## License

MIT. Source, examples and full documentation: https://github.com/Kimeur/motion-launch-videos
