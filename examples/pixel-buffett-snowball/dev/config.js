/* ---------------- the film: ten stops along one long hill ---------------- */
const BPM = 120;
const beat = (n) => n * 60 / BPM;            // quarter notes
const bar = (n) => beat(4 * n);              // 4/4 bars

const SPEED = 30;                            // the ground, px/s: 1 px every 2 frames
const GROUND = 137;                          // the row the runner's soles and the ball rest on
const FOCUS = 200;                           // the screen x a stop is centred on when its caption lands
const HERO_X = 110;                          // the runner's left edge; the ball rolls behind it
const DUR_S = 36;

// One stop per milestone. t is the moment its caption lands and its prop is centred on FOCUS; r is the snowball's radius from then on.
const STOPS = [
  { t: 1,  prop: 'house',      age: 0,  year: 1930, head: 'WARREN BUFFETT', sub: 'FROM $0 TO BILLIONS', r: 4,  ramp: 'w', scale: 3 },
  { t: 4,  prop: 'stockBoard', age: 11, year: 1942, head: 'FIRST STOCK', sub: '3 SHARES AT $38 EACH', r: 5,  ramp: 'w', scale: 3 },
  { t: 7,  prop: 'bike',       age: 14, year: 1944, head: 'PAPER ROUTE', sub: '$592.50 EARNED IN 1944', r: 6,  ramp: 'w', scale: 3 },
  { t: 10, prop: 'book',       age: 19, year: 1950, head: 'THE INTELLIGENT INVESTOR', sub: 'HE READS IT AT 19', r: 8,  ramp: 'w', scale: 2 },
  { t: 13, prop: 'partners',   age: 25, year: 1956, head: 'SEVEN PARTNERS', sub: '$105,000 FROM THEM, $100 FROM HIM', r: 10, ramp: 'w', scale: 3 },
  { t: 16, prop: 'vault',      age: null, year: 1962, head: 'FIRST MILLION', sub: 'HIS STAKE PASSES $1,000,000', r: 14, ramp: 'g', scale: 3 },
  { t: 19, prop: 'mill',       age: 34, year: 1965, head: 'BERKSHIRE HATHAWAY', sub: 'A TEXTILE MILL. HE TAKES CONTROL', r: 18, ramp: 'w', scale: 2 },
  { t: 22, prop: 'tower',      age: 55, year: 1985, head: 'FIRST BILLION', sub: 'FORBES 400 LISTS HIM AT $1 BILLION', r: 26, ramp: 'g', scale: 3 },
  { t: 25, prop: 'trophy',     age: 77, year: 2008, head: "WORLD'S RICHEST", sub: '$62 BILLION, FORBES', r: 34, ramp: 'g', scale: 3 },
  { t: 28, prop: 'bigCoin',    age: 96, year: 2026, head: '$143.7 BILLION', sub: 'AFTER GIVING AWAY $60 BILLION+', r: 46, ramp: 'g', scale: 3 },
];
// the runner grows up: [sprite, from, until]
// each age takes over 0.6 s before the stop it belongs to, after the last caption has gone: the kid is 0 and 11, the paper boy 14, then 19 and 25, then 1962 to 55, then 77 and 96
const AGES = [['kid', 0], ['paper', STOPS[2].t - 0.6], ['young', STOPS[3].t - 0.6], ['man', STOPS[5].t - 0.6], ['elder', STOPS[8].t - 0.6]];

const FEED_AT = 0.15, FEED_DUR = 0.6;          // a stop tosses its coin this long after its caption lands; the ball swells on arrival
const RAMP = {
  w: ['white', 'white', 'white', 'snow', 'snow', 'far', 'far'],
  g: ['white', 'gold', 'gold', 'gold', 'gold', 'orange', 'orange'],
};
const propOf = (k) => { const a = STOPART[k].art; return { w: a[0].length, h: a.length }; };
const stopX = (s) => Math.round(FOCUS + SPEED * s.t - propOf(s.prop).w / 2);
const stopY = (s) => GROUND + 1 - propOf(s.prop).h;
const headH = (s) => 7 * s.scale;
const stag = (text, total) => { const n = [...text].filter((c) => c !== ' ').length; return n > 1 ? Math.min(0.0625, total / (n - 1)) : 0; };   // seconds between letters
const SUB_Y = (s) => 10 + headH(s) + 2 + 6;   // the small line sits below the headline and its drop

