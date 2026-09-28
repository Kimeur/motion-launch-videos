# Design: Warren Buffett, from $0 to billions (pixel)

The spec the film is built from. The numbers here and in the FILM config (`dev/config.js`, assembled with `dev/art.js` and `dev/kinds.js` into `src/film.html`) agree; `render.mjs layout` reports the measured boxes and speeds.

## Pixel grid

- Logical canvas 320 x 180 at x6 = 1920 x 1080 (16:9). The scale is whole and even.
- 60 fps, 36.000 s = 2160 frames. **Not a loop** (`loop: 'none'`): a story that plays once. `loopcheck` checks purity only (seek(t) is a function of t; every difference is 0).
- Live area: margin 8 logical px (8 to 312 by 8 to 172). Text stays inside it; the world bleeds.
- Tempo 120 BPM. The stops land every 3 s (6 beats): t = 1, 4, 7, 10, 13, 16, 19, 22, 25, 28 s. The music is a waltz in 3/4: a bar is 1.5 s and a stop is two bars.

## Palette

16 colours, drawn for this film: see the table in BRIEF.md. Ramps: sky (bg, sky2, haze), hills (far, shade), snow (snow, white, shade), gold (gold, orange), skin, suit, red, earth, wood, pine, and one ink for every outline.

| Pair | Contrast | Where it matters |
|---|---|---|
| white ramp on ink outline | white 15.7:1, snow 14.0:1, far 8.5:1 (the worst row of the ramp) | headlines |
| gold ramp on ink outline | gold 10.2:1, orange 6.0:1 (the worst row) | numbers, the HUD |
| white on ink outline | 15.7:1 | small print |

Every text has an ink outline, so its backdrop is its own outline whatever scrolls behind it (the critique measures the pixels that actually touch it).

## Sprites

Everything is ASCII art built in code (`dev/art.js`): rectangles, discs, lines, then a one-pixel ink outline. `dev/preview.mjs` draws sheets of them for review.

| Sprite | Size | Frames | fps | Period (s) | Notes |
|---|---|---|---|---|---|
| kid, paper, young, man, elder | 18 x 26 | 6 | 12 | 0.5 | one run cycle (contact, down, pass, then the other leg), five ages: a kid in a red shirt; a paper boy with a cap and a canvas bag; a student with glasses; a man in a suit; an older man with white hair. Generic figures, no likeness |
| house, stockBoard, bike, book, partners, vault, mill, tower, trophy, bigCoin | 46 x 38, 36 x 42, 40 x 29, 32 x 48, 60 x 30, 46 x 52, 64 x 62, 52 x 68, 38 x 48, 36 x 38 | 1 | 0 | none | the ten stops |
| pine, pineSmall, snowman | 20 x 32, 14 x 22, 18 x 28 | 1 | 0 | none | trees and a snowman on the ground plane |
| cloudBig, cloudMid, cloudSmall, sun | 34 x 13, 24 x 10, 14 x 6, 24 x 24 | 1 | 0 | none | sky |
| snowA, snowB, earthA, earthB, deep | 8 x 8 | 1 | 0 | none | ground tiles |
| coin | 8 x 8 | 4 | 8 | 0.5 | the coin each stop tosses: face, three-quarter, edge, three-quarter |
| spark | 7 x 7 | 5 | 20 | 0.25 | one-shot twinkle when a coin lands |
| poof | 22 x 30 | 3 | 12 | 0.25 | snow and sparkle where the runner grows up |

## The snowball (a kind the engine did not have)

`ball` draws a disc in whole pixels, every frame from the frame number alone:

- Its radius steps up on the HOP spring (ζ 0.5, ω 18) when a coin lands: 4, 5, 6, 8, 10, 14, 18, 26, 34, 46 px. The biggest tops out at row 45; the captions end at row 43.
- It sits on the ground behind the runner: right edge 6 px behind the runner's left edge, so its centre moves left as it grows.
- Shading: a dithered ramp shade, far, snow, white by the angle to a light from the upper left (a Bayer 4 x 4 dither between two neighbouring tones, fixed to the screen, so it never crawls), a 1 px ink rim, and a shadow on the snow.
- It turns: rolling without slipping, it turns speed / radius radians a second (0.65 rad/s at the end); seeded flecks in the ball's own frame turn with it. A third of them are gold from radius 9 up, so the snow slowly turns to money.

`feed` tosses a coin from each stop's prop, in a parabola over the runner, to the ball's upper right; the ball swells on arrival. `snow` drops 46 flakes on even steps (10 to 30 px/s), drifting left with the world, gone at the ground.

## Layers, back to front

