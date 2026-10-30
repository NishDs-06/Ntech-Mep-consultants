import { gsap, ScrollTrigger, SplitText, lenis, reduceMotion, revealHeading, revealUp } from './core.js';
import { DOTS, project } from '../lib/sphere.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;

/* ------------------------------------------------------------------
   Loader: the dot sphere spins up into the brochure pose, the wordmark
   rises, a counter runs. It holds at 099 until the hero's images and
   fonts are decoded (so slow machines never see a half-built page), then
   wipes up in the hero's own vine field. That field *is* the closed hero,
   so the loader simply goes and the hero's middle splits open.
------------------------------------------------------------------- */

// Everything the first screen paints, decoded up front; never waits past 8s
function heroReady() {
  const decode = (src) => {
    const img = new Image();
    img.src = src;
    return img.decode().catch(() => {});
  };
  const wall = $('[data-hero-img]');
  const work = Promise.all([
    wall ? wall.decode().catch(() => {}) : null,
    decode('/hero/vines.svg'),
    document.fonts?.ready,
  ]);
  return Promise.race([work, new Promise((r) => setTimeout(r, 8000))]);
}

function intro() {
  const loader = $('[data-loader]');
  const seen = root.classList.contains('intro-seen');
  if (!loader || seen || reduceMotion) {
    root.classList.remove('intro-play');
    loader?.remove();
    heroIn(seen ? 0.1 : 0);
    return false;
  }

  lenis?.stop();
  // During the intro any slow frame (>50ms) counts as one normal frame, so the
  // globe pauses for it instead of jumping; the page's own setting (0) comes
  // back on hand-off.
  gsap.ticker.lagSmoothing(50, 16);
  // The hero sits under the loader unpainted (.intro-play, set before first
  // paint); it is still fetched and decoded, and shown again in the hold.
  let ready = false;
  const loaded = heroReady();

  const ellipses = $$('[data-sphere] ellipse', loader);
  const state = { spin: -280, grow: 0 };
  const draw = () => {
    ellipses.forEach((el, i) => {
      const p = project(DOTS[i], state.spin);
      el.setAttribute('cx', p.cx.toFixed(2));
      el.setAttribute('cy', p.cy.toFixed(2));
      el.setAttribute('rx', (p.rx * state.grow).toFixed(2));
      el.setAttribute('ry', (p.ry * state.grow).toFixed(2));
      el.setAttribute('transform', `rotate(${p.rot.toFixed(1)} ${p.cx.toFixed(2)} ${p.cy.toFixed(2)})`);
      el.setAttribute('opacity', p.o);
    });
  };
  draw();

  const count = $('[data-loader-count]', loader);
  const counter = { v: 0 };
  const show = () => (count.textContent = String(Math.round(ready ? counter.v : Math.min(99, counter.v))));
  const chars = $$('[data-loader-word] span', loader);
  const tag = $('[data-loader-tag]', loader);

  const tl = gsap.timeline({
    paused: true,
    defaults: { ease: 'expo.out' },
    onComplete: () => {
      try {
        sessionStorage.setItem('nt-intro', '1');
      } catch (e) {}
    },
  });

  tl.set(loader, { animation: 'none' })
    // from a hair above 0, so the field is drawn during the wait before play,
    // not in the first frame of the spin (fully transparent layers aren't drawn)
    .from('.loader-grid', { opacity: 0.01, scale: 1.06, duration: 3.2, ease: 'power2.out' }, 0)
    .to(state, { grow: 1, duration: 1.3, ease: 'back.out(1.6)', onUpdate: draw }, 0.1)
    .to(state, { spin: 0, duration: 3, ease: 'expo.inOut', onUpdate: draw }, 0.1)
    .to(counter, { v: 100, duration: 3.6, ease: 'power2.inOut', onUpdate: show }, 0)
    .from(chars, { yPercent: 115, duration: 1.2, stagger: 0.06 }, 1.6)
    .from(tag, { opacity: 0, letterSpacing: '0.9em', duration: 1.6 }, 2.1)
    // hold here until the hero is decoded and the sections below are set up
    .call(() => {
      tl.pause();
      root.classList.remove('intro-play');
      Promise.all([loaded, setupSections()]).then(() => {
        ready = true;
        show();
        tl.play();
      });
    }, null, 3.7)
    .to('[data-loader-center]', { scale: 0.94, opacity: 0, duration: 0.7, ease: 'power3.in' }, 4.0)
    .to('.loader-foot', { opacity: 0, duration: 0.4 }, 4.0)
    .to('[data-loader-wipe]', { clipPath: 'inset(0% 0 0 0)', duration: 1, ease: 'expo.inOut' }, 4.15)
    .call(() => {
      loader.remove();
      gsap.ticker.lagSmoothing(0);
      lenis?.start();
    }, null, 5.15)
    .add(heroIn(), 5.15);

  // Start once the page's first layout and paint are done: wait for three
  // normal-length frames in a row (at most 0.8s), so the spin never begins
  // inside the browser's busiest frames.
  const t0 = performance.now();
  let last = t0;
  let calm = 0;
  const settle = (now) => {
    calm = now - last < 24 ? calm + 1 : 0;
    last = now;
    if (calm >= 3 || now - t0 > 800) tl.play();
    else requestAnimationFrame(settle);
  };
  requestAnimationFrame(settle);
  return true;
}

