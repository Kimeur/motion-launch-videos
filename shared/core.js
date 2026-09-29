/* ==========================================================================
 * CORE: the deterministic runtime every motion-* engine shares.
 * Source: shared/core.js in the motion-launch-videos repo, copied into each
 * template by tools/sync.mjs. Do not edit it inside a film.
 *
 * seek(t) is a pure function of (t mod DUR): same t, same pixels, whatever was
 * drawn before. No timers, no Date, no Math.random, no state between calls.
 *   - Springs are closed-form step responses, one per target change, snapped
 *     to exactly 1 once settled. A Prop is a base value plus its springs.
 *     Springs still settling when the loop ends carry over the seam.
 *   - Periodic motion runs a whole number of cycles per loop (cyc, wave,
 *     loopNoise), so it is exact at the seam by construction.
 *   - Randomness is seeded (mulberry32, hash).
 *   - Continuous motion reads the exact t; discrete state (typing, drawings
 *     held on twos, sprite frames, line boil) reads the quantised q, so every
 *     subframe of one output frame agrees on it.
 *   - Motion blur averages 1 to 64 subframes on a trailing 270-degree
 *     shutter, one per 5 px of movement, never across a hard cut.
 *   - Sound (FILM.audio) is synthesised from cues in an OfflineAudioContext,
 *     outside seek(), from seeded noise; FILM.transparent clears to alpha.
 * The engine below describes its vertical through hooks (build, draw, disp,
 * checks, stills, layout, visible, lastChange) and calls boot(ENGINE) last.
 * The core keeps its internals to itself and exports the helpers listed at
 * its end, so an engine can name its own functions freely.
 * ========================================================================== */
const CORE = (() => {
/* ---------------- formats: one film, several aspect ratios ---------------- */
// ?format=9x16 (the scripts pass --format 9:16) re-sizes the film before anything reads FILM. A key of
// FILM.formats patches any field for that format (objects merge, arrays of items with an id merge by id,
// anything else is replaced). Without W and H in the patch, the standard ratios keep the film's short side:
// 1:1, 4:5, 9:16, 16:9. Positions stay authored in the base format; an engine maps them with fmtX/fmtY/fmtPos,
// which keep an element's offset from the centre (the default) or from the edge its pin names.
const BW = FILM.W, BH = FILM.H;
const FORMAT = (() => { const m = /[?&]format=(\d+)[x:](\d+)/.exec(location.search); return m ? `${m[1]}:${m[2]}` : null; })();
function mergeInto(a, b) {
  for (const [k, v] of Object.entries(b)) {
    const o = a[k];
    if (Array.isArray(v) && Array.isArray(o) && v.every((x) => x && x.id != null)) {
      for (const it of v) { const t = o.find((x) => x && x.id === it.id); if (t) mergeInto(t, it); else o.push(it); }
    } else if (v && typeof v === 'object' && !Array.isArray(v) && o && typeof o === 'object' && !Array.isArray(o)) mergeInto(o, v);
    else a[k] = v;
  }
  return a;
}
if (FORMAT) {
  const patch = (FILM.formats || {})[FORMAT] || {};
  const [ra, rb] = FORMAT.split(':').map(Number), short = Math.min(BW, BH);
  if (!(ra > 0 && rb > 0)) throw new Error(`bad format ${FORMAT}`);
  const size = ra === rb ? [short, short] : ra < rb ? [short, Math.round(short * rb / ra / 2) * 2] : [Math.round(short * ra / rb / 2) * 2, short];
  mergeInto(FILM, { W: size[0], H: size[1], ...patch });
}
const { W, H, FPS, DUR } = FILM;
const NFR = Math.round(DUR * FPS);                 // output frames in the loop
const CX = W / 2, CY = H / 2;
const U = Math.min(W, H) / 1080;                   // scale for built-in pixel constants
const PAL = FILM.palette;
const USED = new Set();                            // palette roles the film draws with
const col = (k) => PAL[k] || k;                    // look a role up (while drawing)
const role = (k) => { USED.add(k); return PAL[k] || k; };   // resolve and register a role (at build time)
const GRID = FILM.grid || {};
const MARGIN = GRID.margin != null ? GRID.margin : Math.round(104 * U);
const UNIT = GRID.unit || 8;
const MEASURE = W - 2 * MARGIN;
const FS = Math.min(W, H) / Math.min(BW, BH);      // base px -> this format's px
const FMT = { key: FORMAT || `${BW}x${BH}`, W, H, BW, BH, s: FS, aspect: W === H ? 'square' : W < H ? 'vertical' : 'horizontal' };
// pin: 'l' or 'r' keeps the distance from that edge, 't' or 'b' likewise; otherwise the offset from the centre
const fmtX = (x, pin = '') => /l/.test(pin) ? x * FS : /r/.test(pin) ? W - (BW - x) * FS : W / 2 + (x - BW / 2) * FS;
const fmtY = (y, pin = '') => /t/.test(pin) ? y * FS : /b/.test(pin) ? H - (BH - y) * FS : H / 2 + (y - BH / 2) * FS;
const fmtPos = (x, y, pin = '') => [fmtX(x, pin), fmtY(y, pin)];
const fmtSz = (v) => v * FS;
const LOOP = FILM.loop || 'hold';                  // 'hold': ends on a still copy of frame 0; 'cycle': periodic, continuous over the seam; 'none'
const BLUR = FILM.blur !== false;                  // false: one sample per frame (cartoon, pixel art)
const TRANSPARENT = !!FILM.transparent;            // clear to transparent instead of filling bg (bg stays the assumed backdrop)
const SHUTTER = 0.75;                              // 270 degrees, trailing
const MIN_SAMPLES = 4, MAX_SAMPLES = 64, PX_PER_SAMPLE = 5;   // Uint16 sums hold up to 257 x 255
const TAU = Math.PI * 2;

const canvas = document.getElementById('c');
canvas.width = W; canvas.height = H;
canvas.setAttribute('role', 'img');
canvas.setAttribute('aria-label', FILM.alt || FILM.title || '');
if (FILM.title) document.title = FILM.title;
document.documentElement.style.background = PAL.bg;
document.body.style.background = PAL.bg;
// CPU raster everywhere: Chrome moves a canvas from GPU to CPU after repeated getImageData
// reads, which changes antialiasing mid-render. Pin every 2D context from its first call.
// An alpha channel, though every frame fills it opaque: on an opaque canvas Chromium draws text with
// LCD subpixel antialiasing (red and blue fringes on every glyph), whatever the command line says.
const ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: true });
const mkCanvas = (w = W, h = H) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const mk2d = (w, h) => { const c = mkCanvas(w, h); return [c, c.getContext('2d', { willReadFrequently: true })]; };
const mctx = mkCanvas().getContext('2d', { willReadFrequently: true });   // measuring only

/* ---------------- springs: closed-form step responses ---------------- */
// [zeta, omega]. Underdamped (zeta < 1) overshoots and lands; zeta = 1 glides in without overshoot.
// Engines add their own (boot merges ENGINE.springs, then FILM.springs).
const SP = {
  SLAM: [0.60, 30.0], LAND: [0.72, 28.0], PUNCH: [0.65, 31.0], FADE: [1, 32.4],
  FOCUS: [1, 19.5], EXIT: [1, 32.4], PAN: [1, 32.4], DRAW: [1, 32.4],
  LINE: [0.80, 15.6], MASK: [1, 19.5], TICK: [1, 32.4],
};
const spring = (sp) => { const s = typeof sp === 'string' ? SP[sp] : sp; if (!s) throw new Error(`unknown spring ${sp}`); return s; };
const settle = (sp) => 16 / (sp[0] * sp[1]);       // after this the response snaps to exactly 1
function S(tau, sp) {
  const z = sp[0], w = sp[1];
  if (tau <= 0) return 0;
  if (tau >= settle(sp)) return 1;                 // residual < 2e-6 of the move: snap, so loops are bit-exact
  if (z < 1) {
    const wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * tau) * (Math.cos(wd * tau) + (z * w / wd) * Math.sin(wd * tau));
  }
  return 1 - (1 + w * tau) * Math.exp(-w * tau);
}
function dS(tau, sp) {                             // d S / d tau, per second
  const z = sp[0], w = sp[1];
  if (tau <= 0 || tau >= settle(sp)) return 0;
  if (z < 1) { const wd = w * Math.sqrt(1 - z * z); return (w * w / wd) * Math.exp(-z * w * tau) * Math.sin(wd * tau); }
  return w * w * tau * Math.exp(-w * tau);
}
// the visible landing: the first crossing of the target when underdamped, 95 % when critically damped
function landT(sp) {
  sp = spring(sp);
  const z = sp[0], w = sp[1];
  if (z < 1) { const wd = w * Math.sqrt(1 - z * z); return (Math.PI - Math.atan(wd / (z * w))) / wd; }
  let a = 0, b = settle(sp);
  for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (S(m, sp) < 0.95) a = m; else b = m; }
  return b;
}

