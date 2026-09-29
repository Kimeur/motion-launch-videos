# Overlay craft: graphics on someone else's picture

Step 2. An overlay is not the film: the footage is. It has to read on a picture you have not seen, sit where it hides nothing that matters, stay exactly as long as it takes to read, and leave. This file says how; engine.md says how to write it down.

## One overlay, one job

- **One film, one overlay.** A lower third, a card, a bug. An editor places each on its own track at its own time; two in one clip force them to move together.
- **Say only what the edit needs.** A lower third is a name and a role, not a biography: two lines, the second shorter. A chapter card is a number and at most five words.
- **Spell it as the person does.** Names, roles and handles come from the user, logged in BRIEF.md, with the person's permission for their name on screen. Never invent a role or shorten a name without asking.

## Where it sits

| Area | 1920 x 1080 | What goes there |
|---|---|---|
| Title safe (90 %) | 96 to 1824, 54 to 1026 | all text |
| Action safe (93 %) | 67 to 1853, 38 to 1042 | every plate, bar, icon and stroke |
| Middle ninth | 640 to 1280, 360 to 720 | nothing that stays, except a title card or an end screen |

Broadcast safe areas date from televisions that cropped the picture; today they keep an overlay clear of players' controls, rounded phone corners and a crop to another ratio. The critique checks them at rest.

- **Lower thirds** in a bottom corner, on the side of the frame away from the speaker's face: pin `'bl'`, or `'br'` (mirrored) when the speaker sits on the left. Their top edge at about 70 % of the height.
- **Bugs** in a top corner, usually the right; never the bottom right, where players put their controls.
- **Cards** in the middle, the only kind that may be.
- **Callouts** next to what they point at, the label on the side with the most empty picture, the arrow short.
- **9:16 feeds** cover their own video: the header over the top tenth, the caption, handle and sound over the bottom quarter, the buttons down the right below 40 % of the height. A lower third there sits just above the bottom quarter, from the left edge; a card sits a little above the centre.

## Reading on footage you have not seen

The footage can be a white wall, a sunset or a night street, and it changes under the overlay. Design for all of them.

- **A plate behind every line** is the most reliable: an opaque box in a dark or an accent role. The critique checks the text against its plate.
- **A scrim** (a plate at 70 to 85 % opacity, often a full-width band) keeps some of the picture. The critique mixes it over light, mid and dark footage and checks the worst.
- **No plate** needs a keyline (an outline of at least a tenth of the cap height, in a role that contrasts with the text) or it fails on footage of its own tone. White text with no plate and no keyline fails on light footage; that is the check working.
- **Strokes** with no plate (a callout's ring, an end screen's frame) carry a keyline too, at least 3:1 against the stroke, so one of the two always contrasts with the picture.
- **Sizes at 1080:** cap heights of at least 26 px for anything read (the role, a handle, small print), 40 px and up for a name or a title. Small text needs 4.5:1, big text 3:1. At 9:16, phones are held close but the picture is small: go up by a fifth.
- **Faces.** A semi-bold or bold grotesk reads at small sizes on moving pictures; tracked capitals (+60 to +120) for roles and kickers, mixed case for names. The template uses Barlow 700 and 600.

## Timing

| Kind | On screen | In | Out |
|---|---|---|---|
| Lower third | 3 to 6 s (video-types.md) | 0.5 to 0.75 s | about 0.4 s |
| Chapter or title card | 2 to 4 s | 0.75 s | 0.5 s |
| Social handles, subscribe | 4 to 6 s | 0.75 s | 0.5 s |
| End screen | 5 to 20 s, the platform's window | 1 s | 0.5 s |
| Callout | as long as the thing is on screen | 0.75 to 1 s | 0.5 s |
| Bug, badge | the whole video | hold loop | |

- **The hold is the reading time at least:** 15 characters a second, and never under 1.5 s. The critique compares the words with the hold; an editor who asks for a 6 s or a 10 s hold changes `timing.hold` and nothing else.
- **Out is quicker than in.** The viewer has read it; it leaves without fuss.
- **Start on the cut, not after it.** The editor places the clip where the overlay should begin; frame 0 is empty and the first pixels arrive on frame 1.

## Motion

- **Everything comes from somewhere.** A plate wipes open from the accent bar; the text slides out from behind the bar's edge, clipped by its plate, so it seems to be revealed rather than pasted on. A pill pops from its centre; a card's band opens from its centre line.
- **Entrances overshoot a little, exits not at all.** SLIDE and GROW overshoot by 2 %, POP by 16 % (pills and icons only). Exits are critically damped and fade as they move.
- **Stagger by 60 to 80 ms**: the bar, then each plate, then each line. More reads as slow, less as one block.
- **Blur is motion blur,** not decoration: every moving frame gets subframes, and the entrance focuses from a 6 to 10 px blur.
- **The hold is still** unless the motion means something: a button being pressed, a LIVE dot pulsing, one glint across a bug. Anything that moves through the hold pulls the eye off the footage.