| Layer | Kind | y | Speed (px/s) | Step | Repeat (px) | What is on it |
|---|---|---|---|---|---|---|
| SKY | sky | 0 | | | | bands bg, sky2 at 50, haze at 98, dithered over 6 rows |
| SUN | sprite | 140 up to 70 | | | | starts behind the hills; rises 7 px at every stop (SLIDE) |
| CLOUDS | strip | 8 to 64 | 10 | 1 px / 6 frames | 800 | eight clouds |
| FAR | ridge | 126 | 10 | 1 px / 6 frames | 720 | far hills, far / haze edge |
| NEAR | ridge | 136 | 20 | 1 px / 3 frames | 1080 | near hills, shade / far edge |
| GROUND | tiles | 132 | 30 | 1 px / 2 frames | 240 | snow row, earth row, deep row, earth below |
| TREES | strip | ground | 30 | 1 px / 2 frames | 1580 | pines behind the stops |
| STOPS | strip | ground | 30 | 1 px / 2 frames | 1580 | the snowman and the ten props, each centred on x = 200 when its caption lands |
| BALL | ball | ground | 30 | | | the snowball |
| RUN_* | sprite | 112 | | | | five ages at x = 110, each dissolving in 0.6 s before its stop and out 0.3 s after the next one arrives |
| POOF_* | sprite | 109 | | | | a poof at each change of age |
| GLINTS_1..4 | sparkles | 12 to 58 | | | | twinkles over the first million, first billion, richest and final captions |
| FEED | feed | | | | | the coins |
| SNOW | snow | 0 to 135 | | | | falling snow |
| text | text | | | | | captions, HUD, credits, ending |

Nothing unique repeats on screen: the strips are 1580 px long and the film scrolls 1080 px.

## Text

| Layer | Text | Scale | Output cap height | Fill | Outline / drop |
|---|---|---|---|---|---|
| S1..S10 _HEAD | the headline of each stop (2 to 4 words) | 3 (2 for THE INTELLIGENT INVESTOR and BERKSHIRE HATHAWAY) | 126 px (84) | white ramp, gold ramp for money | ink / suit [0, 2] |
| S1..S10 _SUB | one line of small print | 1 | 42 px | white | ink |
| S1..S10 _AGE, AGE_LAST | AGE n · year | 1 | 42 px | gold | ink |
| END_1, END_2, END_3 | WET SNOW. / A REALLY LONG HILL. / – WARREN BUFFETT | 3, 2, 1 | 126, 84, 42 px | white ramp, gold ramp, white | ink / suit [0, 2] |
| CREDIT_1, CREDIT_2 | UNOFFICIAL FAN ANIMATION / SOURCES: FORBES, CNBC, PBS, PRESS | 1 | 42 px | white | ink |

At most 4 words of display type (scale 2 and up) are on screen at once. Headlines drop in letter by letter (0.45 s across the line, DROP with bounce), stay 2.3 s and dissolve; the small line dissolves in 0.4 s later. The first title is on screen at frame 0, so the first frame of the file is a title card.

## Timeline

| Time (s) | What happens |
|---|---|
| 0.0 | title card: WARREN BUFFETT, FROM $0 TO BILLIONS; a kid, a pea-sized snowball, a cottage; the snow falls |
| 1.0 | stop 1 (the cottage) is centred; the title stays until 2.3 s |
| 4.0, 7.0 ... 28.0 | a stop lands: headline drops; at +0.15 s its coin is tossed; at +0.75 s it lands and the ball swells |
| 6.4, 9.4, 15.4, 24.4 | the runner grows up: kid, paper boy (14), student (19, 25), man (1962 to 55), older man (77, 96), each with a poof |
| 22.75, 28.75 | the two big swells shake the screen (2 px, 3 px) |
| 30.3 | the last stop's captions leave |
| 30.9 | WET SNOW. |
| 32.8 | A REALLY LONG HILL., then – WARREN BUFFETT at 33.4 s; everything holds to the last frame |

- Accents: each headline lands (accent frames feed the palette gate).
- Something moves on every beat: the run cycle, the scroll, the ball's turn, the snow.

## The loop

None. `loop: 'none'`: no seam is checked. The purity checks pass (`seek(0)` equals `seek(DUR)`, the same t gives the same pixels after other seeks).

## Sound

Not part of the skill's output (the MP4 is muted by default); `dev/music.mjs` writes an original chiptune waltz as a WAV, which is muxed into the delivered MP4. 3/4 at 120 BPM: a music-box lead, a triangle bass, waltz chords, an eighth-note shimmer, hats and a kick, one voice more every few stops. The key climbs a whole step at the first million (D) and again at the first billion (E). Coin chirps at each toss, a rising bloop and sparkle when it lands, a thump on the two big swells, a bell on every caption, wind chimes, footsteps on the contact frames and a rumble that grows with the ball. Integrated loudness about -16 LUFS, true peak -1.0 dBFS.

## Review stills

Written by `render.mjs stills`: frame 0 and the last frame, each text's landing and rest, each exit, the glints, the shakes, a coin in flight and landing, the poster, plus `stills/contact.png`.
