# Brief and copy: what the film says, and proof that it is true

Steps 1 and 2 of the workflow. The output is `videos/<film>/BRIEF.md`, filled from [../templates/BRIEF.md](../templates/BRIEF.md).

## Intake: ask little, default the rest

A bumper needs five things: the product, the message, the palette, the format and the duration. Read before you ask. The product's live site usually answers the first three.

1. **Read the product first.** Fetch the live home page and the pages it links to (about, how it works, pricing, FAQ). Use `curl -sL` or WebFetch. Note the product name as the site writes it, what it does, who it is for, and the call to action on its buttons.
2. **Ask at most one round of questions**, and only what the site cannot answer. Use AskUserQuestion, and build each option from something you read on the site rather than a stock choice:
   - the one message the film must land (offer 2 or 3 lines taken from the site's own headlines)
   - format: 1:1 (1080 x 1080, the default), 9:16 (1080 x 1920) or 16:9 (1920 x 1080)
   - duration: 8, 12 (default) or 15 seconds
   - palette: the brand colours you found, or the skill default
3. **If the user says "go" or does not answer, use the defaults** and say which ones you used: 1080 x 1080, 12 s, 60 fps, 120 BPM, muted, the brand colours from the site's CSS (or the default palette), the skill's three fonts. When nobody can answer at all (you are a subagent or a scripted run), use the brief as given plus these defaults, and record every choice under "Open questions" in BRIEF.md.

## No live site: a demo, a fictional or an unreleased product

Some films are for a product with no public pages: a test film, a pitch for something not launched yet, a fictional product for a template. Then the user's brief is the only source.

- **Do not fetch a domain just because it matches the product's name.** It may belong to someone else, and its words are not the user's product.
- **Log the brief itself as the source.** In the Facts table, the Source column says `the user's brief` and the date; the wording is the brief's own.
- **Say nothing the brief does not say.** The same rules as a live site: no prices, numbers, ratings or features the brief does not state.
- **Mark a fictional product on screen.** A crumb such as `DEMO COPY, FICTIONAL PRODUCT` (the template's own demo does this), so the film cannot be mistaken for a real launch. Use a domain from the reserved examples (`example.com`, `.example`, `.test`) or one the user owns.
- **An unreleased real product** keeps its real name, but anything the brief marks as not final (a price, a date) goes under "Not on screen".

## Facts: every claim has a source

Write each fact into the Facts table with the exact wording and the URL where it appears, and the date you read it. A beat or a crumb may only say what a row says.

- **Only the live site counts.** Not a draft, not a pitch deck, not your memory of the product, not a competitor's page. If the site and the user disagree, ask.
- **No numbers the site does not show.** No prices, trial lengths, discounts, user counts, ratings or benchmark figures unless a live page states them today. Billing may not be live even when a pricing page exists; if the page says "not billed yet", a price in the film is a promise the product cannot keep.
- **Methodology numbers are fine when stated.** "At least 5 posts" or "500 random draws" can go in a crumb if the page says so, word for word in meaning.
- **Record what you left out and why** under "Not on screen". It saves the next person from re-adding it.
- **Brand colours from the source.** Read the site's CSS custom properties (for example `--accent`, `--bg`) and the `theme-color` meta tags. Convert `oklch()` values to sRGB hex. Record the token name and the file it came from. Use the dark theme's values for a dark film.

## Copy pass: four words a beat

The film is 3 to 5 beats. Each beat is one idea a viewer reads in about a second.

- **At most 4 words of display type per beat.** Count every word the viewer must read in that scene's big lines. The stills critique fails a scene with more. Small typed crumbs are not counted, but keep them under about 30 characters.
- **The classic order:** hook (a tension the viewer feels), what the product does, proof (why believe it), CTA. Swap or merge beats if the product's own story is different; do not add a fifth idea.
- **One call to action, at the end.** Usually the domain. A second line may say the action the site's button says ("REQUEST EARLY ACCESS"), in the same lockup. Never two different destinations.
- **The product's words, not ours.** Lift phrases from the site's headlines. They have been through the product's own review; new adjectives have not.
- **No hype.** No "revolutionary", "AI-powered", "10x", "the best", "effortless". No claims about competitors. No implied endorsements.
- **All caps is the default** for display type. It reads at a glance and it keeps the per-glyph layout even. Punctuation belongs to the voice: a full stop on a short line lands like a beat.
- **Check the characters.** Curly apostrophes (’), en dashes and the euro sign are in the Latin subset; arrows other than ↑ ↓, check marks and most non-Latin letters are not. The stills gate reads each font's cmap and fails a missing glyph; see fonts.md.

## Beat timing

Any duration works if it is a whole number of beats (at 120 BPM, a multiple of 0.5 s); a whole number of bars (2 s) is easiest to cut on. Splits that work at 120 BPM, scene boundaries in seconds:

| Duration | Bars | Hook | What it does | Detail or list | Proof | CTA lockup and hold |
|---|---|---|---|---|---|---|
| 8 s (the template) | 4 | 0.0 to 2.5 | 2.5 to 4.5 | | 4.5 to 6.0 | 6.0 to 8.0 |
| 10 s | 5 | 0.0 to 2.5 | 2.5 to 5.0 | | 5.0 to 8.0 | 8.0 to 10.0 |
| 12 s (the default) | 6 | 0.0 to 2.5 | 2.5 to 5.0 | 5.0 to 8.0 | 8.0 to 10.0 | 10.0 to 12.0 |
| 15 s | 7.5 | 0.0 to 3.0 | 3.0 to 6.0 | 6.0 to 9.5 | 9.5 to 12.0 | 12.0 to 15.0 |

The lockup is also frame 0: it leaves at 0.00 and is rebuilt in the last window, then holds until the loop point. Give the lockup at least 1.5 s from its first entrance to the end, so it lands, breathes and holds for a dozen frames.

Give each word at least 0.4 s fully landed before anything moves it again. A list beat (four one-word lines) needs about 3 s.

## What the user sees at this point

Show the Facts table and the beat lines before designing. One message in chat: the four beats, the CTA, and anything you chose to leave out. Proceed unless they object. When there is no one to show them to, they are already in BRIEF.md; proceed.
