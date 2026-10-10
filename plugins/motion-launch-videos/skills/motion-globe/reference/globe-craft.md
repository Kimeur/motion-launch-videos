# Globe craft: how a data globe film is put together

Steps 2 and 3. What makes the genre work: a world that is believable at every distance, a camera that always knows where it is going, light that carries the eye, and numbers that arrive one at a time and stay long enough to read. The template's defaults are measured from a reference film of the genre (a 30 s, 1080p, 60 fps product film); the numbers below are those measurements, and the template's demo follows them.

## What it is for

A place-based story: a network (hubs, stores, couriers, data centres), a footprint (where customers are, where a product launched), a flow between places (shipments, transfers, calls). It needs places with coordinates and something to count at each. It is not a map: no streets, no borders drawn, no labels on the land. Country names come in as titles, city names in the cards.

## The shape of a 30 s film

| Share | Seconds | Beat | What happens |
|---|---|---|---|
| 0 to 5 % | 0 to 1.5 | dark | specks of star field and grain only; the sound fades in; the eye settles |
| 5 to 10 % | 1.5 to 3 | the world forms | a shock ring pops, the sphere fades in, the rim lights, the land dots fade in, orbit rings sweep round; the first boom |
| 10 to 23 % | 3 to 7 | the promise | routes arc over the slowly turning globe while one line of subtitle says what the film is about |
| 23 to 80 % | 7 to 24 | the regions | a dive to the first country, a hop to its neighbour, two flights across oceans; 2 to 4 pins each, a card per pin; the pulse runs |
| 80 to 92 % | 24 to 27.5 | the pull back | the whole network, its beams bundled at each hub, network arcs between regions, the running total counting up |
| 92 to 100 % | 27.5 to 30 | the lockup | the globe shrinks and breaks into dust, a streak of light, the mark, the wordmark, the tagline, the URL; the last boom |

The first region gets the most time (the viewer learns how a pin and a card work), later ones less: in the demo, 4 pins over about 5 s, then 2 pins in about 2 s for each later country. Never more than two cards open at once.

## The camera

- **Wide** (19,000 to 40,000 km): the whole globe in frame, about 85 % of the frame height at 19,400 km, flat, orbit rings visible. The open and the pull back.
- **Region** (3,200 to 14,000 km): the country fills the middle of the frame, tilted 40 to 53 degrees so the horizon curves across the top and the atmosphere glows along it. Lower is closer and more tilted.
- **Dive**: from wide to the first region in about 3 s, the altitude falling with the move and the tilt coming in during its last two thirds, so the horizon rises into frame as the camera arrives.
- **Hop**: to a neighbour in about 2.6 s, lifting a little and flattening on the way, like a jump.
- **Flight**: an arc launches from the last pin towards the next country; a quarter second later the camera chases its head along the same great circle, lifting and flattening mid-flight, landing as the arc lands. The arc leads, the camera follows: the viewer always sees where they are going.
- **Drift**: inside a region the camera leans towards each new pin and settles back after the last. It is slow enough that a card can ride its pin.
- **Rule**: the camera is still (or nearly) when a card opens, and every ease lands without overshoot. A camera that bounces on arrival reads as a mistake on a planet.

## The world's look

Back to front: the star field (single-pixel specks that live two frames, about 950 a frame at 1080p), slow drifting motes, the back halves of the orbit rings, the atmosphere outside the limb (a halo about 7 % of the radius, 11 % and brighter in close shots), the opaque body (near black, a hint of the hue), a fresnel rim inside the limb (nothing at 70 % of the radius, a peak just inside the edge) with a lit crescent towards the upper right, then the land dots, the decals on the surface (reticles, rings), the arcs, the beams, the front halves of the rings, and the shock ring. A quarter-size bloom adds back the brightest light, blurred.

- **Dots**: a Fibonacci lattice, about 35,000 on land out of 120,000 over the sphere (0.6 degrees apart), each world-sized (0.1 degree of arc) so they grow as the camera comes down and never drop under about a pixel in a wide shot. Land is dim (a dark grey-green), the visited country brighter, the pins' surroundings lit by a glow and a wave that runs out from each pin as it lands. No ocean dots, no borders: the land's shape is enough.
- **Additive light**: everything that glows is added, not painted, so crossings brighten and nothing covers anything. Keep the body near black and the land dim (a few percent luminance each), or the light has nothing to stand on.
- **Texture**: a fixed grain and a fine scanline every third row, drawn once per frame over everything. It binds the HUD to the picture and hides banding in the gradients. It costs bitrate.

## Arcs

