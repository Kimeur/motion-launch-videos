#!/usr/bin/env node
// Keep every skill in step with shared/. Maintainers only; the plugin does not ship this folder.
//
//   node tools/sync.mjs           copy shared/ into every skill
//   node tools/sync.mjs --check   exit 1 if any skill differs from shared/ (for CI)
//
// What it syncs, for each folder in plugins/*/skills/*:
//   shared/scripts/*.mjs    -> <skill>/scripts/         the render, build, fonts and cmap scripts, identical everywhere
//   shared/reference/video-types.md -> <skill>/reference/   the guide to video types
// and, for each skill whose templates/film.html is built on the core (it holds the CORE markers):
//   shared/core.js          -> <skill>/templates/*.html between the CORE BEGIN and CORE END markers
//   shared/reference/*.md   -> <skill>/reference/       the docs every engine shares (brief, core, loops, springs, render, fonts)
//   shared/templates/*.md   -> <skill>/templates/       the brief template
// and, for each template that holds the WORLD markers (the globe engine), whatever else it is built on:
//   shared/world/world-data.js -> <skill>/templates/*.html between the WORLD BEGIN and WORLD END markers
//                              (the geography dataset; tools/world-data.mjs regenerates it)
// The kinetic-type skill (motion-launch-videos) carries its own engine and docs; it only gets the scripts and the
// video-types guide.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
const SHARED = path.join(ROOT, 'shared');
const BEGIN = '/* ===== CORE BEGIN: shared/core.js, synced by tools/sync.mjs. Do not edit it here. ===== */';
const END = '/* ===== CORE END ===== */';
const WORLD_BEGIN = '/* ===== WORLD BEGIN: shared/world/world-data.js, synced by tools/sync.mjs. Do not edit it here. ===== */';
const WORLD_END = '/* ===== WORLD END ===== */';
const EVERY_SKILL = ['video-types.md'];                 // shared docs every skill gets, its own engine or not

export function skills() {
  const out = [];
  for (const plug of fs.readdirSync(path.join(ROOT, 'plugins'))) {
    const dir = path.join(ROOT, 'plugins', plug, 'skills');
    if (!fs.existsSync(dir)) continue;
    for (const s of fs.readdirSync(dir)) if (fs.existsSync(path.join(dir, s, 'SKILL.md'))) out.push(path.join(dir, s));
  }
  return out;
}
// html with the shared file spliced between the markers, or null when it holds neither marker
function splice(html, begin, end, file, what) {
  const a = html.indexOf(begin), b = html.indexOf(end);
  if (a < 0 && b < 0) return null;
  if (a < 0 || b < a) throw new Error(`${what} markers out of order`);
  const body = fs.readFileSync(path.join(SHARED, file), 'utf8').trimEnd();
  return html.slice(0, a) + begin + '\n' + body + '\n' + html.slice(b);
}
export const withCore = (html) => splice(html, BEGIN, END, 'core.js', 'CORE');
export const withWorld = (html) => splice(html, WORLD_BEGIN, WORLD_END, path.join('world', 'world-data.js'), 'WORLD');

let drift = 0;
const put = (file, content) => {
  const old = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  if (old === content) return;
  drift++;
  if (check) { console.log(`out of date: ${path.relative(ROOT, file)}`); return; }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  console.log(`wrote ${path.relative(ROOT, file)}`);
};
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  for (const skill of skills()) {
    for (const f of fs.readdirSync(path.join(SHARED, 'scripts'))) put(path.join(skill, 'scripts', f), fs.readFileSync(path.join(SHARED, 'scripts', f), 'utf8'));
    for (const f of EVERY_SKILL) put(path.join(skill, 'reference', f), fs.readFileSync(path.join(SHARED, 'reference', f), 'utf8'));
    const tdir = path.join(skill, 'templates');
    let onCore = false;
    if (fs.existsSync(tdir)) for (const f of fs.readdirSync(tdir).filter((x) => x.endsWith('.html'))) {
      const html = fs.readFileSync(path.join(tdir, f), 'utf8'), cored = withCore(html), next = withWorld(cored ?? html) ?? cored;
      if (cored !== null) onCore = true;
      if (next !== null) put(path.join(tdir, f), next);
    }
    if (!onCore) continue;
    for (const f of fs.readdirSync(path.join(SHARED, 'reference'))) put(path.join(skill, 'reference', f), fs.readFileSync(path.join(SHARED, 'reference', f), 'utf8'));
    for (const f of fs.readdirSync(path.join(SHARED, 'templates'))) put(path.join(skill, 'templates', f), fs.readFileSync(path.join(SHARED, 'templates', f), 'utf8'));
  }
  console.log(check ? (drift ? `SYNC CHECK FAIL: ${drift} file(s) differ from shared/; run node tools/sync.mjs` : 'SYNC CHECK PASS') : `sync done (${drift} file(s) written)`);
  if (check && drift) process.exitCode = 1;
}
