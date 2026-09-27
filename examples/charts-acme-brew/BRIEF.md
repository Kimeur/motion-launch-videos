# Brief: Acme Brew data loop

The showcase for the motion-charts skill, made with it, and the demo its template runs as. Acme Brew is a fictional coffee app invented for this demo. It has no live site, so, as brief.md says, the brief is the only source, and every number in the film is invented demo data. The film says so on screen: every chart's source line reads `SOURCE: DEMO DATA, FICTIONAL PRODUCT`, and the lockup carries `DEMO DATA, FICTIONAL PRODUCT`.

## Deliverable

| | |
|---|---|
| Product | Acme Brew, example.com (no live site: a fictional product; example.com is a reserved domain) |
| Style | charts (motion-charts) |
| Format | 1080 x 1080 (1:1) |
| Duration | 12 s, hold loop (720 frames) |
| Frame rate | 60 fps |
| Tempo grid | 120 BPM: a beat is 0.5 s, a bar is 2 s, a 16th is 0.125 s |
| Sound | none (a muted loop; every beat has to work muted) |
| Where it plays | this repo's README gallery; the skill template's own demo |
| Deliverables | `charts-acme-brew.mp4`, `preview.gif`, `poster.png`, `charts-acme-brew.html` |

## Facts

The brief asked for a fictional coffee app with invented demo data, clearly labelled on screen. The values below were invented for the demo; they describe no real business, and the film never implies they do.

| # | Fact | Exact wording at the source | Source URL | Read on |
|---|---|---|---|---|
| F1 | The product | "a fictional coffee app "Acme Brew", example.com" | the user's brief | 27 September 2026 |
| F2 | Cups brewed per day over one week (invented) | MON 5,820; TUE 6,140; WED 6,390; THU 6,905; FRI 7,660; SAT 9,120; SUN 6,180 | the user's brief: "invented demo data", a week of cups per day, Mon to Sun | 27 September 2026 |
| F3 | Milk in each cup, as a share of cups (invented) | OAT 46 %, DAIRY 38 %, NONE 16 %, of a whole of 100 % | the user's brief: "invented demo data" | 27 September 2026 |
| F4 | How the data is labelled on screen | "DEMO DATA, FICTIONAL PRODUCT" | the user's brief | 27 September 2026 |

Numbers the film derives from these rows, computed by the engine rather than typed:

| On screen | Ref | Computed from |
|---|---|---|
| 48,215 | `week.sum` | the sum of F2's seven days |
| BUSIEST DAY (on Saturday) | the note on `week.SAT` | Saturday is F2's largest value, 9,120 |
| OAT MILK LEADS. / 46% | `milk.OAT` | oat is F3's largest share |

## Not on screen

- **Any real coffee chain or app**: its name, logo, colours or numbers.
- **Any claim about real coffee drinkers.** The shares are invented; the film states them as this fictional app's data, labelled as demo data, never as a fact about the world.
- **Prices, downloads, ratings or growth rates.** The brief states none.
- **An app-store badge** or any platform's marks.

## Message beats

| Beat | On screen | Small print | What moves | Facts |
|---|---|---|---|---|
| Hook | 48,215 / CUPS BREWED. | IN ONE WEEK; the source line | the week's total counts up on a crema frame | F2 (sum), F4 |
| What it shows | CUPS PER DAY | the seven days and their values; BUSIEST DAY; the source line | seven columns grow, their values counting; Saturday lights up | F2, F4 |
| Proof | OAT MILK LEADS. / 46% | OAT; DAIRY 38%, NONE 16%; the source line | a donut sweeps round, its shares counting | F3, F4 |
| CTA | ACME BREW / EXAMPLE.COM | DEMO DATA, FICTIONAL PRODUCT | a bean pops, its crease draws, the name lands, the domain types | F1, F4 |

Each beat has at most 4 words of display type; the critique counted 3, 3, 4 (a counter counts as one) and 2.

## Palette

The product has no brand, so the palette is built for the subject and validated for the charts: an espresso background that keeps the data the loudest thing, one crema accent for the story, and two neutral marks.

| Role | Hex | Source |
|---|---|---|
| bg | #140F0C | espresso; dark and warm |
| ink | #140F0C | the background colour as type, on the crema hook |
| well | #2B221C | the donut's track, opaque |
| paper | #F7F0E6 | milk foam: titles and values |
| muted | #A8998A | category names, notes' small print, source lines |
| crema | #FFA62B | the accent: the hook's frame, the lit bar, oat, the bean |
| foam | #E6D5C3 | the light neutral mark (dairy) |
| roast | #8A7462 | the mid neutral mark (the bars that are not the story; none) |

## Type

| Role | Face | Use |
|---|---|---|
| display | Inter Tight 800 | titles, the counter, the donut's centre |
| label | Inter 700 | values on the bars, the slice labels |
| mono | IBM Plex Mono 500 | category names, the note, small print, source lines |

## Open questions

None. The brief came from the repository's maintainer and was complete; there was no one else to ask.