## Colour

- **Two neutrals and one accent**: a near-black and a white for plates and text, the brand's accent for the bar, the role's plate or the button. Every colour is a palette role.
- **`bg` is the footage**, never drawn. Set it to what the overlay will sit on: a mid grey (the template's `#56606B`) for unknown footage, a dark grey for a night scene, a light grey for a bright studio. The MP4 and GIF previews show the overlay over it.
- **Accent plates carry dark text.** A saturated accent under white text rarely reaches 4.5:1.

## Sound

`FILM.audio` gives the overlay a whoosh as it comes in and a swish as it goes (`FILM.sfx` picks other cues or none). The render writes the normalised mix as `renders/<film>.wav` for the editor to lay under the clip; the .mov and .webm are silent. Keep it quiet (`loudness: -20` or lower): it sits under someone's voice. Say in the delivery note that the sound is optional.

## Kind by kind

- **Lower thirds.** Name and role: the name on a dark plate, the role smaller, tracked, on an accent plate, an accent bar at the edge. A place: a pin icon block and the place over its area or street. A quote's attribution: a quote-mark block and "— Name" over the role. One lower third per speaker, the first time they speak.
- **Title and chapter cards.** A kicker ("CHAPTER 2", "PART ONE") in the accent, a short rule, the title. A band at 70 to 85 % keeps the picture moving behind it. Chapters of one video share one design and differ only in their words: a pack.
- **Social handles and subscribe.** Handles exactly as the accounts spell them, with generic icons: an at sign, a globe, a play mark, a bell. Never the platforms' logos or their own button designs. A subscribe button that gets clicked tells the viewer what to do; the click comes a second into the hold, after the words have been read.
- **End screens.** At the time of writing YouTube shows end-screen elements (videos, playlists, a subscribe button, a link) over the last 5 to 20 seconds of a video at least 25 seconds long; check its help pages before you rely on that. Lay the elements out in YouTube Studio first, then copy their boxes into `zones`; the overlay frames them and adds a heading and the URL, and the critique keeps its own parts out of them.
- **Corner bugs.** Small (at most 2 % of the frame, a tenth of its height) and at most 80 % opaque: a watermark, not a logo sting. The user's own mark or a letter; one glint when it arrives, nothing after.
- **Callouts.** A ring round the thing, or an arrow to it from a label, drawn on; one callout at a time. The target is in the footage's coordinates: when the footage is cropped for 9:16, the target moves.
- **Progress bars and badges.** A progress bar measures time, so it fills linearly. A LIVE badge only on a stream or a recording of one.

## Packs

A pack is a set of overlays in one design: a lower third per speaker, a card per chapter, the social card and the end screen of a series. Make one film per overlay from the same template, sharing one DESIGN.md:

1. Design and approve the first film fully (stills in every format, a render, a look at the alpha).
2. Copy its folder for each other overlay: `videos/<pack>-<name>/`, with the same `src/film.html` and `fonts/`. Change only the words (and the kind, for a card or an end screen) in the `FILM` block; keep the palette, fonts, pads, timing and positions.
   ```bash
   for f in speaker-02 speaker-03 chapter-01 chapter-02; do
     mkdir -p videos/<pack>-$f/src && cp videos/<pack>-speaker-01/src/film.html videos/<pack>-$f/src/ && cp -R videos/<pack>-speaker-01/fonts videos/<pack>-$f/
   done
   ```
3. Keep one DESIGN.md for the pack (in the first film's folder, or next to the folders) listing every film and its words; each film's BRIEF.md logs its own names and sources.
4. Run `stills` for every film at every delivered format: a longer name can push a tier past title safe or make the hold too short to read.
5. Render them one after another (a loop in the shell), not in parallel on a small machine, and deliver the .mov (or .webm) files with names an editor can sort: `lower-third-01-rowan-tessaly.mov`.

## Delivering to an editor

- **Which file.** The ProRes 4444 `.mov` for Premiere Pro, DaVinci Resolve, Final Cut Pro and After Effects; the VP9 `.webm` for web players, OBS and editors that take WebM. The `.wav` goes on an audio track under the clip. The MP4 and GIF are previews over `bg`, not for the edit.
- **Straight alpha.** The files carry straight (unpremultiplied) alpha. An editor that reads them as premultiplied shows a dark fringe on soft edges: set the clip's alpha interpretation to straight.
- **Frame rate.** Render at the timeline's rate (`FPS: 30`, `25` or `24`); the in and out keep their seconds.
- **Size.** A ProRes 4444 file of a few seconds at 1080p is tens of megabytes even when most of it is transparent; the .webm is a fraction of a megabyte.
