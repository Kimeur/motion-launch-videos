# Brief: Acme Relay network film

The motion-globe skill's own demo, rendered as it ships in `templates/film.html`. **Demo data, fictional product:** Acme Relay is a fictional courier network invented for this demo. It has no live site (example.com is a reserved domain), so the brief is the only source, and every number in the film is invented. The film says so on screen: the source line reads `SOURCE: DEMO DATA, FICTIONAL PRODUCT` whenever a number shows, and the lockup carries `DEMO DATA, FICTIONAL PRODUCT`.

The skill was built from a reference film of the genre (someone else's product film). Its craft (timing, camera, density, light, HUD hierarchy, sound map) was measured; its brand, name, logo, copy, data, places and story were not used. Acme Relay's story, places, numbers, words, mark and palette are the demo's own.

## Deliverable

| | |
|---|---|
| Product | Acme Relay, example.com (no live site: a fictional product) |
| Style | motion-globe: a data globe film |
| Format | 1920 x 1080 (16:9) master; 9:16 (1080 x 1920) and 1:1 (1080 x 1080) from the same file |
| Duration | 31 s, `loop: 'none'` (1,860 frames) |
| Frame rate | 60 fps |
| Tempo grid | 100 BPM: a beat is 0.6 s, a bar is 2.4 s |
| Sound | a score of its own (a bed in E minor with a pulse) and the engine's cues, normalised to -14 LUFS |
| Where it plays | this repo's README gallery; the skill template's own demo |
| Deliverables | `globe-acme-relay.mp4` (16:9, with sound), `preview.gif`, `poster.png`, `poster-9x16.png`, `poster-1x1.png`, `globe-acme-relay.html` |

## Facts

| # | Fact | Exact wording at the source | Source | Read on |
|---|---|---|---|---|
| F1 | The product (fictional) | "Acme Relay", "GLOBAL COURIER NETWORK", "The world, same day.", "EXAMPLE.COM" | the skill's demo brief | 9 October 2026 |
| F2 | Parcels handed over today, per hub (invented) | São Paulo 12,480; Rio de Janeiro 9,215; Belo Horizonte 4,870; Brasília 3,360; Buenos Aires 10,940; Córdoba 3,725; Johannesburg 8,630; Cape Town 5,190; Mumbai 14,320; Bengaluru 7,645 | the skill's demo brief: "invented demo data" | 9 October 2026 |
| F3 | Share of those parcels delivered the same day, per hub (invented) | 97 %, 95 %, 96 %, 94 %, 93 %, 95 %, 92 %, 96 %, 91 %, 94 %, in the order of F2 | the skill's demo brief | 9 October 2026 |
| F4 | Couriers on shift, per country (invented) | Brazil 1,840; Argentina 620; South Africa 760; India 2,210 | the skill's demo brief | 9 October 2026 |
| F5 | Parcels handed over per two hours, 06:00 to 18:00, per hub (invented; each hub's six values add up to its F2 figure) | São Paulo 1,210 / 1,980 / 2,460 / 2,310 / 2,290 / 2,230, and so on for each hub (the `trend` dataset in `src/film.html`) | the skill's demo brief | 9 October 2026 |
| F6 | Where the places are | city-centre coordinates of the ten hubs and six route ends (Lisbon, Lagos, Accra, Bogotá, Lima, Santiago), to 4 decimals, from public gazetteers; each checked by the critique against the Natural Earth country raster | public gazetteers; Natural Earth (public domain) | 9 October 2026 |
| F7 | How the data is labelled on screen | "DEMO DATA, FICTIONAL PRODUCT" | the skill's demo brief | 9 October 2026 |

Numbers the film derives from these rows, computed by the engine rather than typed:

| On screen | Ref | Computed from |
|---|---|---|
| 80,375 PARCELS TODAY | `parcels.sum` | the sum of F2's ten hubs |
| 5,430 COURIERS | `couriers.sum` | the sum of F4's four countries |
| 10 HUBS · 4 COUNTRIES | `parcels.count`, `couriers.count` | the number of F2's hubs and F4's countries |
| HUBS 01/10 to 10/10 (telemetry) | the pins shown so far | the film's ten pins |

The telemetry's latitude, longitude and altitude are the camera's own position, and each card's progress percentage is the card's loading state: neither is a claim about the business.

## Not on screen

- **Any real courier, logistics or mapping company**: its name, logo, colours or numbers. The reference film's brand, wordmark, tagline, copy, places and figures in particular.
- **Any claim about real cities' parcel volumes or real couriers.** The numbers are invented and labelled as demo data.
- **Prices, delivery times or service areas.** The brief states none.
- **Borders or disputed territory.** The globe draws land as dots, with no borders; region titles name the country the pins are in.

## Message beats

| Beat | On screen | Small print | What moves | Facts |
|---|---|---|---|---|
| Open | Parcels cross oceans, / *hand to hand.* | the brand block, telemetry | the world forms; routes arc between South America, Africa and Europe | F1, F6 |
| Brazil | Brazil | ROUTES LIVE · BR; 1,840 COURIERS ON SHIFT; four cards: HUB SCAN, SYNCING / LIVE, parcels today · <hub>, <F2> PARCELS, <F3> SAME DAY, a bar per two hours, coordinates | the camera dives; four pins rise; cards count | F2 to F7 |
| Argentina | Argentina | as Brazil, two hubs | the camera hops south | F2 to F7 |
| South Africa | South Africa | as Brazil, two hubs | a flight across the Atlantic | F2 to F7 |
| India | India | as Brazil, two hubs | a flight across the Indian Ocean | F2 to F7 |
| Pull back | 80,375 | 10 HUBS · 4 COUNTRIES; PARCELS TODAY · 5,430 COURIERS | every beam, network arcs, the total counts up | F2, F4, F7 |
| Lockup | Acme Relay / The world, *same day.* / EXAMPLE.COM | DEMO DATA, FICTIONAL PRODUCT | the globe recedes into dust, a streak, the lockup | F1, F7 |

## Palette

The product has no brand, so the palette is the genre's: a near-black frame, a green holographic globe, cyan light for the routes, white beams, gold for a scan in progress and mint once it completes. The palette's hex values are the demo's own; they were not sampled from the reference as a brand.

| Role | Hex | Use |
|---|---|---|
| bg | #060606 | the frame |
| body | #080B0B | the sphere |
| rim, rimLit, atmo | #2BD67B, #3CF0BE, #2FD9C8 | the fresnel rim, the lit crescent, the halo |
| land, region, lit, hot | #2D3635, #33604E, #5FE3AC, #8CFFD0 | the dots: unvisited, visited, round a pin |
| arc | #3FD9FF | routes and flights |
| beam, white, bloom | #7DF5C8, #FFFFFF, #70FFE8 | beams and their glow |
| reticle | #E8A33A | the lock-on |
| text, accent | #ECF2EF, #62E8B0 | the subtitle, its accent line, second counts |
| wordmark, tagline, pill | #F2F0F1, #A2A4A3, #7FDDB8 | the lockup |

## Type

| Role | Face | Use |
|---|---|---|
| serif | Lora 600 | the subtitle, region names, the tagline |
| italic | Lora 500 italic | the subtitle's second line, the tagline's accent |
| mono, monoLight, monoBold, monoHeavy | JetBrains Mono 500, 400, 700, 800 | the HUD, the cards, the counts, the URL |
| sans | Outfit 700 | the wordmark |

All three families are under the SIL Open Font License; the licences are in `OFL/`.

## Open questions

None: a demo, made to show the skill.