/* ------------------------------------------------------------------
   Hero entrance. It starts closed: the band is covered by a curtain of
   the same vine field. A hairline draws across the middle, the curtain
   splits open from there (its picture held still while the edges travel),
   and the wall settles in behind; then the lockup and copy rise.
   Transforms and opacity only; without JS the hero is simply open.
------------------------------------------------------------------- */
function heroIn(delay = 0) {
  const hero = $('[data-hero]');
  if (reduceMotion || !hero) return gsap.timeline();
  hero.classList.add('is-shut');

  const halves = [$('[data-curtain="top"]', hero), $('[data-curtain="bottom"]', hero)];
  const arts = halves.map((h) => $('.hero-curtain-art', h));
  const edges = $$('[data-curtain-edge]', hero);
  const word = SplitText.create($('.logo-word', hero), { type: 'chars' }); // no mask: it would clip the outline
  const tag = SplitText.create('[data-hero-tag]', { type: 'chars' });
  const lede = SplitText.create('[data-hero-lede]', { type: 'lines', mask: 'lines' });
  const shift = () => halves[0].offsetHeight;

  // Starting states are set here, explicitly, rather than left to from()'s
  // immediate render, which doesn't fire for a timeline nested to play later
  // (after the loader). Everything below then animates *to* its resting state.
  const nav = $('[data-nav] .nav-inner');
  const sphere = $('.logo-sphere', hero);
  const acts = $$('[data-hero-act] > *', hero);
  const foot = $('[data-hero-foot]', hero);
  const feet = $$('[data-hero-foot] li', hero);
  gsap.set('[data-hero-rule]', { opacity: 0 });
  gsap.set(nav, { y: -16, opacity: 0 });
  gsap.set(edges, { scaleX: 0 });
  gsap.set('[data-hero-img]', { scale: 1.16 });
  gsap.set(sphere, { scale: 0.6, rotation: -90, opacity: 0, transformOrigin: '50% 50%' });
  gsap.set(word.chars, { yPercent: 45, opacity: 0 });
  gsap.set(tag.chars, { opacity: 0 });
  gsap.set('[data-hero-flame]', { opacity: 0, x: 60 });
  gsap.set('[data-hero-line]', { y: 14, opacity: 0 });
  gsap.set(lede.lines, { yPercent: 105 });
  gsap.set(acts, { y: 16, opacity: 0 });
  gsap.set(foot, { opacity: 0 });
  gsap.set(feet, { y: 10, opacity: 0 });

  const tl = gsap.timeline({ delay, defaults: { ease: 'expo.out' } });
  tl.to(nav, { y: 0, opacity: 1, duration: 1.2 }, 0.2)
    .to(edges, { scaleX: 1, duration: 1.1, ease: 'expo.inOut' }, 0)
    .to(halves[0], { y: () => -shift(), duration: 1.6, ease: 'expo.inOut' }, 0.75)
    .to(halves[1], { y: shift, duration: 1.6, ease: 'expo.inOut' }, 0.75)
    .to(arts[0], { y: shift, duration: 1.6, ease: 'expo.inOut' }, 0.75)
    .to(arts[1], { y: () => -shift(), duration: 1.6, ease: 'expo.inOut' }, 0.75)
    .to('[data-hero-img]', { scale: 1, duration: 2.8 }, 0.75)
    .set('[data-hero-rule]', { opacity: 1 }, 2.35)
    .call(() => hero.classList.remove('is-shut'), null, 2.36)
    .to(sphere, { scale: 1, rotation: 0, opacity: 1, duration: 1.6 }, 1.2)
    .to(word.chars, { yPercent: 0, opacity: 1, duration: 1.1, stagger: 0.05, onComplete: () => word.revert() }, 1.3)
    .to(tag.chars, { opacity: 1, duration: 0.05, stagger: 0.035, ease: 'none' }, 1.7)
    .to('[data-hero-flame]', { opacity: 1, x: 0, duration: 1.8 }, 1.4)
    .to('[data-hero-line]', { y: 0, opacity: 1, duration: 1, stagger: 0.08 }, 1.5)
    .to(lede.lines, { yPercent: 0, duration: 1.2, stagger: 0.08 }, 1.5)
    .to(acts, { y: 0, opacity: 1, duration: 1, stagger: 0.08 }, 1.7)
    .to(foot, { opacity: 1, duration: 1 }, 1.6)
    .to(feet, { y: 0, opacity: 1, duration: 0.9, stagger: 0.07 }, 1.8);
  return tl;
}

