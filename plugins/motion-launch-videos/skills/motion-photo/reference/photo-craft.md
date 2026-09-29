# Photo craft: making a reel from pictures read as designed

Steps 2 and 3. The engine can move any picture any way; this file says which picture to show, how to crop it, and how much to move it. A photo reel fails in two ways: it looks like a slideshow (everything fades, nothing is designed), or it looks busy (everything moves at once and the product gets lost).

## One picture per beat

- **Choose the picture before the move.** Each beat has one idea and one image that says it: the hero shot for "new", a detail for a feature, the same shot in two finishes for "before and after", the range side by side for "four colours". An image that says nothing the words do not is a pause.
- **Look at every image first.** Read it, note what it shows, where the subject sits and how much empty space it has (that is where the words and tags go). Record the focus and the subject box as fractions of the image; the crop check keeps them in frame at every format.
- **Order by distance.** Wide shot, then medium, then detail, then the range, then the lockup. Two close-ups in a row read as the same shot.
- **Only the user's images.** Product shots, screenshots, cutouts, the team, the venue: theirs, or licensed to them, each in BRIEF.md's Assets table. People appear only with their consent, recorded in the brief.

## Crops and frames

- **Crop to the subject, not the centre.** A cover crop centres on the image's focus; put the focus where the eye should land (the product, the face, the screen's key element), not on the image's middle.
- **Leave the subject whole**: a product cut by the frame's edge reads as a mistake unless it is deliberately tight (a detail). The crop check warns when less than 90 % of the subject box is in frame.
- **One frame style per film.** One corner radius (24 to 32 px at 1080 for photos, less for small cells), one shadow (soft and low: blur 24 to 32, dy 12 to 20, 15 to 25 % of the ink colour), borders only if every frame has them.
- **Full-bleed for the hero, frames for the rest.** A full-bleed photo is the strongest single image; framed photos read as a set (a range, a comparison, a mosaic) and leave room for words.
- **Screenshots stay whole**: use `fit: 'contain'` on a matte for a screenshot whose edges matter, or crop to the one element the beat is about. Never stretch one.

## Resolution

- **Show a photo at no more than its own pixels.** The critique warns past 1.15x: an upscaled photo looks soft next to sharp type. A full-bleed image needs at least the canvas's size times the largest zoom: 1080 x 1080 for a square with no zoom, about 1250 px for a 1.15 zoom, and 1920 px on the long side for 9:16 or 16:9.
- **But not much more.** The film embeds every file whole, so a 4000 px photo shown at 1080 px quadruples the file size. Resize to about the largest size the film shows it at (the resolution row prints it); the engine pre-scales the rest.
- **JPEG for photos, PNG or WebP for cutouts and screenshots with flat colour.** A cutout needs a real alpha channel.

## Ken Burns

- **Slow, one direction, toward the subject.** A zoom of 10 to 15 % over the whole beat (3 to 6 s), or a pan of a tenth of the frame. Faster reads as a zoom effect, not a camera.
- **Out reveals, in focuses.** Pulling back from a detail to the whole product reveals it (the hook); pushing in on a detail says "look at this".
- **Eased drift, not a spring, for the long move.** `ease: 'drift'` starts and stops softly and keeps a constant speed in between, as a camera on a slider does. A spring (KEN) suits a short move that should land.
- **Never past the pixels.** The largest zoom sets the resolution the image needs.
- **Let it finish before the cut**, or carry it through the transition: a move that stops a frame before a cut draws attention to the stop.

## Parallax and cutouts

- **A cutout over its background** is the product floating in front of its set: the cutout at depth 1, the background at 0.2 to 0.4, the scene's drift a slow sideways move (a sixteenth of the frame) with a zoom of a few percent. The difference in speed is the depth.
- **Soften the background.** A background photo with a shallow depth of field (blurred before it is exported) separates the cutout from it, as a real lens would.
- **Give the cutout a shadow** offset away from the set's light, so it sits in the scene rather than on top of the picture.
- **Do not stand a cutout on something in the background** that moves at another speed: the parallax slides it off. Let it float, or keep both at the same depth.

## Galleries, sliders and mosaics