// A property = base value + one spring per target change (superposed). set() is an instant jump
// that cancels earlier springs; use it only while the element is invisible, at a hard cut, or hidden
// inside fast motion blur. Events are added in time order. In a looping film, springs still settling
// at the end of the loop carry over the seam into its start (only while no set() has happened yet),
// so the film is continuous there; the value a Prop ends on must equal the value it starts from.
const PROPS = [];
class Prop {
  constructor(v0, name) { this.v0 = v0; this.last = v0; this.ev = []; this.tLast = -Infinity; this.name = name || '?'; this.tail = null; this.firstSet = Infinity; PROPS.push(this); }
  order(t) { if (t < this.tLast - 1e-9) throw new Error(`${this.name}: event at ${t} added after one at ${this.tLast}`); this.tLast = t; this.tail = null; }
  to(t, v, sp) { this.order(t); this.ev.push({ t, d: v - this.last, sp: spring(sp), set: false }); this.last = v; return this; }
  set(t, v) { this.order(t); this.ev.push({ t, v, set: true }); this.last = v; return this; }
  seam() {                                         // the springs that carry over the seam
    if (this.tail) return this.tail;
    let k = -1;
    this.firstSet = Infinity;
    for (let i = 0; i < this.ev.length; i++) if (this.ev[i].set) { k = i; if (this.firstSet === Infinity) this.firstSet = this.ev[i].t; }
    this.tail = LOOP === 'none' ? [] : this.ev.slice(k + 1).filter((e) => e.d !== 0 && e.t + settle(e.sp) > DUR);
    return this.tail;
  }
  at(t) {
    let v = this.v0, i0 = 0;
    const ev = this.ev;
    for (let i = 0; i < ev.length; i++) if (ev[i].set && ev[i].t <= t) { v = ev[i].v; i0 = i + 1; }
    for (let i = i0; i < ev.length; i++) { const e = ev[i]; if (!e.set) v += e.d * S(t - e.t, e.sp); }
    const tail = this.seam();
    if (tail.length && t < this.firstSet) for (const e of tail) v += e.d * (S(t + DUR - e.t, e.sp) - 1);
    return v;
  }
  vel(t) {                                         // per second
    let v = 0, i0 = 0;
    const ev = this.ev;
    for (let i = 0; i < ev.length; i++) if (ev[i].set && ev[i].t <= t) i0 = i + 1;
    for (let i = i0; i < ev.length; i++) { const e = ev[i]; if (!e.set) v += e.d * dS(t - e.t, e.sp); }
    const tail = this.seam();
    if (tail.length && t < this.firstSet) for (const e of tail) v += e.d * dS(t + DUR - e.t, e.sp);
    return v;
  }
  active(a, b) {                                   // does the value change anywhere in (a, b]?
    for (const e of this.ev) {
      if (e.set) { if (e.t > a && e.t <= b) return true; }
      else if (e.d !== 0 && e.t < b && e.t + settle(e.sp) > a) return true;
    }
    if (a < this.firstSet) for (const e of this.seam()) if (e.t - DUR < b && e.t - DUR + settle(e.sp) > a) return true;
    return false;
  }
  settleEnd() { let m = -Infinity; for (const e of this.ev) m = Math.max(m, e.set ? e.t : e.t + settle(e.sp)); return m; }
  lastSet(a, b) { let m = -Infinity; for (const e of this.ev) if (e.set && e.t > a && e.t <= b && e.t > m) m = e.t; return m; }
}

/* ---------------- periodic motion and seeded randomness ---------------- */
// n whole cycles per loop: exact at the seam by construction. Use these for anything that never stops
// (an idle bob, a spin, a drifting field) and set ENGINE.always, or declare its windows with activeIn.
const cyc = (t, n, phase = 0) => TAU * (n * t / DUR + phase);
const wave = (t, n, phase = 0) => Math.sin(cyc(t, n, phase));
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// three integers to [0, 1), well mixed: a pure replacement for Math.random keyed by what it decides
function hash(a, b = 0, c = 0) {
  let h = Math.imul((a | 0) ^ 0x3C6EF372, 0x85EBCA6B);
  h = Math.imul(h ^ (h >>> 13) ^ (b | 0), 0xC2B2AE35);
  h = Math.imul(h ^ (h >>> 16) ^ (c | 0), 0x27D4EB2F);
  h ^= h >>> 15; h = Math.imul(h, 0x85EBCA6B); h ^= h >>> 13; h = Math.imul(h, 0xC2B2AE35); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
// smooth noise in [-1, 1] that loops exactly: three whole harmonics (n, 2n+1, 4n+3 cycles per loop) with seeded phases
function loopNoise(t, n, seed) {
  return (Math.sin(cyc(t, n, hash(seed, 1))) + 0.5 * Math.sin(cyc(t, 2 * n + 1, hash(seed, 2))) + 0.25 * Math.sin(cyc(t, 4 * n + 3, hash(seed, 3)))) / 1.75;
}
function shuffled(arr, seed) {                     // Fisher-Yates on a copy, seeded
  const r = mulberry32(seed), a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const x = a[i]; a[i] = a[j]; a[j] = x; }
  return a;
}

/* ---------------- time ---------------- */
const wrapT = (t) => ((t % DUR) + DUR) % DUR;
const frameOf = (t) => Math.ceil(t * FPS - 1e-9);  // all subframes of output frame n map to n
const typed = (q, ts, n) => Math.max(0, Math.min(n, Math.ceil((q - ts) * FPS - 1e-6)));   // one character per frame
const noteSec = (v) => (typeof v === 'number' && v >= 1 ? 4 * 60 / FILM.BPM / v : v);     // 16 -> a 16th note
const drawing = (q, fps) => Math.floor(q * fps + 1e-6);    // index of the held drawing (12 fps = on twos at 24, fives at 60)

