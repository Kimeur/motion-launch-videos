// Dev tool: an original chiptune waltz for the film, synthesised sample by sample (square, triangle, noise) and written as a WAV.
//   node music.mjs <out.wav>
// 3/4 at 120 BPM: a bar is 1.5 s, and every stop lasts two bars. The tune climbs a key at the first million and again at the
// first billion, and gains a voice at a time as the snowball grows: music box, bass, waltz chords, shimmer, hats, kick.
import fs from 'node:fs';

const SR = 44100, DUR = 36, N = SR * DUR;
const L = new Float32Array(N), R = new Float32Array(N);
const BEAT = 0.5, BAR = 1.5, T0 = 1.0;                    // the first stop lands at 1 s; bars count from there
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
let seed = 12345;
const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };

// ---- voices: each returns a function of time since the note began
const sq = (f, duty = 0.5) => (t) => ((t * f) % 1 < duty ? 1 : -1);
const tri = (f) => (t) => 4 * Math.abs(((t * f) % 1) - 0.5) - 1;
const sine = (f) => (t) => Math.sin(2 * Math.PI * f * t);
const sweep = (f0, f1, dur, shape = sine) => (t) => { const k = Math.min(1, t / dur), f = f0 + (f1 - f0) * k; return shape(1)(t * f); };
const noise = () => () => rnd() * 2 - 1;

// add a note: start, length, voice, volume, pan (-1 left, 1 right), attack, release, decay rate (per second)
function note(t0, dur, voice, vol, pan = 0, a = 0.004, r = 0.06, decay = 0) {
  const i0 = Math.max(0, Math.floor(t0 * SR)), i1 = Math.min(N, Math.floor((t0 + dur + r) * SR));
  const gl = vol * (1 - Math.max(0, pan)) , gr = vol * (1 + Math.min(0, pan));
  for (let i = i0; i < i1; i++) {
    const t = i / SR - t0;
    const env = Math.min(1, t / a) * (t < dur ? 1 : Math.max(0, 1 - (t - dur) / r)) * (decay ? Math.exp(-decay * t) : 1);
    const v = voice(t) * env;
    L[i] += v * gl; R[i] += v * gr;
  }
}

// ---- harmony: keys and chords
const KEY_AT = (bar) => (bar < 10 ? 0 : bar < 14 ? 2 : 4);       // C, then D at the first million, then E at the first billion
const PROG = [['I', 'V'], ['vi', 'IV'], ['I', 'V'], ['vi', 'IV'], ['I', 'V'], ['I', 'V'], ['vi', 'IV'], ['I', 'V'], ['vi', 'IV'], ['I', 'V']];
const DEG = { I: [0, 'maj'], V: [7, 'maj'], vi: [9, 'min'], IV: [5, 'maj'] };
function chord(bar, name, key) {                                   // root (low), then the triad's midi notes in the octave above middle C
  const [d, q] = DEG[name], root = 48 + key + d;
  return { root, tones: [root, root + (q === 'maj' ? 4 : 3), root + 7] };
}
const bars = [];                                                   // 20 bars of stops, then the ending: IV, V, I
for (let s = 0; s < 10; s++) for (let b = 0; b < 2; b++) { const bar = s * 2 + b; bars.push({ bar, stop: s, ...chord(bar, PROG[s][b], KEY_AT(bar)) }); }
bars.push({ bar: 20, stop: 10, ...chord(20, 'IV', 4) }, { bar: 21, stop: 10, ...chord(21, 'V', 4) }, { bar: 22, stop: 10, ...chord(22, 'I', 4) });
const barT = (bar) => T0 + bar * BAR;

// ---- the arrangement: which voices are in at each stop
const VOICES = (stop) => ({
  lead: true,
  bass: stop >= 2,
  chords: stop >= 4,
  shimmer: stop >= 6,
  hats: stop >= 7,
  kick: stop >= 8,
  octave: stop >= 5,
});
// three-note figures for the lead, as indices into [root, third, fifth, root', third', fifth']
const FIG = [[2, 3, 4], [4, 3, 2], [0, 2, 3], [3, 2, 1], [1, 3, 2], [2, 4, 3], [3, 4, 5], [5, 4, 3]];
const ladder = (c) => [c.tones[0], c.tones[1], c.tones[2], c.tones[0] + 12, c.tones[1] + 12, c.tones[2] + 12];

