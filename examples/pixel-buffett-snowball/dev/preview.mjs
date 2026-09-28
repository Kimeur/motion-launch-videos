// Dev tool: draw sprite sheets to PNG (nearest neighbour) so the art can be judged before the film is built.
//   node preview.mjs <sheet> [scale]      sheets: runners | props | ...
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(HERE, 'art.js'), 'utf8');
const PALETTE = {
  bg: '#83B7E6', sky2: '#B4D6F3', haze: '#E1F0FB', far: '#A5C1E2', snow: '#EAF3FC', white: '#FFFFFF', shade: '#8EA7D0', ink: '#1B2140',
  earth: '#6A4B3C', wood: '#B97A45', skin: '#F0B48C', suit: '#2D4A85', red: '#D8434B', gold: '#FFC83D', orange: '#E8892B', pine: '#2F7D5B',
};
const ART = new Function(`${src}\nreturn { cv, KEY, RUNNERS, ERA, ...(typeof STOPART !== 'undefined' ? { STOPART } : {}), ...(typeof SCENERY !== 'undefined' ? { SCENERY } : {}) };`)();
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

function frames(sp) {                       // a sprite spec to a list of frames (arrays of rows)
  if (sp.sheet) { const cols = sp.sheet[0].split(' '); return cols.map((_, f) => sp.sheet.map((r) => r.split(' ')[f])); }
  if (sp.frames) return sp.frames;
  return [sp.art];
}
function render(items, opts = {}) {         // items: [{ name, spec }] laid out in a grid on a sky-coloured board
  const scale = opts.scale || 8, pad = 4, bg = hex(opts.bg || PALETTE.bg);
  const cells = [];
  for (const it of items) for (const [i, fr] of frames(it.spec).entries()) cells.push({ name: `${it.name}${i}`, fr, key: it.spec.key, first: i === 0 });
  const rowsOf = [];
  let cur = [], curW = 0;
  const maxW = opts.width || 200;
  for (const c of cells) {
    const w = c.fr[0].length + pad;
    if ((c.first && cur.length && curW + w > maxW) || (curW + w > maxW && cur.length)) { rowsOf.push(cur); cur = []; curW = 0; }
    cur.push(c); curW += w;
  }
  if (cur.length) rowsOf.push(cur);
  const rh = rowsOf.map((r) => Math.max(...r.map((c) => c.fr.length)) + pad);
  const W = Math.max(...rowsOf.map((r) => r.reduce((s, c) => s + c.fr[0].length + pad, pad))), Hh = rh.reduce((s, v) => s + v, pad);
  const buf = Buffer.alloc(W * Hh * 3);
  for (let i = 0; i < W * Hh; i++) buf.set(bg, i * 3);
  let y0 = pad;
  rowsOf.forEach((r, ri) => {
    let x0 = pad;
    for (const c of r) {
      const h = c.fr.length, w = c.fr[0].length, oy = y0 + rh[ri] - pad - h;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const ch = c.fr[y][x];
        if (ch === '.') continue;
        const role = c.key[ch]; if (!role) throw new Error(`no key for "${ch}" in ${c.name}`);
        buf.set(hex(PALETTE[role]), ((oy + y) * W + x0 + x) * 3);
      }
      x0 += w + pad;
    }
    y0 += rh[ri];
  });
  return { W, H: Hh, buf, scale };
}
function writePng(img, file) {
  const args = ['-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${img.W}x${img.H}`, '-i', 'pipe:0', '-vf', `scale=${img.W * img.scale}:${img.H * img.scale}:flags=neighbor`, file];
  const r = spawnSync('ffmpeg', args, { input: img.buf });
  if (r.status !== 0) throw new Error(String(r.stderr));
  console.log('wrote', file);
}
const which = process.argv[2] || 'runners', scale = Number(process.argv[3] || 8);
const OUT = process.env.OUT || HERE;
if (which === 'runners') {
  const items = Object.entries(ART.RUNNERS).map(([name, spec]) => ({ name, spec }));
  writePng(render(items, { scale, width: 6 * 22 }), path.join(OUT, 'runners.png'));
} else if (which === 'props') {
  const items = Object.entries(ART.STOPART).map(([name, spec]) => ({ name, spec }));
  writePng(render(items, { scale, width: 260 }), path.join(OUT, 'props.png'));
} else if (which === 'scenery') {
  const items = Object.entries(ART.SCENERY).map(([name, spec]) => ({ name, spec }));
  writePng(render(items, { scale, width: 260 }), path.join(OUT, 'scenery.png'));
}
