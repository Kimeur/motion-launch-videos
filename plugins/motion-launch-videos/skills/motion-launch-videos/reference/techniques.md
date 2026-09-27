# Techniques: accents, transitions, camera, beat grid

The moves that make a type bumper feel designed. Each one is in the engine; this file says what it does, when to use it, and the traps.

## Beat grid

- Pick a BPM and write every time as `beat(n)` or `bar(n)`. At 120 BPM: beat 0.5 s, 16th 0.125 s, bar 2 s.
- **Entrances start on 16ths.** Glyph staggers are note values (a 16th or a 32nd), so a word's rhythm is on the grid too.
- **Hits land where the springs say, not on the beat.** A glyph that starts on a beat lands about 0.1 s later (LAND lands at 0.122 s, SLAM at 0.092 s). The accent goes on the landing frame, which the engine computes (`mis: 'land'`).
- **If music is added later**, it must be shifted by the same landing offset, circularly for a loop, so the downbeat lands with the type, not before it.
- **Every beat carries an event**: a landing, a crumb starting, a punch, a cut.

## Misregistration (the accent)

On the frame an important element lands, a left and a right copy of it are drawn beneath it, offset by 4, 3 then 2 px on three consecutive frames, then gone. It reads as the print plates slipping on impact.

- **Accent frames only.** One per scene at most, on its most important landing, a scramble snap, a hard cut, or a mask cut.
- **Winner takes all.** The two passes are drawn into separate layers and merged per pixel: the denser ink keeps the pixel, so no pixel ever holds both inks. The merged layer lands at `misAlpha` (40 % by default) beneath the element. On a light bg, 40 % reads as pastel fringes; use 0.6 to 0.7.
- **Keep the clashing pass off the element.** When the element's own colour and a pass colour are two different chromatic hues (orange type, lime pass), that pass is kept off every pixel the element touches, so antialiased edges never blend into a third colour.
- **The palette gate** scans the sharp frames from 1 before to 3 after each impact (each `mis` landing and each mask wipe's first frame) for pixels whose hue is more than 13 degrees from every chromatic palette colour, in patches at least 3 px across. Any area fails. It reads the sharp frames only; motion-blur averaging can still leave a thin mix on the blurred ones, so look at the accent stills too.

## Hard cuts land on something

A cut is a hit only if the frame after it has something in it. A line that fades in from the cut (FADE reaches half opacity about 3 frames in) and staggers one glyph per 16th shows a single faint glyph on the first frames: it reads as a glitch, not a cut.

- Put at least one line on screen the frame the cut lands: `enter: { at: <cut>, pop: true }` skips the fade (a pop is fine at a cut, nowhere else), or leave the line without `enter`.
- For a scramble at a cut, `stagger: 0` with `pop: true` lands a full row of noise glyphs on the cut, and the word resolves on the snap. The template's EVERY does this.
- The critique warns about 4 or more blank frames in a row; the stills plan includes each scene 3 frames after its cut.

The same holds at the loop point: the lockup leaves at 0.00, so the hook's first line should start at 0 too and push it out (the template's NOTES rises from below as the lockup leaves upward).

## Mask wipe through the outgoing letterforms

`in: 'mask', mask: { line: '<outgoing line>' }`. The incoming scene is revealed inside the outgoing line's own glyphs, which grow on a log-scale zoom until they cover the frame.

- **Anchor on the thickest ink.** The engine rasterises the line and finds the point farthest from any edge (a distance transform). Zooming about it covers the frame at the smallest scale; zooming about a counter (inside an O) would open a hole.
- **Scale** is solved so that the inscribed circle at that point covers the farthest corner, times 1.25; the wipe hands over to the plain scene as soon as coverage is complete (about 0.25 s on MASK).
- **Opaque backing.** Inside the letterforms the background is drawn first, so the outgoing scene is covered, then the incoming scene is composited through the mask (`destination-in`).
- **The incoming scene should already have something on screen** at the mask's start (a line without `enter`), or the wipe reveals an empty frame.
- **It is a cut** for motion blur (subframes are clamped to it), and its first frame gets a misregistration of the mask's outlines and a tinted copy of the revealed scene. That frame is in the stills plan (`mis-mask-<scene>`) and in the palette gate.

## Camera: punch-in and smash-pan

- **Punch-in** (`punch: { at, z: 1.08 }`) on a downbeat, late in a scene, after its type has landed. Scale about the canvas centre. It is undone at the next scene's start: instantly at a cut or mask, at `t0 + 1/ω` into a pan (where the pan is fastest, so the jump hides in the blur), and eased back on EXIT when the next scene just appears.
- **Smash-pan** (`in: 'pan'` into a scene in another world): the camera's x springs a full canvas width on PAN, about 215 px per frame at peak. The outgoing scene stays drawn until the pan settles, so both worlds are in shot. Adaptive motion blur gives these frames one subframe per 5 px of movement, up to 64, so the move reads as a streak rather than stepped copies.
- **Worlds** are side by side at `world x W`. Put the hook and the lockup in the same world, since frame 0 shows the lockup and the hook follows it directly.

## Smear

For slams from far away (`enter.smear: true`). Ghosts trail the glyph along its path, strongest when it is fastest; on an impact frame they join the misregistration pass of their own colour.

## Rules, clips and the lockup

- A rule (`rules`) draws on from one end with DRAW. Type can rise from behind it: `clipY` shows only what is above y, `clipBelow` only what is below.
- **The lockup** is the product name, a rule and the domain, fitted to one measure so they share left and right edges. It lands last, may breathe (`breath`, a sin-squared swell of 1.2 %, which returns to exactly 1), then holds still until the loop point.

## Things that look good in a still and bad in motion

- Two accents in the same second. The eye cannot tell which one was the point.
- A punch-in while type is still landing: the landing and the zoom fight.
- A mask wipe whose outgoing line is thin (a light weight, a small size): the zoom needs a huge scale and the wipe reads as a flash.
- Type that exits in the same direction the next scene enters from: it reads as the same words coming back.
