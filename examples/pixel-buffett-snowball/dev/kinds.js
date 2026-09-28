// ball: a snowball that rolls behind the runner and swells at each stop, drawn a pixel at a time. It is the one thing in
// this film the engine's vocabulary lacks: a shaded, turning disc whose size steps up on springs, in whole pixels.
const BALL_RAMP = ['shade', 'far', 'snow', 'white'];
const BALL_LIGHT = (() => { const l = [-0.45, -0.55, 0.70], n = Math.hypot(...l); return l.map((v) => v / n); })();
BUILD.ball = (L) => {
  const s = L.spec, steps = s.radius;                       // [[t, r], ...] in time order; the first is the starting size
  L.heroX = s.heroX; L.gap = s.gap != null ? s.gap : 6; L.ground = s.ground; L.speed = s.speed || 0;
  L.r = new Prop(steps[0][1], `${L.id}.r`);
  for (let i = 1; i < steps.length; i++) L.r.to(steps[i][0], steps[i][1], s.spring || 'HOP');
  L.steps = steps;
  // how far it has turned by each frame: rolling without slipping, it turns speed / r radians a second
  L.ang = new Float64Array(NFR + 1);
  for (let n = 1; n <= NFR; n++) L.ang[n] = L.ang[n - 1] + (L.speed / FPS) / Math.max(2, L.r.at(n / FPS));
  // flecks: seeded spots on the disc in the ball's own frame; they turn with it. A third of them are gold.
  L.flecks = Array.from({ length: 128 }, (_, i) => ({ rho: 0.12 + 0.74 * Math.sqrt(hash(77, i, 1)), a: hash(77, i, 2) * TAU, gold: i % 3 === 0 }));
  L.ix = { ink: ix('ink'), gold: ix('gold'), orange: ix('orange'), ramp: BALL_RAMP.map(ix) };
  for (const v of [L.heroX, L.gap, L.ground, ...steps.map((p) => p[1])]) if (!whole(v)) ODD.push(`${L.id} ${v}`);
};
DRAW.ball = (L, q, sx, sy) => {
  const R = Math.max(2, Math.round(L.r.at(q))), I = L.ix;
  const cx = L.heroX - L.gap - R + sx, cy = L.ground - R + sy;
  const th = L.ang[Math.min(NFR, Math.round(q * FPS))];
  const put = (x, y, c) => { if (x >= 0 && x < PW && y >= 0 && y < PH) FB[y * PW + x] = c; };
  const d2 = (x, y) => (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2;
  const inside = (x, y) => d2(x, y) <= R * R;
  const sw = Math.round(R * 0.95);                           // its shadow on the snow
  for (let x = cx - sw; x <= cx + sw; x++) put(x, cy + R, I.ramp[0]);
  for (let x = cx - Math.round(sw * 0.7); x <= cx + Math.round(sw * 0.7); x++) put(x, cy + R + 1, I.ramp[0]);
  for (let y = cy - R; y < cy + R; y++) for (let x = cx - R; x < cx + R; x++) {
    if (!inside(x, y)) continue;
    if (!(inside(x - 1, y) && inside(x + 1, y) && inside(x, y - 1) && inside(x, y + 1))) { put(x, y, I.ink); continue; }
    const nx = (x + 0.5 - cx) / R, ny = (y + 0.5 - cy) / R, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
    const lam = nx * BALL_LIGHT[0] + ny * BALL_LIGHT[1] + nz * BALL_LIGHT[2];
    const v = Math.min(1, Math.max(0, (lam + 0.1) / 1.0)) * 3, i = Math.min(2, Math.floor(v)), f = v - i;
    put(x, y, I.ramp[f > (BAYER[((y & 3) << 2) | (x & 3)] + 0.5) / 16 ? i + 1 : i]);   // a dither between two tones of the ramp: it does not move
  }
  const inner = (x, y) => d2(x, y) <= (R - 1.6) ** 2;
  const n = Math.min(L.flecks.length, Math.round(R * 1.3));
  for (let i = 0; i < n; i++) {
    const fl = L.flecks[i], a = fl.a + th, px = Math.floor(cx + fl.rho * R * Math.cos(a)), py = Math.floor(cy + fl.rho * R * Math.sin(a));
    const gold = fl.gold && R >= 9;
    if (R < 8) { if (inner(px, py)) put(px, py, gold ? I.gold : I.ramp[0]); continue; }
    if (gold) { if (inner(px, py) && inner(px + 1, py + 1)) { put(px, py, I.gold); put(px + 1, py, I.gold); put(px, py + 1, I.gold); put(px + 1, py + 1, I.orange); } }
    else if (inner(px, py) && inner(px + 1, py)) { put(px, py, I.ramp[0]); put(px + 1, py, I.ramp[0]); }
  }
};

// snow: flakes that fall and drift left with the world, each on its own even step (10, 12, 15, 20 or 30 px/s), gone at the ground
BUILD.snow = (L) => {
  const s = L.spec, n = s.n || 40, sp = [10, 12, 15, 20, 30];
  L.floor = s.floor != null ? s.floor : PH;
  L.fl = Array.from({ length: n }, (_, i) => {
    const k = Math.floor(hash(31, i, 3) * sp.length);
    return { x: Math.floor(hash(31, i, 1) * (PW + 8)), y: Math.floor(hash(31, i, 2) * L.floor), v: sp[k], vx: sp[Math.max(0, k - 1)] / 2, big: k >= 3, ph: hash(31, i, 5) * TAU, rate: 0.8 + hash(31, i, 6) * 1.4 };
  });
  L.c = ix(s.color || 'white');
  if (!whole(L.floor)) ODD.push(`${L.id} floor ${L.floor}`);
};
DRAW.snow = (L, q, sx, sy) => {
  for (const f of L.fl) {
    const y = mod(f.y + Math.floor(f.v * q + 1e-6), L.floor), x = mod(f.x - Math.floor(f.vx * q + 1e-6) + Math.round(1.5 * Math.sin(f.ph + f.rate * q)), PW + 8) - 4;
    for (let j = 0; j < (f.big ? 2 : 1); j++) for (let i = 0; i < (f.big ? 2 : 1); i++) { const X = x + i + sx, Y = y + j + sy; if (X >= 0 && X < PW && Y >= 0 && Y < PH) FB[Y * PW + X] = L.c; }
  }
};

// feed: each stop tosses a coin over the runner into the snowball; the ball swells when it lands, with a sparkle
BUILD.feed = (L) => {
  const s = L.spec;
  L.sp = sprite(s.sprite, L.id); L.burst = s.burst ? sprite(s.burst, L.id) : null;
  L.ball = BYID[s.ball];
  if (!L.ball || L.ball.kind !== 'ball') ERR.push(`${L.id}: ball "${s.ball}" is not a ball layer`);
  L.shots = s.shots;
  for (const v of s.shots.flatMap((o) => [o.x0, o.y0, o.peak])) if (!whole(v)) ODD.push(`${L.id} shot ${v}`);
};
function feedAim(L, sh) {                                  // where the coin lands: the ball's upper right, at the size it has as the coin arrives
  const B = L.ball, R = Math.max(2, Math.round(B.r.at(sh.at + sh.dur - 0.02))), cx = B.heroX - B.gap - R, cy = B.ground - R;
  return [cx + Math.round(R * 0.62), cy - Math.round(R * 0.62)];
}
DRAW.feed = (L, q, sx, sy) => {
  if (!L.sp) return;
  for (const sh of L.shots) {
    const u = (q - sh.at) / sh.dur;
    if (u <= 0) continue;
    const [x1, y1] = feedAim(L, sh);
    if (u < 1) {
      const x = Math.round(sh.x0 + (x1 - sh.x0) * u), y = Math.round(sh.y0 + (y1 - sh.y0) * u - 4 * sh.peak * u * (1 - u));
      blit(pick(L.sp, q), x - (L.sp.w >> 1) + sx, y - (L.sp.h >> 1) + sy);
    } else if (L.burst) {
      const f = drawing(q - (sh.at + sh.dur), L.burst.fps || 20);
      if (f < L.burst.n) blit(L.burst.frames[f], x1 - (L.burst.w >> 1) + sx, y1 - (L.burst.h >> 1) + sy);
    }
  }
};