- **A carousel steps once a beat.** Each step lands (SWIPE settles in about 0.3 s to the eye) and holds before the next; the front card is full colour, the others smaller and dimmed toward the background.
- **A stack** throws the front card off to one side to show the next: good for three or four images of equal weight, one a beat.
- **Before and after**: the same framing in both images, aligned to the pixel. Sweep the divider most of the way across and back, and let it settle in the middle, where both sides are visible. Name the sides.
- **A mosaic assembles** a set in one gesture: cells stagger in a 16th apart, from the centre (`order: 'center'`) or in reading order. It makes a good lockup: the range, then the name under it.

## Tags and prices

- **True claims only**: every tag's words are a fact in BRIEF.md (`fact: 'F2'`), and a price only if the product's page states it today.
- **One tag lands at a time**, a beat apart: dot, leader, pill. Two at once are read as neither.
- **The dot sits on the thing the tag names** (the lid for "leakproof lid"), and follows it as it moves. The pill goes in empty space: sky, wall, the background, never over the subject.
- **Short leaders**, at a clean angle, not crossing the subject or each other.
- **Small print in pills** (mono, 26 to 32 px at 1080, 4.5:1 inside the pill). A price can use the accent colour for the pill.

## Type over photographs

- **Put words where the picture is quiet**: the wall above the product, the floor below it, a page beside it. Measure it: the contrast row reads the actual pixels behind the text.
- **When nothing is quiet, add a scrim**: a gradient from the edge the text sits on, in the ink colour at 60 to 80 %, eased so it has no visible edge. Or move the words off the picture onto the page (a framed photo with the words beside or under it).
- **Display type at least 3:1, small print at least 4.5:1**, against the worst part of what is behind it, at every format.
- **Four words a beat.** A photo already asks the eye to read; keep the words short and let the picture speak.

## Colour

- **The photos carry the colour.** The palette is for what is drawn: the background, the type, the pills, the frames' shadow, the scrim. Take the background from the photos (their wall colour, lightened) so the frames sit in the same light.
- **One accent**, for the price or the call to action.
- **A dark scene for a colourful range** (cards on near-black read as a gallery), a light page for type and comparisons. Vary them from beat to beat to mark the change.

## Formats

- **9:16 (Reels, TikTok, Shorts)**: the default for a social product reel. The picture above the words: a photo bleeding off the top and the sides, the words on the page below it. Keep type between y 360 and 1560 (the platform's buttons and caption cover the rest). Make frames taller (a card of 600 x 800) rather than leaving the square layout floating in the middle.
- **16:9**: the picture beside the words; a square photo cannot fill the frame without losing its top and bottom, so frame it on one side.
- **1:1**: the master; full-bleed photos with a scrim, or framed photos above the words.
- A square image cannot fill both 9:16 and 16:9 whole. Crop checks and resolution rows run at the format being rendered: run `stills` at each.

## Transitions and timing

- **Vary them**: a circle opening on the hero, a wipe into the float, a split into the comparison, the product's own silhouette into the range, a wipe up into the lockup. Three cross-fades in a row read as a slideshow.
- **A mask opens onto the next scene's background**: give a scene that needs a different colour a `bg`.
- **Every time is `beat(n)` or `bar(n)`.** Entrances start on 16ths; a carousel steps on beats; a tag lands a beat after the product.
- **Leave it landed.** Each picture gets about a second at rest before anything moves it again; the lockup gets 1.5 s or more from its first entrance to the end.

## The loop

- **Hold (the default).** The lockup is frame 0: the first scene's mask covers it at t 0, and it is rebuilt at the end and holds still. Every Ken Burns move and drift must have ended before the last frame.
- **Cycle.** For an endless gallery (`loop: { turn: 1 }` on a wrapped carousel), a breathing hero (`kb: { breathe: [2, 0.04] }`), bobbing cards: whole cycles per loop, nothing keyed that does not come back.

## Things that look good in a still and bad in motion

- A Ken Burns zoom and a carousel step at the same moment: two cameras.
- A tag that lands while its product is still moving in.
- A cutout drifting at the same speed as its background: no depth, just a slide.
- Cards that all enter at once: stagger them.
- A slider that sweeps and stops at an edge: the viewer never sees both sides together.
- A scrim that fades in after the words: they flash dark-on-light first. Bring the scrim in first.
