// Tangled vine strokes for the hero field, after the brochure cover:
// dark, tapered, wandering lines that curl at their tips, with the odd
// ring or bead hanging off them. Generated at build time from a fixed
// seed, so the markup is static and identical on every render.

export const VIEW = { w: 1600, h: 1000 };

function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n) => Math.round(n * 10) / 10;

// Quadratic midpoint smoothing through a polyline
function smooth(pts, move = true) {
  let d = move ? `M${f(pts[0][0])} ${f(pts[0][1])}` : `L${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i];
    const [nx, ny] = pts[i + 1];
    d += `Q${f(x)} ${f(y)} ${f((x + nx) / 2)} ${f((y + ny) / 2)}`;
  }
  const last = pts[pts.length - 1];
  return d + `L${f(last[0])} ${f(last[1])}`;
}

// Walk a path whose curvature drifts; tips may wind into a curl
function walk(r, x, y, a, steps, len, curl) {
  const pts = [[x, y]];
  let k = (r() - 0.5) * 0.06;
  for (let i = 0; i < steps; i++) {
    const tail = i / steps;
    k += (r() - 0.5) * 0.05;
    k *= 0.92;
    const spin = curl && tail > 0.72 ? curl * Math.pow((tail - 0.72) / 0.28, 1.4) * 0.9 : 0;
    a += k + spin;
    const l = len * (curl && tail > 0.72 ? 1 - (tail - 0.72) * 1.8 : 1);
    x += Math.cos(a) * l;
    y += Math.sin(a) * l;
    pts.push([x, y]);
  }
  return pts;
}

// Turn a centreline into a filled, tapering brush shape
function ribbon(pts, w) {
  const n = pts.length - 1;
  const left = [];
  const right = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const m = Math.hypot(dx, dy) || 1;
    const t = i / n;
    const half = (w / 2) * Math.pow(1 - t, 0.55) * Math.min(1, 0.4 + t * 5);
    left.push([p[0] - (dy / m) * half, p[1] + (dx / m) * half]);
    right.push([p[0] + (dy / m) * half, p[1] - (dx / m) * half]);
  });
  return smooth(left) + smooth(right.reverse(), false) + 'Z';
}

// Start just outside an edge, heading roughly inward
function entry(r) {
  const { w, h } = VIEW;
  const side = r();
  if (side < 0.34) return [r() * w, -40, Math.PI / 2 + (r() - 0.5) * 1.4];
  if (side < 0.62) return [w + 40, r() * h, Math.PI + (r() - 0.5) * 1.3];
  if (side < 0.86) return [-40, r() * h, (r() - 0.5) * 1.3];
  return [r() * w, h + 40, -Math.PI / 2 + (r() - 0.5) * 1.3];
}

function layer(seed, count, { width, steps, len }) {
  const r = rng(seed);
  const vines = [];
  const nodes = [];

  const grow = (x, y, a, s, w, depth) => {
    const curl = r() < 0.55 ? (r() < 0.5 ? -1 : 1) * (0.25 + r() * 0.35) : 0;
    const pts = walk(r, x, y, a, s, len, curl);
    vines.push({ d: ribbon(pts, w), line: smooth(pts), w });

    const tip = pts[pts.length - 1];
    if (!curl && r() < 0.5) {
      nodes.push({ x: f(tip[0]), y: f(tip[1]), r: f(4 + r() * 9), ring: r() < 0.6 });
    }
    // A bead or two along the stem
    if (r() < 0.35) {
      const p = pts[Math.floor(pts.length * (0.3 + r() * 0.4))];
      nodes.push({ x: f(p[0]), y: f(p[1]), r: f(2.5 + r() * 4), ring: false });
    }
    if (depth < 2 && s > 18) {
      const branches = r() < 0.6 ? 1 : 2;
      for (let b = 0; b < branches; b++) {
        const i = Math.floor(pts.length * (0.25 + r() * 0.45));
        const [bx, by] = pts[i];
        const [px, py] = pts[i - 1];
        const ba = Math.atan2(by - py, bx - px) + (r() < 0.5 ? -1 : 1) * (0.4 + r() * 0.5);
        grow(bx, by, ba, Math.floor(s * (0.35 + r() * 0.25)), w * 0.55, depth + 1);
      }
    }
  };

  for (let i = 0; i < count; i++) {
    const [x, y, a] = entry(r);
    grow(x, y, a, steps[0] + Math.floor(r() * (steps[1] - steps[0])), width[0] + r() * (width[1] - width[0]), 0);
  }
  return { vines, nodes };
}

export const far = layer(7, 10, { width: [18, 34], steps: [40, 70], len: 22 });
export const near = layer(31, 17, { width: [7, 16], steps: [36, 66], len: 21 });

// The whole field as one static image: ultramarine glow, a soft far layer
// (blurred once at decode, never per frame) and the crisp near layer.
export function vinesSVG() {
  const { w, h } = VIEW;
  const paths = (vines) => vines.map((v) => `<path d="${v.d}"/>`).join('');
  const nodes = near.nodes
    .map((n) =>
      n.ring
        ? `<circle cx="${n.x}" cy="${n.y}" r="${n.r}" fill="none" stroke="#030214" stroke-width="2.6"/>`
        : `<circle cx="${n.x}" cy="${n.y}" r="${n.r}"/>`,
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice">
<defs>
  <radialGradient id="glow" cx=".3" cy=".36" r=".72">
    <stop offset="0" stop-color="#2c1ff2"/>
    <stop offset=".34" stop-color="#1b12cc"/>
    <stop offset=".66" stop-color="#0d077c"/>
    <stop offset="1" stop-color="#04030f"/>
  </radialGradient>
  <filter id="soft" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="5"/></filter>
</defs>
<rect width="${w}" height="${h}" fill="url(#glow)"/>
<g fill="#05032a" opacity=".6" filter="url(#soft)">${paths(far.vines)}</g>
<g fill="#030214">${paths(near.vines)}${nodes}</g>
</svg>`;
}
