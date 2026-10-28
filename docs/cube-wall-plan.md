# Hero cube wall — plan (not built yet)

The brochure cover's wall of black cubes with scattered blue faces, rebuilt as a live
background: as the cursor moves, the bricks under it push out of the wall toward you,
then settle back.

Mount point already exists: `<div data-cube-wall>` in `src/components/Hero.astro`.
The CSS tile grid in there today is a stand-in and gets replaced.

## Look

- A slightly tilted wall (camera ~8–12° off-axis, like the brochure) of ~40 × 22 cubes
  that bleeds past every edge of the viewport.
- Cubes in glossy near-black (`#0b0b12`, roughness ~0.35). About 1 in 9 cubes gets a
  cyan-blue face (`#1aa3dc`, the brochure blue). Tint faces a touch towards `--ultra` so
  the wall sits inside the site's palette.
- Uneven resting depth: each cube's z is offset by a small random amount (0–0.15 units)
  so the wall looks hand-stacked rather than perfectly flat. This is what gives the
  poster its shelf feel.
- One soft key light from the upper left, a dim ultramarine rim light from the lower
  right, and a gradient fog into `--ink` at the edges so the headline stays readable.
  The left third (behind the headline) stays darker.

## Interaction

- On pointer move, raycast against an invisible plane at the wall's surface to get the
  cursor's position on the wall.
- Each cube's target z = `maxPush * falloff(distance)`, using a smoothstep falloff over a
  radius of ~4 cubes. `maxPush` ≈ 1.2 cube depths. Add a little per-cube jitter so the
  bump isn't a perfect dome.
- Ease each cube toward its target with a critically-damped spring, so fast swipes
  leave a trail that settles over ~600 ms. Only the blue-faced cubes overshoot slightly,
  which makes them "pop".
- Idle: a slow, faint wave runs across the wall so it's never dead. Pause it while the
  pointer is moving.
- On scroll, the camera dollies back slightly and the wall dims as the hero leaves the
  screen. Rendering stops once the hero is fully out of view.

## Tech

- Three.js with **one `InstancedMesh`** (≈900 boxes in a single draw call) plus an
  instance color attribute for the blue faces. Use a small custom shader chunk so only
  the *front* face of the "blue" instances is blue; the sides stay black, like the poster.
- Per-frame update: write instance matrices only for cubes whose z changed by more than
  0.001. Allocate nothing per frame; reuse typed arrays.
- DPR capped at 1.75. Throttle pointer input to rAF.
- Pause the render loop when the hero isn't intersecting the viewport, when
  `document.hidden` is true, or on window blur.
- Load lazily: dynamically `import('three')` after the loader finishes, so the intro
  stays fast. Three adds ~150 KB gzipped.

## Fallbacks

- **Reduced motion, no WebGL, or context loss:** a static pre-rendered poster image of
  the wall (rendered once from the same scene, saved as AVIF/WebP) in place of the canvas.
- **Touch / coarse pointer:** no hover. Instead, a slow, autonomous "pointer" drifts
  across the wall. Tapping the hero sends a single ripple out from the tap point.
- **Low-end devices** (`navigator.hardwareConcurrency <= 4` or a small screen): halve the
  grid to ~20 × 12 and drop to DPR 1.

## Cleanup

Dispose geometry, material, renderer and the IntersectionObserver, and remove the
pointer, resize and visibility listeners on `pagehide`.

## Open questions for the next session

1. Should the cubes push **out** toward the viewer (the poster feel), or sink **in**
   like pressing keys? The plan above assumes out.
2. Blue only, or a rare amber cube as a brand accent?
3. Should the dot-sphere logo from the loader land *on* the wall as the hand-off from
   the loader to the hero?
