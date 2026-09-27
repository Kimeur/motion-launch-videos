# Animation: a character that feels alive

Step 3. The principles cel animators worked out a century ago, and how each one maps onto this engine. The engine does the physics; the performance is yours to write.

## Design the character first

- **Original, simple, readable.** A bean body, two big eyes, a small mouth, short limbs, one distinctive detail (an antenna, ears, a hat). Five or six shapes. If a child could draw it from memory, it will read at thumbnail size.
- **Appealing proportions.** Big eyes set low and wide on a big head (the body is the head here), small mouth, stubby limbs. Eyes about a third of the body's width apart; pupils large enough to show where they look but small enough to move (about 0.4 of the eye).
- **Colour in three values.** Each surface gets a fill, a shade (darker, same hue) and a light (paler, same hue); one outline colour for everything, darker than any fill and not pure black (a deep aubergine or navy reads warmer). A warm background makes a cool character pop, and the reverse.
- **Silhouette.** Fill the character's outline in solid black in your head: can you still tell what it is doing? Arms away from the body, a clear lean, a hop with daylight under the feet.
- **It is the user's or it is new.** Never draw a known character or something close enough to be mistaken for one; never a real person.

## The principles, and where they live

| Principle | In this engine |
|---|---|
| **Squash and stretch** | `sq`: the body stretches on the way up (1.16), squashes on impact (0.72) and before a jump (0.8). The width answers the height (`1 / sqrt(sq)`), so the volume holds |
| **Anticipation** | every hop squashes `antic` seconds before take-off. Give any big move a small one the other way first: a crouch (`pose: { dy: 10 }`) before a pop, a wind-up lean before a wave |
| **Staging** | one action at a time, facing the camera, inside the live area, on a background that does not compete (sunburst rays in two close tints of one hue) |
| **Pose to pose** | acts are key poses; springs fill the in-betweens. Write the key poses first, then add breakdowns only where the motion needs a clearer path |
| **Follow-through, overlapping action** | the antenna trails the body (lagged springs) and rings after each jolt; hands arrive on BOUNCY after the body lands; the sign wobbles as it appears |
| **Slow in, slow out** | springs: every move eases out of its start and settles into its end |
| **Arcs** | hops are parabolas; a wave swings the hand on an arc round the shoulder; looks turn along an arc of the eye |
| **Secondary action** | breath (`idle.breathe`), blinks, the antenna sway: small, constant, never on the same beat as the main action |
| **Timing** | on twos: 12 drawings a second, each held 5 frames at 60 fps. A beat is 0.5 s at 120 BPM: a blink takes about a quarter of it, a hop one and a half |
| **Exaggeration** | push squash and stretch past what feels safe (0.7 to 1.2), eyes wide for surprise, a hop higher than the character is tall |
| **Solid drawing** | one light direction for every surface; the line weight never changes under squash |
| **Appeal** | a clear face, a readable expression per beat, a character that wants something (to say hi, to show you the thing) |

## Writing the performance

A 10 s loop holds one small story:

1. **Notice** (the first second): the eyes lead. A look toward the camera, then a blink. The eyes always move before the body.
2. **React**: surprise (`face: { mouth: 'o', brow: 14, pop: 1.08 }` and an `!` emote) or delight (happy eyes, a grin).
3. **Act**: the one thing: a hop, a wave with a "HI!", the sign with the product's name. Give the sign 3 s: long enough to read twice.
4. **Celebrate**: a small bounce on the beat, sparkles.
5. **Settle**: back to the first pose, the first face, a blink, and the loop begins again without a cut.

Rules of thumb:

- **Something changes on every beat**: a pose, a blink, a letter, a bounce. Two beats with nothing new read as a stall.
- **Hold a pose long enough to read** (at least half a second) before the next big move.
- **Accents land on the beat.** A hop that takes off on a beat lands `air` later; put the landing on a beat by choosing `air` in beats.
- **Words sit still.** A bubble or sign appears, holds for at least 1.5 s, then leaves; do not move the character across the frame while it talks.

## Line, drawings and the boil

- **Why on twos**: every drawing is held for two film frames at 24 fps (five at 60). Motion gets a hand-drawn cadence, and every pose is crisp; there is no motion blur in a cartoon.
- **Why boil**: each drawing was traced again on paper, so the line crawls slightly between drawings. 1 to 2 px feels alive; 3 px or more feels jittery. The boil cycles every three drawings, so the loop's drawing count must be a multiple of 3 (the critique checks it).
- **Quick moves need drawings.** On twos, a move shorter than two drawings can land between them and never be seen. Stretch it over three or more, or show it with a smear pose (a big stretch).

## Effects, sparingly

- **Dust** on a big landing; **shake** on the biggest one only.
- **Emotes** (`!`, `?`, a heart, sparkles) for a reaction, one at a time.
- **The sign from thin air** is the classic gag for a product name: the hands come up and it is simply there.

## The loop

The default is a cycle loop: no cut, no static tail. The performance ends in its first pose, every value where it started, and the stage's rays turn a whole number of ray widths. A spring still settling at the end (a bouncy landing) carries over the seam into the start, so the last hop may land late in the loop; its arc may not cross the seam.
