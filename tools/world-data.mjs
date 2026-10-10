#!/usr/bin/env node
// Build the world geography dataset the motion-globe engine embeds. Maintainers only; the plugin does not ship
// this folder, and films never run it: they carry its output, so they render offline from one HTML file.
//
//   node tools/world-data.mjs                     fetch world-atlas@2.0.2 and sane-topojson@4.0.0 (npm pack, into a temp
//                                                 folder) and write shared/world/world-data.js
//   node tools/world-data.mjs --src <dir>         use unpacked packages instead: <dir>/world-atlas/, <dir>/sane-topojson/
//   node tools/world-data.mjs --res 10m           source resolution, 110m | 50m (default) | 10m
//   node tools/world-data.mjs --no-lakes          keep lakes as land (Natural Earth admin-0 polygons include them)
//   node tools/world-data.mjs --cover 0.25        share of a cell that must be land (default 0.25), --ss 4 samples/side
//   node tools/world-data.mjs --tol 0.08          outline simplification tolerance, degrees (default 0.08)
//   node tools/world-data.mjs --out <file>        where to write (default shared/world/world-data.js)
//   node tools/world-data.mjs --check             exit 1 if the file on disk differs from a fresh build
//
// Then `node tools/sync.mjs` splices the file into every template that holds the WORLD markers.
//
// What it writes: a plain script (no import or export) defining one const, WORLD, with
//   - a 0.25-degree raster, 1440 x 720 cells, each a country index (255 = sea), run-length encoded per row then
//     base64; decoded once by WORLD.init(), which every helper calls lazily;
//   - one record per country: ISO 3166 alpha-2, alpha-3 and numeric codes, an English name, a bounding box (west
//     greater than east when it crosses the antimeridian) and a label point (pole of inaccessibility of the
//     largest polygon);
//   - simplified outlines as shared arcs (each border stored once), quantised, delta and varint coded, base64;
//   - helpers: countryAt, landAt, country (lookup by index, code or name), nearestLand, resolve, inCountry,
//     outline, arcs, dist.
// It decodes TopoJSON itself (arcs, delta coding, quantisation transform) and has no dependency.
//
// world-atlas carries Natural Earth names and ISO 3166 numeric ids but no alpha codes; the table below maps
// every id the package holds to its alpha-2 and alpha-3 codes and a short English name. Entities with no ISO id
// (Somaliland, Kosovo, N. Cyprus, ...) are keyed by their atlas name and carry `parent`, the ISO entity they sit
// in or are administered with, which WORLD.inCountry() honours.
//
// Admin-0 polygons cover lakes, so the Great Lakes would read as land on a dotted globe. The raster subtracts the
// Natural Earth lakes layer, which sane-topojson (MIT, Plotly) packages; world-atlas has no lakes.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const RES = arg('--res', '50m');
const TOL = +arg('--tol', '0.08');
const OUT = path.resolve(arg('--out', path.join(ROOT, 'shared', 'world', 'world-data.js')));
const CHECK = argv.includes('--check');
const STEP = 0.25, W = 360 / STEP, H = 180 / STEP, SEA = 255;
const Q = 0.01;                                       // outline quantum, degrees (about 1 km)
const SS = +arg('--ss', '4');                         // raster samples per cell side
const LAKES = !argv.includes('--no-lakes');
const COVER = +arg('--cover', '0.25');                // share of a cell's samples that must be land (dot-map style:
                                                      // peninsulas and coastal cities stay on land)

