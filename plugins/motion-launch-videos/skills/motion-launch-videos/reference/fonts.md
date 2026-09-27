# Fonts: fetched, embedded, checked

The film embeds its fonts as base64 WOFF2 so the HTML file is complete on its own. Nothing loads at runtime, from Google Fonts or anywhere else; the build refuses a page that would fetch anything over the network.

## The default faces

| Role | Face | Why |
|---|---|---|
| display | Archivo Black 400 | a very heavy grotesque with tight, even caps; it fills a justified measure without looking stretched |
| label | Syne 800 | a wide, idiosyncratic display face for small labels, a clear second voice |
| mono | IBM Plex Mono 500 | crumbs and typed text; a sturdy mono that stays legible at 32 px under motion blur |

All three are under the SIL Open Font License 1.1 and come from Fontsource.

## Fetch

```bash
node <skill>/scripts/fonts.mjs videos/<film>
```

It runs `npm pack @fontsource/<package>@5` for each face (a registry download; nothing is installed), extracts the Latin WOFF2 subset and the licence text, and writes `videos/<film>/fonts/<package>-latin-<weight>-normal.woff2` and `OFL-<package>.txt`. It prints size and md5 for each file, and any of € É × ’ – — · the file lacks.

Other faces: `--face <fontsource-package>:<weight>` (repeat for each), for example `--face space-grotesk:700`. Then add a matching `@font-face` rule in `src/film.html`, with the token `__FONT:<file>.woff2__` as its source, and point a role in `FILM.fonts` at it. Check the package's licence (the script warns when it is not the OFL).

Do not commit the WOFF2 files to the skill or to an example's source; commit the licence texts next to any built HTML that embeds them.

## Embed

`node <skill>/scripts/build.mjs videos/<film>` replaces every `__FONT:<file>__` with the file's base64 and writes `videos/<film>/<film>.html`. It adds an HTML comment at the top naming each embedded font and its copyright line under the OFL. It fails if a font file is missing, if a token is left over, or if the page references anything over the network.

Every `@font-face` uses `font-display: block`, and `window.ready` awaits `document.fonts.load` for each role with every character the film uses, then throws if a face did not load. Layout is measured only after that, so text is never measured in a fallback font.

## Coverage: read the font, not the browser

The Latin subset covers U+0000 to U+00FF (so É, ×, · and the Latin-1 letters), Œ œ, curly quotes, dashes, the ellipsis, € and ™, and the arrows ↑ ↓, and nothing else. A character outside it silently falls back to a system font in the browser, and the browser cannot tell you: every fallback test (measuring against two different fallback stacks, or against the bare fallback) gives false answers for characters the system fonts share.

So `render.mjs stills` reads each embedded face's own cmap table (`scripts/cmap.mjs`, a WOFF2 reader with no dependencies) and checks every character each face must draw, including the scramble's A-Z and 0-9. A missing character fails the critique.

```bash
node <skill>/scripts/cmap.mjs videos/<film>/fonts/syne-latin-800-normal.woff2 "ÉTÉ → 2026"
```

For a language outside Latin-1, fetch `--subset latin-ext` (or the script's subset) for that face and check again.

## After changing a font

Re-run `render.mjs layout` and `stills`. Sizes from `fit`, cap heights, ink gaps and the mask anchor all come from the face; a new face invalidates every baseline decision in DESIGN.md until you have looked again.
