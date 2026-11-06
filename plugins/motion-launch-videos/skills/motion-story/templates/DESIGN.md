# Design: <film>

The spec the film is built from. Numbers here and in the FILM config agree; when one changes, change both.

## Canvas and timing

- 1080 x 1920 (9:16), 30 fps, `DUR` <66.95> s from the voice-over (`voice.mjs`). No loop.
- Hero and living details on 15 drawings a second. Hero line <7> px, boil <1.2> px.
- Voice: Kokoro `<am_michael>`, speed <1.0>; <0.3> s between lines, <0.5> s between scenes, <0.4> s lead, <3.5> s tail.
- Live area 88 px from each side; captions on baseline <1330>, HUD cards centred on y <300>.

## Palette

| Role | Hex | Used for |
|---|---|---|
| bg, night, dusk, steel, fog, haze | | the night: skies, walls, seats, buildings |
| ink | | outlines, caption outline, shadows |
| neon / neonDk | | the sign, danger words, the twist |
| cash / cashDk | | money, good news |
| amber, sodium, lamp | | times, street light, lamps |
| skin, skinDk, beanie, beanieDk | | the hero |
| | | |

## Scenes

| # | id | set | From - to (s) | Camera | Hero | Cards | Cues beyond the defaults |
|---|---|---|---|---|---|---|---|
| 1 | DRIVE | car | 0 - 5.7 | 1.04 to 1.1, rising | eyes in the mirror | | |
| ... | | | | | | | |
| last | ASK | question | | | | | swell and boom |

## Captions

- <3> words a group at most, <78> px, white on an ink outline; marks: `*` neon, `+` cash, `!` amber.
- The marked words: <bank, $4.2 million, 11:52, Marco, no Marco, straight to voicemail, a suspect in custody, the two texts, lie, stay, run>.

## Score

- Bed in <D minor>, brightness <0.3>, a chord change on every cut; loudness <-14> LUFS.
