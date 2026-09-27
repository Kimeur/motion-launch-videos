#!/usr/bin/env node
// Repo checks for maintainers. The plugin does not ship this folder.
//
//   node tools/check.mjs            fast: shared files in sync, manifests, every SKILL.md, every template parses,
//                                   and a warning for an example whose source carries an older core than shared/
//   node tools/check.mjs --smoke    also build each skill's template demo in a scratch folder and run its
//                                   stills critique and loopcheck (needs npm, network for the fonts, a Chromium)
//
// Exit code 1 when anything fails.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { skills } from './sync.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const smoke = process.argv.includes('--smoke');
let fails = 0;
const ok = (good, what, detail = '') => { console.log(`${good ? 'PASS' : 'FAIL'}  ${what}${detail ? `  ${detail}` : ''}`); if (!good) fails++; };

// 1. shared files in sync
const sync = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'sync.mjs'), '--check'], { encoding: 'utf8' });
ok(sync.status === 0, 'shared files in sync', sync.status === 0 ? '' : sync.stdout.trim().split('\n').slice(-1)[0]);

// 2. manifests
const json = (f) => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8')); } catch (e) { ok(false, f, e.message); return null; } };
const market = json('.claude-plugin/marketplace.json');
if (market) for (const p of market.plugins || []) {
  const pj = json(path.join(p.source, '.claude-plugin', 'plugin.json'));
  ok(!!pj && pj.name === p.name, `plugin ${p.name}`, pj ? `version ${pj.version}` : '');
}

// 3. every skill: frontmatter, files it links to, template parses
for (const dir of skills()) {
  const name = path.basename(dir), md = fs.readFileSync(path.join(dir, 'SKILL.md'), 'utf8');
  const fm = /^---\n([\s\S]*?)\n---/.exec(md);
  const get = (k) => fm && (new RegExp(`^${k}:\\s*(.*)$`, 'm').exec(fm[1]) || [])[1];
  const desc = get('description') || '';
  ok(get('name') === name, `${name}: frontmatter name`, get('name') || 'missing');
  ok(desc.length > 40 && desc.length <= 1024, `${name}: description`, `${desc.length} characters (at most 1024)`);
  const links = [...md.matchAll(/\]\(((?:reference|templates|scripts)\/[^)]+)\)/g)].map((m) => m[1]);
  const missing = links.filter((l) => !fs.existsSync(path.join(dir, l)));
  ok(!missing.length, `${name}: linked files`, missing.length ? `missing ${missing.join(', ')}` : `${links.length} links`);
  for (const f of fs.readdirSync(path.join(dir, 'templates')).filter((x) => x.endsWith('.html'))) {
    const html = fs.readFileSync(path.join(dir, 'templates', f), 'utf8');
    const js = /<script>([\s\S]*)<\/script>/.exec(html);
    let err = null;
    try { new Function(js ? js[1] : ''); } catch (e) { err = e.message; }
    ok(!!js && !err, `${name}: templates/${f} parses`, err || '');
  }
  const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  ok(pkg.dependencies && pkg.dependencies['playwright-core'] === '1.63.0', `${name}: package.json`, `playwright-core ${pkg.dependencies && pkg.dependencies['playwright-core']}`);
}

// 4. examples: a warning (not a failure) for one whose source holds an older core than shared/core.js; its
//    renders were made on that core, so re-render it rather than editing its source
const BEGIN = '/* ===== CORE BEGIN', END = '/* ===== CORE END ===== */';
const core = fs.readFileSync(path.join(ROOT, 'shared', 'core.js'), 'utf8').trimEnd();
for (const ex of fs.readdirSync(path.join(ROOT, 'examples')).sort()) {
  const src = path.join(ROOT, 'examples', ex, 'src', 'film.html');
  if (!fs.existsSync(src)) continue;
  const html = fs.readFileSync(src, 'utf8'), a = html.indexOf(BEGIN), b = html.indexOf(END);
  if (a < 0 || b < a) continue;                            // an engine of its own (the kinetic type)
  const same = html.slice(html.indexOf('\n', a) + 1, b).trimEnd() === core;
  console.log(same ? `PASS  examples/${ex}: on the current core` : `WARN  examples/${ex}: rendered on an older core; re-render it (README, For maintainers)`);
}

// 5. optional smoke test: every template demo passes its own critique and loopcheck
if (smoke) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mlv-smoke-'));
  try {
    for (const dir of skills()) {
      const name = path.basename(dir), film = path.join(tmp, `${name}-demo`);
      fs.mkdirSync(path.join(film, 'src'), { recursive: true });
      fs.copyFileSync(path.join(dir, 'templates', 'film.html'), path.join(film, 'src', 'film.html'));
      const run = (...a) => spawnSync(process.execPath, a, { encoding: 'utf8', cwd: ROOT, maxBuffer: 1 << 26 });
      const f = run(path.join(dir, 'scripts', 'fonts.mjs'), film);
      if (f.status !== 0) { ok(false, `${name}: fonts`, f.stderr.trim().split('\n').pop()); continue; }
      const s = run(path.join(dir, 'scripts', 'render.mjs'), 'stills', film);
      ok(s.status === 0, `${name}: stills`, (s.stdout.match(/CRITIQUE .*/) || [s.stderr.trim().split('\n').pop()])[0]);
      const l = run(path.join(dir, 'scripts', 'render.mjs'), 'loopcheck', film);
      ok(l.status === 0, `${name}: loopcheck`, (l.stdout.match(/LOOPCHECK .*/) || [l.stderr.trim().split('\n').pop()])[0]);
    }
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}
console.log(fails ? `CHECK FAIL (${fails})` : 'CHECK PASS');
if (fails) process.exitCode = 1;
