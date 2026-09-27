# Engine: the FILM config for UI promos

Step 4. The film is one HTML file with one canvas. [../templates/film.html](../templates/film.html) holds the whole engine; for a new film you copy it to `videos/<film>/src/film.html` and edit only the `FILM` block at the top (and any helpers above it). The template runs as it is: a 12 s demo for a fictional travel planner. The core it sits on (springs, motion blur, the loop, the page API) is described in core.md; the fields every engine shares (`W H FPS DUR BPM loop blur palette fonts grid springs poster`) are listed there.

A film has one **device** showing **screens**, a **pointer**, a **script** of actions in time order, **callouts** beside the device, and a **lockup** (plus any other free **layers**). Three coordinate spaces:

| Space | Units | Who lives there |
|---|---|---|
| canvas | px, 0 to W, 0 to H | the device's position, callouts, the lockup and free layers |
| device | screen units, (0, 0) at the screen's top-left | the pointer, `move` targets given as `[x, y]`, `focus` boxes |
| screen | screen units; a box's `x, y` is its top-left inside its parent | every layer of a screen; scrolled content |

Screen units are the screenshot's points: trace boxes from the screenshot at its native size (a 393 pt wide phone screenshot is 393 units wide) and let `device.scale` map them to pixels. The camera frames the device; callouts and free layers are not moved by it.

Default colours name the roles `ink`, `paper`, `line`, `muted`, `brand` and `tint`. Keep those names in the palette or set every colour field explicitly; a role that is not in the palette fails the palette check.

## Device

`FILM.device`, one per film.

| Field | Meaning |
|---|---|
| `kind` | `'phone'`, `'tablet'` or `'browser'` |
| `x`, `y` | the device's centre on the canvas, px (default the canvas centre) |
| `screen` | `[w, h]` of the screen in units (phone 360 x 760, tablet 600 x 820, browser 880 x 560) |
| `scale` | px per unit (default 1) |
| `radius`, `bezel` | the screen's corner radius and the frame around it, in units (phone 46 and 12, tablet 26 and 18, browser window 12 and 0) |
| `body`, `edge` | roles: the frame (phone and tablet `ink`, browser `paper`) and an optional 2-unit outline that lifts it off the background |
| `shadow` | `{ color, blur, dy, op }`: a soft shadow built from a palette role, blurred once and cached |
| `status`, `time`, `timeSize`, `statusH` | phone and tablet: `status: false` hides the status bar; the clock reads `time` (`'9:41'`) in the `font` role (`'ui'`) |
| `notch`, `buttons`, `home` | phone: a camera `'dot'` (default), a `'pill'` or `false`; side buttons (`false` hides them); the home indicator (`false` hides it) |
| `url`, `urlSize`, `urlColor`, `urlFill`, `barFill`, `dots`, `bar` | browser: the address (`example.com`), its size (16), colour (`muted`) and pill (`bg`), the title bar's fill (the body) and height (56), the three window dots (`line`) |
| `enter`, `keys`, `exit` | the device's own motion (states below: `dx dy scale op rot`) |
| `bleed` | `true` exempts the device from the live-area check (a phone deliberately cropped by the frame) |

The status bar and home indicator take their colours from the screen on top (its `status` and `home` roles) and crossfade during a push or expand. The clock and the URL are chrome: exempt from the text-size rule, still checked for glyphs.

## Screens

`FILM.screens`: `[{ id, bg, status, home, dim, layers }]`. The first screen is on the device at t = 0; the others come on through the script. `bg` fills the screen (`paper`), `status` colours the status bar content over it (`ink`), `home` the home indicator (defaults to `status`), `dim` the scrim laid over it while another screen covers it (`ink`).

A screen's layers scroll with it unless they are `fixed: true` (top-level layers only; nav bars, tab bars, toasts, sheets and modals are always fixed). Toasts, sheets and modals are overlays: drawn above everything else on their screen, hidden until `open`.

## Layers

Every layer takes these fields; each type adds its own.

