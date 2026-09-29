# Brief: Acme Flask photo reel

The motion-photo skill's own demo, rendered as it ships in `templates/film.html`. Acme Flask is a fictional insulated flask: there is no live site, so the brief below is the only source, the domain is the reserved `example.com`, and the film says `DEMO COPY, FICTIONAL PRODUCT` on screen. The product photos are not photographs of a real product: they are renders made for this demo with this repository's own motion-3d engine.

## Deliverable

| | |
|---|---|
| Product | Acme Flask (fictional, no live site), example.com |
| Style | motion-photo: a product reel from the user's own images |
| Format | 1080 x 1080 (1:1) master; also 9:16 (1080 x 1920, the social product reel) and 16:9 (1920 x 1080) from the same film |
| Duration | 13 s, hold loop (780 frames) |
| Frame rate | 60 fps |
| Tempo grid | 120 BPM: a beat is 0.5 s, a bar is 2 s, a 16th is 0.125 s |
| Sound | none; a muted loop |
| Where it plays | this repo's README |
| Deliverables | `photo-acme-flask.mp4` (1:1), `preview.gif`, `poster.png`, `poster-9x16.png`, `poster-16x9.png`, `photo-acme-flask.html`, and `assets/` so the source rebuilds |

## Facts

| # | Fact | Exact wording at the source | Source |
|---|---|---|---|
| F1 | Name | "Acme Flask" | the skill's demo brief, 28 September 2026 |
| F2 | It keeps drinks cold | "24 h cold" | the skill's demo brief |
| F3 | Its lid | "leakproof lid" | the skill's demo brief |
| F4 | Its price | "from $32" | the skill's demo brief (a fictional price for a fictional product) |
| F5 | The range | "four colours: sage, coral, sky, sand" and a new finish replacing "graphite" | the skill's demo brief |
| F6 | The call to action | the domain, example.com | the skill's demo brief |
| F7 | It is not real | "DEMO COPY, FICTIONAL PRODUCT" | shown on screen |

## Assets

Every image the film embeds, from `assets/`. All were made for this demo by the skill's author with the motion-3d engine in this repository (a flask built from a cylinder, a sphere, a rounded box and a torus on a plinth, lit by its key light), rendered with `render.mjs at`, and resized, blurred or cut out in headless Chromium. No stock photos, nothing downloaded, no real product.

| # | File | Shows | Pixels | Source |
|---|---|---|---|---|
| A1 | hero-sage.jpg | the sage flask on a plinth among props | 2000 x 2000 | our own render (motion-3d) |
| A2 | set-coral.jpg | the coral set without the flask, softened as by a shallow depth of field | 1800 x 1800 | our own render (motion-3d), blurred |
| A3 | flask-coral.webp | the coral flask alone, with transparency | 378 x 1000 | our own render (motion-3d), cut out with a difference matte (the same frame on black and on white) |
| A4 | before-graphite.jpg | the graphite flask on its set | 1100 x 1100 | our own render (motion-3d) |
| A5 | after-sky.jpg | the same shot in sky blue | 1100 x 1100 | our own render (motion-3d) |
| A6 | tile-sage.jpg | the sage colourway, portrait | 690 x 920 | our own render (motion-3d) |
| A7 | tile-coral.jpg | the coral colourway | 690 x 920 | our own render (motion-3d) |
| A8 | tile-sky.jpg | the sky colourway | 690 x 920 | our own render (motion-3d) |
| A9 | tile-sand.jpg | the sand colourway | 690 x 920 | our own render (motion-3d) |

## Not on screen

- Any claim beyond F2 to F5: no capacity, material, warranty, rating or comparison; the brief states none.
- Any real brand's bottle shape, logo or colour name: the flask is built from primitives, the colours are named plainly.
- People: the reel shows only the product.

## Message beats

| Beat | On screen | Picture and move | Facts |
|---|---|---|---|
| Hook | NEW COLOURS. | the sage flask, full-bleed, a slow pull-back (Ken Burns) | F5 |
| Detail | LEAKPROOF LID, 24 H COLD (tags) | the coral flask floating over its set (parallax), two tags drawn to it | F3, F2 |
| Proof | NEW FINISH. | a before/after slider from graphite to sky | F5 |
| Range | FOUR COLOURS. / FROM $32 (tag) | the four colourways on a carousel, the price tag on the last | F5, F4 |
| CTA | ACME FLASK / EXAMPLE.COM | the four colourways assembling into a strip | F1, F6, F7 |

Each beat has at most 4 words of display type; the critique counted 2, 0, 2, 2 and 2. The tags are small print and cite their facts.

## Palette

| Role | Hex | Use |
|---|---|---|
| bg | #F4F0E8 | the page: a warm white taken from the sets' light walls |
| ink | #19181D | type on the page, the scrim |
| paper | #FFFFFF | type on photos and on the dark scene, pills, leaders |
| shade | #19181D | frame and cutout shadows |
| coral | #B8391B | the price tag, the domain (5.1:1 on the page, 5.8:1 under white type) |
| night | #1E1D24 | the carousel scene's background |

## Type

| Role | Face | Use |
|---|---|---|
| display | Bricolage Grotesque 800 | the beats and the name |
| mono | IBM Plex Mono 500 | tags, labels, the domain and the small print |

## Open questions

None: a demo, made to show the skill. Format defaults: a social product reel is delivered at 9:16; this example ships the 1:1 master's MP4 and a poster of each format.
