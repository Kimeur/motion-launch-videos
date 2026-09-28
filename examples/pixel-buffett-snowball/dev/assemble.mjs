// Dev tool: builds ../src/film.html from the motion-pixel template, this film's art and config, and the ball kind.
//   node assemble.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const tpl = fs.readFileSync(path.join(ROOT, 'plugins/motion-launch-videos/skills/motion-pixel/templates/film.html'), 'utf8');
const art = fs.readFileSync(path.join(HERE, 'art.js'), 'utf8'), cfg = fs.readFileSync(path.join(HERE, 'config.js'), 'utf8'), kinds = fs.readFileSync(path.join(HERE, 'kinds.js'), 'utf8');
const a = tpl.indexOf('const BPM = 120;'), b = tpl.indexOf('/* ===== CORE BEGIN');
if (a < 0 || b < 0) throw new Error('template markers not found');
let out = tpl.slice(0, a) + art + '\n' + cfg + '\n' + tpl.slice(b);
// the film's own drawing kind, before the shake and the frame
const mark = '/* ---------------- shake and the frame ---------------- */';
if (!out.includes(mark)) throw new Error('engine marker not found');
out = out.replace(mark, kinds + '\n' + mark);
// a check row for it, and the ball's radii in the layout table
out = out.replace("  for (const e of ERR) add('reference', 'FAIL', e);", "  for (const e of ERR) add('reference', 'FAIL', e);\n  for (const L of LAYERS) if (L.kind === 'ball') { const top = L.ground - 2 * Math.max(...L.steps.map((p) => p[1])); add(`ball: ${L.id}`, top >= 44 ? 'PASS' : 'WARN', `radii ${L.steps.map((p) => p[1]).join(', ')}; the biggest tops out at row ${top} (the captions end at row 43)`); }");
out = out.replace("  for (const e of SHAKES) push(F(e.at + 2 / FPS), 'shake', 'the screen shakes');", "  for (const e of SHAKES) push(F(e.at + 2 / FPS), 'shake', 'the screen shakes');\n  for (const L of LAYERS) if (L.kind === 'feed') for (const sh of L.shots.slice(0, 2).concat(L.shots.slice(-1))) { push(F(sh.at + sh.dur / 2), `${L.id}-flight`, 'a coin in flight'); push(F(sh.at + sh.dur + 0.1), `${L.id}-lands`, 'the coin lands, the ball swells'); }");
out = out.replace('<title>Acme Quest pixel loop</title>', '<title>Warren Buffett, from $0 to billions: a pixel history</title>').replace('background:#52A8F0', 'background:#83B7E6');
fs.writeFileSync(path.join(HERE, '../src/film.html'), out);
console.log('wrote src/film.html', out.length, 'bytes');