/* ---------------- colour ---------------- */
function rgbOf(hex) { const h = String(hex).replace('#', ''); const n = parseInt(h.length === 3 ? h.replace(/./g, '$&$&') : h.slice(0, 6), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
const hexOf = (r, g, b) => '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
function mix(a, b, k) { const x = rgbOf(a), y = rgbOf(b); return hexOf(x[0] + (y[0] - x[0]) * k, x[1] + (y[1] - x[1]) * k, x[2] + (y[2] - x[2]) * k); }
function hueChroma(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), C = mx - mn;
  if (C === 0) return [0, 0];
  let h;
  if (mx === r) h = 60 * (((g - b) / C) % 6); else if (mx === g) h = 60 * ((b - r) / C + 2); else h = 60 * ((r - g) / C + 4);
  return [h < 0 ? h + 360 : h, C];
}
const hueDist = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
function lum(hex) { const c = rgbOf(hex).map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
function inksClash(a, b) {                         // two inks may share a pixel only when that cannot make a new hue
  const [ha, ca] = hueChroma(...rgbOf(a)), [hb, cb] = hueChroma(...rgbOf(b));
  return ca >= 40 && cb >= 40 && hueDist(ha, hb) > 13;
}

/* ---------------- fonts and type ---------------- */
const face = (r) => { const f = FILM.fonts && FILM.fonts[r]; if (!f) throw new Error(`no font role "${r}"`); return f; };
const fontStr = (r, size) => { const f = face(r); return `${f.style === 'italic' ? 'italic ' : ''}${f.weight} ${size}px "${f.family}"`; };
function setFont(c, f) { c.font = f; c.fontKerning = 'normal'; c.letterSpacing = '0px'; c.textBaseline = 'alphabetic'; c.textAlign = 'left'; }
function capRatio(r) { setFont(mctx, fontStr(r, 1000)); return mctx.measureText('H').actualBoundingBoxAscent / 1000; }
const TEXT = {};                                   // font role -> every character it draws (checked against the font's cmap)
const useText = (r, s) => { face(r); TEXT[r] = (TEXT[r] || '') + s; return s; };
function textByFace() {
  const out = {};
  for (const [r, s] of Object.entries(TEXT)) { const f = face(r), k = `${f.family}|${f.weight}`; out[k] = (out[k] || '') + s; }
  return out;
}

// One line of type, one glyph at a time: the font's kerning recovered from pair widths, optical
// pairs on top (1/1000 em), then a fixed tracking, a tracking solved to span `justify` px, or a
// size solved (`fit`) so the ink spans the measure (or `fit: <px>`). `cap: <px>` sizes from a cap
// height. x and anchor ('L', 'R', 'C') place the ink edge or centre. Measured once, after the fonts load.
function measureRun(o, size) {
  const font = fontStr(o.font || 'display', size);
  setFont(mctx, font);
  const ch = Array.from(o.text), n = ch.length;
  const met = ch.map((c) => mctx.measureText(c));
  const adv = met.map((m) => m.width);
  const gap = [];
  for (let i = 0; i < n - 1; i++) {
    const kern = mctx.measureText(ch[i] + ch[i + 1]).width - adv[i] - adv[i + 1];
    gap.push(adv[i] + kern + ((o.pairs || {})[ch[i] + ch[i + 1]] || 0) / 1000 * size);
  }
  const pens = (T) => { const x = [0]; for (let i = 0; i < n - 1; i++) x.push(x[i] + gap[i] + T); return x; };
  const inkW = (x) => (x[n - 1] + met[n - 1].actualBoundingBoxRight) - (x[0] - met[0].actualBoundingBoxLeft);
  return { font, ch, n, met, pens, inkW };
}
function layoutText(o) {
  const r = o.font || 'display';
  useText(r, o.text);
  let size = o.size != null ? o.size : o.cap != null ? o.cap / capRatio(r) : 100;
  const width = o.fit ? (o.fit === true ? MEASURE : o.fit) : null;
  if (width) for (let k = 0; k < 3; k++) {         // ink width is linear in size; converge
    const m = measureRun(o, size);
    size *= width / m.inkW(m.pens((o.track || 0) / 1000 * size));
  }
  const m = measureRun(o, size), { ch, n, met } = m;
  const T = o.justify != null && n > 1 ? (o.justify - m.inkW(m.pens(0))) / (n - 1) : (o.track || 0) / 1000 * size;
  const x = m.pens(T);
  const inkL0 = x[0] - met[0].actualBoundingBoxLeft, inkR0 = x[n - 1] + met[n - 1].actualBoundingBoxRight;
  const anchor = o.anchor || 'L';
  const ax = o.x != null ? o.x : anchor === 'R' ? W - MARGIN : anchor === 'C' ? CX : MARGIN;
  const shift = anchor === 'R' ? ax - inkR0 : anchor === 'C' ? ax - (inkL0 + inkR0) / 2 : ax - inkL0;
  let slot = 0;
  const glyphs = ch.map((c, i) => {
    const sp = /\s/.test(c);
    const g = { ch: c, i, x: x[i] + shift, space: sp, slot: sp ? -1 : slot,
      inkL: x[i] + shift - met[i].actualBoundingBoxLeft, inkR: x[i] + shift + met[i].actualBoundingBoxRight,
      asc: met[i].actualBoundingBoxAscent, desc: met[i].actualBoundingBoxDescent };
    if (!sp) slot++;
    return g;
  });
  setFont(mctx, m.font);
  const capH = mctx.measureText('H').actualBoundingBoxAscent;
  const ink = glyphs.filter((g) => !g.space);
  const base = o.baseline != null ? o.baseline : 0;
  return { id: o.id, text: o.text, role: r, font: m.font, size, baseline: base, glyphs, slots: slot,
    trackPx: T, trackEm: T / size * 1000, inkL: inkL0 + shift, inkR: inkR0 + shift, capH, capTop: base - capH,
    top: base - Math.max(...ink.map((g) => g.asc)), bottom: base + Math.max(...ink.map((g) => g.desc)) };
}

// A canvas filter blurs a layer the size of the whole canvas (about 25 ms at 1080 px). Blurred
// glyphs are instead drawn once into small sprites, blur quantised to steps nobody can see, in a
// bounded cache. A sprite is a pure function of (font, glyph, colour, blur): a hit and a miss give
// the same pixels, so seek() stays pure.
const SPRITES = new Map();
let spritePx = 0;
const SPRITE_BUDGET = 24e6;
const blurQ = (b) => (b < 4 ? Math.round(b * 4) / 4 : b < 10 ? Math.round(b * 2) / 2 : Math.round(b));
function glyphSprite(font, ch, color, b) {
  const key = font + '|' + ch + '|' + color + '|' + b;
  let s = SPRITES.get(key);
  if (s) { SPRITES.delete(key); SPRITES.set(key, s); return s; }
  setFont(mctx, font);
  const m = mctx.measureText(ch), pad = Math.ceil(3 * b) + 2;
  const c = mkCanvas(Math.max(1, Math.ceil(m.actualBoundingBoxLeft + m.actualBoundingBoxRight) + 2 * pad), Math.max(1, Math.ceil(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) + 2 * pad));
  const x = c.getContext('2d', { willReadFrequently: true });
  setFont(x, font);
  x.fillStyle = color; x.filter = `blur(${b}px)`;
  const ox = pad + m.actualBoundingBoxLeft, oy = pad + m.actualBoundingBoxAscent;
  x.fillText(ch, ox, oy);
  s = { c, ox, oy, px: c.width * c.height };
  SPRITES.set(key, s); spritePx += s.px;
  for (const [k, v] of SPRITES) { if (spritePx <= SPRITE_BUDGET) break; SPRITES.delete(k); spritePx -= v.px; }
  return s;
}
function fillGlyph(c, ch, x, y, color, a, blur) {
  if (!(a > 0.002)) return;
  c.globalAlpha = a > 1 ? 1 : a;
  c.filter = 'none';
  const bq = blur > 0.05 ? blurQ(blur) : 0;
  if (bq > 0) { const s = glyphSprite(c.font, ch, color, bq); c.drawImage(s.c, x - s.ox, y - s.oy); return; }
  c.fillStyle = color;
  c.fillText(ch, x, y);
}
// Draw a laid-out line. fx(g) may return { dx, dy, op, blur, sx, sy, rot, color, ch, pivot } per glyph
// ('base' scales and turns about the glyph's foot on the baseline, 'mid' about its centre), or null to hide it.
function drawText(c, L, color, fx) {
  setFont(c, L.font);
  for (const g of L.glyphs) {
    if (g.space) continue;
    const e = fx ? fx(g) : {};
    if (!e) continue;
    const op = e.op != null ? e.op : 1;
    if (!(op > 0.002)) continue;
    const dx = e.dx || 0, dy = e.dy || 0, x = g.x + dx, y = L.baseline + dy;
    const sx = e.sx != null ? e.sx : 1, sy = e.sy != null ? e.sy : 1, rot = e.rot || 0;
    const cc = e.color || color, ch = e.ch || g.ch;
    if (rot || sx !== 1 || sy !== 1) {
      const px = (g.inkL + g.inkR) / 2 + dx, py = e.pivot === 'base' ? y : y - L.capH / 2;
      c.save(); c.translate(px, py); c.rotate(rot); c.scale(sx, sy); c.translate(-px, -py);
      fillGlyph(c, ch, x, y, cc, op, e.blur || 0);
      c.restore();
    } else fillGlyph(c, ch, x, y, cc, op, e.blur || 0);
  }
  c.globalAlpha = 1; c.filter = 'none';
}

/* ---------------- SVG paths ---------------- */
// A path from SVG path data: Path2D to draw it, its length and points for trims and morphs.
// Measured once through a hidden SVG element (the only DOM the core touches besides the canvas).
let svgRoot = null;
function svgPath(d) {
  if (!svgRoot) {
    svgRoot = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgRoot.setAttribute('style', 'position:absolute;left:0;top:0;width:0;height:0;overflow:hidden');
    document.body.appendChild(svgRoot);
  }
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  el.setAttribute('d', d);
  svgRoot.appendChild(el);
  const len = el.getTotalLength(), bb = el.getBBox();
  return { d, p2d: new Path2D(d), len, box: [bb.x, bb.y, bb.x + bb.width, bb.y + bb.height],
    points: (n) => { const out = []; for (let i = 0; i < n; i++) { const p = el.getPointAtLength(len * i / n); out.push([p.x, p.y]); } return out; } };
}

/* ---------------- registries the engine fills while it builds ---------------- */
const CUTS = [];                                   // hard cuts: motion blur never averages across them
const ACTIVE = [];                                 // [a, b] windows where something moves outside the Props
const ACCENTS = [];                                // { t, what }: accent frames (stills and the palette gate)
const WARN = [];                                   // timeline warnings for the critique
const CONTRAST = [];                               // { id, fg, bg, min }: text that must read
let ENGINE = null;
const cutAt = (t) => { if (t > 1e-9 && t < DUR && !CUTS.includes(t)) CUTS.push(t); };
const activeIn = (a, b) => { ACTIVE.push([a, b]); };
const accentAt = (t, what) => { ACCENTS.push({ t, what }); };
const needContrast = (id, fg, bg, min) => { CONTRAST.push({ id, fg, bg: bg || 'bg', min }); };

/* ---------------- sound: cues synthesised in the page ---------------- */
// FILM.audio turns sound on (audio.md). The engine, or FILM.audio.cues, places cues at build time with
// cue(t, kind, opts); `auto: true` adds one per accent and per cut. renderAudio() synthesises the cue mix in an
// OfflineAudioContext, never inside seek(): oscillators, filters and noise from a seeded buffer, so the same
// film gives the same samples. In a loop, sound that starts before 0 (a whoosh leading into a cut) or rings
// past DUR wraps round, so the audio loops with the picture. render.mjs mixes it with FILM.audio.track.
const AUDIO = FILM.audio || null;
const CUES = [];
const RATE = 48000;
const dBg = (v) => Math.pow(10, (v || 0) / 20);
// kind -> { dur (whoosh, swish, riser), make(k, t, o) }, o: { p (pitch factor), dur }.
// make() lists voices with k.v(src, t0, a, peak, d, filter, pan):
//   src     { wave: 'sine' | 'square' | 'triangle' | 'noise', f, auto: [[dt, f, 'exp' | 'set']], curve: [Float32Array, s] }
//   t0      when it starts; the envelope rises linearly over a to peak, then falls exponentially over d
//   filter  { type, f, Q, auto: [[dt, f]] } (exponential moves), pan a number or [from, to] across the voice
// A sweep swells into t and dies away after it; a riser ends on t.
const SFX = (() => {
  const sw = (f0, f1, glide) => ({ f: f0, auto: [[glide, f1, 'exp']] });
  return {
    pop: { make: (k, t, o) => { k.v({ wave: 'sine', ...sw(720 * o.p, 260 * o.p, 0.07) }, t, 0.002, 0.9, 0.11); k.v({ wave: 'noise' }, t, 0.001, 0.25, 0.012, { type: 'highpass', f: 2500 }); } },
    hit: { make: (k, t, o) => { k.v({ wave: 'sine', ...sw(160 * o.p, 50 * o.p, 0.15) }, t, 0.002, 0.9, 0.3); k.v({ wave: 'noise' }, t, 0.002, 0.7, 0.09, { type: 'lowpass', f: 2000 * o.p }); } },
    thud: { make: (k, t, o) => { k.v({ wave: 'sine', ...sw(90 * o.p, 42 * o.p, 0.22) }, t, 0.004, 1, 0.4); k.v({ wave: 'noise' }, t, 0.004, 0.45, 0.12, { type: 'lowpass', f: 450 * o.p }); } },
    tick: { make: (k, t, o) => { k.v({ wave: 'square', f: 2600 * o.p }, t, 0.001, 0.22, 0.03, { type: 'lowpass', f: 7000 }); k.v({ wave: 'noise' }, t, 0.001, 0.2, 0.008, { type: 'highpass', f: 6000 }); } },
    tap: { make: (k, t, o) => { k.v({ wave: 'triangle', ...sw(950 * o.p, 720 * o.p, 0.05) }, t, 0.002, 0.6, 0.06); k.v({ wave: 'noise' }, t, 0.001, 0.3, 0.02, { type: 'bandpass', f: 1800 * o.p, Q: 1 }); } },
    click: { make: (k, t, o) => { k.v({ wave: 'noise' }, t, 0.0005, 0.7, 0.012, { type: 'highpass', f: 3000 }); k.v({ wave: 'sine', f: 1900 * o.p }, t, 0.0005, 0.35, 0.018); } },
    snap: { make: (k, t, o) => { k.v({ wave: 'noise' }, t, 0.001, 1, 0.045, { type: 'bandpass', f: 2600 * o.p, Q: 2.5 }); k.v({ wave: 'sine', ...sw(1500 * o.p, 900 * o.p, 0.03) }, t, 0.001, 0.2, 0.03); } },
    blip: { make: (k, t, o) => k.v({ wave: 'square', f: 660 * o.p, auto: [[0.035, 990 * o.p, 'set']] }, t, 0.001, 0.3, 0.08, { type: 'lowpass', f: 4000 }) },
    drop: { make: (k, t, o) => k.v({ wave: 'sine', ...sw(880 * o.p, 200 * o.p, 0.22) }, t, 0.002, 0.6, 0.25) },
    boing: { make: (k, t, o) => {
      const n = 64, curve = new Float32Array(n);
      for (let i = 0; i < n; i++) { const u = 0.5 * i / (n - 1); curve[i] = 210 * o.p * (1 + 0.55 * Math.exp(-6 * u) * Math.sin(TAU * 9 * u)); }
      k.v({ wave: 'sine', curve: [curve, 0.5] }, t, 0.003, 0.8, 0.45);
    } },
    coin: { make: (k, t, o) => k.v({ wave: 'square', f: 988 * o.p, auto: [[0.075, 1319 * o.p, 'set']] }, t, 0.002, 0.35, 0.38, { type: 'lowpass', f: 5000 }) },
    chime: { make: (k, t, o) => {
      for (const [m, a, d] of [[1, 0.5, 1.3], [2.01, 0.22, 0.8], [3.03, 0.12, 0.5], [4.18, 0.06, 0.35]]) k.v({ wave: 'sine', f: 1047 * o.p * m }, t, 0.003, a, d);
    } },
    sparkle: { make: (k, t, o) => {
      for (let i = 0; i < 5; i++) k.v({ wave: 'sine', f: (2000 + 3000 * k.r(i)) * o.p }, t + 0.035 * i, 0.001, 0.15, 0.15);
    } },
    whoosh: { dur: 0.55, make: (k, t, o) => k.sweep(t, o.dur, 0.6, [350, 2400, 600], 0.9, 0.9, o.p) },
    swish: { dur: 0.24, make: (k, t, o) => k.sweep(t, o.dur, 0.6, [1800, 6000, 2500], 1.4, 0.7, o.p) },
    riser: { dur: 1.2, make: (k, t, o) => {
      k.v({ wave: 'noise' }, t - o.dur, o.dur, 0.7, 0.04, { type: 'bandpass', f: 300 * o.p, Q: 1.5, auto: [[o.dur, 5000 * o.p]] });
      k.v({ wave: 'sine', ...sw(180 * o.p, 900 * o.p, o.dur) }, t - o.dur, o.dur, 0.25, 0.04);
    } },
  };
})();
const cue = (t, kind, opts = {}) => {
  if (!SFX[kind]) throw new Error(`cue at ${t}: unknown kind "${kind}" (${Object.keys(SFX).join(', ')})`);
  CUES.push({ ...opts, t, kind });
};
// every cue the film sounds: the engine's, FILM.audio.cues, and with `auto` one per accent and cut. Sorted by
// time; two cues of one kind within 40 ms of each other sound once.
function audioCues() {
  if (!AUDIO || AUDIO.sfx === false) return [];
  const all = [...CUES];
  for (const c of AUDIO.cues || []) { if (!SFX[c.kind]) throw new Error(`FILM.audio.cues: unknown kind "${c.kind}"`); all.push({ ...c }); }
  if (AUDIO.auto) {
    const a = typeof AUDIO.auto === 'object' ? AUDIO.auto : {};
    const ak = a.accent !== undefined ? a.accent : 'pop', ck = a.cut !== undefined ? a.cut : 'whoosh';
    for (const k of [ak, ck]) if (k && !SFX[k]) throw new Error(`FILM.audio.auto: unknown kind "${k}"`);
    if (ak) for (const m of ACCENTS) all.push({ t: m.t, kind: ak, gain: a.accentGain, auto: `accent on ${m.what}` });
    if (ck) for (const t of CUTS) all.push({ t, kind: ck, gain: a.cutGain, auto: 'cut' });
  }
  const out = [];
  for (const c of all.filter((c) => c.t >= 0 && c.t < DUR).sort((x, y) => x.t - y.t || (x.kind < y.kind ? -1 : x.kind > y.kind ? 1 : 0)))
    if (!out.some((o) => o.kind === c.kind && Math.abs(o.t - c.t) < 0.04)) out.push(c);
  return out;
}
// The cue mix: Float32 stereo at 48 kHz, exactly the film's length. Cue options: gain (dB), pitch (a factor),
// pan (-1 to 1), dur (whoosh, swish, riser), seed, vary (0 turns off the seeded +-2 % pitch and +-1 dB level
// variation between repeats of one kind). Every voice renders in an OfflineAudioContext of its own, one chain
// with nothing summed inside it (Chromium sums a node's inputs in no fixed order, which changes the last bit),
// and the voices are added up here, in a fixed order: the same film gives the same samples, bit for bit.
let NOISE = null;
async function mixCues() {
  const list = audioCues();
  if (!list.length) return null;
  const N = Math.round(NFR / FPS * RATE);
  const sfxDb = typeof AUDIO.sfx === 'number' ? AUDIO.sfx : 0;
  if (!NOISE) {                                    // two seconds of seeded white noise, shared by every voice
    NOISE = new AudioBuffer({ numberOfChannels: 1, length: RATE * 2, sampleRate: RATE });
    const nd = NOISE.getChannelData(0), rnd = mulberry32(0x5F3759DF);
    for (let i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;
  }
  const voices = [];
  list.forEach((c, i) => {
    const K = SFX[c.kind], dur = c.dur || K.dur || 0, vary = c.vary === 0 ? 0 : 1, seed = c.seed != null ? c.seed : i;
    const o = { p: (c.pitch || 1) * (1 + vary * 0.04 * (hash(i, 71) - 0.5)), dur };
    const g = 0.5 * dBg((c.gain || 0) + vary * 2 * (hash(i, 72) - 0.5) + sfxDb), pan = Math.max(-1, Math.min(1, c.pan || 0));
    const k = {
      r: (j) => hash(seed, 73, j),
      v: (src, t0, a, peak, d, filter, vpan) => voices.push({ src, t0, a, peak, d, filter, pan: vpan != null ? vpan : pan, g, off: 1.9 * hash(seed, 74, voices.length) }),
      // noise through a band-pass that sweeps f[0] -> f[1] (at t) -> f[2], swelling into t and panning across
      sweep: (t, dur, lead, f, Q, peak, p) => k.v({ wave: 'noise' }, t - lead * dur, lead * dur, peak, (1 - lead) * dur,
        { type: 'bandpass', f: f[0] * p, Q, auto: [[lead * dur, f[1] * p], [dur, f[2] * p]] }, [pan - 0.5, pan + 0.5]),
    };
    K.make(k, c.t, o);
  });
  const pre = Math.ceil(Math.max(0, ...voices.map((v) => -v.t0)) * RATE);
  const post = Math.ceil(Math.max(0, ...voices.map((v) => v.t0 + v.a + v.d + 0.01 - DUR)) * RATE);
  const len = pre + N + post, L = new Float32Array(len), R = new Float32Array(len);
  const renderVoice = (v) => {
    const at = pre + v.t0 * RATE, start = Math.floor(at), s = (at - start) / RATE, end = s + v.a + v.d;
    const ac = new OfflineAudioContext({ numberOfChannels: 2, length: Math.ceil((end + 0.01) * RATE), sampleRate: RATE });
    let src;
    if (v.src.wave === 'noise') { src = new AudioBufferSourceNode(ac, { buffer: NOISE, loop: true }); src.start(s, v.off); }
    else {
      src = new OscillatorNode(ac, { type: v.src.wave });
      if (v.src.curve) src.frequency.setValueCurveAtTime(v.src.curve[0], s, v.src.curve[1]);
      else {
        src.frequency.setValueAtTime(v.src.f, s);
        for (const [dt, f, kind] of v.src.auto || []) { if (kind === 'set') src.frequency.setValueAtTime(f, s + dt); else src.frequency.exponentialRampToValueAtTime(f, s + dt); }
      }
      src.start(s);
    }
    src.stop(end + 0.005);
    let node = src;
    if (v.filter) {
      const b = new BiquadFilterNode(ac, { type: v.filter.type, Q: v.filter.Q != null ? v.filter.Q : 0.7 });
      b.frequency.setValueAtTime(v.filter.f, s);
      for (const [dt, f] of v.filter.auto || []) b.frequency.exponentialRampToValueAtTime(f, s + dt);
      node.connect(b); node = b;
    }
    const env = new GainNode(ac, { gain: 0 });
    env.gain.setValueAtTime(0, s); env.gain.linearRampToValueAtTime(v.peak, s + v.a);
    env.gain.exponentialRampToValueAtTime(v.peak * 1e-3, end); env.gain.linearRampToValueAtTime(0, end + 0.004);
    node.connect(env);
    const pn = new StereoPannerNode(ac);
    if (Array.isArray(v.pan)) { pn.pan.setValueAtTime(Math.max(-1, v.pan[0]), s); pn.pan.linearRampToValueAtTime(Math.min(1, v.pan[1]), end); } else pn.pan.value = v.pan;
    env.connect(pn); pn.connect(ac.destination);
    return ac.startRendering().then((b) => ({ b, start }));
  };
  for (let i0 = 0; i0 < voices.length; i0 += 16) {  // 16 at a time, added in order
    const bufs = await Promise.all(voices.slice(i0, i0 + 16).map(renderVoice));
    bufs.forEach(({ b, start }, i) => {
      const g = voices[i0 + i].g, l = b.getChannelData(0), r = b.getChannelData(1);
      for (let j = 0; j < l.length && start + j < len; j++) { L[start + j] += g * l[j]; R[start + j] += g * r[j]; }
    });
  }
  const cycle = LOOP !== 'none';                   // a loop wraps what sounds before 0 or after DUR; 'none' drops it
  const pcm = new Float32Array(N * 2);
  let peak = 0;
  for (let i = 0; i < N; i++) {
    let l = 0, r = 0;
    for (let j = cycle ? (i + pre) % N : i + pre; j < len; j += cycle ? N : len) { l += L[j]; r += R[j]; }
    pcm[2 * i] = l; pcm[2 * i + 1] = r;
    peak = Math.max(peak, Math.abs(l), Math.abs(r));
  }
  return { pcm, frames: N, peak, list };
}
// for the scripts: the mix as base64 of interleaved little-endian Float32 samples, or null without sound effects
async function renderAudio() {
  const m = await mixCues();
  if (!m) return null;
  const { pcm, frames, peak, list } = m, bytes = new Uint8Array(pcm.buffer);
  let str = '';
  for (let i = 0; i < bytes.length; i += 0x8000) str += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return { rate: RATE, channels: 2, frames, peak, b64: btoa(str), cues: list.map((c) => ({ t: +c.t.toFixed(4), kind: c.kind, auto: c.auto || null })) };
}

/* ---------------- frame ---------------- */
function draw(c, tIn) {
  const t = wrapT(tIn);
  let nq = frameOf(t);
  if (nq >= NFR) nq -= NFR;                        // the last subframes of the loop belong to frame 0
  const q = nq / FPS;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.filter = 'none';
  if (TRANSPARENT) c.clearRect(0, 0, W, H); else { c.fillStyle = PAL.bg; c.fillRect(0, 0, W, H); }
  ENGINE.draw(c, t, q, nq);
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.filter = 'none';
}
let isReady = false;
function seek(t) { if (!isReady) return false; draw(ctx, Number(t)); return true; }

/* ---------------- motion blur ---------------- */
// Subframes on a trailing shutter, clamped to a hard cut so the first frame after it is not a
// double exposure. How many: 1 when nothing changes (exact: the mean of identical samples is the
// sample), else one per 5 px of the engine's measured displacement, 4 to 64. A transparent film averages
// premultiplied colour (each sample's colour weighted by its alpha), then divides by the summed alpha, so
// an edge that fades out does not pull the colour of transparent black into its fringe.
function shutterTimes(n, k) {
  const tn = n / FPS, out = [];
  for (let i = k - 1; i >= 0; i--) {
    let t = k === 1 ? tn : tn - i * SHUTTER / (FPS * (k - 1));
    for (const cut of CUTS) if (tn >= cut && t < cut) t = cut;
    if (ENGINE.seamCut && tn === 0 && t < 0) t = 0;   // a cut at the loop point itself
    out.push(t);
  }
  return out;
}
function motionAt(n) {
  if (!BLUR) return { samples: 1, disp: 0 };
  const ta = wrapT(shutterTimes(n, 2)[0]), tb = wrapT(n / FPS);
  const spans = ta === tb ? [] : ta < tb ? [[ta, tb]] : [[ta, DUR], [0, tb]];   // a shutter clamped flat against a cut cannot move
  let moving = false;
  for (const [a, b] of spans) if (ENGINE.always || ACTIVE.some(([x, y]) => x < b && y > a) || PROPS.some((p) => p.active(a, b))) { moving = true; break; }
  if (!moving) return { samples: 1, disp: 0 };
  const minS = ENGINE.minSamples || MIN_SAMPLES;    // an engine whose every sample is costly (WebGL) may allow 2
  const disp = ENGINE.disp ? ENGINE.disp(ta, tb) : PX_PER_SAMPLE * minS;
  return { samples: Math.max(minS, Math.min(MAX_SAMPLES, Math.ceil(disp / PX_PER_SAMPLE))), disp };
}
let SUM = null;
function renderFrame(n) {
  if (!isReady) return 0;
  const { samples } = motionAt(n);
  const times = shutterTimes(n, samples);
  if (samples === 1) { draw(ctx, times[0]); return 1; }
  if (ENGINE.accumulate) { ENGINE.accumulate(ctx, times); return samples; }
  if (TRANSPARENT) { accumulatePremul(times); return samples; }
  if (!SUM) SUM = new Uint16Array(W * H * 4); else SUM.fill(0);
  for (const t of times) {
    draw(ctx, t);
    const px = ctx.getImageData(0, 0, W, H).data;
    for (let i = 0; i < px.length; i++) SUM[i] += px[i];
  }
  const out = ctx.createImageData(W, H), o = out.data, half = samples >> 1;
  for (let i = 0; i < o.length; i++) o[i] = ((SUM[i] + half) / samples) | 0;
  ctx.putImageData(out, 0, 0);
  return samples;
}
let SUMP = null;
function accumulatePremul(times) {                  // Uint32 sums hold up to 64 x 255 x 255
  if (!SUMP) SUMP = new Uint32Array(W * H * 4); else SUMP.fill(0);
  for (const t of times) {
    draw(ctx, t);
    const px = ctx.getImageData(0, 0, W, H).data;
    for (let i = 0; i < px.length; i += 4) {
      const a = px[i + 3];
      if (!a) continue;
      SUMP[i] += px[i] * a; SUMP[i + 1] += px[i + 1] * a; SUMP[i + 2] += px[i + 2] * a; SUMP[i + 3] += a;
    }
  }
  const k = times.length, out = ctx.createImageData(W, H), o = out.data, half = k >> 1;
  for (let i = 0; i < o.length; i += 4) {
    const sa = SUMP[i + 3];
    if (!sa) continue;
    const h = sa >> 1;
    o[i] = ((SUMP[i] + h) / sa) | 0; o[i + 1] = ((SUMP[i + 1] + h) / sa) | 0; o[i + 2] = ((SUMP[i + 2] + h) / sa) | 0;
    o[i + 3] = ((sa + half) / k) | 0;
  }
  ctx.putImageData(out, 0, 0);
}
// the pixels as a viewer sees them: a transparent film composited over its assumed backdrop, bg
// (the same rounding render.mjs uses for the MP4 and GIF)
function seenPixels() {
  const d = ctx.getImageData(0, 0, W, H).data;
  if (!TRANSPARENT) return d;
  const [br, bgr, bb] = rgbOf(PAL.bg);
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3];
    if (a === 255) continue;
    const ia = 255 - a;
    d[i] = (d[i] * a + br * ia + 127) / 255 | 0; d[i + 1] = (d[i + 1] * a + bgr * ia + 127) / 255 | 0; d[i + 2] = (d[i + 2] * a + bb * ia + 127) / 255 | 0; d[i + 3] = 255;
  }
  return d;
}

/* ---------------- analysis (never called by seek) ---------------- */
function accentFrames() { return ACCENTS.map((m) => ({ what: m.what, t: Math.round(m.t * 1000) / 1000, frame: Math.round(m.t * FPS) % NFR })); }

// Off-palette scan. Default: pixels with chroma >= 40 whose hue is more than 13 degrees from every
// chromatic palette colour (two inks mixed into a new one), counted as `area` only where the 4
// neighbours are off too (patches 3+ px across, not the 1-px antialiasing fringe). strict: any pixel
// that is not exactly a palette colour (pixel art).
function offPalette(frames, mode, strict) {
  const cols = Object.values(PAL).map(rgbOf);
  const hues = cols.map((c) => hueChroma(...c)).filter(([, c]) => c >= 40).map(([h]) => h);
  const exact = new Set(cols.map(([r, g, b]) => (r << 16) | (g << 8) | b));
  const out = [];
  for (const n of frames) {
    if (mode === 'seek') seek(n / FPS); else renderFrame(n);
    const px = seenPixels(), off = new Uint8Array(W * H);
    let count = 0; const seen = {};
    for (let p = 0, i = 0; p < W * H; p++, i += 4) {
      let bad;
      if (strict) bad = !exact.has((px[i] << 16) | (px[i + 1] << 8) | px[i + 2]);
      else { const [h, C] = hueChroma(px[i], px[i + 1], px[i + 2]); bad = C >= 40 && !hues.some((hp) => hueDist(h, hp) <= 13); }
      if (bad) { off[p] = 1; count++; const k = `${px[i]},${px[i + 1]},${px[i + 2]}`; seen[k] = (seen[k] || 0) + 1; }
    }
    let area = strict ? count : 0;
    if (!strict) for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const p = y * W + x; if (off[p] && off[p - 1] && off[p + 1] && off[p - W] && off[p + W]) area++; }
    const top = Object.entries(seen).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `(${k})x${v}`).join(' ');
    out.push({ frame: n, count, area, top });
  }
  return out;
}

