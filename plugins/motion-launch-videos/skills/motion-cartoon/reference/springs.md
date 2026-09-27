# Springs: closed-form, one per target change

Every moving value is a sum of damped springs evaluated in closed form. No integration, no state: the value at t depends only on t and the event list, which is what makes `seek(t)` pure and the loop exact.

## The step response

A spring with damping ratio ζ and natural frequency ω, started at time t0 and moving a value by d, contributes `d x S(t - t0)`:

- underdamped (ζ < 1): `S(τ) = 1 - e^(-ζωτ) (cos(ω_d τ) + (ζω / ω_d) sin(ω_d τ))`, with `ω_d = ω √(1 - ζ²)`
- critically damped (ζ = 1): `S(τ) = 1 - (1 + ωτ) e^(-ωτ)`
- `S(τ) = 0` for τ ≤ 0.

**Snap.** At `τ ≥ 16 / (ζω)` the residual is under 2e-6 of the move, and `S` returns exactly 1. Without the snap a spring never lands, and the last frame of a hold loop would differ from the first by a fraction of a pixel.

The speed is closed-form too: `dS/dτ = (ω² / ω_d) e^(-ζωτ) sin(ω_d τ)` underdamped, `ω² τ e^(-ωτ)` critically damped. `Prop.vel(t)` sums it; engines use it for squash and stretch, smears and speed lines.

## A property is a base value plus springs

`new Prop(v0).to(t, v, 'LAND')` adds one spring from the previous target to `v`. Rules:

- **One spring per target change.** A retarget is a new spring whose delta is `v - previous target`, superposed on the ones still settling. Never restart a spring from the current value: that needs state.
- **Add events in time order.** The delta is computed from the last target added. The core throws if an event is added before an earlier one.
- **`set(t, v)` is an instant jump** and cancels every earlier spring on the property. Use it only while the element is invisible, at a hard cut, or hidden inside fast motion blur.
- **In a loop, springs carry over the seam.** A spring still settling at DUR keeps settling into the start of the next pass (until the Prop's first `set`), so the value is continuous at the loop point. The value a Prop ends on must equal the value it starts from.

## The core's springs

`settle` is when `S` snaps to 1. `lands` is the visible landing: the first crossing of the target when underdamped, 95 % when critically damped.

| Name | ζ | ω | Settles (s) | Lands (s) | Overshoot | Use |
|---|---|---|---|---|---|---|
| SLAM | 0.60 | 30.0 | 0.889 | 0.092 | 9.5 % | big elements slamming in from far |
| LAND | 0.72 | 28.0 | 0.794 | 0.122 | 3.8 % | the default entrance |
| PUNCH | 0.65 | 31.0 | 0.794 | 0.097 | 6.8 % | camera punch-in on a downbeat |
| LINE | 0.80 | 15.6 | 1.282 | 0.267 | 1.5 % | slow, heavy moves |
| FADE | 1 | 32.4 | 0.494 | 0.146 | none | opacity |
| EXIT | 1 | 32.4 | 0.494 | 0.146 | none | leaving: no bounce on the way out |
| PAN | 1 | 32.4 | 0.494 | 0.146 | none | camera moves between worlds |
| DRAW | 1 | 32.4 | 0.494 | 0.146 | none | a rule drawing on |
| TICK | 1 | 32.4 | 0.494 | 0.146 | none | small marks |
| FOCUS | 1 | 19.5 | 0.821 | 0.243 | none | blur to sharp |
| MASK | 1 | 19.5 | 0.821 | 0.243 | none | wipes |

Each engine adds its own (its engine.md lists them), and a film may add more in `FILM.springs` as `NAME: [ζ, ω]`. ζ must be in (0, 1]. Compute the settle time of anything you add: in a hold loop, the film's static tail starts after the last settle.

## Choosing

- **Entrances overshoot, exits do not.** An underdamped spring coming in reads as weight; one going out reads as a stumble.
- **Opacity and blur are critically damped**, or an element would flash past full opacity and "un-focus".
- **Distance sets the spring.** A 640 px slam needs a stiff spring; a 96 px landing on a stiff spring looks jittery.
- **A value that means something is critically damped.** A bar that overshoots 100 on its way to 100 shows 108 for a moment: a false number.
- **Never ease with CSS curves or cubic-béziers.** They are not superposable and do not retarget.
