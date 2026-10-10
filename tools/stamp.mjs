#!/usr/bin/env node
// Stamp an example as verified: its committed renders match its current source. Maintainers only.
//
//   node tools/stamp.mjs <example> [<example>...]    e.g. node tools/stamp.mjs globe-acme-relay
//   node tools/stamp.mjs --all
//
// For each example it copies the folder to a scratch directory, fetches the fonts, builds, and runs
// `render.mjs verify` on the committed MP4 (with the committed preview GIF, poster and alpha files in
// place). Only when verify passes does it write examples/<example>/stamp.json: the sha256 of
// src/film.html (and of every file under assets/) and of each committed render. `node tools/check.mjs`
// fails when the source or a render no longer matches its stamp, so a source edited without a re-render
// (or a render swapped without a verify) cannot reach main unnoticed.
//
// Needs what render.mjs verify needs (playwright-core, a Chromium, ffmpeg, ffprobe) and the network for
// the fonts. Exit code 1 when any example fails.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { RENDERS, sourceHash, fileHash } from './stamps.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EX = path.join(ROOT, 'examples');
const args = process.argv.slice(2);
const names = args.includes('--all')
  ? fs.readdirSync(EX).filter((e) => fs.existsSync(path.join(EX, e, 'src', 'film.html'))).sort()
  : args.filter((a) => !a.startsWith('--'));
if (!names.length) { console.error('usage: node tools/stamp.mjs <example>... | --all'); process.exit(2); }

let fails = 0;
for (const name of names) {
  const dir = path.join(EX, name);
  if (!fs.existsSync(path.join(dir, 'src', 'film.html'))) { console.log(`FAIL  ${name}: no src/film.html`); fails++; continue; }
  const renders = fs.readdirSync(dir).filter((f) => RENDERS.test(f)).sort();
  const mp4 = `${name}.mp4`;
  if (!renders.includes(mp4)) { console.log(`FAIL  ${name}: no ${mp4} to verify`); fails++; continue; }

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mlv-stamp-')), film = path.join(tmp, name);
  try {
    fs.cpSync(dir, film, { recursive: true, filter: (f) => !/[/\\](renders|stills|fonts)$/.test(f) });
    // the committed previews and alpha files where verify looks for them (renders/)
    fs.mkdirSync(path.join(film, 'renders'));
    for (const f of fs.readdirSync(dir)) {
      if (/^preview\.gif$|^poster\.png$/.test(f) || f === `${name}.webm` || f === `${name}.mov`) fs.copyFileSync(path.join(dir, f), path.join(film, 'renders', f));
    }
    const run = (...a) => spawnSync(process.execPath, a, { encoding: 'utf8', cwd: ROOT, maxBuffer: 1 << 26 });
    const scripts = path.join(ROOT, 'shared', 'scripts');
    const f = run(path.join(scripts, 'fonts.mjs'), film);
    if (f.status !== 0) { console.log(`FAIL  ${name}: fonts: ${f.stderr.trim().split('\n').pop()}`); fails++; continue; }
    const v = run(path.join(scripts, 'render.mjs'), 'verify', film, '--mp4', path.join(dir, mp4));
    const out = v.stdout + v.stderr;
    // a transparent film's .mov is not committed (ProRes is too big): its "missing" is not a failure here
    const failing = out.split('\n').filter((l) => /^FAIL/.test(l) && !(/^FAIL\s+mov with alpha\s+missing/.test(l) && !renders.includes(`${name}.mov`)));
    const frames = out.split('\n').filter((l) => /vs canvas/.test(l) && /^(PASS|WARN)/.test(l));
    if (failing.length || frames.length < 2 || !/VERIFY (PASS|FAIL)/.test(out)) {
      console.log(`FAIL  ${name}: verify\n${(failing.length ? failing : out.trim().split('\n').slice(-5)).map((l) => `      ${l}`).join('\n')}`);
      fails++; continue;
    }
    const stamp = {
      note: 'Written by tools/stamp.mjs after render.mjs verify passed; tools/check.mjs compares it. Do not edit.',
      source: sourceHash(dir),
      renders: Object.fromEntries(renders.map((r) => [r, fileHash(path.join(dir, r))])),
      verify: frames.map((l) => l.replace(/\s+/g, ' ').trim()),
    };
    fs.writeFileSync(path.join(dir, 'stamp.json'), JSON.stringify(stamp, null, 2) + '\n');
    console.log(`PASS  ${name}: stamped (${renders.join(', ')})`);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}
console.log(fails ? `STAMP FAIL (${fails})` : 'STAMP PASS');
if (fails) process.exitCode = 1;
