#!/usr/bin/env node
// Drive a motion-* film (any of the skills' engines) in headless Chromium.
//
//   node <skill>/scripts/render.mjs <mode> <filmDir> [options]
//   node <skill>/scripts/render.mjs doctor
//
// Modes
//   doctor              check this machine once: Node, playwright-core, a Chromium, ffmpeg with libx264,
//                       ffprobe, npm and tar; prints the command that fixes each missing piece
//   stills              build, run the automated critique, write review stills + a contact sheet to stills/
//   loopcheck           the seam and the purity of seek(). A 'hold' loop (the default) ends on a still copy
//                       of frame 0: every diff must be 0. A 'cycle' loop moves over the seam: the film just
//                       before the loop point must match frame 0 as closely as neighbouring instants match,
//                       and the output step from the last frame to frame 0 must be no bigger than other steps.
//   render              stream every motion-blurred frame into ffmpeg: renders/<name>.mp4,
//                       renders/preview.gif and renders/poster.png. With FILM.audio, the page's cue mix and
//                       the track are mixed, normalised to the target loudness and muxed as AAC. A film with
//                       FILM.transparent also gets renders/<name>.mov (ProRes 4444) and <name>.webm (VP9),
//                       both with alpha; the MP4 and GIF are composited over bg
//     --range a:b       only frames a..b-1, to renders/<name>-f<a>-<b>.mp4 (a quick check)
//     --crf 16          x264 quality (lower is bigger)
//     --gif-fps 20 --gif-width 480 --gif-colors 64   (the default width keeps a 480 x 480 GIF's pixel count)
//   verify              ffprobe facts, colour tags, faststart, decoded frames vs the exact canvas pixels;
//                       the audio stream and its loudness; the alpha outputs' alpha plane vs the canvas
//     --mp4 <file>      verify another render of this film (default renders/<name>.mp4)
//   mp4frames [n ...]   decode frames from the MP4 (default: the review-stills plan) to stills/mp4/,
//                       with a contact sheet and each frame's PSNR against the exact canvas
//     --mp4 <file>      decode another render (a --range render: n counts from its first frame)
//   at 2.5 7.25 ...     sharp seek(t) stills to stills/debug/
//   frame 150 390 ...   motion-blurred renderFrame(n) stills to stills/debug/
//   layout              print the measured layout table as JSON
//
// Any film mode takes --format 9:16 (or 16:9, 4:5, 1:1): the film at that aspect ratio, with its outputs
// suffixed (stills/9x16/, renders/<name>-9x16.mp4, preview-9x16.gif, poster-9x16.png)
//
// Needs Node >= 20, playwright-core (resolved from <filmDir>, the working directory, then the skill
// folder), a Chromium, and ffmpeg + ffprobe for render and verify. Chromium is found in this order:
// $CHROME_PATH, playwright-core's own browser, the newest chromium-* in the Playwright cache
// ($PLAYWRIGHT_BROWSERS_PATH or the default cache folder), then a system Chrome or Chromium.
// ffmpeg and ffprobe come from $FFMPEG_PATH / $FFPROBE_PATH, else PATH.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from './build.mjs';
import { fontFaces, missingChars } from './cmap.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const mode = argv[0];
if (!mode || (!argv[1] && mode !== 'doctor') || mode === '--help') {
  console.error('usage: node render.mjs <stills|loopcheck|render|verify|mp4frames|at|frame|layout> <filmDir> [options]\n       node render.mjs doctor');
  process.exit(2);
}
const FILM_DIR = path.resolve(argv[1] || '.');
const NAME = path.basename(FILM_DIR);
const rest = argv.slice(2);
const opt = (k, d) => { const i = rest.indexOf(`--${k}`); return i >= 0 ? rest[i + 1] : d; };
// the plain arguments (times for `at`, frames for `frame` and `mp4frames`): every --option and the value after
// each option that takes one are skipped, so `at <film> 2.5 --format 9:16` seeks 2.5 only
const VALUE_OPTS = new Set(['format', 'range', 'crf', 'gif-fps', 'gif-width', 'gif-colors', 'mp4']);
const positional = () => { const out = []; for (let i = 0; i < rest.length; i++) { const x = rest[i]; if (x.startsWith('--')) { if (VALUE_OPTS.has(x.slice(2))) i++; } else out.push(x); } return out; };
const ensure = (d) => { fs.mkdirSync(d, { recursive: true }); return d; };
// --format 9:16 renders the film at another aspect ratio (FILM.formats may patch it): the page gets
// ?format=9x16 and every output carries the suffix (stills/9x16/, renders/<film>-9x16.mp4, preview-9x16.gif)
const FORMAT = opt('format', null);
if (FORMAT && !/^\d+[:x]\d+$/.test(FORMAT)) throw new Error(`--format ${FORMAT}: use a ratio such as 9:16, 16:9, 4:5 or 1:1`);
const FKEY = FORMAT ? FORMAT.replace(':', 'x') : '', SUF = FKEY ? `-${FKEY}` : '';
const STILLS = FKEY ? path.join('stills', FKEY) : 'stills';

/* ---------------- tools ---------------- */
const SKILL_DIR = path.dirname(HERE);
const INSTALL_PW = `npm install --prefix "${SKILL_DIR}" --no-package-lock   (or, in your project: npm i -D playwright-core)`;
function resolvePlaywright() {                             // the film folder, the working directory, then the skill folder
  for (const base of [FILM_DIR, process.cwd(), SKILL_DIR]) {
    try { return createRequire(path.join(base, 'package.json')).resolve('playwright-core'); } catch { /* try the next place */ }
  }
  return null;
}
async function loadPlaywright() {
  const p = resolvePlaywright();
  if (!p) throw new Error(`playwright-core not found. Install it once: ${INSTALL_PW}`);
  const m = await import(pathToFileURL(p).href);
  return m.chromium || m.default.chromium;
}
function isExe(f) { try { return fs.statSync(f).isFile(); } catch { return false; } }
function findInCache(root) {
  if (!fs.existsSync(root)) return null;
  const revs = fs.readdirSync(root).filter((d) => /^chromium-\d+$/.test(d)).sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]));
  const names = new Set(['Google Chrome for Testing', 'Chromium', 'chrome', 'chrome.exe']);
  for (const r of revs) {
    const stack = [[path.join(root, r), 0]];
    while (stack.length) {
      const [d, depth] = stack.pop();
      let ents = [];
      try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { continue; }
      for (const e of ents) {
        const f = path.join(d, e.name);
        if (e.isFile() && names.has(e.name) && (process.platform !== 'darwin' || d.endsWith(path.join('Contents', 'MacOS')))) return f;
        if (e.isDirectory() && depth < 6) stack.push([f, depth + 1]);
      }
    }
  }
  return null;
}
function findChrome(chromium) {
  const tried = [];
  if (process.env.CHROME_PATH) { if (isExe(process.env.CHROME_PATH)) return process.env.CHROME_PATH; tried.push(`$CHROME_PATH=${process.env.CHROME_PATH}`); }
  try { const p = chromium.executablePath(); if (isExe(p)) return p; tried.push(p); } catch { /* none bundled */ }
  const cache = process.env.PLAYWRIGHT_BROWSERS_PATH || (process.platform === 'darwin' ? path.join(os.homedir(), 'Library', 'Caches', 'ms-playwright')
    : process.platform === 'win32' ? path.join(process.env.LOCALAPPDATA || '', 'ms-playwright') : path.join(os.homedir(), '.cache', 'ms-playwright'));
  const cached = findInCache(cache);
  if (cached) return cached;
  tried.push(`${cache}/chromium-*`);
  const sys = process.platform === 'darwin'
    ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium']
    : process.platform === 'win32'
      ? ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe']
      : ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser'].map(which).filter(Boolean);
  for (const s of sys) if (isExe(s)) return s;
  throw new Error(`no Chromium found (tried ${tried.join(', ')} and a system Chrome). Set CHROME_PATH, or run: ${installChromium()}`);
}
function installChromium() {                                // playwright-core's own CLI, wherever it was installed
  const p = resolvePlaywright();
  return p ? `node "${path.join(path.dirname(p), 'cli.js')}" install chromium` : `npx playwright-core@1.63.0 install chromium`;
}
function which(bin) {
  for (const d of (process.env.PATH || '').split(path.delimiter)) {
    for (const ext of process.platform === 'win32' ? ['.exe', ''] : ['']) { const f = path.join(d, bin + ext); if (isExe(f)) return f; }
  }
  return null;
}
function findBin(name) {
  const env = process.env[`${name.toUpperCase()}_PATH`];
  if (env && isExe(env)) return env;
  const p = which(name);
  if (!p) throw new Error(`${name} not found on PATH (or set ${name.toUpperCase()}_PATH). Install ffmpeg: brew install ffmpeg / apt install ffmpeg`);
  return p;
}

