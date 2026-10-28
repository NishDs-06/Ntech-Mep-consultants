// The N-Tech mark: dots on a sphere, set in two rings around the line of sight,
// so the front view reads as three-quarters of a circle — open on the right where
// the wordmark sits, the top and bottom arms reaching over and under its N.
// Warm on the upper half, white below. Points are true 3D unit vectors, so the
// loader can spin the globe and settle on the brochure pose at spin = 0.
const RAD = Math.PI / 180;

// [polar angle from the viewer, first azimuth, last azimuth, count]
const RINGS = [
  [76, 42, 318, 11],
  [46, 58, 302, 7],
];

export const DOTS = RINGS.flatMap(([theta, from, to, n]) =>
  Array.from({ length: n }, (_, i) => {
    const phi = (from + ((to - from) * i) / (n - 1)) * RAD;
    const t = theta * RAD;
    const v = [Math.sin(t) * Math.cos(phi), Math.sin(t) * Math.sin(phi), Math.cos(t)];
    return { v, warm: v[1] > 0.01 };
  }),
);

/** Project a dot into a 100×100 viewBox, spun `spin` degrees about the vertical axis. */
export function project(dot, spin = 0, R = 45, size = 9.6) {
  const a = spin * RAD;
  const [x0, y, z0] = dot.v;
  const x = x0 * Math.cos(a) + z0 * Math.sin(a);
  const z = -x0 * Math.sin(a) + z0 * Math.cos(a);
  const facing = Math.max(0, z);
  // Squashed along the radius as the surface turns away; larger toward the front
  const s = size * (0.72 + 0.4 * facing);
  return {
    cx: 50 + R * x,
    cy: 50 - R * y,
    rx: s,
    ry: s * (0.3 + 0.7 * facing),
    rot: (Math.atan2(-y, x) * 180) / Math.PI + 90,
    o: z > 0.02 ? 1 : 0,
  };
}
