# Engine: the FILM config for photos

Step 4. The film is one HTML file with one canvas. [../templates/film.html](../templates/film.html) holds the whole engine; for a new film you copy it to `videos/<film>/src/film.html` and edit only the `FILM` block at the top. The template runs as it is, with its images: a 13 s product reel for a fictional flask, whose pictures are in [../templates/assets/](../templates/assets/) (copy that folder to `videos/<film>/assets/` to run the demo, and replace its files with the user's own). The core it sits on (springs, motion blur, the loop, formats, the page API) is described in core.md; the fields every engine shares (`W H FPS DUR BPM loop blur palette fonts grid springs poster formats`) are listed there.

## Images

`images: { id: { src, focus, subject, brief } }`, one entry per file:

| Field | Meaning |
|---|---|
| `src` | the asset token of a file in `videos/<film>/assets/` (core.md, Assets): the build embeds it as a data URL |
| `focus` | `[x, y]`, fractions of the image: the point that must stay in frame (a face, the product). The default centre of a Ken Burns move and of every crop |
| `subject` | `[x0, y0, x1, y1]`, fractions of the image: what should stay whole (the product, a group). The crop check warns when less than 90 % of it is in frame |
| `brief` | the row of BRIEF.md's Assets table that records the file's source (`'A1'`). The critique fails an image without one |

Each image is decoded once in `build()` (`await img.decode()`). The engine then samples every frame to find the largest size each image is shown at, and draws it into a cache of that size (halving, then one high-quality step), so a 4000 px photo costs what a 1080 px one does and stays sharp. The cache never upscales: an image shown larger than its own pixels is drawn from the original, and the critique warns past 1.15x.

## Scenes

A film is a list of scenes. Each is drawn inside its window and holds layers drawn in order.

| Field | Meaning |
|---|---|
| `id`, `t0`, `t1` | unique name; the window it is drawn in. A masked transition keeps the outgoing scene drawn until the mask covers it |
| `in` | how it arrives at `t0`: `'none'` (it just starts drawing, over or after the outgoing one), `'cut'` (a hard cut: motion blur stops at it), or a mask over the whole frame (below) |
| `bg` | a palette role filling the scene's background (default: none, the film's `bg` shows). A masked scene always paints its background inside the mask |
| `drift` | `{ at, dur, dx, dy, z, ease }`: a camera move for every layer with a `depth` (parallax, below) |
| `wrap` | only on the hold loop's last scene, the lockup: `{ exit, to, spring, stagger }`. Its layers are at rest at frame 0, leave at `exit`, are hidden once gone, and come back with their own `enter` |
| `exit` | `{ at, to, spring, stagger }` applied to every layer without an `exit` of its own |
| `layers` | what is in it, below |

### Masks

A mask reveals a scene over the whole frame (`in`), or a layer inside its own frame (`mask` on the layer, driven by the state `reveal` from 0 to 1).

