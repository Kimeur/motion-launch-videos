#!/usr/bin/env node
// Build the film's single self-contained HTML file.
//
//   node <skill>/scripts/build.mjs <filmDir> [--src src/film.html]
//
// Reads <filmDir>/src/film.html, replaces every __FONT:<file>__ token with the base64 of
// <filmDir>/fonts/<file> and every __ASSET:<path>__ token with a data: URL of <filmDir>/<path>
// (images, audio, subtitles), adds a comment crediting each embedded font under its OFL, and writes
// <filmDir>/<name>.html, where <name> is the folder's name. It fails when a font file is missing,
// when a token is left over, or when the page would load anything over the network.
// It also copies FILM.title, FILM.palette.bg and FILM.W x FILM.H into the page's <title>, its CSS
// background and the <canvas> size, so the file reads right before its script runs (and to
// anything that reads the HTML without running it). Only literal values are copied.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function build(filmDir, srcRel = path.join('src', 'film.html')) {
  const dir = path.resolve(filmDir);
  const name = path.basename(dir);
  const srcPath = path.join(dir, srcRel);
  if (!fs.existsSync(srcPath)) throw new Error(`no ${srcPath}. Copy <skill>/templates/film.html there first.`);
  let html = fs.readFileSync(srcPath, 'utf8');
  html = syncHead(html);

  const credits = [];
  html = html.replace(/__FONT:([A-Za-z0-9._-]+\.woff2)__/g, (_, file) => {
    const f = path.join(dir, 'fonts', file);
    if (!fs.existsSync(f)) throw new Error(`missing fonts/${file}. Run: node <skill>/scripts/fonts.mjs ${filmDir}`);
    const pkg = file.replace(/-(latin|latin-ext|cyrillic|greek|vietnamese)(-ext)?-\d+-(normal|italic)\.woff2$/, '');
    const ofl = path.join(dir, 'fonts', `OFL-${pkg}.txt`);
    const line = fs.existsSync(ofl) ? fs.readFileSync(ofl, 'utf8').split('\n')[0].split(/(?<=\.)\s/)[0].trim() : 'licence text not found';
    credits.push(`${file}: ${line}`);
    return fs.readFileSync(f).toString('base64');
  });

  // __ASSET:<path>__ becomes a data: URL of <filmDir>/<path> (images, audio, subtitles, JSON): the user's own
  // screenshots, photos, voice-over or music, embedded like the fonts so nothing loads at runtime
  html = html.replace(/__ASSET:([A-Za-z0-9._\/-]+)__/g, (_, rel) => {
    const f = path.resolve(dir, rel);
    if (!f.startsWith(dir + path.sep)) throw new Error(`asset ${rel} is outside the film folder`);
    if (!fs.existsSync(f)) throw new Error(`missing asset ${rel} (put it in ${dir})`);
    const mime = ASSET_TYPES[path.extname(f).slice(1).toLowerCase()];
    if (!mime) throw new Error(`asset ${rel}: unknown type (${Object.keys(ASSET_TYPES).join(', ')})`);
    return `data:${mime};base64,${fs.readFileSync(f).toString('base64')}`;
  });

  const left = html.match(/__(?:FONT|ASSET)[^_]*__/);
  if (left) throw new Error(`unreplaced token ${left[0]} in ${srcRel}`);
  const external = [
    /<(?:script|link|img|iframe|video|audio|source)\b[^>]*\b(?:src|href)\s*=\s*["']?(?:https?:)?\/\//i,
    /url\(\s*["']?(?:https?:)?\/\//i,
    /@import\b/i,
    /\bfetch\s*\(/,
  ].find((re) => re.test(html));
  if (external) throw new Error(`${srcRel} loads something over the network (${external}); the film must be one self-contained file`);

  if (credits.length) {
    const note = `<!-- Fonts embedded under the SIL Open Font License 1.1:\n     ${credits.join('\n     ')} -->\n`;
    html = html.replace(/^(<!doctype html>\s*)/i, `$1${note}`);
  }
  const out = path.join(dir, `${name}.html`);
  fs.writeFileSync(out, html);
  return out;
}

const ASSET_TYPES = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml',
  mp3: 'audio/mpeg', m4a: 'audio/mp4', aac: 'audio/aac', wav: 'audio/wav', ogg: 'audio/ogg', opus: 'audio/ogg',
  json: 'application/json', srt: 'text/plain', vtt: 'text/vtt', txt: 'text/plain' };

// the static head follows FILM: <title>, the page background and the canvas size
function syncHead(html) {
  const at = html.search(/\bconst FILM\s*=\s*\{/);
  if (at < 0) return html;
  const film = html.slice(at);
  const str = (key) => {
    const m = new RegExp(`\\b${key}:\\s*(['"\`])((?:(?!\\1)[^\\\\]|\\\\.)*)\\1`).exec(film);
    return m && !/\$\{/.test(m[2]) ? m[2].replace(/\\(.)/g, '$1') : null;
  };
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const title = str('title');
  if (title != null) html = html.replace(/<title>[^<]*<\/title>/i, `<title>${esc(title)}</title>`);
  const bg = str('bg');
  if (bg && /^#[0-9A-Fa-f]{3}(?:[0-9A-Fa-f]{3})?$/.test(bg)) html = html.replace(/(html,\s*body\s*\{[^}]*?background:\s*)#[0-9A-Fa-f]{3,8}/i, `$1${bg}`);
  const wh = /\bW:\s*(\d+)\s*,\s*H:\s*(\d+)\b/.exec(film);
  if (wh) html = html.replace(/<canvas id="c" width="\d+" height="\d+">/, `<canvas id="c" width="${wh[1]}" height="${wh[2]}">`);
  return html;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  if (!args.length) { console.error('usage: node build.mjs <filmDir> [--src src/film.html]'); process.exit(2); }
  const i = args.indexOf('--src');
  const out = build(args[0], i > 0 ? args[i + 1] : undefined);
  console.log(`wrote ${out} (${fs.statSync(out).size} bytes)`);
}
