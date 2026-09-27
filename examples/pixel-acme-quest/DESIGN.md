# Design: pixel-acme-quest

The spec `src/film.html` was built from. Positions are logical pixels on the 180 x 180 canvas, top-left origin; boxes, speeds and accent times are the values `render.mjs layout` measured; times are on the 120 BPM grid.

## Pixel grid

- Logical canvas 180 x 180 at x6 = 1080 x 1080. Even scale: every yuv420p chroma block sits inside one logical pixel.
- 60 fps, 10.000 s = 600 frames, cycle loop. Motion blur off.
- Live area: margin 8 (8 to 172 on both axes). Every text layer sits inside it; the world bleeds.
- Tempo 120 BPM: beat 0.5 s, 16th 0.125 s, bar 2 s. Drops, hops, blinks and glints start on the grid.

## Palette

16 colours drawn for the film. Contrast against ink, the outline colour, where it matters:

| Role | Hex | Used for | Contrast |
|---|---|---|---|
| bg | #52A8F0 | the sky's top, the page background | |
| sky2 | #94D4F8 | the lower sky | |
| haze | #D4F1FA | the horizon, cloud undersides, far hill edges, castle windows | |
| white | #FFFCF2 | clouds, PRESS START, the disclosure, glints, twinkles | 16.28:1 on ink, 8.89:1 on soil |
| far | #62A8A8 | far hills, the castle | |
| leaf | #2F9A55 | near hills, grass shade, stems | |
| grass | #8AD54E | grass, near hill edges | |
| dirt | #B8733C | earth, the signpost | |
| soil | #6D3B24 | deep earth (the disclosure's band), hair, boots, belt | |
| ink | #211A31 | outlines, the eye | |
| gold | #FFC93E | the title's body, coins, the scarf, EXAMPLE.COM | 10.88:1 on ink |
| orange | #F2792F | the title's foot, coin and scarf shade | 6.01:1 on ink |
| cream | #FFF1A6 | the title's top row, coin highlights, the sign's arrow | 14.63:1 on ink |
| red | #E2433B | the tunic, flowers, the castle's pennant, the blush | |
| skin | #F8B98E | the hero's face and hands | |
| deep | #2D5DA8 | trousers, the title's drop | |

## Sprites

| Sprite | Size | Frames | fps | Period (s) | Per loop | Notes |
|---|---|---|---|---|---|---|
| hero | 16 x 20 | 6 | 12 | 0.5 | 20 | run: contact, down (1 px lower, back foot up), pass, then the other arm; the scarf flutters through 3 shapes |
| hop | 16 x 20 | 1 | | | | in the air: knee up, arm reaching |
| coin | 8 x 9 | 4 | 8 | 0.5 | 20 | a spin: face, three-quarter, edge, three-quarter |
| spark | 7 x 7 | 5 | 20 | 0.25, one-shot | | the pickup burst and the title's twinkles |
| dust | 10 x 3 | 3 | 12 | 0.25, one-shot | | the landing puff, left behind at 60 px/s |
| cloudBig, cloudMid, cloudSmall | 34 x 13, 24 x 10, 14 x 6 | 1 | | | | puffs with a haze underside |
| castle | 16 x 13 | 1 | | | | far away, in the far hills' own colour, a red pennant |
| grassA, grassB, dirtA, dirtB, deep | 8 x 8 | 1 | | | | ground tiles |
| flower, daisy, tuft, sign | 5 x 6, 5 x 6, 6 x 3, 13 x 10 | 1 | | | | decorations; the sign points the way |

## Layers, back to front

| Layer | Kind | y | Speed (px/s) | Step | Repeat (px) | Period (s) | What is on it |
|---|---|---|---|---|---|---|---|
| SKY | sky | 0 | | | | | bg to 64, sky2 to 100, haze below; 6 dithered rows at each change |
| CLOUDS | strip | 8 to 50 | 20 | 1 px / 3 frames | 200 | 10 | three clouds |
| CASTLE | strip | 90 | 20 | 1 px / 3 frames | 200 | 10 | the castle on the tallest far hill |
| FAR | ridge | 128 | 20 | 1 px / 3 frames | 200 | 10 | bumps 20, 14 and 26 px high, far fill, haze edge |
| NEAR | ridge | 142 | 30 | 1 px / 2 frames | 300 | 10 | bumps 16, 24, 12 and 20 px high, leaf fill, grass edge |
| GROUND | tiles | 142 | 60 | 1 px / frame | 120 | 2 | 15 x 3 tiles of 8 x 8, soil below |
| PLANTS | strip | 136 to 143 | 60 | 1 px / frame | 600 | 10 | 2 signs, flowers, daisies, tufts |
| HERO | sprite | 126 | | | | | x 36; hops of 26 px over a beat at beats 1, 5, 9, 13, 17 |
| COINS | items | on the hop's path | 60 | 1 px / frame | 600 | 10 | 15 coins, three per hop at +0.10, +0.25, +0.40 s, collected at x 54 (the hero's front edge) |
| ACME, QUEST | text | 12, 40 | | | | | the title |
| TWINKLE | sparkles | 6 to 80 | | | | 1 | 3 twinkles a second round the title, beats 6 to 17 |
| START, URL | text | 80 | | | | | PRESS START (beats 5 to 11), EXAMPLE.COM (beats 11 to 17) |
| DEMO | text | 165 | | | | | the disclosure |