| Mask | Reveals |
|---|---|
| `{ kind: 'wipe', dir }`, `'wipe-r'` | an edge travelling `r`, `l`, `u` or `d` |
| `{ kind: 'split', dir }`, `'split-v'` | from a centre line outwards: `v` a vertical seam opening sideways, `h` a horizontal one |
| `{ kind: 'circle', at }`, `'circle'` | a circle growing from `at` (fractions of the box, default the centre) to the farthest corner |
| `{ kind: 'shape', d, at }` | an SVG path (the core's `svgPath`), centred on `at` and grown until its inner radius clears the farthest corner: the product's silhouette, a logo mark |

A scene's mask runs on `spring` (MASK by default: it covers the frame in about 0.2 s). A layer's `reveal` runs on the spring of its `enter` or key.

## Layers

Common fields:

| Field | Meaning |
|---|---|
| `id`, `kind` | unique across the film; `photo`, `cutout`, `gallery`, `compare`, `grid`, `tag`, `text` (the default when there is a `text`), `rect`, `scrim` |
| `x`, `y`, `pin` | the centre in base-format pixels (a text's anchor and baseline; a tag's attach point), and the edge it keeps its distance from in other formats (core.md, Formats) |
| `w`, `h`, `full` | the frame's size; `full: true` fills the canvas in any format |
| `radius`, `border`, `shadow` | corner radius; `[width, role]`; `{ blur, dx, dy, op }` in the role `shade` (a cutout's shadow is its own blurred silhouette) |
| `fit` | `'cover'` (default: the image fills the frame, cropped round its focus) or `'contain'` (the whole image on a `matte` role) |
| `focus` | overrides the image's focus for this layer |
| `kb` | a Ken Burns move, below |
| `mask` | the mask that `reveal` opens (default `'wipe-r'`) |
| `depth` | how much the scene's `drift` moves it: 0 (default) not at all, 1 fully |
| `rot`, `scale`, `op` | rest rotation (degrees), scale and opacity |
| `loop` | behaviours that never stop, whole cycles per loop: `bob: [n, px]`, `sway: [n, degrees]`, `pulse: [n, amount]`, `phase: 'index'` |
| `bleed` | `true` exempts a text or tag from the live-area check |
| `enter`, `keys`, `exit` | the motion, below |

### Kinds

| Kind | Fields | Draws |
|---|---|---|
| `photo` | `img` | one image in a frame |
| `cutout` | `img`, `h` (or `w`; the other follows the image) | an image with transparency, no frame, with a soft silhouette shadow |
| `gallery` | `imgs: [...]`, `style: 'row'` or `'stack'`, `w`, `h` (a card), `gap`, `side` (the scale of the cards beside the front one, 0.8), `dim` (0.35), `dimRole` (the scene's `bg`), `wrap`, `idx` | cards. `row`: a carousel, the front card centred, the others beside it, smaller and dimmed; `wrap: true` joins the ends into a ring, fading each card as it goes round; `loop: { turn: n }` turns the ring n whole times per loop (a cycle loop). `stack`: the front card on a pile; the cards before it fly off to the left. The state `idx` is the front card (fractions move between cards) |
| `compare` | `before`, `after`, `labels: ['BEFORE', 'AFTER']`, `split` (0.5), `line`, `knob`, `chevron`, `labelFill`, `labelInk` | one frame: the before image left of the divider, the after image right of it, a handle, a label on each side clipped to it. The state `split` is the divider, 0 to 1 from the left |
| `grid` | `cells: [{ img, c, r, cs, rs, focus }]`, `cols`, `rows`, `gap`, `w`, `h` | a mosaic; each cell a copy with its own springs, so `stagger` and `order` assemble it |
| `tag` | `text`, `font` (`mono`), `size` (28), `anchor` (`L`: the pill extends right of `x`, `R`: left), `target`, `fact`, `fill` (paper), `ink` (ink), `line` (paper), `dot`, `width` (4), `dotR` (11) | a dot on the target, a leader drawn out to the pill, the pill and its words. The state `draw` runs 0 to 1: dot, then line, then pill |
| `text` | `text`, `font`, `size` or `cap` or `fit`, `track`, `pairs`, `anchor`, `fill` | one line of type, every glyph a copy (a stagger runs across the letters). `enter: { at, typed: true }` types small print one character per frame |
| `rect` | `fill` | a filled frame: a panel, a band |
| `scrim` | `side` (`b`, `t`, `l`, `r`), `size`, `fill` (ink), `op` (0.6) | a gradient from `op` at that edge to nothing, eased at both ends so it has no visible edge. Full width along its side in any format |

A tag's `target` is `[x, y]` in base-format pixels, or `{ layer, at: [fx, fy], card }`: a point on another layer's frame (fractions of it; for a gallery, of card `card` or the front card) that the leader follows as that layer moves. `fact` names the BRIEF.md fact the words state; the critique fails a tag without one.

## Ken Burns and parallax

- **Ken Burns:** `kb: { at, dur, z: [from, to], pan: [[x, y], [x, y]], ease }`. `z` is the zoom over a cover fit (1 fills the frame exactly); `pan` is the image point at the frame's centre, as fractions (default: the focus, both ends). Where the crop cannot centre on that point without showing the frame's edge, it stops at the edge. `ease` is `'drift'` (the default: constant speed with eased ends, the first and last fifth accelerating and braking), `'linear'`, `'inout'`, or a spring name (KEN is slow and critically damped). `breathe: [n, amount]` adds a zoom that swells and returns n times per loop (a cycle loop).
- **Parallax:** a scene's `drift: { at, dur, dx, dy, z, ease }` moves each layer by its `depth` times the move: its offset by `dx`, `dy` and its zoom about the canvas centre by `1 + (z - 1) x depth`. A cutout at depth 1 over a background photo at 0.3 is a parallax pair. A full-bleed layer with a depth is overscanned automatically so the drift never uncovers the canvas.

## Motion: enter, keys, exit

Every animated value is a Prop: a rest value plus springs. A **state** names some of them:

| Key | Meaning |
|---|---|
| `dx`, `dy` | offset from rest, px |
| `rot`, `scale`, `op` | degrees added, a factor on the rest scale (0 hides), opacity (always on FADE) |
| `reveal` | 0 to 1 through the layer's mask |
| `draw` | a tag drawing on, 0 to 1 |
| `blur` | text only: px of blur that focuses on FOCUS |
| `idx` | a gallery's front card (the whole layer, not staggered) |
| `split` | a compare's divider (the whole layer, not staggered) |

- `enter: { at, from, spring, stagger, order }`: the layer sits in the `from` state until `at`, then springs to rest.
- `keys: [{ at, to, spring, stagger, order }]`: later targets, in time order. `idx` and `split` move on SWIPE unless a spring is named.
- `exit: { at, to, spring, stagger, order }`: the last move.

`stagger` is a note value (16 is a 16th: 0.125 s at 120 BPM); `order` is `index` (default), `reverse`, `center`, `random` (seeded), `x` or `y`. It runs across a grid's cells, a gallery's cards and a text's glyphs.

## Springs

The core's springs (springs.md) plus these:

| Name | ζ | ω | Settles (s) | Lands (s) | Overshoot | Use |
|---|---|---|---|---|---|---|
| POP | 0.55 | 20 | 1.455 | 0.129 | 12.6 % | a card or a tag popping in from `scale: 0` |
| SWIPE | 0.80 | 14 | 1.429 | 0.297 | 1.5 % | a carousel step, a slider sweep |
| TRACE | 1 | 14 | 1.143 | 0.339 | none | a tag's leader drawing on |
| GLIDE | 1 | 9 | 1.778 | 0.527 | none | a slow move with no bounce |
| KEN | 1 | 4.5 | 3.556 | 1.054 | none | a Ken Burns move on a spring |

## Formats

Author the square (1080 x 1080) first. `render.mjs <mode> <film> --format 9:16` re-sizes the canvas and maps every position with the layer's `pin` (core.md, Formats); `full` photos and scrims fill the new canvas. A photo reel usually needs its own layout per format, in `FILM.formats`:

```js
formats: {
  '9:16': { scenes: [{ id: 'hook', layers: [
    { id: 'HERO', full: false, pin: 't', x: 540, y: 664, w: 1080, h: 1328 },   // the picture above the words
    { id: 'NEW', pin: 't', y: 1528, fill: 'ink' }] }] },
},
```

Scenes and layers merge by `id`; a patch sets only what changes. With `pin: 't'` a `y` is in that format's own pixels (from the top); with `pin: 'l'` an `x` is. The resolution, crop and contrast checks run at the format being rendered, so run `stills` at every format you deliver.

## What the critique measures

The engine's rows (review.md has the full table): each image embedded and declared (`asset`), shown at no more than 1.15x its pixels and not needlessly large (`resolution`), its focus and subject in every crop while the layer is on screen at rest (`crop`), each text's contrast against the pixels actually behind it (`contrast`: the frame drawn without the text, the worst 5 % of its box, at three moments of its rest), words per scene, tags citing facts (`claim`), the live area for text, tags and tag dots, and collisions. The core adds the loop, blank frames, palette roles and the composition.

## Adding something the vocabulary lacks

A new kind is a case in `buildLayer` (measure it), in `pieces` (what it draws at t, as frames with their own transform) and in `drawLayer`. `disp`, `visible`, the resolution sampling and the crop check read `pieces`, so a kind that returns its frames there gets motion blur, stills and the critique for free.
