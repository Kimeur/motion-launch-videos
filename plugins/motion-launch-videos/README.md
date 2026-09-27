# motion-launch-videos

Turn a short brief into a looping kinetic-typography launch video. Claude writes the whole film as one self-contained HTML canvas file whose `seek(t)` draws any frame from the time alone, reviews its own stills for cramped type, missing glyphs, contrast and palette errors, then renders the film to MP4, a preview GIF and a poster with real subframe motion blur and a pixel-exact seamless loop.

Ask for it in plain words, for example: "Make a 12 second launch bumper for https://example.com". The skill reads the product's public site, writes three to five short beats, lays them out on a baseline grid, builds the film, critiques it and renders it.

## What it runs, fetches and sends

Everything runs on your machine, inside the project you are working in.

- **Reads the product's public web pages** that you point it at, to take the copy from the product's own words.
- **Fetches three open-source fonts** (Archivo Black, Syne, IBM Plex Mono, SIL Open Font License) from the npm registry with `npm pack @fontsource/...`, and embeds them in the HTML file.
- **Installs one npm package**, `playwright-core` 1.63.0, next to its scripts, to drive a local headless Chromium. If no Chromium is found, it can install Playwright's Chromium build (a download from Playwright's CDN). `render.mjs doctor` prints the exact command first.
- **Runs your local ffmpeg and ffprobe** to encode and verify the MP4.
- **Reads only local paths from the environment:** `CHROME_PATH`, `PLAYWRIGHT_BROWSERS_PATH`, `FFMPEG_PATH`, `FFPROBE_PATH` and `PATH`, to find programs already on your machine. It reads no credentials and needs no API keys.
- **Sends nothing anywhere else.** No analytics, no accounts, no API keys, no data leaves your machine apart from the package and font downloads above.

## Requirements

Node 20 or newer, ffmpeg with libx264, and a Chromium (an existing Chrome, Playwright's cached build, or `CHROME_PATH`).

## License

MIT. Source, examples and full documentation: https://github.com/Kimeur/motion-launch-videos
