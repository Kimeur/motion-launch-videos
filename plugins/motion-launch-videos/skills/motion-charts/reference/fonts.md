# Fonts: fetched, embedded, checked

The film embeds its fonts as base64 WOFF2 so the HTML file is complete on its own. Nothing loads at runtime, from Google Fonts or anywhere else; the build refuses a page that would fetch anything over the network.

## Which faces

Each skill's template names its default faces in `@font-face` rules and in `FILM.fonts` (the skill's engine.md says why each was chosen). Any face from [Fontsource](https://fontsource.org) under the SIL Open Font License works. To change one:

1. Edit the `@font-face` rule in the page head: family, weight, and the token `__FONT:<package>-latin-<weight>-normal.woff2__` (for example `__FONT:space-grotesk-latin-700-normal.woff2__`).
2. Point the role in `FILM.fonts` at the same family and weight.
3. Fetch again (below), rebuild, and look: sizes, cap heights and spacing all come from the face.

Check the licence: `fonts.mjs` warns when a package is not under the OFL. A brand's own proprietary face cannot be embedded unless the user holds a licence that allows it; use the closest open face and say so in the brief.

## Fetch

```bash
node <skill>/scripts/fonts.mjs videos/<film>
```

With no arguments beyond the film, it reads the `__FONT:...__` tokens in `videos/<film>/src/film.html` (a film with none, such as pixel art in its own bitmap font, needs nothing) and fetches each face with `npm pack @fontsource/<package>@5` (a registry download; nothing is installed). It extracts the WOFF2 subset and the licence text into `videos/<film>/fonts/`, and prints each file's size and md5 and any of € É × ’ – — · the file lacks. `--face <package>:<weight>` fetches a face by hand; `--subset latin-ext` fetches another subset.

Do not commit WOFF2 files to the skill or to an example's source; commit the licence texts next to any built HTML that embeds them.

## Embed

`node <skill>/scripts/build.mjs videos/<film>` replaces every `__FONT:<file>__` with the file's base64 and writes `videos/<film>/<film>.html`, with an HTML comment at the top naming each embedded font and its copyright line. It fails if a font file is missing, a token is left over, or the page references anything over the network.

Every `@font-face` uses `font-display: block`, and `window.ready` loads each role before anything is measured, then throws if a face did not load. Text is never measured in a fallback font.

## Coverage: read the font, not the browser

The Latin subset covers U+0000 to U+00FF, Œ œ, curly quotes, dashes, the ellipsis, € and ™, and little else. A character outside it silently falls back to a system font in the browser, and the browser cannot tell you. So `render.mjs stills` reads each embedded face's own cmap table (`scripts/cmap.mjs`, a WOFF2 reader with no dependencies) and checks every character each face must draw. A missing character fails the critique.

```bash
node <skill>/scripts/cmap.mjs videos/<film>/fonts/unbounded-latin-700-normal.woff2 "ÉTÉ → 2026"
```

For a language outside Latin-1, change the face's token to the subset that covers it (`__FONT:<package>-latin-ext-<weight>-normal.woff2__`), fetch again and check again.