| Field | Meaning |
|---|---|
| `id` | unique across the film; needed for anything the script, a callout or the camera points at |
| `type` | one of the types below (default `rect`, or `text` when there is a `text`) |
| `x`, `y` | top-left inside the parent (text: the anchor and the baseline) |
| `w`, `h`, `radius` | size; corner radius: a number, `'pill'`, or `[tl, tr, br, bl]` |
| `fill`, `stroke`, `width` | roles, and the stroke width in units |
| `clip` | clip the children to the rounded box (default on for `card`, `image`, `sheet`, `modal`) |
| `shadow` | `{ color, blur, dy, op }` from a palette role |
| `op`, `scale`, `rot`, `origin` | rest opacity, scale and rotation (degrees); `origin: [x, y]` is the pivot in the layer's own units (default the box centre; `[0, 0]` scales from the top-left) |
| `children` | layers in this layer's own coordinates |
| `fixed`, `bleed` | does not scroll (top level); exempt from the screen-width check |
| `enter`, `keys`, `exit` | motion, below |

### Types

| Type | Fields | What it is |
|---|---|---|
| `rect` | `w h radius fill stroke` | a box: backgrounds, dividers, pills, circles (`radius: 'pill'`) |
| `card` | as `rect` | a box that clips its children |
| `image` | as `rect` | a photo placeholder: a flat colour block (and simple shapes inside it), clipped; never a real photo |
| `group` | `w h clip` | no box of its own: holds children, scales them (`scale`, `origin`) |
| `text` | `text font size cap fit track pairs space anchor color on chrome` | one line of UI text, laid out once with the core's `layoutText`: `size` in units, or `cap` (a cap height), or `fit: <w>` (the size whose ink spans w units). `space` adds 1/1000 em to every word space (tight display faces); `on` names the role it sits on when that is not a box behind it; `chrome: true` exempts it from the size rule |
| `bars` | `w h n gap last color` | skeleton lines standing in for text nobody needs to read: `n` bars `h` thick (12), `gap` apart (2.2 h), the last `last` of the width (0.6), in `line` |
| `icon` | `name` or `d` + `vb`, `size color fill width` | a 24-unit stroke icon (`size` 24, `color` `ink`, `width` 2), or your own SVG path in a `vb` box. `fill` fills a closed one (a saved bookmark). Built in: `back next up down plus minus close check search heart bookmark star pin calendar clock user home bell share menu more lock send grid map chat trash edit` |
| `path` | `d fill stroke width cap` | SVG path data in the parent's units, offset by `x, y`: illustrations, an app icon, the user's logo |
| `avatar` | `initials size fill color font textSize` | a circle with initials (48, `tint`, `brand`, text 0.42 of the size). Initials stay at least 24 px at 1080 from a size of 56 at scale 1 |
| `button` | `w h radius label icon color iconColor iconSize font size fill stroke states` | a pill (default) with an icon and a label, centred as one row. `states: { saved: { fill, label, color, icon } }` are other looks the script switches to |
| `toggle` | `w h on fill onFill knob` | a switch (52 x 32): the track crossfades from `fill` (`line`) to `onFill` (`brand`), the knob (`paper`) springs across |
| `checkbox` | `size on stroke fill color radius` | a rounded box (30): the fill (`brand`) fades in, the tick (`paper`) draws on |
| `input` | `w h radius fill stroke placeholder value icon font size color hint caret pad` | a field (`tint`): an optional leading icon, the placeholder in `hint` (`muted`), typed text in `color`, a `caret` (`brand`) |
| `nav` | `title titleFont back right accent color fill line h y` | a navigation bar under the status bar (56): `back: true` or a label, a centred title, `right` icon names, a bottom `line` |
| `tabbar` | `items active color accent fill line iconSize font size h` | a bottom tab bar (84): `items: [{ icon, label }]`; the active one in `accent` (`brand`), the rest in `color` (`muted`) |
| `row` | `title sub bars avatar icon image trail divider inset font size color hint w h` | a list row (76): a leading avatar, icon or image block, a title and a sub line (text, or `bars: true`), a trailing `'next'` chevron, `{ toggle: true, id, on }` or `{ text }`, and a `divider` |
| `toast` | `text icon color iconColor fill radius w h x y` | a pill (`ink`) that drops in from above the screen's top edge |
| `sheet` | `h radius fill grabber scrim scrimOp children` | a bottom sheet (half the screen, 28-unit top corners) that rises over a `scrim` (`ink` at 0.32) |
| `modal` | `w h x y radius fill scrim scrimOp children` | a centred card that scales up from 0.92 and fades in over a scrim |

