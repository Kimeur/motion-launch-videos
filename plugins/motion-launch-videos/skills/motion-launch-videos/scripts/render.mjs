#!/usr/bin/env node
// Drive a motion-launch-videos film in headless Chromium.
//
//   node <skill>/scripts/render.mjs <mode> <filmDir> [options]
//   node <skill>/scripts/render.mjs doctor
//
// Modes
//   doctor              check this machine once: Node, playwright-core, a Chromium, ffmpeg with libx264,
//                       ffprobe, npm and tar; prints the command that fixes each missing piece
//   stills              build, run the automated critique, write review stills + a contact sheet to stills/
//   loopcheck           pixel-diff the seam and the purity of seek(); every diff must be 0
//   render              stream every motion-blurred frame into ffmpeg: renders/<name>.mp4,
//                       renders/preview.gif and renders/poster.png
//     --range a:b       only frames a..b-1, to renders/<name>-f<a>-<b>.mp4 (a quick check)
//     --crf 16          x264 quality (lower is bigger)
//     --gif-fps 20 --gif-width 480 --gif-colors 64
//   verify              ffprobe facts, colour tags, faststart, decoded frames vs the exact canvas pixels
//     --mp4 <file>      verify another render of this film (default renders/<name>.mp4)
//   mp4frames [n ...]   decode frames from the MP4 (default: the review-stills plan) to stills/mp4/,
//                       with a contact sheet and each frame's PSNR against the exact canvas
//     --mp4 <file>      decode another render (a --range render: n counts from its first frame)
//   at 2.5 7.25 ...     sharp seek(t) stills to stills/debug/
//   frame 150 390 ...   motion-blurred renderFrame(n) stills to stills/debug/
//   layout              print the measured layout table as JSON
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
const ensure = (d) => { fs.mkdirSync(d, { recursive: true }); return d; };

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
  return p ? `node "${path.join(path.dirname(p), 'cli.js')}" install chromium` : `npx playwright-core install chromium`;
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
    args: ['--force-color-profile=srgb', '--disable-lcd-text', '--font-render-hinting=none'],
  });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(pathToFileURL(htmlPath).href + '?capture=1');
  try { await page.evaluate(() => window.ready); }
  catch (e) { await browser.close(); throw new Error(`the film failed to start: ${e.message}\n${errors.join('\n')}`); }
  const meta = await page.evaluate(() => ({ W: window.WIDTH, H: window.HEIGHT, FPS: window.FPS, DUR: window.DURATION, ...window.FILM_META }));
  meta.N = Math.round(meta.DUR * meta.FPS);
  await page.setViewportSize({ width: meta.W, height: meta.H });
  await page.evaluate(() => {
    const c = document.getElementById('c'), x = c.getContext('2d');
    window.__grab = () => x.getImageData(0, 0, c.width, c.height).data;
    window.__rgb64 = () => {                               // exact canvas pixels as base64 RGB
      const d = x.getImageData(0, 0, c.width, c.height).data, n = c.width * c.height, rgb = new Uint8Array(n * 3);
      for (let i = 0, j = 0; i < n * 4; i += 4, j += 3) { rgb[j] = d[i]; rgb[j + 1] = d[i + 1]; rgb[j + 2] = d[i + 2]; }
      let s = '';
      for (let i = 0; i < rgb.length; i += 0x8000) s += String.fromCharCode.apply(null, rgb.subarray(i, i + 0x8000));
      return btoa(s);
    };
  });
  console.log(`${NAME}: ${meta.W}x${meta.H}, ${meta.FPS} fps, ${meta.DUR} s (${meta.N} frames), chromium ${exe}`);
  return { browser, page, meta, errors, htmlPath };
}
const png = async (page) => { const u = await page.evaluate(() => document.getElementById('c').toDataURL('image/png')); return Buffer.from(u.slice(u.indexOf(',') + 1), 'base64'); };