// the last moment anything on screen can change: spring settles, active windows, accents, and the
// engine's own discrete state (typing, blinking, snaps)
function lastChange() {
  let t = -Infinity, what = 'nothing moves';
  const see = (v, w) => { if (v > t) { t = v; what = w; } };
  for (const p of PROPS) see(p.settleEnd(), `${p.name} settles`);
  for (const w of ACTIVE) see(w[1], 'an active window ends');
  for (const m of ACCENTS) see(m.t + 3 / FPS, `the accent on ${m.what} ends`);
  if (ENGINE.lastChange) ENGINE.lastChange(see);
  return { t, what };
}
function loopChecks(add) {
  for (const p of PROPS) for (const e of p.ev) if (e.t >= DUR - 1e-9 || e.t < 0) { add('timeline', 'WARN', `${p.name}: an event at ${e.t.toFixed(3)} s is outside the loop (0 to ${DUR})`); break; }
  if (LOOP === 'hold') {
    const last = lastChange(), need = DUR - (1 + SHUTTER) / FPS, hold = Math.floor((DUR - last.t) * FPS + 1e-6);
    add('loop tail', last.t <= need ? 'PASS' : 'FAIL', `last change at ${last.t.toFixed(3)} s (${last.what}); still hold at least ${hold} frames (needs >= 2; loopcheck counts identical pixels)`);
  } else if (LOOP === 'cycle') {
    const open = PROPS.filter((p) => Math.abs(p.last - p.v0) > 1e-6);
    add('loop closes', open.length ? 'FAIL' : 'PASS', open.length
      ? `${open.slice(0, 6).map((p) => `${p.name} ends at ${+p.last.toFixed(3)} but starts at ${+p.v0.toFixed(3)}`).join('; ')}${open.length > 6 ? ` and ${open.length - 6} more` : ''}: the loop jumps`
      : `${PROPS.length} props return to where they start; springs still settling at the end carry over the seam`);
    if (ENGINE.cycles) for (const c of ENGINE.cycles()) {
      const k = DUR / c.period;
      add(`cycle: ${c.what}`, Math.abs(k - Math.round(k)) < 1e-6 ? 'PASS' : 'FAIL', `${+k.toFixed(4)} cycles per loop (period ${+c.period.toFixed(4)} s); must be whole`);
    }
  }
}
// frames where nothing is on screen (a blank flash between scenes), from the engine's visible(t)
function emptyRuns() {
  const runs = [];
  let start = -1;
  for (let n = 0; n <= NFR; n++) {
    const empty = n < NFR && !ENGINE.visible(n / FPS);
    if (empty && start < 0) start = n;
    if (!empty && start >= 0) { runs.push([start, n - 1]); start = -1; }
  }
  return runs;
}
// Collision and live-area helpers for engines' checks. Boxes are [x0, y0, x1, y1] in canvas px.
function checkLiveArea(add, id, b, bleed) {
  if (bleed) return;
  const out = [];
  if (b[0] < MARGIN - 1) out.push(`left ${b[0].toFixed(1)} < ${MARGIN}`);
  if (b[2] > W - MARGIN + 1) out.push(`right ${b[2].toFixed(1)} > ${W - MARGIN}`);
  if (b[1] < MARGIN - 1) out.push(`top ${b[1].toFixed(1)} < ${MARGIN}`);
  if (b[3] > H - MARGIN + 1) out.push(`bottom ${b[3].toFixed(1)} > ${H - MARGIN}`);
  add(`live area: ${id}`, out.length ? 'FAIL' : 'PASS', out.join(', ') || `${b.map((v) => v.toFixed(0)).join(', ')}`);
}
function checkSpacing(add, items, tight = 16 * U) {  // items: [{ id, b }] on screen together at rest
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i].b, b = items[j].b;
    const dx = Math.max(0, a[0] - b[2], b[0] - a[2]), dy = Math.max(0, a[1] - b[3], b[1] - a[3]);
    const gap = dx === 0 && dy === 0 ? -1 : Math.hypot(dx, dy);
    if (gap < 0) add(`collision: ${items[i].id} / ${items[j].id}`, 'FAIL', 'boxes overlap at rest');
    else if (gap < tight) add(`cramped: ${items[i].id} / ${items[j].id}`, 'WARN', `${gap.toFixed(1)} px apart (< ${tight.toFixed(0)} px)`);
  }
}
function critique() {
  const checks = [];
  const add = (name, status, detail) => checks.push({ name, status, detail });
  if (ENGINE.checks) ENGINE.checks(add);
  for (const c of CONTRAST) {
    const r = contrast(col(c.fg), col(c.bg));
    add(`contrast: ${c.id}`, r < c.min ? 'FAIL' : 'PASS', `${r.toFixed(2)}:1 on ${c.bg} (needs ${c.min}:1)`);
  }
  const stray = [...USED].filter((k) => !(k in PAL));
  add('palette roles', stray.length ? 'FAIL' : 'PASS', stray.length ? `not in the palette: ${stray.join(', ')}` : `${USED.size} roles used, all in the palette`);
  loopChecks(add);
  if (ENGINE.visible) {
    const minRun = Math.max(2, Math.round(FPS / 15));
    for (const [a, b] of emptyRuns()) if (b - a + 1 >= minRun)
      add('blank frames', 'WARN', `frames ${a}-${b} (t ${(a / FPS).toFixed(3)}-${(b / FPS).toFixed(3)}) show nothing: start the next entrance sooner, or pop it in at the cut`);
  }
  for (const w of WARN) add('timeline', 'WARN', w);
  compositionCheck(add);
  if (AUDIO) audioCheck(add);
  return checks;
}
function audioCheck(add) {
  let list;
  try { list = audioCues(); } catch (e) { add('audio', 'FAIL', e.message); return; }
  const by = {};
  for (const c of list) by[c.kind] = (by[c.kind] || 0) + 1;
  const kinds = Object.entries(by).map(([k, n]) => `${n} ${k}`).join(', ');
  const lufs = AUDIO.loudness != null ? AUDIO.loudness : -16;
  if (!list.length && !AUDIO.track) add('audio', 'FAIL', `FILM.audio has no track and no cues${AUDIO.sfx === false ? ' (sfx: false)' : ': place cues with cue(t, kind), FILM.audio.cues or auto: true'}`);
  else add('audio', 'PASS', `${list.length ? `${list.length} cues (${kinds})` : 'no cues'}${AUDIO.track ? `, track ${AUDIO.track}` : ''}, normalised to ${lufs} LUFS`);
}
// Composition: where the ink sits in the review stills. Ink is any pixel away from the background and from
// the colours of the roles an engine lists as backdrop (a stage, a sky). The lean on an axis is the difference
// between the empty margins on its two sides, or twice the ink's centre of mass off the middle (a small footer
// stretches the box but barely moves the mass), whichever is larger. An average lean past a fifth of the
// canvas warns, past 30 % fails: content authored for a square left in the top of a 9:16 frame, or the left
// of a 16:9 one.
function inkBox(isBg, step) {
  const d = seenPixels();
  let x0 = W, y0 = H, x1 = -1, y1 = -1, n = 0, sx = 0, sy = 0;
  for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) {
    const i = (y * W + x) * 4;
    if (isBg(d[i], d[i + 1], d[i + 2])) continue;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    n++; sx += x; sy += y;
  }
  return x1 < 0 ? null : { box: [x0, y0, x1 + step, y1 + step], cx: sx / n, cy: sy / n };
}
function compositionCheck(add) {
  const bgs = [PAL.bg, ...(ENGINE.backdrop || []).map((r) => PAL[r] || r)].map(rgbOf);
  const isBg = (r, g, b) => bgs.some((c) => Math.abs(r - c[0]) + Math.abs(g - c[1]) + Math.abs(b - c[2]) < 36);
  const pick = (a, b) => Math.abs(a) >= Math.abs(b) ? a : b;
  const rows = [];
  for (const { frame } of stillsPlan()) {
    draw(ctx, frame / FPS);
    const ink = inkBox(isBg, Math.max(2, Math.round(3 * U)));
    if (!ink) continue;
    const b = ink.box, top = b[1] / H, bottom = (H - b[3]) / H, left = b[0] / W, right = (W - b[2]) / W;
    if (top + bottom > 0.9 || left + right > 0.9) continue;         // a speck: nothing to balance
    rows.push({ v: pick(bottom - top, 2 * (0.5 - ink.cy / H)), h: pick(right - left, 2 * (0.5 - ink.cx / W)) });
  }
  if (!rows.length) { add('composition', 'PASS', 'no still with measurable ink off the background'); return; }
  const mean = (k) => rows.reduce((a, r) => a + r[k], 0) / rows.length;
  const v = mean('v'), h = mean('h');
  const lean = (x, a, b) => `${x > 0 ? a : b} (a lean of ${Math.round(Math.abs(x) * 100)} %)`;
  const verdict = (x) => Math.abs(x) > 0.3 ? 'FAIL' : Math.abs(x) > 0.2 ? 'WARN' : 'PASS';
  const worst = Math.abs(v) >= Math.abs(h) ? ['v', v] : ['h', h];
  let st = verdict(worst[1]);
  if (TRANSPARENT && st === 'FAIL') st = 'WARN';     // an overlay (a lower third, a corner bug) sits where the edit needs it
  // FILM.composition = { lean: 'top', why: '...' } accepts a lean the design means (a title screen's title riding
  // high over its world), per format through FILM.formats: a warning in that direction passes, with the reason
  const dir = worst[0] === 'v' ? (worst[1] > 0 ? 'top' : 'bottom') : (worst[1] > 0 ? 'left' : 'right');
  const ok = FILM.composition || {};
  if (st === 'WARN' && ok.lean === dir && ok.why) {
    add('composition', 'PASS', `the stills lean to the ${worst[0] === 'v' ? lean(v, 'top', 'bottom') : lean(h, 'left', 'right')} by design: ${ok.why}`);
    return;
  }
  add('composition', st, st === 'PASS'
    ? `${rows.length} stills balanced: a lean of ${Math.round(Math.abs(v) * 100)} % top to bottom, ${Math.round(Math.abs(h) * 100)} % left to right on average`
    : `the stills lean to the ${worst[0] === 'v' ? lean(v, 'top', 'bottom') : lean(h, 'left', 'right')}, over ${rows.length} stills (${FMT.key}): centre the content or pin elements to the edges they belong to`);
}
// review stills: the engine's plan (each scene in and at rest, each transition) plus every accent frame
function stillsPlan() {
  const plan = [], seen = new Set();
  const push = (frame, name, what) => { frame = Math.max(0, Math.min(NFR - 1, Math.round(frame))); if (seen.has(frame)) return; seen.add(frame); plan.push({ frame, name, what }); };
  if (ENGINE.stills) ENGINE.stills(push);
  for (const m of accentFrames()) push(m.frame, `accent-${m.what}`, `accent on ${m.what}`);
  return plan.sort((a, b) => a.frame - b.frame);
}
function layoutTable() {
  return { film: { W, H, FPS, DUR, frames: NFR, bpm: FILM.BPM, loop: LOOP, blur: BLUR, margin: MARGIN, measure: MEASURE, engine: ENGINE.name },
    ...(ENGINE.layout ? ENGINE.layout() : {}), cuts: CUTS, accents: accentFrames(), warnings: WARN };
}

