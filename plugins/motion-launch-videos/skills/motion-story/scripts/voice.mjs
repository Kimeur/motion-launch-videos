#!/usr/bin/env node
// The voice-over of a story film, from the lines in its FILM block.
//
//   node voice.mjs videos/<film>                 speak every line, time every word, set DUR
//   node voice.mjs videos/<film> --check         print the script and its word count, speak nothing
//
// For each scene's `say` lines it:
//   1. speaks the line with Kokoro on this machine (`npx hyperframes tts`, the text passed in a .txt file, never on a
//      command line; set HYPERFRAMES_PYTHON to a Python that has kokoro-onnx and soundfile), one WAV per line in
//      assets/voice/ (kept, and reused while the text, voice and speed stay the same);
//   2. times every word of the line with a local transcription (`npx hyperframes transcribe`, whisper small.en)
//      and aligns it to the written words: a word the transcriber heard keeps its time, the others share the
//      time between their neighbours by length;
//   3. lays the lines end to end (voice.lead, voice.gap between lines, voice.sceneGap between scenes,
//      voice.tail after the last), mixes assets/voice.wav, writes assets/timing.json and sets DUR in
//      src/film.html.
// A scene starts 0.2 s before its first line (the picture leads the voice) and ends where the next starts.
// Nothing leaves the machine; the first run downloads the two local models.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const dir = args.find((a) => !a.startsWith('--'));
if (!dir) { console.error('usage: node voice.mjs videos/<film> [--check]'); process.exit(2); }
const CHECK = args.includes('--check');
const src = path.join(dir, 'src', 'film.html');
const html = fs.readFileSync(src, 'utf8');

// the FILM block, evaluated on its own (it is plain data plus beat() and bar()): the film's own source, which
// runs as script in the page anyway; never point this at a film you would not open in a browser
const a = html.indexOf('const BPM'), b = html.indexOf('/* ===== CORE BEGIN');
if (a < 0 || b < 0) throw new Error(`${src}: FILM block markers not found`);
const FILM = new Function(`${html.slice(a, b)}\nreturn FILM;`)();
const V = { name: 'am_michael', speed: 1, gap: 0.3, sceneGap: 0.5, lead: 0.4, tail: 3.5, ...(FILM.voice || {}) };
const MARKS = Object.keys((FILM.captions || {}).marks || { '*': 1, '+': 1, '!': 1 });

// "You pull in at !11:52!." -> words with the mark each one is drawn in
function parseLine(text) {
  const words = [];
  let mark = null;
  for (const raw of text.split(/\s+/).filter(Boolean)) {
    let w = raw, m = mark;
    const open = MARKS.find((k) => w.startsWith(k));
    if (!mark && open) { mark = open; m = open; w = w.slice(1); }
    const closeAt = mark ? w.indexOf(mark) : -1;
    if (mark && closeAt >= 0) { w = w.slice(0, closeAt) + w.slice(closeAt + 1); m = mark; mark = null; }
    words.push({ text: w, mark: m });
  }
  if (mark) throw new Error(`unclosed ${mark} in: ${text}`);
  return words;
}
const plain = (text) => parseLine(text).map((w) => w.text).join(' ');

const lines = [];
FILM.scenes.forEach((s, si) => (s.say || []).forEach((l, li) => {
  const text = typeof l === 'string' ? l : l.text;
  lines.push({ scene: s.id, si, li, text, words: parseLine(text), speak: typeof l === 'string' ? plain(l) : (l.speak || plain(l.text)) });
}));
const nWords = lines.reduce((n, l) => n + l.words.length, 0);
if (CHECK) {
  for (const l of lines) console.log(`${l.scene.padEnd(8)} ${l.text}${l.speak !== plain(l.text) ? `   (spoken: ${l.speak})` : ''}`);
  console.log(`${lines.length} lines, ${nWords} words, about ${Math.round(nWords / 2.6)} s at Kokoro's pace`);
  process.exit(0);
}

