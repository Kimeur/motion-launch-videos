# Springs: closed-form, one per target change

Every moving value in the engine is a sum of damped springs evaluated in closed form. No integration, no state: the value at t depends only on t and the event list, which is what makes `seek(t)` pure and the loop exact.

## The step response

A spring with damping ratio ζ and natural frequency ω, started at time t0 and moving a value by d, contributes `d x S(t - t0)`:

- underdamped (ζ < 1): `S(τ) = 1 - e^(-ζωτ) (cos(ω_d τ) + (ζω / ω_d) sin(ω_d τ))`, with `ω_d = ω √(1 - ζ²)`
- critically damped (ζ = 1): `S(τ) = 1 - (1 + ωτ) e^(-ωτ)`
- `S(τ) = 0` for τ ≤ 0.

**Snap.** At `τ ≥ 16 / (ζω)` the residual is under 2e-6 of the move, and `S` returns exactly 1. Without the snap a spring never lands, and the last frame of a loop would differ from the first by a fraction of a pixel.

## A property is a base value plus springs

`new Prop(v0).to(t, v, 'LAND')` adds one spring from the previous target to `v`. Rules:

- **One spring per target change.** A retarget is a new spring whose delta is `v - previous target`, superposed on the ones still settling. Never restart a spring from the current value: that needs state.
- **Add events in time order.** The delta is computed from the last target added. The engine throws if an event is added before an earlier one.
- **`set(t, v)` is an instant jump** and cancels every earlier spring on the property. Use it only while the element is invisible (opacity 0), at a hard cut, or hidden inside fast motion blur (the camera's zoom reset in a smash-pan).

## The table

`settle` is when `S` snaps to 1. `lands` is the visible landing: the first crossing of the target when underdamped, 95 % when critically damped. The misregistration accent uses `lands`.

| Name | ζ | ω | Settles (s) | Lands (s) | Overshoot | Use |
|---|---|---|---|---|---|---|
| SLAM | 0.60 | 30.0 | 0.889 | 0.092 | 9.5 % | big type slamming in from far; pair with smear |
| LAND | 0.72 | 28.0 | 0.794 | 0.122 | 3.8 % | the default entrance from about 96 px |
| PUNCH | 0.65 | 31.0 | 0.794 | 0.097 | 6.8 % | camera punch-in on a downbeat |
| LINE | 0.80 | 15.6 | 1.282 | 0.267 | 1.5 % | slow, heavy moves of rules and bars |
| FADE | 1 | 32.4 | 0.494 | 0.146 | none | opacity |
| EXIT | 1 | 32.4 | 0.494 | 0.146 | none | leaving: no bounce on the way out |
| PAN | 1 | 32.4 | 0.494 | 0.146 | none | smash-pan between worlds |
| DRAW | 1 | 32.4 | 0.494 | 0.146 | none | a rule drawing on |
| TICK | 1 | 32.4 | 0.494 | 0.146 | none | small marks |
| FOCUS | 1 | 19.5 | 0.821 | 0.243 | none | blur to sharp |
| MASK | 1 | 19.5 | 0.821 | 0.243 | none | the mask wipe's log-scale zoom |

Numbers computed from the formulas above; `crossT = (π - atan(ω_d / ζω)) / ω_d`.

## Choosing

- **Entrances overshoot, exits do not.** An underdamped spring coming in reads as weight; one going out reads as a stumble.
- **Opacity and blur are critically damped**, or a glyph would flash past full opacity and "un-focus".
- **Distance sets the spring.** A 640 px slam needs SLAM's stiffness; a 96 px landing on SLAM looks jittery, use LAND.
- **A new spring** is fine when the table lacks a character: add it to `SP` as `[ζ, ω]`. Keep ζ between 0.55 and 1, and compute its settle time: the film's static tail must start after the last settle.
- **Never ease with CSS curves or cubic-béziers.** They are not superposable and do not retarget.
