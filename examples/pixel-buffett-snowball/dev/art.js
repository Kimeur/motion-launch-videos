/* ART: every sprite in the film is drawn here, in code, from rectangles, discs and lines.
 * cv(w, h) is a tiny raster: one character per pixel, '.' is transparent. out(c) wraps the
 * drawing in a 1 px ink outline. rows() hands the ASCII art to the engine. */
const cv = (w, h) => {
  const g = Array.from({ length: h }, () => Array(w).fill('.'));
  const A = {
    w, h, g,
    px(x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < w && y < h) g[y][x] = c; return A; },
    get(x, y) { return x >= 0 && y >= 0 && x < w && y < h ? g[y][x] : '.'; },
    rect(x, y, ww, hh, c) { for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) A.px(x + i, y + j, c); return A; },
    box(x, y, ww, hh, c) { A.rect(x, y, ww, 1, c); A.rect(x, y + hh - 1, ww, 1, c); A.rect(x, y, 1, hh, c); A.rect(x + ww - 1, y, 1, hh, c); return A; },
    disc(cx, cy, r, c) { for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) A.px(x, y, c); return A; },
    ring(cx, cy, r, c, t = 1) { for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) { const d = (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2; if (d <= r * r && d > (r - t) ** 2) A.px(x, y, c); } return A; },
    line(x0, y0, x1, y1, c) { x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy; for (;;) { A.px(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } return A; },
    thick(x0, y0, x1, y1, c) { A.line(x0, y0, x1, y1, c); A.line(x0 + 1, y0, x1 + 1, y1, c); return A; },
    tri(cx, top, base, halfBase, c) { for (let y = top; y <= base; y++) { const hw = Math.round((y - top + 0.5) * halfBase / (base - top + 1)); A.rect(cx - hw, y, 2 * hw + 1, 1, c); } return A; },
    text(s, x, y, c, k = 1) { let p = x; for (const ch of s) { const r = D35[ch]; if (!r) continue; r.forEach((row, j) => [...row].forEach((v, i) => { if (v === '#') A.rect(p + i * k, y + j * k, k, k, c); })); p += (r[0].length + 1) * k; } return A; },
    over(o, x, y) { for (let j = 0; j < o.h; j++) for (let i = 0; i < o.w; i++) { const v = o.g[j][i]; if (v !== '.') A.px(x + i, y + j, v); } return A; },
    out(c = 'k') {                                // a 1 px outline round everything drawn, on a canvas 2 px bigger
      const B = cv(w + 2, h + 2);
      for (let y = 0; y < h + 2; y++) for (let x = 0; x < w + 2; x++) {
        const v = A.get(x - 1, y - 1);
        if (v !== '.') B.g[y][x] = v;
        else if (A.get(x - 2, y - 1) !== '.' || A.get(x, y - 1) !== '.' || A.get(x - 1, y - 2) !== '.' || A.get(x - 1, y) !== '.') B.g[y][x] = c;
      }
      return B;
    },
    flipX() { const B = cv(w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) B.g[y][x] = g[y][w - 1 - x]; return B; },
    rows() { return g.map((r) => r.join('')); },
  };
  return A;
};
// 3 x 5 figures for numbers written on props
const D35 = {
  0: ['###', '#.#', '#.#', '#.#', '###'], 1: ['.#.', '##.', '.#.', '.#.', '###'], 2: ['###', '..#', '###', '#..', '###'], 3: ['###', '..#', '###', '..#', '###'],
  4: ['#.#', '#.#', '###', '..#', '..#'], 5: ['###', '#..', '###', '..#', '###'], 6: ['###', '#..', '###', '#.#', '###'], 7: ['###', '..#', '.#.', '.#.', '.#.'],
  8: ['###', '#.#', '###', '#.#', '###'], 9: ['###', '#.#', '###', '..#', '###'], M: ['#.#', '###', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'],
  '#': ['#.#', '###', '#.#', '###', '#.#'],
};
const DOLLAR = ['..#..', '.####', '#.#..', '.###.', '..#.#', '####.', '..#..'];   // 5 x 7, for the big coin
const stamp = (c, rows, x, y, col, k = 1) => { rows.forEach((row, j) => [...row].forEach((v, i) => { if (v === '#') c.rect(x + i * k, y + j * k, k, k, col); })); return c; };

/* the letters the art uses, and the palette role each one is */
const KEY = { k: 'ink', w: 'white', n: 'snow', d: 'shade', f: 'far', h: 'haze', c: 'sky2', b: 'bg', e: 'earth', o: 'wood', s: 'skin', u: 'suit', r: 'red', g: 'gold', y: 'orange', p: 'pine' };

/* ---------------- the runner: one figure, five ages ---------------- */
// 16 x 24, facing right. Six drawings: contact, down, pass, then the other leg. head 10 rows + torso T + legs L.
const ERA = {
  kid:    { T: 4, L: 6, hair: 'e', shirt: 'r', pants: 'u', cap: false, glasses: false, tie: false, bag: false, white: false, jacket: false },
  paper:  { T: 6, L: 7, hair: 'e', shirt: 'o', pants: 'u', cap: true, glasses: false, tie: false, bag: true, white: false, jacket: false },
  young:  { T: 7, L: 7, hair: 'e', shirt: 'n', pants: 'u', cap: false, glasses: true, tie: true, bag: false, white: false, jacket: false },
  man:    { T: 7, L: 7, hair: 'e', shirt: 'u', pants: 'u', cap: false, glasses: true, tie: true, bag: false, white: false, jacket: true },
  elder:  { T: 7, L: 7, hair: 'w', shirt: 'u', pants: 'u', cap: false, glasses: true, tie: true, bag: false, white: true, jacket: true },
};
// leg A per drawing: foot forward of the hip (px) and how high the foot is lifted; leg B runs three drawings behind
const LEG = [[3, 0], [1, 0], [-1, 0], [-3, 2], [-2, 4], [1, 3]];
const BOB = [0, 1, 0, 0, 1, 0];
function runner(era, f) {
  const E = ERA[era], H = 10 + E.T + E.L, c = cv(16, 24), top = 24 - H, oy = top + BOB[f];
  const hipY = oy + 10 + E.T, sole = top + H - 1;
  const leg = (i, col, x) => {
    const [dx, lift] = LEG[i], fx = 8 + dx, fy = sole - lift;
    c.thick(x - 1, hipY, fx - 1, fy - 1, col);
    c.rect(fx - 1, fy, 3, 1, 'k');
  };
  const arm = (i, col, near) => {                                // the arm swings against the leg on its side
    const [dx, lift] = LEG[(i + 3) % 6], sx = 8, sy = oy + 11;
    const hx = 8 + Math.round(dx * 1.1), hy = sy + 4 - Math.min(2, lift >> 1);
    c.thick(sx - (near ? 0 : 1), sy, hx - (near ? 0 : 1), hy, col);
    c.px(hx + (near ? 1 : 0), hy, 's');
  };
  leg((f + 3) % 6, E.pants, 8); if (E.bag) bag(c, oy);
  arm((f + 3) % 6, E.shirt, false);
  const tw = 7, tx = 5;
  c.rect(tx, oy + 10, tw, E.T, E.shirt);
  if (E.jacket) c.rect(tx, oy + 10, 1, E.T, 'k');
  if (E.shirt === 'n' || E.jacket) c.rect(7, oy + 10, 3, 1, 'w');
  if (E.tie) { c.rect(8, oy + 11, 1, E.T - 2, 'r'); c.px(8, oy + 10, 'r'); }
  leg(f, E.pants, 8);
  arm(f, E.shirt, true);
  head(c, E, oy);
  return c;
}
function bag(c, oy) {                                            // the paper boy's canvas bag, papers sticking out
  c.rect(2, oy + 11, 5, 7, 'o'); c.rect(2, oy + 11, 5, 1, 'y'); c.rect(3, oy + 9, 3, 2, 'n'); c.px(4, oy + 10, 'd'); c.px(4, oy + 14, 'y');
}
const HEAD = [        // 9 wide, facing right: H hair, s skin
  '.HHHHHH..',
  'HHHHHHHH.',
  'HHHHHHHH.',
  'HHssssss.',
  'Hsssssss.',
  'Hsssssss.',
  '.ssssssss',
  '.sssssss.',
  '..sssss..',
  '...sss...',
];
function head(c, E, oy) {
  const x0 = 4;
  HEAD.forEach((row, j) => [...row].forEach((v, i) => { if (v === '.') return; c.px(x0 + i, oy + j, v === 'H' ? E.hair : 's'); }));
  if (E.white) { c.px(x0 + 3, oy + 1, 'd'); c.px(x0 + 6, oy + 2, 'd'); }
  if (E.cap) { c.rect(x0, oy, 9, 3, 'r'); c.rect(x0 + 5, oy + 3, 5, 1, 'r'); c.px(x0 + 9, oy + 3, 'r'); c.rect(x0, oy + 3, 2, 1, 'r'); }
  if (E.glasses) {                                               // two round lenses joined by a bridge
    for (const lx of [x0 + 2, x0 + 6]) { c.box(lx, oy + 3, 3, 3, 'k'); c.px(lx + 1, oy + 4, 'w'); }
    c.px(x0 + 5, oy + 4, 'k');
  } else { c.px(x0 + 4, oy + 4, 'k'); c.px(x0 + 4, oy + 5, 'k'); c.px(x0 + 7, oy + 4, 'k'); c.px(x0 + 7, oy + 5, 'k'); }
  c.px(x0 + 5, oy + 8, 'e'); c.px(x0 + 6, oy + 8, 'e');         // a small smile
}
const RUNNERS = {};
for (const era of Object.keys(ERA)) {
  const frames = [0, 1, 2, 3, 4, 5].map((f) => runner(era, f).out('k').rows());
  RUNNERS[era] = { fps: 12, key: KEY, sheet: frames[0].map((_, y) => frames.map((fr) => fr[y]).join(' ')) };
}

/* ---------------- the stops along the way: one prop per milestone ---------------- */
function house() {                                               // Omaha, 1930: a snowy cottage with a lit window
  const c = cv(44, 36);
  c.rect(31, 3, 5, 10, 'r'); c.rect(30, 1, 7, 3, 'w'); c.rect(31, 7, 5, 1, 'e');
  c.rect(4, 15, 36, 21, 'o');
  for (let y = 18; y < 36; y += 3) c.rect(4, y, 36, 1, 'y');
  c.tri(22, 1, 15, 21, 'r'); c.tri(22, 1, 9, 13, 'w');
  c.rect(1, 15, 42, 1, 'e');
  c.rect(19, 23, 7, 13, 'e'); c.px(24, 30, 'g'); c.rect(19, 23, 7, 1, 'k');
  for (const x of [8, 30]) { c.rect(x, 20, 7, 7, 'k'); c.rect(x + 1, 21, 5, 5, 'g'); c.rect(x + 3, 21, 1, 5, 'k'); c.rect(x + 1, 23, 5, 1, 'k'); c.rect(x - 1, 27, 9, 1, 'w'); }
  return c.out('k');
}
function stockBoard() {                                          // 1942: a board with a chart that climbs
  const c = cv(34, 40);
  c.rect(8, 24, 2, 14, 'e'); c.rect(24, 24, 2, 14, 'e'); c.rect(6, 34, 22, 2, 'e');
  c.rect(2, 2, 30, 22, 'n'); c.rect(2, 2, 30, 5, 'u');
  for (const y of [11, 16, 21]) c.rect(4, y, 26, 1, 'd');
  c.line(5, 20, 10, 14, 'r'); c.line(10, 14, 14, 17, 'r'); c.line(14, 17, 20, 9, 'r'); c.line(20, 9, 24, 12, 'r'); c.line(24, 12, 29, 6, 'r');
  c.px(28, 6, 'r'); c.px(29, 8, 'r');
  c.px(5, 4, 'w'); c.px(7, 4, 'w'); c.px(9, 4, 'w');
  c.disc(27, 4.5, 2, 'g');
  return c.out('k');
}
function bike() {                                                // 1944: the paper route
  const c = cv(38, 27);
  for (const cx of [7, 31]) { c.ring(cx, 19, 6, 'k', 1); c.px(cx - 1, 18, 'd'); c.px(cx, 18, 'd'); c.px(cx - 1, 19, 'd'); c.px(cx, 19, 'g'); c.line(cx - 4, 19, cx + 4, 19, 'd'); c.line(cx, 15, cx, 23, 'd'); c.px(cx, 19, 'g'); c.px(cx - 1, 18, 'g'); }
  const rear = [7, 19], bb = [18, 19], seat = [13, 9], head = [27, 9], front = [31, 19];
  const L = (a, b) => { c.line(a[0], a[1], b[0], b[1], 'r'); c.line(a[0] + 1, a[1], b[0] + 1, b[1], 'r'); };
  L(rear, bb); L(bb, seat); L(seat, head); L(bb, head); L(head, front);
  c.rect(10, 7, 6, 2, 'k'); c.rect(26, 5, 5, 1, 'k'); c.px(26, 6, 'k');
  c.rect(28, 10, 8, 5, 'o'); c.rect(28, 10, 8, 1, 'y');
  c.rect(29, 6, 6, 4, 'n'); c.rect(29, 8, 6, 1, 'd'); c.px(31, 7, 'd'); c.px(33, 7, 'd');
  return c.out('k');
}
function book() {                                                // 1950: a book, and an idea
  const c = cv(30, 46);
  c.disc(15, 5, 4.5, 'g'); c.rect(13, 9, 5, 2, 'y'); c.rect(13, 11, 5, 1, 'd');
  for (const [x0, y0, x1, y1] of [[1, 5, 4, 5], [26, 5, 29, 5], [4, 0, 6, 2], [25, 0, 23, 2]]) c.line(x0, y0, x1, y1, 'g');
  c.rect(5, 14, 20, 30, 'u'); c.rect(5, 14, 3, 30, 'k'); c.rect(25, 15, 2, 28, 'n'); c.rect(6, 43, 21, 1, 'n');
  c.box(10, 17, 13, 24, 'g'); c.rect(12, 21, 9, 2, 'g'); c.rect(14, 25, 5, 2, 'g'); c.disc(16.5, 33, 3, 'g'); c.px(16, 32, 'y');
  c.rect(21, 42, 2, 4, 'r');
  return c.out('k');
}
function partners() {                                            // 1956: seven partners
  const c = cv(58, 28), shirts = ['r', 'o', 'u', 'n', 'y', 'd', 'r'];
  for (let i = 0; i < 7; i++) {
    const x = 1 + i * 8, hairs = ['e', 'e', 'w', 'e', 'k', 'e', 'w'];
    c.disc(x + 3, 3, 1.6, 'g'); c.px(x + 3, 3, 'y');
    c.rect(x + 1, 8, 4, 4, 's'); c.rect(x + 1, 7, 4, 2, hairs[i]);
    c.px(x + 2, 10, 'k'); c.px(x + 4, 10, 'k');
    c.rect(x, 12, 6, 7, shirts[i]); c.rect(x, 12, 1, 5, 's'); c.rect(x + 5, 12, 1, 5, 's');
    c.rect(x + 1, 19, 2, 6, 'u'); c.rect(x + 3, 19, 2, 6, 'u'); c.rect(x + 1, 25, 2, 1, 'k'); c.rect(x + 3, 25, 2, 1, 'k');
  }
  return c.out('k');
}
function vault() {                                               // 1962: the first million
  const c = cv(44, 50);
  c.rect(8, 0, 28, 10, 'g'); c.rect(8, 8, 28, 2, 'y'); c.text('1M', 18, 3, 'k', 1);
  c.rect(4, 12, 36, 36, 'd'); c.rect(4, 12, 36, 2, 'f');
  c.disc(22, 30, 15, 'k'); c.disc(22, 30, 13.5, 'f'); c.ring(22, 30, 8.5, 'g', 2);
  for (const [dx, dy] of [[0, -8], [0, 8], [-8, 0], [8, 0], [6, 6], [-6, -6], [6, -6], [-6, 6]]) c.px(22 + dx - (dx < 0 ? 0 : 0), 30 + dy, 'g');
  c.line(22, 22, 22, 38, 'g'); c.line(14, 30, 30, 30, 'g'); c.disc(22, 30, 2.2, 'y');
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; c.px(22 + Math.round(11.2 * Math.cos(a)), 30 + Math.round(11.2 * Math.sin(a)), 'w'); }
  c.rect(0, 44, 8, 2, 'g'); c.rect(0, 46, 8, 2, 'y'); c.rect(1, 42, 6, 2, 'g'); c.rect(36, 44, 8, 2, 'g'); c.rect(36, 46, 8, 2, 'y'); c.rect(37, 42, 6, 2, 'g');
  return c.out('k');
}
function mill() {                                                // 1965: a struggling textile mill
  const c = cv(62, 60);
  c.rect(50, 14, 8, 46, 'r'); c.rect(49, 18, 10, 2, 'e'); c.rect(49, 26, 10, 2, 'e'); c.rect(49, 11, 10, 4, 'w');
  c.disc(55, 7, 2.6, 'n'); c.disc(58, 3.5, 2.1, 'n'); c.disc(54, 3, 1.5, 'd');
  c.rect(2, 32, 46, 28, 'r');
  for (let y = 35, j = 0; y < 60; y += 3, j++) { c.rect(2, y, 46, 1, 'e'); for (let x = 2 + (j % 2) * 3; x < 48; x += 6) c.px(x, y - 1, 'e'); }
  for (let i = 0; i < 3; i++) {                                  // the sawtooth roof
    const x0 = 2 + i * 15;
    for (let y = 21; y < 32; y++) { const w = Math.round((y - 21 + 1) * 15 / 11); c.rect(x0, y, w, 1, 'e'); }
    for (let y = 21; y < 25; y++) { const w = Math.round((y - 21 + 1) * 15 / 11); c.rect(x0 + Math.max(0, w - 5), y, Math.min(5, w), 1, 'w'); }
    c.rect(x0, 21, 2, 11, 'k');
  }
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const x = 7 + i * 13 + (i > 1 ? 0 : 0), y = 38 + j * 9; c.rect(x, y, 6, 6, 'k'); c.rect(x + 1, y + 1, 4, 4, (i + j) % 3 === 0 ? 'g' : 'h'); c.rect(x + 3, y + 1, 1, 4, 'k'); }
  c.rect(21, 50, 7, 10, 'e'); c.px(26, 55, 'g');
  return c.out('k');
}
function tower() {                                               // 1985: a gold skyline
  const c = cv(50, 66);
  c.rect(23, 0, 2, 5, 'k'); c.px(23, 0, 'r'); c.px(24, 0, 'r');
  c.rect(2, 32, 12, 34, 'g'); c.rect(34, 24, 13, 42, 'g'); c.rect(14, 10, 20, 56, 'g'); c.rect(18, 5, 12, 6, 'g');
  c.rect(28, 10, 6, 56, 'y'); c.rect(9, 32, 5, 34, 'y'); c.rect(42, 24, 5, 42, 'y');
  for (let y = 15; y < 56; y += 5) for (const x of [17, 22]) c.rect(x, y, 3, 3, (y + x) % 3 === 0 ? 'w' : 'y');
  for (let y = 36; y < 60; y += 5) c.rect(5, y, 3, 3, 'y');
  for (let y = 28; y < 60; y += 5) for (const x of [37, 42]) if (x < 45) c.rect(x, y, 3, 3, 'y');
  c.rect(15, 54, 18, 10, 'u'); c.text('1B', 20, 57, 'g', 1);
  return c.out('k');
}
function trophy() {                                              // 2008: number one
  const c = cv(36, 46);
  c.rect(10, 0, 14, 9, 'g'); c.rect(11, 9, 12, 2, 'g'); c.rect(13, 11, 8, 1, 'g'); c.rect(10, 7, 14, 2, 'y');
  c.ring(8.5, 4.5, 3.5, 'g', 1.6); c.ring(25.5, 4.5, 3.5, 'g', 1.6);
  c.px(13, 2, 'w'); c.px(13, 3, 'w'); c.px(14, 2, 'w');
  c.rect(15, 12, 4, 5, 'g'); c.rect(11, 17, 12, 3, 'y'); c.rect(11, 17, 12, 1, 'g');
  c.rect(3, 20, 28, 25, 'd'); c.rect(3, 20, 28, 2, 'f'); c.rect(3, 43, 28, 2, 'shade' in KEY ? 'd' : 'd');
  stamp(c, D35['1'], 14, 26, 'k', 2); stamp(c, D35['1'], 14, 26, 'k', 2);
  c.rect(4, 22, 1, 20, 'f');
  return c.out('k');
}
function bigCoin() {                                             // 2026: a coin as tall as the hero
  const c = cv(34, 36);
  c.rect(13, 30, 8, 4, 'e');
  c.disc(17, 16, 15.5, 'y'); c.disc(17, 16, 14, 'g'); c.ring(17, 16, 11, 'y', 1);
  stamp(c, DOLLAR, 12, 11, 'y', 2);
  c.px(7, 7, 'w'); c.px(8, 6, 'w'); c.px(9, 5, 'w'); c.px(7, 8, 'w'); c.px(6, 9, 'w');
  return c.out('k');
}
const STOPART = { house: house(), stockBoard: stockBoard(), bike: bike(), book: book(), partners: partners(), vault: vault(), mill: mill(), tower: tower(), trophy: trophy(), bigCoin: bigCoin() };
for (const k of Object.keys(STOPART)) STOPART[k] = { key: KEY, art: STOPART[k].rows() };