const out = path.join(dir, 'assets', 'voice');
fs.mkdirSync(out, { recursive: true });
// npx without a shell everywhere: on Windows npx is a .cmd file, so run npm's own npx-cli.js with this node
const npxCli = path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npx-cli.js');
const npx = (argv) => (process.platform === 'win32' ? [process.execPath, [npxCli, ...argv]] : ['npx', argv]);
const exec = (cmd, argv) => execFileSync(cmd, argv, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 << 20 });
const run = (cmd, argv) => exec(cmd, argv);
const runNpx = (argv) => exec(...npx(argv));
const probe = (f) => Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).trim());
const norm = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

for (const [i, l] of lines.entries()) {
  const key = crypto.createHash('sha1').update(JSON.stringify([l.speak, V.name, V.speed])).digest('hex').slice(0, 12);
  const base = path.join(out, key);                 // named by content, so adding a line re-speaks only that line
  l.wav = `${base}.wav`;
  if (!fs.existsSync(l.wav)) {
    process.stdout.write(`speak ${i + 1}/${lines.length}: ${l.speak}\n`);
    fs.writeFileSync(`${base}.txt`, l.speak);          // the line goes in by file, never on a command line
    const r = JSON.parse(runNpx(['hyperframes', 'tts', `${base}.txt`, '-v', V.name, '-s', String(V.speed), '-o', l.wav, '--json']).trim().split('\n').pop());
    if (!r.ok) throw new Error(`tts failed: ${JSON.stringify(r.error)}`);
  }
  l.dur = probe(l.wav);
  // the heard words, in the line's own time
  if (!fs.existsSync(`${base}.words.json`)) {
    process.stdout.write(`time  ${i + 1}/${lines.length}\n`);
    // the words land in the transcript file the last JSON line names (the streamed 'words' rows can be empty)
    const log = runNpx(['hyperframes', 'transcribe', l.wav, '--model', 'small.en', '--json']).trim().split('\n');
    const done = JSON.parse(log[log.length - 1]);
    if (!done.ok) throw new Error(`transcribe failed: ${JSON.stringify(done.error)}`);
    const heard = JSON.parse(fs.readFileSync(done.transcriptPath, 'utf8')).map(({ text, start, end }) => ({ text, start, end }));
    fs.writeFileSync(`${base}.words.json`, JSON.stringify(heard));
    fs.rmSync(done.transcriptPath);
  }
  l.heard = JSON.parse(fs.readFileSync(`${base}.words.json`, 'utf8'));
}