const layers = [];
layers.push({ id: 'SKY', kind: 'sky', bands: [[0, 'bg'], [50, 'sky2'], [98, 'haze']], dither: 6 });
layers.push({ id: 'SUN', kind: 'sprite', sprite: 'sun', x: 262, y: 140, shake: false,
  keys: STOPS.map((s, i) => ({ at: s.t, to: { dy: -7 * (i + 1) }, spring: 'SLIDE' })) });
layers.push({ id: 'CLOUDS', kind: 'strip', width: 800, speed: 10, place: [
  ['cloudBig', 36, 16], ['cloudSmall', 140, 58], ['cloudMid', 226, 8], ['cloudBig', 350, 40], ['cloudSmall', 452, 20],
  ['cloudMid', 540, 56], ['cloudBig', 640, 12], ['cloudSmall', 760, 44]] });
layers.push({ id: 'FAR', kind: 'ridge', width: 720, speed: 10, y: 126, bumps: [[40, 90, 18], [130, 70, 12], [230, 100, 22], [340, 80, 14], [440, 110, 20], [560, 90, 16], [660, 80, 12]], fill: 'far', edge: 'haze' });
layers.push({ id: 'NEAR', kind: 'ridge', width: 1080, speed: 20, y: 136, bumps: [[60, 90, 14], [170, 120, 20], [300, 80, 10], [420, 110, 16], [560, 90, 12], [690, 130, 18], [830, 90, 10], [960, 100, 14]], fill: 'shade', edge: 'far' });
layers.push({ id: 'GROUND', kind: 'tiles', y: 132, speed: SPEED, extend: 'earth',
  tiles: { A: 'snowA', B: 'snowB', C: 'earthA', D: 'earthB', E: 'deep' },
  map: ['ABBABAABBABABBAABABBABAABBABAB', 'CDCCDCDDCDCCDDCDCDCCDCDDCDCCDC', 'EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE'] });
// the trees stand behind the stops
const TREES = [];
STOPS.forEach((s, i) => {
  const mid = stopX(s) + Math.floor(propOf(s.prop).w / 2) + 45;
  TREES.push([i % 3 === 1 ? 'pine' : 'pineSmall', mid - 6, GROUND - (i % 3 === 1 ? 29 : 19) - 1]);
});
TREES.push(['pine', stopX(STOPS[0]) + 62, GROUND - 29 - 1], ['pineSmall', stopX(STOPS[2]) - 40, GROUND - 20], ['pine', stopX(STOPS[6]) - 44, GROUND - 30]);
layers.push({ id: 'TREES', kind: 'strip', width: 30 * DUR_S + 500, speed: SPEED, place: TREES.map(([n, x, y]) => [n, x, y - 2]) });
layers.push({ id: 'STOPS', kind: 'strip', width: 30 * DUR_S + 500, speed: SPEED,
  place: [['snowman', stopX(STOPS[0]) + 60, GROUND - 25], ...STOPS.map((s) => [s.prop, stopX(s), stopY(s)])] });
layers.push({ id: 'BALL', kind: 'ball', heroX: HERO_X, gap: 6, ground: GROUND, speed: SPEED, spring: 'HOP',
  radius: STOPS.map((s, i) => [i === 0 ? 0 : s.t + FEED_AT + FEED_DUR, s.r]) });
