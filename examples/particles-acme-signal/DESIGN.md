# Design: particles-acme-signal

The spec `src/film.html` was built from. Particle counts, cap heights, boxes and times are the values `render.mjs layout` and the critique measured; times are on the 120 BPM grid.

## Canvas and grid

- 1080 x 1080, 60 fps, 12.000 s = 720 frames, cycle loop: the swarm ends where it starts, in the field, and keeps drifting over the seam.
- Live area 104 to 976 on both axes (margin 104). The words and the mark stay inside it, through the camera's zoom; the field and the burst bleed.
- Baseline unit 8 px: ACME sits on 624, EXAMPLE.COM on 576, the crumb on 936.
- Tempo 120 BPM: beat 0.5 s, 16th 0.125 s, bar 2 s. Every move starts on a 16th.

## Palette

| Role | Hex | Used for | Contrast on bg |
|---|---|---|---|
| bg | #000000 | the ground | |
| paper | #F3EFE7 | the words, the ring and arcs, 85 % of the field, the crumb | 18.31:1 |
| signal | #FF6A2B | the mark's core, the dot in EXAMPLE.COM, 15 % of the field as embers | 7.35:1 |

One chromatic accent: glow is added light and particles overlap at partial alpha, so paper and signal can only ever make tints of signal. The palette gate found no mixed ink in the 20 frames around the four accents.

## Type roles

| Role | Face | Size rule | Use |
|---|---|---|---|
| display | Sora 800 (stems 0.254 of the cap height) | ACME: cap 184 (183 measured, size 250.6, track +16); EXAMPLE.COM: fit to 848 px (size 109, cap 79, track +10) | particle words |
| mono | IBM Plex Mono 500 | 26 px (cap 19), track +20 | the typed crumb |

## The swarm

| | |
|---|---|
| Particles | 4600 (the mark needs the most, 3562; 1038 stay as dust then, 1640 during ACME, 2423 during EXAMPLE.COM) |
| Dot | radius 1.4 px at dot 1, a seeded grain of 0.82 to 1.18 |
| Streaks | min 0.2, gamma 0.55 |
| Glow | gain 0.55, radius 12 px, floor 0.04; flares to 1.1 at 4.50 s (QUICK), back from 4.75 s (DISSOLVE) |

## Formations

| Id | Kind | What | Particles | Spacing | Dot | Drift | Dust | Colours |
|---|---|---|---|---|---|---|---|---|
| field | field | homes as blue noise over the canvas plus 48 px; depth size 0.35 to 1.9, alpha 0.06 to 1, bias 2.2; vignette 0.55; twinkle 0.3; waves 26 px, 760 px long, -24 degrees, 1 cycle and 12 px, 330 px, 64 degrees, 2 cycles | 4600 | | | 7 | | paper 85 %, signal 15 % |
| acme | text | ACME, ink 150 to 932 x 436 to 629, centre (540, 532); glint from 3.00 s for 1.00 s, 90 px band, dots to 1.55 x, 14 degrees | 2960 | 4.1 | 1.25 | 0.3 | 0.2 | paper |
| inhale | derived | from acme, scale 0.94 | 2960 | | | | | |
| burst | derived | from acme: explode 70 to 1000 px from (540, 532), stretch [1, 1.7], jitter 30 degrees; the dust pushed 40 to 220 px | 2960 | | | | | |
| mark | shape | core circle r 60 (dot 1.35, spacing 3.2), ring r 178 outline 44, arcs r 298 from 38 to 142 and 218 to 322 degrees outline 26, all about (540, 528); glint from 6.25 s for 1.00 s, 110 px band, dots to 1.45 x, -35 degrees | 3562 | 4.1 | 1.15 | 0.3 | 0.2 | signal core, paper ring and arcs |
| url | text | EXAMPLE.COM, ink 116 to 964 x 495 to 578; the dot in signal at dot 1.3, spacing 2.9; glint from 9.00 s for 0.875 s, 70 px band, dots to 1.5 x, 14 degrees | 2177 | 3.3 | 1.15 | 0.3 | 0.2 | paper, signal dot |

## Legibility

| Formation | Cap | Across the cap height | Averages to at feed size | Fully formed |
|---|---|---|---|---|
| acme | 183 px | 35.1 (sparsest glyph E: 598 particles) | 4.18:1 (A, 46 % lit with bloom) | 2.25 s (2.00 to 4.25) |
| mark | | | 3.30:1 (the ring, 40 % lit) | 1.66 s (5.85 to 7.51) |
| url | 79 px | 19.0 (O: 236 particles) | 6.17:1 (O, 58 % lit) | 1.76 s (8.49 to 10.25) |

A first pass at 1.4 px dots and 4.6 px spacing made ACME average to 2.03:1: a clear shape full size and a grey smear in a feed. Bigger dots at a tighter spacing fixed it; the orange core and the domain's dot get denser particles of their own, since orange needs about 60 % cover to reach 3:1.