The castle scrolls at 20 px/s, so it repeats every 200 px, more than the 180 px screen plus its 16 px: it never shows twice. The two larger clouds (34 and 24 px) are wider than that margin, so for under a second a loop a few pixels of the same cloud sit at both edges, which reads as one cloud leaving and another arriving. A slower cloud layer would repeat on screen, and an unmistakable one would need a longer loop (see pixel-craft.md).

## Text

| Layer | Text | Scale | Box (logical) | Output cap height | Fill | Outline / drop | Measured backdrop |
|---|---|---|---|---|---|---|---|
| ACME | ACME | 3 | 55, 11 to 126, 36 | 126 px | cream, gold x 4, orange x 2 (by font row) | ink / deep [0, 2] | 6.01:1 (orange on ink) |
| QUEST | QUEST | 4 | 31, 39 to 149, 71 | 168 px | same | ink / deep [0, 2] | 6.01:1 |
| START | PRESS START | 1 | 58, 79 to 123, 88 | 42 px | white | ink | 16.28:1 |
| URL | EXAMPLE.COM | 1 | 59, 79 to 122, 88 | 42 px | gold, cycling through cream and white in 3 px bands | ink | 10.88:1 |
| DEMO | DEMO COPY, FICTIONAL PRODUCT | 1 | 13, 165 to 167, 172 | 42 px | white | none, on soil | 8.89:1 |

The drop is drawn only outside each letter, so the counters of A, Q and E stay open. ACME's box ends at row 35, 3 px above QUEST's top (39). QUEST drops first so that its 24 px bounce goes up into empty sky; by the time ACME lands only a 2 px bounce is left, which stays clear of it.

## Timeline

| Time (s) | Beat | What happens | Spring / effect |
|---|---|---|---|
| 0.00 | 0 | the world runs alone: clouds, castle and hills at 20 and 30 px/s, ground at 60, coins coming in | |
| 0.50 | 1 | hop 1 through three coins (collected 0.60, 0.75, 0.90), dust on landing at 1.00 | parabola, 26 px, one beat |
| 1.00 | 2 | QUEST drops from 96 px above, letter by letter every 32nd | DROP, `bounce: true`: 24, 6, 2 px bounces |
| 1.197 | | QUEST's first letter lands: the screen shakes 2 px for 0.2 s | shake |
| 1.447 | | QUEST's last letter lands (accent, frame 87) | |
| 2.00 | 4 | ACME drops from 64 px above onto QUEST | DROP, `bounce: true`, 32nds |
| 2.384 | | ACME's last letter lands (accent, frame 143) | |
| 2.50 | 5 | PRESS START blinks, on 60 % of every beat; hop 2 | blink [0.5, 0.6] |
| 3.00 | 6 | twinkles round the title | sparkles, every 1 s |
| 4.00, 4.125 | 8 | a glint across ACME, then QUEST | shine, 0.4 s, 4 px |
| 4.50 | 9 | hop 3 | |
| 5.50 | 11 | EXAMPLE.COM takes PRESS START's place and shimmers | palette cycle, 8 steps at 12 fps |
| 6.00, 6.125 | 12 | glints | |
| 6.50 | 13 | hop 4 | |
| 8.50 | 17 | ACME dissolves letter by letter in 3 x 3 blocks, QUEST from 8.625 in 4 x 4; hop 5 | DISSOLVE, 32nds |
| 9.3 to 10.0 | | the world runs alone into the seam | |

Something moves on every beat: the run cycle (two steps a beat), the coins' spin, the scroll, and a blink, hop, glint or landing.

## The loop

- Cycle loop. Periods: every scroll 10 s (the ground 2 s), the run and the coin spin 0.5 s, the blink 0.5 s, the shimmer 0.667 s, the twinkles 1 s: all whole in 10 s.
- The world is 60 x 10 = 600 px long, so each coin passes the hero once per loop and is back, uncollected, on the right when the loop comes round.
- The title dissolves before the end and drops in again: each letter's Props start where they end (invisible), so nothing pops.
- The film drawn on to t = 10 s is frame 0, pixel for pixel (the critique's `seam` row).

## Checks

- Stills critique: 73 checks, 73 pass. Strict palette gate: 19 frames, every pixel a palette colour. Palette gate: 10 accent frames.
- Loopcheck: every maximum channel difference 0; seam continuity 0 px (the same step elsewhere 0 px, limit 100). LOOPCHECK PASS.
- Render: 73 s for 600 frames on 4 shared cores, one draw per frame. MP4 0.95 MB, GIF 1.29 MB (540 x 540, 200 frames at 20 fps, exactly the 16 palette colours).
- Verify: H.264 High, yuv420p, 1080 x 1080, 60/1, 600 frames, 10.000 s, BT.709 tags, faststart; frame 0 at 39.2 dB PSNR against the canvas; the sky #52A8F0 decodes to (81.2, 168.0, 238.9). VERIFY PASS.
- mp4frames: 19 review frames, lowest PSNR 36.0 dB (the EXAMPLE.COM hold and the dissolve; the world alone decodes at 39 dB).