AGES.forEach(([sp, a], i) => {
  const L = { id: `RUN_${sp.toUpperCase()}`, kind: 'sprite', sprite: sp, x: HERO_X, y: GROUND - 25 };
  if (i > 0) L.enter = { at: a, from: { op: 0 }, fade: 'DISSOLVE' };
  if (i < AGES.length - 1) L.exit = { at: AGES[i + 1][1] + 0.3, to: { op: 0 }, fade: 'DISSOLVE' };
  layers.push(L);
  if (i > 0) layers.push({ id: `POOF_${i}`, kind: 'sprite', sprite: 'poof', x: HERO_X - 1, y: GROUND - 28, show: [a, a + 0.25], phase: -Math.round(a * 12) });
});
[[5, 16.3, 18.4], [7, 22.3, 24.4], [8, 25.3, 27.4], [9, 28.2, 30.6]].forEach(([seed, a, b], i) => layers.push({ id: `GLINTS_${i + 1}`, kind: 'sparkles', sprite: 'spark', box: [70 + i * 4, 12, 250 - i * 4, 58], n: 3 + (i % 2), every: beat(2), seed, show: [a, b] }));
layers.push({ id: 'FEED', kind: 'feed', sprite: 'coin', burst: 'spark', ball: 'BALL',
  shots: STOPS.slice(1).map((s) => ({ at: s.t + FEED_AT, x0: FOCUS, y0: stopY(s) - 2, dur: FEED_DUR, peak: 30 })) });
layers.push({ id: 'SNOW', kind: 'snow', n: 46, floor: GROUND - 2 });
// the captions: a headline that drops in, a small line under it, and the age and year at the bottom
STOPS.forEach((s, i) => {
  const id = `S${i + 1}`, x = 160, hold = 2.5;
  layers.push({ id: `${id}_HEAD`, kind: 'text', text: s.head, scale: s.scale, anchor: 'C', x, y: 10, fill: RAMP[s.ramp], outline: 'ink', depth: [0, 2], side: 'suit',
    ...(i === 0 ? {} : { enter: { at: s.t, from: { dy: -(10 + headH(s) + 6), op: 0 }, spring: 'DROP', bounce: true, stagger: stag(s.head, 0.45) } }),
    exit: { at: s.t + hold - 0.2, to: { op: 0 }, fade: 'DISSOLVE', stagger: stag(s.head, 0.25) },
    ...(s.ramp === 'g' ? { shine: { at: [s.t + 0.9], dur: 0.4, width: 4, color: 'white' } } : {}), ...(i === 0 ? {} : { accent: 'land' }) });
  layers.push({ id: `${id}_SUB`, kind: 'text', text: s.sub, anchor: 'C', x, y: SUB_Y(s), fill: 'white', outline: 'ink',
    ...(i === 0 ? {} : { enter: { at: s.t + 0.4, from: { op: 0 }, fade: 'DISSOLVE', stagger: stag(s.sub, 0.35) } }),
    exit: { at: s.t + hold - 0.2, to: { op: 0 }, fade: 'DISSOLVE', stagger: stag(s.sub, 0.25) } });
  layers.push({ id: `${id}_AGE`, kind: 'text', text: s.age == null ? String(s.year) : `AGE ${s.age} · ${s.year}`, anchor: 'L', x: 12, y: 163, fill: 'gold', outline: 'ink',
    show: [i === 0 ? 0 : s.t - 0.3, s.t + 2.8],
    ...(i === 0 ? {} : { enter: { at: s.t - 0.3, from: { op: 0 }, fade: 'DISSOLVE', stagger: 0.02 } }),
    exit: { at: s.t + 2.6, to: { op: 0 }, fade: 'DISSOLVE', stagger: 0.02 } });
});
layers.push({ id: 'AGE_LAST', kind: 'text', text: 'AGE 96 · 2026', anchor: 'L', x: 12, y: 163, fill: 'gold', outline: 'ink', show: [30.7, DUR_S],
  enter: { at: 30.7, from: { op: 0 }, fade: 'DISSOLVE', stagger: 0.02 } });
// the ending: two beats of a sentence he is known for, then his name
layers.push({ id: 'END_1', kind: 'text', text: 'WET SNOW.', scale: 3, anchor: 'C', x: 160, y: 10, fill: RAMP.w, outline: 'ink', depth: [0, 2], side: 'suit',
  enter: { at: 30.9, from: { dy: -40, op: 0 }, spring: 'DROP', bounce: true, stagger: 0.05 },
  exit: { at: 32.4, to: { op: 0 }, fade: 'DISSOLVE', stagger: 0.03 }, accent: 'land' });