for (const B of bars) {
  const t = barT(B.bar), V = VOICES(Math.min(B.stop, 9)), lad = ladder(B), fig = FIG[(B.bar * 3 + (B.bar >> 1)) % FIG.length];
  const up = V.octave ? 12 : 0;
  // lead: a music box, three notes a bar, the last one rings on
  fig.forEach((idx, k) => {
    const f = midi(lad[idx] + up + 12);
    note(t + k * BEAT, BEAT * (k === 2 ? 1.6 : 0.9), sq(f, 0.25), 0.11, -0.15, 0.003, 0.08, k === 2 ? 1.6 : 3.5);
    if (B.stop >= 7) note(t + k * BEAT, BEAT * 0.9, tri(midi(lad[Math.min(5, idx + 1)] + up)), 0.09, 0.2, 0.004, 0.08, 3);   // a third above once the ball is big
  });
  // bass: oom on one, pah pah on two and three
  if (V.bass) note(t, BEAT * 0.95, tri(midi(B.root - 12)), 0.27, 0, 0.005, 0.07, 1.2);
  if (V.chords) for (const k of [1, 2]) for (const m of B.tones) note(t + k * BEAT, BEAT * 0.28, sq(midi(m), 0.25), 0.045, k === 1 ? -0.3 : 0.3, 0.002, 0.04, 4);
  // shimmer: eighth-note arpeggio high above
  if (V.shimmer) for (let k = 0; k < 6; k++) note(t + k * BEAT / 2, BEAT * 0.4, sq(midi(lad[[0, 1, 2, 4, 2, 1][k]] + 24), 0.125), 0.035, k % 2 ? 0.45 : -0.45, 0.002, 0.05, 6);
  // hats on the offbeats, a kick on one
  if (V.hats) for (let k = 0; k < 6; k++) note(t + k * BEAT / 2 + (k % 2 ? 0 : 0), 0.03, noise(), k % 2 ? 0.05 : 0.025, 0.1, 0.001, 0.02, 60);
  if (V.kick) note(t, 0.16, sweep(160, 58, 0.14), 0.30, 0, 0.001, 0.04, 9);
}

// ---- the pickup before the first stop: two chimes, and the winter air
note(0.0, 0.4, sq(midi(79), 0.25), 0.08, -0.2, 0.003, 0.1, 3.5);
note(0.5, 0.4, sq(midi(84), 0.25), 0.08, 0.2, 0.003, 0.1, 3.5);

// ---- footsteps: a crunch on every contact, four a second, softer than the tune
for (let k = 0; k < Math.floor(DUR * 4); k++) note(k * 0.25 + 0.01, 0.02, noise(), 0.022 + (k * 0.25 > 20 ? 0.012 : 0), (k % 2 ? 0.1 : -0.1), 0.001, 0.03, 70);

// ---- the snowball's rumble, low and growing with it: brown noise through a slow filter
{
  const radii = [[0, 4], [1.75, 5], [4.75, 6], [7.75, 8], [10.75, 10], [13.75, 14], [16.75, 18], [19.75, 26], [22.75, 34], [25.75, 46]];   // when each size is reached
  let lp = 0, lp2 = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    let r = radii[0][1];
    for (let j = 1; j < radii.length; j++) if (t >= radii[j][0]) { const k = Math.min(1, (t - radii[j][0]) / 0.25); r = radii[j - 1][1] + (radii[j][1] - radii[j - 1][1]) * k; }
    const cutoff = 0.008 + 0.02 * (1 - r / 46);
    lp += (rnd() * 2 - 1 - lp) * cutoff; lp2 += (lp - lp2) * 0.2;
    const v = lp2 * (0.35 + 1.6 * r / 46) * 0.2;
    const fade = Math.min(1, t / 0.5) * Math.min(1, (DUR - t) / 2);
    L[i] += v * fade; R[i] += v * fade;
  }
}