// ---------------------------------------------------------------------------------------------------------------
// ISO 3166-1: numeric -> [alpha-2, alpha-3, short English name, aliases...]. Every id world-atlas@2 holds, at all
// three resolutions.
const ISO = {
  '004': ['AF', 'AFG', 'Afghanistan'], '008': ['AL', 'ALB', 'Albania'], '010': ['AQ', 'ATA', 'Antarctica'],
  '012': ['DZ', 'DZA', 'Algeria'], '016': ['AS', 'ASM', 'American Samoa'], '020': ['AD', 'AND', 'Andorra'],
  '024': ['AO', 'AGO', 'Angola'], '028': ['AG', 'ATG', 'Antigua and Barbuda'], '031': ['AZ', 'AZE', 'Azerbaijan'],
  '032': ['AR', 'ARG', 'Argentina'], '036': ['AU', 'AUS', 'Australia'], '040': ['AT', 'AUT', 'Austria'],
  '044': ['BS', 'BHS', 'Bahamas', 'The Bahamas'], '048': ['BH', 'BHR', 'Bahrain'], '050': ['BD', 'BGD', 'Bangladesh'],
  '051': ['AM', 'ARM', 'Armenia'], '052': ['BB', 'BRB', 'Barbados'], '056': ['BE', 'BEL', 'Belgium'],
  '060': ['BM', 'BMU', 'Bermuda'], '064': ['BT', 'BTN', 'Bhutan'], '068': ['BO', 'BOL', 'Bolivia'],
  '070': ['BA', 'BIH', 'Bosnia and Herzegovina'], '072': ['BW', 'BWA', 'Botswana'], '076': ['BR', 'BRA', 'Brazil'],
  '084': ['BZ', 'BLZ', 'Belize'], '086': ['IO', 'IOT', 'British Indian Ocean Territory'],
  '090': ['SB', 'SLB', 'Solomon Islands'], '092': ['VG', 'VGB', 'British Virgin Islands'], '096': ['BN', 'BRN', 'Brunei'],
  '100': ['BG', 'BGR', 'Bulgaria'], '104': ['MM', 'MMR', 'Myanmar', 'Burma'], '108': ['BI', 'BDI', 'Burundi'],
  '112': ['BY', 'BLR', 'Belarus'], '116': ['KH', 'KHM', 'Cambodia'], '120': ['CM', 'CMR', 'Cameroon'],
  '124': ['CA', 'CAN', 'Canada'], '132': ['CV', 'CPV', 'Cabo Verde', 'Cape Verde'], '136': ['KY', 'CYM', 'Cayman Islands'],
  '140': ['CF', 'CAF', 'Central African Republic'], '144': ['LK', 'LKA', 'Sri Lanka'], '148': ['TD', 'TCD', 'Chad'],
  '152': ['CL', 'CHL', 'Chile'], '156': ['CN', 'CHN', 'China'], '158': ['TW', 'TWN', 'Taiwan'],
  '162': ['CX', 'CXR', 'Christmas Island'], '166': ['CC', 'CCK', 'Cocos (Keeling) Islands'],
  '170': ['CO', 'COL', 'Colombia'], '174': ['KM', 'COM', 'Comoros'], '178': ['CG', 'COG', 'Congo', 'Republic of the Congo'],
  '180': ['CD', 'COD', 'DR Congo', 'Democratic Republic of the Congo'], '184': ['CK', 'COK', 'Cook Islands'],
  '188': ['CR', 'CRI', 'Costa Rica'], '191': ['HR', 'HRV', 'Croatia'], '192': ['CU', 'CUB', 'Cuba'],
  '196': ['CY', 'CYP', 'Cyprus'], '203': ['CZ', 'CZE', 'Czechia', 'Czech Republic'], '204': ['BJ', 'BEN', 'Benin'],
  '208': ['DK', 'DNK', 'Denmark'], '212': ['DM', 'DMA', 'Dominica'], '214': ['DO', 'DOM', 'Dominican Republic'],
  '218': ['EC', 'ECU', 'Ecuador'], '222': ['SV', 'SLV', 'El Salvador'], '226': ['GQ', 'GNQ', 'Equatorial Guinea'],
  '231': ['ET', 'ETH', 'Ethiopia'], '232': ['ER', 'ERI', 'Eritrea'], '233': ['EE', 'EST', 'Estonia'],
  '234': ['FO', 'FRO', 'Faroe Islands'], '238': ['FK', 'FLK', 'Falkland Islands'], '239': ['GS', 'SGS', 'South Georgia and the South Sandwich Islands'],
  '242': ['FJ', 'FJI', 'Fiji'], '246': ['FI', 'FIN', 'Finland'], '248': ['AX', 'ALA', 'Åland Islands'],
  '250': ['FR', 'FRA', 'France'], '258': ['PF', 'PYF', 'French Polynesia'], '260': ['TF', 'ATF', 'French Southern Territories'],
  '262': ['DJ', 'DJI', 'Djibouti'], '266': ['GA', 'GAB', 'Gabon'], '268': ['GE', 'GEO', 'Georgia'],
  '270': ['GM', 'GMB', 'Gambia', 'The Gambia'], '275': ['PS', 'PSE', 'Palestine'], '276': ['DE', 'DEU', 'Germany'],
  '288': ['GH', 'GHA', 'Ghana'], '292': ['GI', 'GIB', 'Gibraltar'], '296': ['KI', 'KIR', 'Kiribati'],
  '300': ['GR', 'GRC', 'Greece'], '304': ['GL', 'GRL', 'Greenland'], '308': ['GD', 'GRD', 'Grenada'],
  '316': ['GU', 'GUM', 'Guam'], '320': ['GT', 'GTM', 'Guatemala'], '324': ['GN', 'GIN', 'Guinea'],
  '328': ['GY', 'GUY', 'Guyana'], '332': ['HT', 'HTI', 'Haiti'], '334': ['HM', 'HMD', 'Heard Island and McDonald Islands'],
  '336': ['VA', 'VAT', 'Vatican City', 'Holy See'], '340': ['HN', 'HND', 'Honduras'], '344': ['HK', 'HKG', 'Hong Kong'],
  '348': ['HU', 'HUN', 'Hungary'], '352': ['IS', 'ISL', 'Iceland'], '356': ['IN', 'IND', 'India'],
  '360': ['ID', 'IDN', 'Indonesia'], '364': ['IR', 'IRN', 'Iran'], '368': ['IQ', 'IRQ', 'Iraq'],
  '372': ['IE', 'IRL', 'Ireland'], '376': ['IL', 'ISR', 'Israel'], '380': ['IT', 'ITA', 'Italy'],
  '384': ['CI', 'CIV', "Côte d'Ivoire", 'Ivory Coast'], '388': ['JM', 'JAM', 'Jamaica'], '392': ['JP', 'JPN', 'Japan'],
  '398': ['KZ', 'KAZ', 'Kazakhstan'], '400': ['JO', 'JOR', 'Jordan'], '404': ['KE', 'KEN', 'Kenya'],
  '408': ['KP', 'PRK', 'North Korea'], '410': ['KR', 'KOR', 'South Korea', 'Korea'], '414': ['KW', 'KWT', 'Kuwait'],
  '417': ['KG', 'KGZ', 'Kyrgyzstan'], '418': ['LA', 'LAO', 'Laos'], '422': ['LB', 'LBN', 'Lebanon'],
  '426': ['LS', 'LSO', 'Lesotho'], '428': ['LV', 'LVA', 'Latvia'], '430': ['LR', 'LBR', 'Liberia'],
  '434': ['LY', 'LBY', 'Libya'], '438': ['LI', 'LIE', 'Liechtenstein'], '440': ['LT', 'LTU', 'Lithuania'],
  '442': ['LU', 'LUX', 'Luxembourg'], '446': ['MO', 'MAC', 'Macao', 'Macau'], '450': ['MG', 'MDG', 'Madagascar'],
  '454': ['MW', 'MWI', 'Malawi'], '458': ['MY', 'MYS', 'Malaysia'], '462': ['MV', 'MDV', 'Maldives'],
  '466': ['ML', 'MLI', 'Mali'], '470': ['MT', 'MLT', 'Malta'], '478': ['MR', 'MRT', 'Mauritania'],
  '480': ['MU', 'MUS', 'Mauritius'], '484': ['MX', 'MEX', 'Mexico'], '492': ['MC', 'MCO', 'Monaco'],
  '496': ['MN', 'MNG', 'Mongolia'], '498': ['MD', 'MDA', 'Moldova'], '499': ['ME', 'MNE', 'Montenegro'],
  '500': ['MS', 'MSR', 'Montserrat'], '504': ['MA', 'MAR', 'Morocco'], '508': ['MZ', 'MOZ', 'Mozambique'],
  '512': ['OM', 'OMN', 'Oman'], '516': ['NA', 'NAM', 'Namibia'], '520': ['NR', 'NRU', 'Nauru'],
  '524': ['NP', 'NPL', 'Nepal'], '528': ['NL', 'NLD', 'Netherlands', 'Holland', 'The Netherlands'], '531': ['CW', 'CUW', 'Curaçao'],
  '533': ['AW', 'ABW', 'Aruba'], '534': ['SX', 'SXM', 'Sint Maarten'], '540': ['NC', 'NCL', 'New Caledonia'],
  '548': ['VU', 'VUT', 'Vanuatu'], '554': ['NZ', 'NZL', 'New Zealand'], '558': ['NI', 'NIC', 'Nicaragua'],
  '562': ['NE', 'NER', 'Niger'], '566': ['NG', 'NGA', 'Nigeria'], '570': ['NU', 'NIU', 'Niue'],
  '574': ['NF', 'NFK', 'Norfolk Island'], '578': ['NO', 'NOR', 'Norway'], '580': ['MP', 'MNP', 'Northern Mariana Islands'],
  '581': ['UM', 'UMI', 'U.S. Minor Outlying Islands'], '583': ['FM', 'FSM', 'Micronesia'], '584': ['MH', 'MHL', 'Marshall Islands'],
  '585': ['PW', 'PLW', 'Palau'], '586': ['PK', 'PAK', 'Pakistan'], '591': ['PA', 'PAN', 'Panama'],
  '598': ['PG', 'PNG', 'Papua New Guinea'], '600': ['PY', 'PRY', 'Paraguay'], '604': ['PE', 'PER', 'Peru'],
  '608': ['PH', 'PHL', 'Philippines'], '612': ['PN', 'PCN', 'Pitcairn Islands'], '616': ['PL', 'POL', 'Poland'],
  '620': ['PT', 'PRT', 'Portugal'], '624': ['GW', 'GNB', 'Guinea-Bissau'], '626': ['TL', 'TLS', 'Timor-Leste', 'East Timor'],
  '630': ['PR', 'PRI', 'Puerto Rico'], '634': ['QA', 'QAT', 'Qatar'], '642': ['RO', 'ROU', 'Romania'],
  '643': ['RU', 'RUS', 'Russia', 'Russian Federation'], '646': ['RW', 'RWA', 'Rwanda'], '652': ['BL', 'BLM', 'Saint Barthélemy'],
  '654': ['SH', 'SHN', 'Saint Helena'], '659': ['KN', 'KNA', 'Saint Kitts and Nevis'], '660': ['AI', 'AIA', 'Anguilla'],
  '662': ['LC', 'LCA', 'Saint Lucia'], '663': ['MF', 'MAF', 'Saint Martin'], '666': ['PM', 'SPM', 'Saint Pierre and Miquelon'],
  '670': ['VC', 'VCT', 'Saint Vincent and the Grenadines'], '674': ['SM', 'SMR', 'San Marino'], '678': ['ST', 'STP', 'São Tomé and Príncipe'],
  '682': ['SA', 'SAU', 'Saudi Arabia'], '686': ['SN', 'SEN', 'Senegal'], '688': ['RS', 'SRB', 'Serbia'],
  '690': ['SC', 'SYC', 'Seychelles'], '694': ['SL', 'SLE', 'Sierra Leone'], '702': ['SG', 'SGP', 'Singapore'],
  '703': ['SK', 'SVK', 'Slovakia'], '704': ['VN', 'VNM', 'Vietnam', 'Viet Nam'], '705': ['SI', 'SVN', 'Slovenia'],
  '706': ['SO', 'SOM', 'Somalia'], '710': ['ZA', 'ZAF', 'South Africa'], '716': ['ZW', 'ZWE', 'Zimbabwe'],
  '724': ['ES', 'ESP', 'Spain'], '728': ['SS', 'SSD', 'South Sudan'], '729': ['SD', 'SDN', 'Sudan'],
  '732': ['EH', 'ESH', 'Western Sahara'], '740': ['SR', 'SUR', 'Suriname'], '748': ['SZ', 'SWZ', 'Eswatini', 'Swaziland'],
  '752': ['SE', 'SWE', 'Sweden'], '756': ['CH', 'CHE', 'Switzerland'], '760': ['SY', 'SYR', 'Syria'],
  '762': ['TJ', 'TJK', 'Tajikistan'], '764': ['TH', 'THA', 'Thailand'], '768': ['TG', 'TGO', 'Togo'],
  '776': ['TO', 'TON', 'Tonga'], '780': ['TT', 'TTO', 'Trinidad and Tobago'], '784': ['AE', 'ARE', 'United Arab Emirates', 'UAE'],
  '788': ['TN', 'TUN', 'Tunisia'], '792': ['TR', 'TUR', 'Turkey', 'Türkiye'], '795': ['TM', 'TKM', 'Turkmenistan'],
  '796': ['TC', 'TCA', 'Turks and Caicos Islands'], '798': ['TV', 'TUV', 'Tuvalu'], '800': ['UG', 'UGA', 'Uganda'],
  '804': ['UA', 'UKR', 'Ukraine'], '807': ['MK', 'MKD', 'North Macedonia', 'Macedonia'], '818': ['EG', 'EGY', 'Egypt'],
  '826': ['GB', 'GBR', 'United Kingdom', 'UK', 'Great Britain', 'Britain', 'England', 'Scotland', 'Wales', 'Northern Ireland'],
  '831': ['GG', 'GGY', 'Guernsey'], '832': ['JE', 'JEY', 'Jersey'], '833': ['IM', 'IMN', 'Isle of Man'],
  '834': ['TZ', 'TZA', 'Tanzania'], '840': ['US', 'USA', 'United States', 'United States of America', 'America', 'U.S.', 'U.S.A.'],
  '850': ['VI', 'VIR', 'U.S. Virgin Islands'], '854': ['BF', 'BFA', 'Burkina Faso'], '858': ['UY', 'URY', 'Uruguay'],
  '860': ['UZ', 'UZB', 'Uzbekistan'], '862': ['VE', 'VEN', 'Venezuela'], '876': ['WF', 'WLF', 'Wallis and Futuna'],
  '882': ['WS', 'WSM', 'Samoa'], '887': ['YE', 'YEM', 'Yemen'], '894': ['ZM', 'ZMB', 'Zambia'],
};
// Entities world-atlas carries without an ISO numeric id, keyed by atlas name: [alpha-2, alpha-3, name, parent].
// XK / XKX for Kosovo are user-assigned codes in common use (EU, IMF), not ISO 3166 codes.
const NO_ID = {
  'Kosovo': ['XK', 'XKX', 'Kosovo', null],
  'Somaliland': [null, null, 'Somaliland', 'SO'],
  'N. Cyprus': [null, null, 'Northern Cyprus', 'CY'],
  'Cyprus U.N. Buffer Zone': [null, null, 'Cyprus U.N. Buffer Zone', 'CY'],
  'Akrotiri': [null, null, 'Akrotiri', 'CY'],
  'Dhekelia': [null, null, 'Dhekelia', 'CY'],
  'Baikonur': [null, null, 'Baikonur', 'KZ'],
  'USNB Guantanamo Bay': [null, null, 'Guantanamo Bay', 'CU'],
  'Coral Sea Is.': [null, null, 'Coral Sea Islands', 'AU'],
  'Clipperton I.': [null, null, 'Clipperton Island', 'FR'],
  'Siachen Glacier': [null, null, 'Siachen Glacier', null],
  'Spratly Is.': [null, null, 'Spratly Islands', null],
  'Scarborough Reef': [null, null, 'Scarborough Reef', null],
  'Bajo Nuevo Bank': [null, null, 'Bajo Nuevo Bank', null],
  'Serranilla Bank': [null, null, 'Serranilla Bank', null],
};
// 'Indian Ocean Ter.' is Christmas Island and the Cocos (Keeling) Islands in one MultiPolygon: split by longitude.
const SPLIT = { 'Indian Ocean Ter.': (lon) => (lon < 100 ? '166' : '162') };

