# Review: the pre-pass critique and the final checklist

Step 5 and the end of step 6. Nothing is rendered in full until the stills pass, and nothing is delivered until the files verify and you have looked at them.

## Pre-pass: `render.mjs stills`

It prints only the checks that did not pass (set `VERBOSE=1` to see all), writes one PNG per planned frame to `videos/<film>/stills/`, and a labelled `contact.png`. It exits non-zero when anything fails. Run it at every format you deliver: `--format 9:16` checks that cut on its own logical canvas and writes `stills/9x16/`. It takes a few seconds: the whole film is drawn into the small framebuffer several times over.

The planned frames: frame 0, each text's first landing and its rest, each exit under way, each `show` window opening, the first glint, the first hop's apex and landing, the first pickup, the shake, the poster, each accent, and the last frame.

### The engine's checks

| Check | Fails when | Fix |
|---|---|---|
| pixel grid | W x H is not `px.w x px.scale` by `px.h x px.scale`, or the scale is not whole (warns on an odd scale: yuv420p softens its edges). In another format the logical canvas follows the frame, unless the patch sets `px.w` and `px.h` | set W, H from `px`; use an even scale; in a format patch, leave `px` out or keep it consistent |
| motion blur | `blur` is not `false` | `blur: false` |
| palette size | more than 256 colours (warns above 16, and when two roles share a hex) | merge roles; 16 is plenty |
| sprite | its frames or rows differ in size, or it uses a character that is not in its key (warns when no layer uses it) | redraw the row; add the character to the key or use `'.'` |
| reference | a layer names a sprite that does not exist, an unknown kind, a duplicate id, an `items` collector that is not a sprite layer, a shake `on` a layer with no entrance, an item with no `y` | fix the name |
| bitmap font | a `FILM.glyphs` entry is not 7 rows of `'#'` and `'.'`, all one width | redraw it |
| tiles | a tile differs in size from the others, a map row is ragged, a map character has no tile | fix the map |
| whole pixels | a position, offset, hop height, band, bump, box or shake is not a whole logical pixel | round it |
| scroll steps (warn) | a speed is not FPS / n or n x FPS px/s, so its 1 px steps come unevenly apart | 60, 30, 20, 15, 12 or 10 px/s at 60 fps |
| glyphs | a character is not in the bitmap font (it has no lowercase) | change the copy, or add the glyph with `FILM.glyphs` |
| legibility | the caps are under 35 output px (`7 x scale x px.scale`) | a larger text scale or pixel scale |
| live area | a text's box (outline and drop included) leaves the margin | move it, or `bleed: true` |
| backdrop | the worst contrast between the text's fill and the pixels that actually touch it, measured on up to 8 frames at rest with everything behind it drawn, is under 3:1 (scale 2 and up) or 4.5:1 (scale 1). Warns when the text is never fully at rest | an outline, another fill role, or a calmer backdrop |
| words | more than 4 words of display type (scale 2 and up) are on screen at once | cut words, or split the beat |
| collision / cramped (warn) | two texts on screen together overlap, or sit under 2 px apart | move one |
| pickups | an item reaches the line when its collector is not there | `y: 'path'`, or time a hop |
| entrance (warn) | a layer is on screen the frame before its entrance, so it pops to its entrance state | an exit (or keys) that hides it first, or a `show` window |
| seam (cycle) | drawn on to t = DUR without wrapping, the film differs from frame 0; the row names the first layer that differs | a period that is not whole, a value that does not return |

### The core's checks

| Check | Fails when |
|---|---|
| contrast | a text's fill role against its outline role (or `on`) is under 3:1 or 4.5:1 |
| palette roles | a colour the film draws is not a palette role |
| loop closes (cycle) | a Prop ends somewhere other than where it starts |
| cycle | a scroll, sprite cycle, blink, palette cycle, bob or twinkle does not repeat a whole number of times per loop |
| loop tail (hold) | anything still changes in the last frame's shutter: a spring, a scroll, an animation, a blink |
| blank frames (warn) | 4 or more frames show nothing but `bg` |
| composition | averaged over the review stills, what stands in front of the sky, the hills and the ground (the title, the hero, the coins, the clouds, the props) leaves more of the frame empty on one side than the other, or sits off-centre, by more than 30 % of the frame (warns past 20 %). A big title high in the frame weighs more than a small hero low in it. Fix: in another format, pin the world to the bottom and patch the title into the new space (engine.md, Formats); `FILM.backdrop` changes which roles count as background |