Free layers (the lockup and `FILM.layers`) are in canvas px and take `rect card image group text bars icon path avatar button`. They are drawn behind the device unless `front: true`. A free text layer with `enter: { at, typed: true }` types in one character per frame with a block cursor (small print); one with a `stagger` moves glyph by glyph.

## Motion: enter, keys, exit

Any layer, the device and free layers move on springs. A **state** names some values:

| Key | Meaning |
|---|---|
| `dx`, `dy` | offset from rest (units on a screen, px on the canvas) |
| `rot` | degrees added to rest |
| `scale` | factor on the rest scale (`scale: 0` hides) |
| `op` | opacity (always on FADE) |
| `blur` | text only: px of blur that focuses on FOCUS |
| `w`, `h` | a box's size (a card growing taller to show more; children do not reflow) |

- `enter: { at, from, spring, stagger, order }`: the layer sits in `from` until `at`, then springs to rest.
- `keys: [{ at, to, spring, stagger, order }]`: later targets, in time order.
- `exit: { at, to, spring, stagger, order }`: the last move (EXIT by default).

`stagger` is a note value (16 is a 16th, 0.125 s at 120 BPM; 32 a 32nd); it staggers the glyphs of a free text layer. `order`: `index` (default), `reverse`, `center`, `random` (seeded).

## Pointer

`FILM.pointer: { kind, size, fill, ring, fillOp, ringOp, shadow }`. A `'finger'` (56 units, a soft disc: `paper` at 0.55 with an `ink` ring at 0.3 and a small shadow) or a `'cursor'` (an arrow, 30 units tall, `paper` with an `ink` outline). It lives on the device in device units, drawn over the screen and not clipped to it, hidden until `pointer: 'in'`. Moves bow slightly (8 % of their length) like a hand; `arc: 0` makes one straight.

## Script

`FILM.script`: actions `{ at, <action>: <value>, ...options }`, run in time order. A target is a layer `id` (its box, at `point: [fx, fy]`, default the centre) or `[x, y]` in device units.

