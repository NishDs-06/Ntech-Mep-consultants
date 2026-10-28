// The brochure's cube wall, rendered at build time: a grid of unit cubes
// pushed out of a wall by random depths, seen through a perspective camera
// up and to the right. Glossy black, about one in eight cyan-blue, top faces
// catching the light, distance fog. Output is SVG, rasterised once to WebP
// (src/pages/hero/cubes.webp.js), so the browser only ever decodes an image.

export const CUBE_VIEW = { w: 2400, h: 1300 };

function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => {
  const l = Math.hypot(...a);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const f1 = (n) => Math.round(n * 10) / 10;

const hex = (c) => '#' + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const fogged = (h, t) => hex(rgb(h).map((v, i) => v + ([2, 2, 4][i] - v) * t));

const MAT = {
  black: { gloss: ['#5d5d68', '#202027', '#060608'], top: '#46464f', side: '#0f0f13' },
  blue: { gloss: ['#45bdf0', '#168fca', '#085a87'], top: '#6dcdf4', side: '#0a527a' },
};
const FOG_STEPS = 8;

export function cubesSVG() {
  const { w: W, h: H } = CUBE_VIEW;
  const r = rng(23);
  const COLS = [-20, 16];
  const ROWS = [-10, 11];

  // Protrusion per cell; mostly flush, some pushed out, a few recessed
  const depth = new Map();
  const key = (i, j) => `${i},${j}`;
  const blue = new Set();
  for (let i = COLS[0]; i < COLS[1]; i++) {
    for (let j = ROWS[0]; j < ROWS[1]; j++) {
      const x = r();
      const e = x < 0.38 ? 0 : x < 0.62 ? 0.3 : x < 0.8 ? 0.6 : x < 0.9 ? 0.95 : x < 0.96 ? -0.3 : 1.3;
      depth.set(key(i, j), e);
      if (r() < 0.11 && e >= 0) blue.add(key(i, j));
    }
  }
  const E = (i, j) => depth.get(key(i, j)) ?? -1;

  // Camera up and to the right of the wall, looking slightly left and down
  const P = [6.5, 4.2, 11.5];
  const T = [1, 0.4, 0];
  const fw = norm(sub(T, P));
  const ru = norm(cross(fw, [0, 1, 0]));
  const up = cross(ru, fw);
  const focal = H / 2 / Math.tan((50 * Math.PI) / 360);
  const project = (p) => {
    const d = sub(p, P);
    const z = dot(d, fw);
    return [W / 2 + (focal * dot(d, ru)) / z, H / 2 - (focal * dot(d, up)) / z, z];
  };

  const faces = [];
  const add = (pts, normal, kind, mat) => {
    const c = pts.reduce((a, p) => [a[0] + p[0] / 4, a[1] + p[1] / 4, a[2] + p[2] / 4], [0, 0, 0]);
    if (dot(normal, sub(P, c)) <= 0) return; // facing away
    const pr = pts.map(project);
    if (pr.some((p) => p[2] <= 0.5)) return;
    if (pr.every((p) => p[0] < -50) || pr.every((p) => p[0] > W + 50)) return;
    if (pr.every((p) => p[1] < -50) || pr.every((p) => p[1] > H + 50)) return;
    faces.push({ pr, kind, mat, dist: Math.hypot(...sub(c, P)) });
  };

  for (let i = COLS[0]; i < COLS[1]; i++) {
    for (let j = ROWS[0]; j < ROWS[1]; j++) {
      const e = E(i, j);
      const mat = blue.has(key(i, j)) ? 'blue' : 'black';
      add([[i, j + 1, e], [i + 1, j + 1, e], [i + 1, j, e], [i, j, e]], [0, 0, 1], 'front', mat);
      // Only the exposed band of each side: from the neighbour's face up to ours
      const eu = E(i, j + 1);
      if (eu < e) add([[i, j + 1, eu], [i + 1, j + 1, eu], [i + 1, j + 1, e], [i, j + 1, e]], [0, 1, 0], 'top', mat);
      const ed = E(i, j - 1);
      if (ed < e) add([[i, j, e], [i + 1, j, e], [i + 1, j, ed], [i, j, ed]], [0, -1, 0], 'side', mat);
      const el = E(i - 1, j);
      if (el < e) add([[i, j, el], [i, j + 1, el], [i, j + 1, e], [i, j, e]], [-1, 0, 0], 'side', mat);
      const er = E(i + 1, j);
      if (er < e) add([[i + 1, j, e], [i + 1, j + 1, e], [i + 1, j + 1, er], [i + 1, j, er]], [1, 0, 0], 'side', mat);
    }
  }

  faces.sort((a, b) => b.dist - a.dist);
  const dMin = Math.min(...faces.map((f) => f.dist));
  const dMax = Math.max(...faces.map((f) => f.dist));
  const fogOf = (d) => Math.min(FOG_STEPS - 1, Math.floor(((d - dMin) / (dMax - dMin)) * FOG_STEPS));
  const fogT = (s) => Math.pow(s / (FOG_STEPS - 1), 1.3) * 0.82;

  let defs = '';
  for (const m of Object.keys(MAT)) {
    for (let s = 0; s < FOG_STEPS; s++) {
      const [a, b, c] = MAT[m].gloss.map((h) => fogged(h, fogT(s)));
      defs += `<linearGradient id="${m}${s}" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".42" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>`;
    }
  }

  let body = '';
  for (const f of faces) {
    const s = fogOf(f.dist);
    const d = 'M' + f.pr.map((p) => `${f1(p[0])} ${f1(p[1])}`).join('L') + 'Z';
    if (f.kind === 'front') {
      body += `<path d="${d}" fill="url(#${f.mat}${s})"/>`;
      // specular rim along the top edge
      const [a, b] = f.pr;
      body += `<path d="M${f1(a[0])} ${f1(a[1])}L${f1(b[0])} ${f1(b[1])}" stroke="#fff" stroke-opacity="${(0.22 * (1 - s / FOG_STEPS)).toFixed(2)}" stroke-width="1.6" fill="none"/>`;
    } else {
      body += `<path d="${d}" fill="${fogged(MAT[f.mat][f.kind], fogT(s))}"/>`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>${defs}</defs>
<rect width="100%" height="100%" fill="#020204"/>
<g stroke="#000" stroke-opacity=".55" stroke-width="1.1" stroke-linejoin="round">${body}</g>
</svg>`;
}
