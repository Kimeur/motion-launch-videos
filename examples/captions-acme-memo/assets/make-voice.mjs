// Make the demo voice-over: every word synthesised on its own by espeak-ng, trimmed to its sound, and laid end to
// end with known gaps, so each word's start and end are exact. A gentle compressor evens the level (a podcast
// producer's usual step); it moves no word. Writes voice.wav, voice.mp3 and words.json.
//   node make-voice.mjs <outDir>
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const OUT = path.resolve(process.argv[2] || '.');
fs.mkdirSync(OUT, { recursive: true });
const TMP = fs.mkdtempSync(path.join(OUT, '.words-'));
const SCRIPT = [
  'Most people scroll with the sound off.',
  'So, um, if your video talks, it should also read.',
  'Acme Memo turns what you say into captions, word by word, in time with your voice.',
  'Try it at example.com.',
];
const STRESS = new Set(['off.', 'read.', 'captions,']);   // said a little higher and louder
const VOICE = 'en-us+m3', SPEED = 195, RATE = 22050;
const LEAD = 0.40, GAP = 0.045, COMMA = 0.20, STOP = 0.42, TAIL = 1.10, PRE = 0.008, POST = 0.020;

function readWav(f) {
  const b = fs.readFileSync(f);
  let p = 12, data = null;
  while (p < b.length) { const id = b.toString('ascii', p, p + 4), n = b.readUInt32LE(p + 4); if (id === 'data') data = b.subarray(p + 8, p + 8 + n); p += 8 + n + (n & 1); }
  const s = new Int16Array(data.length / 2);
  for (let i = 0; i < s.length; i++) s[i] = data.readInt16LE(2 * i);
  return s;
}
function writeWav(f, s) {
  const b = Buffer.alloc(44 + s.length * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + s.length * 2, 4); b.write('WAVE', 8); b.write('fmt ', 12);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(RATE, 24); b.writeUInt32LE(RATE * 2, 28);
  b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(s.length * 2, 40);
  for (let i = 0; i < s.length; i++) b.writeInt16LE(s[i], 44 + 2 * i);
  fs.writeFileSync(f, b);
}
// the word's sound: the first and last 5 ms window whose RMS passes 2 % of full scale
function span(s) {
  const w = Math.round(RATE * 0.005), thr = 0.02 * 32768;
  let a = -1, z = -1;
  for (let i = 0; i + w <= s.length; i += w) {
    let e = 0; for (let j = i; j < i + w; j++) e += s[j] * s[j];
    if (Math.sqrt(e / w) > thr) { if (a < 0) a = i; z = i + w; }
  }
  return [a, z];
}

const parts = [], words = [];
let t = LEAD;
const tokens = SCRIPT.flatMap((line) => line.split(' '));
tokens.forEach((tok, i) => {
  const f = path.join(TMP, `w${i}.wav`);
  const say = /[.,?!]$/.test(tok) ? tok : `${tok},`;       // a comma keeps the pitch up mid-phrase
  const stress = STRESS.has(tok);
  execFileSync('espeak-ng', ['-v', VOICE, '-s', String(SPEED), '-p', stress ? '62' : '48', '-a', stress ? '150' : '120', '-w', f, say]);
  const s = readWav(f), [a, z] = span(s);
  const from = Math.max(0, a - Math.round(PRE * RATE)), to = Math.min(s.length, z + Math.round(POST * RATE));
  const clip = s.subarray(from, to);
  const start = t + (a - from) / RATE, end = t + (z - from) / RATE;
  parts.push({ at: Math.round(t * RATE), clip });
  words.push({ word: tok, start: +start.toFixed(3), end: +end.toFixed(3) });
  t += clip.length / RATE + (/[.?!]$/.test(tok) ? STOP : /,$/.test(tok) ? COMMA : GAP);
});
const last = words[words.length - 1].end;
const total = Math.ceil((last + TAIL) * 4) / 4;                // a whole quarter second
const out = new Int16Array(Math.round(total * RATE));
for (const p of parts) out.set(p.clip, p.at);
writeWav(path.join(OUT, 'voice.wav'), out);
fs.writeFileSync(path.join(OUT, 'words.json'), '[\n' + words.map((w) => '  ' + JSON.stringify(w)).join(',\n') + '\n]\n');
execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', path.join(OUT, 'voice.wav'), '-af', 'acompressor=threshold=0.05:ratio=6:attack=0.5:release=50:makeup=4', '-ar', '48000', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '64k', path.join(OUT, 'voice.mp3')]);
fs.rmSync(TMP, { recursive: true, force: true });
console.log(`${words.length} words, last ends at ${last.toFixed(3)} s, file ${total} s`);
