#!/usr/bin/env node
// Fetch the film's fonts as Latin WOFF2 subsets from Fontsource, with their OFL texts.
//
//   node <skill>/scripts/fonts.mjs <filmDir> [--face <package>:<weight>[:<style>]]... [--subset latin]
//
// Defaults to the skill's three OFL faces:
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
let subset = 'latin';
for (let i = 1; i < args.length; i++) {
  if (args[i] === '--face') faces.push(args[++i]);
  else if (args[i] === '--subset') subset = args[++i];
  else throw new Error(`unknown argument ${args[i]}`);
}
if (!faces.length) faces.push('archivo-black:400', 'syne:800', 'ibm-plex-mono:500');

const outDir = path.join(filmDir, 'fonts');
fs.mkdirSync(outDir, { recursive: true });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mlv-fonts-'));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

try {
  for (const spec of faces) {
    const [pkg, weight = '400', style = 'normal'] = spec.split(':');
    if (!/^[a-z0-9-]+$/.test(pkg)) throw new Error(`bad package name "${pkg}"`);
    const dest = path.join(tmp, pkg);
    fs.mkdirSync(dest);
    const json = execFileSync(npm, ['pack', `@fontsource/${pkg}@5`, '--json', '--pack-destination', dest], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
    const info = JSON.parse(json)[0];
    execFileSync('tar', ['-xzf', path.join(dest, info.filename), '-C', dest]);
    const file = `${pkg}-${subset}-${weight}-${style}.woff2`;
    const src = path.join(dest, 'package', 'files', file);
    if (!fs.existsSync(src)) {
      const have = fs.readdirSync(path.join(dest, 'package', 'files')).filter((f) => f.startsWith(`${pkg}-${subset}-`) && f.endsWith('.woff2'));
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