/* ---------------- modes ---------------- */
// every character on screen must be in the face that draws it (read from the font's cmap)
async function coverageChecks(page) {
  const faces = fontFaces(fs.readFileSync(path.join(FILM_DIR, 'src', 'film.html'), 'utf8'));
  const text = await page.evaluate(() => window.textByFace());
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
  const w = Math.max(...checks.map((c) => c.name.length));
  for (const c of checks) if (c.status !== 'PASS' || process.env.VERBOSE) console.log(`${c.status.padEnd(4)}  ${c.name.padEnd(w)}  ${c.detail}`);
  const nFail = checks.filter((c) => c.status === 'FAIL').length, nWarn = checks.filter((c) => c.status === 'WARN').length;
  console.log(`CRITIQUE ${checks.length} checks: ${checks.length - nFail - nWarn} pass, ${nWarn} warn, ${nFail} fail`);
  if (nFail) failed = true;

  // palette: sharp accent frames from 1 before to 3 after each impact
  const mis = await page.evaluate(() => window.misFrames());
  const frames = [...new Set(mis.flatMap((m) => [m.frame - 1, m.frame, m.frame + 1, m.frame + 2, m.frame + 3]))].filter((f) => f >= 0 && f < meta.N).sort((a, b) => a - b);
  if (frames.length) {
    const sharp = await page.evaluate((fr) => window.offPalette(fr, 'seek'), frames);
    const bad = sharp.filter((s) => s.area > 0);
    for (const s of bad) console.log(`FAIL  palette frame ${s.frame}: ${s.area} px of mixed ink ${s.top}`);
    console.log(bad.length ? 'GATE palette FAIL' : `GATE palette PASS (${frames.length} accent frames, no mixed ink wider than the 1-px fringe)`);
    if (bad.length) failed = true;
  }

  const out = ensure(path.join(FILM_DIR, 'stills'));
  for (const f of fs.readdirSync(out)) if (/\.png$/.test(f)) fs.unlinkSync(path.join(out, f));
  const plan = await page.evaluate(() => window.stillsPlan());
  plan.unshift({ frame: 0, name: 'frame-0000', what: 'frame 0 (the loop point)' });
  plan.push({ frame: meta.N - 1, name: 'frame-end', what: 'last frame, must equal frame 0' });
  const cols = 4, cw = Math.round(meta.W / cols / 1.5), ch = Math.round(cw * meta.H / meta.W), rows = Math.ceil(plan.length / cols);
  await page.evaluate(([cols, cw, ch, rows]) => {
    const s = document.createElement('canvas'); s.width = cols * cw; s.height = rows * (ch + 28);
    const x = s.getContext('2d'); x.fillStyle = '#202020'; x.fillRect(0, 0, s.width, s.height);
    window.__sheet = { s, x, cw, ch, cols };
  }, [cols, cw, ch, rows]);
  for (let i = 0; i < plan.length; i++) {
    const p = plan[i];
    const k = await page.evaluate((n) => window.renderFrame(n), p.frame);
    const file = `${String(i).padStart(2, '0')}-${p.name}.png`;
    fs.writeFileSync(path.join(out, file), await png(page));
    await page.evaluate(([i, label]) => {
      const { s, x, cw, ch, cols } = window.__sheet, c = document.getElementById('c');
      const cx = (i % cols) * cw, cy = Math.floor(i / cols) * (ch + 28);
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
  const r = await page.evaluate(({ N, FPS, DUR }) => {
    const grab = () => window.__grab().slice();
    const diff = (a, b) => { let m = 0, n = 0; for (let i = 0; i < a.length; i++) { const d = Math.abs(a[i] - b[i]); if (d) n++; if (d > m) m = d; } return { max: m, n }; };
    const at = (t) => { window.seek(t); return grab(); };
    const fr = (n) => { window.renderFrame(n); return grab(); };
    const s0 = at(0), res = {};
    res[`seek(0) vs seek(${DUR})`] = diff(s0, at(DUR));
    res[`seek(0) vs seek(DUR - 1 frame)`] = diff(s0, at(DUR - 1 / FPS));
    res[`seek(0) vs seek(DUR - 1.75 frames)`] = diff(s0, at(DUR - 1.75 / FPS));
    res['renderFrame(0) vs seek(0)'] = diff(fr(0), s0);
    res[`renderFrame(0) vs renderFrame(${N - 1})`] = diff(fr(0), fr(N - 1));
    const a = DUR * 0.37, b = DUR * 0.81, c = DUR * 0.12;
    const fresh = at(a); at(b); at(c);
    res['seek purity (same t after other seeks)'] = diff(fresh, at(a));
    const m = Math.round(N * 0.45), f1 = fr(m); fr(Math.round(N * 0.2));
    res['renderFrame purity (repeat)'] = diff(f1, fr(m));
    let hold = 0;                                          // frames at the tail identical to frame 0
    for (let n = N - 1; n > 0 && hold < N; n--) { if (diff(s0, at(n / FPS)).max) break; hold++; }
    return { res, hold };
  }, meta);
  let worst = 0;
  for (const [k, v] of Object.entries(r.res)) { console.log(`${k.padEnd(44)} max channel diff ${v.max}  (channels differing: ${v.n})`); worst = Math.max(worst, v.max); }
  console.log(`static tail: the last ${r.hold} frames equal frame 0`);
  console.log(worst === 0 ? 'LOOPCHECK PASS (max diff 0)' : `LOOPCHECK FAIL (max diff ${worst})`);
  if (worst !== 0) process.exitCode = 1;
}

async function render({ page, meta }) {
  const ffmpeg = findBin('ffmpeg');
  const [a, b] = (opt('range', `0:${meta.N}`)).split(':').map(Number);
  if (!(a >= 0 && b <= meta.N && a < b)) throw new Error(`bad --range ${a}:${b} (0..${meta.N})`);
  const full = a === 0 && b === meta.N;
  const outDir = ensure(path.join(FILM_DIR, 'renders'));
  const mp4 = path.join(outDir, full ? `${NAME}.mp4` : `${NAME}-f${a}-${b}.mp4`);
  const gif = path.join(outDir, 'preview.gif');
  const crf = opt('crf', '16'), gfps = opt('gif-fps', '20'), gw = opt('gif-width', '480'), gcol = opt('gif-colors', '64');
  const x264 = ['-c:v', 'libx264', '-preset', 'slow', '-crf', crf, '-pix_fmt', 'yuv420p',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv',
    '-bsf:v', 'h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1:video_full_range_flag=0',
    '-r', String(meta.FPS), '-movflags', '+faststart'];
  const input = ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${meta.W}x${meta.H}`, '-framerate', String(meta.FPS), '-i', 'pipe:0'];
  const toYuv = 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p';
  const args = full
    ? [...input, '-filter_complex',
      `[0:v]split=2[m][g];[m]${toYuv}[v];[g]fps=${gfps},scale=${gw}:-2:flags=lanczos,split[g1][g2];[g1]palettegen=max_colors=${gcol}:stats_mode=full[p];[g2][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle[gif]`,
      '-map', '[v]', ...x264, mp4, '-map', '[gif]', '-loop', '0', gif]
    : [...input, '-vf', toYuv, ...x264, mp4];
  const ff = spawn(ffmpeg, args, { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = once(ff, 'close');
  ff.stdin.on('error', () => {});
  const t0 = Date.now(), hist = {};
  for (let n = a; n < b; n++) {
    const [k, b64] = await page.evaluate((n) => [window.renderFrame(n), window.__rgb64()], n);
    hist[k] = (hist[k] || 0) + 1;
    if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await once(ff.stdin, 'drain');
    if ((n + 1 - a) % meta.FPS === 0 || n === b - 1) {
      const s = (Date.now() - t0) / 1000, fps = (n + 1 - a) / s;
      console.log(`frame ${n + 1}/${b}  ${s.toFixed(0)} s  ${fps.toFixed(1)} fps  eta ${((b - n - 1) / fps).toFixed(0)} s`);
    }
  }
  ff.stdin.end();
  const [code] = await done;
  if (code !== 0) throw new Error(`ffmpeg exited with ${code}`);
  console.log(`subframes per frame: ${Object.entries(hist).map(([k, v]) => `${k}x${v}`).join(', ')}`);
  console.log(`wrote ${mp4} (${(fs.statSync(mp4).size / 1e6).toFixed(2)} MB)`);
  if (full) {
    console.log(`wrote ${gif} (${(fs.statSync(gif).size / 1e6).toFixed(2)} MB)${fs.statSync(gif).size > 4e6 ? '  over 4 MB: try --gif-fps 15 or --gif-colors 32' : ''}`);
    const pf = Math.min(meta.N - 1, Math.round((meta.poster || 0) * meta.FPS));
    await page.evaluate((n) => window.renderFrame(n), pf);
    fs.writeFileSync(path.join(outDir, 'poster.png'), await png(page));
    console.log(`wrote ${path.join(outDir, 'poster.png')} (frame ${pf})`);
  }
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
  const mp4 = path.resolve(opt('mp4', path.join(FILM_DIR, 'renders', `${NAME}.mp4`)));
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
  check('audio', !info.streams.some((s) => s.codec_type === 'audio'), info.streams.map((s) => s.codec_type).join(', '), true);
  const atoms = atomOrder(mp4);
  check('faststart', atoms.indexOf('moov') >= 0 && atoms.indexOf('moov') < atoms.indexOf('mdat'), atoms.join(' > '));

  const [d0, dN] = decodeFrames(ffmpeg, mp4, [0, n - 1], meta.W, meta.H);
  const m0 = await exactRGB(page, a), mN = await exactRGB(page, b - 1);
  const c0 = compare(d0, m0), cN = compare(dN, mN);
  check(`frame ${a} vs canvas`, c0.psnr >= 35, `PSNR ${c0.psnr.toFixed(1)} dB, mean ${c0.mean.toFixed(2)}, max ${c0.max}`);
  check(`frame ${b - 1} vs canvas`, cN.psnr >= 35, `PSNR ${cN.psnr.toFixed(1)} dB, mean ${cN.mean.toFixed(2)}, max ${cN.max}`);
  // background: every pixel that is exactly the background in the canvas, decoded
  const bg = meta.bg.replace('#', '').match(/../g).map((h) => parseInt(h, 16));
  let k = 0; const acc = [0, 0, 0];
  for (let i = 0; i < m0.length; i += 3) if (m0[i] === bg[0] && m0[i + 1] === bg[1] && m0[i + 2] === bg[2]) { k++; acc[0] += d0[i]; acc[1] += d0[i + 1]; acc[2] += d0[i + 2]; }
  const got = acc.map((x) => (k ? x / k : NaN));
  check('background decodes true', k > 0 && got.every((x, i) => Math.abs(x - bg[i]) <= 2), `${meta.bg} -> rgb(${got.map((x) => x.toFixed(1)).join(', ')}) over ${k} px`);
  if (full) {
    const seam = compare(d0, dN);
    check('encoded seam (frame 0 vs last)', seam.psnr >= 40, `PSNR ${seam.psnr.toFixed(1)} dB, mean ${seam.mean.toFixed(2)}, max ${seam.max} (the canvas pixels are identical; this is encoder noise)`, true);
  }
  const size = Number(info.format.size);
  check('mp4 size', true, `${(size / 1e6).toFixed(2)} MB, ${(Number(info.format.bit_rate) / 1e6).toFixed(2)} Mb/s`);
  if (full) {
    const gif = path.join(FILM_DIR, 'renders', 'preview.gif'), poster = path.join(FILM_DIR, 'renders', 'poster.png');
    if (fs.existsSync(gif)) {
      const g = probe(ffprobe, gif).streams[0];
      check('preview gif', fs.statSync(gif).size < 4e6, `${g.width}x${g.height}, ${g.nb_read_frames} frames, ${(fs.statSync(gif).size / 1e6).toFixed(2)} MB (limit 4 MB)`, true);
    } else check('preview gif', false, 'missing', true);
    check('poster', fs.existsSync(poster), fs.existsSync(poster) ? poster : 'missing', true);
  }
  for (const r of results) console.log(`${r.s.padEnd(4)}  ${r.name.padEnd(32)} ${r.detail}`);
  const fails = results.filter((r) => r.s === 'FAIL').length;
  console.log(fails ? `VERIFY FAIL (${fails})` : full ? 'VERIFY PASS' : `VERIFY PASS (partial render, frames ${a}-${b - 1}; verify the full render before delivering)`);
  if (fails) process.exitCode = 1;
}

// decoded MP4 frames next to the exact canvas: what the viewer will see, and how far it is from the film
async function mp4frames({ page, meta }) {
  const ffmpeg = findBin('ffmpeg');
  const { mp4, a, b } = mp4Target(meta);
  const asked = rest.filter((x, i) => !x.startsWith('--') && !(i > 0 && rest[i - 1] === '--mp4')).map(Number);
  let plan;
  if (asked.length) plan = asked.map((f) => ({ frame: f, name: `f-${String(f).padStart(4, '0')}` }));
  else {
    plan = await page.evaluate(() => window.stillsPlan());
    plan.unshift({ frame: 0, name: 'frame-0000' });
    plan.push({ frame: meta.N - 1, name: 'frame-end' });
  }
  plan = [...new Map(plan.filter((p) => Number.isInteger(p.frame) && p.frame >= a && p.frame < b).map((p) => [p.frame, p])).values()].sort((x, y) => x.frame - y.frame);
  if (!plan.length) throw new Error(`no frames to decode in ${a}..${b - 1}`);
  const out = ensure(path.join(FILM_DIR, 'stills', 'mp4'));
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
  const rows = [];
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
  for (const bin of ['ffmpeg', 'ffprobe']) {
    let p = null; try { p = findBin(bin); } catch { /* missing */ }
    let ver = '';
    if (p) ver = (spawnSync(p, ['-version'], { encoding: 'utf8' }).stdout || '').split('\n')[0].replace(/ Copyright.*/, '');
    row(!!p, bin, p ? `${ver} at ${p}` : 'not on PATH', `brew install ffmpeg / apt install ffmpeg (or set ${bin.toUpperCase()}_PATH)`);
    if (p && bin === 'ffmpeg') {
      const enc = spawnSync(p, ['-hide_banner', '-encoders'], { encoding: 'utf8', maxBuffer: 1 << 24 }).stdout || '';
      row(/\blibx264\b/.test(enc), 'libx264', /\blibx264\b/.test(enc) ? 'ffmpeg has the H.264 encoder' : 'this ffmpeg was built without libx264', 'install an ffmpeg built with libx264 (the Homebrew and apt builds have it)');
    }
  }
  for (const bin of [process.platform === 'win32' ? 'npm.cmd' : 'npm', 'tar']) {
    const p = which(bin);
    row(!!p, bin, p || 'not on PATH', `install ${bin}; fonts.mjs uses it to fetch the fonts`);
  }
  for (const r of rows) console.log(`${(r.ok ? 'OK' : 'MISSING').padEnd(7)}  ${r.what.padEnd(15)} ${r.detail}${r.ok ? '' : `\n         fix: ${r.fix}`}`);
  const bad = rows.filter((r) => !r.ok).length;
  console.log(bad ? `DOCTOR ${bad} missing` : 'DOCTOR OK: fonts, stills, render and verify can all run here');
  if (bad) process.exitCode = 1;
}

async function debugStills({ page }, kind) {
  const out = ensure(path.join(FILM_DIR, 'stills', 'debug'));
  for (const a of rest.filter((x) => !x.startsWith('--'))) {
    const v = Number(a);
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