## Moves

| # | At (s) | Into | Spring | Spread, order | Assign | Swirl | Accent |
|---|---|---|---|---|---|---|---|
| 0 | frame 0 | field | | | | | |
| 1 | 0.75 (beat 1.5) | acme | GATHER | 0.75 s, random | near | 40 | lands 2.047 (frame 123) |
| 2 | 4.25 (beat 8.5) | inhale | QUICK | none | | | |
| 3 | 4.50 (beat 9) | burst | BURST | a 32nd, center (inside out) | | | 4.625 (frame 278) |
| 4 | 4.75 (beat 9.5) | mark | REFORM | 0.5 s, random | angle | | lands 5.535 (frame 332) |
| 5 | 7.50 (beat 15) | url | GATHER | 0.5 s, x (left to right) | x | | lands 8.533 (frame 512) |
| 6 | 10.25 (beat 20.5) | field | DISSOLVE | 1 s, random | | -30 | |

The reform starts a quarter note after the burst, while the particles are still flying out, so each one curves out and back in a single path; `assign: 'angle'` brings it back from the side it left. The mark unrolls into the domain because both are sorted by x.

## Camera and light

- Camera: a push to 1.03 from 1.75 s (DOLLY) while ACME holds, a kick to 1.08 on the burst (PUNCH), back to 1 from 4.875 s (DOLLY) while the mark forms. It ends at 1, where it starts.
- A band of light crosses each formed picture once: ACME at 3.00 s, the mark at 6.25 s, the domain at 9.00 s.

## Small print

- DEMO COPY, FICTIONAL PRODUCT: IBM Plex Mono 500, 26 px, centred, baseline 936, typed from 2.25 s, backspaced from 10.50 s.

## Loop seam

- The dissolve's last particle starts at 11.25 s and settles 2.81 s into the next pass: it carries over the seam, and the gather starts at 0.75 s on top of it. The critique's seam row: a 0.1 ms step over the loop point moves a particle 0.038 px, against 0.036 to 0.040 px inside the loop.
- Periods: waves 1 and 2 cycles, twinkle 2 to 5, drift noise 1, 3 and 7 cycles per loop, all whole. The camera and the glow end where they start.
- loopcheck: every diff 0; 4235 px change over 0.1 ms across the loop point, 4062 to 4577 px for the same step elsewhere.

## GIF budget

- 480 px, 12 fps, 16 colours, no dither (the engine's hints): 3.46 MB. The same film at the render's defaults (20 fps, 64 colours, Bayer dither) is 7.9 MB.

## Formats

The same FILM renders at 9:16 and 16:9 (`--format`); `poster-9x16.png` and `poster-16x9.png` are frame 3.25 s of each. The field fills either frame; the formations keep their offset from the centre; the patches redesign them for the frame's shape.

- **9:16 (1080 x 1920).** 7400 particles, so the dust is as dense as at 1:1. ACME stacks into AC over ME at a 330 px cap (baselines 920 and 1336), spacing 6 and dot 1.9 so it averages to the same light at feed size (4402 particles). The burst stretches tall (`[1, 1.5]`, out to 1300 px); the mark's arcs turn to the top and bottom at r 360 round a ring of r 196; EXAMPLE.COM stays one line; the crumb sits under the stack at 1496.
- **16:9 (1920 x 1080).** 7400 particles. ACME at a 216 px cap, spacing 4.6; the burst stretches wide (`[1.9, 1]`); the mark gains a second, thinner pair of arcs at r 430; EXAMPLE.COM is fitted to 1120 px.
- Stills critique at each format: 44 checks, all pass, the composition row (a lean of 2 % at most) and the particle-level seam row included; the palette gate passes. Loopcheck passes at each.
- A full render at 9:16 verifies: H.264, 1080 x 1920, 720 frames, BT.709, PSNR 43.2 dB and up; the MP4 is 29.8 MB (the extra particles and area), the preview GIF 3.7 MB at 320 px wide (the engine narrows a vertical preview; at 480 px it was 6.7 MB).

## Checks

- Stills critique: 43 checks, all pass. Palette gate: 20 accent frames, no mixed ink.
- Loopcheck: PASS, cycle loop, continuous over the seam, max diff 0.
- Verify: H.264 High, yuv420p, 1080 x 1080, 60/1, 720 frames, 12.000 s, BT.709 tags, faststart; frame 0 at 47.6 dB against the canvas; the background decodes to (0.1, 0.1, 0.1) for #000000. MP4 17.3 MB (particles are all detail: 11.5 Mb/s at CRF 16). A smaller file costs detail: at `--crf 20` it is 11.8 MB and the lowest review frame falls to 34.8 dB, at `--crf 23` 8.6 MB and 32.5 dB, so the example keeps CRF 16.
- mp4frames: 15 frames, lowest PSNR 37.9 dB (the reform, frame 310: fine streaks).
- Render: 1 min 53 s for 720 frames on a shared 4-core machine.
