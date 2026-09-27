#!/usr/bin/env node
// Fetch the film's fonts as WOFF2 subsets from Fontsource, with their OFL texts.
//
//   node <skill>/scripts/fonts.mjs <filmDir> [--face <package>:<weight>[:<style>]]... [--subset latin]
//
// With no --face, it fetches every face <filmDir>/src/film.html embeds: each @font-face token
// __FONT:<package>-<subset>-<weight>-<style>.woff2__ names one (a film with no tokens needs none).
// Without a src/film.html yet, it fetches the kinetic-type defaults:
//   archivo-black:400   display
//   syne:800            label
//   ibm-plex-mono:500   mono
//
// Each face comes from `npm pack @fontsource/<package>@5` (the registry tarball, nothing is
// installed), and lands in <filmDir>/fonts/ as <package>-<subset>-<weight>-<style>.woff2, next to
// OFL-<package>.txt. The build step embeds the WOFF2 as base64; nothing loads at runtime.
// Needs Node >= 20, npm and tar on PATH, and network access to the npm registry.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { missingChars } from './cmap.mjs';

const args = process.argv.slice(2);
if (!args.length || args[0].startsWith('--')) {
  console.error('usage: node fonts.mjs <filmDir> [--face archivo-black:400] [--subset latin]');
  process.exit(2);
}
const filmDir = path.resolve(args[0]);
const faces = [];
let subset = null;
for (let i = 1; i < args.length; i++) {
  if (args[i] === '--face') faces.push(args[++i]);
  else if (args[i] === '--subset') subset = args[++i];
  else throw new Error(`unknown argument ${args[i]}`);
}
const SUBSETS = 'latin|latin-ext|cyrillic|cyrillic-ext|greek|greek-ext|vietnamese';
const src = path.join(filmDir, 'src', 'film.html');
if (!faces.length && fs.existsSync(src)) {               // the faces the film's source embeds
  const re = new RegExp(`__FONT:([a-z0-9-]+?)-(${SUBSETS})-(\\d+)-(normal|italic)\\.woff2__`, 'g');
  for (const m of fs.readFileSync(src, 'utf8').matchAll(re)) {
    const spec = `${m[1]}:${m[3]}:${m[4]}:${subset || m[2]}`;
    if (!faces.includes(spec)) faces.push(spec);
  }
  if (faces.length) console.log(`faces from ${path.relative(process.cwd(), src) || src}: ${faces.map((f) => f.split(':').slice(0, 2).join(':')).join(', ')}`);
  else { console.log(`no __FONT:...__ tokens in ${path.relative(process.cwd(), src) || src}: the film embeds no fonts, nothing to fetch`); process.exit(0); }
}
if (!faces.length) faces.push('archivo-black:400', 'syne:800', 'ibm-plex-mono:500');

const outDir = path.join(filmDir, 'fonts');
fs.mkdirSync(outDir, { recursive: true });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mlv-fonts-'));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const packed = new Map();                                 // one tarball per package, however many faces
function pack(pkg) {
  if (packed.has(pkg)) return packed.get(pkg);
  const dest = path.join(tmp, pkg);
  fs.mkdirSync(dest);
  const json = execFileSync(npm, ['pack', `@fontsource/${pkg}@5`, '--json', '--pack-destination', dest], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
  const info = JSON.parse(json)[0];
  execFileSync('tar', ['-xzf', path.join(dest, info.filename), '-C', dest]);
  packed.set(pkg, { dest, info });
  return packed.get(pkg);
}

try {
  for (const spec of faces) {
    const [pkg, weight = '400', style = 'normal', sub = subset || 'latin'] = spec.split(':');
    if (!/^[a-z0-9-]+$/.test(pkg)) throw new Error(`bad package name "${pkg}"`);
    const { dest, info } = pack(pkg);
    const file = `${pkg}-${sub}-${weight}-${style}.woff2`;
    const src = path.join(dest, 'package', 'files', file);
    if (!fs.existsSync(src)) {
      const have = fs.readdirSync(path.join(dest, 'package', 'files')).filter((f) => f.startsWith(`${pkg}-${sub}-`) && f.endsWith('.woff2'));
      throw new Error(`@fontsource/${pkg}@${info.version} has no ${file}. Available: ${have.join(', ') || 'none for this subset'}`);
    }
    fs.copyFileSync(src, path.join(outDir, file));
    const lic = ['LICENSE', 'LICENSE.md', 'OFL.txt'].map((f) => path.join(dest, 'package', f)).find((f) => fs.existsSync(f));
    if (!lic) throw new Error(`@fontsource/${pkg} ships no LICENSE file; check its licence before using it`);
    const text = fs.readFileSync(lic, 'utf8');
    if (!/SIL OPEN FONT LICENSE/i.test(text)) console.warn(`warning: ${pkg} is not under the SIL OFL; read ${lic} before shipping`);
    fs.writeFileSync(path.join(outDir, `OFL-${pkg}.txt`), text);
    const buf = fs.readFileSync(src);
    const md5 = crypto.createHash('md5').update(buf).digest('hex');
    const miss = missingChars(path.join(outDir, file), '€É×’–—·');
    console.log(`${file.padEnd(44)} ${String(buf.length).padStart(7)} B  md5 ${md5}  (@fontsource/${pkg}@${info.version})${miss.length ? `  lacks ${miss.join(' ')}` : ''}`);
  }
  console.log(`fonts in ${outDir}`);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
