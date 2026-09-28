# dev: how this film is made

The film is one HTML file (`../src/film.html`), assembled from three hand-written parts and the motion-pixel template:

| File | What it is |
|---|---|
| `art.js` | every sprite, drawn in code from rectangles, discs and lines (`cv(w, h)`), then outlined: the runner at five ages, the ten stops, the scenery, the coin and the poof |
| `config.js` | the FILM block: palette, stops, timeline, layers and captions |
| `kinds.js` | three drawing kinds the pixel engine did not have: `ball` (the growing, turning snowball), `feed` (the coins) and `snow` (falling flakes) |
| `assemble.mjs` | splices the three into the template's FILM block and engine: `node assemble.mjs` writes `../src/film.html` |
| `preview.mjs` | draws sprite sheets to PNG (`node preview.mjs runners`, `props`, `scenery`; needs ffmpeg) to judge the art |
| `music.mjs` | the soundtrack, synthesised sample by sample: `node music.mjs music.wav` |

To rebuild and render (from the repo root, with `videos/buffett-pixel/` holding a copy of this folder):

```bash
S=plugins/motion-launch-videos/skills/motion-pixel
node videos/buffett-pixel/dev/assemble.mjs
node $S/scripts/render.mjs stills videos/buffett-pixel      # critique, stills, contact sheet
node $S/scripts/render.mjs render videos/buffett-pixel --gif-fps 15
node videos/buffett-pixel/dev/music.mjs videos/buffett-pixel/renders/music.wav
ffmpeg -i videos/buffett-pixel/renders/buffett-pixel.mp4 -i videos/buffett-pixel/renders/music.wav \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -movflags +faststart videos/buffett-pixel/renders/buffett-pixel-sound.mp4
```

The GIF in this folder was re-encoded from the render's own GIF at 12 fps to stay under 4 MB (`ffmpeg -i preview.gif -vf "fps=12,split[a][b];[a]palettegen=max_colors=17:stats_mode=full[p];[b][p]paletteuse=dither=none" out.gif`); it holds exactly the 16 palette colours. The MP4 here is the render with the soundtrack muxed in; the picture tells the whole story muted.

`assemble.mjs` finds the template through `../../..`, so keep this folder two levels below the repo root (`videos/<film>/dev` or `examples/<film>/dev`).