/* ---------------- page ---------------- */
async function openFilm() {
  const htmlPath = build(FILM_DIR);
  const chromium = await loadPlaywright();
  const exe = findChrome(chromium);
  const browser = await chromium.launch({
    executablePath: exe, headless: true,
    args: ['--force-color-profile=srgb', '--disable-lcd-text', '--font-render-hinting=none', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(pathToFileURL(htmlPath).href + '?capture=1' + (FKEY ? `&format=${FKEY}` : ''));
  try { await page.evaluate(() => window.ready); }
  catch (e) { await browser.close(); throw new Error(`the film failed to start: ${e.message}\n${errors.join('\n')}`); }
  const meta = await page.evaluate(() => ({ W: window.WIDTH, H: window.HEIGHT, FPS: window.FPS, DUR: window.DURATION, ...window.FILM_META }));
  meta.N = Math.round(meta.DUR * meta.FPS);
  await page.setViewportSize({ width: meta.W, height: meta.H });
  await page.evaluate(([transparent, bg]) => {
    const c = document.getElementById('c'), x = c.getContext('2d');
    const b64 = (u8) => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
    window.__grab = () => x.getImageData(0, 0, c.width, c.height).data;
    window.__rgb64 = () => {                               // exact canvas pixels as base64 RGB (a transparent film over bg, as compositeRGB)
      const d = x.getImageData(0, 0, c.width, c.height).data, n = c.width * c.height, rgb = new Uint8Array(n * 3);
      if (!transparent) for (let i = 0, j = 0; i < n * 4; i += 4, j += 3) { rgb[j] = d[i]; rgb[j + 1] = d[i + 1]; rgb[j + 2] = d[i + 2]; }
      else for (let i = 0, j = 0; i < n * 4; i += 4, j += 3) {
        const a = d[i + 3], ia = 255 - a;
        rgb[j] = (d[i] * a + bg[0] * ia + 127) / 255 | 0; rgb[j + 1] = (d[i + 1] * a + bg[1] * ia + 127) / 255 | 0; rgb[j + 2] = (d[i + 2] * a + bg[2] * ia + 127) / 255 | 0;
      }
      return b64(rgb);
    };
    window.__rgba64 = () => b64(new Uint8Array(x.getImageData(0, 0, c.width, c.height).data.buffer));
  }, [!!meta.transparent, hexRGB(meta.bg)]);
  console.log(`${NAME}: ${meta.W}x${meta.H}, ${meta.FPS} fps, ${meta.DUR} s (${meta.N} frames), chromium ${exe}`);
  return { browser, page, meta, errors, htmlPath };
}
const hexRGB = (hex) => { const h = String(hex || '#000').replace('#', ''); const n = parseInt(h.length === 3 ? h.replace(/./g, '$&$&') : h.slice(0, 6), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
// straight RGBA over an opaque colour, rounded as the page's __rgb64 and the core's seenPixels round it
function compositeRGB(rgba, bg) {
  const n = rgba.length >> 2, out = Buffer.allocUnsafe(n * 3);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j += 3) {
    const a = rgba[i + 3], ia = 255 - a;
    out[j] = (rgba[i] * a + bg[0] * ia + 127) / 255 | 0; out[j + 1] = (rgba[i + 1] * a + bg[1] * ia + 127) / 255 | 0; out[j + 2] = (rgba[i + 2] * a + bg[2] * ia + 127) / 255 | 0;
  }
  return out;
}
const png = async (page) => { const u = await page.evaluate(() => document.getElementById('c').toDataURL('image/png')); return Buffer.from(u.slice(u.indexOf(',') + 1), 'base64'); };

/* ---------------- modes ---------------- */
// every character on screen must be in the face that draws it (read from the font's cmap)
async function coverageChecks(page) {
  const faces = fontFaces(fs.readFileSync(path.join(FILM_DIR, 'src', 'film.html'), 'utf8'));
  const text = await page.evaluate(() => (window.textByFace ? window.textByFace() : {}));
  return Object.entries(text).map(([key, str]) => {
    const [family, weight] = key.split('|');
    const f = faces.find((x) => x.family === family && x.weight === weight);
    if (!f) return { name: `glyphs: ${key}`, status: 'FAIL', detail: 'no @font-face with this family and weight in src/film.html' };
    const miss = missingChars(path.join(FILM_DIR, 'fonts', f.file), str);
    return { name: `glyphs: ${family} ${weight}`, status: miss.length ? 'FAIL' : 'PASS',
      detail: miss.length ? `missing ${miss.map((c) => `"${c}" U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`).join(', ')}` : `${new Set(str).size} characters, all in ${f.file}` };
  });
}

async function stills({ page, meta }) {
  let failed = false;
  const checks = [...(await coverageChecks(page)), ...(await page.evaluate(() => window.critique()))];
  if (meta.audio && meta.audio.track) {                     // the track the render will mix in
    let st = 'PASS', detail;
    try { const f = audioTrack(meta); detail = `${path.relative(FILM_DIR, f)} (${(fs.statSync(f).size / 1e6).toFixed(2)} MB)`; } catch (e) { st = 'FAIL'; detail = e.message; }
    checks.push({ name: 'audio track', status: st, detail });
  }
  const w = Math.max(...checks.map((c) => c.name.length));
  for (const c of checks) if (c.status !== 'PASS' || process.env.VERBOSE) console.log(`${c.status.padEnd(4)}  ${c.name.padEnd(w)}  ${c.detail}`);
  const nFail = checks.filter((c) => c.status === 'FAIL').length, nWarn = checks.filter((c) => c.status === 'WARN').length;
  console.log(`CRITIQUE ${checks.length} checks: ${checks.length - nFail - nWarn} pass, ${nWarn} warn, ${nFail} fail`);
  if (nFail) failed = true;

  // palette: sharp accent frames from 1 before to 3 after each impact
  const mis = await page.evaluate(() => (window.accentFrames || window.misFrames || (() => []))());
  const frames = [...new Set(mis.flatMap((m) => [m.frame - 1, m.frame, m.frame + 1, m.frame + 2, m.frame + 3]))].filter((f) => f >= 0 && f < meta.N).sort((a, b) => a - b);
  const hasGate = await page.evaluate(() => typeof window.offPalette === 'function');
  if (frames.length && hasGate) {
    const sharp = await page.evaluate((fr) => window.offPalette(fr, 'seek'), frames);
    const bad = sharp.filter((s) => s.area > 0);
    for (const s of bad) console.log(`FAIL  palette frame ${s.frame}: ${s.area} px of mixed ink ${s.top}`);
    console.log(bad.length ? 'GATE palette FAIL' : `GATE palette PASS (${frames.length} accent frames, no mixed ink wider than the 1-px fringe)`);
    if (bad.length) failed = true;
  }

  const out = ensure(path.join(FILM_DIR, STILLS));
  for (const f of fs.readdirSync(out)) if (/\.png$/.test(f)) fs.unlinkSync(path.join(out, f));
  const plan = await page.evaluate(() => window.stillsPlan());
  plan.unshift({ frame: 0, name: 'frame-0000', what: 'frame 0 (the loop point)' });
  plan.push({ frame: meta.N - 1, name: 'frame-end', what: meta.loop === 'cycle' ? 'last frame, flows into frame 0' : meta.loop === 'none' ? 'last frame' : 'last frame, must equal frame 0' });
  if (meta.strictPalette && hasGate) {                   // every pixel exactly a palette colour (pixel art)
    const fr = [...new Set(plan.map((p) => p.frame))];
    const res = await page.evaluate((fr) => window.offPalette(fr, 'frame', true), fr);
    const bad = res.filter((s) => s.count > 0);
    for (const s of bad) console.log(`FAIL  strict palette frame ${s.frame}: ${s.count} px not in the palette ${s.top}`);
    console.log(bad.length ? 'GATE strict palette FAIL' : `GATE strict palette PASS (${fr.length} frames, every pixel a palette colour)`);
    if (bad.length) failed = true;
  }
  const cols = 4, cw = Math.round(meta.W / cols / 1.5), ch = Math.round(cw * meta.H / meta.W), rows = Math.ceil(plan.length / cols);
  await page.evaluate(([cols, cw, ch, rows, under]) => {
    const s = document.createElement('canvas'); s.width = cols * cw; s.height = rows * (ch + 28);
    const x = s.getContext('2d'); x.fillStyle = '#202020'; x.fillRect(0, 0, s.width, s.height);
    window.__sheet = { s, x, cw, ch, cols, under };
  }, [cols, cw, ch, rows, meta.transparent ? meta.bg : null]);
  for (let i = 0; i < plan.length; i++) {
    const p = plan[i];
    const k = await page.evaluate((n) => window.renderFrame(n), p.frame);
    const file = `${String(i).padStart(2, '0')}-${p.name}.png`;
    fs.writeFileSync(path.join(out, file), await png(page));
    await page.evaluate(([i, label]) => {
      const { s, x, cw, ch, cols, under } = window.__sheet, c = document.getElementById('c');
      const cx = (i % cols) * cw, cy = Math.floor(i / cols) * (ch + 28);
      if (under) { x.fillStyle = under; x.fillRect(cx, cy, cw, ch); }   // a transparent film, over its assumed backdrop
      x.drawImage(c, cx, cy, cw, ch);
      x.fillStyle = '#E0E0E0'; x.font = '500 15px "IBM Plex Mono", monospace'; x.fillText(label, cx + 6, cy + ch + 19);
    }, [i, `${p.frame} ${p.name}`]);
    console.log(`${file.padEnd(34)} frame ${String(p.frame).padStart(4)} (t ${(p.frame / meta.FPS).toFixed(3)}, ${k} samples)  ${p.what}`);
  }
  const sheet = await page.evaluate(() => window.__sheet.s.toDataURL('image/png'));
  fs.writeFileSync(path.join(out, 'contact.png'), Buffer.from(sheet.slice(sheet.indexOf(',') + 1), 'base64'));
  console.log(`contact sheet ${path.join(out, 'contact.png')}`);
  if (failed) { console.log('STILLS written, but the critique has failures: fix them before rendering'); process.exitCode = 1; }
}

async function loopcheck({ page, meta }) {
  const loop = meta.loop || 'hold';
  const r = await page.evaluate(({ N, FPS, DUR, loop, WIDTH, HEIGHT, blur }) => {
    const grab = () => window.__grab().slice();
    const diff = (a, b) => { let m = 0, n = 0; for (let i = 0; i < a.length; i++) { const d = Math.abs(a[i] - b[i]); if (d) n++; if (d > m) m = d; } return { max: m, n }; };
    const px = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2] || a[i + 3] !== b[i + 3]) n++; return n; };
    const at = (t) => { window.seek(t); return grab(); };
    const fr = (n) => { window.renderFrame(n); return grab(); };
    const s0 = at(0), res = {};
    res[`seek(0) vs seek(${DUR})`] = diff(s0, at(DUR));
    if (loop === 'hold') {
      res[`seek(0) vs seek(DUR - 1 frame)`] = diff(s0, at(DUR - 1 / FPS));
      res[`seek(0) vs seek(DUR - 1.75 frames)`] = diff(s0, at(DUR - 1.75 / FPS));
      res['renderFrame(0) vs seek(0)'] = diff(fr(0), s0);
      res[`renderFrame(0) vs renderFrame(${N - 1})`] = diff(fr(0), fr(N - 1));
    }
    const a = DUR * 0.37, b = DUR * 0.81, c = DUR * 0.12;
    const fresh = at(a); at(b); at(c);
    res['seek purity (same t after other seeks)'] = diff(fresh, at(a));
    const m = Math.round(N * 0.45), f1 = fr(m); fr(Math.round(N * 0.2));
    res['renderFrame purity (repeat)'] = diff(f1, fr(m));
    if (loop === 'cycle') { const g0 = fr(0); fr(Math.round(N * 0.6)); res['renderFrame(0) purity (its subframes wrap)'] = diff(g0, fr(0)); }
    let hold = 0;                                          // frames at the tail identical to frame 0
    if (loop === 'hold') for (let n = N - 1; n > 0 && hold < N; n--) { if (diff(s0, at(n / FPS)).max) break; hold++; }
    // continuity over the seam: the film 0.1 ms before the loop point against frame 0 (both read frame 0's
    // discrete state), next to the same 0.1 ms step at frames either side of the seam and through the film, for
    // scale. Measured on 32 px block averages, not changed pixels: an image drawn at a new sub-pixel phase
    // repaints every pixel it covers by a level or two, which a pixel count reads as a jump anywhere in the film
    let seam = null;
    if (loop === 'cycle') {
      const B = Math.max(8, Math.round(32 * Math.min(WIDTH, HEIGHT) / 1080)), nx = Math.ceil(WIDTH / B), ny = Math.ceil(HEIGHT / B);
      const means = (d) => {
        const sum = new Float64Array(nx * ny * 4), cnt = new Float64Array(nx * ny);
        for (let y = 0, i = 0; y < HEIGHT; y++) {
          const row = Math.floor(y / B) * nx;
          for (let x = 0; x < WIDTH; x++, i += 4) { const k = row + Math.floor(x / B), j = k * 4; sum[j] += d[i]; sum[j + 1] += d[i + 1]; sum[j + 2] += d[i + 2]; sum[j + 3] += d[i + 3]; cnt[k]++; }
        }
        for (let k = 0; k < nx * ny; k++) for (let c = 0; c < 4; c++) sum[k * 4 + c] /= cnt[k];
        return sum;
      };
      const change = (a, b) => { const ma = means(a), mb = means(b); let n = 0; for (let i = 0; i < ma.length; i += 4) { const v = Math.abs(ma[i] - mb[i]) + Math.abs(ma[i + 1] - mb[i + 1]) + Math.abs(ma[i + 2] - mb[i + 2]) + Math.abs(ma[i + 3] - mb[i + 3]); if (v >= 0.5) n += v; } return Math.round(n); };
      const d = 1e-4, step = (k) => change(at(k / FPS - d), at(k / FPS));
      const ks = [1, 2, N - 1, N - 2, ...[1, 2, 3, 4, 5, 6, 7].map((i) => Math.round(N * i / 8))];
      seam = { px: change(at(DUR - d), s0), ref: ks.map(step), B };
    }
    // the same seam frame by frame: the output step from frame N-1 to frame 0 against the steps between other
    // consecutive frames. Held drawings, sprites and the boil read the quantised frame, so the 0.1 ms step above
    // cannot see them; a whole-frame step can. A step is measured on 32 px block averages (the summed change of
    // every block's mean, in levels), so it grows with how far things move or how much of the frame changes,
    // not with texture: a pixel-art sprite that moves one step repaints all its pixels, one that jumps changes
    // its blocks' averages far more. On twos most steps are 0 and a drawing change is big, so the reference is
    // the largest step: L steps either side of the seam (in a film without motion blur, enough for at least
    // one drawing change of drawings at 6 a second or faster; 3 in a blurred film, whose motion is continuous) and a run of steps in each of 8 windows through the film, each run stopping at its
    // first step that changes. The seam must also pass tile by tile (8 x 8) against the steps next to it, which
    // catches a character or sprite that jumps while the rest of the frame scrolls.
    let fstep = null;
    if (loop === 'cycle') {
      const G = 8, B = Math.max(8, Math.round(32 * Math.min(WIDTH, HEIGHT) / 1080)), nx = Math.ceil(WIDTH / B), ny = Math.ceil(HEIGHT / B);
      const blocks = (n) => {                              // mean RGBA of every B x B block of output frame n
        window.renderFrame(n);
        const d = window.__grab(), sum = new Float64Array(nx * ny * 4), cnt = new Float64Array(nx * ny);
        for (let y = 0, i = 0; y < HEIGHT; y++) {
          const row = Math.floor(y / B) * nx;
          for (let x = 0; x < WIDTH; x++, i += 4) { const k = row + Math.floor(x / B), j = k * 4; sum[j] += d[i]; sum[j + 1] += d[i + 1]; sum[j + 2] += d[i + 2]; sum[j + 3] += d[i + 3]; cnt[k]++; }
        }
        for (let k = 0; k < nx * ny; k++) for (let c = 0; c < 4; c++) sum[k * 4 + c] /= cnt[k];
        return sum;
      };
      const step = (a, b) => {                             // summed block change, in total and per tile
        const tiles = new Float64Array(G * G);
        let n = 0;
        for (let k = 0; k < nx * ny; k++) {
          const v = Math.abs(a[4 * k] - b[4 * k]) + Math.abs(a[4 * k + 1] - b[4 * k + 1]) + Math.abs(a[4 * k + 2] - b[4 * k + 2]) + Math.abs(a[4 * k + 3] - b[4 * k + 3]);
          if (v < 0.5) continue;                           // dither and rounding noise
          n += v; tiles[Math.floor(Math.floor(k / nx) * G / ny) * G + Math.floor((k % nx) * G / nx)] += v;
        }
        return { n, tiles };
      };
      const L = Math.min(blur ? 3 : Math.max(3, Math.ceil(FPS / 6)), Math.floor((N - 2) / 4));   // held drawings belong to films without blur
      const near = [];
      let prev = blocks(N - L - 1), seamStep = null;
      for (let k = N - L; k <= N + L; k++) {
        const cur = blocks(k % N), st = step(prev, cur);
        if (k === N) seamStep = st; else near.push(st);
        prev = cur;
      }
      const far = [];
      for (let w = 0; w < 8; w++) {
        const k0 = L + 1 + Math.round((N - 3 * L - 3) * (w + 0.5) / 8);
        let p = blocks(k0);
        for (let j = 1; j <= L; j++) { const c = blocks(k0 + j), st = step(p, c); p = c; if (st.n || j === L) { far.push(st.n); break; } }
      }
      // a margin of 1.5 on the largest step, plus a floor for films that barely move: one block changing by 64 levels
      const lim = (m) => Math.round(1.5 * m + 64);
      let worst = null;
      for (let i = 0; i < G * G; i++) {
        const m = Math.max(0, ...near.map((s) => s.tiles[i])), l = lim(m), over = seamStep.tiles[i] - l;
        if (over > 0 && (!worst || over > worst.over)) worst = { tile: [i % G, Math.floor(i / G)], v: Math.round(seamStep.tiles[i]), near: Math.round(m), lim: l, over };
      }
      const r0 = (x) => Math.round(x);
      const nearMax = Math.max(0, ...near.map((s) => s.n)), farMax = Math.max(0, ...far);
      fstep = { v: r0(seamStep.n), nearMax: r0(nearMax), nearMin: r0(Math.min(...near.map((s) => s.n))), farMax: r0(farMax), lim: lim(Math.max(nearMax, farMax)), L, B, worst };
    }
    return { res, hold, seam, fstep };
  }, { ...meta, loop, WIDTH: meta.W, HEIGHT: meta.H });
  let worst = 0;
  for (const [k, v] of Object.entries(r.res)) { console.log(`${k.padEnd(44)} max channel diff ${v.max}  (channels differing: ${v.n})`); worst = Math.max(worst, v.max); }
  let seamOk = true;
  if (loop === 'hold') console.log(`static tail: the last ${r.hold} frames equal frame 0`);
  if (r.seam) {
    const lim = Math.round(1.5 * Math.max(...r.seam.ref) + 50);
    seamOk = meta.seamCut || r.seam.px <= lim;
    console.log(`${'seam continuity (0.1 ms across the loop point)'.padEnd(44)} ${r.seam.px} change; the same step elsewhere changes ${r.seam.ref.join(', ')} (limit ${lim}; summed change of ${r.seam.B} px block averages)${meta.seamCut ? '  (a declared cut at the loop point: information only)' : ''}`);
  }
  if (r.fstep) {
    const f = r.fstep, ok = f.v <= f.lim && !f.worst;
    if (!meta.seamCut && !ok) seamOk = false;
    console.log(`${'frame step across the seam (N-1 to 0)'.padEnd(44)} ${f.v} change; the ${2 * f.L} steps next to it ${f.nearMin} to ${f.nearMax}, steps through the film up to ${f.farMax} (limit ${f.lim}; summed change of ${f.B} px block averages)`
      + (f.worst ? `; tile ${f.worst.tile.join(',')} of 8x8 changes ${f.worst.v}, next to the seam at most ${f.worst.near} (limit ${f.worst.lim}): something drawn from the frame count jumps at the loop point (a sprite, drawing or cycle that does not fit the loop)` : '')
      + (meta.seamCut ? '  (a declared cut at the loop point: information only)' : ''));
  }
  const ok = worst === 0 && seamOk;
  console.log(ok ? `LOOPCHECK PASS (${loop} loop${loop === 'cycle' ? ', continuous over the seam' : ''}, max diff 0)` : `LOOPCHECK FAIL (${worst ? `max diff ${worst}` : ''}${worst && !seamOk ? ', ' : ''}${seamOk ? '' : 'the film jumps at the loop point'})`);
  if (!ok) process.exitCode = 1;
}

async function render({ page, meta }) {
  const ffmpeg = findBin('ffmpeg');
  const [a, b] = (opt('range', `0:${meta.N}`)).split(':').map(Number);
  if (!(a >= 0 && b <= meta.N && a < b)) throw new Error(`bad --range ${a}:${b} (0..${meta.N})`);
  const full = a === 0 && b === meta.N;
  const outDir = ensure(path.join(FILM_DIR, 'renders'));
  const mp4 = path.join(outDir, full ? `${NAME}${SUF}.mp4` : `${NAME}${SUF}-f${a}-${b}.mp4`);
  const gif = path.join(outDir, `preview${SUF}.gif`);
  const gh = meta.gif || {};                                  // an engine's hints: pixel art scales by nearest neighbour, undithered
  // the default GIF keeps the pixel count of a 480 x 480 one at any aspect ratio: 360 x 640 at 9:16, 640 x 360 at 16:9
  const gwDefault = Math.round(480 * Math.sqrt(meta.W / meta.H) / 2) * 2;
  const crf = opt('crf', '16'), gfps = opt('gif-fps', String(gh.fps || 20)), gw = opt('gif-width', String(gh.width || gwDefault)), gcol = opt('gif-colors', String(gh.colors || 64));
  const gscale = gh.scale === 'neighbor' ? 'neighbor' : 'lanczos', gdither = gh.dither === 'none' ? 'dither=none' : 'dither=bayer:bayer_scale=4';
  // palettegen keeps one entry for transparency (the GIF encoder marks unchanged pixels with it), so N colours need N + 1
  const ncol = Math.round(Number(gcol));
  if (!(ncol >= 3 && ncol <= 255)) throw new Error(`--gif-colors ${gcol}: 3 to 255`);
  const gmax = ncol + 1;
  const x264 = ['-c:v', 'libx264', '-preset', 'slow', '-crf', crf, '-pix_fmt', 'yuv420p',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv',
    '-bsf:v', 'h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1:video_full_range_flag=0',
    '-r', String(meta.FPS), '-movflags', '+faststart'];
  const input = ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${meta.W}x${meta.H}`, '-framerate', String(meta.FPS), '-i', 'pipe:0'];
  const toYuv = 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p';
  const args = full
    ? [...input, '-filter_complex',
      `[0:v]split=2[m][g];[m]${toYuv}[v];[g]fps=${gfps},scale=${gw}:-2:flags=${gscale},split[g1][g2];[g1]palettegen=max_colors=${gmax}:stats_mode=full[p];[g2][p]paletteuse=${gdither}:diff_mode=rectangle[gif]`,
      '-map', '[v]', ...x264, mp4, '-map', '[gif]', '-loop', '0', gif]
    : [...input, '-vf', toYuv, ...x264, mp4];
  // a transparent film: the MP4 and GIF above get the film composited over bg; a second ffmpeg takes the RGBA
  // and writes ProRes 4444 (.mov) and VP9 (.webm), both with alpha, for editors
  const alpha = !!meta.transparent && full;
  const mov = path.join(outDir, `${NAME}${SUF}.mov`), webm = path.join(outDir, `${NAME}${SUF}.webm`);
  const tags = ['-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv'];
  const alphaArgs = ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${meta.W}x${meta.H}`, '-framerate', String(meta.FPS), '-i', 'pipe:0',
    '-filter_complex', '[0:v]split=2[a][b];[a]scale=out_color_matrix=bt709:out_range=tv,format=yuva444p10le[p];[b]scale=out_color_matrix=bt709:out_range=tv,format=yuva420p[w]',
    '-map', '[p]', '-c:v', 'prores_ks', '-profile:v', '4', '-pix_fmt', 'yuva444p10le', '-alpha_bits', '16', '-vendor', 'apl0', ...tags, '-r', String(meta.FPS), mov,
    '-map', '[w]', '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-auto-alt-ref', '0', '-b:v', '0', '-crf', '20', '-deadline', 'good', '-cpu-used', '4', '-row-mt', '1', ...tags, '-r', String(meta.FPS), webm];
  const procs = [spawn(ffmpeg, args, { stdio: ['pipe', 'inherit', 'inherit'] })];
  if (alpha) procs.push(spawn(ffmpeg, alphaArgs, { stdio: ['pipe', 'inherit', 'inherit'] }));
  const done = procs.map((p) => once(p, 'close'));
  for (const p of procs) p.stdin.on('error', () => {});
  const put = async (p, buf) => { if (!p.stdin.write(buf)) await once(p.stdin, 'drain'); };
  const bg = hexRGB(meta.bg);
  const t0 = Date.now(), hist = {};
  for (let n = a; n < b; n++) {
    if (!meta.transparent) {
      const [k, b64] = await page.evaluate((n) => [window.renderFrame(n), window.__rgb64()], n);
      hist[k] = (hist[k] || 0) + 1;
      await put(procs[0], Buffer.from(b64, 'base64'));
    } else {
      const [k, b64] = await page.evaluate((n) => [window.renderFrame(n), window.__rgba64()], n);
      hist[k] = (hist[k] || 0) + 1;
      const rgba = Buffer.from(b64, 'base64');
      await Promise.all([put(procs[0], compositeRGB(rgba, bg)), alpha ? put(procs[1], rgba) : null]);
    }
    if ((n + 1 - a) % meta.FPS === 0 || n === b - 1) {
      const s = (Date.now() - t0) / 1000, fps = (n + 1 - a) / s;
      console.log(`frame ${n + 1}/${b}  ${s.toFixed(0)} s  ${fps.toFixed(1)} fps  eta ${((b - n - 1) / fps).toFixed(0)} s`);
    }
  }
  for (const p of procs) p.stdin.end();
  for (const [code] of await Promise.all(done)) if (code !== 0) throw new Error(`ffmpeg exited with ${code}`);
  console.log(`subframes per frame: ${Object.entries(hist).map(([k, v]) => `${k}x${v}`).join(', ')}`);
  if (meta.audio) await addAudio(page, meta, ffmpeg, mp4, a, b);
  console.log(`wrote ${mp4} (${(fs.statSync(mp4).size / 1e6).toFixed(2)} MB)`);
  if (alpha) for (const f of [mov, webm]) console.log(`wrote ${f} (${(fs.statSync(f).size / 1e6).toFixed(2)} MB, with alpha)`);
  if (full) {
    console.log(`wrote ${gif} (${(fs.statSync(gif).size / 1e6).toFixed(2)} MB)${fs.statSync(gif).size > 4e6 ? '  over 4 MB: try --gif-fps 15 or --gif-colors 32' : ''}`);
    const pf = Math.min(meta.N - 1, Math.round((meta.poster || 0) * meta.FPS));
    await page.evaluate((n) => window.renderFrame(n), pf);
    fs.writeFileSync(path.join(outDir, `poster${SUF}.png`), await png(page));
    console.log(`wrote ${path.join(outDir, `poster${SUF}.png`)} (frame ${pf}${meta.transparent ? ', with alpha' : ''})`);
  }
}