// ---------------------------------------------------------------------------------------------------------------
// fetch
const PACKAGES = { 'world-atlas': 'world-atlas@2.0.2', 'sane-topojson': 'sane-topojson@4.0.0' };   // exact: --check compares against these
let tmp = null;
function fetchPackages() {
  const src = arg('--src');
  if (src) return path.resolve(src);
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'world-data-'));
  for (const [name, spec] of Object.entries(PACKAGES)) {
    if (name === 'sane-topojson' && LAKES === false) continue;
    const tgz = execFileSync('npm', ['pack', spec, '--silent', '--pack-destination', tmp], { encoding: 'utf8' }).trim().split('\n').pop();
    fs.mkdirSync(path.join(tmp, name));
    execFileSync('tar', ['xzf', path.join(tmp, tgz), '-C', path.join(tmp, name), '--strip-components=1']);
  }
  return tmp;
}

// TopoJSON: arcs are delta-coded integer positions; the transform maps them to degrees.
function decodeTopology(topo) {
  const [sx, sy] = topo.transform ? topo.transform.scale : [1, 1];
  const [tx, ty] = topo.transform ? topo.transform.translate : [0, 0];
  return topo.arcs.map((arc) => {
    let x = 0, y = 0;
    return arc.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty]; });
  });
}
const arcPts = (arcs, i) => (i >= 0 ? arcs[i] : arcs[~i].slice().reverse());
function ringCoords(arcs, ring) {
  const out = [];
  for (const i of ring) { const p = arcPts(arcs, i); for (let k = out.length ? 1 : 0; k < p.length; k++) out.push(p[k]); }
  return out;
}
// world-atlas v2 does not cut rings at the antimeridian (d3-geo clips on the sphere). Make longitudes continuous;
// a ring that goes round a pole (it ends 360 degrees from where it started) is closed through that pole.
function unwrap(r) {
  const out = [];
  let off = 0;
  for (let i = 0; i < r.length; i++) {
    if (i) { const d = r[i][0] + off - out[i - 1][0]; if (d > 180) off -= 360; else if (d < -180) off += 360; }
    out.push([r[i][0] + off, r[i][1]]);
  }
  return out;
}
function unwrapRing(r, near = null) {
  const u = unwrap(r), d = u[u.length - 1][0] - u[0][0];
  if (Math.abs(d) > 180) {
    const pole = u.reduce((s, p) => s + p[1], 0) > 0 ? 90 : -90;
    u.push([u[u.length - 1][0], pole], [u[0][0], pole], u[0].slice());
  }
  // shift by whole turns: an outer ring so it starts in [-180, 180), a hole so it starts nearest its outer ring
  const x0 = near === null ? 0 : near, shift = Math.round((x0 - u[0][0]) / 360) * 360;
  return shift ? u.map(([x, y]) => [x + shift, y]) : u;
}
const wrapLon = (x) => ((((x + 180) % 360) + 360) % 360) - 180;
const polygonsOf = (g) => (g.type === 'Polygon' ? [g.arcs] : g.type === 'MultiPolygon' ? g.arcs : []);

