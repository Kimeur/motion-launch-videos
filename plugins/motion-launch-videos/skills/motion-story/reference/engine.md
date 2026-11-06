# Engine: the FILM config for a story short

Step 2. The film is one HTML file with one canvas. [../templates/film.html](../templates/film.html) holds the whole engine; for a new film you copy it to `videos/<film>/src/film.html` and edit only the `FILM` block at the top. The template runs as it is: the 67 s demo "Ten minutes", with its voice and timing in [../templates/assets/](../templates/assets/) (copy that folder to `videos/<film>/assets/` to try it). The core it sits on (springs, the page API, sound) is described in core.md and audio.md; the fields every engine shares (`W H FPS DUR BPM loop blur palette fonts grid springs poster audio`) are listed there.

## Film-level fields

| Field | Meaning |
|---|---|
| `W`, `H`, `FPS` | 1080 x 1920 at 30 fps. The sets are drawn for 9:16 |
| `DUR` | set by `voice.mjs`: the voice-over's length plus `voice.tail`. Do not edit it by hand |
| `loop` | `'none'`: a story has a start and an end |
| `blur` | `false`: one sample a frame |
| `drawings` | drawings a second for the hero and the sets' living details (wipers, bills, neon flicker): 15 at 30 fps |
| `boil`, `line` | the hero's line wobble and outline, px; the sets' outline is 0.7 x `line` |
| `voice` | `{ name, speed, gap, sceneGap, lead, tail }`: the Kokoro voice (`am_michael`, `am_adam`, `af_heart`, `af_nova`, `bm_george`, `bf_emma`...), its speed, the pause between lines and between scenes, the silence before the first line and after the last, in s |
| `timing` | `'__ASSET:assets/timing.json__'`: written by `voice.mjs`; each scene's window and each word's time |
| `audio` | `{ track: 'assets/voice.wav', loudness: -14, sfx, bed }`: the voice is the track; the bed is the score (audio.md). Every scene change is a section, so the bed changes chord on each cut |
| `captions` | `{ y, size, maxWords, fill, stroke, marks: { '*': 'neon', '+': 'cash', '!': 'amber' } }`: the caption line's baseline, the font size before fitting, the words a group holds, the colours, and the role each mark draws in |
| `hero` | the hero's rig, below |
| `scenes` | the story, below |

Fonts: `caption` (Montserrat 800) for the captions, phone and TV text; `hud` (JetBrains Mono 700) for cards, numbers, the map; `title` (Archivo Black) for neon, banners and the question.

## A scene

