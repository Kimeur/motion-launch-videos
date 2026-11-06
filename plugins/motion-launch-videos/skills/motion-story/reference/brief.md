# Brief: what the film says, and proof that it is true

Steps 1 and 2 of every motion-* workflow. The output is `videos/<film>/BRIEF.md`, filled from [../templates/BRIEF.md](../templates/BRIEF.md). The style changes from skill to skill; these rules do not.

## Intake: ask little, default the rest

A short film needs five things: the subject (a product, an event, a brand), the message, the palette, the format and the duration. Read before you ask; the product's live site usually answers the first three.

1. **Read the product first.** Fetch the live home page and the pages it links to (about, how it works, pricing, FAQ) with `curl -sL` or WebFetch. Note the name as the site writes it, what it does, who it is for, and the call to action on its buttons.
2. **Ask at most one round of questions**, and only what the site cannot answer. Use AskUserQuestion, and build each option from what you read rather than a stock choice:
   - the one message the film must land (2 or 3 lines taken from the site's own headlines)
   - format: 1:1 (1080 x 1080, the default), 9:16 (1080 x 1920) or 16:9 (1920 x 1080)
   - duration: 8, 10, 12 or 15 seconds (the skill's default is in its SKILL.md)
   - palette: the brand colours you found, or the template's
3. **If the user says "go" or does not answer, use the defaults** and say which you used. When nobody can answer at all (a subagent, a scripted run), use the brief as given plus the defaults, and record every choice under "Open questions" in BRIEF.md.

## No live site: a demo, a fictional or an unreleased product

- **Do not fetch a domain just because it matches the product's name.** It may belong to someone else.
- **Log the brief itself as the source.** The Source column says `the user's brief` and the date; the wording is the brief's own.
- **Say nothing the brief does not say**: no prices, numbers, ratings or features it does not state.
- **Mark a fictional product on screen** (`DEMO COPY, FICTIONAL PRODUCT`, as every template's demo does) and use a reserved domain (`example.com`, `.example`, `.test`) or one the user owns.
- **An unreleased real product** keeps its real name; anything the brief marks as not final (a price, a date) goes under "Not on screen".

## Facts: every claim has a source

Write each fact into the Facts table with the exact wording, the URL where it appears, and the date you read it. Every word and number on screen, including small print, may only say what a row says.

- **Only the live site (or the user's own data) counts.** Not a draft, a pitch deck, your memory of the product, or a competitor's page. If the site and the user disagree, ask.
- **No numbers the source does not show.** No prices, trial lengths, discounts, user counts, ratings or benchmarks unless the source states them today. A pricing page that says billing is not open yet makes any price a promise the product cannot keep.
- **Record what you left out and why** under "Not on screen". It saves the next person from adding it back.
- **Brand colours from the source.** Read the site's CSS custom properties and `theme-color` meta tags; convert `oklch()` to sRGB hex; record the token and the file it came from.

## Nothing that is not the user's to use

- **No real people's likeness, no other company's logo, mascot, character or product shot**, and no platform's trademarks (app store badges, social logos) unless the user owns them or says they have permission. A cartoon is an original character, a pixel sprite an original sprite, a UI mockup the user's own product.
- **No imitation of a studio's house style closely enough to pass as theirs.** Borrow principles (squash and stretch, flat colour, low-poly), not a look someone owns.

## Copy: four words a beat

- **At most 4 words of display type per beat**, where a beat is one idea a viewer reads in about a second. The stills critique fails a scene with more. Small print (typed crumbs, labels, sources) is not counted, but keep it under about 30 characters and sourced.
- **The classic order:** hook (a tension the viewer feels), what it does, proof, call to action. Merge or swap beats if the product's story is different; do not add a fifth idea.
- **One call to action, at the end.** Usually the domain, with the button's own words if there is room. Never two destinations.
- **The product's words, not ours.** Lift phrases from the site's headlines. No hype: no "revolutionary", "AI-powered", "10x", "the best", "effortless", no claims about competitors, no implied endorsements.
- **Check the characters.** Curly apostrophes, en dashes and the euro sign are in the Latin subset; arrows other than ↑ ↓, check marks and most non-Latin letters are not. The stills critique reads each font's cmap.

## Timing

Any duration works if it is a whole number of beats (at 120 BPM, a multiple of 0.5 s); a whole number of bars (2 s) is easiest to cut on. Give each beat at least a second fully landed before it leaves, and the last scene at least 1.5 s from its first entrance to the end, so it lands, breathes and holds.

## What the user sees at this point

Show the Facts table and the beats before designing: one message with the beats, the call to action, and anything you chose to leave out. Proceed unless they object. When there is no one to show them to, they are already in BRIEF.md; proceed.