| Kind | Height | Draw time | Look |
|---|---|---|---|
| intro | 6 to 30 % of the radius by length | 0.45 to 0.8 s | thin, many, every 0.3 s; one in four in the rim colour; each settles to a third over 1.4 s and its head stays lit 0.9 s where it lands, so five or six routes are lit at once; all fade at the end of the open |
| flight | 15 to 25 % | 0.2 to 1.8 s | the hero: thick, a white core near the head |
| link | 5 to 8 % | 0.2 to 0.6 s | short hops between pins in a region, landing on the next pin's flash |
| network | 8 to 26 % | 0.5 s | the pull back: hubs of every region joined, staggered 0.12 s |

An arc is a great circle lifted by a sine of its length; its trace stays at 40 %, the comet over it runs from 35 % at the tail to full at the head, brightest over its last third, then settles (an intro arc to a third, a flight to its trace, a link or network arc to half). The head is a white-hot point in a disc of the arc's colour. The globe hides the parts behind it.

## Pins and beams

0.48 s before a pin, an orange reticle locks on: it shrinks from 2.4 times its size in a quarter second while it spins, and holds. Then a flash, the beam rises in 0.15 s along the surface normal (about 150 px seen side on, white at the core, mint round it, a bloom at the base), a ring expands round the base over 1.2 s, and a wave of light runs through the dots. The head is a small ring with a dark eye, where the card's leader starts; once its region is left, a white square. In the pull back every beam stands at once, bundled at each hub, pointing out of the globe: the network made visible.

## Cards

A card is a glass panel (dark, 80 % opaque, a faint edge, two corner ticks) on a leader line from its beam's head: a short diagonal, then a run to the near corner. Inside, top to bottom: a chip and a status (a gold pulsing dot while busy, mint when done), the typed query with a cursor, the big count with its label beside a small bar chart, the second count, a progress bar with its percentage, the coordinates. 356 x 232 px at 1080p.

It opens 0.22 s after its pin from a line of light, types at 85 characters a second, counts up over 0.84 s (easing out, landing exactly), grows its bars, completes at 1.47 s and closes at 1.95 s. One card says one thing: a count of something at that place. The count and its label read in about 0.9 s; give each card at least that open.

## The HUD

A quiet frame that says "live instrument" without competing: corner brackets 36 px in; the brand top left (the mark, the name, a tracked kicker); telemetry top right (the camera's latitude, longitude and altitude, live, and the pin counter with a progress line); the region title bottom left (a tracked kicker, the name typed in a serif with a grey to white gradient, a rule, a stat); the total bottom right; the source line bottom centre whenever a number is on screen. Mono type everywhere a number lives (labels 11 to 14 px, grey on black; counts 28 to 68 px); the serif for the words that matter. The margin is 64 px.

## Words

- One subtitle line pair in the open (6 to 10 words): the promise. The second line in the italic accent.
- A region title is the country's name, nothing more; its kicker and stat are small print.
- Cards carry a few words of query and two labels. Numbers do the talking.
- The lockup: the wordmark, a tagline of 3 to 5 words with an italic accent, the URL in a pill.
- Reading times the critique holds you to: a subtitle 0.3 s a word plus 0.6 s, a card 0.9 s open, a region title 1.5 s, the total 1 s after it lands.

## Sound

A score in one key under the picture (audio.md, A bed): a pad and drone from the start, a boom with a swell into it as the world forms, a second when the first pin lands and the pulse starts (kick and hats at the film's tempo), an arc swell on each flight peaking as it lands, a ping per pin (panned to it), tiny data blips under every typed query and count, a two-tone lock as each card completes, a boom on the total, and the last boom on the lockup, where the chord lifts. Normalise to -14 LUFS. The reference's score is mastered like music (-13 LUFS, a loudness range under 2 LU): its mass sits between 150 Hz and 1.2 kHz, the sub arrives with the first boom and stays, and everything above 4 kHz is 20 dB under the body, dark and warm with a little sparkle. Its hits add only 1.5 to 2.5 LU: the bed carries the loudness, the booms carry the punch.

## Formats

16:9 is the master: the globe is a wide-screen subject. At 9:16 the globe keeps its size and the frame gains sky: raise the camera's target, bring the HUD blocks in to the globe, and pull the wide shots back so the globe fits the width. At 1:1 the cards have less room beside their pins: check every card still.

## Studying a reference

Take its timing (the table above), its camera language, its density (how many dots, how thick an arc, how bright a beam), its HUD hierarchy and its sound map; measure them from frames. Leave its brand, logo, name, colours as a brand identity, copy, data, places and story: the film you make is about the user's product, in its words, with its numbers.
