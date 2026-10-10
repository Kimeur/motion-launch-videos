#!/usr/bin/env node
// Repo checks for maintainers. The plugin does not ship this folder.
//
//   node tools/check.mjs            fast: shared files in sync, manifests, every SKILL.md, every template parses,
//                                   a warning for an example whose source carries an older core than shared/,
//                                   and a failure for an example whose renders are not stamped against its
//                                   current source (tools/stamp.mjs)
//   node tools/check.mjs --smoke    also build each skill's template demo in a scratch folder and run its
//                                   stills critique and loopcheck (needs npm, network for the fonts, a Chromium)
//   node tools/check.mjs --smoke --formats
//                                   and again at --format 9:16 and --format 16:9
//
// .github/workflows/check.yml runs the fast checks on every push and pull request, and the smoke test with
// --formats weekly and on demand.
//
// Exit code 1 when anything fails.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { skills } from './sync.mjs';
import { RENDERS, sourceHash, fileHash } from './stamps.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const smoke = process.argv.includes('--smoke');
const FORMATS = process.argv.includes('--formats') ? [null, '9:16', '16:9'] : [null];
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

// 4b. examples: every committed render is stamped as verified against the current source (tools/stamp.mjs)
for (const ex of fs.readdirSync(path.join(ROOT, 'examples')).sort()) {
  const dir = path.join(ROOT, 'examples', ex);
  if (!fs.existsSync(path.join(dir, 'src', 'film.html'))) continue;
  const renders = fs.readdirSync(dir).filter((f) => RENDERS.test(f)).sort();
  if (!renders.length) continue;
  const fix = `re-render it, then node tools/stamp.mjs ${ex}`;
  let stamp = null;
  try { stamp = JSON.parse(fs.readFileSync(path.join(dir, 'stamp.json'), 'utf8')); } catch { ok(false, `examples/${ex}: stamp`, `no stamp.json: node tools/stamp.mjs ${ex}`); continue; }
  const stale = [];
  if (stamp.source !== sourceHash(dir)) stale.push('the source changed since its renders were verified');
  for (const r of renders) if (!stamp.renders || !stamp.renders[r]) stale.push(`${r} is not stamped`); else if (stamp.renders[r] !== fileHash(path.join(dir, r))) stale.push(`${r} changed since it was verified`);
  for (const r of Object.keys(stamp.renders || {})) if (!renders.includes(r)) stale.push(`${r} is stamped but missing`);
  ok(!stale.length, `examples/${ex}: renders match the source`, stale.length ? `${stale.join('; ')}: ${fix}` : '');
}

// 5. optional smoke test: every template demo passes its own critique and loopcheck
if (smoke) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mlv-smoke-'));
  try {
    for (const dir of skills()) {
      const name = path.basename(dir), film = path.join(tmp, `${name}-demo`);
      fs.mkdirSync(path.join(film, 'src'), { recursive: true });
      fs.copyFileSync(path.join(dir, 'templates', 'film.html'), path.join(film, 'src', 'film.html'));
      const assets = path.join(dir, 'templates', 'assets');     // a template whose demo embeds images or audio
      if (fs.existsSync(assets)) fs.cpSync(assets, path.join(film, 'assets'), { recursive: true });
      const run = (...a) => spawnSync(process.execPath, a, { encoding: 'utf8', cwd: ROOT, maxBuffer: 1 << 26 });
      const f = run(path.join(dir, 'scripts', 'fonts.mjs'), film);
      if (f.status !== 0) { ok(false, `${name}: fonts`, f.stderr.trim().split('\n').pop()); continue; }
      for (const fmt of FORMATS) {
        const extra = fmt ? ['--format', fmt] : [], tag = fmt ? ` ${fmt}` : '';
        const s = run(path.join(dir, 'scripts', 'render.mjs'), 'stills', film, ...extra);
        ok(s.status === 0, `${name}: stills${tag}`, (s.stdout.match(/CRITIQUE .*/) || [s.stderr.trim().split('\n').pop()])[0]);
        const l = run(path.join(dir, 'scripts', 'render.mjs'), 'loopcheck', film, ...extra);
        ok(l.status === 0, `${name}: loopcheck${tag}`, (l.stdout.match(/LOOPCHECK .*/) || [l.stderr.trim().split('\n').pop()])[0]);
      }
    }
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}
console.log(fails ? `CHECK FAIL (${fails})` : 'CHECK PASS');
if (fails) process.exitCode = 1;