| Field | Meaning |
|---|---|
| `id` | a short name; `voice.mjs` and the critique match scenes by it |
| `set` | `car`, `backseat`, `map`, `street`, `room`, `phone`, `desk`, `tv`, `question` (below) |
| `say` | one to three lines, each a string or `{ text, speak }`. Marks colour words and are not spoken |
| `cam` | `{ from: [x, y, zoom], to: [x, y, zoom] }`: the view's centre and zoom, eased across the scene. Default: the centre, 1 to 1.06. The view never leaves the set |
| `shake` | `[t, ...]`: a jolt at each time (s from the scene's start), with a hit |
| `rain` | 0 to 1: streaks in front of everything |
| `actor` | the hero in this scene: `{ x, ground, scale, view: 'front' or 'back', bag: true, acts: [...] }` |
| `hud` | cards over the set, below |
| set options | `map`, `street`, `room`, `phone`, `tv`, `question`: below |

A scene starts 0.2 s before its first line (a hard cut with a whoosh) and lasts until the next one starts.

### The hero

The motion-cartoon rig (a bean with rubber-hose arms and legs, on twos with a boiling line) in a knitted beanie with a cuff and a pom. `hero` sets its shape once (`body`, `beanie: { fill, shade, cover, cuff, pom }`, `legs`, `eyes`, `brows`, `mouth`, `arms`); each scene's `actor` places it and gives it acts, timed in seconds from the scene's start:

| Act | Fields | Does |
|---|---|---|
| `walk` | `dx`, `steps`, `every` (a note value: 4 a quarter, 8 an eighth), `lean` | walks dx px, bobbing and swinging its arms |
| `look` | `x`, `y` (-1 to 1) | moves the pupils |
| `blink` | `dur` | |
| `face` | `mouth` (`smile grin open o flat frown`), `eyes` (`round happy`), `brow` (px; negative frowns), `pop` | |
| `pose` | `dy`, `lean`, `x`, `armL`, `armR`, `spring` | |
| `hop` | `h`, `air` | |
| `emote` | `kind` (`!` or `?`), `until` | a big mark over the head |

`view: 'back'` draws it from behind (no face, the beanie pulled lower): standing at the window, walking away. Keep its face off the caption line (y about 1250 to 1350): feet near 1750 to 1800 at scale 1, or a back view large at the bottom of the frame.

### HUD cards

`hud: [{ kind, at, dur, y, label, ... }]`, over the set and under the captions; `at` and `dur` in s from the scene's start, `y` the card's centre (300 by default).

| Kind | Fields | Shows |
|---|---|---|
| `money` | `from`, `to` | a dollar sum counting up, green when it lands; a data cue while it counts, a lock when it lands |
| `meter` | `from`, `to` | the same sum with a progress bar (a counting machine) |
| `clock` | `from: '12:00'`, `to: '12:31'` | a wall time running forward |
| `timer` | `from` (s) | a countdown in real time, blinking red, ticking each second |
| `tag` | `text` | a small label |

## The sets

Every set fills the frame and has its own living details; a scene picks one and sets its options.

| Set | Options | Shows |
|---|---|---|
| `car` | | a driver's view at night: road lines rushing in, street lamps passing, rain gathering on the windshield and two wipers clearing it, the wheel with gloved hands, your eyes in the mirror under the beanie, siren light leaking in |
| `backseat` | | the rear window with rain and sirens, the seat, three duffel bags (one open on its cash), loose stacks, a street light sweeping across |
| `map` | `map: { title, pins: [{ id, x, y }], route: [[x, y], ...], at, dur }` | a city map; pins drop in one by one, the route draws itself with a glow and a dot at its tip |
| `street` | `street: { sign, door }` | a two-floor motel at night, a vertical neon sign that flickers, lit windows, the room `door` glowing, a parked car, a wet lot with reflections |
| `room` | `room: { neon, view: 'window' }` | a motel room: striped wall, the window with the sign outside and rain on the glass, curtains, a lamp, the bed with a bag of cash. `view: 'window'` is the close shot of the window, for the hero from behind |
| `phone` | `phone: { app: 'call', name, status: [[t, 'CALLING...'], [t, 'VOICEMAIL']] }` or `{ app: 'messages', name, msgs: [{ at, text, mine }] }` | a phone held in the dark: a call screen with pulsing rings, or a thread where typing dots come first and each text pops in with a buzz |
| `desk` | | a table under a lamp: a counting machine riffling bills, its counter, stacks piling up either side |
| `tv` | `tv: { banner, head, ticker }` | a TV in the dark: a breaking-news banner that slides in, a headline, a scrolling ticker, a silhouette with a question mark, the screen's flicker on the room |
| `question` | `question: { text, options: [a, b], cta }` | the last card: the question, the two answers popping in, "or" between them, the call to comment with a bouncing arrow |

### A set of your own

A set is an object in `SETS` (search `SETS.car =`): `roles` (the palette roles it draws with), an optional `build(Sc)` (lay out text with `useText`, place cues with `cue`) and `draw(c, Sc, lt, td, dn, t)`, which paints the whole frame from the scene's time `lt`, the held drawing's time `td` and index `dn`, and the film's time `t`. Use the helpers above it (`box`, `poly`, `vgrad`, `glow`, `line`, `say`, `sayInk`, `neonText`, `rainOnGlass`, `drawRain`, `bag`, `cashStack`), the palette roles, and seeded `hash` for anything that varies: no `Math.random`. A new set belongs in the template too, so the next film has it.

## Sound

The voice is the track; `FILM.audio.bed` scores the film in one key and changes chord at every cut. The engine places the cues: a whoosh on every cut, a ping per map pin and per text, a thud when a text lands, a lock when a call ends or a sum lands, data under counters, a tick each second of a countdown, a hit on each shake, a swell and a boom into the question, a pop per answer. Normalise to -14 LUFS for TikTok, Reels and Shorts.