// align the written words to the heard ones: matches in order keep their times, the rest are spread by length
function align(l) {
  const ws = l.words.map((w) => ({ ...w, n: norm(w.text) })), hs = l.heard.map((h) => ({ ...h, n: norm(h.text) }));
  const n = ws.length, m = hs.length, L = Array.from({ length: n + 1 }, () => new Int16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = ws[i].n && ws[i].n === hs[j].n ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  for (let i = 0, j = 0; i < n && j < m;) {
    if (ws[i].n && ws[i].n === hs[j].n) { ws[i].start = hs[j].start; ws[i].end = hs[j].end; i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) i++; else j++;
  }
  const t0 = hs.length ? hs[0].start : 0.05, t1 = hs.length ? hs[m - 1].end : l.dur - 0.05;
  let i = 0;
  while (i < n) {                                   // fill each run of unmatched words between known edges
    if (ws[i].start != null) { i++; continue; }
    let j = i; while (j < n && ws[j].start == null) j++;
    const from = i ? ws[i - 1].end : t0, to = j < n ? ws[j].start : t1;
    const len = ws.slice(i, j).map((w) => Math.max(2, w.text.length)), sum = len.reduce((x, y) => x + y, 0);
    let t = from;
    for (let k = i; k < j; k++) { const d = Math.max(0, to - from) * len[k - i] / sum; ws[k].start = t; ws[k].end = t + d; t += d; }
    i = j;
  }
  return { words: ws.map(({ text, mark, start, end }) => ({ text, mark, start, end })), known: L[0][0] };
}

// lay the lines end to end
let t = V.lead;
const timed = [];
lines.forEach((l, i) => {
  if (i && lines[i - 1].si !== l.si) t += V.sceneGap - V.gap;
  const A = align(l);
  timed.push({ scene: l.scene, text: l.text, start: +t.toFixed(3), end: +(t + l.dur).toFixed(3), known: A.known, of: l.words.length,
    words: A.words.map((w) => ({ text: w.text, mark: w.mark, start: +(t + w.start).toFixed(3), end: +(t + w.end).toFixed(3) })) });
  l.at = t;
  t += l.dur + V.gap;
});
const DUR = +(t - V.gap + V.tail).toFixed(2);
const scenes = FILM.scenes.map((s, si) => {
  const first = timed.find((x) => x.scene === s.id);
  return { id: s.id, start: si === 0 ? 0 : first ? +Math.max(0, first.start - 0.2).toFixed(3) : null };
});
for (let k = 0; k < scenes.length; k++) {
  if (scenes[k].start == null) throw new Error(`scene ${scenes[k].id} says nothing: give it a line`);
  scenes[k].end = k + 1 < scenes.length ? null : DUR;
}
for (let k = 0; k + 1 < scenes.length; k++) scenes[k].end = scenes[k + 1].start;

// the mix: the lines in order, each padded with silence up to the next one's start (the last up to DUR), after
// the lead. (A sum of delayed inputs, amix, came out short: it ended a few seconds early and dropped the last lines.)
const RATE = 24000;
const inputs = lines.flatMap((l) => ['-i', l.wav]);
const fc = lines.map((l, i) => {
  const until = (i + 1 < lines.length ? lines[i + 1].at : DUR) - l.at;
  return `[${i}:a]aresample=${RATE},aformat=channel_layouts=mono,apad=whole_dur=${until.toFixed(4)},atrim=0:${until.toFixed(4)}[a${i}]`;
}).join(';')
  + `;anullsrc=r=${RATE}:cl=mono,atrim=0:${lines[0].at.toFixed(4)}[lead]`
  + `;[lead]${lines.map((_, i) => `[a${i}]`).join('')}concat=n=${lines.length + 1}:v=0:a=1[out]`;
const wavOut = path.join(dir, 'assets', 'voice.wav');
run('ffmpeg', ['-y', '-v', 'error', ...inputs, '-filter_complex', fc, '-map', '[out]', '-ar', String(RATE), '-c:a', 'pcm_s16le', wavOut]);
const got = probe(wavOut);
if (Math.abs(got - DUR) > 0.05) throw new Error(`voice.wav is ${got.toFixed(3)} s, expected ${DUR} s`);

const timing = { voice: V.name, speed: V.speed, dur: DUR, scenes, lines: timed };
fs.writeFileSync(path.join(dir, 'assets', 'timing.json'), JSON.stringify(timing, null, 1));

// DUR in the FILM block
const filmAt = html.indexOf('const FILM = {');
const durRe = /DUR: [0-9.]+,/;
const head = html.slice(0, filmAt), rest = html.slice(filmAt);
if (!durRe.test(rest)) throw new Error('DUR: <number>, not found in the FILM block');
fs.writeFileSync(src, head + rest.replace(durRe, `DUR: ${DUR},`));

const weak = timed.filter((x) => x.known < x.of * 0.6);
for (const s of scenes) console.log(`${s.id.padEnd(8)} ${s.start.toFixed(2).padStart(7)} - ${s.end.toFixed(2).padStart(7)} s`);
for (const w of weak) console.log(`WARN timing: only ${w.known} of ${w.of} words heard in "${w.text}" (the rest are spread by length; check the captions against the voice)`);
console.log(`VOICE OK: ${lines.length} lines, ${nWords} words, DUR ${DUR} s -> assets/voice.wav, assets/timing.json`);