/* ---------------- audio ---------------- */
// FILM.audio: the page synthesises the cue mix (window.renderAudio: Float32 stereo, 48 kHz, exactly the film's
// length, loop tails already wrapped); ffmpeg mixes it with the track (trimmed or looped to the film, offset,
// faded, gained), normalises it to the target loudness (EBU R128), encodes AAC at 48 kHz, 192 kb/s, and muxes
// it next to the video stream, copied as is.
function wavFloat(pcm, rate, ch) {                           // IEEE float WAV
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(3, 20); h.writeUInt16LE(ch, 22); h.writeUInt32LE(rate, 24);
  h.writeUInt32LE(rate * ch * 4, 28); h.writeUInt16LE(ch * 4, 32); h.writeUInt16LE(32, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}
function audioTrack(meta) {                                  // the track's path, inside the film folder
  const tr = meta.audio && meta.audio.track;
  if (!tr) return null;
  const f = path.resolve(FILM_DIR, tr);
  if (!f.startsWith(FILM_DIR + path.sep)) throw new Error(`FILM.audio.track ${tr} is outside the film folder`);
  if (!fs.existsSync(f)) throw new Error(`FILM.audio.track: no ${f}`);
  return f;
}
async function addAudio(page, meta, ffmpeg, mp4, a, b) {
  const A = meta.audio, D = meta.N / meta.FPS, track = audioTrack(meta);
  const au = A.sfx === false ? null : await page.evaluate(() => (window.renderAudio ? window.renderAudio() : null));
  if (!au && !track) throw new Error('FILM.audio has no track and no cues: nothing to hear');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mlv-audio-'));
  const ff = (args, what) => { const r = spawnSync(ffmpeg, ['-nostdin', '-y', '-hide_banner', '-loglevel', 'error', ...args], { encoding: 'utf8', maxBuffer: 1 << 26 }); if (r.status !== 0) throw new Error(`${what} failed: ${r.stderr}`); };
  try {
    const inputs = [], chains = [], mixIn = [];
    if (au) {
      const wav = path.join(tmp, 'cues.wav');
      fs.writeFileSync(wav, wavFloat(Buffer.from(au.b64, 'base64'), au.rate, au.channels));
      inputs.push('-i', wav);
      chains.push('[0:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[s]'); mixIn.push('[s]');
      const by = {}; for (const c of au.cues) by[c.kind] = (by[c.kind] || 0) + 1;
      console.log(`audio: ${au.cues.length} cues (${Object.entries(by).map(([k, v]) => `${v} ${k}`).join(', ')}), peak ${(20 * Math.log10(au.peak || 1e-9)).toFixed(1)} dBFS before normalising`);
    }
    if (track) {                                            // trimmed from offset to DUR, looped when shorter, gained, faded
      const off = Math.max(0, A.offset || 0), fi = A.fadeIn || 0, fo = A.fadeOut || 0;
      inputs.push('-stream_loop', '-1', '-i', track);
      chains.push(`[${au ? 1 : 0}:a]aresample=48000,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,atrim=start=${off}:end=${off + D},asetpts=PTS-STARTPTS,volume=${A.gain || 0}dB`
        + (fi > 0 ? `,afade=t=in:st=0:d=${fi}` : '') + (fo > 0 ? `,afade=t=out:st=${Math.max(0, D - fo)}:d=${fo}` : '') + '[t]');
      mixIn.push('[t]');
      console.log(`audio: track ${path.relative(FILM_DIR, track)}, from ${off} s, gain ${A.gain || 0} dB${fi ? `, fade in ${fi} s` : ''}${fo ? `, fade out ${fo} s` : ''}`);
    }
    const mixWav = path.join(tmp, 'mix.wav');
    ff([...inputs, '-filter_complex', `${chains.join(';')};${mixIn.join('')}${mixIn.length > 1 ? `amix=inputs=${mixIn.length}:duration=longest:normalize=0,` : ''}apad=whole_dur=${D},atrim=end=${D}[o]`,
      '-map', '[o]', '-c:a', 'pcm_f32le', mixWav], 'the audio mix');
    // loudness: measure (EBU R128), apply the gain that reaches the target, with a limiter only when that gain
    // would push the peaks past the ceiling (sparse cues and no track); measure again and correct, until within 0.2 LU
    const I = A.loudness != null ? A.loudness : -16, CEIL = -1.5;
    const m0 = loudness(ffmpeg, mixWav);
    if (!m0) throw new Error('the audio is silent: nothing to normalise');
    let g = I - m0.I, chain = '', got = m0, limited = false;
    for (let k = 0; k < 8; k++) {
      limited = m0.TP + g > CEIL;
      chain = `volume=${g.toFixed(3)}dB${limited ? `,alimiter=limit=${Math.pow(10, (CEIL - 1) / 20).toFixed(4)}:attack=1:release=40:level=0` : ''}`;
      got = loudness(ffmpeg, mixWav, chain);
      if (!got || Math.abs(got.I - I) <= 0.2) break;
      g += I - got.I;
    }
    const cut = a > 0 || b < meta.N ? `,atrim=start=${a / meta.FPS}:end=${b / meta.FPS},asetpts=PTS-STARTPTS` : '';
    const out = path.join(tmp, 'out.mp4');
    ff(['-i', mp4, '-i', mixWav, '-filter_complex', `[1:a]${chain},aresample=48000${cut}[o]`, '-map', '0:v', '-map', '[o]',
      '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', '-movflags', '+faststart', out], 'the audio mux');
    fs.copyFileSync(out, mp4);
    if (meta.transparent && !cut) {                         // the overlay's .mov and .webm are silent: the mix for the editor
      const wav = path.join(path.dirname(mp4), `${path.basename(mp4, '.mp4')}.wav`);
      ff(['-i', mixWav, '-af', `${chain},aresample=48000`, '-c:a', 'pcm_s24le', wav], 'the audio WAV');
      console.log(`wrote ${wav} (the normalised mix, 24-bit 48 kHz, for the editor)`);
    }
    console.log(`audio: ${m0.I.toFixed(1)} LUFS measured, ${g >= 0 ? '+' : ''}${g.toFixed(1)} dB${limited ? ` and a limiter at ${CEIL - 1} dBFS (the peaks would clip)` : ''}: ${got ? got.I.toFixed(1) : '?'} LUFS, true peak ${got ? got.TP.toFixed(1) : '?'} dBTP (target ${I} LUFS); AAC 48 kHz 192 kb/s`);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}

function probe(ffprobe, file) {
  const r = spawnSync(ffprobe, ['-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', file], { encoding: 'utf8', maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(r.stderr);
  return JSON.parse(r.stdout);
}
function atomOrder(file) {                                  // top-level MP4 boxes, in file order
  const fd = fs.openSync(file, 'r'), size = fs.fstatSync(fd).size, order = [], h = Buffer.alloc(16);
  let off = 0;
  while (off + 8 <= size && order.length < 32) {
    fs.readSync(fd, h, 0, 16, off);
    let len = h.readUInt32BE(0); const type = h.toString('latin1', 4, 8);
    if (len === 1) len = Number(h.readBigUInt64BE(8)); else if (len === 0) len = size - off;
    order.push(type); if (len < 8) break; off += len;
  }
  fs.closeSync(fd);
  return order;
}
// BT.709 limited range back to full-range RGB. accurate_rnd + full_chroma_int matter: swscale's
// default fast path lands 1 to 3 levels low (white decodes as 253, #0B0B10 as 10,10,13) although
// the stream holds the exact values (white is Y 235, U V 128).
const FROM_YUV = 'scale=in_color_matrix=bt709:in_range=tv:out_range=pc:flags=accurate_rnd+full_chroma_int,format=rgb24';
function decodeFrames(ffmpeg, file, idx, W, H) {           // idx ascending and unique
  const sel = idx.map((n) => `eq(n\\,${n})`).join('+');
  const r = spawnSync(ffmpeg, ['-nostdin', '-v', 'error', '-i', file, '-vf', `select=${sel},${FROM_YUV}`, '-fps_mode', 'passthrough', '-f', 'rawvideo', 'pipe:1'], { maxBuffer: 1 << 30 });
  if (r.status !== 0) throw new Error(String(r.stderr));
  const sz = W * H * 3;
  if (r.stdout.length < idx.length * sz) throw new Error(`decoded ${Math.floor(r.stdout.length / sz)} of ${idx.length} frames from ${file}`);
  return idx.map((_, i) => r.stdout.subarray(i * sz, (i + 1) * sz));
}
function compare(a, b) {
  let max = 0, sum = 0, se = 0;
  for (let i = 0; i < a.length; i++) { const d = Math.abs(a[i] - b[i]); if (d > max) max = d; sum += d; se += d * d; }
  const mse = se / a.length;
  return { max, mean: sum / a.length, psnr: mse ? 10 * Math.log10(255 * 255 / mse) : Infinity };
}

// which render to check, and which film frames it holds: renders/<name>.mp4 is the whole film;
// renders/<name>-f<a>-<b>.mp4 (a --range render) holds frames a..b-1
function mp4Target(meta) {
  const mp4 = path.resolve(opt('mp4', path.join(FILM_DIR, 'renders', `${NAME}${SUF}.mp4`)));
  if (!fs.existsSync(mp4)) throw new Error(`no ${mp4}; run render first`);
  const m = /-f(\d+)-(\d+)\.mp4$/.exec(path.basename(mp4));
  const [a, b] = m ? [Number(m[1]), Number(m[2])] : [0, meta.N];
  if (!(a >= 0 && b <= meta.N && a < b)) throw new Error(`${mp4}: frame range ${a}:${b} is outside 0..${meta.N}`);
  return { mp4, a, b, full: a === 0 && b === meta.N };
}
const exactRGB = async (page, n) => { await page.evaluate((n) => window.renderFrame(n), n); return Buffer.from(await page.evaluate(() => window.__rgb64()), 'base64'); };

async function verify({ page, meta }) {
  const ffmpeg = findBin('ffmpeg'), ffprobe = findBin('ffprobe');
  const { mp4, a, b, full } = mp4Target(meta), n = b - a;
  const results = [];
  const check = (name, ok, detail, warnOnly) => results.push({ s: ok ? 'PASS' : warnOnly ? 'WARN' : 'FAIL', name, detail });
  if (!full) console.log(`${path.basename(mp4)}: a partial render, frames ${a} to ${b - 1} of ${meta.N}`);
  const info = probe(ffprobe, mp4), v = info.streams.find((s) => s.codec_type === 'video');
  check('codec', v.codec_name === 'h264', `${v.codec_name} ${v.profile}`);
  check('pixel format', v.pix_fmt === 'yuv420p', v.pix_fmt);
  check('size', v.width === meta.W && v.height === meta.H, `${v.width}x${v.height}`);
  check('frame rate', v.r_frame_rate === `${meta.FPS}/1` && v.avg_frame_rate === `${meta.FPS}/1`, `r ${v.r_frame_rate}, avg ${v.avg_frame_rate}`);
  check('frame count', Number(v.nb_read_frames) === n, `${v.nb_read_frames} (expected ${n})`);
  const dur = Number(info.format.duration), want = n / meta.FPS;
  check('duration', Math.abs(dur - want) <= 1 / meta.FPS + 1e-6, `${dur.toFixed(4)} s (expected ${+want.toFixed(4)})`);
  check('colour tags', v.color_space === 'bt709' && v.color_transfer === 'bt709' && v.color_primaries === 'bt709' && v.color_range === 'tv',
    `matrix ${v.color_space}, transfer ${v.color_transfer}, primaries ${v.color_primaries}, range ${v.color_range}`);
  const aus = info.streams.filter((s) => s.codec_type === 'audio');
  if (!meta.audio) check('audio', !aus.length, aus.length ? `${aus.length} audio stream(s), but FILM.audio is not set` : 'none (FILM.audio is not set)', true);
  else {
    const au = aus[0];
    check('audio stream', aus.length === 1 && au.codec_name === 'aac' && Number(au.sample_rate) === 48000 && au.channels === 2,
      au ? `${au.codec_name} ${au.profile || ''}, ${au.sample_rate} Hz, ${au.channels} channels, ${(Number(au.bit_rate) / 1000).toFixed(0)} kb/s` : 'missing: render again (FILM.audio is set)');
    if (au) {
      const ad = Number(au.duration);
      check('audio duration', Math.abs(ad - want) <= 1 / meta.FPS + 1e-6, `${ad.toFixed(4)} s (video ${+want.toFixed(4)} s, within one frame)`);
      const target = meta.audio.loudness != null ? meta.audio.loudness : -16, L = loudness(ffmpeg, mp4);
      check('loudness', L && Math.abs(L.I - target) <= 1.5, L ? `${L.I.toFixed(1)} LUFS integrated (target ${target}, within 1.5 LU), range ${L.LRA.toFixed(1)} LU, true peak ${L.TP.toFixed(1)} dBTP` : 'not measured', !full);
    }
  }
  const atoms = atomOrder(mp4);
  check('faststart', atoms.indexOf('moov') >= 0 && atoms.indexOf('moov') < atoms.indexOf('mdat'), atoms.join(' > '));

  const [d0, dN] = decodeFrames(ffmpeg, mp4, [0, n - 1], meta.W, meta.H);
  const m0 = await exactRGB(page, a), mN = await exactRGB(page, b - 1);
  const c0 = compare(d0, m0), cN = compare(dN, mN);
  check(`frame ${a} vs canvas`, c0.psnr >= 35, `PSNR ${c0.psnr.toFixed(1)} dB, mean ${c0.mean.toFixed(2)}, max ${c0.max}`);
  check(`frame ${b - 1} vs canvas`, cN.psnr >= 35, `PSNR ${cN.psnr.toFixed(1)} dB, mean ${cN.mean.toFixed(2)}, max ${cN.max}`);
  // background: every pixel that is exactly the background in the canvas, decoded. A film whose first
  // frame has no plain background (a gradient, a full-bleed scene) is checked on its most common colour.
  let bg = meta.bg.replace('#', '').match(/../g).map((h) => parseInt(h, 16)), bgName = meta.bg;
  const count = (c) => { let n = 0; for (let i = 0; i < m0.length; i += 3) if (m0[i] === c[0] && m0[i + 1] === c[1] && m0[i + 2] === c[2]) n++; return n; };
  if (count(bg) < m0.length / 3 * 0.01) {
    const hist = new Map();
    for (let i = 0; i < m0.length; i += 3) { const key = (m0[i] << 16) | (m0[i + 1] << 8) | m0[i + 2]; hist.set(key, (hist.get(key) || 0) + 1); }
    const [key] = [...hist.entries()].sort((a, b) => b[1] - a[1])[0];
    bg = [(key >> 16) & 255, (key >> 8) & 255, key & 255]; bgName = `the most common colour rgb(${bg.join(', ')})`;
  }
  let k = 0; const acc = [0, 0, 0];
  for (let i = 0; i < m0.length; i += 3) if (m0[i] === bg[0] && m0[i + 1] === bg[1] && m0[i + 2] === bg[2]) { k++; acc[0] += d0[i]; acc[1] += d0[i + 1]; acc[2] += d0[i + 2]; }
  const got = acc.map((x) => (k ? x / k : NaN));
  const flat = k >= m0.length / 3 * 0.01;
  check('background decodes true', flat && got.every((x, i) => Math.abs(x - bg[i]) <= 2), `${bgName} -> rgb(${got.map((x) => x.toFixed(1)).join(', ')}) over ${k} px`, !flat);
  if (full) {
    const seam = compare(d0, dN);
    if (meta.loop !== 'cycle') check('encoded seam (frame 0 vs last)', seam.psnr >= 40, `PSNR ${seam.psnr.toFixed(1)} dB, mean ${seam.mean.toFixed(2)}, max ${seam.max} (the canvas pixels are identical; this is encoder noise)`, true);
  }
  const size = Number(info.format.size);
  check('mp4 size', true, `${(size / 1e6).toFixed(2)} MB, ${(Number(info.format.bit_rate) / 1e6).toFixed(2)} Mb/s`);
  if (full) {
    const gif = path.join(FILM_DIR, 'renders', `preview${SUF}.gif`), poster = path.join(FILM_DIR, 'renders', `poster${SUF}.png`);
    if (fs.existsSync(gif)) {
      const g = probe(ffprobe, gif).streams[0];
      check('preview gif', fs.statSync(gif).size < 4e6, `${g.width}x${g.height}, ${g.nb_read_frames} frames, ${(fs.statSync(gif).size / 1e6).toFixed(2)} MB (limit 4 MB)`, true);
    } else check('preview gif', false, 'missing', true);
    check('poster', fs.existsSync(poster), fs.existsSync(poster) ? poster : 'missing', true);
    if (meta.transparent) await verifyAlpha(page, meta, ffmpeg, ffprobe, check, poster);
  }
  for (const r of results) console.log(`${r.s.padEnd(4)}  ${r.name.padEnd(32)} ${r.detail}`);
  const fails = results.filter((r) => r.s === 'FAIL').length;
  console.log(fails ? `VERIFY FAIL (${fails})` : full ? 'VERIFY PASS' : `VERIFY PASS (partial render, frames ${a}-${b - 1}; verify the full render before delivering)`);
  if (fails) process.exitCode = 1;
}

// EBU R128 over the whole audio stream: integrated loudness, loudness range, true peak
function loudness(ffmpeg, file, pre = '') {
  const r = spawnSync(ffmpeg, ['-nostdin', '-hide_banner', '-nostats', '-i', file, '-map', '0:a', '-af', `${pre ? `${pre},` : ''}ebur128=peak=true`, '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 28 });
  const sum = r.stderr.slice(r.stderr.lastIndexOf('Summary:'));
  const num = (re) => { const m = re.exec(sum); return m ? Number(m[1]) : NaN; };
  const out = { I: num(/I:\s+(-?[\d.]+) LUFS/), LRA: num(/LRA:\s+(-?[\d.]+) LU/), TP: num(/Peak:\s+(-?[\d.]+|-inf) dBFS/) };
  return isFinite(out.I) ? out : null;
}
// the alpha deliverables of a transparent film: ProRes 4444 and VP9 with an alpha plane, whose decoded alpha
// matches the canvas's (PSNR on the alpha plane), and whose colour over bg matches the MP4's source
async function verifyAlpha(page, meta, ffmpeg, ffprobe, check, poster) {
  // the poster, the review stills, and the frame with the most motion blur (its edges are the ones that fringe)
  const plan = await page.evaluate(() => window.stillsPlan().map((p) => p.frame));
  const blurred = await page.evaluate((N) => { let m = 0, f = 0; for (let n = 0; n < N; n++) { const k = window.motionAt(n).samples; if (k > m) { m = k; f = n; } } return f; }, meta.N);
  const frames = [...new Set([Math.min(meta.N - 1, Math.round((meta.poster || 0) * meta.FPS)), ...plan.slice(0, 4), blurred])].sort((x, y) => x - y);
  const ref = [];
  for (const n of frames) { await page.evaluate((n) => window.renderFrame(n), n); ref.push(Buffer.from(await page.evaluate(() => window.__rgba64()), 'base64')); }
  const bg = hexRGB(meta.bg);
  for (const [ext, codec, dec, minA] of [['mov', 'prores', [], 45], ['webm', 'vp9', ['-c:v', 'libvpx-vp9'], 35]]) {
    const f = path.join(FILM_DIR, 'renders', `${NAME}${SUF}.${ext}`);
    if (!fs.existsSync(f)) { check(`${ext} with alpha`, false, 'missing: render again'); continue; }
    const v = probe(ffprobe, f).streams.find((s) => s.codec_type === 'video');
    const tagAlpha = v.tags && (v.tags.alpha_mode === '1' || v.tags.ALPHA_MODE === '1');
    const hasAlpha = /^yuva/.test(v.pix_fmt) || tagAlpha;
    check(`${ext} with alpha`, v.codec_name === codec && hasAlpha && v.width === meta.W && v.height === meta.H && Number(v.nb_read_frames) === meta.N,
      `${v.codec_name}${v.profile ? ` ${v.profile}` : ''}, ${v.pix_fmt}${tagAlpha ? ' + alpha_mode 1' : ''}, ${v.width}x${v.height}, ${v.nb_read_frames} frames, ${(fs.statSync(f).size / 1e6).toFixed(2)} MB`);
    const sel = frames.map((n) => `eq(n\\,${n})`).join('+');
    const r = spawnSync(ffmpeg, ['-nostdin', '-v', 'error', ...dec, '-i', f, '-vf', `select=${sel},scale=in_color_matrix=bt709:in_range=tv:out_range=pc:flags=accurate_rnd+full_chroma_int,format=rgba`, '-fps_mode', 'passthrough', '-f', 'rawvideo', 'pipe:1'], { maxBuffer: 1 << 30 });
    const sz = meta.W * meta.H * 4;
    if (r.status !== 0 || r.stdout.length < frames.length * sz) { check(`${ext} alpha vs canvas`, false, `could not decode: ${String(r.stderr).trim()}`); continue; }
    let worstA = Infinity, worstC = Infinity, maxA = 0;
    frames.forEach((n, i) => {
      const d = r.stdout.subarray(i * sz, (i + 1) * sz), c = ref[i];
      let se = 0;
      for (let k = 3; k < sz; k += 4) { const e = d[k] - c[k]; se += e * e; if (Math.abs(e) > maxA) maxA = Math.abs(e); }
      const mse = se / (sz / 4);
      worstA = Math.min(worstA, mse ? 10 * Math.log10(255 * 255 / mse) : Infinity);
      worstC = Math.min(worstC, compare(compositeRGB(d, bg), compositeRGB(c, bg)).psnr);
    });
    check(`${ext} alpha vs canvas`, worstA >= minA, `alpha plane PSNR ${worstA.toFixed(1)} dB (at least ${minA}), max ${maxA} levels; over bg PSNR ${worstC.toFixed(1)} dB; frames ${frames.join(', ')}`);
  }
  if (fs.existsSync(poster)) {
    const ct = fs.readFileSync(poster).readUInt8(25);           // PNG IHDR colour type: 6 is RGBA
    check('poster alpha', ct === 6 || ct === 4, ct === 6 || ct === 4 ? 'PNG with an alpha channel' : `PNG colour type ${ct}, no alpha`);
  }
}

// decoded MP4 frames next to the exact canvas: what the viewer will see, and how far it is from the film
async function mp4frames({ page, meta }) {
  const ffmpeg = findBin('ffmpeg');
  const { mp4, a, b } = mp4Target(meta);
  const asked = positional().map(Number);
  let plan;
  if (asked.length) plan = asked.map((f) => ({ frame: f, name: `f-${String(f).padStart(4, '0')}` }));
  else {
    plan = await page.evaluate(() => window.stillsPlan());
    plan.unshift({ frame: 0, name: 'frame-0000' });
    plan.push({ frame: meta.N - 1, name: 'frame-end' });
  }
  plan = [...new Map(plan.filter((p) => Number.isInteger(p.frame) && p.frame >= a && p.frame < b).map((p) => [p.frame, p])).values()].sort((x, y) => x.frame - y.frame);
  if (!plan.length) throw new Error(`no frames to decode in ${a}..${b - 1}`);
  const out = ensure(path.join(FILM_DIR, STILLS, 'mp4'));
  for (const f of fs.readdirSync(out)) if (/\.png$/.test(f)) fs.unlinkSync(path.join(out, f));
  const dec = decodeFrames(ffmpeg, mp4, plan.map((p) => p.frame - a), meta.W, meta.H);
  const cols = 4, cw = Math.round(meta.W / cols / 1.5), ch = Math.round(cw * meta.H / meta.W), rows = Math.ceil(plan.length / cols);
  await page.evaluate(([cols, cw, ch, rows]) => {
    const s = document.createElement('canvas'); s.width = cols * cw; s.height = rows * (ch + 28);
    const x = s.getContext('2d'); x.fillStyle = '#202020'; x.fillRect(0, 0, s.width, s.height);
    window.__sheet = { s, x, cw, ch, cols };
  }, [cols, cw, ch, rows]);
  let worst = Infinity;
  for (let i = 0; i < plan.length; i++) {
    const p = plan[i], c = compare(dec[i], await exactRGB(page, p.frame));
    worst = Math.min(worst, c.psnr);
    const file = `${String(i).padStart(2, '0')}-${p.name}.png`;
    const url = await page.evaluate(([b64, i, label]) => {           // show the decoded pixels on the canvas, save them
      const cv = document.getElementById('c'), x = cv.getContext('2d'), bin = atob(b64), n = cv.width * cv.height;
      const img = x.createImageData(cv.width, cv.height), d = img.data;
      for (let k = 0, j = 0; k < n; k++, j += 3) { d[k * 4] = bin.charCodeAt(j); d[k * 4 + 1] = bin.charCodeAt(j + 1); d[k * 4 + 2] = bin.charCodeAt(j + 2); d[k * 4 + 3] = 255; }
      x.putImageData(img, 0, 0);
      const { s, x: sx, cw, ch, cols } = window.__sheet, cx = (i % cols) * cw, cy = Math.floor(i / cols) * (ch + 28);
      sx.drawImage(cv, cx, cy, cw, ch);
      sx.fillStyle = '#E0E0E0'; sx.font = '500 15px "IBM Plex Mono", monospace'; sx.fillText(label, cx + 6, cy + ch + 19);
      return cv.toDataURL('image/png');
    }, [Buffer.from(dec[i]).toString('base64'), i, `${p.frame} ${p.name}`]);
    fs.writeFileSync(path.join(out, file), Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'));
    console.log(`${file.padEnd(34)} frame ${String(p.frame).padStart(4)}  PSNR ${c.psnr.toFixed(1)} dB, mean ${c.mean.toFixed(2)}, max ${c.max} vs the canvas`);
  }
  const sheet = await page.evaluate(() => window.__sheet.s.toDataURL('image/png'));
  fs.writeFileSync(path.join(out, 'contact.png'), Buffer.from(sheet.slice(sheet.indexOf(',') + 1), 'base64'));
  console.log(`contact sheet ${path.join(out, 'contact.png')}`);
  console.log(`MP4FRAMES ${plan.length} frames decoded from ${path.basename(mp4)}; lowest PSNR ${worst.toFixed(1)} dB${worst < 35 ? '  (under 35 dB: look closely at that frame)' : ''}`);
  if (worst < 35) process.exitCode = 1;
}

// once per machine: is everything the scripts need here?
async function doctor() {
  const rows = [], info = [];
  const row = (ok, what, detail, fix) => rows.push({ ok, what, detail, fix });
  const major = Number(process.versions.node.split('.')[0]);
  row(major >= 20, 'node', `v${process.versions.node}`, 'install Node 20 or newer');
  const pw = resolvePlaywright();
  let pwv = '';
  if (pw) { try { pwv = JSON.parse(fs.readFileSync(path.join(path.dirname(pw), 'package.json'), 'utf8')).version; } catch { /* no version */ } }
  row(!!pw, 'playwright-core', pw ? `${pwv} at ${path.dirname(pw)}` : 'not found in the film folder, the working directory or the skill folder', INSTALL_PW);
  let chrome = null;
  const chromium = pw ? await loadPlaywright().catch(() => null) : null;
  try { chrome = findChrome(chromium || { executablePath: () => { throw new Error('no playwright-core'); } }); } catch { /* none */ }
  row(!!chrome, 'chromium', chrome || 'none found', `${installChromium()}   (or set CHROME_PATH to a Chrome or Chromium binary)`);
  if (chrome && chromium) {                             // WebGL2 matters only to motion-3d: information, never a failure
    let gl = null;
    try {
      const b = await chromium.launch({ executablePath: chrome, headless: true, args: ['--enable-unsafe-swiftshader'] });
      const pg = await b.newPage();
      gl = await pg.evaluate(() => { const g = document.createElement('canvas').getContext('webgl2'); if (!g) return null; const d = g.getExtension('WEBGL_debug_renderer_info'); return d ? g.getParameter(d.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER); });
      await b.close();
    } catch { /* no browser run */ }
    info.push(`webgl2          ${gl ? `${gl}${/swiftshader/i.test(gl) ? '  (software: motion-3d renders, slowly)' : ''}` : 'not available: motion-3d cannot render here'}`);
  }
  for (const bin of ['ffmpeg', 'ffprobe']) {
    let p = null; try { p = findBin(bin); } catch { /* missing */ }
    let ver = '';
    if (p) ver = (spawnSync(p, ['-version'], { encoding: 'utf8' }).stdout || '').split('\n')[0].replace(/ Copyright.*/, '');
    row(!!p, bin, p ? `${ver} at ${p}` : 'not on PATH', `brew install ffmpeg / apt install ffmpeg (or set ${bin.toUpperCase()}_PATH)`);
    if (p && bin === 'ffmpeg') {
      const enc = spawnSync(p, ['-hide_banner', '-encoders'], { encoding: 'utf8', maxBuffer: 1 << 24 }).stdout || '';
      row(/\blibx264\b/.test(enc), 'libx264', /\blibx264\b/.test(enc) ? 'ffmpeg has the H.264 encoder' : 'this ffmpeg was built without libx264', 'install an ffmpeg built with libx264 (the Homebrew and apt builds have it)');
      // only some films need these: information, never a failure
      const has = (e) => new RegExp(`\\b${e}\\b`).test(enc);
      info.push(`aac             ${has('aac') ? 'ffmpeg has the AAC encoder: films with FILM.audio can render' : 'missing: FILM.audio cannot render here'}`);
      info.push(`prores_ks       ${has('prores_ks') ? 'ffmpeg has ProRes 4444: transparent films get a .mov with alpha' : 'missing: a transparent film cannot write its .mov'}`);
      info.push(`libvpx-vp9      ${has('libvpx-vp9') ? 'ffmpeg has VP9: transparent films get a .webm with alpha' : 'missing: a transparent film cannot write its .webm (install an ffmpeg built with libvpx)'}`);
    }
  }
  for (const bin of [process.platform === 'win32' ? 'npm.cmd' : 'npm', 'tar']) {
    const p = which(bin);
    row(!!p, bin, p || 'not on PATH', `install ${bin}; fonts.mjs uses it to fetch the fonts`);
  }
  for (const r of rows) console.log(`${(r.ok ? 'OK' : 'MISSING').padEnd(7)}  ${r.what.padEnd(15)} ${r.detail}${r.ok ? '' : `\n         fix: ${r.fix}`}`);
  for (const l of info) console.log(`INFO     ${l}`);
  const bad = rows.filter((r) => !r.ok).length;
  console.log(bad ? `DOCTOR ${bad} missing` : 'DOCTOR OK: fonts, stills, render and verify can all run here');
  if (bad) process.exitCode = 1;
}

async function debugStills({ page }, kind) {
  const out = ensure(path.join(FILM_DIR, STILLS, 'debug'));
  for (const a of positional()) {
    const v = Number(a);
    if (!Number.isFinite(v)) throw new Error(`${kind}: "${a}" is not a ${kind === 'at' ? 'time' : 'frame number'}`);
    const k = kind === 'at' ? await page.evaluate((x) => window.seek(x), v) && 1 : await page.evaluate((x) => window.renderFrame(x), v);
    const f = path.join(out, kind === 'at' ? `t-${v.toFixed(3)}.png` : `f-${String(v).padStart(4, '0')}.png`);
    fs.writeFileSync(f, await png(page));
    console.log(kind === 'at' ? f : `${f}  (${k} subframes)`);
  }
}

/* ---------------- main ---------------- */
const MODES = { stills, loopcheck, render, verify, mp4frames, at: (f) => debugStills(f, 'at'), frame: (f) => debugStills(f, 'frame'),
  layout: async ({ page }) => console.log(JSON.stringify(await page.evaluate(() => window.layoutTable()), null, 1)) };
if (mode === 'doctor') { await doctor(); process.exit(); }
if (!MODES[mode]) { console.error(`unknown mode "${mode}"`); process.exit(2); }
const film = await openFilm();
try {
  await MODES[mode](film);
} catch (e) {
  console.error(String(e.stack || e));
  process.exitCode = 1;
} finally {
  if (film.errors.length) { console.error('page errors:\n' + film.errors.join('\n')); process.exitCode = 1; }
  await film.browser.close();
}
