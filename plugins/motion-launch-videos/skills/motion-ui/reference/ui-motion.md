# UI motion: a product demo that reads in a feed

Steps 2 and 3. How to turn a product's screens into a film that shows what it does in about ten seconds, muted, at the size of a phone in someone's hand. The engine can press anything; this file says what to press, when, and how the frame should look while it happens.

## Rebuild the UI from the screenshots

The film shows the user's real product, so the screens start from their screenshots, not from memory or a UI kit.

- **Work in the screenshot's units.** Take the screenshot at its native point size (a 1179 x 2556 phone capture at 3x is 393 x 852 points), set `device.screen` to it, and trace every box in those units: x, y from the top-left, w, h, corner radius, colour. `device.scale` then maps the screen onto the canvas.
- **Colours from the source.** The product's CSS custom properties, its design tokens, or an eyedropper on the screenshot; record each in BRIEF.md with where it came from. Keep them few: a background, a surface, text, a muted text, a divider, the brand colour and a tint of it cover most apps. Photos become flat `image` blocks in a colour sampled from them.
- **Words from the source.** Button labels, titles and tabs are the product's own. Names in a list are the user's sample data from the screenshot, or skeleton bars; never names you made up to look busy.
- **Simplify, and say so.** A film is not a pixel copy. Cut the rows nobody will read, turn secondary text into `bars`, drop the chrome that does not matter, keep the one path the demo takes. Write the simplifications in BRIEF.md.
- **Readable at 1080.** Text meant to be read must be 24 px or more on the canvas at the camera's rest: at `scale` 1 that is 24 units, bigger than a phone's 17 pt body text. So the rebuild uses fewer, larger elements: titles 32 to 44 units, labels 24 to 28, and bars for the rest. A focus zoom makes detail larger, but the critique measures at rest.
- **The device frame is generic.** A rounded body, a camera dot, a status bar with a clock and the usual glyphs, a home indicator; a browser window with three dots and an address pill. No maker's shape, notch or logo that says whose phone it is.

Check the rebuild against the screenshot side by side in a still before animating anything: layout, colours and words should match what the user sent, minus what you simplified.

## The demo arc

A 10 to 12 s film has room for one path through the product in three steps and a lockup:

| Step | What the viewer sees | Callout |
|---|---|---|
| 1. Arrive | the device rises in on the screen that matters; the finger scrolls or points | what it is ("PLAN IT.") |
| 2. Act | a tap opens something: a card grows into its screen, a sheet rises, a field fills | what it does ("SEE IT.") |
| 3. Confirm | the result: a button turns to its done state, a toast drops in, a tick draws on | what you get ("SAVE IT.") |
| 4. Lockup | the device leaves; the icon, the name and the domain land and hold | none: the lockup is the call to action |

One step per two bars at 120 BPM is a comfortable pace. More steps make a slideshow; keep them for a longer film.

## Pacing a demo

- **One thing at a time.** The pointer moves, then it lands, then it presses, then the screen answers, then the callout names it. Overlapping them makes the viewer choose where to look.
- **The pointer arrives before it presses.** MOVE lands about 0.31 s after it starts: start the move three 16ths (0.375 s) before the tap. The critique warns when a tap comes first.
- **The screen answers on the next 16th.** A tap presses for a 16th (`hold` 0.125 s); the push, expand or state change starts as it releases (a 16th or an eighth after the tap). Faster reads as instant; slower reads as lag.
- **Leave it landed.** Give each new screen and each result about a second at rest before anything moves it again.
- **Something moves on every beat.** A scroll settling, a leader drawing, a toast landing, the camera easing: a beat where nothing changes reads as a stall. But never two big moves at once.

## Where the pointer goes

- **In from the edge the hand is on.** A finger comes in from below the device, a little right; a cursor from wherever it last was. `pointer: 'in'` fades it in on the way.
- **Paths bow slightly**, as a hand's do (8 % of the distance; `arc` changes it). A straight line reads as a robot.
- **Land on the element, not its edge.** Aim at a point on it (`point`), the way a thumb hits a button: a little below and right of centre for a finger.
- **Lift out between steps.** A finger parked on the screen while a callout talks is a grey disc over the UI. `pointer: 'out'` after the tap, `pointer: 'in'` for the next one.
- **Never cover what changes.** Press a button, then move off it before its state changes, or the viewer sees the change through the finger.
- **Drag to scroll.** A `scroll` with the finger on screen presses, drags the finger up with the content, and lets the content settle a little past (SCROLL). Scroll only as far as the content goes (the critique warns otherwise).