// ---------------------------------------------------------------------------------------------------------------
// geometry helpers
function ringArea(r) {                                // signed area in square degrees (equal-area: lon, sin lat)
  let a = 0;
  const k = 180 / Math.PI, s = (y) => Math.sin(y * Math.PI / 180) * k;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] - r[i][0]) * (s(r[j][1]) + s(r[i][1])) / 2;
  return a;
}
// Mapbox's polylabel, re-implemented: the interior point farthest from the outline, in a local projection.
function polylabel(rings, precision = 0.05) {
  const lat0 = rings[0].reduce((s, p) => s + p[1], 0) / rings[0].length, k = Math.cos(lat0 * Math.PI / 180);
  const P = rings.map((r) => r.map(([x, y]) => [x * k, y]));
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of P[0]) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const dist = (x, y) => {                           // signed distance to the outline, positive inside
    let inside = false, m = Infinity;
    for (const r of P) for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const [ax, ay] = r[i], [bx, by] = r[j];
      if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) inside = !inside;
      let dx = bx - ax, dy = by - ay, t = dx || dy ? ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy) : 0;
      t = Math.max(0, Math.min(1, t));
      const ex = ax + t * dx - x, ey = ay + t * dy - y;
      m = Math.min(m, ex * ex + ey * ey);
    }
    return (inside ? 1 : -1) * Math.sqrt(m);
  };
  const cell = (x, y, h) => { const d = dist(x, y); return { x, y, h, d, max: d + h * Math.SQRT2 }; };
  const size = Math.min(x1 - x0, y1 - y0);
  if (size === 0) return [x0 / k, y0];
  let h = size / 2, queue = [];
  for (let x = x0; x < x1; x += size) for (let y = y0; y < y1; y += size) queue.push(cell(x + h, y + h, h));
  // seed with the area centroid, as polylabel does
  let cx = 0, cy = 0, A = 0;
  for (let i = 0, j = P[0].length - 1; i < P[0].length; j = i++) {
    const [ax, ay] = P[0][i], [bx, by] = P[0][j], f = ax * by - bx * ay;
    cx += (ax + bx) * f; cy += (ay + by) * f; A += f * 3;
  }
  let best = A ? cell(cx / A, cy / A, 0) : cell(P[0][0][0], P[0][0][1], 0);
  const bbox = cell(x0 + (x1 - x0) / 2, y0 + (y1 - y0) / 2, 0);
  if (bbox.d > best.d) best = bbox;
  while (queue.length) {
    let bi = 0;
    for (let i = 1; i < queue.length; i++) if (queue[i].max > queue[bi].max) bi = i;
    const c = queue[bi]; queue[bi] = queue[queue.length - 1]; queue.pop();
    if (c.d > best.d) best = c;
    if (c.max - best.d <= precision) continue;
    h = c.h / 2;
    queue.push(cell(c.x - h, c.y - h, h), cell(c.x + h, c.y - h, h), cell(c.x - h, c.y + h, h), cell(c.x + h, c.y + h, h));
  }
  return [best.x / k, best.y];
}
// Smallest longitude span covering every part: [west, east], west > east when it crosses the antimeridian.
function lonSpan(ranges) {
  const iv = [], merged = [];
  for (const [a, b] of ranges) {                     // unwrapped ranges: fold onto [-180, 180]
    if (b - a >= 360) return [-180, 180];
    const w = wrapLon(a), e = w + (b - a);
    if (e > 180) iv.push([w, 180], [-180, e - 360]); else iv.push([w, e]);
  }
  iv.sort((a, b) => a[0] - b[0]);
  for (const [a, b] of iv) {
    const last = merged[merged.length - 1];
    if (last && a <= last[1]) last[1] = Math.max(last[1], b); else merged.push([a, b]);
  }
  let gap = merged[0][0] + 360 - merged[merged.length - 1][1], west = merged[0][0], east = merged[merged.length - 1][1];
  for (let i = 1; i < merged.length; i++) {
    const g = merged[i][0] - merged[i - 1][1];
    if (g > gap) { gap = g; west = merged[i][0]; east = merged[i - 1][1]; }
  }
  return [west, east];
}
// Douglas-Peucker on an open polyline; a closed one is split at its farthest vertex first.
function simplify(pts, tol) {
  if (pts.length <= 2) return pts.slice();
  const closed = pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1];
  if (closed) {
    let far = 1, fd = -1;
    for (let i = 1; i < pts.length - 1; i++) { const d = (pts[i][0] - pts[0][0]) ** 2 + (pts[i][1] - pts[0][1]) ** 2; if (d > fd) { fd = d; far = i; } }
    const a = simplify(pts.slice(0, far + 1), tol), b = simplify(pts.slice(far), tol);
    return a.concat(b.slice(1));
  }
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy);
    let m = -1, mi = -1;
    for (let i = a + 1; i < b; i++) {
      const d = L ? Math.abs(dy * (pts[i][0] - ax) - dx * (pts[i][1] - ay)) / L : Math.hypot(pts[i][0] - ax, pts[i][1] - ay);
      if (d > m) { m = d; mi = i; }
    }
    if (m > tol) { keep[mi] = 1; stack.push([a, mi], [mi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

// Scanline fill of a polygon (even-odd over its rings) on the sample grid: visit(at, row, col) for each sample
// centre inside. Longitudes may run past +-180 (unwrapped rings); columns wrap.
const SW = W * SS, SH = H * SS, SST = STEP / SS;
function scan(rings, visit) {
  const rows = new Map();
  for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [x1, y1] = r[j], [x2, y2] = r[i];
    if (y1 === y2) continue;
    const lo = Math.min(y1, y2), hi = Math.max(y1, y2);
    const r0 = Math.max(0, Math.ceil((90 - hi) / SST - 0.5)), r1 = Math.min(SH - 1, Math.floor((90 - lo) / SST - 0.5));
    for (let row = r0; row <= r1; row++) {
      const yc = 90 - (row + 0.5) * SST;
      if ((y1 > yc) === (y2 > yc)) continue;
      if (!rows.has(row)) rows.set(row, []);
      rows.get(row).push(x1 + (yc - y1) * (x2 - x1) / (y2 - y1));
    }
  }
  for (const [row, xs] of rows) {
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const c0 = Math.ceil((xs[k] + 180) / SST - 0.5), c1 = Math.min(c0 + SW - 1, Math.ceil((xs[k + 1] + 180) / SST - 0.5) - 1);
      for (let cc = c0; cc <= c1; cc++) { const col = ((cc % SW) + SW) % SW; visit(row * SW + col, row, col); }
    }
  }
}

// ---------------------------------------------------------------------------------------------------------------
// byte coding
const zz = (n) => (n << 1) ^ (n >> 31);
function varint(out, n) { while (n > 127) { out.push((n & 127) | 128); n >>>= 7; } out.push(n); }
const b64 = (bytes) => Buffer.from(bytes).toString('base64');

// ---------------------------------------------------------------------------------------------------------------
function build(dir) {
  const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'world-atlas', 'package.json'), 'utf8'));
  const lakePkg = LAKES ? JSON.parse(fs.readFileSync(path.join(dir, 'sane-topojson', 'package.json'), 'utf8')) : null;
  const topo = JSON.parse(fs.readFileSync(path.join(dir, 'world-atlas', `countries-${RES}.json`), 'utf8'));
  const arcs = decodeTopology(topo);

  // 1. countries: group geometries by ISO numeric id (Ashmore and Cartier shares Australia's), split the one
  //    MultiPolygon that holds two ISO entities, key the rest by name.
  const byKey = new Map();
  const add = (key, meta, polys) => {
    if (!byKey.has(key)) byKey.set(key, { ...meta, polys: [] });
    byKey.get(key).polys.push(...polys);
  };
  const missing = [];
  for (const g of topo.objects.countries.geometries) {
    const name = g.properties.name, polys = polygonsOf(g);
    if (!polys.length) continue;
    if (SPLIT[name]) {
      for (const p of polys) {
        const id = SPLIT[name](ringCoords(arcs, p[0])[0][0]);
        add(id, { id, atlas: name }, [p]);
      }
      continue;
    }
    if (g.id !== undefined) {
      if (!ISO[g.id]) { missing.push(`${g.id} ${name}`); continue; }
      add(g.id, { id: g.id, atlas: name }, polys);
    } else if (NO_ID[name]) add(name, { id: null, atlas: name }, polys);
    else missing.push(`(no id) ${name}`);
  }
  if (missing.length) throw new Error(`no ISO entry for: ${missing.join(', ')}`);
  const countries = [...byKey.values()].map((c) => {
    const iso = c.id ? ISO[c.id] : NO_ID[c.atlas];
    const [a2, a3, name] = iso;
    return { ...c, a2, a3, num: c.id ? +c.id : null, name, aliases: c.id ? iso.slice(3) : [], parent: c.id ? null : iso[3] };
  }).sort((a, b) => a.name.localeCompare(b.name, 'en'));
  if (countries.length > 255) throw new Error('more than 255 countries: the raster stores one byte per cell');

  // 2. raster: scanline fill of each polygon on a grid of SS x SS samples per cell (even-odd, so holes such as
  //    Lesotho stay out). A cell is land when at least COVER of its samples are, and takes the country holding
  //    most of them. A polygon left with no cell of its own (an island smaller than a cell, or a thin one) claims
  //    its best-covered cell if that is sea, so Singapore, Malta or Bahrain stay on the map.
  const sub = new Uint8Array(SW * SH).fill(SEA);
  const touched = [];                                 // per polygon: [country, Map(cell -> samples)]
  countries.forEach((c, ci) => {
    // largest ring first: on the sphere a ring can enclose the pole, so Antarctica's mainland comes as a
    // degenerate ring at 90S with the coastline as its "hole"; even-odd filling does not care which is first
    c.rings = c.polys.map((p) => {
      const outer = unwrapRing(ringCoords(arcs, p[0]));
      const all = [outer, ...p.slice(1).map((r) => unwrapRing(ringCoords(arcs, r), outer[0][0]))];
      return all.sort((x, y) => Math.abs(ringArea(y)) - Math.abs(ringArea(x)));
    });
    for (const rings of c.rings) {
      const cells = new Map();
      scan(rings, (at, row, col) => {
        if (sub[at] !== SEA) return;
        sub[at] = ci;
        const cell = Math.floor(row / SS) * W + Math.floor(col / SS);
        cells.set(cell, (cells.get(cell) || 0) + 1);
      });
      touched.push([ci, cells, rings[0]]);
    }
  });
  let lakes = 0, lakeSamples = 0;
  if (LAKES) {                                        // lakes (and their islands, as holes) back to water
    const lt = JSON.parse(fs.readFileSync(path.join(dir, 'sane-topojson', 'dist', `world_${RES === '110m' ? '110m' : '50m'}.json`), 'utf8'));
    const la = decodeTopology(lt);
    for (const g of lt.objects.lakes.geometries) for (const p of polygonsOf(g)) {
      lakes++;
      scan(p.map((r) => unwrapRing(ringCoords(la, r))), (at) => { if (sub[at] !== SEA) { sub[at] = SEA; lakeSamples++; } });
    }
  }
  const grid = new Uint8Array(W * H).fill(SEA), need = Math.ceil(COVER * SS * SS);
  const count = new Uint16Array(countries.length);
  for (let row = 0; row < H; row++) for (let col = 0; col < W; col++) {
    let land = 0, best = -1;
    for (let dy = 0; dy < SS; dy++) for (let dx = 0; dx < SS; dx++) {
      const v = sub[(row * SS + dy) * SW + col * SS + dx];
      if (v === SEA) continue;
      land++; count[v]++;
      if (best < 0 || count[v] > count[best]) best = v;
    }
    if (land >= need) grid[row * W + col] = best;
    for (let dy = 0; dy < SS; dy++) for (let dx = 0; dx < SS; dx++) count[sub[(row * SS + dy) * SW + col * SS + dx]] = 0;
  }
  let rescued = 0;
  for (const [ci, cells, ring] of touched) {
    let bestCell = -1, bestN = 0, kept = false;
    for (const [cell, n] of cells) { if (grid[cell] === ci) { kept = true; break; } if (n > bestN) { bestN = n; bestCell = cell; } }
    if (kept) continue;
    if (bestCell < 0) {                               // no sample at all: the cell under the ring's vertex mean
      let sx = 0, sy = 0;
      for (const [x, y] of ring) { sx += x; sy += y; }
      const lon = wrapLon(sx / ring.length), lat = sy / ring.length;
      bestCell = Math.min(H - 1, Math.floor((90 - lat) / STEP)) * W + Math.min(W - 1, Math.floor((lon + 180) / STEP));
    }
    if (grid[bestCell] === SEA) { grid[bestCell] = ci; rescued++; }
  }

  // 3. records: bbox, label point
  for (const c of countries) {
    let s = 90, n = -90; const spans = [];
    for (const rings of c.rings) {
      let w = Infinity, e = -Infinity;
      for (const [x, y] of rings[0]) { w = Math.min(w, x); e = Math.max(e, x); s = Math.min(s, y); n = Math.max(n, y); }
      spans.push([w, e]);
    }
    const [w, e] = lonSpan(spans);
    c.bbox = [w, s, e, n];
    const area = (rings) => Math.abs(rings.reduce((t, r, k) => t + (k ? -1 : 1) * Math.abs(ringArea(r)), 0));
    const big = c.rings.reduce((a, b) => (area(b) > area(a) ? b : a));
    let bw = Infinity, be = -Infinity, bs = 90, bn = -90;
    for (const [x, y] of big[0]) { bw = Math.min(bw, x); be = Math.max(be, x); bs = Math.min(bs, y); bn = Math.max(bn, y); }
    const [mw, me] = lonSpan([[bw, be]]);
    c.main = [mw, bs, me, bn];
    const lab = polylabel(big, 0.02);
    c.label = [wrapLon(lab[0]), lab[1]];
    c.cells = 0;
  }
  for (let i = 0; i < grid.length; i++) if (grid[i] !== SEA) countries[grid[i]].cells++;

  // 4. raster coding: per row, (value, run length) pairs; value byte then varint length
  const rb = [];
  for (let row = 0; row < H; row++) {
    let col = 0;
    while (col < W) {
      const v = grid[row * W + col]; let k = col + 1;
      while (k < W && grid[row * W + k] === v) k++;
      rb.push(v); varint(rb, k - col); col = k;
    }
  }

  // 5. outlines: simplify each shared arc once (ends fixed, so neighbours still meet), drop rings that collapse,
  //    keep only arcs still in use, quantise to Q degrees, delta + zigzag varint.
  const simp = arcs.map((a) => simplify(unwrap(a), TOL).map(([x, y]) => [Math.round(wrapLon(x) / Q), Math.round(y / Q)]));
  const used = new Map(), order = [];
  const ringsOut = countries.map((c) => {
    const keep = [];
    for (const p of c.polys) for (const r of p) {
      const pts = ringCoords(simp, r);
      const uniq = new Set(pts.map((q) => q.join(','))).size;
      if (uniq < 3 || Math.abs(ringArea(unwrapRing(pts.map(([x, y]) => [x * Q, y * Q])))) < TOL * TOL) continue;
      keep.push(r.map((i) => {
        const a = i >= 0 ? i : ~i;
        if (!used.has(a)) { used.set(a, order.length); order.push(a); }
        return i >= 0 ? used.get(a) : ~used.get(a);
      }));
    }
    return keep;
  });
  const ab = [];
  varint(ab, order.length);
  let npts = 0;
  for (const a of order) {
    const pts = simp[a].filter((p, i, s) => i === 0 || p[0] !== s[i - 1][0] || p[1] !== s[i - 1][1]);
    varint(ab, pts.length); npts += pts.length;
    let px = 0, py = 0;
    for (const [x, y] of pts) { varint(ab, zz(x - px)); varint(ab, zz(y - py)); px = x; py = y; }
  }
  const gb = [];
  for (const rings of ringsOut) {
    varint(gb, rings.length);
    for (const r of rings) { varint(gb, r.length); for (const i of r) varint(gb, zz(i)); }
  }

  const stats = { countries: countries.length, rescued, lakes, lakeSamples, rasterBytes: rb.length, arcs: order.length, points: npts, arcBytes: ab.length, ringBytes: gb.length, land: grid.reduce((s, v) => s + (v !== SEA), 0) };
  return { pkg, lakePkg, countries, grid, raster: b64(rb), arcs: b64(ab), rings: b64(gb), stats };
}

