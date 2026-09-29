# Brief: Acme Studio lower third

The motion-overlays skill's own demo, rendered as it ships in `templates/film.html`. **Demo copy, fictional product:** Acme Studio is a fictional video studio and Rowan Tessaly a fictional person with a fictional role; neither exists, there is no live site, and the brief below is the only source. The film carries `DEMO COPY, FICTIONAL PRODUCT` on its own small plate in the bottom-right corner, where it does not touch the lower third; for a real film that `tag` is deleted.

## Deliverable

| | |
|---|---|
| Product | Acme Studio (fictional, no live site) |
| Style | motion-overlays: a lower third, name and role |
| Format | 1920 x 1080 (16:9) master; 9:16 (1080 x 1920) and 1:1 (1080 x 1080) from the same file |
| Duration | 5.25 s: in 0.75 s, hold 4 s, out 0.5 s; `loop: 'none'` (315 frames) |
| Frame rate | 60 fps |
| Transparency | yes: ProRes 4444 .mov and VP9 .webm with alpha; MP4 and GIF composited over `bg` |
| Sound | a whoosh in and a swish out, normalised to -20 LUFS; the .wav for the editor |
| Where it plays | over an interview in an editor; this repo's README |
| Deliverables | `overlays-acme-studio.webm` (alpha), `overlays-acme-studio.mp4` (preview over `bg`), `preview.gif`, `poster.png` (with alpha), `poster-9x16.png` (with alpha), `overlays-acme-studio.html`. The .mov (43.6 MB) is rendered and verified but not kept in the repo |

## Facts

| # | Fact | Exact wording at the source | Source |
|---|---|---|---|
| F1 | The person's name (fictional) | "Rowan Tessaly" | the skill's demo brief, 29 September 2026 |
| F2 | Their role (fictional) | "Host, Acme Studio" | the skill's demo brief |
| F3 | It is not real | "DEMO COPY, FICTIONAL PRODUCT" | shown on screen |

## Not on screen

- A real person's name, face or role: the name was made up for the demo.
- Any platform's logo or icon: the lower third has none.
- A URL or handle: the brief states none.

## Message

| Part | On screen | Facts |
|---|---|---|
| Name tier | Rowan Tessaly | F1 |
| Role tier | HOST, ACME STUDIO | F2 |
| Tag | DEMO COPY, FICTIONAL PRODUCT | F3 |

31 characters in the lower third (the tag is small print, not counted): 2.07 s of reading at 15 a second, inside the 4.08 s hold.

## Palette

| Role | Hex | Use |
|---|---|---|
| bg | #56606B | the stand-in for the footage (a mid, cool grey); never drawn |
| dark | #111318 | the name plate, the tag's plate, the role's text |
| light | #FFFFFF | the name, the tag |
| accent | #FFB224 | the bar and the role plate |

## Type

| Role | Face | Use |
|---|---|---|
| name | Barlow 700 | the name |
| label | Barlow 600 | the role and the tag, tracked capitals |

## Open questions

None: a demo, made to show the skill.