/* ---------------- a poof of snow and sparkle where the runner grows up ---------------- */
const POOF = { key: KEY, fps: 12, frames: (() => {
  const f = [];
  let c = cv(22, 30);
  for (const [x, y, r] of [[11, 15, 3.4], [7, 19, 2.6], [15, 19, 2.6], [11, 9, 2.6], [6, 12, 2], [16, 12, 2]]) c.disc(x, y, r, 'w');
  for (const [x, y] of [[9, 18], [13, 20], [5, 20]]) c.px(x, y, 'h');
  f.push(c.rows());
  c = cv(22, 30);
  for (const [x, y, r] of [[11, 15, 5.2], [5, 20, 3.6], [17, 20, 3.6], [11, 6, 3.4], [4, 10, 2.8], [18, 10, 2.8]]) c.disc(x, y, r, 'w');
  for (const [x, y] of [[9, 18], [13, 21], [4, 22], [16, 22], [8, 12], [14, 9]]) c.px(x, y, 'h');
  for (const [x, y] of [[2, 4], [19, 5], [1, 17], [20, 16]]) { c.px(x, y, 'g'); c.px(x - 1, y, 'g'); c.px(x + 1, y, 'g'); c.px(x, y - 1, 'g'); c.px(x, y + 1, 'g'); }
  f.push(c.rows());
  c = cv(22, 30);
  for (const [x, y, r] of [[3, 7, 1.8], [18, 6, 1.8], [2, 19, 1.8], [19, 20, 1.8], [11, 2, 1.6], [11, 27, 1.6]]) c.disc(x, y, r, 'w');
  for (const [x, y] of [[6, 3], [16, 3], [1, 12], [20, 12], [5, 26], [17, 26]]) { c.px(x, y, 'g'); c.px(x, y - 1, 'g'); c.px(x, y + 1, 'g'); }
  f.push(c.rows());
  return f;
})() };