// ---------------------------------------------------------------------------------------------------------------
// the generated file
const r2 = (x) => Math.round(x * 100) / 100;
const str = (s) => JSON.stringify(s);
function emit({ pkg, lakePkg, countries, raster, arcs, rings }) {
  const recs = countries.map((c) => {
    const main = c.main.map(r2), same = main.every((v, k) => v === r2(c.bbox[k]));
    const f = [c.a2, c.a3, c.num, c.name, c.atlas === c.name ? 0 : c.atlas, ...c.bbox.map(r2), ...c.label.map(r2), same ? 0 : main, c.parent || 0, c.aliases.length ? c.aliases.join('|') : 0];
    while (f[f.length - 1] === 0) f.pop();
    return '[' + f.map((v) => (v === null ? 'null' : typeof v === 'string' ? str(v) : Array.isArray(v) ? `[${v}]` : v)).join(',') + ']';
  });
  return `/* World geography for motion-globe: a ${STEP}-degree country raster, country records with ISO 3166 codes,
 * simplified outlines and lookup helpers. Generated by tools/world-data.mjs from world-atlas@${pkg.version}
 * countries-${RES}.json${lakePkg ? `, lakes subtracted from sane-topojson@${lakePkg.version} world_${RES === '110m' ? '110m' : '50m'}.json` : ''}; do not edit by
 * hand, re-run the tool.
 * Data: Made with Natural Earth (naturalearthdata.com), public domain. Packages: world-atlas by Mike Bostock,
 * ISC licence (github.com/topojson/world-atlas)${lakePkg ? '; sane-topojson by Étienne Tétreault-Pinard, MIT licence\n * (github.com/etpinard/sane-topojson)' : ''}. ISO 3166 code table: written into tools/world-data.mjs.
 *
 * WORLD.init()                 decode the raster once (every helper calls it lazily; cheap after the first call)
 * WORLD.W, WORLD.H, WORLD.STEP 1440 x 720 cells of 0.25 degrees; row 0 is the 90N edge, column 0 the 180W edge
 * WORLD.grid                   Uint8Array(W*H) after init(): country index per cell, 255 = sea
 * WORLD.countries[i]           { i, a2, a3, num, name, atlas, aliases, bbox:[w,s,e,n], main:[w,s,e,n],
 *                                label:[lon,lat], parent, cells }
 *                              bbox covers every part, main the largest polygon only (mainland France, the
 *                              contiguous US: frame the camera on it); w > e when a box crosses the antimeridian.
 *                              label is the pole of inaccessibility of the largest polygon. parent is the ISO
 *                              alpha-2 of the country an entity without its own code sits in (Somaliland -> SO).
 *                              cells counts its raster cells (after init); 0 for microstates such as Monaco
 * WORLD.countryAt(lat, lon)    country index of the cell, or -1 for sea
 * WORLD.landAt(lat, lon)       true on land
 * WORLD.country(q)             record by index, alpha-2, alpha-3, numeric, name, atlas name or alias, or null
 * WORLD.nearestLand(lat, lon, maxKm=50)  { i, lat, lon, km } of the nearest land cell centre, or null
 * WORLD.resolve(lat, lon, maxKm=50)      countryAt, falling back to nearestLand: { i, lat, lon, km } or null
 * WORLD.near(lat, lon, km=50)           countries with a cell within km, nearest first: [{ i, km }]
 * WORLD.inCountry(lat, lon, q, km=30)    true if a cell of country q (or of an entity whose parent is q) lies
 *                                        within km of the point (for a country too small to own a cell, within
 *                                        km of its bbox): the critique's "place is in its country" test
 * WORLD.outline(i)             the country's simplified rings, [[lon,lat],...] each (draw with even-odd fill)
 * WORLD.arcs()                 every outline arc once: { pts:[[lon,lat],...], left, right } with the country
 *                              indices on each side (right -1 = coastline), for border strokes
 * WORLD.dist(lat1, lon1, lat2, lon2)     great-circle distance in km
 */
const WORLD = (() => {
  const W = ${W}, H = ${H}, STEP = ${STEP}, SEA = 255, Q = ${Q}, R = 6371.0088;
  const REC = [
${recs.map((r) => '    ' + r).join(',\n')},
  ];
  const RASTER = ${str(raster)};
  const ARCS = ${str(arcs)};
  const RINGS = ${str(rings)};
  const bytes = (s) => { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
  const reader = (u) => { let p = 0; const r = () => { let n = 0, s = 0, b; do { b = u[p++]; n |= (b & 127) << s; s += 7; } while (b & 128); return n >>> 0; }; r.byte = () => u[p++]; return r; };
  const unzz = (n) => (n >>> 1) ^ -(n & 1);
  const norm = (s) => String(s).normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const countries = REC.map((r, i) => ({
    i, a2: r[0], a3: r[1], num: r[2], name: r[3], atlas: r[4] || r[3], bbox: [r[5], r[6], r[7], r[8]], label: [r[9], r[10]],
    main: r[11] || [r[5], r[6], r[7], r[8]], parent: r[12] || null, aliases: r[13] ? r[13].split('|') : [], cells: 0,
  }));
  const index = new Map();
  for (const c of countries) for (const k of [c.a2, c.a3, c.name, c.atlas, ...c.aliases]) if (k && !index.has(norm(k))) index.set(norm(k), c.i);
  const WD = { W, H, STEP, SEA, countries, grid: null };
  WD.init = () => {
    if (WD.grid) return WD;
    const g = new Uint8Array(W * H), next = reader(bytes(RASTER));
    for (let o = 0; o < g.length;) { const v = next.byte(), n = next(); g.fill(v, o, o + n); o += n; if (v !== SEA) countries[v].cells += n; }
    WD.grid = g;
    return WD;
  };
  const cell = (lat, lon) => {
    const row = Math.min(H - 1, Math.max(0, Math.floor((90 - lat) / STEP)));
    const col = ((Math.floor((lon + 180) / STEP) % W) + W) % W;
    return row * W + col;
  };
  WD.cell = cell;
  WD.countryAt = (lat, lon) => { const v = WD.init().grid[cell(lat, lon)]; return v === SEA ? -1 : v; };
  WD.landAt = (lat, lon) => WD.countryAt(lat, lon) >= 0;
  WD.country = (q) => {
    if (q == null) return null;
    if (typeof q === 'number') return countries[q] || countries.find((c) => c.num === q) || null;
    if (/^\\d{1,3}$/.test(q)) return countries.find((c) => c.num === +q) || null;
    const i = index.get(norm(q));
    return i === undefined ? null : countries[i];
  };
  const rad = Math.PI / 180;
  WD.dist = (la1, lo1, la2, lo2) => {
    const a = Math.sin((la2 - la1) * rad / 2) ** 2 + Math.cos(la1 * rad) * Math.cos(la2 * rad) * Math.sin((lo2 - lo1) * rad / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
  };
  // every cell whose centre lies within km of the point, nearest first is not guaranteed: visit(i, lat, lon, d)
  const around = (lat, lon, km, visit) => {
    const g = WD.init().grid, dr = Math.ceil(km / (R * rad * STEP)) + 1, r0 = Math.floor((90 - lat) / STEP);
    for (let row = Math.max(0, r0 - dr); row <= Math.min(H - 1, r0 + dr); row++) {
      const clat = 90 - (row + 0.5) * STEP, cosl = Math.max(Math.cos(clat * rad), 1e-6);
      const dc = Math.min(W / 2, Math.ceil(km / (R * rad * STEP * cosl)) + 1), c0 = Math.floor((lon + 180) / STEP);
      for (let k = -dc; k <= dc; k++) {
        const col = (((c0 + k) % W) + W) % W, v = g[row * W + col];
        if (v === SEA) continue;
        const clon = -180 + (col + 0.5) * STEP, d = WD.dist(lat, lon, clat, clon);
        if (d <= km) visit(v, clat, clon, d);
      }
    }
  };
  WD.nearestLand = (lat, lon, maxKm = 50) => {
    const here = WD.countryAt(lat, lon);
    if (here >= 0) return { i: here, lat, lon, km: 0 };
    let best = null;
    around(lat, lon, maxKm, (i, la, lo, d) => { if (!best || d < best.km) best = { i, lat: la, lon: lo, km: d }; });
    return best;
  };
  WD.resolve = WD.nearestLand;
  WD.near = (lat, lon, km = 50) => {
    const best = new Map();
    around(lat, lon, km, (i, la, lo, d) => { if (!best.has(i) || d < best.get(i)) best.set(i, d); });
    const here = WD.countryAt(lat, lon);
    if (here >= 0) best.set(here, 0);
    return [...best].map(([i, d]) => ({ i, km: d })).sort((a, b) => a.km - b.km);
  };
  const inBox = (lat, lon, [w, s, e, n], km) => {      // within km of a bbox (w > e crosses the antimeridian)
    const dl = km / (R * rad), dw = dl / Math.max(Math.cos(lat * rad), 1e-6);
    if (lat < s - dl || lat > n + dl) return false;
    const x = (v) => ((((v - w) % 360) + 360) % 360), span = x(e);
    return x(lon) <= span + dw || x(lon) >= 360 - dw;
  };
  WD.inCountry = (lat, lon, q, km = 30) => {
    const c = WD.country(q);
    if (!c) return false;
    WD.init();
    const ok = (i) => i === c.i || (c.a2 && countries[i].parent === c.a2);
    const here = WD.countryAt(lat, lon);
    if (here >= 0 && ok(here)) return true;
    if (!c.cells) return inBox(lat, lon, c.bbox, km); // a microstate smaller than a cell (Monaco, Vatican City)
    let hit = false;
    around(lat, lon, km, (i) => { if (ok(i)) hit = true; });
    return hit;
  };
  let arcCache = null, ringCache = null;
  const decodeOutlines = () => {
    if (arcCache) return;
    const ra = reader(bytes(ARCS)), n = ra();
    arcCache = [];
    for (let a = 0; a < n; a++) {
      const m = ra(), pts = [];
      let x = 0, y = 0;
      for (let k = 0; k < m; k++) { x += unzz(ra()); y += unzz(ra()); pts.push([Math.round(x * Q * 100) / 100, Math.round(y * Q * 100) / 100]); }
      arcCache.push({ pts, left: -1, right: -1 });
    }
    const rr = reader(bytes(RINGS));
    ringCache = countries.map((c) => {
      const nr = rr(), rings = [];
      for (let k = 0; k < nr; k++) {
        const na = rr(), ring = [];
        for (let j = 0; j < na; j++) {
          const s = unzz(rr()), a = arcCache[s >= 0 ? s : ~s];
          if (a.left < 0) a.left = c.i; else if (a.left !== c.i) a.right = c.i;
          const p = s >= 0 ? a.pts : a.pts.slice().reverse();
          for (let q = ring.length ? 1 : 0; q < p.length; q++) ring.push(p[q]);
        }
        rings.push(ring);
      }
      return rings;
    });
  };
  WD.outline = (i) => { decodeOutlines(); return ringCache[i] || []; };
  WD.arcs = () => { decodeOutlines(); return arcCache; };
  return WD;
})();
`;
}

// ---------------------------------------------------------------------------------------------------------------
const dir = fetchPackages();
const data = build(dir);
if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
const js = emit(data);
const s = data.stats;
console.log(`world-atlas@${data.pkg.version} countries-${RES}: ${s.countries} countries, ${s.land} land cells (${s.rescued} tiny islands rescued)` +
  (data.lakePkg ? `; sane-topojson@${data.lakePkg.version}: ${s.lakes} lakes cleared ${s.lakeSamples} samples` : ''));
console.log(`raster ${s.rasterBytes} B -> ${data.raster.length} B base64; outlines ${s.arcs} arcs, ${s.points} points, ${s.arcBytes} + ${s.ringBytes} B -> ${data.arcs.length + data.rings.length} B base64`);
if (CHECK) {
  const old = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : null;
  console.log(old === js ? 'WORLD CHECK PASS' : `WORLD CHECK FAIL: ${path.relative(ROOT, OUT)} differs from a fresh build`);
  if (old !== js) process.exitCode = 1;
} else {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, js);
  console.log(`wrote ${path.relative(ROOT, OUT)}: ${Buffer.byteLength(js)} bytes`);
}
