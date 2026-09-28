# Video types: what the film is for

Step 1 and 2. A style (kinetic type, shapes, cartoon, 3D, charts, pixel art, particles, app UI, photo, captions, overlays) says how a film looks. A **video type** says what it is for, and that decides its length, its format, its beats and what the brief must hold. Pick the type first, then the style that serves it. Any type below can be made in more than one style; the table suggests the ones that fit best.

## Choosing

| Type | For | Length | Formats | Styles that fit | Loop |
|---|---|---|---|---|---|
| Launch bumper | announcing a product or a release | 8 to 15 s | 1:1, 16:9 | kinetic type, 3D, particles, shapes | hold |
| Feature highlight | one feature, shown working | 8 to 15 s | 1:1, 9:16 | app UI, shapes, photo | hold |
| What's new | a release's three changes | 12 to 20 s | 1:1, 16:9 | app UI, shapes, kinetic type | hold |
| App store preview | the app in use, screen by screen | 15 to 30 s | 9:16 (the store's exact size) | app UI | none |
| Product reel | a physical or digital product, shot by shot | 10 to 20 s | 9:16, 1:1 | photo, 3D | hold |
| Milestone | one number that matters, and what it means | 6 to 12 s | 1:1, 9:16 | charts, kinetic type | hold |
| Data story | a trend, a ranking, a year in review | 12 to 20 s | 16:9, 1:1 | charts | hold |
| Testimonial | a customer's words, attributed | 8 to 15 s | 1:1, 9:16 | kinetic type, photo, shapes | hold |
| Event promo | what, when, where, who | 10 to 15 s | 9:16, 1:1 | kinetic type, shapes, photo | hold |
| Countdown | days or hours to a date | 6 to 10 s | 9:16, 1:1 | kinetic type, particles, pixel art | cycle |
| Explainer loop | how it works, in three steps | 12 to 20 s | 1:1, 16:9 | shapes, cartoon | hold |
| Mascot or sticker loop | a character saying hi, reacting | 4 to 10 s | 1:1 | cartoon, pixel art | cycle |
| Logo sting | the identity, alone | 3 to 6 s | 16:9, 1:1 | 3D, particles, shapes, kinetic type | hold |
| Intro and outro | the open and close of a video series | 3 to 8 s | 16:9 | overlays, 3D, kinetic type | none |
| Lower thirds and titles | names, chapters and callouts over footage | 3 to 6 s each | 16:9, 9:16, transparent | overlays | none |
| Captioned clip | a voice-over or podcast cut with captions | 15 to 60 s | 9:16, 1:1 | captions | none |
| Game teaser | a game's world and title | 8 to 15 s | 16:9, 1:1 | pixel art, 3D, cartoon | cycle |
| Ad | hook, problem, answer, proof, offer | 6 to 15 s | 9:16, 1:1 | any | hold |

## Beats by type

Beats are at most four words each; the call to action is one of them. Every word comes from the brief's Facts.

- **Launch bumper:** hook, what it is, proof, call to action (the name and URL).
- **Feature highlight:** the problem in the user's words, the feature doing it (on screen, not described), the result, call to action.
- **What's new:** "New in <version>", then change 1, 2 and 3 (each shown, not listed), then call to action. Take the changes from the product's own changelog or release notes, dated.
- **App store preview:** the core task from start to finish in the app's real UI, one screen per beat, then the app's name. Follow the store's current specification for size, length and content: check it before you start, as it changes.
- **Product reel:** the hero shot, then three details (material, feature, use), the price or offer only if the product's page states it today, then call to action.
- **Milestone:** the number (counting up to its exact figure), what it counts, the date or period, thanks or call to action. Source on screen.
- **Testimonial:** the quote (their words, never edited for meaning), the name and role, the product, call to action. Only with the person's written permission, recorded in the brief; no photo of them without it.
- **Event promo:** the event's name, the date and place (or "online"), the headliners or the one reason to come, then how to register. Dates and times with the time zone, as the event page states them.
- **Countdown:** the date, the number counting, the name. A cycle loop can count seconds forever; a dated count is rendered once per day, or it lies.
- **Explainer loop:** step 1, step 2, step 3, the outcome. One verb per step.
- **Logo sting:** the mark arrives, the name locks up, a hold. No copy beyond the name and, if any, the tagline.
- **Intro and outro:** intro, the series name and episode title; outro, the call to action (subscribe, the next video, the URL) with space left for the platform's end-screen elements.
- **Lower thirds:** name and role, or a chapter title, in, hold, out. Deliver transparent (overlays).
- **Captioned clip:** the words of the voice-over, a line or a word at a time, timed to it. The transcript is the brief's Facts; never paraphrase a speaker.
- **Ad:** a hook (a question or the outcome), the problem, the product as the answer, one proof, the offer, call to action. No fake urgency, no invented discounts or reviews, no competitor named or shown.

## Formats by platform

| Where | Format | Notes |
|---|---|---|
| X, LinkedIn, Bluesky feeds | 1:1 or 16:9 | 1:1 takes the most room in a feed. Most viewers watch muted. |
| Instagram Reels, TikTok, YouTube Shorts | 9:16, 1080 x 1920 | The platform's buttons and caption cover the bottom and the right edge. Keep text in the middle of the frame, well above the bottom fifth, and do not rely on anything in the bottom quarter. |
| Instagram and Facebook feed | 4:5 (1080 x 1350) or 1:1 | 4:5 is the tallest the feed shows uncropped. |
| YouTube, a website hero, a presentation | 16:9, 1920 x 1080 | |
| App stores | the store's exact preview size | Check the current specification. |
| Video editors (Premiere, Final Cut, DaVinci Resolve, CapCut) | transparent `.mov` (ProRes 4444) or `.webm` | lower thirds, titles, overlays |

Render a master at the format the brief names, then the others with `--format` (core.md, Formats), and check the composition at every format you deliver.

## Sound

A film that will play with sound on (YouTube, an intro, an ad, a captioned clip) gets `FILM.audio` (audio.md): the user's own licensed music or voice-over, and sound effects from the film's accents. A feed film is watched muted by most viewers: it must read without sound, so never put information only in the audio.

## What the brief needs, by type

- Every type needs the Facts table with sources (brief.md).
- **Testimonial:** the quote's source and the person's permission.
- **Event promo and countdown:** the date, time and time zone from the event's page.
- **What's new:** the release notes' URL and date.
- **Milestone and data story:** the data and its period (charts' brief).
- **Product reel and photo types:** the images, each with its owner (the user's own, or licensed).
- **Captioned clip:** the audio file and its transcript, with the speaker's permission.
- **Ad:** the offer exactly as the product's page states it today.