/* ---------------- a small coin that spins: face, three-quarter, edge, three-quarter ---------------- */
const COIN = { key: KEY, fps: 8, frames: [8, 6, 2, 6].map((w) => {
  const c = cv(8, 8);
  for (let y = 0; y < 8; y++) for (let x = 0; x < w; x++) {
    const dx = (x + 0.5 - w / 2) / (w / 2), dy = (y + 0.5 - 4) / 4, d = dx * dx + dy * dy;
    if (d <= 1) c.px(4 - w / 2 + x, y, d > 0.62 ? 'k' : 'g');
  }
  if (w >= 6) { c.px(3, 2, 'w'); c.px(4 - w / 2 + w - 3, 5, 'y'); }
  return c.rows();
}) };

/* ---------------- the world: snow, hills, trees, a sun ---------------- */
const SCENERY = {
  snowA: { key: KEY, art: ['........', '..w..w..', '.wwwwwww', 'wwwwwwww', 'wwnwwwnw', 'nnnnnnnn', 'ndnnnndn', 'dddddddd'] },
  snowB: { key: KEY, art: ['........', '....w...', 'w..wwww.', 'wwwwwwww', 'wnwwwwwn', 'nnnnnnnn', 'nnndnnnd', 'dddddddd'] },
  earthA: { key: KEY, art: ['eeeeeeee', 'eekeeeee', 'eeeeeeee', 'eeeeekee', 'eeeeeeee', 'keeeeeee', 'eeeeeekk', 'eeeeeeee'] },
  earthB: { key: KEY, art: ['eeeeeeee', 'eeeeeeke', 'ekeeeeee', 'eeeeeeee', 'eeekeeee', 'eeeeeeee', 'eeeekeee', 'eeeeeeee'] },
  deep: { key: KEY, art: ['eeeeeeee', 'ekeeekee', 'eeeeeeee', 'eeekeeee', 'eeeeeeee', 'eekeeeke', 'eeeeeeee', 'eeeeeeee'] },
  sun: { key: KEY, art: (() => { const c = cv(24, 24); c.disc(12, 12, 11.2, 'y'); c.disc(11, 11, 9.6, 'g'); c.px(6, 5, 'w'); c.px(7, 4, 'w'); c.px(5, 6, 'w'); return c.rows(); })() },
  pine: { key: KEY, art: (() => {
    const c = cv(18, 30);
    c.rect(8, 26, 3, 4, 'e');
    c.tri(9, 1, 11, 5, 'p'); c.tri(9, 7, 18, 7, 'p'); c.tri(9, 14, 25, 9, 'p');
    c.tri(9, 1, 4, 2, 'w'); c.rect(4, 11, 3, 1, 'w'); c.rect(12, 11, 2, 1, 'w'); c.tri(9, 7, 11, 3, 'w'); c.rect(2, 18, 3, 1, 'w'); c.rect(13, 18, 3, 1, 'w'); c.tri(9, 14, 18, 3, 'w'); c.rect(1, 25, 4, 1, 'w'); c.rect(14, 25, 3, 1, 'w');
    return c.out('k').rows();
  })() },
  pineSmall: { key: KEY, art: (() => {
    const c = cv(12, 20);
    c.rect(5, 17, 2, 3, 'e');
    c.tri(6, 1, 8, 3, 'p'); c.tri(6, 5, 12, 5, 'p'); c.tri(6, 9, 16, 6, 'p');
    c.tri(6, 1, 3, 1, 'w'); c.tri(6, 5, 7, 2, 'w'); c.tri(6, 9, 11, 2, 'w'); c.rect(1, 16, 3, 1, 'w'); c.rect(9, 16, 2, 1, 'w');
    return c.out('k').rows();
  })() },
  snowman: { key: KEY, art: (() => {
    const c = cv(16, 26);
    c.line(2, 12, 5, 14, 'e'); c.line(13, 11, 10, 14, 'e'); c.line(2, 12, 1, 10, 'e'); c.line(13, 11, 14, 9, 'e');
    c.disc(8, 20, 5.2, 'w'); c.disc(8, 12.5, 4, 'w'); c.disc(8, 6, 3.4, 'w');
    for (const [x, y] of [[10, 20], [11, 21], [10, 22], [11, 19], [10, 13], [11, 12], [10, 12]]) c.px(x, y, 'n');
    c.px(7, 5, 'k'); c.px(10, 5, 'k'); c.px(11, 6, 'y'); c.px(12, 6, 'y'); c.px(7, 8, 'k'); c.px(8, 9, 'k'); c.px(9, 8, 'k');
    c.px(8, 12, 'k'); c.px(8, 15, 'k'); c.px(8, 18, 'k');
    c.rect(4, 2, 8, 1, 'k'); c.rect(5, -1 + 1, 6, 1, 'k'); c.rect(5, 0, 6, 2, 'k'); c.rect(5, 1, 6, 1, 'r');
    return c.out('k').rows();
  })() },
  cloudBig: { key: { w: 'white', h: 'haze' }, art: [
    '.............wwww.................', '...........wwwwwwww...............', '..........wwwwwwwwwwwwwwww........', '..........wwwwwwwwwwwwwwwww.......',
    '......wwwwwwwwwwwwwwwwwwwwww......', '.....wwwwwwwwwwwwwwwwwwwwwwwwww...', '....wwwwwwwwwwwwwwwwwwwwwwwwwwww..', '....wwwwwwwwwwwwwwwwwwwwwwwwwwwww.',
    '...hwwwwwwwwwwwwwwwwwwwwwwwwwwwww.', '....hwwwwwwhhwwwwwwwwwhhhhwwwwwwh.', '....hhwwwwhhhhwwwwwwwwhhhhhwwwwhh.', '.....hhhhhh..hhhhhhhhh....hhhhhh..', '......hhhh....hhhhhhhh.....hhhh...'] },
  cloudMid: { key: { w: 'white', h: 'haze' }, art: [
    '.........wwww...........', '........wwwwww..........', '.......wwwwwwwwwwww.....', '....wwwwwwwwwwwwwwww....', '...wwwwwwwwwwwwwwwwww...', '...wwwwwwwwwwwwwwwwww...',
    '..hwwwwwwwwwwwwwwwwwh...', '...hwwwwhwwwwwwwwwwhh...', '...hhhhhhhhhhhhhhhhh....', '....hhhh.hhhhhhhhhh.....'] },
  cloudSmall: { key: { w: 'white', h: 'haze' }, art: [
    '......wwww....', '...wwwwwwww...', '..wwwwwwwwwww.', '.wwwwwwwwwwww.', '.hwwwwwwwwwww.', '..hhhhhhhhhhh.'] },
};