## Transitions between screens

| Move | When | Notes |
|---|---|---|
| `expand` from a card | a card opens its own detail | the strongest: the card is the top of its screen, scaled down, so it grows into it without a jump. Build both from one list of layers, the card's inside a `group` at the scale `card width / screen width` with `origin: [0, 0]` |
| `push` / `pop` | going deeper and back in a stack | the new screen slides in from the right, the old one moves a third of the way left and dims |
| `open` a sheet or modal | a choice or a form over the current screen | a scrim darkens what is under it; `close` it before the next step |
| `open` a toast | a confirmation | drops from the top, holds a second or two, `close`s |
| `cut` | only at a hard change of scene | motion blur stops at it; use rarely |

## The camera

- **Focus zoom** (`focus: <id>`, z 1.25 to 1.45) lifts a detail the viewer must see: the button before it is pressed, the field while it fills. Start it as the pointer arrives, press when it has landed (ZOOM lands at 0.59 s), hold it a second, then `focus: false` to pull back and reveal the result.
- **Place the target** where the frame has room: `place: [0.5, 0.72]` puts a bottom button low in the frame so the device, not empty background, fills it.
- **Callouts step aside.** A zoomed device grows toward the callouts: take them out before the zoom and bring the next one in after it settles. The critique fails a callout the moving device runs under.
- **Pans** (`camera: { x, y, z }`) move between two parts of a wide layout (a browser page); keep them slow and few.

## Callouts

- **At most 4 words**, the product's own, one on screen at a time. They are the film's copy; the UI is not.
- **Beside the device, level with what they name.** Put the baseline so the cap-height middle is level with the target point; the leader then runs level into the device and ends on the element with a dot.
- **In after the thing they name has landed**, out before the next step or the zoom. A callout that talks about a screen that has already gone is a mistake the critique catches (`leader`).
- **Big enough to read in a feed**: cap height 44 to 56 px at 1080 in the display face, dark on a light background or the reverse, 3:1 at least.
- **Tight display faces need word space**: `space: 60` to `100` opens the gap between words that Inter Tight closes at display sizes.

## Composition

- **Square (1080 x 1080).** The phone a little left of centre, 70 % of the height; callouts in the right third. Or the phone centred and callouts above and below it.
- **Wide (1920 x 1080).** A browser window left or centre, 1100 to 1300 px wide; callouts in the free column.
- **Tall (1080 x 1920).** The phone centred, larger; callouts above it.
- **The device inside the live area** at rest, with its shadow bleeding softly. A device deliberately cropped by the frame sets `bleed: true`.
- **Background**: the brand's lightest neutral or its darkest, flat. The device shadow is a darker tint of the background, so nothing on screen is a colour the palette does not have.

## Colour discipline

- **Crossfades stay in one hue.** A toggle from grey to brand, a button from brand to a tint of brand: fine. Brand blue to success green mixes into teal mid-fade; the critique fails it.
- **Overlays are neutral.** Scrims, ripples, the finger and shadows are ink or paper at partial opacity (or a tint of what they cover), so they darken or lighten what is under them without a new hue.
- **Photos are flat blocks.** An `image` is a single colour, or a few flat shapes in palette colours; never a real photograph, and never a person.

## The lockup

The app icon, the name and the domain, at rest on frame 0 and rebuilt at the end. The icon is the user's own (paste its SVG into `path` layers), or, for a demo, simple original geometry on a rounded square. Give it 2 to 3 s: the device leaves, the icon pops, the name lands, the domain types in, the frame holds still for the last second or more.

## Things that look good in a still and bad in motion

- A pointer that teleports: every move must be a `move`, never a new `pointer: 'in'` while it is on screen.
- A tap with no answer: something must change within a 16th of the release, or the tap reads as a miss.
- Two callouts at once, or a callout during a zoom.
- A screen that pops in without a transition (unless it is a deliberate `cut`).
- A scroll that stops dead: let SCROLL settle it.
- A camera that zooms while the pointer travels: one move at a time.