### The gates

- **Strict palette gate**: every pixel of every planned still is exactly a palette colour. The engine cannot draw anything else, so a failure means someone drew around it (a canvas call in a custom kind) or turned blur on.
- **Palette gate**: the accent frames checked for mixed ink, as in the other skills; always passes when the strict gate does.

### By eye, on the contact sheet and the full-size stills

- **At 1x.** Look at the contact sheet at its own small size: every sprite's silhouette reads, the title reads, the hero is findable in every frame.
- **One thing to look at.** The title while it lands, the call to action while it holds, the hero in between.
- **The run.** `render.mjs at videos/<film> 0 0.083 0.167 0.25 0.333 0.417` gives the six drawings: feet, bob, the arm and the secondary motion (scarf, hair) all change; nothing jumps.
- **Parallax.** Farther layers slower and paler; nothing unique on screen twice; no layer judders.
- **Text.** Bounces never cross another line; outlines do not fill the counters; the glint sweeps once and clears; small print is 42 px or more.
- **Pickups and hops.** Items vanish at the hero's front edge with a twinkle; hops land with dust on the beat.
- **Dissolve.** Chunky blocks in the text's own pixel size, not a 1 px crawl.
- **The seam.** The last frame and frame 0 are one ordinary step apart.
- **Each format** (`stills/9x16/contact.png`, `stills/16x9/contact.png`): the world stands on the bottom edge, the title uses the new space, nothing drops in from inside the frame, and nothing unique on a slow layer shows twice across the wider frame.

Fix, rebuild, and run stills again. Show the user the contact sheet and anything you changed on their brief.

## Before delivering

1. `loopcheck`: every maximum channel difference is 0, and the seam continuity line passes (cycle loop).
2. `render`: the full film. Rendering is one draw per frame; 600 frames at 1080 x 1080 take one to two minutes.
3. `verify`: every check passes; the GIF is under 4 MB (aim for 2 MB: 20 fps at 540 px is usually 1 to 2 MB).
4. **Extract and look**: `mp4frames` decodes the planned frames from the MP4 into `stills/mp4/` with a contact sheet and each frame's PSNR against the canvas; the lowest must be at least 35 dB. Pixel art's hard ink edges ring a little in H.264: title frames sit near 36 dB, busy dissolves lower. If one falls under 35, shorten or coarsen the dissolve, or render with `--crf 12`. Then a filmstrip of the whole MP4:
   ```bash
   ffmpeg -v error -y -i videos/<film>/renders/<film>.mp4 -vf "select=not(mod(n\,10)),scale=180:180:flags=neighbor,tile=10x6" -frames:v 1 videos/<film>/stills/strip.png
   ```
5. **The GIF's colours** should be exactly the palette:
   ```bash
   ffmpeg -v error -i videos/<film>/renders/preview.gif -f rawvideo -pix_fmt rgb24 - | node -e "const s=new Set();let b=Buffer.alloc(0);process.stdin.on('data',(d)=>{b=Buffer.concat([b,d]);const n=b.length-b.length%3;for(let i=0;i<n;i+=3)s.add(b.toString('hex',i,i+3));b=b.subarray(n)}).on('end',()=>console.log(s.size+' colours: '+[...s].join(' ')))"
   ```
6. Report: the files with sizes, what verify said, the loopcheck line, the lowest mp4frames PSNR, the GIF's colour count, and anything you could not check.

## What never ships

- A sprite, tile, font, title or palette that is not original, or a character that resembles another game's.
- A claim that is not in the brief's Facts table.
- A pixel outside the palette, or a position between pixels.
- A cycle loop that jumps at the seam.
- An MP4 without BT.709 tags, or whose sky decodes lighter than the canvas.
