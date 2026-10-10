# Review: the pre-pass critique and the final checklist

Step 5 and the end of step 6. Nothing is rendered in full until the stills pass at every delivered format with 0 FAIL and 0 WARN, and nothing is delivered until the files verify and you have looked at the decoded frames.

## Pre-pass: `render.mjs stills`

It prints only the checks that did not pass (set `VERBOSE=1` to see all), writes one PNG per planned frame to `videos/<film>/stills/` and a labelled `contact.png`, and exits non-zero when anything fails. With `--format 9:16` (or `1:1`) it checks the film at that ratio and writes to `stills/9x16/`; run it once per delivered format.

The planned frames: frame 0, the globe formed, the subtitle at rest, each flight in the air, each region locked (its title in, its land lit), each card at rest with its counts landed, the pull back with the total landed, the streak, the lockup at rest, and the last frame.

### Automated checks

| Check | Fails (or warns) when | Fix |
|---|---|---|
| glyphs | a character is not in the cmap of the face that draws it (a place name's accent, a degree sign) | another face or subset, or the name as the brief spells it in a face that has it (fonts.md) |
| place | a place's coordinates lie in the sea or in another country (warns within 30 km of its country across a border) | the coordinates (latitude and longitude swapped? a sign lost?) or the country code |
| data | a dataset with no source, a source with no `FILM.sources` entry, values that are not numbers, series and categories of different lengths | complete the dataset from BRIEF.md |
| numbers, free numbers | a ref that resolves to nothing or to a series; a digit typed into a text that the data does not hold (warns when it does) | a `{ref}`, or `literal` for a year or a version |
| source line | numbers on screen and no source | `source` on every dataset, `FILM.sources` |
| arc | an arc between a point and itself or its antipode | other places, or a waypoint |
| camera | the camera lower than `globe.minAlt`, or its horizon behind it | raise the region's `view.alt`, lower its tilt |
| region | an unknown country; a pin in another country than its region (warns: it lights the wrong land) | the code, or move the pin |
| card | a card leaves the live area, hits another card, covers a HUD block or its own beam, or its pin is out of sight for most of its life | the pin's `at`, the region's `view`, or the card's `side`, `dx`, `dy` |
| reading time: card | open under 0.9 s (warn) or 0.6 s (fail) | the next beat later, or the pin earlier |
| cards at once | more than 3 open together (warn) | spread the pins (`gap`) |
| reading time: subtitle, title, total | the subtitle held under 0.3 s a word + 0.6 s, a title under 1.5 s, the total under 1 s after it lands (warn) | longer beats |
| live area | a HUD block outside the margin | its `hud` position |
| contrast | a text under 4.5:1 (3:1 for the subtitle, a region name, the total, the tagline) against the 95th percentile of what is behind it, measured on the frame drawn without its text | a stronger `hud.scrim`, a brighter role, or move the block off the globe |
| palette roles | a colour that is not a palette role | add the role |
| composition | the ink leans past a fifth of the frame in a direction nobody declared | the region's `view` or `globe.frame`; at 9:16 bring the HUD in |
| loop | a loop other than `'none'` (warn) | `loop: 'none'` |
| audio, audio bed | `FILM.audio` with no cues; a boom within 2 s of the end (its tail is cut) | the outro earlier, or the boom off |
| blank frames | 4 or more frames with nothing on screen (the dark open is star field, so it counts as drawn) | the open's `form` earlier |

### By eye, on the contact sheet and the full-size stills

- **Does the world read as the world?** The land is recognisable at every distance, the region lights up when its title arrives, no dots where the sea should be.
- **Does the camera know where it is going?** On a flight, the arc leads and the camera follows; the arrival is calm; nothing bounces.
- **Is each card readable?** One count, its label, landed; the card beside its beam, the leader short and not crossing another; the beam visible.
- **Is the light right?** Arcs and beams the brightest things in the frame, the land dim, the body black; no white blowout round a hub in the pull back.
- **Do the words match the brief?** Every place name spelled as the brief spells it, every number against the Facts table, the source line on screen with them.
- **Each format** looks designed for its frame: at 9:16 the globe in the middle of the frame, the title and the total near it; at 1:1 the cards clear of the frame's edges.
- **The lockup**: the product's own mark and name, the tagline, the URL; for a demo, the demo line.

Fix, rebuild, and run stills again.

## Before delivering

1. `loopcheck`: for `loop: 'none'` the purity lines must read 0 (a seek must not depend on what was drawn before).
2. `render`: the full film with sound, in the background (about 12 minutes for 30 s at 1080p on 4 cores); `--crf 28` to `30` for a file of 6 to 8 MB.
3. `verify`: every check passes: frames, tags, faststart, the decoded frames against the canvas, the audio stream and its loudness.
4. `mp4frames`: look at `stills/mp4/contact.png` and at a flight frame full size (the most motion blur), a card frame and the lockup.
5. Listen: the booms on the world forming, the first pin, the total and the lockup; a ping on each pin; nothing clipped at the end.

   Run `render`, `verify` and `mp4frames` once per delivered format, with the same `--format` flag each time.
6. Report: the files with sizes, the critique counts per format, what verify said (loudness included), the loopcheck lines, the lowest mp4frames PSNR, and anything you could not check.

## What never ships

- A place in the wrong country, or a number that is not in the brief's Facts.
- Demo data without the demo line on screen, or a source line missing while numbers show.
- Another company's brand, logo, name or copy, including the reference film's.
- A card that covers another, leaves the frame, or closes before it can be read.
- A camera that dips into the dots.