/* Scroll: the panels slide off and the camera pushes in across the wall,
   then the stage settles to ink for the next section. Scrubbed. */
function heroScroll() {
  const hero = $('[data-hero]');
  if (!hero || reduceMotion) return;
  gsap
    .timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true },
    })
    .to('[data-hero-panel="top"]', { yPercent: -100, duration: 0.55, ease: 'power2.in' }, 0)
    .to('[data-hero-panel="bottom"]', { yPercent: 100, duration: 0.55, ease: 'power2.in' }, 0)
    .fromTo('[data-hero-turn]', { scale: 1.04, xPercent: 0, yPercent: 0 }, { scale: 1.32, xPercent: -7, yPercent: -4, duration: 1 }, 0)
    .to('[data-hero-lockup]', { y: () => -innerHeight * 0.05, scale: 0.92, duration: 0.7 }, 0)
    .to('[data-hero-lockup]', { opacity: 0, duration: 0.2 }, 0.62)
    .to('[data-hero-flame]', { opacity: 0, duration: 0.3 }, 0.5)
    .to('[data-hero-fade-out]', { opacity: 0.65, duration: 0.3 }, 0.7);
}

/* ------------------------------------------------------------------
   Services, after the practices cube on ario.law: a big centred title
   shrinks into place while two half-prisms slide in from either side and
   lock together, then turn through every face in one slow, continuous
   sine-eased rotation (left rolls up from below, right down from above).
   Sticky stage, scrubbed; transforms and opacity only.
------------------------------------------------------------------- */
function services() {
  const section = $('[data-svc]');
  if (!section || reduceMotion) return;
  section.classList.add('is-3d');

  const track = $('[data-svc-track]', section);
  const stage = $('[data-svc-stage]', section);
  const title = $('[data-svc-title]', section);
  const halves = $$('[data-half]', section);
  const turnL = gsap.quickSetter($('[data-prism="l"]', section), 'rotationX', 'deg');
  const turnR = gsap.quickSetter($('[data-prism="r"]', section), 'rotationX', 'deg');
  const shades = $$('[data-face]', section).map((f) => [+f.dataset.face, $('.svc-shade', f)]);
  const steps = $$('[data-step]', section);
  const n = steps.length;

  const split = SplitText.create(title, { type: 'chars', mask: 'chars' });
  gsap.from(split.chars, {
    yPercent: 110,
    duration: 1.2,
    ease: 'expo.out',
    stagger: 0.045,
    scrollTrigger: { trigger: track, start: 'top 75%', once: true },
  });

  // One angle drives both prisms (mirrored) and darkens faces as they turn away
  const cube = { a: 0 };
  let active = -1;
  const draw = () => {
    turnL(cube.a);
    turnR(-cube.a);
    for (const [k, el] of shades) el.style.opacity = Math.min(1, Math.abs(cube.a - 90 * k) / 90) * 0.55;
    const i = Math.max(0, Math.min(n - 1, Math.round(cube.a / 90)));
    if (i !== active) steps.forEach((s, j) => s.classList.toggle('is-active', j === (active = i)));
  };

  // Title starts big in the middle of the stage, then settles at the top
  const toCentre = () => stage.offsetHeight / 2 - (title.offsetTop + title.offsetHeight / 2);
  const big = () => Math.min(1.9, (innerWidth * 0.92) / title.offsetWidth);

  // Scale toward the seam (as ario.law does) so the halves stay flush
  gsap.set(halves[0], { scale: 0.875, transformOrigin: '100% 50%' });
  gsap.set(halves[1], { scale: 0.875, transformOrigin: '0% 50%' });
  gsap
    .timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: track, start: 'top top', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true },
    })
    .fromTo(title, { y: toCentre, scale: big }, { y: 0, scale: 1, ease: 'power2.inOut', force3D: false, duration: 0.65 }, 0)
    .fromTo(halves[0], { x: () => -innerWidth * 0.62 }, { x: 0, ease: 'power3.out', duration: 0.8 }, 0.25)
    .fromTo(halves[1], { x: () => innerWidth * 0.62 }, { x: 0, ease: 'power3.out', duration: 0.8 }, 0.25)
    .fromTo(cube, { a: -40 }, { a: 0, ease: 'power3.out', duration: 0.8, onUpdate: draw }, 0.25)
    .fromTo('[data-svc-steps]', { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.75)
    .fromTo(cube, { a: 0 }, { a: 90 * n, ease: 'sine.inOut', duration: n, immediateRender: false, onUpdate: draw }, 1.15)
    .to({}, { duration: 0.3 });
  draw();
}

