# Brief: Acme Trips app preview

The showcase for the motion-ui skill, and the demo its template runs as. **Acme Trips is a fictional product**: there is no live site, no app and no screenshots. Every word and every screen comes from the brief the skill's author wrote for the demo (quoted under Facts), and the film says so on screen: DEMO COPY, FICTIONAL PRODUCT. A film for a real product works the other way round: its screens are rebuilt from the user's own screenshots, and nothing is designed from a description.

## Deliverable

| | |
|---|---|
| Product | Acme Trips, example.com (a reserved domain): no live site, a fictional travel planner |
| Style | UI promo (motion-ui): a phone, a finger, callouts, a lockup |
| Format | 1080 x 1080 (1:1); the same film also renders at 9:16 (1080 x 1920, an app store preview) and 16:9 (1920 x 1080, a landing-page hero) |
| Duration | 12 s, hold loop (720 frames) |
| Frame rate | 60 fps |
| Tempo grid | 120 BPM: a beat is 0.5 s, a bar is 2 s, a 16th is 0.125 s |
| Sound | none (a muted loop; every beat has to work muted) |
| Where it plays | the README gallery of this repo |
| Deliverables | `ui-acme-trips.mp4` (H.264, BT.709), `preview.gif` (480 px), `poster.png`, `ui-acme-trips.html`; `poster-9x16.png` and `poster-16x9.png` show the other formats |

## Facts

Only what the brief states. The Source column is the brief itself, read on 27 September 2026.

| # | Fact | Exact wording at the source | Source | Read on |
|---|---|---|---|---|
| F1 | The product and its domain | "a fictional travel planner "Acme Trips", example.com" | the user's brief | 2026-09-27 |
| F2 | The first screen | "a phone slightly left of centre showing a list of trips" | the user's brief | 2026-09-27 |
| F3 | The action | "the finger taps the "Lisbon" card → it expands/pushes to a detail screen" | the user's brief | 2026-09-27 |
| F4 | The result | "a "Save" button tap → a toast "Saved"" | the user's brief | 2026-09-27 |
| F5 | The callouts | "callouts like "PLAN IT." / "SAVE IT." beside the phone" | the user's brief | 2026-09-27 |
| F6 | The lockup | "a simple original app icon (e.g. a paper plane built from shapes), "ACME TRIPS", "EXAMPLE.COM", and small print "DEMO COPY, FICTIONAL PRODUCT"" | the user's brief | 2026-09-27 |

## Not on screen

- **Any real app store, badge or platform mark.** The phone is generic: a rounded body, a camera dot, a plain status bar.
- **Photos.** The trip pictures are flat illustrations in the palette's colours (sky, sun, hills, roofs), standing in for the photos a real app would show.
- **Dates, prices, ratings, durations or any other numbers.** The brief states none; the text under each trip is skeleton bars.
- **Other features** (sharing, maps, bookings). The brief names a list, a detail screen, a Save button and a toast; the film shows only those.
- **A real person.** The account avatar is the initials "AK" of no one in particular.

Two things are demo data, labelled as such by the small print: the names of the other two trips in the list (Kyoto and Oslo, real cities used as sample trips) and the third callout, "SEE IT.", written in the pattern of the brief's two.

## Screens

There are no screenshots to rebuild from, so the two screens were designed for the demo in the plainest travel-app idiom:

| Screen | What is on it | Simplified |
|---|---|---|
| trips | the large title "Trips", the account avatar, three trip cards (a picture with the city's name on a dark band) | no search, filters or tab bar; the list scrolls under a plain status bar |
| lisbon | the Lisbon picture as a header with a back button, two meta rows (a calendar and a pin icon with bars), a paragraph and two plan rows as bars, the Save button | every line of text but the title is a skeleton bar |

The Lisbon card is the top of the Lisbon screen at 8/9 scale (both are built from one list of layers), so the card grows into the screen with no jump.

## Message beats

At most 4 words of display type each. One call to action, at the end.

| Beat | On screen | What moves | Facts |
|---|---|---|---|
| Arrive | PLAN IT. | the phone rises in on the list; the finger drags it up to Lisbon | F2, F5 |
| Act | SEE IT. | the finger taps the Lisbon card; it grows into the Lisbon screen | F3, F5 (the pattern) |
| Confirm | SAVE IT. | the camera closes in on Save; the finger taps it; it turns to Saved; the camera pulls back as the toast drops in | F4, F5 |
| CTA | ACME TRIPS / EXAMPLE.COM | the phone drops away; the paper-plane icon pops in, the name lands, the domain and the small print type in | F1, F6 |

## Palette

No brand to take colours from: the template's own palette, a cool light background with one blue.

| Role | Hex | Source |
|---|---|---|
| bg | #EEF1F6 | template |
| ink | #0E1116 | template: text, the phone, the toast |
| paper | #FFFFFF | template: screens, labels on dark |
| line | #DCE1E8 | template: skeleton bars |
| muted | #5A6272 | template: small print |
| brand | #2356F0 | template: the Save button, the icon, the leader dots, the domain |
| tint | #E2EAFE | template: the saved state, the avatar |
| sky, haze, deep | #BCD7FF, #8DB3EE, #15326B | template: the trip pictures (one blue hue) |
| sun, roof, sand | #FFC247, #E1623A, #F6E4C4 | template: the trip pictures' warm accents |
| shade, edge | #C3CCD8, #39404C | template: the phone's shadow and outline |

## Type

| Role | Face | Use |
|---|---|---|
| ui | Inter 600 | the UI: labels, the avatar, the toast, the clock |
| display | Inter Tight 800 | titles on screen, the callouts, the lockup name |
| mono | IBM Plex Mono 500 | the domain and the small print, typed in |

## Open questions

None. The brief specified the demo; every choice it left open (the third callout, the other two trips, the palette, the timing) is recorded above and in DESIGN.md.
