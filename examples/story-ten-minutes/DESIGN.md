# Design: Ten minutes

The spec the film is built from. Numbers here and in the FILM config agree.

## Canvas and timing

- 1080 x 1920 (9:16), 30 fps, `DUR` 66.95 s from the voice-over (`voice.mjs`), 2009 frames. No loop.
- Hero and living details on 15 drawings a second. Hero line 7 px, boil 1.2 px.
- Voice: Kokoro `am_michael`, speed 1.0; 0.3 s between lines, 0.5 s between scenes, 0.4 s lead, 3.5 s tail.
- Live area 88 px from each side; captions on baseline 1330, HUD cards centred on y 300.

## Palette

| Role | Hex | Used for |
|---|---|---|
| bg / night / dusk / steel / fog / haze | #0B0F1A / #121A2B / #1B2740 / #2B3A56 / #46597A / #6E83A6 | the night: skies, walls, seats, buildings |
| ink | #060910 | outlines, the caption outline, shadows, vignette |
| neon / neonDk | #FF3E6C / #9E1846 | the motel sign, danger words, the twist, RUN |
| cash / cashDk | #4CC27A / #2A7A4A | money, Marco's text |
| amber / sodium / lamp | #FFC94A / #F4A640 / #FFD98A | times, street lamps, the bedside lamp, STAY |
| skin / skinDk / beanie / beanieDk | #F3EEE6 / #C6BDAF / #D23B2F / #7F1E19 | the hero |
| glass / screen / hud / dim | #9CC2E6 / #86D4FF / #E9F1FF / #8A97B1 | rain, screens, card text |
| wood / woodDk / bed / bedDk | #6B4A33 / #3F2B1E / #5B6E9A / #3A4870 | the room and the table |

## Scenes

| # | id | set | From - to (s) | Camera (x, y, zoom) | Hero | Cards |
|---|---|---|---|---|---|---|
| 1 | DRIVE | car | 0.00 - 5.69 | 540, 960, 1.04 to 540, 930, 1.10 | eyes in the mirror | |
| 2 | CASH | backseat | 5.69 - 10.29 | 540, 1000, 1.00 to 560, 1060, 1.12 | | money 0 to $4,200,000 |
| 3 | PLAN | map | 10.29 - 18.43 | default | | the map's pins and route |
| 4 | ARRIVE | street | 18.43 - 23.37 | 540, 960, 1.00 to 600, 1000, 1.08 | walks 330 px with a bag | |
| 5 | WAIT | room | 23.37 - 27.82 | default | looks out, frowns | clock 12:00 to 12:31 |
| 6 | CALL | phone | 27.82 - 31.16 | default | | CALLING..., VOICEMAIL |
| 7 | COUNT | desk | 31.16 - 36.27 | default | | meter 0 to $4,200,000 |
| 8 | NEWS | tv | 36.27 - 42.08 | 540, 900, 1.00 to 540, 880, 1.14 | | |
| 9 | TEXT1 | phone | 42.08 - 48.40 | default, shake at 0.1 | | the text from UNKNOWN |
| 10 | TEXT2 | phone | 48.40 - 55.26 | default, shake at 0.1 | | the text from MARCO |
| 11 | WINDOW | room (window) | 55.26 - 61.08 | 540, 1000, 1.00 to 540, 960, 1.10 | from behind, scale 1.6 | POLICE IN 10:00 counting down |
| 12 | ASK | question | 61.08 - 66.95 | default | | STAY / RUN |

## Captions

- At most 3 words a group, 78 px Montserrat 800, white on an ink outline; marks: `*` neon, `+` cash, `!` amber.
- Marked: bank; 4.2 million dollars; Marco; 11:52; No Marco; Straight to voicemail; a suspect in custody; both texts; lie; stay; run.

## Score

- Bed in D minor, brightness 0.3, movement 0.4, a chord change on every cut; the engine's cues; -14 LUFS.