// ---- the stops
const STOP_T = Array.from({ length: 10 }, (_, i) => 1 + 3 * i);
STOP_T.forEach((t, i) => {
  const b = bars.find((x) => x.stop === i), key = KEY_AT(b.bar);
  // a bell on every caption
  note(t + 0.2, 0.5, tri(midi(b.root + 24 + (i >= 7 ? 12 : 0))), 0.16, 0, 0.002, 0.15, 5);
  note(t + 0.2, 0.5, sine(midi(b.root + 31)), 0.06, 0, 0.002, 0.15, 6);
  if (i === 0) return;
  // the coin flies (t + 0.15) and lands (t + 0.75): a chirp, then a rising bloop and a sparkle
  const ta = t + 0.15, tl = t + 0.75, big = i === 7 || i === 9;
  note(ta, 0.07, sq(midi(83), 0.5), 0.07, -0.3, 0.001, 0.02); note(ta + 0.07, 0.16, sq(midi(88), 0.5), 0.07, -0.3, 0.001, 0.08, 6);
  note(tl - 0.02, 0.16, sweep(260, 900 + 60 * i, 0.16, sine), 0.20, 0, 0.005, 0.05);
  [0, 4, 7, 12].forEach((s, k) => note(tl + 0.05 + k * 0.045, 0.06, sq(midi(84 + key + s), 0.25), 0.06, 0.3, 0.001, 0.04, 8));
  if (big) {                                                        // the ball swells hard: a thump, a crash and a long shimmer
    note(tl, 0.3, sweep(130, 52, 0.28), 0.42, 0, 0.001, 0.06, 5);
    note(tl, 0.35, noise(), 0.15, 0, 0.001, 0.2, 9);
    [0, 4, 7, 12, 16, 19].forEach((s, k) => note(tl + 0.1 + k * 0.06, 0.4, sq(midi(72 + key + s), 0.125), 0.05, k % 2 ? 0.4 : -0.4, 0.002, 0.2, 3.5));
  }
});
// a poof where the runner grows up
[6.4, 9.4, 15.4, 24.4].forEach((t) => { note(t, 0.25, noise(), 0.12, 0, 0.005, 0.15, 12); [0, 4, 7].forEach((s, k) => note(t + 0.1 + k * 0.05, 0.1, sq(midi(88 + s), 0.25), 0.05, 0, 0.001, 0.06, 6)); });

// ---- the ending: WET SNOW (lands 31.1), A REALLY LONG HILL (lands 33.0), then the last chord rings out at 34.0
note(31.1, 0.6, tri(midi(76)), 0.2, 0, 0.002, 0.2, 3.5); note(31.1, 0.6, sine(midi(88)), 0.07, 0, 0.002, 0.2, 5);
note(33.0, 0.6, tri(midi(80)), 0.2, 0, 0.002, 0.2, 3.5); note(33.0, 0.6, sine(midi(92)), 0.07, 0, 0.002, 0.2, 5);
for (const m of [52, 56, 59, 64, 68, 71, 76]) note(34.0, 1.9, tri(midi(m)), 0.10, (m % 3 - 1) * 0.3, 0.02, 1.4, 0.55);
note(34.0, 1.9, sq(midi(88), 0.25), 0.05, 0, 0.02, 1.4, 0.9);
// wind chimes in the snow: a few quiet notes from the pentatonic scale, from the start to the end of the film
{
  const pent = [0, 2, 4, 7, 9];
  let t = 1.7;
  while (t < 30.5) { const key = KEY_AT(Math.floor((t - T0) / BAR)); note(t, 0.25, tri(midi(96 + key + pent[Math.floor(rnd() * 5)])), 0.03, rnd() * 1.6 - 0.8, 0.002, 0.2, 7); t += 0.9 + rnd() * 1.8; }
}

// ---- mix down: a gentle low-pass to take the edge off the squares, a soft clip, normalise to -1 dBFS
function lowpass(x, hz) { const a = 1 - Math.exp(-2 * Math.PI * hz / SR); let y = 0; for (let i = 0; i < x.length; i++) { y += a * (x[i] - y); x[i] = y; } }
lowpass(L, 7000); lowpass(R, 7000);
function highpass(x, hz) { const a = Math.exp(-2 * Math.PI * hz / SR); let y = 0, px = 0; for (let i = 0; i < x.length; i++) { y = a * (y + x[i] - px); px = x[i]; x[i] = y; } }
highpass(L, 40); highpass(R, 40);
let peak = 0;
for (let i = 0; i < N; i++) { L[i] = Math.tanh(L[i] * 1.1); R[i] = Math.tanh(R[i] * 1.1); peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])); }
const g = 0.89 / peak, tail = SR * 1.2;                            // fade out the last 1.2 s
for (let i = 0; i < N; i++) { const f = i > N - tail ? (N - i) / tail : 1; L[i] *= g * f; R[i] *= g * f; }
const out = Buffer.alloc(44 + N * 4);
out.write('RIFF', 0); out.writeUInt32LE(36 + N * 4, 4); out.write('WAVEfmt ', 8); out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22);
out.writeUInt32LE(SR, 24); out.writeUInt32LE(SR * 4, 28); out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34); out.write('data', 36); out.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i])) * 32767), 44 + i * 4); out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i])) * 32767), 46 + i * 4); }
fs.writeFileSync(process.argv[2] || 'music.wav', out);
console.log(`wrote ${process.argv[2] || 'music.wav'}: ${DUR} s, peak ${peak.toFixed(2)} before normalising, ${bars.length} bars`);
