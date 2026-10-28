// The brochure's flame, redrawn in purple: a sheaf of tapered ribbons that
// rise from the lower right and lick up and left across the cube wall, with
// a soft glow behind and a few hot white filaments on top. Built once as SVG
// (src/pages/hero/flame.svg.js) and laid over the right end of the band.

export const FLAME_VIEW = { w: 900, h: 520 };

function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f1 = (n) => Math.round(n * 10) / 10;
const lerp = (a, b, t) => a + (b - a) * t;

function bez(p, t) {
  const u = 1 - t;
  return [0, 1].map((k) => u * u * u * p[0][k] + 3 * u * u * t * p[1][k] + 3 * u * t * t * p[2][k] + t * t * t * p[3][k]);
}

// A ribbon along a cubic curve, widest a little above the base, tapering to a point
function ribbon(p, w0, steps = 48) {
  const pts = [];
  for (let s = 0; s <= steps; s++) pts.push(bez(p, s / steps));
  const left = [];
  const right = [];
  pts.forEach((q, s) => {
    const a = pts[Math.max(0, s - 1)];
    const b = pts[Math.min(steps, s + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    const t = s / steps;
    const w = (w0 * Math.pow(1 - t, 1.15) * Math.min(1, t * 6 + 0.25)) / 2;
    left.push([q[0] - (dy / l) * w, q[1] + (dx / l) * w]);
    right.push([q[0] + (dy / l) * w, q[1] - (dx / l) * w]);
  });
  const all = left.concat(right.reverse());
  return 'M' + all.map((q) => `${f1(q[0])} ${f1(q[1])}`).join('L') + 'Z';
}

export function flameSVG() {
  const { w: W, h: H } = FLAME_VIEW;
  const r = rng(7);

  // Each strand: base off the bottom-right edge, tip up and to the left
  const strand = (spread) => {
    const bx = W + 20 - r() * 140;
    const by = H + 30;
    const tx = lerp(120, 560, r()) + spread * 40;
    const ty = lerp(20, 230, r());
    const sway = lerp(-90, 90, r());
    return [
      [bx, by],
      [bx - lerp(40, 160, r()), lerp(H * 0.45, H * 0.75, r())],
      [lerp(tx, bx, 0.45) + sway, lerp(ty, by, 0.25) + lerp(-60, 60, r())],
      [tx, ty],
    ];
  };

  let glow = '';
  let body = '';
  let hot = '';
  for (let i = 0; i < 26; i++) {
    const p = strand(i / 26);
    const d = ribbon(p, lerp(4, 22, r()));
    glow += `<path d="${d}"/>`;
    body += `<path d="${d}" fill="url(#fl${i % 3})" opacity="${lerp(0.45, 0.95, r()).toFixed(2)}"/>`;
  }
  for (let i = 0; i < 9; i++) {
    hot += `<path d="${ribbon(strand(r()), lerp(1.2, 3.2, r()))}"/>`;
  }

  const grad = (id, a, b) =>
    `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${W}" y1="${H}" x2="${W * 0.2}" y2="0">` +
    `<stop offset="0" stop-color="${a}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${b}" stop-opacity="0"/></linearGradient>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>
${grad('fl0', '#ff3fd2', '#9b3dff')}
${grad('fl1', '#e04cff', '#6a2bff')}
${grad('fl2', '#ff7be6', '#b14dff')}
${grad('flh', '#ffffff', '#f2c9ff')}
<filter id="blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14"/></filter>
</defs>
<g fill="#a53bff" opacity=".55" filter="url(#blur)">${glow}</g>
<g style="mix-blend-mode:screen">${body}</g>
<g fill="url(#flh)" opacity=".85">${hot}</g>
</svg>`;
}