/* ---------------- boot ---------------- */
function filmChars() {                              // every character any string in FILM holds, to load the fonts with
  const s = new Set('H0');
  const walk = (v, d) => { if (typeof v === 'string') { for (const c of v) s.add(c); } else if (v && typeof v === 'object' && d < 12) for (const k in v) walk(v[k], d + 1); };
  walk(FILM, 0);
  return [...s].join('');
}
function boot(E) {
  ENGINE = E;
  Object.assign(SP, E.springs || {}, FILM.springs || {});
  for (const [k, v] of Object.entries(SP)) if (!(v[0] > 0 && v[0] <= 1 && v[1] > 0)) throw new Error(`spring ${k}: zeta must be in (0, 1] and omega > 0`);
  window.DURATION = DUR; window.FPS = FPS; window.WIDTH = W; window.HEIGHT = H;
  window.FILM_META = { title: FILM.title, poster: FILM.poster || 0, bg: PAL.bg, palette: PAL, loop: LOOP, blur: BLUR,
    engine: E.name, strictPalette: !!E.strictPalette, seamCut: !!E.seamCut, gif: E.gif || null,
    format: FMT.key, aspect: FMT.aspect, formats: Object.keys(FILM.formats || {}), transparent: TRANSPARENT,
    audio: AUDIO && { track: AUDIO.track || null, gain: AUDIO.gain || 0, fadeIn: AUDIO.fadeIn || 0, fadeOut: AUDIO.fadeOut || 0, offset: AUDIO.offset || 0,
      sfx: AUDIO.sfx === false ? false : typeof AUDIO.sfx === 'number' ? AUDIO.sfx : 0, loudness: AUDIO.loudness != null ? AUDIO.loudness : -16 } };
  Object.assign(window, { seek, renderFrame, motionAt, layoutTable, critique, stillsPlan, textByFace, accentFrames, misFrames: accentFrames, offPalette, renderAudio, audioCues });
  const roles = Object.keys(FILM.fonts || {}), sample = filmChars();
  window.ready = Promise.all(roles.map((r) => document.fonts.load(fontStr(r, 100), sample)))
    .then((sets) => { if (sets.some((s) => !s.length)) throw new Error('a font face failed to load'); return E.build(); })
    .then(() => {
      for (const p of PROPS) p.seam();
      CUTS.sort((a, b) => a - b);
      isReady = true;
      seek(0);
      return true;
    });
  // Preview: requestAnimationFrame is the only time source and it only calls seek().
  // Space pauses, the arrow keys step one frame, ?t=3.5 opens paused at a time. With FILM.audio, M (or a click)
  // turns the cue mix on and off; while it plays, the audio clock drives the picture so the two stay in sync.
  if (!/[?&]capture\b/.test(location.search)) {
    window.ready.then(() => {
      const m = /[?&]t=([\d.]+)/.exec(location.search);
      let paused = !!m, pos = m ? Number(m[1]) : 0, last = null;
      let snd = null, want = false, src = null, a0 = 0, p0 = 0;
      const hush = () => { if (src) { src.stop(); src = null; } };
      const play = async () => {
        if (!snd) {
          const mx = await mixCues();
          if (!mx) return;
          const ac = new AudioContext({ sampleRate: RATE }), buf = ac.createBuffer(2, mx.frames, RATE);
          const L = buf.getChannelData(0), R = buf.getChannelData(1);
          for (let i = 0; i < mx.frames; i++) { L[i] = mx.pcm[2 * i]; R[i] = mx.pcm[2 * i + 1]; }
          snd = { ac, buf };
        }
        hush();
        if (!want || paused) return;
        await snd.ac.resume();
        src = snd.ac.createBufferSource(); src.buffer = snd.buf; src.loop = LOOP !== 'none'; src.connect(snd.ac.destination);
        src.start(0, pos); a0 = snd.ac.currentTime; p0 = pos;
      };
      const tick = (ts) => {
        if (!paused && src) pos = wrapT(p0 + snd.ac.currentTime - a0);
        else if (!paused && last !== null) pos = wrapT(pos + (ts - last) / 1000);
        last = ts; seek(pos); requestAnimationFrame(tick);
      };
      const toggle = () => { if (!AUDIO) return; want = !want; if (want) play(); else hush(); };
      addEventListener('keydown', (e) => {
        if (e.key === ' ') { paused = !paused; e.preventDefault(); if (paused) hush(); else if (want) play(); }
        if (e.key === 'ArrowRight') { paused = true; hush(); pos = wrapT(Math.round(pos * FPS + 1) / FPS); }
        if (e.key === 'ArrowLeft') { paused = true; hush(); pos = wrapT(Math.round(pos * FPS - 1) / FPS); }
        if (e.key === 'm' || e.key === 'M') toggle();
      });
      canvas.addEventListener('click', toggle);
      requestAnimationFrame(tick);
    });
  }
}

  return { W, H, FPS, DUR, NFR, CX, CY, U, PAL, col, role, GRID, MARGIN, UNIT, MEASURE, LOOP, BLUR, TRANSPARENT, SHUTTER, TAU,
    canvas, ctx, mkCanvas, mk2d, mctx,
    SP, spring, settle, S, dS, landT, Prop, PROPS,
    cyc, wave, mulberry32, hash, loopNoise, shuffled,
    wrapT, frameOf, typed, noteSec, drawing,
    rgbOf, hexOf, mix, hueChroma, hueDist, lum, contrast, inksClash,
    face, fontStr, setFont, capRatio, useText, measureRun, layoutText, blurQ, glyphSprite, fillGlyph, drawText,
    svgPath, CUTS, ACTIVE, ACCENTS, WARN, CONTRAST, cutAt, activeIn, accentAt, needContrast, cue,
    checkLiveArea, checkSpacing, seek, boot,
    FMT, fmtX, fmtY, fmtPos, fmtSz };
})();
const { W, H, FPS, DUR, NFR, CX, CY, U, PAL, col, role, GRID, MARGIN, UNIT, MEASURE, LOOP, BLUR, TRANSPARENT, SHUTTER, TAU,
  canvas, ctx, mkCanvas, mk2d, mctx,
  SP, spring, settle, S, dS, landT, Prop, PROPS,
  cyc, wave, mulberry32, hash, loopNoise, shuffled,
  wrapT, frameOf, typed, noteSec, drawing,
  rgbOf, hexOf, mix, hueChroma, hueDist, lum, contrast, inksClash,
  face, fontStr, setFont, capRatio, useText, measureRun, layoutText, blurQ, glyphSprite, fillGlyph, drawText,
  svgPath, CUTS, ACTIVE, ACCENTS, WARN, CONTRAST, cutAt, activeIn, accentAt, needContrast, cue,
  checkLiveArea, checkSpacing, seek, boot,
  FMT, fmtX, fmtY, fmtPos, fmtSz } = CORE;