layers.push({ id: 'END_2', kind: 'text', text: 'A REALLY LONG HILL.', scale: 2, anchor: 'C', x: 160, y: 12, fill: RAMP.g, outline: 'ink', depth: [0, 2], side: 'suit',
  enter: { at: 32.8, from: { dy: -40, op: 0 }, spring: 'DROP', bounce: true, stagger: 0.025 }, shine: { at: [34.3], dur: 0.4, width: 4, color: 'white' }, accent: 'land' });
layers.push({ id: 'END_3', kind: 'text', text: '– WARREN BUFFETT', anchor: 'C', x: 160, y: 32, fill: 'white', outline: 'ink',
  enter: { at: 33.4, from: { op: 0 }, fade: 'DISSOLVE', stagger: 0.02 } });
layers.push({ id: 'CREDIT_1', kind: 'text', text: 'UNOFFICIAL FAN ANIMATION', anchor: 'R', x: 311, y: 152, fill: 'white', outline: 'ink' });
layers.push({ id: 'CREDIT_2', kind: 'text', text: 'SOURCES: FORBES, CNBC, PBS, PRESS', anchor: 'R', x: 311, y: 163, fill: 'white', outline: 'ink' });

const FILM = {
  title: 'Warren Buffett, from $0 to billions: a pixel history',
  alt: 'A pixel-art history of Warren Buffett. A runner jogs right across a snowy landscape while a snowball rolls after him and grows with every stop. Omaha, 1930: WARREN BUFFETT, from $0 to billions. 1942, age 11: FIRST STOCK, 3 shares at $38 each. 1944, age 14: PAPER ROUTE, $592.50 earned in 1944. 1950, age 19: THE INTELLIGENT INVESTOR, he reads it at 19. 1956, age 25: SEVEN PARTNERS put in $105,000, $100 of it his. 1962: FIRST MILLION, his stake passes $1,000,000. 1965: BERKSHIRE HATHAWAY, a textile mill he takes control of. 1985, age 55: FIRST BILLION, the Forbes 400 lists him at $1 billion. 2008, age 77: WORLD\'S RICHEST, $62 billion, Forbes. 2026, age 96: $143.7 BILLION, after giving away $60 billion and more. Then: WET SNOW. A REALLY LONG HILL. Warren Buffett. Unofficial fan animation; sources Forbes, CNBC, PBS and press reports.',
  W: 1920, H: 1080, FPS: 60, DUR: DUR_S, BPM,
  loop: 'none',
  blur: false,
  px: { w: 320, h: 180, scale: 6, margin: 8 },
  palette: {
    bg: '#83B7E6', sky2: '#B4D6F3', haze: '#E1F0FB', far: '#A5C1E2', snow: '#EAF3FC', white: '#FFFFFF', shade: '#8EA7D0', ink: '#1B2140',
    earth: '#6A4B3C', wood: '#B97A45', skin: '#F0B48C', suit: '#2D4A85', red: '#D8434B', gold: '#FFC83D', orange: '#E8892B', pine: '#2F7D5B',
  },
  poster: 29.2,
  sprites: {
    kid: RUNNERS.kid, paper: RUNNERS.paper, young: RUNNERS.young, man: RUNNERS.man, elder: RUNNERS.elder,
    ...STOPART, ...SCENERY,
    poof: POOF, coin: COIN,
    spark: { fps: 20, key: { w: 'white', c: 'snow', y: 'gold' }, sheet: [
      '....... ....... ...y... ....... .......', '....... ....... ...c... ...y... .......', '....... ...c... ...w... ....... .......',
      '...w... ..cwc.. ycwwwcy .y.w.y. ...y...', '....... ...c... ...w... ....... .......', '....... ....... ...c... ...y... .......', '....... ....... ...y... ....... .......'] },
  },
  shake: [{ at: STOPS[7].t + FEED_AT + FEED_DUR, px: 2, dur: 0.3 }, { at: STOPS[9].t + FEED_AT + FEED_DUR, px: 3, dur: 0.4 }],
  layers,
};