| Action | Options | What happens |
|---|---|---|
| `pointer: 'in'` | `to point from spring arc` | the pointer appears at `from` (default below the device, right) and moves to `to` |
| `pointer: 'out'` | `to` | it moves away (default below the device, right) and fades |
| `move: target` | `point spring arc` | it travels (MOVE for a finger, CURSOR for a cursor) |
| `tap: id`, `click: id` | `hold scale press ripple pscale` | the pointer presses (0.84) and releases `hold` later (a 16th); the element shrinks to `scale` (0.96, PRESS) and springs back (RELEASE) unless `press: false`; a finger lights a ripple inside it (its colour picked from what it lights up, or `ripple: <role>` / `false`); a cursor rings from its tip |
| `scroll: units` | `screen spring drag hold` | the screen's content moves up by `units` (negative scrolls back) on SCROLL; while the finger is on screen it presses and drags with it |
| `push: screen` | `spring` | the screen slides in from the right (PUSH); the one under it slides a third of the way left and dims |
| `pop: true` | `spring` | the top screen slides back out; the one under it returns |
| `expand: screen` | `from: id`, `spring` | the element grows into the screen (EXPAND): a container from its box to the whole screen, the screen drawn inside it scaled to its width, the element fading out over it |
| `collapse: true` | `spring` | the reverse of the last expand |
| `cut: screen` | | a hard cut to the screen (motion blur stops at it) |
| `state: id` | `to` | a button crossfades to another look (`to: 'default'` goes back) |
| `toggle: id`, `check: id` | `on spring` | flips a toggle (KNOB) or a checkbox (TICKS); `on: true/false` sets it |
| `tab: id` | `to spring` | the tab bar's active item moves to index `to` |
| `type: id` | `text every` | typing into an input: the placeholder goes, one character every `every` frames (4, 15 a second), the caret blinks when idle |
| `clear: id` | `every` | backspaces what was typed |
| `blur: id` | | the caret stops (it also stops when the input's screen leaves) |
| `open: id`, `close: id` | `spring` | shows or hides a toast (TOAST), sheet or modal (SHEET); `close` on CLOSE |
| `focus: target` | `z place spring` | the camera frames the target at zoom `z` (1.4), putting it at `place: [fx, fy]` of the frame (the centre) on ZOOM; `focus: false` returns to rest. A target may also be a box `[x0, y0, x1, y1]` in device units |
| `camera: { x, y, z }` | `spring` | the camera centres canvas point (x, y) at zoom z; `camera: 'rest'` returns |

## Callouts

`FILM.callouts`: `[{ id, text, x, y, anchor, font, size | cap, track, pairs, space, color, on, to, point, in, out, from, leave, stagger, spring, line, width, dot, ring, gap, lead }]`.

- The words sit at `x`, `y` on the canvas (anchor and baseline), in `font` (`display`) and `color` (`ink`), at most 4 words.
- `to` is the element they name (an id, or `[x, y]` in device units) and `point` the spot on it. The leader leaves the side of the words that faces it, `gap` px away (24), `width` px thick (4) in `line` (the text colour), draws on from the words `lead` s after `in` (0.125, LEAD), and a `dot` (`brand`) with a `ring` (`paper`) pops where it lands (POP). It follows the element as it scrolls or the camera moves.
- `in` and `out` are times. The glyphs rise from `from` (`{ dy: 28, op: 0, blur: 6 }`) a 32nd apart on LAND, and leave to `leave` (`{ dy: -20, op: 0 }`); the leader retracts toward the element.
- Put the baseline so the cap-height middle is level with the target point: the leader runs level.

## Lockup and free layers

`FILM.lockup: { wrap: { exit, to, spring, stagger }, layers }`, for the hold loop: its layers are on screen at rest at t = 0, leave at `wrap.exit` (staggered by layer), are hidden once gone, and come back with their own `enter`. `FILM.layers` holds any other free layers (a headline over the device, a background shape), with their own `enter`, `keys`, `exit`.

## Springs

The core's springs (springs.md) plus these:

| Name | ζ | ω | Settles (s) | Lands (s) | Overshoot | Use |
|---|---|---|---|---|---|---|
| LIFT | 0.78 | 12 | 1.709 | 0.328 | 2.0 % | the device rising in |
| DROP | 1 | 14 | 1.143 | 0.339 | none | the device leaving |
| MOVE | 0.85 | 16 | 1.176 | 0.307 | 0.6 % | a finger travelling |
| CURSOR | 0.9 | 18 | 0.988 | 0.343 | 0.2 % | a cursor travelling |
| DRAG | 1 | 16 | 1.000 | 0.296 | none | the finger dragging content |
| PRESS | 1 | 50 | 0.320 | 0.095 | none | pressing down |
| RELEASE | 0.5 | 26 | 1.231 | 0.093 | 16.3 % of the 4 % press | springing back up |
| PUSH | 1 | 20 | 0.800 | 0.237 | none | push and pop |
| EXPAND | 0.86 | 14 | 1.329 | 0.365 | 0.5 % | a card growing into its screen |
| SHEET | 0.85 | 16 | 1.176 | 0.307 | 0.6 % | sheets and modals opening |
| TOAST | 0.7 | 20 | 1.143 | 0.164 | 4.6 % | a toast dropping in |
| CLOSE | 1 | 22 | 0.727 | 0.216 | none | anything closing |
| SCROLL | 0.8 | 9 | 2.222 | 0.463 | 1.5 % | content scrolling and settling |
| KNOB | 0.7 | 28 | 0.816 | 0.117 | 4.6 % | toggle knobs, tab changes |
| TICKS | 1 | 26 | 0.615 | 0.182 | none | a checkbox ticking |
| ZOOM | 1 | 8 | 2.000 | 0.593 | none | camera focus and return |
| RIPPLE | 1 | 12 | 1.333 | 0.395 | none | a ripple growing (its fade, RIPPLEFADE, is ζ 1, ω 14) |
| LEAD | 1 | 18 | 0.889 | 0.264 | none | a leader drawing on |
| POP | 0.5 | 20 | 1.600 | 0.121 | 16.3 % | the app icon popping in |

## Adding something the vocabulary lacks

First try the primitives: most UI is boxes, text, bars and icons, and a custom widget is a `group` of them with ids the script can press. A logo or an illustration is `path` layers, one per colour. If a widget needs its own drawing (a chart in a card, a progress ring), add a type to `BUILD` with its own animated values (`N.rest`), a `paint(c, N, t, q, op, w, h)` that draws from `t` and `q` alone, and its texts pushed to `TEXTS`, so motion blur (`disp`), the checks and the layout table know about it.
