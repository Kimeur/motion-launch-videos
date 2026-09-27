# Brief: Crux launch bumper

The showcase for this skill, made with it. Crux ([cruxpost.com](https://cruxpost.com)) is the author's own product. Every line of copy traces to a row in "Facts", read on the live site on 26 and 27 September 2026 (the site's FAQ says "Answers updated 24 September 2026").

## Deliverable

| | |
|---|---|
| Product | Crux, [cruxpost.com](https://cruxpost.com) |
| Format | 1080 x 1080 (1:1) |
| Duration | 12 s, seamless loop (720 frames) |
| Frame rate | 60 fps |
| Tempo grid | 120 BPM: a beat is 0.5 s, a bar is 2 s, a 16th is 0.125 s |
| Sound | none; a muted loop |
| Where it plays | an X post and the README of this repo |
| Deliverables | `crux-launch.mp4`, `preview.gif`, `poster.png`, `crux-launch.html` |

## Facts

| # | Fact | Exact wording at the source | Source URL |
|---|---|---|---|
| F1 | Name | "Crux, also called Cruxpost after its domain cruxpost.com" | https://cruxpost.com/ (FAQ, "What is Crux (Cruxpost)?") |
| F2 | Who it is for | "X (Twitter) analytics for people who post" | https://cruxpost.com/ (hero) |
| F3 | The promise | "Learn what works on your X account. And what to stop posting." | https://cruxpost.com/ (hero headline) |
| F4 | What it does | "Crux reads your own X posts, from an archive or a read-only import, and finds the hooks, formats, topics and best times to post that work for your account." | https://cruxpost.com/ (hero) |
| F5 | The hook line | "Stop guessing what works for your account." | https://cruxpost.com/ (closing section) |
| F6 | The proof | "Only patterns that hold up are reported" | https://cruxpost.com/ (How it works, step 3) |
| F7 | The proof's numbers | "A group needs at least 5 posts, and it is reported only when its result falls outside what 500 random draws of your own posts produce." | https://cruxpost.com/ (How it works); also https://cruxpost.com/methodology ("a group needs at least 5 posts", "500 random draws") |
| F8 | The call to action | "Request early access" (the site's buttons); "Crux is in early access. Ask for an invite with your X handle" | https://cruxpost.com/ |
| F9 | The domain | cruxpost.com | https://cruxpost.com/ (`og:url`) |

## Not on screen

- **Any price or trial term.** The pricing page says "One plan, $19 a month, once billing opens" and "Billing is not open yet" (https://cruxpost.com/pricing). A price in the film would be a promise the product cannot keep today.
- **"Free during early access".** True today, but it is a pricing claim that will expire, and the film should not go stale.
- **The home page's demo scores** (Momentum 94, "×3.2 a usual day", "2.2× your usual reach"). The site labels them sample data.
- **Other features** (Radar, Today, drafts in your voice). True, but one message per film.
- **X's logo or marks.** The site says Crux is "Not affiliated with, or endorsed by, X Corp." The film names X only as the platform, as the site does.

## Message beats

| Beat | On screen | Crumb | Facts |
|---|---|---|---|
| Hook | STOP GUESSING. | WHAT WORKS ON YOUR X ACCOUNT | F5, F3 |
| What it does | READS YOUR OWN POSTS. | ARCHIVE OR READ-ONLY IMPORT | F4 |
| The detail | HOOKS. FORMATS. TOPICS. TIMES. | | F4 |
| Proof | PATTERNS THAT HOLD UP. | AT LEAST 5 POSTS / 500 RANDOM DRAWS | F6, F7 |
| CTA | CRUX / CRUXPOST.COM | REQUEST EARLY ACCESS | F1, F8, F9 |

Each beat has at most 4 words of display type; the stills critique counted 2, 4, 4, 4 and 2.

## Palette

Crux has a clear brand colour, so the film uses the site's own dark-theme tokens, read from its stylesheet (a hashed build file, `https://cruxpost.com/_next/static/chunks/088e1_eh70ptt.css`, under `@media (prefers-color-scheme: dark)`). OKLCH converted to sRGB with the OKLab matrices and rounded.

| Role | Hex | Source token |
|---|---|---|
| bg | #0B1015 | `--bg: oklch(17% .012 250)`; the page's dark `theme-color` meta is `#0B1015` too |
| fg | #ECEFF2 | `--fg: oklch(95% .005 250)` |
| accent | #4C99F8 | `--accent: oklch(68% .16 255)` |
| accent2 | #7CB4FC | `--accent-text: oklch(76% .12 255)` |

The site's display face (Iowan Old Style, a system serif) is not an open font, so the film uses the skill's three OFL faces.

## Type

| Role | Face | Use |
|---|---|---|
| display | Archivo Black 400 | every beat |
| mono | IBM Plex Mono 500 | the crumbs |
| label | Syne 800 | embedded with the other two; this cut has no label line |

## Open questions

None. The author asked for the film and named the site as the only source.
