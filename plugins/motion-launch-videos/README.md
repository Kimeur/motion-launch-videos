# motion-launch-videos

Short looping launch videos made in code, in eight styles, each its own skill: kinetic type, flat shape animation, cartoons, 3D, data charts, pixel art, particles and app UI demos. Claude writes each film as one self-contained HTML canvas file whose `seek(t)` draws any frame from the time alone, reviews its own stills with an automated critique, then renders the film to MP4, a preview GIF and a poster with real motion blur and a verified seamless loop.

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

Ask for a film in plain words, for example: "Make a 12 second launch bumper for https://example.com", "Make a cartoon mascot loop for our app", or "Make a 3D sting of our wordmark". Claude picks the skill, reads the product's public site, writes three to five short beats, designs and builds the film, critiques it and renders it.

## What it runs, fetches and sends

Everything runs on your machine, inside the project you are working in.

- **Reads the product's public web pages** that you point it at, to take the copy from the product's own words.
- **Fetches open-source fonts** named by each film (SIL Open Font License faces such as Archivo Black, Unbounded, Lilita One, Fredoka, IBM Plex Mono) from the npm registry with `npm pack @fontsource/...`, and embeds them in the film's HTML file.
- **Installs one npm package**, `playwright-core` 1.63.0, next to a skill's scripts (or in your project), to drive a local headless Chromium. If no Chromium is found, it can install Playwright's Chromium build (a download from Playwright's CDN). `render.mjs doctor` prints the exact command first.
- **Runs your local ffmpeg and ffprobe** to encode and verify the MP4.
- **Reads only local paths from the environment:** `CHROME_PATH`, `PLAYWRIGHT_BROWSERS_PATH`, `FFMPEG_PATH`, `FFPROBE_PATH` and `PATH`, to find programs already on your machine. It reads no credentials and needs no API keys.
- **Sends nothing anywhere else.** No analytics, no accounts, no API keys, no data leaves your machine apart from the package and font downloads above. The 3D skill's renderer is inline WebGL2; no 3D library is downloaded.

## Requirements

Node 20 or newer, ffmpeg with libx264, and a Chromium (an existing Chrome, Playwright's cached build, or `CHROME_PATH`). `node <skill folder>/scripts/render.mjs doctor` checks all of it.

## License

MIT. Source, examples and full documentation: https://github.com/Kimeur/motion-launch-videos