/* ------------------------------------------------------------------
   Clients: two rows of cube tiles drifting in opposite directions.
   Scrolling pushes them faster and flips their direction with yours.
   One transform per row; the ticker idles while the section is offscreen.
------------------------------------------------------------------- */
function clients() {
  const section = $('[data-cl]');
  if (!section || reduceMotion) return;
  const rows = $$('[data-cl-row]', section).map((el, i) => ({
    el,
    x: 0,
    span: 0,
    dir: i % 2 ? 1 : -1,
    set: gsap.quickSetter(el, 'x', 'px'),
  }));
  const measure = () => rows.forEach((r) => (r.span = r.el.scrollWidth / 2));
  measure();
  new ResizeObserver(measure).observe(rows[0].el);

  let on = false;
  let push = 0;
  let sign = 1;
  ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => (on = self.isActive),
    onUpdate: (self) => {
      const v = self.getVelocity();
      if (v) sign = Math.sign(v);
      push = Math.min(14, Math.abs(v) / 90);
    },
  });

  gsap.ticker.add((time, dt) => {
    if (!on) return;
    push *= 0.93;
    const step = (0.55 + push) * sign * dt * 0.06;
    for (const r of rows) {
      r.x = gsap.utils.wrap(-r.span, 0, r.x + r.dir * step);
      r.set(r.x);
    }
  });
}

