#!/usr/bin/env node
// Which characters does a WOFF2 font really contain? Reads its cmap (Unicode -> glyph) table.
//
//   node <skill>/scripts/cmap.mjs <font.woff2> "TEXT TO CHECK"
//
// The browser cannot answer this: a missing glyph silently falls back to another font. So the
// render script reads the cmap of every embedded face and checks the film's text against it.
// No dependencies: WOFF2 is a Brotli stream, and Node's zlib decodes Brotli.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const KNOWN = ['cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm', 'glyf', 'loca', 'prep', 'CFF ', 'VORG', 'EBDT', 'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH', 'PCLT', 'VDMX', 'vhea', 'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB', 'EBSC', 'JSTF', 'MATH', 'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt', 'avar', 'bdat', 'bloc', 'bsln', 'cvar', 'fdsc', 'feat', 'fmtx', 'fvar', 'gvar', 'hsty', 'just', 'lcar', 'mort', 'morx', 'opbd', 'prop', 'trak', 'Zapf', 'Silf', 'Glat', 'Gloc', 'Feat', 'Sill'];

function tablesOfWoff2(buf) {
  if (buf.toString('latin1', 0, 4) !== 'wOF2') throw new Error('not a WOFF2 file');
  if (buf.toString('latin1', 4, 8) === 'ttcf') throw new Error('font collections are not supported');
  const numTables = buf.readUInt16BE(12), compressed = buf.readUInt32BE(20);
  let off = 48;
  const base128 = () => { let v = 0; for (let i = 0; i < 5; i++) { const b = buf[off++]; v = v * 128 + (b & 0x7f); if (!(b & 0x80)) return v; } throw new Error('bad UIntBase128'); };
  const dir = [];
  for (let i = 0; i < numTables; i++) {
    const flags = buf[off++], idx = flags & 0x3f, ver = flags >> 6;
    const tag = idx === 63 ? buf.toString('latin1', off, (off += 4)) : KNOWN[idx];
    const orig = base128();
    const transformed = tag === 'glyf' || tag === 'loca' ? ver === 0 : ver !== 0;
    const len = transformed ? base128() : orig;
    dir.push({ tag, len });
  }
  const data = zlib.brotliDecompressSync(buf.subarray(off, off + compressed));
  const tables = {};
  let p = 0;
  for (const t of dir) { tables[t.tag] = data.subarray(p, p + t.len); p += t.len; }
  return tables;
}

export function woff2Cmap(file) {
  const cmap = tablesOfWoff2(fs.readFileSync(file)).cmap;
  if (!cmap) throw new Error(`${file} has no cmap table`);
  const n = cmap.readUInt16BE(2), subs = [];
  for (let i = 0; i < n; i++) subs.push({ pid: cmap.readUInt16BE(4 + i * 8), eid: cmap.readUInt16BE(6 + i * 8), off: cmap.readUInt32BE(8 + i * 8) });
  const rank = (s) => { const f = cmap.readUInt16BE(s.off); return (f === 12 ? 10 : f === 4 ? 5 : 0) + (s.pid === 3 ? 1 : 0); };
  const best = subs.filter((s) => [4, 12].includes(cmap.readUInt16BE(s.off))).sort((a, b) => rank(b) - rank(a))[0];
  if (!best) throw new Error(`${file}: no Unicode cmap subtable (format 4 or 12)`);
  const set = new Set(), o = best.off, fmt = cmap.readUInt16BE(o);
  if (fmt === 12) {
    const groups = cmap.readUInt32BE(o + 12);
    for (let g = 0; g < groups; g++) {
      const s = cmap.readUInt32BE(o + 16 + g * 12), e = cmap.readUInt32BE(o + 20 + g * 12), gid = cmap.readUInt32BE(o + 24 + g * 12);
      for (let c = s; c <= e; c++) if (gid + (c - s) !== 0) set.add(c);
    }
  } else {
    const seg = cmap.readUInt16BE(o + 6) / 2;
    const ends = o + 14, starts = ends + seg * 2 + 2, deltas = starts + seg * 2, ranges = deltas + seg * 2;
    for (let i = 0; i < seg; i++) {
      const end = cmap.readUInt16BE(ends + i * 2), start = cmap.readUInt16BE(starts + i * 2);
      const delta = cmap.readInt16BE(deltas + i * 2), ro = cmap.readUInt16BE(ranges + i * 2);
      for (let c = start; c <= end && c !== 0xffff; c++) {
        let gid;
        if (ro === 0) gid = (c + delta) & 0xffff;
        else { const at = ranges + i * 2 + ro + (c - start) * 2; gid = at + 1 < cmap.length ? cmap.readUInt16BE(at) : 0; if (gid) gid = (gid + delta) & 0xffff; }
        if (gid) set.add(c);
      }
    }
  }
  return set;
}

export function missingChars(file, text) {
  const have = woff2Cmap(file);
  return [...new Set(Array.from(text))].filter((c) => !/\s/.test(c) && !have.has(c.codePointAt(0)));
}

// @font-face rules of a film source: family + weight -> embedded woff2 file name
export function fontFaces(html) {
  const out = [];
  for (const m of html.matchAll(/@font-face\s*{([^}]*)}/g)) {
    const body = m[1];
    const fam = /font-family\s*:\s*["']?([^;"']+)["']?/.exec(body), wt = /font-weight\s*:\s*(\d+)/.exec(body), file = /__FONT:([A-Za-z0-9._-]+\.woff2)__/.exec(body);
    if (fam && file) out.push({ family: fam[1].trim(), weight: wt ? wt[1] : '400', file: file[1] });
  }
  return out;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const [file, text] = process.argv.slice(2);
  if (!file) { console.error('usage: node cmap.mjs <font.woff2> ["text"]'); process.exit(2); }
  const set = woff2Cmap(file);
  console.log(`${path.basename(file)}: ${set.size} characters`);
  if (text) {
    const miss = missingChars(file, text);
    console.log(miss.length ? `MISSING ${miss.map((c) => `"${c}" U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`).join(', ')}` : 'all present');
    if (miss.length) process.exitCode = 1;
  }
}
