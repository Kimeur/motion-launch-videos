# Design: 3d-acme

The spec `src/film.html` was built from. World units: y is up, the floor is y = 0; the frame is about 8.8 units tall at the camera's target.

## Canvas and loop

- 1080 x 1080, 60 fps, 10.000 s = 600 frames, cycle loop.
- Tempo 120 BPM: beat 0.5 s, 16th 0.125 s, bar 2 s.
- Live area 104 to 976 on both axes: the 3D type stays inside it at every sampled moment; the labels sit on the 8 px grid.

## Palette and materials

| Role | Hex | Used for | Material |
|---|---|---|---|
| bg | #221A3D | background and floor | floor shadow 0.42 |
| cream | #FFF1DE | the letters' faces | gloss 0.35 |
| coral | #FF6F61 | the letters' walls and bevels | |
| sun | #FFC53D | the ring (r 3.6, tube 0.13) | gloss 0.6 |
| teal | #35D0BA | three orbs (r 0.34) | gloss 0.7 |
| lilac | #9D8CFF | a rounded cube (0.8, radius 0.15) | gloss 0.4 |

Shading keeps hue: each surface is its colour times a light level, plus white highlights and rim.

## Light

Key light travelling (-0.38, -0.8, -0.9): from above, in front and to the right, strength 0.74; ambient 0.34; four filtered shadow taps, softness 1.3 texels on a 1024 px map over 18 units; rim 0.18.

## Camera

| At (s) | Yaw | Pitch | Distance | Target | Field of view | Spring |
|---|---|---|---|---|---|---|
| rest | -16 | 14 | 16.5 | 0, 0.35, 0 | 30 | |
| 1.00 | | | 15.0 | | | DOLLY |
| 7.00 | | | 16.5 | | | DOLLY |

Sway: 1 cycle per loop, 10 degrees of yaw.

## Objects

| Object | Kind and size | Rest place and turn | Colours | Motion | Loop |
|---|---|---|---|---|---|
| ACME | text, Unbounded 900, cap 1.08, depth 0.5, bevel 0.05, track +40 | 0, 0.02, 0 | cream / coral | 1.5: each letter turns over (rx -360, FLIP, 16ths); 5.0: hop 1.1 up (HOP, 16ths); 5.375: down (LAND, 16ths) | |
| RING | torus r 3.6, tube 0.13 | 0, 0.24, 0; tilted 4 and 3 degrees, just above the floor | sun | | orbit 1 (the tilt turns round, a slow wobble) |
| ORB | sphere r 0.34, 3 radial copies at r 4.3 | 0, 0.7, 0 | teal | | orbit -1, bob 4 x 0.3, phases spread |
| CUBE | box 0.8, radius 0.15 | 3.2, 0.4, -3.4; turned 30 | lilac | | spin 1 about y |

## Labels

| Label | Text | Face and size | Baseline | Colour |
|---|---|---|---|---|
| URL | EXAMPLE.COM | IBM Plex Mono 500, 40 px, +60 | 880 | sun |
| DEMO | DEMO COPY, FICTIONAL PRODUCT | IBM Plex Mono 500, 26 px, +20 | 944 | cream |

## Loop seam

- The flips end a whole turn from where they started and fold back to 0 once they settle; the hop returns to 0.
- The camera's dolly back (DOLLY, 5 s) is still settling at 10 s and carries over the seam.
- Cycles: ring orbit 1, orbs orbit -1 and bob 4, cube spin 1, camera sway 1.

## Checks

- The ring lies just above the floor so its near arc always passes below the word, never across it: a ring at mid-height sliced through the letters whenever its tilt turned toward the camera.
- Stills critique: 18 checks, all pass (the palette gate does not apply to shaded 3D).
- Loopcheck: purity 0; the seam changes about as many pixels as any other 0.1 ms step (12,969 against 6,591 to 12,657).
- Render: 2 subframes for 525 of 600 frames (slow drifts), up to 9 on the flips; about 8 minutes on a 4-core machine without a GPU, under load.
- Verify: H.264 High, yuv420p, 1080 x 1080, 60/1, 600 frames, 10.000 s, BT.709 tags, faststart; the background decodes to (34, 26, 60) for #221A3D; the lowest mp4frames PSNR is 38.9 dB.