/* ------------------------------------------------------------------
   Projects, one continuous pinned timeline. The first photo arrives as a
   small centred window with the section and, once pinned, opens to full
   bleed while easing out of its zoom. Each next project wipes up over the
   last with a counter-parallax; the outgoing photo settles back and dims.
   No side slides, no second trigger to fall out of step with.
------------------------------------------------------------------- */
function projectsSeq() {
  const section = $('[data-pj]');
  if (!section || reduceMotion) return;
  section.classList.add('is-pinned');

  const stage = $('[data-pj-stage]', section);
  const items = $$('[data-pj-item]', section);
  const bar = $('[data-pj-bar]', section);
  const n = items.length;

  // Always tween clip-paths with both ends given in full four-value form: the
  // browser reads `inset(29% 34% 29% 34%)` back as `inset(29% 34%)`, and GSAP
  // would pair the numbers up wrongly — the window then grows from a corner.
  const small = () => (innerWidth < 860 ? 'inset(32% 12% 32% 12%)' : 'inset(29% 34% 29% 34%)');
  const full = 'inset(0% 0% 0% 0%)';
  const below = 'inset(100% 0% 0% 0%)';

  items.forEach((item, i) => {
    gsap.set(item, { zIndex: i + 1 });
    gsap.set($('[data-pj-frame]', item), { clipPath: i === 0 ? small : below });
    gsap.set($('[data-pj-img]', item), i === 0 ? { scale: 1.3 } : { scale: 1.15, yPercent: 14 });
    gsap.set($('[data-pj-info]', item), { autoAlpha: 0 });
    if (i > 0) gsap.set($('[data-pj-tag]', item), { autoAlpha: 0 });
  });

  const tl = gsap.timeline({
    defaults: { ease: 'power3.inOut' },
    scrollTrigger: {
      trigger: stage,
      start: 'top top',
      end: () => `+=${n * 140}%`,
      pin: true,
      scrub: 0.8,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        gsap.set(bar, { scaleX: self.progress });
      },
    },
  });

  const STEP = 2.6;
  items.forEach((item, i) => {
    const frame = $('[data-pj-frame]', item);
    const img = $('[data-pj-img]', item);
    const info = $('[data-pj-info]', item);
    const name = $('[data-pj-name]', item);
    const fades = $$('[data-pj-fade], .pj-sector', item);
    const at = i * STEP;

    if (i === 0) {
      tl.fromTo(frame, { clipPath: small }, { clipPath: full, duration: 1.4, ease: 'power2.inOut', immediateRender: false }, at)
        .to(img, { scale: 1, duration: 1.4, ease: 'power2.inOut' }, at)
        .to($('[data-pj-tag]', item), { autoAlpha: 0, duration: 0.3, ease: 'none' }, at);
    } else {
      const prev = items[i - 1];
      tl.to($('[data-pj-info]', prev), { autoAlpha: 0, y: -24, duration: 0.4, ease: 'power2.in' }, at - 0.2)
        .to($('[data-pj-img]', prev), { scale: 1.06, opacity: 0.45, duration: 1.3, ease: 'power2.inOut' }, at)
        .fromTo(frame, { clipPath: below }, { clipPath: full, duration: 1.3, immediateRender: false }, at)
        .to(img, { scale: 1, yPercent: 0, duration: 1.3 }, at);
    }

    const shown = at + (i === 0 ? 1.15 : 1.0);
    tl.set(info, { autoAlpha: 1, y: 0 }, shown)
      .from(name, { yPercent: 60, opacity: 0, duration: 0.7, ease: 'power3.out' }, shown)
      .from(fades, { y: 24, opacity: 0, duration: 0.7, stagger: 0.06, ease: 'power3.out' }, shown + 0.1);
  });
  tl.to({}, { duration: 0.5 });
}

/* ------------------------------------------------------------------
   Generic heading + copy reveals
------------------------------------------------------------------- */
function reveals() {
  $$('[data-reveal-heading]').forEach((el) => revealHeading(el));
  $$('[data-reveal-up]').forEach((el) => revealUp(el, el));
}

/* ------------------------------------------------------------------
   Everything below the first screen: pins, splits and measurements.
   With the loader up, this runs while it holds near 100%, one section per
   idle slot, so it never shares a frame with the globe. Otherwise at once.
------------------------------------------------------------------- */
const sections = [heroScroll, services, clients, projectsSeq, reveals];

function setupSections() {
  return new Promise((done) => {
    const idle = window.requestIdleCallback ?? ((cb) => setTimeout(cb, 16));
    const next = () => {
      const fn = sections.shift();
      if (!fn) {
        ScrollTrigger.refresh();
        return done();
      }
      fn();
      idle(next, { timeout: 120 });
    };
    next();
  });
}

if (!intro()) sections.splice(0).forEach((fn) => fn());
