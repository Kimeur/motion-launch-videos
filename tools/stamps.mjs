// What an example's stamp.json fingerprints, shared by tools/stamp.mjs (writes it) and tools/check.mjs (checks it).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const RENDERS = /\.(mp4|webm|mov)$/;              // the committed renders a stamp covers

export const fileHash = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');

// the film's source: src/film.html and every file under assets/ (images and audio the build embeds)
export function sourceHash(dir) {
  const h = crypto.createHash('sha256'), files = [path.join('src', 'film.html')];
  const walk = (rel) => {
    for (const e of fs.readdirSync(path.join(dir, rel), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const r = path.join(rel, e.name);
      if (e.isDirectory()) walk(r); else files.push(r);
    }
  };
  if (fs.existsSync(path.join(dir, 'assets'))) walk('assets');
  for (const f of files) h.update(f.split(path.sep).join('/') + '\0').update(fs.readFileSync(path.join(dir, f))).update('\0');
  return h.digest('hex');
}
